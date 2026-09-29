import React, { useState, useEffect } from 'react';
import { X, User, Phone, Lock, ChevronRight, Loader2, UserPlus, Shield } from 'lucide-react';

interface UserSession { id: string; fullName: string; phone: string; role?: string; [key: string]: any; }
interface NppPackage { id: string; code: string; name: string; description: string; defaultDiscount: number; assignedRank: string; packageType: string; requiredQuantity: number; }

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

  // Register
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRefCode, setRegRefCode] = useState(referralCode);
  const [regType, setRegType] = useState<'none' | 'ctv' | 'npp'>('none');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [nppPackages, setNppPackages] = useState<NppPackage[]>([]);

  const hasReferral = Boolean(referralCode && referralCode.trim());

  useEffect(() => { setTab(initialTab); }, [initialTab]);
  useEffect(() => {
    if (referralCode && referralCode.trim()) {
      setRegRefCode(referralCode.trim().toUpperCase());
    } else {
      setRegRefCode('');
      setRegType('none');
      setSelectedPackageId('');
    }
  }, [referralCode, isOpen]);

  // Load NPP packages from PUBLIC endpoint (no auth required)
  useEffect(() => {
    if (tab === 'register' && hasReferral) {
      fetch('/api/npp/packages/available-public')
        .then(r => r.json())
        .then(d => { if (d.success) setNppPackages(d.data || []); })
        .catch(() => {});
    }
  }, [tab, hasReferral]);

  const switchTab = (t: 'login' | 'register') => { setTab(t); setError(''); setSuccessMsg(''); };

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
    // Package is OPTIONAL — no validation required

    try {
      const body: any = {
        fullName: regFullName.trim(),
        phone: regPhone.trim(),
        password: '123456',
        referralCode: hasReferral ? (referralCode.trim().toUpperCase() || undefined) : undefined,
      };
      if (hasReferral && regType === 'ctv') body.joinSystem = true;
      if (hasReferral && regType === 'npp') {
        body.registerNpp = true;
        if (selectedPackageId) body.nppPackageId = selectedPackageId;
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
          <h2 className="text-lg font-extrabold text-gray-900">TÀI KHOẢN WASYPRO</h2>
          <p className="text-xs text-gray-500 mt-1">Đăng nhập hoặc tạo tài khoản mới</p>
        </div>

        {/* Tab Switch */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden mb-5">
          <button onClick={() => switchTab('login')} className={`flex-1 py-2.5 text-sm font-bold transition-colors ${tab === 'login' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}>ĐĂNG NHẬP</button>
          <button onClick={() => switchTab('register')} className={`flex-1 py-2.5 text-sm font-bold transition-colors ${tab === 'register' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'}`}>ĐĂNG KÝ</button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
        {successMsg && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{successMsg}</div>}

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
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Mật khẩu</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="••••••" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>ĐĂNG NHẬP</span><ChevronRight className="w-4 h-4" /></>}
            </button>
            <div className="text-center text-xs text-gray-500">
              <span>Chưa có tài khoản? </span>
              <button type="button" onClick={() => switchTab('register')} className="text-primary font-bold hover:underline">Đăng ký</button>
              <span className="mx-2">·</span>
              <span>Quên MK? </span>
              <span className="text-primary font-bold">Liên hệ Admin</span>
            </div>
          </form>
        )}

        {/* ─── REGISTER FORM ─── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Họ và tên</label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={regFullName} onChange={e => setRegFullName(e.target.value)} placeholder="Nguyễn Văn A" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary" required />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Số điện thoại</label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="0900000000" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary" required />
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
                      value={referralCode.trim().toUpperCase()}
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

                {/* CTV / NPP Selection — Radio (mutual exclusive, neither default) */}
                <div className="space-y-2">
                  <div
                    onClick={() => { setRegType(regType === 'ctv' ? 'none' : 'ctv'); setSelectedPackageId(''); }}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${regType === 'ctv' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${regType === 'ctv' ? 'border-blue-500' : 'border-gray-300'}`}>
                        {regType === 'ctv' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">👥 Tham gia chương trình Cộng Tác Viên</div>
                        <div className="text-xs text-gray-500 mt-0.5">Tích lũy điểm hoa hồng từ đơn hàng, nhận Business ID khi đạt 5.000 CP</div>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => { setRegType(regType === 'npp' ? 'none' : 'npp'); }}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${regType === 'npp' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${regType === 'npp' ? 'border-emerald-500' : 'border-gray-300'}`}>
                        {regType === 'npp' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                      </div>
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">🏪 Đăng ký trở thành Nhà Phân Phối (NPP)</div>
                        <div className="text-xs text-gray-500 mt-0.5">Đăng ký nhu cầu tham gia hệ thống NPP và lựa chọn gói NPP.</div>
                      </div>
                    </div>

                    {/* NPP Package Selection — OPTIONAL */}
                    {regType === 'npp' && nppPackages.length > 0 && (
                      <div className="mt-3 ml-8 space-y-2">
                        <label className="text-xs font-bold text-gray-700">Chọn gói NPP <span className="font-normal text-gray-400">(không bắt buộc — có thể chọn sau)</span></label>
                        {nppPackages.map(pkg => (
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
                                  {pkg.packageType === 'PRODUCT_COMBO' 
                                    ? `${pkg.requiredQuantity} máy · CK ${(pkg.defaultDiscount / 100).toFixed(0)}% · ${pkg.assignedRank === 'AMBASSADOR' ? 'Đại sứ' : pkg.assignedRank === 'MANAGER' ? 'Trưởng nhóm' : pkg.assignedRank}`
                                    : `Gói vốn · ${pkg.assignedRank === 'AMBASSADOR' ? 'Đại sứ' : pkg.assignedRank === 'MANAGER' ? 'Trưởng nhóm' : pkg.assignedRank}`
                                  }
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
              /* Khách vãng lai trực tiếp từ website: Ẩn mã ref & CTV/NPP, hiển thị Call-To-Action */
              <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-950 space-y-2.5 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <span className="text-xl shrink-0">📢</span>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-700">
                      Bạn muốn tham gia CTV hoặc Nhà Phân Phối?
                    </h4>
                    <p className="text-xs text-red-950 mt-1 leading-relaxed">
                      Để đăng ký tham gia mạng lưới kinh doanh <span className="font-bold text-red-700">Cộng Tác Viên (CTV)</span> hoặc <span className="font-bold text-red-700">Nhà Phân Phối (NPP)</span>, bạn cần có <span className="font-bold text-red-700">Mã Người Giới Thiệu (UID)</span>.
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Vui lòng liên hệ Người bảo trợ của bạn hoặc liên hệ Water King để được hướng dẫn và cấp mã:
                    </p>
                  </div>
                </div>

                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <a
                    href="https://zalo.me/2928413591064686973"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors text-center"
                  >
                    <span>💬 Zalo OA Water King</span>
                  </a>
                  <a
                    href="tel:1900989878"
                    className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors text-center"
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
