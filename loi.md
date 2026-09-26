# WasyPro — Log Lỗi

## 2026-09-26

### L05: San pham khong hien hinh anh (Anh tai len 404 + Anh mau thieu)
- **Trieu chung**: Hinh anh san pham (dac biet anh tai len tu Admin) bi loi 404, hien thi HTML trang. Cac may loc "Water King" bi loi khong hien thi hinh anh.
- **Nguyen nhan**: 
  1. Nginx proxy /uploads/ sang backend (3011). Tuy nhien server/index.js chi phuc vu anh tinh tu ../public/uploads (noi chua avatars). Cac san pham upload tu Frontend PM2 (server.cjs) lai luu vao ../uploads/products, dan den mismatch duong dan va tra ve 404.
  2. Nhieu san pham trong CSDL tham chieu file water-king-pro-9.jpg, nhung file nay khong he ton tai tren VPS (/dist va /public).
- **Fix**: 
  1. Them express static mount ../uploads vao backend index.js de phuc vu anh san pham dung luong Nginx.
  2. Copy anh WebP cua may WS-03 thanh water-king-pro-9.jpg lam placeholder.
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
