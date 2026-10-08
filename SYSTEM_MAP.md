# SYSTEM_MAP.md — Bản Đồ Kỹ Thuật WasyPro
> ⚠️ **BẢN ĐỒ ĐỊNH VỊ KỸ THUẬT (GPS INDEX) — KHÔNG PHẢI SOURCE OF TRUTH**
> - **Last verified**: 2026-10-03 09:45
> - **Verified against**: Git HEAD `ca20a6d` | PM2: `wasypro` (5005), `wasypro-ctv` (5175), `happylife-backend` (3011) | Nginx: `wasypro.com`, `app.wasypro.com`
> - **Source verification status**: PASS

---

### 🔒 INVARIANT: SYSTEM MAP DRIFT CHECK ⭐⭐⭐⭐⭐

> ⚠️ **BẢO VỆ VĨNH VIỄN — TUÂN THỦ TRƯỚC MỌI THAY ĐỔI CODE**

`SYSTEM_MAP.md` chỉ được sử dụng để định vị (technical navigation / GPS index). Trước mọi thay đổi code, Agent **BẮT BUỘC** mở và xác minh source thực tế tương ứng.

Nếu `SYSTEM_MAP.md` và source không khớp, phải đánh dấu `SYSTEM_MAP_DRIFT`, dừng implementation, xác định nguồn sự thật (Source code, Git hay Production) và cập nhật map trước khi tiếp tục. Không được coi `SYSTEM_MAP.md` là source of truth.

> 🛑 **NGHIÊM CẤM TUYÊN BỐ**: Tuyệt đối **KHÔNG** tuyên bố rằng `SYSTEM_MAP.md` loại bỏ hoàn toàn bug. Nó chỉ giảm mạnh nguy cơ sửa nhầm app/file nhưng không đảm bảo tuyệt đối.

```
SYSTEM_MAP
    ↓
ĐỊNH VỊ (Component / API / Route / File)
    ↓
MỞ SOURCE THẬT TRÊN ĐĨA
    ↓
ĐỐI CHIẾU MAP ↔ SOURCE
    ↓
┌────────────────────────────────────────┐
│ KHỚP                                   │
│ → Tiến hành sửa code                   │
└────────────────────────────────────────┘
hoặc
┌────────────────────────────────────────┐
│ KHÔNG KHỚP                             │
│ → DRIFT DETECTED                       │
│ → STOP (Dừng implementation ngay)      │
│ → Xác định nguồn sự thật (Source, Git, │
│   hay Production)                      │
│ → Xác định nguyên nhân drift           │
│ → Cập nhật SYSTEM_MAP.md               │
│ → Verify lại                           │
│ → Mới được sửa code                    │
└────────────────────────────────────────┘
```

---

### PHÂN CẤP NGUỒN SỰ THẬT (HIERARCHY OF TRUTH)

```
                    ┌─────────────────┐
                    │ BUSINESS RULES  │  "PHẢI LÀM GÌ" (Nghiệp vụ cốt lõi, công thức, hoa hồng, rank)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ PROJECT WORKFLOW│  "LÀM THẾ NÀO" (Quy trình Sub-Agent, QA Gate, Safety)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   SYSTEM MAP    │  "NÓ NẰM Ở ĐÂU" (Bản đồ định vị GPS: Port, App, API, State)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  SOURCE CODE    │  "THỰC TẾ LÀ GÌ" (Sự thật kỹ thuật tối thượng)
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  RUNTIME / DB   │  "ĐANG CHẠY GÌ" (Sự thật vận hành tối thượng)
                    └─────────────────┘
```


## 1. KIẾN TRÚC TỔNG QUAN

```
┌─────────────────────┐    ┌──────────────────────┐
│  wasypro.com        │    │  app.wasypro.com      │
│  (Landing + Admin)  │    │  (CTV Portal PWA)     │
│  Nginx → :5005      │    │  Nginx → :5175        │
│  /var/www/wasypro   │    │  /var/www/wasypro-ctv  │
│  React 18 + TS      │    │  React 19 + JSX       │
│  Vite 5             │    │  Vite 8               │
└────────┬────────────┘    └──────────┬────────────┘
         │    /api/* proxy             │   /api/* proxy
         └─────────┬──────────────────┘
                   ▼
         ┌──────────────────────┐
         │  happylife-backend   │
         │  Port 3011           │
         │  Express + Prisma    │
         │  /var/www/wasypro/   │
         │  server/index.js     │
         │  152 API routes      │
         └──────────┬───────────┘
                    ▼
         ┌──────────────────────┐
         │  SQLite              │
         │  /var/www/wasypro/   │
         │  server/dev.db       │
         │  38 models           │
         └──────────────────────┘
```

