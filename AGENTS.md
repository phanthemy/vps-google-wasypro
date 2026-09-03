# Source of Truth — WASY PRO / Water King

> ⚠️ **ĐỌC PHẦN NÀY TRƯỚC KHI LÀM BẤT CỨ GÌ**

Tất cả source code của dự án được chỉnh sửa **trực tiếp trên VPS**.

**GitHub KHÔNG phải source chính.** GitHub chỉ dùng để:
- Version control
- Backup
- Rollback

**Không clone source về local để chỉnh sửa nếu không được yêu cầu.**

Mọi thay đổi phải thực hiện theo trình tự:
```
SSH VPS → Edit → Test → Commit → Push GitHub
```

---

## Phân loại Project

| Thuộc tính | Giá trị |
|---|---|
| **Project Type** | `Oracle VPS` |
| **Source of Truth** | `Oracle VPS` (149.118.62.155) |
| **Thư mục trên VPS** | `/var/www/wasypro` |
| **Domain** | `https://wasypro.com` / `https://app.wasypro.com` |
| **Backend Port** | `3011` (`happylife-backend` - Express + Prisma) |
| **Frontend Ports** | `5005` (`wasypro`), `5175` (`wasypro-ctv`) |
| **Database** | SQLite (`/var/www/wasypro/server/dev.db`) |

---

## Startup Checklist (Agent bắt buộc chạy)

```
1. Đọc README.md
2. Đọc AGENTS.md
3. Xác định Source of Truth → Nếu VPS → KHÔNG sửa local
4. Đọc .antigravity/STATE.md
5. Đọc .antigravity/project.json
6. git pull (trên VPS hoặc local tùy Source of Truth)
```

---

## Quy trình Sub-Agent (Giai đoạn 1B)

1. **Database Architect**: Rà soát Prisma schema & migration cho các cấp bậc (Đại sứ, Quản lý, Giám đốc) và cấu trúc hoa hồng tầng (F1 10%, F2 5%, Quỹ đồng hưởng 10%).
2. **Backend Developer**: Cập nhật logic tính chiết khấu theo số lượng máy, hoa hồng và API thống kê.
3. **Frontend Developer**: Hoàn thiện UI CTV App (`wasypro-ctv`) và Admin Dashboard.
4. **Code Reviewer**: Kiểm tra style, clean code, không lộ secret/credential.
5. **QA Tester**: Kiểm thử chức năng, xác nhận PASS trước khi bàn giao.
