import React, { useState, useEffect, useCallback } from 'react';
import { Package, ShoppingCart, Check, ChevronDown, ChevronUp, CreditCard, AlertCircle, Loader2, CheckCircle2, XCircle, Clock, Star } from 'lucide-react';

function getCsrfToken(): string {
  const match = document.cookie.match(/csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}
function authHeaders(h: Record<string, string> = {}): Record<string, string> {
  const t = getCsrfToken(); return t ? { ...h, 'X-CSRF-Token': t } : { ...h };
}
const formatVND = (v: number | string | null | undefined): string => {
  if (v == null) return '—';
  const n = typeof v === 'string' ? parseInt(v, 10) : v;
  return isNaN(n) ? '—' : n.toLocaleString('vi-VN') + ' ₫';
};
const RANK_LABELS: Record<string, string> = { AMBASSADOR: 'Đại sứ', MANAGER: 'Trưởng nhóm', DIRECTOR: 'Quản lý', NONE: 'Chưa có' };
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Chờ duyệt', color: 'bg-amber-100 text-amber-700', icon: Clock },
  APPROVED: { label: 'Đã duyệt', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
  REJECTED: { label: 'Từ chối', color: 'bg-red-100 text-red-700', icon: XCircle },
  CONVERTED: { label: 'Đã chuyển đổi', color: 'bg-emerald-100 text-emerald-700', icon: Check },
  NEW: { label: 'Mới', color: 'bg-blue-100 text-blue-700', icon: Clock },
  DEPOSIT: { label: 'Đặt cọc', color: 'bg-amber-100 text-amber-700', icon: CreditCard },
  CONFIRMED: { label: 'Đã thanh toán', color: 'bg-cyan-100 text-cyan-700', icon: CheckCircle2 },
  SHIPPING: { label: 'Giao hàng', color: 'bg-purple-100 text-purple-700', icon: Package },
  COMPLETED: { label: 'Hoàn tất', color: 'bg-emerald-100 text-emerald-700', icon: Check },
  CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: XCircle },
};

interface Product { id: string; title: string; price: number; image?: string; slug?: string; }
interface PurchaseItem { id: string; productName: string; quantity: number; unitPrice: string; lineTotal: string; }
interface Payment { id: string; amount: string; paymentMethod: string; referenceCode?: string; note?: string; createdAt: string; }
interface Purchase { id: string; code: string; status: string; grossPrice: string; discountRateBps: number; discountAmount: string; netPayableAmount: string; paidAmount: string; remainingAmount: string; isPaidInFull: boolean; items: PurchaseItem[]; payments: Payment[]; package?: any; createdAt: string; activatedAt?: string; }
interface Registration { id: string; status: string; package?: any; createdAt: string; }

interface Props { userId?: string; isNpp?: boolean; rank?: string | null; businessId?: string | null; }

