# PHASE 3.1 — NPP DATABASE IMPLEMENTATION REPORT
**Trạng thái**: ĐÃ TRIỂN KHAI (DATABASE FOUNDATION ONLY)  
**Thời điểm thực hiện**: 21/09/2026  
**Bản thiết kế gốc**: `NPP_DATABASE_DESIGN_FINAL.md`

---

## 1. EXACT SCHEMA CHANGES (CÁC THAY ĐỔI SCHEMA CHÍNH XÁC)

### A. Models Mới Tạo (5 Models)
1. **`NppPackage`**: Danh mục gói NPP do Admin quản lý.
2. **`NppPackageItem`**: Linh kiện/máy cấu thành trong gói NPP.
3. **`NppPurchase`**: Giao dịch mua gói NPP (trỏ trực tiếp `User.id`, không qua `Customer`).
4. **`NppPayment`**: Sổ nhật ký thanh toán từng đợt.
5. **`NppCommission`**: Hoa hồng giao dịch gói NPP (F1 10%, F2 5%).

### B. Models Mở Rộng (3 Models)
1. **`User`**: Thêm `isNpp` (`Boolean`, default `false`) và `nppActivatedAt` (`DateTime?`).
2. **`RankHistory`**: Thêm `nppPurchaseId` (`String?`), `effectiveFrom` (`DateTime`, default `now()`), `effectiveTo` (`DateTime?`), kèm index `[userId, effectiveFrom]`.
3. **`CommissionPeriod`**: Thêm relation `nppCommissions NppCommission[]`.
4. **`Product`**: Thêm relation `nppPackageItems NppPackageItem[]`.

---

## 2. MIGRATION DETAILS

- **Migration Name**: `20260921090000_phase_3_1_npp_foundation`
- **Migration Method**: `prisma db push` (SQLite compatibility) + migration SQL file thủ công cho audit trail.
- **Lý do không dùng `prisma migrate dev`**: Shadow database báo lỗi `P3006` do migration cũ `phase_2c_additive_foundation` có dependency `SPointTransaction` không hợp lệ trên shadow DB. Lỗi này chỉ ảnh hưởng shadow, không ảnh hưởng production DB.

---

## 3. MIGRATION SQL SUMMARY

### User Table (ALTER)
```sql
ALTER TABLE "User" ADD COLUMN "isNpp" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "nppActivatedAt" DATETIME;
```

### RankHistory Table (ALTER + INDEX)
```sql
ALTER TABLE "RankHistory" ADD COLUMN "nppPurchaseId" TEXT;
ALTER TABLE "RankHistory" ADD COLUMN "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "RankHistory" ADD COLUMN "effectiveTo" DATETIME;
CREATE INDEX "RankHistory_userId_effectiveFrom_idx" ON "RankHistory"("userId", "effectiveFrom");
```

### NppPackage (CREATE TABLE + UNIQUE INDEX)
- PK: `id TEXT`
- Unique: `code`
- Money field: `grossPrice BIGINT`
- Rate field: `defaultDiscount INTEGER` (Basis Points)

### NppPackageItem (CREATE TABLE + INDEXES)
- PK: `id TEXT`
- FK: `packageId → NppPackage(id) ON DELETE CASCADE`, `productId → Product(id) ON DELETE RESTRICT`
- Unique: `[packageId, productId]`

### NppPurchase (CREATE TABLE + INDEXES)
- PK: `id TEXT`
- FK: `userId → User(id) ON DELETE RESTRICT`, `packageId → NppPackage(id) ON DELETE RESTRICT`
- Unique: `code`
- Money fields (ALL `BIGINT`): `grossPrice`, `discountAmount`, `netPayableAmount`, `depositAmount`, `paidAmount`, `remainingAmount`, `actualPaidAmount`
- Rate field: `discountRateBps INTEGER`
- Indexes: `userId`, `packageId`, `status`, `isPaidInFull`, `settlementStatus`

### NppPayment (CREATE TABLE + INDEX)
- PK: `id TEXT`
- FK: `purchaseId → NppPurchase(id) ON DELETE CASCADE`
- Money field: `amount BIGINT`
- Index: `purchaseId`

