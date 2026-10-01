import AdminNppDownlineModal from './AdminNppDownlineModal';
import { GitFork } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, CheckCircle, XCircle, ChevronDown, ChevronUp, 
  CreditCard, DollarSign, Package, AlertCircle, ShoppingCart, Truck, Calendar
} from 'lucide-react';

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^|;\\s*)csrf_token=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : '';
}

function getAuthHeaders(h: Record<string, string> = {}): Record<string, string> {
  const t = getCsrfToken(); 
  return t ? { ...h, 'X-CSRF-Token': t } : { ...h };
}

function formatVND(v: number | string | null): string {
  if (v === null || v === undefined) return '—';
  const n = typeof v === 'string' ? parseInt(v, 10) : v;
  return isNaN(n) ? '—' : n.toLocaleString('vi-VN') + ' ₫';
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  DEPOSIT: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-cyan-100 text-cyan-800',
  SHIPPING: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-sky-100 text-sky-800',
  CANCELLED: 'bg-red-100 text-red-800'
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Mới',
  DEPOSIT: 'Đã cọc',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy'
};

export default function AdminNppPurchases() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDownlineNpp, setSelectedDownlineNpp] = useState<{ id: string; fullName: string } | null>(null);
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<any | null>(null);

  // Data for creation
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  // Form states
  const [selectedReg, setSelectedReg] = useState<any | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [referenceCode, setReferenceCode] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/npp/purchases');
      const data = await res.json();
      if (data.success) {
        setPurchases(data.data);
      } else {
        setError(data.message || 'Lỗi tải danh sách mua hàng');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchForCreate = async () => {
    try {
      const [regRes, prodRes] = await Promise.all([
        fetch('/api/admin/npp/registrations'),
        fetch('/api/products')
      ]);
      const regData = await regRes.json();
      const prodData = await prodRes.json();
      
      if (regData.success) {
        setRegistrations(regData.data.filter((r: any) => r.status === 'APPROVED'));
      }
      if (prodData.success) {
        setProducts(prodData.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
    setSelectedReg(null);
    setSelectedProducts({});
    fetchForCreate();
    setShowCreateModal(true);
  };

  const calculateTotalQty = () => {
    return Object.values(selectedProducts).reduce((a, b) => a + b, 0);
  };

  const handleProductChange = (id: string, qty: number) => {
    if (qty <= 0) {
      const newSel = { ...selectedProducts };
      delete newSel[id];
      setSelectedProducts(newSel);
    } else {
      setSelectedProducts({ ...selectedProducts, [id]: qty });
    }
  };

  const handleCreateSubmit = async () => {
    if (!selectedReg) return;
    
    const isCombo = selectedReg.package?.type === 'PRODUCT_COMBO';
    const reqQty = selectedReg.package?.requiredQuantity || 0;
    
    if (isCombo && calculateTotalQty() !== reqQty) {
      alert(`Vui lòng chọn đúng ${reqQty} sản phẩm (Đã chọn: ${calculateTotalQty()})`);
      return;
    }

    const items = Object.entries(selectedProducts).map(([productId, quantity]) => ({
      productId,
      quantity
    }));

    try {
      setCreating(true);
      const res = await fetch('/api/admin/npp/purchases', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          registrationId: selectedReg.id,
          items: isCombo ? items : undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        fetchPurchases();
      } else {
        alert(data.message || 'Lỗi tạo mua hàng');
      }
    } catch (err) {
      alert('Đã xảy ra lỗi');
    } finally {
      setCreating(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!showPaymentModal || !paymentAmount) return;
    try {
      setCreating(true);
      const res = await fetch(`/api/admin/npp/purchases/${showPaymentModal.id}/payments`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          amount: paymentAmount.replace(/,/g, ''),
          paymentMethod,
          referenceCode,
          note: paymentNote
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowPaymentModal(null);
        setPaymentAmount('');
        setReferenceCode('');
        setPaymentNote('');
        fetchPurchases();
      } else {
        alert(data.message || 'Lỗi ghi nhận thanh toán');
      }
    } catch (err) {
      alert('Đã xảy ra lỗi');
    } finally {
      setCreating(false);
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm('Xác nhận hoàn thành mua hàng và kích hoạt NPP?')) return;
    try {
      const res = await fetch(`/api/admin/npp/purchases/${id}/complete`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        alert(`Thành công! Cấp bậc: ${data.data?.rank || ''}`);
        fetchPurchases();
      } else {
        alert(data.message || 'Lỗi hoàn thành');
      }
    } catch (err) {
      alert('Đã xảy ra lỗi');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Xác nhận hủy đơn hàng này?')) return;
    try {
      const res = await fetch(`/api/admin/npp/purchases/${id}/cancel`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        fetchPurchases();
      } else {
        alert(data.message || 'Lỗi hủy');
      }
    } catch (err) {
      alert('Đã xảy ra lỗi');
    }
  };

  if (loading) return <div className="p-4">Đang tải...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-cyan-600" />
          Quản lý Đơn NPP
        </h2>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl shadow hover:from-cyan-700 hover:to-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Tạo Đơn Hàng
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">NPP</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Người GT</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Gói</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">Tổng/Còn Lại</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Trạng Thái</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <React.Fragment key={p.id}>
                  <tr className={`border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer ${expandedId === p.id ? 'bg-slate-50' : ''}`} onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">{p.user?.fullName}</div>
                      <div className="text-sm text-slate-500">Mã: {p.userId}</div>
                      <div className="text-sm text-slate-500">{p.user?.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      {p.user?.parent ? (
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{p.user.parent.fullName}</div>
                          <div className="text-xs text-slate-500 font-mono">{p.user.parent.userId} · {p.user.parent.phone}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                              p.user.parent.isNpp ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {p.user.parent.isNpp ? '🏷️ NPP' : '🏷️ CTV'}
                            </span>
                            {p.user.parent.rank && (
                              <span className="text-[10px] font-bold text-purple-700">
                                ⭐ {p.user.parent.rank === 'AMBASSADOR' ? 'Đại sứ' : p.user.parent.rank === 'MANAGER' ? 'Trưởng nhóm' : p.user.parent.rank === 'DIRECTOR' ? 'Quản lý' : p.user.parent.rank}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200">
                          🏛️ Trực tiếp Cty (F0)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800">{p.package?.name}</div>
                      <div className="text-xs text-slate-500 bg-slate-200 inline-block px-2 py-0.5 rounded">{p.package?.type}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-gray-800">{formatVND(p.netAmount)}</div>
                      <div className={`text-sm font-medium ${p.remainingAmount === '0' ? 'text-sky-600' : 'text-red-600'}`}>
                        Còn: {formatVND(p.remainingAmount)}
                      </div>
                      <div className="text-xs text-slate-500">TT: {formatVND(p.paidAmount)} ({p.paymentCount || 0} lần)</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-800'}`}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                      {p.isPaidInFull && <div className="mt-1 text-xs text-sky-600 flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3"/> Đã thanh toán đủ</div>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                        {p.status !== 'COMPLETED' && p.status !== 'CANCELLED' && (
                          <button
                            onClick={() => setShowPaymentModal(p)}
                            className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                            title="Ghi nhận thanh toán"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        {(p.status === 'CONFIRMED' || p.status === 'SHIPPING') && p.isPaidInFull && (
                          <button
                            onClick={() => handleComplete(p.id)}
                            className="p-1.5 bg-sky-100 text-sky-700 rounded hover:bg-sky-200 transition"
                            title="Hoàn thành & Kích hoạt"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {p.status !== 'COMPLETED' && p.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleCancel(p.id)}
                            className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                            title="Hủy đơn"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedDownlineNpp({ id: p.userId || p.user?.userId || p.user?.id, fullName: p.user?.fullName || 'NPP' })}
                          className="p-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition"
                          title="Xem sơ đồ tuyến dưới (Downline)"
                        >
                          <GitFork className="w-4 h-4" />
                        </button>
                        {expandedId === p.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>
                    </td>
                  </tr>
                  
                  {expandedId === p.id && (
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <td colSpan={6} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2"><Package className="w-4 h-4" /> Chi tiết đơn hàng</h4>
                            <div className="bg-white p-3 rounded border border-slate-200 space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Ngày tạo:</span>
                                <span>{new Date(p.createdAt).toLocaleString('vi-VN')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Giá gốc (Gross):</span>
                                <span>{formatVND(p.grossAmount)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Chiết khấu (Discount):</span>
                                <span className="text-red-600">-{formatVND(p.discountAmount)}</span>
                              </div>
                              <div className="flex justify-between font-bold border-t pt-2 mt-2">
                                <span>Thành tiền (Net):</span>
                                <span>{formatVND(p.netAmount)}</span>
                              </div>
                            </div>

                            {p.items && p.items.length > 0 && (
                              <div className="mt-4">
                                <h5 className="font-medium text-slate-700 text-sm mb-2">Sản phẩm:</h5>
                                <div className="space-y-2">
                                  {p.items.map((item: any) => (
                                    <div key={item.id} className="flex items-center gap-3 bg-white p-2 border border-slate-100 rounded">
                                      {item.product?.image && <img src={item.product.image} alt="" className="w-10 h-10 object-cover rounded" />}
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{item.product?.title || 'Sản phẩm'}</div>
                                        <div className="text-xs text-slate-500">{formatVND(item.priceAtPurchase)} x {item.quantity}</div>
                                      </div>
                                      <div className="font-bold text-sm">{formatVND(item.totalPrice)}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Lịch sử thanh toán</h4>
                            {p.payments && p.payments.length > 0 ? (
                              <div className="space-y-3">
                                {p.payments.map((pay: any) => (
                                  <div key={pay.id} className="bg-white p-3 border border-slate-200 rounded relative pl-10">
                                    <div className="absolute left-3 top-3 w-4 h-4 rounded-full bg-sky-100 border border-sky-500 flex items-center justify-center">
                                      <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                                    </div>
                                    <div className="flex justify-between items-start mb-1">
                                      <div className="font-bold text-gray-800">{formatVND(pay.amount)}</div>
                                      <div className="text-xs text-slate-500">{new Date(pay.createdAt).toLocaleString('vi-VN')}</div>
                                    </div>
                                    <div className="text-xs text-slate-600 mb-1">
                                      Phương thức: <strong>{pay.paymentMethod}</strong> | Mã GD: <strong>{pay.referenceCode || '—'}</strong>
                                    </div>
                                    {pay.note && <div className="text-xs text-slate-500 italic bg-slate-50 p-1 rounded">"{pay.note}"</div>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-slate-500 italic">Chưa có thanh toán nào</div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Không có dữ liệu mua hàng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDownlineNpp && (
        <AdminNppDownlineModal
          userId={selectedDownlineNpp.id}
          onClose={() => setSelectedDownlineNpp(null)}
        />
      )}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-lg text-gray-800">Tạo Đơn Hàng Từ Đăng Ký</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600"><XCircle /></button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chọn Đăng Ký NPP (Trạng thái APPROVED)</label>
                <select 
                  className="w-full p-2 border border-slate-300 rounded focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                  value={selectedReg?.id || ''}
                  onChange={e => {
                    const reg = registrations.find(r => r.id === e.target.value);
                    setSelectedReg(reg);
                    setSelectedProducts({});
                  }}
                >
                  <option value="">-- Chọn đăng ký --</option>
                  {registrations.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.user?.fullName} - {r.package?.name} (Loại: {r.package?.type})
                    </option>
                  ))}
                </select>
              </div>

              {selectedReg && (
                <div className="bg-blue-50 p-4 rounded border border-blue-100">
                  <h4 className="font-medium text-blue-800 mb-2">Thông tin gói</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm text-blue-900">
                    <div><strong>Gói:</strong> {selectedReg.package?.name}</div>
                    <div><strong>Loại:</strong> {selectedReg.package?.type}</div>
                    <div><strong>Giá gói:</strong> {formatVND(selectedReg.package?.price)}</div>
                    {selectedReg.package?.type === 'PRODUCT_COMBO' && (
                      <div><strong>Số lượng SP yêu cầu:</strong> {selectedReg.package?.requiredQuantity}</div>
                    )}
                  </div>
                </div>
              )}

              {selectedReg?.package?.type === 'PRODUCT_COMBO' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-slate-700">Chọn sản phẩm ({calculateTotalQty()} / {selectedReg.package.requiredQuantity})</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
                    {products.map(prod => (
                      <div key={prod.id} className="flex items-center gap-3 border border-slate-200 p-2 rounded hover:border-cyan-300 transition">
                        {prod.image && <img src={prod.image} className="w-12 h-12 object-cover rounded" alt="" />}
                        <div className="flex-1">
                          <div className="text-sm font-medium line-clamp-1" title={prod.title}>{prod.title}</div>
                          <div className="text-xs text-slate-500">{formatVND(prod.price)}</div>
                        </div>
                        <div className="w-20">
                          <input 
                            type="number" 
                            min="0" 
                            className="w-full p-1 text-center border border-slate-300 rounded text-sm"
                            value={selectedProducts[prod.id] || ''}
                            onChange={e => handleProductChange(prod.id, parseInt(e.target.value) || 0)}
                            placeholder="SL"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 transition">
                Hủy
              </button>
              <button 
                onClick={handleCreateSubmit}
                disabled={creating || !selectedReg}
                className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition disabled:opacity-50"
              >
                {creating ? 'Đang xử lý...' : 'Tạo Đơn Hàng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="font-bold text-lg text-gray-800">Ghi nhận thanh toán</h3>
              <button onClick={() => setShowPaymentModal(null)} className="text-slate-400 hover:text-slate-600"><XCircle /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-amber-50 p-3 border border-amber-200 rounded text-sm text-amber-800">
                <div>Đơn hàng: <strong>{showPaymentModal.package?.name}</strong></div>
                <div>NPP: <strong>{showPaymentModal.user?.fullName}</strong></div>
                <div>Số tiền còn lại: <strong>{formatVND(showPaymentModal.remainingAmount)}</strong></div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền thanh toán (VNĐ)</label>
                <input 
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded focus:border-cyan-500 outline-none"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder="Nhập số tiền..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phương thức</label>
                <select
                  className="w-full p-2 border border-slate-300 rounded focus:border-cyan-500 outline-none"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                >
                  <option value="BANK_TRANSFER">Chuyển khoản</option>
                  <option value="CASH">Tiền mặt</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mã giao dịch (Tùy chọn)</label>
                <input 
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded focus:border-cyan-500 outline-none"
                  value={referenceCode}
                  onChange={e => setReferenceCode(e.target.value)}
                  placeholder="Mã chuyển khoản..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú (Tùy chọn)</label>
                <textarea 
                  className="w-full p-2 border border-slate-300 rounded focus:border-cyan-500 outline-none"
                  value={paymentNote}
                  onChange={e => setPaymentNote(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50 rounded-b-xl">
              <button onClick={() => setShowPaymentModal(null)} className="px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-100 transition">
                Hủy
              </button>
              <button 
                onClick={handlePaymentSubmit}
                disabled={creating || !paymentAmount}
                className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition disabled:opacity-50"
              >
                {creating ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedDownlineNpp && (
        <AdminNppDownlineModal
          userId={selectedDownlineNpp.id}
          onClose={() => setSelectedDownlineNpp(null)}
        />
      )}
    </div>
  );
}
