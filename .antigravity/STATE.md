# 🔄 Project State: WASY PRO

> Auto-generated runtime state file (Cập nhật phiên kết thúc ngày 30/09/2026 - Bàn giao làm việc tại nhà)

## Current Status

| Key | Value |
|-----|-------|
| **Status** | READY / HANDOVER |
| **Last Session** | 2026-09-30 (18:50) |
| **Branch** | main |
| **Last Commit** | `4007080` (feat: disable OTP verification - Zalo OA chua mua goi tra phi) |
| **Previous Major Commit** | `efb4bab` (feat: add YouTube video & events section to homepage and admin news management) |
| **Source of Truth** | Oracle VPS (149.118.62.155) |
| **Working Dir** | `/var/www/wasypro` |
| **Production URLs** | `https://wasypro.com` / `https://wasypro.com/admin` |

---

## Active Tasks

### ✅ Completed This Session (30/09/2026)

1. **Tin tức & 9 Video YouTube Sự Kiện**:
   - Thêm bảng CSDL `NewsArticle` và trọn bộ CRUD API `/api/articles`.
   - Seed đầy đủ 9 video sự kiện YouTube (HTV9, New World Sài Gòn, Ký kết tri ân, Tham quan nhà máy Phú Thọ, Demo thử nước, v.v.).
   - Redesign `NewsSection.tsx` với card đa phương tiện, Play Badge đỏ, Tabs lọc nhanh và Full-screen Video Modal Player (iframe YouTube autoplay).
   - Nâng cấp `AdminNews.tsx` hỗ trợ nhập link YouTube, tự động lấy thumbnail HD, hiển thị badge Video và liên kết xem ngoài.

2. **Tái cấu trúc Danh Mục Trang Chủ & Quản trị Danh Mục Admin**:
   - Gom 2 danh mục "Máy lọc nước Ion kiềm" và "Máy lọc nước Hydrogen" thành 1 danh mục duy nhất: "Máy lọc nước".
   - Chuẩn hóa 3 tabs hiển thị sản phẩm trên trang chủ: Máy lọc nước, Bình & Ly Hydrogen, Phụ kiện & Lõi lọc.
   - Thêm CRUD API `/api/categories` và Modal Quản Lý Danh Mục trong `AdminProducts.tsx`.

3. **Banner Hero Vector WebP & Video Nền Chạy Ngầm**:
   - Trích xuất bản vẽ thiết kế vector từ `Backdrop 133 x 256cm.pdf` sang WebP 1920px (`backdrop_banner.webp`), giải quyết triệt để lỗi mờ vỡ hạt.
   - Tối ưu hóa và tích hợp `hero-video.mp4` chạy nền mượt mà kèm nút bật/tắt tiếng trên `Hero.tsx`.

4. **Chuẩn hóa Logo Zalo Business (ZBS) & Xác thực Domain**:
   - Triển khai 2 file xác thực domain HTML theo chuẩn Zalo (`NjE12PILCpro...`).
   - Tạo logo ZBS 1:1 hình tròn an toàn 15% inner padding (`zbs_logo_light.png`, `zbs_logo_dark.png`) lưu tại Desktop `C:\Users\editor02\Desktop\wasy` và trên VPS.
   - Tạm thời vô hiệu hóa guard OTP ZNS (`POST /api/auth/register`) do Zalo OA chưa mua gói trả phí.

5. **Nâng cấp Tạo Đơn Hàng & Bảo Mật Admin**:
   - Hiện ảnh thực tế và điểm tích lũy ⭐ CP trong `CreateOrderModal.jsx`.
   - Hiệu ứng Hover Zoom Popup phóng to ảnh xem nhanh sản phẩm khi rê chuột.
   - Fix lỗi upload ảnh sản phẩm `POST /api/upload` bằng multer và exempt CSRF.
   - Bắt buộc mật khẩu tối thiểu 8 ký tự kèm chữ hoa, chữ thường, số, ký tự đặc biệt.
   - Thêm kéo thả và nút mũi tên sắp xếp thứ tự gói NPP (`sortOrder`).
   - Lọc gói NPP Combo chỉ hiện máy lọc nước.
   - Sửa lỗi sponsor F0 hiển thị chính mình trong Admin Tạo Đơn (dùng `networkParent`).
   - Gán `periodId` cho `NppCommission` để kỳ hoa hồng không bị bỏ sót.

---

### ⏳ Nhiệm Vụ Tiếp Theo Khi Mở Máy Ở Nhà (Next Session Roadmap)

1. **Kiểm tra hiển thị giao diện trên Máy Nhà / Mobile**:
   - Truy cập `https://wasypro.com` kiểm tra banner mới, video nền, 3 tab danh mục sản phẩm và mục Video & Sự Kiện (bấm xem popup video).
   - Truy cập `https://wasypro.com/admin` kiểm tra Quản lý Tin tức (thêm/sửa bài viết video) và Quản lý Sản phẩm (modal danh mục).
2. **Kích hoạt lại Zalo ZNS OTP (khi Zalo OA hoàn tất thanh toán gói)**:
   - Khi sếp thông báo Zalo OA đã mua xong gói tin ZNS, bỏ comment kiểm tra OTP trong `server/index.js` (`POST /api/auth/register`).
3. **Chế độ Combo trong Tạo Đơn Admin cho NPP**:
   - Mở rộng form Tạo Đơn Admin khi chọn khách hàng là NPP: cho phép chọn danh sách nhiều máy theo cơ chế combo thay vì dropdown đơn lẻ.
4. **Kiểm tra đối soát Kỳ Hoa Hồng**:
   - Đối chiếu số liệu bảng hoa hồng giữa Admin (`/api/admin/periods/:id/commissions`) và CTV Portal để xác nhận 4 khoản tính đủ (bán lẻ + NPP referral D1/D2).

---

### 📋 Boss Decision Items (Cần ý kiến Sếp)
- D2: Tỷ lệ hoa hồng: Hardcode theo bảng chính thức hay cấu hình động qua Policy Table? (Hiện đã cấu hình động theo cấp bậc).
- D3: Mô hình Dịch vụ (Service model): Giữ lại hay lược bỏ?
- D7: SQLite → PostgreSQL: Khi nào chuyển đổi dữ liệu lên Postgres? (Hiện tại SQLite chạy mượt và an toàn).

---

## Architecture & Data Invariants

### 🔒 Invariant Rule: Nguyễn Đức Quang (U1001 / 0968616263)
- Tài khoản CTV số 1 của hệ thống, BẢO VỆ VĨNH VIỄN.
- KHÔNG BAO GIỜ bị xóa trong mọi trường hợp (kể cả Factory Reset, Reset Members hay Delete User).
- Ẩn hoàn toàn nút Xóa trong giao diện quản trị CTV (`AdminCTVManagement.tsx`).

### 2 Bảng Commission Riêng Biệt (QUAN TRỌNG)
```
Commission       → Đơn bán lẻ (SELF_BUY, DIRECT_NO_ID, DIRECT_WITH_ID, F1, F2)
NppCommission    → Hoa hồng giới thiệu NPP (D1 10%, D2 5%)
```
Mọi API thống kê, đối soát, kỳ chi trả đều PHẢI query gộp cả 2 bảng.

### Sponsor Resolution
- `Customer.sourceCtvId` = CTV tạo record (có thể là chính mình).
- `User.parentId` = Bảo trợ thực sự trong mạng lưới (F0).
- Luôn ưu tiên dùng `User.parentId` (`networkParent`) để hiển thị sponsor.
