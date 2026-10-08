import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, User, Users, Award, Star, CheckCircle, AlertCircle, Camera, Trash2, Upload } from 'lucide-react';
import RankBadge from '../components/common/RankBadge.jsx';
import AmbassadorProgressCard from '../components/common/AmbassadorProgressCard.jsx';

export default function SettingsView({ currentUser: initialUser }) {
  const [user, setUser] = useState(initialUser);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch fresh data
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(res => { if (res.success && res.data) setUser(prev => ({ ...prev, ...res.data })); })
      .catch(() => {});
  }, []);

  const currentUser = user || initialUser;
  if (!currentUser) return null;

  const isNppUser = !!currentUser.isNpp || (currentUser.nppStatus && currentUser.nppStatus !== 'NONE');
  // isParticipant = CTV (joined system) OR NPP ACTIVE
  const isParticipant = !isNppUser ? !!currentUser.isSystemParticipant : (currentUser.isNpp || currentUser.nppStatus === 'ACTIVE');
  const qp = currentUser.qualifyingPoints || 0;

  const nppRoleMapS = { ACTIVE: 'Nhà Phân Phối (NPP)', PAID: 'NPP — Chờ Admin kích hoạt', PURCHASING: 'NPP — Đang mua gói', APPROVED: 'NPP — Đã duyệt', PENDING: 'NPP — Chờ duyệt' };
  const roleText = currentUser.role === 'admin' ? 'Quản Trị Viên'
    : currentUser.role === 'accountant' ? 'Kế Toán'
    : (currentUser.nppStatus && nppRoleMapS[currentUser.nppStatus]) ? nppRoleMapS[currentUser.nppStatus]
    : isParticipant ? 'Đối Tác CTV'
    : 'Khách Hàng';

function getCsrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return m ? m[1] : '';
}

  // ─── Avatar handlers ───────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarMsg({ type: 'error', text: 'Chỉ chấp nhận file ảnh (jpg, png, webp).' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg({ type: 'error', text: 'File ảnh tối đa 5MB.' });
      return;
    }

    setAvatarLoading(true);
    setAvatarMsg(null);

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const headers = {};
      const csrf = getCsrfToken();
      if (csrf) headers['X-CSRF-Token'] = csrf;

      const res = await fetch('/api/users/me/avatar', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUser(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
        setAvatarMsg({ type: 'success', text: 'Cập nhật ảnh đại diện thành công!' });
      } else {
        setAvatarMsg({ type: 'error', text: data.message || 'Lỗi upload ảnh.' });
      }
    } catch {
      setAvatarMsg({ type: 'error', text: 'Không thể kết nối máy chủ.' });
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Xoá ảnh đại diện hiện tại?')) return;
    setAvatarLoading(true);
    try {
      const headers = {};
      const csrf = getCsrfToken();
      if (csrf) headers['X-CSRF-Token'] = csrf;

      const res = await fetch('/api/users/me/avatar', {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });
      const data = await res.json();
      if (data.success) {
        setUser(prev => ({ ...prev, avatarUrl: null }));
        setAvatarMsg({ type: 'success', text: 'Đã xoá ảnh đại diện.' });
      }
    } catch {
      setAvatarMsg({ type: 'error', text: 'Lỗi kết nối.' });
    } finally {
      setAvatarLoading(false);
    }
  };

  const initials = (currentUser.fullName || 'U')[0].toUpperCase();

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full p-4 font-sans animate-fade-in">
      <div className="pb-2 border-b border-gray-100">
        <h2 className="text-xl font-extrabold text-primary">Thông Tin Tài Khoản</h2>
        <p className="text-xs text-secondary mt-0.5">Chi tiết định danh, cấp bậc và tiến trình đối tác WasyPro</p>
      </div>

      {/* Profile card */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5 border border-gray-100 bg-white shadow-sm">
        <div className="flex items-start gap-5">

          {/* Avatar section */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            {/* Avatar circle */}
            <div className="relative w-20 h-20">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt="Ảnh đại diện"
                  className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-black text-white shadow-md">
                  {initials}
                </div>
              )}
              {/* Camera overlay button */}
              {isParticipant && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarLoading}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                  title="Đổi ảnh đại diện"
                >
                  {avatarLoading ? (
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <Camera size={13} />
                  )}
                </button>
              )}
            </div>

            {/* Remove button */}
            {isParticipant && currentUser.avatarUrl && (
              <button
                onClick={handleRemoveAvatar}
                disabled={avatarLoading}
                className="flex items-center gap-1 text-[11px] text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                <Trash2 size={11} /> Xoá ảnh
              </button>
            )}

            {/* Upload hint for participants without avatar */}
            {isParticipant && !currentUser.avatarUrl && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium transition-colors"
              >
                <Upload size={11} /> Tải ảnh lên
              </button>
            )}

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <div className="text-xl font-extrabold text-primary truncate">{currentUser.fullName || '—'}</div>
            <div className="text-sm font-medium text-secondary">{currentUser.phone || '—'}</div>
            <div className="text-xs font-mono text-muted mt-1 bg-gray-100 px-2 py-0.5 rounded inline-block">
              ID: {currentUser.id || currentUser.id}
            </div>
          </div>
        </div>

        {/* Avatar status message */}
        {avatarMsg && (
          <div className={`text-xs font-semibold px-3 py-2 rounded-lg ${
            avatarMsg.type === 'success'
              ? 'bg-sky-50 text-sky-700 border border-sky-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {avatarMsg.text}
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-1">
          {/* Cấp Bậc */}
          <div className="bg-gray-50/80 border border-gray-200/60 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award size={14} className="text-primary" /> Cấp Bậc
            </div>
            {isNppUser && !currentUser.rank && !currentUser.nppRank ? (
              <span className="inline-flex items-center rounded-full font-bold whitespace-nowrap shadow-sm text-xs px-2.5 py-1 gap-1.5 text-amber-700 bg-amber-50 border border-amber-300">
                <span>⏳</span>
                <span>Chờ kích hoạt</span>
              </span>
            ) : (
              <RankBadge tier={currentUser.tier} rank={currentUser.rank} nppRank={currentUser.nppRank} isSystemParticipant={isParticipant} size="md" />
            )}
          </div>

          {/* Vai Trò */}
          <div className="bg-gray-50/80 border border-gray-200/60 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-primary" /> Vai Trò
            </div>
            <div className="font-extrabold text-primary text-sm">{roleText}</div>
          </div>

          {/* Business ID */}
          <div className="bg-gray-50/80 border border-gray-200/60 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Star size={14} className="text-amber-500" /> Business ID
            </div>
            <div>
              {currentUser.businessId ? (
                <span className="font-extrabold text-primary font-mono text-sm bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded shadow-sm">
                  {currentUser.businessId}
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-600 italic">
                  {currentUser.nppStatus === "PAID" ? "Chờ Admin kích hoạt để nhận BID" :
                   currentUser.nppStatus === "PURCHASING" ? "Hoàn tất thanh toán gói để nhận BID" :
                   currentUser.nppStatus === "APPROVED" ? "Đặt mua gói NPP để nhận BID" :
                   currentUser.nppStatus === "PENDING" ? "Chờ duyệt đăng ký để mua gói nhận BID" :
                   "Chưa cấp (Cần đạt 5.000 CP)"}
                </span>
              )}
            </div>
          </div>

          {/* Qualifying Points (CTV) or NPP Status */}
          <div className="bg-gray-50/80 border border-gray-200/60 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User size={14} className="text-blue-500" /> {isNppUser ? "Trạng thái NPP" : "Điểm Tích Lũy (CP)"}
            </div>
            <div className="font-extrabold text-blue-600 text-sm">
              {isNppUser ? (
                currentUser.isNpp || currentUser.nppStatus === 'ACTIVE' ? (
                  <span className="text-sky-600">NPP Đã Kích Hoạt</span>
                ) : currentUser.nppStatus === "PAID" ? (
                  <span className="text-amber-600">Chờ Admin kích hoạt</span>
                ) : currentUser.nppStatus === "PURCHASING" ? (
                  <span className="text-blue-600">Đang thanh toán gói NPP</span>
                ) : currentUser.nppStatus === "APPROVED" ? (
                  <span className="text-sky-600">Đã duyệt — Chờ mua gói</span>
                ) : (
                  <span className="text-amber-600">Chờ Admin duyệt đăng ký</span>
                )
              ) : (
                <>{qp.toLocaleString("vi-VN")} <span className="text-xs text-secondary font-normal">/ 5.000 CP</span></>
              )}
            </div>
          </div>
        </div>

        {/* Người Bảo Trợ (Sponsor / Tuyến Trên) */}
        <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Users size={20} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Người Bảo Trợ Trực Tiếp (Tuyến Trên)</div>
              {currentUser.sponsor ? (
                <div className="font-extrabold text-sky-950 text-sm sm:text-base flex flex-wrap items-center gap-2 mt-0.5">
                  <span>{currentUser.sponsor.fullName}</span>
                  <span className="text-xs font-mono font-bold bg-sky-200/70 text-sky-900 px-2 py-0.5 rounded">
                    Mã: {currentUser.sponsor.userId || currentUser.sponsor.id}
                  </span>
                  {currentUser.sponsor.phone && (
                    <span className="text-xs font-mono text-sky-700 bg-white/80 border border-sky-200 px-2 py-0.5 rounded">
                      SĐT: {currentUser.sponsor.phone}
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-sm font-semibold text-gray-600 mt-0.5">Hệ Thống Trực Tiếp (Công Ty)</div>
              )}
            </div>
          </div>
          {currentUser.sponsor?.businessId && (
            <div className="text-left sm:text-right shrink-0">
              <div className="text-[10px] text-sky-700 font-semibold uppercase">Business ID Sponsor</div>
              <div className="text-xs font-mono font-bold text-sky-900">{currentUser.sponsor.businessId}</div>
            </div>
          )}
        </div>
      </div>

      {/* Trạng thái tham gia: CTV hiện box CP, NPP hiện thông tin theo dõi gói */}
      {isNppUser ? (
        currentUser.nppStatus !== 'ACTIVE' && (
          <div className="glass-panel p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">
              Thông Tin Kích Hoạt Nhà Phân Phối (NPP)
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-amber-900">
                  {currentUser.nppStatus === 'PENDING' ? 'Hồ sơ đăng ký NPP đang chờ Admin phê duyệt' :
                   currentUser.nppStatus === 'APPROVED' ? 'Đăng ký đã được duyệt — Vui lòng đặt mua gói NPP' :
                   currentUser.nppStatus === 'PURCHASING' ? 'Đang trong quá trình mua & thanh toán gói NPP' :
                   currentUser.nppStatus === 'PAID' ? 'Đã hoàn tất thanh toán — Chờ Admin duyệt kích hoạt' :
                   'Nhà Phân Phối'}
                </div>
                <div className="text-xs text-amber-700 mt-1">
                  Cấp bậc và Business ID của Nhà Phân Phối được kích hoạt trực tiếp từ Gói NPP (không qua tích lũy 5.000 CP).
                  Vui lòng theo dõi chi tiết tại tab <strong>Gói NPP</strong>.
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="glass-panel p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">
            Trạng Thái Tham Gia Hệ Thống Đối Tác
          </div>
          {isParticipant ? (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800">
              <CheckCircle size={20} className="text-sky-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-sky-900">Đang tham gia hệ thống đối tác WasyPro</div>
                {currentUser.participantAt && (
                  <div className="text-xs text-sky-700 mt-0.5">
                    Kích hoạt ngày: {new Date(currentUser.participantAt).toLocaleDateString('vi-VN')}
                  </div>
                )}
                <p className="text-xs text-sky-700/80 mt-1">
                  Tài khoản được tích lũy Qualifying Points (CP) khi phát sinh đơn hàng cá nhân.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm text-amber-900">Chưa tham gia hệ thống đối tác</div>
                <div className="text-xs text-amber-700 mt-0.5">
                  Đăng ký tham gia hệ thống CTV hoặc Nhà Phân Phối để nhận quyền lợi hoa hồng.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tiến độ cấp bậc — CHỈ DÀNH CHO CTV THƯỜNG, NPP KHÔNG DÙNG CP */}
      {!isNppUser && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-secondary uppercase tracking-wider px-1">
            Tiến Trình Cấp Bậc
          </div>
          <AmbassadorProgressCard userId={currentUser.id || currentUser.id} />
        </div>
      )}

      {/* Đổi Mật Khẩu */}
      <ChangePasswordSection mustChange={currentUser.mustChangePassword || currentUser.requirePasswordChange} />
    </div>
  );
}

function ChangePasswordSection({ mustChange }) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [showForm, setShowForm] = useState(!!mustChange);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPw.length < 4) { setMsg({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 4 ký tự' }); return; }
    if (newPw !== confirmPw) { setMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' }); return; }

    setLoading(true);
    setMsg(null);
    try {
      // Get CSRF token
      let csrfToken = '';
      try {
        const metaEl = document.querySelector('meta[name="csrf-token"]');
        if (metaEl) csrfToken = metaEl.getAttribute('content');
        if (!csrfToken) {
          const r = await fetch('/api/csrf-token', { credentials: 'include' });
          const d = await r.json();
          csrfToken = d.csrfToken || '';
        }
      } catch(e) {}

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ type: 'success', text: '✅ Đổi mật khẩu thành công!' });
        setCurrentPw(''); setNewPw(''); setConfirmPw('');
        setTimeout(() => setShowForm(false), 2000);
      } else {
        setMsg({ type: 'error', text: data.message || 'Lỗi đổi mật khẩu' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Lỗi kết nối' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-bold text-secondary uppercase tracking-wider px-1 flex items-center justify-between">
        <span>Đổi Mật Khẩu</span>
        {!mustChange && !showForm && (
          <button onClick={() => setShowForm(true)} className="text-xs text-blue-600 hover:text-blue-800 font-semibold normal-case">
            Đổi mật khẩu →
          </button>
        )}
      </div>

      {mustChange && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm text-amber-900">Bạn cần đổi mật khẩu</div>
            <div className="text-xs text-amber-700 mt-0.5">
              Admin đã reset mật khẩu của bạn. Vui lòng đặt mật khẩu mới để bảo mật tài khoản.
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          {msg && (
            <div className={`p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${msg.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
              {msg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
              {msg.text}
            </div>
          )}

          {!mustChange && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Mật khẩu hiện tại</label>
              <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại" required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Mật khẩu mới</label>
            <input type="text" value={newPw} onChange={e => setNewPw(e.target.value)}
              placeholder="Nhập mật khẩu mới (tối thiểu 4 ký tự)" required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Xác nhận mật khẩu mới</label>
            <input type="text" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              placeholder="Nhập lại mật khẩu mới" required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          </div>

          <div className="flex gap-2">
            {!mustChange && (
              <button type="button" onClick={() => { setShowForm(false); setMsg(null); }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors">
                Hủy
              </button>
            )}
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50">
              {loading ? 'Đang lưu...' : '🔑 Đổi Mật Khẩu'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
