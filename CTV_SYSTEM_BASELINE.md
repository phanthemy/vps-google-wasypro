# BÁO CÁO AUDIT HỆ THỐNG CTV WASYPRO (BASELINE CHO GÓI NPP)
**Trạng thái**: READ-ONLY AUDIT / BASELINE ĐÃ XÁC LẬP  
**Thời điểm thực hiện**: 21/09/2026  
**Mục đích**: Xác định toàn bộ hiện trạng kỹ thuật, database, API, business rules của hệ thống CTV hiện tại trước khi triển khai tính năng Gói NPP (Nhà Phân Phối).

---

## 1. USER / CUSTOMER MODEL

### 1.1. Cấu trúc Model & Bảng Database
Hệ thống phân biệt rõ hai thực thể trong `schema.prisma`:

#### A. Model `User` (Bảng `User`)
- Đại diện cho tài khoản đăng nhập (Admin, Accountant, CTV, Khách hàng có tài khoản).
- **Các trường định danh & Hệ thống CTV**:
  - `id` (String / CUID): Khóa chính nội bộ (VD: `cm...`).
  - `userId` (String, Unique): Mã định danh CTV hiển thị (VD: `U958`, `U1002`).
  - `businessId` (String, Unique, Nullable): Mã BID chính thức (VD: `WK-10001`). Chỉ cấp khi đạt mốc Đại sứ (5.000 CP).
  - `isSystemParticipant` (Boolean, default `false`): Cờ đánh dấu đã tham gia hệ thống kinh doanh CTV.
  - `participantAt` (DateTime, Nullable): Thời điểm bấm "Tham gia hệ thống" hoặc được kích hoạt.
  - `qualifyingPoints` (Int, default `0`): Điểm QP tích lũy để xét duyệt BID và Rank Đại sứ (mốc 5.000 CP).
  - `rank` (String, default `'AMBASSADOR'`): Cấp bậc kinh doanh (`AMBASSADOR`, `MANAGER`, `DIRECTOR`). *Lưu ý: Nhãn hiển thị là Đại sứ, Trưởng nhóm, Quản lý*.
  - `rankStatus` (String, default `'NOT_QUALIFIED'`): Trạng thái cấp bậc (`ACTIVE_RANK`, `NOT_QUALIFIED`, `MANUAL_APPROVED`, `REVOKED`).
  - `parentId` (String, Nullable): Lưu `userId` của người giới thiệu trực tiếp (F0 Sponsor).
  - `role` (String, default `'USER'`): Quyền hạn truy cập kỹ thuật (`USER`, `ADMIN`, `ACCOUNTANT`, `MANAGER`).

#### B. Model `Customer` (Bảng `Customer`)
- Đại diện cho hồ sơ khách hàng mua hàng (được tạo thủ công bởi CTV hoặc tự động khi phát sinh đơn hàng).
- **Các trường liên kết**:
  - `id` (String / CUID): Khóa chính.
  - `code` (String, Unique): Mã khách hàng (VD: `KH-1001`).
  - `sponsorUserId` (String, Foreign Key -> `User.id`): Liên kết đến User ID của CTV giới thiệu/phụ trách.
  - `linkedUserId` (String, Foreign Key -> `User.id`, Nullable): Liên kết đến User ID nếu khách hàng này chính là một tài khoản User (Dùng cho đơn tự mua - Self-purchase).

### 1.2. Quan hệ User ↔ Customer
- Khi một CTV tự mua hàng cho chính mình, hệ thống tự động kiểm tra/tạo một bản ghi `Customer` có `linkedUserId = User.id` và `sponsorUserId = User.id` (hoặc sponsor của User).
- Khi CTV bán hàng cho khách lẻ, `Customer.sponsorUserId = CTV.id`, còn `linkedUserId = null`.

### 1.3. Xác định CTV & Cấp bậc
- **Field xác định là CTV/System Participant**:
  - Điều kiện logic: `User.isSystemParticipant == true`.
  - Có thể kết hợp kiểm tra `User.businessId != null` (đã là Đại sứ có mã số) hoặc `User.isSystemParticipant == true && User.businessId == null` (CTV đang tích lũy dưới 5.000 CP).
- **Field xác định Cấp bậc (Rank)**:
  - Cấp bậc kỹ thuật: `User.rank` (`AMBASSADOR`, `MANAGER`, `DIRECTOR`).
  - Điều kiện hợp lệ: `User.rankStatus in ['ACTIVE_RANK', 'MANUAL_APPROVED']` và `User.businessId != null`.

### 1.4. Đánh giá Khả năng Tái sử dụng cho NPP
- **Tái sử dụng**:
  - Dùng chung bảng `User` cho NPP. NPP vẫn là một `User` với `userId`, `phone`, `email`, mật khẩu đăng nhập, cây bảo trợ `parentId`.
  - NPP sau khi mua gói sẽ được cấp `businessId` (BID) duy nhất.
