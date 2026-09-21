# THIẾT KẾ CƠ SỞ DỮ LIỆU GÓI NPP — BẢN HOÀN THIỆN (HARDENED)
**Mã tài liệu**: `NPP_DATABASE_DESIGN_HARDENED.md`  
**Giai đoạn**: PHASE 2.1 — DATABASE DESIGN HARDENING  
**Trạng thái**: READ-ONLY DESIGN ONLY (KHÔNG SỬA CODE / KHÔNG CHẠY PRISMA MIGRATE / KHÔNG SỬA DB / KHÔNG RESTART PM2 / KHÔNG DEPLOY)  
**Căn cứ**: 
- `CTV_SYSTEM_BASELINE.md`
- `NPP_BUSINESS_RULE_RECONCILIATION.md`
- Yêu cầu Hardening 5 điểm kỹ thuật cốt lõi từ Boss Review

---

## A. CÁC HIỆU CHỈNH VÀ ĐỐI CHIẾU SCHEMA HIỆN HÀNH (CORRECTIONS & AUDIT)

### 1. Số lượng Model NPP Mới
Hệ sinh thái NPP bổ sung chính xác **4 MODEL MỚI ĐỘC LẬP** và **MỞ RỘNG 2 MODEL HIỆN CÓ**:
- **4 Model Mới**:
  1. `NppPackage`: Danh mục và định nghĩa gói NPP.
  2. `NppPackageItem`: Chi tiết linh kiện / máy cấu thành trong gói.
  3. `NppPurchase`: Đơn giao dịch mua gói NPP của thành viên (hoàn toàn không qua bảng `Customer`).
  4. `NppCommission`: Hoa hồng phát sinh từ giao dịch gói NPP (F1 10%, F2 5%).
- **2 Model Mở Rộng**:
  1. `User`: Thêm `isNpp`, `nppActivatedAt`.
  2. `RankHistory`: Thêm `nppPurchaseId`, `effectiveFrom`, `effectiveTo`.

### 2. Đối Chiếu Khóa Ngoại Với Schema Hiện Hành (Prisma Schema Verification)
Qua đối chiếu trực tiếp `server/prisma/schema.prisma` trên VPS:
- **`User.parentId`**: Lưu trữ `userId` của F0 (kiểu `String`, ví dụ `'U958'`), tham chiếu đến `User.userId` (`@relation("UserToUser", fields: [parentId], references: [userId])`). **KHÔNG THAM CHIẾU ĐẾN `User.id` (CUID)**.
- **`RankHistory.userId`**: Tham chiếu đến `User.userId` (`fields: [userId], references: [userId]`).
- **`Commission.receiverId`**: Tham chiếu đến `User.userId` (`fields: [receiverId], references: [userId]`).
- **`Customer.sponsorUserId` / `Customer.linkedUserId`**: Tham chiếu đến `User.id` (CUID).
- **`BusinessIdSequence`**: Bảng singleton có cấu trúc `{ id: Int @id @default(1), nextVal: Int @default(10000) }`.
- **`CommissionPeriod`**: Có sẵn trên hệ thống (`id`, `periodName`, `startAt`, `endAt`, `status: OPEN/CLOSED`).
- **`CommissionProcessing`**: Bảng xử lý đối soát hoa hồng 1:1 với `Order` hiện tại (`orderId @unique`).

---

## B. CHIẾN LƯỢC ĐỘ CHÍNH XÁC TIỀN TỆ (FINAL MONEY STRATEGY)

### 1. Nguyên Tắc Cốt Lõi: TUYỆT ĐỐI KHÔNG DÙNG `Float`
- Tiền tệ Việt Nam Đồng (VNĐ) không có đơn vị xu/hào. Mọi giao dịch, chiết khấu, thực thu, hoa hồng đều là **ĐƠN VỊ SỐ NGUYÊN**.
- Điểm hoa hồng (CP) quy đổi: `1 CP = 1.000 VNĐ`. Vì vậy điểm CP cũng bắt buộc là **SỐ NGUYÊN (INTEGER)**.
- `Float` trong SQLite và JavaScript sử dụng chuẩn IEEE 754 floating-point, chắc chắn sẽ gây ra sai số dấu phẩy động (ví dụ `225000000 * 0.1` có thể thành `22500000.000000004` hoặc `11249999.999999998`).

