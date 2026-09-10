import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Search, AlertCircle, Loader2, Clock, User, Package, ChevronDown, ChevronUp, Filter, X, Globe, Users as UsersIcon, RefreshCw, CheckCircle, Truck, XCircle
} from 'lucide-react';

// ============ TYPES ============
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

interface WebsiteOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  address?: string;
  message?: string;
  type: string;
  productId?: string;
  productTitle?: string;
  productPrice: number;
  qty: number;
  totalAmount: number;
  status: string;
  userId?: string | null;
  sponsorUserId?: string | null;
  commissionPoints: number;
  qualifyingPointsAwarded: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============ STATUS CONFIG ============
const CTV_STATUS_OPTS = [
  { value: 'all',       label: 'Tất Cả',       bg: 'bg-slate-100',   text: 'text-slate-700' },
  { value: 'COMPLETED', label: 'Hoàn Thành',   bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { value: 'DEPOSIT',   label: 'Đặt Cọc',      bg: 'bg-amber-100',   text: 'text-amber-700' },
  { value: 'CANCELLED', label: 'Đã Hủy',       bg: 'bg-rose-100',    text: 'text-rose-700' },
];

const WEB_STATUS_OPTS = [
  { value: 'all',       label: 'Tất Cả',       bg: 'bg-slate-100',   text: 'text-slate-700' },
  { value: 'NEW',       label: 'Mới',           bg: 'bg-blue-100',    text: 'text-blue-700' },
  { value: 'CONFIRMED', label: 'Đã Xác Nhận',  bg: 'bg-amber-100',   text: 'text-amber-700' },
  { value: 'SHIPPING',  label: 'Đang Giao',     bg: 'bg-purple-100',  text: 'text-purple-700' },
  { value: 'COMPLETED', label: 'Hoàn Thành',   bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { value: 'CANCELLED', label: 'Đã Hủy',       bg: 'bg-rose-100',    text: 'text-rose-700' },
];

function getStatusStyle(status: string, isWeb = false) {
  const opts = isWeb ? WEB_STATUS_OPTS : CTV_STATUS_OPTS;
  return opts.find(s => s.value === status) ?? { bg: 'bg-slate-100', text: 'text-slate-700', label: status };
}

function getItemName(item: OrderItem): string {
  return item.product?.title || item.service?.name || 'Không xác định';
}

function totalCP(items: OrderItem[]): number {
  return items.reduce((s, i) => s + (i.lineCommissionPts || 0), 0);
}

// ============ MAIN COMPONENT ============
export const AdminOrders: React.FC = () => {
  // Tab: 'website' or 'ctv'
  const [activeTab, setActiveTab] = useState<'website' | 'ctv'>('website');

  // CTV Orders state
  const [ctvOrders, setCtvOrders] = useState<RealOrder[]>([]);
  const [ctvLoading, setCtvLoading] = useState(true);
  const [ctvError, setCtvError] = useState<string | null>(null);

  // Website Orders state  
  const [webOrders, setWebOrders] = useState<WebsiteOrder[]>([]);
  const [webLoading, setWebLoading] = useState(true);
  const [webError, setWebError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ctvFilter, setCtvFilter] = useState('');
  const [purchaseFilter, setPurchaseFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch CTV orders
  const fetchCtvOrders = async () => {
    setCtvLoading(true);
    setCtvError(null);
    try {
      const q = new URLSearchParams();
      if (ctvFilter.trim()) q.set('ctvUserId', ctvFilter.trim());
      const res = await fetch('/api/orders?' + q.toString());
      if (!res.ok) throw new Error('Lỗi tải đơn hàng CTV');
      const body = await res.json();
      setCtvOrders(Array.isArray(body) ? body : (body?.data ?? []));
    } catch (err: unknown) {
      setCtvError(err instanceof Error ? err.message : 'Không thể tải');
    } finally {
      setCtvLoading(false);
    }
  };

  // Fetch Website orders
  const fetchWebOrders = async () => {
    setWebLoading(true);
    setWebError(null);
    try {
      const res = await fetch('/api/admin/website-orders', { credentials: 'include' });
      if (!res.ok) throw new Error('Lỗi tải đơn hàng website');
      const body = await res.json();
      setWebOrders(body?.data ?? []);
    } catch (err: unknown) {
      setWebError(err instanceof Error ? err.message : 'Không thể tải');
    } finally {
      setWebLoading(false);
    }
  };

  // Update website order status
  const updateWebOrderStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/website-orders/${id}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/) || [])[1] || '',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setWebOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchCtvOrders();
    fetchWebOrders();
  }, []);

  // Reset filters when switching tabs
  useEffect(() => {
    setStatusFilter('all');
    setSearchQuery('');
    setExpandedId(null);
  }, [activeTab]);

  // ============ FILTERED DATA ============
  const filteredCtvOrders = ctvOrders.filter(order => {
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
      order.id.toLowerCase().includes(q) ||
      order.items.some(i => getItemName(i).toLowerCase().includes(q))
    );
  });

  const filteredWebOrders = webOrders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      order.customerName?.toLowerCase().includes(q) ||
      order.customerPhone?.includes(q) ||
      order.productTitle?.toLowerCase().includes(q) ||
      order.id.toLowerCase().includes(q) ||
      (order.userId || '').toLowerCase().includes(q)
    );
  });

  const webRevenue = filteredWebOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const ctvRevenue = filteredCtvOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Tab Selector */}
      <div className="flex gap-3">
        <button
          onClick={() => setActiveTab('website')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all border ${
            activeTab === 'website'
              ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Globe className="w-4 h-4" />
          Đơn Website ({webOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('ctv')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all border ${
            activeTab === 'ctv'
              ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <UsersIcon className="w-4 h-4" />
          Đơn CTV ({ctvOrders.length})
        </button>
      </div>

      {/* ============ WEBSITE ORDERS TAB ============ */}
      {activeTab === 'website' && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-6 h-6 text-blue-600" />
                Đơn Hàng Website ({filteredWebOrders.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Đơn đặt qua wasypro.com — doanh thu:{' '}
                <span className="font-bold text-emerald-600">
                  {new Intl.NumberFormat('vi-VN').format(webRevenue)}đ
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold border border-blue-200">
                {webOrders.filter(o => o.status === 'NEW').length} Mới
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {webOrders.filter(o => o.status === 'COMPLETED').length} Hoàn thành
              </span>
              <button onClick={fetchWebOrders} className="p-2 hover:bg-slate-100 rounded-xl transition-colors" title="Tải lại">
                <RefreshCw className="w-4 h-4 text-slate-500" />
              </button>
              <button
                onClick={async () => {
                  const code = window.prompt('⚠️ XÓA TOÀN BỘ dữ liệu test:\n- Đơn hàng\n- Hoa hồng\n- Điểm\n- CTV/Đại sứ\n- Khách hàng\n\nNhập RESET_ALL để xác nhận:');
                  if (code !== 'RESET_ALL') return;
                  if (!window.confirm('LẦN CUỐI: Bạn chắc chắn muốn xóa TOÀN BỘ dữ liệu?')) return;
                  try {
                    const token = localStorage.getItem('token') || localStorage.getItem('crm_token');
                    const res = await fetch('/api/admin/reset-uat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'X-CSRF-Token': (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/) || [])[1] || '' },
                      body: JSON.stringify({ confirm: 'RESET_ALL' }),
                    }).then(r => r.json());
                    if (res.success) {
                      window.alert('✅ Đã reset!\n\n' + Object.entries(res.summary).map(([k,v]) => k + ': ' + v).join('\n'));
                      fetchWebOrders();
                      fetchCtvOrders();
                    } else {
                      window.alert('Lỗi: ' + res.message);
                    }
                  } catch(e) { window.alert('Lỗi kết nối'); }
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                title="Xóa toàn bộ dữ liệu test"
              >
                🗑️ Reset
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {WEB_STATUS_OPTS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === s.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                    statusFilter === s.value ? 'bg-blue-400 text-white' : 'bg-white text-slate-600'
                  }`}>
                    {s.value === 'all' ? webOrders.length : webOrders.filter(o => o.status === s.value).length}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên, SĐT, sản phẩm, mã đơn..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          {webLoading ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center gap-3">
              <Loader2 className="w-9 h-9 text-blue-600 animate-spin" />
              <p className="text-slate-500 font-medium text-sm">Đang tải...</p>
            </div>
          ) : webError ? (
            <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center space-y-2">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <p className="text-slate-700 font-bold text-sm">{webError}</p>
              <button onClick={fetchWebOrders} className="text-xs text-blue-600 font-bold hover:underline">Thử lại</button>
            </div>
          ) : filteredWebOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <Globe className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">Chưa có đơn hàng website</h3>
              <p className="text-xs text-slate-500">Đơn hàng từ wasypro.com sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                      <th className="py-4 px-4">Mã Đơn / Ngày</th>
                      <th className="py-4 px-4">Khách Hàng</th>
                      <th className="py-4 px-4">Sản Phẩm</th>
                      <th className="py-4 px-4">SL</th>
                      <th className="py-4 px-4">Tổng Tiền</th>
                      <th className="py-4 px-4">CP</th>
                      <th className="py-4 px-4">Thành Viên</th>
                      <th className="py-4 px-4 text-right">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredWebOrders.map(order => {
                      const st = getStatusStyle(order.status, true);
                      return (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {new Date(order.createdAt).toLocaleString('vi-VN')}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{order.customerName}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{order.customerPhone}</div>
                            {order.address && <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">📍 {order.address}</div>}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-700 text-xs line-clamp-2">{order.productTitle || '—'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-700">{order.qty}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">
                              {new Intl.NumberFormat('vi-VN').format(order.totalAmount)}đ
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {order.commissionPoints > 0 ? (
                              <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded">
                                {order.commissionPoints}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {order.userId ? (
                              <div>
                                <div className="text-[10px] font-bold text-purple-500 uppercase">Tài khoản</div>
                                <div className="text-xs font-bold text-slate-800">{order.userId}</div>
                                {order.sponsorUserId && (
                                  <div className="text-[10px] text-emerald-600 mt-0.5">
                                    Sponsor: {order.sponsorUserId}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div className="text-[10px] font-bold text-amber-500 uppercase">Khách vãng lai</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">Không có tài khoản</div>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <select
                              value={order.status}
                              onChange={(e) => updateWebOrderStatus(order.id, e.target.value)}
                              className={`px-3 py-1 text-xs font-bold rounded-xl border-0 cursor-pointer ${st.bg} ${st.text} focus:outline-none focus:ring-2 focus:ring-blue-400`}
                            >
                              {WEB_STATUS_OPTS.filter(s => s.value !== 'all').map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ============ CTV ORDERS TAB ============ */}
      {activeTab === 'ctv' && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
                Đơn Hàng CTV ({filteredCtvOrders.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Đơn hàng từ CTV Portal — doanh thu:{' '}
                <span className="font-bold text-emerald-600">
                  {new Intl.NumberFormat('vi-VN').format(ctvRevenue)}đ
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {ctvOrders.filter(o => o.status === 'COMPLETED').length} Hoàn thành
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 font-bold border border-amber-200">
                {ctvOrders.filter(o => o.status === 'DEPOSIT').length} Đặt cọc
              </span>
              <button onClick={fetchCtvOrders} className="p-2 hover:bg-slate-100 rounded-xl transition-colors" title="Tải lại">
                <RefreshCw className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {CTV_STATUS_OPTS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStatusFilter(s.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    statusFilter === s.value ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                    statusFilter === s.value ? 'bg-purple-400 text-white' : 'bg-white text-slate-600'
                  }`}>
                    {s.value === 'all' ? ctvOrders.length : ctvOrders.filter(o => o.status === s.value).length}
                  </span>
                </button>
              ))}
              <div className="ml-auto">
                <select
                  value={purchaseFilter}
                  onChange={e => setPurchaseFilter(e.target.value)}
                  className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">Tất cả loại đơn</option>
                  <option value="SELF">Tự mua (SELF)</option>
                  <option value="CUSTOMER">Khách mua (CUSTOMER)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Tìm khách hàng, CTV, mã đơn, sản phẩm..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="relative flex-1 min-w-[180px]">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={ctvFilter} onChange={e => setCtvFilter(e.target.value)}
                  placeholder="Lọc theo CTV ID (e.g. S249)"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <button onClick={fetchCtvOrders}
                className="px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold rounded-xl transition-colors">
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
          {ctvLoading ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center gap-3">
              <Loader2 className="w-9 h-9 text-purple-600 animate-spin" />
              <p className="text-slate-500 font-medium text-sm">Đang tải đơn hàng CTV...</p>
            </div>
          ) : ctvError ? (
            <div className="bg-white p-8 rounded-3xl border border-rose-200 text-center space-y-2">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <p className="text-slate-700 font-bold text-sm">{ctvError}</p>
              <button onClick={fetchCtvOrders} className="text-xs text-purple-600 font-bold hover:underline">Thử lại</button>
            </div>
          ) : filteredCtvOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">Không Có Đơn Hàng CTV</h3>
              <p className="text-xs text-slate-500">Chưa có đơn hàng nào từ CTV Portal.</p>
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
                    {filteredCtvOrders.map(order => {
                      const st = getStatusStyle(order.status);
                      const isExpanded = expandedId === order.id;
                      const ctv = order.orderer ?? order.customer?.sourceCtv;
                      const cp = totalCP(order.items);
                      return (
                        <React.Fragment key={order.id}>
                          <tr className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                              </div>
                              <div className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full w-fit ${
                                order.purchaseType === 'SELF_PURCHASE' ? 'bg-purple-50 text-purple-700' : 'bg-sky-50 text-sky-700'
                              }`}>
                                {order.purchaseType === 'SELF_PURCHASE' ? 'Tự mua' : 'Khách mua'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {ctv ? (
                                <>
                                  <div className="font-bold text-slate-800 flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-purple-500" />
                                    {ctv.fullName}
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    {'userId' in ctv ? ctv.userId : ''}{'businessId' in ctv && ctv.businessId ? ` · ${ctv.businessId}` : ''} · {'phone' in ctv ? ctv.phone : ''}
                                  </div>
                                </>
                              ) : <span className="text-slate-400 text-xs">—</span>}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800">{order.customer?.fullName || '—'}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">{order.customer?.phone}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-start gap-1.5">
                                <Package className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                                <div>
                                  <div className="font-semibold text-slate-700 line-clamp-1 text-xs">
                                    {order.items.length > 0 ? getItemName(order.items[0]) : '—'}
                                    {order.items.length > 1 && <span className="text-slate-400"> +{order.items.length - 1}</span>}
                                  </div>
                                  {cp > 0 ? (
                                    <div className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded mt-0.5 w-fit">CP: {cp}</div>
                                  ) : (
                                    <div className="text-[11px] text-amber-500 mt-0.5">⚠ CP=0</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{new Intl.NumberFormat('vi-VN').format(order.totalAmount)}đ</div>
                            </td>
                            <td className="py-3 px-4">
                              {order.period ? (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                                  order.period.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>{order.period.periodName}</span>
                              ) : <span className="text-[11px] text-slate-400">—</span>}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className={`px-3 py-1 text-xs font-bold rounded-xl ${st.bg} ${st.text}`}>{st.label}</span>
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={7} className="py-4 px-6">
                                {/* ORDER AUDIT INFO */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                  <div className="bg-white rounded-xl p-3 border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Loại Đơn</div>
                                    <div className={`text-xs font-extrabold mt-1 ${order.purchaseType === 'SELF_PURCHASE' ? 'text-purple-700' : 'text-sky-700'}`}>
                                      {order.purchaseType === 'SELF_PURCHASE' ? '🛒 Tự mua (Self Buy)' : '👤 Khách mua (Customer)'}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">isSelfBuy: {order.isSelfBuy ? 'true' : 'false'}</div>
                                  </div>
                                  <div className="bg-white rounded-xl p-3 border border-purple-100">
                                    <div className="text-[10px] font-bold text-purple-400 uppercase">CTV Tạo Đơn (Orderer)</div>
                                    {order.orderer ? (
                                      <>
                                        <div className="text-xs font-extrabold text-purple-800 mt-1">{order.orderer.fullName}</div>
                                        <div className="text-[10px] text-slate-500">{order.orderer.userId} · {order.orderer.phone}</div>
                                      </>
                                    ) : (
                                      <div className="text-[10px] text-slate-400 mt-1">ID: {order.ordererUserId || '—'}</div>
                                    )}
                                  </div>
                                  <div className="bg-white rounded-xl p-3 border border-sky-100">
                                    <div className="text-[10px] font-bold text-sky-400 uppercase">Khách Hàng (Customer)</div>
                                    <div className="text-xs font-extrabold text-sky-800 mt-1">{order.customer?.fullName || '—'}</div>
                                    <div className="text-[10px] text-slate-500">{order.customer?.phone || '—'}</div>
                                  </div>
                                  <div className="bg-white rounded-xl p-3 border border-emerald-100">
                                    <div className="text-[10px] font-bold text-emerald-400 uppercase">Sponsor (CTV Quản Lý)</div>
                                    {order.customer?.sourceCtv ? (
                                      <>
                                        <div className="text-xs font-extrabold text-emerald-800 mt-1">{order.customer.sourceCtv.fullName}</div>
                                        <div className="text-[10px] text-slate-500">
                                          {order.customer.sourceCtv.userId}
                                          {order.customer.sourceCtv.businessId ? ` · ${order.customer.sourceCtv.businessId}` : ''}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-[10px] text-slate-400 mt-1">{order.customer?.sourceCtvId || '—'}</div>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                                            <div className="font-bold text-slate-700 text-sm">{new Intl.NumberFormat('vi-VN').format(item.amount)}đ</div>
                                            <div className="text-[11px] font-bold text-cyan-600">CP: {item.lineCommissionPts}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-slate-600 uppercase mb-2">Hoa Hồng ({order.commissions.length} dòng)</div>
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
                                                <div className="font-bold text-emerald-600 text-sm">{new Intl.NumberFormat('vi-VN').format(c.earnedMoney)}đ</div>
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
        </>
      )}
    </div>
  );
};
