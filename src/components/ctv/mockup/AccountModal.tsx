import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Lock, 
  Check, 
  Copy, 
  QrCode, 
  Save, 
  AlertCircle, 
  ShieldCheck, 
  Users 
} from 'lucide-react';
import { UserSession } from '../../../hooks/useUnifiedAuth';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  onUserUpdated?: (updated: any) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState((currentUser as any).email || '');
  const [address, setAddress] = useState((currentUser as any).address || '');

  // Bank states
  const [bankAccount, setBankAccount] = useState((currentUser as any).bankAccount || '');
  const [bankHolder, setBankHolder] = useState((currentUser as any).bankHolder || (currentUser as any).bankInfo || '');
  const [bankName, setBankName] = useState((currentUser as any).bankName || '');
  const [bankBranch, setBankBranch] = useState((currentUser as any).bankBranch || '');
  const [isBankLocked, setIsBankLocked] = useState(!!(currentUser as any).isBankLocked);

  // Sponsor state
  const sponsor = (currentUser as any).sponsor;

  // Refresh profile from /api/auth/me when modal opens
  useEffect(() => {
    if (isOpen) {
      setMsg(null);
      fetch('/api/auth/me', { credentials: 'include' })
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data) {
            const d = res.data;
            setFullName(d.fullName || '');
            setPhone(d.phone || '');
            setEmail(d.email || '');
            setAddress(d.address || '');
            setBankAccount(d.bankAccount || '');
            setBankHolder(d.bankHolder || d.bankInfo || '');
            setBankName(d.bankName || '');
            setBankBranch(d.bankBranch || '');
            setIsBankLocked(!!d.isBankLocked);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    }
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://test.wasypro.com';
  const partnerId = currentUser.id || currentUser.userId;
  const refLink = `${origin}/?ref=${partnerId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(refLink)}`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const payload: any = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
      };

      // Only send bank fields if not locked yet
      if (!isBankLocked) {
        if (bankAccount.trim()) payload.bankAccount = bankAccount.trim();
        if (bankHolder.trim()) {
          payload.bankHolder = bankHolder.trim().toUpperCase();
          payload.bankInfo = bankHolder.trim().toUpperCase();
        }
        if (bankName.trim()) payload.bankName = bankName.trim();
        if (bankBranch.trim()) payload.bankBranch = bankBranch.trim();
      }

      const res = await fetch('/api/users/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'success', text: data.message || 'Cập nhật thông tin thành công!' });
        if (data.data) {
          setIsBankLocked(!!data.data.isBankLocked);
          if (onUserUpdated) onUserUpdated(data.data);
        }
      } else {
        setMsg({ type: 'error', text: data.message || 'Lỗi cập nhật thông tin.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Lỗi kết nối máy chủ: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-fadeIn" style={{ overscrollBehavior: "contain" }} onClick={onClose}>
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0072F5] to-[#0052CC] text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Thông Tin Tài Khoản</h3>
              <p className="text-[11px] text-white/80">Quản lý hồ sơ, link giới thiệu & bảo mật ngân hàng</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer shrink-0" aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 overscroll-y-contain">
          {/* Status Message */}
          {msg && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              msg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {msg.type === 'success' ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}

          {/* BOX 1: LINK & MÃ GIỚI THIỆU */}
          <div className="bg-[#F0F7FF] border border-[#D4E8FC] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🔗</span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0052CC]">Link & Mã Giới Thiệu Đối Tác</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="text-xs font-semibold text-[#0072F5] hover:underline flex items-center gap-1"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQr ? 'Ẩn mã QR' : 'Mã QR'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 border border-[#D4E8FC]">
              <input
                type="text"
                readOnly
                value={refLink}
                className="flex-1 text-xs text-slate-700 font-mono px-2 py-1 outline-hidden bg-transparent truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-[#0072F5] hover:bg-[#0052CC] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>

            {showQr && (
              <div className="flex flex-col items-center pt-2 pb-1 animate-fadeIn">
                <img src={qrUrl} alt="QR Giới thiệu" className="w-40 h-40 rounded-xl border border-slate-200 shadow-xs" />
                <span className="text-[11px] text-slate-500 mt-2 font-medium">Quét mã để truy cập link giới thiệu trực tiếp</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* BOX 2: THÔNG TIN CÁ NHÂN (CÓ THỂ SỬA ĐỔI) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3.5 shadow-2xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="text-base">👤</span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">1. Thông Tin Cá Nhân</h4>
                  <p className="text-[11px] text-slate-500">Có thể chỉnh sửa họ tên, số điện thoại, email và địa chỉ</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Họ và tên */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Họ và tên *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-[#0072F5] focus:ring-1 focus:ring-[#0072F5] outline-hidden font-medium"
                    />
                  </div>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Số điện thoại *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0901234567"
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-[#0072F5] focus:ring-1 focus:ring-[#0072F5] outline-hidden font-medium"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-[#0072F5] focus:ring-1 focus:ring-[#0072F5] outline-hidden font-medium"
                    />
                  </div>
                </div>

                {/* Địa chỉ */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Địa chỉ thường trú</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số nhà, đường, phường, quận..."
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-[#0072F5] focus:ring-1 focus:ring-[#0072F5] outline-hidden font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BOX 3: THÔNG TIN NGÂN HÀNG (CƠ CHẾ KHÓA BẢO MẬT) */}
            <div className={`rounded-2xl p-4 space-y-3.5 border transition-all ${
              isBankLocked 
                ? 'bg-slate-50/80 border-slate-300' 
                : 'bg-amber-50/50 border-amber-200'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏦</span>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">2. Tài Khoản Ngân Hàng</h4>
                    <p className="text-[11px] text-slate-500">Nhận chi trả hoa hồng và thưởng đối tác</p>
                  </div>
                </div>

                {isBankLocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200/80 text-slate-700 rounded-full text-[10px] font-extrabold uppercase tracking-wide border border-slate-300 shadow-2xs">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Đã Khóa Bảo Mật</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                    <span>⚠️ Điền 1 lần & sẽ khóa</span>
                  </span>
                )}
              </div>

              {isBankLocked && (
                <div className="p-2.5 rounded-xl bg-amber-100/60 border border-amber-300/80 text-amber-900 text-[11px] font-medium leading-relaxed flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Thông tin tài khoản ngân hàng đã được <b>khóa cố định</b> nhằm chống gian lận hoa hồng. Nếu cần thay đổi số tài khoản, vui lòng liên hệ Ban Quản Trị hoặc Hotline CSKH để xác minh danh tính.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Số tài khoản */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Số tài khoản *</label>
                  <input
                    type="text"
                    disabled={isBankLocked}
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="VD: 0123456789"
                    className={`w-full text-xs px-3 py-2 rounded-xl border outline-hidden font-mono font-bold ${
                      isBankLocked 
                        ? 'bg-slate-100 border-slate-300 text-slate-600 cursor-not-allowed' 
                        : 'bg-white border-slate-200 focus:border-[#0072F5] text-slate-900'
                    }`}
                  />
                </div>

                {/* Chủ tài khoản */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Chủ tài khoản *</label>
                  <input
                    type="text"
                    disabled={isBankLocked}
                    value={bankHolder}
                    onChange={(e) => setBankHolder(e.target.value.toUpperCase())}
                    placeholder="VD: NGUYEN VAN A"
                    className={`w-full text-xs px-3 py-2 rounded-xl border outline-hidden font-bold uppercase ${
                      isBankLocked 
                        ? 'bg-slate-100 border-slate-300 text-slate-600 cursor-not-allowed' 
                        : 'bg-white border-slate-200 focus:border-[#0072F5] text-slate-900'
                    }`}
                  />
                </div>

                {/* Tên ngân hàng */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tên ngân hàng *</label>
                  <input
                    type="text"
                    disabled={isBankLocked}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="VD: Vietcombank, MB, Techcombank..."
                    className={`w-full text-xs px-3 py-2 rounded-xl border outline-hidden font-medium ${
                      isBankLocked 
                        ? 'bg-slate-100 border-slate-300 text-slate-600 cursor-not-allowed' 
                        : 'bg-white border-slate-200 focus:border-[#0072F5] text-slate-900'
                    }`}
                  />
                </div>

                {/* Chi nhánh */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Chi nhánh</label>
                  <input
                    type="text"
                    disabled={isBankLocked}
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    placeholder="VD: Chi nhánh TP.HCM"
                    className={`w-full text-xs px-3 py-2 rounded-xl border outline-hidden font-medium ${
                      isBankLocked 
                        ? 'bg-slate-100 border-slate-300 text-slate-600 cursor-not-allowed' 
                        : 'bg-white border-slate-200 focus:border-[#0072F5] text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* BOX 4: NGƯỜI GIỚI THIỆU (ĐỐI TÁC ĐỒNG HÀNH) */}
            <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 pb-1.5 border-b border-sky-100">
                <span className="text-base">🤝</span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-950">3. Người Giới Thiệu (Đối Tác Đồng Hành)</h4>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-sky-950 text-sm flex flex-wrap items-center gap-2">
                    <span>{sponsor?.fullName || 'Công Ty Cổ Phần WasyPro'}</span>
                    {sponsor?.userId && (
                      <span className="text-[11px] font-mono font-bold bg-sky-200/80 text-sky-900 px-2 py-0.5 rounded-md">
                        Mã: {sponsor.userId}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-sky-700 mt-0.5 flex items-center gap-3">
                    <span>SĐT: <b>{sponsor?.phone || '1900 98 98 78'}</b></span>
                    {sponsor?.rank && <span>Cấp bậc: <b>{sponsor.rank}</b></span>}
                  </div>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Sticky Save Footer - always visible */}
        <div className="shrink-0 px-4 py-3 border-t border-gray-100 bg-white safe-bottom" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              const form = document.querySelector('#account-modal-form') as HTMLFormElement;
              if (form) form.requestSubmit();
            }}
            className="w-full h-12 bg-[#0072F5] hover:bg-[#0052CC] text-white rounded-xl font-bold text-sm transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu Thay Đổi Thông Tin</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
