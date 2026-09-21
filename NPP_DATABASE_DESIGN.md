# THIẾT KẾ CƠ SỞ DỮ LIỆU GÓI NPP (NHÀ PHÂN PHỐI)
**Mã tài liệu**: `NPP_DATABASE_DESIGN.md`  
**Giai đoạn**: PHASE 2 — DATABASE DESIGN  
**Trạng thái**: READ-ONLY DESIGN ONLY (KHÔNG SỬA SOURCE / KHÔNG CHẠY MIGRATION / KHÔNG RESTART PM2 / KHÔNG DEPLOY)  
**Căn cứ pháp lý & Kỹ thuật**: 
- `CTV_SYSTEM_BASELINE.md`
- `NPP_BUSINESS_RULE_RECONCILIATION.md`
- 2 Hiệu chỉnh bắt buộc từ Phase 1 Review (Không rollback sau activation; Quản lý Rank History & Commission Snapshot bất biến).

---

## 1. CURRENT SCHEMA DEPENDENCY MAP (BẢN ĐỒ PHỤ THUỘC HIỆN TẠI)

Hệ thống hiện tại gồm các thực thể cốt lõi và các điểm nghẽn phụ thuộc:

```
[ User ] (id, userId, businessId, rank, rankStatus, parentId, qualifyingPoints, isSystemParticipant)
   │
   ├─► [ Customer ] (id, code, sponsorUserId, linkedUserId)  <-- [ĐIỂM NGHẼN TỰ MUA: TẠO KHÁCH ẢO]
   │       │
   │       └─► [ Order ] (id, code, customerId, ordererUserId, status, depositAmount)
   │               │
   │               ├─► [ OrderItem ] (id, orderId, productId, lineCommissionPts)
   │               │
   │               └─► [ Commission ] (id, orderId, beneficiaryId, type, rate, earnedPts)
   │
   ├─► [ RankHistory ] (id, userId, fromRank, toRank, reason, metadata, createdAt)
   │
   └─► [ BusinessIdSequence ] (id, nextVal) (Quản lý cấp phát WK-xxxxx tuần tự)
```

### Đánh giá Điểm nghẽn Kiến trúc:
- Bảng `Order` hiện hữu bị trói buộc với `customerId String` bắt buộc. Khi một CTV tự mua hàng, hệ thống bắt buộc phải sinh ra một bản ghi `Customer` ảo với `linkedUserId = user.id`.
- **Giải pháp bóc tách**: Gói NPP được thiết kế theo thực thể riêng (`NppPurchase`), liên kết trực tiếp với `User.id` (Người mua). **HOÀN TOÀN KHÔNG LIÊN KẾT VỚI BẢNG `Customer`**. Không bao giờ sinh khách ảo.

---

## 2. PROPOSED ERD DẠNG TEXT (SƠ ĐỒ THỰC THỂ ĐỀ XUẤT)

