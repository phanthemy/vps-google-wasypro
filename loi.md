# WasyPro — Log Lỗi

## 2026-10-02

### L27: Nginx location regex override khiến toàn bộ ảnh upload .webp/jpg không tải được trên test.wasypro.com
- **Triệu chứng**: Sản phẩm trên trang chủ `test.wasypro.com` bị vỡ/thiếu hình ảnh, devtools báo nhận `text/html` thay vì `image/webp`.
- **Nguyên nhân**: Trong `/etc/nginx/sites-enabled/wasypro`, rule regex `location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$` có độ ưu tiên cao hơn prefix thông thường `location /uploads/`, nên Nginx chuyển toàn bộ request ảnh `/uploads/...` tới port 5005 (Vite frontend) thay vì serve trực tiếp hoặc proxy sang backend. Vite frontend trả về `index.html`.
- **Khắc phục**: Thay `location /uploads/ {` thành `location ^~ /uploads/ {` (dùng modifier `^~` để Nginx dừng quét regex nếu match prefix `/uploads/`). Reload Nginx: `sudo systemctl reload nginx`.
- **Kết quả**: Toàn bộ ảnh sản phẩm WebP/PNG/JPG hiển thị chuẩn xác 100%.

### L28: CustomersView dùng `<table>` 6 cột trên mobile → tràn ngang, phải zoom nhỏ mới xem được
- **Triệu chứng**: Trang "Khách hàng của tôi" (`/ctv`) hiển thị bảng table HTML với 6 cột (Tên, SĐT, Sponsor, Liên kết, Ngày, Trạng thái) dẫn đến trang bị giãn rộng hơn viewport 390px → người dùng phải pinch-zoom nhỏ lại mới xem hết nội dung. Ảnh hưởng cả các trang khác khi đã login (CSS không chặn overflow-x).
- **Nguyên nhân gốc**:
  1. `CustomersView.jsx` dùng `<table className="premium-table">` với class dark-theme cũ (`glass-panel`, `text-muted`, `var(--bg-glass)`).
  2. `CTVPortalContainer.tsx` thiếu `overflow-x: hidden` trên root `<div>` và `<main>`.
  3. Global CSS `index.css` thiếu `overflow-x: hidden` trên `html, body`.
