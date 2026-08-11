# WASY PRO - Hệ Thống Thiết Kế (Design System) & Wireframes

## 1. Bảng Màu (Color Palette)
- **Primary (Deep Ocean)**: `#0284c7` - Dùng cho các nút bấm chính, tiêu đề quan trọng.
- **Aqua Cyan**: `#06b6d4` - Dùng cho hiệu ứng hover, gradient, các điểm nhấn về nước.
- **Emerald Mint**: `#10b981` - Dùng cho các chỉ số tốt (pH chuẩn), trạng thái thành công.
- **Slate**: `#0f172a` - Dùng cho text chính, footer, nội dung.
- **Ice Light**: `#f0f9ff` - Dùng cho background phụ, section cần sự tươi mát.
- **Accent Gold**: `#f59e0b` - Dùng cho sao đánh giá, nút CTA nổi bật.

## 2. Typography
- **Heading**: Outfit (Tạo cảm giác hiện đại, công nghệ).
- **Body**: Inter (Dễ đọc, rõ ràng cho thông tin chi tiết).

## 3. Style & Effects (Glassmorphism & Bo góc)
- **Glassmorphism**: Áp dụng cho Header khi cuộn, các card nổi bật. Cấu trúc gồm nền trắng trong suốt 70%, blur 12px, shadow nhẹ màu xanh.
- **Bo góc (Border Radius)**: Bo góc 16px (`1rem`) cho các khối card lớn, 8px (`0.5rem`) cho các nút bấm.

---

## 4. Wireframes Cấu Trúc Các Trang

### 4.1. Header
- **Layout**: Sticky header với hiệu ứng Glassmorphism.
- **Trái**: Logo Water King / WASY PRO.
- **Giữa**: Navigation menu (Trang chủ, Sản phẩm, Công nghệ, Bảo hành, Tin tức).
- **Phải**: 
  - Hotline nổi bật: **1900 98 98 78** (Màu Accent Gold hoặc Primary).
  - Nút "Tra cứu bảo hành".
  - Icon Quick Contact Drawer (Mở ra khay liên hệ nhanh).

### 4.2. Hero Section
- **Background**: Video hoặc ảnh động về dòng nước trong vắt, bọt khí hydrogen.
- **Content**:
  - Headline lớn: "WASY PRO - Giải Pháp Nước Tốt Cho Sức Khỏe".
  - Sub-headline mô tả các chỉ số: **pH 8.5-9.5 | ORP -400mV to -800mV | Hydro 1200-1600ppb**.
- **CTA Buttons**: "Khám Phá Ngay" (Primary) và "Nhận Tư Vấn" (Outline Glass).

### 4.3. Danh Mục Sản Phẩm (Category Page)
- **Bố cục**: Dạng Grid 3 hoặc 4 cột.
- **Các Tabs/Danh mục chính**:
  1. Nước Hydrogen ion kiềm
  2. Máy tạo nước Hydrogen
  3. Linh kiện lọc nước
  4. Thiết bị đo chỉ số
  5. Màn chống sóng điện từ
- **Card Sản Phẩm**:
  - Ảnh sản phẩm (có hiệu ứng zoom nhẹ khi hover).
  - Tên sản phẩm (Outfit, Semibold).
  - Badge nổi bật (VD: "Mới", "Bán Chạy").
  - Giá (nếu có).
  - Nút "Xem chi tiết".

### 4.4. Chi Tiết Sản Phẩm (Product Detail)
- **Trái**: Product Images (Gallery, Thumbnail trượt).
- **Phải**: 
  - Tên sản phẩm, Đánh giá (Sao màu Accent Gold).
  - Thông số kỹ thuật nổi bật.
  - Box Đặt hàng & Gọi Hotline.
- **Dưới**: Specs table (Bảng thông số chi tiết), Đánh giá của khách hàng, Sản phẩm liên quan.

### 4.5. Tra Cứu Bảo Hành
- **Hero Area**: Hình ảnh kỹ thuật viên tận tâm, nền màu Ice Light.
- **Form Tra Cứu**: Card Glassmorphism đặt chính giữa.
  - Input: Nhập SĐT hoặc Mã Máy.
  - Nút Submit: "Tra Cứu" (Primary Color).
- **Kết Quả (Trạng thái)**: Hiển thị thông tin máy, ngày kích hoạt, hạn bảo hành, lịch sử bảo dưỡng (nếu có).

### 4.6. Tin Tức & Hỏi Đáp (FAQs)
- **Tin Tức**: Grid layout cho các bài viết về sức khỏe, công nghệ nước.
- **FAQs**: Dạng Accordion, nội dung ngắn gọn, bo góc mềm mại.

### 4.7. Footer
- **Background**: Màu Slate (`#0f172a`), chữ màu trắng/xám nhạt.
- **Cột 1**: Thông tin thương hiệu WATER KING (Logo, Giới thiệu ngắn).
- **Cột 2**: Liên hệ (Địa chỉ, Hotline, Email).
- **Cột 3**: Chính sách (Bảo hành, Đổi trả, Giao hàng, Bảo mật).
- **Cột 4**: Đăng ký nhận tin & Mạng xã hội.
