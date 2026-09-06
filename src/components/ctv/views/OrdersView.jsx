import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2 } from 'lucide-react';

export default function OrdersView({ currentUser }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [timeFilter, setTimeFilter] = useState('all');
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [exactDate, setExactDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState('all');

  const loadOrders = () => {
    setLoading(true);
    fetch(`/api/orders?userId=${currentUser?.id}`)
      .then(r => r.json())
      .then(res => {
         if (res.success) setOrders(res.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('CẢNH BÁO MẠNH: Xóa đơn hàng sẽ tự động XÓA TOÀN BỘ hoa hồng liên quan đã sinh ra từ đơn hàng này!\n\nBạn có chắc chắn muốn xóa?')) return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' }).then(r => r.json());
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

  if (loading) return <div className="p-4 text-center">Đang tải danh sách đơn hàng...</div>;

  const filteredOrders = orders.filter(o => {
      // Order type filter
      const isSelfBuy = o.customer?.phone === o.customer?.sourceCtv?.phone;
      if (orderType === 'self' && !isSelfBuy) return false;
      if (orderType === 'customer' && isSelfBuy) return false;

      // Date filter
      if (timeFilter === 'month') {
          const orderMonth = new Date(o.createdAt).toISOString().slice(0, 7);
          if (orderMonth !== period) return false;
      } else if (timeFilter === 'date') {
          const orderDate = new Date(o.createdAt).toISOString().slice(0, 10);
          if (orderDate !== exactDate) return false;
      }

      // Search query (CTV name/phone, Customer name/phone)
      if (searchQuery) {
          const q = searchQuery.toLowerCase().trim();
          const ctvName = o.customer?.sourceCtv?.fullName?.toLowerCase() || '';
          const ctvPhone = o.customer?.sourceCtv?.phone?.toLowerCase() || '';
          const cusName = o.customer?.fullName?.toLowerCase() || '';
          const cusPhone = o.customer?.phone?.toLowerCase() || '';
          const orderIdStr = o.id.toLowerCase();
          
          if (!ctvName.includes(q) && !ctvPhone.includes(q) && !cusName.includes(q) && !cusPhone.includes(q) && !orderIdStr.includes(q)) {
              return false;
          }
      }
      return true;
  });

  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalItemsSold = filteredOrders.reduce((acc, o) => acc + (o.items?.reduce((sum, item) => sum + (item.qty || 1), 0) || 0), 0);

  return (
    <div className="flex-col gap-6 fade-in">
       <div className="card glass-panel flex-col gap-4">
          <div className="flex-col gap-4 mb-2">
             <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary flex items-center gap-2"><ShoppingCart className="text-blue-500"/> Quản lý Đơn Hàng</h2>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 mt-2">
                 <div className="card bg-blue-50 text-blue-800 p-4 rounded-xl flex-col items-center justify-center text-center shadow-sm border border-blue-100">
                     <div className="text-sm font-bold opacity-80 uppercase tracking-wider mb-1">Số Đơn Hàng</div>
                     <div className="text-3xl font-black">{totalOrders}</div>
                 </div>
                 <div className="card bg-green-50 text-green-800 p-4 rounded-xl flex-col items-center justify-center text-center shadow-sm border border-green-100">
                     <div className="text-sm font-bold opacity-80 uppercase tracking-wider mb-1">Tổng Doanh Thu</div>
                     <div className="text-2xl font-black">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue)}</div>
                 </div>
                 <div className="card bg-purple-50 text-purple-800 p-4 rounded-xl flex-col items-center justify-center text-center shadow-sm border border-purple-100">
                     <div className="text-sm font-bold opacity-80 uppercase tracking-wider mb-1">Mặt Hàng Bán Ra</div>
                     <div className="text-3xl font-black">{totalItemsSold}</div>
                 </div>
             </div>
             <div className="flex gap-4 items-center flex-wrap bg-secondary p-3 rounded-lg" style={{ border: '1px solid var(--border-subtle)' }}>
                 <select className="input-field" value={orderType} onChange={e => setOrderType(e.target.value)} style={{ padding: '6px', maxWidth: '180px' }}>
                    <option value="all">Tất cả loại đơn</option>
                    <option value="self">Đại lý tự nhập hàng</option>
                    <option value="customer">Khách hàng mua</option>
                 </select>
                 
                 <select className="input-field" value={timeFilter} onChange={e => setTimeFilter(e.target.value)} style={{ padding: '6px', maxWidth: '150px' }}>
                    <option value="all">Toàn thời gian</option>
                    <option value="month">Theo tháng</option>
                    <option value="date">Theo ngày</option>
                 </select>
                 {timeFilter === 'month' && <input type="month" className="input-field" value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '6px' }} />}
                 {timeFilter === 'date' && <input type="date" className="input-field" value={exactDate} onChange={e => setExactDate(e.target.value)} style={{ padding: '6px' }} />}
                 
                 <input type="text" className="input-field flex-1" placeholder="🔎 Tìm Tên, SĐT CTV, Khách Hàng, Mã Đơn..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '6px', minWidth: '250px' }} />
             </div>
          </div>
          
          <div className="table-container fade-in bg-secondary rounded-xl p-1" style={{ border: '1px solid var(--border-subtle)' }}>
             <table className="data-table" style={{ width: '100%', minWidth: '700px' }}>
               <thead>
                 <tr>
                   <th style={{ padding: '12px', textAlign: 'left' }}>Mã Đơn / Ngày Tạo</th>
                   <th style={{ padding: '12px', textAlign: 'left' }}>Khách Hàng</th>
                   <th style={{ padding: '12px', textAlign: 'left' }}>Sản Phẩm / Doanh Thu</th>
                   <th style={{ padding: '12px', textAlign: 'center' }}>CP</th>
                   <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredOrders.length === 0 ? (
                    <tr><td colSpan="5" className="text-center p-8 text-muted font-medium">Chưa có đơn hàng nào phù hợp với bộ lọc</td></tr>
                 ) : filteredOrders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                       <td style={{ padding: '12px' }}>
                          <div className="font-bold text-primary" style={{ fontFamily: 'monospace' }}>{order.id.slice(0, 8).toUpperCase()}</div>
                          <div className="text-xs text-muted mt-1">{new Date(order.createdAt).toLocaleString('vi-VN')}</div>
                       </td>
                       <td style={{ padding: '12px' }}>
                          <div className="font-bold" style={{ color: 'var(--accent-diamond)' }}>{order.customer?.fullName}</div>
                          <div className="text-xs text-muted mt-1">SĐT: {order.customer?.phone}</div>
                       </td>
                       <td style={{ padding: '12px' }}>
                          <div className="flex-col gap-2">
                             {order.items?.length > 2 ? (
                                 <details className="text-sm cursor-pointer outline-none">
                                    <summary className="text-blue-600 font-bold mb-2 hover:underline">Xem {order.items.length} mặt hàng...</summary>
                                    <div className="pl-2 border-l-2 border-blue-200 ml-1 mt-2">
                                        {order.items.map((item, idx) => {
                                           const svc = item.service;
                                           return (
                                           <div key={idx} className="text-sm border-b border-subtle pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                                              - <span className="font-medium text-secondary">{svc?.name || 'Dịch vụ'}</span>
                                              <span className="font-bold text-muted ml-2 px-1 rounded bg-gray-100 dark:bg-gray-800" style={{ fontSize: '0.8rem' }}>x{item.qty || 1}</span> <br/>
                                              <span className="text-green-500 font-bold ml-2">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount)}</span>
                                           </div>
                                           );
                                        })}
                                    </div>
                                 </details>
                              ) : (
                                  order.items?.map((item, idx) => {
                                     const svc = item.service;
                                     return (
                                     <div key={idx} className="text-sm border-b border-subtle pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                                        - <span className="font-medium text-secondary">{svc?.name || 'Dịch vụ'}</span>
                                        <span className="font-bold text-muted ml-2 px-1 rounded bg-gray-100 dark:bg-gray-800" style={{ fontSize: '0.8rem' }}>x{item.qty || 1}</span> <br/>
                                        <span className="text-green-500 font-bold ml-2">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount)}</span>
                                     </div>
                                     );
                                  })
                              )}
                             <div className="font-bold text-primary mt-2 pt-1 border-t border-subtle border-dashed">
                               Tổng: <span className="text-blue-500">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</span>
                             </div>
                          </div>
                       </td>
                       <td style={{ padding: '12px', textAlign: 'center' }}>
                           {/* CP = qualifying points earned from commissions on this order */}
                           {(() => {
                             const cp = order.commissions
                               ? order.commissions.reduce((s, c) => s + (c.earnedPoints || 0), 0)
                               : (order.totalCommissionPoints || order.qualifyingPoints || null);
                             return cp != null && cp > 0
                               ? <span className="font-bold text-diamond">+{cp.toLocaleString('vi-VN')} CP</span>
                               : <span className="text-muted text-xs">-</span>;
                           })()}
                        </td>
                       <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button 
                             className="btn-icon hover-scale" 
                             style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', padding: '8px', margin: '0 auto' }}
                             onClick={() => handleDelete(order.id)}
                             title="Xóa Đơn Hàng & Thu hồi Hoa Hồng"
                          >
                             <Trash2 size={18} />
                          </button>
                       </td>
                    </tr>
                 ))}
               </tbody>
             </table>
          </div>
       </div>
    </div>
  )
}
