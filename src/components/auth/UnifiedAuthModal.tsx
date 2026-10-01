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
  Info
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
  const [regRefCode, setRegRefCode] = useState(effectiveRefCode);

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

    try {
      const body: any = {
        fullName: regFullName.trim(),
        phone: regPhone.trim(),
        password: regPassword.trim(),
        otp: regOtp.trim(),
        referralCode: regRefCode?.trim() || undefined,
        joinSystem: true,
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success && data.data) {
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Background Overlay with aquatic water splash vibe */}
      <div
        className="fixed inset-0 bg-[#0a1e3b]/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Main Registration Card */}
      <div
        className="relative bg-white rounded-[32px] sm:rounded-[36px] shadow-[0_25px_70px_rgba(0,102,255,0.28)] border border-[#d3e5fc] w-full max-w-[430px] my-auto overflow-hidden p-6 sm:p-8 z-10 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-[#f0f5fc] hover:bg-[#e2eefa] text-[#718dae] hover:text-[#0c2340] flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ─── TOP AVATAR ─── */}
        <div className="w-[68px] h-[68px] rounded-full bg-[#e7f2fe] border border-[#cfdff7] flex items-center justify-center mx-auto mb-3 shadow-inner">
          <svg className="w-8 h-8 text-[#0066FF] fill-current" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>

        {/* ─── TITLE & SUBTITLE ─── */}
        <h2 className="text-[22px] sm:text-2xl font-black text-[#0f2a4a] text-center tracking-tight mb-1 font-sans">
          {tab === 'register' ? 'TẠO TÀI KHOẢN WASYPRO' : 'ĐĂNG NHẬP WASYPRO'}
        </h2>
        <p className="text-xs sm:text-[13px] text-[#557394] font-medium text-center leading-snug mb-5 px-2">
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
        <div className="bg-[#f0f5fc] p-1.5 rounded-2xl flex gap-1 mb-5 border border-[#e1ecfa]">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`flex-1 py-2.5 text-xs sm:text-[13px] font-bold rounded-xl transition-all tracking-wider ${
              tab === 'login'
                ? 'bg-gradient-to-r from-[#0066FF] to-[#0099FF] text-white shadow-[0_4px_14px_rgba(0,102,255,0.35)]'
                : 'text-[#1b365d] hover:text-[#0066FF]'
            }`}
          >
            ĐĂNG NHẬP
          </button>
          <button
            type="button"
            onClick={() => switchTab('register')}
            className={`flex-1 py-2.5 text-xs sm:text-[13px] font-bold rounded-xl transition-all tracking-wider ${
              tab === 'register'
                ? 'bg-gradient-to-r from-[#0066FF] to-[#00A3FF] text-white shadow-[0_4px_14px_rgba(0,102,255,0.35)]'
                : 'text-[#1b365d] hover:text-[#0066FF]'
            }`}
          >
            ĐĂNG KÝ
          </button>
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
          <form onSubmit={handleRegister} className="space-y-4">
            {/* HỌ VÀ TÊN */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-[#0f2a4a] uppercase tracking-wide">
                HỌ VÀ TÊN <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-5 h-5 text-[#0080FF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  placeholder="Nhập họ và tên của bạn"
                  className="w-full pl-11 pr-4 h-12 bg-white border border-[#b9d6fb] rounded-2xl text-sm font-medium text-slate-800 placeholder-[#9ab3d1] focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 shadow-xs transition-all"
                  required
                />
              </div>
            </div>

            {/* SỐ ĐIỆN THOẠI */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-[#0f2a4a] uppercase tracking-wide">
                SỐ ĐIỆN THOẠI <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2.5 items-center">
                <div className="relative flex-1">
                  <Phone className="w-5 h-5 text-[#0080FF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="Nhập số điện thoại"
                    className="w-full pl-11 pr-3 h-12 bg-white border border-[#b9d6fb] rounded-2xl text-sm font-medium text-slate-800 placeholder-[#9ab3d1] focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 shadow-xs transition-all"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || otpCooldown > 0 || !regPhone.trim()}
                  className="h-12 px-4 sm:px-5 rounded-2xl bg-[#0066FF] hover:bg-[#0052cc] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(0,102,255,0.3)] shrink-0 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Shield className="w-4 h-4 stroke-[2.2]" />
                  <span>{otpLoading ? '...' : otpCooldown > 0 ? `${otpCooldown}s` : 'Gửi OTP'}</span>
                </button>
              </div>
            </div>

            {/* MÃ XÁC THỰC ZALO (OTP) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-[#0f2a4a] uppercase tracking-wide">
                MÃ XÁC THỰC ZALO (OTP) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MessageCircle className="w-5 h-5 text-[#0080FF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={regOtp}
                  onChange={e => setRegOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Nhập mã 6 số gửi từ Zalo Water King"
                  className="w-full pl-11 pr-4 h-12 bg-white border border-[#b9d6fb] rounded-2xl text-sm font-medium text-slate-800 placeholder-[#9ab3d1] focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 shadow-xs transition-all font-mono tracking-wider"
                  required
                />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#557394] font-normal pt-0.5">
                <Info className="w-3.5 h-3.5 text-[#557394] shrink-0" />
                <span>Tin nhắn từ Zalo OA Water King chứa mã xác thực gồm 6 số.</span>
              </div>
            </div>

            {/* MẬT KHẨU */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-[#0f2a4a] uppercase tracking-wide">
                MẬT KHẨU <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#0080FF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự (hoa, thường, số, ký tự đặc biệt)"
                  className="w-full pl-11 pr-11 h-12 bg-white border border-[#b9d6fb] rounded-2xl text-sm font-medium text-slate-800 placeholder-[#9ab3d1] focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 shadow-xs transition-all"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7d99b8] hover:text-[#0066FF] p-1 transition-colors"
                >
                  {showRegPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* NHẬP LẠI MẬT KHẨU */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-[#0f2a4a] uppercase tracking-wide">
                NHẬP LẠI MẬT KHẨU <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#0080FF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu vừa đặt"
                  className="w-full pl-11 pr-11 h-12 bg-white border border-[#b9d6fb] rounded-2xl text-sm font-medium text-slate-800 placeholder-[#9ab3d1] focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 shadow-xs transition-all"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7d99b8] hover:text-[#0066FF] p-1 transition-colors"
                >
                  {showRegConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* MÃ NGƯỜI GIỚI THIỆU (NẾU CÓ) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-[#0f2a4a] uppercase tracking-wide">
                MÃ NGƯỜI GIỚI THIỆU (NẾU CÓ)
              </label>
              <div className="relative">
                <Users className="w-5 h-5 text-[#0080FF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={regRefCode}
                  onChange={e => !hasReferral && setRegRefCode(e.target.value)}
                  readOnly={hasReferral}
                  placeholder="Nhập mã người giới thiệu"
                  className={`w-full pl-11 pr-11 h-12 bg-white border border-[#b9d6fb] rounded-2xl text-sm font-medium text-slate-800 placeholder-[#9ab3d1] focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 shadow-xs transition-all ${
                    hasReferral ? 'bg-[#f4f9ff] font-bold text-[#0066FF] cursor-not-allowed' : ''
                  }`}
                />
                <Gift className="w-5 h-5 text-[#0080FF] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* SUBMIT BUTTON: ĐĂNG KÝ NGAY */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl sm:rounded-[22px] bg-gradient-to-r from-[#0066FF] via-[#0084FF] to-[#00A3FF] hover:opacity-95 active:scale-[0.98] text-white font-black text-base tracking-wider flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(0,102,255,0.42)] transition-all cursor-pointer mt-4 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>ĐANG TẠO TÀI KHOẢN...</span>
                </>
              ) : (
                <>
                  <span>ĐĂNG KÝ NGAY</span>
                  <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-white stroke-[2.5]" />
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
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-[#0f2a4a] uppercase tracking-wide">
                SỐ ĐIỆN THOẠI <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-5 h-5 text-[#0080FF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  value={loginPhone}
                  onChange={e => setLoginPhone(e.target.value)}
                  placeholder="Nhập số điện thoại của bạn"
                  className="w-full pl-11 pr-4 h-12 bg-white border border-[#b9d6fb] rounded-2xl text-sm font-medium text-slate-800 placeholder-[#9ab3d1] focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 shadow-xs transition-all"
                  required
                />
              </div>
            </div>

            {/* MẬT KHẨU */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-[#0f2a4a] uppercase tracking-wide">
                  MẬT KHẨU <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="text-xs text-[#0066FF] font-semibold hover:underline"
                >
                  {showLoginPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 text-[#0080FF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-11 pr-11 h-12 bg-white border border-[#b9d6fb] rounded-2xl text-sm font-medium text-slate-800 placeholder-[#9ab3d1] focus:outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 shadow-xs transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7d99b8] hover:text-[#0066FF] p-1 transition-colors"
                >
                  {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* SUBMIT BUTTON: ĐĂNG NHẬP NGAY */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl sm:rounded-[22px] bg-gradient-to-r from-[#0066FF] via-[#0084FF] to-[#00A3FF] hover:opacity-95 active:scale-[0.98] text-white font-black text-base tracking-wider flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(0,102,255,0.42)] transition-all cursor-pointer mt-4 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>ĐANG ĐĂNG NHẬP...</span>
                </>
              ) : (
                <>
                  <span>ĐĂNG NHẬP NGAY</span>
                  <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-white stroke-[2.5]" />
                  </span>
                </>
              )}
            </button>

            {/* Quên mật khẩu & Hỗ trợ */}
            <div className="text-center text-xs text-[#557394] pt-1">
              <span>Quên mật khẩu? </span>
              <a href="tel:1900989878" className="text-red-600 font-bold hover:underline">
                Hotline: 1900 989878
              </a>
              <span className="mx-1.5">·</span>
              <a
                href="https://zalo.me/2928413591064686973"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-bold hover:underline"
              >
                Zalo OA
              </a>
            </div>
          </form>
        )}

        {/* ─── SOCIAL LOGIN DIVIDER ─── */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#d8e8fa]" />
          </div>
          <span className="relative bg-white px-3 text-[11px] font-bold text-[#627d9a] uppercase tracking-wider">
            HOẶC ĐĂNG KÝ BẰNG
          </span>
        </div>

        {/* ─── 3 SOCIAL ICONS: GOOGLE, FACEBOOK, ZALO ─── */}
        <div className="flex items-center justify-center gap-4">
          {/* Google */}
          <button
            type="button"
            className="w-11 h-11 rounded-full bg-white border border-[#e1eaf5] shadow-xs flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer hover:shadow-md"
            title="Đăng ký bằng Google"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </button>

          {/* Facebook */}
          <button
            type="button"
            className="w-11 h-11 rounded-full bg-[#1877F2] shadow-[0_2px_8px_rgba(24,119,242,0.3)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-white cursor-pointer hover:shadow-md"
            title="Đăng ký bằng Facebook"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>

          {/* Zalo */}
          <button
            type="button"
            className="w-11 h-11 rounded-full bg-white border border-[#0068FF] shadow-xs flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer hover:shadow-md"
            title="Đăng ký bằng Zalo"
          >
            <span className="text-[#0068FF] font-black text-xs tracking-tight">Zalo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
