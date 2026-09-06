# WasyPro / Water King — PROJECT STATE

**Updated:** 2026-09-06T12:30 +07:00

---

## Phase Milestones

| Phase | Commit | Mô tả | Trạng thái |
|:------|:-------|:------|:----------:|
| Phase 1A | `4b22e33` | Production release CTV portal | ✅ Done |
| Repository Hygiene | `fdcd0d9` | Untrack dev.db, isolate backups | ✅ Done |
| Phase 1B | `8d08516` | Refactor CTV App.jsx → 23 modular files | ✅ Done |
| Phase 2A | `52febf2` | Foundation: rank fields, S-Points, RankBadge, SPointWidget | ✅ Done |
| Phase 2B | `879a3e8` | Commercial Engine: Ambassador + Wholesale + Commission Rules | ✅ Done |
| Phase 2C | `6b97f61` | Commission Engine v3.6 (Point Engine + Network Tree + Rank Engine) | ✅ Done |
| Phase 2D | `b610b8e` | Purchase Subject Validation (SELF/CUSTOMER) — backend source of truth | ✅ Done |
| Admin Policy Config | `8586b43` | GET/PUT /api/admin/policy + AdminPolicyConfig UI (SystemPolicyConfig) | ✅ Done |
| Period Lifecycle | _TBD_ | CommissionPeriod + PeriodPolicyConfig + Admin UI + CTV PolicyView | 🔄 Done — awaiting deploy+test |

---

## Current HEAD

- **Branch:** main
- **Commit:** `59f0a55` (origin/main before this phase)
- **Working tree:** DIRTY — Period Lifecycle changes staged for commit

---

## Open Items (Phase 2C+)

- OPEN-C: Điều kiện duy trì Ambassador rank
- MẪU THUẪN 01: Trưởng phòng kinh doanh (chưa chốt)
- MẪU THUẪN 02: Giám đốc kinh doanh (chưa chốt)
- MẪU THUẪN 04: S-Points redemption (chưa chốt)
- Module Investment/Equity: (chưa có spec)
- CommissionPriceRule ngoài dải 15-45M: Admin cấu hình sau
