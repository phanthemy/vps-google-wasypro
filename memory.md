# WasyPro — Memory Log

## Cập nhật: 2026-09-30

### Phiên 30/09/2026 (19:00 - 20:40) — Bật OTP, Swap tài khoản, Bảo vệ logic CTV

#### Đã làm:
1. **Bật lại OTP Verification** (Commit `dc9d09d`):
   - Backend: Bỏ comment block `/* ... */` vô hiệu hóa OTP trong `POST /api/auth/register`.
   - Frontend: Bật lại validation OTP, button "Gửi OTP", input OTP trong `UnifiedAuthModal.tsx`.
   - Tăng cooldown gửi lại OTP: 60s → 120s.
   - Thêm `autoComplete="off"`, `inputMode="numeric"` cho input OTP tránh autofill sai.

2. **Hệ thống Broadcast OTP** (Commit `5d55a2c`):
   - Viết lại `server/services/znsService.js`: thêm `sendOaTextMessage()`, `broadcastOtpNotification()`.
   - OTP gửi song song tới: Khách (ZNS) + Admin UIDs (env `ZALO_ADMIN_UIDS`) + Sponsor CTV/NPP (`zaloUid`).
   - Frontend gửi `refCode` kèm request send-otp để lookup sponsor.
   - Thêm cột `zaloUid` vào User model (Prisma + SQLite).
   - API `PATCH /api/admin/users/:userId/zalo-uid` cho admin gán Zalo UID.
   - UI: AdminCTVManagement.tsx thêm section "📱 Zalo UID (nhận OTP)".

3. **Swap tài khoản hệ thống** (Commit `fc29a86`, `7884d4c`):
   - `0968616263` (U1001 → ADM_QUANG): CTV → **Admin**. Xóa BID, rank, parentId.
   - `0937353535` (ADMIN_SUPER → U1001): Admin → **CTV mặc định**. Gán BID WK-10001, rank MANAGER.
   - `0999999999` (ADMIN01): Duy nhất thấy menu "Hệ Thống" (Factory Reset, Reset Members, Reset CTV).
   - Backend: Đổi constants `QUANG_PHONE` → `DEFAULT_CTV_PHONE`, hàm `preserveOrSeedDefaultCtvAccount`.
   - Backend: 3 endpoint reset chỉ cho `phone === '0999999999'` (403 cho admin khác).
   - Frontend: `AdminSidebar.tsx` nhận prop `userPhone`, ẩn tab "Hệ Thống" nếu không phải 0999999999.
   - `AdminCTVManagement.tsx`: Đổi protect check 0968616263 → 0937353535.
   - AGENTS.md: Cập nhật invariant rules mới.

4. **Prisma generate sau ALTER TABLE** (Commit `5cc0fb5`):
   - Chạy `npx prisma generate` trên VPS → Prisma Client nhận cột `zaloUid`.

5. **Cho phep CTV chua co BID van hien Ref Link** (Cap nhat 01/10/2026 - Huy bo commit 174316e, 36467c5):
   - Dashboard: Xoa check freshUser.businessId - hien Link Gioi Thieu Cua Ban cho moi CTV da tham gia he thong.
   - Header: Xoa check (currentUser as any).businessId - hien nut Link gioi thieu cua toi cho moi CTV.
   - Tab So Do Tuyen Duoi: hien thi binh thuong cho moi CTV. Hoa hong van chi tinh khi co BID (L11/L12 giu nguyen).

#### Quy tắc mới:
- **Swap tài khoản = swap TẤT CẢ trường** (role, userId, businessId, rank, isSystemParticipant). Xem L24.
- **ALTER TABLE + schema.prisma → phải `npx prisma generate`**. Xem L25.
- **CTV chưa có BID vẫn hiện ref link, nhưng chưa hưởng hoa hồng/giảm giá** (L11/L12 vẫn giữ nguyên). L26 đã hủy bỏ.

---

### Phiên 30/09/2026 (14:30 - 18:50) — Tổng kết cuối ngày & Chuẩn bị bàn giao về nhà

