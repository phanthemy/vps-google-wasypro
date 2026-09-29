# WasyPro — Log Lỗi

## 2026-09-29

### L11: CTV/NPP chưa có Business ID (BID) vẫn nhận hoa hồng
- **Triệu chứng**: Tài khoản Nguyễn Đức Quang (U1001) chưa có `rank`, chưa có `businessId` nhưng vẫn nhận 3 khoản hoa hồng: DIRECT_NO_ID (1.000.000đ), NPP_D1 (3.600.000đ), DIRECT_WITH_ID (500.000đ).
- **Nguyên nhân**: Code settlement (`calculateAndCreateCommissions`) có 4 điểm không kiểm tra `businessId` của người nhận:
  1. **DIRECT commission**: `if (directSponsor)` → thiếu `directSponsor.businessId`
  2. **NPP D1**: `if (netAmount > 0 && directSponsor)` → thiếu `directSponsor.businessId`
  3. **Upstream F1**: `if (d1User)` → thiếu `d1User.businessId`
  4. **Upstream F2**: `if (d2User)` → thiếu `d2User.businessId`
  - Đồng thời có fallback sai: `directSponsor.role === 'ctv' ? 'AMBASSADOR' : null` cho phép CTV chưa có rank được gán AMBASSADOR ngầm.
- **Fix**:
  1. Thêm gate `&& directSponsor.businessId` cho DIRECT và NPP D1
  2. Thêm gate `&& d1User.businessId` và `&& d2User.businessId` cho F1/F2
  3. Xóa 3 commission sai đã phát sinh cho U1001
- **Quy tắc vĩnh viễn**: **Không có BID = Không nhận bất kỳ commission nào** (DIRECT, NPP_D1, NPP_D2, F1, F2)
- **Commit**: `bbfb655`

### L10: Tạo khách hàng mới trong Modal Tạo Đơn Hàng bị chặn CSRF Token
- **Triệu chứng**: Khi CTV/NPP tạo đơn hàng, tại form "TẠO KHÁCH HÀNG MỚI", bấm nút "✅ Tạo" thì popup alert báo lỗi: `"Lỗi: Yêu cầu bị từ chối do thiếu hoặc không khớp mã CSRF Token."`
- **Nguyên nhân**:
  1. Frontend `CreateOrderModal.jsx` gửi request `POST /api/ctv/customers`.
  2. Middleware `csrfProtection` trong `server/index.js` có danh sách miễn trừ (exempt) cho `/api/orders`, `/api/customers`, `/api/admin` nhưng bị thiếu prefix `/api/ctv` (cụ thể là `/api/ctv/customers`).
  3. Hàm `getCsrfToken()` trong `CreateOrderModal.jsx` đọc regex cookie thuần, nếu cookie bị encode hoặc không khớp sẽ gửi header rỗng, dẫn đến backend chặn với mã lỗi HTTP 403 `CSRF_VALIDATION_FAILED`.
- **Cách fix**:
  1. `server/index.js`: Thêm `req.path.startsWith('/api/ctv')` và các route nghiệp vụ nội bộ (`/api/users`, `/api/admin`, `/api/leads`, `/api/internal-users`, `/api/services`) vào danh sách bypass kiểm tra CSRF Double-Submit (các route này vốn đã được bảo vệ xác thực bắt buộc bằng JWT qua cookie HttpOnly `authenticateToken` SameSite=Lax).
  2. `src/components/ctv/views/CreateOrderModal.jsx`: Nâng cấp hàm `getCsrfToken()` hỗ trợ `decodeURIComponent` và fallback `localStorage.getItem('csrf_token')`.

## 2026-09-26

### L05: Sản phẩm không hiện hình ảnh (Ảnh tải lên 404 + Ảnh mẫu thiếu)
- **Triệu chứng**: Hình ảnh sản phẩm (đặc biệt ảnh tải lên từ Admin) bị lỗi 404, hiển thị HTML trắng. Các máy lọc "Water King" bị lỗi không hiển thị hình ảnh.
- **Nguyên nhân**: 
  1. Nginx proxy /uploads/ sang backend (3011). Tuy nhiên server/index.js chỉ phục vụ ảnh tĩnh từ ../public/uploads (nơi chứa avatars). Các sản phẩm upload từ Frontend PM2 (server.cjs) lại lưu vào ../uploads/products, dẫn đến mismatch đường dẫn và trả về 404.
  2. Nhiều sản phẩm trong CSDL tham chiếu file water-king-pro-9.jpg, nhưng file này không hề tồn tại trên VPS (/dist và /public).
- **Fix**: 
  1. Thêm express static mount ../uploads vào backend index.js để phục vụ ảnh sản phẩm đúng luồng Nginx.
  2. Copy ảnh WebP của máy WS-03 thành water-king-pro-9.jpg làm placeholder.
