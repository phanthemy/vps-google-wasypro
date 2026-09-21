# NPP_PHASE_3_2_1_DESIGN_FINAL.md
**Phase**: 3.2.1 — NPP Registration + Package Type + Admin Grant  
**Status**: DESIGN FINAL — READY FOR IMPLEMENTATION  
**Baseline**: Phase 3.2 PASS (commit `e511249`)  
**Business Decisions**: 3/3 CONFIRMED by owner

---

## BUSINESS DECISIONS CONFIRMED

| # | Question | Decision |
| :- | :--- | :--- |
| Q1 | `grossPrice` cho PRODUCT_COMBO | **NULLABLE**. CAPITAL = bắt buộc, PRODUCT_COMBO = NULL. Không dùng sentinel. |
| Q2 | Admin Grant rank downgrade | **KHÔNG cho phép**. Chỉ ngang hoặc lên: AMB→MGR ✅, AMB→DIR ✅, MGR→DIR ✅, MGR→AMB ❌ |
| Q3 | Multiple registration | **KHÔNG**. 1 User = 1 registration active/pending. Đổi package → cancel cũ, tạo mới. Giữ lịch sử. |

---

## 1. PACKAGE TYPE DESIGN

### 1.1 Enum values

| Value | Mô tả | grossPrice | items | requiredQuantity |
| :--- | :--- | :--- | :--- | :--- |
| `CAPITAL` | Gói tiền cố định (300M, 2B) | **Bắt buộc** (BigInt) | **Rỗng** | `null` |
| `PRODUCT_COMBO` | Gói máy combo (5, 10, 20 máy) | **NULL** | **Rỗng** (user chọn khi mua) | **Bắt buộc** (Int) |

### 1.2 CAPITAL Package

```
code: "NPP-300M"
name: "Gói NPP Chiến Lược 300M"
packageType: "CAPITAL"
grossPrice: 300000000n        ← bắt buộc
defaultDiscount: 0            ← CAPITAL không discount
requiredQuantity: null         ← không Product
assignedRank: "MANAGER"
items: []                      ← rỗng
```

Purchase flow:
- Không chọn Product.
- `grossPrice` = package.grossPrice (cố định).
- Discount = 0.
- `netPayableAmount` = `grossPrice`.
- Thanh toán đủ → COMPLETED → activate NPP.

### 1.3 PRODUCT_COMBO Package

```
code: "COMBO-05"
name: "Combo 5 máy"
packageType: "PRODUCT_COMBO"
grossPrice: null               ← KHÔNG có giá cố định
defaultDiscount: 2500          ← 25% BPS
requiredQuantity: 5            ← bắt buộc đúng 5 máy
assignedRank: "AMBASSADOR"
items: []                      ← rỗng (user tự chọn model khi mua)
```

Purchase flow:
- User chọn N Product (sum qty === requiredQuantity).
- Backend load Product.price từ DB.
- `grossProductValue` = sum(product.price × qty).
- `discountAmount` = grossProductValue × defaultDiscount / 10000.
- `netPayableAmount` = grossProductValue − discountAmount.
- Snapshot selected products + giá vào `packageSnapshot`.

### 1.4 NppPackageItem role

NppPackageItem **không bắt buộc** cho cả 2 loại.

Hiện tại 0 records trong DB → không cần data migration.

Giữ model trong schema cho tương lai (Admin muốn quy định eligible products cho combo). Phase này KHÔNG dùng.

---

## 2. NPP REGISTRATION DESIGN

### 2.1 Model

```prisma
model NppRegistration {
  id              String      @id @default(cuid())
  userId          String
  packageId       String
  status          String      @default("PENDING")
  // PENDING | APPROVED | CANCELLED | REPLACED | CONVERTED
  note            String?
  cancelReason    String?     // Lý do cancel/replace
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User        @relation("UserNppRegistrations", fields: [userId], references: [id])
  package         NppPackage  @relation(fields: [packageId], references: [id])

  @@index([userId])
  @@index([packageId])
  @@index([status])
}
```

### 2.2 Status flow