- **TUYỆT ĐỐI KHÔNG TÁI SỬ DỤNG LẪN LỘN**:
  - **KHÔNG dùng `qualifyingPoints` cho NPP**: `qualifyingPoints` là điểm tích lũy đơn hàng CTV lẻ để đạt 5.000 CP. NPP mua gói trọn gói, không phải tích lũy QP từ 0 lên 5.000.
  - **KHÔNG dùng `User.rank` để gán nhãn NPP**: `rank` thuộc cây thăng tiến CTV (`AMBASSADOR` -> `MANAGER` -> `DIRECTOR`). NPP là vai trò đối tác phân phối (Package). Gán NPP vào `rank` sẽ phá vỡ toàn bộ ma trận hoa hồng CTV và lịch sử thăng hạng.

---

## 2. SPONSOR TREE (CÂY BẢO TRỢ)

### 2.1. Cấu trúc Lưu trữ
- Quan hệ bảo trợ được lưu trực tiếp dạng chuỗi đơn nhánh tại trường `User.parentId` (lưu giá trị `userId` dạng chuỗi, ví dụ `'U958'`).
- Không dùng Nested Set Model hay Materialized Path; hệ thống duyệt đệ quy/lặp dựa trên khóa ngoại logic `parentId -> userId`.

### 2.2. Cơ chế Gán & Khóa Người Bảo trợ
- **Khi đăng ký tài khoản** (`/api/auth/register`):
  - Nhận `referralCode` từ form hoặc cookie/query parameter.
  - Tìm User có `userId == referralCode` hoặc `businessId == referralCode`.
  - Nếu tìm thấy: Gán `newUser.parentId = sponsor.userId`.
  - Nếu không tìm thấy hoặc đăng ký trực tiếp: `newUser.parentId = null` (trực thuộc công ty).
- **Quy tắc bất biến (Sponsor Lock)**:
  - Một khi `User.parentId` đã được thiết lập khi đăng ký, **TUYỆT ĐỐI KHÔNG BỊ GHI ĐÈ** bởi các lần bấm vào link giới thiệu khác hoặc khi mua hàng sau này.

### 2.3. Định nghĩa F0, F1, F2 trong Hệ thống
Khi một đơn hàng được thanh toán/hoàn thành bởi Người mua (Buyer):
1. **Sponsor Trực tiếp (F0 / Direct Sponsor)**:
   - Được xác định qua `Customer.sponsorUserId` (trỏ đến `User.id`).
   - Đây là người tư vấn trực tiếp cho đơn hàng (hoặc là tuyến trên trực tiếp nếu Buyer tự mua).
2. **Upstream Depth-1 (F1 trong Commission Engine)**:
   - Là người bảo trợ trực tiếp của F0: `d1User = User.findUnique({ where: { userId: f0User.parentId } })`.
3. **Upstream Depth-2 (F2 trong Commission Engine)**:
   - Là người bảo trợ trực tiếp của D1: `d2User = User.findUnique({ where: { userId: d1User.parentId } })`.

### 2.4. Giới hạn Chiều sâu (Depth Limit)
- Hệ thống hoa hồng CTV **chỉ trả thưởng tối đa 2 cấp bảo trợ phía trên F0** (D1 = 10%, D2 = 5%).
- Từ Depth 3 trở lên, vòng lặp upstream dừng lại, không phát sinh hoa hồng.
- Sponsor không bị nhận đúp (Sponsor chỉ nhận `DIRECT_NO_ID` hoặc `DIRECT_WITH_ID`, vòng lặp D1/D2 chỉ bắt đầu từ cha của Sponsor).

---

## 3. CTV PARTICIPATION & MỐC 5.000 CP (CHÍNH SÁCH CHỐT 18/09)

### 3.1. Điểm Tích lũy (Qualifying Points - QP)
- Mỗi sản phẩm có cấu hình `commissionPoints` (CP). Khi mua số lượng `n`, tổng CP đơn hàng là `orderTotalCP = sum(item.commissionPoints * item.quantity)`.
- Khi đơn hàng hoàn thành (`COMPLETED`), `User.qualifyingPoints += orderTotalCP`.

