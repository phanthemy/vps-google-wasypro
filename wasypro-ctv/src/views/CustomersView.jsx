import React, { useState, useEffect } from 'react';
import { User, Phone, CheckCircle, Clock, X, ChevronRight, ArrowUpRight } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';

export default function CustomersView({ refreshKey, currentUser, onAddCustomer }) {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [auditLogCustomer, setAuditLogCustomer] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    fetch('/api/customers', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success) setCustomers(res.data);
      });
  }, [refreshKey]);

  const STATUS_MAP = {
    'NEW': { label: 'Mới Tạo', bg: '#EFF6FF', color: '#1D4ED8' },
    'CONSULTING': { label: 'Đang Tư Vấn', bg: '#FEF3C7', color: '#D97706' },
    'SURVEY': { label: 'Khảo Sát Nước', bg: '#F3E8FF', color: '#7E22CE' },
    'DONE': { label: 'Đã Lắp Đặt', bg: '#D1FAE5', color: '#065F46' },
    'POST_OP': { label: 'Bảo Trì Định Kỳ', bg: '#FCE7F3', color: '#9D174D' },
    'ARRIVED': { label: 'Đã Có Đơn Hàng', bg: '#FEF3C7', color: '#B45309' }
  };

  const [promoteTarget, setPromoteTarget] = useState(null);
  const [promoteTier, setPromoteTier] = useState('SILVER');

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/customers/${id}/status`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      }).then(r => r.json());
      if (res.success) {
        setCustomers(customers.map(c => c.id === id ? { ...c, status: newStatus } : c));
      } else {
        alert('Lỗi cập nhật trạng thái');
      }
    } catch (e) { alert('Lỗi kết nối'); }
  };

  const executePromote = async (e) => {
    e.preventDefault();
    if (!promoteTarget || !promoteTier) return;
    
    if (!window.confirm(`Bạn có chắc muốn nâng cấp SĐT ${promoteTarget.phone} lên làm đối tác cấp ${promoteTier}?`)) return;

    try {
      const res = await fetch(`/api/customers/${promoteTarget.id}/promote`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: promoteTier, userId: currentUser.id, userFullName: currentUser.fullName })
      }).then(r => r.json());
      
      if (res.success) {
        alert('Đã nâng cấp thành công! Khách hàng giờ đây có thể đăng nhập bằng tài khoản đối tác.');
        setPromoteTarget(null);
        fetch('/api/customers', { credentials: 'include' }).then(r => r.json()).then(res => { if (res.success) setCustomers(res.data); });
      } else {
        alert(`Lỗi nâng cấp: ${res.message || 'Không xác định'}`);
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const fetchAuditLog = async (cus) => {
    setAuditLogCustomer(cus);
    setLoadingAudit(true);
    try {
      const res = await fetch(`/api/customers/${cus.id}/audit-log`, { credentials: 'include' }).then(r => r.json());
      if (res.success) setAuditLogs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAudit(false);
    }
  };

  const computedCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    const cName = (c.fullName || '').toLowerCase();
    const phone = c.phone || '';
    const ctvName = (c.sourceCtv?.fullName || '').toLowerCase();
    const sponsor = (c.sponsorUserId || '').toLowerCase();
    return cName.includes(q) || phone.includes(q) || ctvName.includes(q) || sponsor.includes(q);
  });

  return (
    <div className="flex-col gap-6">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <PageHeader title="Bảng Quản Lý Khách Hàng" subtitle="Danh sách khách hàng, người bảo trợ (Sponsor) và liên kết tài khoản." />
        <div className="flex gap-2 w-full justify-center">
          <input 
            type="text" 
            className="input-field" 
            placeholder="🔎 Tìm Tên, SĐT Khách, CTV nguồn..." 
            value={searchQuery} 
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
            style={{ maxWidth: '400px' }} 
          />
          <button className="btn btn-action" onClick={onAddCustomer}>+ Thêm Khách Mới</button>
        </div>
      </div>

      <div className="card glass-panel flex-col gap-4" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Họ và Tên Khách</th>
                <th>Số Điện Thoại</th>
                <th>Người Bảo Trợ (Sponsor / CTV)</th>
                <th>Liên Kết Thành Viên</th>
                <th>Ngày Tạo</th>
                <th>Chăm Sóc / Theo Dõi</th>
              </tr>
            </thead>
            <tbody>
              {computedCustomers.slice((currentPage - 1) * 20, currentPage * 20).map((cus, i) => (
                <tr key={i}>
                  <td>
                    <div className="font-bold text-primary">{cus.fullName}</div>
                    <div className="text-xs text-muted font-mono">ID: {cus.id?.slice(0, 8)}</div>
                  </td>
                  <td>
                    <div className="font-bold">{cus.phone}</div>
                  </td>
                  <td>
                    {cus.sourceCtv ? (
                      <div className="flex-col">
                        <span className="font-bold">{cus.sourceCtv.fullName}</span>
                        <span className="text-xs text-muted font-mono">
                          Sponsor: {cus.sponsorUserId || cus.sourceCtv.userId}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted text-sm italic">-- Trực tiếp Công ty --</span>
                    )}
                  </td>
                  <td>
                    {cus.linkedUserId ? (
                      <span className="text-xs font-mono font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded">
                        ID: {cus.linkedUserId.slice(0, 8)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">Chưa liên kết</span>
                    )}
                  </td>
                  <td>
                    <div className="text-sm">{new Date(cus.registeredAt || cus.createdAt).toLocaleDateString('vi-VN')}</div>
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

                      <button 
                        className="btn-icon" 
                        title="Xem Lịch Sử" 
                        onClick={() => fetchAuditLog(cus)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                      >
                        <Clock size={16} className="text-secondary hover:text-primary" />
                      </button>

                      {cus.status === 'DONE' && (currentUser.role === 'admin' || currentUser.role === 'accountant') && (
                        <button 
                          className="btn btn-secondary flex items-center gap-1" 
                          style={{ padding: '4px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                          onClick={() => { setPromoteTarget(cus); setPromoteTier('SILVER'); }}
                          title="Nâng cấp khách hàng thành đối tác"
                        >
                          <ArrowUpRight size={14} className="text-gold" /> Nâng Cấp Đối Tác
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {computedCustomers.length === 0 && (
                <tr><td colSpan="6" className="text-center p-6 text-muted">Không có dữ liệu khách hàng</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {computedCustomers.length > 20 && (
          <div className="flex justify-between items-center p-4 mt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <button className="btn btn-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Trang Trước</button>
            <span className="text-sm font-bold text-muted">Trang {currentPage} / {Math.ceil(computedCustomers.length / 20)}</span>
            <button className="btn btn-secondary" disabled={currentPage >= Math.ceil(computedCustomers.length / 20)} onClick={() => setCurrentPage(p => p + 1)}>Trang Sau</button>
          </div>
        )}
      </div>

      {/* Audit Log Modal */}
      {auditLogCustomer && (
        <div className="modal-overlay z-50" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', background: 'var(--bg-glass)' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-primary font-bold">Lịch Sử Khách Hàng: {auditLogCustomer.fullName}</h3>
              <button className="btn-icon" onClick={() => setAuditLogCustomer(null)}><X size={20}/></button>
            </div>
            {loadingAudit ? (
              <div className="p-4 text-center text-muted">Đang tải nhật ký...</div>
            ) : auditLogs.length === 0 ? (
              <div className="p-4 text-center text-muted">Chưa có bản ghi lịch sử nào.</div>
            ) : (
              <div className="flex-col gap-3" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="flex-col gap-1 p-2 rounded border border-gray-800 bg-black/20 text-xs">
                    <div className="flex justify-between text-muted">
                      <span>{new Date(log.createdAt).toLocaleString('vi-VN')}</span>
                      <span className="font-bold text-primary">{log.actorName}</span>
                    </div>
                    <div>{log.action}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Promote Modal */}
      {promoteTarget && (
        <div className="modal-overlay z-50" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', background: 'var(--bg-glass)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-primary font-bold" style={{ color: 'var(--accent-gold)'}}>Nâng Cấp Đối Tác</h2>
              <button className="btn-icon" onClick={() => setPromoteTarget(null)}><X size={20}/></button>
            </div>
            <div className="mb-4 pb-2 border-b border-gray-700">
              <div><b>Khách hàng:</b> <span className="text-primary">{promoteTarget.fullName}</span></div>
              <div className="text-sm text-muted">SĐT: {promoteTarget.phone}</div>
            </div>
            <form onSubmit={executePromote} className="flex-col gap-4">
              <div className="flex-col gap-1">
                <label className="text-sm font-bold">Chọn Cấp Bậc Ban Đầu:</label>
                <select className="input-field" value={promoteTier} onChange={e => setPromoteTier(e.target.value)} required>
                  <option value="SILVER">Đại sứ (Ambassador)</option>
                  <option value="GOLD">Quản lý (Manager)</option>
                  <option value="DIAMOND">Giám đốc (Director)</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button type="button" className="btn btn-secondary" onClick={() => setPromoteTarget(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Xác Nhận Nâng Cấp</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
