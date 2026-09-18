import React, { useState, useEffect, useCallback } from 'react';
import { Star, Award, Clock, TrendingUp, Info, Loader, RefreshCw, CheckCircle2, Shield, Crown } from 'lucide-react';
import AmbassadorProgressCard from '../components/common/AmbassadorProgressCard.jsx';
import RankBadge from '../components/common/RankBadge.jsx';

export default function RankView({ currentUser }) {
  // Live Policy State
  const [policyMap, setPolicyMap] = useState({});
  const [policyVersion, setPolicyVersion] = useState('1.0.0');
  const [policyLoading, setPolicyLoading] = useState(true);
  const [policyError, setPolicyError] = useState(null);

  // History State
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [histError, setHistError] = useState(null);

  // Load Active Policies from Server (Synced with Admin Configuration)
  const loadPolicy = useCallback(() => {
    setPolicyLoading(true);
    setPolicyError(null);
    fetch('/api/policy/active', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải chính sách hoa hồng từ hệ thống');
        return res.json();
      })
      .then(res => {
        if (res.success && res.policyMap) {
          setPolicyMap(res.policyMap);
          setPolicyVersion(res.version || '1.0.0');
        } else {
          throw new Error(res.message || 'Lỗi dữ liệu chính sách');
        }
      })
      .catch(err => setPolicyError(err.message))
      .finally(() => setPolicyLoading(false));
  }, []);

  useEffect(() => {
    loadPolicy();
  }, [loadPolicy]);

  // Load Rank History for User
  useEffect(() => {
    if (!currentUser?.id) return;
    setHistLoading(true);
    fetch(`/api/rank/history/${currentUser.id}`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Lỗi tải lịch sử cấp bậc');
        return res.json();
      })
      .then(res => {
        if (res.success) setHistory(res.data || []);
        else throw new Error(res.message);
      })
      .catch(err => setHistError(err.message))
      .finally(() => setHistLoading(false));
  }, [currentUser]);

  // Format Helper
  const fmtRate = (key, fallback = '0%') => {
    const val = policyMap[key];
    if (!val || val === 'NOT_CONFIGURED') return fallback;
    const n = parseFloat(val);
    return isNaN(n) ? val : `${Math.round(n * 100)}%`;
  };

  // Structured Rank Groups mapped to Database Policy Keys
  const rankGroups = [
    {
      role: 'AMBASSADOR',
      title: 'Đại sứ (Ambassador)',
      subtitle: 'Tích lũy tối thiểu 5.000 CP từ đơn hàng cá nhân',
      icon: <Star className="w-5 h-5 text-purple-600" />,
      headerBg: 'bg-purple-50 border-purple-200 text-purple-900',
      badgeBg: 'bg-purple-600 text-white',
      borderClass: 'border-purple-200/80',
      rules: [
        {
          key: 'AMBASSADOR_SELF_BUY',
          label: 'Tự tiêu dùng',
          desc: 'Hoa hồng khi tự mua sản phẩm / thiết bị',
          rate: fmtRate('AMBASSADOR_SELF_BUY', '20%')
        },
        {
          key: 'AMBASSADOR_DIRECT_NO_ID',
          label: 'Bán trực tiếp (Khách mới)',
          desc: 'Bán cho khách hàng tiêu dùng chưa có tài khoản',
          rate: fmtRate('AMBASSADOR_DIRECT_NO_ID', '20%')
        },
        {
          key: 'AMBASSADOR_DIRECT_WITH_ID',
          label: 'Bán trực tiếp (Thành viên)',
          desc: 'Bán cho khách hàng hoặc thành viên đã có ID',
          rate: fmtRate('AMBASSADOR_DIRECT_WITH_ID', '10%')
        },
        {
          key: 'AMBASSADOR_F1',
          label: 'Đồng hành F1 (D1)',
          desc: 'Hoa hồng từ đơn hàng do F1 trực tiếp tự mua',
          rate: fmtRate('AMBASSADOR_F1', '10%')
        },
        {
          key: 'AMBASSADOR_F2',
          label: 'Đồng hành F2 (D2)',
          desc: 'Hoa hồng từ đơn hàng do F2 trực thuộc tự mua',
          rate: fmtRate('AMBASSADOR_F2', '5%')
        }
      ]
    },
    {
      role: 'MANAGER',
      title: 'Trưởng nhóm (Manager)',
      subtitle: 'Có đủ 5 thành viên F1 trực tiếp đạt chuẩn Đại Sứ',
      icon: <Shield className="w-5 h-5 text-emerald-600" />,
      headerBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      badgeBg: 'bg-emerald-600 text-white',
      borderClass: 'border-emerald-200/80',
      rules: [
        {
          key: 'MANAGER_SELF_BUY',
          label: 'Tự tiêu dùng',
          desc: 'Hoa hồng khi tự mua sản phẩm / thiết bị',
          rate: fmtRate('MANAGER_SELF_BUY', '25%')
        },
        {
          key: 'MANAGER_DIRECT_NO_ID',
          label: 'Bán trực tiếp (Khách mới)',
          desc: 'Bán cho khách hàng tiêu dùng chưa có tài khoản',
          rate: fmtRate('MANAGER_DIRECT_NO_ID', '25%')
        },
        {
          key: 'MANAGER_DIRECT_WITH_ID',
          label: 'Bán trực tiếp (Thành viên)',
          desc: 'Bán cho khách hàng hoặc thành viên đã có ID',
          rate: fmtRate('MANAGER_DIRECT_WITH_ID', '10%')
        },
        {
          key: 'MANAGER_F1_PURCHASE',
          label: 'Đồng hành F1 (D1)',
          desc: 'Hoa hồng từ đơn hàng do F1 trực tiếp tự mua',
          rate: fmtRate('MANAGER_F1_PURCHASE', '10%')
        },
        {
          key: 'MANAGER_F2_PURCHASE',
          label: 'Đồng hành F2 (D2)',
          desc: 'Hoa hồng từ đơn hàng do F2 trực thuộc tự mua',
          rate: fmtRate('MANAGER_F2_PURCHASE', '5%')
        }
      ]
    },
    {
      role: 'DIRECTOR',
      title: 'Quản lý (Director)',
      subtitle: 'Có đủ 5 thành viên F1 trực tiếp đạt chuẩn Trưởng nhóm',
      icon: <Crown className="w-5 h-5 text-rose-600" />,
      headerBg: 'bg-rose-50 border-rose-200 text-rose-900',
      badgeBg: 'bg-rose-600 text-white',
      borderClass: 'border-rose-200/80',
      rules: [
        {
          key: 'DIRECTOR_SELF_BUY',
          label: 'Tự tiêu dùng',
          desc: 'Hoa hồng tối đa khi tự mua sản phẩm / thiết bị',
          rate: fmtRate('DIRECTOR_SELF_BUY', '30%')
        },
        {
          key: 'DIRECTOR_DIRECT_NO_ID',
          label: 'Bán trực tiếp (Khách mới)',
          desc: 'Bán cho khách hàng tiêu dùng chưa có tài khoản',
          rate: fmtRate('DIRECTOR_DIRECT_NO_ID', '30%')
        },
        {
          key: 'DIRECTOR_DIRECT_WITH_ID',
          label: 'Bán trực tiếp (Thành viên)',
          desc: 'Bán cho khách hàng hoặc thành viên đã có ID',
          rate: fmtRate('DIRECTOR_DIRECT_WITH_ID', '10%')
        },
        {
          key: 'DIRECTOR_F1',
          label: 'Đồng hành tuyến F1 (D1)',
          desc: 'Hoa hồng đồng hành từ toàn bộ đơn hàng F1',
          rate: fmtRate('DIRECTOR_F1', '10%')
        },
        {
          key: 'DIRECTOR_F2',
          label: 'Đồng hành tuyến F2 (D2)',
          desc: 'Hoa hồng đồng hành từ toàn bộ đơn hàng F2',
          rate: fmtRate('DIRECTOR_F2', '5%')
        }
      ]
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-1">
          <Star size={22} className="text-amber-500 fill-amber-400" /> Cấp Bậc & Cơ Chế Hoa Hồng
        </h2>
        <p className="text-xs text-slate-600">
          Quyền lợi hoa hồng và tiến trình phát triển chức danh chính thức theo chuẩn Phase 2C
        </p>
      </div>

      {/* Current Rank + Progress */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Current User Rank Card */}
        <div className="glass-panel p-5 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            <Award size={16} className="text-primary" /> Cấp bậc hiện tại
          </div>
          <div className="flex items-center gap-4">
            <RankBadge 
              tier={currentUser?.tier} 
              rank={currentUser?.rank} 
              isSystemParticipant={currentUser?.isSystemParticipant} 
              size="lg" 
            />
            <div>
              <p className="font-extrabold text-slate-900 text-lg">{currentUser?.fullName}</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Mã đối tác:{' '}
                {currentUser?.businessId ? (
                  <strong className="text-slate-900 font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded shadow-xs">
                    {currentUser.businessId}
                  </strong>
                ) : (
                  <strong className="text-amber-600 italic font-semibold">Chưa cấp (Cần 5.000 CP)</strong>
                )}
              </p>
              {currentUser?.rank ? (
                <p className="text-xs text-purple-700 mt-1 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-purple-600" /> Chức danh đối tác chính thức
                </p>
              ) : currentUser?.isSystemParticipant ? (
                <p className="text-xs text-blue-700 mt-1 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse"></span> Đang phấn đấu đạt chuẩn Đại Sứ (5.000 CP)
                </p>
              ) : null}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>ID: <strong className="font-mono text-slate-800">{currentUser?.id || currentUser?.userId}</strong></span>
            <span>Trạng thái: <strong className="text-emerald-600">{currentUser?.isSystemParticipant ? 'Đã kích hoạt CTV' : 'Khách hàng'}</strong></span>
          </div>
        </div>

        {/* Dynamic Progression Card */}
        <AmbassadorProgressCard userId={currentUser?.id || currentUser?.userId} />
      </div>

      {/* Dynamic Phase 2C Commission Benefits Table (Live Sync from Admin) */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 uppercase tracking-wide">
              <TrendingUp size={18} className="text-emerald-600" />
              <span>Bảng Cơ Chế Hoa Hồng — {{ AMBASSADOR: 'ĐẠI SỨ (AMBASSADOR)', MANAGER: 'TRƯỞNG NHÓM (MANAGER)', DIRECTOR: 'QUẢN LÝ (DIRECTOR)' }[currentUser?.rank?.toUpperCase()] || 'Chưa xác định'}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cơ chế hoa hồng áp dụng cho cấp bậc hiện tại của bạn
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Chính sách: v{policyVersion}
            </span>
            <button
              onClick={loadPolicy}
              disabled={policyLoading}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 shadow-2xs"
              title="Tải lại bảng tỷ lệ mới nhất từ hệ thống"
            >
              <RefreshCw size={13} className={policyLoading ? 'animate-spin text-primary' : 'text-slate-600'} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {policyLoading && Object.keys(policyMap).length === 0 ? (
          <div className="flex items-center justify-center gap-2 text-slate-500 py-12">
            <Loader size={20} className="animate-spin text-primary" />
            <span className="text-sm font-medium">Đang tải tỷ lệ hoa hồng mới nhất từ hệ thống...</span>
          </div>
        ) : policyError ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
            ⚠️ {policyError} — Vui lòng bấm "Làm mới" để thử lại.
          </div>
        ) : !currentUser?.rank || currentUser?.rank === 'NONE' ? (
          <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-center">
            <p className="text-sm font-bold mb-1">Bạn chưa đạt cấp bậc đối tác</p>
            <p className="text-xs text-amber-600">Tích lũy đủ 5.000 CP từ đơn hàng cá nhân để đạt chuẩn Đại Sứ và xem bảng cơ chế hoa hồng.</p>
          </div>
        ) : (
          /* Show only the commission table for the current user's rank */
          <div className="grid gap-5" style={{ gridTemplateColumns: '1fr' }}>
            {rankGroups.filter(grp => {
              const userRank = currentUser?.rank?.toUpperCase();
              if (!userRank || userRank === 'NONE') return false;
              return grp.role === userRank;
            }).map(grp => (
              <div
                key={grp.role}
                className={`rounded-2xl border ${grp.borderClass} bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden`}
              >
                {/* Card Header */}
                <div className={`p-4 border-b ${grp.headerBg} flex items-center justify-between`}>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white shadow-xs border border-white/60">
                      {grp.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-black tracking-tight">{grp.title}</h3>
                      <p className="text-[11px] opacity-80 mt-0.5 leading-tight">{grp.subtitle}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${grp.badgeBg} shadow-xs`}>
                    {grp.role}
                  </span>
                </div>

                {/* Card Rules List - High contrast dark text on crisp background */}
                <div className="p-4 space-y-2.5 flex-1 bg-white">
                  {grp.rules.map(r => (
                    <div
                      key={r.key}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-extrabold text-slate-900 block truncate">
                          {r.label}
                        </span>
                        <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                          {r.desc}
                        </span>
                      </div>
                      <div className="shrink-0">
                        <span className="inline-flex items-center text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                          {r.rate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Explanatory Notice */}
        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-950">
          <div className="flex items-start gap-2.5">
            <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs leading-relaxed space-y-1">
              <p>
                <strong>Nguyên tắc tính hoa hồng:</strong> Hoa hồng được tính trực tiếp theo tỷ lệ phần trăm trên <strong className="text-blue-700">Điểm hoa hồng (Points / CP)</strong> của từng sản phẩm trong đơn hàng.
              </p>
              <p className="text-blue-800">
                1 điểm hoa hồng quy đổi tương đương <strong className="text-slate-900">1.000đ</strong> tiền mặt VND. Khi Ban Quản Trị thay đổi chính sách trong hệ thống, các đơn hàng mới phát sinh sau thời điểm thay đổi sẽ tự động áp dụng biểu tỷ lệ mới nhất.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rank History */}
      <div className="glass-panel p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Clock size={16} className="text-primary" /> Lịch sử thay đổi cấp bậc
        </div>

        {histLoading ? (
          <div className="flex items-center justify-center gap-2 text-slate-500 py-6">
            <Loader size={18} className="animate-spin text-primary" />
            <span className="text-sm">Đang tải lịch sử...</span>
          </div>
        ) : histError ? (
          <div className="text-red-500 text-xs text-center py-4 font-medium">⚠️ {histError}</div>
        ) : history.length === 0 ? (
          <div className="text-center text-slate-400 py-6">
            <Clock size={32} className="mx-auto mb-2 opacity-30 text-slate-400" />
            <p className="text-xs">Chưa có lịch sử thay đổi cấp bậc nào được ghi nhận.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.map((h, idx) => (
              <div key={h.id || idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(h.createdAt).toLocaleString('vi-VN')}
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {h.fromTier ? (
                      <>
                        <span className="text-slate-500">{h.fromTier}</span> →{' '}
                        <span className="text-purple-700 font-black">{h.toTier}</span>
                      </>
                    ) : (
                      <span className="text-purple-700 font-black">Khởi tạo: {h.toTier}</span>
                    )}
                  </p>
                  {h.reason && <p className="text-xs text-slate-500 mt-0.5">{h.reason}</p>}
                </div>
                {h.adminUser && (
                  <span className="text-[11px] text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                    Bởi: {h.adminUser.fullName || h.adminUser.userId}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