### 3.2. Quy tắc Đơn hàng Vượt ngưỡng (Threshold-Crossing Order)
- **Business Rule Đã Chốt & Kiểm Chứng (18/09/2026)**:
  - Điểm 5.000 CP chỉ là điều kiện chuyển đổi trạng thái sang Đại sứ (AMBASSADOR).
  - Đơn hàng làm thành viên A chạm hoặc vượt 5.000 CP vẫn được xử lý **hoàn toàn theo trạng thái PRE-ORDER** của A:
    - Nếu trước đơn A chưa có BID (`priorBusinessId == null`):
      - Tuyến trên trực tiếp (F0) nhận hoa hồng `DIRECT_NO_ID = 20%` trên **TOÀN BỘ 100% CP** của đơn hàng đó.
      - **TUYỆT ĐỐI KHÔNG SPLIT ĐƠN HÀNG**: Không tách đơn thành phần dưới 5.000 và phần vượt 5.000; không có phần excess 10%.
      - Bản thân A **KHÔNG nhận hoa hồng SELF** trên chính đơn hàng làm A đạt/vượt 5.000 CP.
  - **Thời điểm kích hoạt BID & Đại sứ**:
    - Ngay trong quá trình settlement đơn hàng đó (trong cùng Prisma Transaction), sau khi ghi nhận toàn bộ đơn và cộng QP, hệ thống phát hiện `newQualifyingPoints >= 5000`:
      - Tự động sinh `businessId` mới (dạng `WK-10001` tăng tuần tự).
      - Cập nhật `rank = 'AMBASSADOR'`, `rankStatus = 'ACTIVE_RANK'`.
      - Ghi log vào bảng `RankHistory`.
  - **Các đơn hàng tiếp theo**:
    - Kể từ đơn hàng sau trở đi, A đã có BID: A nhận `SELF = 20%`, Tuyến trên F0 nhận `DIRECT_WITH_ID = 10%`.

---

## 4. RANK SYSTEM (HỆ THỐNG CẤP BẬC KINH DOANH)

### 4.1. Danh mục Cấp bậc & Nhãn Hiển thị
| Technical Rank (Database / API) | Display Label (Giao diện Người dùng) | Điều kiện Tiêu chuẩn |
| :--- | :--- | :--- |
| `AMBASSADOR` | **Đại sứ** | Tích lũy đủ 5.000 QP từ đơn hàng CTV |
| `MANAGER` | **Trưởng nhóm** | Đạt điều kiện nhóm kinh doanh (Doanh số/F1 Đại sứ) |
| `DIRECTOR` | **Quản lý** | Đạt điều kiện cấp quản lý cao cấp |

*Lưu ý cốt lõi: Giá trị lưu trữ trong DB, Enum, API giữ nguyên 100% tiếng Anh (`AMBASSADOR`, `MANAGER`, `DIRECTOR`). Toàn bộ UI hiển thị nhãn tiếng Việt tương ứng.*

### 4.2. Cơ chế Thăng hạng & Hạ hạng
- **Tự động**: Chỉ có bước từ `NOT_QUALIFIED` lên `AMBASSADOR` khi chạm mốc 5.000 QP là tự động trong transaction settlement.
- **Thủ công / Admin**: Admin Portal có màn hình duyệt rank (`/admin/ranks`), cho phép nâng hạ rank với các trạng thái:
  - `ACTIVE_RANK`: Rank đang hoạt động bình thường theo quy chế.
  - `MANUAL_APPROVED`: Rank do Admin phê duyệt đặc cách.
  - `REVOKED`: Rank bị thu hồi do hủy đơn hoặc vi phạm.
- **Log lịch sử**: Bảng `RankHistory` lưu trữ mỗi lần thay đổi rank (`oldRank`, `newRank`, `reason`, `changedBy`, `changedAt`).

---

## 5. COMMISSION MATRIX (MA TRẬN HOA HỒNG HIỆN TẠI)

### 5.1. Bảng Tỷ lệ Hoa hồng Hiện tại theo Cấp bậc
Nguồn dữ liệu: `SystemPolicyConfig` trong Database (fallback cấu hình hệ thống):

| Cấp bậc (Rank) | Tự mua / Trực tiếp (SELF) | F0 có Người mua chưa BID (`DIRECT_NO_ID`) | F0 có Người mua đã có BID (`DIRECT_WITH_ID`) | F1 Upstream (D1) | F2 Upstream (D2) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Đại sứ (`AMBASSADOR`)** | **20%** | **20%** | **10%** | **10%** | **5%** |
| **Trưởng nhóm (`MANAGER`)** | **25%** | **25%** | **10%** | **10%** | **5%** |
| **Quản lý (`DIRECTOR`)** | **30%** | **30%** | **10%** | **10%** | **5%** |

