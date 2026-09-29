# 🔄 Project State: WASY PRO

> Auto-generated runtime state file

## Current Status

| Key | Value |
|-----|-------|
| **Status** | IN_PROGRESS |
| **Last Session** | 2026-09-30 |
| **Branch** | main |
| **Last Commit** | `ade49e4` |
| **Source of Truth** | Oracle VPS (149.118.62.155) |
| **Working Dir** | /var/www/wasypro |

## Active Tasks

### ✅ Completed This Session (30/09/2026)
- [x] NPP Combo chỉ hiện máy lọc nước (filter bỏ linh kiện) — `71607ce`
- [x] Fix F0 hiện sai trong Admin Tạo Đơn (dùng networkParent thay sourceCtv) — `431e2be`
- [x] Fix NppCommission thiếu trong Kỳ Hoa Hồng (gán periodId + merge 2 bảng) — `ade49e4`
- [x] Fix JSDoc comment block nuốt 6 API — `dd7269f`
- [x] NPP/CTV Ref Link chỉ hiện khi có businessId — `3921409`
- [x] Smart Admin Create Order Modal (auto sponsor, required address) — `fcd9c7d`
- [x] Nginx uploads location cho attachments — `dd7269f`
- [x] Admin Order Management 6 APIs + 3 modals — `0729a81`
- [x] Fix data: NppCommission periodId=null → gán vào kỳ 10/2026

### ⏳ Chưa hoàn thành (Phiên tiếp theo)
- [ ] **NPP order form trong Admin** — Khi tạo đơn cho NPP, form cần chế độ combo (chọn nhiều sản phẩm, chiết khấu combo)
- [ ] **Verify CTV tab** — Đơn admin tạo có CTV gán → phải hiện trong tab "Đơn CTV"
- [ ] **Test F0 hiện đúng** — F5 admin → Tạo Đơn → verify sponsor đúng cho cả 3 test accounts
- [ ] **Test Kỳ Hoa Hồng** — F5 → verify 4 khoản đủ

### 📋 Boss Decision Items
- D2: Commission rates: hardcode vs Policy engine?
- D3: Service model: keep or remove?
- D7: SQLite → PostgreSQL migration?
- D8: React Router integration?

## Architecture

### Order Lifecycle
```
NEW → CONFIRMED → SHIPPING → COMPLETED (settlement) | CANCELLED (reversal)
```

### 2 Commission Tables (QUAN TRỌNG)
```
Commission       → Đơn bán lẻ (SELF, DIRECT, F1, F2)
NppCommission    → Hoa hồng giới thiệu NPP (D1 10%, D2 5%)
```
PHẢI query cả 2 ở mọi nơi hiện commission.

### Key Functions (server/index.js)
| Function | Line | Purpose |
|----------|------|---------|
| executeOrderSettlement | ~3389 | QP/SP/Commission on COMPLETED |
| reverseOrderSettlement | ~3490 | Reverse all on CANCELLED |
| calculateAndCreateCommissions | ~3074 | Commission rate logic |
| NPP Activation + NppCommission | ~7886 | D1/D2 referral commission on NPP activate |
| GET /api/admin/periods/:id/commissions | ~1378 | Period commissions (merged Commission + NppCommission) |

### Test Accounts
| userId | Name | parentId | businessId | rank |
|--------|------|----------|-----------|------|
| U1001 | Nguyễn Đức Quang | null | WK-10001 | AMBASSADOR |
| U1002 | Phan Thế Mỹ | U1001 | WK-10004 | AMBASSADOR |
| U1003 | Phan Thị My | U1001 | WK-10003 | AMBASSADOR |
| U1004 | Phan Thị Thùy | U1001 | WK-10002 | AMBASSADOR |
