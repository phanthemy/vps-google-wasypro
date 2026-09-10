# 📋 Project Memory: WASY PRO (Water King Website Redesign)

> File này được tự động tạo và cập nhật bởi các Sub-Agent trong quá trình phát triển.

## Thông tin dự án

| Thông tin | Giá trị |
|-----------|---------|
| **Tên dự án** | WASY PRO Website Redesign (Water King) |
| **Ngày bắt đầu** | 2026-08-11 |
| **Thư mục** | `c:\Users\editor02\Documents\antigravity\wonderful-lavoisier` |
| **Domain gốc** | `https://wasypro.com/` |
| **Stack** | Vite + React + Tailwind CSS + Lucide Icons + Framer Motion |

---

## Lịch sử Sub-Agent xử lý

### 🎨 UI/UX Designer & 🗄️ Database Architect
| Thời gian | Nội dung | Trạng thái |
|-----------|---------|------------|
| 2026-08-11 | Định nghĩa Design Tokens, Color Palette, Schema dữ liệu sản phẩm, tin tức, tra cứu bảo hành | ✅ UI/UX Đã hoàn thành (tạo design-tokens.json & design-system.md). DB Architect: Đã tạo `schema.ts` và `mockData.ts` xong. |
| 2026-08-11 | Mở rộng DB Schema & Admin Data Store (thêm AdminUser, Lead, ProductInput, WarrantyInput) và thêm Seed data | ✅ DB Architect: Đã cập nhật `schema.ts` và `mockData.ts` thêm Admin và Lead. |
| 2026-08-11 | Thiết kế UI/UX cho phần Admin Dashboard: Layout, Slate & Ocean Theme, specs cho các trang. | ✅ UI/UX Đã tạo `design-system-admin.md` hoàn thành. |

### ⚙️ Backend Developer
| Thời gian | Nội dung | Trạng thái |
|-----------|---------|------------|
| 2026-08-11 | Xây dựng các API Service Controllers (`api.ts`), tự kiểm thử (`api.test.ts`) thành công. | ✅ Đã hoàn thành (Backend API ready) |
| 2026-08-11 | Mở rộng API Service Controllers cho Admin CRUD: login, products, leads, warranties, stats | ✅ Đã hoàn thành (Admin API ready) |

### 🎨 Frontend Developer
| Thời gian | Nội dung | Trạng thái |
|-----------|---------|------------|
| 2026-08-11 | Xây dựng toàn bộ giao diện React UI Client (Header, Hero, ProductSection, ProductQuickViewModal, HydrogenBenefits, WarrantyLookupSection, NewsSection, FaqSection, ContactModal, Footer, App). Đáp ứng 100% 4 trạng thái (Loading, Empty, Error, Normal), responsive & glassmorphic aesthetics. Build thành công 0 lỗi. | ✅ Đã hoàn thành (Frontend UI ready) |
| 2026-08-11 | Xây dựng toàn bộ các Component Admin Dashboard (`AdminLoginModal`, `AdminHeader`, `AdminSidebar`, `AdminOverview`, `AdminProducts`, `AdminWarranties`, `AdminLeads`, `AdminNews`) chuẩn Slate & Ocean theme, đủ 4 trạng thái UI, responsive 100% và chuyển đổi nhanh Client/Admin Portal trong `App.tsx`. Build thành công 0 lỗi. | ✅ Đã hoàn thành (Admin UI ready) |

### 🔍 Code Reviewer
| Thời gian | Nội dung | Trạng thái |
|-----------|---------|------------|
| 2026-08-11 | Kiểm tra codebase trong `src/`: code style (React & TS), DRY, strict types. Đã fix lỗi sử dụng `any` type (chuyển sang `unknown` và check type an toàn) trong các file `ProductSection.tsx`, `ContactModal.tsx`, `WarrantyLookupSection.tsx`, `api.test.ts`. Các thẻ ảnh `img` đã có `alt`. Cấu trúc module tốt. | ✅ Đã hoàn thành (Code Review passed) |
| 2026-08-11 | Kiểm tra codebase Admin Dashboard trong `src/components/admin/` và `src/services/api.ts`: Code style, Naming conventions (React & TS), DRY, type-safe (try-catch dùng `unknown` và check `err instanceof Error`), null-safety đều tốt. Không phát hiện lỗi cần sửa. | ✅ Đã hoàn thành (Admin Code Review passed) |

### 🧪 QA Tester
| Thời gian | Nội dung | Kết quả |
|-----------|---------|---------|
| 2026-08-11 | Đã kiểm thử chức năng Client (bộ lọc, tìm kiếm, tra cứu bảo hành số 0900000000/0912345678, form đăng ký). UI đủ 4 trạng thái, responsive tốt, form validate chặt chẽ. | ✅ PASS - Đã duyệt |
| 2026-08-11 | Đã kiểm thử toàn bộ Admin Portal (Login Modal, Thống kê, Quản lý Sản phẩm, Bảo hành, Đơn tư vấn). Chuyển đổi 2 chiều Client/Admin mượt mà. 4 trạng thái UI & Responsive 100% OK. | ✅ PASS - Đã duyệt |

### 📦 DevOps Agent
| Thời gian | Nội dung | Trạng thái |
|-----------|---------|------------|
| 2026-08-11 | Tạo script deploy tự động `deploy.ps1` (PowerShell -> SSH/SCP -> Ubuntu VPS `149.118.62.155`), tạo file cấu hình PM2 `ecosystem.config.cjs` (cổng 5005), tạo cấu hình Nginx `nginx-wasypro.conf` và Caddy `Caddyfile.snippet`. Cập nhật `README.md` với hướng dẫn cài đặt và deploy đầy đủ. | ✅ Đã hoàn thành (DevOps ready) |