### PM2 Processes

| PM2 ID | Tên | Port | Thư mục | Vai trò |
|---|---|---|---|---|
| 43 | `happylife-backend` | 3011 | `/var/www/wasypro/server` | Backend API chung |
| 27 | `wasypro` | 5005 | `/var/www/wasypro` | Landing page + Admin SPA |
| 34 | `wasypro-ctv` | 5175 | `/var/www/wasypro-ctv` | CTV Portal (app riêng) |

### ⚠️ QUY TẮC VÀNG — HAI APP FRONTEND RIÊNG BIỆT

| Thuộc tính | wasypro (5005) | wasypro-ctv (5175) |
|---|---|---|
| **Domain** | wasypro.com | app.wasypro.com |
| **Thư mục** | `/var/www/wasypro` | `/var/www/wasypro-ctv` |
| **React** | 18 + TypeScript | 19 + JSX thuần |
| **Admin panel** | ✅ Có (22 components) | ❌ Không |
| **CTV views** | ✅ Có (embedded 17 views) | ✅ Có (standalone 17 views) |
| **Build** | `cd /var/www/wasypro ; npx vite build` | `cd /var/www/wasypro-ctv ; npx vite build` |
| **Restart** | `pm2 restart wasypro` | `pm2 restart wasypro-ctv` |
| **Git** | ✅ Có (github) | ❌ Không có git riêng |

> 🛑 **CTV views là BẢN SAO RIÊNG, KHÔNG symlink!**
> Sửa file ở wasypro KHÔNG tự động áp dụng cho wasypro-ctv.
> Nếu sửa tính năng CTV → phải sửa CẢ HAI thư mục.

### File Location Quick Reference

| Cần sửa | wasypro path | wasypro-ctv path |
|---|---|---|
| Admin Component | `src/components/admin/*.tsx` | ❌ Không có |
| CTV SettingsView | `src/components/ctv/views/SettingsView.jsx` | `src/views/SettingsView.jsx` |
| CTV OrdersView | `src/components/ctv/views/OrdersView.jsx` | `src/views/OrdersView.jsx` |
| CTV DashboardView | `src/components/ctv/views/DashboardView.jsx` | `src/views/DashboardView.jsx` |
| CTV LoginView | `src/components/ctv/views/LoginView.jsx` | `src/views/LoginView.jsx` |
| CreateOrderModal | `src/components/ctv/views/CreateOrderModal.jsx` | ❌ Không có |
| PolicyView | ❌ Không có | `src/views/PolicyView.jsx` |
| Backend API | `server/index.js` | Dùng chung backend |
| Prisma Schema | `server/prisma/schema.prisma` | Dùng chung backend |

---

## 2. PRE-FLIGHT CHECKLIST — TRƯỚC KHI SỬA CODE

> ⚠️ **BẮT BUỘC chạy trước MỌI thay đổi code**

### Checklist 1: Xác định file đúng
```
□ Tính năng sửa thuộc Admin hay CTV?
  → Admin: chỉ sửa /var/www/wasypro/src/components/admin/
  → CTV: phải sửa CẢ HAI app (wasypro + wasypro-ctv)
□ File có tồn tại ở cả 2 app không?
  → grep -l "tên_file" /var/www/wasypro/src/ /var/www/wasypro-ctv/src/
```

### Checklist 2: Kiểm tra state trước khi dùng
```
□ Trước khi gọi setXxx() → grep 'useState' trong file đó
  → grep -n 'useState' /var/www/wasypro/src/components/admin/File.tsx
□ Nếu state chưa có → KHAI BÁO trước khi dùng
□ KHÔNG dùng setSuccess/setError nếu chưa có useState khai báo
```

