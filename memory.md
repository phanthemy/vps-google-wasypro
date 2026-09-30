# WasyPro — Memory Log

## Cập nhật: 2026-09-30

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

#### Ghi chú kỹ thuật:
- **2 bảng commission riêng biệt**: `Commission` (đơn bán lẻ) + `NppCommission` (hoa hồng giới thiệu NPP D1/D2). PHẢI query cả 2 ở mọi nơi hiện commission.
- **sourceCtvId ≠ parentId**: `sourceCtvId` = CTV tạo Customer record, `parentId` = parent thật trong sponsor network. Luôn dùng `parentId` cho tuyến trên.
- **NPP combo filter**: Dùng `title startsWith 'Máy'` vì "Bộ điện phân" cùng cat-01 nhưng KHÔNG phải máy.
- **PM2 backend ID**: Hiện tại là 43 (đã bị delete/recreate phiên trước). Dùng `pm2 reload happylife-backend`.

#### Chưa hoàn thành (Cần làm tiếp):
1. **NPP order form khác trong Admin** — Khi tạo đơn cho NPP (Phan Thế Mỹ), form nên chuyển sang chế độ combo (chọn nhiều sản phẩm, chiết khấu combo) thay vì dropdown đơn lẻ.
2. **Verify CTV tab** — Đơn admin tạo có CTV gán → phải hiện trong tab "Đơn CTV".
3. **Test F0 hiện đúng** — F5 admin → Tạo Đơn → nhập SĐT → verify sponsor đúng.
4. **Test Kỳ Hoa Hồng** — F5 → verify 4 khoản đủ.

---

## Cập nhật: 2026-09-29

## Cập nhật: 2026-09-30

### Phiên 30/09/2026

#### Đã làm:
1. **Fix Upload ảnh sản phẩm & Hiển thị ảnh cũ trong Quản trị Admin**:
   - Backend `server/index.js`: Thêm route `POST /api/upload` bằng `multer` lưu file vào `/var/www/wasypro/public/uploads/products/`. Exempt route khỏi CSRF middleware.
   - Frontend `ImageUpload.tsx`: Bổ sung header `X-CSRF-Token`, `Authorization: Bearer <token>`, và `withCredentials = true`.
   - `AdminProducts.tsx`: Khi mở modal sửa sản phẩm (`openEditModal`), tự động đồng bộ `product.image` vào mảng `gallery` để ảnh luôn hiển thị trực quan.
2. **Quy chuẩn mật khẩu khi đăng ký tài khoản (Bảo mật nâng cao)**:
   - Form đăng ký `UnifiedAuthModal.tsx`: Bắt buộc mật khẩu tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt. Thêm gợi ý hướng dẫn trực quan.
   - Backend `server/index.js`: Kiểm tra regex tương ứng cho endpoint `POST /api/auth/register`.
3. **Phóng to thumbnail sản phẩm & Hover Zoom Popup trong Tạo Đơn Hàng (CTV/NPP)**:
   - Trong `CreateOrderModal.jsx`: Tăng kích thước ảnh sản phẩm lên `w-16 h-16` (rounded-xl, viền nổi bật).
   - Thêm tính năng hover zoom: Khi rê chuột vào bất kỳ ảnh sản phẩm nào (đơn khách lẻ, combo máy, tự mua lẻ), một floating popup phóng to ảnh chất lượng cao (kèm tên sản phẩm và số điểm CP ⭐) sẽ xuất hiện mượt mà ngay cạnh con trỏ chuột.

---

### Phiên 29/09/2026

#### Đã làm:
1. **Khóa bất biến tài khoản Nguyễn Đức Quang (0968616263 / U1001)**:
   - Đưa tài khoản vào `project-workflow.md` (Section XIX) và Skill `wasypro-rules`.
   - Cập nhật backend `server/index.js` trên cả hai VPS (Oracle & Google):
     - Chặn xóa tài khoản trong `DELETE /api/users/:userId`.
     - Loại trừ khỏi câu lệnh xóa trong `POST /api/admin/factory-reset` và `POST /api/admin/reset-members`.
     - Hàm `preserveOrSeedQuangAccount` tự động bảo vệ, đưa điểm về 0, gỡ sponsor và duy trì `role: 'ctv'`, hoặc re-seed nếu chưa có.
     - Sau khi reset, người đăng ký tiếp theo sẽ tự động nhận `U1002`.