```
+-----------------------------------------------------------------------------------------+
|                                          User                                           |
|-----------------------------------------------------------------------------------------|
| id (PK, CUID)                                                                           |
| userId (UQ, String) -- VD: 'U958'                                                       |
| businessId (UQ, Nullable) -- VD: 'WK-10001' (DUY NHẤT 1 SUỐT ĐỜI)                       |
| isNpp (Boolean, default false) -- Trạng thái đối tác NPP                                |
| nppActivatedAt (DateTime, Nullable)                                                     |
| rank (String, default 'AMBASSADOR') -- AMBASSADOR | MANAGER | DIRECTOR (CURRENT RANK)   |
| rankStatus (String, default 'NOT_QUALIFIED')                                            |
| parentId (String, Nullable) -- Sponsor userId (LOCKED SUỐT ĐỜI)                         |
| qualifyingPoints (Int, default 0) -- KHÔNG BỊ GÓI NPP TÁC ĐỘNG                          |
+-----------------------------------------------------------------------------------------+
       │ 1                                  │ 1                          │ 1
       │ có nhiều                           │ mua nhiều                  │ có nhiều
       ▼ N                                  ▼ N                          ▼ N
+--------------------+              +--------------------+       +--------------------+
|    RankHistory     |              |    NppPurchase     |       |    NppCommission   |
|--------------------|              |--------------------|       |--------------------|
| id (PK)            |              | id (PK, CUID)      |       | id (PK, CUID)      |
| userId (FK->User)  |              | code (UQ, String)  |       | purchaseId (FK)    |
| fromRank           |              | userId (FK->User)  |◄──────| beneficiaryId (FK) |
| toRank             |              | packageId (FK)     |  1:N  | level (1=F1, 2=F2) |
| reason             |              | grossPrice         |       | rate (10.0 | 5.0)  |
| nppPurchaseId (FK) |              | discountAmount     |       | commissionBase     |
| effectiveFrom      |              | actualPaidAmount   |       | earnedMoney        |
| effectiveTo        |              | depositAmount      |       | earnedPoints (CP)  |
| metadata (JSON)    |              | status             |       | rankAtCommission   |
+--------------------+              | isPaidInFull       |       | status             |
                                    | paidInFullAt       |       | settledAt          |
                                    | assignedRank       |       +--------------------+
                                    | packageSnapshot    |
                                    | settlementStatus   |
                                    +--------------------+
                                              │ N
                                              │ tham chiếu
                                              ▼ 1
                                    +--------------------+
                                    |     NppPackage     |
                                    |--------------------|
                                    | id (PK, CUID)      |
                                    | code (UQ, String)  |
                                    | name (String)      |
                                    | grossPrice (Float) |
                                    | defaultDiscount    |
                                    | assignedRank       |
                                    | isActive (Boolean) |
                                    +--------------------+
                                              │ 1
                                              │ cấu thành bởi
                                              ▼ N
                                    +--------------------+
                                    |   NppPackageItem   |
                                    |--------------------|
                                    | id (PK, CUID)      |
                                    | packageId (FK)     |
                                    | productId (FK)     |
                                    | quantity (Int >=1) |
                                    +--------------------+
                                              │ N
                                              │ trỏ tới
                                              ▼ 1
                                    +--------------------+
                                    |      Product       |
                                    +--------------------+
```

---

## 3. PROPOSED PRISMA MODELS (ĐẶC TẢ MODEL PRISMA MỚI & MỞ RỘNG)

