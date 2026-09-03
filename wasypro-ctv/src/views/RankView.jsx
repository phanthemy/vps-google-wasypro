import React, { useState, useEffect } from 'react';
import { Star, Award, Clock, TrendingUp, Info, Loader } from 'lucide-react';
import AmbassadorProgressCard from '../components/common/AmbassadorProgressCard.jsx';
import RankBadge from '../components/common/RankBadge.jsx';

const vnd = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const BENEFITS = [
  {
    code: 'AM-01',
    label: 'Tự mua (Self-Consumption)',
    rate: '20%',
    desc: '20% hoa hồng khi Ambassador tự mua thiết bị cho bản thân',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
  {
    code: 'AM-02',
    label: 'Bán lẻ (Direct Retail)',
    rate: '20%',
    desc: '20% hoa hồng bán lẻ trực tiếp (thiết bị 15M–45M)',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
  },
  {
    code: 'AM-03',
    label: 'Đối tác phân phối (Distribution)',
    rate: '10%',
    desc: '10% hoa hồng từ F1 trong tuyến bán hàng',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  {
    code: 'AM-04',
    label: 'Hỗ trợ vùng (Regional Development)',
    rate: '5%',
    desc: '5% hỗ trợ vùng (1 lần/giao dịch), không tích lũy',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
  },
];

export default function RankView({ currentUser }) {
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [histError, setHistError] = useState(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`/api/rank/history/${currentUser.id}`, { credentials: 'include' })
      .then(res => { if (!res.ok) throw new Error('Lỗi tải lịch sử'); return res.json(); })
      .then(res => { if (res.success) setHistory(res.data || []); else throw new Error(res.message); })
      .catch(err => setHistError(err.message))
      .finally(() => setHistLoading(false));
  }, [currentUser]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-1">
          <Star size={22} className="text-yellow-400" /> Hạng & Ambassador
        </h2>
        <p className="text-sm text-secondary">Theo dõi hạng bậc và điều kiện trở thành Đại sứ Thương mại</p>
      </div>

      {/* Current Rank + Ambassador Progress */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {/* Current Rank */}
        <div className="glass-panel p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-secondary uppercase tracking-wide">
            <Award size={16} /> Cấp bậc hiện tại
          </div>
          <div className="flex items-center gap-4">
            <RankBadge tier={currentUser?.tier} rank={currentUser?.rank} size="lg" />
            <div>
              <p className="font-bold text-primary text-lg">{currentUser?.fullName}</p>
              <p className="text-xs text-secondary">ID: {currentUser?.id}</p>
              {currentUser?.rank && (
                <p className="text-xs text-purple-400 mt-1 italic">Rank đặc biệt đã được kích hoạt</p>
              )}
            </div>
          </div>
        </div>

        {/* Ambassador Progress */}
        <AmbassadorProgressCard userId={currentUser?.id} />
      </div>

      {/* Benefits */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-secondary uppercase tracking-wide">
          <TrendingUp size={16} /> Quyền lợi Ambassador
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {BENEFITS.map(b => (
            <div key={b.code} className={`p-4 rounded-xl border ${b.bg} ${b.border} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${b.bg} ${b.color} ${b.border}`}>
                  {b.code}
                </span>
                <span className={`text-2xl font-extrabold ${b.color}`}>{b.rate}</span>
              </div>
              <p className={`text-sm font-semibold ${b.color}`}>{b.label}</p>
              <p className="text-xs text-secondary leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-secondary">
              Hoa hồng Ambassador được tính trên <strong className="text-primary">giá bán thực tế</strong> của thiết bị tại thời điểm giao dịch. 
              Mức AM-02 áp dụng cho thiết bị trong phân khúc 15M–45M. Liên hệ admin để biết thêm chi tiết điều kiện.
            </p>
          </div>
        </div>
      </div>

      {/* Rank History */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-secondary uppercase tracking-wide">
          <Clock size={16} /> Lịch sử thay đổi hạng
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
            <p className="text-sm">Chưa có lịch sử thay đổi hạng.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((h, idx) => (
              <div key={h.id || idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-700/30">
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{
                  background: h.toTier === 'DIAMOND' ? 'var(--accent-diamond)'
                    : h.toTier === 'GOLD' ? 'var(--accent-gold)'
                    : h.toTier === 'SILVER' ? 'var(--accent-silver)'
                    : '#6b7280'
                }} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-secondary text-xs">{new Date(h.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <p className="text-sm font-medium text-primary mt-1">
                    {h.fromTier ? (
                      <><span className="text-secondary">{h.fromTier}</span> → <span className="text-diamond">{h.toTier}</span></>
                    ) : (
                      <span className="text-diamond">Khởi tạo: {h.toTier}</span>
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
