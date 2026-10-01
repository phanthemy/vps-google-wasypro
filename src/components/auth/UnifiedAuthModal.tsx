import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Shield,
  MessageCircle,
  Users,
  Gift,
  ArrowRight,
  Loader2,
  Info,
  PhoneCall
} from 'lucide-react';

interface UserSession {
  id: string;
  fullName: string;
  phone: string;
  role?: string;
  [key: string]: any;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  mode?: 'ctv' | 'system';
  referralCode?: string;
  onSuccess: (user: UserSession) => void;
}

export default function UnifiedAuthModal({
  isOpen,
  onClose,
  initialTab = 'register',
  referralCode = '',
  onSuccess,
}: Props) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Login Form State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regOtp, setRegOtp] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // OTP State
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Referral code resolution
  const getLiveUrlRef = () => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    const u = params.get('ref') || params.get('refCode') || params.get('referral');
    if (u && u.trim()) return u.trim().toUpperCase();
    return '';
  };

  const liveRef = getLiveUrlRef();
  const effectiveRefCode = liveRef || (referralCode ? referralCode.trim().toUpperCase() : '');
  const hasReferral = Boolean(effectiveRefCode);
  const allowRegister = hasReferral || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('register') === '0937353535');
  const [regRefCode, setRegRefCode] = useState(effectiveRefCode);

  // CTV / NPP Registration Options
  const [regRole, setRegRole] = useState<'ambassador' | 'npp' | 'capital'>('ambassador');
  const [wantNpp, setWantNpp] = useState(false);
  const [nppPackages, setNppPackages] = useState<any[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [loadingPackages, setLoadingPackages] = useState(false);

  // Fetch NPP packages on mount (for both NPP and Capital options)
  useEffect(() => {
    if (!isOpen) return;
    setLoadingPackages(true);
    fetch('/api/npp/packages/available-public').then(r => r.json()).then(d => {
      if (d.success && Array.isArray(d.data)) setNppPackages(d.data);
      else setNppPackages([]);
    }).catch(() => setNppPackages([])).finally(() => setLoadingPackages(false));
  }, [isOpen]);

  const formatVND = (v: number) => {
    if (!v) return '0đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
  };
  const rankLabel = (r: string) => ({ AMBASSADOR: 'Đại sứ', MANAGER: 'Trưởng nhóm', DIRECTOR: 'Quản lý' } as any)[r] || r;

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (effectiveRefCode) {
      setRegRefCode(effectiveRefCode);
    }
  }, [effectiveRefCode, isOpen]);

  // Cooldown timer for OTP
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const switchTab = (t: 'login' | 'register') => {
    setTab(t);
    setError('');
    setSuccessMsg('');
  };

  // Handle Send OTP
  const handleSendOtp = async () => {
    if (!regPhone || !regPhone.trim()) {
      setError('Vui lòng nhập số điện thoại trước khi lấy mã OTP.');
      return;
    }
    const cleanPhone = regPhone.trim().replace(/\s+/g, '');
    const phoneRegex = /^(0|84)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError('Số điện thoại không đúng định dạng di động Việt Nam.');
      return;
    }

    setOtpLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, refCode: regRefCode || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpCooldown(data.cooldown || 120);
        setSuccessMsg(data.message || 'Mã xác thực đã được gửi qua Zalo.');
      } else {
        if (data.cooldown) setOtpCooldown(data.cooldown);
        setError(data.message || 'Không thể gửi mã OTP.');
      }
    } catch {
      setError('Lỗi kết nối máy chủ khi gửi OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ─── LOGIN SUBMIT ───
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone.trim(), password: loginPassword }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.data) {
        // NPP registration if selected
        if ((regRole === 'npp' || regRole === 'capital') && selectedPackageId) {
          try {
            const nppRes = await fetch('/api/npp/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ packageId: selectedPackageId }),
              credentials: 'include',
            }).then(r => r.json());
            if (!nppRes.success) console.warn('[NPP Register]', nppRes.message);
          } catch (e) { console.error('[NPP Register error]', e); }
        }
        onSuccess(data.data);
        onClose();
      } else {
        setError(data.message || 'Số điện thoại hoặc mật khẩu không chính xác.');
      }
    } catch {
      setError('Lỗi kết nối tới máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  // ─── REGISTER SUBMIT ───
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (!regFullName.trim()) {
      setError('Vui lòng nhập họ và tên của bạn.');
      setLoading(false);
      return;
    }
    if (!regPhone.trim()) {
      setError('Vui lòng nhập số điện thoại.');
      setLoading(false);
      return;
    }
    if (!regOtp.trim()) {
      setError('Vui lòng nhập mã xác thực OTP gửi từ Zalo.');
      setLoading(false);
      return;
    }
    if (!regPassword || regPassword.length < 8) {
      setError('Mật khẩu phải có tối thiểu 8 ký tự.');
      setLoading(false);
      return;
    }
    const hasLower = /[a-z]/.test(regPassword);
    const hasUpper = /[A-Z]/.test(regPassword);
    const hasNumber = /[0-9]/.test(regPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(regPassword);
    if (!hasLower || !hasUpper || !hasNumber || !hasSpecial) {
      setError('Mật khẩu phải bao gồm: chữ thường, chữ HOA, số và ký tự đặc biệt (VD: Wasy@2026).');
      setLoading(false);
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      setLoading(false);
      return;
    }
    if ((regRole === 'npp' || regRole === 'capital') && !selectedPackageId) {
      setError(regRole === 'npp' ? 'Vui lòng chọn một gói NPP.' : 'Vui lòng chọn một gói Cổ đông.');
      setLoading(false);
      return;
    }

    try {
      const body: any = {
        fullName: regFullName.trim(),
        phone: regPhone.trim(),
        password: regPassword.trim(),
        otp: regOtp.trim(),
        referralCode: regRefCode?.trim() || undefined,
        joinSystem: true, // All 3 programs (ambassador/npp/capital) join CTV system
        registerNpp: (regRole === 'npp' || regRole === 'capital') || undefined,
        nppPackageId: (regRole === 'npp' || regRole === 'capital') ? selectedPackageId : undefined,
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success && data.data) {
        // NPP registration if selected
        if ((regRole === 'npp' || regRole === 'capital') && selectedPackageId) {
          try {
            const nppRes = await fetch('/api/npp/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ packageId: selectedPackageId }),
              credentials: 'include',
            }).then(r => r.json());
            if (!nppRes.success) console.warn('[NPP Register]', nppRes.message);
          } catch (e) { console.error('[NPP Register error]', e); }
        }
        onSuccess(data.data);
        onClose();
      } else if (data.success) {
        setSuccessMsg(data.message || 'Đăng ký thành công!');
        switchTab('login');
      } else {
        setError(data.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch {
      setError('Lỗi kết nối tới máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Background Overlay with crystal aquatic splash atmosphere */}
      <div
        className="fixed inset-0 bg-[#07192f]/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Main Registration Card */}
      <div
        className="relative bg-white rounded-[32px] sm:rounded-[36px] shadow-[0_25px_70px_rgba(1,100,255,0.3)] border border-[#cbe4fe] w-full max-w-[430px] my-auto overflow-hidden p-5 sm:p-7 z-10 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-[#f0f6fe] hover:bg-[#e1f0fe] text-[#7895b3] hover:text-[#040f32] flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* ─── TOP AVATAR ─── */}
        <div className="w-[70px] h-[70px] rounded-full bg-gradient-to-b from-[#eef6fe] to-[#e0f1fe] border border-[#b8dcfa] shadow-inner flex items-center justify-center mx-auto mb-3">
          <svg className="w-8 h-8 text-[#0168ff] fill-current" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>

        {/* ─── TITLE & SUBTITLE ─── */}
        <h2 className="text-[22px] sm:text-2xl font-black text-[#040f32] text-center tracking-tight mb-1 font-sans">
          {tab === 'register' ? 'TẠO TÀI KHOẢN WASYPRO' : 'ĐĂNG NHẬP WASYPRO'}
        </h2>
        <p className="text-xs sm:text-[13px] text-[#4b6b8b] font-medium text-center leading-snug mb-5 px-2">
          {tab === 'register' ? (
            <>
              Đăng ký để trải nghiệm sản phẩm và nhận<br />
              nhiều ưu đãi đặc biệt từ Water King
            </>
          ) : (
            <>
              Đăng nhập để trải nghiệm hệ sinh thái Water King<br />
              và nhận nhiều ưu đãi đặc quyền
            </>
          )}
        </p>

        {/* ─── TAB SWITCHER (ĐĂNG NHẬP / ĐĂNG KÝ) ─── */}
        <div className="bg-[#f0f6fe] p-1.5 rounded-2xl flex gap-1 mb-5 border border-[#dfecfb]">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`flex-1 py-2.5 text-xs sm:text-[13px] font-bold rounded-xl transition-all tracking-wider ${
              tab === 'login'
                ? 'bg-gradient-to-r from-[#016aff] to-[#0188ff] text-white shadow-[0_4px_16px_rgba(1,120,255,0.4)]'
                : 'text-[#4b6b8b] hover:text-[#0168ff]'
            }`}
          >
            ĐĂNG NHẬP
          </button>
          {allowRegister && (
          <button
            type="button"
            onClick={() => switchTab('register')}
            className={`flex-1 py-2.5 text-xs sm:text-[13px] font-extrabold rounded-xl transition-all tracking-wider ${
              tab === 'register'
                ? 'bg-gradient-to-r from-[#016aff] to-[#0188ff] text-white shadow-[0_4px_16px_rgba(1,120,255,0.4)]'
                : 'text-[#4b6b8b] hover:text-[#0168ff]'
            }`}
          >
            ĐĂNG KÝ
          </button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-3 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 mb-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold leading-relaxed">
            {successMsg}
          </div>
        )}

        {/* ─── REGISTER FORM ─── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* HỌ VÀ TÊN */}
            <div className="space-y-1">
              <label className="block text-xs font-extrabold text-[#070f30] uppercase tracking-wide">
                HỌ VÀ TÊN <span className="text-[#ff3b30]">*</span>
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-[#2585eb] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.2]" />
                <input
                  type="text"
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  placeholder="Nhập họ và tên của bạn"
                  className="w-full pl-11 pr-4 h-11 sm:h-12 bg-white border border-[#91c7f8] hover:border-[#0178ff] focus:border-[#0178ff] focus:ring-2 focus:ring-[#0178ff]/20 rounded-2xl text-sm font-medium text-slate-800 placeholder-[#9ab3d1] focus:outline-none shadow-xs transition-all"
                  required
                />
              </div>
            </div>

            {/* SỐ ĐIỆN THOẠI */}
            <div className="space-y-1">
              <label className="block text-xs font-extrabold text-[#070f30] uppercase tracking-wide">
                SỐ ĐIỆN THOẠI <span className="text-[#ff3b30]">*</span>
              </label>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Phone className="w-5 h-5 text-[#2585eb] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.2]" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="Nhập số điện thoại"
                    className="w-full pl-11 pr-3 h-11 sm:h-12 bg-white border border-[#91c7f8] hover:border-[#0178ff] focus:border-[#0178ff] focus:ring-2 focus:ring-[#0178ff]/20 rounded-2xl text-sm font-medium text-slate-800 placeholder-[#9ab3d1] focus:outline-none shadow-xs transition-all"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || otpCooldown > 0 || !regPhone.trim()}
                  className="h-11 sm:h-12 px-4 sm:px-5 rounded-2xl bg-[#0164ff] hover:bg-[#0054db] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(1,100,255,0.35)] shrink-0 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Shield className="w-4 h-4 stroke-[2.4]" />
                  <span>{otpLoading ? '...' : otpCooldown > 0 ? `${otpCooldown}s` : 'Gửi OTP'}</span>
                </button>
              </div>
            </div>

            {/* MÃ XÁC THỰC ZALO (OTP) */}
            <div className="space-y-1">
              <label className="block text-xs font-extrabold text-[#070f30] uppercase tracking-wide">
                MÃ XÁC THỰC ZALO (OTP) <span className="text-[#ff3b30]">*</span>
              </label>
              <div className="relative">
                <MessageCircle className="w-5 h-5 text-[#2585eb] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.2]" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={regOtp}
                  onChange={e => setRegOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Nhập mã 6 số gửi từ Zalo Water King"
                  className="w-full pl-11 pr-4 h-11 sm:h-12 bg-white border border-[#91c7f8] hover:border-[#0178ff] focus:border-[#0178ff] focus:ring-2 focus:ring-[#0178ff]/20 rounded-2xl text-sm font-medium text-slate-800 placeholder-[#9ab3d1] focus:outline-none shadow-xs transition-all font-mono tracking-wider"
                  required
                />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#527394] font-normal pt-0.5">
                <Info className="w-3.5 h-3.5 text-[#527394] shrink-0" />
                <span>Tin nhắn từ Zalo OA Water King chứa mã xác thực gồm 6 số.</span>
              </div>
            </div>

            {/* MẬT KHẨU */}
            <div className="space-y-1">
              <label className="block text-xs font-extrabold text-[#070f30] uppercase tracking-wide">
                MẬT KHẨU <span className="text-[#ff3b30]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#2585eb] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.2]" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự (hoa, thường, số, ký tự đặc biệt)"
                  className="w-full pl-11 pr-11 h-11 sm:h-12 bg-white border border-[#91c7f8] hover:border-[#0178ff] focus:border-[#0178ff] focus:ring-2 focus:ring-[#0178ff]/20 rounded-2xl text-sm font-medium text-slate-800 placeholder-[#9ab3d1] focus:outline-none shadow-xs transition-all"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7895b3] hover:text-[#0168ff] p-1 transition-colors"
                >
                  {showRegPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* NHẬP LẠI MẬT KHẨU */}
            <div className="space-y-1">
              <label className="block text-xs font-extrabold text-[#070f30] uppercase tracking-wide">
                NHẬP LẠI MẬT KHẨU <span className="text-[#ff3b30]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#2585eb] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.2]" />
                <input
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu vừa đặt"
                  className="w-full pl-11 pr-11 h-11 sm:h-12 bg-white border border-[#91c7f8] hover:border-[#0178ff] focus:border-[#0178ff] focus:ring-2 focus:ring-[#0178ff]/20 rounded-2xl text-sm font-medium text-slate-800 placeholder-[#9ab3d1] focus:outline-none shadow-xs transition-all"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7895b3] hover:text-[#0168ff] p-1 transition-colors"
                >
                  {showRegConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* MÃ NGƯỜI GIỚI THIỆU (NẾU CÓ) */}
            <div className="space-y-1">
              <label className="block text-xs font-extrabold text-[#070f30] uppercase tracking-wide">
                MÃ NGƯỜI GIỚI THIỆU (NẾU CÓ)
              </label>
              <div className="relative">
                <Users className="w-5 h-5 text-[#2585eb] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.2]" />
                <input
                  type="text"
                  value={regRefCode}
                  onChange={e => !hasReferral && setRegRefCode(e.target.value)}
                  readOnly={hasReferral}
                  placeholder="Nhập mã người giới thiệu"
                  className={`w-full pl-11 pr-11 h-11 sm:h-12 bg-white border border-[#91c7f8] hover:border-[#0178ff] focus:border-[#0178ff] focus:ring-2 focus:ring-[#0178ff]/20 rounded-2xl text-sm font-medium text-slate-800 placeholder-[#9ab3d1] focus:outline-none shadow-xs transition-all ${
                    hasReferral ? 'bg-[#f0f6fe] font-bold text-[#0168ff] cursor-not-allowed' : ''
                  }`}
                />
                <Gift className="w-5 h-5 text-[#2585eb] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.2]" />
              </div>
            </div>

            {/* ═══ CHƯƠNG TRÌNH THAM GIA ═══ */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-[#070f30] uppercase tracking-wide">
                CHƯƠNG TRÌNH THAM GIA
              </label>

              {/* Option 1: Đại sứ */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-2xl cursor-pointer border-2 transition-all ${
                  regRole === 'ambassador'
                    ? 'border-[#0178ff] bg-[#f0f6fe] shadow-sm'
                    : 'border-[#dfe9f5] bg-white hover:border-[#91c7f8]'
                }`}
                onClick={() => { setRegRole('ambassador' as any); setWantNpp(false); setSelectedPackageId(''); }}
              >
                <input
                  type="radio"
                  name="regProgram"
                  checked={regRole === 'ambassador'}
                  onChange={() => {}}
                  className="mt-1 accent-[#0178ff] flex-shrink-0 w-[18px] h-[18px]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">👥</span>
                    <span className="text-[13px] font-bold text-[#070f30]">Tham gia làm Đại sứ</span>
                  </div>
                  <p className="text-[11px] text-[#5a7a9a] mt-1 leading-snug">
                    Tích lũy điểm hoa hồng từ đơn hàng, nhận Business ID khi đạt 5.000 CP
                  </p>
                </div>
              </label>

              {/* Option 2: NPP */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-2xl cursor-pointer border-2 transition-all ${
                  regRole === 'npp'
                    ? 'border-[#0178ff] bg-[#f0f6fe] shadow-sm'
                    : 'border-[#dfe9f5] bg-white hover:border-[#91c7f8]'
                }`}
                onClick={() => { setRegRole('npp' as any); setWantNpp(true); }}
              >
                <input
                  type="radio"
                  name="regProgram"
                  checked={regRole === 'npp'}
                  onChange={() => {}}
                  className="mt-1 accent-[#0178ff] flex-shrink-0 w-[18px] h-[18px]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏢</span>
                    <span className="text-[13px] font-bold text-[#070f30]">Đăng ký trở thành Nhà Phân Phối (NPP)</span>
                  </div>
                  <p className="text-[11px] text-[#5a7a9a] mt-1 leading-snug">
                    Đăng ký tham gia hệ thống NPP và lựa chọn gói Combo NPP.
                  </p>
                </div>
              </label>

              {/* NPP Package list (show when NPP selected) */}
              {regRole === 'npp' && (
                <div className="ml-8 border-l-2 border-[#0178ff]/30 pl-4 space-y-2 py-1">
                  <p className="text-xs font-bold text-[#070f30]">Chọn gói NPP <span className="text-[#ff3b30]">*</span></p>
                  {loadingPackages ? (
                    <p className="text-xs text-[#7895b3] text-center py-3">Đang tải gói NPP...</p>
                  ) : nppPackages.filter(p => p.packageType === 'PRODUCT_COMBO').length === 0 ? (
                    <p className="text-xs text-[#7895b3] text-center py-3">Hiện chưa có gói NPP nào.</p>
                  ) : (
                    <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
                      {nppPackages.filter(p => p.packageType === 'PRODUCT_COMBO').map((pkg: any) => (
                        <label
                          key={pkg.id}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer border transition-all ${
                            selectedPackageId === pkg.id
                              ? 'border-[#0178ff] bg-[#e8f2ff] shadow-sm'
                              : 'border-[#e5ecf3] bg-white hover:border-[#91c7f8]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="nppPkg"
                            checked={selectedPackageId === pkg.id}
                            onChange={() => setSelectedPackageId(pkg.id)}
                            className="mt-0.5 accent-[#0178ff] flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-bold text-[#070f30]">{pkg.name}</div>
                            <div className="text-[11px] text-[#5a7a9a] mt-0.5">
                              {pkg.requiredQuantity} máy · CK {(pkg.defaultDiscount / 100)}% · {rankLabel(pkg.assignedRank)}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Option 3: Cổ đông */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-2xl cursor-pointer border-2 transition-all ${
                  regRole === 'capital'
                    ? 'border-[#0178ff] bg-[#f0f6fe] shadow-sm'
                    : 'border-[#dfe9f5] bg-white hover:border-[#91c7f8]'
                }`}
                onClick={() => { setRegRole('capital' as any); setWantNpp(true); setSelectedPackageId(''); }}
              >
                <input
                  type="radio"
                  name="regProgram"
                  checked={regRole === 'capital'}
                  onChange={() => {}}
                  className="mt-1 accent-[#0178ff] flex-shrink-0 w-[18px] h-[18px]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">👑</span>
                    <span className="text-[13px] font-bold text-[#070f30]">Chương trình Cổ đông</span>
                  </div>
                  <p className="text-[11px] text-[#5a7a9a] mt-1 leading-snug">
                    Tham gia góp vốn cổ đông và lựa chọn gói giá vốn (300tr, 500tr, 1 Tỷ, 2 Tỷ...)
                  </p>
                </div>
              </label>

              {/* Capital Package list (show when Cổ đông selected) */}
              {regRole === 'capital' && (
                <div className="ml-8 border-l-2 border-[#0178ff]/30 pl-4 space-y-2 py-1">
                  <p className="text-xs font-bold text-[#070f30]">Chọn gói Cổ đông <span className="text-[#ff3b30]">*</span></p>
                  {loadingPackages ? (
                    <p className="text-xs text-[#7895b3] text-center py-3">Đang tải gói...</p>
                  ) : nppPackages.filter(p => p.packageType === 'CAPITAL').length === 0 ? (
                    <p className="text-xs text-[#7895b3] text-center py-3">Hiện chưa có gói cổ đông nào.</p>
                  ) : (
                    <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
                      {nppPackages.filter(p => p.packageType === 'CAPITAL').map((pkg: any) => (
                        <label
                          key={pkg.id}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer border transition-all ${
                            selectedPackageId === pkg.id
                              ? 'border-[#0178ff] bg-[#e8f2ff] shadow-sm'
                              : 'border-[#e5ecf3] bg-white hover:border-[#91c7f8]'
                          }`}
                        >
                          <input
                            type="radio"
                            name="capitalPkg"
                            checked={selectedPackageId === pkg.id}
                            onChange={() => setSelectedPackageId(pkg.id)}
                            className="mt-0.5 accent-[#0178ff] flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[12px] font-bold text-[#070f30]">{pkg.name}</div>
                            <div className="text-[11px] text-[#5a7a9a] mt-0.5">
                              {formatVND(pkg.grossPrice)} · {rankLabel(pkg.assignedRank)}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON: ĐĂNG KÝ NGAY */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 sm:h-14 rounded-2xl bg-gradient-to-r from-[#005deb] via-[#0178ff] to-[#0295ff] hover:opacity-95 active:scale-[0.98] text-white font-black text-base tracking-wider flex items-center justify-center gap-3 shadow-[0_10px_28px_rgba(1,120,255,0.45)] transition-all cursor-pointer mt-4 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>ĐANG TẠO TÀI KHOẢN...</span>
                </>
              ) : (
                <>
                  <span>ĐĂNG KÝ NGAY</span>
                  <span className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center shadow-xs">
                    <ArrowRight className="w-4 h-4 text-white stroke-[2.8]" />
                  </span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ─── LOGIN FORM ─── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* SỐ ĐIỆN THOẠI */}
            <div className="space-y-1">
              <label className="block text-xs font-extrabold text-[#070f30] uppercase tracking-wide">
                SỐ ĐIỆN THOẠI <span className="text-[#ff3b30]">*</span>
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-[#2585eb] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.2]" />
                <input
                  type="tel"
                  value={loginPhone}
                  onChange={e => setLoginPhone(e.target.value)}
                  placeholder="Nhập số điện thoại của bạn"
                  className="w-full pl-11 pr-4 h-12 bg-white border border-[#91c7f8] hover:border-[#0178ff] focus:border-[#0178ff] focus:ring-2 focus:ring-[#0178ff]/20 rounded-2xl text-sm font-medium text-slate-800 placeholder-[#9ab3d1] focus:outline-none shadow-xs transition-all"
                  required
                />
              </div>
            </div>

            {/* MẬT KHẨU */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-[#070f30] uppercase tracking-wide">
                  MẬT KHẨU <span className="text-[#ff3b30]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="text-xs text-[#0178ff] font-semibold hover:underline"
                >
                  {showLoginPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#2585eb] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.2]" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-11 pr-11 h-12 bg-white border border-[#91c7f8] hover:border-[#0178ff] focus:border-[#0178ff] focus:ring-2 focus:ring-[#0178ff]/20 rounded-2xl text-sm font-medium text-slate-800 placeholder-[#9ab3d1] focus:outline-none shadow-xs transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7895b3] hover:text-[#0168ff] p-1 transition-colors"
                >
                  {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON: ĐĂNG NHẬP NGAY */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 sm:h-14 rounded-2xl bg-gradient-to-r from-[#005deb] via-[#0178ff] to-[#0295ff] hover:opacity-95 active:scale-[0.98] text-white font-black text-base tracking-wider flex items-center justify-center gap-3 shadow-[0_10px_28px_rgba(1,120,255,0.45)] transition-all cursor-pointer mt-4 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>ĐANG ĐĂNG NHẬP...</span>
                </>
              ) : (
                <>
                  <span>ĐĂNG NHẬP NGAY</span>
                  <span className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center shadow-xs">
                    <ArrowRight className="w-4 h-4 text-white stroke-[2.8]" />
                  </span>
                </>
              )}
            </button>

            {/* Quên mật khẩu & Hỗ trợ */}
            <div className="text-center text-xs text-[#4b6b8b] pt-1">
              <span>Quên mật khẩu? </span>
              <a href="tel:1900989878" className="text-red-600 font-bold hover:underline">
                Hotline: 1900 989878
              </a>
              <span className="mx-1.5">·</span>
              <a
                href="https://zalo.me/2928413591064686973"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0168ff] font-bold hover:underline"
              >
                Zalo OA
              </a>
            </div>
          </form>
        )}

        {/* ─── SOCIAL LOGIN DIVIDER ─── */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#dfecfb]" />
          </div>
          <span className="relative bg-white px-3 text-[11px] font-bold text-[#5e7e9e] uppercase tracking-wider">
            HOẶC ĐĂNG KÝ BẰNG
          </span>
        </div>

        {/* ─── 3 BUTTONS: FACEBOOK (ngoài cùng), ZALO (tiếp đến), HOTLINE (cuối cùng) ─── */}
        <div className="flex items-center justify-center gap-5">
          {/* 1. Facebook (Ngoài cùng bên trái) */}
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 rounded-full bg-[#1877F2] shadow-[0_3px_10px_rgba(24,119,242,0.35)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-white cursor-pointer hover:shadow-lg"
            title="Đăng ký / Kết nối qua Facebook"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>

          {/* 2. Zalo (Tiếp theo ở giữa) */}
          <a
            href="https://zalo.me/2928413591064686973"
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 rounded-full bg-white border-2 border-[#0068FF] shadow-[0_3px_10px_rgba(0,104,255,0.2)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer hover:shadow-lg"
            title="Đăng ký / Hỗ trợ qua Zalo Official Account"
          >
            <span className="text-[#0068FF] font-black text-xs tracking-tight">Zalo</span>
          </a>

          {/* 3. Hotline (Cuối cùng bên phải) */}
          <a
            href="tel:1900989878"
            className="w-11 h-11 rounded-full bg-gradient-to-br from-[#ff3b30] to-[#e60000] shadow-[0_3px_10px_rgba(255,59,48,0.35)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-white cursor-pointer hover:shadow-lg"
            title="Gọi Hotline 1900 989878 hỗ trợ đăng ký"
          >
            <PhoneCall className="w-5 h-5 stroke-[2.2]" />
          </a>
        </div>
      </div>
    </div>
  );
}