### NppCommission (CREATE TABLE + INDEXES)
- PK: `id TEXT`
- FK: `purchaseId → NppPurchase(id) ON DELETE CASCADE`, `beneficiaryId → User(id) ON DELETE RESTRICT`, `periodId → CommissionPeriod(id) ON DELETE SET NULL`
- **Unique (Idempotency)**: `[purchaseId, level]`
- Money fields: `commissionBase BIGINT`, `earnedMoney BIGINT`
- CP field: `earnedPoints INTEGER`
- Rate field: `rateBps INTEGER`
- Timestamp fields: `createdAt` (auto), `settledAt` (nullable), `availableAt` (nullable), `paidAt` (nullable)
- Indexes: `beneficiaryId`, `status`, `periodId`

---

## 4. AFFECTED TABLES

| Bảng | Loại Thay Đổi | Tác Động Dữ Liệu Hiện Có |
| :--- | :--- | :--- |
| `User` | ALTER (thêm 2 cột) | **0 tác động**. 39 User hiện có đều nhận `isNpp = false`, `nppActivatedAt = NULL`. |
| `RankHistory` | ALTER (thêm 3 cột + 1 index) | **0 tác động**. Các bản ghi cũ nhận `nppPurchaseId = NULL`, `effectiveFrom = CURRENT_TIMESTAMP`, `effectiveTo = NULL`. |
| `CommissionPeriod` | Chỉ thêm relation (không sửa cột) | **0 tác động**. |
| `Product` | Chỉ thêm relation (không sửa cột) | **0 tác động**. |
| `NppPackage` | CREATE mới | Bảng trống. |
| `NppPackageItem` | CREATE mới | Bảng trống. |
| `NppPurchase` | CREATE mới | Bảng trống. |
| `NppPayment` | CREATE mới | Bảng trống. |
| `NppCommission` | CREATE mới | Bảng trống. |

---

## 5. INDEXES

| Bảng | Index | Loại |
| :--- | :--- | :--- |
| `NppPackage` | `NppPackage_code_key` | UNIQUE |
| `NppPackageItem` | `NppPackageItem_packageId_productId_key` | UNIQUE |
| `NppPackageItem` | `NppPackageItem_packageId_idx` | INDEX |
| `NppPackageItem` | `NppPackageItem_productId_idx` | INDEX |
| `NppPurchase` | `NppPurchase_code_key` | UNIQUE |
| `NppPurchase` | `NppPurchase_userId_idx` | INDEX |
| `NppPurchase` | `NppPurchase_packageId_idx` | INDEX |
| `NppPurchase` | `NppPurchase_status_idx` | INDEX |
| `NppPurchase` | `NppPurchase_isPaidInFull_idx` | INDEX |
| `NppPurchase` | `NppPurchase_settlementStatus_idx` | INDEX |
| `NppPayment` | `NppPayment_purchaseId_idx` | INDEX |
| `NppCommission` | `NppCommission_purchaseId_level_key` | **UNIQUE (Idempotency)** |
| `NppCommission` | `NppCommission_beneficiaryId_idx` | INDEX |
| `NppCommission` | `NppCommission_status_idx` | INDEX |
| `NppCommission` | `NppCommission_periodId_idx` | INDEX |
| `RankHistory` | `RankHistory_userId_effectiveFrom_idx` | INDEX (mới) |

---

## 6. CONSTRAINTS & FK RELATIONS

| Bảng | Constraint | FK Target | onDelete |
| :--- | :--- | :--- | :--- |
| `NppPackageItem` | `NppPackageItem_packageId_fkey` | `NppPackage(id)` | CASCADE |
| `NppPackageItem` | `NppPackageItem_productId_fkey` | `Product(id)` | RESTRICT |
| `NppPurchase` | `NppPurchase_userId_fkey` | `User(id)` | RESTRICT |
| `NppPurchase` | `NppPurchase_packageId_fkey` | `NppPackage(id)` | RESTRICT |
| `NppPayment` | `NppPayment_purchaseId_fkey` | `NppPurchase(id)` | CASCADE |
| `NppCommission` | `NppCommission_purchaseId_fkey` | `NppPurchase(id)` | CASCADE |
| `NppCommission` | `NppCommission_beneficiaryId_fkey` | `User(id)` | RESTRICT |
| `NppCommission` | `NppCommission_periodId_fkey` | `CommissionPeriod(id)` | SET NULL |
| `RankHistory` | `RankHistory_nppPurchaseId_fkey` | `NppPurchase(id)` | SET NULL |

---

## 7. MONEY / CP TYPE VERIFICATION

