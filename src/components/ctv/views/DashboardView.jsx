import React, { useState, useEffect } from 'react';
import { Award, Crown, Star, ShieldCheck, Wallet, Sparkles, TrendingUp, CheckCircle } from 'lucide-react';
import SPointWidget from '../components/common/SPointWidget.jsx';
import RankBadge from '../components/common/RankBadge.jsx';
import AmbassadorProgressCard from '../components/common/AmbassadorProgressCard.jsx';

export default function DashboardView({ refreshKey, currentUser, setActiveTab }) {
  const [data, setData] = useState({ totalDiamond: 0, totalGold: 0, totalSilver: 0, totalSales: 0 });
  const [personalStats, setPersonalStats] = useState(null);
  const [freshUser, setFreshUser] = useState(currentUser || {});
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [joining, setJoining] = useState(false);

  // Sync fresh profile from /api/auth/me on mount
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setFreshUser(res.data);
          try {
            const saved = localStorage.getItem('crm_user');
            if (saved) {
              const parsed = JSON.parse(saved);
              localStorage.setItem('crm_user', JSON.stringify({ ...parsed, ...res.data }));
            }
          } catch (_) {}
        }
      })
      .catch(() => {});

    // Fetch current commission period
    fetch('/api/periods/current', { credentials: 'include' })
      .then(r => r.json())
      .then(res => { if (res.success) setCurrentPeriod(res.data); })
      .catch(() => {});

    if (currentUser.role === 'admin') {
      fetch('/api/dashboard', { credentials: 'include' })
        .then(r => r.json())
        .then(res => { if (res.success) setData(res.data); })
        .finally(() => setLoading(false));
    } else {
      fetch('/api/users', { credentials: 'include' })
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            const me = res.data.find(u => u.id === currentUser.id || u.userId === currentUser.id);
            setPersonalStats(me);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [refreshKey, currentUser]);

  const handleJoinSystem = async () => {
    setJoining(true);
    try {
      const res = await fetch('/api/users/me/join-system', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      }).then(r => r.json());

      if (res.success) {
        alert('🎉 Chúc mừng! Bạn đã tham gia hệ thống đối tác WasyPro thành công.');
        setFreshUser(prev => ({ ...prev, isSystemParticipant: true, ...res.data }));
        try {
          const saved = localStorage.getItem('crm_user');
          if (saved) {
            const parsed = JSON.parse(saved);
            localStorage.setItem('crm_user', JSON.stringify({ ...parsed, isSystemParticipant: true, ...res.data }));
          }
        } catch (_) {}
        window.location.reload();
      } else {
        alert('❌ ' + (res.message || 'Lỗi không xác định'));
      }
    } catch {
      alert('❌ Lỗi kết nối máy chủ');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="text-muted p-6 text-center text-sm">Đang tải dữ liệu hệ thống...</div>;

  const userObj = { ...currentUser, ...personalStats, ...freshUser };
  const isAdmin = userObj.role === 'admin';
  const isParticipant = !!userObj.isSystemParticipant || !!userObj.isNpp || !!userObj.hasNppRegistration || 
    ['AMBASSADOR', 'MANAGER', 'DIRECTOR', 'SALES_MANAGER', 'SALES_DIRECTOR'].includes(userObj.rank || '') ||
    userObj.role === 'admin' || userObj.role === 'accountant';

  // Admin Overview
  if (isAdmin) {
    return (
      <div className="flex-col gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-secondary uppercase text-xs tracking-wider font-bold mb-1">
            Tổng Doanh Thu Toàn Hệ Thống
          </h3>
          <h1 className="text-3xl font-extrabold text-primary">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.totalSales || 0)}
          </h1>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--accent-diamond)', background: '#E0F2FE' }}>
              <Crown size={26} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Quản lý</div>
              <div className="stat-value">{data.totalDiamond} <span className="text-xs text-secondary font-normal">Thành viên</span></div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--accent-gold)', background: '#FEF3C7' }}>
              <Award size={26} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Trưởng nhóm</div>
              <div className="stat-value">{data.totalGold} <span className="text-xs text-secondary font-normal">Thành viên</span></div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ color: 'var(--accent-silver)', background: '#F1F5F9' }}>
              <Star size={26} />
            </div>
            <div className="stat-info">
              <div className="stat-label">Đại sứ</div>
              <div className="stat-value">{data.totalSilver} <span className="text-xs text-secondary font-normal">Thành viên</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const gross = personalStats?.totalCommission || 0;
  const qp = userObj.qualifyingPoints || 0;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. NON-PARTICIPANT BANNER */}
      {!isParticipant && !userObj.hasNppRegistration && (
        <div className="glass-panel p-6 border-2 border-primary/30 bg-primary/5 rounded-2xl text-center space-y-3">
          <div className="text-primary font-extrabold text-xl flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Tham Gia Hệ Thống Đối Tác WasyPro</span>
          </div>
          <p className="text-secondary text-sm max-w-xl mx-auto leading-relaxed">
            Tham gia hệ thống đối tác để tích lũy <strong>Qualifying Points (CP)</strong> từ các đơn hàng cá nhân, nhận hoa hồng và tự động thăng cấp.
            <br />
            <strong className="text-primary">Tích đủ 5.000 CP</strong> → tự động nhận <strong>Business ID</strong> và đạt chuẩn <strong>Đại Sứ Thương Mại</strong>!
          </p>
          <button
            onClick={handleJoinSystem}
            disabled={joining}
            className="btn btn-primary px-8 py-3 text-sm font-extrabold rounded-xl shadow-lg hover-scale"
          >
            {joining ? 'Đang xử lý...' : '✨ THAM GIA HỆ THỐNG NGAY'}
          </button>
        </div>
      )}

      {/* 2. PROMOTION PROGRESS (Ambassador / Manager / Director) */}
      <div>
        {!userObj.hasNppRegistration && <AmbassadorProgressCard userId={currentUser.id} />}
      </div>

      {/* 3. KEY METRICS GRID */}
      {isParticipant && (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {/* Card 1: Qualifying Points */}
          <div className="glass-panel p-5 rounded-xl border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-secondary uppercase font-bold tracking-wider mb-2">
                <span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-blue-500" /> Điểm Tích Lũy (CP)</span>
                <span className="text-blue-600 font-bold">Xét chuẩn</span>
              </div>
              <div className="text-2xl font-extrabold text-primary">
                {qp.toLocaleString('vi-VN')} <span className="text-sm font-semibold text-secondary">CP</span>
              </div>
            </div>
            <p className="text-[11px] text-muted mt-3 pt-2 border-t border-gray-100">
              Điểm chuẩn tích lũy từ các đơn hàng cá nhân trên hệ thống
            </p>
          </div>

          {/* Card 2: S-Points Widget */}
          <SPointWidget userId={currentUser.id} />

          {/* Card 3: Commissions */}
          <div 
            onClick={() => setActiveTab && setActiveTab('commissions')}
            className="glass-panel p-5 rounded-xl border border-emerald-100/60 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-secondary uppercase font-bold tracking-wider mb-2">
                <span className="flex items-center gap-1.5"><Wallet size={14} className="text-emerald-500" /> Hoa Hồng Của Bạn</span>
                {currentPeriod ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                    {currentPeriod.periodName}
                  </span>
                ) : (
                  <span className="text-xs text-muted">Chưa có kỳ</span>
                )}
              </div>
              <div className="text-2xl font-extrabold text-emerald-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(gross)}
              </div>
            </div>
            <p className="text-[11px] text-emerald-700/80 mt-3 pt-2 border-t border-emerald-100/50 flex items-center justify-between font-medium">
              <span>👉 Bấm để xem chi tiết hoa hồng</span>
              <span>→</span>
            </p>
          </div>
        </div>
      )}

      {/* 4. REFERRAL LINK SHARING BOX (Only shown if user joined the system) */}
      {isParticipant && (
        <div className="glass-panel p-5 rounded-2xl border border-dashed border-primary/30 bg-primary/5">
          <div className="text-sm font-bold text-primary mb-1">
            Link Giới Thiệu Của Bạn
          </div>
          <p className="text-xs text-secondary mb-3">
            Gửi liên kết này cho khách hàng mua sắm hoặc thành viên tuyến dưới tự đăng ký tài khoản (tự động gắn vào sponsor tree của bạn).
          </p>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <input
              type="text"
              readOnly
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${currentUser.id}`}
              className="input-field flex-1 text-sm font-mono bg-white px-3 py-2 rounded-xl border border-gray-200"
            />
            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(`${window.location.origin}/?ref=${currentUser.id}`);
                  alert('✅ Đã sao chép Link Giới Thiệu vào bộ nhớ tạm!');
                }
              }}
              className="btn btn-primary px-5 py-2 text-xs font-bold whitespace-nowrap rounded-xl shadow-sm hover-scale w-full sm:w-auto"
            >
              Sao Chép Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
