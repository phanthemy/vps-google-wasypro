import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Search,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Clock,
  User,
  Package,
  MessageSquareText,
  DollarSign
} from 'lucide-react';
import { api } from '../../services/api';
import { Order } from '../../types/schema';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTabStatus, setActiveTabStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Không thể tải danh sách đơn hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: string, newStatus: Order['status']) => {
    setUpdatingId(id);
    try {
      const updated = await api.updateOrderStatus(id, newStatus);
      setOrders(orders.map((o) => (o.id === updated.id ? { ...updated } : o)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      order.customerName.toLowerCase().includes(q) ||
      order.phone.includes(q) ||
      (order.email && order.email.toLowerCase().includes(q)) ||
      order.productName.toLowerCase().includes(q);

    const matchesStatus = activeTabStatus === 'all' ? true : order.status === activeTabStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'new': return { label: 'Mới', bg: 'bg-ocean-100', text: 'text-ocean-700' };
      case 'confirmed': return { label: 'Đã xác nhận', bg: 'bg-amber-100', text: 'text-amber-700' };
      case 'shipping': return { label: 'Đang giao', bg: 'bg-purple-100', text: 'text-purple-700' };
      case 'completed': return { label: 'Hoàn thành', bg: 'bg-emerald-100', text: 'text-emerald-700' };
      case 'cancelled': return { label: 'Đã hủy', bg: 'bg-rose-100', text: 'text-rose-700' };
      default: return { label: status, bg: 'bg-slate-100', text: 'text-slate-700' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-ocean-600" />
            Quản Lý Đơn Hàng ({filteredOrders.length})
          </h2>
          <p className="text-xs text-slate-500">Danh sách đơn đặt hàng từ khách hàng</p>
        </div>

        {/* Quick status count badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-ocean-50 text-ocean-700 font-bold border border-ocean-200">
            {orders.filter((o) => o.status === 'new').length} Đơn mới
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-bold border border-amber-200">
            {orders.filter((o) => o.status === 'confirmed').length} Đã xác nhận
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
            {orders.filter((o) => o.status === 'completed').length} Hoàn thành
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Tất Cả Đơn', count: orders.length },
            { id: 'new', label: 'Mới', count: orders.filter((o) => o.status === 'new').length },
            { id: 'confirmed', label: 'Đã xác nhận', count: orders.filter((o) => o.status === 'confirmed').length },
            { id: 'shipping', label: 'Đang giao', count: orders.filter((o) => o.status === 'shipping').length },
            { id: 'completed', label: 'Hoàn thành', count: orders.filter((o) => o.status === 'completed').length },
            { id: 'cancelled', label: 'Đã Hủy', count: orders.filter((o) => o.status === 'cancelled').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTabStatus(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTabStatus === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeTabStatus === tab.id ? 'bg-ocean-500 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên khách hàng, số điện thoại, sản phẩm..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-ocean-500 transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center min-h-[350px] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-9 h-9 text-ocean-600 animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Đang tải danh sách đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-slate-700 font-bold text-sm">{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        /* Empty State */
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center py-16 space-y-3">
          <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Không Có Đơn Hàng Phù Hợp</h3>
          <p className="text-xs text-slate-500">Chưa có đơn hàng nào ở bộ lọc này.</p>
        </div>
      ) : (
        /* Data Table */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-5">Khách Hàng</th>
                  <th className="py-4 px-5">SĐT / Email</th>
                  <th className="py-4 px-5">Sản Phẩm</th>
                  <th className="py-4 px-5">Tổng Tiền</th>
                  <th className="py-4 px-5">Ngày Đặt</th>
                  <th className="py-4 px-5 text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Customer Name */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-ocean-600" />
                          {order.customerName}
                        </div>
                        {order.address && (
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 max-w-[200px] truncate" title={order.address}>
                            <MapPin className="w-3.5 h-3.5" />
                            {order.address}
                          </div>
                        )}
                      </td>

                      {/* Phone & Email */}
                      <td className="py-4 px-5">
                        <div className="text-slate-800 font-medium flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {order.phone}
                        </div>
                        {order.email && (
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {order.email}
                          </div>
                        )}
                      </td>

                      {/* Product Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-1.5">
                          <Package className="w-4 h-4 text-ocean-600 mt-0.5 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-800 line-clamp-1">{order.productName}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              SL: {order.quantity} x {new Intl.NumberFormat('vi-VN').format(order.unitPrice)}đ
                            </div>
                            {order.note && (
                              <div className="text-xs text-amber-600 flex items-center gap-1 mt-1 bg-amber-50 px-2 py-0.5 rounded-md w-fit">
                                <MessageSquareText className="w-3 h-3" />
                                {order.note}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Total Price */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-rose-600 flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {new Intl.NumberFormat('vi-VN').format(order.totalPrice)}đ
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-[11px] text-slate-400 ml-5 mt-0.5">
                          {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                        </div>
                      </td>

                      {/* Status & Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border-0 outline-none cursor-pointer appearance-none text-center ${statusInfo.bg} ${statusInfo.text} pr-8 focus:ring-2 focus:ring-ocean-500`}
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                            disabled={updatingId === order.id}
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.2rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                          >
                            <option value="new">Mới</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="shipping">Đang giao</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="cancelled">Đã hủy</option>
                          </select>
                          {updatingId === order.id && <Loader2 className="w-4 h-4 text-ocean-600 animate-spin" />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
