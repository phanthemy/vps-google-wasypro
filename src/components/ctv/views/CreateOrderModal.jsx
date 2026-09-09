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
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

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
      const body = {
        purchaseSubject,
        items: [{ productId: selectedProduct.id, qty }],
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

  const totalAmount = selectedProduct ? selectedProduct.price * qty : 0;
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
              ) : (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-xl" style={{ border: '1px solid #e2e8f0' }}>
                  {filteredCustomers.length === 0 ? (
                    <div className="p-3 text-center text-sm" style={{ color: '#94a3b8' }}>Không tìm thấy khách hàng</div>
                  ) : filteredCustomers.map(c => (
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
            </div>
          )}

          {/* STEP 2: Product Selection */}
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
                    <div className="font-bold text-sm" style={{ color: '#059669' }}>
                      {new Intl.NumberFormat('vi-VN').format(p.price)}đ
                    </div>
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
          {selectedProduct && (purchaseSubject === 'SELF' || selectedCustomer) && (
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
                  <span className="font-bold" style={{ color: '#1e293b' }}>{selectedProduct.title}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#64748b' }}>Số lượng</span>
                  <span className="font-bold">{qty}</span>
                </div>
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

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedProduct || (purchaseSubject === 'CUSTOMER' && !selectedCustomer)}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm uppercase tracking-wider transition-all"
            style={{
              background: submitting || !selectedProduct || (purchaseSubject === 'CUSTOMER' && !selectedCustomer)
                ? '#cbd5e1' : '#6366f1',
              cursor: submitting || !selectedProduct || (purchaseSubject === 'CUSTOMER' && !selectedCustomer)
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
