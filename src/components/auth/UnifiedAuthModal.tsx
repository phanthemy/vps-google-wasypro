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
  const [joinCtv, setJoinCtv] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // NPP registration state
  const [wantNpp, setWantNpp] = useState(false);
  const [nppPackages, setNppPackages] = useState<NppPackageOption[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [loadingPackages, setLoadingPackages] = useState(false);

  useEffect(() => {
    if (isOpen) { setTab(initialTab); setError(''); setSuccessMsg(''); if (referralCode) setRegRefCode(referralCode); setWantNpp(false); setSelectedPackageId(''); }
  }, [isOpen, initialTab, referralCode]);

  // Load NPP packages when user checks NPP
  useEffect(() => {
    if (!wantNpp) { setNppPackages([]); setSelectedPackageId(''); return; }
    setLoadingPackages(true);
    fetch('/api/npp/packages/available-public')
      .then(r => r.ok ? r.json() : Promise.resolve({ data: [] }))
      .then(d => setNppPackages(d.data || []))
      .catch(() => setNppPackages([]))
      .finally(() => setLoadingPackages(false));
  }, [wantNpp]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', { credentials: 'include', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: loginPhone.trim(), password: loginPassword }) });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Số điện thoại hoặc mật khẩu không chính xác');
      localStorage.setItem('crm_user', JSON.stringify(data.data));
      onSuccess(data.data); onClose();
    } catch (err: any) { setError(err.message || 'Lỗi kết nối máy chủ'); } finally { setLoading(false); }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);

    // Validate NPP selection
    if (wantNpp && !selectedPackageId) {
      setError('Vui lòng chọn một gói NPP.');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Register account
      const res = await fetch('/api/auth/register', { credentials: 'include', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: regFullName.trim(), phone: regPhone.trim(), password: '123456', refCode: regRefCode.trim() || undefined, joinSystem: joinCtv }) }).then(r => r.json());

      if (!res?.success) {
        setError(res?.message || res?.error || 'Đăng ký không thành công. Vui lòng kiểm tra lại.');
        setLoading(false);
        return;
      }

      // Step 2: If NPP selected, auto-login then register NPP
      if (wantNpp && selectedPackageId) {
        try {
          const loginRes = await fetch('/api/auth/login', {
            credentials: 'include', method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: regPhone.trim(), password: '123456' })
          }).then(r => r.json());

          if (loginRes.success) {
            const csrfMatch = document.cookie.match(/(^|;\s*)csrf_token=([^;]*)/);
            const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[2]) : '';

            const nppRes = await fetch('/api/npp/register', {
              method: 'POST', credentials: 'include',
              headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}) },
              body: JSON.stringify({ packageId: selectedPackageId })
            }).then(r => r.json());

            if (nppRes.success) {
              setSuccessMsg('Đăng ký thành công! Đăng ký NPP đã được ghi nhận (chờ xử lý). Mật khẩu mặc định: 123456.');
            } else {
              setSuccessMsg('Đăng ký tài khoản thành công! Đăng ký NPP lỗi: ' + (nppRes.error || nppRes.message || '') + '. MK: 123456.');
            }
            // Logout so user can login fresh
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
          } else {
            setSuccessMsg('Đăng ký tài khoản thành công! Đăng ký NPP sẽ thực hiện sau khi đăng nhập. MK: 123456.');
          }
        } catch {
          setSuccessMsg('Đăng ký tài khoản thành công! Đăng ký NPP bị lỗi kết nối. MK: 123456.');
        }
      } else {
        setSuccessMsg('Đăng ký thành công! Mật khẩu mặc định: 123456. Vui lòng đăng nhập.');
      }

      setTab('login'); setLoginPhone(regPhone.trim()); setLoginPassword('123456');
      setRegFullName(''); setRegPhone(''); setRegRefCode(''); setJoinCtv(false);
      setWantNpp(false); setSelectedPackageId('');
    } catch (err: any) { setError(err.message || 'Lỗi kết nối máy chủ'); } finally { setLoading(false); }
  };

  const switchTab = (t: 'login' | 'register') => { setTab(t); setError(''); setSuccessMsg(''); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-primary-dark via-primary to-primary text-white px-6 pt-6 pb-5 text-center relative flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors" aria-label="Đóng"><X className="w-4 h-4 text-white" /></button>
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-white/20 flex items-center justify-center"><User className="w-5 h-5 text-white" /></div>
          <h3 className="text-base font-extrabold uppercase tracking-wide">Tài khoản WasyPro</h3>
          <p className="text-xs text-white/80 mt-0.5">Đăng nhập hoặc tạo tài khoản mới</p>
        </div>
        <div className="flex p-3 gap-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          {(['login', 'register'] as const).map((t) => (
            <button key={t} type="button" onClick={() => switchTab(t)} className={`flex-1 py-2 text-xs font-bold rounded-lg uppercase tracking-wide transition-all ${tab === t ? 'bg-white text-primary shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'login' ? 'Đăng Nhập' : 'Đăng Ký'}
            </button>
          ))}
        </div>
        <div className="px-6 py-5 overflow-y-auto">
          {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" /><span>{error}</span></div>}
          {successMsg && <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2"><CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" /><span>{successMsg}</span></div>}
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

              {/* CTV Checkbox */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-all">
                <input type="checkbox" checked={joinCtv} onChange={(e) => setJoinCtv(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-primary" />Tham gia chương trình Cộng Tác Viên</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Tích lũy điểm hoa hồng từ đơn hàng, nhận Business ID khi đạt 5.000 CP</p>
                </div>
              </label>

              {/* ═══ NPP REGISTRATION OPTION ═══ */}
              <div className="rounded-xl border border-sky-200 bg-sky-50/50">
                <label className="flex items-start gap-3 p-3.5 cursor-pointer hover:bg-sky-100/50 transition-all rounded-xl">
                  <input type="checkbox" checked={wantNpp} onChange={(e) => setWantNpp(e.target.checked)} className="mt-0.5 w-4 h-4 accent-sky-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">📦 Đăng ký trở thành Nhà Phân Phối (NPP)</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">Đăng ký nhu cầu tham gia hệ thống NPP và lựa chọn gói NPP.</p>
                  </div>
                </label>

                {/* Package selection */}
                {wantNpp && (
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
