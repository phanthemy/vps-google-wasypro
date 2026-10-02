# WASYPRO — Trạng Thái Dự Án
> Cập nhật: 2026-10-02 08:50 (phiên sáng — máy công ty)

## Trạng thái hiện tại: ✅ STABLE — Sẵn sàng nhận task mới

## HEAD commit: `61a4801` (branch: main)

## Việc đã làm phiên 02/10/2026 (06:31 - 08:50):

### ✅ Hoàn thành:
1. **#1 Sort giá cao→thấp** — `a51159e` ✅
2. **#2a Category CRUD Admin** — `a51159e` ✅
3. **#2b Dynamic Categories Homepage** — Fix crash self-referencing const → `e3c05f0` ✅
4. **#3 CTV Order Flow Overhaul** — Multi-product cart + price display + product popup → `26bb6ef` ✅
5. **Admin Password Reset đơn giản** — 1 field, auto-gen wasy####, copy button → `6ba4e4a`, `3c2568e` ✅
6. **CTV/Member Password Reset đơn giản** — wasy#### format + inline success → `694a960` ✅
7. **CTV tự đổi mật khẩu** — API `/api/auth/change-password` + UI trong SettingsView → `b574c77` ✅
8. **Fix lỗi setSuccess undefined** — AdminCTVManagement + AdminMembersView → `e05915b` ✅
9. **SYSTEM_MAP.md** — Bản đồ kỹ thuật 152 API, 22 components, 38 models → `45e4560` ✅
10. **Startup Checklist cập nhật** — Thêm SYSTEM_MAP.md → `61a4801` ✅

### ⚠️ Cần theo dõi:
- `erp-unified` (PM2 id 13) đã bị STOP vì port conflict
- wasypro-ctv KHÔNG có git riêng — code sửa trực tiếp trên VPS
- CTV views tồn tại ở CẢ HAI app (wasypro + wasypro-ctv) — phải sửa cả 2

### 🔄 Có thể làm tiếp:
- Test đổi MK CTV end-to-end (admin reset → CTV login → đổi MK → login MK mới)
- mustChangePassword auto-redirect khi CTV login (chưa làm — chỉ hiện section trong Settings)
- Kiểm tra flow đăng ký 3 chương trình end-to-end

## Files quan trọng đã sửa hôm nay:
- `server/index.js` — API /api/auth/change-password, mustChangePassword on reset, wasy#### format
- `src/components/admin/AdminCTVManagement.tsx` — Fix setSuccess → alert
- `src/components/admin/AdminMembersView.tsx` — Fix setSuccess → alert
- `src/components/admin/AdminUsers.tsx` — Simplified password modal (1 field, auto-gen)
- `src/components/ctv/views/SettingsView.jsx` — ChangePasswordSection (wasypro)
- `src/components/ctv/views/CreateOrderModal.jsx` — Multi-product cart overhaul
- `src/components/ProductSection.tsx` — Dynamic categories fetch
- `/var/www/wasypro-ctv/src/views/SettingsView.jsx` — ChangePasswordSection (CTV portal)
- `SYSTEM_MAP.md` — MỚI: Bản đồ kỹ thuật toàn hệ thống
- `AGENTS.md` — Cập nhật startup checklist
- `loi.md` — L31 (setSuccess undefined), L32 (sửa nhầm file)

## Tài khoản test:
- Admin: 0968616263 (Nguyễn Đức Quang, ADM_QUANG) — MK: Test123!
- Reset hệ thống: 0999999999 (ADMIN01) — chỉ TK này thấy menu Reset
- CTV mặc định: 0937353535 (U1001) — KHÔNG BAO GIỜ XÓA
- CTV test: 0933893539 (U1002, Phan Thế Mxy)

## Architecture chính:
- wasypro (port 5005) = Landing + Admin → wasypro.com
- wasypro-ctv (port 5175) = CTV Portal → app.wasypro.com  
- happylife-backend (port 3011) = Backend API chung
- Database: SQLite /var/www/wasypro/server/dev.db
- Chi tiết đầy đủ: xem SYSTEM_MAP.md