const UserNppDashboard: React.FC<Props> = ({ userId, isNpp, rank, businessId }) => {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Product selection state
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Expanded purchase
  const [expandedPurchase, setExpandedPurchase] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [regRes, purchRes, prodRes, pkgRes] = await Promise.all([
        fetch('/api/npp/my-registration', { credentials: 'include', headers: authHeaders() }),
        fetch('/api/npp/my-purchase', { credentials: 'include', headers: authHeaders() }),
        fetch('/api/products', { credentials: 'include' }),
        fetch('/api/npp/packages/available', { credentials: 'include', headers: authHeaders() }),
      ]);
      const [regData, purchData, prodData, pkgData] = await Promise.all([regRes.json(), purchRes.json(), prodRes.json(), pkgRes.json()]);
      if (regData.success && regData.data) setRegistration(regData.data);
      if (purchData.success && purchData.data) setPurchases(Array.isArray(purchData.data) ? purchData.data : [purchData.data]);
      const prods = Array.isArray(prodData) ? prodData : prodData.data || [];
      setProducts(prods.filter((p: Product) => p.price > 0));
      if (pkgData.success && pkgData.data) setPackages(pkgData.data);
    } catch { setError('Lỗi tải dữ liệu.'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalSelectedQty = Object.values(selectedProducts).reduce((s, q) => s + q, 0);
  const requiredQty = registration?.package?.requiredQuantity || 0;
  const grossTotal = Object.entries(selectedProducts).reduce((sum, [id, qty]) => {
    const p = products.find(pr => pr.id === id);
    return sum + (p ? p.price * qty : 0);
  }, 0);
  const discountBps = registration?.package?.defaultDiscount || 0;
  const discountAmount = Math.round(grossTotal * discountBps / 10000);
  const netPayable = grossTotal - discountAmount;

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev => {
      const next = { ...prev };
      if (next[id]) { delete next[id]; } else { next[id] = 1; }
      return next;
    });
  };

  const handleCreatePurchase = async () => {
    if (totalSelectedQty !== requiredQty) { setError(`Vui lòng chọn đúng ${requiredQty} sản phẩm.`); return; }
    setSubmitting(true); setError(''); setSuccessMsg('');
    try {
      const items = Object.entries(selectedProducts).map(([productId, quantity]) => ({ productId, quantity }));
      const res = await fetch('/api/npp/my-purchase', {
        method: 'POST', credentials: 'include',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Đơn mua NPP đã được tạo thành công! Vui lòng thanh toán theo hướng dẫn.');
        setShowProductSelector(false);
        setSelectedProducts({});
        fetchData();
      } else { setError(data.message || 'Lỗi tạo đơn mua.'); }
    } catch { setError('Lỗi kết nối.'); }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-sky-500" /><span className="ml-2 text-sm text-gray-500">Đang tải...</span></div>
  );

  // If already NPP active with purchases completed
  const activePurchase = purchases.find(p => p.status === 'COMPLETED');
  const pendingPurchase = purchases.find(p => !['COMPLETED', 'CANCELLED'].includes(p.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Package className="w-5 h-5" /></div>
          <div>
            <h2 className="text-lg font-bold">Nhà Phân Phối (NPP)</h2>
            <p className="text-xs text-white/80">{isNpp ? `${RANK_LABELS[rank || ''] || rank} · BID: ${businessId || '—'}` : 'Đăng ký và mua gói NPP'}</p>
          </div>
        </div>
        {isNpp && <div className="mt-3 flex items-center gap-2 bg-white/15 rounded-lg px-3 py-2 text-xs"><Star className="w-4 h-4" /> NPP đã kích hoạt thành công</div>}
      </div>

      {error && <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
      {successMsg && <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-200"><CheckCircle2 className="w-4 h-4 flex-shrink-0" />{successMsg}</div>}

      {/* Registration Status */}
      {registration && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3">Trạng thái đăng ký NPP</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Gói: <span className="font-semibold text-gray-800">{registration.package?.name || '—'}</span></p>
              <p className="text-xs text-gray-500 mt-1">Ngày đăng ký: {new Date(registration.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_CONFIG[registration.status]?.color || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_CONFIG[registration.status]?.label || registration.status}
            </span>
          </div>
        </div>
      )}

      {/* Action: Select Products & Create Purchase */}
      {registration?.status === 'APPROVED' && !pendingPurchase && !activePurchase && registration.package?.packageType === 'PRODUCT_COMBO' && (
        <div className="bg-white rounded-xl border-2 border-sky-300 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-sky-700 flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Chọn sản phẩm & mua gói</h3>
            <button onClick={() => setShowProductSelector(!showProductSelector)} className="text-xs text-sky-600 font-semibold flex items-center gap-1">
              {showProductSelector ? <><ChevronUp className="w-3 h-3" /> Ẩn</> : <><ChevronDown className="w-3 h-3" /> Chọn sản phẩm</>}
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Gói <strong>{registration.package.name}</strong> yêu cầu chọn <strong>{requiredQty}</strong> sản phẩm. Chiết khấu: <strong>{discountBps / 100}%</strong>.
          </p>

          {showProductSelector && (
            <>
              <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
                {products.map(p => {
                  const selected = !!selectedProducts[p.id];
                  return (
                    <label key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selected ? 'border-sky-400 bg-sky-50' : 'border-gray-200 bg-gray-50 hover:border-sky-300'}`}>
                      <input type="checkbox" checked={selected} onChange={() => toggleProduct(p.id)} className="accent-sky-500 flex-shrink-0" />
                      {p.image && <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{p.title}</p>
                        <p className="text-[11px] text-gray-500">{formatVND(p.price)}</p>
                      </div>
                      {selected && (
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-500">SL:</span>
                          <input type="number" min={1} max={5} value={selectedProducts[p.id] || 1}
                            onChange={e => setSelectedProducts(prev => ({ ...prev, [p.id]: Math.max(1, parseInt(e.target.value) || 1) }))}
                            onClick={e => e.stopPropagation()}
                            className="w-12 text-center text-xs border rounded px-1 py-0.5" />
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>

              {/* Price Preview */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
                <div className="flex justify-between text-xs text-gray-600"><span>Đã chọn:</span><span className={totalSelectedQty === requiredQty ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{totalSelectedQty}/{requiredQty} sản phẩm</span></div>
                <div className="flex justify-between text-xs text-gray-600 mt-1"><span>Tổng giá gốc:</span><span className="font-semibold">{formatVND(grossTotal)}</span></div>
                <div className="flex justify-between text-xs text-gray-600 mt-1"><span>Chiết khấu ({discountBps / 100}%):</span><span className="font-semibold text-emerald-600">-{formatVND(discountAmount)}</span></div>
                <div className="flex justify-between text-sm text-gray-900 mt-2 pt-2 border-t border-gray-300 font-bold"><span>Thanh toán:</span><span className="text-sky-600">{formatVND(netPayable)}</span></div>
              </div>

              <button
                onClick={handleCreatePurchase}
                disabled={submitting || totalSelectedQty !== requiredQty}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</> : <><ShoppingCart className="w-4 h-4" /> Đặt mua gói NPP — {formatVND(netPayable)}</>}
              </button>
            </>
          )}
        </div>
      )}

      {/* No registration yet */}
      {!registration && !isNpp && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <Package className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-600 font-semibold">Bạn chưa đăng ký NPP</p>
          <p className="text-xs text-gray-400 mt-1">Đăng ký NPP tại trang chủ khi tạo tài khoản.</p>
        </div>
      )}

      {/* Purchase List */}
      {purchases.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100"><h3 className="text-sm font-bold text-gray-800">Đơn mua NPP</h3></div>
          <div className="divide-y divide-gray-100">
            {purchases.map(p => {
              const expanded = expandedPurchase === p.id;
              const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.NEW;
              const Icon = sc.icon;
              return (
                <div key={p.id}>
                  <div className="p-4 cursor-pointer hover:bg-gray-50 transition-all" onClick={() => setExpandedPurchase(expanded ? null : p.id)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-gray-700">{p.code}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${sc.color}`}><Icon className="w-3 h-3" />{sc.label}</span>
                      </div>
                      {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px]">
                      <div><span className="text-gray-400">Tổng:</span><br /><span className="font-semibold">{formatVND(p.netPayableAmount)}</span></div>
                      <div><span className="text-gray-400">Đã trả:</span><br /><span className="font-semibold text-emerald-600">{formatVND(p.paidAmount)}</span></div>
                      <div><span className="text-gray-400">Còn lại:</span><br /><span className={`font-semibold ${parseInt(p.remainingAmount) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{formatVND(p.remainingAmount)}</span></div>
                    </div>
                  </div>

                  {expanded && (
                    <div className="px-4 pb-4 space-y-3 bg-gray-50 border-t border-gray-100">
                      {/* Items */}
                      {p.items && p.items.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-gray-600 mb-1.5">Sản phẩm trong đơn:</p>
                          {p.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-[11px] py-1 border-b border-gray-100 last:border-0">
                              <span className="text-gray-700">{item.productName} <span className="text-gray-400">×{item.quantity}</span></span>
                              <span className="font-semibold">{formatVND(item.lineTotal)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Financial */}
                      <div className="bg-white rounded-lg p-2.5 border border-gray-200 text-[11px]">
                        <div className="flex justify-between"><span className="text-gray-500">Giá gốc:</span><span>{formatVND(p.grossPrice)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">CK {p.discountRateBps / 100}%:</span><span className="text-emerald-600">-{formatVND(p.discountAmount)}</span></div>
                        <div className="flex justify-between font-bold mt-1 pt-1 border-t"><span>Thanh toán:</span><span className="text-sky-600">{formatVND(p.netPayableAmount)}</span></div>
                      </div>
                      {/* Payments */}
                      {p.payments && p.payments.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-gray-600 mb-1.5">Lịch sử thanh toán:</p>
                          {p.payments.map((pay, i) => (
                            <div key={i} className="flex justify-between items-center text-[11px] py-1.5 border-b border-gray-100 last:border-0">
                              <div>
                                <span className="font-semibold text-emerald-600">{formatVND(pay.amount)}</span>
                                <span className="text-gray-400 ml-2">{pay.paymentMethod}</span>
                                {pay.referenceCode && <span className="text-gray-400 ml-1">#{pay.referenceCode}</span>}
                              </div>
                              <span className="text-gray-400">{new Date(pay.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Status info */}
                      {p.status === 'NEW' || p.status === 'DEPOSIT' ? (
                        <div className="bg-amber-50 rounded-lg p-2.5 text-xs text-amber-700 border border-amber-200">
                          💡 Vui lòng thanh toán {p.status === 'NEW' ? 'để hoàn tất đơn mua' : 'phần còn lại'}. Liên hệ công ty để được hướng dẫn.
                        </div>
                      ) : p.status === 'COMPLETED' ? (
                        <div className="bg-emerald-50 rounded-lg p-2.5 text-xs text-emerald-700 border border-emerald-200">
                          ✅ NPP đã kích hoạt thành công! Rank: {RANK_LABELS[p.package?.assignedRank] || '—'}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserNppDashboard;
