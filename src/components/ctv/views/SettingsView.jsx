import React from 'react';
import { ShieldCheck, User, Award, Star, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function SettingsView({ currentUser }) {
  if (!currentUser) return null;

  const isParticipant = currentUser.isSystemParticipant;
  const qp = currentUser.qualifyingPoints || 0;
  const progress = Math.min(100, Math.round((qp / 5000) * 100));

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full p-4">
      <h2 className="text-xl font-extrabold text-primary">Thông Tin Tài Khoản</h2>

      {/* Profile card */}
      <div className="glass-panel p-6 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-extrabold text-primary border-2 border-primary/30">
            {(currentUser.fullName || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-extrabold text-primary">{currentUser.fullName || '—'}</div>
            <div className="text-sm text-secondary">{currentUser.phone || '—'}</div>
            <div className="text-xs text-muted mt-0.5">ID: {currentUser.id || currentUser.userId}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-xs text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
              <Award size={12} /> Cấp Bậc
            </div>
            <div className="font-bold text-primary">{currentUser.tier || currentUser.rank || 'SILVER'}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-xs text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
              <ShieldCheck size={12} /> Vai Trò
            </div>
            <div className="font-bold text-primary uppercase">{currentUser.role}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-xs text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
              <Star size={12} /> Business ID
            </div>
            <div className="font-bold text-primary">{currentUser.businessId || 'Chưa cấp'}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <div className="text-xs text-secondary uppercase tracking-wider mb-1 flex items-center gap-1">
              <User size={12} /> Qualifying Points
            </div>
            <div className="font-bold text-diamond">{(qp).toLocaleString('vi-VN')} / 5.000</div>
          </div>
        </div>
      </div>

      {/* Trạng thái tham gia hệ thống */}
      <div className="glass-panel p-6">
        <div className="text-sm font-bold text-secondary uppercase tracking-wider mb-3">Trạng Thái Tham Gia Hệ Thống</div>
        {isParticipant ? (
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle size={20} />
            <div>
              <div className="font-bold">Đang tham gia</div>
              {currentUser.participantAt && (
                <div className="text-xs text-secondary mt-0.5">
                  Từ {new Date(currentUser.participantAt).toLocaleDateString('vi-VN')}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-amber-400">
            <AlertCircle size={20} />
            <div>
              <div className="font-bold">Chưa tham gia hệ thống</div>
              <div className="text-xs text-secondary mt-0.5">Về Dashboard để tham gia và bắt đầu tích lũy điểm.</div>
            </div>
          </div>
        )}
      </div>

      {/* Tiến độ lên Đại Sứ */}
      {isParticipant && !currentUser.businessId && (
        <div className="glass-panel p-6">
          <div className="text-sm font-bold text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock size={14} /> Tiến Độ Lên Đại Sứ (Ambassador)
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-secondary">Qualifying Points</span>
            <span className="font-bold text-diamond">{qp.toLocaleString('vi-VN')} / 5.000</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent-green), var(--accent-diamond))' }}
            />
          </div>
          <div className="text-xs text-muted mt-2">Tích đủ 5.000 QP → tự động nhận Business ID + Đại Sứ</div>
        </div>
      )}
    </div>
  );
}
