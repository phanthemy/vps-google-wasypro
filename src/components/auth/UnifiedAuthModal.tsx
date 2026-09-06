import React, { useState, useEffect } from 'react';
import { X, Lock, Phone, User, Award, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { UserSession } from '../../hooks/useUnifiedAuth';

interface UnifiedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  mode?: 'ctv' | 'system';
  referralCode?: string;
  onSuccess: (user: UserSession) => void;
}

export const UnifiedAuthModal: React.FC<UnifiedAuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'login',
  mode = 'ctv',
  referralCode = '',
  onSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  
  // Login form
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRefCode, setRegRefCode] = useState(referralCode);
  const [regRole, setRegRole] = useState<'ctv' | 'customer'>('ctv');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setError('');
      setSuccessMsg('');
      if (referralCode) {
        setRegRefCode(referralCode);
      }
    }
  }, [isOpen, initialTab, referralCode]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone.trim(), password: loginPassword }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Số điện thoại hoặc mật khẩu không chính xác');
      }

      localStorage.setItem('crm_user', JSON.stringify(data.data));
      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      // Both CTV and customer paths use the same public register route.
      // joinSystem=true if user explicitly chooses CTV mode → isSystemParticipant=true immediately.
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName.trim(),
          phone: regPhone.trim(),
          password: '123456',
          refCode: regRefCode.trim() || undefined,
          joinSystem: regRole === 'ctv',  // CTV → tham gia hệ thống ngay khi đăng ký
        }),
        credentials: 'include',
      }).then(r => r.json());

      if (res && res.success) {
        setSuccessMsg('🎉 Đăng ký thành công! Mật khẩu mặc định là: 123456. Vui lòng đăng nhập.');
        setTab('login');
        setLoginPhone(regPhone.trim());
        setLoginPassword('123456');
      } else {
        setError(res?.message || res?.error || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-100 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-primary-dark via-primary to-accent p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30 shadow-inner">
            {mode === 'system' ? <ShieldCheck className="w-6 h-6 text-white" /> : <Award className="w-6 h-6 text-white" />}
          </div>
          <h3 className="text-xl font-extrabold tracking-wide uppercase">
            {mode === 'system' ? 'QUẢN TRỊ HỆ THỐNG WATER KING' : 'KINH DOANH WATER KING'}
          </h3>
          <p className="text-xs text-white/90 mt-1 font-medium">
            {mode === 'system' ? 'Đăng nhập Quản Trị Viên & Kế Toán Hệ Thống' : 'Cổng Quản Trị Đại Sứ & Cộng Tác Viên'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-100 bg-gray-50/80 p-1.5 gap-1.5 m-4 rounded-xl">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${
              tab === 'login'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-all ${
              tab === 'register'
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Đăng Ký Đại Sứ
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 pt-2">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Số điện thoại đăng nhập
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="09..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-primary-dark to-primary text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/25 hover:shadow-xl hover:from-primary hover:to-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Đang xác thực...' : 'Đăng Nhập Ngay'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center mt-3">
                <span 
                  onClick={() => { setTab('register'); setError(''); }}
                  className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                >
                  Chưa có tài khoản Đại sứ? Đăng ký ngay
                </span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Loại tài khoản
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('ctv')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      regRole === 'ctv'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    👑 Đại sứ / CTV
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('customer')}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      regRole === 'customer'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    👤 Khách Hàng
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Họ và tên
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Nhập họ và tên..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="09..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Mã người giới thiệu (Nếu có)
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regRefCode}
                    onChange={(e) => setRegRefCode(e.target.value.toUpperCase())}
                    placeholder="VD: S123 hoặc để trống"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-semibold text-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-accent to-primary text-primary-dark font-bold text-sm uppercase tracking-wider shadow-lg shadow-accent/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Đang tạo tài khoản...' : (regRole === 'ctv' ? 'Tạo Tài Khoản Đại Sứ Ngay' : 'Tạo Tài Khoản Khách Hàng')}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center mt-3">
                <span 
                  onClick={() => { setTab('login'); setError(''); }}
                  className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                >
                  Đã có tài khoản? Đăng nhập
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
