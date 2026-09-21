# NPP_PHASE_3_2_1_DESIGN.md
**Phase**: 3.2.1 — NPP Registration + Package Type + Admin Grant  
**Status**: DESIGN AUDIT ONLY — NO CODE / NO MIGRATION / NO DEPLOY  
**Baseline**: Phase 3.2 PASS (commit `e511249`)

---

## 1. SCHEMA HIỆN TẠI ĐÁP ỨNG ĐƯỢC BAO NHIÊU %

| Yêu cầu 3.2.1 | Schema hiện tại | Đáp ứng? |
| :--- | :--- | :---: |
| Package Type (CAPITAL / PRODUCT_COMBO) | `NppPackage` không có `packageType` field | ❌ |
| CAPITAL: giá cố định, không Product | `grossPrice` ✅, nhưng `items` bắt buộc ≥1 trong CRUD API | ❌ |
| PRODUCT_COMBO: requiredQuantity rule | Không có `requiredQuantity` field | ❌ |
| PRODUCT_COMBO: discount %, giá tính từ Product chọn | `defaultDiscount` ✅ (BPS), nhưng `grossPrice` hiện lưu fixed price | ⚠️ Partial |
| NppRegistration (intent, chưa phải NPP) | Model không tồn tại | ❌ |
| Admin Grant (NPP activation không qua purchase) | Không có model/field nào cho activationSource | ❌ |
| Activation source tracking | `User.isNpp` + `nppActivatedAt` có, nhưng thiếu source/audit | ❌ |
| Payment status ≠ NPP status | `NppPurchase.isPaidInFull` + `User.isNpp` tồn tại nhưng chưa có Admin Grant path | ⚠️ Partial |
| Idempotency guard | `NppPurchase.settlementStatus` CAS ✅ | ✅ |
| Rank conflict detection | Logic chưa có, chỉ có RankHistory | ❌ |
| BigInt money | ✅ tất cả money = BigInt | ✅ |
| BID allocation | ✅ BusinessIdSequence + User.businessId @unique | ✅ |
| RankHistory audit | ✅ có effectiveFrom/effectiveTo/nppPurchaseId | ✅ |
| Backward compatible | Không phá CTV/Order/Commission hiện tại | ✅ |

**Kết luận**: Schema hiện tại đáp ứng **~40%** yêu cầu Phase 3.2.1.

---

## 2. CẦN THÊM MODEL / FIELD NÀO

### 2.1 Model mới: `NppRegistration`

```prisma
model NppRegistration {
  id              String      @id @default(cuid())
  userId          String
  packageId       String
  status          String      @default("PENDING")
  // PENDING | APPROVED | CANCELLED | CONVERTED
  note            String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User        @relation("UserNppRegistrations", fields: [userId], references: [id])
  package         NppPackage  @relation(fields: [packageId], references: [id])

  @@index([userId])
  @@index([packageId])
  @@index([status])
}
```

**Lý do**: Registration ≠ NPP. Lưu intent trước khi purchase. Không dùng `User.isNpp`.

### 2.2 Model mới: `NppActivation` (Admin Grant audit trail)

```prisma
model NppActivation {
  id                String      @id @default(cuid())
  userId            String
  source            String      // PURCHASE | ADMIN_GRANT
  packageId         String?     // null nếu Admin Grant không chọn package
  purchaseId        String?     // FK NppPurchase.id nếu source=PURCHASE
  assignedRank      String      // AMBASSADOR | MANAGER | DIRECTOR
  allocatedBid      String?     // BID cấp (nếu mới)
  activatedBy       String      // userId Admin, hoặc "SYSTEM" nếu purchase flow
  reason            String?     // Lý do (Admin Grant bắt buộc)
  note              String?
  paymentStatus     String?     // PAID | PARTIAL | UNPAID (cho Admin Grant)
  createdAt         DateTime    @default(now())

  user              User        @relation("UserNppActivations", fields: [userId], references: [id])

  @@index([userId])
  @@index([source])
}
```

**Lý do**: Audit trail cho cả Purchase activation VÀ Admin Grant. Trả lời "Ai cấp NPP cho ai, lúc nào, Rank gì, vì sao."

### 2.3 Fields mới trên `NppPackage`