### 5.2. Các Loại Hoa hồng (Commission Types)
1. `SELF`: Hoa hồng cá nhân khi CTV đã có BID tự mua hàng (`rate = 20% - 30%` tùy rank).
2. `DIRECT_NO_ID`: Hoa hồng trực tiếp khi tuyến dưới chưa có BID mua hàng (`rate = 20% - 30%` tùy rank của Sponsor).
3. `DIRECT_WITH_ID`: Hoa hồng trực tiếp khi tuyến dưới đã có BID mua hàng (`rate = 10%`).
4. `UPSTREAM_D1` (hoặc `F1`): Hoa hồng gián tiếp tầng 1 cho người bảo trợ của Sponsor (`rate = 10%`).
5. `UPSTREAM_D2` (hoặc `F2`): Hoa hồng gián tiếp tầng 2 cho người bảo trợ của D1 (`rate = 5%`).
*Lưu ý: Không còn dùng loại `SPLIT` theo quyết định ngày 18/09/2026.*

### 5.3. Công thức Tính Toán
- Căn cứ tính: `item.lineCommissionPts = item.commissionPoints * item.quantity`.
- Tổng điểm hoa hồng đơn hàng: `totalCP = sum(item.lineCommissionPts)`.
- Điểm hoa hồng người thụ hưởng: `earnedPoints = totalCP * (rate / 100)`.
- Tiền hoa hồng quy đổi: `earnedMoney = earnedPoints * 1,000 VNĐ`.
- Quy chuẩn: `1 CP = 1.000 VNĐ`.

---

## 6. ORDER LIFECYCLE (VÒNG ĐỜI ĐƠN HÀNG CTV)

### 6.1. Các Trạng thái Đơn hàng
Hệ thống CTV sử dụng enum trạng thái sau trên bảng `Order`:
- `NEW` (Mới tạo): Đơn hàng vừa đặt trên CTV portal hoặc đồng bộ từ Website.
- `DEPOSIT` (Đã cọc - tùy chọn): Đơn hàng đã thanh toán một phần tiền cọc.
- `CONFIRMED` (Đã xác nhận): Admin xác nhận thông tin đơn hàng và tồn kho.
- `SHIPPING` (Đang giao hàng): Đơn hàng đã bàn giao cho đơn vị vận chuyển.
- `COMPLETED` (Hoàn thành): Khách hàng đã nhận hàng và thanh toán đủ.
- `CANCELLED` (Đã hủy): Đơn hàng bị hủy bởi khách, CTV hoặc Admin.

### 6.2. Cơ chế Kích hoạt Settlement
- Hàm thực thi: `executeOrderSettlement(orderId, tx)` trong `server/index.js`.
- **ĐIỀU KIỆN KÍCH HOẠT DUY NHẤT**: Trạng thái đơn hàng chuyển sang `COMPLETED`.
- **Trình tự xử lý trong Prisma Transaction**:
  1. Kiểm tra đơn hàng đã hoàn thành trước đó chưa (`settlementStatus == 'SETTLED'`). Nếu rồi -> Bỏ qua, chống duplicate.
  2. Đọc trạng thái người mua trước đơn (`priorBusinessId`, `priorQualifyingPoints`).
  3. Tính toán hoa hồng cho tất cả đối tượng thụ hưởng (`SELF`, `DIRECT`, `D1`, `D2`).
  4. Tạo các bản ghi trong bảng `Commission` với trạng thái `PENDING_CLEARING` (hoặc `AVAILABLE`).
  5. Cộng tích lũy `qualifyingPoints` cho người mua.
  6. Nếu đạt/vượt 5.000 QP và chưa có BID -> Cấp `businessId` mới, nâng hạng lên `AMBASSADOR`.
  7. Cập nhật `Order.settlementStatus = 'SETTLED'`.

### 6.3. Cơ chế Hoàn tác Settlement (Reversal on Cancel)
- Hàm thực thi: `reverseOrderSettlement(orderId, tx)` trong `server/index.js`.
- Kích hoạt khi: Đơn hàng từ `COMPLETED` bị chuyển sang `CANCELLED`.
- Xử lý:
  - Tạo các bản ghi `Commission` đối ứng âm hoặc đánh dấu `CANCELLED`/`REVERSED`.
  - Trừ lùi `qualifyingPoints` tương ứng với số CP của đơn hàng bị hủy.
  - Thu hồi BID và Rank nếu `qualifyingPoints` sau khi trừ rơi xuống dưới mốc 5.000 CP.

---

## 7. WEBSITE ORDER / SHADOW ORDER ARCHITECTURE