### Checklist 3: Build & Test
```
□ Build wasypro: cd /var/www/wasypro ; npx vite build
□ Build wasypro-ctv (nếu sửa CTV): cd /var/www/wasypro-ctv ; npx vite build
□ Restart: pm2 restart wasypro wasypro-ctv happylife-backend
□ Playwright test từ LOCAL (node qa_xxx.js)
□ Chụp screenshot UI thực tế cho user xem
```

### Checklist 4: Trước khi sửa backend
```
□ Đọc CSRF exempt list (section 4.3 bên dưới)
□ API mới có cần authenticateToken middleware không?
□ API mới có cần CSRF exempt không?
□ Restart backend: pm2 restart happylife-backend
```

---

## 3. ADMIN COMPONENTS — STATE MAP

> Khi sửa component admin, kiểm tra state có sẵn ở đây

### AdminCTVManagement.tsx — Quản Lý CTV
```
State: ctvList, loading, error, search, rankFilter,
       selectedCtvId, detail, detailLoading, detailTab, resetPwLoading
⚠️ KHÔNG CÓ: success, setSuccess → DÙNG alert() THAY THẾ
```

### AdminMembersView.tsx — Tài Khoản Thành Viên
```
State: members, loading, error, search, actionLoading
⚠️ KHÔNG CÓ: success, setSuccess → DÙNG alert() THAY THẾ
```

### AdminUsers.tsx — Tài Khoản Admin
```
State: users, loading, error, success ✅, showCreateModal, createForm, creating,
       createError, showEditModal, editingUser, editForm, editing,
       showPasswordModal, passwordUser, passwordForm, changingPassword,
       showPassword, showDeleteModal, deletingUser, deleting
✅ CÓ success + setSuccess (khai báo dòng useState)
```

### AdminOrders.tsx — Đơn Hàng (82KB — file LỚN NHẤT)
```
State: activeTab, ctvOrders, ctvLoading, ctvError, webOrders, webLoading,
       webError, statusFilter, searchQuery, ctvFilter, purchaseFilter,
       expandedId, expandedWebId, showAssignModal, showCreateModal,
       showHistoryModal + modal-specific states
```

### AdminProducts.tsx — Sản Phẩm (51KB)
```
State: products, categories, loading, error, searchQuery, selectedCategory,
       isFormModalOpen, editingProduct, deletingProduct, submitting, modalError,
       isCategoryModalOpen, newCategoryName, editingCategory, editCategoryName,
       categoryLoading, isQuickAddCategory, quickCategoryName, formData
```

### AdminNppManagement.tsx — Quản Lý NPP
```
State: subTab, registrations, activations, packages, loading, error,
       selectedDownlineNpp, successMsg ✅, statusFilter, submitting,
       grantUserId, grantPackageId, grantRank, grantReason, grantNote,
       grantPayment, users, userSearch
✅ CÓ successMsg (dùng successMsg, KHÔNG phải success)
```

### AdminCategories.tsx — Danh Mục
```
State: categories, loading, error, isFormOpen, isDeleteOpen,
       editingCat, deletingCat, formData, submitting
```

### AdminWarranties.tsx — Bảo Hành
```
State: warranties, loading, error, searchQuery, statusFilter,
       isCreateModalOpen, newWarrantyData, selectedWarrantyForLog,
       maintenanceForm, detailWarranty, submitting, modalError
```

### AdminPeriods.tsx — Kỳ Hoa Hồng
```
State: periodName, startAt, endAt, copyFromId, saving, error,
       confirmPhrase, periods, loading, showCreate, closingPeriod
```

### AdminOverview.tsx — Tổng Quan
```
State: loading, error, stats, recentLeads, recentWarranties
```

### AdminSystemView.tsx — Hệ Thống (Reset)
```
State: KHÔNG CÓ useState — dùng async handlers trực tiếp
⚠️ Chỉ tài khoản 0999999999 mới thấy menu này
```

---

## 4. BACKEND API MAP (152 routes)

