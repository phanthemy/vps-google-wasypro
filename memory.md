# 📘 WASYPRO — Nghiệp Vụ Cốt Lõi & Lỗi Đã Fix

> **Cập nhật:** 14/09/2026 16:00
> **Mục đích:** Source of truth cho AI — đọc file này TRƯỚC khi sửa bất kỳ gì.

---

## ⚠️ AI AGENT — BẮT BUỘC ĐỌC KHI BẮT ĐẦU PHIÊN

> **TRƯỚC KHI LÀM BẤT CỨ GÌ**, kể cả khi user gõ "bắt đầu phiên" hay bất kỳ yêu cầu nào:
> 1. Đọc toàn bộ file này (`memory.md`)
> 2. Đọc `loi.md`
> 3. Xác nhận với user: danh sách lỗi còn tồn đọng + tính năng đã làm
> 4. CHỈ SAU ĐÓ mới nhận và thực hiện yêu cầu mới

**KHÔNG được bỏ qua bước này dù user không nhắc.**

---



---

## I. NGHIỆP VỤ CỐT LÕI

### 1. Hệ thống CTV (Cộng Tác Viên)

```
Đăng ký → Tham gia CTV → Tích lũy CP → Đạt 5.000 CP → Đại Sứ → Quản Lý → Giám Đốc
```

| Khái niệm | Ý nghĩa |
|---|---|
| `isSystemParticipant` | User đã tham gia CTV (true = CTV, false = thành viên thường) |
| `qualifyingPoints (QP)` | Điểm tích lũy từ đơn hàng, dùng xét rank |
| `sPoints (SP)` | Điểm thưởng |
| `businessId (BID)` | Mã đối tác (WK-10001, WK-10002...), cấp khi đạt 5.000 CP |
| `rank` | Cấp bậc: null → AMBASSADOR → MANAGER → DIRECTOR |
| `parentId` | Người giới thiệu (sponsor trong cây CTV) |

### 2. Vòng đời Đơn Hàng

```
NEW → [DEPOSIT] → CONFIRMED → SHIPPING → COMPLETED → [CANCELLED]
```

- **Forward-only**: chỉ chuyển tiến, không lùi
- **DEPOSIT** không bắt buộc (có thể skip)
- **COMPLETED**: trigger settlement (tính điểm + hoa hồng + rank)
- **CANCELLED**: trigger reversal (hoàn tất cả)
- Rời COMPLETED → auto reverse

### 3. Settlement (Khi đơn COMPLETED)

Thứ tự xử lý trong 1 transaction:
1. Cộng QP/SP cho buyer
2. Kiểm tra threshold 5.000 CP → cấp BID + rank AMBASSADOR
3. Tính commission (SELF, DIRECT/SPLIT, F1, F2)

### 4. Hoa Hồng — QUY TẮC VÀNG

#### Bảng tỷ lệ (Boss đã chốt):

| Rank | SELF | DIRECT_NO_ID | DIRECT_WITH_ID | F1 | F2 |
|---|---|---|---|---|---|
| Ambassador | 20% | 20% | 10% | 10% | 5% |
| Manager | 25% | 25% | 10% | 10% | 5% |
| Director | 30% | 30% | 10% | 10% | 5% |

#### Ai nhận gì:

| Loại | Người nhận | Điều kiện |
|---|---|---|
| **SELF** | Buyer (CTV tự mua) | `isSelf && priorBusinessId && order đặt SAU khi có BID` |
| **DIRECT_NO_ID** | Sponsor (người giới thiệu buyer) | Buyer chưa có BID |
| **DIRECT_WITH_ID** | Sponsor | Buyer đã có BID |
| **SPLIT** | Sponsor | Buyer vượt threshold (qualifying 20% + excess 10%) |
| **F1** | Sponsor's parent | Buyer đã có BID trước đơn |
| **F2** | Sponsor's grandparent | Buyer đã có BID trước đơn |

#### Quy tắc CRITICAL:

1. **SELF chỉ cho đơn ĐẶT SAU khi có BID** — đơn đặt trước nhưng duyệt sau = KHÔNG SELF
2. **Sponsor ≠ chính mình** — `Customer.sponsorUserId` phải = `parentId` (người giới thiệu), KHÔNG phải user.id
3. **Safety guard**: nếu `directSponsor.id === orderer.id` → set null
4. **Đơn tạo ra BID** (vượt threshold): `priorBusinessId = null` → KHÔNG có SELF
5. **F1/F2 traverse từ sponsor** (không từ buyer) — tránh sponsor nhận cả DIRECT lẫn F1

### 5. Customer (Khách hàng) — Self-linked

