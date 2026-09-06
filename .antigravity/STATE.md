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