2. **Cập nhật AGENTS.md**: Bổ sung quy định bất biến cho tài khoản Nguyễn Đức Quang.
3. **Phân tách luồng Đăng ký Khách vãng lai & Khóa bảo trợ link ref**:
   - Khi vào trực tiếp `wasypro.com` (không có link ref): Ẩn ô nhập Mã giới thiệu, ẩn 2 lựa chọn tham gia CTV/NPP. Thay thế bằng Box thông tin nổi bật kèm nút bấm liên hệ Zalo OA (`https://zalo.me/2928413591064686973`) hoặc Hotline `1900 989878` để được cấp mã.
   - Khi vào qua link ref (`?ref=U1xxx`): Khóa chết ô Mã giới thiệu (`readOnly`, badge ổ khóa 🔒 không thể chỉnh sửa).
   - Backend `POST /api/auth/register`: Bổ sung Security Guard chặn đăng ký `joinSystem` hoặc `registerNpp` nếu không có `parentId` hợp lệ (HTTP 400).
4. **Ẩn nút Xóa CTV tài khoản Nguyễn Đức Quang (UI Invariant)**:
   - Trong `AdminCTVManagement.tsx`: Đã ẩn hoàn toàn nút "🗑️ Xóa CTV" khi hiển thị chi tiết tài khoản Nguyễn Đức Quang (`U1001` / `0968616263`).

---

## Cập nhật: 2026-09-27

### Phiên 27/09/2026

#### Đã làm:
1. **Setup test.wasypro.com trên Google Cloud VPS** — Thêm Nginx server block cho test.wasypro.com → port 5005 (frontend) + /api/ → port 3011 (backend). Thêm http/https test.wasypro.com vào CORS productionOrigins. Restart backend PM2. (commit `2116fbd`)
2. **Tổng hợp tính năng dự án** — Đọc toàn bộ code trên VPS, tạo báo cáo 11 nhóm tính năng (130 API, 37 models, 67 components)

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
\n

### Cấu hình Zalo ZNS / ZBS OTP (Xác thực tài khoản) ⭐⭐⭐⭐⭐
- **Official Account (OA)**: Water King
- **Ứng dụng (App)**: Water King HCM
- **Zalo App ID**: `2470893331175666168`
- **Khóa bí mật (App Secret)**: `RdN7drFQAFVXf8187gHC`
- **ID Mẫu ZBS (Template ID)**: `643438`
- **Tên mẫu**: "Xác thực đăng ký tài khoản Water King" (Đã duyệt)
- **Loại mẫu**: Mẫu OTP
- **Tham số dữ liệu**: `<otp>` (chuỗi 6 số)
- **Đơn giá gửi qua SĐT**: 400 đ/tin
- **Token khởi tạo ban đầu**:
  - `Access Token`: `cb2O3qoWF5MUKvC7JgGwKfbIbmT0l4ytbHMPC2I4IpoM2Re6ExjsBAiFl3q7fcykgWYt81k14ZI0UBXY0zaJMPT0_mqGiJSSja6UA0RvG16iTfavTCH62zPixbvIt29Vv5MJ3pJQNmwxKF8d5A1MDgLJY2KCoryZkNtr3YBMKLcwTxTqFivXG9GzkXGgXnyMZpIxFJwhQsUz9i5CDfCFNfGgvb15W2fznWBcLqFpGm7C1RDLOg0NUzTHocnP_Xf3z5kmUcFnPN76MSzB7zP-Jyb-psCUrZGsjNFE9ItbDJ-42COT4eKO9gK2uoiIgnW9f0YpF0p_UWl028XPOe5CR_OOipHIlcmQsmwAJ5kjVd_b9ASeJDHlEZZXm9nZJxusM0`
  - `Refresh Token`: `nlOtAiRGCHd2zJmYnDGt7iNqE2BAp31ljeb82Dxv4pMgc1ndrheLL9cKQYhCvnzHlCbv1FAMSts9imGzvzD9HBcJE2hxpp5llEjVF_wlLtwimHuHuerdJENo3NBXibLAeCuaCEQQK7ZZn3q3ie11Nidm4Wkng6v9wCyP8PI1KXdxv09dlgXnNz3t7cQGZ74Ualj_H9oC0pJetWfvc_1OFSgU4G6Vi6HSykblDulE1r3AlmuWkTz-Vxk_5W7-c4jlgD4PCDcbI5U8_Iu8swHtNOk2C2VZtcnrj_eYAishNdE2yIyIy9vXSO_6DJhMbtn6akKp5k20V2oZpobGtkjMFO-jKL_PYISSX-LZMLTDDnO-2iNEEnG`
- **Cơ chế kỹ thuật**:
  - Endpoint gửi tin: `POST https://business.openapi.zalo.me/message/template` (header `access_token`)
  - Endpoint tự động renew token: `POST https://oauth.zalo.me/v2/access_token` (grant_type `refresh_token`, header `secret_key`)