```prisma
// THÊM vào NppPackage:
packageType       String      @default("PRODUCT_COMBO")
// CAPITAL | PRODUCT_COMBO

requiredQuantity  Int?
// Chỉ dùng cho PRODUCT_COMBO
// Ví dụ: 5 = phải chọn đúng 5 máy bất kỳ
// null cho CAPITAL (không có Product)
```

### 2.4 Fields mới trên `User`

```prisma
// THÊM vào User:
nppActivationSource   String?     // PURCHASE | ADMIN_GRANT
nppActivatedBy        String?     // userId Admin nếu ADMIN_GRANT
```

### 2.5 Relation fields

```prisma
// User thêm:
nppRegistrations    NppRegistration[]  @relation("UserNppRegistrations")
nppActivations      NppActivation[]    @relation("UserNppActivations")

// NppPackage thêm:
registrations       NppRegistration[]
```

---

## 3. PACKAGE TYPE DESIGN

### 3.1 Phân loại

| Field | CAPITAL | PRODUCT_COMBO |
| :--- | :--- | :--- |
| `packageType` | `"CAPITAL"` | `"PRODUCT_COMBO"` |
| `grossPrice` | Giá cố định (300M, 2B...) | **Không dùng** — giá tính từ Product khi mua |
| `defaultDiscount` | `0` (không áp discount) | BPS discount (2500 = 25%) |
| `requiredQuantity` | `null` | `5`, `10`, `20`... |
| `items` (NppPackageItem) | **Rỗng** — không có Product | **Rỗng** — KHÔNG lưu Product cố định |
| `assignedRank` | Theo cấu hình Admin | Thường `AMBASSADOR` |

### 3.2 Thay đổi semantic của NppPackageItem

> [!IMPORTANT]
> **NppPackageItem KHÔNG còn bắt buộc cho cả 2 loại Package.**
> 
> - **CAPITAL**: Không có Product → `items` rỗng
> - **PRODUCT_COMBO**: Package KHÔNG quy định model cố định. User tự chọn model khi mua. `items` rỗng ở level Package definition.
> 
> Các NppPackageItem hiện tại trên DB = 0 records → **không có dữ liệu cần migrate.**
> 
> **Tuy nhiên**: NppPackageItem vẫn giữ lại trong schema. Có thể dùng tương lai nếu Admin muốn quy định danh sách Product hợp lệ cho combo. Phase này KHÔNG yêu cầu.

### 3.3 grossPrice semantic thay đổi

| Package Type | `grossPrice` nghĩa | Ghi chú |
| :--- | :--- | :--- |
| CAPITAL | Số tiền cố định phải thanh toán | `300000000n` hoặc `2000000000n` |
| PRODUCT_COMBO | **Không sử dụng trực tiếp** | Có thể set = `0n` hoặc giữ nullable. Giá thực tính từ Product lúc tạo purchase. |

> [!WARNING]
> **BUSINESS DECISION REQUIRED**: `NppPackage.grossPrice` hiện là `BigInt` NOT NULL. Với PRODUCT_COMBO, giá phụ thuộc vào Product user chọn → `grossPrice` trên Package không có ý nghĩa. 
>
> **Đề xuất**: Cho PRODUCT_COMBO, `grossPrice` = `0n` (sentinel value). Backend KHÔNG dùng giá này cho purchase. Giá thực lấy từ Product Master khi user chọn.

---

## 4. PRODUCT COMBO RULE DESIGN

### 4.1 Package definition (Admin tạo)

```
code: "COMBO-05"
name: "Combo 5 máy"
packageType: PRODUCT_COMBO
requiredQuantity: 5
defaultDiscount: 2500  (25%)
assignedRank: AMBASSADOR
grossPrice: 0  (sentinel — không dùng)
items: []  (rỗng — user tự chọn Product)
```

### 4.2 Purchase flow (User mua)

