# WASYPRO — Trạng Thái Dự Án
> Cập nhật: 2026-10-01 19:14 (kết thúc phiên công ty)

## Trạng thái hiện tại: ✅ STABLE — Sẵn sàng nhận task mới

## HEAD commit: `bebe2aa` (branch: main)

## Việc đã làm phiên 01/10/2026:

### ✅ Hoàn thành:
1. **Banner cache-busting** — Thêm `?v=20261001` vào URL banner (`953490c`)
2. **VPS tối ưu** — Stop `erp-unified` (322,828 restarts, port conflict). CPU 64.5% → 9.8%
3. **Form đăng ký 3 chương trình** — Đại sứ / NPP (gói PRODUCT_COMBO) / Cổ đông (gói CAPITAL) (`81cb28d`)
4. **Fix CTV mua hàng trang chủ** — CTV có rank bấm MUA NGAY → redirect CTV Portal (`4857aed`)
5. **BUSINESS_RULES.md** — 9 quy tắc bất biến, agent đọc trước khi code (`0790625`)
6. **AGENTS.md** — Thêm golden rules + BUSINESS_RULES.md vào startup checklist (`bebe2aa`)
7. **loi.md** — L19 (CTV bypass portal), L20 (agent xóa sai tính năng)
8. **memory.md** — Ghi bài học phiên 01/10

### ⚠️ Cần theo dõi:
- `erp-unified` (PM2 id 13) đã bị STOP vì port 3033 conflict. Nếu cần dùng lại phải fix port.
- `wasypro` PM2 restart count = 257 (do nhiều lần build hôm nay, bình thường)
- `happylife-backend` restart count = 55

### 🔄 Việc có thể làm tiếp:
- Banner images chưa git commit (3 file .jpg trong public/images/ — đã trên VPS, chưa push)
- CTV Portal interior: User đã nói "popup đăng kí đã ổn" nhưng chưa confirm rõ interior
- Kiểm tra flow đăng ký end-to-end (3 chương trình mới)

## Files quan trọng đã sửa hôm nay:
- `/var/www/wasypro/src/components/auth/UnifiedAuthModal.tsx` — Form đăng ký 3 radio
- `/var/www/wasypro/src/App.tsx` — CTV rank check trên onOrderProduct
- `/var/www/wasypro/src/components/Hero.tsx` — Banner cache-busting
- `/var/www/wasypro/src/src/index.css` — Global CSS palette (phiên trước)
- `/var/www/wasypro/tailwind.config.js` — Tailwind palette (phiên trước)
- `/var/www/wasypro/BUSINESS_RULES.md` — MỚI: 9 invariant rules
- `/var/www/wasypro/AGENTS.md` — Thêm golden rules
- `/var/www/wasypro/loi.md` — L19, L20
- `/var/www/wasypro/memory.md` — Session 01/10

## Tài khoản test:
- Admin: 0968616263 (Nguyễn Đức Quang, ADM_QUANG)
- Reset: 0999999999 (ADMIN01)
- CTV mặc định: 0937353535 (Nguyễn Đức Quang, U1001) — KHÔNG XÓA
- CTV test: 0933893539 (U1006, Phan Thế Mỹ)
