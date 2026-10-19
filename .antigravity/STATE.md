# STATE.md — WasyPro
> Cập nhật: 2026-10-19

## Trạng thái hiện tại: STABLE

## Việc đã hoàn thành (phiên 2026-10-15)

### 1. Zalo Reviewer Bypass — COMMENTED OUT
- src/App.tsx: isReviewerPhone → luôn trả false
- src/components/CheckoutModal.tsx: isReviewerPhone → luôn trả false
- Prefix // ZALO_REVIEWER_BYPASS: để dễ tìm khi cần bật lại
- Build đã pass, deploy xong

### 2. Zalo API Domains
- Đã thêm https://test.wasypro.com và https://wasypro.com
- Trạng thái: CẦN BẬT lên trong Zalo Developer Console (hiện đang Tắt)

### 3. wasypro.com — SSL qua Cloudflare ✅
- Không cần certbot, Cloudflare lo SSL

### 4. WasyPro Mobile App — Monorepo khởi tạo
- Thư mục: /var/www/wasypro-mobile
- Stack: React Native + Expo ~51 + NativeWind v4
- Shared API client: packages/api-client (axios, base: wasypro.com)
- CTV App: apps/ctv-app (Bundle: com.wasypro.ctv)
- 5 tabs: Dashboard/Orders/Commissions/Network/More
- Auth screen hoàn chỉnh
- Dashboard + 9 tiles placeholder
- Git init + commit đầu tiên

## Việc CÒN LẠI / TODO

### Mobile App (Phase 1 — 12 tuần)
- [ ] Week 3-4: Dashboard data thật, Commission screens
- [ ] Week 5-6: Orders + CreateOrder flow
- [ ] Week 7-8: Network tree, Customers, More menu
- [ ] Week 9-10: Push notifications, Biometric, QR scanner
- [ ] Week 11-12: Polish + EAS Build + Store submit
- [ ] Cần: Apple Developer Account (/năm)
- [ ] Cần: Push code lên GitHub repo riêng (wasypro-mobile)

### Deployment wasypro.com
- [ ] Bật Zalo API Domains trong Developer Console
- [ ] Test Zalo Mini App trên wasypro.com (production)

## Môi trường
- VPS: 34.173.189.105, user: mapgovn
- Web source: /var/www/wasypro
- Mobile source: /var/www/wasypro-mobile
- Backend: port 3011 (index.js)
- Frontend Admin: port 5005
- Frontend CTV: port 5175
- DB: /var/www/wasypro/server/dev.db (SQLite)