### 2. Giải Pháp Lưu Trữ Cho SQLite Hiện Tại & Đường Nâng Cấp PostgreSQL
- **Trên SQLite hiện tại (Production WasyPro)**:
  - Tất cả các trường tiền tệ (`grossPrice`, `discountAmount`, `netPayableAmount`, `depositAmount`, `paidAmount`, `remainingAmount`, `commissionBase`, `earnedMoney`) được định nghĩa kiểu **`BigInt`** trong Prisma Schema (hoặc `Int` nếu cam kết phạm vi đơn hàng dưới 2,1 tỷ VNĐ).
  - Để an toàn tuyệt đối cho các gói NPP doanh số lớn (vượt ngưỡng 2.147.483.647 VNĐ của 32-bit signed int), toàn bộ tiền tệ VNĐ được định nghĩa là **`BigInt`**.
  - Trường tỷ lệ chiết khấu và tỷ lệ hoa hồng: Lưu dạng số nguyên Basis Points (`Int`):
    - F1 Rate = `1000` (tương ứng 10.00%).
    - F2 Rate = `500` (tương ứng 5.00%).
    - Hoặc lưu trường `rate` dạng `Float` chỉ để biểu diễn hiển thị (`10.0`, `5.0`), nhưng khi tính toán bắt buộc dùng số nguyên:
      ```javascript
      // Thuật toán tính tiền hoàn toàn trên số nguyên:
      const earnedMoney = BigInt(Math.round(Number(commissionBase) * ratePercent / 100));
      ```
- **Đường nâng cấp lên PostgreSQL sau này**:
  - Tiền tệ VNĐ: Chuyển mượt mà sang `BIGINT` hoặc `DECIMAL(15, 0)`.
  - Tỷ lệ: `DECIMAL(5, 2)` (ví dụ `10.00`).
  - Không cần thay đổi logic ứng dụng.

---

## C. CHIẾN LƯỢC ĐIỂM CP (FINAL CP PRECISION STRATEGY)

- Trường `earnedPoints` trong `NppCommission`:
  - Kiểu dữ liệu: **`Int`** (hoặc `BigInt`).
  - **TUYỆT ĐỐI KHÔNG DÙNG FLOAT CHO `earnedPoints`**.
  - Công thức tính: `earnedPoints = Math.floor(Number(earnedMoney) / 1000)`.
  - Ví dụ:
    - Gói Thực thu: `225.000.000 VNĐ`.
    - F1 Hoa hồng: `22.500.000 VNĐ` ➔ `earnedPoints = 22.500 CP` (Số nguyên tròn trịa).
    - F2 Hoa hồng: `11.250.000 VNĐ` ➔ `earnedPoints = 11.250 CP` (Số nguyên tròn trịa).

---

## D. CHIẾN LƯỢC THANH TOÁN & NGỮ NGHĨA SỐ TIỀN (PAYMENT SEMANTICS)

### 1. Phân Định Rõ Ràng Các Khái Niệm Tài Chính
Khách hàng mua gói có thể trải qua nhiều giai đoạn thanh toán (Đặt cọc ➔ Thanh toán đợt 2 ➔ Thanh toán đủ 100%). Hệ thống định nghĩa chính xác:

| Tên Trường (Field) | Kiểu | Ý Nghĩa Nghiệp Vụ Chính Xác |
| :--- | :---: | :--- |
| `grossPrice` | `BigInt` | Giá niêm yết của toàn bộ gói NPP (chưa giảm trừ). |
| `discountRate` | `Float` | Tỷ lệ chiết khấu phần trăm (VD: `25.0` tương ứng 25%). |
| `discountAmount` | `BigInt` | Tiền chiết khấu: `grossPrice * discountRate / 100`. |
| `netPayableAmount` | `BigInt` | **Số tiền phải thu sau chiết khấu** (`grossPrice - discountAmount`). |
| `depositAmount` | `BigInt` | Tiền đặt cọc ban đầu của khách hàng. |
| `paidAmount` | `BigInt` | **Tổng số tiền lũy kế khách hàng đã thanh toán thực tế**. |
| `remainingAmount` | `BigInt` | Số tiền còn nợ (`netPayableAmount - paidAmount`). |
| `isPaidInFull` | `Boolean` | Kế toán xác nhận đã thu đủ 100% tiền (`paidAmount >= netPayableAmount`). |
| `actualPaidAmount` | `BigInt` | **Số tiền thực thu cuối cùng của gói** (Tại thời điểm kích hoạt bằng `netPayableAmount`). **ĐÂY LÀ COMMISSION BASE DUY NHẤT**. |

