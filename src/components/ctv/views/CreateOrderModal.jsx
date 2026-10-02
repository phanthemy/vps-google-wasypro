import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, User, Package, Loader2, CheckCircle, AlertCircle, Plus, Minus, Info } from 'lucide-react';

function getCsrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  if (m && m[1]) return decodeURIComponent(m[1]);
  return localStorage.getItem('csrf_token') || '';
}

export default function CreateOrderModal({ currentUser, onClose, onSuccess }) {
  const [purchaseSubject, setPurchaseSubject] = useState('SELF'); // 'SELF' | 'CUSTOMER'
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustJoinCTV, setNewCustJoinCTV] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [detailProduct, setDetailProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  
  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQty = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev => prev.map(item => item.product.id === productId ? { ...item, qty: newQty } : item));
  };


  // NPP Pricing Modes: 'COMBO' | 'RETAIL'
  const [pricingMode, setPricingMode] = useState('RETAIL');
  const [nppCombo, setNppCombo] = useState(null); // { packageName, discountPercent, requiredQuantity, availableProducts: [...] }
  const [comboItems, setComboItems] = useState([]); // [{ productId, productName, price, discountedPrice, qty }]

  // Shipping info
  const [shippingAddress, setShippingAddress] = useState('');
  const [recipientPhone, setRecipientPhone] = useState(currentUser?.phone || '');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [contactHotline, setContactHotline] = useState('');

  // Check if current user is an active NPP
  const isNppUser = !!(currentUser?.nppRank || currentUser?.nppStatus === 'ACTIVE' || currentUser?.isNpp);

  // Load NPP combo info
  useEffect(() => {
    if (isNppUser) {
      fetch('/api/npp/my-combo', { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.hasCombo) {
            setNppCombo(data.combo);
            // Default to COMBO mode when buying for SELF as NPP
            if (purchaseSubject === 'SELF') {
              setPricingMode('COMBO');
            }
            const prods = data.combo.availableProducts || data.combo.items || [];
            setComboItems(prods.map(p => ({
              productId: p.productId,
              productName: p.productName,
              price: p.price,
              discountedPrice: p.discountedPrice,
              qty: 0,
            })));
          }
        })
        .catch(() => {});
    }
  }, [currentUser, isNppUser]);

  // Load products list for retail selection
  useEffect(() => {
    fetch('/api/products', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data.data || []);
        const filtered = list.filter(p => p.price > 0);
        setProducts(filtered);
        
      })
      .catch(() => {});
  }, []);

  // Load customers when CUSTOMER mode is active
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

  // Switch between SELF and CUSTOMER tabs
  const handleSelectSelf = () => {
    setPurchaseSubject('SELF');
    setSelectedCustomer(null);
    setRecipientPhone(currentUser?.phone || '');
    if (nppCombo) {
      setPricingMode('COMBO');
    } else {
      setPricingMode('RETAIL');
    }
  };

  const handleSelectCustomer = () => {
    setPurchaseSubject('CUSTOMER');
    setPricingMode('RETAIL'); // Customers always buy RETAIL
    if (selectedCustomer) {
      setRecipientPhone(selectedCustomer.phone || '');
    } else {
      setRecipientPhone('');
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (!customerSearch) return true;
    const q = customerSearch.toLowerCase();
    return (c.fullName || '').toLowerCase().includes(q) ||
           (c.phone || '').toLowerCase().includes(q);
  });

  // COMBO Calculations
  const requiredComboQty = nppCombo?.requiredQuantity || 5;
  const totalComboQty = comboItems.reduce((s, ci) => s + (ci.qty || 0), 0);
  const isComboQtyValid = totalComboQty === requiredComboQty;
  const comboRetailTotal = comboItems.reduce((sum, ci) => sum + ci.price * (ci.qty || 0), 0);
  const comboTotal = comboItems.reduce((sum, ci) => sum + ci.discountedPrice * (ci.qty || 0), 0);
  const comboDiscountAmount = comboRetailTotal - comboTotal;
  const totalComboCP = comboItems.reduce((sum, ci) => sum + (ci.commissionPoints || 0) * (ci.qty || 0), 0);

  // RETAIL Calculations & Rank-based Policy (Spec v1.4 & AGENTS.md)
  // RULE: No BID = No discount. CTV chưa đạt 5.000 CP → chưa có BID → mua giá niêm yết 100%.
  const hasBID = Boolean(currentUser?.businessId);
  const ctvRank = (currentUser?.rank || '').toUpperCase();
  const isDirector = ctvRank === 'DIRECTOR' || ctvRank === 'SALES_DIRECTOR';
  const isManager = ctvRank === 'MANAGER' || ctvRank === 'SALES_MANAGER';
  const selfDiscountRate = !hasBID ? 0 : (isDirector ? 0.3 : (isManager ? 0.25 : 0.2));
  const selfDiscountPercent = Math.round(selfDiscountRate * 100);
  const ctvRankTitle = !hasBID ? 'Thành viên (0%)' : (isDirector ? 'Quản Lý (30%)' : (isManager ? 'Trưởng Nhóm (25%)' : 'Đại Sứ (20%)'));

  // Customer commission rate:
  // If customer has Business ID: 10% (DIRECT_WITH_ID)
  // If customer does NOT have Business ID: Amb=20%, Mgr=25%, Dir=30% (DIRECT_NO_ID)
  // If CTV itself has no BID: commission rate = 0 (no commission either)
  const customerHasId = Boolean(selectedCustomer?.linkedUser?.businessId || selectedCustomer?.businessId);
  const customerCommissionRate = !hasBID ? 0 : (customerHasId ? 0.10 : selfDiscountRate);
  const customerCommissionTitle = !hasBID 
    ? 'Chưa có BID — không nhận hoa hồng'
    : (customerHasId 
      ? '10% (Khách đã có BID)' 
      : `${ctvRankTitle} (Khách chưa có BID)`);

  const retailRawTotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
  // If SELF in RETAIL mode -> lifetime self-buy discount according to Rank (ONLY if has BID)
  const isSelfRetailDiscount = purchaseSubject === 'SELF' && pricingMode === 'RETAIL' && hasBID;
  const selfDiscountAmount = isSelfRetailDiscount ? Math.round(retailRawTotal * selfDiscountRate) : 0;
  const retailNetTotal = retailRawTotal - selfDiscountAmount;

  const totalCP = cartItems.reduce((sum, item) => sum + ((item.product.commissionPoints || 0) * item.qty), 0);
  const expectedCommission = Math.round(totalCP * customerCommissionRate * 1000);

  // Final total amount depending on active mode
  const totalAmount = (purchaseSubject === 'SELF' && pricingMode === 'COMBO') ? comboTotal : retailNetTotal;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // Validate customer in CUSTOMER mode
      if (purchaseSubject === 'CUSTOMER' && !selectedCustomer) {
        setError('Vui lòng chọn khách hàng.');
        setSubmitting(false);
        return;
      }

      // Validate COMBO quantity in COMBO mode
      if (purchaseSubject === 'SELF' && pricingMode === 'COMBO') {
        if (!isComboQtyValid) {
          setError(`Vui lòng chọn đúng ${requiredComboQty} máy cho gói combo (Hiện tại đã chọn: ${totalComboQty} máy).`);
          setSubmitting(false);
          return;
        }
      }

      // Validate selected product in RETAIL mode
      if (pricingMode !== 'COMBO' && cartItems.length === 0) {
        setError('Vui lòng chọn sản phẩm.');
        setSubmitting(false);
        return;
      }

      // Validate recipient info
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
        pricingMode: purchaseSubject === 'CUSTOMER' ? 'RETAIL' : pricingMode,
        items: (purchaseSubject === 'SELF' && pricingMode === 'COMBO')
          ? comboItems.filter(ci => ci.qty > 0).map(ci => ({ productId: ci.productId, qty: ci.qty }))
          : cartItems.map(ci => ({ productId: ci.product.id, qty: ci.qty })),
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

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center animate-fadeIn shadow-2xl">
          <CheckCircle size={56} className="mx-auto mb-4" style={{ color: '#10b981' }} />
          <h3 className="text-xl font-extrabold" style={{ color: '#065f46' }}>Tạo Đơn Thành Công!</h3>
          <p className="text-sm mt-2" style={{ color: '#64748b' }}>Đơn hàng đã được lưu và gửi tới hệ thống xử lý.</p>
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
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
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

          {/* STEP 1: MUA CHO (Chính Mình vs Khách Hàng) */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Mua cho</label>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={handleSelectSelf}
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
                type="button"
                onClick={handleSelectCustomer}
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

          {/* CHẾ ĐỘ MUA HÀNG CHO NPP: CHỈ HIỂN THỊ KHI CHỌN "CHÍNH MÌNH" VÀ LÀ NPP CÓ COMBO */}
          {purchaseSubject === 'SELF' && nppCombo && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Chế Độ Mua Hàng NPP</label>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setPricingMode('COMBO')}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background: pricingMode === 'COMBO' ? '#dbeafe' : '#f8fafc',
                    color: pricingMode === 'COMBO' ? '#1e40af' : '#64748b',
                    border: pricingMode === 'COMBO' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  }}
                >
                  📦 Combo NPP ({requiredComboQty} máy)
                </button>
                <button
                  type="button"
                  onClick={() => setPricingMode('RETAIL')}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background: pricingMode === 'RETAIL' ? '#fef3c7' : '#f8fafc',
                    color: pricingMode === 'RETAIL' ? '#92400e' : '#64748b',
                    border: pricingMode === 'RETAIL' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                  }}
                >
                  🛍️ Mua Lẻ (Giảm {selfDiscountPercent}%)
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TRƯỜNG HỢP 1: MUA CHO KHÁCH HÀNG (Tab Khách Hàng)                         */}
          {/* ========================================================================= */}
          {purchaseSubject === 'CUSTOMER' && (
            <div className="space-y-4">
              {/* Chọn khách hàng */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Chọn Khách Hàng</label>
                <input
                  type="text"
                  placeholder="🔎 Tìm tên hoặc SĐT khách..."
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  className="w-full mt-2 p-2.5 rounded-xl text-sm"
                  style={{ border: '1px solid #e2e8f0' }}
                />
                {loading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 size={20} className="animate-spin" style={{ color: '#94a3b8' }} />
                  </div>
                )}

                {/* Danh sách khách hàng */}
                {!loading && filteredCustomers.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
                    {filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c);
                          if (c.phone) setRecipientPhone(c.phone);
                        }}
                        className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-blue-50 transition-colors text-sm"
                        style={{
                          background: selectedCustomer?.id === c.id ? '#dbeafe' : 'transparent',
                          borderBottom: '1px solid #f1f5f9',
                        }}
                      >
                        <User size={14} style={{ color: '#6366f1' }} />
                        <div className="flex-1">
                          <div className="font-bold" style={{ color: '#1e293b' }}>{c.fullName}</div>
                          <div className="text-xs" style={{ color: '#94a3b8' }}>{c.phone}</div>
                        </div>
                        {selectedCustomer?.id === c.id && <CheckCircle size={14} style={{ color: '#10b981' }} />}
                      </button>
                    ))}
                  </div>
                )}

                {!loading && filteredCustomers.length === 0 && customerSearch.trim() && (
                  <div className="mt-2 text-sm text-center py-2" style={{ color: '#94a3b8' }}>Không tìm thấy khách hàng</div>
                )}

                {/* Nút Tạo Khách Mới */}
                {!loading && (!showNewCustomerForm ? (
                  <button
                    type="button"
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
                        type="button"
                        disabled={creatingCustomer || !newCustName.trim() || !newCustPhone.trim()}
                        onClick={async () => {
                          setCreatingCustomer(true);
                          try {
                            const csrf = getCsrfToken();
                            const r = await fetch('/api/ctv/customers', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
                              credentials: 'include',
                              body: JSON.stringify({ fullName: newCustName.trim(), phone: newCustPhone.trim(), joinCTV: newCustJoinCTV }),
                            }).then(res => res.json());
                            if (r.success) {
                              setSelectedCustomer(r.customer);
                              setRecipientPhone(r.customer.phone || newCustPhone.trim());
                              setShowNewCustomerForm(false);
                              setNewCustName(''); setNewCustPhone(''); setNewCustJoinCTV(false);
                              setCustomerSearch('');
                              const listRes = await fetch('/api/customers', { credentials: 'include' }).then(res => res.json());
                              if (listRes.success) setCustomers(listRes.data);
                            } else {
                              alert('Lỗi: ' + r.message);
                            }
                          } catch {
                            alert('Lỗi kết nối máy chủ');
                          }
                          setCreatingCustomer(false);
                        }}
                        className="flex-1 py-2 rounded-lg text-sm font-bold text-white transition-all"
                        style={{ background: creatingCustomer || !newCustName.trim() || !newCustPhone.trim() ? '#cbd5e1' : '#10b981' }}
                      >
                        {creatingCustomer ? '⏳ Đang tạo...' : '✅ Tạo'}
                      </button>
                      <button
                        type="button"
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

              {/* Thông báo chính sách bán khách */}
              <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <Info size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#16a34a' }} />
                <div className="text-xs" style={{ color: '#166534' }}>
                  <strong>Bán Cho Khách Lẻ:</strong> Đơn hàng tính theo <strong>Giá Niêm Yết</strong>. Bạn nhận hoa hồng trực tiếp ({customerCommissionTitle}).
                </div>
              </div>

              {/* Chọn sản phẩm lẻ bán khách */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Sản Phẩm</label>
                <div className="mt-2 max-h-56 overflow-y-auto rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
                  {products.map(p => {
                    const cartItem = cartItems.find(item => item.product.id === p.id);
                    const qtyInCart = cartItem ? cartItem.qty : 0;
                    return (
                    <div
                      key={p.id}
                      className="w-full flex items-center justify-between p-3 text-left transition-colors"
                      style={{
                        background: qtyInCart > 0 ? '#eff6ff' : 'transparent',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2 flex-1 cursor-pointer" onClick={() => setDetailProduct(p)}>
                        <div
                          className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5 hover:border-indigo-400 hover:shadow-md"
                          title="Nhấn để xem chi tiết"
                        >
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.title}
                              className="w-full h-full object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <Package size={22} className="text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-slate-800 truncate">{p.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              ⭐ {new Intl.NumberFormat('vi-VN').format(p.commissionPoints || 0)} CP
                            </span>
                            {p.specs?.origin && (
                              <span className="text-[10px] text-slate-400">· {p.specs.origin}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          <div className="font-extrabold text-sm" style={{ color: '#059669' }}>
                            {new Intl.NumberFormat('vi-VN').format(p.price)}đ
                          </div>
                        </div>
                        {qtyInCart > 0 ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); updateCartQty(p.id, qtyInCart - 1); }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-slate-200 text-slate-600"
                            >−</button>
                            <span className="w-6 text-center font-bold">{qtyInCart}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); updateCartQty(p.id, qtyInCart + 1); }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-indigo-500 text-white"
                            >+</button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                            className="px-3 py-1.5 rounded-lg text-sm font-bold bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100"
                          >Thêm</button>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TRƯỜNG HỢP 2: TỰ MUA — COMBO NPP (Được chọn tùy ý đúng số lượng gói)      */}
          {/* ========================================================================= */}
          {purchaseSubject === 'SELF' && pricingMode === 'COMBO' && nppCombo && (
            <div className="space-y-3">
              {/* Thẻ hướng dẫn & đếm số lượng */}
              <div
                className="p-3.5 rounded-xl transition-all"
                style={{
                  background: isComboQtyValid ? '#f0fdf4' : (totalComboQty < requiredComboQty ? '#fffbeb' : '#fef2f2'),
                  border: isComboQtyValid ? '1.5px solid #86efac' : (totalComboQty < requiredComboQty ? '1.5px solid #fde68a' : '1.5px solid #fca5a5'),
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wide" style={{ color: '#1e3a8a' }}>
                      📦 {nppCombo.packageName} (Chiết khấu -{nppCombo.discountPercent}%)
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                      Chọn tùy ý các mẫu máy dưới đây, tổng đúng <strong>{requiredComboQty} máy</strong>.
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className="inline-block px-2.5 py-1 rounded-full text-xs font-black"
                      style={{
                        background: isComboQtyValid ? '#10b981' : (totalComboQty < requiredComboQty ? '#f59e0b' : '#ef4444'),
                        color: '#fff',
                      }}
                    >
                      {totalComboQty} / {requiredComboQty} máy
                    </span>
                  </div>
                </div>

                {/* Trạng thái nhắc nhở số lượng */}
                <div className="mt-2 text-xs font-bold">
                  {isComboQtyValid && (
                    <span style={{ color: '#16a34a' }}>✅ Đã chọn chuẩn xác {requiredComboQty} máy. Sẵn sàng tạo đơn!</span>
                  )}
                  {totalComboQty < requiredComboQty && (
                    <span style={{ color: '#b45309' }}>⏳ Vui lòng chọn thêm {requiredComboQty - totalComboQty} máy nữa để đủ gói.</span>
                  )}
                  {totalComboQty > requiredComboQty && (
                    <span style={{ color: '#dc2626' }}>⚠️ Đang vượt quá {totalComboQty - requiredComboQty} máy so với gói {requiredComboQty} máy!</span>
                  )}
                </div>
              </div>

              {/* Danh sách máy để NPP tự do chọn */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>
                  Danh Sách Các Loại Máy Lựa Chọn
                </label>
                <div className="mt-2 max-h-56 overflow-y-auto rounded-xl" style={{ border: '1px solid #bfdbfe' }}>
                  {comboItems.map((ci, idx) => (
                    <div
                      key={ci.productId}
                      className="flex items-center justify-between p-3 transition-colors"
                      style={{
                        borderBottom: idx < comboItems.length - 1 ? '1px solid #f1f5f9' : 'none',
                        background: ci.qty > 0 ? '#eff6ff' : '#ffffff',
                      }}
                    >
                      <div 
                        className="flex items-center gap-3 flex-1 min-w-0 pr-2 cursor-pointer"
                        onClick={() => {
                          const prod = products.find(p => p.id === ci.productId);
                          if (prod) setDetailProduct(prod);
                        }}
                      >
                        <div
                          className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5 hover:border-indigo-400 hover:shadow-md"
                          title="Nhấn để xem chi tiết sản phẩm"
                        >
                          {ci.image ? (
                            <img
                              src={ci.image}
                              alt={ci.productName}
                              className="w-full h-full object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <Package size={22} className="text-blue-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-slate-800 truncate">{ci.productName}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-extrabold text-slate-700">
                              {new Intl.NumberFormat('vi-VN').format(ci.price)}đ
                            </span>
                            {ci.commissionPoints > 0 && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                ⭐ {new Intl.NumberFormat('vi-VN').format(ci.commissionPoints)} CP
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const next = [...comboItems];
                            next[idx] = { ...next[idx], qty: Math.max(0, (next[idx].qty || 0) - 1) };
                            setComboItems(next);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base transition-colors"
                          style={{ background: '#e2e8f0', color: '#475569' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-black text-sm" style={{ color: ci.qty > 0 ? '#1d4ed8' : '#64748b' }}>
                          {ci.qty || 0}
                        </span>
                        <button
                          type="button"
                          disabled={totalComboQty >= requiredComboQty}
                          onClick={() => {
                            if (totalComboQty < requiredComboQty) {
                              const next = [...comboItems];
                              next[idx] = { ...next[idx], qty: (next[idx].qty || 0) + 1 };
                              setComboItems(next);
                            }
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-base transition-colors"
                          style={{
                            background: totalComboQty >= requiredComboQty ? '#cbd5e1' : '#3b82f6',
                            color: '#fff',
                            cursor: totalComboQty >= requiredComboQty ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TRƯỜNG HỢP 3: TỰ MUA — MUA LẺ (Giảm theo cấp bậc trực tiếp vào đơn hàng suốt đời) */}
          {purchaseSubject === 'SELF' && pricingMode === 'RETAIL' && (
            <div className="space-y-3">
              {/* Thông báo giảm giá tự mua theo cấp bậc */}
              <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                <Info size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#d97706' }} />
                <div className="text-xs" style={{ color: '#92400e' }}>
                  <strong>Chính Sách Tự Mua ({ctvRankTitle}):</strong> Mua lẻ cho chính mình được <strong>giảm ngay {selfDiscountPercent}%</strong> trực tiếp vào đơn hàng suốt đời.
                </div>
              </div>

              {/* Chọn sản phẩm */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>Sản Phẩm</label>
                <div className="mt-2 max-h-56 overflow-y-auto rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
                  {products.map(p => {
                    const cartItem = cartItems.find(item => item.product.id === p.id);
                    const qtyInCart = cartItem ? cartItem.qty : 0;
                    return (
                    <div
                      key={p.id}
                      className="w-full flex items-center justify-between p-3 text-left transition-colors"
                      style={{
                        background: qtyInCart > 0 ? '#fef3c7' : 'transparent',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2 flex-1 cursor-pointer" onClick={() => setDetailProduct(p)}>
                        <div
                          className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5 hover:border-amber-400 hover:shadow-md"
                          title="Nhấn để xem chi tiết"
                        >
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.title}
                              className="w-full h-full object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <Package size={22} className="text-amber-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-slate-800 truncate">{p.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              ⭐ {new Intl.NumberFormat('vi-VN').format(p.commissionPoints || 0)} CP
                            </span>
                            {p.specs?.origin && (
                              <span className="text-[10px] text-slate-400">· {p.specs.origin}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right flex flex-col items-end">
                          <div className="font-extrabold text-sm" style={{ color: '#059669' }}>
                            {new Intl.NumberFormat('vi-VN').format(p.price)}đ
                          </div>
                        </div>
                        {qtyInCart > 0 ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); updateCartQty(p.id, qtyInCart - 1); }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-slate-200 text-slate-600"
                            >−</button>
                            <span className="w-6 text-center font-bold">{qtyInCart}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); updateCartQty(p.id, qtyInCart + 1); }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-amber-500 text-white"
                            >+</button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                            className="px-3 py-1.5 rounded-lg text-sm font-bold bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100"
                          >Thêm</button>
                        )}
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TÓM TẮT ĐƠN HÀNG                                                          */}
          {/* ========================================================================= */}
          {((purchaseSubject === 'SELF' && pricingMode === 'COMBO' && totalComboQty > 0) ||
            (purchaseSubject === 'SELF' && pricingMode === 'RETAIL' && cartItems.length > 0) ||
            (purchaseSubject === 'CUSTOMER' && cartItems.length > 0 && selectedCustomer)) && (
            <div className="rounded-xl p-4" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>Tóm Tắt Đơn Hàng</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: '#64748b' }}>Loại đơn</span>
                  <span className="font-bold" style={{ color: purchaseSubject === 'SELF' ? '#7c3aed' : '#2563eb' }}>
                    {purchaseSubject === 'SELF' ? (pricingMode === 'COMBO' ? '📦 Tự mua Combo NPP' : '🛒 Tự mua lẻ CTV') : '👤 Khách hàng mua'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span style={{ color: '#64748b' }}>Người tạo đơn</span>
                  <span className="font-bold" style={{ color: '#1e293b' }}>{currentUser.fullName}</span>
                </div>

                {purchaseSubject === 'CUSTOMER' && selectedCustomer && (
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>Khách hàng</span>
                    <span className="font-bold" style={{ color: '#1e293b' }}>{selectedCustomer.fullName} ({selectedCustomer.phone})</span>
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <span style={{ color: '#64748b' }}>Sản phẩm</span>
                  <div className="text-right flex flex-col items-end gap-1" style={{ color: '#1e293b' }}>
                    {purchaseSubject === 'SELF' && pricingMode === 'COMBO'
                      ? comboItems.filter(ci => ci.qty > 0).map((ci, idx) => (
                        <div key={idx} className="font-bold text-sm leading-relaxed">
                          {ci.productName} (x{ci.qty})
                        </div>
                      ))
                      : cartItems.map((ci, idx) => (
                        <div key={idx} className="font-bold text-sm leading-relaxed">
                          {ci.product.title} (x{ci.qty})
                        </div>
                      ))}
                  </div>
                </div>

                {/* Điểm sản phẩm CP hiển thị rõ ràng theo yêu cầu của Sếp */}
                <div className="flex justify-between items-center py-1.5 px-3 rounded-lg" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                  <span className="font-bold text-xs" style={{ color: '#b45309' }}>⭐ Điểm tích lũy (CP)</span>
                  <span className="font-black text-sm" style={{ color: '#d97706' }}>
                    {purchaseSubject === 'SELF' && pricingMode === 'COMBO'
                      ? `${new Intl.NumberFormat('vi-VN').format(totalComboCP)} CP`
                      : `${new Intl.NumberFormat('vi-VN').format(totalCP)} CP`}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span style={{ color: '#64748b' }}>Số lượng</span>
                  <span className="font-bold">
                    {purchaseSubject === 'SELF' && pricingMode === 'COMBO' ? `${totalComboQty} máy` : `${cartItems.reduce((sum, item) => sum + item.qty, 0)} cái`}
                  </span>
                </div>

                {/* Chiết khấu COMBO NPP */}
                {purchaseSubject === 'SELF' && pricingMode === 'COMBO' && (
                  <>
                    <div className="flex justify-between">
                      <span style={{ color: '#64748b' }}>Giá gốc niêm yết</span>
                      <span className="line-through" style={{ color: '#94a3b8' }}>
                        {new Intl.NumberFormat('vi-VN').format(comboRetailTotal)}đ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#16a34a' }}>Chiết khấu Combo (-{nppCombo?.discountPercent}%)</span>
                      <span className="font-bold" style={{ color: '#16a34a' }}>
                        -{new Intl.NumberFormat('vi-VN').format(comboDiscountAmount)}đ
                      </span>
                    </div>
                  </>
                )}

                {/* Chiết khấu tự mua RETAIL (20%) */}
                {purchaseSubject === 'SELF' && pricingMode === 'RETAIL' && (
                  <>
                    <div className="flex justify-between">
                      <span style={{ color: '#64748b' }}>Giá niêm yết</span>
                      <span className="line-through" style={{ color: '#94a3b8' }}>
                        {new Intl.NumberFormat('vi-VN').format(retailRawTotal)}đ
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#d97706' }}>Giảm {selfDiscountPercent}% tự mua ({ctvRankTitle})</span>
                      <span className="font-bold" style={{ color: '#d97706' }}>
                        -{new Intl.NumberFormat('vi-VN').format(selfDiscountAmount)}đ
                      </span>
                    </div>
                  </>
                )}

                {/* Tổng thanh toán */}
                <div className="flex justify-between pt-2" style={{ borderTop: '1px dashed #e2e8f0' }}>
                  <span className="font-extrabold text-base" style={{ color: '#1e293b' }}>Tổng tiền thanh toán</span>
                  <span className="font-black text-lg" style={{ color: '#059669' }}>
                    {new Intl.NumberFormat('vi-VN').format(totalAmount)}đ
                  </span>
                </div>

                {/* Hoa hồng CTV dự kiến khi bán cho khách */}
                {purchaseSubject === 'CUSTOMER' && expectedCommission > 0 && (
                  <div className="flex justify-between pt-1">
                    <span style={{ color: '#6366f1' }}>Hoa hồng CTV dự kiến ({customerCommissionTitle})</span>
                    <span className="font-bold" style={{ color: '#4f46e5' }}>
                      +{new Intl.NumberFormat('vi-VN').format(expectedCommission)}đ
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* THÔNG TIN GIAO HÀNG                                                       */}
          {/* ========================================================================= */}
          {((purchaseSubject === 'SELF' && pricingMode === 'COMBO' && totalComboQty > 0) ||
            (purchaseSubject === 'SELF' && pricingMode === 'RETAIL' && cartItems.length > 0) ||
            (purchaseSubject === 'CUSTOMER' && cartItems.length > 0 && selectedCustomer)) && (
            <div className="rounded-xl p-4" style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd' }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: '#0369a1' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                Thông Tin Giao Hàng
              </div>
              <div className="space-y-3">
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

          {/* ========================================================================= */}
          {/* NÚT TẠO ĐƠN HÀNG (SUBMIT)                                                 */}
          {/* ========================================================================= */}
          {(() => {
            const isComboInvalid = purchaseSubject === 'SELF' && pricingMode === 'COMBO' && !isComboQtyValid;
            const isRetailInvalid = pricingMode !== 'COMBO' && cartItems.length === 0;
            const isCustomerMissing = purchaseSubject === 'CUSTOMER' && !selectedCustomer;
            const isShippingMissing = !recipientPhone.trim() || !shippingAddress.trim();
            const isDisabled = submitting || isComboInvalid || isRetailInvalid || isCustomerMissing || isShippingMissing;

            let buttonLabel = '✅ Tạo Đơn Hàng';
            if (submitting) {
              buttonLabel = '⏳ Đang tạo đơn...';
            } else if (purchaseSubject === 'SELF' && pricingMode === 'COMBO') {
              if (totalComboQty !== requiredComboQty) {
                buttonLabel = `Vui lòng chọn đúng ${requiredComboQty} máy (${totalComboQty}/${requiredComboQty})`;
              } else {
                buttonLabel = `✅ Tạo Đơn Combo (${requiredComboQty} máy)`;
              }
            } else if (purchaseSubject === 'SELF' && pricingMode === 'RETAIL') {
              buttonLabel = `✅ Tạo Đơn Tự Mua (Giảm ${selfDiscountPercent}%)`;
            } else if (purchaseSubject === 'CUSTOMER') {
              if (!selectedCustomer) {
                buttonLabel = 'Vui lòng chọn khách hàng';
              } else {
                buttonLabel = '✅ Tạo Đơn Cho Khách Hàng';
              }
            }

            return (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isDisabled}
                className="w-full py-3.5 rounded-xl font-black text-white text-sm uppercase tracking-wider transition-all"
                style={{
                  background: isDisabled ? '#cbd5e1' : '#6366f1',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  boxShadow: isDisabled ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)',
                }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Đang tạo đơn...
                  </span>
                ) : (
                  buttonLabel
                )}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Product Detail Popup */}
      {detailProduct && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} onClick={() => setDetailProduct(null)}>
          <div className="bg-white rounded-2xl w-full shadow-2xl overflow-hidden flex flex-col relative" style={{ maxWidth: '540px', maxHeight: '88vh' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/90 sticky top-0 z-10">
              <h3 className="font-extrabold text-base text-slate-900 truncate pr-4">Thông tin chi tiết sản phẩm</h3>
              <button 
                onClick={() => setDetailProduct(null)} 
                className="p-1.5 bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Product Image */}
              <div className="w-full flex items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100" style={{ minHeight: '180px' }}>
                {detailProduct.image ? (
                  <img src={detailProduct.image} alt={detailProduct.title} className="object-contain drop-shadow-md" style={{ maxHeight: '180px', width: 'auto' }} />
                ) : (
                  <Package size={64} className="text-slate-300" />
                )}
              </div>

              {/* Title & Badges */}
              <div>
                <h2 className="font-extrabold text-lg text-slate-900 leading-snug">{detailProduct.title}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(detailProduct.category?.name || (typeof detailProduct.category === 'string' && detailProduct.category)) && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                      {detailProduct.category?.name || detailProduct.category}
                    </span>
                  )}
                  {detailProduct.commissionPoints > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      ⭐ {new Intl.NumberFormat('vi-VN').format(detailProduct.commissionPoints)} CP
                    </span>
                  )}
                  {detailProduct.specs?.origin && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                      🌍 {detailProduct.specs.origin}
                    </span>
                  )}
                </div>
              </div>

              {/* Technical Specifications */}
              {detailProduct.specs && (detailProduct.specs.pH || detailProduct.specs.hydrogenPpb || detailProduct.specs.filterCount || detailProduct.specs.warrantyYears) && (
                <div className="rounded-xl p-3 bg-slate-50 border border-slate-100">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Thông số kỹ thuật</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {detailProduct.specs.pH && (
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">Độ pH</span>
                        <span className="font-bold text-blue-600">{detailProduct.specs.pH}</span>
                      </div>
                    )}
                    {detailProduct.specs.hydrogenPpb && (
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">Nồng độ Hydrogen</span>
                        <span className="font-bold text-purple-600">{detailProduct.specs.hydrogenPpb}</span>
                      </div>
                    )}
                    {detailProduct.specs.filterCount && (
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">Số lõi lọc</span>
                        <span className="font-bold text-orange-600">{detailProduct.specs.filterCount} lõi</span>
                      </div>
                    )}
                    {detailProduct.specs.warrantyYears && (
                      <div className="bg-white p-2 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[10px]">Bảo hành</span>
                        <span className="font-bold text-emerald-600">{detailProduct.specs.warrantyYears} năm chính hãng</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mô tả sản phẩm</div>
                <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto pr-1">
                  {detailProduct.description || "Chưa có mô tả chi tiết."}
                </div>
              </div>
            </div>

            {/* Footer with Price and Add Button */}
            <div className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-between sticky bottom-0">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Giá gốc niêm yết</div>
                <div className="text-xl font-black text-emerald-600">
                  {new Intl.NumberFormat('vi-VN').format(detailProduct.price)}đ
                </div>
              </div>
              <button
                onClick={() => {
                  addToCart(detailProduct);
                  setDetailProduct(null);
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-white text-sm bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors"
              >
                🛒 Thêm vào đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