#### Đã làm:
1. **Tích hợp 9 Video YouTube sự kiện truyền hình & tin tức vào Trang Chủ và Quản Trị Admin**:
   - Thêm bảng SQLite `NewsArticle` vào CSDL `server/dev.db`.
   - Viết trọn bộ CRUD API `/api/articles` (`GET`, `POST`, `PUT`, `DELETE`, lọc theo `category`, tìm kiếm `search`) đồng bộ trên cả `server.cjs` và `server/index.js`.
   - Seed đầy đủ 9 video YouTube sự kiện chính thức của tập đoàn (HTV9, New World Sài Gòn, Ký kết tri ân, Tham quan nhà máy Happy Life Phú Thọ, Demo kiểm tra nước, v.v.) kèm tiêu đề chuẩn, tóm tắt, ngày phát sóng và ảnh thumbnail HD.
   - Redesign component `NewsSection.tsx`: Giao diện thẻ bài viết đa phương tiện sang trọng, gắn nhãn đỏ Play Video, bộ lọc chuyên mục (Sự kiện nổi bật, Truyền hình HTV, Nhà máy sản xuất, Trải nghiệm) và popup **Modal Player toàn màn hình** phát trực tiếp YouTube iframe không làm gián đoạn trải nghiệm người dùng.
   - Nâng cấp màn hình Quản Trị `AdminNews.tsx`: Bổ sung ô nhập link YouTube, nút bấm tự động trích xuất Thumbnail từ YouTube ID, hiển thị badge Video và link mở video trực quan trong danh sách bài viết.

2. **Tái cấu trúc Danh Mục Sản Phẩm Trang Chủ & Quản trị Danh Mục Admin**:
   - Gom nhóm danh mục trên trang chủ: Hợp nhất "Máy lọc nước Ion kiềm" và "Máy lọc nước Hydrogen" thành 1 danh mục duy nhất: **"Máy lọc nước"** (`ProductSection.tsx`).
   - Chuẩn hóa 3 tabs hiển thị sản phẩm trên trang chủ:
     1. Máy lọc nước
     2. Bình & Ly Hydrogen
     3. Phụ kiện & Lõi lọc
   - Xây dựng hoàn chỉnh tính năng Quản lý Danh mục Admin:
     - Thêm API CRUD `/api/categories` (`GET`, `POST`, `PUT`, `DELETE`).
     - Tích hợp Modal Quản lý Danh mục vào `AdminProducts.tsx` cho phép Admin thêm mới, sửa tên, mô tả danh mục để gán cho sản phẩm.

3. **Tối ưu hình ảnh Banner Trang Chủ & Tích hợp Video Hero**:
   - Thay thế banner cũ bị vỡ hạt mờ bằng vector chất lượng cao trích xuất từ file thiết kế `Backdrop 133 x 256cm.pdf` sang WebP 1920px (`backdrop_banner.webp`).
   - Tối ưu hóa file `video.mp4` thành định dạng web, triển khai vào `Hero.tsx` hỗ trợ chạy ngầm mượt mà và nút bật/tắt âm thanh (Mute/Unmute).

4. **Chuẩn hóa Logo Zalo Business Solution (ZBS) & Xác thực Domain**:
   - Triển khai 2 file xác thực domain theo yêu cầu Zalo: `NjE12PILCpro_BiAfzGe2bVxX5oxZLy3CZWs.html` và `NjE12PlLCpro_BiAfzGe2bVxX5oxZLy3CZWs.html`.
   - Xuất logo ZBS chuẩn tỉ lệ 1:1, vòng tròn an toàn lọt lòng 15% inner padding theo hướng dẫn Zalo: `zbs_logo_light.png` và `zbs_logo_dark.png` (sao lưu ra thư mục `C:\Users\editor02\Desktop\wasy` và VPS).
   - Tạm thời vô hiệu hóa guard OTP ZNS (`POST /api/auth/register`) do Zalo OA công ty chưa kích hoạt gói tin trả phí, giúp việc đăng ký tài khoản không bị nghẽn.

5. **Build & Triển Khai Production**:
   - Biên dịch frontend (`npx vite build`) thành công trên VPS.
   - Reload / restart tiến trình PM2 `wasypro` (port 5005) và `happylife-backend` (port 3011).
   - Kiểm tra trực tiếp domain `https://wasypro.com` và `https://wasypro.com/api/articles` đạt chuẩn HTTP 200.
   - Git commit & push mã nguồn lên repository GitHub `main` (`efb4bab`, `4007080`).

---

### Phiên 30/09/2026 (09:20 - 09:35)

