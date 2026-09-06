import React, { useState, useEffect } from 'react';
import { Award, Crown, Star, Medal, ShieldCheck, UserCheck } from 'lucide-react';
import SPointWidget from '../components/common/SPointWidget.jsx';
import RankBadge from '../components/common/RankBadge.jsx';
import AmbassadorProgressCard from '../components/common/AmbassadorProgressCard.jsx';

export default function DashboardView({ refreshKey, currentUser, setActiveTab }) {
  const [data, setData] = useState({ totalDiamond: 0, totalGold: 0, totalSilver: 0, totalSales: 0 });
  const [personalStats, setPersonalStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState(null);

  useEffect(() => {
    // Fetch current commission period for all roles
    fetch('/api/periods/current', { credentials: 'include' })
      .then(r => r.json())
      .then(res => { if (res.success) setCurrentPeriod(res.data); })
      .catch(() => {});

    if (currentUser.role === 'admin') {
      fetch('/api/dashboard')
        .then(r => r.json())
        .then(res => {
          if (res.success) setData(res.data);
        })
        .finally(() => setLoading(false));
    } else {
      fetch('/api/users')
        .then(r => r.json())
        .then(res => {
          if (res.success) {
            const me = res.data.find(u => u.id === currentUser.id);
            setPersonalStats(me);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [refreshKey, currentUser]);

  if (loading) return <div className="text-muted p-4 text-center">Đang tải dữ liệu...</div>;

  if (currentUser.role !== 'admin' && personalStats) {
    const gross = personalStats.totalCommission || 0;
    const sales = personalStats.totalSales || 0;
    const isParticipant = personalStats.isSystemParticipant || currentUser.isSystemParticipant;

    return (
      <div className="flex-col gap-6">
        {/* THAM GIA HE THONG banner — only for non-participants */}
        {!isParticipant && (
          <div className="glass-panel" style={{ padding: '1.5rem', border: '2px solid var(--accent-diamond)', background: 'rgba(0,240,255,0.04)' }}>
            <div className="text-center">
              <div className="text-diamond font-extrabold text-lg mb-1">🚀 Tham Gia Hệ Thống CTV</div>
              <div className="text-secondary text-sm mb-4">
                Tham gia hệ thống để tích lũy Qualifying Points, nhận hoa hồng và thăng cấp.
                <br />Tích đủ 5.000 QP → nhận Business ID + lên Đại Sứ tự động.
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/users/me/join-system', {
                      method: 'POST',
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' }
                    }).then(r => r.json());
                    if (res.success) {
                      alert('✅ Đã tham gia hệ thống! Bạn bắt đầu tích lũy Qualifying Points từ bây giờ.');
                      window.location.reload();
                    } else {
                      alert('❌ ' + (res.message || 'Lỗi không xác định'));
                    }
                  } catch { alert('❌ Lỗi kết nối máy chủ'); }
                }}
                className="btn hover-scale"
                style={{ background: 'var(--accent-diamond)', color: '#0f172a', fontWeight: 'extrabold', padding: '12px 32px', borderRadius: '10px', border: 'none', fontSize: '1rem', cursor: 'pointer' }}
              >
                ✨ THAM GIA HỆ THỐNG
              </button>
            </div>
          </div>
        )}

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 className="text-secondary uppercase text-xs tracking-wider font-bold" style={{ margin: 0 }}>
              Doanh Số Hệ Thống Của Bạn
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Current commission period */}
              {currentPeriod ? (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-3 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse" />
                  <span className="text-xs text-secondary">Kỳ HH:</span>
                  <span className="text-xs font-bold text-green-400">{currentPeriod.periodName}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-500/10 border border-gray-500/30 px-3 py-1 rounded-lg">
                  <span className="text-xs text-muted">Chưa có kỳ hoa hồng</span>
                </div>
              )}
              {/* Business ID */}
              <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-lg">
                <ShieldCheck size={16} className="text-purple-400" />
                <span className="text-xs text-secondary">Business ID:</span>
                <span className="text-xs font-mono font-bold text-purple-300">{personalStats.businessId || currentUser?.businessId || 'Chưa cấp'}</span>
              </div>
            </div>
          </div>

          <h1 style={{ margin: '10px 0 0 0', fontSize: '2.5rem', color: 'var(--text-primary)' }}>
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(sales)}
          </h1>

          {currentUser.role !== 'customer' && (
            <div className="mt-4 p-4 rounded-xl border border-dashed border-gray-600 bg-gray-900/30 text-center">
              <div className="text-sm text-secondary font-bold mb-2">Gửi Link này cho Khách Hàng tự đăng ký tài khoản (Thuộc tuyến dưới của bạn)</div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/?ref=${currentUser.id}`}
                  className="input-field flex-1 max-w-sm text-center font-mono text-sm"
                  style={{ background: 'var(--bg-primary)' }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/?ref=${currentUser.id}`);
                    alert('Đã sao chép Link Giới Thiệu!');
                  }}
                  className="btn btn-primary px-4 py-2 hover-scale w-full sm:w-auto"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Sao Chép Link
                </button>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: 'rgba(0, 240, 255, 0.05)',
              border: '1px solid var(--accent-diamond)',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}
            onClick={() => setActiveTab && setActiveTab('commissions')}
            className="hover-effect transition-transform transform hover:scale-[1.01]"
          >
            <div className="text-diamond font-bold flex justify-between items-center" style={{ fontSize: '1.4rem' }}>
              <span>Hoa Hồng Của Bạn:</span>
              <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(gross)}</span>
            </div>
            <div className="text-muted text-xs text-center mt-3 border-t border-gray-800 pt-2">
              👉 Bấm vào đây để xem chi tiết sao kê hoa hồng
            </div>
          </div>
        </div>

        {/* Phase 2C: S-Points & Rank Profile */}
        <div className="grid gap-4 mt-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <SPointWidget userId={currentUser.id} />
          <div className="bg-white rounded-xl p-4 border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Cấp bậc của bạn</span>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">Đang hoạt động</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <RankBadge tier={currentUser.tier} rank={currentUser.rank} size="lg" />
              <div>
                <p className="text-xs text-gray-500 font-medium">{currentUser.fullName}</p>
                <p className="text-[11px] text-gray-400 font-mono">Mã ĐT: {personalStats.businessId || currentUser.businessId || 'Chưa cấp'}</p>
              </div>
            </div>
            {currentUser.rank && (
              <p className="text-xs text-purple-600 mt-2 font-medium">Chức danh đối tác chính thức</p>
            )}
          </div>
        </div>

        {/* Phase 2C: Ambassador Progress */}
        {!personalStats?.isAmbassador && (
          <div className="mt-2">
            <AmbassadorProgressCard userId={currentUser.id} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-col gap-6">
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 className="text-secondary" style={{ margin: 0, textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
          Tổng Doanh Thu Hóa Đơn
        </h3>
        <h1 style={{ margin: '10px 0 0 0', fontSize: '3rem', color: 'var(--text-primary)' }}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.totalSales)}
        </h1>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--accent-diamond)', background: '#E0F2FE' }}>
            <Crown size={28} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Giám đốc</div>
            <div className="stat-value">{data.totalDiamond} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Giám Đốc</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--accent-gold)', background: '#FEF3C7' }}>
            <Award size={28} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Quản lý</div>
            <div className="stat-value">{data.totalGold} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Quản Lý</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--accent-silver)', background: '#F1F5F9' }}>
            <Medal size={28} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Đại sứ</div>
            <div className="stat-value">{data.totalSilver} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Đại Sứ</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
