import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Clock, Package, Loader2, ChevronDown, ChevronUp, AlertCircle, Trash2, X } from 'lucide-react';

interface WebsiteOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  address?: string;
  message?: string;
  productTitle?: string;
  productPrice: number;
  qty: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  NEW:       { label: 'Mới',          bg: 'bg-blue-50',    text: 'text-blue-700' },
  CONFIRMED: { label: 'Đã Xác Nhận', bg: 'bg-amber-50',   text: 'text-amber-700' },
  SHIPPING:  { label: 'Đang Giao',    bg: 'bg-purple-50',  text: 'text-purple-700' },
  COMPLETED: { label: 'Hoàn Thành',   bg: 'bg-sky-50',     text: 'text-sky-700' },
  CANCELLED: { label: 'Đã Hủy',       bg: 'bg-rose-50',    text: 'text-rose-700' },
};

export default function MyOrdersView({ user, onBack }: { user: any; onBack: () => void }) {
  const [orders, setOrders] = useState<WebsiteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const phone = (user?.phone || user?.username || '').trim();

  const fetchOrders = useCallback(() => {
    setLoading(true);
    fetch('/api/website-orders/lookup?phone=' + encodeURIComponent(phone), { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setOrders(data.orders || data.data?.websiteOrders || []);
        } else {
          setError(data.message || 'Không thể tải đơn hàng');
        }
      })
      .catch(() => setError('Lỗi kết nối máy chủ'))
      .finally(() => setLoading(false));
  }, [phone]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleDelete = async (orderId: string) => {
    setDeletingId(orderId);
    try {
      const res = await fetch(`/api/website-orders/${orderId}?phone=${encodeURIComponent(phone)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        setConfirmDeleteId(null);
        setExpandedId(null);
      } else {
        alert(data.message || 'Không thể xóa đơn hàng');
      }
    } catch {
      alert('Lỗi kết nối');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Confirm Delete Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Xóa đơn hàng?</h3>
                <p className="text-xs text-slate-500 mt-0.5">Hành động này không thể hoàn tác.</p>
              </div>
              <button onClick={() => setConfirmDeleteId(null)} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {deletingId === confirmDeleteId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Xác nhận xóa
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            Đơn Hàng Của Tôi
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Xin chào <strong>{user?.fullName}</strong> — đây là tất cả đơn hàng của bạn trên WasyPro.
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          ← Quay lại
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Đang tải đơn hàng...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-50 border border-slate-200 text-center">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-500">Bạn chưa có đơn hàng nào.</p>
          <p className="text-xs text-slate-400 mt-1">Hãy khám phá sản phẩm và đặt hàng ngay!</p>
          <button
            onClick={onBack}
            className="mt-4 px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors"
          >
            Xem Sản Phẩm
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const st = STATUS_MAP[order.status] || { label: order.status, bg: 'bg-slate-50', text: 'text-slate-600' };
            const isExpanded = expandedId === order.id;
            const canDelete = ['NEW', 'CANCELLED'].includes(order.status);
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/60 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-slate-100">
                      <Package className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate">
                        {order.productTitle || 'Sản phẩm'}
                        {order.qty > 1 && <span className="text-slate-400"> x{order.qty}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="text-[10px] font-mono text-slate-300">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-slate-900">
                        {new Intl.NumberFormat('vi-VN').format(order.totalAmount)}đ
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                    {canDelete && (
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmDeleteId(order.id); }}
                        className="p-2 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                        title="Xóa đơn hàng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Người Nhận</span>
                        <p className="font-bold text-slate-800 mt-0.5">{order.customerName}</p>
                        <p className="text-slate-500">{order.customerPhone}</p>
                      </div>
                      {order.address && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Địa Chỉ</span>
                          <p className="text-slate-700 mt-0.5">{order.address}</p>
                        </div>
                      )}
                      {order.message && (
                        <div className="col-span-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Ghi Chú</span>
                          <p className="text-slate-600 mt-0.5">{order.message}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Sản Phẩm</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{order.productTitle || '—'}</p>
                        <p className="text-slate-500">Đơn giá: {new Intl.NumberFormat('vi-VN').format(order.productPrice)}đ × {order.qty}</p>
                      </div>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => setConfirmDeleteId(order.id)}
                        className="mt-4 w-full py-2 rounded-xl border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa đơn hàng này
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