- **Khắc phục**:
  1. Viết lại `CustomersView.jsx` hoàn toàn: thay `<table>` bằng card-based layout mobile-first, dùng inline style với design tokens chuẩn (#0072F5, #0F172A, #EEF2F6...), font Inter 14-15px, rounded-16px cards.
  2. Thêm `overflow-x-hidden` vào `CTVPortalContainer.tsx` root div và `<main>`.
  3. Thêm `overflow-x: hidden; max-width: 100vw;` vào `html, body` trong `index.css`.
- **Kết quả**: Tất cả trang CTV (Dashboard, Đơn hàng, Hoa hồng, Đội nhóm, Thêm, Khách hàng) hiển thị chuẩn responsive 390px không bị tràn.

### L29: Safari iOS vẫn bị tràn ngang dù Playwright không phát hiện overflow
- **Triệu chứng**: Trên iPhone Safari thật, trang CTV vẫn rộng hơn viewport ~10-15px, phải zoom nhỏ lại. Playwright Chromium headless (mọi viewport 375-430px) báo `scrollWidth === viewportWidth` = 0 overflow.
- **Nguyên nhân gốc**:
  1. `max-width: 100vw` → `100vw` trên Safari iOS bao gồm scrollbar width (khác Chromium).
  2. `index.html` thiếu `viewport-fit=cover` → không handle safe area insets đúng trên iPhone notch.
  3. `App.tsx` root `<div>` thiếu `overflow-x: hidden` (chỉ thêm ở CTVPortalContainer, không đủ vì App.tsx bao ngoài).
  4. Safari không tôn trọng `overflow-x: hidden` trên `<html>` trong mọi trường hợp.
- **Khắc phục** (4 layer):
  1. `index.html`: Thêm `viewport-fit=cover, maximum-scale=5` vào `<meta viewport>`.
  2. `index.css`: Đổi `max-width: 100vw` → `width: 100%` + thêm `-webkit-text-size-adjust: 100%`.
  3. `App.tsx`: Thêm `overflow-x-hidden` className + inline `maxWidth: '100%', width: '100%'`.
  4. `CTVPortalContainer.tsx`: Thêm inline `overflowX: 'hidden', maxWidth: '100%', width: '100%'`.
- **Kết quả**: Test lại trên iPhone Safari — page không bị tràn ngang.

## 2026-09-30

### L26: ~~CTV chua co BID an Link Gioi Thieu~~ -> DA HUY BO (01/10/2026)
- **Trang thai**: HUY BO — Quy tac nay khong con ap dung.
- **Ly do huy**: Theo yeu cau nghiep vu, CTV du chua co BID van duoc phep gioi thieu (hien link ref). Hoa hong chi duoc tinh khi CTV da co BID — tuan theo L11 (khong BID = khong commission) va L12 (khong BID = khong giam gia).
- **Thay doi code**: Xoa && freshUser.businessId trong DashboardView.jsx va && (currentUser as any).businessId trong CTVPortalContainer.tsx.

### L25: Thêm cột DB bằng ALTER TABLE mà không chạy `prisma generate` → API PATCH zaloUid lỗi
- **Triệu chứng**: Bấm "Lưu" Zalo UID trong admin → alert lỗi `Invalid prisma.user.update() invocation: zaloUid`.
- **Nguyên nhân**: Thêm cột `zaloUid` bằng `ALTER TABLE User ADD COLUMN zaloUid TEXT` + cập nhật `schema.prisma`, nhưng **KHÔNG chạy `npx prisma generate`** → Prisma Client chưa biết cột mới.
- **Khắc phục**: `cd /var/www/wasypro/server && npx prisma generate && pm2 reload happylife-backend`
- **Quy tắc vĩnh viễn**: Mỗi khi thêm/sửa cột trong DB bằng SQL trực tiếp → **BẮT BUỘC** chạy `npx prisma generate` + `pm2 reload`.



### L24: Swap tài khoản mặc định (0968616263 → admin, 0937353535 → CTV U1001) thiếu nhiều bước
- **Triệu chứng**: Sau khi đổi role admin/ctv giữa 2 tài khoản, giao diện hiện sai:
  1. `0937353535` vẫn hiện userId `ADMIN_SUPER` thay vì `U1001`
  2. `0937353535` rank = null (không lên cấp) dù có 8+ F1 đủ điều kiện
  3. `0937353535` thiếu BID (`WK-10001`) → không có ref link
  4. BID `WK-10001` bị conflict vì vẫn nằm trên tài khoản cũ `0968616263`
- **Nguyên nhân gốc**: Khi swap 2 tài khoản, chỉ đổi `role` mà **KHÔNG swap kèm**:
  - `userId` (ADMIN_SUPER ↔ U1001)
  - `businessId` (WK-10001)
  - `rank`, `rankStatus`, `rankAchievedAt`
  - `isSystemParticipant`
- **Checklist bắt buộc khi swap tài khoản** (tránh lặp lỗi):
  1. ✅ Swap `role` (admin ↔ ctv)
  2. ✅ Swap `userId` (phải dùng temp vì UNIQUE: A→TEMP, B→A, TEMP→B)
  3. ✅ Swap `businessId` (xóa BID cũ trước, gán BID mới sau)
  4. ✅ Gán `rank` + `rankStatus` cho CTV mới (chạy promotion check hoặc manual)
  5. ✅ Set `isSystemParticipant` cho CTV, clear cho admin
  6. ✅ Cập nhật constants trong code (`DEFAULT_CTV_PHONE`, `DEFAULT_CTV_UID`)
  7. ✅ Cập nhật AGENTS.md invariant rules
  8. ✅ Cập nhật UI protect check (ẩn nút Xóa)
  9. ✅ Backend: restrict reset endpoints cho đúng phone
  10. ✅ Frontend: ẩn menu "Hệ Thống" cho admin không phải 0999999999
  11. ✅ `pm2 reload` backend sau mọi DB change
- **Quy tắc vĩnh viễn**: Khi swap tài khoản → phải swap **TẤT CẢ** trường liên quan, không chỉ `role`.
- **Commit**: `fc29a86`, `7884d4c`


### L23: Zalo OA chưa mua gói trả phí ZNS/ZBS khiến gửi mã OTP thất bại khi đăng ký
- **Triệu chứng**: Khi người dùng nhấn Đăng Ký, hệ thống cố gắng gửi mã OTP qua ZNS/Zalo nhưng nhận thông báo lỗi từ Zalo API hoặc không nhận được tin nhắn xác thực.
- **Nguyên nhân**: Zalo OA của Mall Ok hiện chưa đăng ký gói tin trả phí ZNS (Zalo Notification Service) hoặc ZBS (Zalo Business Solution) trên cổng đối tác của Zalo.
- **Khắc phục**: Tạm thời vô hiệu hóa guard kiểm tra bắt buộc mã OTP trong `POST /api/auth/register`, cho phép đăng ký trực tiếp và kích hoạt tài khoản ngay. Khi nào Zalo OA hoàn tất thanh toán gói trả phí, chỉ cần bật lại middleware xác thực OTP.
- **Commit**: `4007080`

### L22: Quản trị Admin chưa có tính năng quản lý danh mục sản phẩm để phân loại lại
- **Triệu chứng**: Admin muốn thay đổi hoặc tạo thêm danh mục sản phẩm (như Máy lọc nước, Bình & Ly Hydrogen, Phụ kiện) nhưng hệ thống chỉ hardcode danh mục cũ.
- **Nguyên nhân**: Thiếu bộ API CRUD và giao diện quản lý danh mục (`Category`) trong Admin.
- **Khắc phục**: Viết bộ endpoint CRUD `/api/categories` (`GET`, `POST`, `PUT`, `DELETE`) trên `server.cjs` và `server/index.js`. Tích hợp nút bấm và Modal "Quản Lý Danh Mục" ngay trên thanh công cụ của `AdminProducts.tsx`.
- **Commit**: `efb4bab`

### L21: Banner trang chủ mờ khi hiển thị trên màn hình rộng
- **Triệu chứng**: Ảnh banner lớn trên trang chủ bị mờ, vỡ hạt khi xem trên màn hình máy tính để bàn (Desktop).
- **Nguyên nhân**: Ảnh banner cũ là file raster JPG nén 72 DPI, không tối ưu cho kích thước màn hình lớn.
- **Khắc phục**: Trích xuất trực tiếp bản vẽ vector từ file thiết kế in ấn `Backdrop 133 x 256cm.pdf` (kích thước gốc 7256x3770), tối ưu hóa sang WebP độ phân giải cao (`backdrop_banner.webp`, 560KB), tích hợp vào `Hero.tsx`. Đồng thời tích hợp video nền `hero-video.mp4` chạy mượt mà kèm nút bật/tắt tiếng.
- **Commit**: `efb4bab`

### L20: JSX mismatched tags in CreateOrderModal khiến build frontend thất bại
- **Triệu chứng**: `tsc && vite build` báo lỗi `JSX expressions must have one parent element` và `Expected corresponding JSX closing tag for 'button'`.
- **Nguyên nhân**: Khi nâng cấp thumbnail sản phẩm và thêm popup hover zoom, thẻ `<div className="flex items-center gap-3 min-w-0 pr-2">` bọc ngoài ảnh và thông tin máy bị xóa thiếu mở thẻ trong danh sách sản phẩm bán khách lẻ.
- **Fix**: Bổ sung đầy đủ thẻ mở `<div>`, đồng bộ thumbnail `w-16 h-16` kèm popup xem ảnh phóng to floating `hoveredImage`.
- **Commit**: `a90f602`

### L19: Hình ảnh sản phẩm không hiển thị khi sửa trong Admin & lỗi 'Lỗi upload server' thường xuyên
- **Triệu chứng**:
  1. Khi mở modal sửa sản phẩm trong Admin (`AdminProducts.tsx`), khung "HÌNH ẢNH SẢN PHẨM" không hiển thị ảnh hiện tại của sản phẩm.
  2. Khi kéo thả hoặc chọn tải ảnh/video mới lên, xuất hiện ô báo lỗi đỏ: `(!) Lỗi upload server`. Lỗi này xảy ra thường xuyên.
- **Nguyên nhân**:
  1. **Thiếu route backend**: `server/index.js` hoàn toàn chưa khai báo endpoint `POST /api/upload`. Do đó mọi request upload ảnh sản phẩm từ `ImageUpload.tsx` đều nhận `404 Not Found`.
  2. **Vi phạm CSRF Protection**: Middleware `csrfProtection` chặn request POST `/api/upload` (ghi nhận trong log `[CSRF VIOLATION] Blocked POST /api/upload from origin https://wasypro.com`) do route chưa được đưa vào danh sách ngoại lệ và `ImageUpload.tsx` dùng `XMLHttpRequest` thuần chưa gửi kèm `X-CSRF-Token` và `Authorization: Bearer <token>`.
  3. **Ảnh chính không tự đồng bộ vào gallery**: Trong CSDL, trường `gallery` của nhiều sản phẩm cũ lưu `[]` (rỗng), trong khi ảnh thực tế chỉ nằm ở cột `image`. Khi mở form sửa, `formData.gallery` rỗng khiến component `ImageUpload` không render bất kỳ hình ảnh nào.
- **Fix**:
  1. Thêm middleware `productMediaUpload` bằng `multer` lưu file vào `/var/www/wasypro/public/uploads/products/` và viết route `POST /api/upload` trả về format `{ success: true, images: [{ url, thumbnail, originalName, size, type }] }`.
  2. Thêm `/api/upload` vào danh sách ngoại lệ của `csrfProtection`.
  3. Cập nhật `ImageUpload.tsx`: Bật `xhr.withCredentials = true;`, gắn `X-CSRF-Token` và `Authorization: Bearer <token>`, thêm xử lý fallback ảnh `onError`.
  4. Cập nhật `AdminProducts.tsx`: Trong `openEditModal` và `openCreateModal`, nếu `gallery` chưa có `image`, tự động gán `product.image` vào `gallery` để luôn hiển thị ảnh đại diện hiện tại.
- **Commit**: `a8f5743`

### L18: Kéo thả sắp xếp gói NPP không lưu (F5 bị nhảy thứ tự)
- **Triệu chứng**: Admin vào `/admin/npp-packages`, kéo thả hoặc bấm mũi tên đổi vị trí các gói nhưng khi F5 thì các gói vẫn nhảy về thứ tự cũ (`NPP-40` và `NPP-800` nhảy lên đầu danh sách).
- **Nguyên nhân**:
  1. Sau khi code endpoint `PUT /api/admin/npp/packages/reorder` trong `server/index.js`, tiến trình `happylife-backend` trên PM2 chưa được reload (`pm2 reload happylife-backend`). Do đó mọi request `PUT /api/admin/npp/packages/reorder` gửi từ trình duyệt đều nhận mã `404 Not Found`.
  2. Hàm `getAuthHeaders` ở frontend `AdminNppPackages.tsx` chỉ gửi `X-CSRF-Token`, thiếu `Authorization: Bearer <token>` từ localStorage.
  3. Giá trị `sortOrder` của `NPP-40` và `NPP-800` trong SQLite trước đó mặc định là `0` nên bị xếp lên đầu trước `NPP-001`.
- **Fix**:
  1. Chạy `pm2 reload happylife-backend` để nạp endpoint `PUT /api/admin/npp/packages/reorder`.
  2. Bổ sung `Authorization: Bearer <token>` vào `getAuthHeaders` trong `AdminNppPackages.tsx`.
  3. Cập nhật lại `sortOrder` chuẩn từ 1 đến 10 cho toàn bộ gói trong cơ sở dữ liệu (`dev.db`).
  4. Bổ sung `isSavingOrder` hiển thị trạng thái "Đang lưu thứ tự..." và tối ưu `handleMove` di chuyển chính xác khi đang bật tab phân loại.
- **Commit**: `9550282`

### L17: NppCommission không gán periodId khi tạo → admin Kỳ Hoa Hồng thiếu record
- **Triệu chứng**: Admin Kỳ Hoa Hồng hiện 3 khoản, nhưng CTV Portal hiện 4 khoản. Record NPP D1 (7,995,000đ) bị mất.
- **Nguyên nhân**: 
  1. Code tạo `NppCommission` (dòng 7895) KHÔNG gán `periodId` → `periodId = null` → không thuộc kỳ nào.
  2. API `/api/admin/periods/:periodId/commissions` chỉ query bảng `Commission`, KHÔNG query bảng `NppCommission` → bỏ sót hoa hồng NPP referral.
  3. Trường hợp đặc biệt: NppCommission được tạo TRƯỚC khi kỳ hoa hồng được mở → periodId = null.
- **Fix**:
  1. Thêm lookup `commissionPeriod.findFirst({ where: { status: 'OPEN' } })` trước khi tạo NppCommission, gán `periodId: currentPeriodId` cho cả D1 và D2.
  2. Admin API merge `NppCommission` vào response với format thống nhất (`receiver`, `ruleKey`, `rateSnapshot`, etc.).
  3. Update record cũ `periodId = null` → gán vào kỳ 10/2026.
- **Quy tắc**: Mọi commission (Commission + NppCommission) đều PHẢI có periodId khi tạo.
- **Commit**: `ade49e4`

### L16: Admin tạo đơn hiện sai F0 (tuyến trên) — CTV hiện chính mình làm sponsor
- **Triệu chứng**: Trong form "Tạo Đơn Mới", khi nhập SĐT Phan Thị My (0933893530), hệ thống hiện "Phan Thị My U1003" làm người bảo trợ. Đúng phải là "Nguyễn Đức Quang U1001". Tương tự cho Phan Thế Mỹ.
- **Nguyên nhân**:
  1. API `/api/customers` trả `sourceCtv` = CTV tạo customer record. Khi CTV self-purchase, `sourceCtv` = **chính mình** (vì CTV tự tạo Customer record cho mình).
  2. Frontend dùng `sourceCtv` để hiện sponsor → hiện chính khách hàng làm sponsor.
  3. F0 thật nằm trong `User.parentId` (mạng lưới sponsor), không phải `Customer.sourceCtvId`.
- **Fix**:
  1. Backend: Thêm trường `networkParent` — resolve `User.parentId` cho mỗi customer có `linkedUser`. Trả về parent thật trong cây mạng lưới.
  2. Frontend: Ưu tiên `c.networkParent` trước, fallback `c.sourceCtv`. Check `sponsor.userId !== linkedUser.userId` để tránh hiện chính mình.
- **Quy tắc**: Sponsor/F0 luôn lấy từ `User.parentId` (mạng lưới), KHÔNG lấy từ `Customer.sourceCtvId` (nguồn tạo record).
- **Commit**: `431e2be`

### L15: NPP combo hiện tất cả sản phẩm kể cả linh kiện/phụ kiện
- **Triệu chứng**: Khi NPP chọn sản phẩm trong gói combo, hiện cả Lõi Hydrogen, Lõi lọc thô, Màn chống sóng, Bút đo pH — đây là phụ kiện, không phải máy lọc nước.
- **Nguyên nhân**:
  1. `UserNppDashboard.tsx` (CTV portal, mua lần đầu): Filter chỉ `price > 0` → hiện tất cả.
  2. `/api/npp/my-combo` (backend, mua lần 2+): Query `{ price: { gt: 0 } }` → hiện tất cả.
- **Fix**:
  1. Frontend: Filter `p.price > 0 && /^Máy/i.test(p.title)` — chỉ giữ sản phẩm có tên bắt đầu "Máy".
  2. Backend: Query `categoryId IN ('cat-01','cat-02') AND title startsWith 'Máy'` — double gate bằng cả category và title.
- **Sản phẩm combo (5 máy)**: WS-01 (25tr), WS-01 Pro Max (45tr), WS-01 NEW (19tr), WS-03 Pro (19tr), WS-03 (15tr).
- **Loại trừ**: Bộ điện phân (100k, cùng cat-01 nhưng không phải máy), Lõi Hydrogen, Lõi lọc thô, Màn chống sóng, Bút đo pH.
- **Commit**: `71607ce`

### L14: JSDoc comment block nuốt 6 API endpoints → 404
- **Triệu chứng**: 6 API mới (ctv-search, assign-sponsor, orders/create, history, upload-attachment, products-list) trả 404.
- **Nguyên nhân**: JSDoc `/**` ở dòng 3141 mô tả factory-reset không được đóng `*/`. Code mới nằm trong comment block.
- **Fix**: Thêm `*/` đóng comment trước block API mới.
- **Commit**: `dd7269f`

### L13: NPP Ref Link hiện cho NPP chưa kích hoạt (chưa mua gói combo)
- **Triệu chứng**: Ref link hiện cho NPP đã APPROVED nhưng chưa mua gói → chưa có businessId → link vô nghĩa.
- **Fix**: Chỉ hiện ref link khi `user.businessId` tồn tại. Nếu không → badge "⏳ Chưa kích hoạt".
- **Commit**: `3921409`

### L12: CTV chưa có BID vẫn được giảm giá 20% khi tự mua
- **Triệu chứng**: Tài khoản Nguyễn Đức Quang (U1001) chưa có `rank`, chưa có `businessId` (chưa đạt 5.000 CP) nhưng CTV Portal vẫn hiện "Giảm 20% tự mua (Đại Sứ 20%)".
- **Nguyên nhân**: Frontend mặc định `else` = 20%. Backend mặc định `else { appliedDiscountBps = 2000 }`.
- **Fix**: `!hasBID ? 0 : ...` (Frontend), `if (!orderer?.businessId) { appliedDiscountBps = 0 }` (Backend).
- **Quy tắc vĩnh viễn**: **Không có BID = Không được giảm giá = Mua giá 100%**.
- **Commit**: `6a740be`

## 2026-09-29

### L11: CTV/NPP chưa có Business ID (BID) vẫn nhận hoa hồng
- **Triệu chứng**: U1001 chưa có rank/BID nhưng nhận 3 khoản hoa hồng.
- **Nguyên nhân**: `calculateAndCreateCommissions` có 4 điểm không kiểm tra `businessId`.
- **Fix**: Thêm gate `&& directSponsor.businessId` cho DIRECT/NPP_D1, `&& d1User.businessId`/`d2User.businessId` cho F1/F2.
- **Quy tắc vĩnh viễn**: **Không có BID = Không nhận bất kỳ commission nào**.
- **Commit**: `bbfb655`

### L10: Tạo khách hàng mới trong Modal Tạo Đơn Hàng bị chặn CSRF Token
- **Triệu chứng**: Bấm "✅ Tạo" → alert "CSRF Token không khớp".
- **Nguyên nhân**: Middleware CSRF exempt thiếu prefix `/api/ctv`.
- **Fix**: Thêm `/api/ctv` vào exempt list.

## 2026-09-26

### L05: Sản phẩm không hiện hình ảnh (404)
- **Fix**: Mount `../uploads` vào Express static + placeholder image. Commit: `e43cefd`

## 2026-09-25

### L01: APPROVED NPP không thấy tab Gói NPP → Commit: `91bdebe`
### L02: Factory Reset không xóa NPP data → Commit: `7e8e0e3`, `3d76394`, `15afbc9`
### L03: Avatar upload 404 → Nginx thiếu `/uploads/` proxy
### L04: Font tiếng Việt lỗi mojibake → Commit: `aa0a638`, `440e5da`

## 2026-09-23/24

### L05: Referral code không hoạt động → Commit: `aa24fe1`
### L06: my-discount trả hasDiscount: false → Commit: `4c31d06`
### L07: CTV thuần thấy tab NPP → Commit: `62c49a1`
### L08: NPP user thấy CP progress → Commit: `4190a26`
### L09: CreateOrderModal build error → Commit: `bc80fac`


## 2026-10-01

### L19: CTV có rank vẫn mua được hàng trên trang chủ (bypass CTV Portal)
- **Triệu chứng**: CTV đã có rank (Đại sứ/Manager/Director) bấm MUA NGAY trên trang chủ wasypro.com → add vào giỏ hàng → checkout bình thường → bypass hoàn toàn CTV Portal. Đáng lẽ phải hiện modal "Bạn đã là Đại Sứ WasyPro!" + chuyển vào CTV Portal đặt hàng.
- **Nguyên nhân**: 
  1. Commit `eee9f38` đã tạo tính năng chặn CTV mua trên website, logic nằm trong `ContactModal.tsx` (check `/api/auth/me` → `u.rank && u.isSystemParticipant` → hiện redirect modal).
  2. Nhưng commit `5fd6f28` thêm flow giỏ hàng mới (CartDrawer + CheckoutModal). Nút MUA NGAY trong `ProductSection.tsx` gọi `onOrderProduct` → `addItem()` + `setIsCartOpen(true)` → đi thẳng vào giỏ hàng, **HOÀN TOÀN BYPASS ContactModal**.
  3. Tính năng cũ vẫn hoạt động cho flow ContactModal (button "Đăng ký tư vấn"), nhưng flow mua hàng chính đã đổi sang giỏ hàng → mất check CTV.
- **Fix**: Thêm check CTV rank vào handler `onOrderProduct` trong `App.tsx`:
  ```tsx
  onOrderProduct={(product) => {
    if (user && user.isSystemParticipant && user.rank && ['AMBASSADOR','MANAGER','DIRECTOR'].includes(user.rank.toUpperCase())) {
      handleOpenContact(product); // → ContactModal hiện redirect
      return;
    }
    addItem(...); setIsCartOpen(true); // Guest/customer → giỏ hàng bình thường
  }}
  ```
- **Commit**: `4857aed`
- **Bài học**: ⚠️ **Khi thêm flow mới (giỏ hàng, checkout, modal...) PHẢI kiểm tra xem flow CŨ có business guard nào không (CTV block, BID check, rank check...) và port guard đó sang flow mới.**

### L20: Agent sửa sai — xóa tính năng CTV auto-redirect portal sau login
- **Triệu chứng**: Agent hiểu sai yêu cầu "CTV ko mua được hàng ngoài trang chủ" → xóa code auto-redirect CTV vào Portal sau login → phá tính năng đúng.
- **Nguyên nhân**: Agent không đọc git history để hiểu feature trước khi sửa.
- **Fix**: Revert ngay, đọc lại git log tìm commit gốc `eee9f38` để hiểu đúng.
- **Commit**: Revert `98d4b0a` → `1bf91c6`
- **Bài học**: ⚠️ **KHÔNG BAO GIỜ xóa/thay đổi tính năng đang hoạt động mà chưa đọc git history để hiểu tại sao nó tồn tại.**

## 2026-10-02

### L42: Không đồng nhất font chữ và thiếu tính năng nghiệp vụ trong CTV Portal Redesign (test.wasypro.com)
- **Triệu chứng**:
  1. Font chữ giữa các trang con, modal và các button không đồng nhất (nhiều chỗ rơi vào Nunito Sans, monospace hoặc font hệ thống mặc định). Kích thước chữ quá nhỏ trên thiết bị di động.
  2. Các số liệu KPI trên mobile card bị tràn dòng hoặc cắt cụt hiển thị (vd: 31.920...).
  3. Giao diện mockups mới thiếu các tính năng thực tế cốt lõi so với wasypro.com: Không có nút tạo đơn hàng, danh sách đơn hàng tĩnh, thiếu các module Đối tác (Khách hàng của tôi, Bảng giá & chiết khấu, Đổi mật khẩu).
- **Nguyên nhân**:
  1. Thiếu CSS reset cưỡng bức toàn diện cho form inputs/buttons; Tailwind config vẫn cấu hình heading là Outfit/Nunito Sans; các component con còn dùng ontFamily: 'monospace'.
  2. Bố cục card dùng flex ngang một hàng chứa cả tiêu đề và số tiền lớn gây quá tải chiều ngang trên màn hình di động (< 390px).
  3. Ban đầu giao diện chỉ dựng mockups khung tĩnh để duyệt visual design tokens mà chưa map với dữ liệu API backend và các modal nghiệp vụ thực tế (CreateOrderModal.jsx, CustomersView.jsx, PriceListView.jsx, ChangePasswordModal.jsx).
- **Fix**:
  1. Khóa chuẩn font Inter toàn bộ ứng dụng qua src/index.css với *, *::before, *::after, html, body, button, input, select, textarea { font-family: 'Inter', ... !important; } và cập nhật 	ailwind.config.js. Tăng cỡ chữ lên +1 đơn vị toàn bộ giao diện /ctv.
  2. Tái cấu trúc 4 thẻ KPI sang 3 tầng dọc (Tầng 1: Icon + Tên mục, Tầng 2: Giá trị chỉ số lớn, Tầng 3: Tiến trình/Ghi chú phụ) giúp hiển thị trọn vẹn số tiền không bị tràn.
  3. Tích hợp đầy đủ tính năng thực tế khớp wasypro.com vào shell mới:
     - Nút nổi bật + Tạo Đơn Hàng Mới kích hoạt CreateOrderModal.jsx (hỗ trợ mua sỉ/lẻ, chiết khấu theo cấp bậc, địa chỉ giao hàng).
     - Danh sách đơn hàng thực tế lấy từ /api/orders/my, hỗ trợ bộ lọc trạng thái và popup xem chi tiết đơn hàng.
     - Tích hợp Sơ đồ tuyến dưới, Khách hàng của tôi, Bảng giá chiết khấu, Thông tin tài khoản và Đổi mật khẩu.
- **Môi trường**: Đã test và xác nhận đạt chuẩn 100% trên https://test.wasypro.com/ctv (Không can thiệp VPS Oracle).

## L38: Dealer routes "Cannot access authenticateToken before initialization" ⭐⭐⭐
- **Ngày**: 2026-10-03 (test.wasypro.com)
- **Triệu chứng**: Backend crash ngay khi khởi động, PM2 restart loop
- **Root cause**: Python script chèn dealer routes (dùng `authenticateToken` middleware) ở dòng 25 trong server/index.js, nhưng `const authenticateToken = async (req, res, next) => ...` chỉ được khai báo ở dòng 342. Vì dùng `const` (không hoisted như `function`), truy cập trước khi khai báo gây ReferenceError.
- **Fix**: Di chuyển toàn bộ block dealer routes xuống sau dòng khai báo authenticateToken
- **BÀI HỌC**: Khi chèn code tự động vào file lớn, LUÔN kiểm tra vị trí chèn so với dependencies (middleware, helper functions). `const` arrow functions KHÔNG được hoisted.

## L39: position: fixed cho nút X trong modal bị che trên mobile ⭐⭐⭐
- **Ngày**: 2026-10-03 (test.wasypro.com)
- **Triệu chứng**: Nút X đóng popup sản phẩm bị ẩn, phải vuốt lên mới thấy
- **Root cause**: `position: fixed; top: 4; right: 4` nhưng trên mobile nó nằm cố định theo viewport, bị header che hoặc ancestor có `contain: paint` tạo new containing block
- **Fix**: Đổi sang sticky header bar chứa title "Chi tiết sản phẩm" + X button, `position: sticky; top: 0; z-index: 50`
- **BÀI HỌC**: Trên mobile modal, KHÔNG dùng `position: fixed` cho X button. Dùng sticky header bar — luôn hiện khi scroll, không bị ancestor ảnh hưởng.

## L40: Prisma db push fail trên SQLite với UNIQUE constraint ⭐⭐
- **Ngày**: 2026-10-03 (test.wasypro.com)
- **Triệu chứng**: `npx prisma db push --accept-data-loss` trả lỗi "index associated with UNIQUE or PRIMARY KEY constraint cannot be dropped"
- **Root cause**: SQLite không hỗ trợ DROP INDEX trên constraint index khi schema có thay đổi phức tạp (Prisma cố drop rồi recreate)
- **Fix**: Tạo table trực tiếp bằng Python sqlite3 module, bypass Prisma migration
- **BÀI HỌC**: Với SQLite, khi Prisma db push fail → dùng sqlite3 CLI hoặc Python script tạo table trực tiếp. Prisma generate vẫn hoạt động bình thường sau đó.

## L41: Prisma P2023 - Không thể convert giá trị timestamp sang DateTime trên SQLite ⭐⭐⭐
- **Ngày**: 2026-10-03 (test.wasypro.com)
- **Triệu chứng**: Khi thêm đại lý mới qua POST /api/admin/dealers, database insert thành công nhưng query sau đó (hoặc GET /api/dealers) crash với lỗi: `P2023: Inconsistent column data: Could not convert value "1791028300551" of the field createdAt to type DateTime`.
- **Root cause**: Khi tạo bảng `Dealer` thủ công bằng SQL, cột `createdAt` và `updatedAt` được khai báo kiểu `TEXT`. Khi Prisma tạo record trên SQLite với `@default(now())`, Prisma gửi giá trị Unix epoch milliseconds (dạng số). Do cột là TEXT, SQLite ép thành chuỗi `"1791028300551"`. Khi đọc lại, Prisma thấy kiểu chuỗi nhưng không phải chuẩn ISO-8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`) nên crash.
- **Fix**: Chuyển kiểu cột sang `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`, chuẩn hóa dữ liệu cũ sang chuỗi ISO-8601 UTC.
- **BÀI HỌC**: Trên SQLite dùng với Prisma, tất cả các trường `DateTime` BẮT BUỘC phải khai báo kiểu `DATETIME` (không được dùng `TEXT`).

## L42: Desktop landing view thiếu component DealerSection ⭐⭐
- **Ngày**: 2026-10-03 (test.wasypro.com)
- **Triệu chứng**: Giao diện mobile hiển thị section Đại Lý nhưng màn hình desktop (viewport > 768px) không thấy khối Hệ Thống Đại Lý và Header thiếu menu Đại Lý.
- **Root cause**: Component `DealerSection` chỉ được import vào `MobileLandingView.tsx`, chưa được đưa vào khối desktop trong `App.tsx`.
- **Fix**: Thêm `<DealerSection />` vào sau `<WarrantyLookupSection />` trong desktop view của `App.tsx` và thêm tab `{ id: 'dealers', label: 'ĐẠI LÝ' }` vào `Header.tsx`.
- **BÀI HỌC**: Dự án dùng kiến trúc tách 2 view song song (MobileLandingView và Desktop View), khi bổ sung section mới trên trang chủ PHẢI tích hợp đồng thời ở cả 2 view.

## L43: Prisma P2022 - Cột googleMapUrl thiếu trên bảng SystemPolicyConfig trong SQLite ⭐⭐⭐
- **Ngày**: 2026-10-03 (test.wasypro.com)
- **Triệu chứng**: Khi gọi endpoint `GET /api/public/contact-config` hoặc truy vấn `prisma.systemPolicyConfig.findMany()`, backend báo lỗi `PrismaClientKnownRequestError: The column main.SystemPolicyConfig.googleMapUrl does not exist in the current database.` (Error code `P2022`).
- **Root cause**: Trường `googleMapUrl String?` được thêm vào schema Prisma nhưng database SQLite thực tế chưa được chạy migration/alter để thêm cột này.
- **Fix**: Thực thi lệnh SQL: `ALTER TABLE SystemPolicyConfig ADD COLUMN googleMapUrl TEXT;` trực tiếp trên SQLite `dev.db`.
- **BÀI HỌC**: Khi truy vấn một model Prisma trên database SQLite, nếu schema Prisma có khai báo cột mới mà chưa migrate trên file db thực tế, Prisma sẽ crash toàn bộ lệnh `findMany()`. Luôn kiểm tra `PRAGMA table_info(...)` trên SQLite để đồng bộ cấu trúc cột.

## L44: Nút X bị che, vỡ responsive và xê dịch trên các Popup/Modal (ĐÃ CHỐT TIÊU CHUẨN BẮT BUỘC) ⭐⭐⭐⭐⭐
- **Ngày**: 2026-10-03 (Toàn hệ thống wasypro / test.wasypro.com)
- **Triệu chứng**:
  1. Nút X đóng modal bị che khuất hoặc trôi mất khi người dùng cuộn form dài trên thiết bị di động (đặc biệt là form đăng ký hoặc xem chi tiết).
  2. Modal không co giãn responsive mượt mà trên các màn hình nhỏ (iPhone SE, 375px), bị dính sát mép hoặc đỉnh modal bị đẩy ra ngoài mép trên màn hình.
  3. Sử dụng position: fixed hoặc bsolute tự do cho nút X dẫn đến lệch tọa độ hoặc bị các thành phần khác đè lên.
- **Nguyên nhân cốt lõi**:
  - Không tuân thủ cấu trúc 3 tầng chuẩn (Sticky Header -> Scrollable Body -> Sticky Footer).
  - Đặt nút X trôi nổi trong container cuộn hoặc dùng fixed định vị theo viewport thay vì gắn vào modal header.
- **Biện pháp khắc phục triệt để & Tiêu chuẩn kỹ thuật áp dụng vĩnh viễn**:
  1. **Khung 3 tầng chuẩn**:
     - **Header**: BẮT BUỘC sticky top-0 z-50 với nền solid/backdrop-blur chống nhìn xuyên thấu, chứa Tiêu đề + Nút [X].
     - **Body**: overflow-y-auto max-h-[90dvh] flex-1 overscroll-contain chỉ cuộn vùng nội dung này.
     - **Footer**: sticky bottom-0 z-40 nếu có nút hành động Lưu/Đóng.
  2. **Nút [X]**: Kích thước $\ge 36\text{px} \times 36\text{px}$, màu sắc tương phản rõ ràng, nằm ở góc trên bên phải của Header.
  3. **Responsive**: Chiều rộng w-full max-w-[calc(100vw-24px)], căn giữa an toàn my-auto, dùng dvh chống co kéo thanh địa chỉ trình duyệt.
- **BÀI HỌC VĨNH VIỄN**: Bất kỳ popup/modal nào được tạo mới hoặc chỉnh sửa trong tương lai đều PHẢI kiểm tra Checklist này trước khi bàn giao.

## L45: Prisma schema vs SQLite out of sync (2026-10-03)
- **Lỗi**: The column main.ProductCategory.googleMapUrl does not exist in the current database
- **Nguyên nhân**: Prisma schema thêm cột mới nhưng không chạy migration trên staging VPS
- **Fix**: sqlite3 dev.db 'ALTER TABLE ProductCategory ADD COLUMN googleMapUrl TEXT;'
- **Bài học**: Khi thêm cột mới vào Prisma schema, PHẢI chạy migration trên CẢ 2 VPS (production + staging). Hoặc dùng 
px prisma db push để sync.

## L46: Desktop banner quá cao / zoom (2026-10-03)
- **Lỗi**: Banner chiếm quá nhiều chiều cao trên desktop (max-h-[820px] + aspect-[256/133])
- **Fix**: Đổi thành spect-[21/9] max-h-[520px] lg:max-h-[560px] xl:max-h-[600px]
- **Bài học**: Banner/Hero nên dùng aspect ratio chuẩn (21:9 cinematic) và max-h responsive theo breakpoint, không hardcode một giá trị max-h duy nhất.
