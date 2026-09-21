# THIẾT KẾ CƠ SỞ DỮ LIỆU GÓI NPP — BẢN CHỐT KỸ THUẬT (TECHNICAL CLOSURE)
**Mã tài liệu**: `NPP_DATABASE_DESIGN_FINAL.md`  
**Giai đoạn**: PHASE 2.2 — TECHNICAL CLOSURE  
**Trạng thái**: READ-ONLY DESIGN ONLY (KHÔNG SỬA CODE / KHÔNG CHẠY PRISMA MIGRATE / KHÔNG SỬA DB / KHÔNG RESTART PM2 / KHÔNG DEPLOY)  
**Căn cứ**: `CTV_SYSTEM_BASELINE.md`, `NPP_BUSINESS_RULE_RECONCILIATION.md`, `NPP_DATABASE_DESIGN_HARDENED.md` và 4 yêu cầu Technical Closure từ Boss Review.

---

## 1. SQLITE CONCURRENCY — CƠ CHẾ KHÓA & AN TOÀN ĐỒNG THỜI CHUẨN XÁC

### A. Atomic Settlement Guard (Chuyển Trạng Thái Nguyên Tử)
Để đảm bảo **chỉ đúng 1 request** được quyền xử lý kích hoạt đơn, hệ thống sử dụng câu lệnh Atomic Compare-And-Set (CAS) ở tầng SQL:
```sql
UPDATE NppPurchase 
SET settlementStatus = 'PROCESSING' 
WHERE id = ? 
  AND settlementStatus = 'PENDING' 
  AND status = 'COMPLETED' 
  AND isPaidInFull = 1;
```
- Cơ chế hoạt động:
  - Nếu `changes === 1`: Request hiện tại giành được quyền xử lý độc quyền (Lock thành công).
  - Nếu `changes === 0`: Đơn hàng hoặc chưa đủ điều kiện (`status !== 'COMPLETED'` hoặc `isPaidInFull !== true`), hoặc đã bị một request khác xử lý trước (`settlementStatus` đã là `PROCESSING` hoặc `SETTLED`). Request này lập tức kết thúc an toàn mà không thực hiện bất kỳ thay đổi nào.

### B. Transaction Boundary (Ranh Giới Transaction Toàn Diện)
Toàn bộ các bước sau đây **bắt buộc nằm trọn vẹn trong DUY NHẤT 1 Transaction**:
```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                      TRANSACTION BOUNDARY (Prisma $transaction)                   │
├───────────────────────────────────────────────────────────────────────────────────┤
│ 1. Atomic Settlement Guard (UPDATE NppPurchase SET settlementStatus='PROCESSING') │
│ 2. Đọc trạng thái mới nhất của Buyer User (SELECT FROM User WHERE id = ?)        │
│ 3. Kiểm tra BID: Nếu buyer.businessId == null -> Cấp BID từ BusinessIdSequence   │
│ 4. Tăng nguyên tử BusinessIdSequence (UPDATE BusinessIdSequence SET nextVal = +1) │
│ 5. Cập nhật User (isNpp=true, nppActivatedAt, businessId, rank, rankStatus)       │
│ 6. Đóng Rank cũ trong RankHistory (UPDATE RankHistory SET effectiveTo = now())    │
│ 7. Ghi nhận Rank mới vào RankHistory (INSERT INTO RankHistory)                    │
│ 8. Tạo NppCommission cho F1 (10% trên actualPaidAmount)                           │
│ 9. Tạo NppCommission cho F2 (5% trên actualPaidAmount - nếu F1 có parentId)       │
│ 10. Chốt Settlement NppPurchase (settlementStatus = 'SETTLED', activatedAt = now)│
└───────────────────────────────────────────────────────────────────────────────────┘
```
Nếu bất kỳ bước nào trong chuỗi trên bị lỗi, toàn bộ transaction sẽ rollback 100%, trạng thái đơn hàng quay về nguyên trạng.