```
PENDING ─→ APPROVED ─→ CONVERTED (tạo NppPurchase)
   │
   ├─→ CANCELLED (user hoặc admin hủy)
   │
   └─→ REPLACED (user đổi sang package khác → registration mới PENDING)
```

### 2.3 Single active constraint

```
Khi user submit registration mới:
1. Tìm registration PENDING/APPROVED hiện tại:
   SELECT FROM NppRegistration
   WHERE userId = ? AND status IN ('PENDING', 'APPROVED')
2. Nếu tìm thấy → chuyển status = 'REPLACED', cancelReason = 'Đổi sang package [newCode]'
3. Tạo registration mới status = 'PENDING'
4. KHÔNG xóa registration cũ (giữ lịch sử)
```

### 2.4 Registration ≠ NPP

Registration KHÔNG:
- Set `isNpp = true`
- Cấp BID
- Thay đổi rank
- Tạo NppPurchase
- Tạo NppPayment

---

## 3. NPP ACTIVATION DESIGN (Admin Grant audit trail)

### 3.1 Model

```prisma
model NppActivation {
  id                String      @id @default(cuid())
  userId            String
  source            String      // PURCHASE | ADMIN_GRANT
  packageId         String?     // Package liên quan (optional cho Admin Grant)
  purchaseId        String?     // FK NppPurchase.id nếu source=PURCHASE
  assignedRank      String      // AMBASSADOR | MANAGER | DIRECTOR
  previousRank      String?     // Rank trước đó (null nếu chưa có)
  allocatedBid      String?     // BID cấp trong activation này (null nếu đã có BID)
  activatedBy       String      // userId Admin hoặc "SYSTEM"
  reason            String?     // Bắt buộc cho ADMIN_GRANT
  note              String?
  paymentStatus     String?     // PAID | PARTIAL | UNPAID (cho Admin Grant)
  createdAt         DateTime    @default(now())

  user              User        @relation("UserNppActivations", fields: [userId], references: [id])
  package           NppPackage? @relation("ActivationPackage", fields: [packageId], references: [id])

  @@index([userId])
  @@index([source])
}
```

### 3.2 Admin Grant flow

```
Admin chọn User → "Cấp NPP"
→ Admin nhập: Package (optional), Rank, Lý do (bắt buộc), Ghi chú

Backend:
1. Check User.isNpp
   → true:
      Check rank upgrade allowed (no downgrade)
      Nếu newRank > currentRank → upgrade rank, tạo RankHistory, tạo NppActivation
      Nếu newRank <= currentRank → reject "Không cho phép hạ rank"
   → false:
      Proceed activation

2. Cấp BID nếu User.businessId === null
   → BusinessIdSequence atomic increment
   → User.businessId = "WK-{nextVal}"

3. Update User:
   isNpp = true
   nppActivatedAt = now()  (giữ nguyên nếu đã ACTIVE và đang upgrade rank)
   nppActivationSource = "ADMIN_GRANT"
   nppActivatedBy = adminUserId
   rank = assignedRank
   rankStatus = "ACTIVE_RANK"

4. Tạo RankHistory:
   reason = "ADMIN_GRANT_NPP"
   triggeredBy = adminUserId

5. Tạo NppActivation:
   source = "ADMIN_GRANT"
   paymentStatus = "UNPAID" / "PARTIAL" (Admin chọn)

6. KHÔNG tạo NppPurchase
7. KHÔNG giả lập payment
```

### 3.3 Purchase activation flow

```
NppPurchase.status = COMPLETED + isPaidInFull = true
→ Atomic CAS: settlementStatus PENDING → PROCESSING

1. Read User
2. Cấp BID nếu chưa có
3. Update User: isNpp=true, nppActivationSource="PURCHASE"
4. RankHistory: reason="NPP_PURCHASE_ACTIVATION"
5. NppActivation: source="PURCHASE", purchaseId, paymentStatus="PAID"
6. settlementStatus → SETTLED
```

---

## 4. RANK UPGRADE / NO DOWNGRADE

### 4.1 Rank order

```javascript
const RANK_ORDER = { AMBASSADOR: 1, MANAGER: 2, DIRECTOR: 3 };
```

