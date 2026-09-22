import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, User, Award, Star, CheckCircle, AlertCircle, Camera, Trash2, Upload } from 'lucide-react';
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

  const isParticipant = !!currentUser.isSystemParticipant || !!currentUser.isNpp || !!currentUser.hasNppRegistration;
  const qp = currentUser.qualifyingPoints || 0;

  const roleText = currentUser.role === 'admin' ? 'Quản Trị Viên'
    : currentUser.role === 'accountant' ? 'Kế Toán'
    : currentUser.isNpp ? 'Nhà Phân Phối (NPP)' : currentUser.hasNppRegistration ? 'NPP - Chờ kích hoạt' : isParticipant ? 'Đối Tác CTV'
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
              ID: {currentUser.id || currentUser.userId}
            </div>
          </div>
        </div>

        {/* Avatar status message */}
        {avatarMsg && (
          <div className={`text-xs font-semibold px-3 py-2 rounded-lg ${
            avatarMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
            <RankBadge tier={currentUser.tier} rank={currentUser.rank} isSystemParticipant={isParticipant} size="md" />
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
                <span className="text-xs font-semibold text-amber-600 italic">Chưa cấp (Cần đạt 5.000 CP)</span>
              )}
            </div>
          </div>

          {/* Qualifying Points */}
          <div className="bg-gray-50/80 border border-gray-200/60 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User size={14} className="text-blue-500" /> Điểm Tích Lũy (CP)
            </div>
            <div className="font-extrabold text-blue-600 text-sm">
              {qp.toLocaleString('vi-VN')} <span className="text-xs text-secondary font-normal">/ 5.000 CP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trạng thái tham gia */}
      <div className="glass-panel p-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">
          Trạng Thái Tham Gia Hệ Thống Đối Tác
        </div>
        {isParticipant ? (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
            <CheckCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-emerald-900">Đang tham gia hệ thống đối tác WasyPro</div>
              {currentUser.participantAt && (
                <div className="text-xs text-emerald-700 mt-0.5">
                  Kích hoạt ngày: {new Date(currentUser.participantAt).toLocaleDateString('vi-VN')}
                </div>
              )}
              <p className="text-xs text-emerald-700/80 mt-1">
                Tài khoản được tích lũy Qualifying Points (CP) khi phát sinh đơn hàng cá nhân.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-amber-900">!currentUser.hasNppRegistration ? 'Chưa tham gia hệ thống đối tác' : 'NPP - Đang xử lý'</div>
              <div className="text-xs text-amber-700 mt-0.5">
                Vào tab Gói NPP để xem trạng thái và mua gói "Tham Gia Hệ Thống" để bắt đầu tích lũy điểm xét chuẩn.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tiến độ cấp bậc */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-secondary uppercase tracking-wider px-1">
          Tiến Trình Cấp Bậc
        </div>
        <AmbassadorProgressCard userId={currentUser.id || currentUser.userId} />
      </div>
    </div>
  );
}