#### Đã làm:
1. **Hiển thị hình ảnh sản phẩm & điểm CP trong Tạo Đơn Hàng (`CreateOrderModal.jsx`)** (Commit `a8f5743`):
   - Thay thế icon hình hộp bằng ảnh thực tế của từng sản phẩm (`p.image` hoặc `ci.image`).
   - Gắn nhãn điểm hoa hồng ⭐ CP trực quan cho từng sản phẩm trong danh sách bán lẻ và danh sách máy Combo NPP.
   - Thêm trường `image` vào danh sách sản phẩm trả về từ `/api/npp/my-combo`.
   - Bổ sung ô hiển thị nổi bật **⭐ Điểm tích lũy (CP)** trong phần "Tóm Tắt Đơn Hàng" (tính tổng CP = đơn giá CP × số lượng máy đối với bán lẻ hoặc tổng CP các máy chọn đối với Combo).
2. **Khắc phục triệt để lỗi không hiện ảnh & 'Lỗi upload server' trong Admin Products** (Commit `a8f5743`):
   - Thêm route `POST /api/upload` (multer lưu vào `/var/www/wasypro/public/uploads/products/`) vào `server/index.js` và miễn trừ khỏi `csrfProtection`.
   - Cập nhật `ImageUpload.tsx`: Bật `xhr.withCredentials = true;`, gắn `X-CSRF-Token` và `Authorization: Bearer <token>`, thêm fallback `onError`.
   - Cập nhật `AdminProducts.tsx`: Tự động nạp `product.image` vào `formData.gallery` khi mở modal chỉnh sửa để đảm bảo ảnh đại diện luôn hiển thị nếu gallery trống.
