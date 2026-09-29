# WasyPro — Memory Log

## Cập nhật: 2026-09-30

### Phiên 30/09/2026 (01:28 - 02:00)

#### Đã làm:
1. **NPP Combo chỉ hiện máy lọc nước** (Commit `71607ce`):
   - Frontend `UserNppDashboard.tsx`: Filter `title.match(/^Máy/)` → chỉ 5 máy lọc nước.
   - Backend `/api/npp/my-combo`: Query `categoryId IN ('cat-01','cat-02') AND title startsWith 'Máy'`.
   - Loại bỏ linh kiện/phụ kiện khỏi gói combo NPP.

2. **Fix F0 hiện sai trong Admin Tạo Đơn** (Commit `431e2be`):
   - Root cause: `Customer.sourceCtvId` trỏ chính mình khi CTV self-purchase → sponsor hiện chính khách.
   - Backend: Thêm `networkParent` = resolve `User.parentId` (parent thật trong mạng lưới).
   - Frontend: Ưu tiên `networkParent` > `sourceCtv`. Check `sponsor !== self`.

3. **Fix NppCommission thiếu trong Kỳ Hoa Hồng admin** (Commit `ade49e4`):
   - Root cause 1: NppCommission tạo không gán `periodId` → null → admin không thấy.
   - Root cause 2: Admin API chỉ query `Commission`, bỏ sót `NppCommission`.
   - Fix: Tìm period OPEN khi tạo NppCommission + merge 2 bảng trong API response.
   - Data fix: Update record cũ periodId=null → kỳ 10/2026.

#### Ghi chú kỹ thuật:
- **2 bảng commission riêng biệt**: `Commission` (đơn bán lẻ) + `NppCommission` (hoa hồng giới thiệu NPP D1/D2). PHẢI query cả 2 ở mọi nơi hiện commission.
- **sourceCtvId ≠ parentId**: `sourceCtvId` = CTV tạo Customer record, `parentId` = parent thật trong sponsor network. Luôn dùng `parentId` cho tuyến trên.
- **NPP combo filter**: Dùng `title startsWith 'Máy'` vì "Bộ điện phân" cùng cat-01 nhưng KHÔNG phải máy.
- **PM2 backend ID**: Hiện tại là 43 (đã bị delete/recreate phiên trước). Dùng `pm2 reload happylife-backend`.

#### Chưa hoàn thành (Cần làm tiếp):
1. **NPP order form khác trong Admin** — Khi tạo đơn cho NPP (Phan Thế Mỹ), form nên chuyển sang chế độ combo (chọn nhiều sản phẩm, chiết khấu combo) thay vì dropdown đơn lẻ.
2. **Verify CTV tab** — Đơn admin tạo có CTV gán → phải hiện trong tab "Đơn CTV".
3. **Test F0 hiện đúng** — F5 admin → Tạo Đơn → nhập SĐT → verify sponsor đúng.
4. **Test Kỳ Hoa Hồng** — F5 → verify 4 khoản đủ.

---

## Cập nhật: 2026-09-29

### Phiên 29/09/2026

#### Đã làm:
1. **Khóa bất biến tài khoản Nguyễn Đức Quang (0968616263 / U1001)**:
   - Đưa tài khoản vào `project-workflow.md` (Section XIX) và Skill `wasypro-rules`.
   - Cập nhật backend `server/index.js` trên cả hai VPS (Oracle & Google):
     - Chặn xóa tài khoản trong `DELETE /api/users/:userId`.
     - Loại trừ khỏi câu lệnh xóa trong `POST /api/admin/factory-reset` và `POST /api/admin/reset-members`.
     - Hàm `preserveOrSeedQuangAccount` tự động bảo vệ, đưa điểm về 0, gỡ sponsor và duy trì `role: 'ctv'`, hoặc re-seed nếu chưa có.
     - Sau khi reset, người đăng ký tiếp theo sẽ tự động nhận `U1002`.
2. **Cập nhật AGENTS.md**: Bổ sung quy định bất biến cho tài khoản Nguyễn Đức Quang.
3. **Phân tách luồng Đăng ký Khách vãng lai & Khóa bảo trợ link ref**:
   - Khi vào trực tiếp `wasypro.com` (không có link ref): Ẩn ô nhập Mã giới thiệu, ẩn 2 lựa chọn tham gia CTV/NPP. Thay thế bằng Box thông tin nổi bật kèm nút bấm liên hệ Zalo OA (`https://zalo.me/2928413591064686973`) hoặc Hotline `1900 989878` để được cấp mã.
   - Khi vào qua link ref (`?ref=U1xxx`): Khóa chết ô Mã giới thiệu (`readOnly`, badge ổ khóa 🔒 không thể chỉnh sửa).
   - Backend `POST /api/auth/register`: Bổ sung Security Guard chặn đăng ký `joinSystem` hoặc `registerNpp` nếu không có `parentId` hợp lệ (HTTP 400).
4. **Ẩn nút Xóa CTV tài khoản Nguyễn Đức Quang (UI Invariant)**:
   - Trong `AdminCTVManagement.tsx`: Đã ẩn hoàn toàn nút "🗑️ Xóa CTV" khi hiển thị chi tiết tài khoản Nguyễn Đức Quang (`U1001` / `0968616263`).

---

## Cập nhật: 2026-09-27

### Phiên 27/09/2026

#### Đã làm:
1. **Setup test.wasypro.com trên Google Cloud VPS** — Thêm Nginx server block cho test.wasypro.com → port 5005 (frontend) + /api/ → port 3011 (backend). Thêm http/https test.wasypro.com vào CORS productionOrigins. Restart backend PM2. (commit `2116fbd`)
2. **Tổng hợp tính năng dự án** — Đọc toàn bộ code trên VPS, tạo báo cáo 11 nhóm tính năng (130 API, 37 models, 67 components)

---

## Quy tắc quan trọng

### Source of Truth
- VPS: `/var/www/wasypro/` — Oracle VPS `149.118.62.155`
- GitHub: backup only

### 2 bảng Commission (QUAN TRỌNG)
- `Commission`: Đơn bán lẻ (SELF_BUY, DIRECT_NO_ID, DIRECT_WITH_ID, F1, F2)
- `NppCommission`: Hoa hồng giới thiệu NPP (D1 10%, D2 5%)
- PHẢI query cả 2 khi hiện commission

### Customer Sponsor vs Network Parent (QUAN TRỌNG)
- `Customer.sourceCtvId` = CTV tạo customer record (có thể = chính mình khi self-purchase)
- `User.parentId` = parent thật trong mạng lưới sponsor
- Luôn dùng `parentId` để xác định F0/tuyến trên

### req.user structure
```js
req.user = { id: "U199", userId: "U199", dbId: cuid, role, fullName, phone }
```
- NppPurchase.userId = cuid → dùng `req.user.dbId`

### NPP Combo Products Filter
- Chỉ máy lọc nước: `title startsWith 'Máy'` + `categoryId IN ('cat-01','cat-02')`
- "Bộ điện phân" (100k) nằm trong cat-01 nhưng KHÔNG phải máy → phải lọc bằng title

### Tránh
- sed trên server/index.js → dùng Python
- PowerShell inline quotes → dùng .sh scripts
- BigInt() parse formatted numbers → strip dots
- Báo cáo xong mà chưa test thật
- Dùng `pm2 delete` rồi `pm2 start` → chỉ `pm2 reload`
- Insert code gần JSDoc `/**` block → verify đã đóng `*/`
