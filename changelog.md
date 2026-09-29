# WasyPro — Changelog

> Lịch sử cập nhật dự án. Mỗi session ghi nhận các thay đổi quan trọng.

## 2026-09-29

- **Cấu hình chiết khấu tự mua & hoa hồng bán khách động theo cấp bậc (20%, 25%, 30%)**:
  - Khắc phục lỗi hardcode 20% trong modal tạo đơn (`CreateOrderModal.jsx`) và backend (`server/index.js`).
  - Áp dụng đúng cấu hình hệ thống:
    - **Đại sứ (Ambassador)**: Tự mua giảm 20% | Bán khách chưa ID: Hoa hồng 20%
    - **Trưởng nhóm (Manager)**: Tự mua giảm 25% | Bán khách chưa ID: Hoa hồng 25%
    - **Quản lý (Director)**: Tự mua giảm 30% | Bán khách chưa ID: Hoa hồng 30%
    - **Khách đã có Business ID**: Hoa hồng 10% cho tất cả các cấp
  - Cập nhật API `GET /api/customers` trả về thông tin `linkedUser` (kèm BID, rank) để modal phân biệt chính xác khách có ID / chưa có ID.
- **Phân tách luồng Đăng ký & Khóa bảo trợ link ref**:
  - Khách vãng lai: Ẩn mã ref và tùy chọn CTV/NPP, hiển thị CTA Box liên hệ Zalo OA & Hotline 1900 989878 để xin cấp mã.
  - Khách qua link ref `?ref=U1xxx`: Khóa cứng mã giới thiệu (readOnly + icon 🔒), hiện đầy đủ tùy chọn CTV & NPP.
  - Backend: Chặn đăng ký CTV/NPP nếu không có mã bảo trợ hợp lệ (HTTP 400).
- **Khóa tài khoản bất biến Nguyễn Đức Quang (0968616263 / U1001)** trong Factory Reset và User Delete.

## 2026-09-26

### Docs (evening session)
- **Sync AI Workflow to Git** u2014 Add .agents/rules/project-workflow.md to repo (5149efd)
- **Expand Startup Checklist** u2014 AGENTS.md 6 u2192 13 steps
- **Create changelog.md** u2014 History from 2026-09-12 to 2026-09-26
- **AGENTS.md bootstrap only** u2014 project-workflow.md = SSOT for AI Playbook

### Fix
- **Product images 404** — Mount `../uploads` vào Express static + thêm placeholder `water-king-pro-9.jpg` (`e43cefd`)
- Update memory.md và loi.md (`e0e00ea`)

## 2026-09-25

### Fix
- **APPROVED NPP tab** — Thêm APPROVED vào visibility list (`91bdebe`)
- **Factory Reset NPP** — Thêm 6 bảng NPP vào Factory Reset (`7e8e0e3`, `3d76394`, `15afbc9`)
- **NPP package sort** — Sắp xếp theo code NPP-001→002 (`a48c377`)
- **Avatar 404** — Nginx thiếu proxy `/uploads/`
- **Vietnamese font mojibake** — Sửa 21 text replacements (`aa0a638`, `440e5da`)
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
  - +NppRegistration, +NppActivation models in Prisma
  - +7 new APIs, 4 modified package APIs
  - AdminNppPackages: PackageType selector
  - AdminNppManagement: Registration list + Activation history + Admin Grant

## 2026-09-12

### Fix
- **React Hooks violation** — Sập trắng trang khi bấm MUA NGAY (ContactModal.tsx & ProductQuickViewModal.tsx)
- **ErrorBoundary.tsx** — Tích hợp error boundary
- **Pre-BID threshold-crossing** — Gia cố logic trong server/index.js

### Test
- E2E test qua CDP — PASS
- `test_threshold_4000_500_1000.cjs` — 4000+500+1000 CP => 1050 CP (PASS 100%)