### 4.1 Auth & Profile
| Method | Path | Middleware | Mô tả |
|---|---|---|---|
| POST | `/api/auth/login` | authLimiter | Đăng nhập |
| GET | `/api/auth/me` | authenticateToken | Lấy thông tin user |
| POST | `/api/auth/logout` | — | Đăng xuất |
| POST | `/api/auth/change-password` | authenticateToken | **CTV tự đổi MK** |
| POST | `/api/auth/send-otp` | authLimiter | Gửi OTP Zalo |
| POST | `/api/auth/register` | authLimiter | Đăng ký |
| POST | `/api/users/me/join-system` | authenticateToken | Tham gia hệ thống |
| POST | `/api/users/me/avatar` | authenticateToken | Upload avatar |

### 4.2 Admin User Management
| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/admin/users/:id/reset-password` | Reset MK CTV/Member → wasy#### |
| DELETE | `/api/admin/users/:userId` | Xóa user (bảo vệ U1001) |
| POST | `/api/admin/users/:userId/promote-to-ctv` | Nâng cấp member → CTV |
| PATCH | `/api/admin/users/:userId/zalo-uid` | Cập nhật Zalo UID |
| GET | `/api/admin/ctv` | Danh sách CTV |
| GET | `/api/admin/ctv/:id` | Chi tiết CTV |

### 4.3 CSRF Exempt Routes
```javascript
// CSRF KHÔNG kiểm tra các path sau:
'/api/auth/login'
'/api/auth/logout'
'/api/auth/register'
'/api/auth/send-otp'
'/api/auth/change-password'    # ← MỚI (L33)
'/api/upload'
'/api/orders/website'
'/api/leads'
'/api/users/me/join-system'
'/api/users/me/avatar'
'/api/npp/register'
'/api/npp/my-purchase'
// Và TẤT CẢ path bắt đầu bằng:
'/api/orders'
'/api/customers'
'/api/ctv'
'/api/users'
'/api/admin'        ← tất cả admin đều exempt
'/api/leads'
'/api/internal-users'
'/api/services'
'/api/product-categories'
```

### 4.4 System Reset (chỉ 0999999999)
| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/admin/reset-orders` | Xóa tất cả đơn hàng |
| POST | `/api/admin/reset-ctv` | Reset CTV (giữ U1001) |
| POST | `/api/admin/reset-members` | Reset members |
| POST | `/api/admin/factory-reset` | Factory reset toàn bộ |

---

## 5. CTV VIEWS — SO SÁNH 2 APP

| View | wasypro (5005) | wasypro-ctv (5175) | Ghi chú |
|---|---|---|---|
| SettingsView | ✅ + ChangePassword | ✅ + ChangePassword | Phải sửa CẢ HAI |
| CreateOrderModal | ✅ (1152 lines, multi-cart) | ❌ Không có | Chỉ wasypro |
| OrdersView | ✅ (embed CreateOrder) | ✅ (standalone) | Khác nhau |
| DashboardView | ✅ | ✅ | Tương tự |
| LoginView | ✅ | ✅ | Tương tự |
| PolicyView | ❌ | ✅ | Chỉ CTV portal |
| NetworkView | ✅ (zoom controls) | ✅ (simple) | Khác nhau |
| CommissionHistoryView | ✅ | ✅ + showTaxes | Khác nhau |

---

## 6. DATABASE — KEY MODELS

### User (CTV/Member/Admin)
```
id, userId (U1001...), fullName, phone, password, tier,
role (ctv/admin/accountant), parentId, status,
mustChangePassword ✅, qualifyingPoints, sPoints, rank,
businessId, sponsorId, isSystemParticipant, isNpp
```

### Order
```
orderCode, ctvId, customerId, purchaseSubject,
status, totalAmount, basePoints, earnedPoints,
earnedMoney, commissionRate, depthLevel, policyKeyApplied
```

### Product
```
name, slug, price, salePrice, points, categorySlug, images, specs
```

---

## 7. BÀI HỌC LỖI THƯỜNG GẶP

| Lỗi | Nguyên nhân | Phòng tránh |
|---|---|---|
| `setSuccess is not a function` | Gọi hàm chưa khai báo useState | Mở file thật để verify state trước khi code (Drift Check) |
| Sửa nhầm file | wasypro vs wasypro-ctv | Xem Section 1 bảng File Location & verify đường dẫn thật |
| Lỗi kết nối máy chủ | JS error trong catch block | Dùng alert() thay vì state chưa có |
| CSRF 403 | Endpoint thiếu exempt | Check Section 4.3 |
| Build crash | Self-referencing const | Test build ngay sau khi sửa |
| Playwright ko navigate | Cookie cross-domain | Login trực tiếp trên domain đúng |

