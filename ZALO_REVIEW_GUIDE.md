# ZALO REVIEW GUIDE — WasyPro

> Tài liệu này hướng dẫn quy trình bật/tắt Zalo Reviewer bypass
> mỗi khi cần submit tính năng mới lên Zalo Mini App.

---

## Tài khoản Zalo Reviewer (3 số)
`
0831111111  — Zalo Reviewer 1
0768068594  — Zalo Reviewer 2
0768068930  — Zalo Reviewer 3
`

---

## KHI NÀO CẦN BẬT REVIEWER BYPASS?
- Submit tính năng mới lên Zalo Mini App
- Zalo duyệt Mini App lần đầu hoặc cập nhật
- Test trên domain mới (wasypro.com sau khi chuyển)

---

## BƯỚC 1: BẬT reviewer bypass (trước khi submit Zalo)

### 4 file cần uncomment:

**File 1: src/App.tsx** (dòng 3-8)
`
// Bỏ comment block ZALO_REVIEWER_BYPASS
// Xóa dòng: const isReviewerPhone = (_phone?: string | null): boolean => false;
`

**File 2: src/components/CheckoutModal.tsx** (dòng 19-24)
`
// Bỏ comment block ZALO_REVIEWER_BYPASS
// Xóa dòng: const isReviewerPhone = (_phone?: string | null): boolean => false;
`

**File 3: src/components/MobileLandingView.tsx** (dòng 2-8)
`
// Bỏ comment block ZALO_REVIEWER_BYPASS
// Xóa dòng: const isReviewerPhone = (_phone?: string | null): boolean => false;
`

**File 4: src/components/Header.tsx** (dòng 2-8)
`
// Bỏ comment block ZALO_REVIEWER_BYPASS
// Xóa dòng: const isReviewerPhone = (_phone?: string | null): boolean => false;
`

### Sau đó build lại:
`ash
cd /var/www/wasypro
npm run build
pm2 restart wasypro wasypro-ctv
`

### Tạo lại tài khoản reviewer trong DB (nếu đã bị xóa):
`ash
cd /var/www/wasypro/server
node setup_zalo_review_users.cjs.ARCHIVED_ZALO_REVIEW
`

### Bật domain trong Zalo Developer Console:
- Vào: developers.zalo.me → Mini App → Cấu hình API Domains
- Bật: https://test.wasypro.com (khi test)
- Bật: https://wasypro.com (khi production)

---

## BƯỚC 2: TẮT reviewer bypass (sau khi Zalo duyệt xong)

Chạy lệnh Antigravity:
>  Comment out Zalo reviewer bypass code và build lại

Antigravity sẽ tự động:
1. Comment isReviewerPhone trong 4 file → () => false
2. Build lại
3. Restart frontend

---

## KHI CHUYỂN SANG wasypro.com (production)

### Checklist bổ sung:
- [ ] Zalo Developer Console → thêm https://wasypro.com → BẬT
- [ ] Bật reviewer bypass cho wasypro.com
- [ ] Test Zalo Mini App flow trên wasypro.com
- [ ] Sau khi Zalo duyệt → Tắt reviewer bypass
- [ ] Build final cho wasypro.com

---

## Lịch sử review
| Ngày | Domain | Tính năng | Kết quả |
|------|--------|-----------|---------|
| 2026-10-15 | test.wasypro.com | Mini App initial | ✅ PASS |
| — | wasypro.com | Chuyển production | 🔜 Pending |