### C. Cơ Chế Khóa Của SQLite (`BEGIN IMMEDIATE`)
- **Nguyên lý hoạt động chính xác**:
  - SQLite có 5 mức khóa: `UNLOCKED`, `SHARED`, `RESERVED`, `PENDING`, `EXCLUSIVE`.
  - Transaction thông thường (`BEGIN DEFERRED`) chỉ lấy khóa `SHARED` khi đọc và chỉ cố gắng nâng cấp lên `RESERVED` khi bắt đầu ghi. Nếu 2 transaction cùng đọc rồi cùng ghi, cả hai sẽ rơi vào deadlock và nhận lỗi `SQLITE_BUSY`.
  - `BEGIN IMMEDIATE`: SQLite **lập tức giành lấy khóa `RESERVED`** ngay khi mở transaction.
    - Các tiến trình khác **vẫn được phép đọc** (`SHARED`), đảm bảo hệ thống không bị nghẽn truy vấn.
    - Nhưng **không một tiến trình nào khác được phép bắt đầu ghi hoặc mở transaction `BEGIN IMMEDIATE` khác** (tiến trình thứ hai sẽ phải xếp hàng chờ `busy_timeout` hoặc nhận thông báo bận).
    - Khi transaction thực hiện lệnh ghi, khóa tự động nâng lên `EXCLUSIVE` tại thời điểm `COMMIT`.
  - Do đó, `BEGIN IMMEDIATE` đảm bảo **mọi giao dịch ghi vào SQLite được tuần tự hóa tuyệt đối (Globally Serialized Writes)**, loại bỏ hoàn toàn hiện tượng ghi đè hay xung đột dữ liệu giữa các luồng.

### D. Phân Tích Kịch Bản Đồng Thời 1: Request A + Request B Kích Hoạt Cùng 1 `NppPurchase`
- Request A và B đến cùng microsecond:
  - Do SQLite tuần tự hóa ghi, một request (VD: Request A) sẽ thực thi `UPDATE NppPurchase SET settlementStatus = 'PROCESSING'` trước ➔ `changes = 1` ➔ A tiếp tục chạy toàn bộ transaction.
  - Request B chạy sau: `settlementStatus` của đơn lúc này đã là `'PROCESSING'` (hoặc `'SETTLED'`) ➔ `changes = 0` ➔ Request B dừng lại ngay lập tức.
- **Kết quả nghiệm thu**:
  - Đúng 1 lần activation.
  - Đúng 1 lần cấp BID (nếu chưa có).
  - Đúng 1 bản ghi `RankHistory` active.
  - Đúng 1 bản ghi hoa hồng F1 (10%) và 1 F2 (5%).
  - Đơn chốt `SETTLED`. Không duplicate, không mất BID.

### E. Phân Tích Kịch Bản Đồng Thời 2: Kích Hoạt 2 Đơn Gói Khác Nhau (`Purchase A` và `Purchase B`) Cho Cùng 1 Buyer (User U)
- Trường hợp User U chưa có BID và mua 2 gói khác nhau, cả 2 đơn cùng được duyệt thanh toán và kích hoạt cùng lúc:
  - Transaction 1 (Xử lý Purchase A):
    - Đọc User U ➔ `businessId == null`.
    - Tăng `BusinessIdSequence` (VD: từ 10000 lên 10001) ➔ Cấp `WK-10001` cho User U.
    - Cập nhật User U: `businessId = 'WK-10001'`, `rank = PackageA.assignedRank`.
    - Tạo `RankHistory` A (`effectiveTo = null`).
    - Hoàn tất Purchase A ➔ Commit.
  - Transaction 2 (Xử lý Purchase B):
    - Chạy sau Transaction 1 do SQLite tuần tự hóa ghi.
    - Đọc User U từ DB ➔ Nhìn thấy **User U ĐÃ CÓ `businessId = 'WK-10001'`**.
    - **TUYỆT ĐỐI KHÔNG CẤP BID MỚI**. Giữ nguyên `WK-10001`.
    - Đóng `RankHistory` A của Transaction 1 (`UPDATE RankHistory SET effectiveTo = now() WHERE userId = ? AND effectiveTo IS NULL`).
    - Tạo `RankHistory` B mới (`effectiveFrom = now()`, `effectiveTo = null`, `rank = PackageB.assignedRank`).
    - Cập nhật User U theo Package B.
    - Hoàn tất Purchase B ➔ Commit.