### 4.2 Validation

```javascript
function validateRankChange(currentRank, newRank) {
  if (!currentRank) return { allowed: true }; // Chưa có rank → OK
  
  const current = RANK_ORDER[currentRank];
  const target = RANK_ORDER[newRank];
  
  if (!current || !target) return { allowed: false, error: 'Invalid rank' };
  if (target < current) return { allowed: false, error: `Không cho phép hạ rank từ ${currentRank} xuống ${newRank}` };
  if (target === current) return { allowed: true, sameRank: true }; // Giữ nguyên, skip
  return { allowed: true }; // Upgrade
}
```

### 4.3 Application

| Scenario | Current Rank | New Rank | Result |
| :--- | :--- | :--- | :--- |
| First NPP | null | AMBASSADOR | ✅ Proceed |
| Purchase upgrade | AMBASSADOR | MANAGER | ✅ Proceed |
| Admin Grant upgrade | MANAGER | DIRECTOR | ✅ Proceed |
| Same rank | AMBASSADOR | AMBASSADOR | ✅ Skip (no RankHistory) |
| Downgrade attempt | DIRECTOR | AMBASSADOR | ❌ Reject |
| Downgrade attempt | MANAGER | AMBASSADOR | ❌ Reject |

---

## 5. PAYMENT STATUS VS NPP STATUS

Hai trạng thái **HOÀN TOÀN ĐỘC LẬP**.

```
╔══════════════════════════════╦═══════════╦══════════════╗
║ Scenario                     ║ isNpp     ║ Payment      ║
╠══════════════════════════════╬═══════════╬══════════════╣
║ Chưa đăng ký                ║ false     ║ N/A          ║
║ Registration PENDING         ║ false     ║ N/A          ║
║ Purchase NEW                 ║ false     ║ UNPAID       ║
║ Purchase DEPOSIT             ║ false     ║ PARTIAL      ║
║ Purchase COMPLETED + PAID    ║ true      ║ PAID         ║
║ Admin Grant (no payment)     ║ true      ║ UNPAID       ║
║ Admin Grant (partial paid)   ║ true      ║ PARTIAL      ║
╚══════════════════════════════╩═══════════╩══════════════╝
```

`User.isNpp = true` KHÔNG có nghĩa `isPaidInFull = true`.

---

## 6. IDEMPOTENCY

### 6.1 Purchase activation

```sql
-- Atomic CAS: chỉ 1 request thắng
UPDATE NppPurchase 
SET settlementStatus = 'PROCESSING' 
WHERE id = ? AND settlementStatus = 'PENDING'
-- changes === 1 → proceed
-- changes === 0 → skip
```

### 6.2 Admin Grant

```
IF User.isNpp === true AND newRank <= currentRank:
  → Reject: "User đã là NPP với rank [currentRank]. Không thể grant rank thấp hơn hoặc bằng."
  → KHÔNG tạo duplicate BID
  → KHÔNG duplicate NppActivation cho cùng rank
```

### 6.3 BID

```
IF User.businessId !== null:
  → Giữ nguyên
  → KHÔNG tăng BusinessIdSequence
  → KHÔNG gán BID mới
```

---

## 7. PRODUCT.PRICE FLOAT RISK ASSESSMENT

### 7.1 Hiện trạng

| Model | Field | Type | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `Product` | `price` | `Float` | Giá sản phẩm (VNĐ) |
| `Product` | `originalPrice` | `Float?` | Giá gốc trước khuyến mại |
| `Service` | `price` | `Float` | Giá dịch vụ (VNĐ) |
| `Order` | `totalAmount` | `Float` | Tổng đơn hàng |
| `OrderItem` | `amount` | `Float` | Giá item |
| `Commission` | `amount` | `Float` | Hoa hồng CTV |
| `WebsiteOrder` | `productPrice` | `Float` | Giá product snapshot |
| `WebsiteOrder` | `totalAmount` | `Float` | Tổng đơn |

**Toàn bộ CTV/Order/Commission system dùng Float.** Chỉ NPP system (Phase 3.1+) dùng BigInt.

### 7.2 Product.price được sử dụng ở đâu

