import React, { useState, useEffect } from "react";
import { Loader, CheckCircle, Circle, Star, Shield, Crown, ChevronDown, ChevronUp, Users } from "lucide-react";

export default function AmbassadorProgressCard({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showF1List, setShowF1List] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/rank/promotion-progress/${userId}`, { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error("Lỗi kết nối máy chủ");
        return res.json();
      })
      .then(res => {
        if (res.success) setData(res.data);
        else throw new Error(res.message || "Không thể tải dữ liệu");
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="glass-panel p-4 rounded-xl flex items-center justify-center gap-2 text-secondary text-sm">
      <Loader size={16} className="animate-spin" />
      <span>Đang tải thông tin cấp bậc...</span>
    </div>
  );

  if (error) return (
    <div className="glass-panel p-4 rounded-xl border border-red-500/30 bg-red-500/10">
      <p className="text-red-400 text-sm text-center">{error}</p>
    </div>
  );

  if (!data) return null;

  const { currentRank, nextRank, progress = 0, current = 0, target = 5, unit = '', isMaxRank, description, f1List = [] } = data;
  const isCompleted = progress >= 100;

  // Max Rank (DIRECTOR)
  if (isMaxRank || currentRank === 'DIRECTOR' || currentRank === 'SALES_DIRECTOR') {
    return (
      <div className="glass-panel p-5 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <Crown size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                Cấp bậc cao nhất
              </span>
            </div>
            <h3 className="text-base font-bold text-amber-300 mt-0.5">Quản Lý</h3>
          </div>
        </div>
        <p className="text-xs text-secondary leading-relaxed">
          {description || 'Bạn đã đạt cấp bậc quản trị kinh doanh cao nhất của WasyPro. Tận hưởng toàn bộ đặc quyền hoa hồng F1 (10%), F2 (5%) và bán hàng tối đa.'}
        </p>
      </div>
    );
  }

  // Icons and titles according to currentRank
  const getRankMeta = () => {
    switch (currentRank) {
      case 'AMBASSADOR':
        return {
          icon: <Shield size={18} className="text-emerald-400" />,
          title: 'Tiến trình thăng cấp Trưởng nhóm (Manager)',
          sub: 'Quy chế: 5 thành viên F1 trực tiếp đạt chuẩn Đại sứ (có Business ID)',
          targetLabel: 'F1 Đại sứ',
          barColor: 'from-emerald-600 to-teal-400',
          nextName: 'Trưởng nhóm'
        };
      case 'MANAGER':
      case 'SALES_MANAGER':
        return {
          icon: <Crown size={18} className="text-rose-400" />,
          title: 'Tiến trình thăng cấp Quản lý (Director)',
          sub: 'Quy chế: 5 thành viên F1 trực tiếp đạt chuẩn Trưởng nhóm (có Business ID)',
          targetLabel: 'F1 Trưởng nhóm',
          barColor: 'from-rose-600 to-amber-400',
          nextName: 'Quản lý'
        };
      default: // CUSTOMER
        return {
          icon: <Star size={18} className="text-yellow-400" />,
          title: 'Tiến trình đạt chuẩn Đại Sứ Thương Mại',
          sub: 'Điều kiện: Tích lũy tối thiểu 5.000 CP từ các đơn hàng cá nhân',
          targetLabel: 'CP',
          barColor: 'from-blue-500 to-yellow-500',
          nextName: 'Đại Sứ'
        };
    }
  };

  const meta = getRankMeta();

  return (
    <div className="glass-panel p-5 rounded-xl space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10">
            {meta.icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary">{meta.title}</h3>
            <p className="text-[11px] text-secondary mt-0.5">{meta.sub}</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${isCompleted ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-blue-400 bg-blue-500/10 border-blue-500/30'}`}>
          {isCompleted ? 'Đạt chuẩn' : `${progress}%`}
        </span>
      </div>

      {isCompleted ? (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-300 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <CheckCircle size={15} className="text-green-400 shrink-0" />
          <span>Đã đủ điều kiện! Hệ thống tự động nâng cấp lên {meta.nextName}.</span>
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-secondary">
          <span className="flex items-center gap-1.5 font-medium">
            {isCompleted ? <CheckCircle size={14} className="text-green-400" /> : <Circle size={14} className="text-muted" />}
            Tiến độ: <strong className="text-primary font-bold">{current.toLocaleString('vi-VN')} / {target.toLocaleString('vi-VN')}</strong> {unit || meta.targetLabel}
          </span>
          <span className={isCompleted ? "text-green-400 font-bold" : "text-secondary font-semibold"}>
            {progress}%
          </span>
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${isCompleted ? 'from-green-600 to-green-400' : meta.barColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* F1 Qualified List (for Ambassador / Manager) */}
      {f1List && f1List.length > 0 && (
        <div className="pt-2 border-t border-gray-700/40">
          <button
            type="button"
            onClick={() => setShowF1List(!showF1List)}
            className="w-full flex items-center justify-between text-xs text-secondary hover:text-primary transition-colors py-1"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Users size={13} className="text-purple-400" />
              Danh sách F1 hợp lệ ({f1List.length})
            </span>
            {showF1List ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showF1List && (
            <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {f1List.map((f1, i) => (
                <div key={f1.userId || i} className="flex items-center justify-between p-2 rounded bg-gray-800/60 border border-gray-700/30 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-primary truncate">{f1.fullName || f1.userId}</p>
                    <p className="text-[10px] text-secondary font-mono">ID: {f1.businessId || f1.userId}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium">
                    {f1.rank === 'DIRECTOR' ? 'Quản lý' : f1.rank === 'MANAGER' ? 'Trưởng nhóm' : 'Đại sứ'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-muted leading-relaxed">
        {description}
      </p>
    </div>
  );
}
