import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Award, Star, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import RankBadge from '../components/common/RankBadge.jsx';
import AmbassadorProgressCard from '../components/common/AmbassadorProgressCard.jsx';

export default function SettingsView({ currentUser: initialUser }) {
  const [user, setUser] = useState(initialUser);

  // Fetch fresh data from /api/auth/me to ensure real-time accuracy
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setUser(prev => ({ ...prev, ...res.data }));
        }
      })
      .catch(() => {});
  }, []);

  const currentUser = user || initialUser;
  if (!currentUser) return null;

  const isParticipant = !!currentUser.isSystemParticipant;
  const qp = currentUser.qualifyingPoints || 0;

  // Clean Vietnamese role label
  const roleText = currentUser.role === 'admin'
    ? 'Quản Trị Viên'
    : currentUser.role === 'accountant'
    ? 'Kế Toán'
    : isParticipant
    ? 'Đối Tác Kinh Doanh'
    : 'Khách Hàng';

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full p-4 font-sans animate-fade-in">
      <div className="pb-2 border-b border-gray-100">
        <h2 className="text-xl font-extrabold text-primary">Thông Tin Tài Khoản</h2>
        <p className="text-xs text-secondary mt-0.5">Chi tiết định danh, cấp bậc và tiến trình đối tác WasyPro</p>
      </div>

      {/* Profile card */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5 border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-black text-white shadow-md">
            {(currentUser.fullName || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="text-xl font-extrabold text-primary">{currentUser.fullName || '—'}</div>
            <div className="text-sm font-medium text-secondary">{currentUser.phone || '—'}</div>
            <div className="text-xs font-mono text-muted mt-1 bg-gray-100 px-2 py-0.5 rounded inline-block">
              ID: {currentUser.id || currentUser.userId}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-1">
          {/* Cấp Bậc */}
          <div className="bg-gray-50/80 border border-gray-200/60 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award size={14} className="text-primary" /> Cấp Bậc
            </div>
            <div>
              <RankBadge 
                tier={currentUser.tier} 
                rank={currentUser.rank} 
                isSystemParticipant={isParticipant} 
                size="md" 
              />
            </div>
          </div>

          {/* Vai Trò */}
          <div className="bg-gray-50/80 border border-gray-200/60 rounded-xl p-3.5 flex flex-col justify-between">
            <div className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-primary" /> Vai Trò
            </div>
            <div className="font-extrabold text-primary text-sm">
              {roleText}
            </div>
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
                  Chưa cấp (Cần đạt 5.000 CP)
                </span>
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

      {/* Trạng thái tham gia hệ thống */}
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
              <div className="font-bold text-sm text-amber-900">Chưa tham gia hệ thống đối tác</div>
              <div className="text-xs text-amber-700 mt-0.5">
                Về tab <strong>Dashboard</strong> và bấm "Tham Gia Hệ Thống" để bắt đầu tích lũy điểm xét chuẩn.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tiến độ cấp bậc Phase 2C */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-secondary uppercase tracking-wider px-1">
          Tiến Trình Cấp Bậc
        </div>
        <AmbassadorProgressCard userId={currentUser.id || currentUser.userId} />
      </div>
    </div>
  );
}