```prisma
// ==========================================
// 1. MỞ RỘNG MODEL USER HIỆN CÓ
// ==========================================
// Thêm 2 field vào model User hiện tại:
// isNpp          Boolean   @default(false)
// nppActivatedAt DateTime?
// nppPurchases   NppPurchase[]
// nppCommissions NppCommission[]

// ==========================================
// 2. MODEL ĐỊNH NGHĨA GÓI NPP (DO ADMIN QUẢN TRỊ)
// ==========================================
model NppPackage {
  id              String           @id @default(cuid())
  code            String           @unique // Mã gói: e.g. "NPP-GOLD-01", "NPP-DIAMOND"
  name            String           // Tên gói: e.g. "Gói NPP Vàng 10 Máy"
  description     String?          // Mô tả quyền lợi và chính sách
  grossPrice      Float            // Giá niêm yết của toàn bộ gói (VNĐ)
  defaultDiscount Float            @default(0) // Tỷ lệ chiết khấu mặc định (%: e.g. 25.0)
  assignedRank    String           @default("AMBASSADOR") // AMBASSADOR | MANAGER | DIRECTOR
  isActive        Boolean          @default(true) // Đang mở bán hay tạm ẩn
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  items           NppPackageItem[]
  purchases       NppPurchase[]
}

// ==========================================
// 3. MODEL LINH KIỆN / THIẾT BỊ CỦA GÓI NPP
// ==========================================
model NppPackageItem {
  id          String     @id @default(cuid())
  packageId   String
  productId   String
  quantity    Int        @default(1) // Số lượng linh kiện/máy trong gói
  note        String?

  package     NppPackage @relation(fields: [packageId], references: [id], onDelete: Cascade)
  product     Product    @relation(fields: [productId], references: [id])

  @@unique([packageId, productId])
  @@index([packageId])
  @@index([productId])
}

// ==========================================
// 4. MODEL GIAO DỊCH MUA GÓI NPP CỦA USER
// ==========================================
model NppPurchase {
  id                   String          @id @default(cuid())
  code                 String          @unique // Mã đơn gói: e.g. "NPP-202609-001"
  userId               String          // FK trực tiếp sang User.id (KHÔNG QUA CUSTOMER)
  packageId            String          // FK sang NppPackage.id

  // Financial fields (Snapshot tại thời điểm tạo đơn)
  grossPrice           Float           // Giá niêm yết lúc mua
  discountRate         Float           @default(0) // Tỷ lệ chiết khấu áp dụng (%)
  discountAmount       Float           @default(0) // Tiền chiết khấu: grossPrice * discountRate / 100
  actualPaidAmount     Float           // TIỀN THỰC THU = grossPrice - discountAmount (COMMISSION BASE)

  // Payment & Deposit Tracking
  depositAmount        Float           @default(0) // Tiền cọc đã thanh toán
  depositAt            DateTime?       // Thời điểm ghi nhận cọc
  depositNote          String?         // Ghi chú thanh toán cọc

  // Lifecycle Status
  status               String          @default("NEW") // NEW | DEPOSIT | CONFIRMED | SHIPPING | COMPLETED | CANCELLED
  isPaidInFull         Boolean         @default(false) // Kế toán xác nhận đã thu đủ 100% tiền
  paidInFullAt         DateTime?       // Thời điểm kế toán xác nhận
  paidInFullConfirmedBy String?        // userId của Admin/Accountant xác nhận

  // Activation & Rank
  activatedAt          DateTime?       // Thời điểm kích hoạt thành công: status=COMPLETED & isPaidInFull=true
  assignedRank         String          // Rank được gán: AMBASSADOR | MANAGER | DIRECTOR
  allocatedBusinessId  String?         // Mã BID được cấp bởi đơn này (nếu trước đó chưa có)

  // Historical Snapshot bất biến (Lưu toàn bộ linh kiện, giá niêm yết, tên sản phẩm lúc mua)
  packageSnapshot      String          // JSON: { packageCode, packageName, items: [{ productId, code, name, qty, unitPrice }] }

  // Settlement & Idempotency
  settlementStatus     String          @default("PENDING") // PENDING | SETTLED

  // Thông tin giao nhận
  shippingAddress      String?
  recipientPhone       String?
  recipientName        String?

  createdAt            DateTime        @default(now())
  updatedAt            DateTime        @updatedAt

  user                 User            @relation(fields: [userId], references: [id])
  package              NppPackage      @relation(fields: [packageId], references: [id])
  commissions          NppCommission[]
  rankHistories        RankHistory[]   @relation("PurchaseRankHistory")

  @@index([userId])
  @@index([packageId])
  @@index([status])
  @@index([isPaidInFull])
  @@index([settlementStatus])
}

// ==========================================
// 5. MODEL HOA HỒNG GIAO DỊCH GÓI NPP
// ==========================================
model NppCommission {
  id                String      @id @default(cuid())
  purchaseId        String      // FK sang NppPurchase.id
  beneficiaryId     String      // FK sang User.id người thụ hưởng (F1 hoặc F2)
  beneficiaryUserId String      // Snapshot userId (e.g. "U958")
  level             Int         // 1 = F1 (10%), 2 = F2 (5%)
  rate              Float       // 10.0 hoặc 5.0

  // Financial snapshot
  commissionBase    Float       // Bằng actualPaidAmount của đơn gói
  earnedMoney       Float       // commissionBase * rate / 100 (VNĐ)
  earnedPoints      Float       // earnedMoney / 1000 (CP)

  // Audit snapshot
  rankAtCommission  String      // Snapshot cấp bậc của người thụ hưởng tại thời điểm chốt hoa hồng
  policyVersion     String      @default("NPP-v1.0") // Phiên bản chính sách

  status            String      @default("PENDING_CLEARING") // PENDING_CLEARING | AVAILABLE | PAID | CANCELLED
  settledAt         DateTime    @default(now())

  purchase          NppPurchase @relation(fields: [purchaseId], references: [id], onDelete: Cascade)
  beneficiary       User        @relation(fields: [beneficiaryId], references: [id])

  // Ràng buộc Idempotent tuyệt đối: Mỗi đơn mua gói chỉ phát sinh tối đa 1 dòng hoa hồng cho mỗi level
  @@unique([purchaseId, level])
  @@index([beneficiaryId])
  @@index([status])
}

// ==========================================
// 6. MỞ RỘNG MODEL RANKHISTORY HIỆN TẠI
// ==========================================
// Giữ nguyên các field cũ của RankHistory, bổ sung:
// nppPurchaseId    String?
// effectiveFrom    DateTime  @default(now())
// effectiveTo      DateTime?
// nppPurchase      NppPurchase? @relation("PurchaseRankHistory", fields: [nppPurchaseId], references: [id])
```

---

## 4. FIELD-BY-FIELD EXPLANATION (GIẢI THÍCH CHI TIẾT TỪNG TRƯỜNG)