| Location | Usage | Description |
| :--- | :--- | :--- |
| `server/index.js:2431` | `prod.price * qty` | CTV Order item amount fallback |
| `server/index.js:3476` | `Number(price)` | Admin Product update |
| `server/index.js:3646` | `Number(req.body.price)` | Admin Product create |
| `server/index.js:5557` | `prod.price` | WebsiteOrder shadow order item price |
| `server/index.js:5212` | `svc.price` | Commission rule lookup |
| Admin UI | Display | Package item product price display |
| CTV Portal | Display | Product price display |

### 7.3 Order/WebsiteOrder price snapshot

- **CTV Order**: `OrderItem.amount = Number(item.amount) || (prod.price * qty)` → Float × Int = Float. Snapshot tại order creation.
- **WebsiteOrder**: `productPrice` field lưu client-sent price. Backend cũng load `prod.price` cho shadow order. Float.
- **Commission**: `Commission.amount` = Float. Tính từ Float price.

### 7.4 Actual data audit

```
Tất cả 10 Product hiện tại:
price = 100000.0, 75000.0, 19000000.0, ...
Fractional part = 0.0 (tất cả)

VNĐ KHÔNG CÓ PHẦN THẬP PHÂN.
Tất cả giá hiện tại đều là số nguyên lưu dưới dạng Float.
```

### 7.5 NPP COMBO có thể tính chính xác không?

**CÓ, NHƯNG CẦN CONVERSION HELPER.**

Lý do:
- `Product.price` = Float (ví dụ: `19000000.0`)
- NPP Purchase money fields = BigInt
- Phải convert: `Float → BigInt` trước khi tính

Risk phân tích:

```javascript
// Product.price = 19000000.0 (Float)
// Cần chuyển sang BigInt

const productPrice = 19000000.0; // Float from DB
const priceBigInt = BigInt(Math.round(productPrice)); // = 19000000n ✅

// VÌ SAO Math.round AN TOÀN:
// 1. VNĐ không có phần thập phân
// 2. Giá cao nhất = 45.000.000 VNĐ << Number.MAX_SAFE_INTEGER (9.007 × 10^15)
// 3. Tất cả Product.price hiện tại đều có fractional = 0.0
// 4. Float IEEE-754 biểu diễn chính xác số nguyên ≤ 2^53
```

**Kết luận**: NPP Combo CÓ THỂ tính chính xác bằng architecture hiện tại với conversion helper.

### 7.6 Money conversion helper cho NPP

```javascript
/**
 * Convert Float VNĐ price to BigInt.
 * SAFE vì VNĐ không có phần thập phân,
 * và tất cả giá Product hiện tại < Number.MAX_SAFE_INTEGER.
 * 
 * @param {number} floatPrice - Product.price (Float)
 * @returns {bigint} - Price as BigInt
 * @throws {Error} - Nếu price có phần thập phân (bảo vệ tương lai)
 */
function floatPriceToBigInt(floatPrice) {
  const rounded = Math.round(floatPrice);
  if (Math.abs(floatPrice - rounded) > 0.01) {
    throw new Error(`Product price ${floatPrice} has fractional part. Cannot safely convert to BigInt.`);
  }
  return BigInt(rounded);
}
```

Guard: nếu tương lai ai nhập giá lẻ (ví dụ 19999999.5), helper sẽ throw error thay vì âm thầm mất precision.

### 7.7 Cross-system Product.price migration

> [!WARNING]
> **KHÔNG migrate Product.price trong Phase này.**
> 
> Product.price Float → BigInt là **cross-system change** ảnh hưởng:
> - Product CRUD API (Admin)
> - CTV Order creation
> - WebsiteOrder creation  
> - Commission calculation
> - Wholesale Order
> - Admin UI display
> - CTV Portal display
> - All existing data (10 products, tất cả orders, commissions)
> 
> Phải tách thành Phase riêng nếu muốn thống nhất toàn bộ system sang BigInt.
> 
> Phase 3.2.1 dùng **conversion helper** tại ranh giới NPP.

---

## 8. SCHEMA CHANGES — FINAL

