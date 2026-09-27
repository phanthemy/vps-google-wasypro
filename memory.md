# WasyPro — Memory Log

## Cập nhật: 2026-09-27

### Phiên 27/09/2026

#### Đã làm:
1. **Setup test.wasypro.com trên Google Cloud VPS** — Thêm Nginx server block cho test.wasypro.com → port 5005 (frontend) + /api/ → port 3011 (backend). Thêm http/https test.wasypro.com vào CORS productionOrigins. Restart backend PM2. (commit `2116fbd`)
2. **Tổng hợp tính năng dự án** — Đọc toàn bộ code trên VPS, tạo báo cáo 11 nhóm tính năng (130 API, 37 models, 67 components)

#### Ghi chú:
- DNS test.wasypro.com đã trỏ về IP 34.173.189.105 (Google Cloud VPS)
- wasypro.com production đang chạy trên Oracle VPS (149.118.62.155)
- test.wasypro.com dùng để test song song với production

### Nginx config (Google Cloud VPS):
- `wasypro.com` → port 5005
- `app.wasypro.com` → port 5175 (legacy)
- `test.wasypro.com` → port 5005 (test)
- `/api/` → port 3011


## Cập nhật: 2026-09-26
### Phiên 26/09/2026 tối (22:18 - 22:35)

#### Đã làm:
1. **Đồng bộ AI Workflow vào Git** — .agents/rules/project-workflow.md chưa bao giờ được commit. Upload lên VPS và git add (commit `5149efd`)
2. **Mở rộng Startup Checklist** — AGENTS.md từ 6 bước lên 13 bước. Thêm: project-workflow.md, memory.md, loi.md, changelog.md, git state check, Plan Resume
3. **Tạo changelog.md** — Lịch sử cập nhật từ 2026-09-12 đến 2026-09-26
4. **AGENTS.md chỉ bootstrap** — project-workflow.md là SINGLE SOURCE OF TRUTH cho AI Engineering Playbook
5. **Push GitHub** — máy B/C git pull sẽ nhận đầy đủ workflow

#### Quyết định kỹ thuật:
- AGENTS.md = bootstrap file, KHÔNG copy toàn bộ playbook vào
- project-workflow.md = SSOT cho quy trình AI
- 8/8 workflow files đều Git tracked
- SSH key: oracle_wasypro.key / user ubuntu (không phải root)

---

## Cập nhật: 2026-09-25

### Phiên 25/09/2026 (08:13 - 10:47)

#### Đã làm:
1. **Fix APPROVED NPP tab** — NPP user status APPROVED không thấy tab Gói NPP → thêm APPROVED vào visibility list (commit `91bdebe`)
2. **Factory Reset bổ sung NPP** — Thêm 6 bảng NPP vào Factory Reset: NppCommission, NppPayment, NppPurchaseItem, NppPurchase, NppActivation, NppRegistration. Giữ NppPackage + NppPackageItem (commit `7e8e0e3`, `3d76394`)
3. **Factory Reset UI** — Cập nhật giao diện admin hiển thị NPP trong danh sách xóa/giữ (commit `15afbc9`)
4. **Sort gói NPP** — Sắp xếp theo code (NPP-001 → NPP-002...) trong tất cả admin views (commit `a48c377`)
5. **Fix avatar không hiển thị** — Nginx thiếu proxy `/uploads/` → ảnh 404. Thêm location `/uploads/` + thêm `wasypro.com` vào server_name + xóa .bak conflict
6. **Fix font tiếng Việt** — AdminMembersView.tsx viết không dấu + mojibake â€" → sửa toàn bộ 21 text replacements (commit `aa0a638`, `440e5da`)

#### KHÔNG sửa (đọc logic):
- "Nâng lên CTV" chỉ set isSystemParticipant=true. KHÔNG cấp rank/businessId. Rank AMBASSADOR + BID WK-XXXXX chỉ được cấp TỰ ĐỘNG khi qualifyingPoints >= 5000 CP (AMBASSADOR_THRESHOLD).

### Phiên 23-24/09/2026

#### Backend fixes:
- Referral code bug: backend accepts both `refCode` AND `referralCode` (commit `aa24fe1`)
- my-discount userId bug: `req.user.id` → `req.user.dbId` (commit `4c31d06`)
- API `GET /api/npp/my-combo` endpoint (commit `4c31d06`)

#### Frontend fixes:
- NPP tab systemic fix: chỉ hiện cho APPROVED/PURCHASING/PAID/ACTIVE (commit `62c49a1`)
- SettingsView NPP vs CTV: ẩn CP progress cho NPP user (commit `4190a26`)
- CreateOrderModal combo mode: 3 chế độ Combo/CK/Retail (commits `16abcd1` → `bc80fac`)

#### Data fixes:
- U958 Dai Su 01: isNpp=0 (không phải NPP)
- U509, TEST_UA: isNpp=0
- U828 (Phan Thế Mỹ): NPP thật duy nhất

---

## Quy tắc quan trọng

### Source of Truth
- VPS: `/var/www/wasypro/` — Oracle VPS `149.118.62.155`
- GitHub: backup only

### NPP Tab Visibility
```
PENDING → ẩn (chưa duyệt)
APPROVED → hiện (cần mua gói)
PURCHASING → hiện
PAID → hiện
ACTIVE → hiện
```

### req.user structure
```js
req.user = { id: "U199", userId: "U199", dbId: cuid, role, fullName, phone }
```
- NppPurchase.userId = cuid → dùng `req.user.dbId`

### Factory Reset
- Xóa: 26 bảng (Orders, Users non-admin, Commission, NPP data...)
- Giữ: Product, NppPackage, SystemPolicyConfig, Admin users
- Admin users: reset points/rank/isNpp, giữ account

### Rank Logic (CTV)
- isSystemParticipant=true → là CTV
- CP tích lũy từ đơn hàng
- CP >= 5000 (AMBASSADOR_THRESHOLD) → tự động rank AMBASSADOR + Business ID WK-XXXXX
- KHÔNG cấp rank khi promote, chỉ khi đủ CP

### Nginx
- `/uploads/` proxy → backend port 3011
- `wasypro.com` + `wasypro.nextapp.vn` → port 5005 (admin+landing)
- `app.wasypro.com` → port 5175 (CTV portal)
- API `/api/` → port 3011

### Tránh
- sed trên server/index.js → dùng Python
- PowerShell inline quotes → dùng .sh scripts
- BigInt() parse formatted numbers → strip dots
- Báo cáo xong mà chưa test thật