```
User chọn Package COMBO-05
→ Frontend hiển thị form chọn Product
→ User chọn:
   WS-03 × 2 (15M × 2 = 30M)
   WS-01 × 1 (25M × 1 = 25M)
   WS-01Pro × 2 (45M × 2 = 90M)
   Total quantity = 5 ✅ (match requiredQuantity)

→ Backend validates:
   1. Package ACTIVE
   2. packageType === PRODUCT_COMBO
   3. sum(item.quantity) === package.requiredQuantity (5 === 5) ✅
   4. Mỗi productId tồn tại trong Product table
   5. Load Product.price từ DB (KHÔNG trust client)
   6. grossProductValue = sum(product.price × qty)
      = 30M + 25M + 90M = 145M
   7. discount = grossProductValue × defaultDiscount / 10000
      = 145M × 2500 / 10000 = 36.25M
   8. netPayableAmount = grossProductValue - discount
      = 145M - 36.25M = 108.75M

→ NppPurchase tạo:
   grossPrice: 145000000n (gross product value)
   discountRateBps: 2500
   discountAmount: 36250000n
   netPayableAmount: 108750000n
   actualPaidAmount: 108750000n (commission base)
   packageSnapshot: JSON {
     packageCode: "COMBO-05",
     packageType: "PRODUCT_COMBO",
     requiredQuantity: 5,
     discountBps: 2500,
     selectedProducts: [
       { productId, title, price: 15000000, qty: 2 },
       { productId, title, price: 25000000, qty: 1 },
       { productId, title, price: 45000000, qty: 2 }
     ]
   }
```

### 4.3 Validation rules

| Rule | Check |
| :--- | :--- |
| Tổng qty === requiredQuantity | `sum(items.qty) !== package.requiredQuantity` → reject |
| Qty thiếu | `4 !== 5` → reject |
| Qty dư | `6 !== 5` → reject |
| Product không tồn tại | `Product.findMany` count mismatch → reject |
| Duplicate product | Cho phép (WS-03 × 3 = OK nếu tổng = 5) |
| Client gửi fake price | **Backend LUÔN lấy giá từ Product Master** |

---

## 5. CAPITAL PACKAGE DESIGN

### 5.1 Package definition (Admin tạo)

```
code: "NPP-300M"
name: "Gói NPP Chiến Lược 300M"
packageType: CAPITAL
grossPrice: 300000000n  (giá cố định)
defaultDiscount: 0  (không discount)
requiredQuantity: null  (không Product)
assignedRank: MANAGER
items: []  (rỗng)
```

### 5.2 Purchase flow

```
User chọn Package NPP-300M
→ KHÔNG cần chọn Product
→ Backend:
   1. Package ACTIVE
   2. packageType === CAPITAL
   3. KHÔNG validate Product/quantity
   4. grossPrice = package.grossPrice (300M)
   5. discount = 0 (CAPITAL KHÔNG discount)
   6. netPayableAmount = 300M

→ NppPurchase tạo:
   grossPrice: 300000000n
   discountRateBps: 0
   discountAmount: 0n
   netPayableAmount: 300000000n
   actualPaidAmount: 300000000n
   packageSnapshot: JSON {
     packageCode: "NPP-300M",
     packageType: "CAPITAL",
     grossPrice: 300000000,
     selectedProducts: []
   }
```

---

## 6. NPP REGISTRATION DESIGN

### 6.1 Flow

```
User có account (role=ctv)
→ Vào trang "Đăng ký NPP"
→ Thấy danh sách Package active
→ Chọn 1 package
→ Submit

Backend:
→ Tạo NppRegistration {
     userId, packageId, status: "PENDING"
   }
→ User CHƯA phải NPP
→ isNpp = false
→ Chưa BID
→ Chưa Rank

Sau đó Admin hoặc hệ thống xử lý tiếp:
→ Admin approve → tạo NppPurchase
→ Hoặc User tiến hành thanh toán → tạo NppPurchase
→ NppRegistration.status = "CONVERTED"
```

### 6.2 Statuses

| Status | Nghĩa |
| :--- | :--- |
| `PENDING` | Đã đăng ký, chờ xử lý |
| `APPROVED` | Admin duyệt, chờ thanh toán |
| `CANCELLED` | Hủy đăng ký |
| `CONVERTED` | Đã chuyển sang NppPurchase |

---

## 7. ADMIN GRANT DESIGN

### 7.1 Flow

```
Admin Portal → Member/User → "Cấp NPP trực tiếp"

Admin chọn:
- User target
- Package (optional — CAPITAL hoặc COMBO)
- Rank: AMBASSADOR / MANAGER / DIRECTOR
- Lý do (bắt buộc)
- Ghi chú (tùy chọn)

Submit:
→ Backend:
   1. Kiểm tra User chưa isNpp (hoặc xử lý idempotent)
   2. Cấp BID nếu chưa có (BusinessIdSequence)
   3. Update User: isNpp=true, nppActivatedAt=now(), rank, rankStatus
   4. Tạo RankHistory: reason="ADMIN_GRANT_NPP"
   5. Tạo NppActivation: {
        source: "ADMIN_GRANT",
        assignedRank, activatedBy, reason, note,
        paymentStatus: "UNPAID" hoặc admin chọn
      }
   6. KHÔNG tạo NppPurchase giả
   7. KHÔNG giả lập payment completed
```

