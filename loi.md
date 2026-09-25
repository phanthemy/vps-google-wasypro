# WasyPro — Log Lỗi

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