### 8.1 NppPackage — Modify

```prisma
model NppPackage {
  id              String           @id @default(cuid())
  code            String           @unique
  name            String
  description     String?
  
  // ═══ CHANGED: nullable cho PRODUCT_COMBO ═══
  grossPrice      BigInt?          // Bắt buộc cho CAPITAL, NULL cho PRODUCT_COMBO
  
  defaultDiscount Int              @default(0) // BPS. CAPITAL = 0, PRODUCT_COMBO = discount %
  assignedRank    String           @default("AMBASSADOR")
  isActive        Boolean          @default(true)
  
  // ═══ NEW ═══
  packageType     String           @default("PRODUCT_COMBO") // CAPITAL | PRODUCT_COMBO
  requiredQuantity Int?            // PRODUCT_COMBO: số máy bắt buộc. CAPITAL: null
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  items           NppPackageItem[]
  purchases       NppPurchase[]
  
  // ═══ NEW relations ═══
  registrations   NppRegistration[]
  activations     NppActivation[]  @relation("ActivationPackage")
}
```

> [!IMPORTANT]
> **grossPrice thay đổi từ `BigInt` (NOT NULL) → `BigInt?` (NULLABLE).**
> 
> Existing data: 0 records → an toàn.
> 
> Nhưng `NppPurchase.grossPrice` vẫn là `BigInt` NOT NULL (purchase luôn có giá cụ thể tại thời điểm mua).

### 8.2 User — Add fields

```prisma
model User {
  // ... existing fields ...
  
  // ═══ NEW ═══
  nppActivationSource   String?   // PURCHASE | ADMIN_GRANT
  nppActivatedBy        String?   // userId Admin (cho ADMIN_GRANT)

  // ═══ NEW relations ═══
  nppRegistrations      NppRegistration[]  @relation("UserNppRegistrations")
  nppActivations        NppActivation[]    @relation("UserNppActivations")
}
```

### 8.3 NppRegistration — New model

```prisma
model NppRegistration {
  id              String      @id @default(cuid())
  userId          String
  packageId       String
  status          String      @default("PENDING")
  // PENDING | APPROVED | CANCELLED | REPLACED | CONVERTED
  note            String?
  cancelReason    String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User        @relation("UserNppRegistrations", fields: [userId], references: [id])
  package         NppPackage  @relation(fields: [packageId], references: [id])

  @@index([userId])
  @@index([packageId])
  @@index([status])
}
```

### 8.4 NppActivation — New model

```prisma
model NppActivation {
  id                String      @id @default(cuid())
  userId            String
  source            String      // PURCHASE | ADMIN_GRANT
  packageId         String?
  purchaseId        String?
  assignedRank      String
  previousRank      String?
  allocatedBid      String?
  activatedBy       String
  reason            String?
  note              String?
  paymentStatus     String?     // PAID | PARTIAL | UNPAID
  createdAt         DateTime    @default(now())

  user              User        @relation("UserNppActivations", fields: [userId], references: [id])
  package           NppPackage? @relation("ActivationPackage", fields: [packageId], references: [id])

  @@index([userId])
  @@index([source])
}
```

### 8.5 Existing models — NO CHANGE

| Model | Change | Note |
| :--- | :--- | :--- |
| NppPackageItem | NONE | Giữ nguyên. Phase này không dùng. |
| NppPurchase | NONE | Phase 3.3 mới dùng. |
| NppPayment | NONE | Phase 3.3. |
| NppCommission | NONE | Phase 3.3+. |
| RankHistory | NONE | Đã có nppPurchaseId, effectiveFrom/To. |
| Product | NONE | **KHÔNG migrate Product.price.** |
| Order | NONE | |
| Commission | NONE | |
| Customer | NONE | |
| CommissionPeriod | NONE | |

---

## 9. MIGRATION PLAN

### 9.1 Pre-migration

```
1. Git tag: phase-3.2-stable → commit e511249
2. Backup: dev.db.backup_phase3_2_1_pre
3. Backup: schema.prisma.backup_phase3_2_1_pre
4. SHA256 record
5. Rollback script ready
```

### 9.2 Schema migration