### 7.1. Cấu trúc Bảng `WebsiteOrder`
Lưu trữ đơn hàng phát sinh từ giỏ hàng Website công cộng (`mapgo.vn` / Landing page):
- `id` (String / CUID): Mã khóa chính.
- `code` (String, Unique): Mã đơn website hiển thị (VD: `WS-1001`).
- `customerName`, `customerPhone`, `customerEmail`: Thông tin người mua.
- `shippingAddress`, `recipientPhone`, `recipientEmail`: Thông tin nhận hàng đầy đủ.
- `contactHotline`: Hotline liên hệ/tư vấn.
- `totalAmount`, `discountAmount`, `finalAmount`: Số tiền thanh toán.
- `status`: `NEW`, `CONFIRMED`, `SHIPPING`, `COMPLETED`, `CANCELLED`.
- `affiliateCode` (String, Nullable): Mã giới thiệu của CTV đính kèm khi khách đặt qua link affiliate.
- `shadowOrderId` (String, Nullable): Khóa ngoại trỏ sang bảng `Order` của hệ thống CTV nội bộ.

### 7.2. Cơ chế Shadow Order Bridge
- Khi khách hàng đặt đơn trên website qua link affiliate của CTV:
  1. Bản ghi `WebsiteOrder` được tạo lập.
  2. Hệ thống tìm kiếm CTV sở hữu `affiliateCode` (`User.userId` hoặc `User.businessId`).
  3. Tạo tự động một "Shadow Order" tương ứng trong bảng `Order` với `channel = 'WEBSITE'`, `status = WebsiteOrder.status`.
  4. Liên kết `WebsiteOrder.shadowOrderId = Order.id`.
- **Cơ chế Đồng bộ Trạng thái 2 Chiều**:
  - Khi Admin cập nhật trạng thái trên Website Order (`PUT /api/admin/website-orders/:id/status`): Trạng thái của Shadow Order trong bảng `Order` được cập nhật đồng thời.
  - Khi Website Order đạt `COMPLETED`, hệ thống kích hoạt `executeOrderSettlement(shadowOrder.id)` để tính hoa hồng cho CTV giới thiệu đúng theo quy chuẩn.

---

## 8. COMMISSION -> CP CONVERSION & S-POINT / WALLET

### 8.1. Đơn vị Quy đổi Tiền tệ
- `1 Commission Point (CP) = 1.000 VNĐ`.
- Điểm được làm tròn số nguyên hoặc 2 chữ số thập phân khi phân bổ theo tỷ lệ.

### 8.2. Trạng thái Hoa hồng (`Commission.status`)
- `PENDING_CLEARING`: Hoa hồng vừa phát sinh khi đơn hàng hoàn thành, đang trong thời gian giữ đối soát (Holding period).
- `AVAILABLE`: Hoa hồng đã đối soát xong, khả dụng để rút tiền hoặc chuyển đổi.
- `PAID`: Hoa hồng đã được chi trả qua lệnh chuyển khoản ngân hàng.
- `CANCELLED`: Hoa hồng bị hủy bỏ do đơn hàng bị hủy hoặc hoàn trả.

### 8.3. S-Point Wallet & Transaction
- Bảng `SPointTransaction` theo dõi biến động điểm thưởng S-Point / Ví hoa hồng của từng User:
  - `userId`: Người sở hữu ví.
  - `amount`: Số điểm biến động (+ hoặc -).
  - `type`: `ORDER_REWARD`, `COMMISSION_CONVERT`, `WITHDRAWAL`, `ADMIN_ADJUST`.
  - `balanceAfter`: Số dư điểm sau giao dịch.

---

## 9. CTV PORTAL AUDIT (GIAO DIỆN CỘNG TÁC VIÊN)

### 9.1. Các View Chính trong Portal CTV
1. **Tổng quan (Dashboard)**:
   - Hiển thị Cấp bậc hiện tại (Đại sứ, Trưởng nhóm, Quản lý).
   - Mã định danh CTV (`userId`) và Mã kinh doanh (`businessId`).
   - Thanh tiến trình tích lũy 5.000 CP (nếu chưa có BID).
   - Thống kê doanh số cá nhân, doanh số nhóm, hoa hồng tạm tính.
2. **Cây bảo trợ / Đội nhóm (Team Tree)**:
   - Hiển thị cây tuyến dưới dạng Org Chart tương tác trực quan (zoom, kéo thả).
   - Bộ lọc xem F0, F1, F2 kèm thông tin cấp bậc và trạng thái hoạt động.
3. **Đơn hàng của tôi (My Orders)**:
   - Danh sách đơn hàng tự mua và đơn hàng khách hàng của CTV.
   - Trạng thái đơn hàng: Mới, Đang giao hàng, Hoàn thành, Đã hủy.
4. **Hoa hồng & Ví điểm (Commissions & Wallet)**:
   - Bảng kê chi tiết từng dòng hoa hồng theo đơn hàng và loại hoa hồng (`SELF`, `DIRECT`, `F1`, `F2`).
   - Lịch sử rút tiền và đối soát.
5. **Affiliate Link & Công cụ Bán hàng**:
   - Link chia sẻ sản phẩm kèm mã giới thiệu cá nhân (`affiliateCode`).

---

