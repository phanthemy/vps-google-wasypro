# STATE.md -- WasyPro CTV Rebuild

_Cap nhat: 2026-09-06T22:32 +07:00_

## Commit hien tai

`e90a4cd` -- feat(ctv): ky hoa hong tren dashboard + CP column tren orders

## Da hoan thanh (session nay)

### DB Reset
- Backup: dev.db.backup_20260906_221600 (368KB)
- Xoa sach: Service, ServiceCategory, CommissionPeriod, SystemPolicyConfig, WholesaleOrder, PeriodPolicyConfig, CommissionPriceRule, AdminUser
- Reset CTV fields cho 11 users (giu admin/accountant)
- BusinessIdSequence reset ve 1000
- Giu nguyen: User(13), Customer(5), Product(10)

### Frontend
- CTVPortalContainer: restore Don Hang Si tab; them Thong Tin Tai Khoan tab; /api/services -> /api/products
- DashboardView: button THAM GIA HE THONG; ky hoa hong badge; Business ID badge
- CommissionHistoryView: bo hoan toan thue TNCN + showTaxes
- SettingsView: rewrite -> Thong Tin Tai Khoan (profile/rank/businessId/QP)
- OrderModal: serviceId -> productId in payload
- OrdersView: doi cot CTV Loi Nhuan -> CP (Qualifying Points)

### Backend
- CSRF whitelist: /api/users/me/join-system
- New route: GET /api/periods/current


### Policy Alignment & Red Badge Clearance (Fix hoàn tất)
- **DIRECTOR_F1**: 0.10 (10% - Upstream F1/D1 Boss chốt)
- **DIRECTOR_F2**: 0.05 (5% - Upstream F2/D2 Boss chốt)
- **MANAGER_F1_SELL_TO_CUSTOMER_NO_ID**: 0.05 (5% - chênh lệch cấp bậc Quản Lý 25% - Đại Sứ 20% khi F1 bán khách chưa ID)
- **POLICY_VERSION**: 1.3.0
- **Trạng thái Admin Cấu Hình Hoa Hồng**: 16/16 ACTIVE, 0 NOT_CONFIGURED. Xóa toàn bộ badge cảnh báo đỏ trên tất cả các tab (Đại Sứ Kinh Doanh, Quản Lý, Giám Đốc, Hệ Thống).
- **seed_phase2c.js**: Đồng bộ rate chuẩn, không revert NOT_CONFIGURED khi reset.


### Official Rank Promotion Rules (5 F1 Rule - Đã hoàn tất & Nghiệm thu 100%)
- **AMBASSADOR → MANAGER**:
  - Điều kiện: Đủ 5 thành viên F1 TRỰC TIẾP (`parentId`).
  - Cả 5 F1 đều: có Business ID (`businessId !== null`) VÀ đang ở rank `AMBASSADOR` (hoặc cao hơn).
  - Đủ 5 F1 trực tiếp → Tự động thăng cấp `MANAGER` và kích hoạt cascade upline.
- **MANAGER → DIRECTOR**:
  - Điều kiện: Đủ 5 thành viên F1 TRỰC TIẾP (`parentId`).
  - Cả 5 F1 đều: có Business ID (`businessId !== null`) VÀ đang ở rank `MANAGER` (hoặc cao hơn).
  - Đủ 5 F1 trực tiếp → Tự động thăng cấp `DIRECTOR`.
- **Ràng buộc chuẩn**:
  - Chỉ tính F1 trực tiếp trong sponsor tree.
  - Không tính F2/F3, không tính Customer chưa có Business ID.
  - Không thay bằng doanh số đội nhóm, không tự thêm điều kiện khác.
  - Tự động ghi nhận lịch sử thăng cấp vào bảng `RankHistory` (`reason: 'AUTO_5_F1_AMBASSADOR'`, `'AUTO_5_F1_MANAGER'`).
- **Endpoints mới**:
  - `GET /api/rank/promotion-progress/:userId` — Trả về tiến trình thăng cấp (x/5 F1, %, danh sách F1 đạt chuẩn).
  - `POST /api/rank/sync-all` — Quét và thăng cấp tự động toàn bộ user đạt chuẩn.
- **Frontend**:
  - `AmbassadorProgressCard.jsx` (cả trên `wasypro` và `wasypro-ctv`): Hiển thị tiến trình trực quan theo từng cấp bậc:
    * Khách hàng: Tích lũy 5.000 CP lên Đại Sứ.
    * Đại Sứ: x/5 F1 Đại Sứ (có Business ID) lên Quản Lý (kèm danh sách F1).
    * Quản Lý: x/5 F1 Quản Lý (có Business ID) lên Giám Đốc (kèm danh sách F1).
    * Giám Đốc: Badge vinh danh cấp bậc cao nhất 👑.

## Trang thai
- wasypro PM2 (port 5005): running
- happylife-backend PM2 (port 3011): running
- DB: sach, san sang test

## Viec tiep theo
- [ ] Admin tao ky hoa hong dau tien
- [ ] Test dang ky tai khoan moi
- [ ] Test THAM GIA HE THONG
- [ ] Test 5000 QP -> Business ID + Ambassador tu dong
- [ ] Test don hang -> commission -> CP
- [ ] PriceListView: doi sang /api/products
