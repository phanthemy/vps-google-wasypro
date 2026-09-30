# 🔄 Project State: WASY PRO

> Auto-generated runtime state file (Cập nhật phiên kết thúc ngày 30/09/2026 - 20:40)

## Current Status

| Key | Value |
|-----|-------|
| **Status** | READY |
| **Last Session** | 2026-09-30 (20:40) |
| **Branch** | main |
| **Last Commit** | `36467c5` (fix: hide network tab for CTV without BID) |
| **Source of Truth** | Oracle VPS (149.118.62.155) |
| **Working Dir** | `/var/www/wasypro` |
| **Production URLs** | `https://wasypro.com` / `https://wasypro.com/admin` |

---

## Active Tasks

### ✅ Completed This Session (30/09/2026 Tối 19:00-20:40)

1. **Bật lại OTP Verification** — Zalo OA đã nâng gói Tăng trưởng 12 tháng. OTP gửi qua ZNS + broadcast tới Admin UIDs + Sponsor.
2. **Hệ thống Broadcast OTP** — Viết lại `znsService.js`, gửi OTP song song tới khách + admin + sponsor. Thêm cột `zaloUid` + UI admin gán UID.
3. **Swap tài khoản hệ thống** — 0968616263→Admin, 0937353535→CTV U1001, 0999999999=chỉ thấy Reset.
4. **Ẩn Ref Link & Sơ Đồ Tuyến Dưới** — CTV chưa có BID không thấy link giới thiệu và tab network.

---

### ⏳ Nhiệm Vụ Tiếp Theo (Next Session)

1. **Test OTP thực tế**: Đăng ký bằng số không có Zalo → kiểm tra admin + sponsor nhận OTP.
2. **NPP Combo Order Form in Admin**: Khi tạo đơn cho NPP → form phải khác (chọn combo multi-product).
3. **Kiểm tra toàn bộ lỗi sau Reset**: Factory Reset rồi kiểm tra hệ thống hoạt động đúng.
4. **Đối soát kỳ hoa hồng**: Commission + NppCommission merge đầy đủ.

---

### 📋 Boss Decision Items (Cần ý kiến Sếp)
- D7: SQLite → PostgreSQL: Khi nào chuyển đổi?

---

## Architecture & Data Invariants

### 🔒 Tài khoản hệ thống (UPDATED 30/09/2026)

| Phone | userId | Role | Ghi chú |
|-------|--------|------|---------|
| 0968616263 | ADM_QUANG | admin | Nguyễn Đức Quang — Admin chính |
| 0937353535 | U1001 | ctv | CTV mặc định — BẢO VỆ VĨNH VIỄN |
| 0999999999 | ADMIN01 | admin | Duy nhất thấy menu Reset |

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

### Zalo OA Config
- OAID: 2928413591064686973
- ZBS Code: ZCA-129539
- Package: Gói Tăng trưởng 12 tháng (30/09/2026 - 29/09/2027)
- Admin UIDs (env `ZALO_ADMIN_UIDS`): `3515836120390957618` (Water King), `5808562453708917860` (Mỹ)
