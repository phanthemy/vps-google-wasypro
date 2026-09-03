import React, { useState, useEffect } from 'react';
import { Crown, Award, Medal } from 'lucide-react';
import SPointWidget from '../components/common/SPointWidget';
import RankBadge from '../components/common/RankBadge';

export default function DashboardView({ refreshKey, currentUser, setActiveTab }) {
  const [data, setData] = useState({ totalDiamond: 0, totalGold: 0, totalSilver: 0, totalSales: 0 });
  const [personalStats, setPersonalStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaxes, setShowTaxes] = useState(false);

  useEffect(() => {
    if (currentUser.role === 'admin') {
      fetch('/api/dashboard')
        .then(r => r.json())
        .then(res => {
          if(res.success) setData(res.data);
        })
        .finally(() => setLoading(false));
    } else {
      fetch('/api/users')
        .then(r => r.json())
        .then(res => {
          if(res.success) {
            const me = res.data.find(u => u.id === currentUser.id);
            setPersonalStats(me);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [refreshKey, currentUser]);

  if (loading) return <div className="text-muted p-4">Đang tải dữ liệu...</div>;

  if (currentUser.role !== 'admin' && personalStats) {
    const gross = personalStats.totalCommission || 0;
    const sales = personalStats.totalSales || 0;
    const net = showTaxes ? (gross * 0.9 - sales * 0.01) : gross;
    
    return (
      <div className="flex-col gap-6">
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 className="text-secondary" style={{ margin: 0, textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
            Doanh số Hệ thống Của Bạn
          </h3>
          <h1 style={{ margin: '10px 0 0 0', fontSize: '3rem', color: 'var(--text-primary)' }}>
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(sales)}
          </h1>

          <div className="mt-4">
             <label className="flex items-center gap-2 text-sm font-bold text-muted cursor-pointer w-fit" style={{ userSelect: 'none' }}>
                <input type="checkbox" checked={showTaxes} onChange={e => setShowTaxes(e.target.checked)} />
                Áp dụng Thuế TNCN (10%) & Phí Nền Tảng (1%)
             </label>
          </div>
          
          {currentUser.role !== 'customer' && (
            <div className="mt-4 p-4 rounded-xl border border-dashed border-gray-600 bg-gray-900/30 text-center">
               <div className="text-sm text-secondary font-bold mb-2">Gửi Link này cho Khách Hàng tự đăng ký tài khoản (Họ sẽ thuộc tuyến dưới của bạn)</div>
               <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                  <input type="text" readOnly value={`${window.location.origin}/?ref=${currentUser.id}`} className="input-field flex-1 max-w-sm text-center font-mono text-sm" style={{ background: 'var(--bg-primary)' }} />
                  <button onClick={() => {
                     navigator.clipboard.writeText(`${window.location.origin}/?ref=${currentUser.id}`);
                     alert('Đã copy Link Giới Thiệu!');
                  }} className="btn btn-primary px-4 py-2 hover-scale w-full sm:w-auto" style={{ whiteSpace: 'nowrap' }}>Copy Link</button>
               </div>
            </div>
          )}

          <div 
            style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0, 240, 255, 0.05)', border: '1px solid var(--accent-diamond)', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '5px' }}
            onClick={() => setActiveTab('commissions')}
            className="hover-effect transition-transform transform hover:scale-105"
          >
            <div className="text-diamond font-bold flex justify-between items-center" style={{ fontSize: '1.1rem' }}>
              <span>Hoa hồng Gộp (Chưa trừ Thuế/Phí):</span>
              <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(gross)}</span>
            </div>
            <div className="text-green-500 font-bold flex justify-between items-center" style={{ fontSize: '1.5rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
              <span>THỰC NHẬN {showTaxes ? '(Đã Trừ Thuế/Phí)' : ''}:</span>
              <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(net)}</span>
            </div>
            <div className="text-muted text-xs text-center mt-3 animate-pulse border-t border-gray-800 pt-2">
              👉 Click vào đây để xem chi tiết sao kê {showTaxes ? 'trừ Thuế/Phí' : 'Hoa Hồng'}
            </div>
          </div>
        </div>

        {/* Phase 2A: S-Points & Rank Foundation ? display only */}
        <div className="grid gap-4 mt-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <SPointWidget userId={currentUser.id} />
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">C?p b?c c?a b?n</span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <RankBadge tier={currentUser.tier} rank={currentUser.rank} size="lg" />
              <span className="text-xs text-gray-400">?ang ho?t ??ng</span>
            </div>
            {currentUser.rank && (
              <p className="text-xs text-purple-500 mt-2 italic">Rank ??c bi?t ?? ???c k?ch ho?t</p>
            )}
          </div>
        </div>
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
            <div className="stat-label">Giám đốc PT</div>
            <div className="stat-value">{data.totalDiamond} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Giám Đốc</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--accent-gold)', background: '#FEF3C7' }}>
            <Award size={28} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Quản lý PT</div>
            <div className="stat-value">{data.totalGold} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Quản Lý</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--accent-silver)', background: '#F1F5F9' }}>
            <Medal size={28} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Đại sứ KD</div>
            <div className="stat-value">{data.totalSilver} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Đại Sứ</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