### A. Thực thể `NppPackage`
- `id`: Định danh duy nhất (CUID).
- `code`: Mã gói định danh nội bộ và hiển thị (VD: `NPP-GOLD-01`).
- `name`: Tên thương mại của gói hiển thị cho khách hàng.
- `grossPrice`: Giá niêm yết tổng gói (chưa chiết khấu).
- `defaultDiscount`: % chiết khấu mặc định cấu hình sẵn cho gói.
- `assignedRank`: Cấp bậc được gán cho người mua khi kích hoạt thành công (`AMBASSADOR`, `MANAGER`, `DIRECTOR`).
- `isActive`: Cờ bật/tắt hiển thị gói trên hệ thống.

### B. Thực thể `NppPackageItem`
- `packageId`: Gắn với gói NPP tương ứng.
- `productId`: Mã sản phẩm (máy hoặc linh kiện) lấy từ bảng `Product` hiện có.
- `quantity`: Số lượng thành phần bắt buộc trong gói (>= 1). Khách mua không được bỏ bớt.

### C. Thực thể `NppPurchase`
- `code`: Mã đơn giao dịch gói độc lập (VD: `NPP-202609-001`).
- `userId`: Người mua gói (trỏ trực tiếp vào `User.id`, bỏ qua bảng `Customer`).
- `grossPrice`: Giá niêm yết tại thời điểm đặt đơn.
- `discountRate`: Tỷ lệ % chiết khấu thực tế áp dụng cho đơn.
- `discountAmount`: Số tiền giảm giá (`grossPrice * discountRate / 100`).
- `actualPaidAmount`: Số tiền thực thu sau chiết khấu. **Đây là căn cứ tính hoa hồng duy nhất**.
- `depositAmount`: Số tiền cọc đã thu trước.
- `status`: Tiến trình đơn hàng (`NEW`, `DEPOSIT`, `CONFIRMED`, `SHIPPING`, `COMPLETED`, `CANCELLED`).
- `isPaidInFull`: Cờ Kế toán xác nhận đã thu đủ 100% tiền đơn gói.
- `activatedAt`: Thời điểm kích hoạt thành công (khi cả `status == COMPLETED` VÀ `isPaidInFull == true`).
- `assignedRank`: Cấp bậc được gán từ đơn này.
- `allocatedBusinessId`: Ghi nhận mã BID được cấp mới (nếu User trước đó chưa có BID).
- `packageSnapshot`: JSON lưu toàn bộ linh kiện, giá và thông số sản phẩm lúc mua (bất biến vĩnh viễn).
- `settlementStatus`: Trạng thái xử lý hoa hồng (`PENDING` -> `SETTLED`).

### D. Thực thể `NppCommission`
- `purchaseId`: Khóa ngoại đơn mua gói sinh ra hoa hồng.
- `beneficiaryId`: Người thụ hưởng hoa hồng (F1 hoặc F2).
- `level`: Tầng bảo trợ (`1` cho F1 Sponsor trực tiếp, `2` cho F2 Sponsor tuyến trên).
- `rate`: Tỷ lệ hoa hồng (`10.0` cho F1, `5.0` cho F2).
- `commissionBase`: Giá trị cơ sở tính hoa hồng (bằng đúng `actualPaidAmount`).
- `earnedMoney`: Số tiền hoa hồng thực tế tính ra VNĐ.
- `earnedPoints`: Điểm CP quy đổi (`earnedMoney / 1000`).
- `rankAtCommission`: Chụp lại Cấp bậc của người thụ hưởng tại thời điểm nhận thưởng.
- `status`: Trạng thái hoa hồng (`PENDING_CLEARING`, `AVAILABLE`, `PAID`, `CANCELLED`).

---

## 5. PRIMARY KEYS / FOREIGN KEYS (RÀNG BUỘC KHÓA CHÍNH & KHÓA NGOẠI)

| Bảng | Tên Khóa | Loại | Bảng Tham Chiếu | Quy Tắc Xóa (onDelete) |
| :--- | :--- | :--- | :--- | :--- |
| `NppPackage` | `id` | PK | - | - |
| `NppPackageItem` | `id` | PK | - | - |
| `NppPackageItem` | `packageId` | FK | `NppPackage(id)` | `Cascade` |
| `NppPackageItem` | `productId` | FK | `Product(id)` | `Restrict` |
| `NppPurchase` | `id` | PK | - | - |
| `NppPurchase` | `userId` | FK | `User(id)` | `Restrict` |
| `NppPurchase` | `packageId` | FK | `NppPackage(id)` | `Restrict` |
| `NppCommission` | `id` | PK | - | - |
| `NppCommission` | `purchaseId` | FK | `NppPurchase(id)` | `Cascade` |
| `NppCommission` | `beneficiaryId` | FK | `User(id)` | `Restrict` |
| `RankHistory` | `nppPurchaseId` | FK | `NppPurchase(id)` | `SetNull` |

