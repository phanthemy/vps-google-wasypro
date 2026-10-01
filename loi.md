# WasyPro — Log Lỗi

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

### L27: CTV chưa có rank nhận commission do code fallback tự gán AMBASSADOR
- **Triệu chứng**: U1001 (rank=NULL, BID=WK10001) nhận 6.000.000đ hoa hồng. Admin hiển thị "Thành Viên" nhưng vẫn có 6Tr hoa hồng.
- **Nguyên nhân**: 5 chỗ trong `calculateAndCreateCommissions` dùng fallback `rank || 'AMBASSADOR'`. Khi `rank = null` nhưng `role = 'ctv'` → tự gán AMBASSADOR → tính commission 20% sai.
- **Fix**: Bỏ fallback `|| 'AMBASSADOR'` → `|| null`. NPP D1 thêm gate `&& directSponsor.rank`. Xóa 3 record commission sai của U1001 (6.000.000đ).
- **Quy tắc vĩnh viễn**: ⭐⭐⭐⭐⭐ **Không có RANK = Không nhận commission.** BID = điều kiện cần, RANK = điều kiện đủ. KHÔNG fallback rank thành AMBASSADOR.
- **Commit**: `8ca367f`

### L30: Admin Panel Crash — Error Boundary sau khi thêm Dynamic Categories
- **Ngày**: 2026-10-01
- **Triệu chứng**: Login admin → trang hiện 'Đã xảy ra sự cố hiển thị'. Trang chủ (không login) vẫn OK.
- **Nguyên nhân**: ProductSection.tsx thay đổi từ hardcoded CATEGORY_TABS sang dynamic fetch /api/product-categories gây crash khi render trong admin view context. Error Boundary bắt nhưng không log chi tiết.
- **Cách Fix**: Rollback src/ về commit 26ecd85 (trước thay đổi). Commit a71c55b.
- **Bài học**:
  1. Sau MỌI build, phải Playwright test CẢ trang chủ VÀ admin panel (login admin → verify no crash)
  2. Không rm -rf dist trước khi chắc chắn build sẽ pass
  3. Ghi lỗi vào loi.md NGAY khi phát hiện, kèm commit hash
  4. Dynamic fetch trong shared component phải guard cho admin vs public context
- **Trạng thái**: ĐÃ FIX (rollback). Category CRUD + dynamic tabs + CTV order overhaul cần re-implement.
