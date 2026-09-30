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

    try {
      const body: any = {
        fullName: regFullName.trim(),
        phone: regPhone.trim(),
        password: regPassword.trim(),
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"><X className="w-4 h-4" /></button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <User className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">TÀI KHOẢN WASYPRO</h3>
          <p className="text-xs text-gray-500 mt-1">Đăng nhập hoặc tạo tài khoản mới</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
          <button
            type="button"
            onClick={() => switchTab('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${tab === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            ĐĂNG NHẬP
          </button>
          <button
            type="button"
            onClick={() => switchTab('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${tab === 'register' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            ĐĂNG KÝ
          </button>
        </div>

        {error && <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">{error}</div>}
        {successMsg && <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">{successMsg}</div>}

        {/* ─── LOGIN FORM ─── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Số điện thoại</label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" value={loginPhone} onChange={e => setLoginPhone(e.target.value)} placeholder="0900000000" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary" required />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Mật khẩu</label>
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  {showLoginPassword ? <><EyeOff className="w-3.5 h-3.5" /> Ẩn</> : <><Eye className="w-3.5 h-3.5" /> Hiện</>}
                </button>
              </div>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  required
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>ĐĂNG NHẬP</span><ChevronRight className="w-4 h-4" /></>}
            </button>
            <div className="text-center text-xs text-gray-500 space-y-1.5 pt-1">
              <div>
                <span>Chưa có tài khoản? </span>
                <button type="button" onClick={() => switchTab('register')} className="text-primary font-bold hover:underline">Đăng ký</button>
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
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Họ và tên *</label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={regFullName} onChange={e => setRegFullName(e.target.value)} placeholder="Nguyễn Văn A" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary" required />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Số điện thoại *</label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="0900000000" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary" required />
              </div>
            </div>

            {/* Mật khẩu & Nhập lại mật khẩu */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Mật khẩu *</label>
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  {showRegPassword ? <><EyeOff className="w-3.5 h-3.5" /> Ẩn</> : <><Eye className="w-3.5 h-3.5" /> Hiện</>}
                </button>
              </div>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự (hoa, thường, số, ký tự đặc biệt)"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  required
                  minLength={8}
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                * Mật khẩu tối thiểu 8 ký tự, bao gồm: chữ thường, chữ HOA, số và ký tự đặc biệt (VD: Wasy@2026).
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Nhập lại mật khẩu *</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={e => setRegConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu vừa đặt"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" /> Đã khóa bảo trợ
                    </span>
                  </div>
                  <div className="mt-1 relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                    <input
                      type="text"
                      value={effectiveRefCode}
                      readOnly
                      disabled
                      className="w-full pl-10 pr-10 py-3 border border-emerald-300 bg-emerald-50/70 rounded-xl text-sm font-bold text-emerald-900 cursor-not-allowed select-none"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
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
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${regType === 'npp' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${regType === 'npp' ? 'border-emerald-500' : 'border-gray-300'}`}>
                        {regType === 'npp' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
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
                            className={`p-2.5 rounded-lg border cursor-pointer transition-all ${selectedPackageId === pkg.id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedPackageId === pkg.id ? 'border-emerald-500' : 'border-gray-300'}`}>
                                {selectedPackageId === pkg.id && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
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
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Mã người giới thiệu</label>
                    <span className="text-[11px] font-semibold text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-gray-400" /> Đã khóa
                    </span>
                  </div>
                  <div className="mt-1 relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value=""
                      placeholder="Chưa có mã giới thiệu"
                      readOnly
                      disabled
                      className="w-full pl-10 pr-10 py-3 border border-gray-200 bg-gray-100 rounded-xl text-sm text-gray-400 cursor-not-allowed select-none focus:outline-none"
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

            <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>ĐANG TẠO TÀI KHOẢN...</span></> : <><Shield className="w-4 h-4" /><span>{hasReferral ? 'ĐĂNG KÝ TÀI KHOẢN' : 'ĐĂNG KÝ TÀI KHOẢN KHÁCH HÀNG'}</span></>}
            </button>
            <div className="text-center text-xs text-gray-500">
              <span>Đã có tài khoản? </span>
              <button type="button" onClick={() => switchTab('login')} className="text-primary font-bold hover:underline">Đăng nhập</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
