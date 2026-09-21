# PHASE 3.2 — NPP PACKAGE ADMIN CRUD REPORT
**Trạng thái**: ĐÃ TRIỂN KHAI  
**Thời điểm**: 21/09/2026  
**Commit**: `a619bd6`

---

## 1. APIs IMPLEMENTED

| # | Method | Route | Chức năng |
| :- | :--- | :--- | :--- |
| 1 | `GET` | `/api/admin/npp/packages` | Danh sách packages (include items + product + purchase count) |
| 2 | `GET` | `/api/admin/npp/packages/:id` | Chi tiết package |
| 3 | `POST` | `/api/admin/npp/packages` | Tạo package mới (kèm items) |
| 4 | `PUT` | `/api/admin/npp/packages/:id` | Cập nhật metadata + atomic item replacement |
| 5 | `PATCH` | `/api/admin/npp/packages/:id/status` | Kích hoạt / Vô hiệu hóa |
| 6 | `DELETE` | `/api/admin/npp/packages/:id` | Xóa (chỉ khi 0 purchases) |

---

## 2. AUTHORIZATION

- Middleware: `authenticateToken` + `requireRole(['admin'])`
- Giống convention hiện tại: `/api/admin/periods`, `/api/products`
- Không tạo hệ thống auth mới
- CSRF protection hoạt động bình thường qua cookie auth
- Bearer token auth (header) bypass CSRF (server-side requests)

---

## 3. VALIDATION RULES

| Rule | API | Check |
| :--- | :--- | :--- |
| Code unique | CREATE/UPDATE | `prisma.nppPackage.findUnique({ where: { code } })` |
| Name required | CREATE/UPDATE | `!name.trim()` |
| grossPrice > 0 | CREATE/UPDATE | `BigInt(grossPrice) <= 0n` |
| Discount 0-10000 BPS | CREATE/UPDATE | `!Number.isInteger(disc) \|\| disc < 0 \|\| disc > 10000` |
| Rank enum | CREATE/UPDATE | Must be `AMBASSADOR \| MANAGER \| DIRECTOR` |
| Items >= 1 | CREATE/UPDATE | `items.length === 0` |
| Quantity >= 1 | CREATE/UPDATE | Per-item check |
| Product exists | CREATE/UPDATE | `prisma.product.findMany({ where: { id: { in } } })` |
| No duplicate Products | CREATE/UPDATE | `Set(productIds).size !== productIds.length` |
| Package exists | UPDATE/DELETE/STATUS | `findUnique` check |
| Delete only 0 purchases | DELETE | `_count.purchases > 0` → reject |

---

## 4. PACKAGE UPDATE SEMANTICS

- Update metadata: partial update (`code`, `name`, `description`, `grossPrice`, `defaultDiscount`, `assignedRank`, `isActive`)
- Update items: **atomic replacement** via `prisma.$transaction([deleteMany, ...create])`
- Validate ALL products BEFORE destructive replacement
- **NppPurchase records NEVER mutated** by package update (historical snapshots preserved)

---

## 5. BigInt SERIALIZATION

```javascript
function serializeBigInt(obj) { ... }
```

- **NO `BigInt.prototype.toJSON`** — Dedicated function only
- Converts BigInt → Number if within `Number.MAX_SAFE_INTEGER` range
- Falls back to `.toString()` for values > 9,007,199,254,740,991
- Recursively handles nested objects and arrays
- Applied to ALL NPP API responses: `res.json({ success: true, data: serializeBigInt(result) })`

---

## 6. TEST RESULTS — 19/19 PASS

```
=== Create Tests ===
[PASS] T01: Create valid package
[PASS] T02: Reject duplicate code
[PASS] T03: Reject price = 0
[PASS] T04: Reject discount > 10000
[PASS] T05: Reject invalid rank
[PASS] T06: Reject empty items
[PASS] T07: Reject qty < 1
[PASS] T08: Reject nonexistent Product
[PASS] T09: Reject duplicate Product

=== Read Tests ===
[PASS] T10: List packages
[PASS] T11: Package detail

=== Update Tests ===
[PASS] T12: Update metadata
[PASS] T13: Replace items atomically
[PASS] T14: Deactivate
[PASS] T15: Inactive readable
[PASS] T16: Delete (0 purchases)
[PASS] T17: Delete nonexistent

=== BigInt Tests ===
[PASS] T18: BigInt serialization 500M VND

=== Auth Tests ===
[PASS] T19: Unauthorized rejected

RESULTS: 19/19 passed, 0 failed
ALL TESTS PASSED
```

---

## 7. FILES CHANGED

| File | Loại | Thay đổi |
| :--- | :--- | :--- |
| `server/index.js` | MODIFIED | +406 lines (NPP CRUD code block inserted before `module.exports`) |

Không sửa file nào khác. Không sửa CTV APIs. Không sửa Product behavior.

---

## 8. BUG FIXES DURING IMPLEMENTATION

| Bug | Fix |
| :--- | :--- |
| Auth middleware: code ban đầu dùng `authenticateAdmin` (không tồn tại) | Sửa thành `authenticateToken, requireRole(['admin'])` |
| Product select: dùng `code`, `name` (không tồn tại trên Product model) | Sửa thành `slug`, `title` (đúng schema) |

---

## 9. CHƯA TRIỂN KHAI (đúng yêu cầu)

- ❌ NPP Purchase API
- ❌ NPP Payment API
- ❌ Activation / BID allocation
- ❌ RankHistory activation
- ❌ F1/F2 Commission
- ❌ CommissionPeriod processing
- ❌ Frontend UI
- ❌ PM2 production deployment (PM2 restart chỉ để test, hiện đang chạy bình thường)

---

## 10. RISKS

| Rủi ro | Đánh giá | Ghi chú |
| :--- | :--- | :--- |
| CTV retail APIs bị ảnh hưởng | **KHÔNG** | Không sửa code CTV |
| Product behavior thay đổi | **KHÔNG** | Chỉ read Product, không alter |
| Database schema thay đổi | **KHÔNG** | Phase 3.2 chỉ thêm API code |
| BigInt precision loss | **KHÔNG** | `serializeBigInt()` handles safe range check |

---

## PHASE 3.2 STATUS: PASS

READY FOR PHASE 3.3: YES
