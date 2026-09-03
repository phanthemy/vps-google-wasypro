import React, { useState, useEffect } from 'react';
import { Crown, Award, Medal, Plus, Download, Edit, BarChart3, Users, Wallet } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import RankBadge from '../components/common/RankBadge.jsx';

export default function UsersView({ refreshKey, onAddUser, onEditUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });

  const [hoveredTooltip, setHoveredTooltip] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaxes, setShowTaxes] = useState(false);

  const computedUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (u.name?.toLowerCase() || '').includes(q) || (u.phone || '').includes(q);
  });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users?timeFilter=${timeFilter}&period=${period}`)
      .then(r => r.json())
      .then(res => {
        if(res.success) {
           setUsers(res.data);
           setCurrentPage(1);
        }
      })
      .finally(() => setLoading(false));
  }, [refreshKey, timeFilter, period]);

  const handleNoteChange = async (id, note) => {
    try {
      await fetch(`/api/users/${id}/note`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });
    } catch(e) {}
  };

  const totalSalesAll = computedUsers.reduce((acc, u) => acc + (u.totalSales || 0), 0);
  const totalCommissionAll = computedUsers.reduce((acc, u) => acc + (u.totalCommission || 0), 0);
  const totalNetCommissionAll = computedUsers.reduce((acc, u) => {
      const gross = u.totalCommission || 0;
      if (showTaxes) {
          const sales = u.totalSales || 0;
          return acc + (gross * 0.9 - sales * 0.01);
      }
      return acc + gross;
  }, 0);

  const exportToCSV = () => {
    const headers = ['Mã CTV', 'Họ Tên CTV', 'Cấp Bậc', 'Số Điện Thoại', 'Người Giới Thiệu', 'Doanh Số (VNĐ)', 'Hoa Hồng Gộp (VNĐ)', 'Thuế TNCN 10%', 'Phí Nền Tảng 1%', 'Thực Nhận (VNĐ)', 'Ghi Chú Admin'];
    
    const rows = computedUsers.map(user => [
      user.id,
      `"${user.name}"`,
      user.tier,
      `="${user.phone}"`,
      `"${user.parent || ''}"`,
      user.totalSales,
      user.totalCommission || 0,
      (user.totalCommission || 0) * 0.1,
      (user.totalSales || 0) * 0.01,
      (user.totalCommission || 0) * 0.9 - (user.totalSales || 0) * 0.01,
      `"${(user.note || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DanhSach_CTV_DoanhSo_${timeFilter === 'all' ? 'ToanThoiGian' : period.replace('-', '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getIcon = (tier) => {
    if (tier === 'DIAMOND') return <Crown size={14} className="text-diamond"/>;
    if (tier === 'GOLD') return <Award size={14} className="text-gold"/>;
    return <Medal size={14} className="text-silver"/>;
  };

  const getColor = (tier) => {
    if (tier === 'DIAMOND') return 'var(--accent-diamond)';
    if (tier === 'GOLD') return 'var(--accent-gold)';
    return 'var(--accent-silver)';
  };

  if (loading) return <div className="text-muted p-4">Đang tải danh sách...</div>;

  return (
    <div className="flex-col gap-6" style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '1rem', width: '100%' }}>
         <PageHeader title="Quản lý & Chốt Lương CTV" subtitle="Tính toán hoa hồng và trích xuất bảng kê Excel." />
         <div className="flex gap-4 items-center flex-wrap justify-center">
            <button className="btn flex items-center gap-2" style={{ background: '#10B981', color: 'white' }} onClick={exportToCSV}>
               <Download size={16} /> Xuất Excel
            </button>
            <select className="input-field" value={timeFilter} onChange={e => setTimeFilter(e.target.value)} style={{ padding: '6px' }}>
               <option value="all">Toàn Thời Gian</option>
               <option value="month">Theo Tháng</option>
            </select>
            {timeFilter === 'month' && (
               <input type="month" className="input-field" value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '6px' }} />
            )}
            <input type="text" className="input-field" placeholder="🔎 Tìm Tên, SĐT CTV..." value={searchQuery} onChange={e => {setSearchQuery(e.target.value); setCurrentPage(1);}} style={{ padding: '6px', minWidth: '200px' }} />
            <button className="btn btn-primary" onClick={onAddUser}>+ Thêm CTV Mới</button>
            <label className="flex items-center gap-1 text-sm font-bold text-muted cursor-pointer" style={{ marginLeft: '10px' }}>
                <input type="checkbox" checked={showTaxes} onChange={e => setShowTaxes(e.target.checked)} />
                Áp dụng Thuế & Phí (11%)
            </label>
         </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-cols gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
         <div className="card glass-panel flex items-center justify-between" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-blue)' }}>
            <div>
              <div className="text-muted text-sm uppercase">Tổng Doanh Số {timeFilter === 'month' ? 'Tháng' : 'Toàn TG'}</div>
              <div className="text-2xl font-bold mt-1 text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalSalesAll)}</div>
            </div>
            <div className="bg-secondary p-3 rounded-full"><BarChart3 size={24} className="text-blue-500" /></div>
         </div>
         <div className="card glass-panel flex items-center justify-between" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-diamond)' }}>
            <div>
              <div className="text-muted text-sm uppercase">Tổng Hoa Hồng Phải Trả</div>
              <div className="text-2xl font-bold mt-1 text-diamond" style={{ textShadow: '0 0 10px rgba(0, 240, 255, 0.4)' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalNetCommissionAll)}</div>
            </div>
            <div className="bg-secondary p-3 rounded-full"><Wallet size={24} className="text-diamond" /></div>
         </div>
         <div className="card glass-panel flex items-center justify-between" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-pink)' }}>
            <div>
              <div className="text-muted text-sm uppercase">Số CTV Ghi Nhận</div>
              <div className="text-2xl font-bold mt-1 text-primary">{computedUsers.length} <span className="text-sm font-normal text-muted">người</span></div>
            </div>
            <div className="bg-secondary p-3 rounded-full"><Users size={24} className="text-pink-500" /></div>
         </div>
      </div>

      <div className="card glass-panel flex-col gap-4" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        {/* Table */}
        <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Cộng Tác Viên</th>
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
                <th>Phân Tích / Note</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {computedUsers.slice((currentPage - 1) * 20, currentPage * 20).map((user, i) => (
                <tr key={i}>
                  <td>
                    <div className="font-bold text-primary">{user.name}</div>
                    <div className="text-xs text-muted">{user.id} - {user.phone}</div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 font-bold" style={{ color: getColor(user.tier) }}>
                        {getIcon(user.tier)} {user.tier === 'DIAMOND' ? 'Giám đốc PT' : user.tier === 'GOLD' ? 'Quản lý PT' : 'Đại sứ KD'}
                      </div>
                      {user.rank && <RankBadge tier={user.tier} rank={user.rank} size="sm" />}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">{user.parent}</div>
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
                    {hoveredTooltip === user.id && user.commissions && user.commissions.length > 0 && (
                        <div className="tooltip-card glass-panel" style={{
                           position: 'absolute', top: '100%', right: '100%', transform: 'none',
                           background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                           padding: '10px', width: '250px', zIndex: 50, borderRadius: '8px',
                           boxShadow: '0 10px 25px rgba(0,0,0,0.5)', pointerEvents: 'none'
                        }}>
                           <h4 className="text-sm text-primary mb-2 border-b border-gray-700 pb-1">Chi tiết Hoa hồng</h4>
                           <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                               {user.commissions.map((c, idx) => {
                                   let sourceText = c.type === 'DIRECT' 
                                       ? `Khách: ${c.order?.customer?.fullName}` 
                                       : `Tuyến dưới (${c.order?.customer?.fullName})`;
                                   
                                   const amountFmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.amount);
                                   return (
                                     <li key={idx} className="flex justify-between" style={{ borderBottom: '1px dashed #334155', paddingBottom: '2px' }}>
                                        <span className="truncate" style={{ maxWidth: '60%' }} title={sourceText}>{sourceText}</span>
                                        <span className="text-diamond font-bold">{amountFmt}</span>
                                     </li>
                                   )
                               })}
                           </ul>
                        </div>
                    )}
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
                       placeholder="Ghi chú CTV..."
                       onBlur={(e) => handleNoteChange(user.id, e.target.value)}
                       style={{ minHeight: '40px', width: '150px', fontSize: '12px', padding: '4px', resize: 'vertical' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                     <button className="btn-icon flex items-center gap-1" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-blue)', margin: '0 auto'}}
                        onClick={() => onEditUser(user)}
                        title="Sửa thông tin CTV"
                     ><Edit size={16}/></button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="5" className="text-center p-4 text-muted">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {users.length > 20 && (
          <div className="flex justify-between items-center p-4 mt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
             <button className="btn btn-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Trang Trước</button>
             <span className="text-sm font-bold text-muted">Trang {currentPage} / {Math.ceil(users.length / 20)}</span>
             <button className="btn btn-secondary" disabled={currentPage >= Math.ceil(users.length / 20)} onClick={() => setCurrentPage(p => p + 1)}>Trang Sau</button>
          </div>
        )}
      </div>
    </div>
  );
}