---

## Quyết định thiết kế quan trọng

1. **Công nghệ Frontend**: Sử dụng React + Vite + Tailwind CSS + Lucide Icons để đảm bảo ứng dụng đạt tốc độ load < 0.5s và điểm Google Lighthouse tối đa.
2. **Design Tokens**: Màu chủ đạo Deep Ocean Blue (`#0284c7`), Clean Aqua (`#06b6d4`), Mint Green (`#10b981`), kết hợp Glassmorphism hiệu ứng dòng nước.
3. **Sub-Agent Workflow**: Thực hiện đúng các bước theo `project-workflow.md`.
5. **Admin UI/UX**: Sử dụng Slate & Ocean Palette, tối ưu Data Table và Form quản trị, đủ 4 trạng thái.
4. **Deploy Workflow**: Dùng PM2 phục vụ static build qua package `serve` trên cổng 5005, Caddy/Nginx reverse proxy, deploy tự động qua PowerShell `deploy.ps1`.

## Cập nhật 04/09/2026 - Tích hợp Menu Hệ Thống & Unified SSO Admin/CTV
- **Phân quyền Header:**
  - Khách (Anonymous): Hiện 🏆 KINH DOANH (Modal CTV) và 🛡️ HỆ THỐNG (Modal Quản trị Hệ Thống).
  - CTV (`role === 'ctv'`): Hiện 🏆 KINH DOANH, ẩn hoàn toàn 🛡️ HỆ THỐNG và quyền CMS.
  - Admin (`role === 'admin'`): Hiện cả 2 menu. Nút 🛡️ HỆ THỐNG có dropdown truy cập nhanh (Website CMS, Quản lý CTV, Cấu hình Hoa hồng, Audit Logs).
- **Cơ chế Single Sign-On (SSO):** Tự động đồng bộ `user.role === 'admin'` từ Unified Auth sang state `adminUser` của CMS, cho phép Admin chuyển đổi giữa CMS và CTV Portal mà không bị hỏi lại mật khẩu.
- **Tối ưu Mobile Drawer:** Đồng bộ đầy đủ các nút phân quyền và menu trên thiết bị di động.


## Cập nhật 10/09/2026 — Order & Commission Lifecycle Redesign

### Kiến trúc đơn hàng (BOSS APPROVED)

**Single Source of Truth**: WebsiteOrder là đơn gốc. Shadow Order (CTV) chỉ đồng bộ.

```
Website Order (real) ─── Admin đổi status ─── sync shadow ─── COMPLETED → Settlement
                                                            ─── CANCELLED → Reverse
```

**Quy tắc duy nhất cho toàn hệ thống**:
- Mọi đơn (Website + CTV Portal) bắt đầu ở `NEW`
- Settlement (QP/SP/Commission) chỉ khi `COMPLETED`
- Reversal khi `CANCELLED`

### Commits phiên này

| Commit | Nội dung |
|--------|---------|
| `4b7fd94` | Order classification: shadowOrderId + isCtvOrder |
| `86bece8` | Deferred settlement: shadow=NEW, remove bridge settlement |
| `5c9e7aa` | Admin dual-tab order management UI |
| `57c1081` | Retroactive sync shadow status |
| `086c420` | Unified lifecycle: CTV Portal orders = NEW |
| `e53ca0d` | Single source of truth: management tab + read-only tab |
| `1283576` | Tab rename + 4-case verification |
| `5432203` | Admin Reset Test Data button (temporary) |

### Quyết định kiến trúc

1. **Order Status lifecycle**: NEW → CONFIRMED → SHIPPING → COMPLETED | CANCELLED
2. **Commission Status lifecycle**: PENDING → APPROVED → PAID | REJECTED | REVOKED
3. **Admin UI 2 tabs**:
   - 📦 Quản lý đơn Website (management, source of truth)
   - 🤝 Theo dõi hoa hồng CTV (read-only, synced)
4. **CTV Portal orders**: Cùng lifecycle với Website, không settlement ngay
5. **reverseOrderSettlement**: Reverse QP/SP, reject commissions, create REVERSAL for PAID, revoke rank
6. **Reset Test Data**: Nút tạm thời cho Boss test, sẽ khóa sau

### API Endpoints mới

| Method | Path | Mô tả |
|--------|------|-------|
| PUT | /api/admin/website-orders/:id/status | Đổi status WO + sync shadow + settlement/reversal |
| PUT | /api/admin/orders/:id/status | Đổi status standalone CTV order |
| PUT | /api/admin/commissions/:id/status | Đổi status commission đơn lẻ |
| PUT | /api/admin/commissions/bulk-approve | Bulk approve PENDING → APPROVED |
| PUT | /api/admin/commissions/bulk-pay | Bulk pay APPROVED → PAID |
| POST | /api/admin/reset-uat | Reset toàn bộ test data (temporary) |

### Gotchas / Bẫy lỗi

1. **prisma db push fails với SQLite** — phải dùng better-sqlite3 ALTER TABLE trực tiếp
2. **PowerShell `&&` không hoạt động** — tách lệnh riêng
3. **Brace matching trong JS** — `{ currentUser }` param destructuring bị match sai
4. **Old data**: Orders tạo trước deploy vẫn giữ status cũ, cần retroactive sync