- **Kết quả nghiệm thu**:
  - Duy nhất 1 BID suốt đời (`WK-10001`).
  - Tại mọi thời điểm chỉ có DUY NHẤT 1 bản ghi `RankHistory` active (`effectiveTo = null`).
  - Mỗi đơn gói chỉ settlement đúng 1 lần và sinh commission riêng biệt cho F1/F2 của đơn đó.
  - Cấp bậc cuối cùng của User U phản ánh chuẩn xác gói hoàn tất sau cùng theo trật tự thời gian.

---

## 2. INTEGRATION VỚI `COMMISSIONPERIOD` & `COMMISSIONPROCESSING`

### A. Câu Hỏi Cốt Lõi: `NppCommission` Có Tạo `CommissionProcessing` Không?
**TRẢ LỜI CHÍNH XÁC: KHÔNG.**

### B. Chứng Minh Kỹ Thuật: Tại Sao Không Cần Và Không Được Tạo `CommissionProcessing` Cho Gói NPP?
1. **Ràng Buộc Schema Cứng**:
   - Model `CommissionProcessing` trong `schema.prisma` hiện tại được định nghĩa:
     `orderId String @unique` kèm quan hệ `@relation(fields: [orderId], references: [id])` trỏ thẳng vào bảng `Order` của sản phẩm bán lẻ.
   - `NppPurchase` là một thực thể độc lập, không phải là `Order`.
   - Nếu ép `NppCommission` tạo `CommissionProcessing`, hệ thống bắt buộc phải tạo ra một `Order` bán lẻ ảo ➔ Vi phạm nghiêm trọng nguyên tắc bảo toàn hệ sinh thái và gây rủi ro hồi quy (regression).
2. **`NppPurchase` Đã Có Cơ Chế Idempotency Độc Lập**:
   - `NppPurchase` sở hữu sẵn các trường quản lý trạng thái settlement: `settlementStatus` (`PENDING` ➔ `PROCESSING` ➔ `SETTLED`), `activatedAt`, `allocatedBusinessId`.
   - Bảng `NppCommission` sở hữu ràng buộc Database duy nhất `@@unique([purchaseId, level])`.
   - Vì vậy, việc tạo thêm bản ghi `CommissionProcessing` là hoàn toàn thừa thãi về mặt chống trùng lặp.

### C. Chứng Minh Không Tạo Parallel Payout Architecture — Hội Tụ Về `CommissionPeriod`
Dù không dùng bảng trung gian `CommissionProcessing`, `NppCommission` **VẪN TÍCH HỢP HOÀN TOÀN** vào chu trình đối soát và chi trả hiện hữu thông qua `CommissionPeriod`:

```
                             [ CHU KỲ HOA HỒNG (CommissionPeriod) ]
                                          ▲                  ▲
                                          │                  │
                ┌─────────────────────────┘                  └─────────────────────────┐
                │                                                                      │
     [ BÁN LẺ CTV (Retail) ]                                                [ GÓI NPP (Partner Package) ]
                │                                                                      │
         Bảng: Order                                                            Bảng: NppPurchase
                │ (settlement)                                                         │ (activation)
                ▼                                                                      ▼
         Bảng: Commission                                                       Bảng: NppCommission
         - periodId: CommissionPeriod.id                                        - periodId: CommissionPeriod.id
         - status: PENDING_CLEARING                                             - status: PENDING_CLEARING
         - type: SELF, DIRECT, D1, D2                                           - level: 1 (F1 10%), 2 (F2 5%)
                │                                                                      │
                └──────────────────────────────┬───────────────────────────────────────┘
                                               │
                                 [ KHI ADMIN CHỐT KỲ HOA HỒNG ]
                               POST /api/admin/commission-periods/:id/close
                                               │
                                               ▼
                             ┌───────────────────────────────────┐
                             │ 1. Cập nhật CommissionPeriod:     │
                             │    status = 'CLOSED'              │
                             │ 2. Chuyển trạng thái hoa hồng:   │
                             │    - Commission -> AVAILABLE      │
                             │    - NppCommission -> AVAILABLE   │
                             │    - Ghi nhận availableAt = now() │
                             │ 3. Snapshot PeriodCloseAudit:     │
                             │    Tổng hợp tiền & điểm toàn kỳ   │
                             └───────────────────────────────────┘
                                               │
                                               ▼
                                      [ ĐỐI SOÁT & CHI TRẢ ]
                                         status = 'PAID'
                                       Ghi nhận paidAt = now()
```

