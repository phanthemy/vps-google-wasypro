# SYSTEM_MAP.md — Bản Đồ Kỹ Thuật WasyPro
> ⚠️ **ĐỌC FILE NÀY TRƯỚC KHI SỬA BẤT KỲ CODE NÀO**
> Cập nhật lần cuối: 2026-10-02 | Commit: e05915b

---

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
| `setSuccess is not a function` | Gọi hàm chưa khai báo useState | Grep `useState` trước khi code |
| Sửa nhầm file | wasypro vs wasypro-ctv | Xem Section 1 bảng File Location |
| Lỗi kết nối máy chủ | JS error trong catch block | Dùng alert() thay vì state chưa có |
| CSRF 403 | Endpoint thiếu exempt | Check Section 4.3 |
| Build crash | Self-referencing const | Test build ngay sau khi sửa |
| Playwright ko navigate | Cookie cross-domain | Login trực tiếp trên domain đúng |

---

## 8. REBUILD COMMANDS

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