### 2. Quy Tắc Chống Nhầm Lẫn Cọc vs Thực Thu
- Khi mới cọc: `paidAmount = depositAmount < netPayableAmount` ➔ `isPaidInFull = false` ➔ `remainingAmount > 0`.
- Không nhầm lẫn `actualPaidAmount` với `depositAmount`.
- Hoa hồng NPP **CHỈ PHÁT SINH** khi `isPaidInFull == true` VÀ đơn hàng `status == 'COMPLETED'`.
- Commission Base được chốt bằng đúng `netPayableAmount`.

---

## E. CHIẾN LƯỢC TIMESTAMP CỦA HOA HỒNG (TIMESTAMP SEMANTICS)

**Tuyệt đối không ghi `settledAt = now()` khi bản ghi hoa hồng còn ở trạng thái `PENDING_CLEARING`**.

Các mốc thời gian phản ánh đúng sự kiện vòng đời trong `NppCommission`:
1. `createdAt`: Thời điểm bản ghi được tạo trong DB (`DateTime @default(now())`).
2. `settledAt`: `DateTime?` (Nullable). **Chỉ ghi nhận thời điểm hàm kích hoạt gói chạy thành công và tính toán chốt hoa hồng**.
3. `availableAt`: `DateTime?` (Nullable). **Chỉ ghi nhận thời điểm kỳ hoa hồng chốt (Period Close) hoặc hết thời gian giữ đối soát**, tiền chuyển sang khả dụng cho User rút/chuyển đổi (`status = 'AVAILABLE'`).
4. `paidAt`: `DateTime?` (Nullable). **Chỉ ghi nhận thời điểm Kế toán bấm lệnh chi trả ngân hàng thành công** (`status = 'PAID'`).

---

## F. TÍCH HỢP KỲ HOA HỒNG (COMMISSION PERIOD INTEGRATION)

Hệ thống WasyPro đã có sẵn hạ tầng `CommissionPeriod`, `CommissionProcessing`, `PeriodCloseAudit`. Thiết kế tích hợp gói NPP vào hạ tầng này như sau:

```
[ NppPurchase (COMPLETED & isPaidInFull) ]
           │
           │ Kích hoạt & Chốt hoa hồng
           ▼
[ NppCommission ] (periodId = CommissionPeriod.id, status = 'PENDING_CLEARING', settledAt = now())
           │
           │ Tham gia kỳ hoa hồng đang mở (OPEN)
           ▼
[ CommissionPeriod ] (status = 'OPEN')
           │
           │ Khi Admin chốt kỳ: POST /api/admin/commission-periods/:id/close
           ▼
[ Period Close Process ]
   ├─► Cập nhật NppCommission: status = 'AVAILABLE', availableAt = now()
   └─► Ghi nhận tổng hợp vào PeriodCloseAudit (cộng dồn totalEarnedPoints, totalEarnedMoney)
```

### Quy Định Về Tính Độc Lập Nghiệp Vụ:
- `NppCommission` có trường `periodId` trỏ tới `CommissionPeriod.id`.
- Khi chốt kỳ, hệ thống quét cả `Commission` lẻ và `NppCommission` thuộc `periodId` đó để chuyển sang `AVAILABLE`.
- **TUYỆT ĐỐI KHÔNG CHẠY CTV ENGINE**: `NppCommission` không chạy qua hàm tính hoa hồng CTV lẻ, không bị tính đè bởi `PeriodPolicyConfig` của CTV lẻ. Tỷ lệ F1 10%, F2 5% đã được snapshot cố định tại thời điểm kích hoạt.

---

## G. CHIẾN LƯỢC AN TOÀN ĐỒNG THỜI & CẤP BID (CONCURRENCY & BID ALLOCATION)

### 1. Các Rủi Ro Concurrency Tiềm Ẩn Nếu Thiết Kế Sơ Sài
Khi 2 request kích hoạt đồng thời (hoặc retry mạng đồng thời) xảy ra:
- Race condition có thể sinh 2 BID khác nhau cho cùng 1 User.
- Race condition có thể tạo 2 bản ghi `RankHistory` cùng có `effectiveTo = null` (gây lỗi 2 rank active song song).
- Đẩy giá trị `BusinessIdSequence.nextVal` tăng khống mà không sử dụng.
- Sinh duplicate hoa hồng F1/F2.

