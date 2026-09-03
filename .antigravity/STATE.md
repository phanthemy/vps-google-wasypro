# 📊 Project State — WASY PRO / Water King

> File này được cập nhật tự động bởi Agent sau mỗi phiên làm việc.
> Đây là file đồng bộ trạng thái giữa các máy A, B, C.

---

## Source of Truth

| Thuộc tính | Giá trị |
|---|---|
| **Source of Truth** | `Oracle VPS` |
| **Host** | `149.118.62.155` |
| **Root** | `/var/www/wasypro` |
| **Deploy Target** | `Oracle VPS (PM2 + Caddy)` |
| **GitHub** | `https://github.com/phanthemy/wasypro.git` |

---

## Runtime

| Thuộc tính | Giá trị |
|---|---|
| **Domain Landing / Web** | `https://wasypro.com` / `https://www.wasypro.com` |
| **Domain Web App CTV** | `https://app.wasypro.com` |
| **Port Backend API** | `3011` (`happylife-backend` - Express + Prisma) |
| **Port Frontend Web** | `5005` (`wasypro`) |
| **Port Frontend App CTV** | `5175` (`wasypro-ctv`) |
| **PM2 Process Names** | `happylife-backend` (id: 0), `wasypro` (id: 27), `wasypro-ctv` (id: 28) |
| **Database** | SQLite (`/var/www/wasypro/server/dev.db`) |
| **Node Version** | `v20.20.2` |

---

## Current Task

> Giai đoạn 1B — Phát triển & Hoàn thiện Nghiệp vụ Water King theo chính sách kinh doanh

- **Task**: Bắt đầu Giai đoạn 1B: Rà soát & nâng cấp các tính năng nghiệp vụ Affiliate / CTV Water King (Cây hệ thống đại sứ, phân cấp bậc Silver/Gold/Diamond, cơ chế hoa hồng F1 10% / F2 5%, bảng giá & chiết khấu theo số lượng máy).
- **Assigned Agent**: Orchestrator / Sub-Agents (Database Architect, Backend Developer, Frontend Developer, QA Tester)
- **Started At**: `2026-09-03 09:07`
- **Status**: `In Progress`
- **Branch**: `main`

---

## Last Completed

| Thời gian | Task | Agent | Commit |
|---|---|---|---|
| 2026-09-03 08:31 | Nghiệm thu hoàn tất Giai đoạn 1A: Kiểm tra độc lập 6/6 smoke tests an ninh (HttpOnly, CSRF, mustChangePassword, RBAC realtime, Soft-cancel REVERSAL), mã hóa AES-256-GCM vault pre-deploy, đối chiếu SHA-256. | DevOps / QA | `4b22e33` / `c3edbac` |
| 2026-09-02 12:00 | Triển khai Emergency Security Patch Release 1A (Cookie Auth, Double-Submit CSRF, RBAC, Data Isolation) | Backend Developer | `4b22e33` |

---

## Open Issues

| # | Mô tả | Mức độ | Phát hiện bởi |
|---|---|---|---|
| 1 | File binary database `server/dev.db` đang được cron auto-backup commit vào git; cần tách biệt quy trình backup data và code versioning. | Thấp | Code Reviewer |

---

## Next Suggested Tasks (Giai đoạn 1B)

1. **Rà soát & Hoàn thiện mô hình kinh doanh Water King** trong Backend & Database:
   - Đại sứ Kinh doanh (Silver): Chiết khấu nhập hàng (1 máy: 25%, 5 máy: 30%, 10 máy: 35%, 20 máy: 40%). Phí kết nối khách trực tiếp 20%.
   - Quản lý Phát triển Thị trường (Gold): Điều kiện (5 Đại sứ trực tiếp hoạt động), Phí kết nối 25%, Chiết khấu nhập hàng (1 máy: 30%, 5 máy: 35%, 10 máy: 40%).
   - Giám đốc Phát triển Thị trường (Diamond): Điều kiện (5 Quản lý hoạt động), Phí kết nối 30%, Chiết khấu nhập hàng (1 máy: 35%, 10 máy: 40%).
   - Phí hỗ trợ phát triển thị trường tầng: F1 (10%), F2 (5%).
   - Quỹ đồng hưởng lợi nhuận 10% sau thuế cho Giám đốc thị trường.
2. **Kiểm tra và chuẩn hóa các API routes trong `server/index.js`** phục vụ App CTV (`wasypro-ctv`).
3. **Cập nhật giao diện UI Client & Admin Web App** hiển thị đầy đủ bảng giá, chiết khấu, sơ đồ cây và báo cáo hoa hồng.
4. **Kiểm thử QA end-to-end** trước khi nghiệm thu 1B.

---

## Last Deploy

| Thuộc tính | Giá trị |
|---|---|
| **Commit Hash** | `c3edbac` |
| **Deploy Time** | `2026-09-03 09:10` |
| **Deployed By** | `Antigravity` |
| **Branch** | `main` |
| **Status** | `Success (Online)` |

---

## Session History

| Thời gian | Máy | Agent | Hành động | Commit Hash |
|---|---|---|---|---|
| 2026-09-03 08:30 | Máy công ty (editor02) | QA / DevOps | Nghiệm thu độc lập Giai đoạn 1A (100% PASS), mã hóa AES-256-GCM vault backup | `4b22e33` |
| 2026-09-03 08:58 | Máy công ty (editor02) | DevOps | Rà soát commit d9ebae6 (cron auto backup) và đồng bộ HEAD | `c3edbac` |
| 2026-09-03 09:10 | Máy công ty (editor02) | Orchestrator | Khởi tạo .antigravity/STATE.md, project.json và bắt đầu Giai đoạn 1B | `c3edbac` |