### 7.2 Payment vs NPP status

```
Case 1: Admin Grant, chưa thu tiền
  User.isNpp = true
  User.nppActivationSource = "ADMIN_GRANT"
  NppActivation.paymentStatus = "UNPAID"

Case 2: Admin Grant, thu 1 phần
  User.isNpp = true
  NppActivation.paymentStatus = "PARTIAL"

Case 3: Purchase flow bình thường
  NppPurchase.isPaidInFull = true
  NppPurchase.status = "COMPLETED"
  → activate → User.isNpp = true
  User.nppActivationSource = "PURCHASE"
  NppActivation.source = "PURCHASE"
  NppActivation.paymentStatus = "PAID"
```

---

## 8. ACTIVATION SOURCE DESIGN

### 8.1 Enum values

| Source | Nghĩa | Trigger |
| :--- | :--- | :--- |
| `PURCHASE` | NPP activation qua purchase flow | NppPurchase COMPLETED + isPaidInFull |
| `ADMIN_GRANT` | Admin cấp trực tiếp | Admin click "Cấp NPP" |

### 8.2 Lưu trữ

- `User.nppActivationSource` — quick lookup
- `NppActivation.source` — full audit trail
- `NppActivation.activatedBy` — ai cấp
- `NppActivation.reason` — lý do

---

## 9. PAYMENT VS NPP STATUS

```
NPP Status:     User.isNpp (Boolean)
Payment Status:  NppPurchase.isPaidInFull / NppActivation.paymentStatus

Hai trạng thái ĐỘC LẬP.

╔══════════════════════════╦══════════════════════╦═════════════╗
║ Scenario                 ║ NPP Status           ║ Payment     ║
╠══════════════════════════╬══════════════════════╬═════════════╣
║ Registration only        ║ isNpp = false         ║ N/A         ║
║ Purchase NEW             ║ isNpp = false         ║ UNPAID      ║
║ Purchase DEPOSIT         ║ isNpp = false         ║ PARTIAL     ║
║ Purchase COMPLETED+PAID  ║ isNpp = true          ║ PAID        ║
║ Admin Grant (no payment) ║ isNpp = true          ║ UNPAID      ║
║ Admin Grant (partial)    ║ isNpp = true          ║ PARTIAL     ║
╚══════════════════════════╩══════════════════════╩═════════════╝
```

---

## 10. IDEMPOTENCY

### 10.1 Purchase activation

Giữ nguyên cơ chế hiện tại:
```sql
UPDATE NppPurchase 
SET settlementStatus = 'PROCESSING' 
WHERE id = ? AND settlementStatus = 'PENDING'
```
`changes === 1` → proceed. `changes === 0` → skip.

### 10.2 Admin Grant

```
IF User.isNpp === true:
  → Reject: "User đã là NPP ACTIVE. Không thể grant lại."
  → KHÔNG tạo BID mới
  → KHÔNG tạo duplicate RankHistory
  → KHÔNG duplicate NppActivation
```

### 10.3 BID

```
IF User.businessId !== null:
  → Giữ nguyên BID hiện tại
  → KHÔNG cấp BID mới
  → KHÔNG tăng BusinessIdSequence
```

---

## 11. RANK CONFLICT

### 11.1 Rule hiện tại

Phase 3.2.1 KHÔNG tự ý thay đổi rank cao hơn.

### 11.2 Detection

```
Khi activation (Purchase hoặc Admin Grant):

currentRank = User.rank
newRank = package.assignedRank hoặc Admin chọn

RANK_ORDER = { AMBASSADOR: 1, MANAGER: 2, DIRECTOR: 3 }

IF currentRank !== null AND RANK_ORDER[currentRank] > RANK_ORDER[newRank]:
  → STOP
  → Return error: "User hiện tại có rank [currentRank] cao hơn [newRank]. Không thể downgrade trong Phase này."
  → Log conflict trong NppActivation hoặc API response

IF currentRank === null OR RANK_ORDER[currentRank] <= RANK_ORDER[newRank]:
  → Proceed: gán newRank
```

