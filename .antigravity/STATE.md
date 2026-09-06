# WasyPro / Water King — PROJECT STATE

**Updated:** 2026-09-06T12:55 +07:00

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
| Period Lifecycle | `9b3555f` | CommissionPeriod + PeriodPolicyConfig + Admin UI + CTV PolicyView | ✅ Done |
| Director F1/F2 Policy | _TBD_ | Boss chốt DIRECTOR_F1=10% / DIRECTOR_F2=5% — update SystemPolicyConfig + PeriodPolicyConfig | 🔄 In Progress |

---

## Current HEAD

- **Branch:** main
- **Commit:** `9b3555f` (origin/main)
- **Working tree:** DIRTY — Director F1/F2 description fix staged for commit

---

## Business Baseline — Policy Source of Truth

| Rule | Rank | Rate |
|---|---|---|
| SELF_BUY | Ambassador | 20% |
| DIRECT_NO_ID | Ambassador | 20% |
| DIRECT_WITH_ID | Ambassador | 10% |
| SELF_BUY | Manager | 25% |
| DIRECT_NO_ID | Manager | 25% |
| DIRECT_WITH_ID | Manager | 10% |
| F1_PURCHASE | Manager | 10% |
| F2_PURCHASE | Manager | 5% |
| SELF_BUY | Director | 30% |
| DIRECT_NO_ID | Director | 30% |
| DIRECT_WITH_ID | Director | 10% |
| F1 / D1 | Director | **10%** ✅ Boss chốt |
| F2 / D2 | Director | **5%** ✅ Boss chốt |

---

## Open Items (Phase 2C+)

- OPEN-C: Điều kiện duy trì Ambassador rank
- MẪU THUẪN 01: Trưởng phòng kinh doanh (chưa chốt)
- MẪU THUẪN 02: Giám đốc kinh doanh (chưa chốt)
- MẪU THUẪN 04: S-Points redemption (chưa chốt)
- Module Investment/Equity: (chưa có spec)
- CommissionPriceRule ngoài dải 15-45M: Admin cấu hình sau
- MANAGER_F1_SELL_TO_CUSTOMER_NO_ID: NOT_CONFIGURED — chưa chốt
- Ambassador upstream D1/D2: chưa có policy key — chưa chốt
