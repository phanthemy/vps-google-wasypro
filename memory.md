# WasyPro — Memory Log

## Cập nhật: 2026-10-02

### Phiên 02/10/2026 (06:31 - 08:50) — Password Management + System Map

#### Quyết định kỹ thuật:
1. **CTV portal là app RIÊNG** (`/var/www/wasypro-ctv`, port 5175, React 19) — KHÔNG share code với wasypro
2. **Sửa CTV views → phải sửa CẢ HAI thư mục** (wasypro + wasypro-ctv)
3. **setSuccess không tồn tại** trong AdminCTVManagement và AdminMembersView → dùng alert() thay thế
4. **MK reset format**: `wasy` + 4 ký tự random (VD: wasy4r5u)
5. **mustChangePassword**: Backend set `true` khi admin reset → CTV login thấy cảnh báo đổi MK
6. **API đổi MK**: POST /api/auth/change-password — skip currentPassword check nếu mustChangePassword=true
7. **Playwright test**: Chạy từ LOCAL (máy Windows), KHÔNG chạy trên VPS headless

#### Bài học lỗi:
- L31: Gọi `setSuccess()` mà chưa khai báo useState → crash → hiện "Lỗi kết nối máy chủ" dù API OK
- L32: Sửa SettingsView.jsx ở `/var/www/wasypro` nhưng CTV portal dùng `/var/www/wasypro-ctv`
- **Phòng tránh**: Trước khi code, đọc SYSTEM_MAP.md + grep useState

#### SYSTEM_MAP.md — Giải pháp phòng lỗi:
- Quét toàn bộ: 152 API, 22 admin components (liệt kê từng useState), 17 CTV views x 2 app, 38 DB models
- File: `/var/www/wasypro/SYSTEM_MAP.md`
- Đã thêm vào Startup Checklist (AGENTS.md)

---

### Phiên 01/10/2026 — Banner, Registration, Business Rules

#### Quyết định kỹ thuật:
1. Banner cache-busting `?v=20261001`
2. Form đăng ký 3 chương trình (Đại sứ / NPP / Cổ đông)
3. CTV có rank bấm MUA NGAY → redirect CTV Portal
4. BUSINESS_RULES.md — 9 quy tắc bất biến

#### Bài học lỗi:
- L19: CTV bypass portal khi mua hàng trên trang chủ
- L20: Agent xóa sai tính năng khi không hiểu context

---

### Phiên 30/09/2026 — OTP Zalo, Swap tài khoản, Logic CTV

#### Quyết định kỹ thuật:
1. OTP Zalo: Dùng ZNS template, không Zalo Login
2. Swap tài khoản 0937353535 ↔ 0968616263
3. isSystemParticipant flag cho CTV mặc định

---

### Phiên 29/09/2026 — Commission Engine, Rank System

#### Quyết định kỹ thuật:
1. Commission tính từ basePoints × rate (KHÔNG từ price)
2. 4 loại: SELF_BUY, DIRECT_NO_ID, DIRECT_WITH_ID, F1/F2
3. Rank: Ambassador(20%) → Manager(25%) → Director(30%)