```
Method: prisma db push (SQLite shadow DB workaround)

Changes:
1. NppPackage: ADD packageType String DEFAULT "PRODUCT_COMBO"
2. NppPackage: ADD requiredQuantity Int? (nullable)
3. NppPackage: MODIFY grossPrice BigInt → BigInt? (nullable)
4. User: ADD nppActivationSource String? (nullable)
5. User: ADD nppActivatedBy String? (nullable)
6. CREATE TABLE NppRegistration (...)
7. CREATE TABLE NppActivation (...)
```

### 9.3 Existing data impact

```
NppPackage: 0 records → SAFE
User: nppActivationSource/nppActivatedBy = null (default) → SAFE
NppRegistration: new table → SAFE
NppActivation: new table → SAFE
```

### 9.4 Migration audit SQL

```sql
-- Verify migration
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('NppRegistration', 'NppActivation');
-- Expected: 2 rows

-- Verify NppPackage columns
PRAGMA table_info(NppPackage);
-- Should include: packageType, requiredQuantity

-- Verify User columns
PRAGMA table_info(User);
-- Should include: nppActivationSource, nppActivatedBy
```

---

## 10. API PLAN

### 10.1 New APIs

| # | Method | Route | Auth | Chức năng |
| :- | :--- | :--- | :--- | :--- |
| 1 | `GET` | `/api/npp/packages/available` | authenticated | Danh sách package active (cho user) |
| 2 | `POST` | `/api/npp/register` | authenticated | User đăng ký NPP |
| 3 | `GET` | `/api/npp/my-registration` | authenticated | User xem registration |
| 4 | `POST` | `/api/admin/npp/grant` | admin | Admin cấp NPP trực tiếp |
| 5 | `GET` | `/api/admin/npp/registrations` | admin | Danh sách đăng ký |
| 6 | `PATCH` | `/api/admin/npp/registrations/:id/status` | admin | Duyệt/hủy đăng ký |
| 7 | `GET` | `/api/admin/npp/activations` | admin | Lịch sử activation |

### 10.2 Modified APIs

| # | Route | Change |
| :- | :--- | :--- |
| 1 | `POST /api/admin/npp/packages` | Thêm `packageType`, `requiredQuantity`. `grossPrice` nullable khi PRODUCT_COMBO. Validation theo type. `items` optional cho cả 2 type. |
| 2 | `PUT /api/admin/npp/packages/:id` | Tương tự |
| 3 | `GET /api/admin/npp/packages` | Trả thêm `packageType`, `requiredQuantity` |
| 4 | `GET /api/admin/npp/packages/:id` | Trả thêm `packageType`, `requiredQuantity` |

### 10.3 API detail: POST /api/admin/npp/grant

```
Request:
{
  userId: "cuid...",       // User target
  packageId: "cuid..." | null,  // Package reference (optional)
  assignedRank: "MANAGER",
  reason: "Đối tác chiến lược",  // Bắt buộc
  note: "Ghi chú...",     // Optional
  paymentStatus: "UNPAID" | "PARTIAL"  // Optional, default "UNPAID"
}

Response (success):
{
  success: true,
  message: "Đã cấp NPP cho [fullName]",
  data: {
    userId, fullName, businessId, rank, isNpp,
    activation: { id, source, assignedRank, activatedBy, ... }
  }
}

Response (reject - already NPP, no upgrade):
{
  success: false,
  error: "User đã là NPP ACTIVE với rank DIRECTOR. Không có upgrade khả dụng."
}

Response (reject - downgrade):
{
  success: false,
  error: "Không cho phép hạ rank từ MANAGER xuống AMBASSADOR."
}
```

### 10.4 API detail: POST /api/npp/register

```
Request:
{
  packageId: "cuid..."
}

Response (success):
{
  success: true,
  message: "Đã đăng ký NPP. Vui lòng chờ xử lý.",
  data: { id, userId, packageId, status: "PENDING", ... }
}

Response (already NPP):
{
  success: false,
  error: "Bạn đã là NPP ACTIVE."
}

Response (replaced previous):
{
  success: true,
  message: "Đã đổi đăng ký sang gói [packageName]. Đăng ký cũ đã được hủy.",
  data: { ... }
}
```