### 2. Giải Pháp Đa Tầng Bảo Vệ (Multi-Layer Concurrency Defense)

#### Tầng 1: Atomic Compare-And-Set (CAS) Settlement Guard
Trong SQLite, trước khi thực thi bất kỳ logic nào, hệ thống thực hiện một câu lệnh Atomic Update trạng thái đơn:
```sql
UPDATE NppPurchase 
SET settlementStatus = 'PROCESSING' 
WHERE id = ? 
  AND settlementStatus = 'PENDING' 
  AND status = 'COMPLETED' 
  AND isPaidInFull = 1;
```
- Nếu `changes === 0`: Thoát ngay lập tức (Bản ghi đã được xử lý bởi worker khác hoặc chưa đủ điều kiện kích hoạt).
- Nếu `changes === 1`: Worker hiện tại **giành quyền độc quyền (Exclusive Lock)** để xử lý đơn này.

#### Tầng 2: SQLite Transaction với Khóa Ghi Tức Thì (`BEGIN IMMEDIATE`)
- SQLite chia sẻ file dữ liệu duy nhất. Khi chạy `$transaction`, bắt buộc dùng chế độ `IMMEDIATE` để giữ exclusive write lock, ngăn chặn tiến trình khác xen ngang vào quá trình đọc/ghi `BusinessIdSequence`.

#### Tầng 3: Atomic BID Allocation & Single Lifetime BID
- Đọc lại trạng thái mới nhất của User từ DB:
  ```typescript
  const freshUser = await tx.user.findUnique({ where: { id: buyer.id } });
  let finalBid = freshUser.businessId;

  if (!finalBid) {
    // Chỉ cấp mới nếu User chưa có BID
    // Atomic sequence increment:
    const updatedSeq = await tx.businessIdSequence.update({
      where: { id: 1 },
      data: { nextVal: { increment: 1 } }
    });
    finalBid = `WK-${updatedSeq.nextVal - 1}`;
  }
  ```
- **Ràng buộc Database**: Bảng `User` đã có `@unique` trên trường `businessId`. Nếu bất kỳ tiến trình nào cố tình gán trùng BID, SQLite sẽ từ chối ngay lập tức ở tầng storage.

#### Tầng 4: RankHistory Concurrency Guard
- Đóng toàn bộ các rank đang active của User trong một câu lệnh duy nhất:
  ```typescript
  await tx.rankHistory.updateMany({
    where: { userId: freshUser.userId, effectiveTo: null },
    data: { effectiveTo: new Date() }
  });
  ```
- Tạo duy nhất 1 bản ghi `RankHistory` mới có `effectiveTo = null`.

#### Tầng 5: Unique Constraint Idempotency trên `NppCommission`
- Ràng buộc: `@@unique([purchaseId, level])`.
- Đảm bảo một đơn mua gói chỉ có thể tồn tại tối đa 1 dòng F1 (`level = 1`) và 1 dòng F2 (`level = 2`). Mọi lệnh retry sẽ dùng `upsert` an toàn tuyệt đối.

---

## H. PROPOSED PRISMA MODELS CHUẨN XÁC (EXACT SCHEMA CHANGES PROPOSED)

Dưới đây là mã Prisma schema hoàn chỉnh, đúng kiểu dữ liệu, đúng tên quan hệ, đúng kiểu khóa ngoại:

