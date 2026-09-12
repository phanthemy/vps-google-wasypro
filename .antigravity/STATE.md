# 🔄 Project State: WASY PRO

> Auto-generated runtime state file

## Current Status

| Key | Value |
|-----|-------|
| **Status** | IN_PROGRESS |
| **Last Session** | 2026-09-10 |
| **Branch** | main |
| **Last Commit** | 4ff2849 |
| **Source of Truth** | Oracle VPS (149.118.62.155) |
| **Working Dir** | /var/www/wasypro |

## Active Tasks

### ✅ Completed This Session
- [x] Fix white blank screen on Order modal (React Rules of Hooks violation in ContactModal & ProductQuickViewModal) + Add ErrorBoundary
- [x] Order classification fix (shadowOrderId + isCtvOrder)
- [x] Deferred settlement workflow
- [x] Admin dual-tab order management
- [x] Retroactive shadow status sync
- [x] Unified lifecycle (CTV Portal = NEW)
- [x] Single source of truth architecture
- [x] Tab rename (Quản lý đơn Website / Theo dõi hoa hồng CTV)
- [x] 4-case verification PASS
- [x] Admin Reset Test Data button

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