- **periodId lấy ở đâu?**: Khi kích hoạt gói NPP, hệ thống truy vấn kỳ đang mở: `CommissionPeriod.findFirst({ where: { status: 'OPEN' } })` và gán `periodId` này cho các bản ghi `NppCommission`.
- **Chốt kỳ (Period Close)**: Khi kỳ chuyển sang `CLOSED`, toàn bộ hoa hồng bán lẻ (`Commission`) và hoa hồng gói (`NppCommission`) đều đồng loạt chuyển trạng thái sang `AVAILABLE`.
- **Tính Bất Biến (Historical Immutability)**: Tỷ lệ F1 10%, F2 5%, `commissionBase`, `earnedMoney`, `earnedPoints` đã được tính toán và snapshot cứng vào `NppCommission` ngay lúc kích hoạt. Khi chốt kỳ hay chi trả, hệ thống không bao giờ tính toán lại.

---

## 3. CHỐT CHÍNH THỨC KIỂU DỮ LIỆU TIỀN TỆ & ĐIỂM CP (MONEY / CP TYPE CLOSURE)

### A. Quyết Định Kiểu Dữ Liệu Dứt Khoát Cho Từng Trường

| Model | Tên Trường (Field) | Kiểu Prisma | Kiểu SQLite | Kiểu PostgreSQL (Tương lai) | Giải Thích Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **NppPackage** | `grossPrice` | **`BigInt`** | `INTEGER` (64-bit) | `BIGINT` | Giá niêm yết gói (VNĐ, Số nguyên). |
| **NppPackage** | `defaultDiscount` | **`Int`** | `INTEGER` | `INTEGER` | Tỷ lệ chiết khấu mặc định theo **Basis Points** (VD: `2500` = 25.00%). |
| **NppPurchase** | `grossPrice` | **`BigInt`** | `INTEGER` (64-bit) | `BIGINT` | Giá niêm yết lúc mua (VNĐ). |
| **NppPurchase** | `discountRateBps` | **`Int`** | `INTEGER` | `INTEGER` | Chiết khấu thực tế theo Basis Points (VD: `2500` = 25.00%). |
| **NppPurchase** | `discountAmount` | **`BigInt`** | `INTEGER` (64-bit) | `BIGINT` | Tiền giảm giá: `grossPrice * discountRateBps / 10000` (VNĐ). |
| **NppPurchase** | `netPayableAmount` | **`BigInt`** | `INTEGER` (64-bit) | `BIGINT` | Số tiền phải thu: `grossPrice - discountAmount` (VNĐ). |
| **NppPurchase** | `depositAmount` | **`BigInt`** | `INTEGER` (64-bit) | `BIGINT` | Tiền cọc ban đầu (VNĐ). |
| **NppPurchase** | `paidAmount` | **`BigInt`** | `INTEGER` (64-bit) | `BIGINT` | Tổng tiền lũy kế đã thanh toán thực tế (VNĐ). |
| **NppPurchase** | `remainingAmount` | **`BigInt`** | `INTEGER` (64-bit) | `BIGINT` | Tiền còn nợ: `netPayableAmount - paidAmount` (VNĐ). |
| **NppPurchase** | `actualPaidAmount` | **`BigInt`** | `INTEGER` (64-bit) | `BIGINT` | **Tiền thực thu tại kích hoạt** = `netPayableAmount` (**Commission Base**). |
| **NppCommission** | `commissionBase` | **`BigInt`** | `INTEGER` (64-bit) | `BIGINT` | Bằng `actualPaidAmount` của đơn gói (VNĐ). |
| **NppCommission** | `rateBps` | **`Int`** | `INTEGER` | `INTEGER` | Tỷ lệ hoa hồng: `1000` (F1 = 10%) hoặc `500` (F2 = 5%). |
| **NppCommission** | `earnedMoney` | **`BigInt`** | `INTEGER` (64-bit) | `BIGINT` | Tiền hoa hồng thực tế: `commissionBase * rateBps / 10000` (VNĐ). |
| **NppCommission** | `earnedPoints` | **`Int`** | `INTEGER` | `INTEGER` | **Điểm CP: `earnedMoney / 1000` (Số nguyên)**. |

