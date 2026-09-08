import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Package, RefreshCw } from 'lucide-react';

export default function OrdersView({ currentUser }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [timeFilter, setTimeFilter] = useState('all');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [exactDate, setExactDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState('all');

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'accountant';
  const isParticipant = currentUser?.isSystemParticipant;

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      if (false && isAdmin) {
        // Admin: use /api/orders for full CTV order management
        const res = await fetch('/api/orders', { credentials: 'include' }).then(r => r.json());
        if (res.success) {
          setOrders(res.data.map(o => ({ ...o, _source: 'ctv' })));
        }
      } else {
        // Regular user (CTV, Khách Hàng): use /api/orders/my for combined view
        const res = await fetch('/api/orders/my', { credentials: 'include' }).then(r => r.json());
        if (res.success) {
          const combined = [];
          
          // Normalize website orders
          if (res.data.websiteOrders) {
            res.data.websiteOrders.forEach(wo => {
              combined.push({
                id: wo.id,
                createdAt: wo.createdAt,
                totalAmount: wo.totalAmount || 0,
                status: wo.status,
                _source: 'website',
                customer: {
                  fullName: wo.customerName,
                  phone: wo.customerPhone,
                },
                items: [{
                  product: { title: wo.productTitle },
                  qty: wo.qty || 1,
                  amount: wo.totalAmount || 0,
                }],
                commissions: [],
                totalCommissionPoints: wo.commissionPoints || 0,
              });
            });
          }
          
          // Normalize CTV orders
          if (res.data.ctvOrders) {
            res.data.ctvOrders.forEach(co => {
              combined.push({
                ...co,
                _source: 'ctv',
              });
            });
          }
          
          // Sort by date descending
          combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setOrders(combined);
        } else {
          setError(res.message || 'Không thể tải đơn hàng');
        }
      }
    } catch (e) {
      console.error('Load orders error:', e);
      setError('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('CẢNH BÁO: Xóa đơn hàng sẽ tự động XÓA TOÀN BỘ hoa hồng liên quan!\n\nBạn có chắc chắn muốn xóa?')) return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE', credentials: 'include' }).then(r => r.json());
      if (res.success) {
         alert('Đã xóa đơn hàng và thu hồi hoa hồng thành công.');
         loadOrders();
      } else {
         alert('Lỗi xóa đơn hàng: ' + res.error);
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ');
    }
  };

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></div>
      <p className="text-muted font-medium">Đang tải danh sách đơn hàng...</p>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center">
      <p className="text-red-500 font-medium mb-3">⚠️ {error}</p>
      <button onClick={loadOrders} className="btn-primary flex items-center gap-2 mx-auto" style={{ padding: '8px 16px' }}>
        <RefreshCw size={16} /> Thử lại
      </button>
    </div>
  );

  const filteredOrders = orders.filter(o => {
      // Order type filter
      if (orderType === 'website' && o._source !== 'website') return false;
      if (orderType === 'ctv' && o._source !== 'ctv') return false;
      if (orderType === 'self') {
        const isSelfBuy = o.customer?.phone === o.customer?.sourceCtv?.phone;
        if (!isSelfBuy) return false;
      }
      if (orderType === 'customer') {
        const isSelfBuy = o.customer?.phone === o.customer?.sourceCtv?.phone;
        if (isSelfBuy) return false;
      }

      // Date filter
      if (timeFilter === 'month') {
          const orderMonth = new Date(o.createdAt).toISOString().slice(0, 7);
          if (orderMonth !== period) return false;
      } else if (timeFilter === 'date') {
          const orderDate = new Date(o.createdAt).toISOString().slice(0, 10);
          if (orderDate !== exactDate) return false;
      }

      // Search query
      if (searchQuery) {
          const q = searchQuery.toLowerCase().trim();
          const cusName = o.customer?.fullName?.toLowerCase() || '';
          const cusPhone = o.customer?.phone?.toLowerCase() || '';
          const orderIdStr = o.id.toLowerCase();
          const productNames = o.items?.map(i => (i.product?.title || i.service?.name || '').toLowerCase()).join(' ') || '';
          
          if (!cusName.includes(q) && !cusPhone.includes(q) && !orderIdStr.includes(q) && !productNames.includes(q)) {
              return false;
          }
      }
      return true;
  });

  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
  const totalItemsSold = filteredOrders.reduce((acc, o) => acc + (o.items?.reduce((sum, item) => sum + (item.qty || 1), 0) || 0), 0);

  const statusLabel = (status) => {
    const map = {
      'NEW': { text: 'Mới', color: '#3b82f6', bg: '#eff6ff' },
      'CONFIRMED': { text: 'Đã xác nhận', color: '#f59e0b', bg: '#fffbeb' },
      'SHIPPING': { text: 'Đang giao', color: '#8b5cf6', bg: '#f5f3ff' },
      'COMPLETED': { text: 'Hoàn thành', color: '#10b981', bg: '#ecfdf5' },
      'CANCELLED': { text: 'Đã hủy', color: '#ef4444', bg: '#fef2f2' },
      'PENDING': { text: 'Chờ xử lý', color: '#f59e0b', bg: '#fffbeb' },
    };
    const s = map[status] || { text: status || 'N/A', color: '#6b7280', bg: '#f9fafb' };
    return <span style={{ color: s.color, background: s.bg, padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, border: `1px solid ${s.color}30` }}>{s.text}</span>;
  };

  const sourceLabel = (source) => {
    if (source === 'website') return <span style={{ color: '#059669', background: '#d1fae5', padding: '1px 6px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 700 }}>Website</span>;
    return <span style={{ color: '#7c3aed', background: '#ede9fe', padding: '1px 6px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 700 }}>CTV</span>;
  };

  return (
    <div className="flex-col gap-6 fade-in">
       <div className="card glass-panel flex-col gap-4">
          <div className="flex-col gap-4 mb-2">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2"><ShoppingCart className="text-blue-500"/> Đơn Hàng Của Tôi</h2>
                <button onClick={loadOrders} className="btn-icon hover-scale" title="Làm mới" style={{ padding: '8px', borderRadius: '50%' }}>
                  <RefreshCw size={18} />
                </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 mt-2">
                 <div className="card p-4 rounded-xl flex-col items-center justify-center text-center shadow-sm" style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                     <div className="text-sm font-bold opacity-80 uppercase tracking-wider mb-1">Số Đơn Hàng</div>
                     <div className="text-3xl font-black">{totalOrders}</div>
                 </div>
                 <div className="card p-4 rounded-xl flex-col items-center justify-center text-center shadow-sm" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                     <div className="text-sm font-bold opacity-80 uppercase tracking-wider mb-1">Tổng Giá Trị</div>
                     <div className="text-2xl font-black">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)}</div>
                 </div>
                 <div className="card p-4 rounded-xl flex-col items-center justify-center text-center shadow-sm" style={{ background: '#f5f3ff', color: '#5b21b6', border: '1px solid #c4b5fd' }}>
                     <div className="text-sm font-bold opacity-80 uppercase tracking-wider mb-1">Sản Phẩm Đã Mua</div>
                     <div className="text-3xl font-black">{totalItemsSold}</div>
                 </div>
             </div>

             <div className="flex gap-4 items-center flex-wrap p-3 rounded-lg" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                 <select className="input-field" value={orderType} onChange={e => setOrderType(e.target.value)} style={{ padding: '6px 10px', maxWidth: '180px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="all">Tất cả đơn hàng</option>
                    <option value="website">Đặt qua Website</option>
                    <option value="ctv">Đơn CTV</option>
                 </select>
                 
                 <select className="input-field" value={timeFilter} onChange={e => setTimeFilter(e.target.value)} style={{ padding: '6px 10px', maxWidth: '150px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <option value="all">Toàn thời gian</option>
                    <option value="month">Theo tháng</option>
                    <option value="date">Theo ngày</option>
                 </select>
                 {timeFilter === 'month' && <input type="month" className="input-field" value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />}
                 {timeFilter === 'date' && <input type="date" className="input-field" value={exactDate} onChange={e => setExactDate(e.target.value)} style={{ padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />}
                 
                 <input type="text" className="input-field flex-1" placeholder="🔎 Tìm Tên, SĐT, Mã Đơn, Sản phẩm..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '6px 10px', minWidth: '200px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
             </div>
          </div>
          
          {filteredOrders.length === 0 ? (
            <div className="text-center p-12" style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <Package size={48} className="mx-auto mb-3" style={{ color: '#94a3b8' }} />
              <p className="text-lg font-bold" style={{ color: '#475569' }}>Chưa có đơn hàng nào</p>
              <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Đơn hàng bạn đặt trên website hoặc qua CTV sẽ hiển thị tại đây</p>
            </div>
          ) : (
            <div className="flex-col gap-3">
              {filteredOrders.map(order => (
                <div key={order.id} className="rounded-xl p-4 hover-scale" style={{ background: '#ffffff', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold" style={{ fontFamily: 'monospace', color: '#1e40af', fontSize: '0.9rem' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
                        {sourceLabel(order._source)}
                        {order.status && statusLabel(order.status)}
                      </div>
                      <div className="text-xs" style={{ color: '#64748b' }}>{new Date(order.createdAt).toLocaleString('vi-VN')}</div>
                    </div>
                    {isAdmin && (
                      <button 
                         className="btn-icon hover-scale" 
                         style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', padding: '8px' }}
                         onClick={() => handleDelete(order.id)}
                         title="Xóa Đơn Hàng"
                      >
                         <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-col gap-2">
                    {order.items?.map((item, idx) => {
                      const itemName = item.product?.title || item.service?.name || 'Sản phẩm';
                      return (
                        <div key={idx} className="flex justify-between items-center py-1" style={{ borderBottom: idx < order.items.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium" style={{ color: '#1e293b' }}>{itemName}</span>
                            <span style={{ color: '#64748b', background: '#f1f5f9', padding: '1px 6px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>x{item.qty || 1}</span>
                          </div>
                          <span className="font-bold" style={{ color: '#059669' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount || 0)}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-between items-center mt-3 pt-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                    <div className="text-sm" style={{ color: '#64748b' }}>
                      {order.customer?.fullName && <span className="font-medium">{order.customer.fullName}</span>}
                      {order.customer?.phone && <span className="ml-2">• {order.customer.phone}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const cp = order.commissions
                          ? order.commissions.reduce((s, c) => s + (c.earnedPoints || 0), 0)
                          : (order.totalCommissionPoints || order.qualifyingPoints || 0);
                        return cp > 0
                          ? <span className="font-bold" style={{ color: '#d97706', fontSize: '0.85rem' }}>+{cp.toLocaleString('vi-VN')} CP</span>
                          : null;
                      })()}
                      <span className="font-black text-lg" style={{ color: '#1e40af' }}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
       </div>
    </div>
  )
}
