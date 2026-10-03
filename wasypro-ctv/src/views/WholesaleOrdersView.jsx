import React, { useState, useEffect } from 'react';
import { Package, Plus, X, ChevronDown, ChevronUp, CheckCircle, Truck, Ban, Clock, AlertCircle, Loader } from 'lucide-react';
import WholesalePricePreview from '../components/common/WholesalePricePreview.jsx';

const vnd = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);
const STATUS_CONFIG = {
  PENDING_APPROVAL: { label: 'Chờ duyệt', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', icon: Clock },
  APPROVED:         { label: 'Đã duyệt',  color: 'text-blue-400',   bg: 'bg-blue-500/20',   border: 'border-blue-500/30',   icon: CheckCircle },
  SHIPPING:         { label: 'Đang giao', color: 'text-cyan-400',   bg: 'bg-cyan-500/20',   border: 'border-cyan-500/30',   icon: Truck },
  COMPLETED:        { label: 'Hoàn tất',  color: 'text-green-400',  bg: 'bg-green-500/20',  border: 'border-green-500/30',  icon: CheckCircle },
  CANCELLED:        { label: 'Đã hủy',    color: 'text-red-400',    bg: 'bg-red-500/20',    border: 'border-red-500/30',    icon: Ban },
};

export default function WholesaleOrdersView({ currentUser }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [services, setServices] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Create form state
  const [formItems, setFormItems] = useState([{ serviceId: '', serviceName: '', qty: 1, unitPrice: 0, discountRate: 0, subtotal: 0 }]);
  const [previewItems, setPreviewItems] = useState([]);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.id === 'ADMIN';

  const fetchOrders = () => {
    setLoading(true);
    setError(null);
    fetch('/api/wholesale/orders', { credentials: 'include' })
      .then(res => { if (!res.ok) throw new Error('Lỗi kết nối'); return res.json(); })
      .then(res => { if (res.success) setOrders(res.data || []); else throw new Error(res.message); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
    fetch('/api/services', { credentials: 'include' })
      .then(r => r.json())
      .then(res => { if (res.success) setServices(res.data || []); });
  }, []);

  // Phase 2B: Rates are configurable and served from backend API
  // Discount rates fetched from /api/wholesale/price-preview ? NOT hardcoded
  const [previewApiData, setPreviewApiData] = useState({ discountRate: 0, eligible: false });

  const fetchDiscountPreview = async (totalQty) => {
    if (totalQty < 1) { setPreviewApiData({ discountRate: 0, eligible: false }); return 0; }
    try {
      const res = await fetch(`/api/wholesale/price-preview?qty=${totalQty}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.data) {
        setPreviewApiData(data.data);
        return data.data.discountRate || 0;
      }
    } catch (e) {}
    return 0;
  };

  const updateFormItem = (idx, field, value) => {
    setFormItems(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      if (field === 'serviceId') {
        const svc = services.find(s => s.id === value);
        if (svc) {
          updated[idx].serviceName = svc.name;
          updated[idx].unitPrice = svc.price || 0;
        }
      }
      const qty = parseInt(updated[idx].qty) || 0;
      const unitPrice = updated[idx].unitPrice || 0;
      // Note: discountRate is set by the useEffect below via API preview
      updated[idx].subtotal = unitPrice * qty;  // Will be recalculated in useEffect
      return updated;
    });
  };

  useEffect(() => {
    const totalQty = formItems.reduce((s, i) => s + (parseInt(i.qty) || 0), 0);
    // Fetch discount rate from backend API (configurable, not hardcoded)
    fetchDiscountPreview(totalQty).then(dr => {
      const preview = formItems
        .filter(i => i.serviceId && parseInt(i.qty) > 0)
        .map(i => ({
          serviceId: i.serviceId,
          serviceName: i.serviceName,
          qty: parseInt(i.qty) || 0,
          unitPrice: i.unitPrice,
          discountRate: dr * 100, // store as percentage for display
          discountRateDecimal: dr,
          subtotal: (i.unitPrice || 0) * (parseInt(i.qty) || 0) * (1 - dr),
        }));
      setPreviewItems(preview);
    });
  }, [formItems]);

  const addFormItem = () => setFormItems(prev => [...prev, { serviceId: '', serviceName: '', qty: 1, unitPrice: 0, discountRate: 0, subtotal: 0 }]);
  const removeFormItem = (idx) => setFormItems(prev => prev.filter((_, i) => i !== idx));

  const handleSubmitOrder = async () => {
    setFormError('');
    const totalQty = formItems.reduce((s, i) => s + (parseInt(i.qty) || 0), 0);
    if (totalQty < 5) {
      setFormError('Tối thiểu 5 máy để tạo đơn sỉ!');
      return;
    }
    const validItems = formItems.filter(i => i.serviceId && parseInt(i.qty) > 0);
    if (validItems.length === 0) {
      setFormError('Vui lòng chọn ít nhất 1 sản phẩm!');
      return;
    }
    setFormLoading(true);
    try {
      const res = await fetch('/api/wholesale/orders', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: validItems }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateForm(false);
        setFormItems([{ serviceId: '', serviceName: '', qty: 1, unitPrice: 0, discountRate: 0, subtotal: 0 }]);
        fetchOrders();
      } else {
        setFormError(data.message || 'Lỗi tạo đơn hàng');
      }
    } catch {
      setFormError('Lỗi kết nối máy chủ');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAction = async (orderId, action) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/wholesale/orders/${orderId}/${action}`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) fetchOrders();
    } catch {}
    setActionLoading(false);
  };

  const filteredOrders = filterStatus === 'ALL' ? orders : orders.filter(o => o.status === filterStatus);

  const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || { label: status, color: 'text-gray-400', bg: 'bg-gray-700/30', border: 'border-gray-600/30', icon: AlertCircle };
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
        <Icon size={11} /> {cfg.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <Package size={22} /> Quản Lý Đơn Hàng Sỉ
          </h2>
          <p className="text-sm text-secondary mt-1">Đơn hàng mua sỉ thiết bị với chiết khấu theo số lượng</p>
        </div>
        <button
          className="btn btn-primary flex items-center gap-2 hover-scale"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus size={16} /> Tạo Đơn Mới
        </button>
      </div>

      {/* Filter */}
      <div className="glass-panel p-3">
        <div className="flex flex-wrap gap-2">
          {['ALL', ...Object.keys(STATUS_CONFIG)].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                filterStatus === s
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-transparent text-secondary border-gray-700 hover:border-blue-500 hover:text-blue-400'
              }`}
            >
              {s === 'ALL' ? 'Tất cả' : (STATUS_CONFIG[s]?.label || s)}
            </button>
          ))}
        </div>
      </div>

      {/* Create Order Form */}
      {showCreateForm && (
        <div className="glass-panel p-5 space-y-4 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-primary text-base">Tạo đơn hàng sỉ mới</h3>
            <button onClick={() => { setShowCreateForm(false); setFormError(''); }} className="btn-icon btn-secondary">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3">
            {formItems.map((item, idx) => (
              <div key={idx} className="flex flex-wrap gap-3 items-center p-3 rounded-lg bg-gray-800/40 border border-gray-700/50">
                <select
                  className="input-field flex-1 min-w-40 text-sm"
                  value={item.serviceId}
                  onChange={e => updateFormItem(idx, 'serviceId', e.target.value)}
                >
                  <option value="">Chọn sản phẩm...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-secondary whitespace-nowrap">SL:</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field w-20 text-sm text-center"
                    value={item.qty}
                    onChange={e => updateFormItem(idx, 'qty', parseInt(e.target.value) || 1)}
                  />
                </div>
                {item.serviceId && (
                  <div className="text-xs text-secondary whitespace-nowrap">
                    CK: <span className="text-green-400 font-bold">{item.discountRate}%</span>
                    {' → '}
                    <span className="text-diamond font-bold">{vnd(item.subtotal)}</span>
                  </div>
                )}
                {formItems.length > 1 && (
                  <button onClick={() => removeFormItem(idx)} className="btn-icon text-red-400 hover:bg-red-500/20">
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button onClick={addFormItem} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
            <Plus size={14} /> Thêm sản phẩm
          </button>

          {/* Preview */}
          {previewItems.length > 0 && (
            <div className="border border-gray-700/50 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700/50">
                <span className="text-sm font-semibold text-secondary">Xem trước giá sỉ</span>
              </div>
              <div className="p-3">
                <WholesalePricePreview items={previewItems} />
              </div>
            </div>
          )}

          <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-yellow-400 text-xs">⚠️ Tối thiểu 5 máy để tạo đơn sỉ. Chiết khấu: 5-9 máy: 15%, 10-19 máy: 20%, ≥20 máy: 25%</p>
          </div>

          {formError && (
            <div className="p-2 rounded bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 text-sm">⚠️ {formError}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button onClick={() => { setShowCreateForm(false); setFormError(''); }} className="btn btn-secondary">Hủy</button>
            <button onClick={handleSubmitOrder} disabled={formLoading} className="btn btn-primary flex items-center gap-2">
              {formLoading ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Tạo Đơn Hàng
            </button>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="glass-panel">
        {loading ? (
          <div className="p-8 text-center flex items-center justify-center gap-2 text-secondary">
            <Loader size={20} className="animate-spin" /> Đang tải đơn hàng sỉ...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">⚠️ {error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-secondary">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p>Chưa có đơn hàng sỉ nào{filterStatus !== 'ALL' ? ` với trạng thái "${STATUS_CONFIG[filterStatus]?.label}"` : ''}.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full text-left" style={{ minWidth: '700px' }}>
              <thead>
                <tr className="border-b border-gray-700 text-secondary">
                  <th className="py-3 px-4 font-medium text-xs whitespace-nowrap">STT</th>
                  <th className="py-3 px-4 font-medium text-xs whitespace-nowrap">Người mua</th>
                  <th className="py-3 px-4 font-medium text-xs whitespace-nowrap text-center">SL máy</th>
                  <th className="py-3 px-4 font-medium text-xs whitespace-nowrap text-center">Chiết khấu</th>
                  <th className="py-3 px-4 font-medium text-xs whitespace-nowrap text-right">Tổng gốc</th>
                  <th className="py-3 px-4 font-medium text-xs whitespace-nowrap text-right">Sau CK</th>
                  <th className="py-3 px-4 font-medium text-xs whitespace-nowrap text-center">Trạng thái</th>
                  <th className="py-3 px-4 font-medium text-xs whitespace-nowrap">Ngày tạo</th>
                  <th className="py-3 px-4 font-medium text-xs whitespace-nowrap text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => (
                  <React.Fragment key={order.id}>
                    <tr
                      className="border-b border-gray-800/50 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    >
                      <td className="py-3 px-4 text-sm text-secondary">{idx + 1}</td>
                      <td className="py-3 px-4 text-sm font-medium text-primary">
                        {order.buyer?.fullName || order.buyerId || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-center font-bold text-diamond">
                        {order.totalQty || order.items?.reduce((s, i) => s + i.qty, 0) || 0}
                      </td>
                      <td className="py-3 px-4 text-sm text-center">
                        <span className="text-green-400 font-bold">{Math.round((order.discountRate || 0) * 100)}%</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-secondary">{vnd(order.totalOriginal)}</td>
                      <td className="py-3 px-4 text-sm text-right font-bold" style={{ color: 'var(--accent-diamond)' }}>{vnd(order.finalAmount)}</td>
                      <td className="py-3 px-4 text-center"><StatusBadge status={order.status} /></td>
                      <td className="py-3 px-4 text-xs text-secondary whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {expandedId === order.id ? <ChevronUp size={16} className="text-secondary mx-auto" /> : <ChevronDown size={16} className="text-secondary mx-auto" />}
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {expandedId === order.id && (
                      <tr>
                        <td colSpan={9} className="p-0">
                          <div className="p-4 bg-gray-900/60 border-b border-gray-700 space-y-4">
                            {/* Items preview */}
                            {order.items && order.items.length > 0 && (
                              <WholesalePricePreview
                                items={order.items.map(i => ({
                                  serviceId: i.serviceId,
                                  serviceName: i.service?.name || i.serviceId,
                                  qty: i.qty,
                                  unitPrice: i.unitPrice,
                                  discountRate: i.discountRate || order.discountRate || 0,
                                  subtotal: i.subtotal,
                                }))}
                              />
                            )}

                            {/* Admin actions */}
                            {isAdmin && (
                              <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-gray-700">
                                {order.status === 'PENDING_APPROVAL' && (
                                  <>
                                    <button
                                      disabled={actionLoading}
                                      onClick={() => handleAction(order.id, 'approve')}
                                      className="btn btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                                    >
                                      <CheckCircle size={14} /> Duyệt đơn
                                    </button>
                                    <button
                                      disabled={actionLoading}
                                      onClick={() => handleAction(order.id, 'cancel')}
                                      className="btn text-xs px-3 py-1.5 flex items-center gap-1 bg-red-600/80 text-white border-red-500"
                                    >
                                      <Ban size={14} /> Hủy đơn
                                    </button>
                                  </>
                                )}
                                {order.status === 'APPROVED' && (
                                  <button
                                    disabled={actionLoading}
                                    onClick={() => handleAction(order.id, 'ship')}
                                    className="btn btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                                  >
                                    <Truck size={14} /> Giao hàng
                                  </button>
                                )}
                                {order.status === 'SHIPPING' && (
                                  <button
                                    disabled={actionLoading}
                                    onClick={() => handleAction(order.id, 'complete')}
                                    className="btn btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                                  >
                                    <CheckCircle size={14} /> Hoàn tất
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