### B. Thuật Toán Tính Toán Số Nguyên 100% (Zero Floating-Point)
- Quy chuẩn: `1 CP = 1.000 VNĐ`.
- Mọi phép nhân chia đều thực hiện qua toán tử `BigInt` của JavaScript/Node.js:
  ```javascript
  // Ví dụ thực tế:
  // Gói niêm yết: 300.000.000 VNĐ, Chiết khấu: 25% (2500 bps)
  const grossPrice = 300000000n;
  const discountRateBps = 2500n;
  const discountAmount = (grossPrice * discountRateBps) / 10000n; // = 75.000.000n VNĐ
  const netPayableAmount = grossPrice - discountAmount;           // = 225.000.000n VNĐ

  // Tại thời điểm kích hoạt:
  const commissionBase = netPayableAmount; // = 225.000.000n VNĐ

  // F1 (10% = 1000 bps):
  const f1RateBps = 1000n;
  const f1EarnedMoney = (commissionBase * f1RateBps) / 10000n;   // = 22.500.000n VNĐ
  const f1EarnedPoints = Number(f1EarnedMoney / 1000n);          // = 22.500 (Int)

  // F2 (5% = 500 bps):
  const f2RateBps = 500n;
  const f2EarnedMoney = (commissionBase * f2RateBps) / 10000n;   // = 11.250.000n VNĐ
  const f2EarnedPoints = Number(f2EarnedMoney / 1000n);          // = 11.250 (Int)
  ```
- **Kết luận**: Không sử dụng `Float`. 100% số nguyên, sai số dấu phẩy động = 0.

### C. Serialization Của `BigInt` Cho REST API / JSON
Vì `JSON.stringify` trong Node.js không hỗ trợ `BigInt`, hệ thống áp dụng giải pháp chuẩn:
```javascript
// Bổ sung helper serialize trước khi res.json() hoặc cấu hình prototype:
BigInt.prototype.toJSON = function() { return Number(this); };
```
*Lưu ý an toàn*: Giá trị tối đa của gói NPP là vài tỷ đồng, nhỏ hơn rất nhiều so với `Number.MAX_SAFE_INTEGER` (9.007.199.254.740.991 ~ 9 triệu tỷ VNĐ), do đó việc convert sang `Number` khi trả về UI hoàn toàn không bị mất độ chính xác.

---

## 4. QUY CHẾ THANH TOÁN & SỔ THEO DÕI THANH TOÁN (PAYMENT SEMANTICS)

### A. Nguồn Dữ Liệu & Công Thức Xác Lập
- `grossPrice`: Snapshot từ `NppPackage.grossPrice` lúc tạo đơn.
- `discountAmount`: Số tiền giảm trừ theo chính sách hoặc thoả thuận.
- `netPayableAmount = grossPrice - discountAmount`: **Tổng số tiền bắt buộc phải thu đủ**.
- `paidAmount`: Tổng số tiền lũy kế thực tế khách hàng đã thanh toán.
- `remainingAmount = netPayableAmount - paidAmount`: Số tiền còn nợ.
- `isPaidInFull = (paidAmount >= netPayableAmount) && accountingConfirmed`: Chỉ Kế toán/Admin mới có quyền xác nhận cờ này sau khi đối soát sao kê ngân hàng.
- `actualPaidAmount` tại thời điểm kích hoạt = `netPayableAmount`. **Đây là căn cứ tính hoa hồng duy nhất**.
- **Tuyệt đối không tính hoa hồng trên tiền cọc (`depositAmount`)**.

