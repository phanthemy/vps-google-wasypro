# WasyPro — Log Lỗi

## 2026-09-30

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

## 2026-09-30 (earlier)

### L14: JSDoc comment block nuốt 6 API endpoints → 404
- **Triệu chứng**: 6 API mới (ctv-search, assign-sponsor, orders/create, history, upload-attachment, products-list) trả 404.
- **Nguyên nhân**: JSDoc `/**` ở dòng 3141 mô tả factory-reset không được đóng `*/`. Code mới nằm trong comment block.
- **Fix**: Thêm `*/` đóng comment trước block API mới.
- **Commit**: `dd7269f`

### L13: NPP Ref Link hiện cho NPP chưa kích hoạt (chưa mua gói combo)
- **Triệu chứng**: Ref link hiện cho NPP đã APPROVED nhưng chưa mua gói → chưa có businessId → link vô nghĩa.
- **Fix**: Chỉ hiện ref link khi `user.businessId` tồn tại. Nếu không → badge "⏳ Chưa kích hoạt".
- **Commit**: `3921409`

## 2026-09-30 (earlier & latest)

### L20: JSX mismatched tags in CreateOrderModal khiến build frontend thất bại
- **Triệu chứng**: `tsc && vite build` báo lỗi `JSX expressions must have one parent element` và `Expected corresponding JSX closing tag for 'button'`.
- **Nguyên nhân**: Khi nâng cấp thumbnail sản phẩm và thêm popup hover zoom, thẻ `<div className="flex items-center gap-3 min-w-0 pr-2">` bọc ngoài ảnh và thông tin máy bị xóa thiếu mở thẻ trong danh sách sản phẩm bán khách lẻ.
- **Fix**: Bổ sung đầy đủ thẻ mở `<div>`, đồng bộ thumbnail `w-16 h-16` kèm popup xem ảnh phóng to floating `hoveredImage`.
- **Commit**: `a90f602`

### L19: Mật khẩu form đăng ký người dùng quá đơn giản
- **Triệu chứng**: Người dùng đặt mật khẩu ngắn, không đủ bảo mật.
- **Yêu cầu sếp**: Mật khẩu ít nhất 8 ký tự, có ghi chú rõ ràng gồm chữ hoa, chữ thường, số, ký tự đặc biệt.
- **Fix**: Cập nhật validator frontend (`UnifiedAuthModal.tsx`) và backend (`server/index.js`), thêm hướng dẫn trực quan dưới ô mật khẩu.
- **Commit**: `a8f5743`

### L18: Lỗi upload ảnh sản phẩm trong Quản trị Admin & ảnh cũ không hiện khi sửa
- **Triệu chứng**: Khi sửa/tạo sản phẩm, chọn tải ảnh lên báo "Lỗi upload server", và khi mở modal sửa sản phẩm thì danh sách ảnh gallery bị trống.
- **Nguyên nhân**: Backend thiếu route `POST /api/upload`, và component `AdminProducts.tsx` không nạp `product.image` vào mảng `gallery` khi mở modal edit.
- **Fix**: Thêm middleware `multer` xử lý upload ảnh tại route `/api/upload` lưu vào `/var/www/wasypro/public/uploads/products/`. Thêm `withCredentials = true` và `X-CSRF-Token` vào `ImageUpload.tsx`. Đồng bộ `product.image` vào `gallery` trong `AdminProducts.tsx`.
- **Commit**: `b0d4051`

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
