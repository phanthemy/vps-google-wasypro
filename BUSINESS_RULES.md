# 🔒 BUSINESS RULES — WASYPRO INVARIANTS
# ═══════════════════════════════════════
# Agent PHẢI đọc file này TRƯỚC khi sửa bất kỳ code nào.
# Vi phạm bất kỳ rule nào = BUG PRODUCTION.

## 1. CTV MUA HÀNG TRÊN WEBSITE ⭐⭐⭐⭐⭐
- CTV ĐÃ CÓ RANK (Ambassador/Manager/Director) **KHÔNG ĐƯỢC** mua hàng trên trang chủ website.
- Khi CTV có rank bấm MUA NGAY → hiện modal "Bạn đã là Đại Sứ WasyPro!" → redirect vào CTV Portal.
- Logic nằm ở 2 nơi:
  1. `ContactModal.tsx`: Check `/api/auth/me` → `u.rank && u.isSystemParticipant` → hiện redirect modal.
  2. `App.tsx` `onOrderProduct` handler: Check `user.rank` trước khi `addItem()`.
- **Nếu thêm flow mua hàng mới** → PHẢI copy guard này vào flow mới.
- Commit gốc: `eee9f38`

## 2. CTV AUTO-REDIRECT SAU LOGIN ⭐⭐⭐⭐⭐
- CTV (isSystemParticipant || nppStatus || có rank) đăng nhập → tự động chuyển vào CTV Portal (`setActiveSection('ctv')`).
- Khách hàng thường → ở lại trang chủ.
- Admin/Accountant → vào Admin Portal.
- **KHÔNG ĐƯỢC XÓA** redirect này. Đây là TÍNH NĂNG, không phải bug.

## 3. TÀI KHOẢN ĐƯỢC BẢO VỆ ⭐⭐⭐⭐⭐
- `0937353535` / U1001 (Nguyễn Đức Quang): **CTV mặc định**, `isSystemParticipant: true`, KHÔNG BAO GIỜ XÓA.
- `0968616263` / ADM_QUANG (Nguyễn Đức Quang): **Admin chính** (`role: 'admin'`), đổi mật khẩu qua bảng quản trị.
- `0999999999` / ADMIN01: Admin duy nhất thấy menu Reset (Factory Reset, Reset Members).
- **Lịch sử swap (29/09)**: 0968616263 từ CTV swap thành Admin, 0937353535 giữ nguyên CTV mặc định U1001.

## 4. BUSINESS ID (BID) GATES ⭐⭐⭐⭐⭐
- Không có BID = Không nhận commission (L11)
- Không có BID = Không được giảm giá tự mua (L12)
- Ref link: CTV **HIỆN ref link** kể cả chưa có BID (đã revoke BID check — commit `c725f4b`, `f412ad0`). Commission vẫn cần BID.

## 5. FORM ĐĂNG KÝ ⭐⭐⭐⭐
- 3 chương trình: Đại sứ / NPP (gói PRODUCT_COMBO) / Cổ đông (gói CAPITAL)
- Tất cả đều `joinSystem: true`
- NPP/Cổ đông phải chọn gói trước khi submit **(trên form đăng ký website)**
- CTV đã có tài khoản → vào CTV Portal → mua gói NPP sau (flow riêng)
- OTP qua Zalo ZNS bắt buộc
- Mật khẩu: min 8 ký tự, chữ thường + HOA + số + ký tự đặc biệt

## 6. COMMISSION RULES ⭐⭐⭐⭐
- **Không có BID = Không commission** (L11). **Không có RANK = Không commission** (L27).
- BID = điều kiện cần, RANK = điều kiện đủ. KHÔNG fallback rank thành AMBASSADOR.
- 2 bảng: `Commission` (bán lẻ) + `NppCommission` (giới thiệu NPP)
- PHẢI query cả 2 khi hiện danh sách commission
- `NppCommission` PHẢI có `periodId` khi tạo
- Sponsor = `User.parentId`, KHÔNG phải `Customer.sourceCtvId`

## 7. NPP COMBO ⭐⭐⭐
- Chỉ hiện máy lọc nước: `title startsWith 'Máy'` + `categoryId IN ('cat-01','cat-02')`
- Loại trừ: Bộ điện phân, Lõi, Phụ kiện

## 8. DEPLOY ⭐⭐⭐
- Source of Truth: Oracle VPS `/var/www/wasypro/`
- Frontend build: `cd /var/www/wasypro ; npx vite build ; pm2 restart wasypro`
- Backend: `pm2 restart happylife-backend` (KHÔNG delete + start)
- Banner images: 1920×1000px minimum

## 9. CHECKLIST TRƯỚC KHI SỬA CODE ⭐⭐⭐⭐⭐
1. [ ] Đọc `loi.md` — biết lỗi cũ để không lặp lại
2. [ ] Đọc `BUSINESS_RULES.md` (file này) — biết invariant
3. [ ] `git log --oneline -n 50` — hiểu context gần nhất  
4. [ ] `git log --oneline | grep <keyword>` — tìm tính năng liên quan
5. [ ] Nếu thêm flow mới → tìm guard/check trong flow cũ → port sang
6. [ ] Nếu xóa/sửa code cũ → `git show <commit>` hiểu tại sao nó tồn tại
7. [ ] Test trên VPS trước khi báo xong

## 10. TIÊU CHUẨN KỸ THUẬT CHO POPUP / MODAL / DIALOG ⭐⭐⭐⭐⭐
- **Áp dụng**: Tất cả các modal popup hiện tại và các popup tạo mới sau này.
- **Quy tắc Bất Biến 1 (Nút X)**: Nút [X] BẮT BUỘC nằm trong Sticky Header (sticky top-0 z-50), KHÔNG dùng position: fixed, KHÔNG để nút X trôi nổi trong body cuộn. Kích thước chạm tối thiểu $\ge 36\text{px} \times 36\text{px}$.
- **Quy tắc Bất Biến 2 (Cấu trúc 3 tầng)**:
  1. Sticky Header: Tiêu đề + Nút X (luôn hiển thị 100%, không bị cuộn trôi).
  2. Scrollable Body: overflow-y-auto max-h-[90dvh] flex-1 overscroll-contain (chỉ cuộn riêng nội dung này).
  3. Sticky Footer: Chứa nút Lưu/Hành động (nếu có).
- **Quy tắc Bất Biến 3 (Chống xê dịch & Tràn màn hình)**:
  - Chiều rộng: w-full max-w-[calc(100vw-24px)] hoặc max-w-lg kèm padding mép an toàn p-3 sm:p-4.
  - Căn giữa ổn định: my-auto trong overlay flex items-center justify-center.
  - Tuyệt đối không sinh thanh cuộn ngang overflow-x.
- **Vi phạm = BUG PRODUCTION**.
