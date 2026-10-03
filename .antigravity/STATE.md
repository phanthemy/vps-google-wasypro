# WASYPRO TEST — Trạng Thái Dự Án (test.wasypro.com)
> Cập nhật: 2026-10-03 08:05 (phiên 03/10/2026)

## Trạng thái hiện tại: ✅ STABLE — Sẵn sàng nhận task mới

## Source of Truth: Google VPS (34.173.189.105)
## Domain: test.wasypro.com
## TUYỆT ĐỐI KHÔNG đụng code wasypro.com (Oracle VPS)

## PM2 Apps:
- wasypro (id 1, port 5005) — Landing + Admin
- wasypro-ctv (id 2, port 5175) — CTV Portal  
- happylife-backend (id 3, port 3011) — Backend API
- Database: SQLite /var/www/wasypro/server/dev.db

## Việc đã làm phiên 03/10/2026:

### ✅ Hoàn thành:
1. **Ẩn hamburger menu CTV** — MockupHeader.tsx: Xóa Menu button, chỉ giữ Search + Cart
2. **Xóa HỖ TRỢ section CTV** — MockupMore.tsx: Bỏ 3 items (Bảo hành, Lợi ích, Hỏi đáp)
3. **Fix upload avatar** — chown uploads/ cho user mapsgo_vn (PM2 user)
4. **Hiển thị avatar dashboard** — MockupDashboard.tsx: img tag với fallback User icon
5. **Fix responsive KH** — CustomersView.jsx: flexWrap, flex-basis, flexShrink
6. **Nút đăng xuất drawer** — MobileLandingView.tsx: LogOut button trước hotline footer
7. **Format mô tả SP** — ProductQuickViewModal.tsx: split description thành paragraphs
8. **Fix popup X tạo đơn** — CreateOrderModal.jsx: justify-start, marginTop 48px, 100dvh
9. **Thu gọn KH + tìm SP** — CreateOrderModal.jsx: show 2 KH + expand, ô search SP, 50vh area
10. **Popup SP trang chủ responsive** — ProductQuickViewModal.tsx: sticky X header, flex-col, clamp desc
11. **Hệ thống Đại Lý** — TÍNH NĂNG MỚI:
    - DB: Model Dealer + 6 đại lý mẫu (HCM, HN, ĐN, CT, BD, HP)
    - Backend: 6 API endpoints (2 public + 4 admin CRUD)
    - Homepage: DealerSection.tsx (Google Maps + filter tỉnh + dealer cards)
    - Shortcut bubble "Đại Lý" + drawer link
    - Admin: AdminDealerManagement.tsx (CRUD panel)
12. **Thêm quy tắc UI Visual Verification Gate** — project-workflow.md Section IV.7

### ⚠️ Cần theo dõi:
- CTV views legacy (CommissionHistoryView, PriceListView, NetworkView) chưa responsive/font consistent
- User không truy cập test.wasypro.com từ iPhone 4G (ISP blocking Google Cloud IP)

## Tài khoản test:
- CTV: 0937353535 / Matkhau@123
- Admin: 0968616263

## Files quan trọng đã sửa:
- src/components/ProductQuickViewModal.tsx — Popup SP responsive
- src/components/DealerSection.tsx — MỚI: Section đại lý trang chủ
- src/components/MobileLandingView.tsx — Import DealerSection, bubble, drawer link, logout
- src/components/admin/AdminDealerManagement.tsx — MỚI: Admin CRUD đại lý
- src/components/ctv/mockup/MockupHeader.tsx — Ẩn hamburger
- src/components/ctv/mockup/MockupMore.tsx — Xóa HỖ TRỢ
- src/components/ctv/mockup/MockupDashboard.tsx — Avatar display
- src/components/ctv/views/CustomersView.jsx — Responsive fix
- src/components/ctv/views/CreateOrderModal.jsx — Thu gọn KH, tìm SP, popup X
- server/index.js — 6 dealer API routes
- server/prisma/schema.prisma — Model Dealer
- .agents/rules/project-workflow.md — UI Visual Verification Gate
