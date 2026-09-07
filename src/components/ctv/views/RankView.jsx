import React, { useState, useEffect } from 'react';
import { Star, Award, Clock, TrendingUp, Info, Loader } from 'lucide-react';
import AmbassadorProgressCard from '../components/common/AmbassadorProgressCard.jsx';
import RankBadge from '../components/common/RankBadge.jsx';

// Phase 2C Official Commission Benefits Matrix
const RANK_BENEFITS = [
  {
    role: 'AMBASSADOR',
    title: 'Đại sứ (Ambassador)',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    rules: [
      { key: 'SELF', label: 'Tự tiêu dùng', rate: '20%', desc: '20% điểm hoa hồng khi tự mua thiết bị' },
      { key: 'DIRECT_NO_ID', label: 'Bán trực tiếp (Khách mới)', rate: '20%', desc: '20% điểm hoa hồng khi bán cho khách hàng chưa có ID' },
      { key: 'DIRECT_WITH_ID', label: 'Bán trực tiếp (Thành viên)', rate: '10%', desc: '10% điểm hoa hồng khi bán cho khách hàng đã có ID' },
    ]
  },
  {
    role: 'MANAGER',
    title: 'Quản lý (Manager)',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    rules: [
      { key: 'SELF', label: 'Tự tiêu dùng', rate: '25%', desc: '25% điểm hoa hồng khi tự mua thiết bị' },
      { key: 'DIRECT_NO_ID', label: 'Bán trực tiếp (Khách mới)', rate: '25%', desc: '25% điểm hoa hồng khi bán cho khách hàng chưa có ID' },
      { key: 'DIRECT_WITH_ID', label: 'Bán trực tiếp (Thành viên)', rate: '10%', desc: '10% điểm hoa hồng khi bán cho khách hàng đã có ID' },
      { key: 'UPSTREAM_D1', label: 'Đồng hành F1 (D1)', rate: '10%', desc: '10% điểm hoa hồng từ đơn hàng của F1 trực tiếp' },
      { key: 'UPSTREAM_D2', label: 'Đồng hành F2 (D2)', rate: '5%', desc: '5% điểm hoa hồng từ đơn hàng của F2 trực thuộc' },
    ]
  },
  {
    role: 'DIRECTOR',
    title: 'Giám đốc (Director)',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    rules: [
      { key: 'SELF', label: 'Tự tiêu dùng', rate: '30%', desc: '30% điểm hoa hồng khi tự mua thiết bị' },
      { key: 'DIRECT_NO_ID', label: 'Bán trực tiếp (Khách mới)', rate: '30%', desc: '30% điểm hoa hồng khi bán cho khách hàng chưa có ID' },
      { key: 'DIRECT_WITH_ID', label: 'Bán trực tiếp (Thành viên)', rate: '10%', desc: '10% điểm hoa hồng khi bán cho khách hàng đã có ID' },
    ]
  }
];

export default function RankView({ currentUser }) {
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [histError, setHistError] = useState(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`/api/rank/history/${currentUser.id}`, { credentials: 'include' })
      .then(res => { if (!res.ok) throw new Error('Lỗi tải lịch sử cấp bậc'); return res.json(); })
      .then(res => { if (res.success) setHistory(res.data || []); else throw new Error(res.message); })
      .catch(err => setHistError(err.message))
      .finally(() => setHistLoading(false));
  }, [currentUser]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-1">
          <Star size={22} className="text-yellow-400" /> Cấp Bậc & Cơ Chế Hoa Hồng
        </h2>
        <p className="text-sm text-secondary">
          Quyền lợi hoa hồng và tiến trình phát triển chức danh theo cơ chế chính thức Phase 2C
        </p>
      </div>

      {/* Current Rank + Ambassador Progress */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {/* Current Rank */}
        <div className="glass-panel p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-secondary uppercase tracking-wide">
            <Award size={16} /> Cấp bậc hiện tại
          </div>
          <div className="flex items-center gap-4">
            <RankBadge tier={currentUser?.tier} rank={currentUser?.rank} isSystemParticipant={currentUser?.isSystemParticipant} size="lg" />
            <div>
              <p className="font-bold text-primary text-lg">{currentUser?.fullName}</p>
              <p className="text-xs text-secondary">Mã đối tác: {currentUser?.businessId ? <strong className="text-primary font-mono">{currentUser?.businessId}</strong> : <strong className="text-amber-500 italic">Chưa cấp (Cần 5.000 CP)</strong>}</p>
              {currentUser?.rank && (
                <p className="text-xs text-purple-400 mt-1 font-medium">Chức danh đối tác chính thức</p>
              )}
            </div>
          </div>
        </div>

        {/* Ambassador Progress */}
        <AmbassadorProgressCard userId={currentUser?.id} />
      </div>

      {/* Phase 2C Commission Structure By Role */}
      <div className="glass-panel p-5 space-y-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-secondary uppercase tracking-wide">
          <TrendingUp size={16} /> Bảng Cơ Chế Hoa Hồng Theo Cấp Bậc (Phase 2C)
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {RANK_BENEFITS.map(grp => (
            <div key={grp.role} className="p-4 rounded-xl border border-gray-700/60 bg-gray-800/40 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2 border-b border-gray-700/50">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${grp.badgeColor}`}>
                  {grp.title}
                </span>
              </div>

              <div className="space-y-2.5 flex-1">
                {grp.rules.map(r => (
                  <div key={r.key} className="p-2.5 rounded-lg bg-gray-900/40 border border-gray-700/30 flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-primary block">{r.label}</span>
                      <span className="text-[11px] text-secondary leading-tight block mt-0.5">{r.desc}</span>
                    </div>
                    <span className="text-sm font-extrabold text-green-400 shrink-0">{r.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/50">
          <div className="flex items-start gap-2">
            <Info size={15} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-secondary leading-relaxed">
              Hoa hồng được tính theo tỷ lệ phần trăm trên <strong className="text-primary">Điểm hoa hồng (Points)</strong> của từng sản phẩm trong đơn hàng. 
              1 điểm hoa hồng quy đổi tương đương <strong className="text-primary">1.000đ</strong> tiền mặt (số nguyên VND).
            </p>
          </div>
        </div>
      </div>

      {/* Rank History */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-secondary uppercase tracking-wide">
          <Clock size={16} /> Lịch sử thay đổi cấp bậc
        </div>

        {histLoading ? (
          <div className="flex items-center justify-center gap-2 text-secondary py-6">
            <Loader size={18} className="animate-spin" /> Đang tải lịch sử...
          </div>
        ) : histError ? (
          <div className="text-red-400 text-sm text-center py-4">⚠️ {histError}</div>
        ) : history.length === 0 ? (
          <div className="text-center text-secondary py-6">
            <Clock size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Chưa có lịch sử thay đổi cấp bậc.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((h, idx) => (
              <div key={h.id || idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-700/30">
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-purple-400" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-secondary text-xs">{new Date(h.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <p className="text-sm font-medium text-primary mt-1">
                    {h.fromTier ? (
                      <><span className="text-secondary">{h.fromTier}</span> → <span className="text-purple-400 font-bold">{h.toTier}</span></>
                    ) : (
                      <span className="text-purple-400 font-bold">Khởi tạo: {h.toTier}</span>
                    )}
                  </p>
                  {h.reason && <p className="text-xs text-secondary mt-0.5">{h.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