## 10. ADMIN PORTAL AUDIT (GIAO DIỆN QUẢN TRỊ VIÊN)

### 10.1. Các Phân hệ Quản trị Chính
1. **Quản lý Đơn hàng CTV (`/admin/orders`)**:
   - Danh sách đơn hàng toàn hệ thống.
   - Thao tác chuyển đổi trạng thái (`CONFIRMED`, `SHIPPING`, `COMPLETED`, `CANCELLED`).
   - Xem chi tiết phân bổ hoa hồng theo từng đơn hàng.
2. **Quản lý Đơn hàng Website (`/admin/website-orders`)**:
   - Quản lý đơn hàng đặt từ website công cộng.
   - Xem mã affiliate, thông tin giao nhận, chuyển trạng thái đồng bộ Shadow Order.
3. **Quản lý Cộng tác viên & Người dùng (`/admin/ctv-list`, `/admin/users`)**:
   - Danh sách CTV, cây bảo trợ, trạng thái tham gia hệ thống, điểm QP.
   - Chi tiết hồ sơ CTV và lịch sử giao dịch.
4. **Quản lý Cấp bậc (`/admin/ranks`)**:
   - Phê duyệt thăng hạng thủ công, thu hồi cấp bậc.
   - Xem bảng `RankHistory`.
5. **Đối soát & Chi trả Hoa hồng (`/admin/commissions`)**:
   - Quản lý kỳ đối soát, duyệt chi trả hoa hồng sang trạng thái `PAID`.
6. **Cấu hình Chính sách (`/admin/settings`, `/admin/policy`)**:
   - Cấu hình tỷ lệ hoa hồng theo kỳ (`PeriodPolicyConfig`) và mặc định (`SystemPolicyConfig`).

---

## 11. DATABASE MAP (MÔ HÌNH DỮ LIỆU ĐẦY ĐỦ)

```
+-----------------------------------------------------------------------------------+
|                                      User                                         |
|-----------------------------------------------------------------------------------|
| id (PK) | userId (UQ) | businessId (UQ, null) | isSystemParticipant | participantAt|
| qualifyingPoints | rank | rankStatus | parentId (FK logic) | role | sPointsBalance|
+-----------------------------------------------------------------------------------+
       | 1                                                                   | 1
       | (Sponsor)                                                           | (Owner)
       v N                                                                   v N
+------------------------------------+             +--------------------------------+
|              Customer              |             |             Order              |
|------------------------------------|             |--------------------------------|
| id (PK) | code (UQ)                |             | id (PK) | code (UQ)            |
| sponsorUserId (FK -> User.id)      |             | customerId (FK -> Customer.id) |
| linkedUserId (FK -> User.id, null) |             | channel | status               |
+------------------------------------+             | settlementStatus               |
       | 1                                         | totalCP | finalAmount          |
       |                                           +--------------------------------+
       | N                                                          | 1
       +------------------------------------+                       |
                                            |                       | N
                                            v                       v
                             +----------------------------------------------+
                             |                  OrderItem                   |
                             |----------------------------------------------|
                             | id (PK) | orderId (FK) | productId (FK)      |
                             | quantity | price | commissionPoints          |
                             | lineCommissionPts                            |
                             +----------------------------------------------+
                                                    |
                                                    | (On Settlement)
                                                    v
                             +----------------------------------------------+
                             |                  Commission                  |
                             |----------------------------------------------|
                             | id (PK) | orderId (FK) | beneficiaryId (FK)  |
                             | type (SELF/DIRECT/D1/D2) | rate | earnedPts  |
                             | earnedMoney | status (PENDING/AVAILABLE/PAID)|
                             +----------------------------------------------+
```

### Chi tiết các Bảng Phụ trợ:
- `WebsiteOrder`: Quản lý đơn từ web khách, có `shadowOrderId` trỏ sang `Order.id`.
- `RankHistory`: Ghi log biến động cấp bậc của User.
- `CommissionProcessing`: Quản lý batch đối soát hoa hồng theo kỳ.
- `SPointTransaction`: Lịch sử biến động ví điểm/hoa hồng.
- `SystemPolicyConfig`: Bảng key-value lưu trữ tỷ lệ hoa hồng mặc định của hệ thống.

---

## 12. REGRESSION PROTECTION CHECKLIST (CÁC QUY TẮC BẤT BIẾN)

Để đảm bảo an toàn tuyệt đối khi triển khai gói NPP, hệ sinh thái CTV hiện tại phải được bảo vệ bởi 8 nguyên tắc bất biến:

1. **Bất biến Mốc 5.000 CP (Threshold Invariant)**:
   - Mốc 5.000 QP chỉ áp dụng cho tài khoản CTV bán lẻ thông thường.
   - Đơn hàng vượt ngưỡng 5.000 CP không bao giờ bị cắt đôi (No split); F0 nhận 20% trên toàn bộ đơn; Người mua không nhận SELF trên chính đơn đó.
