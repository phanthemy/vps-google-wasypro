# WasyPro — Changelog

> Lịch sử cập nhật dự án. Mỗi session ghi nhận các thay đổi quan trọng.

## 2026-09-30

### Fix
- **NPP Combo chỉ hiện máy lọc nước** — Filter `title startsWith 'Máy'` + `categoryId IN (cat-01, cat-02)`, loại bỏ linh kiện/phụ kiện. Frontend + Backend. (`71607ce`)
- **F0 hiện sai trong Admin Tạo Đơn** — Thêm `networkParent` resolve từ `User.parentId` thay vì dùng `Customer.sourceCtvId` (trỏ chính mình khi CTV self-purchase). (`431e2be`)
- **NppCommission thiếu trong Kỳ Hoa Hồng** — Gán `periodId` khi tạo NppCommission + merge NppCommission vào API `/api/admin/periods/:id/commissions`. Fix data cũ periodId=null. (`ade49e4`)
- **JSDoc comment block nuốt 6 API** — Thêm `*/` đóng comment. (`dd7269f`)
- **NPP Ref Link hiện cho NPP chưa kích hoạt** — Chỉ hiện khi có `businessId`. (`3921409`)
- **CTV Ref Link hiện cho CTV chưa kích hoạt** — Tương tự NPP fix. (`3921409`)
- **Smart Create Order Modal** — Auto-load sponsor, required address, auto-fill phone. (`fcd9c7d`)
- **Nginx uploads location** — Thêm `/uploads/` serve static files. (`dd7269f`)

### Feature
- **Admin Order Management** — 6 API endpoints + 3 modals (tạo đơn, gán CTV, lịch sử). (`0729a81`)

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

### Docs
- **Sync AI Workflow to Git** — .agents/rules/project-workflow.md (`5149efd`)
- **Expand Startup Checklist** — AGENTS.md 6 → 13 steps
- **Create changelog.md**

### Fix
- **Product images 404** — Mount `../uploads` vào Express static (`e43cefd`)

## 2026-09-25

### Fix
- **APPROVED NPP tab** — Thêm APPROVED vào visibility list (`91bdebe`)
- **Factory Reset NPP** — Thêm 6 bảng NPP (`7e8e0e3`, `3d76394`, `15afbc9`)
- **NPP package sort** — Sắp xếp theo code (`a48c377`)
- **Avatar 404** — Nginx thiếu proxy `/uploads/`
- **Vietnamese font mojibake** — 21 text replacements (`aa0a638`, `440e5da`)
- **TreeNode rank** — MEMBER thay vì AMBASSADOR cho user chưa có rank (`ee09106`)

## 2026-09-23–24

### Fix
- **Referral code** — Backend accepts both `refCode` AND `referralCode` (`aa24fe1`)
- **my-discount userId** — `req.user.id` → `req.user.dbId` (`4c31d06`)
- **NPP tab visibility** — Systemic check nppStatus (`62c49a1`)
- **SettingsView NPP** — Ẩn CP progress cho NPP user (`4190a26`)
- **CreateOrderModal** — 3 chế độ Combo/CK/Retail (`16abcd1` → `bc80fac`)

### Feature
- `GET /api/npp/my-combo` endpoint (`4c31d06`)

## 2026-09-21

### Feature
- **NPP Phase 3.2.1** — Registration + Activation Foundation

## 2026-09-12

### Fix
- **React Hooks violation** — Sập trắng trang khi bấm MUA NGAY
- **ErrorBoundary.tsx** — Tích hợp error boundary
- **Pre-BID threshold-crossing** — Gia cố logic

### Test
- E2E test qua CDP — PASS
- `test_threshold_4000_500_1000.cjs` — PASS 100%
