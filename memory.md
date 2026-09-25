# WasyPro — Memory Log

## Cập nhật: 2026-09-25

### Phiên 25/09/2026 (08:13 - 10:47)

#### Đã làm:
1. **Fix APPROVED NPP tab** — NPP user status APPROVED không thấy tab Gói NPP → thêm APPROVED vào visibility list (commit `91bdebe`)
2. **Factory Reset bổ sung NPP** — Thêm 6 bảng NPP vào Factory Reset: NppCommission, NppPayment, NppPurchaseItem, NppPurchase, NppActivation, NppRegistration. Giữ NppPackage + NppPackageItem (commit `7e8e0e3`, `3d76394`)
3. **Factory Reset UI** — Cập nhật giao diện admin hiển thị NPP trong danh sách xóa/giữ (commit `15afbc9`)
4. **Sort gói NPP** — Sắp xếp theo code (NPP-001 → NPP-002...) trong tất cả admin views (commit `a48c377`)
5. **Fix avatar không hiển thị** — Nginx thiếu proxy `/uploads/` → ảnh 404. Thêm location `/uploads/` + thêm `wasypro.com` vào server_name + xóa .bak conflict
6. **Fix font tiếng Việt** — AdminMembersView.tsx viết không dấu + mojibake â€" → sửa toàn bộ 21 text replacements (commit `aa0a638`, `440e5da`)

#### KHÔNG sửa (đọc logic):
- "Nâng lên CTV" chỉ set isSystemParticipant=true. KHÔNG cấp rank/businessId. Rank AMBASSADOR + BID WK-XXXXX chỉ được cấp TỰ ĐỘNG khi qualifyingPoints >= 5000 CP (AMBASSADOR_THRESHOLD).

### Phiên 23-24/09/2026

#### Backend fixes:
- Referral code bug: backend accepts both `refCode` AND `referralCode` (commit `aa24fe1`)
- my-discount userId bug: `req.user.id` → `req.user.dbId` (commit `4c31d06`)
- API `GET /api/npp/my-combo` endpoint (commit `4c31d06`)

#### Frontend fixes:
- NPP tab systemic fix: chỉ hiện cho APPROVED/PURCHASING/PAID/ACTIVE (commit `62c49a1`)
- SettingsView NPP vs CTV: ẩn CP progress cho NPP user (commit `4190a26`)
- CreateOrderModal combo mode: 3 chế độ Combo/CK/Retail (commits `16abcd1` → `bc80fac`)

#### Data fixes:
- U958 Dai Su 01: isNpp=0 (không phải NPP)
- U509, TEST_UA: isNpp=0
- U828 (Phan Thế Mỹ): NPP thật duy nhất

---

## Quy tắc quan trọng

### Source of Truth
- VPS: `/var/www/wasypro/` — Oracle VPS `149.118.62.155`
- GitHub: backup only

### NPP Tab Visibility
```
PENDING → ẩn (chưa duyệt)
APPROVED → hiện (cần mua gói)
PURCHASING → hiện
PAID → hiện
ACTIVE → hiện
```

### req.user structure
```js
req.user = { id: "U199", userId: "U199", dbId: cuid, role, fullName, phone }
```
- NppPurchase.userId = cuid → dùng `req.user.dbId`

### Factory Reset
- Xóa: 26 bảng (Orders, Users non-admin, Commission, NPP data...)
- Giữ: Product, NppPackage, SystemPolicyConfig, Admin users
- Admin users: reset points/rank/isNpp, giữ account

### Rank Logic (CTV)
- isSystemParticipant=true → là CTV
- CP tích lũy từ đơn hàng
- CP >= 5000 (AMBASSADOR_THRESHOLD) → tự động rank AMBASSADOR + Business ID WK-XXXXX
- KHÔNG cấp rank khi promote, chỉ khi đủ CP

### Nginx
- `/uploads/` proxy → backend port 3011
- `wasypro.com` + `wasypro.nextapp.vn` → port 5005 (admin+landing)
- `app.wasypro.com` → port 5175 (CTV portal)
- API `/api/` → port 3011

### Tránh
- sed trên server/index.js → dùng Python
- PowerShell inline quotes → dùng .sh scripts
- BigInt() parse formatted numbers → strip dots
- Báo cáo xong mà chưa test thật
