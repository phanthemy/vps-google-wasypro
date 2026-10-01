import React, { useState, useEffect } from 'react';
import { X, User, Phone, Lock, ChevronRight, Loader2, UserPlus, Shield, Eye, EyeOff } from 'lucide-react';

interface UserSession { id: string; fullName: string; phone: string; role?: string; [key: string]: any; }
interface NppPackage {
  id: string;
  code: string;
  name: string;
  description: string;
  grossPrice?: number | string | null;
  defaultDiscount: number;
  assignedRank: string;
  packageType: string;
  requiredQuantity: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  mode?: 'ctv' | 'system';
  referralCode?: string;
  onSuccess: (user: UserSession) => void;
}

export default function UnifiedAuthModal({ isOpen, onClose, initialTab = 'login', mode = 'ctv', referralCode = '', onSuccess }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Login
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regType, setRegType] = useState<'none' | 'ctv' | 'npp' | 'shareholder'>('none');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [nppPackages, setNppPackages] = useState<NppPackage[]>([]);

  // OTP Verification (Zalo ZNS)
  const [regOtp, setRegOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

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
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, refCode: effectiveRefCode || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setOtpCooldown(data.cooldown || 60);
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

  // Helpers
  const formatVND = (v: number | string | null | undefined) => {
    if (!v) return '';
    const n = typeof v === 'string' ? parseInt(v, 10) : v;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
  };

  const getRankLabel = (rank: string) => {
    if (rank === 'AMBASSADOR') return 'Đại sứ';
    if (rank === 'MANAGER') return 'Quản lý';
    if (rank === 'DIRECTOR') return 'Giám đốc';
    return rank || '';
  };

  // Check live URL parameter immediately so opening the modal never depends on F5 / page reload
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

  useEffect(() => { setTab(initialTab); }, [initialTab]);
  useEffect(() => {
    if (effectiveRefCode) {
      setRegRefCode(effectiveRefCode);
    } else {
      setRegRefCode('');
      setRegType('none');
      setSelectedPackageId('');
      try {
        localStorage.removeItem('wasy_ref_code');
        sessionStorage.removeItem('wasy_ref_code');
        document.cookie = 'wasy_ref=; max-age=0; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
      } catch (e) {}
    }
  }, [effectiveRefCode, isOpen]);

  // Load NPP packages from PUBLIC endpoint (no auth required)
  useEffect(() => {
    if (tab === 'register' && hasReferral) {
      fetch('/api/npp/packages/available-public')
        .then(r => r.json())
        .then(d => { if (d.success) setNppPackages(d.data || []); })
        .catch(() => {});
    }
  }, [tab, hasReferral]);

  const comboPackages = nppPackages.filter(p => p.packageType === 'PRODUCT_COMBO');
  const capitalPackages = nppPackages.filter(p => p.packageType === 'CAPITAL');

  const switchTab = (t: 'login' | 'register') => {
    setTab(t);
    setError('');
    setSuccessMsg('');
    setRegPassword('');
    setRegConfirmPassword('');
  };

  // ─── LOGIN ───
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone, password: loginPassword }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && data.data) {
        onSuccess(data.data);
        onClose();
      } else {
        setError(data.message || 'Đăng nhập thất bại.');
      }
    } catch { setError('Lỗi kết nối.'); }
    setLoading(false);
  };

  // ─── REGISTER ───
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccessMsg(''); setLoading(true);

    if (!regFullName.trim()) { setError('Vui lòng nhập họ tên.'); setLoading(false); return; }
    if (!regPhone.trim()) { setError('Vui lòng nhập số điện thoại.'); setLoading(false); return; }
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
      setError('Mật khẩu phải có ít nhất 8 ký tự bao gồm: chữ thường, chữ HOA, số và ký tự đặc biệt (VD: Wasy@2026).');
      setLoading(false);
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      setLoading(false);
      return;
    }
    // Verify OTP (Zalo ZNS)
    if (!regOtp || !regOtp.trim()) {
      setError('Vui lòng nhập mã xác thực OTP gửi qua Zalo.');
      setLoading(false);
      return;
    }

    try {
      const body: any = {
        fullName: regFullName.trim(),
        phone: regPhone.trim(),
        password: regPassword.trim(),
        otp: regOtp.trim(),
        referralCode: hasReferral ? (effectiveRefCode || undefined) : undefined,
      };
      if (hasReferral && regType === 'ctv') body.joinSystem = true;
      if (hasReferral && (regType === 'npp' || regType === 'shareholder')) {
        body.registerNpp = true;
        if (selectedPackageId) body.nppPackageId = selectedPackageId;
        if (regType === 'shareholder') body.registerShareholder = true;
      }

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
        setError(data.message || 'Đăng ký thất bại.');
      }
    } catch { setError('Lỗi kết nối.'); }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-0" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2.5 right-2.5 z-20 w-7 h-7 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-all"><X className="w-4 h-4" /></button>

        {/* Header — Blue Background (Tailwind only) */}
        <div className="bg-gradient-to-b from-primary-dark to-primary px-6 pt-8 pb-6 rounded-t-2xl text-center">
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3 bg-white/25">
            <User className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-xl font-black text-white drop-shadow">TẠO TÀI KHOẢN WASYPRO</h3>
          <p className="text-xs text-white/80 mt-1.5 leading-relaxed">Đăng ký để trải nghiệm sản phẩm và nhận<br/>nhiều ưu đãi đặc biệt từ Water King</p>
        </div>

        <div className="px-6 pb-6 pt-5">

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-full p-1 mb-5">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-full transition-all ${tab === 'login' ? 'bg-white text-gray-800 shadow font-bold' : 'text-gray-500'}`}
          >
            ĐĂNG NHẬP
          </button>
          {allowRegister && (
          <button
            type="button"
            onClick={() => switchTab('register')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-full transition-all ${tab === 'register' ? 'bg-gradient-to-r from-primary-dark to-primary text-white shadow-md font-bold' : 'text-gray-500'}`}
          >
            ĐĂNG KÝ
          </button>
          )}
        </div>

        {error && <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">{error}</div>}
        {successMsg && <div className="p-3 mb-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs font-medium">{successMsg}</div>}

        {/* ─── LOGIN FORM ─── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-0 divide-y divide-[#e0eef6] [&>div]:py-4 [&>div:first-child]:pt-0">
            <div className="py-4 first:pt-0">
              <label className="text-[13px] font-extrabold text-gray-900 uppercase tracking-wide">Số điện thoại</label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6aabcc]" />
                <input type="tel" value={loginPhone} onChange={e => setLoginPhone(e.target.value)} placeholder="0900000000" className="w-full pl-10 pr-4 py-3 border border-sky-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400" required />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-extrabold text-gray-900 uppercase tracking-wide">Mật khẩu</label>
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  {showLoginPassword ? <><EyeOff className="w-3.5 h-3.5" /> Ẩn</> : <><Eye className="w-3.5 h-3.5" /> Hiện</>}
                </button>
              </div>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6aabcc]" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-10 pr-10 py-3 border border-sky-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  required
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-primary-light via-primary to-primary-dark text-white font-black rounded-full hover:opacity-90 shadow-lg shadow-sky-400/30 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-[0.97] text-[15px] tracking-wider">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>ĐĂNG NHẬP</span><ChevronRight className="w-4 h-4" /></>}
            </button>
            <div className="text-center text-xs text-gray-500 space-y-1.5 pt-1">
              <div>
                {allowRegister && (<><span>Chưa có tài khoản? </span>
                <button type="button" onClick={() => switchTab('register')} className="text-primary font-bold hover:underline">Đăng ký</button></>)}
              </div>
              <div className="text-gray-400">
                <span>Quên mật khẩu? </span>
                <a href="tel:1900989878" className="text-red-600 font-bold hover:underline" title="Gọi Hotline để được hỗ trợ cấp lại mật khẩu">Hotline: 1900 989878</a>
                <span className="mx-1.5">·</span>
                <a href="https://zalo.me/2928413591064686973" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">Zalo OA</a>
              </div>
            </div>
          </form>
        )}

        {/* ─── REGISTER FORM ─── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-0 divide-y divide-[#e0eef6] [&>div]:py-4 [&>div:first-child]:pt-0">
            <div className="py-4 first:pt-0">
              <label className="text-[13px] font-extrabold text-gray-900 uppercase tracking-wide">Họ và tên *</label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6aabcc]" />
                <input type="text" value={regFullName} onChange={e => setRegFullName(e.target.value)} placeholder="Nguyễn Văn A" className="w-full pl-10 pr-4 py-3 border border-sky-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400" required />
              </div>
            </div>
            <div className="py-4 first:pt-0">
              <label className="text-[13px] font-extrabold text-gray-900 uppercase tracking-wide">Số điện thoại *</label>
              <div className="mt-1 relative flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6aabcc]" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="0900000000"
                    className="w-full pl-10 pr-4 py-3 border border-sky-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || otpCooldown > 0 || !regPhone.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white text-xs font-bold rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                >
                  <Shield className="w-3.5 h-3.5" />
                  {otpLoading ? '...' : otpCooldown > 0 ? `${otpCooldown}s` : 'Gửi OTP'}
                </button>
              </div>
            </div>

            {/* Mã xác thực OTP Zalo */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-extrabold text-gray-900 uppercase tracking-wide">Mã xác thực Zalo (OTP) *</label>
                {otpSent && <span className="text-[11px] text-sky-600 font-semibold flex items-center gap-1">✓ Đã gửi mã qua Zalo</span>}
              </div>
              <div className="mt-1 relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a9fd4]" />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={regOtp}
                  onChange={e => setRegOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Nhập mã 6 số gửi từ Zalo Water King"
                  className="w-full pl-10 pr-4 py-3 border border-sky-200/70 rounded-xl text-sm font-mono tracking-widest focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white shadow-sm"
                  required
                  maxLength={6}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-start gap-1">
                * Tin nhắn từ Zalo OA <strong>Water King</strong> chứa mã xác thực gồm 6 số.
              </p>
            </div>

            {/* Mật khẩu & Nhập lại mật khẩu */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-extrabold text-gray-900 uppercase tracking-wide">Mật khẩu *</label>
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  {showRegPassword ? <><EyeOff className="w-3.5 h-3.5" /> Ẩn</> : <><Eye className="w-3.5 h-3.5" /> Hiện</>}
                </button>
              </div>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6aabcc]" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự (hoa, thường, số, ký tự đặc biệt)"
                  className="w-full pl-10 pr-10 py-3 border border-sky-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  required
                  minLength={8}
                />
              </div>
              <p className="text-[11px] text-gray-600 mt-1">
                * Mật khẩu tối thiểu 8 ký tự, bao gồm: chữ thường, chữ HOA, số và ký tự đặc biệt (VD: Wasy@2026).
              </p>
            </div>

            <div className="py-4 first:pt-0">
              <label className="text-[13px] font-extrabold text-gray-900 uppercase tracking-wide">Nhập lại mật khẩu *</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6aabcc]" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu vừa đặt"
                  className="w-full pl-10 pr-4 py-3 border border-sky-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {/* Conditional: Ref Link vs Direct Guest */}
            {hasReferral ? (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Mã người giới thiệu</label>
                    <span className="text-[11px] font-semibold text-sky-700 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-sky-600" /> Đã khóa bảo trợ
                    </span>
                  </div>
                  <div className="mt-1 relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-600" />
                    <input
                      type="text"
                      value={effectiveRefCode}
                      readOnly
                      disabled
                      className="w-full pl-10 pr-10 py-3 border border-sky-200 bg-sky-50 rounded-2xl text-sm font-bold text-sky-900 cursor-not-allowed select-none"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-600" />
                  </div>
                  <p className="text-[11px] text-gray-600 mt-1">
                    Mã bảo trợ được gán tự động từ liên kết giới thiệu và không thể thay đổi.
                  </p>
                </div>

                {/* 3 Lựa chọn: Đại Sứ / Nhà Phân Phối / Cổ Đông */}
                <div className="space-y-2">
                  {/* Dòng 1: Tham gia làm Đại sứ */}
                  <div
                    onClick={() => { setRegType(regType === 'ctv' ? 'none' : 'ctv'); setSelectedPackageId(''); }}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${regType === 'ctv' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${regType === 'ctv' ? 'border-blue-500' : 'border-gray-300'}`}>
                        {regType === 'ctv' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">👥 Tham gia làm Đại sứ</div>
                        <div className="text-xs text-gray-500 mt-0.5">Tích lũy điểm hoa hồng từ đơn hàng, nhận Business ID khi đạt 5.000 CP</div>
                      </div>
                    </div>
                  </div>

                  {/* Dòng 2: Nhà Phân Phối (NPP) — Chỉ gói Combo */}
                  <div
                    onClick={() => { setRegType(regType === 'npp' ? 'none' : 'npp'); setSelectedPackageId(''); }}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${regType === 'npp' ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${regType === 'npp' ? 'border-sky-500' : 'border-gray-300'}`}>
                        {regType === 'npp' && <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />}
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">🏪 Đăng ký trở thành Nhà Phân Phối (NPP)</div>
                        <div className="text-xs text-gray-500 mt-0.5">Đăng ký tham gia hệ thống NPP và lựa chọn gói Combo NPP.</div>
                      </div>
                    </div>

                    {/* NPP Package Selection — ONLY PRODUCT_COMBO */}
                    {regType === 'npp' && comboPackages.length > 0 && (
                      <div className="mt-3 ml-8 space-y-2">
                        <label className="text-xs font-bold text-gray-700">Chọn gói Combo NPP <span className="font-normal text-gray-400">(không bắt buộc — có thể chọn sau)</span></label>
                        {comboPackages.map(pkg => (
                          <div
                            key={pkg.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedPackageId(selectedPackageId === pkg.id ? '' : pkg.id); }}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-all ${selectedPackageId === pkg.id ? 'border-sky-400 bg-sky-50' : 'border-gray-200 hover:border-gray-300'}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPackageId === pkg.id ? 'border-sky-500' : 'border-gray-300'}`}>
                                {selectedPackageId === pkg.id && <div className="w-2 h-2 rounded-full bg-sky-500" />}
                              </div>
                              <div>
                                <div className="font-bold text-sm">{pkg.name}</div>
                                <div className="text-xs text-gray-500">
                                  {pkg.requiredQuantity} máy · CK {(pkg.defaultDiscount / 100).toFixed(0)}% · Cấp bậc: {getRankLabel(pkg.assignedRank)}
                                </div>
                              </div>
                            </div>
                            {pkg.description && <div className="text-[11px] text-gray-400 mt-1 ml-6">{pkg.description}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dòng 3: Chương trình Cổ đông — Chỉ gói vốn (CAPITAL) */}
                  <div
                    onClick={() => { setRegType(regType === 'shareholder' ? 'none' : 'shareholder'); setSelectedPackageId(''); }}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${regType === 'shareholder' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${regType === 'shareholder' ? 'border-amber-500' : 'border-gray-300'}`}>
                        {regType === 'shareholder' && <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">👑 Chương trình Cổ đông</div>
                        <div className="text-xs text-gray-500 mt-0.5">Tham gia góp vốn cổ đông và lựa chọn gói giá vốn (300tr, 500tr, 1 Tỷ, 2 Tỷ...)</div>
                      </div>
                    </div>

                    {/* Shareholder Package Selection — ONLY CAPITAL */}
                    {regType === 'shareholder' && capitalPackages.length > 0 && (
                      <div className="mt-3 ml-8 space-y-2">
                        <label className="text-xs font-bold text-gray-700">Chọn gói Cổ đông <span className="font-normal text-gray-400">(không bắt buộc — có thể chọn sau)</span></label>
                        {capitalPackages.map(pkg => (
                          <div
                            key={pkg.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedPackageId(selectedPackageId === pkg.id ? '' : pkg.id); }}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-all ${selectedPackageId === pkg.id ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPackageId === pkg.id ? 'border-amber-500' : 'border-gray-300'}`}>
                                {selectedPackageId === pkg.id && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                              </div>
                              <div>
                                <div className="font-bold text-sm">{pkg.name}</div>
                                <div className="text-xs text-gray-500">
                                  {pkg.grossPrice ? <span className="font-semibold text-amber-700">{formatVND(pkg.grossPrice)} · </span> : ''}
                                  Cấp bậc: {getRankLabel(pkg.assignedRank)}
                                </div>
                              </div>
                            </div>
                            {pkg.description && <div className="text-[11px] text-gray-400 mt-1 ml-6">{pkg.description}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Khách vãng lai trực tiếp: Ô Mã giới thiệu bị khóa + Nút liên hệ Zalo OA & Hotline */
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-extrabold text-gray-900 uppercase tracking-wide">Mã người giới thiệu</label>
                    <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-gray-400" /> Đã khóa
                    </span>
                  </div>
                  <div className="mt-1 relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6aabcc]" />
                    <input
                      type="text"
                      value=""
                      placeholder="Chưa có mã giới thiệu"
                      readOnly
                      disabled
                      className="w-full pl-10 pr-10 py-3 border border-sky-200 bg-gray-50 rounded-2xl text-sm text-gray-400 cursor-not-allowed select-none focus:outline-none"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Xuống dòng hiển thị Zalo OA và Hotline */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href="https://zalo.me/2928413591064686973"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors text-center"
                  >
                    <span>💬 Zalo OA Water King</span>
                  </a>
                  <a
                    href="tel:1900989878"
                    className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors text-center"
                  >
                    <span>📞 Hotline: 1900 989878</span>
                  </a>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-primary-light via-primary to-primary-dark text-white font-black rounded-full hover:opacity-90 shadow-lg shadow-sky-400/30 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-[0.97] text-[15px] tracking-wider">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>ĐANG TẠO TÀI KHOẢN...</span></> : <><span>{hasReferral ? 'ĐĂNG KÝ NGAY' : 'ĐĂNG KÝ NGAY'}</span><ChevronRight className="w-5 h-5" /></>}
            </button>
            <div className="text-center text-xs text-gray-500">
              <span>Đã có tài khoản? </span>
              <button type="button" onClick={() => switchTab('login')} className="text-primary font-bold hover:underline">Đăng nhập</button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
