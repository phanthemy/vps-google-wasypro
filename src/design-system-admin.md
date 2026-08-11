# WASY PRO - Admin Design System

## 1. Admin Layout
- **Sidebar Điều Hướng**:
  - Tổng quan (Dashboard)
  - Sản phẩm
  - Bảo hành
  - Đơn tư vấn
  - Tin tức
  - Cấu hình
- **Header**: User profile, notifications, breadcrumb.
- **Main Content Area**: Container rộng rãi, padding chuẩn (p-4 hoặc p-6).

## 2. Color Theme (Slate & Ocean Admin Palette)
- **Chủ đạo (Primary)**: Ocean Blue (`#0ea5e9`, `#0284c7`, `#0369a1`) - dùng cho button chính, active state.
- **Nền & Văn bản (Neutral/Slate)**:
  - Nền trang (Background): `#f8fafc` (Slate 50)
  - Nền Card/Panel (Surface): `#ffffff` (White)
  - Text chính: `#0f172a` (Slate 900)
  - Text phụ: `#64748b` (Slate 500)
- **Trạng thái (Feedback)**:
  - Thành công/Hoàn thành: `#10b981` (Emerald 500)
  - Cảnh báo/Chờ: `#f59e0b` (Amber 500)
  - Lỗi/Hủy: `#ef4444` (Red 500)
- **Mục tiêu**: Tương phản cao, tối giản, chuyên nghiệp, dễ đọc dữ liệu.

## 3. Design Specs cho các trang

### 3.1 Dashboard Overview
- **Thống kê tổng quan (Metric Cards)**: Số lượng đơn tư vấn mới, số yêu cầu bảo hành, tổng số sản phẩm.
- **Biểu đồ**:
  - Biểu đồ đường/cột cho số lượng đơn tư vấn theo tháng/tuần.
  - Biểu đồ tròn (Pie chart) hiển thị tỷ lệ trạng thái bảo hành hoặc phân loại đơn tư vấn.

### 3.2 Quản lý Sản phẩm
- **Giao diện chính**: Data Table có hỗ trợ tìm kiếm, lọc theo danh mục, phân trang.
- **Cột hiển thị**: Hình ảnh, Tên SP, Loại, Giá (nếu có), Trạng thái.
- **Form/Modal Thêm/Sửa**:
  - Chia thành các phần hoặc Tabs: Thông tin chung, Hình ảnh, **Thông số máy kiềm**, **Lõi lọc**.
  - Form nhập liệu rõ ràng, có validation.

### 3.3 Quản lý Bảo hành
- **Giao diện chính**: Danh sách yêu cầu bảo hành/thiết bị đang bảo hành.
- **Hành động chính**:
  - **Cấp mã bảo hành mới**: Nút Primary nổi bật mở Modal/Page cấp mã.
  - **Nhật ký bảo trì**: Khi click vào một thiết bị, mở Drawer/Panel bên phải hiển thị lịch sử bảo trì và form **thêm nhật ký bảo trì** mới.

### 3.4 Quản lý Khách hàng Tư vấn
- **Giao diện chính**: Bảng danh sách liên hệ khách hàng.
- **Tính năng trọng tâm**:
  - Filter nhanh theo trạng thái (Tabs: Tất cả | Mới | Đã gọi | Hoàn thành).
  - Khả năng cập nhật trạng thái nhanh chóng (Dropdown status inline trên bảng).

### 3.5 Quản lý Tin tức
- **Giao diện chính**: Bảng danh sách bài viết.
- **Form Thêm/Sửa bài viết**:
  - Trường nhập tiêu đề, tóm tắt, ảnh bìa.
  - Tích hợp **Rich Text Editor** để soạn thảo nội dung.
  - Toggle Ẩn/Hiện (Publish/Draft) bài viết nhanh chóng.