### B. Thiết Kế Sổ Nhật Ký Thanh Toán `NppPayment` (Design Only — Audit Trail)
Để phục vụ theo dõi chi tiết nhiều đợt thanh toán (Đặt cọc ➔ Đợt 2 ➔ Thanh toán đủ), đề xuất entity nhật ký thanh toán:
```prisma
model NppPayment {
  id              String      @id @default(cuid())
  purchaseId      String      // FK sang NppPurchase.id
  amount          BigInt      // Số tiền thanh toán của đợt này (VNĐ)
  paymentMethod   String      // BANK_TRANSFER, CASH, VNPAY...
  referenceCode   String?     // Mã giao dịch ngân hàng / Ủy nhiệm chi
  note            String?     // Ghi chú (VD: "Thanh toán đợt 1 cọc 30%")
  confirmedBy     String      // userId của Kế toán/Admin xác nhận
  paidAt          DateTime    @default(now())
  createdAt       DateTime    @default(now())

  purchase        NppPurchase @relation(fields: [purchaseId], references: [id], onDelete: Cascade)

  @@index([purchaseId])
}
```
- Khi phát sinh một giao dịch thanh toán mới qua API `POST /api/admin/npp-purchases/:id/payments`:
  1. Insert bản ghi vào `NppPayment`.
  2. Cập nhật `paidAmount = sum(payments.amount)` trên `NppPurchase`.
  3. Cập nhật `remainingAmount = netPayableAmount - paidAmount`.
  4. Nếu `paidAmount >= netPayableAmount`: Cho phép Kế toán bấm nút "Xác Nhận Đã Thu Đủ 100%" ➔ `isPaidInFull = true`.

---

## 5. MÔ HÌNH PRISMA MODEL CUỐI CÙNG (FINAL PRISMA SCHEMA DEFINITION)