### 10.5 APIs KHÔNG làm Phase này

- ❌ `POST /api/npp/purchase` (Phase 3.3)
- ❌ `POST /api/admin/npp/purchases/:id/payment` (Phase 3.3)
- ❌ `POST /api/admin/npp/purchases/:id/activate` (Phase 3.3)
- ❌ NPP Commission settlement
- ❌ F1/F2 commission

---

## 11. ADMIN UI PLAN

### 11.1 Package form (Sửa AdminNppPackages.tsx)

Thêm Package Type selector đầu form:

```
Package Type: [● CAPITAL  ○ PRODUCT COMBO]

─── CAPITAL ─────────────────────────
Mã gói *        [NPP-300M          ]
Tên gói *       [Gói NPP 300M      ]
Mô tả           [                   ]
Giá cố định *   [300000000          ] → 300.000.000 ₫
Cấp bậc *       [MANAGER ▼          ]
[ Ẩn: Số máy, Chiết khấu, Product ]

─── PRODUCT COMBO ───────────────────
Mã gói *        [COMBO-05           ]
Tên gói *       [Combo 5 máy        ]
Mô tả           [                   ]
Số máy *        [5                  ]
Chiết khấu *    [2500               ] → 25%
Cấp bậc *       [AMBASSADOR ▼       ]
[ Ẩn: Giá cố định ]
```

Package list card cũng hiển thị badge type: `[CAPITAL]` hoặc `[COMBO 5]`.

### 11.2 Admin Grant (Nút "Cấp NPP" trong member/CTV list)

Thêm nút vào existing admin page (AdminCTVManagement hoặc AdminMembersView):

```
User row → [⚡ Cấp NPP]

Modal "Cấp NPP trực tiếp":
┌─────────────────────────────────────┐
│ Cấp NPP cho: Nguyễn Văn A (U958)  │
│                                     │
│ Package:  [chọn ▼] (tùy chọn)     │
│ Rank:     [AMBASSADOR ▼]           │
│ Lý do *:  [________________________]│
│ Ghi chú:  [________________________]│
│ TT tiền:  [UNPAID ▼]              │
│                                     │
│ ⚠️ Hành động này sẽ:               │
│ • Set NPP Active                   │
│ • Cấp BID nếu chưa có             │
│ • Gán rank được chọn               │
│                                     │
│ [Hủy]          [Xác nhận cấp NPP] │
└─────────────────────────────────────┘
```

### 11.3 Registration list — Sub-tab trong NPP section

### 11.4 Activation history — Sub-tab trong NPP section

---

## 12. TEST PLAN

### A. CAPITAL Package (4 tests)

| # | Test | Expected |
| :- | :--- | :--- |
| 1 | Tạo CAPITAL 300M | packageType=CAPITAL, grossPrice=300M |
| 2 | CAPITAL items rỗng | items=[] OK |
| 3 | CAPITAL giá cố định | grossPrice=300M stored |
| 4 | CAPITAL rank=MANAGER | assignedRank=MANAGER |

### B. PRODUCT_COMBO (8 tests)

| # | Test | Expected |
| :- | :--- | :--- |
| 5 | Combo 5 requiredQty=5 | PASS |
| 6 | Combo 10 requiredQty=10 | PASS |
| 7 | PRODUCT_COMBO grossPrice=null | PASS |
| 8 | PRODUCT_COMBO defaultDiscount=2500 | 25% stored |
| 9 | PRODUCT_COMBO items rỗng | PASS |
| 10 | COMBO giá tính từ Product | Verify at purchase (Phase 3.3) |
| 11 | COMBO requiredQuantity là Int | Validate input |
| 12 | COMBO discount BPS validate | 0-10000 range |

### C. Registration (5 tests)

| # | Test | Expected |
| :- | :--- | :--- |
| 13 | User đăng ký → chưa ACTIVE | isNpp=false |
| 14 | Chưa cấp BID | businessId=null |
| 15 | Package lưu đúng | NppRegistration.packageId |
| 16 | Đổi package → old=REPLACED, new=PENDING | Status transition |
| 17 | User đã NPP → reject register | Error message |