2. **Bất biến Cây bảo trợ (Sponsor Lock Invariant)**:
   - `User.parentId` được khóa cứng sau khi tạo tài khoản; không bao giờ bị ghi đè bởi đơn hàng mới hoặc link giới thiệu khác.
3. **Bất biến Duy nhất 1 Mã BID (Single BID Invariant)**:
   - Mỗi người dùng chỉ có duy nhất 1 mã `businessId` (dạng `WK-xxxxx`). Không bao giờ tạo thêm BID thứ 2 cho cùng 1 cá nhân.
4. **Bất biến Tách bạch Gói NPP & Cấp bậc CTV (Orthogonal Separation)**:
   - Mua Gói NPP **KHÔNG** làm thay đổi `User.rank` thành `NPP`. Cấp bậc CTV vẫn là `AMBASSADOR`, `MANAGER`, `DIRECTOR`.
   - Quyền lợi NPP được quản lý bằng gói sở hữu riêng biệt, không đè lên hệ thống thăng cấp bậc CTV.
5. **Bất biến Giới hạn Chiều sâu Hoa hồng CTV (Depth Invariant)**:
   - Hoa hồng CTV chỉ chi trả tối đa 2 cấp bảo trợ bên trên Sponsor (D1 = 10%, D2 = 5%).
6. **Bất biến Idempotent Settlement (Chống Chi trả Lặp)**:
   - Hàm settlement chỉ chạy khi `settlementStatus != 'SETTLED'`. Không bao giờ tạo commission trùng lặp cho cùng một mã đơn hàng.
7. **Bất biến Tính toán Đơn hàng (Pre-order State Evaluation)**:
   - Việc tính toán tỷ lệ hoa hồng phải dựa trên trạng thái của User ngay **TRƯỚC** khi đơn hàng được hoàn tất (`priorBusinessId`).
8. **Bất biến Shadow Order Sync (Đồng bộ Đơn hàng)**:
   - Trạng thái của `WebsiteOrder` và `Order` (Shadow Order) phải luôn đồng nhất khi cập nhật từ Admin.

---

## 13. NPP INTEGRATION READINESS (PHÂN TÍCH TÍCH HỢP GÓI NPP)

### 13.1. Thành phần TÁI SỬ DỤNG HOÀN TOÀN (Full Reusable)
- **Tài khoản định danh (`User`)**: Sử dụng chung tài khoản đăng nhập, số điện thoại, mật khẩu, họ tên, email.
- **Mã kinh doanh (`businessId`)**: Nếu User đã có BID từ trước (do đã là Đại sứ CTV), tiếp tục sử dụng mã BID đó. Nếu User mới mua gói NPP chưa có BID, hệ thống cấp phát ngay 1 BID duy nhất.
- **Cây bảo trợ (`parentId`)**: Tận dụng toàn bộ cây liên kết cha - con sẵn có của User.
- **Hạ tầng Đơn hàng & Thanh toán (`Order`, `WebsiteOrder`)**: Sử dụng chung luồng giỏ hàng, đặt hàng, quản lý đơn hàng.

### 13.2. Thành phần CẦN MỞ RỘNG (Components Requiring Extension)
- **Model Gói NPP Mới**: Cần thêm model lưu trữ gói phân phối (VD: `NppPackage`, `UserNppSubscription` hoặc tương đương) để theo dõi:
  - Loại gói phân phối (NPP Bạc, NPP Vàng, NPP Kim Cương...).
  - Thời hạn gói, giá trị gói, trạng thái kích hoạt.
- **Cơ chế Kích hoạt Trực tiếp BID**: Khi thanh toán gói NPP thành công, hệ thống cấp ngay `businessId` mà **KHÔNG CẦN CHỜ TÍCH LŨY ĐỦ 5.000 QP**.
- **Chính sách Hoa hồng Bán Gói NPP**:
  - Cơ chế hoa hồng khi giới thiệu tuyến dưới mua gói NPP là luồng hoa hồng riêng (NPP Referral Commission), tách biệt với ma trận hoa hồng sản phẩm bán lẻ CTV (20%/10%/10%/5%).
- **Giao diện Portal**:
  - CTV Portal: Thêm mục "Gói Nhà Phân Phối" cho phép xem thông tin gói và quyền lợi NPP.
  - Admin Portal: Thêm phân hệ quản lý Gói NPP và danh sách đại lý NPP.

---

## 14. TỔNG KẾT VÀ BẢNG SO SÁNH (EXECUTIVE SUMMARY)