Khi CTV tham gia, hệ thống tạo Customer record:
- `linkedUserId = user.id` (self-linked)
- `sponsorUserId = user.parentId` (người giới thiệu, KHÔNG phải chính mình)
- Nếu không có parent → `sponsorUserId = null`

### 6. Reset — 4 cấp độ

| Nút | Scope | Giữ lại |
|---|---|---|
| **Reset Đơn Hàng** | Xóa orders + commissions + points | Users, CTV status, customers |
| **Reset CTV** | Clear rank/QP/SP/BID | Users + CTV status (`isSystemParticipant=true`) |
| **Reset Members** | Xóa non-admin users + customers | Admin accounts |
| **Factory Reset** | Xóa TẤT CẢ data vận hành | Admin + products + config |

> **QUAN TRỌNG**: Reset CTV GIỮ `isSystemParticipant=true`. CTV vẫn ở tab CTV sau reset.

### 7. Xóa CTV đơn lẻ

- Admin → Quản Lý CTV → Click CTV → 🗑️ Xóa CTV
- Xóa HOÀN TOÀN: user + orders + commissions + customers + points + rank
- User biến mất khỏi hệ thống, KHÔNG rớt xuống tab Thành Viên

---

---

## II. BUSINESS RULES ĐÃ CHỐT — REFERRAL / SPONSOR (14/09/2026)

### Quy tắc hình thành quan hệ bảo trợ:

1. **Đăng ký với refCode của A** → `parentId = A.userId` ngay tại đăng ký — không cần xác nhận riêng
2. **Direct Customer NO ID**: user có `parentId = A`, chưa `isSystemParticipant`, chưa BID → A nhận `DIRECT_NO_ID 20%` khi user mua hàng
3. **`isSystemParticipant`** chỉ xác định đã tham gia CTV hay chưa — KHÔNG dùng để xác định thuộc sponsor hay không
4. **Không cho phép thay đổi sponsor qua URL**: user đã có `parentId = null` → vào referral link của A → `parentId` KHÔNG đổi
5. **Website order commission bridge** — điều kiện `(sponsorUserId || authedUser.isSystemParticipant)` là ĐÚNG:
   - `sponsorUserId = authedUser.parentId` (từ DB, không từ URL)
   - User có `parentId = A` → bridge fire → A nhận DIRECT_NO_ID → ĐÚNG
   - User có `parentId = null` + không phải CTV → không fire → ĐÚNG

### Commission status (14/09/2026):
- Commission tạo ra với `status: 'PAID'` ngay khi settlement — KHÔNG có bước Admin duyệt thủ công

---

## III. LỖI ĐÃ FIX — PHIÊN 14/09/2026

### Bug 11: Cột KHÁCH hiển thị sai (14/09)
- **Commit**: `14e064d`
- **Root cause**: `GET /api/admin/ctv` đếm cả Customer self-linked (CTV tự liên kết)
- **Fix**: Thêm `where: { linkedUserId: null }` để loại self-linked

### Bug 12: Commission PENDING thay vì PAID (14/09)
- **Commit**: `ce5e809`
- **Root cause**: `calculateAndCreateCommissions` tạo `status: 'PENDING'`
- **Fix**: Đổi thành `status: 'PAID'` — không có bước Admin duyệt thủ công theo business rule

### Feature: Nút "Tạo Khách Mới" luôn hiển thị (14/09)
- **Commit**: `0849507`
- **Root cause**: Nút chỉ hiện khi `filteredCustomers.length === 0` → Quản Lý / Giám Đốc có downline → nút ẩn
- **Fix**: Tách nút ra khỏi điều kiện, luôn hiện song song với danh sách khách

---

## IV. LỖI ĐÃ FIX — PHIÊN 11/09/2026

### Bug 1: Sponsor nhận F1 thay vì DIRECT khi CTV tự mua
- **Commit**: `e65c843`
- **Root cause**: Block DIRECT guard `!isSelf` → skip khi self-buy
- **Fix**: Bỏ `!isSelf`, DIRECT chạy cho cả self-buy

### Bug 2: SPLIT guard có `!isSelf`
- **Commit**: `b9f9bef`
- **Root cause**: SPLIT bị skip khi self-buy → sponsor nhận flat 20% thay vì split
- **Fix**: Bỏ `!isSelf` khỏi SPLIT guard

### Bug 3: Reset Orders thiếu audit + BID sequence
- **Commit**: `b9f9bef`
- **Root cause**: Reset không xóa CustomerAuditLog, Period data; BID sequence không reset
- **Fix**: Thêm cleanup + reset BID về 10001

