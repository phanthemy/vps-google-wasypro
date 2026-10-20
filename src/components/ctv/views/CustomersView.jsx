import React, { useState, useEffect } from 'react';
import { User, Phone, Search, Plus, Clock, X, ChevronRight, ArrowUpRight, UserCheck, Building2, Calendar, Shield } from 'lucide-react';

const STATUS_MAP = {
  'NEW': { label: 'Mới Tạo', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  'CONSULTING': { label: 'Đang Tư Vấn', bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
  'SURVEY': { label: 'Khảo Sát Nước', bg: '#F3E8FF', color: '#7E22CE', border: '#DDD6FE' },
  'DONE': { label: 'Đã Lắp Đặt', bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  'POST_OP': { label: 'Bảo Trì Định Kỳ', bg: '#FCE7F3', color: '#9D174D', border: '#FBCFE8' },
  'ARRIVED': { label: 'Đã Có Đơn Hàng', bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' }
};

export default function CustomersView({ refreshKey, currentUser, onAddCustomer }) {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [auditLogCustomer, setAuditLogCustomer] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState(null);
  const [promoteTier, setPromoteTier] = useState('SILVER');
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetch('/api/customers', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success) setCustomers(res.data);
      });
  }, [refreshKey]);

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

  const totalPages = Math.ceil(computedCustomers.length / ITEMS_PER_PAGE);
  const pagedCustomers = computedCustomers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* ── HEADER CARD ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0072F5 0%, #087EF5 100%)',
        borderRadius: '18px',
        padding: '20px 16px',
        marginBottom: '16px',
        color: '#FFFFFF',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px', lineHeight: 1.3 }}>
          Bảng Quản Lý Khách Hàng
        </h2>
        <p style={{ fontSize: '13px', fontWeight: 400, margin: 0, opacity: 0.85, lineHeight: 1.5 }}>
          Danh sách khách hàng, người bảo trợ (Sponsor) và liên kết tài khoản.
        </p>
      </div>

      {/* ── SEARCH + ADD BUTTON ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{
          flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '8px',
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '14px',
          padding: '0 12px', height: '44px', minWidth: 0
        }}>
          <Search size={18} color="#94A3B8" strokeWidth={2.2} />
          <input
            type="text"
            placeholder="Tìm Tên, SĐT Khách, CTV…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            style={{
              border: 'none', outline: 'none', flex: 1, background: 'transparent',
              fontSize: '14px', fontWeight: 400, color: '#0F172A',
              fontFamily: 'inherit'
            }}
          />
        </div>
        <button
          onClick={onAddCustomer}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            background: '#00B050', color: '#FFFFFF', border: 'none',
            borderRadius: '14px', padding: '0 12px', height: '44px',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            fontFamily: 'inherit', flexShrink: 0
          }}
        >
          <Plus size={16} strokeWidth={2.5} /> Thêm Khách Mới
        </button>
      </div>

      {/* ── STATS ROW ── */}
      <div style={{
        display: 'flex', gap: '8px', marginBottom: '16px'
      }}>
        <div style={{
          flex: 1, background: '#FFFFFF', border: '1px solid #EEF2F6',
          borderRadius: '14px', padding: '12px', textAlign: 'center',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)'
        }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#0072F5' }}>{customers.length}</div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#94A3B8', marginTop: '2px' }}>Tổng KH</div>
        </div>
        <div style={{
          flex: 1, background: '#FFFFFF', border: '1px solid #EEF2F6',
          borderRadius: '14px', padding: '12px', textAlign: 'center',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)'
        }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#00B050' }}>
            {customers.filter(c => c.status === 'DONE').length}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#94A3B8', marginTop: '2px' }}>Đã Lắp</div>
        </div>
        <div style={{
          flex: 1, background: '#FFFFFF', border: '1px solid #EEF2F6',
          borderRadius: '14px', padding: '12px', textAlign: 'center',
          boxShadow: '0 2px 8px rgba(15,23,42,0.04)'
        }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#F5A623' }}>
            {customers.filter(c => c.status === 'CONSULTING' || c.status === 'SURVEY').length}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: '#94A3B8', marginTop: '2px' }}>Đang TV</div>
        </div>
      </div>

      {/* ── CUSTOMER CARDS LIST ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {pagedCustomers.length === 0 && (
          <div style={{
            background: '#FFFFFF', border: '1px solid #EEF2F6', borderRadius: '18px',
            padding: '32px 16px', textAlign: 'center',
            boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
          }}>
            <UserCheck size={40} color="#94A3B8" strokeWidth={1.5} style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '15px', fontWeight: 500, color: '#94A3B8', margin: 0 }}>
              Không có dữ liệu khách hàng
            </p>
          </div>
        )}

        {pagedCustomers.map((cus, i) => {
          const statusInfo = STATUS_MAP[cus.status] || STATUS_MAP.NEW;
          return (
            <div
              key={cus.id || i}
              style={{
                background: '#FFFFFF',
                border: '1px solid #EEF2F6',
                borderRadius: '16px',
                padding: '14px',
                boxShadow: '0 2px 10px rgba(15,23,42,0.04)',
                overflow: 'hidden'
              }}
            >
              {/* Row 1: Name + Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>
                    {cus.fullName || 'Chưa có tên'}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 500, color: '#94A3B8', marginTop: '2px', fontFamily: 'monospace' }}>
                    ID: {cus.id?.slice(0, 8)}
                  </div>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 600,
                  padding: '3px 10px', borderRadius: '20px',
                  background: statusInfo.bg, color: statusInfo.color,
                  border: `1px solid ${statusInfo.border}`,
                  whiteSpace: 'nowrap', flexShrink: 0
                }}>
                  {statusInfo.label}
                </span>
              </div>

              {/* Row 2: Phone */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: '#F0F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Phone size={14} color="#0072F5" strokeWidth={2.2} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
                  {cus.phone}
                </span>
              </div>

              {/* Row 3: Sponsor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Building2 size={14} color="#00B050" strokeWidth={2.2} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {cus.sourceCtv ? (
                    <>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                        {cus.sourceCtv.fullName}
                      </span>
                      <span style={{
                        display: 'block', fontSize: '11px', fontWeight: 400, color: '#94A3B8',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%'
                      }}>
                        Sponsor: {cus.sponsorUserId || cus.sourceCtv.userId}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8', fontStyle: 'italic' }}>
                      — Trực tiếp Công ty —
                    </span>
                  )}
                </div>
              </div>

              {/* Row 4: Linked User + Date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                {/* Linked User */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={13} color="#64748B" strokeWidth={2} />
                  {cus.linkedUserId ? (
                    <span style={{
                      fontSize: '11px', fontWeight: 700, color: '#00B050',
                      background: '#ECFDF5', border: '1px solid #A7F3D0',
                      padding: '2px 8px', borderRadius: '6px', fontFamily: 'monospace'
                    }}>
                      ID: {cus.linkedUserId.slice(0, 8)}
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: 500, color: '#CBD5E1' }}>Chưa liên kết</span>
                  )}
                </div>
                {/* Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} color="#64748B" strokeWidth={2} />
                  <span style={{ fontSize: '12px', fontWeight: 400, color: '#475569' }}>
                    {new Date(cus.registeredAt || cus.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* Row 5: Actions */}
              <div style={{
                display: 'flex', gap: '8px', alignItems: 'center',
                borderTop: '1px solid #F1F5F9', paddingTop: '10px', flexWrap: 'wrap'
              }}>
                {/* Status Selector (admin/accountant only) */}
                {(currentUser.role === 'admin' || currentUser.role === 'accountant') ? (
                  <select
                    value={cus.status}
                    onChange={(e) => handleStatusChange(cus.id, e.target.value)}
                    style={{
                      padding: '5px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                      background: statusInfo.bg, color: statusInfo.color,
                      border: `1px solid ${statusInfo.border}`, cursor: 'pointer', outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  >
                    {Object.entries(STATUS_MAP).map(([val, {label}]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                ) : null}

                {/* Audit Log */}
                <button
                  title="Xem Lịch Sử"
                  onClick={() => fetchAuditLog(cus)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    background: '#F0F7FF', color: '#0072F5',
                    border: '1px solid #BFDBFE', borderRadius: '10px',
                    padding: '5px 10px', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit'
                  }}
                >
                  <Clock size={13} strokeWidth={2.2} /> Lịch sử
                </button>

                {/* Promote (admin/accountant + status DONE) */}
                {cus.status === 'DONE' && (currentUser.role === 'admin' || currentUser.role === 'accountant') && (
                  <button
                    onClick={() => { setPromoteTarget(cus); setPromoteTier('SILVER'); }}
                    title="Nâng cấp khách hàng thành đối tác"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      background: '#FEF3C7', color: '#B45309',
                      border: '1px solid #FDE68A', borderRadius: '10px',
                      padding: '5px 10px', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit'
                    }}
                  >
                    <ArrowUpRight size={13} strokeWidth={2.5} /> Nâng Cấp
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── PAGINATION ── */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 0', marginTop: '8px'
        }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            style={{
              padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
              background: currentPage === 1 ? '#F1F5F9' : '#FFFFFF',
              color: currentPage === 1 ? '#CBD5E1' : '#0072F5',
              border: `1px solid ${currentPage === 1 ? '#E2E8F0' : '#0072F5'}`,
              cursor: currentPage === 1 ? 'default' : 'pointer',
              fontFamily: 'inherit'
            }}
          >
            ← Trước
          </button>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            style={{
              padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
              background: currentPage >= totalPages ? '#F1F5F9' : '#FFFFFF',
              color: currentPage >= totalPages ? '#CBD5E1' : '#0072F5',
              border: `1px solid ${currentPage >= totalPages ? '#E2E8F0' : '#0072F5'}`,
              cursor: currentPage >= totalPages ? 'default' : 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Sau →
          </button>
        </div>
      )}

      {/* ── AUDIT LOG MODAL ── */}
      {auditLogCustomer && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%', maxWidth: '400px', background: '#FFFFFF',
            borderRadius: '20px', padding: '20px',
            boxShadow: '0 20px 60px rgba(15,23,42,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0072F5', margin: 0 }}>
                Lịch Sử: {auditLogCustomer.fullName}
              </h3>
              <button onClick={() => setAuditLogCustomer(null)} style={{
                background: '#F1F5F9', border: 'none', borderRadius: '10px',
                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}>
                <X size={18} color="#475569" />
              </button>
            </div>
            {loadingAudit ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>Đang tải nhật ký...</div>
            ) : auditLogs.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>Chưa có bản ghi lịch sử nào.</div>
            ) : (
              <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {auditLogs.map((log, idx) => (
                  <div key={idx} style={{
                    padding: '10px 12px', borderRadius: '12px',
                    background: '#F8FAFC', border: '1px solid #EEF2F6',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '11px', marginBottom: '4px' }}>
                      <span>{new Date(log.createdAt).toLocaleString('vi-VN')}</span>
                      <span style={{ fontWeight: 600, color: '#0072F5' }}>{log.actorName}</span>
                    </div>
                    <div style={{ color: '#0F172A', fontWeight: 500 }}>{log.action}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PROMOTE MODAL ── */}
      {promoteTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%', maxWidth: '380px', background: '#FFFFFF',
            borderRadius: '20px', padding: '20px',
            boxShadow: '0 20px 60px rgba(15,23,42,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#F5A623', margin: 0 }}>
                Nâng Cấp Đối Tác
              </h2>
              <button onClick={() => setPromoteTarget(null)} style={{
                background: '#F1F5F9', border: 'none', borderRadius: '10px',
                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}>
                <X size={18} color="#475569" />
              </button>
            </div>
            <div style={{
              borderBottom: '1px solid #EEF2F6', paddingBottom: '12px', marginBottom: '16px'
            }}>
              <div style={{ fontSize: '14px' }}>
                <b>Khách hàng:</b>{' '}
                <span style={{ color: '#0072F5', fontWeight: 600 }}>{promoteTarget.fullName}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>SĐT: {promoteTarget.phone}</div>
            </div>
            <form onSubmit={executePromote}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
                Chọn Cấp Bậc Ban Đầu:
              </label>
              <select
                value={promoteTier}
                onChange={e => setPromoteTier(e.target.value)}
                required
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '12px',
                  border: '1px solid #E2E8F0', fontSize: '14px', fontWeight: 500,
                  color: '#0F172A', outline: 'none', marginBottom: '16px',
                  fontFamily: 'inherit'
                }}
              >
                <option value="SILVER">Đại sứ (Ambassador)</option>
                <option value="GOLD">Trưởng nhóm (Manager)</option>
                <option value="DIAMOND">Quản lý (Director)</option>
              </select>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setPromoteTarget(null)}
                  style={{
                    padding: '10px 18px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                    background: '#F1F5F9', color: '#475569', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 18px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                    background: '#0072F5', color: '#FFFFFF', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Xác Nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
