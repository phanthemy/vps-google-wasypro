# WasyPro — Changelog

> Lịch sử cập nhật dự án. Mỗi session ghi nhận các thay đổi quan trọng.

## 2026-09-30

### Feature & Fix (Phiên Tối 19:00-20:40)
- **Bật lại OTP Verification** — Zalo OA nâng gói Tăng trưởng, bỏ comment block enable OTP check, tăng cooldown 60→120s (`dc9d09d`).
- **Hệ thống Broadcast OTP** — Viết lại `znsService.js`, gửi OTP song song tới khách + admin UIDs + sponsor CTV/NPP qua Zalo OA CS message (`5d55a2c`).
- **Thêm cột zaloUid** — User model + API PATCH + UI admin gán Zalo UID cho CTV/NPP nhận OTP (`5d55a2c`).
- **Swap tài khoản hệ thống** — 0968616263→Admin (ADM_QUANG), 0937353535→CTV mặc định (U1001), 0999999999=chỉ thấy menu Reset (`fc29a86`, `7884d4c`).
- **Restrict Reset menu** — Backend 403 + Frontend ẩn tab "Hệ Thống" cho admin không phải 0999999999 (`fc29a86`).
- **Prisma generate** — Fix lỗi zaloUid không nhận do thiếu `npx prisma generate` sau ALTER TABLE (`5cc0fb5`).
- ~~An Ref Link cho CTV chua co BID~~ — **DA HUY BO** (01/10/2026). CTV chua co BID van hien ref link, nhung chua huong hoa hong (L11/L12 giu nguyen).

### Feature & Optimization (Phiên Chiều - Bàn Giao Về Nhà)
- **Tích hợp 9 Video YouTube sự kiện truyền hình & tin tức** — Đưa 9 video sự kiện tập đoàn (HTV9, New World Sài Gòn, Ký kết tri ân, Nhà máy Phú Thọ, v.v.) vào mục Tin tức & Sự kiện trang chủ với Modal Player xem video toàn màn hình mượt mà không làm chuyển trang (`efb4bab`).
- **Quản Trị Tin Tức & Video YouTube trong Admin** — Thêm bảng SQLite `NewsArticle`, viết bộ API CRUD `/api/articles`, hỗ trợ nhập link YouTube, tự động lấy thumbnail HD từ YouTube ID và hiển thị badge Video (`efb4bab`).
- **Tái cấu trúc Danh mục Sản phẩm Trang chủ & Quản lý Danh mục Admin** — Hợp nhất máy lọc nước ion kiềm và hydrogen thành mục duy nhất "Máy lọc nước" trên trang chủ; viết bộ API CRUD `/api/categories` và bổ sung Modal quản lý danh mục trong `AdminProducts.tsx` (`efb4bab`).
- **Tối ưu hóa Banner Hero trang chủ từ bản vẽ PDF** — Trích xuất vector từ `Backdrop 133 x 256cm.pdf` sang WebP 1920px (`backdrop_banner.webp`, 560KB), khắc phục triệt để tình trạng mờ vỡ hạt khi phóng to màn hình lớn (`efb4bab`).
- **Tích hợp Video Hero nền chạy ngầm** — Triển khai `hero-video.mp4` với hiệu ứng video nền sang trọng, có nút bật/tắt tiếng trực quan (`efb4bab`).
- **Chuẩn hóa Logo Zalo Business (ZBS) & Xác thực Domain Zalo** — Triển khai 2 file xác thực domain (`NjE12PILCpro...`), xuất logo ZBS chuẩn tỉ lệ 1:1 vòng tròn an toàn 15% inner padding (`zbs_logo_light.png`, `zbs_logo_dark.png`) lưu vào desktop và VPS (`4007080`).
- **Tạm thời vô hiệu hóa OTP Guard khi Đăng ký** — Tránh gián đoạn đăng ký tài khoản trong thời gian Zalo OA hoàn tất kích hoạt gói tin trả phí ZNS/ZBS (`4007080`).

### Feature & Fix (Phiên Sáng & Đầu Giờ)
- **Hiển thị hình ảnh sản phẩm & điểm CP trong Tạo Đơn Hàng** — Modal `CreateOrderModal.jsx` hiện ảnh thực tế và điểm tích lũy ⭐ CP cho từng sản phẩm (`a8f5743`).
- **Hover Zoom Popup Thumbnail** — Rê chuột vào ảnh sản phẩm trong Tạo Đơn Hàng để xem ảnh phóng to floating preview (`a90f602`).
- **Khắc phục lỗi upload ảnh sản phẩm trong Admin** — Thêm route `POST /api/upload`, cấu hình multer và miễn trừ CSRF (`a8f5743`).
- **Quy chuẩn mật khẩu bảo mật cao (8 ký tự)** — Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt (`a8f5743`).
- **Kéo thả & Sắp xếp thứ tự Gói NPP (`sortOrder`)** — Thêm cột `sortOrder`, endpoint reorder và UI kéo thả, mũi tên di chuyển gói (`b0d4051`, `9550282`).
- **NPP Combo chỉ hiện máy lọc nước** — Filter `title startsWith 'Máy'` + `categoryId IN (cat-01, cat-02)`, loại bỏ linh kiện/phụ kiện (`71607ce`).
- **Fix F0 hiện sai trong Admin Tạo Đơn** — Thêm `networkParent` resolve từ `User.parentId` thay vì dùng `Customer.sourceCtvId` (`431e2be`).
- **NppCommission thiếu trong Kỳ Hoa Hồng** — Gán `periodId` khi tạo NppCommission + merge NppCommission vào API `/api/admin/periods/:id/commissions` (`ade49e4`).
- **JSDoc comment block nuốt 6 API** — Thêm `*/` đóng comment (`dd7269f`).
- **NPP/CTV Ref Link chỉ hiện khi có businessId** — Badge ⏳ Chưa kích hoạt nếu chưa mua combo (`3921409`).
- **Smart Admin Create Order Modal** — Auto sponsor, required address (`fcd9c7d`).
- **Nginx uploads location cho attachments** — Thêm `/uploads/` serve static files (`dd7269f`).
- **Admin Order Management** — 6 API endpoints + 3 modals (`0729a81`).

## 2026-09-29

- **Cấu hình chiết khấu tự mua & hoa hồng bán khách động theo cấp bậc (20%, 25%, 30%)**
- **Phân tách luồng Đăng ký & Khóa bảo trợ link ref**
- **Khóa tài khoản bất biến Nguyễn Đức Quang (0968616263 / U1001)**
- **Fix L11: Commission trả cho user chưa có BID** (`bbfb655`)
- **Fix L12: Giảm giá 20% cho user chưa có BID** (`6a740be`)

## 2026-09-27

- **Setup test.wasypro.com** trên Google Cloud VPS (`2116fbd`)
- **Tổng hợp tính năng dự án** — 130 API, 37 models, 67 components

## 2026-09-26

- **Sync AI Workflow to Git** — .agents/rules/project-workflow.md (`5149efd`)
- **Expand Startup Checklist** — AGENTS.md 6 → 13 steps
- **Create changelog.md**
- **Product images 404** — Mount `../uploads` vào Express static (`e43cefd`)
