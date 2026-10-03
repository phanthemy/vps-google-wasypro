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
2. Đọc BUSINESS_RULES.md ⭐⭐⭐ (10 quy tắc bất biến gồm Tiêu Chuẩn Kỹ Thuật Popup/Modal — VI PHẠM = BUG PRODUCTION)
3. Đọc .agents/rules/project-workflow.md (AI Engineering Playbook)
4. Đọc SYSTEM_MAP.md ⭐⭐⭐ (Bản đồ định vị GPS: Port, App, API, State — Tuân thủ Drift Check)
5. Xác định Source of Truth → Nếu VPS → KHÔNG sửa local
6. git pull (trên VPS hoặc local tùy Source of Truth)
7. Đọc README.md
8. Đọc .antigravity/STATE.md
9. Đọc .antigravity/project.json
10. Đọc memory.md (nhật ký bộ nhớ & quyết định kỹ thuật)
11. Đọc loi.md (sổ tay lỗi & cách fix)
12. Đọc changelog.md (lịch sử cập nhật)
13. Kiểm tra git status, git branch, HEAD hash (Local vs Remote)
14. Plan Resume: Khôi phục Unfinished Plans, Blocked Tasks, Dependencies
15. Báo cáo trạng thái ngắn gọn
```

> ⚠️ **QUY TẮC VÀNG — TRƯỚC KHI SỬA CODE** ⭐⭐⭐⭐⭐
> 1. `git log --oneline | grep <keyword>` — tìm commit gốc tạo tính năng liên quan
> 2. Đọc `BUSINESS_RULES.md` — check có invariant nào bị ảnh hưởng không
> 3. **INVARIANT: SYSTEM MAP DRIFT CHECK**:
>    `SYSTEM_MAP.md` chỉ được sử dụng để định vị (technical navigation / GPS index). Trước mọi thay đổi code, Agent **BẮT BUỘC** mở và xác minh source thực tế tương ứng. Nếu `SYSTEM_MAP.md` và source không khớp, phải đánh dấu `SYSTEM_MAP_DRIFT`, dừng implementation, xác định nguồn sự thật (Source code, Git hay Production) và cập nhật map trước khi tiếp tục. Không được coi `SYSTEM_MAP.md` là source of truth.
>    *(Tuyệt đối KHÔNG tuyên bố rằng `SYSTEM_MAP.md` loại bỏ hoàn toàn bug; nó chỉ giảm mạnh nguy cơ sửa nhầm app/file nhưng không đảm bảo tuyệt đối)*.
> 4. Nếu thêm flow mới → tìm guard/check trong flow cũ → port sang flow mới
5. Mọi popup/modal mới hoặc sửa đổi BẮT BUỘC tuân thủ Quy chuẩn Kỹ thuật 3 tầng tại SYSTEM_MAP.md Section 11 và BUSINESS_RULES.md Rule 10 (Nút [X] Sticky Header min 36px, max-h-[90dvh], tuyệt đối chống trôi và chống xê dịch)
> 5. KHÔNG xóa/sửa tính năng cũ nếu chưa hiểu tại sao nó tồn tại

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

## 🔒 INVARIANT RULES: TÀI KHOẢN HỆ THỐNG ⭐⭐⭐⭐⭐

> ⚠️ **BẢO VỆ VĨNH VIỄN — KHÔNG ĐƯỢC XÓA TRONG MỌI TRƯỜNG HỢP**

### Tài khoản Admin chính: Nguyễn Đức Quang (0968616263)
- **Vai trò**: Admin (`role: 'admin'`)
- **Quyền đặc biệt**: Đổi mật khẩu trong bảng quản trị Admin (Tài Khoản Admin)
- **KHÔNG BAO GIỜ bị xóa** khi reset

### Tài khoản CTV mặc định: 0937353535 (U1001)
1. **Thông tin định danh**:
   - **Số điện thoại**: `0937353535`
   - **User ID**: `U1001` (Tài khoản CTV mặc định số 1 của hệ thống)
   - **Vai trò (Role)**: Mặc định luôn luôn là **CTV** (`role: 'ctv'`, `isSystemParticipant: true`).

2. **Chính sách Reset Test & Factory Reset**:
   - Khi chạy Factory Reset / Reset Members:
     - **KHÔNG ĐƯỢC XÓA** tài khoản `0937353535` / `U1001`.
     - Lệnh xóa: `phone: { not: '0937353535' }, userId: { not: 'U1001' }`
     - Làm sạch dữ liệu: `qualifyingPoints: 0, sPoints: 0, rank: null, parentId: null, role: 'ctv', isSystemParticipant: true`.
     - Nếu DB chưa có → tự động seed tài khoản `U1001`.

3. **Chống xóa đơn lẻ**:
   - `DELETE /api/users/:userId` không cho phép xóa `0937353535` / `U1001`.

4. **Đánh số UID**: `U1001` → `U1002` → `U1003`...

5. **Ẩn nút Xóa** khi hiển thị tài khoản `U1001` hoặc `0937353535`.

### Tài khoản Reset hệ thống: 0999999999
- **CHỈ tài khoản 0999999999** mới thấy và sử dụng menu "Hệ Thống" (Factory Reset, Reset Members, Reset CTV).
- Các tài khoản admin khác **KHÔNG thấy** menu này.
- Backend enforce: `if (req.user.phone !== '0999999999') → 403`

