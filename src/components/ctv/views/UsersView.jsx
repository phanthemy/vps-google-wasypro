import React, { useState, useEffect } from 'react';
import { Edit, Users, Wallet, Trophy, Crown, Award, Medal } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import RankBadge from '../components/common/RankBadge.jsx';

export default function UsersView({ refreshKey, onAddUser, onEditUser }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredTooltip, setHoveredTooltip] = useState(null);
  const [showTaxes, setShowTaxes] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });

  useEffect(() => {
    fetch(`/api/users?timeFilter=${timeFilter}&period=${period}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setUsers(res.data);
      });
  }, [refreshKey, timeFilter, period]);

  const handleNoteChange = async (id, note) => {
    await fetch(`/api/users/${id}/note`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note })
    });
  };

  const computedUsers = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || 
                        u.phone?.includes(search) || 
                        (u.businessId && u.businessId.toLowerCase().includes(search.toLowerCase())) ||
                        u.id?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.tier === roleFilter || u.rank === roleFilter;
    return matchSearch && matchRole;
  });

  const totalSalesAll = computedUsers.reduce((sum, u) => sum + (u.totalSales || 0), 0);
  const totalCommAll = computedUsers.reduce((sum, u) => sum + (u.totalCommission || 0), 0);

  return (
    <div className="flex-col gap-6">
      {/* Header Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <PageHeader title="Danh Sách Đối Tác & CTV" subtitle="Quản lý thành viên, mã đối tác (Business ID) và phân cấp hệ thống." />
        <div className="flex gap-4 items-center" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={onAddUser}>+ Thêm Đối Tác Mới</button>
          <input 
            type="text" 
            className="input-field" 
            placeholder="🔎 Tìm theo tên, SĐT, mã đối tác..." 
            value={search} 
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{ maxWidth: '300px' }}
          />
          <select className="input-field" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }} style={{ padding: '8px' }}>
            <option value="ALL">-- Tất cả Cấp Bậc --</option>
            <option value="AMBASSADOR">Đại sứ</option>
            <option value="MANAGER">Quản lý</option>
            <option value="DIRECTOR">Giám đốc</option>
          </select>
          <select className="input-field" value={timeFilter} onChange={e => setTimeFilter(e.target.value)} style={{ padding: '8px' }}>
            <option value="all">Toàn Thời Gian</option>
            <option value="month">Theo Tháng</option>
            <option value="quarter">Theo Quý</option>
          </select>
          
          {timeFilter === 'month' && (
            <input type="month" className="input-field" value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '6px' }} />
          )}
          {timeFilter === 'quarter' && (
            <select className="input-field" value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '8px' }}>
              <option value="2026-1">Quý 1 / 2026</option>
              <option value="2026-2">Quý 2 / 2026</option>
              <option value="2026-3">Quý 3 / 2026</option>
              <option value="2026-4">Quý 4 / 2026</option>
            </select>
          )}

          <label className="flex items-center gap-1 text-sm font-bold text-muted cursor-pointer" style={{ marginLeft: '10px' }}>
            <input type="checkbox" checked={showTaxes} onChange={e => setShowTaxes(e.target.checked)} />
            Áp dụng Thuế & Phí (11%)
          </label>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card glass-panel flex items-center justify-between" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-gold)' }}>
          <div>
            <div className="text-muted text-sm uppercase">Tổng Doanh Số</div>
            <div className="text-2xl font-bold mt-1 text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalSalesAll)}</div>
          </div>
          <div className="bg-secondary p-3 rounded-full"><Trophy size={24} className="text-gold" /></div>
        </div>
        <div className="card glass-panel flex items-center justify-between" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-diamond)' }}>
          <div>
            <div className="text-muted text-sm uppercase">Tổng Hoa Hồng Gộp</div>
            <div className="text-2xl font-bold mt-1 text-diamond">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalCommAll)}</div>
          </div>
          <div className="bg-secondary p-3 rounded-full"><Wallet size={24} className="text-diamond" /></div>
        </div>
        <div className="card glass-panel flex items-center justify-between" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-pink)' }}>
          <div>
            <div className="text-muted text-sm uppercase">Số Đối Tác Ghi Nhận</div>
            <div className="text-2xl font-bold mt-1 text-primary">{computedUsers.length} <span className="text-sm font-normal text-muted">người</span></div>
          </div>
          <div className="bg-secondary p-3 rounded-full"><Users size={24} className="text-pink-500" /></div>
        </div>
      </div>

      <div className="card glass-panel flex-col gap-4" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Thành Viên / Đối Tác</th>
                <th>Mã Đối Tác</th>
                <th>Cấp Bậc</th>
                <th>Người Giới Thiệu (Tuyến trên)</th>
                <th>Doanh Số</th>
                <th style={{ color: 'var(--accent-diamond)' }}>Hoa Hồng Gộp</th>
                {showTaxes && (
                  <>
                    <th style={{ color: '#F43F5E' }}>Thuế TNCN (10%)</th>
                    <th style={{ color: '#F59E0B' }}>Phí Quản Lý (1%)</th>
                    <th style={{ color: '#10B981' }}>Thực Nhận</th>
                  </>
                )}
                <th>Ghi Chú</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {computedUsers.slice((currentPage - 1) * 20, currentPage * 20).map((user, i) => (
                <tr key={i}>
                  <td>
                    <div className="font-bold text-primary">{user.name}</div>
                    <div className="text-xs text-muted">{user.phone}</div>
                  </td>
                  <td>
                    {user.businessId ? (
                      <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                        {user.businessId}
                      </span>
                    ) : (
                      <span className="text-xs text-muted font-mono">{user.id?.slice(0, 8)}</span>
                    )}
                  </td>
                  <td>
                    <RankBadge tier={user.tier} rank={user.rank} size="sm" />
                  </td>
                  <td>
                    <div className="text-sm">{user.parent || '-'}</div>
                  </td>
                  <td>
                    <div className="font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.totalSales)}</div>
                  </td>
                  <td style={{ position: 'relative' }} 
                      onMouseEnter={() => setHoveredTooltip(user.id)} 
                      onMouseLeave={() => setHoveredTooltip(null)}>
                    <div className="font-bold text-diamond" style={{ textShadow: '0 0 10px rgba(0, 240, 255, 0.4)', cursor: 'pointer' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.totalCommission || 0)}
                    </div>
                  </td>
                  {showTaxes && (
                    <>
                      <td>
                        <div className="text-red-500 font-bold">-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((user.totalCommission || 0) * 0.1)}</div>
                      </td>
                      <td>
                        <div className="text-amber-500 font-bold">-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((user.totalSales || 0) * 0.01)}</div>
                      </td>
                      <td>
                        <div className="text-green-500 font-bold text-lg">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((user.totalCommission || 0) * 0.89)}</div>
                      </td>
                    </>
                  )}
                  <td>
                    <textarea 
                      className="input-field" 
                      defaultValue={user.note} 
                      placeholder="Ghi chú..."
                      onBlur={(e) => handleNoteChange(user.id, e.target.value)}
                      style={{ minHeight: '36px', width: '130px', fontSize: '12px', padding: '4px', resize: 'vertical' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn-icon flex items-center gap-1" 
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-blue)', margin: '0 auto'}}
                      onClick={() => onEditUser(user)}
                      title="Sửa thông tin đối tác"
                    >
                      <Edit size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
              {computedUsers.length === 0 && (
                <tr><td colSpan={showTaxes ? 10 : 7} className="text-center p-6 text-muted">Không có dữ liệu đối tác</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {computedUsers.length > 20 && (
          <div className="flex justify-between items-center p-4 mt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <button className="btn btn-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Trang Trước</button>
            <span className="text-sm font-bold text-muted">Trang {currentPage} / {Math.ceil(computedUsers.length / 20)}</span>
            <button className="btn btn-secondary" disabled={currentPage >= Math.ceil(computedUsers.length / 20)} onClick={() => setCurrentPage(p => p + 1)}>Trang Sau</button>
          </div>
        )}
      </div>
    </div>
  );
}