### Bug 4: CTV tự là sponsor của chính mình (CRITICAL)
- **Commit**: `c774fd7`
- **Root cause**: 4 chỗ tạo Customer đều gán `sponsorUserId = user.id`
- **Fix**: `sponsorUserId = user.parentId` + safety guard trong settlement

### Bug 5: SELF sai khi duyệt đơn không theo thứ tự
- **Commit**: `dbe8e83`
- **Root cause**: Duyệt đơn 5000 CP trước → có BID → duyệt đơn 4000 CP sau → SELF 20% sai
- **Fix**: So sánh `order.createdAt` vs `orderer.rankAchievedAt`

### Bug 6: Checkbox tham gia CTV mặc định KHÔNG tick
- **Commit**: `043b412`
- **Root cause**: `useState(false)` → đăng ký mà không tick = không join CTV
- **Fix**: `useState(true)` — mặc định tick sẵn

### Bug 7: Reset CTV xóa luôn tư cách CTV
- **Commit**: `be80f5a`
- **Root cause**: `reset-ctv` set `isSystemParticipant: false` → CTV rớt xuống Thành Viên
- **Fix**: Giữ `isSystemParticipant = true`, chỉ clear rank/QP/SP/BID

### Feature: Nút Xóa CTV đơn lẻ
- **Commit**: `a231e90`
- Backend: `DELETE /api/admin/users/:userId`
- Frontend: Nút 🗑️ Xóa CTV trong detail view

---

## V. FILES QUAN TRỌNG

| File | Chức năng | Lines |
|---|---|---|
| `server/index.js` | Backend monolith | ~5500 |
| `server/prisma/schema.prisma` | Database schema | — |
| `src/components/admin/AdminCTVManagement.tsx` | Admin quản lý CTV | ~600 |
| `src/components/admin/AdminOrders.tsx` | Admin quản lý đơn | ~750 |
| `src/components/auth/UnifiedAuthModal.tsx` | Form đăng ký/đăng nhập | — |
| `src/components/ctv/views/CommissionHistoryView.jsx` | Hoa hồng CTV portal | — |

---

## VI. KHÔNG BAO GIỜ LÀM

1. ❌ KHÔNG gán `sponsorUserId = user.id` (self-sponsor)
2. ❌ KHÔNG set `isSystemParticipant = false` trong reset-ctv/reset-orders
3. ❌ KHÔNG sửa `src/src/App.jsx` — đây KHÔNG phải admin component chính
4. ❌ KHÔNG dùng Bearer token — auth là Cookie-based
5. ❌ KHÔNG chạy `prisma db push` trên SQLite — dùng `better-sqlite3`
6. ❌ KHÔNG cho SELF commission trên đơn đặt TRƯỚC khi có BID
7. ❌ KHÔNG inline phức tạp JS trong SSH — viết .cjs file, SCP lên VPS
8. ❌ KHÔNG kết luận P1 bug khi chưa đọc kỹ business rule — audit trước, kết luận sau
9. ❌ KHÔNG xóa `sponsorUserId` khỏi điều kiện bridge — đây là đúng theo business rule

---

## VII. PRODUCTION RISKS CÒN TỒN TẠI (14/09/2026)

| # | Mức | Vấn đề | Ghi chú |
|---|-----|---------|---------|
| 1 | 🟡 P2 | `app.wasypro.com` standalone `OrderModal.jsx` sai payload (`ctvBuyerId` thay vì `purchaseSubject`) → 400 error | Chưa fix |
| 2 | 🟡 P2 | Policy key `MANAGER_F1_SELL_TO_CUSTOMER_NO_ID` có trong DB nhưng engine không dùng | Data dư, gây nhầm lẫn |

**Backup baseline:** `backup_14.09.2026` tại `/var/www/wasypro/backups/backup_14.09.2026/` — 279MB — commit `08495070`

---

## VIII. TRẠNG THÁI DB (tại backup 14/09/2026)

| Table | Rows |
|-------|------|
| User | 34 |
| Customer | 31 |
| Order | 35 |
| Commission | 31 (tất cả PAID) |
| Product | 10 |
| SystemPolicyConfig | 18 keys (v1.4.0) |
| BusinessIdSequence | nextVal: 10007 |

---

## IX. PHIÊN 14/09/2026 (CHIỀU) — WATER KING GROUP EXPANSION

### Việc đã làm:
1. **Audit toàn diện hệ thống** — báo cáo đầy đủ 7 module, 80+ API endpoints
2. **Backup baseline** ackup_14.09.2026 — 279MB tại /var/www/wasypro/backups/backup_14.09.2026/ — commit 

---

## X. PHIÊN 17/09/2026 — CẬP NHẬT MÀU RANK, AVATAR UPLOAD & SHIPPING FORM