---

## 8. QUY TẮC KHI THÊM API MỚI ⭐⭐⭐⭐⭐

> 🛑 **MỖI KHI THÊM ENDPOINT MỚI** phải qua checklist này (từ bài học L33):

```
□ 1. Endpoint cần authenticateToken middleware?
     → Thêm: app.post('/api/xxx', authenticateToken, handler)
□ 2. Endpoint dùng cookie auth (credentials: include)?
     → PHẢI thêm vào CSRF exempt list (server/index.js line 62-90)
     → Nếu QUÊN → lỗi 'CSRF Token không khớp'
□ 3. Cập nhật SYSTEM_MAP.md section 4.3
□ 4. Cập nhật SYSTEM_MAP.md section 4.1/4.2
□ 5. Restart: pm2 restart happylife-backend
```

---


---

## 10. TEST.WASYPRO.COM — GOOGLE CLOUD VPS (STAGING)

> ⚠️ **TUYỆT ĐỐI KHÔNG ĐỤNG CODE CỦA WASYPRO.COM KHI SỬA TEST.WASYPRO.COM**

### 10.1 Thông tin kết nối

| Thuộc tính | Giá trị |
|---|---|
| **IP** | `34.173.189.105` |
| **SSH User** | `mapgovn` |
| **SSH Key** | `C:\Users\editor02\.ssh\vps_google` |
| **Sudo Password** | `Baoan1985&` |
| **Domain** | `test.wasypro.com` |
| **App Directory** | `/var/www/wasypro` |
| **Database** | SQLite (`/var/www/wasypro/server/dev.db`) |

### 10.2 PM2 Processes (Google VPS)

| PM2 ID | Tên | Port | Thư mục | Vai trò |
|---|---|---|---|---|
| 3 | `happylife-backend` | 3011 | `/var/www/wasypro/server` | Backend API |
| 1 | `wasypro` | 5005 | `/var/www/wasypro` | Landing + CTV Portal |
| 2 | `wasypro-ctv` | 5175 | `/var/www/wasypro-ctv` | CTV Portal (app riêng) |

### 10.3 Kiến trúc CTV Portal trên test.wasypro.com

CTV Portal phục vụ tại `https://test.wasypro.com/ctv` bởi app `wasypro` (PM2 id 1, port 5005).

```
src/
├── App.tsx                      ← Root component, route /ctv → CTVPortalContainer
├── index.css                    ← Global CSS (Inter font, overflow-x: hidden, Tailwind)
├── components/
│   ├── MobileLandingView.tsx     ← Trang chủ mobile (banner, video YouTube, sản phẩm, login button)
│   ├── auth/
│   │   └── UnifiedAuthModal.tsx  ← Login/Register modal (z-[9999])
│   ├── ctv/
│   │   ├── CTVPortalContainer.tsx  ← Container chính CTV (max-w-md, bottom nav, tabs)
│   │   ├── mockup/               ← Mockup components (design token chuẩn)
│   │   │   ├── MockupBottomNav.tsx  ← 5 tabs: Trang chủ, Đơn hàng, Hoa hồng, Đội nhóm, Thêm
│   │   │   ├── MockupCommissions.tsx
│   │   │   ├── MockupDashboard.tsx  ← Profile card, stats grid, promo banner
│   │   │   ├── MockupDrawer.tsx     ← Slide-out menu (320px, right)
│   │   │   ├── MockupHeader.tsx     ← Sticky header (64px main, 56px sub)
│   │   │   ├── MockupMore.tsx       ← Menu "Thêm" (Sơ đồ, KH, Bảng giá, TK, Đổi MK)
│   │   │   ├── MockupOrders.tsx     ← Tạo/xem đơn hàng
│   │   │   └── MockupRank.tsx       ← Cấp bậc & điểm
│   │   ├── views/                 ← Các subpage view (JSX)
│   │   │   ├── CustomersView.jsx    ← ⭐ Khách hàng (card-based, mobile-first, 2026-10-03)
│   │   │   ├── CommissionHistoryView.jsx
│   │   │   ├── CreateOrderModal.jsx ← Modal tạo đơn (62KB)
│   │   │   ├── DashboardView.jsx    ← Dashboard thống kê
│   │   │   ├── LoginView.jsx        ← Login page CTV
│   │   │   ├── MoreMenuView.jsx
│   │   │   ├── NetworkView.jsx      ← Sơ đồ tuyến dưới
│   │   │   ├── OrdersView.jsx       ← Danh sách đơn hàng
│   │   │   ├── PriceListView.jsx    ← Bảng giá & chiết khấu
│   │   │   ├── RankView.jsx         ← Chi tiết cấp bậc (25KB)
│   │   │   ├── SettingsView.jsx     ← Thông tin tài khoản
│   │   │   └── WholesaleOrdersView.jsx ← Đơn NPP
│   │   └── components/
│   │       ├── common/
│   │       │   └── PageHeader.jsx   ← Header chung subpage (cần cập nhật light theme)
│   │       ├── modals/
│   │       │   └── ChangePasswordModal.jsx
│   │       └── network/
│   └── admin/                    ← Admin panel components (22 files)
```

