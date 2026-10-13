import React, { useState } from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { CartItem } from '../hooks/useCart';

interface CheckoutModalProps {
  isOpen: boolean;
  user?: { fullName?: string; phone?: string; address?: string } | null;
  onClose: () => void;
  items: CartItem[];
  totalAmount: number;
  onSuccess: () => void;
}

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
};

// Kiểm tra tài khoản Zalo Reviewer (bypass Zalo SDK, dùng COD trực tiếp)
const isReviewerPhone = (phone?: string | null): boolean => {
  if (!phone) return false;
  const p = phone.replace(/\s+/g, '');
  return ['0768068594', '0768068930'].includes(p); // 0831111111 removed: reviewer cần test đúng Zalo SDK flow
};

// Detect xem đang trong Zalo Mini App (iframe của ZMP WebView)
const isInZaloWebView = (): boolean => {
  const ua = (navigator.userAgent || '').toLowerCase();
  // Zalo WebView inject UA string chứa 'zalo' hoặc 'miniapp'
  return ua.includes('zalo') || ua.includes('miniapp') || ua.includes('zmp');
};

// Gửi postMessage lên parent app.js và chờ response
const callZaloPaymentBridge = (params: {
  amount: number; desc: string; item: string;
  extradata: string; method: string; mac: string;
}): Promise<{ orderId: string }> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error('TIMEOUT'));
    }, 30000);

    function handler(event: MessageEvent) {
      const d = event.data;
      if (!d || d.type !== 'ZALO_CHECKOUT_RESPONSE') return;
      window.removeEventListener('message', handler);
      clearTimeout(timeout);
      if (d.success) resolve({ orderId: d.orderId || '' });
      else reject(new Error(d.error || 'PAYMENT_FAIL'));
    }

    window.addEventListener('message', handler);
    // Gửi lên parent (app.js của Zalo Mini App)
    window.parent.postMessage({ type: 'ZALO_CHECKOUT_REQUEST', ...params }, '*');
  });
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen, onClose, items, totalAmount, onSuccess, user
}) => {
  const [formData, setFormData] = useState({
    customerName: user?.fullName || '',
    customerPhone: user?.phone || '',
    address: user?.address || '',
    note: '',
    wantInvoice: false, companyName: '', taxCode: '',
    companyAddr: '', invoiceEmail: '', paymentMethod: 'COD'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const validate = () => {
    if (!formData.customerName) return 'Vui lòng nhập họ và tên.';
    if (!/^0\d{9}$/.test(formData.customerPhone)) return 'Số điện thoại không hợp lệ.';
    if (!formData.address) return 'Vui lòng nhập địa chỉ giao hàng.';
    if (formData.wantInvoice) {
      if (!formData.companyName) return 'Vui lòng nhập tên công ty.';
      if (!formData.taxCode) return 'Vui lòng nhập mã số thuế.';
      if (!formData.companyAddr) return 'Vui lòng nhập địa chỉ công ty.';
      if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.invoiceEmail)) return 'Email không hợp lệ.';
    }
    return null;
  };

  const createInternalOrder = async (zaloOrderId?: string, sdkStatus?: string) => {
    const refCode = new URLSearchParams(window.location.search).get('ref') || undefined;
    const res = await fetch('/api/orders/website', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        address: formData.address,
        message: formData.note + (sdkStatus ? ` [ZaloSDK:${sdkStatus}]` : ''),
        type: 'ORDER',
        productId: items[0]?.productId,
        productTitle: items.map(i => i.title + ' x' + i.quantity).join(', '),
        productPrice: items[0]?.price || 0,
        qty: items.reduce((s, i) => s + i.quantity, 0),
        totalAmount,
        wantInvoice: formData.wantInvoice,
        companyName: formData.companyName,
        taxCode: formData.taxCode,
        companyAddr: formData.companyAddr,
        invoiceEmail: formData.invoiceEmail,
        items: items.map(i => ({
          productId: i.productId, productTitle: i.title,
          productPrice: i.price, qty: i.quantity,
          totalAmount: i.price * i.quantity
        })),
        refCode,
        zaloOrderId: zaloOrderId || null
      })
    });
    if (!res.ok) throw new Error('Có lỗi xảy ra, vui lòng thử lại.');
  };

  // Detect Zalo Mini App context - 4 signals (priority order):
  // 1. URL param ?_zmp=1 (set by app.js when loading iframe)
  // 2. localStorage _zmp=1 (persists across full-page reloads in Zalo WebView)
  // 3. sessionStorage _zmp=1 (fallback)
  // 4. User-Agent contains zalo/miniapp/zmp (Zalo WebView UA signature)
  const isZaloMiniApp = (() => {
    if (typeof window === 'undefined') return false;
    // Signal 1: URL param
    const fromUrl = new URLSearchParams(window.location.search).get('_zmp') === '1';
    if (fromUrl) {
      try { localStorage.setItem('_zmp', '1'); } catch(e) {}
      try { sessionStorage.setItem('_zmp', '1'); } catch(e) {}
      return true;
    }
    // Signal 2: localStorage (survives full page reload in Zalo WebView)
    try { if (localStorage.getItem('_zmp') === '1') return true; } catch(e) {}
    // Signal 3: sessionStorage fallback
    try { if (sessionStorage.getItem('_zmp') === '1') return true; } catch(e) {}
    // Signal 4: User-Agent based detection (Zalo WebView injects UA signature)
    const ua = (navigator.userAgent || '').toLowerCase();
    if (ua.includes('zalo') || ua.includes('miniapp') || ua.includes('zmp')) {
      try { localStorage.setItem('_zmp', '1'); } catch(e) {}
      try { sessionStorage.setItem('_zmp', '1'); } catch(e) {}
      return true;
    }
    return false;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      if (isZaloMiniApp && !isReviewerPhone(user?.phone)) {
        // ── Zalo Mini App mode: dùng postMessage bridge ──
        // Bước 1: Lấy MAC từ backend
        // QUAN TRỌNG: item array phải {id, name, price, quantity} đúng kiểu số
        const itemArr = items.map(i => ({
          id: String(i.productId),
          name: String(i.title).substring(0, 50),
          price: Math.round(Number(i.price)),
          quantity: Number(i.quantity)
        }));
        const METHOD_STR = '{"id":"COD","isCustom":false}'; // string cố định
        const desc = 'WasyPro - ' + items.map(i => i.title).join(', ').substring(0, 80);
        // extradata phải là string JSON đơn giản (không có ký tự đặc biệt gây lỗi hash)
        const extradata = JSON.stringify({
          customerName: String(formData.customerName || ''),
          customerPhone: String(formData.customerPhone || ''),
          address: String(formData.address || '')
        });

        // Backend tính MAC với format: amount, desc, extradata, item, method (alphabetical sort)
        const macRes = await fetch('/api/zalo-checkout/create-mac', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(Number(totalAmount)),
            desc,
            item: JSON.stringify(itemArr),   // string cho MAC backend
            extradata,                        // JSON string
            method: METHOD_STR                // string cố định, KHÔNG JSON.stringify lại
          }),
        });
        const macData = await macRes.json();
        if (!macData.mac) throw new Error('Không tạo được mã thanh toán: ' + JSON.stringify(macData));

        // Bước 2: Gửi sang app.js bridge để gọi createOrder native
        // QUAN TRỌNG: item phải là array (không stringify) vì zmp-sdk yêu cầu array
        const zaloOrderId = await new Promise<string>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Quá thời gian chờ phản hồi từ Zalo')), 30000);
          const handler = (event: MessageEvent) => {
            if (event.data?.type === 'ZALO_CHECKOUT_RESULT') {
              clearTimeout(timeout);
              window.removeEventListener('message', handler);
              if (event.data.success) resolve(event.data.orderId || '');
              else reject(new Error(event.data.error || 'Thanh toán thất bại'));
            }
          };
          window.addEventListener('message', handler);
          window.parent.postMessage({
            type: 'ZALO_CHECKOUT_REQUEST',
            payload: {
              amount: Math.round(Number(totalAmount)),
              desc,
              item: itemArr,        // array (app.js sẽ pass vào createOrder)
              mac: macData.mac,
              extradata,
              method: METHOD_STR    // string nhất quán với MAC
            },
          }, '*');
        });

        // Bước 3: Lưu đơn hàng nội bộ
        await createInternalOrder(zaloOrderId, 'payment-success');
      } else {
        // ── Web thường: COD trực tiếp ──
        await createInternalOrder();
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[60] bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-sky-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Đặt Hàng Thành Công!</h2>
          <p className="text-gray-600 mb-6">Cảm ơn bạn đã mua sắm. Chúng tôi sẽ sớm liên hệ để xác nhận đơn hàng.</p>
          <button onClick={() => { onSuccess(); onClose(); }} className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-opacity-90 transition-all">
            Quay Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88dvh] overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-50 px-4 py-3 sm:px-6 sm:py-3.5 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 shadow-2xs">
          <h2 className="text-base sm:text-lg font-bold text-gray-800">Thanh Toán & Đặt Hàng</h2>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 flex items-center justify-center transition-all cursor-pointer shrink-0">
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row overscroll-contain">
          {/* Order Summary */}
          <div className="w-full md:w-1/3 bg-gray-50 p-5 sm:p-6 border-b md:border-b-0 md:border-r border-gray-200">
            <h3 className="text-base font-bold mb-4 text-gray-800">Tóm tắt đơn hàng</h3>
            <div className="flex flex-col gap-3 mb-6">
              {items.map(item => (
                <div key={item.productId} className="flex gap-3">
                  <div className="relative">
                    <img src={item.image} alt={item.title} className="w-14 h-14 object-cover rounded-md border" />
                    <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">{item.quantity}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2 text-gray-800">{item.title}</p>
                    <p className="text-primary text-sm font-semibold">{formatVND(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t flex justify-between items-center font-bold text-base sm:text-lg">
              <span>Tổng cộng:</span>
              <span className="text-primary">{formatVND(totalAmount)}</span>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="w-full md:w-2/3 p-5 sm:p-6 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-gray-800">Thông tin giao hàng</h3>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                  <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                  <input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="09..." />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng *</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (Tùy chọn)</label>
                <textarea name="note" value={formData.note} onChange={handleChange} rows={2} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="Ghi chú về đơn hàng..." />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="wantInvoice" checked={formData.wantInvoice} onChange={handleChange} className="w-4 h-4 text-primary rounded" />
                  <span className="font-medium text-gray-700">Xuất hóa đơn công ty</span>
                </label>
              </div>
              {formData.wantInvoice && (
                <div className="p-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Tên công ty *</label><input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full p-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế *</label><input type="text" name="taxCode" value={formData.taxCode} onChange={handleChange} className="w-full p-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Email nhận HĐ *</label><input type="email" name="invoiceEmail" value={formData.invoiceEmail} onChange={handleChange} className="w-full p-2 border rounded-lg" /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ công ty *</label><input type="text" name="companyAddr" value={formData.companyAddr} onChange={handleChange} className="w-full p-2 border rounded-lg" /></div>
                </div>
              )}
              <div className="mt-2 p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
                <h4 className="font-semibold text-blue-950 mb-2.5 text-sm">Phương thức thanh toán <span className="text-rose-500">*</span></h4>
                <label htmlFor="payment-cod" className="flex items-center gap-3 p-3.5 bg-white border-2 border-primary rounded-xl cursor-pointer select-none">
                  <input type="radio" id="payment-cod" name="paymentMethod" value="COD" checked={formData.paymentMethod === 'COD'} onChange={handleChange} className="w-5 h-5 accent-primary" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800 text-sm">Thanh toán khi nhận hàng (COD)</p>
                      <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">Mặc định</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">Kiểm tra hàng trước khi thanh toán</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                </label>
              </div>
              <button type="submit" disabled={loading} className="mt-4 w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-opacity-90 disabled:bg-gray-400 flex justify-center items-center gap-2 transition-all shadow-md text-lg">
                {loading ? <Loader2 className="animate-spin" size={24} /> : 'ĐẶT MUA'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