### 1. Tính năng hoàn thành:
1. **RankBadge Màu Sắc**:
   - 🥉 Đại Sứ: Màu Đồng (#CD7F32 / bg #fef3c7 / border #d97706)
   - 🥈 Quản Lý: Màu Bạc (#A8A9AD / bg #f3f4f6 / border #9ca3af)
   - 🥇 Giám Đốc: Màu Vàng Kim (#FFD700 / bg #fffbeb / border #f59e0b)
2. **Avatar Upload cho CTV**:
   - Thêm cột \vatarUrl TEXT\ vào bảng User qua SQLite ALTER TABLE & Prisma schema.
   - Thêm API \POST /api/users/me/avatar\ & \DELETE /api/users/me/avatar\ (multer + sharp, convert webp 300x300, lưu tại \/public/uploads/avatars/\).
   - Cập nhật \SettingsView.jsx\ có UI tải ảnh, icon Camera, nút xóa ảnh (chỉ tài khoản \isSystemParticipant\ mới thấy).
3. **Form Đặt Hàng - Thông Tin Giao Hàng**:
   - Thêm các cột: \shippingAddress\, \ecipientPhone\, \ecipientEmail\, \contactHotline\ vào bảng \Order\.
   - Cập nhật \CreateOrderModal.jsx\ và API \POST /api/orders\ tiếp nhận & validate thông tin giao hàng (SĐT & Địa chỉ bắt buộc).

### 2. Kiểm thử tự động (Browser UAT):
- Đã chạy Puppeteer headless browser trực tiếp trên VPS, đăng nhập tài khoản CTV thật, chụp ảnh xác thực toàn bộ luồng:
  - Menu \THÊM ▾\ -> \Thông Tin Tài Khoản\ (hiển thị Avatar Upload + Badge Giám Đốc vàng).
  - Tab \ĐƠN HÀNG\ -> \+ Tạo Đơn\ -> Chọn sản phẩm -> Hiển thị khối \THÔNG TIN GIAO HÀNG\ với đầy đủ các trường nhập liệu.

### 3. Cập nhật Sơ Đồ Tuyến Dưới (17/09 Tối):
- Đổi tiêu đề banner: **SƠ ĐỒ TUYẾN DƯỚI** (gọn gàng, loại bỏ subtitle cũ).
- Cập nhật màu sắc cấp bậc trong sơ đồ cây (\TreeNode.jsx\):
  - 🥇 **Giám Đốc**: Icon 🥇, viền trái vàng cam (#f59e0b), nền vàng nhạt (#fffbeb), text vàng kim (#78350f).
  - 🥈 **Quản Lý**: Icon 🥈, viền trái xám bạc (#9ca3af), nền bạc (#f3f4f6), text xám bạc (#374151).
  - 🥉 **Đại Sứ**: Icon 🥉, viền trái đồng (#d97706), nền đồng nhạt (#fef3c7), text đồng (#92400e).
- Build production & reload PM2 thành công (commit \df3d127\).

### 4. Giao diện Mobile Sơ Đồ Tuyến Dưới (17/09 Tối):
- **Vấn đề**: Trên màn hình điện thoại (mobile), sơ đồ cây phân nhánh ngang bị tràn màn hình, khó xem.
- **Giải pháp triển khai**:
  - Tạo component \HierarchyListView.jsx\ hiển thị dạng **Danh Sách Dọc (Accordion)**:
    - Thẻ tóm tắt: Tổng thành viên toàn nhóm + Doanh số nhóm.
    - Thanh tìm kiếm đối tác theo tên/mã WK/ID nhanh chóng.
    - Phân cấp thụt lề theo tầng, viền màu chuẩn cấp bậc (Vàng/Bạc/Đồng), mở/thu gọn tuyến dưới mượt mà.
  - Tích hợp bộ chuyển đổi chế độ xem kép trong \NetworkView.jsx\:
    - \📱 Danh Sách Gọn\: Tối ưu mặc định cho Mobile, không cần cuộn ngang.
    - \🌳 Sơ Đồ Cây\: Dạng đồ họa cây phân nhánh cho Desktop (hoặc người dùng mobile muốn xem toàn cảnh).
  - Tự động nhận diện thiết bị (\window.innerWidth < 768\) để chọn chế độ phù hợp nhất.
- **Kiểm thử thực tế (Puppeteer headless)**:
  - Test trên Mobile viewport (390x844): \/tmp/mobile_view1_list.png\ & \/tmp/mobile_view2_tree.png\ PASSED.
  - Test trên Desktop viewport (1280x900): \/tmp/desktop_view_tree.png\ PASSED.
- Commit & push GitHub: \5479edc\.
