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

> ⚠️ **BẮT BUỘC**: Khi nhận lệnh "Bắt đầu phiên" / "Bắt đầu làm việc" / "Bắt đầu",
> Agent phải tự động thực hiện TOÀN BỘ checklist bên dưới mà KHÔNG hỏi lại.
> Sau khi hoàn tất, kết luận duy nhất: **"Hệ thống đã sẵn sàng nhận nhiệm vụ."**

```
1. Đọc AGENTS.md (file này)
2. Đọc .agents/rules/project-workflow.md (AI Engineering Playbook — SINGLE SOURCE OF TRUTH cho quy trình)
3. Xác định Source of Truth → Nếu VPS → KHÔNG sửa local
4. git pull (trên VPS hoặc local tùy Source of Truth)
5. Đọc README.md
6. Đọc .antigravity/STATE.md
7. Đọc .antigravity/project.json
8. Đọc memory.md (nhật ký bộ nhớ & quyết định kỹ thuật)
9. Đọc loi.md (sổ tay lỗi & cách fix)
10. Đọc changelog.md (lịch sử cập nhật)
11. Kiểm tra git status, git branch, HEAD hash (Local vs Remote)
12. Plan Resume: Khôi phục Unfinished Plans, Blocked Tasks, Dependencies
13. Báo cáo trạng thái ngắn gọn
```

> **Lưu ý**: `project-workflow.md` định nghĩa đầy đủ quy trình Multi-Agent,
> QA Verification, Memory Management, Session Commands, Production Safety.
> Agent PHẢI đọc và tuân thủ 100% nội dung trong đó.

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


---

## 🔒 INVARIANT RULES: TÀI KHOẢN NGUYỄN ĐỨC QUANG (0968616263 / U1001) ⭐⭐⭐⭐⭐

> ⚠️ **BẢO VỆ VĨNH VIỄN — KHÔNG ĐƯỢC XÓA TRONG MỌI TRƯỜNG HỢP**

1. **Thông tin định danh**:
   - **Họ và tên**: `Nguyễn Đức Quang`
   - **Số điện thoại**: `0968616263`
   - **User ID**: `U1001` (Tài khoản người dùng CTV số 1 của hệ thống)
   - **Vai trò (Role)**: Mặc định luôn luôn là **CTV** (`role: 'ctv'`, `isSystemParticipant: true`).

2. **Chính sách Reset Test & Factory Reset**:
   - Khi Admin hoặc hệ thống chạy Reset Test / Factory Reset (`POST /api/admin/factory-reset`), Reset Members (`POST /api/admin/reset-members`), hoặc chạy script dọn dẹp dữ liệu:
     - **KHÔNG ĐƯỢC XÓA** tài khoản `0968616263` / `U1001`.
     - Lệnh xóa người dùng phải luôn có điều kiện loại trừ:
       `role: { not: 'admin' }, phone: { not: '0968616263' }, userId: { not: 'U1001' }`
     - Làm sạch dữ liệu giao dịch của tài khoản (đưa về trạng thái ban đầu):
       `qualifyingPoints: 0, sPoints: 0, rank: null, parentId: null, role: 'ctv', isSystemParticipant: true`.
     - Nếu cơ sở dữ liệu chưa có tài khoản này (ví dụ khởi tạo DB mới), Factory Reset tự động tạo mới tài khoản `U1001` - `Nguyễn Đức Quang` - `0968616263` với vai trò CTV.

3. **Chống xóa đơn lẻ**:
   - Route xóa người dùng `DELETE /api/users/:userId` tuyệt đối không cho phép xóa tài khoản `0968616263` / `U1001`.

4. **Đánh số thứ tự UID (getNextUserId)**:
   - Hệ thống sinh User ID tự động dạng `U1001`, `U1002`, `U1003`...
   - Do `U1001` thuộc về Nguyễn Đức Quang, tài khoản đăng ký mới tiếp theo sẽ nhận mã `U1002`.

5. **Ẩn nút Xóa trên giao diện quản trị (UI Invariant)**:
   - Trong trang Quản Lý CTV (`AdminCTVManagement.tsx`) hoặc bất kỳ màn hình quản lý nào:
   - Tuyệt đối **ẨN HOÀN TOÀN** nút "Xóa CTV" / "Xóa tài khoản" khi giao diện hiển thị thông tin tài khoản `Nguyễn Đức Quang` (`userId === 'U1001'` hoặc `phone === '0968616263'`).