```prisma
// ============================================================================
// 1. MỞ RỘNG MODEL USER HIỆN HÀNH
// ============================================================================
// Bổ sung vào model User trong server/prisma/schema.prisma:
//
//   // NPP Partner Status (PHASE 2.1)
//   isNpp               Boolean         @default(false)
//   nppActivatedAt      DateTime?
//
//   // NPP Relations
//   nppPurchases        NppPurchase[]   @relation("UserNppPurchases")
//   nppCommissions      NppCommission[] @relation("UserNppCommissions")

// ============================================================================
// 2. MỞ RỘNG MODEL RANKHISTORY HIỆN HÀNH
// ============================================================================
// Bổ sung vào model RankHistory trong server/prisma/schema.prisma:
//
//   nppPurchaseId       String?
//   effectiveFrom       DateTime        @default(now())
//   effectiveTo         DateTime?
//   nppPurchase         NppPurchase?    @relation("PurchaseRankHistory", fields: [nppPurchaseId], references: [id])
//
//   @@index([userId, effectiveFrom])

// ============================================================================
// 3. MỞ RỘNG MODEL COMMISSIONPERIOD HIỆN HÀNH
// ============================================================================
// Bổ sung quan hệ vào model CommissionPeriod trong server/prisma/schema.prisma:
//
//   nppCommissions      NppCommission[] @relation("PeriodNppCommissions")

// ============================================================================
// 4. MODEL ĐỊNH NGHĨA GÓI NPP (NppPackage)
// ============================================================================
model NppPackage {
  id              String           @id @default(cuid())
  code            String           @unique // e.g. "NPP-GOLD-01", "NPP-DIAMOND"
  name            String           // e.g. "Gói NPP Vàng 10 Máy"
  description     String?
  grossPrice      BigInt           // Giá niêm yết (VNĐ, Số nguyên)
  defaultDiscount Float            @default(0) // Tỷ lệ chiết khấu mặc định (%, e.g. 25.0)
  assignedRank    String           @default("AMBASSADOR") // AMBASSADOR | MANAGER | DIRECTOR
  isActive        Boolean          @default(true)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  items           NppPackageItem[]
  purchases       NppPurchase[]
}

// ============================================================================
// 5. MODEL LINH KIỆN / THIẾT BỊ CỦA GÓI NPP (NppPackageItem)
// ============================================================================
model NppPackageItem {
  id          String     @id @default(cuid())
  packageId   String
  productId   String
  quantity    Int        @default(1) // Số lượng máy/phụ kiện trong gói
  note        String?

  package     NppPackage @relation(fields: [packageId], references: [id], onDelete: Cascade)
  product     Product    @relation(fields: [productId], references: [id])

  @@unique([packageId, productId])
  @@index([packageId])
  @@index([productId])
}

// ============================================================================
// 6. MODEL GIAO DỊCH MUA GÓI NPP (NppPurchase)
// ============================================================================
model NppPurchase {
  id                    String          @id @default(cuid())
  code                  String          @unique // e.g. "NPP-202609-001"
  userId                String          // FK trực tiếp sang User.id (HOÀN TOÀN KHÔNG QUA CUSTOMER)
  userCode              String          // Snapshot User.userId (e.g. "U958")
  packageId             String          // FK sang NppPackage.id

  // Financial tracking (Tất cả tiền tệ là BigInt - Số nguyên VNĐ)
  grossPrice            BigInt          // Giá niêm yết tại thời điểm tạo đơn
  discountRate          Float           @default(0) // Tỷ lệ chiết khấu áp dụng (%)
  discountAmount        BigInt          @default(0) // Tiền chiết khấu
  netPayableAmount      BigInt          // SỐ TIỀN PHẢI THU = grossPrice - discountAmount
  depositAmount         BigInt          @default(0) // Tiền cọc đã thanh toán
  paidAmount            BigInt          @default(0) // Tổng tiền lũy kế đã thanh toán thực tế
  remainingAmount       BigInt          @default(0) // Tiền còn nợ = netPayableAmount - paidAmount
  actualPaidAmount      BigInt          // TIỀN THỰC THU = netPayableAmount (COMMISSION BASE DUY NHẤT)

  // Payment progress tracking
  depositAt             DateTime?
  depositNote           String?
  isPaidInFull          Boolean         @default(false) // Kế toán xác nhận đã thu đủ 100%
  paidInFullAt          DateTime?
  paidInFullConfirmedBy String?         // Admin/Accountant userId

  // Lifecycle status
  status                String          @default("NEW") // NEW | DEPOSIT | CONFIRMED | SHIPPING | COMPLETED | CANCELLED
  settlementStatus      String          @default("PENDING") // PENDING | PROCESSING | SETTLED

  // Activation & Rank
  activatedAt           DateTime?       // Ghi nhận khi cả COMPLETED và isPaidInFull đều đạt
  assignedRank          String          // AMBASSADOR | MANAGER | DIRECTOR
  allocatedBusinessId   String?         // Mã BID được cấp từ đơn này (nếu trước đó chưa có)

  // Snapshot bất biến toàn bộ cấu hình gói và linh kiện lúc mua
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

  @@index([userId])
  @@index([packageId])
  @@index([status])
  @@index([isPaidInFull])
  @@index([settlementStatus])
}

// ============================================================================
// 7. MODEL HOA HỒNG GÓI NPP (NppCommission)
// ============================================================================
model NppCommission {
  id                String            @id @default(cuid())
  purchaseId        String            // FK sang NppPurchase.id
  beneficiaryId     String            // FK sang User.id
  beneficiaryUserId String            // Snapshot User.userId (e.g. "U958")
  level             Int               // 1 = F1 (10%), 2 = F2 (5%)
  rate              Float             // 10.0 hoặc 5.0

  // Financial fields (Số nguyên)
  commissionBase    BigInt            // Bằng actualPaidAmount của NppPurchase (VNĐ)
  earnedMoney       BigInt            // Tiền hoa hồng thực tế (VNĐ)
  earnedPoints      Int               // Điểm CP quy đổi (CP = earnedMoney / 1000, SỐ NGUYÊN)

  // Audit & Lifecycle
  rankAtCommission  String            // Cấp bậc của người thụ hưởng tại thời điểm chốt hoa hồng
  policyVersion     String            @default("NPP-v1.0")
  status            String            @default("PENDING_CLEARING") // PENDING_CLEARING | AVAILABLE | PAID | CANCELLED

  // Timestamps chuẩn ngữ nghĩa
  createdAt         DateTime          @default(now())
  settledAt         DateTime?         // Thời điểm kích hoạt chốt hoa hồng
  availableAt       DateTime?         // Thời điểm kỳ chốt, tiền khả dụng
  paidAt            DateTime?         // Thời điểm kế toán chi trả ngân hàng

  // Period integration
  periodId          String?           // FK sang CommissionPeriod.id

  purchase          NppPurchase       @relation(fields: [purchaseId], references: [id], onDelete: Cascade)
  beneficiary       User              @relation("UserNppCommissions", fields: [beneficiaryId], references: [id])
  period            CommissionPeriod? @relation("PeriodNppCommissions", fields: [periodId], references: [id])

  // RÀNG BUỘC DUY NHẤT BẮT BUỘC: 1 đơn mua gói chỉ có tối đa 1 dòng F1 và 1 dòng F2
  @@unique([purchaseId, level])
  @@index([beneficiaryId])
  @@index([status])
  @@index([periodId])
}
```