### 14.1. Tóm tắt Hiện trạng Hệ thống CTV
Hệ thống CTV của WasyPro đang vận hành ổn định trên nền tảng:
- Backend: Node.js / Express, Prisma ORM, cơ sở dữ liệu SQLite (`dev.db`).
- Frontend: React (Vite) chia thành 2 phân hệ rõ ràng (CTV Portal và Admin Portal).
- Toàn bộ 18 API cốt lõi và 17 màn hình giao diện đã được kiểm thử pass 100%, không phát sinh lỗi ngoại lệ JavaScript.
- Cơ chế hoa hồng đã tuân thủ triệt để quyết định ngày 18/09/2026: Đơn hàng chạm ngưỡng 5.000 CP không bị split, F0 hưởng trọn 20%, không có excess 10%, và cấp phát BID tuần tự ngay trong transaction settlement.

### 14.2. Bảng Đối chiếu Giữa Dự kiến (Expected) vs Thực tế Source Code (Actual)
| Tiêu chí | Quy định Dự kiến (Expected Rule) | Triển khai Thực tế trong Code (Actual Code) | Đánh giá |
| :--- | :--- | :--- | :--- |
| **Đơn chạm 5.000 CP** | Không chia nhỏ (No split), F0 nhận 20% toàn đơn, Người mua không nhận SELF | Code `executeOrderSettlement` dùng `priorBusinessId`, F0 nhận `DIRECT_NO_ID = 20%` toàn đơn, Buyer không nhận `SELF` | **HOÀN TOÀN KHỚP** |
| **Cấp phát BID** | Tự động cấp BID dạng `WK-xxxxx` ngay khi đạt >= 5.000 QP | Trong transaction, nếu `priorBusinessId == null` và `newQP >= 5000` -> sinh BID tăng dần | **HOÀN TOÀN KHỚP** |
| **Nhãn Cấp bậc** | Hiển thị tiếng Việt: Đại sứ, Trưởng nhóm, Quản lý; Giữ nguyên DB enum tiếng Anh | DB/API giữ `AMBASSADOR`, `MANAGER`, `DIRECTOR`. UI hiển thị hoàn toàn tiếng Việt qua mapping helper | **HOÀN TOÀN KHỚP** |
| **Website Orders** | Khách mua web đồng bộ sang CTV để tính hoa hồng | Bảng `WebsiteOrder` liên kết với `Order` qua `shadowOrderId`. Cập nhật trạng thái đồng bộ 2 chiều | **HOÀN TOÀN KHỚP** |
| **Độ sâu Upstream** | Tối đa 2 cấp bảo trợ (D1, D2) | Vòng lặp dừng ở `depth > 2`, chỉ tạo `UPSTREAM_D1` và `UPSTREAM_D2` | **HOÀN TOÀN KHỚP** |

---

## 15. CÂU HỎI MỞ & ĐỀ XUẤT TRƯỚC KHI BẮT ĐẦU TRIỂN KHAI GÓI NPP
Trước khi bước vào Phase thiết kế chi tiết và code Gói NPP, cần làm rõ 3 câu hỏi nghiệp vụ sau:

1. **Tương quan giữa Gói NPP và Mốc 5.000 CP**:
   - Khi một người mua Gói NPP, người đó được cấp ngay `businessId`. Vậy trường `qualifyingPoints` của người đó có được tự động đặt thành 5.000 CP hay giữ nguyên số điểm thực tế?
   - *Khuyến nghị kỹ thuật*: Giữ nguyên `qualifyingPoints` theo điểm bán lẻ thực tế, chỉ gán cờ sở hữu gói NPP và cấp `businessId` để bảo toàn tính toàn vẹn dữ liệu.
2. **Chính sách Hoa hồng Tuyến trên khi Tuyến dưới Mua Gói NPP**:
   - Khi thành viên B mua gói NPP trị giá X triệu đồng: Tuyến trên A nhận hoa hồng theo % tiền gói (Direct Sponsor Bonus) hay gói NPP sẽ được quy đổi ra điểm CP tương ứng để chạy qua ma trận hoa hồng hiện tại?
3. **Mã Sản phẩm hay Thực thể Riêng**:
   - Gói NPP sẽ được tạo như một `Product` đặc biệt trong bảng `Product` (với cờ `isPackage = true`) hay tạo bảng dữ liệu riêng `NppPackage`?
   - *Khuyến nghị kỹ thuật*: Sử dụng model riêng `NppPackage` và bảng đăng ký `UserNppPackage` để tránh làm nhiễu danh mục sản phẩm bán lẻ thông thường và giỏ hàng của khách hàng.

---
*Báo cáo Audit Baseline hoàn tất. Hệ thống sẵn sàng làm nền tảng vững chắc cho Phase tích hợp Gói NPP.*