---

## 6. UNIQUE CONSTRAINTS (RÀNG BUỘC DUY NHẤT)

1. `NppPackage.code`: Không được trùng mã gói (e.g. `NPP-GOLD-01`).
2. `NppPackageItem.[packageId, productId]`: Một sản phẩm chỉ xuất hiện 1 lần trong 1 cấu hình gói.
3. `NppPurchase.code`: Không được trùng mã đơn giao dịch gói (e.g. `NPP-202609-001`).
4. `NppCommission.[purchaseId, level]`: **CỰC KỲ QUAN TRỌNG (Idempotency)**. Một đơn mua gói chỉ có thể phát sinh DUY NHẤT 1 bản ghi hoa hồng F1 (`level = 1`) và DUY NHẤT 1 bản ghi hoa hồng F2 (`level = 2`). Ngăn chặn 100% rủi ro chạy trùng commission khi retry settlement.

---

## 7. INDEXES (CHỈ MỤC TỐI ƯU HIỆU NĂNG)

1. `NppPurchase`:
   - `@@index([userId])`: Tra cứu nhanh lịch sử mua gói của 1 User.
   - `@@index([status])`: Lọc đơn theo trạng thái xử lý giao hàng.
   - `@@index([isPaidInFull])`: Kế toán lọc đơn cần thu tiền hoặc đã thu đủ.
   - `@@index([settlementStatus])`: Lọc các đơn đang chờ giải phóng hoa hồng.
2. `NppCommission`:
   - `@@index([beneficiaryId])`: Tối ưu hóa tính tổng thu nhập, ví điểm và lịch sử hoa hồng của User.
   - `@@index([status])`: Đối soát hoa hồng theo kỳ.
3. `RankHistory`:
   - `@@index([userId, effectiveFrom])`: Truy vết chuỗi thay đổi rank theo trục thời gian.

---

## 8. ENUM & STATUS DESIGN

Để duy trì tính tương thích chuẩn SQLite hiện tại (không dùng native ENUM của Postgres), toàn bộ trạng thái dùng chuỗi định dạng hằng số:

1. **`NppPurchase.status`**:
   - `NEW`: Đơn vừa lập.
   - `DEPOSIT`: Đã thanh toán tiền cọc (Chưa kích hoạt NPP).
   - `CONFIRMED`: Admin duyệt thông tin đơn và cấu hình máy.
   - `SHIPPING`: Đang bàn giao máy và linh kiện.
   - `COMPLETED`: Khách đã nhận đủ hàng hóa.
   - `CANCELLED`: Hủy đơn (Chỉ cho phép trước khi kích hoạt).
2. **`NppCommission.status`**:
   - `PENDING_CLEARING`: Đã ghi nhận khi kích hoạt, đang chờ kỳ đối soát kế toán.
   - `AVAILABLE`: Khả dụng để rút tiền hoặc chuyển thành S-Points.
   - `PAID`: Đã chi trả qua ngân hàng.
   - `CANCELLED`: Bị hủy bỏ.
3. **`User.rank` / `assignedRank`**:
   - `AMBASSADOR` (Hiển thị: Đại sứ)
   - `MANAGER` (Hiển thị: Trưởng nhóm)
   - `DIRECTOR` (Hiển thị: Quản lý)

---

## 9. SNAPSHOT STRATEGY (CHIẾN LƯỢC BẢO TOÀN DỮ LIỆU LỊCH SỬ)

### Cơ chế Snapshot của `NppPurchase`:
Tại thời điểm tạo đơn và kích hoạt, toàn bộ thông tin gói được chụp thành chuỗi JSON lưu tại `packageSnapshot`:
```json
{
  "packageId": "cuid_pkg_123",
  "packageCode": "NPP-GOLD-10",
  "packageName": "Gói Phân Phối Vàng 10 Máy",
  "assignedRank": "MANAGER",
  "grossPrice": 300000000,
  "discountRate": 25.0,
  "discountAmount": 75000000,
  "actualPaidAmount": 225000000,
  "policyVersion": "NPP-v1.0",
  "items": [
    {
      "productId": "prod_1",
      "productCode": "WAS-M01",
      "productName": "Máy Trị Liệu Điện Sinh Học WasyPro Gen 2",
      "quantity": 10,
      "unitPrice": 25000000
    },
    {
      "productId": "prod_2",
      "productCode": "WAS-ACC-05",
      "productName": "Bộ Phụ Kiện Đầu Dẫn Sinh Học Cao Cấp",
      "quantity": 10,
      "unitPrice": 5000000
    }
  ]
}
```
*Nguyên tắc*: Khi Admin vào CMS chỉnh sửa giá gói, đổi linh kiện hay xóa gói, toàn bộ đơn mua trong quá khứ đọc trực tiếp từ `packageSnapshot`, đảm bảo tính toàn vẹn 100%.