```prisma
// ============================================================================
// 1. MỞ RỘNG MODEL USER
// ============================================================================
// isNpp               Boolean         @default(false)
// nppActivatedAt      DateTime?
// nppPurchases        NppPurchase[]   @relation("UserNppPurchases")
// nppCommissions      NppCommission[] @relation("UserNppCommissions")

// ============================================================================
// 2. MỞ RỘNG MODEL RANKHISTORY
// ============================================================================
// nppPurchaseId       String?
// effectiveFrom       DateTime        @default(now())
// effectiveTo         DateTime?
// nppPurchase         NppPurchase?    @relation("PurchaseRankHistory", fields: [nppPurchaseId], references: [id])
// @@index([userId, effectiveFrom])

// ============================================================================
// 3. MỞ RỘNG MODEL COMMISSIONPERIOD
// ============================================================================
// nppCommissions      NppCommission[] @relation("PeriodNppCommissions")

// ============================================================================
// 4. MODEL ĐỊNH NGHĨA GÓI NPP
// ============================================================================
model NppPackage {
  id              String           @id @default(cuid())
  code            String           @unique // e.g. "NPP-GOLD-01"
  name            String           // e.g. "Gói Phân Phối Vàng 10 Máy"
  description     String?
  grossPrice      BigInt           // Giá niêm yết VNĐ (Số nguyên)
  defaultDiscount Int              @default(0) // Basis points (e.g. 2500 = 25.00%)
  assignedRank    String           @default("AMBASSADOR") // AMBASSADOR | MANAGER | DIRECTOR
  isActive        Boolean          @default(true)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  items           NppPackageItem[]
  purchases       NppPurchase[]
}

// ============================================================================
// 5. MODEL LINH KIỆN / THIẾT BỊ CỦA GÓI NPP
// ============================================================================
model NppPackageItem {
  id          String     @id @default(cuid())
  packageId   String
  productId   String
  quantity    Int        @default(1)
  note        String?

  package     NppPackage @relation(fields: [packageId], references: [id], onDelete: Cascade)
  product     Product    @relation(fields: [productId], references: [id])

  @@unique([packageId, productId])
  @@index([packageId])
  @@index([productId])
}

// ============================================================================
// 6. MODEL GIAO DỊCH MUA GÓI NPP
// ============================================================================
model NppPurchase {
  id                    String          @id @default(cuid())
  code                  String          @unique // e.g. "NPP-202609-001"
  userId                String          // FK trực tiếp sang User.id (KHÔNG QUA CUSTOMER)
  userCode              String          // Snapshot User.userId (e.g. "U958")
  packageId             String          // FK sang NppPackage.id

  // Financial fields (100% Số nguyên BigInt)
  grossPrice            BigInt          // Giá niêm yết
  discountRateBps       Int             @default(0) // Chiết khấu (Basis points)
  discountAmount        BigInt          @default(0) // Tiền giảm trừ
  netPayableAmount      BigInt          // TIỀN PHẢI THU = grossPrice - discountAmount
  depositAmount         BigInt          @default(0) // Tiền cọc
  paidAmount            BigInt          @default(0) // Lũy kế đã thanh toán
  remainingAmount       BigInt          @default(0) // Tiền còn nợ = netPayableAmount - paidAmount
  actualPaidAmount      BigInt          // TIỀN THỰC THU TẠI KÍCH HOẠT = netPayableAmount (COMMISSION BASE)

  // Payment confirmation
  depositAt             DateTime?
  depositNote           String?
  isPaidInFull          Boolean         @default(false)
  paidInFullAt          DateTime?
  paidInFullConfirmedBy String?         // userId Admin/Accountant

  // Lifecycle status
  status                String          @default("NEW") // NEW | DEPOSIT | CONFIRMED | SHIPPING | COMPLETED | CANCELLED
  settlementStatus      String          @default("PENDING") // PENDING | PROCESSING | SETTLED

  // Activation & Rank
  activatedAt           DateTime?
  assignedRank          String          // AMBASSADOR | MANAGER | DIRECTOR
  allocatedBusinessId   String?         // BID được cấp (nếu trước đó chưa có)

  // Snapshot JSON bất biến
  packageSnapshot       String          // JSON: { packageCode, name, items: [{ productId, code, name, qty, price }] }

  // Thông tin giao nhận
  shippingAddress       String?
  recipientPhone        String?
  recipientName         String?

  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  user                  User            @relation("UserNppPurchases", fields: [userId], references: [id])
  package               NppPackage      @relation(fields: [packageId], references: [id])
  commissions           NppCommission[]
  rankHistories         RankHistory[]   @relation("PurchaseRankHistory")
  payments              NppPayment[]

  @@index([userId])
  @@index([packageId])
  @@index([status])
  @@index([isPaidInFull])
  @@index([settlementStatus])
}

// ============================================================================
// 7. MODEL SỔ NHẬT KÝ THANH TOÁN GÓI NPP (AUDIT TRAIL)
// ============================================================================
model NppPayment {
  id              String      @id @default(cuid())
  purchaseId      String
  amount          BigInt
  paymentMethod   String      @default("BANK_TRANSFER")
  referenceCode   String?
  note            String?
  confirmedBy     String
  paidAt          DateTime    @default(now())
  createdAt       DateTime    @default(now())

  purchase        NppPurchase @relation(fields: [purchaseId], references: [id], onDelete: Cascade)

  @@index([purchaseId])
}

// ============================================================================
// 8. MODEL HOA HỒNG GÓI NPP
// ============================================================================
model NppCommission {
  id                String            @id @default(cuid())
  purchaseId        String            // FK sang NppPurchase.id
  beneficiaryId     String            // FK sang User.id
  beneficiaryUserId String            // Snapshot User.userId (e.g. "U958")
  level             Int               // 1 = F1 (10%), 2 = F2 (5%)
  rateBps           Int               // 1000 = 10%, 500 = 5%

  // Financial fields (Số nguyên)
  commissionBase    BigInt            // Bằng actualPaidAmount (VNĐ)
  earnedMoney       BigInt            // Tiền hoa hồng (VNĐ)
  earnedPoints      Int               // Điểm CP = earnedMoney / 1000 (SỐ NGUYÊN)

  // Audit
  rankAtCommission  String
  policyVersion     String            @default("NPP-v1.0")
  status            String            @default("PENDING_CLEARING") // PENDING_CLEARING | AVAILABLE | PAID | CANCELLED

  // Timestamps chuẩn
  createdAt         DateTime          @default(now())
  settledAt         DateTime?         // Thời điểm kích hoạt chốt hoa hồng
  availableAt       DateTime?         // Thời điểm chốt kỳ, khả dụng rút
  paidAt            DateTime?         // Thời điểm chuyển khoản ngân hàng

  // Period link
  periodId          String?           // FK sang CommissionPeriod.id

  purchase          NppPurchase       @relation(fields: [purchaseId], references: [id], onDelete: Cascade)
  beneficiary       User              @relation("UserNppCommissions", fields: [beneficiaryId], references: [id])
  period            CommissionPeriod? @relation("PeriodNppCommissions", fields: [periodId], references: [id])

  // Ràng buộc duy nhất tuyệt đối: Chống double commission
  @@unique([purchaseId, level])
  @@index([beneficiaryId])
  @@index([status])
  @@index([periodId])
}
```

