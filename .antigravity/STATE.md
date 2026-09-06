# WasyPro / Water King â€” PROJECT STATE

**Updated:** 2026-09-06T17:35 +07:00

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
| Director F1/F2 Policy | `2b6da86` | DIRECTOR_F1=10% / DIRECTOR_F2=5% â€” Boss official decision | Done |
| UI Audit Fixes | `01658b0` | Modal z-index, RankView API-driven, internal-users query fix | Done |
| Auth Login Redirect | `c4f7992` | role-based redirect: admin/accountant->Admin Portal, ctv->/ctv | Done |
| F1/F2 Terminology | `fc1ac9f` | Standardize F1/F2 definition â€” label clarification, AGENTS.md updated | Done |
| Admin Policy UI Fix | `9baa16d` | Fix contrast, modal structure, Giam Doc PT label, Escape key | Done |
| Admin Policy Unicode Fix | `ed65016` | Fix literal \u escape sequences in JSX text (PowerShell heredoc bug) | Done |
| Admin Periods UI Fix | `3cb8212` | Fix AdminPeriods contrast â€” dark theme classes on light admin bg | Done |
| Admin PeriodDetail UI Fix | `63cc34d` | Fix AdminPeriodDetail â€” same dark-theme class root cause, global replace | Done |
| Product Master (CTV) | `b30d654` | CTV OrderModal dung Product wasypro.com; Admin nhap commissionPoints | Done |
| Admin CTV Management + Orders Fix | `240031a` | AdminCTVManagement tab (list+detail), fix AdminOrders data layer, GET /api/admin/ctv routes | Done |
| Participant Flow â€” Join System | `7ca5e38` | POST /api/auth/register (public), POST /api/users/me/join-system, login response full fields, JoinSystemBanner UI | Done |

---

## Current HEAD

- **Branch:** main
- **Commit:** `7ca5e38` (origin/main = deployed)
- **Working tree:** CLEAN


---

## Business Baseline â€” Policy Source of Truth

| Rule | Rank | Rate |
|---|---|---|
| SELF_BUY | Ambassador | 20% |
| DIRECT_NO_ID | Ambassador | 20% |
| DIRECT_WITH_ID | Ambassador | 10% |
| SELF_BUY | Manager | 25% |
| DIRECT_NO_ID | Manager | 25% |
| DIRECT_WITH_ID | Manager | 10% |
| F1_PURCHASE (Upstream F1) | Manager | 10% |
| F2_PURCHASE (Upstream F2) | Manager | 5% |
| SELF_BUY | Director | 30% |
| DIRECT_NO_ID | Director | 30% |
| DIRECT_WITH_ID | Director | 10% |
| DIRECTOR_F1 (Upstream F1/D1) | Director | 10% â€” Boss chot |
| DIRECTOR_F2 (Upstream F2/D2) | Director | 5% â€” Boss chot |

---

## F1/F2 â€” Dinh Nghia Chinh Thuc (Boss chot 2026-09-06)

| Khai niem | Dinh nghia |
|---|---|
| F1 / D1 | Member tuyen truc tiep (depth 1) trong sponsor network, co Business ID |
| F2 / D2 | Member tuyen cap 2 (depth 2) trong sponsor network, co Business ID |
| F3+ | Tuyen sau hon â€” khong co upstream commission hien tai |
| Direct NO ID | Khach hang truc tiep chua co Business ID â€” KHONG phai F1 |
| Direct HAS ID | Khach hang truc tiep da co Business ID â€” KHONG phai F2 |

Commission formula: earnedPoints = basePoints x rate | earnedMoney = earnedPoints x 1000

---

## Open Items

- OPEN-C: Dieu kien duy tri Ambassador rank
- MAU THUAN 01: Truong phong kinh doanh (chua chot)
- MAU THUAN 02: Giam doc kinh doanh (chua chot)
- MAU THUAN 04: S-Points redemption (chua chot)
- Module Investment/Equity: (chua co spec)
- CommissionPriceRule ngoai dai 15-45M: Admin cau hinh sau
- MANAGER_F1_SELL_TO_CUSTOMER_NO_ID: NOT_CONFIGURED â€” chua chot
- Ambassador upstream D1/D2: chua co policy key â€” chua chot
- Tech debt: Commission.type OVERRIDE_F1/OVERRIDE_F2 trong DB â€” can Boss quyet dinh co migrate khong