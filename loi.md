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

### L?i 29/09/2026: T?i kho?n NPP b? hi?n th? nh?m t?ch l?y 5.000 CP v? rank ??i s? s?m
- **Hi?n t??ng**: Khi t?o/??ng k? t?i kho?n NPP m?i (ch?a thanh to?n/ch? duy?t), m?n h?nh "Th?ng Tin T?i Kho?n" hi?n th? nh?n "?i?m T?ch L?y (CP): 0 / 5.000 CP", thanh ti?n tr?nh c?p b?c CTV 5.000 CP, v? rank "?? ??i s?" s?m.
- **Nguy?n nh?n**:
  1. Backend `computeNppRank` truy v?n c? registration status `['PENDING', 'APPROVED']` v? tr? v? `assignedRank` c?a g?i tr??c khi ng??i d?ng thanh to?n/k?ch ho?t.
  2. Frontend `SettingsView.jsx` ch? ?n th? CP v? thanh ti?n tr?nh khi status l? `ACTIVE`, b? s?t c?c tr?ng th?i ??ng k? NPP (`PENDING`, `APPROVED`, `PURCHASING`, `PAID`).
- **C?ch fix**:
  1. `server/index.js`: ?i?u ch?nh `computeNppRank` ch? tr? v? rank khi purchase status l? `COMPLETED` ho?c registration status l? `CONVERTED`.
  2. `src/components/ctv/views/SettingsView.jsx`: B? sung ki?m tra `isNppUser`. NPP ch?a k?ch ho?t hi?n th? badge "? Ch? k?ch ho?t", th? s? 4 hi?n th? "Tr?ng th?i NPP" (Ch? Admin duy?t ??ng k? / ?? duy?t / ?ang mua g?i), ?n ho?n to?n thanh t?ch l?y 5.000 CP. Gi? nguy?n 100% logic cho CTV th??ng.

### L?i 29/09/2026: L?i font ch? ti?ng Vi?t (?) trong SettingsView.jsx
- **Hi?n t??ng**: Sau khi c?p nh?t giao di?n, c?c ch? ti?ng Vi?t c? d?u bi?n th?nh d?u h?i ch?m "?".
- **Nguy?n nh?n**: Script ghi file qua PowerShell b? l?ch chu?n m? h?a sang ANSI/Windows-1252 khi pipe qua SSH.
- **C?ch fix**: So?n th?o script b?ng UTF-8 nguy?n b?n, ??y file tr?c ti?p l?n VPS v? build l?i b?ng Vite. ?? ki?m tra l?i `git diff` ??m b?o 100% ti?ng Vi?t c? d?u chu?n x?c.
