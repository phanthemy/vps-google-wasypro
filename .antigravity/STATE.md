# 🔄 Project State: WASY PRO

> Auto-generated runtime state file

## Current Status

| Key | Value |
|-----|-------|
| **Status** | IN_PROGRESS |
| **Last Session** | 2026-09-28 |
| **Branch** | main |
| **Last Commit** | 382d154 |
| **Source of Truth** | Oracle VPS (149.118.62.155) |
| **Working Dir** | /var/www/wasypro |

## Active Tasks

### ✅ Completed This Session
- [x] Sửa triệt để lỗi sập trắng trang khi bấm "MUA NGAY" (React Rules of Hooks violation trong ContactModal.tsx & ProductQuickViewModal.tsx) + Tích hợp ErrorBoundary.tsx
- [x] Kiểm thử E2E giao diện thực tế qua Chrome DevTools Protocol (CDP) trên Edge headless (PASS, 0 uncaught errors)
- [x] Audit chi tiết 13 câu hỏi nghiệp vụ Commission Case 4 (Orderer vs Customer, DIRECT_NO_ID, BID lifecycle, v.v.)
- [x] Gia cố logic pre-BID threshold-crossing (selfRecipientBID = priorBusinessId, priorQP < threshold) trong `server/index.js`
- [x] Viết và chạy thành công test suite thực tế `test_threshold_4000_500_1000.cjs` trên Oracle VPS: 4.000 + 500 + 1.000 CP => 800 + 100 + 150 = 1.050 CP chuẩn xác 100%
- [x] Reload backend PM2 trên VPS và đồng bộ commit `70e077d` lên GitHub repo

### ⏳ Pending (Boss Review)
- [ ] Boss manual testing 4 cases
- [ ] Lock Reset button after testing complete
- [ ] Fix ~37 HIGH credential bugs in standalone CTV (wasypro-ctv/src/)
- [ ] Screenshots of production after all fixes

### 📋 Boss Decision Items (D2-D8)
- D2: Commission rates: hardcode vs Policy engine?
- D3: Service model: keep or remove?
- D4: AdminUser model: delete?
- D5: Warranties/Leads/News tabs: build or remove?
- D6: isSelfBuy vs purchaseType: unify?
- D7: SQLite → PostgreSQL migration?
- D8: React Router integration?

## Architecture

### Order Lifecycle
```
NEW → CONFIRMED → SHIPPING → COMPLETED (settlement) | CANCELLED (reversal)
```

### Admin UI
```
Tab 1: 📦 Quản lý đơn Website (management, source of truth)
Tab 2: 🤝 Theo dõi hoa hồng CTV (read-only)
```

### Key Functions (server/index.js)
| Function | Line | Purpose |
|----------|------|---------|
| executeOrderSettlement | ~3389 | QP/SP/Commission on COMPLETED |
| reverseOrderSettlement | ~3490 | Reverse all on CANCELLED |
| calculateAndCreateCommissions | ~3074 | Commission rate logic |
| POST /api/orders | 2156 | CTV Portal create (NEW) |
| POST /api/orders/website | 4816 | Website bridge (shadow=NEW) |
| PUT /api/admin/website-orders/:id/status | ~4754 | WO status + sync + settlement |
| PUT /api/admin/orders/:id/status | NEW | Standalone CTV status |
| POST /api/admin/reset-uat | NEW | Reset test data (temporary) |