### 11.3 Admin Grant override

Admin Grant có thể gán rank BẤT KỲ vì Admin quyết định. Nhưng nếu `newRank < currentRank`:
- Backend vẫn WARN nhưng KHÔNG block Admin
- Audit ghi rõ: "Admin override rank downgrade"

> [!IMPORTANT]
> **BUSINESS DECISION REQUIRED**: Admin Grant có được phép downgrade rank không?
> - Option A: Cho phép nhưng log warning
> - Option B: Block, Admin phải dùng chức năng riêng (chưa có)

---

## 12. MIGRATION PLAN

### 12.1 Schema changes

```prisma
// ═══ NppPackage: thêm 2 field ═══
model NppPackage {
  // ... existing fields ...
  packageType       String      @default("PRODUCT_COMBO")  // CAPITAL | PRODUCT_COMBO
  requiredQuantity  Int?        // Chỉ PRODUCT_COMBO, null cho CAPITAL
}

// ═══ User: thêm 2 field ═══
model User {
  // ... existing fields ...
  nppActivationSource   String?     // PURCHASE | ADMIN_GRANT
  nppActivatedBy        String?     // userId Admin
  // ... thêm relations ...
  nppRegistrations      NppRegistration[]  @relation("UserNppRegistrations")
  nppActivations        NppActivation[]    @relation("UserNppActivations")
}

// ═══ NEW: NppRegistration ═══
model NppRegistration { ... }  // Xem Section 2.1

// ═══ NEW: NppActivation ═══
model NppActivation { ... }    // Xem Section 2.2
```

### 12.2 Default values cho dữ liệu hiện tại

| Table | Field | Default | Lý do |
| :--- | :--- | :--- | :--- |
| `NppPackage` | `packageType` | `"PRODUCT_COMBO"` | Packages hiện tại (nếu có) được tạo theo logic combo |
| `NppPackage` | `requiredQuantity` | `null` | Chưa có data → OK |
| `User` | `nppActivationSource` | `null` | Chưa ai là NPP → OK |
| `User` | `nppActivatedBy` | `null` | Chưa ai là NPP → OK |

### 12.3 Existing data check

```
NppPackage: 0 records → migration an toàn
NppPackageItem: 0 records → migration an toàn  
NppPurchase: 0 records → migration an toàn
NppPayment: 0 records → migration an toàn
NppCommission: 0 records → migration an toàn
User.isNpp: tất cả = false → migration an toàn
```

> [!TIP]
> **ZERO existing NPP data**. Migration thêm field/model hoàn toàn an toàn, không cần data migration, chỉ cần schema migration.

### 12.4 Migration method

SQLite: `prisma db push` (shadow DB workaround đã biết).

### 12.5 Pre-migration checklist

1. ✅ Backup database (`dev.db.backup_phase3_2_1_stable`)
2. ✅ Backup schema (`schema.prisma.backup_phase3_2_1_stable`)
3. ✅ Git tag `phase-3.2-stable` từ commit `e511249`
4. ✅ SHA256 ghi nhận
5. ✅ Dry-run rollback verify

---

## 13. API PLAN

### 13.1 APIs mới

| # | Method | Route | Chức năng | Phase |
| :- | :--- | :--- | :--- | :--- |
| 1 | `POST` | `/api/npp/register` | User đăng ký NPP (chọn package) | 3.2.1 |
| 2 | `GET` | `/api/npp/packages/available` | Danh sách package active (cho User view) | 3.2.1 |
| 3 | `GET` | `/api/npp/my-registration` | User xem registration hiện tại | 3.2.1 |
| 4 | `POST` | `/api/admin/npp/grant` | Admin cấp NPP trực tiếp | 3.2.1 |
| 5 | `GET` | `/api/admin/npp/registrations` | Admin xem danh sách đăng ký | 3.2.1 |
| 6 | `PATCH` | `/api/admin/npp/registrations/:id/approve` | Admin duyệt đăng ký | 3.2.1 |
| 7 | `GET` | `/api/admin/npp/activations` | Admin xem lịch sử activation | 3.2.1 |

### 13.2 APIs sửa đổi