### 10.4 Design System (test.wasypro.com/ctv)

| Token | Giá trị | Dùng cho |
|---|---|---|
| Primary Blue | `#0072F5` | Active nav, buttons, CTA, profile card, links |
| Primary Dark | `#0052CC` | Dark button variant |
| Text Primary | `#0F172A` | Tiêu đề, text chính |
| Text Secondary | `#475569` | Body text |
| Text Muted | `#94A3B8` | Label, helper text |
| Page BG | `#F8FAFC` | Nền trang |
| Card BG | `#FFFFFF` | Nền card |
| Border | `#EEF2F6` | Viền card, divider |
| Success | `#00B050` | Nút xanh lá |
| Danger | `#ED4956` | Nút đỏ |
| Font | `Inter` | Fallback: `-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif` |
| Card radius | `18px` | Border-radius card chính |
| Button radius | `14px` | Border-radius nút |
| Button height | `48px` | Chiều cao nút chính |
| Max width | `max-w-md` (448px) | Container CTV |
| Page padding | `px-4` (16px) | Padding ngang |

### 10.5 Responsive Fixes Applied (2026-10-03)

| Layer | File | Fix |
|---|---|---|
| HTML `<meta>` | `index.html` | `viewport-fit=cover, maximum-scale=5` |
| Global CSS | `src/index.css` | `html, body { overflow-x: hidden; width: 100%; -webkit-text-size-adjust: 100% }` |
| App root | `src/App.tsx` | `overflow-x-hidden`, `maxWidth: 100%, width: 100%` |
| CTV container | `CTVPortalContainer.tsx` | `overflow-x-hidden`, inline `overflowX: hidden, maxWidth: 100%` |
| CTV `<main>` | `CTVPortalContainer.tsx` | `overflow-x-hidden w-full` |
| CustomersView | `CustomersView.jsx` | Thay `<table>` → card-based layout mobile-first |

### 10.6 Build & Deploy (Google VPS)

```powershell
$KEY = "C:\Users\editor02\.ssh\vps_google"

# SSH vào Google VPS
ssh -o StrictHostKeyChecking=no -i $KEY mapgovn@34.173.189.105

# Upload file
scp -o StrictHostKeyChecking=no -i $KEY <local_file> mapgovn@34.173.189.105:/var/www/wasypro/<path>

# Build + restart (trên VPS)
cd /var/www/wasypro && npx vite build
sudo -u mapsgo_vn pm2 restart 1    # wasypro frontend
sudo -u mapsgo_vn pm2 restart 3    # backend

# Restart CTV app riêng
sudo -u mapsgo_vn pm2 restart 2    # wasypro-ctv
```

### 10.7 Tài khoản Test

| Tài khoản | SĐT | Mật khẩu | Role | User ID |
|---|---|---|---|---|
| CTV mặc định | `0937353535` | `Matkhau@123` | ctv | U1001 |
| Admin chính | `0968616263` | (xem admin panel) | admin | - |
| Reset hệ thống | `0999999999` | (reserved) | admin | - |


## 9. REBUILD COMMANDS

