import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Search, AlertCircle, Loader2, Clock, User, Package, ChevronDown, ChevronUp, Filter, X
} from 'lucide-react';

// Real Prisma-compatible Order shape from GET /api/orders
interface OrderItem {
  id: string;
  serviceId?: string | null;
  productId?: string | null;
  amount: number;
  qty: number;
  unitCommissionPts: number;
  lineCommissionPts: number;
  service?: { name: string } | null;
  product?: { title: string; commissionPoints: number } | null;
}

interface RealOrder {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  purchaseType: string;
  isSelfBuy: boolean;
  ordererUserId?: string | null;
  orderer?: { userId: string; fullName: string; phone: string; role: string } | null;
  customer: {
    fullName: string;
    phone: string;
    sourceCtvId: string;
    sourceCtv?: { userId: string; fullName: string; phone: string; tier: string; rank?: string; businessId?: string } | null;
  };
  items: OrderItem[];
  commissions: { type: string; receiverId: string; earnedMoney?: number | null; earnedPoints?: number | null; ruleKey?: string | null; status: string }[];
  period?: { id: string; periodName: string; status: string } | null;
}

const STATUS_OPTS: { value: string; label: string; bg: string; text: string }[] = [
  { value: 'all',       label: 'Tất Cả',       bg: 'bg-slate-100',   text: 'text-slate-700' },
  { value: 'COMPLETED', label: 'Hoàn Thành',   bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { value: 'DEPOSIT',   label: 'Đặt Cọc',      bg: 'bg-amber-100',   text: 'text-amber-700' },
  { value: 'CANCELLED', label: 'Đã Hủy',       bg: 'bg-rose-100',    text: 'text-rose-700' },
];

function getStatusStyle(status: string) {
  return STATUS_OPTS.find(s => s.value === status) ?? { bg: 'bg-slate-100', text: 'text-slate-700', label: status };
}

function getItemName(item: OrderItem): string {
  return item.product?.title || item.service?.name || 'Không xác định';
}

function totalCP(items: OrderItem[]): number {
  return items.reduce((s, i) => s + (i.lineCommissionPts || 0), 0);
}

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<RealOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ctvFilter, setCtvFilter] = useState('');
  const [purchaseFilter, setPurchaseFilter] = useState('all');

  // Expanded row
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (ctvFilter.trim()) q.set('ctvUserId', ctvFilter.trim());
      const res = await fetch('/api/orders?' + q.toString());
      if (!res.ok) throw new Error('Lỗi tải đơn hàng');
      const body = await res.json();
      setOrders(Array.isArray(body) ? body : (body?.data ?? []));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (purchaseFilter === 'SELF' && order.purchaseType !== 'SELF_PURCHASE') return false;
    if (purchaseFilter === 'CUSTOMER' && order.purchaseType !== 'CUSTOMER_PURCHASE') return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.customer?.fullName?.toLowerCase().includes(q) ||
      order.customer?.phone?.includes(q) ||
      order.customer?.sourceCtv?.fullName?.toLowerCase().includes(q) ||
      order.orderer?.fullName?.toLowerCase().includes(q) ||
      order.orderer?.phone?.includes(q) ||
      order.id.toLowerCase().includes(q) ||
      order.items.some(i => getItemName(i).toLowerCase().includes(q))
    );
  });

  const totalRevenue = filteredOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-ocean-600" />
            Quản Lý Đơn Hàng ({filteredOrders.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Đơn hàng từ CTV Portal — doanh thu:{' '}
            <span className="font-bold text-emerald-600">
              {new Intl.NumberFormat('vi-VN').format(totalRevenue)}đ
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
            {orders.filter(o => o.status === 'COMPLETED').length} Hoàn thành
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-bold border border-amber-200">
            {orders.filter(o => o.status === 'DEPOSIT').length} Đặt cọc
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Status tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTS.map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === s.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === s.value ? 'bg-ocean-500 text-white' : 'bg-white text-slate-600'
              }`}>
                {s.value === 'all' ? orders.length : orders.filter(o => o.status === s.value).length}
              </span>
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <select
              value={purchaseFilter}
              onChange={e => setPurchaseFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-ocean-500"
            >
              <option value="all">Tất cả loại đơn</option>
              <option value="SELF">Tự mua (SELF)</option>
              <option value="CUSTOMER">Khách mua (CUSTOMER)</option>
            </select>
          </div>
        </div>

        {/* Search + CTV filter */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm khách hàng, CTV, mã đơn, sản phẩm..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ocean-500"
            />
          </div>
          <div className="relative flex-1 min-w-[180px]">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={ctvFilter}
              onChange={e => setCtvFilter(e.target.value)}
              placeholder="Lọc theo CTV ID (e.g. S249)"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ocean-500"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="px-4 py-2.5 bg-ocean-500 hover:bg-ocean-600 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Tải lại
          </button>
          {(searchQuery || ctvFilter || statusFilter !== 'all' || purchaseFilter !== 'all') && (
            <button
              onClick={() => { setSearchQuery(''); setCtvFilter(''); setStatusFilter('all'); setPurchaseFilter('all'); }}
              className="px-3 py-2.5 text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 font-semibold"
            >
              <X className="w-3.5 h-3.5" /> Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center gap-3">
          <Loader2 className="w-9 h-9 text-ocean-600 animate-spin" />
          <p className="text-slate-500 font-medium text-sm">Đang tải danh sách đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center space-y-2">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-slate-700 font-bold text-sm">{error}</p>
          <button onClick={fetchOrders} className="text-xs text-ocean-600 font-bold hover:underline">Thử lại</button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Không Có Đơn Hàng</h3>
          <p className="text-xs text-slate-500">Chưa có đơn hàng nào phù hợp với bộ lọc.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-4">Mã Đơn / Ngày</th>
                  <th className="py-4 px-4">CTV Tạo Đơn</th>
                  <th className="py-4 px-4">Khách Hàng</th>
                  <th className="py-4 px-4">Sản Phẩm / CP</th>
                  <th className="py-4 px-4">Tổng Tiền</th>
                  <th className="py-4 px-4">Kỳ HH</th>
                  <th className="py-4 px-4 text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredOrders.map(order => {
                  const st = getStatusStyle(order.status);
                  const isExpanded = expandedId === order.id;
                  const ctv = order.orderer ?? order.customer?.sourceCtv;
                  const cp = totalCP(order.items);

                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      >
                        {/* Order ID + Date */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                          <div className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full w-fit ${
                            order.purchaseType === 'SELF_PURCHASE'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-sky-50 text-sky-700'
                          }`}>
                            {order.purchaseType === 'SELF_PURCHASE' ? 'Tự mua' : 'Khách mua'}
                          </div>
                        </td>

                        {/* CTV Orderer */}
                        <td className="py-3 px-4">
                          {ctv ? (
                            <>
                              <div className="font-bold text-slate-800 flex items-center gap-1">
                                <User className="w-3.5 h-3.5 text-ocean-500" />
                                {ctv.fullName}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {'userId' in ctv ? ctv.userId : ''} · {'phone' in ctv ? ctv.phone : ''}
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{order.customer?.fullName || '—'}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{order.customer?.phone}</div>
                        </td>

                        {/* Items preview + CP */}
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-1.5">
                            <Package className="w-4 h-4 text-ocean-500 mt-0.5 shrink-0" />
                            <div>
                              <div className="font-semibold text-slate-700 line-clamp-1 text-xs">
                                {order.items.length > 0 ? getItemName(order.items[0]) : '—'}
                                {order.items.length > 1 && <span className="text-slate-400"> +{order.items.length - 1}</span>}
                              </div>
                              {cp > 0 ? (
                                <div className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded mt-0.5 w-fit">
                                  CP: {cp}
                                </div>
                              ) : (
                                <div className="text-[11px] text-amber-500 mt-0.5">⚠ CP=0</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Total */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">
                            {new Intl.NumberFormat('vi-VN').format(order.totalAmount)}đ
                          </div>
                        </td>

                        {/* Period */}
                        <td className="py-3 px-4">
                          {order.period ? (
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                              order.period.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {order.period.periodName}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className={`px-3 py-1 text-xs font-bold rounded-xl ${st.bg} ${st.text}`}>
                              {st.label}
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={7} className="py-4 px-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {/* Items detail */}
                              <div>
                                <div className="text-xs font-bold text-slate-600 uppercase mb-2">Sản Phẩm / Dịch Vụ</div>
                                <div className="space-y-1.5">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-slate-100">
                                      <div>
                                        <div className="text-sm font-semibold text-slate-800">{getItemName(item)}</div>
                                        <div className="text-[11px] text-slate-400">x{item.qty} · CP/unit: {item.unitCommissionPts}</div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-slate-700 text-sm">
                                          {new Intl.NumberFormat('vi-VN').format(item.amount)}đ
                                        </div>
                                        <div className="text-[11px] font-bold text-cyan-600">CP: {item.lineCommissionPts}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Commissions */}
                              <div>
                                <div className="text-xs font-bold text-slate-600 uppercase mb-2">
                                  Hoa Hồng ({order.commissions.length} dòng)
                                </div>
                                {order.commissions.length === 0 ? (
                                  <p className="text-xs text-slate-400">Chưa có hoa hồng.</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {order.commissions.map((c, idx) => (
                                      <div key={idx} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-slate-100">
                                        <div>
                                          <div className="text-xs font-bold text-slate-700">{c.ruleKey || c.type}</div>
                                          <div className="text-[11px] text-slate-400">{c.receiverId}</div>
                                        </div>
                                        <div className="text-right">
                                          {c.earnedMoney != null ? (
                                            <div className="font-bold text-emerald-600 text-sm">
                                              {new Intl.NumberFormat('vi-VN').format(c.earnedMoney)}đ
                                            </div>
                                          ) : (
                                            <div className="text-xs text-amber-500 font-bold">⚠ Chưa tính</div>
                                          )}
                                          <div className="text-[11px] text-slate-400">{c.status}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