---

## 10. MONEY & CP PRECISION STRATEGY (ĐỘ CHÍNH XÁC TIỀN TỆ)

1. **Đơn vị Tiền tệ**:
   - `Float` (hoặc `Decimal` khi lên Postgres) đại diện cho VNĐ.
   - Luôn làm tròn số nguyên đối với số tiền cuối cùng: `Math.round(actualPaidAmount * (rate / 100))`.
2. **Quy đổi CP**:
   - `1 CP = 1.000 VNĐ`.
   - `earnedPoints = Math.round(earnedMoney / 1000)`.
   - Ví dụ:
     - Thực thu = `225.000.000 VNĐ`.
     - F1 (10%) = `22.500.000 VNĐ` = `22.500 CP`.
     - F2 (5%) = `11.250.000 VNĐ` = `11.250 CP`.
   - Hoàn toàn là số nguyên, không có sai số dấu phẩy động.

---

## 11. PAYMENT / DEPOSIT STRATEGY (QUY CHẾ ĐẶT CỌC & THANH TOÁN)

- **Khi khách đặt cọc (`status = 'DEPOSIT'`)**:
  - Ghi nhận `depositAmount`, `depositAt`, `depositNote`.
  - `isPaidInFull = false`.
  - `activatedAt = null`.
  - Không kích hoạt NPP, không cấp BID, không đổi Rank, không phát sinh commission (`NppCommission` rỗng).
- **Khi Kế toán xác nhận thu đủ 100% tiền (`isPaidInFull = true`)**:
  - Ghi nhận `paidInFullAt = now()`, `paidInFullConfirmedBy = adminUserId`.
  - Nếu `status == 'COMPLETED'`: Kích hoạt ngay lập tức.
  - Nếu `status != 'COMPLETED'` (hàng đang trên đường giao): Chờ đến khi trạng thái giao hàng chuyển sang `COMPLETED` mới kích hoạt toàn diện.

---

## 12. ACTIVATION TRANSACTION BOUNDARY (RANH GIỚI TRANSACTION KÍCH HOẠT)

