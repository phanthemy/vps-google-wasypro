# 🐛 Error Log (Nhật ký lỗi) WASY PRO

> File này ghi lại tất cả lỗi gặp phải trong quá trình phát triển dự án.
> Format: `[YYYY-MM-DD HH:mm] [SubAgent] Mô tả lỗi → Cách fix`

---

## Lỗi chưa fix

| # | Thời gian | Sub-Agent | Mô tả lỗi | Mức độ |
|---|-----------|-----------|-----------|--------|

---

## Lỗi đã fix

| # | Thời gian | Sub-Agent | Mô tả lỗi | Cách fix |
|---|-----------|-----------|-----------|----------|

---

## [2026-09-03] BUG: app.wasypro.com gi?t li?n t?c nh? b? F5

### Observe
- User b?o c?o: app gi?t/reload li?n t?c khi v?o app.wasypro.com

### Hypothesis
- Vite HMR (Hot Module Replacement) g?p l?i PARSE khi transform file JSX ? crash ? t? reload ? v?ng l?p v? t?n

### Evidence (B?ng ch?ng g?c)
```
28|wasypro | [PARSE_ERROR] Error: Unexpected token
??[ src/components/common/WholesalePricePreview.jsx:9:22 ]
9 ? <div className=p-4 text-center text-secondary text-sm>
                    ??? Unexpected token

28|wasypro | [PARSE_ERROR] Error: Expected `}` but found `Identifier`
??[ src/components/common/CommissionRuleTag.jsx:70:30 ]

28|wasypro | [PARSE_ERROR] fetch(/api/rank/ambassador/check/)
??[ src/components/common/AmbassadorProgressCard.jsx:13:16 ]
```

### Root Cause
Trong session Phase 2B, t?i b??c verification, regex Python fix `className` unquoted ?? ch?y tr?n git source dir (`/var/www/wasypro/wasypro-ctv/src/`). Sau ?? agent ?? rewrite 3 file clean + rsync sang runtime dir, nh?ng l?n sync **cu?i** (d?ng `rsync --delete`) ch? sync ???c m?t ph?n ? file l?i c? trong runtime dir v?n c?n t?n t?i v? timestamp kh?ng ??i (rsync d?ng size+time ?? so s?nh).

### Fix (Step 4)
1. Rewrite s?ch 3 file component: `AmbassadorProgressCard.jsx`, `CommissionRuleTag.jsx`, `WholesalePricePreview.jsx` ? kh?ng d?ng regex, vi?t tay JSX chu?n
2. `rsync -av --delete /var/www/wasypro/wasypro-ctv/src/ /var/www/wasypro-ctv/src/`
3. `pm2 restart wasypro-ctv`

### Test (Step 5 ? Evidence sau fix)
- 8/8 file VITE_OK (Vite transform ? JS h?p l?, b?t ??u b?ng `import`)
- 8/8 file MATCH (runtime == git source, diff r?ng)
- PM2 uptime: 16m li?n t?c, restarts=5 (kh?ng t?ng), unstable restarts=0
- Error log: l?i cu?i c?ng timestamp `11:45:57 AM` ? tr??c khi restart l?c `14:35`
- Kh?ng c? PARSE_ERROR m?i sau 15 gi?y theo d?i

### Deploy (Step 6)
- Kh?ng c?n commit ri?ng ? file ?? tr?ng v?i git source (diff r?ng)
- wasypro-ctv PM2 online, HTTP 200

### Document (Step 7) ? File n?y

### Gotcha (Pattern ?? tr?nh l?n sau)
> ?? Khi d?ng Python regex ?? fix className h?ng lo?t, B?T BU?C:
> 1. Ch?y `npm run build` ngay sau regex fix ?? ph?t hi?n l?i s?m
> 2. KH?NG tin v?o "Vite ready" trong log l? b?ng ch?ng ?? ? ph?i curl t?ng file ?? Vite th?c s? transform
> 3. Sau rsync, verify b?ng `diff` hai chi?u tr??c khi k?t lu?n ??ng b?

---

## [2026-09-03] BUG TH?T S?: app.wasypro.com F5 v? t?n (Infinite Reload Loop)

### Root Cause Th?t S?
`main.jsx` c? global fetch interceptor. Khi API tr? 401:
```javascript
if (response.status === 401 && !url.includes('/api/auth/login')) {
    localStorage.removeItem('crm_user');
    window.location.reload(); // ? BUG: g?y reload loop
}
```
Session h?t h?n ? 401 ? reload ? session v?n h?t ? 401 ? reload ? v?ng l?p v? t?n.

### Nguy?n nh?n B? Che Khu?t
T?i ?? ?i sai h??ng 2 ti?ng v?:
1. Ngh? do Vite HMR (??ng 1 ph?n, nh?ng kh?ng ph?i root cause ch?nh)
2. Ngh? do Service Worker (kh?ng ph?i)
3. Ngh? do watch.ignored Vite config (kh?ng ph?i)
Root cause th?t n?m trong `main.jsx` ? ch? t?m ra khi ??c nginx access log ? th?y pattern GET/ + 401 l?p l?i ? trace v?o built JS bundle.

### Fix
```javascript
// main.jsx - TR??C (BUG)
window.location.reload();

// main.jsx - SAU (FIX)
window.dispatchEvent(new CustomEvent('session-expired'));

// App.jsx - Th?m handler
useEffect(() => {
    const handler = () => setCurrentUser(null);
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
}, []);
```

### Lesson Learned
> ?? Khi app F5/reload v? t?n: LU?N ki?m tra nginx access log tr??c.
> Pattern `GET / 200` ? `GET /api/xxx 401` ? `GET / 200` l?p l?i = reload loop do 401 handler.
> Commit: 6f3c599

### Lỗi #2026-09-04: Lệch trạng thái session Admin và thiếu menu Hệ Thống trên Header
- **Nguyên nhân:** Sau khi login admin, state `user` chỉ tồn tại trong context Unified Auth nhưng chưa được map tự động sang state `adminUser` của CMS. Đồng thời Header chưa phân tách rõ 2 luồng "Kinh Doanh" (CTV) và "Hệ Thống" (Admin/CMS).
- **Khắc phục:** 
  1. Header bổ sung điều kiện `(!user || isAdmin)` cho nút "🛡️ HỆ THỐNG".
  2. Bổ sung hook `useEffect` trong `App.tsx` tự động gán `adminUser` khi `user.role === 'admin'`.
  3. Hỗ trợ prop `mode: 'ctv' | 'system'` trong `UnifiedAuthModal` để hiển thị đúng ngữ cảnh đăng nhập.
- **Trạng thái:** Đã fix và kiểm thử PASS 100%.