### D. Admin Grant (5 tests)

| # | Test | Expected |
| :- | :--- | :--- |
| 18 | Grant → NPP ACTIVE | isNpp=true |
| 19 | Audit trail complete | NppActivation record |
| 20 | No duplicate BID | businessId unchanged |
| 21 | No fake payment | No NppPurchase created |
| 22 | Rank downgrade → reject | Error message |

### E. Regression (4 tests)

| # | Test | Expected |
| :- | :--- | :--- |
| 23 | CTV flow | isSystemParticipant OK |
| 24 | Product CRUD | Admin Products OK |
| 25 | Order flow | Orders OK |
| 26 | Commission | CTV commission OK |

---

## 13. BACKWARD COMPATIBILITY

| Component | Impact | Detail |
| :--- | :--- | :--- |
| CTV system | NONE | isSystemParticipant/parentId untouched |
| Customer | NONE | NPP uses User directly |
| Product | NONE | Only read Product.price, no schema change |
| Product.price Float | RISK MANAGED | Conversion helper at NPP boundary |
| Order/WebsiteOrder | NONE | No changes |
| Commission (CTV) | NONE | No changes |
| CommissionPeriod | NONE | Read-only |
| Existing NppPackage CRUD | MODIFIED | Add packageType/requiredQuantity, grossPrice nullable |
| Existing NppPackage data | SAFE | 0 records |
| Admin UI | MODIFIED | Form adds type selector |

---

## 14. ROLLBACK PLAN

```
Tag: phase-3.2-stable → commit e511249
DB backup: dev.db.backup_phase3_2_1_pre
Schema backup: schema.prisma.backup_phase3_2_1_pre

Rollback steps:
1. cp dev.db.backup_phase3_2_1_pre dev.db
2. cp schema.prisma.backup_phase3_2_1_pre prisma/schema.prisma
3. npx prisma generate
4. pm2 restart happylife-backend
5. git checkout phase-3.2-stable
6. cd /var/www/wasypro && npx vite build
7. pm2 restart wasypro

Preserve: phase-3.1-stable tag (never delete)
```

---

## FILES TO CREATE/MODIFY

### New files:
1. `server/prisma/schema.prisma` — Add NppRegistration, NppActivation models + modify NppPackage, User
2. `server/helpers/nppMoney.js` — `floatPriceToBigInt()` helper
3. `src/components/admin/AdminNppPackages.tsx` — Modify for packageType
4. Admin Grant UI component (in existing admin page)

### Modified files:
1. `server/index.js` — New APIs (register, grant, registration list) + modify Package CRUD
2. `src/components/admin/AdminSidebar.tsx` — NPP sub-sections if needed
3. `src/App.tsx` — Tab routing for new views

---

## DESIGN STATUS

```
╔═══════════════════════════════════════════════════════════════════╗
║  DESIGN STATUS: READY FOR IMPLEMENTATION                        ║
║                                                                   ║
║  ✅ 3 Business Decisions confirmed                               ║
║  ✅ Package Type (CAPITAL / PRODUCT_COMBO) designed               ║
║  ✅ NppRegistration designed (single active, history preserved)   ║
║  ✅ NppActivation designed (audit trail for both PURCHASE/GRANT)  ║
║  ✅ Admin Grant flow designed (no downgrade, idempotent)          ║
║  ✅ Rank upgrade/no downgrade validation designed                 ║
║  ✅ Payment vs NPP status independence confirmed                 ║
║  ✅ Product.price Float risk assessed + conversion helper         ║
║  ✅ Migration plan ready (0 existing data → safe)                 ║
║  ✅ API plan ready (7 new + 4 modified)                           ║
║  ✅ Admin UI plan ready                                           ║
║  ✅ Test plan ready (26 tests)                                    ║
║  ✅ Backward compatibility verified                               ║
║  ✅ Rollback plan ready                                           ║
║                                                                   ║
║  Chờ owner review → approve → implementation                     ║
╚═══════════════════════════════════════════════════════════════════╝
```