```bash
# Sửa frontend wasypro (admin + landing)
cd /var/www/wasypro ; npx vite build ; pm2 restart wasypro

# Sửa frontend wasypro-ctv (CTV portal)
cd /var/www/wasypro-ctv ; npx vite build ; pm2 restart wasypro-ctv

# Sửa backend
pm2 restart happylife-backend

# Sửa CẢ HAI frontend + backend
cd /var/www/wasypro ; npx vite build ; cd /var/www/wasypro-ctv ; npx vite build ; pm2 restart wasypro wasypro-ctv happylife-backend

# Git commit
cd /var/www/wasypro ; git add -A ; git commit -m 'message' ; git push origin main
```


---

## 11. QUY CHUẨN KỸ THUẬT GIAO DIỆN MODAL / POPUP TOÀN HỆ THỐNG ⭐⭐⭐⭐⭐

> ⚠️ **BẢO VỆ VĨNH VIỄN — ÁP DỤNG CHO MỌI POPUP / MODAL / DIALOG HIỆN TẠI VÀ TƯƠNG LAI**  
> Khi tạo mới hoặc sửa đổi bất kỳ modal nào, Agent BẮT BUỘC tuân thủ khung kỹ thuật 3 tầng chuẩn này:

### 11.1 Cấu Trúc Khung 3 Tầng Chuẩn (Fixed 3-Tier Container)
```tsx
{/* 1. Backdrop Overlay (Căn giữa ổn định, có padding an toàn) */}
<div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
  {/* 2. Modal Card Frame (Khóa chiều cao max-h-[90dvh], flex-col) */}
  <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-[calc(100vw-24px)] sm:max-w-lg max-h-[90dvh] flex flex-col overflow-hidden my-auto shadow-2xl relative animate-in fade-in zoom-in duration-200">
    
    {/* TẦNG 1: STICKY HEADER (CỐ ĐỊNH 100%, KHÔNG CUỘN TRÔI) */}
    <div className="sticky top-0 z-50 px-4 py-3 sm:px-6 sm:py-3.5 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between shrink-0 shadow-2xs">
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        {/* Icon + Tiêu đề modal */}
        <h3 className="font-bold text-base text-gray-800 truncate">Tiêu Đề Modal</h3>
      </div>
      {/* NÚT ĐÓNG [X] CHUẨN CÔNG THÁI HỌC (MIN 36x36px, BẤM DỄ, KHÔNG BAO GIỜ BỊ CHE) */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 flex items-center justify-center transition-all cursor-pointer shrink-0"
      >
        <X className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>

    {/* TẦNG 2: SCROLLABLE BODY (CHỈ CUỘN RIÊNG VÙNG NỘI DUNG NÀY) */}
    <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1">
      {/* Toàn bộ nội dung form, trường nhập liệu, danh sách dữ liệu */}
    </div>

    {/* TẦNG 3: STICKY FOOTER (NẾU CÓ NÚT HÀNH ĐỘNG/LƯU) */}
    <div className="sticky bottom-0 z-40 px-4 py-3 sm:px-6 sm:py-3 bg-gray-50/95 backdrop-blur-md border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
      {/* Nút Hủy / Lưu / Xác nhận */}
    </div>
  </div>
</div>
```

### 11.2 Điều Cấm Kỹ Thuật (Negative Constraints)
1. ❌ **CẤM**: Không dùng `position: fixed` cho nút `[X]` (gây bay lệch tọa độ, vỡ viewport mobile, bị đè bởi tai thỏ / status bar).
2. ❌ **CẤM**: Không đặt nút `[X]` trôi nổi `absolute` trong vùng body cuộn (khi cuộn form dài, nút X sẽ bị trôi mất).
3. ❌ **CẤM**: Không dùng chiều cao cố định hoặc vượt quá màn hình (`h-[800px]`, `h-full`); Bắt buộc dùng `max-h-[90dvh]` kết hợp `flex flex-col` và `overscroll-contain`.
4. ❌ **CẤM**: Không để chiều rộng dính sát mép (`w-full` không có margin/padding); Bắt buộc có padding an toàn `p-3 sm:p-4` và `max-w-[calc(100vw-24px)]`.

