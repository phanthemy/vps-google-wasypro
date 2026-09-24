import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, User, Package, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function getCsrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return m ? m[1] : '';
}

export default function CreateOrderModal({ currentUser, onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1=subject, 2=product, 3=confirm
  const [purchaseSubject, setPurchaseSubject] = useState('SELF');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustJoinCTV, setNewCustJoinCTV] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  // NPP Pricing
  const [pricingMode, setPricingMode] = useState('RETAIL'); // 'RETAIL' | 'NPP' | 'COMBO'
  const [nppDiscount, setNppDiscount] = useState(null); // { rateBps, ratePercent, packageName }
  const [nppCombo, setNppCombo] = useState(null); // { packageName, discountPercent, items: [...] }
  const [comboItems, setComboItems] = useState([]); // [{ productId, qty }] for combo mode

  // Shipping info
  const [shippingAddress, setShippingAddress] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [contactHotline, setContactHotline] = useState('');

  // Load NPP discount + combo info if user has nppRank
  useEffect(() => {
    if (currentUser?.nppRank) {
      // Fetch discount info
      fetch('/api/npp/my-discount', { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.hasDiscount) {
            setNppDiscount(data.discount);
          }
        })
        .catch(() => {});
      // Fetch combo package info
      fetch('/api/npp/my-combo', { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.hasCombo) {
            setNppCombo(data.combo);
            // Default to combo mode for NPP users with combo package
            setPricingMode('COMBO');
            // Pre-fill combo items with original quantities
            setComboItems(data.combo.items.map(item => ({
              productId: item.productId,
              productName: item.productName,
              price: item.price,
              discountedPrice: item.discountedPrice,
              qty: item.originalQty,
            })));
          } else if (data.success) {
            // No combo, use NPP discount if available
            setPricingMode('NPP');
          }
        })
        .catch(() => {});
    }
  }, [currentUser]);

  // Load products
  useEffect(() => {
    fetch('/api/products', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.data || []);
        setProducts(list.filter(p => p.price > 0));
      })
      .catch(() => {});
  }, []);

  // Load customers when CUSTOMER mode
  useEffect(() => {
    if (purchaseSubject === 'CUSTOMER') {
      setLoading(true);
      fetch('/api/customers', { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          const list = data.success ? (data.data || []) : [];
          setCustomers(list);
        })
        .catch(() => setCustomers([]))
        .finally(() => setLoading(false));
    }
  }, [purchaseSubject]);

  const filteredCustomers = customers.filter(c => {
    if (!customerSearch) return true;
    const q = customerSearch.toLowerCase();
    return (c.fullName || '').toLowerCase().includes(q) ||
           (c.phone || '').toLowerCase().includes(q);
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // Validate shipping fields
      // Validate combo items
      if (pricingMode === 'COMBO' && comboItems.every(ci => ci.qty <= 0)) {
        setError('Vui lòng chọn ít nhất 1 sản phẩm trong combo.');
        setSubmitting(false);
        return;
      }
      if (pricingMode !== 'COMBO' && !selectedProduct) {
        setError('Vui lòng chọn sản phẩm.');
        setSubmitting(false);
        return;
      }
      if (!recipientPhone.trim()) {
        setError('Vui lòng nhập số điện thoại người nhận.');
        setSubmitting(false);
        return;
      }
      if (!shippingAddress.trim()) {
        setError('Vui lòng nhập địa chỉ giao hàng.');
        setSubmitting(false);
        return;
      }

      const body = {
        purchaseSubject,
        pricingMode: pricingMode,
        items: pricingMode === 'COMBO'
          ? comboItems.filter(ci => ci.qty > 0).map(ci => ({ productId: ci.productId, qty: ci.qty }))
          : [{ productId: selectedProduct.id, qty }],
        shippingAddress: shippingAddress.trim(),
        recipientPhone: recipientPhone.trim(),
        recipientEmail: recipientEmail.trim() || null,
        contactHotline: contactHotline.trim() || null,
      };
      if (purchaseSubject === 'CUSTOMER' && selectedCustomer) {
        body.customerId = selectedCustomer.id;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setError(data.message || data.error || 'Không thể tạo đơn hàng');
      }
    } catch {
      setError('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const discountRate = (pricingMode === 'NPP' || pricingMode === 'COMBO') && nppDiscount ? nppDiscount.rateBps : 0;
  const retailTotal = selectedProduct ? selectedProduct.price * qty : 0;
  const comboTotal = pricingMode === 'COMBO' ? comboItems.reduce((sum, ci) => sum + ci.discountedPrice * ci.qty, 0) : 0;
  const comboRetailTotal = pricingMode === 'COMBO' ? comboItems.reduce((sum, ci) => sum + ci.price * ci.qty, 0) : 0;
  const totalAmount = pricingMode === 'COMBO' ? comboTotal : (discountRate > 0 ? Math.round(retailTotal * (10000 - discountRate) / 10000) : retailTotal);
  const totalCP = selectedProduct ? (selectedProduct.commissionPoints || 0) * qty : 0;

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center animate-fadeIn">
          <CheckCircle size={56} className="mx-auto mb-4" style={{ color: '#10b981' }} />
          <h3 className="text-xl font-extrabold" style={{ color: '#065f46' }}>Tạo Đơn Thành Công!</h3>
          <p className="text-sm mt-2" style={{ color: '#64748b' }}>Đơn hàng đã được ghi nhận và tính hoa hồng.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#e2e8f0' }}>
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} style={{ color: '#6366f1' }} />
            <h2 className="text-lg font-extrabold" style={{ color: '#1e293b' }}>Tạo Đơn Hàng</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} style={{ color: '#94a3b8' }} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <AlertCircle size={16} style={{ color: '#ef4444' }} />
              <span className="text-sm font-medium" style={{ color: '#dc2626' }}>{error}</span>
            </div>
          )}

          {/* STEP 1: Purchase Subject */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Mua cho</label>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { setPurchaseSubject('SELF'); setSelectedCustomer(null); }}
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: purchaseSubject === 'SELF' ? '#ede9fe' : '#f8fafc',
                  color: purchaseSubject === 'SELF' ? '#6d28d9' : '#64748b',
                  border: purchaseSubject === 'SELF' ? '2px solid #8b5cf6' : '1px solid #e2e8f0',
                }}
              >
                🛒 Chính Mình
              </button>
              <button
                onClick={() => setPurchaseSubject('CUSTOMER')}
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: purchaseSubject === 'CUSTOMER' ? '#dbeafe' : '#f8fafc',
                  color: purchaseSubject === 'CUSTOMER' ? '#1d4ed8' : '#64748b',
                  border: purchaseSubject === 'CUSTOMER' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                }}
              >
                👤 Khách Hàng
              </button>
            </div>
          </div>

          {/* Customer Selection (if CUSTOMER) */}
          {purchaseSubject === 'CUSTOMER' && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Chọn Khách Hàng</label>
              <input
                type="text"
                placeholder="🔎 Tìm tên hoặc SĐT..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="w-full mt-2 p-2.5 rounded-xl text-sm"
                style={{ border: '1px solid #e2e8f0' }}
              />
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={20} className="animate-spin" style={{ color: '#94a3b8' }} />
                </div>
              ) : null}

              {/* Danh sách khách hàng - luôn hiển thị nếu có kết quả */}
              {!loading && filteredCustomers.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
                  {filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-blue-50 transition-colors text-sm"
                      style={{
                        background: selectedCustomer?.id === c.id ? '#dbeafe' : 'transparent',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <User size={14} style={{ color: '#6366f1' }} />
                      <div>
                        <div className="font-bold" style={{ color: '#1e293b' }}>{c.fullName}</div>
                        <div className="text-xs" style={{ color: '#94a3b8' }}>{c.phone}</div>
                      </div>
                      {selectedCustomer?.id === c.id && <CheckCircle size={14} style={{ color: '#10b981', marginLeft: 'auto' }} />}
                    </button>
                  ))}
                </div>
              )}
              {!loading && filteredCustomers.length === 0 && customerSearch.trim() && (
                <div className="mt-2 text-sm text-center py-2" style={{ color: '#94a3b8' }}>Không tìm thấy khách hàng</div>
              )}

              {/* Tạo khách mới - LUÔN HIỆN khi ở chế độ CUSTOMER */}
              {!loading && (!showNewCustomerForm ? (
                <button
                  onClick={() => { setShowNewCustomerForm(true); setNewCustName(customerSearch); }}
                  className="mt-2 w-full px-4 py-2 rounded-xl text-sm font-bold transition-all"
                  style={{ background: '#f0f0ff', color: '#6366f1', border: '1.5px dashed #6366f1' }}
                >
                  + Tạo Khách Mới
                </button>
              ) : (
                <div className="mt-2 text-left space-y-2 p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div className="text-xs font-bold uppercase" style={{ color: '#6366f1' }}>Tạo Khách Hàng Mới</div>
                  <input
                    type="text"
                    placeholder="Họ tên khách"
                    value={newCustName}
                    onChange={e => setNewCustName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ border: '1px solid #e2e8f0' }}
                  />
                  <input
                    type="tel"
                    placeholder="Số điện thoại"
                    value={newCustPhone}
                    onChange={e => setNewCustPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ border: '1px solid #e2e8f0' }}
                  />
                  <label className="flex items-center gap-2 text-sm cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={newCustJoinCTV}
                      onChange={e => setNewCustJoinCTV(e.target.checked)}
                      className="w-4 h-4 accent-indigo-500"
                    />
                    <span style={{ color: '#475569' }}>Tham gia CTV (tạo tài khoản đối tác)</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      disabled={creatingCustomer || !newCustName.trim() || !newCustPhone.trim()}
                      onClick={async () => {
                        setCreatingCustomer(true);
                        try {
                          const csrf = document.cookie.match(/csrf_token=([^;]*)/)?.[1] || '';
                          const r = await fetch('/api/ctv/customers', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
                            credentials: 'include',
                            body: JSON.stringify({ fullName: newCustName.trim(), phone: newCustPhone.trim(), joinCTV: newCustJoinCTV }),
                          }).then(r => r.json());
                          if (r.success) {
                            setSelectedCustomer(r.customer);
                            setShowNewCustomerForm(false);
                            setNewCustName(''); setNewCustPhone(''); setNewCustJoinCTV(false);
                            setCustomerSearch('');
                            const listRes = await fetch('/api/customers', { credentials: 'include' }).then(r => r.json());
                            if (listRes.success) setCustomers(listRes.data);
                            alert(r.message + (r.user ? '\nUser ID: ' + r.user.userId : ''));
                          } else { alert('Lỗi: ' + r.message); }
                        } catch(e) { alert('Lỗi kết nối'); }
                        setCreatingCustomer(false);
                      }}
                      className="flex-1 py-2 rounded-lg text-sm font-bold text-white transition-all"
                      style={{ background: creatingCustomer || !newCustName.trim() || !newCustPhone.trim() ? '#cbd5e1' : '#10b981' }}
                    >
                      {creatingCustomer ? '⏳ Đang tạo...' : '✅ Tạo'}
                    </button>
                    <button
                      onClick={() => setShowNewCustomerForm(false)}
                      className="px-4 py-2 rounded-lg text-sm font-bold"
                      style={{ background: '#f1f5f9', color: '#64748b' }}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PRICING MODE — for NPP users with combo or discount */}
          {(nppCombo || nppDiscount) && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Chế Độ Mua Hàng</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {nppCombo && (
                  <button
                    onClick={() => setPricingMode('COMBO')}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all min-w-[120px]"
                    style={{
                      background: pricingMode === 'COMBO' ? '#dbeafe' : '#f8fafc',
                      color: pricingMode === 'COMBO' ? '#1e40af' : '#64748b',
                      border: pricingMode === 'COMBO' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    }}
                  >
                    📦 Combo NPP
                  </button>
                )}
                {nppDiscount && (
                  <button
                    onClick={() => setPricingMode('NPP')}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all min-w-[120px]"
                    style={{
                      background: pricingMode === 'NPP' ? '#dcfce7' : '#f8fafc',
                      color: pricingMode === 'NPP' ? '#166534' : '#64748b',
                      border: pricingMode === 'NPP' ? '2px solid #22c55e' : '1px solid #e2e8f0',
                    }}
                  >
                    🏷️ Mua Lẻ CK (-{nppDiscount.ratePercent}%)
                  </button>
                )}
                <button
                  onClick={() => setPricingMode('RETAIL')}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all min-w-[120px]"
                  style={{
                    background: pricingMode === 'RETAIL' ? '#fef3c7' : '#f8fafc',
                    color: pricingMode === 'RETAIL' ? '#92400e' : '#64748b',
                    border: pricingMode === 'RETAIL' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                  }}
                >
                  💰 Giá Retail
                </button>
              </div>
              {pricingMode === 'COMBO' && nppCombo && (
                <p className="text-xs mt-1.5 font-medium" style={{ color: '#2563eb' }}>
                  📦 {nppCombo.packageName} — CK {nppCombo.discountPercent}% — Chọn sản phẩm và số lượng bên dưới
                </p>
              )}
              {pricingMode === 'NPP' && nppDiscount && (
                <p className="text-xs mt-1.5 font-medium" style={{ color: '#16a34a' }}>
                  Gói: {nppDiscount.packageName} — Chiết khấu {nppDiscount.ratePercent}%
                </p>
              )}
            </div>
          )}

          {/* COMBO MODE: Product selection from combo package */}
          {pricingMode === 'COMBO' && nppCombo && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Sản Phẩm Combo — {nppCombo.packageName}</label>
              <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid #bfdbfe' }}>
                {comboItems.map((ci, idx) => (
                  <div key={ci.productId} className="flex items-center justify-between p-3" style={{ borderBottom: idx < comboItems.length - 1 ? '1px solid #f1f5f9' : 'none', background: ci.qty > 0 ? '#eff6ff' : 'transparent' }}>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm" style={{ color: '#1e293b' }}>{ci.productName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs line-through" style={{ color: '#94a3b8' }}>{new Intl.NumberFormat('vi-VN').format(ci.price)}đ</span>
                        <span className="text-xs font-bold" style={{ color: '#16a34a' }}>{new Intl.NumberFormat('vi-VN').format(ci.discountedPrice)}đ</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button onClick={() => { const next = [...comboItems]; next[idx] = {...next[idx], qty: Math.max(0, next[idx].qty - 1)}; setComboItems(next); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: '#e2e8f0', color: '#475569' }}>−</button>
                      <span className="w-8 text-center font-bold text-sm">{ci.qty}</span>
                      <button onClick={() => { const next = [...comboItems]; next[idx] = {...next[idx], qty: next[idx].qty + 1}; setComboItems(next); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: '#3b82f6', color: '#fff' }}>+</button>
                    </div>
                  </div>
                ))}
              </div>
              {comboItems.some(ci => ci.qty > 0) && (
                <div className="mt-2 p-3 rounded-xl" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div className="flex justify-between text-xs" style={{ color: '#64748b' }}>
                    <span>Tổng SL: {comboItems.reduce((s, ci) => s + ci.qty, 0)} sản phẩm</span>
                    <span>Giá gốc: <span className="line-through">{new Intl.NumberFormat('vi-VN').format(comboRetailTotal)}đ</span></span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs font-bold" style={{ color: '#16a34a' }}>CK {nppCombo.discountPercent}%: -{new Intl.NumberFormat('vi-VN').format(comboRetailTotal - comboTotal)}đ</span>
                    <span className="font-extrabold text-sm" style={{ color: '#059669' }}>{new Intl.NumberFormat('vi-VN').format(comboTotal)}đ</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Product Selection (for NPP/RETAIL modes) */}
          {pricingMode !== 'COMBO' && (
          <div>
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Sản Phẩm</label>
            <div className="mt-2 max-h-48 overflow-y-auto rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
              {products.length === 0 ? (
                <div className="p-3 text-center text-sm" style={{ color: '#94a3b8' }}>Đang tải sản phẩm...</div>
              ) : products.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-purple-50 transition-colors"
                  style={{
                    background: selectedProduct?.id === p.id ? '#f5f3ff' : 'transparent',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Package size={16} style={{ color: '#8b5cf6' }} />
                    <div>
                      <div className="font-bold text-sm" style={{ color: '#1e293b' }}>{p.title}</div>
                      <div className="text-xs" style={{ color: '#94a3b8' }}>
                        CP: {p.commissionPoints || 0}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {pricingMode === 'NPP' && discountRate > 0 ? (
                      <>
                        <div className="text-xs line-through" style={{ color: '#94a3b8' }}>
                          {new Intl.NumberFormat('vi-VN').format(p.price)}đ
                        </div>
                        <div className="font-bold text-sm" style={{ color: '#16a34a' }}>
                          {new Intl.NumberFormat('vi-VN').format(Math.round(p.price * (10000 - discountRate) / 10000))}đ
                        </div>
                      </>
                    ) : (
                      <div className="font-bold text-sm" style={{ color: '#059669' }}>
                        {new Intl.NumberFormat('vi-VN').format(p.price)}đ
                      </div>
                    )}
                    {selectedProduct?.id === p.id && <CheckCircle size={14} style={{ color: '#10b981' }} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          {selectedProduct && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Số Lượng</label>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-10 rounded-xl font-bold text-lg"
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
                >−</button>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 text-center py-2 rounded-xl font-bold"
                  style={{ border: '1px solid #e2e8f0' }}
                />
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-10 h-10 rounded-xl font-bold text-lg"
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}
                >+</button>
              </div>
            </div>
          )}

          {/* STEP 3: Summary */}
          {((pricingMode === 'COMBO' && comboItems.some(ci => ci.qty > 0)) || (pricingMode !== 'COMBO' && selectedProduct)) && (purchaseSubject === 'SELF' || selectedCustomer) && (
            <div className="rounded-xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>Tóm Tắt Đơn Hàng</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: '#64748b' }}>Loại đơn</span>
                  <span className="font-bold" style={{ color: purchaseSubject === 'SELF' ? '#7c3aed' : '#2563eb' }}>
                    {purchaseSubject === 'SELF' ? '🛒 Tự mua' : '👤 Khách mua'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#64748b' }}>CTV Tạo Đơn</span>
                  <span className="font-bold" style={{ color: '#1e293b' }}>{currentUser.fullName}</span>
                </div>
                {purchaseSubject === 'CUSTOMER' && selectedCustomer && (
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>Khách hàng</span>
                    <span className="font-bold" style={{ color: '#1e293b' }}>{selectedCustomer.fullName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span style={{ color: '#64748b' }}>Sản phẩm</span>
                  <span className="font-bold" style={{ color: '#1e293b' }}>
                    {pricingMode === 'COMBO' ? `Combo ${comboItems.filter(ci => ci.qty > 0).length} SP` : selectedProduct.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#64748b' }}>Số lượng</span>
                  <span className="font-bold">
                    {pricingMode === 'COMBO' ? comboItems.reduce((s, ci) => s + ci.qty, 0) : qty}
                  </span>
                </div>
                {pricingMode === 'NPP' && discountRate > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>Giá gốc</span>
                    <span className="line-through" style={{ color: '#94a3b8' }}>
                      {new Intl.NumberFormat('vi-VN').format(retailTotal)}đ
                    </span>
                  </div>
                )}
                {pricingMode === 'NPP' && discountRate > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: '#16a34a' }}>Chiết khấu NPP (-{nppDiscount?.ratePercent}%)</span>
                    <span className="font-bold" style={{ color: '#16a34a' }}>
                      -{new Intl.NumberFormat('vi-VN').format(retailTotal - totalAmount)}đ
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2" style={{ borderTop: '1px dashed #e2e8f0' }}>
                  <span className="font-bold" style={{ color: '#475569' }}>Tổng tiền</span>
                  <span className="font-extrabold text-lg" style={{ color: '#059669' }}>
                    {new Intl.NumberFormat('vi-VN').format(totalAmount)}đ
                  </span>
                </div>
                {totalCP > 0 && (
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>Commission Points</span>
                    <span className="font-bold" style={{ color: '#d97706' }}>+{totalCP} CP</span>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* SHIPPING SECTION */}
          {((pricingMode === 'COMBO' && comboItems.some(ci => ci.qty > 0)) || (pricingMode !== 'COMBO' && selectedProduct)) && (purchaseSubject === 'SELF' || selectedCustomer) && (
            <div className="rounded-xl p-4" style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd' }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: '#0369a1' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                Thông Tin Giao Hàng
              </div>
              <div className="space-y-3">
                {/* SĐT người nhận — bắt buộc */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#0369a1' }}>
                    Số Điện Thoại Người Nhận <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={e => setRecipientPhone(e.target.value)}
                    placeholder="09xxxxxxxx"
                    className="w-full rounded-lg px-3 py-2 text-sm font-medium outline-none"
                    style={{ border: '1.5px solid #7dd3fc', background: '#fff', color: '#0c4a6e' }}
                  />
                </div>
                {/* Địa chỉ — bắt buộc */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#0369a1' }}>
                    Địa Chỉ Giao Hàng <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                    rows={2}
                    className="w-full rounded-lg px-3 py-2 text-sm font-medium outline-none resize-none"
                    style={{ border: '1.5px solid #7dd3fc', background: '#fff', color: '#0c4a6e' }}
                  />
                </div>
                {/* Email — tùy chọn */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
                    Email <span style={{ color: '#94a3b8' }}>(tuỳ chọn)</span>
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full rounded-lg px-3 py-2 text-sm font-medium outline-none"
                    style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#1e293b' }}
                  />
                </div>
                {/* Hotline — tùy chọn */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#64748b' }}>
                    Hotline Liên Hệ <span style={{ color: '#94a3b8' }}>(tuỳ chọn)</span>
                  </label>
                  <input
                    type="tel"
                    value={contactHotline}
                    onChange={e => setContactHotline(e.target.value)}
                    placeholder="Hotline nếu có"
                    className="w-full rounded-lg px-3 py-2 text-sm font-medium outline-none"
                    style={{ border: '1px solid #e2e8f0', background: '#fff', color: '#1e293b' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || (pricingMode !== 'COMBO' && !selectedProduct) || (pricingMode === 'COMBO' && comboItems.every(ci => ci.qty <= 0)) || (purchaseSubject === 'CUSTOMER' && !selectedCustomer)}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm uppercase tracking-wider transition-all"
            style={{
              background: submitting || (pricingMode !== 'COMBO' && !selectedProduct) || (pricingMode === 'COMBO' && comboItems.every(ci => ci.qty <= 0)) || (purchaseSubject === 'CUSTOMER' && !selectedCustomer)
                ? '#cbd5e1' : '#6366f1',
              cursor: submitting || (pricingMode !== 'COMBO' && !selectedProduct) || (pricingMode === 'COMBO' && comboItems.every(ci => ci.qty <= 0)) || (purchaseSubject === 'CUSTOMER' && !selectedCustomer)
                ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Đang tạo đơn...
              </span>
            ) : (
              '✅ Tạo Đơn Hàng'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