| # | Route | Thay đổi |
| :- | :--- | :--- |
| 1 | `POST /api/admin/npp/packages` | Thêm `packageType`, `requiredQuantity`. Cho phép `items: []` khi CAPITAL/PRODUCT_COMBO |
| 2 | `PUT /api/admin/npp/packages/:id` | Tương tự |
| 3 | `GET /api/admin/npp/packages` | Trả thêm `packageType`, `requiredQuantity` |

### 13.3 APIs KHÔNG triển khai Phase này

- ❌ `POST /api/npp/purchase` (Phase 3.3)
- ❌ `POST /api/admin/npp/purchases/:id/payment` (Phase 3.3)
- ❌ `POST /api/admin/npp/purchases/:id/activate` (Phase 3.3)
- ❌ Commission settlement
- ❌ F1/F2 calculation

---

## 14. ADMIN UI PLAN

### 14.1 Package Management (sửa AdminNppPackages.tsx)

Form tạo/sửa gói:

```
[Package Type ▼]  CAPITAL | PRODUCT COMBO

─── Nếu CAPITAL ───────────────────
Mã gói:       [NPP-300M        ]
Tên gói:      [Gói NPP 300M    ]
Mô tả:        [                 ]
Giá cố định:  [300000000        ]  → 300.000.000 ₫
Cấp bậc:      [MANAGER ▼        ]
Ẩn: Product, Quantity, Discount

─── Nếu PRODUCT COMBO ─────────────
Mã gói:       [COMBO-05         ]
Tên gói:      [Combo 5 máy      ]
Mô tả:        [                 ]
Số máy yêu cầu: [5              ]
Chiết khấu:   [2500             ]  → 25%
Cấp bậc:      [AMBASSADOR ▼     ]
Ẩn: Giá gốc, Product selection
```

### 14.2 Admin Grant (mới)

Trong trang Quản Lý CTV hoặc Members:

```
User row → [⚡ Cấp NPP]

Modal:
  User: Đại sứ 01 (0345678923)
  Package: [chọn ▼] (optional)
  Rank:    [AMBASSADOR ▼]
  Lý do:   [________________________] (bắt buộc)
  Ghi chú: [________________________]
  
  ⚠️ Cấp NPP sẽ:
  - Set NPP Active
  - Cấp BID nếu chưa có
  - Gán Rank được chọn
  - KHÔNG tạo purchase/payment

  [HỦY]  [XÁC NHẬN CẤP NPP]
```

### 14.3 Registration list (mới)

```
NPP → Đơn Đăng Ký NPP
  Danh sách NppRegistration:
  | User | Package | Ngày đăng ký | Status | Actions |
  |------|---------|-------------|--------|---------|
  | Đại sứ 01 | Combo 5 | 21/09/2026 | PENDING | [Duyệt] [Hủy] |
```

### 14.4 Activation history (mới)

```
NPP → Lịch Sử Kích Hoạt NPP
  | User | Source | Package | Rank | BID | Activated By | Date |
  |------|--------|---------|------|-----|-------------|------|
  | Đại sứ 01 | ADMIN_GRANT | NPP-300M | MANAGER | WK-10037 | Admin | 21/09 |
```

---

## 15. TEST PLAN

### A. CAPITAL Package Tests

| # | Test | Expected |
| :- | :--- | :--- |
| 1 | Tạo package CAPITAL 300M | PASS, `packageType=CAPITAL`, `grossPrice=300M` |
| 2 | CAPITAL không cho ProductItem | items=[] OK |
| 3 | Giá cố định 300M | PASS |
| 4 | Rank = MANAGER | PASS |

### B. PRODUCT COMBO Tests

| # | Test | Expected |
| :- | :--- | :--- |
| 5 | Combo 5 (requiredQuantity=5) | PASS |
| 6 | Combo 10 (requiredQuantity=10) | PASS |
| 7 | Chọn đúng qty → PASS | Sum qty = requiredQuantity |
| 8 | Chọn thiếu qty → FAIL | `4 !== 5` → reject |
| 9 | Chọn dư qty → FAIL | `6 !== 5` → reject |
| 10 | Product không hợp lệ → FAIL | productId not found → reject |
| 11 | Client gửi fake price | Backend load từ Product Master |
| 12 | Discount tính đúng | `145M × 25% = 36.25M` |

### C. Registration Tests