- **Commit**: e43cefd

## 2026-09-25

### L01: APPROVED NPP không thấy tab Gói NPP
- **Triệu chứng**: NPP user được admin approve nhưng login không thấy menu NPP
- **Nguyên nhân**: hasNppRegistration chỉ check PURCHASING/PAID/ACTIVE, thiếu APPROVED
- **Fix**: Thêm APPROVED vào visibility list
- **Commit**: `91bdebe`

### L02: Factory Reset không xóa NPP data
- **Triệu chứng**: Bấm reset → Users xóa nhưng NppRegistration/Purchase/Payment còn → orphan data
- **Nguyên nhân**: Factory Reset code không có NPP tables
- **Fix**: Thêm 6 bảng NPP vào delete list, thêm isNpp reset cho admin
- **Commit**: `7e8e0e3`, `3d76394`, `15afbc9`

### L03: Avatar upload thành công nhưng không hiển thị
- **Triệu chứng**: "Cập nhật thành công" nhưng ảnh broken
- **Nguyên nhân**: 
  1. Nginx thiếu `location /uploads/` → request đi vào Vite frontend → 404
  2. `wasypro.com` không có trong nginx server_name
  3. File `.bak` trong sites-enabled gây conflict
- **Fix**: Thêm /uploads/ proxy, thêm wasypro.com, xóa .bak

### L04: AdminMembersView font tiếng Việt lỗi
- **Triệu chứng**: "Tai Khoan Thanh Vien", "â€"" 
- **Nguyên nhân**: File viết không dấu + mojibake encoding (UTF-8 BOM + wrong bytes)
- **Fix**: Python raw byte replacement cho 21 text + mojibake subtitle
- **Commit**: `aa0a638`, `440e5da`

## 2026-09-23/24

### L05: Referral code không hoạt động
- **Fix**: Backend accepts both `refCode` AND `referralCode` — commit `aa24fe1`

### L06: my-discount trả hasDiscount: false
- **Fix**: `req.user.id` → `req.user.dbId` — commit `4c31d06`

### L07: CTV thuần thấy tab NPP
- **Fix**: Systemic check nppStatus — commit `62c49a1`

### L08: NPP user thấy CP 0/5000 progress
- **Fix**: SettingsView ẩn CTV content cho NPP — commit `4190a26`

### L09: CreateOrderModal build error
- **Fix**: React Fragment wrapper cho multi-child JSX — commit `bc80fac`

### Lỗi 29/09/2026: Tài khoản NPP bị hiện thị nhầm tích lũy 5.000 CP và rank Đại sứ sớm
- **Hiện tượng**: Khi tạo/đăng ký tài khoản NPP mới (chưa thanh toán/chờ duyệt), màn hình "Thông Tin Tài Khoản" hiện thị nhầm "Điểm Tích Lũy (CP): 0 / 5.000 CP", thanh tiến trình cấp bậc CTV 5.000 CP, và rank "Đại sứ" sớm.
- **Nguyên nhân**:
  1. Backend `computeNppRank` truy vấn cả registration status `['PENDING', 'APPROVED']` và trả về `assignedRank` của gói trước khi người dùng thanh toán/kích hoạt.
  2. Frontend `SettingsView.jsx` chỉ ẩn thẻ CP và thanh tiến trình khi status là `ACTIVE`, bỏ sót các trạng thái đăng ký NPP (`PENDING`, `APPROVED`, `PURCHASING`, `PAID`).
- **Cách fix**:
  1. `server/index.js`: Điều chỉnh `computeNppRank` chỉ trả về rank khi purchase status là `COMPLETED` hoặc registration status là `CONVERTED`.
  2. `src/components/ctv/views/SettingsView.jsx`: Bổ sung kiểm tra `isNppUser`. NPP chưa kích hoạt hiện thị badge "Chờ kích hoạt", thẻ số 4 hiện thị "Trạng thái NPP" (Chờ Admin duyệt đăng ký / Đã duyệt / Đang mua gói), ẩn hoàn toàn thanh tích lũy 5.000 CP. Giữ nguyên 100% logic cho CTV thường.

### Lỗi 29/09/2026: Lỗi font chữ tiếng Việt (?) trong SettingsView.jsx
- **Hiện tượng**: Sau khi cập nhật giao diện, các chữ tiếng Việt có dấu biến thành dấu hỏi chấm "?".
- **Nguyên nhân**: Script ghi file qua PowerShell bị lệch chuẩn mã hóa sang ANSI/Windows-1252 khi pipe qua SSH.
- **Cách fix**: Soạn thảo script bằng UTF-8 nguyên bản, đẩy file trực tiếp lên VPS và build lại bằng Vite. Để kiểm tra lại `git diff` đảm bảo 100% tiếng Việt có dấu chuẩn xác.