Hàm kích hoạt `activateNppPurchase(purchaseId, tx)` chạy trong **DUY NHẤT 1 Prisma Transaction (`$transaction`)**:

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Khóa bản ghi kiểm tra điều kiện kích hoạt
  const purchase = await tx.nppPurchase.findUnique({
    where: { id: purchaseId },
    include: { user: true, package: true }
  });

  // Guard điều kiện kép
  if (purchase.status !== 'COMPLETED' || !purchase.isPaidInFull) {
    throw new Error('Đơn gói chưa đủ điều kiện kích hoạt (phải COMPLETED và thanh toán đủ)');
  }
  if (purchase.settlementStatus === 'SETTLED') {
    return; // Đã kích hoạt trước đó -> Idempotent thoát an toàn
  }

  const buyer = purchase.user;
  let allocatedBid = buyer.businessId;

  // 2. Cấp BID nếu chưa có (Duy nhất 1 BID suốt đời)
  if (!allocatedBid) {
    const seq = await tx.businessIdSequence.upsert({
      where: { id: 1 },
      update: { nextVal: { increment: 1 } },
      create: { id: 1, nextVal: 10002 },
    });
    allocatedBid = `WK-${seq.nextVal - 1}`;
  }

  // 3. Đóng khoảng thời gian Rank cũ trong RankHistory
  await tx.rankHistory.updateMany({
    where: { userId: buyer.userId, effectiveTo: null },
    data: { effectiveTo: new Date() }
  });

  // 4. Ghi nhận lịch sử Rank mới
  await tx.rankHistory.create({
    data: {
      userId: buyer.userId,
      fromRank: buyer.rank,
      toRank: purchase.assignedRank,
      fromStatus: buyer.rankStatus,
      toStatus: 'ACTIVE_RANK',
      reason: 'NPP_PACKAGE_ACTIVATION',
      triggeredBy: 'SYSTEM',
      nppPurchaseId: purchase.id,
      effectiveFrom: new Date(),
      metadata: JSON.stringify({
        purchaseCode: purchase.code,
        packageName: purchase.package.name,
        actualPaidAmount: purchase.actualPaidAmount,
      })
    }
  });

  // 5. Cập nhật User: isNpp, businessId, rank hiện tại (GIỮ NGUYÊN qualifyingPoints)
  await tx.user.update({
    where: { id: buyer.id },
    data: {
      isNpp: true,
      nppActivatedAt: buyer.nppActivatedAt || new Date(),
      businessId: allocatedBid,
      rank: purchase.assignedRank,
      rankStatus: 'ACTIVE_RANK',
      // qualifyingPoints: TUYỆT ĐỐI KHÔNG SỬA
    }
  });

  // 6. Tính toán và tạo Commission F1 (10%) và F2 (5%)
  if (buyer.parentId) {
    const f1User = await tx.user.findUnique({ where: { userId: buyer.parentId } });
    if (f1User) {
      const f1Money = Math.round(purchase.actualPaidAmount * 0.10);
      await tx.nppCommission.upsert({
        where: { purchaseId_level: { purchaseId: purchase.id, level: 1 } },
        update: {},
        create: {
          purchaseId: purchase.id,
          beneficiaryId: f1User.id,
          beneficiaryUserId: f1User.userId,
          level: 1,
          rate: 10.0,
          commissionBase: purchase.actualPaidAmount,
          earnedMoney: f1Money,
          earnedPoints: Math.round(f1Money / 1000),
          rankAtCommission: f1User.rank,
          status: 'PENDING_CLEARING'
        }
      });

      if (f1User.parentId) {
        const f2User = await tx.user.findUnique({ where: { userId: f1User.parentId } });
        if (f2User) {
          const f2Money = Math.round(purchase.actualPaidAmount * 0.05);
          await tx.nppCommission.upsert({
            where: { purchaseId_level: { purchaseId: purchase.id, level: 2 } },
            update: {},
            create: {
              purchaseId: purchase.id,
              beneficiaryId: f2User.id,
              beneficiaryUserId: f2User.userId,
              level: 2,
              rate: 5.0,
              commissionBase: purchase.actualPaidAmount,
              earnedMoney: f2Money,
              earnedPoints: Math.round(f2Money / 1000),
              rankAtCommission: f2User.rank,
              status: 'PENDING_CLEARING'
            }
          });
        }
      }
    }
  }

  // 7. Cập nhật Purchase thành SETTLED
  await tx.nppPurchase.update({
    where: { id: purchase.id },
    data: {
      settlementStatus: 'SETTLED',
      activatedAt: new Date(),
      allocatedBusinessId: allocatedBid,
    }
  });
});
```

---

## 13. COMMISSION IDEMPOTENCY STRATEGY (CHỐNG TRÙNG HOA HỒNG TUYỆT ĐỐI)

Hai tầng phòng vệ chống double-commission:
1. **Application Guard**: Kiểm tra cờ `purchase.settlementStatus === 'SETTLED'`. Nếu đã settled thì return ngay lập tức.
2. **Database Constraint Guard**: Ràng buộc Unique `@@unique([purchaseId, level])` trên bảng `NppCommission`. Kể cả khi có 2 tiến trình đồng thời thực thi, chỉ có 1 tiến trình insert thành công, tiến trình thứ hai sẽ bị cơ sở dữ liệu chặn lại thông qua cơ chế `upsert`.

---

## 14. RANK HISTORY STRATEGY (LỊCH SỬ THAY ĐỔI CẤP BẬC THEO TRỤC THỜI GIAN)

Mô hình lưu trữ lịch sử cấp bậc theo dạng thời gian hiệu lực (`effectiveFrom` -> `effectiveTo`):
- Khi một rank mới được kích hoạt:
  - Bản ghi rank hiện tại được đóng lại bằng cách set `effectiveTo = now()`.
  - Bản ghi mới được tạo với `effectiveFrom = now()` và `effectiveTo = null` (đang có hiệu lực).
  - Khóa ngoại `nppPurchaseId` gắn chặt rank thay đổi này với đơn mua gói cụ thể.
- `User.rank` luôn phản ánh rank đang có hiệu lực gần nhất.

---

## 15. UPGRADE / DOWNGRADE STRATEGY (CƠ CHẾ NÂNG CẤP & HẠ CẤP)

1. **Quy tắc thời điểm**: Khi User mua gói mới, Cấp bậc mới sẽ áp dụng **kể từ thời điểm gói mới được kích hoạt thành công**.
2. **Không hồi tố (No Retroactivity)**:
   - Các đơn hàng bán lẻ và hoa hồng đã tính trong quá khứ giữ nguyên 100% snapshot `rankAtCommission`.
   - Downgrade rank theo gói mới không làm giảm hoa hồng của các đơn đã settlement trước đó.

---

## 16. MIGRATION IMPACT (ĐÁNH GIÁ TÁC ĐỘNG MIGRATION)

1. **Thêm mới 3 bảng độc lập**: `NppPackage`, `NppPackageItem`, `NppPurchase`, `NppCommission`.
2. **Mở rộng bảng `User`**: Thêm `isNpp` (default `false`) và `nppActivatedAt` (nullable).
3. **Mở rộng bảng `RankHistory`**: Thêm `nppPurchaseId`, `effectiveFrom`, `effectiveTo`.
4. **Tác động dữ liệu hiện có**: **BẰNG 0**. Toàn bộ dữ liệu cũ của CTV, đơn hàng, khách hàng, hoa hồng không bị sửa đổi, xóa hay di dời.

---

## 17. BACKWARD COMPATIBILITY (TÍNH TƯƠNG THÍCH NGƯỢC)

- Toàn bộ flow CTV bán lẻ hiện tại (`Order`, `OrderItem`, `executeOrderSettlement`, mốc 5.000 QP, `calculateAndCreateCommissions`) chạy bình thường 100%.
- Các User hiện tại có `isNpp = false` tiếp tục tích lũy QP từ bán lẻ để lên Đại sứ như quy chế cũ.

---

## 18. RISK LIST (DANH MỤC RỦI RO & BIỆN PHÁP KIỂM SOÁT)

| STT | Rủi Ro Tiềm Ẩn | Khả Năng | Hậu Quả | Giải Pháp Kiểm Soát Kỹ Thuật |
| :---: | :--- | :---: | :---: | :--- |
| 1 | Race condition khi Kế toán vừa duyệt tiền vừa đổi trạng thái đơn | Thấp | Trùng hoa hồng | Bọc toàn bộ trong 1 Prisma Transaction + Unique constraint `[purchaseId, level]`. |
| 2 | Kế toán duyệt thu tiền nhưng đơn chưa giao xong | Trung bình | Kích hoạt sớm khi chưa nhận máy | Ràng buộc điều kiện kép: Bắt buộc cả `status == COMPLETED` VÀ `isPaidInFull == true`. |
| 3 | User tự mua gói bị sinh thêm bản ghi Customer ảo | Cao | Ô nhiễm dữ liệu CRM | `NppPurchase` chỉ trỏ tới `User.id`, hoàn toàn không có quan hệ với `Customer`. |
| 4 | Cấp thêm BID thứ 2 cho User đã là Đại sứ | Trung bình | Phá vỡ mã số định danh | Kiểm tra `if (!buyer.businessId)` trước khi sinh BID; nếu đã có thì giữ nguyên. |
| 5 | Gói NPP làm cộng thêm 5.000 điểm QP | Cao | Sai lệch báo cáo doanh số CTV | Transaction kích hoạt NPP hoàn toàn không chứa câu lệnh cập nhật `qualifyingPoints`. |

---

## 19. OPEN TECHNICAL QUESTIONS ONLY (CÂU HỎI KỸ THUẬT DUY NHẤT)

*(Không có câu hỏi về Business Rule vì 15 rules đã được chốt 100%)*

1. **Cấu trúc lưu mã đơn `NppPurchase.code`**:
   - Đề xuất: Dùng tiền tố `NPP-` kèm timestamp/sequence tuần tự (VD: `NPP-202609-0001`) để phân biệt trực quan với đơn hàng lẻ `ORD-` và đơn web `WS-`.
2. **Kỳ đối soát hoa hồng gói**:
   - Hoa hồng gói NPP (`NppCommission`) sẽ được gom chung vào bảng `CommissionProcessing` theo kỳ hiện tại của hệ thống CTV hay đối soát lệnh chi trả trực tiếp theo từng đơn gói?
   - *Đề xuất kỹ thuật*: Tận dụng trường `status` (`PENDING_CLEARING` -> `AVAILABLE` -> `PAID`) tương thích hoàn toàn với module chi trả hiện tại của Admin Portal.

---

READY FOR PHASE 3: IMPLEMENTATION