| Field | Prisma Type | SQLite Type | Đúng Theo Design? |
| :--- | :---: | :---: | :---: |
| `NppPackage.grossPrice` | `BigInt` | `BIGINT` | ✅ |
| `NppPurchase.grossPrice` | `BigInt` | `BIGINT` | ✅ |
| `NppPurchase.discountAmount` | `BigInt` | `BIGINT` | ✅ |
| `NppPurchase.netPayableAmount` | `BigInt` | `BIGINT` | ✅ |
| `NppPurchase.depositAmount` | `BigInt` | `BIGINT` | ✅ |
| `NppPurchase.paidAmount` | `BigInt` | `BIGINT` | ✅ |
| `NppPurchase.remainingAmount` | `BigInt` | `BIGINT` | ✅ |
| `NppPurchase.actualPaidAmount` | `BigInt` | `BIGINT` | ✅ |
| `NppPayment.amount` | `BigInt` | `BIGINT` | ✅ |
| `NppCommission.commissionBase` | `BigInt` | `BIGINT` | ✅ |
| `NppCommission.earnedMoney` | `BigInt` | `BIGINT` | ✅ |
| `NppCommission.earnedPoints` | `Int` | `INTEGER` | ✅ |
| `NppCommission.rateBps` | `Int` | `INTEGER` | ✅ |
| `NppPurchase.discountRateBps` | `Int` | `INTEGER` | ✅ |
| `NppPackage.defaultDiscount` | `Int` | `INTEGER` | ✅ |

**Không có Float nào**. 100% tiền tệ VNĐ = `BigInt`. 100% điểm CP = `Int`.

---

## 8. COMPATIBILITY RISKS

| Rủi Ro | Đánh Giá | Biện Pháp |
| :--- | :---: | :--- |
| Dữ liệu CTV bán lẻ bị ảnh hưởng | **KHÔNG** | Chỉ thêm 2 cột nullable / default vào `User` và `RankHistory`. 5 bảng mới hoàn toàn độc lập. |
| `BigInt.prototype.toJSON` toàn cục | **KHÔNG ÁP DỤNG** | Sẽ dùng serializer riêng trong Phase 3.2+. Không thêm prototype toàn cục. |
| Shadow DB lỗi khi chạy `prisma migrate dev` | Đã xảy ra | Đã xử lý bằng `prisma db push`. Migration SQL file được tạo thủ công cho audit trail. |

---

## 9. VERIFICATION RESULTS

| Kiểm Tra | Kết Quả |
| :--- | :--- |
| `npx prisma validate` | ✅ `The schema is valid` |
| `npx prisma generate` | ✅ `Generated Prisma Client (v5.22.0)` |
| `npx prisma migrate status` | ✅ `Database schema is up to date` |
| `PRAGMA integrity_check` | ✅ `ok` |
| `PRAGMA foreign_key_check` | ✅ (trống — không có FK vi phạm) |
| 5 bảng NPP tồn tại | ✅ `NppPackage, NppPackageItem, NppPurchase, NppPayment, NppCommission` |
| `User.isNpp` tồn tại | ✅ 39 User có `isNpp = false` |
| `User.nppActivatedAt` tồn tại | ✅ NULL |
| `RankHistory.nppPurchaseId` tồn tại | ✅ |
| `RankHistory.effectiveFrom` tồn tại | ✅ |
| `RankHistory.effectiveTo` tồn tại | ✅ |
| Unique `NppCommission(purchaseId, level)` | ✅ |
| Unique `NppPackageItem(packageId, productId)` | ✅ |
| Unique `NppPurchase(code)` | ✅ |
| Unique `NppPackage(code)` | ✅ |
| Dữ liệu CTV bán lẻ bảo toàn | ✅ 39 Users, 29 Commissions, 34 Customers, 10 Products — không thay đổi |

---

## 10. BACKUP & ROLLBACK

- **Backup schema trước migration**: `/var/www/wasypro/server/prisma/schema.prisma.backup_phase3_pre`
- **Backup database trước migration**: `/var/www/wasypro/server/dev.db.backup_phase3_pre`
- **Rollback procedure**: Khôi phục 2 file backup trên và chạy `npx prisma generate`.

---

## PHASE 3.1 STATUS: PASS

READY FOR PHASE 3.2: YES

Phase 3.2 được phép bắt đầu triển khai NPP Package Admin CRUD APIs theo đúng schema đã lock trong `NPP_DATABASE_DESIGN_FINAL.md`.