3. **Quy định mật khẩu đăng ký tối thiểu 8 ký tự kèm độ phức tạp** (Commit `a8f5743`):
   - Form Đăng Ký (`UnifiedAuthModal.tsx`): Bắt buộc mật khẩu tối thiểu 8 ký tự, kiểm tra gồm chữ thường, chữ HOA, số và ký tự đặc biệt (!@#$%...).
   - Bổ sung dòng ghi chú hướng dẫn khách: `* Mật khẩu tối thiểu 8 ký tự, bao gồm: chữ thường, chữ HOA, số và ký tự đặc biệt (VD: Wasy@2026).`
   - Backend `server/index.js` (`POST /api/auth/register`): Thêm guard chặn đăng ký nếu mật khẩu dưới 8 ký tự.

### Phiên 30/09/2026 (08:50 - 09:00)

#### Đã làm:
1. **Kéo thả & Mũi tên sắp xếp thứ tự gói NPP (`sortOrder`)** (Commit `b0d4051`):
   - Thêm cột `sortOrder INTEGER DEFAULT 0` vào model `NppPackage` trong `dev.db` và `schema.prisma`.
   - Seed thứ tự chuẩn cho các gói cũ: Combo (1-5) trước, Gói Vốn/Cổ đông (6-10) sau.
   - Thêm endpoint `PUT /api/admin/npp/packages/reorder` xử lý cập nhật batch thứ tự theo mảng `packageIds`.
   - Cập nhật các API lấy danh sách gói (`GET /api/admin/npp/packages`, `GET /api/npp/packages/available-public`, `GET /api/npp/packages/available`) sắp xếp theo `sortOrder ASC, createdAt DESC`.
   - UI Admin (`AdminNppPackages.tsx`):
     - Bổ sung bộ lọc Tabs: Tất cả, Combo sản phẩm, Gói Cổ đông - Vốn.
     - Tích hợp kéo thả thẻ trực quan (HTML5 Drag & Drop với hiệu ứng preview).
     - Bổ sung cụm nút mũi tên ▲ / ▼ và số thứ tự `#index` giúp Admin thao tác thuận tiện cả trên desktop lẫn mobile.
2. **Rà soát & Xác nhận Logic Chu kỳ hoa hồng khi tạo gói mới**:
   - Gói mới khi tạo trong Admin được hệ thống nhận diện tự động và tính toán hoa hồng chuẩn theo cơ chế NPP/Vốn:
     - D1 (Trực tiếp F1): 10%
     - D2 (Tuyến trên F2): 5%
   - Hệ thống tự động truy vấn `CommissionPeriod` có trạng thái `OPEN` để gán `periodId` vào bản ghi `NppCommission`.
   - Kỳ hoa hồng (`/api/admin/periods/:id/commissions`) gộp cả `Commission` và `NppCommission` nên đảm bảo tính đầy đủ, chính xác khi đối soát và chi trả.

### Phiên 30/09/2026 (01:28 - 02:00)

#### Đã làm:
1. **NPP Combo chỉ hiện máy lọc nước** (Commit `71607ce`):
   - Frontend `UserNppDashboard.tsx`: Filter `title.match(/^Máy/)` → chỉ 5 máy lọc nước.
   - Backend `/api/npp/my-combo`: Query `categoryId IN ('cat-01','cat-02') AND title startsWith 'Máy'`.
   - Loại bỏ linh kiện/phụ kiện khỏi gói combo NPP.

2. **Fix F0 hiện sai trong Admin Tạo Đơn** (Commit `431e2be`):
   - Root cause: `Customer.sourceCtvId` trỏ chính mình khi CTV self-purchase → sponsor hiện chính khách.
   - Backend: Thêm `networkParent` = resolve `User.parentId` (parent thật trong mạng lưới).
   - Frontend: Ưu tiên `networkParent` > `sourceCtv`. Check `sponsor !== self`.

3. **Fix NppCommission thiếu trong Kỳ Hoa Hồng admin** (Commit `ade49e4`):
   - Root cause 1: NppCommission tạo không gán `periodId` → null → admin không thấy.
   - Root cause 2: Admin API chỉ query `Commission`, bỏ sót `NppCommission`.
   - Fix: Tìm period OPEN khi tạo NppCommission + merge 2 bảng trong API response.
   - Data fix: Update record cũ periodId=null → kỳ 10/2026.

---

## Cập nhật: 2026-09-29

#### Đã làm:
1. **Khóa bất biến tài khoản hệ thống (UPDATED 30/09 tối)**:
   - `0937353535` / U1001 = CTV mặc định, BẢO VỆ VĨNH VIỄN.
   - `0968616263` / ADM_QUANG = Admin chính (Nguyễn Đức Quang).
   - `0999999999` / ADMIN01 = Duy nhất thấy menu Reset.
   - Đã cập nhật backend `server/index.js`: constants `DEFAULT_CTV_PHONE/UID/NAME`, hàm `preserveOrSeedDefaultCtvAccount`.
   - Đã cập nhật AGENTS.md invariant rules.

---

## Quy tắc quan trọng

### Quy tắc Deploy VPS ⭐⭐⭐⭐⭐
- CHỈ deploy/thao tác trên Oracle VPS (149.118.62.155 / wasypro.com).
- KHÔNG tự động deploy hay đồng bộ lên Google Cloud VPS (test.wasypro.com) trừ khi được người dùng yêu cầu đích danh.

### Source of Truth
- VPS: `/var/www/wasypro/` — Oracle VPS `149.118.62.155`
- GitHub: backup only

### 2 bảng Commission (QUAN TRỌNG)
- `Commission`: Đơn bán lẻ (SELF_BUY, DIRECT_NO_ID, DIRECT_WITH_ID, F1, F2)
- `NppCommission`: Hoa hồng giới thiệu NPP (D1 10%, D2 5%)
- PHẢI query cả 2 khi hiện commission

### Customer Sponsor vs Network Parent (QUAN TRỌNG)
- `Customer.sourceCtvId` = CTV tạo customer record (có thể = chính mình khi self-purchase)
- `User.parentId` = parent thật trong mạng lưới sponsor
- Luôn dùng `parentId` để xác định F0/tuyến trên

### req.user structure
```js
req.user = { id: "U199", userId: "U199", dbId: cuid, role, fullName, phone }
```
- NppPurchase.userId = cuid → dùng `req.user.dbId`

### NPP Combo Products Filter
- Chỉ máy lọc nước: `title startsWith 'Máy'` + `categoryId IN ('cat-01','cat-02')`
- "Bộ điện phân" (100k) nằm trong cat-01 nhưng KHÔNG phải máy → phải lọc bằng title

### Tránh
- sed trên server/index.js → dùng Python
- PowerShell inline quotes → dùng .sh scripts
- BigInt() parse formatted numbers → strip dots
- Báo cáo xong mà chưa test thật
- Dùng `pm2 delete` rồi `pm2 start` → chỉ `pm2 reload`
- Insert code gần JSDoc `/**` block → verify đã đóng `*/`