### 11.3 Checklist Kiểm Thử Trước Khi Bàn Giao
- [ ] Mở modal trên thiết bị di động (Mobile Viewport: 375x667 và 390x844).
- [ ] Cuộn nội dung form xuống tận đáy: Nút `[X]` vẫn phải hiển thị cố định 100% ở góc trên bên phải và bấm đóng được ngay.
- [ ] Không xuất hiện thanh cuộn ngang (`overflow-x`).
- [ ] Nút `[X]` có vùng chạm tối thiểu $\ge 36\text{px} \times 36\text{px}$.

## 12. QA Testing Protocol (BẮT BUỘC trước khi báo PASS)

### Quy tắc:
- KHÔNG BAO GIỜ báo PASS nếu chưa chụp screenshot từng bước
- Dùng Playwright test trên máy local, chụp ảnh TỪNG tính năng
- Test cả Mobile (390x844) VÀ Desktop (1440x900)

### Checklist tối thiểu:
1. T01: Mobile homepage (banner không zoom)
2. T03: Mobile menu drawer (mở/đóng)
3. T06: Auth modal (đăng nhập/đăng ký)
4. T07: Input focus trên mobile (KHÔNG bị zoom)
5. T10: Product QuickView modal
6. T11: Nút Đặt Mua Ngay trong QuickView (PHẢI hoạt động)
7. T13: Nút MUA NGAY trực tiếp trang chủ
8. T18: Contact modal
9. T19: Checkout modal
10. T02: Desktop homepage
11. T14: Desktop products page
12. T17: Footer (social icons)

### Lỗi thường gặp cần check:
- Background overlay chặn pointer events (z-index)
- Prop name mismatch giữa parent/child component
- Input font-size < 16px gây iOS auto-zoom
- viewport meta maximum-scale > 1 cho phép zoom


### QUY TẮC HOA HỒNG TRỰC TIẾP VÀ ĐỒNG HÀNH (F0 - F1 - KHÁCH)
### 6.1. QUY TẮC PHÂN PHỐI HOA HỒNG TRỰC TIẾP & ĐỒNG HÀNH (F0 - F1 - KHÁCH HÀNG) ⭐⭐⭐⭐⭐
- **Nguyên lý cốt lõi**:
  1. **Khách hàng CHƯA CÓ UID (chưa có BID) mua qua giới thiệu của F1 (hoặc F1 tự mua hàng)**:
     - Đơn hàng này được xem là **doanh số bán lẻ trực tiếp của F1** (vì khách chưa có mã kinh doanh, công sức bán hàng hoàn toàn do F1 phụ trách).
     - **F1 (Người bán trực tiếp - đã có UID)**: Hưởng hoa hồng bán lẻ trực tiếp theo cấp bậc:
       + Đại sứ (Ambassador): **20%**
       + Trưởng nhóm (Manager): **25%**
       + Quản lý (Director): **30%**
     - **F0 (Người bảo trợ trực tiếp của F1 - đã có UID)**: Vì F1 là tuyến dưới trực tiếp tạo ra doanh số nên F0 được hưởng hoa hồng đồng hành tuyến F1 là **10%** (D1 Upstream).
     - **Tuyến trên của F0 (nếu có)**: Hưởng hoa hồng đồng hành tuyến F2 là **5%** (D2 Upstream).
     - **Tuyệt đối không dùng cờ `priorBusinessId` của khách hàng để chặn hoa hồng 10% của F0 và 5% của tuyến trên**! Chỉ cần F1 (người tạo đơn) đã có UID là F0 và tuyến trên được hưởng đầy đủ.
  2. **Khách hàng ĐÃ CÓ UID (đã là Đại sứ/CTV có mã) tự mua hàng**:
     - Khách hàng hưởng chiết khấu tự mua cá nhân (`SELF` 20% - 30% tùy cấp bậc).
     - **F1 (Người tuyển/bảo trợ trực tiếp của khách)**: Hưởng hoa hồng trực tiếp thành viên có ID `DIRECT_WITH_ID` = **10%**.
     - **F0 (Bảo trợ của F1, tức tầng 2 phía trên khách)**: Hưởng hoa hồng đồng hành gián tiếp `UPSTREAM_D2` = **5%**.
     - **Tuyến trên của F0**: Không nhận (đảm bảo luật Depth Invariant: tối đa 2 cấp bảo trợ phía trên người có UID).
