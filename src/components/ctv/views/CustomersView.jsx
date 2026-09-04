import React, { useState, useEffect } from 'react';
import { Clock, Plus, X } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';

export default function CustomersView({ refreshKey, currentUser, onAddCustomer }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditCustomer, setAuditCustomer] = useState(null);

  const computedCustomers = customers.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const cName = (c.fullName || '').toLowerCase();
    const phone = c.phone || '';
    const ctvName = (c.sourceCtv?.fullName || '').toLowerCase();
    return cName.includes(q) || phone.includes(q) || ctvName.includes(q);
  });
  const [auditLogs, setAuditLogs] = useState([]);

  const STATUS_MAP = {
    'NEW': { label: 'Pre-check', bg: '#E2E8F0', color: '#475569' },
    'CONSULTED': { label: 'Đã tư vấn', bg: '#DBEAFE', color: '#1E40AF' },
    'DEPOSITED': { label: 'Đã cọc', bg: '#FEF3C7', color: '#B45309' },
    'DONE': { label: 'Đã làm', bg: '#D1FAE5', color: '#065F46' },
    'POST_OP': { label: 'Hậu phẫu', bg: '#FCE7F3', color: '#9D174D' },
    'ARRIVED': { label: 'Đã có Đơn', bg: '#FEF3C7', color: '#B45309' }
  };

  const [promoteTarget, setPromoteTarget] = useState(null);
  const [promoteTier, setPromoteTier] = useState('SILVER');

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/customers/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, userId: currentUser.id, userFullName: currentUser.fullName })
      }).then(r => r.json());
      if (res.success) {
         setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      } else alert('Lỗi cập nhật trạng thái');
    } catch(e) { alert('Lỗi kết nối'); }
  };

  const executePromote = async (e) => {
    e.preventDefault();
    if (!promoteTarget || !promoteTier) return;
    
    if (!window.confirm(`Bạn có chắc muốn nâng cấp SĐT ${promoteTarget.phone} lên làm CTV cấp ${promoteTier}?`)) return;

    try {
      const res = await fetch(`/api/customers/${promoteTarget.id}/promote`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ tier: promoteTier, userId: currentUser.id, userFullName: currentUser.fullName })
      }).then(r => r.json());
      
      if (res.success) {
         alert('Đã nâng cấp thành công! Khách hàng giờ đây có thể đăng nhập bằng tài khoản Đại lý.');
         setPromoteTarget(null);
         fetch('/api/customers')
           .then(r => r.json())
           .then(res => {
             if (res.success) {
               if (currentUser.role === 'admin' || currentUser.role === 'accountant') {
                 setCustomers(res.data);
               } else {
                 const mine = res.data.filter(c => c.sourceCtv && c.sourceCtv.userId === currentUser.id);
                 setCustomers(mine);
               }
             }
           });
      } else alert(res.message || 'Lỗi nâng cấp');
    } catch(err) { alert('Lỗi kết nối'); }
  };

  const showAuditLogs = async (id) => {
    try {
      const res = await fetch(`/api/customers/${id}/audit-log`).then(r => r.json());
      if (res.success) {
         setAuditLogs(res.data);
         setAuditCustomer(customers.find(c => c.id === id));
      }
    } catch(e) { alert('Lỗi tải lịch sử thao tác'); }
  };

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.json())
      .then(res => {
        if(res.success) {
          if (currentUser.role === 'admin' || currentUser.role === 'accountant') {
            setCustomers(res.data);
          } else {
            const mine = res.data.filter(c => c.sourceCtv && c.sourceCtv.userId === currentUser.id);
            setCustomers(mine);
          }
          setCurrentPage(1);
        }
      })
      .finally(() => setLoading(false));
  }, [refreshKey, currentUser]);

  if (loading) return <div className="text-muted p-4">Đang tải danh sách...</div>;

  return (
    <div className="flex-col gap-6">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '1rem', width: '100%' }}>
        <PageHeader title="Bảng Check-in Khách Hàng" subtitle="Danh sách khách hàng và CTV nguồn." />
        <div className="flex gap-2 w-full justify-center">
            <input type="text" className="input-field" placeholder="🔎 Tìm Tên, SĐT Khách, Tên CTV..." value={searchQuery} onChange={e => {setSearchQuery(e.target.value); setCurrentPage(1);}} style={{ maxWidth: '400px' }} />
            <button className="btn btn-action" onClick={onAddCustomer}>+ Pre-check Khách Mới</button>
         </div>
      </div>

      <div className="card glass-panel flex-col gap-4" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Họ và Tên Khách</th>
                <th>Số điện thoại</th>
                <th>Người Giới Thiệu (CTV Nguồn)</th>
                <th>Ngày tạo</th>
                <th>Chăm sóc / Theo dõi</th>
              </tr>
            </thead>
            <tbody>
              {computedCustomers.slice((currentPage - 1) * 20, currentPage * 20).map((cus, i) => (
                <tr key={i}>
                  <td>
                    <div className="font-bold text-primary">{cus.fullName}</div>
                    <div className="text-xs text-muted">ID: {cus.id}</div>
                  </td>
                  <td>
                    <div className="font-bold">{cus.phone}</div>
                  </td>
                  <td>
                    {cus.sourceCtv ? (
                      <div className="flex-col">
                        <span className="font-bold">{cus.sourceCtv.fullName}</span>
                        <span className="text-xs text-muted">ID: {cus.sourceCtv.userId}</span>
                      </div>
                    ) : (
                      <span className="text-muted text-sm" style={{ fontStyle: 'italic' }}>-- Trực tiếp Công ty --</span>
                    )}
                  </td>
                  <td>
                    <div className="text-sm">{new Date(cus.registeredAt).toLocaleDateString('vi-VN')}</div>
                  </td>
                  <td>
                     <div className="flex items-center gap-2">
                       {currentUser.role === 'admin' || currentUser.role === 'accountant' ? (
                         <select 
                            className="input-field" 
                            value={cus.status}
                            onChange={(e) => handleStatusChange(cus.id, e.target.value)}
                            style={{
                               padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold',
                               background: (STATUS_MAP[cus.status] || STATUS_MAP.NEW).bg,
                               color: (STATUS_MAP[cus.status] || STATUS_MAP.NEW).color,
                               border: 'none', cursor: 'pointer', outline: 'none'
                            }}
                         >
                           {Object.entries(STATUS_MAP).map(([val, {label}]) => (
                              <option key={val} value={val}>{label}</option>
                           ))}
                         </select>
                       ) : (
                         <span className="badge" style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            background: (STATUS_MAP[cus.status] || STATUS_MAP.NEW).bg,
                            color: (STATUS_MAP[cus.status] || STATUS_MAP.NEW).color
                         }}>
                            {(STATUS_MAP[cus.status] || STATUS_MAP.NEW).label}
                         </span>
                       )}
                       {(currentUser.role === 'admin' || currentUser.role === 'accountant') && (
                         <button className="btn-icon" title="Xem lịch sử thao tác" 
                                 onClick={() => showAuditLogs(cus.id)}
                                 style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}>
                            <Clock size={16} className="text-muted" />
                         </button>
                       )}
                       <button className="btn-icon" title="Nâng cấp Khách Hàng này lên Đại Lý (CTV)" 
                               onClick={() => { setPromoteTarget(cus); setPromoteTier('SILVER'); }}
                               style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent-gold)', borderRadius: '4px', marginLeft: '4px' }}>
                          <span style={{ fontSize: '14px' }}>👑</span>
                       </button>
                     </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan="5" className="text-center p-4 text-muted">Chưa có khách hàng nào được ghi nhận.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {customers.length > 20 && (
          <div className="flex justify-between items-center p-4 mt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
             <button className="btn btn-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Trang Trước</button>
             <span className="text-sm font-bold text-muted">Trang {currentPage} / {Math.ceil(customers.length / 20)}</span>
             <button className="btn btn-secondary" disabled={currentPage >= Math.ceil(customers.length / 20)} onClick={() => setCurrentPage(p => p + 1)}>Trang Sau</button>
          </div>
        )}
      </div>

      {/* Audit Log Modal */}
      {auditCustomer && (
        <div className="modal-overlay z-50">
           <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-primary" style={{ color: 'var(--accent-blue)'}}>Lịch Sử Chăm Sóc</h2>
                 <button className="btn-icon" onClick={() => setAuditCustomer(null)}><X size={20}/></button>
              </div>
              <div className="mb-4 pb-2 border-b border-gray-700">
                 <div><b>Khách hàng:</b> <span className="text-primary">{auditCustomer.fullName}</span></div>
                 <div className="text-sm text-muted">SĐT: {auditCustomer.phone}</div>
              </div>
              <div className="flex-col gap-3">
                 {auditLogs.length === 0 ? (
                    <div className="text-center p-4 text-muted border border-dashed rounded border-gray-600">Chưa có thao tác nào được ghi nhận.</div>
                 ) : (
                    auditLogs.map((log, idx) => {
                       let detailsObj = {};
                       try { detailsObj = JSON.parse(log.details); } catch(e){}
                       
                       return (
                          <div key={idx} className="bg-secondary p-3 rounded" style={{ borderLeft: '3px solid var(--accent-blue)' }}>
                             <div className="flex justify-between items-start mb-1">
                                <div className="text-xs text-muted" style={{ fontWeight: '600' }}>{new Date(log.createdAt).toLocaleString('vi-VN')}</div>
                                <div className="badge" style={{ background: '#E2E8F0', color: '#334155', fontSize: '10px' }}>{log.userId}</div>
                             </div>
                             <div className="text-sm mt-1">
                                {log.action === 'UPDATE_STATUS' && (
                                   <span>
                                     Đã đổi trạng thái từ{' '}
                                     <span className="font-bold text-muted">{STATUS_MAP[detailsObj.from]?.label || detailsObj.from}</span>{' '}
                                     ➡{' '}
                                     <span className="font-bold text-primary">{STATUS_MAP[detailsObj.to]?.label || detailsObj.to}</span>
                                   </span>
                                )}
                             </div>
                          </div>
                       )
                    })
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Promote Modal */}
      {promoteTarget && (
        <div className="modal-overlay z-50" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', background: 'var(--bg-glass)' }}>
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-primary" style={{ color: 'var(--accent-gold)'}}>Nâng Cấp Đại Lý (CTV)</h2>
                 <button className="btn-icon" onClick={() => setPromoteTarget(null)}><X size={20}/></button>
              </div>
              <div className="mb-4 pb-2 border-b border-gray-700">
                 <div><b>Khách hàng:</b> <span className="text-primary">{promoteTarget.fullName}</span></div>
                 <div className="text-sm text-muted">SĐT: {promoteTarget.phone}</div>
              </div>
              <form onSubmit={executePromote} className="flex-col gap-4">
                 <div className="flex-col gap-1">
                    <label className="text-sm font-bold">Chọn Cấp Bậc:</label>
                    <select className="input-field" value={promoteTier} onChange={e => setPromoteTier(e.target.value)} required>
                       <option value="SILVER">Đại sứ KD (SILVER)</option>
                       <option value="GOLD">Quản lý PT (GOLD)</option>
                       <option value="DIAMOND">Giám đốc PT (DIAMOND)</option>
                    </select>
                 </div>
                 <button type="submit" className="btn hover-scale w-full" style={{ background: 'var(--accent-gold)', color: '#000', fontWeight: 'bold', padding: '12px', marginTop: '10px' }}>
                    Xác Nhận Nâng Cấp
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