---

## I. MIGRATION RISK & CHIẾN LƯỢC TRIỂN KHAI (MIGRATION RISK ANALYSIS)

| Rủi Ro | Mức Độ | Đánh Giá Tác Động | Biện Pháp Kiểm Soát & Giải Pháp |
| :--- | :---: | :--- | :--- |
| **Kiểu `BigInt` trên JSON API** | Trung bình | JavaScript `JSON.stringify` mặc định không serialize được `BigInt` | Định nghĩa helper transform serialize `BigInt` thành String hoặc Number trước khi trả về REST API. |
| **Khóa ngoại `User.id` vs `User.userId`** | Thấp | Nhầm lẫn giữa UUID nội bộ và mã hiển thị | `NppPurchase.userId` trỏ tới `User.id` (CUID), đồng thời lưu thêm trường `userCode` chụp lại `User.userId` để tra cứu cây bảo trợ nhanh chóng. |
| **Ảnh hưởng dữ liệu CTV cũ** | **Bằng 0** | Bảng CTV lẻ giữ nguyên 100% | 4 bảng mới hoàn toàn độc lập, các trường mở rộng trên `User` và `RankHistory` đều có giá trị default an toàn. |

---

## J. TÍNH TƯƠNG THÍCH NGƯỢC (BACKWARD COMPATIBILITY)

1. Toàn bộ mã nguồn backend hiện hành (`executeOrderSettlement`, `calculateAndCreateCommissions`, `/api/orders`, `/api/admin/orders`) hoàn toàn không bị ảnh hưởng vì không truy vấn hay chạm vào 4 model mới.
2. Các CTV hiện tại tiếp tục vận hành trên mô hình cũ (tự mua lẻ, khách lẻ, tích lũy 5.000 QP lên Đại sứ, nhận hoa hồng 20%/10%/10%/5% trên điểm CP sản phẩm).
3. Khi triển khai gói NPP, luồng kích hoạt gọi riêng hàm chuyên biệt `activateNppPurchase` với transaction độc lập.

---

READY FOR PHASE 3: IMPLEMENTATION