| # | Test | Expected |
| :- | :--- | :--- |
| 13 | User đăng ký NPP → chưa ACTIVE | isNpp=false |
| 14 | Chưa cấp BID | businessId=null |
| 15 | Package selection lưu đúng | NppRegistration.packageId correct |

### D. Admin Grant Tests

| # | Test | Expected |
| :- | :--- | :--- |
| 16 | Admin grant → NPP ACTIVE | isNpp=true |
| 17 | Audit lưu admin + reason + timestamp | NppActivation record complete |
| 18 | Grant không tạo duplicate BID | businessId giữ nguyên nếu đã có |
| 19 | Grant không giả lập payment | Không NppPurchase tạo |
| 20 | Payment status PARTIAL/UNPAID | NppActivation.paymentStatus correct |

### E. Regression Tests

| # | Test | Expected |
| :- | :--- | :--- |
| 21 | CTV flow PASS | isSystemParticipant workflow OK |
| 22 | Product CRUD PASS | Admin Products unchanged |
| 23 | Order flow PASS | Website/CTV orders unchanged |
| 24 | Commission tests PASS | CTV commission unaffected |

---

## 16. BACKWARD COMPATIBILITY

| Component | Impact | Action |
| :--- | :--- | :--- |
| CTV Users | NONE | Không sửa `isSystemParticipant`, `parentId` |
| Customer | NONE | NPP dùng User, không Customer |
| Product | NONE | Chỉ read Product.price |
| Order | NONE | Không sửa Order model |
| Commission (CTV) | NONE | Không sửa Commission model |
| CommissionPeriod | NONE | Chỉ read-only |
| NppPackage CRUD APIs | MODIFIED | Thêm `packageType`, `requiredQuantity`, cho phép empty items |
| Admin UI | MODIFIED | Form thêm packageType selector |
| Existing NppPackage data | SAFE | 0 records → no data migration needed |

---

## 17. ROLLBACK PLAN

```
1. Git tag: phase-3.2-stable → commit e511249
2. Database backup: dev.db.backup_phase3_2_1_stable
3. Schema backup: schema.prisma.backup_phase3_2_1_stable
4. Rollback script: scripts/rollback_phase3_2_1.sh
   - Restore dev.db from backup
   - Restore schema.prisma from backup
   - prisma generate
   - pm2 restart happylife-backend
   - git checkout phase-3.2-stable
   - npx vite build && pm2 restart wasypro
```

---

## OPEN QUESTIONS / BUSINESS DECISIONS REQUIRED

> [!IMPORTANT]
> ### Q1: `grossPrice` cho PRODUCT_COMBO
> Package PRODUCT_COMBO không có giá cố định (giá tính từ Product user chọn). `grossPrice` BigInt NOT NULL trên NppPackage hiện tại.
> 
> **Đề xuất**: Set `grossPrice = 0n` cho PRODUCT_COMBO (sentinel). Backend ignore giá này khi tạo purchase.
> 
> **Cần xác nhận**: Đồng ý dùng `0n` sentinel hay muốn thay đổi field thành nullable?

> [!IMPORTANT]
> ### Q2: Admin Grant có được phép downgrade rank?
> Ví dụ: User đang MANAGER, Admin grant với rank AMBASSADOR.
> 
> **Option A**: Cho phép + log warning
> **Option B**: Block downgrade trong Admin Grant

> [!IMPORTANT]
> ### Q3: NppRegistration có cần 1 user chỉ 1 registration active?
> Nếu User đăng ký Combo 5 rồi đổi ý muốn đăng ký NPP-300M:
> 
> **Option A**: Cancel cái cũ, tạo mới (1 active tại một thời điểm)
> **Option B**: Cho phép nhiều registration cùng lúc, Admin chọn duyệt cái nào

---

## DESIGN STATUS

```
╔════════════════════════════════════════════════╗
║  DESIGN STATUS: NEED BUSINESS DECISION        ║
║                                                ║
║  3 câu hỏi Q1, Q2, Q3 cần owner trả lời      ║
║  trước khi implement.                          ║
║                                                ║
║  Schema design: READY                          ║
║  API design: READY                             ║
║  UI design: READY                              ║
║  Migration plan: READY                         ║
║  Test plan: READY                              ║
║  Rollback plan: READY                          ║
║                                                ║
║  Chờ approval 3 Business Decisions → implement ║
╚════════════════════════════════════════════════╝
```
