import React, { useState, useEffect } from 'react';
import { X, Lock, Phone, User, ArrowRight, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { UserSession } from '../../hooks/useUnifiedAuth';

interface UnifiedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
  mode?: 'ctv' | 'system';
  referralCode?: string;
  onSuccess: (user: UserSession) => void;
}

interface NppPackageOption {
  id: string;
  code: string;
  name: string;
  description: string | null;
  grossPrice: number | null;
  defaultDiscount: number;
  assignedRank: string;
  packageType: string;
  requiredQuantity: number | null;
}

const formatVND = (v: number | null | undefined): string => {
  if (v == null) return '—';
  return v.toLocaleString('vi-VN') + ' ₫';
};

const rankLabel = (r: string): string => ({ AMBASSADOR: 'Đại sứ', MANAGER: 'Trưởng nhóm', DIRECTOR: 'Quản lý' }[r] || r);

export const UnifiedAuthModal: React.FC<UnifiedAuthModalProps> = ({
  isOpen, onClose, initialTab = 'login', mode = 'ctv', referralCode = '', onSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRefCode, setRegRefCode] = useState(referralCode);
  // Registration type: 'none' | 'ctv' | 'npp' — mutually exclusive
  const [regType, setRegType] = useState<'none' | 'ctv' | 'npp'>('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // NPP registration state
  const [nppPackages, setNppPackages] = useState<NppPackageOption[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [loadingPackages, setLoadingPackages] = useState(false);

  useEffect(() => {
    if (isOpen) { setTab(initialTab); setError(''); setSuccessMsg(''); if (referralCode) setRegRefCode(referralCode); setRegType('none'); setSelectedPackageId(''); }
  }, [isOpen, initialTab, referralCode]);

  // Load NPP packages when NPP selected
  useEffect(() => {
    if (regType !== 'npp') return;
    if (nppPackages.length > 0) return;
    setLoadingPackages(true);
    fetch('/api/npp/packages/available-public')
      .then(r => r.json())
      .then(d => { if (d.success && d.data) setNppPackages(d.data); })
      .catch(() => {})
      .finally(() => setLoadingPackages(false));
  }, [regType]);

  const switchTab = (t: 'login' | 'register') => { setTab(t); setError(''); setSuccessMsg(''); };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: loginPhone, password: loginPassword }), credentials: 'include' });
      const data = await res.json();
      if (data.success && data.user) {
        // If NPP was selected during register-then-login, handle NPP registration after login
        onSuccess(data.user);
      } else { setError(data.message || 'Đăng nhập thất bại.'); }
    } catch { setError('Lỗi kết nối.'); }
    setLoading(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccessMsg('');
    // Validate NPP selection
    if (regType === 'npp' && !selectedPackageId) { setError('Vui lòng chọn gói NPP.'); return; }
    setLoading(true);
    try {
      const body: any = { fullName: regFullName, phone: regPhone, password: '123456', referralCode: regRefCode || undefined };
      // joinSystem only if CTV selected
      if (regType === 'ctv') body.joinSystem = true;
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        // If NPP selected, register NPP after account creation + auto-login
        if (regType === 'npp' && data.user) {
          onSuccess(data.user);
          // NPP registration via API
          try {
            const csrf = document.cookie.match(/csrf_token=([^;]*)/)?.[1] || '';
            await fetch('/api/npp/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': decodeURIComponent(csrf) },
              body: JSON.stringify({ packageId: selectedPackageId }),
              credentials: 'include',
            });
          } catch {}
          return;
        }
        if (data.user) { onSuccess(data.user); }
        else { setSuccessMsg('Đăng ký thành công! Mật khẩu mặc định: 123456'); switchTab('login'); }
      } else { setError(data.message || 'Đăng ký thất bại.'); }
    } catch { setError('Lỗi kết nối.'); }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"><X className="w-4 h-4" /></button>
        <div className="p-6 pt-8">
          <div className="text-center mb-5">
            <div className="w-12 h-12 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2"><User className="w-6 h-6" /></div>
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">TÀI KHOẢN WASYPRO</h2>
            <p className="text-xs text-gray-400 mt-0.5">Đăng nhập hoặc tạo tài khoản mới</p>
          </div>
          <div className="flex mb-5 bg-gray-100 rounded-xl p-1">
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => switchTab(t)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${tab === t ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>
                {t === 'login' ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}
              </button>
            ))}
          </div>
          {error && <div className="mb-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}</div>}
          {successMsg && <div className="mb-3 flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2.5 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />{successMsg}</div>}

          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Số điện thoại</label><div className="relative"><Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input type="tel" required autoFocus value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} placeholder="09..." className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all" /></div></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Mật khẩu</label><div className="relative"><Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••" className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all" /></div></div>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm uppercase tracking-wide shadow-md shadow-primary/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">{loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}{!loading && <ArrowRight className="w-4 h-4" />}</button>
              <div className="flex items-center justify-between pt-1">
                <span onClick={() => switchTab('register')} className="text-xs text-primary font-semibold hover:underline cursor-pointer">Chưa có tài khoản? Đăng ký</span>
                <span className="text-xs text-gray-400">Quên MK?{' '}<a href="tel:1900989878" className="text-primary hover:underline font-semibold">Liên hệ Admin</a></span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Họ và tên</label><div className="relative"><User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input type="text" required autoFocus value={regFullName} onChange={(e) => setRegFullName(e.target.value)} placeholder="Nhập họ và tên..." className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all" /></div></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Số điện thoại</label><div className="relative"><Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" /><input type="tel" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="09..." className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all" /></div></div>
              <div><label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase">Mã giới thiệu <span className="normal-case text-gray-400 font-normal">(nếu có)</span></label><input type="text" value={regRefCode} onChange={(e) => setRegRefCode(e.target.value.toUpperCase())} placeholder="VD: ADMIN01" className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all font-semibold tracking-wider" /></div>

              {/* ═══ CTV Option ═══ */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  regType === 'ctv'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-gray-200 bg-gray-50 hover:bg-primary/5 hover:border-primary/30'
                }`}
                onClick={() => setRegType(regType === 'ctv' ? 'none' : 'ctv')}
              >
                <input type="radio" name="regType" checked={regType === 'ctv'} readOnly className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-primary" />Tham gia chương trình Cộng Tác Viên</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Tích lũy điểm hoa hồng từ đơn hàng, nhận Business ID khi đạt 5.000 CP</p>
                </div>
              </label>

              {/* ═══ NPP Option ═══ */}
              <div className={`rounded-xl border transition-all ${
                regType === 'npp'
                  ? 'border-sky-400 bg-sky-50/80 ring-2 ring-sky-300/30'
                  : 'border-sky-200 bg-sky-50/50'
              }`}>
                <label
                  className="flex items-start gap-3 p-3.5 cursor-pointer hover:bg-sky-100/50 transition-all rounded-xl"
                  onClick={() => { setRegType(regType === 'npp' ? 'none' : 'npp'); }}
                >
                  <input type="radio" name="regType" checked={regType === 'npp'} readOnly className="mt-0.5 w-4 h-4 accent-sky-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">📦 Đăng ký trở thành Nhà Phân Phối (NPP)</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Đăng ký nhu cầu tham gia hệ thống NPP và lựa chọn gói NPP.</p>
                  </div>
                </label>

                {/* Package selection — only when NPP selected */}
                {regType === 'npp' && (
                  <div className="px-3.5 pb-3.5 pt-0">
                    <div className="border-t border-sky-200 pt-3">
                      <p className="text-xs font-bold text-gray-700 mb-2">Chọn gói NPP *</p>
                      {loadingPackages ? (
                        <p className="text-xs text-gray-400 text-center py-3">Đang tải gói NPP...</p>
                      ) : nppPackages.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-3">Hiện chưa có gói NPP nào.</p>
                      ) : (
                        <div className="space-y-2">
                          {nppPackages.map(pkg => (
                            <label
                              key={pkg.id}
                              className={`flex items-start gap-2.5 p-3 rounded-lg cursor-pointer transition-all border ${
                                selectedPackageId === pkg.id
                                  ? 'border-sky-400 bg-sky-100/70 shadow-sm'
                                  : 'border-gray-200 bg-white hover:border-sky-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name="nppPackage"
                                value={pkg.id}
                                checked={selectedPackageId === pkg.id}
                                onChange={() => setSelectedPackageId(pkg.id)}
                                className="mt-0.5 accent-sky-500 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800">{pkg.name}</p>
                                {pkg.packageType === 'CAPITAL' ? (
                                  <p className="text-[11px] text-gray-500 mt-0.5">{formatVND(pkg.grossPrice)} · {rankLabel(pkg.assignedRank)}</p>
                                ) : (
                                  <p className="text-[11px] text-gray-500 mt-0.5">{pkg.requiredQuantity} máy · CK {(pkg.defaultDiscount / 100)}% · {rankLabel(pkg.assignedRank)}</p>
                                )}
                                {pkg.description && <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{pkg.description}</p>}
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm uppercase tracking-wide shadow-md shadow-primary/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2">{loading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản'}{!loading && <ArrowRight className="w-4 h-4" />}</button>
              <div className="text-center"><span onClick={() => switchTab('login')} className="text-xs text-primary font-semibold hover:underline cursor-pointer">Đã có tài khoản? Đăng nhập</span></div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
