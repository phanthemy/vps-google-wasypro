# WASY PRO - Water King (Website Redesign & Admin Portal)

Dự án thiết kế lại website thương hiệu máy lọc nước **WASY PRO / Water King** đạt tốc độ cực nhanh (<0.5s), giao diện sang trọng, tích hợp hệ thống quản trị Admin Portal chuyên nghiệp.

---

## 🛠️ Công Nghệ Sử Dụng
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons.
- **Design Tokens**: Ocean Blue (`#0284c7`), Aqua Cyan (`#06b6d4`), Mint Green (`#10b981`), Glassmorphism.
- **Admin Portal**: Quản lý Sản phẩm, Bảo hành điện tử, Đơn đăng ký tư vấn khách hàng, Bài viết.
- **State Coverage**: Đủ 4 trạng thái UI (Normal, Loading, Empty, Error), responsive 100%.

---

## 🔑 Tài Khoản Admin Đăng Nhập
Bấm vào nút **"Trang Quản Trị Admin"** trên Header/Footer để mở Portal:
- **Email**: `admin@wasypro.com`
- **Mật khẩu**: `123456`

---

## 🛠️ Cài Đặt & Chạy Local

1. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

2. **Chạy dev server**:
   ```bash
   npm run dev
   ```

3. **Build production**:
   ```bash
   npm run build
   ```

---

## 🚀 Deploy Tự Động Lên VPS (`149.118.62.155`)

Dự án có sẵn script PowerShell tự động hóa 100% quá trình build & deploy lên VPS Ubuntu:

```powershell
.\deploy.ps1
```

Script sẽ tự động:
1. Build production bundle (`npm run build`).
2. Nén và SCP upload toàn bộ file sang VPS `/var/www/wasypro`.
3. Tự động khởi chạy dịch vụ qua PM2 (Cổng `5005`) & Caddy/Nginx reverse proxy HTTPS.
