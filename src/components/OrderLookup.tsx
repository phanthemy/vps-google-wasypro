import React, { useState } from 'react';
import { Search, Package, Calendar, DollarSign, Loader2 } from 'lucide-react';

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'NEW': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Chờ xác nhận</span>;
    case 'CONFIRMED': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Đã xác nhận</span>;
    case 'SHIPPING': return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">Đang giao hàng</span>;
    case 'COMPLETED': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Hoàn thành</span>;
    case 'CANCELLED': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Đã hủy</span>;
    default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{status}</span>;
  }
};

export const OrderLookup: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 9) {
      setError('Vui lòng nhập số điện thoại hợp lệ.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/my?phone=${phone}`);
      if (!res.ok) throw new Error('Không thể tra cứu lúc này.');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : (data.orders || []));
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối.');
      setOrders([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Tra Cứu Đơn Hàng</h1>
        <p className="text-gray-600">Nhập số điện thoại của bạn để xem tình trạng đơn hàng</p>
      </div>

      <form onSubmit={handleSearch} className="max-w-md mx-auto mb-12">
        <div className="relative">
          <input 
            type="tel" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Nhập số điện thoại..." 
            className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 outline-none text-lg transition-colors"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="absolute right-2 top-2 p-2 bg-primary text-white rounded-lg hover:bg-opacity-90 disabled:bg-gray-400 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>

      {searched && !loading && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Không tìm thấy đơn hàng</h3>
              <p className="mt-1 text-gray-500">Chúng tôi không tìm thấy đơn hàng nào khớp với số điện thoại này.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              <h3 className="text-xl font-semibold mb-2">Đơn hàng của bạn ({orders.length})</h3>
              {orders.map((order, idx) => (
                <div key={order.id || idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 pb-4 border-b">
                    <div>
                      <span className="text-gray-500 text-sm">Mã đơn: </span>
                      <span className="font-mono font-medium">{order.code || order.id || 'N/A'}</span>
                    </div>
                    <div>{getStatusBadge(order.status || 'NEW')}</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Package className="text-gray-400 mt-1" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Sản phẩm</p>
                        <p className="font-medium">{order.productTitle || 'Sản phẩm'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="text-gray-400 mt-1" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Ngày đặt</p>
                        <p className="font-medium">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t">
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Tổng tiền</p>
                      <p className="text-xl font-bold text-primary">{formatVND(order.totalAmount || order.amount || 0)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