---

## 6. FINAL ACCEPTANCE CHECKLIST (18 TIÊU CHÍ KIỂM ĐỊNH TOÀN DIỆN)

- [x] **1. Money không dùng Float**: 100% các trường tiền tệ là `BigInt` (Số nguyên VNĐ).
- [x] **2. CP không dùng Float**: Trường `earnedPoints` là kiểu `Int` (Số nguyên CP).
- [x] **3. BID allocation concurrency-safe**: Atomic sequence increment + Unique database constraint + đọc lại User trước khi cấp.
- [x] **4. Activation idempotent**: Atomic CAS `UPDATE NppPurchase SET settlementStatus = 'PROCESSING' WHERE settlementStatus = 'PENDING'` đảm bảo chỉ 1 request thắng.
- [x] **5. RankHistory không duplicate active record**: Lệnh `UPDATE RankHistory SET effectiveTo = now() WHERE effectiveTo IS NULL` đóng toàn bộ record cũ trước khi tạo record mới.
- [x] **6. F1/F2 không duplicate**: Ràng buộc duy nhất `@@unique([purchaseId, level])` trên bảng `NppCommission`.
- [x] **7. CommissionProcessing integration rõ ràng**: Đã chứng minh không dùng `CommissionProcessing` (tránh liên kết giả với `Order`), dùng cơ chế idempotency độc lập của `NppPurchase`.
- [x] **8. CommissionPeriod integration rõ ràng**: `NppCommission.periodId` liên kết với `CommissionPeriod`, đồng bộ chuyển trạng thái `AVAILABLE` khi chốt kỳ mà không bị ghi đè bởi CTV retail engine.
- [x] **9. Payment semantics rõ ràng**: Phân định rõ `grossPrice`, `discountAmount`, `netPayableAmount`, `depositAmount`, `paidAmount`, `remainingAmount`, `actualPaidAmount`.
- [x] **10. Deposit không tạo commission**: Khi ở trạng thái `DEPOSIT`, không kích hoạt NPP, không cấp BID, không tạo commission (`NppCommission` rỗng).
- [x] **11. COMPLETED + paid in full mới activate**: Ràng buộc điều kiện kép `status === 'COMPLETED' && isPaidInFull === true`.
- [x] **12. actualPaidAmount không bị hiểu nhầm là deposit**: `actualPaidAmount` tại thời điểm kích hoạt bằng đúng `netPayableAmount` (tổng tiền thực thu của gói).
- [x] **13. Historical commission immutable**: Chụp snapshot `rankAtCommission`, `rateBps`, `commissionBase`, `earnedMoney`, `earnedPoints` cố định vĩnh viễn.
- [x] **14. Package snapshot immutable**: JSON `packageSnapshot` chụp toàn bộ máy móc, linh kiện, đơn giá tại thời điểm mua.
- [x] **15. Sponsor lock preserved**: `User.parentId` cố định vĩnh viễn, mua gói không thay đổi người bảo trợ.
- [x] **16. NPP package không tạo Customer ảo**: `NppPurchase` trỏ trực tiếp tới `User.id`, hoàn toàn không liên kết với bảng `Customer`.
- [x] **17. NPP package không cộng qualifyingPoints**: Transaction kích hoạt hoàn toàn không cập nhật trường `qualifyingPoints`.
- [x] **18. NPP commission không chạy CTV retail commission engine**: Luồng tính hoa hồng gói độc lập (10% F1, 5% F2), không chạy qua `calculateAndCreateCommissions`.

---

## PHASE 2 FINAL STATUS

```
READY FOR PHASE 3: YES
```

Phase 3 được phép bắt đầu **IMPLEMENTATION** (Tạo migration schema, cập nhật model Prisma, xây dựng API backend, xử lý transaction activation và giao diện quản trị) với điều kiện bắt buộc: **Phải tuân thủ nghiêm ngặt 100% cấu trúc Schema, kiểu dữ liệu BigInt/Int và các ranh giới Transaction đã chốt trong tài liệu `NPP_DATABASE_DESIGN_FINAL.md` này**.
