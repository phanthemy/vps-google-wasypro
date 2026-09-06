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

---

## Business Terminology — Định Nghĩa Chính Thức (Boss chốt 2026-09-06)

### F1 / F2 — Network Depth

| Khái niệm | Định nghĩa |
|---|---|
| **F1** | Member tuyến trực tiếp (depth 1) trong sponsor network, có Business ID. Còn gọi là D1. |
| **F2** | Member tuyến cấp 2 (depth 2) trong sponsor network, có Business ID. Còn gọi là D2. |
| **F3+** | Tuyến sâu hơn — không có upstream commission trong cơ chế hiện tại. |

### KHÔNG được dùng F1/F2 để chỉ

- Direct Customer chưa có ID → phải dùng `DIRECT_NO_ID`
- Direct Customer đã có ID → phải dùng `DIRECT_WITH_ID`
- F1/F2 KHÔNG phải là cách gọi khác của Direct Customer

### 4 Loại Nghiệp Vụ Tách Biệt

| Loại | Policy Key Pattern | Rate |
|---|---|---|
| SELF BUY | `{RANK}_SELF_BUY` | Amb=20%, Mgr=25%, Dir=30% |
| DIRECT NO ID | `{RANK}_DIRECT_NO_ID` | Amb=20%, Mgr=25%, Dir=30% |
| DIRECT HAS ID | `{RANK}_DIRECT_WITH_ID` | Tất cả = 10% |
| UPSTREAM F1 | `{RANK}_F1_PURCHASE` / `DIRECTOR_F1` | Tất cả = 10% |
| UPSTREAM F2 | `{RANK}_F2_PURCHASE` / `DIRECTOR_F2` | Tất cả = 5% |

### Commission Formula

```
earnedPoints = basePoints × rate
earnedMoney  = earnedPoints × 1000
```

KHÔNG tính từ price. KHÔNG phần trăm trên giá tiền.
