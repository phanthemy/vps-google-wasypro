# WasyPro / Water King — PROJECT STATE

**Updated:** 2026-09-06T13:42 +07:00

---

## Phase Milestones

| Phase | Commit | Mo ta | Trang thai |
|:------|:-------|:------|:----------:|
| Phase 1A | `4b22e33` | Production release CTV portal | Done |
| Repository Hygiene | `fdcd0d9` | Untrack dev.db, isolate backups | Done |
| Phase 1B | `8d08516` | Refactor CTV App.jsx -> 23 modular files | Done |
| Phase 2A | `52febf2` | Foundation: rank fields, S-Points, RankBadge, SPointWidget | Done |
| Phase 2B | `879a3e8` | Commercial Engine: Ambassador + Wholesale + Commission Rules | Done |
| Phase 2C | `6b97f61` | Commission Engine v3.6 (Point Engine + Network Tree + Rank Engine) | Done |
| Phase 2D | `b610b8e` | Purchase Subject Validation (SELF/CUSTOMER) | Done |
| Admin Policy Config | `8586b43` | GET/PUT /api/admin/policy + AdminPolicyConfig UI | Done |
| Period Lifecycle | `9b3555f` | CommissionPeriod + PeriodPolicyConfig + Admin UI + CTV PolicyView | Done |
| Director F1/F2 Policy | `2b6da86` | DIRECTOR_F1=10% / DIRECTOR_F2=5% — Boss official decision | Done |
| UI Audit Fixes | `01658b0` | Modal z-index, RankView API-driven, internal-users query fix | Done |
| Auth Login Redirect | `c4f7992` | role-based redirect: admin/accountant->Admin Portal, ctv->/ctv | Done |

---

## Current HEAD

- **Branch:** main
- **Commit:** `c4f7992` (origin/main = VPS)
- **Working tree:** CLEAN

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
| F1 / D1 | Director | 10% — Boss chot |
| F2 / D2 | Director | 5% — Boss chot |

---

## Open Items

- OPEN-C: Dieu kien duy tri Ambassador rank
- MAU THUAN 01: Truong phong kinh doanh (chua chot)
- MAU THUAN 02: Giam doc kinh doanh (chua chot)
- MAU THUAN 04: S-Points redemption (chua chot)
- Module Investment/Equity: (chua co spec)
- CommissionPriceRule ngoai dai 15-45M: Admin cau hinh sau
- MANAGER_F1_SELL_TO_CUSTOMER_NO_ID: NOT_CONFIGURED — chua chot
- Ambassador upstream D1/D2: chua co policy key — chua chot