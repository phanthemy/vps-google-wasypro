import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, PhoneCall, User, Phone, MapPin, MessageSquare, Send, ShieldCheck, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { Product } from '../types/schema';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct?: Product | null;
  onSuccessToast: (msg: string) => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  selectedProduct,
  onSuccessToast,
}) => {
  const isOrderMode = !!selectedProduct;

  // CHECK: If logged-in user is CTV with rank → block website order, redirect to CTV Portal
  const [ctvCheckDone, setCtvCheckDone] = useState(false);
  const [isCtvWithRank, setIsCtvWithRank] = useState(false);
  const [ctvRankLabel, setCtvRankLabel] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    hotline: '',
    address: '',
    message: selectedProduct ? '' : 'Tôi muốn đăng ký tư vấn máy lọc nước Hydrogen ion kiềm tận nơi.',
    qty: 1,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Reset/sync form data when modal opens or selectedProduct changes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setFormData(prev => ({
        ...prev,
        qty: 1,
        message: selectedProduct ? '' : 'Tôi muốn đăng ký tư vấn máy lọc nước Hydrogen ion kiềm tận nơi.',
      }));
    }
  }, [isOpen, selectedProduct]);

  useEffect(() => {
    if (!isOpen || !isOrderMode) { setCtvCheckDone(true); return; }
    setCtvCheckDone(false);
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const u = d.user || d.data;
        if (d.success && u && u.rank && u.isSystemParticipant) {
          setIsCtvWithRank(true);
          const r = (u.rank || '').toUpperCase();
          setCtvRankLabel(r === 'DIRECTOR' ? 'Quản lý' : r === 'MANAGER' ? 'Trưởng nhóm' : 'Đại sứ');
        } else {
          setIsCtvWithRank(false);
        }
      })
      .catch(() => setIsCtvWithRank(false))
      .finally(() => setCtvCheckDone(true));
  }, [isOpen, isOrderMode]);

  // ALL EARLY RETURNS MUST HAPPEN AFTER ALL HOOKS
  if (!isOpen) return null;

  // Wait for CTV check before rendering anything
  if (isOrderMode && !ctvCheckDone) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-md">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500">Đang kiểm tra...</p>
        </div>
      </div>
    );
  }

  if (isOrderMode && isCtvWithRank) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/70 backdrop-blur-md" onClick={onClose}>
        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 text-center space-y-5 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center shadow-lg border border-gray-200">
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Bạn đã là {ctvRankLabel} WasyPro!</h2>
          <p className="text-sm text-slate-500">
            Để hưởng đầy đủ quyền lợi hoa hồng và quản lý đơn hàng, vui lòng đặt hàng qua <strong>CTV Portal</strong>.
          </p>
          <a
            href="/ctv"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            <ShoppingBag className="w-4 h-4" />
            Vào CTV Portal Đặt Hàng
          </a>
          <button onClick={onClose} className="block mx-auto text-xs text-slate-400 hover:text-slate-600 font-semibold">
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!formData.name.trim()) { setError('Vui lòng nhập họ và tên.'); return; }
    if (!formData.phone || !phoneRegex.test(formData.phone.trim())) { setError('Số điện thoại không đúng định dạng.'); return; }
    if (isOrderMode && !formData.address.trim()) { setError('Vui lòng nhập địa chỉ giao hàng đầy đủ.'); return; }

    setIsLoading(true);
    try {
      const payload = {
        customerName: formData.name.trim(),
        customerPhone: formData.phone.trim(),
        address: formData.address.trim(),
        shippingAddress: formData.address.trim(),
        recipientPhone: formData.phone.trim(),
        recipientEmail: formData.email.trim() || null,
        contactHotline: formData.hotline.trim() || null,
        message: formData.message.trim(),
        type: isOrderMode ? 'ORDER' : 'CONSULTATION',
        productId: selectedProduct?.id || null,
        productTitle: selectedProduct?.title || null,
        productPrice: selectedProduct?.price || 0,
        qty: formData.qty,
      };

      const res = await fetch('/api/orders/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('Gửi thất bại, vui lòng thử lại.');
      
      onSuccessToast(isOrderMode 
        ? `Đặt hàng thành công! Chúng tôi sẽ liên hệ xác nhận đơn hàng "${selectedProduct?.title}" trong 5 phút.`
        : 'Đã gửi yêu cầu tư vấn thành công! Chuyên viên WASY PRO sẽ gọi lại trong 5 phút.'
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    if (!amount || amount <= 0) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/70 backdrop-blur-md overflow-y-auto" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-lg rounded-md overflow-y-auto max-h-[90vh] shadow-xl relative animate-in fade-in zoom-in duration-200 my-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="fixed sm:absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center shadow-lg transition-all border border-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`p-6 text-white text-center relative overflow-hidden ${isOrderMode ? 'bg-primary' : 'bg-primary-darker'}`}>
          <div className="w-12 h-12 rounded-md bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-3">
            {isOrderMode ? <ShoppingBag className="w-6 h-6 text-accent" /> : <PhoneCall className="w-6 h-6 text-accent animate-pulse" />}
          </div>
          <h3 className="text-xl font-heading font-extrabold uppercase">
            {isOrderMode ? 'Đặt Hàng Ngay' : 'Đăng Ký Tư Vấn & Lắp Đặt'}
          </h3>
          <p className="text-[13px] text-gray-200 mt-1 max-w-xs mx-auto">
            {isOrderMode ? 'Điền thông tin để chúng tôi xác nhận đơn hàng nhanh nhất.' : 'Hỗ trợ miễn phí kiểm tra nguồn nước & khảo sát vị trí lắp đặt tại nhà.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 bg-white">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-[13px] text-red-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {selectedProduct && (
            <div className="p-4 rounded-md bg-green-50 border border-primary-light">
              <div className="flex items-center gap-3">
                {selectedProduct.image && (
                  <img src={selectedProduct.image} alt="" className="w-14 h-14 object-cover rounded-md border" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-primary-dark truncate">{selectedProduct.title}</p>
                  <p className="text-[15px] font-extrabold text-primary">{formatPrice(selectedProduct.price)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <label className="text-[12px] font-bold text-gray-600">Số lượng:</label>
                <input type="number" name="qty" min="1" max="99" value={formData.qty} onChange={handleChange}
                  className="w-16 px-2 py-1 rounded-md border border-gray-300 text-center text-[14px] font-bold" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-gray-700 flex items-center gap-1 uppercase">
              <User className="w-3.5 h-3.5 text-primary" /> Họ và tên *
            </label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nguyễn Văn A" required
              className="w-full px-3 py-2.5 rounded-md bg-gray-50 border border-gray-200 text-[14px] focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-gray-700 flex items-center gap-1 uppercase">
              <Phone className="w-3.5 h-3.5 text-primary" /> Số điện thoại *
            </label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="0912345678" required
              className="w-full px-3 py-2.5 rounded-md bg-gray-50 border border-gray-200 text-[14px] focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-gray-700 flex items-center gap-1 uppercase">
              <MapPin className="w-3.5 h-3.5 text-primary" /> Địa chỉ giao hàng {isOrderMode && <span className="text-red-500">*</span>}
            </label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} 
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..." 
              required={isOrderMode}
              className="w-full px-3 py-2.5 rounded-md bg-gray-50 border border-gray-200 text-[14px] focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-gray-700 flex items-center gap-1 uppercase">
              <Mail className="w-3.5 h-3.5 text-primary" /> Email <span className="text-gray-400 font-normal text-[11px]">(tùy chọn)</span>
            </label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com"
              className="w-full px-3 py-2.5 rounded-md bg-gray-50 border border-gray-200 text-[14px] focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-gray-700 flex items-center gap-1 uppercase">
              <PhoneCall className="w-3.5 h-3.5 text-primary" /> Hotline / Số dự phòng <span className="text-gray-400 font-normal text-[11px]">(tùy chọn)</span>
            </label>
            <input type="tel" name="hotline" value={formData.hotline} onChange={handleChange} placeholder="Hotline nếu có..."
              className="w-full px-3 py-2.5 rounded-md bg-gray-50 border border-gray-200 text-[14px] focus:outline-none focus:ring-1 focus:ring-primary transition-all" />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-gray-700 flex items-center gap-1 uppercase">
              <MessageSquare className="w-3.5 h-3.5 text-primary" /> Ghi chú
            </label>
            <textarea name="message" rows={2} value={formData.message} onChange={handleChange} placeholder="Ghi chú thêm (nếu có)..."
              className="w-full px-3 py-2.5 rounded-md bg-gray-50 border border-gray-200 text-[14px] focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none" />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={isLoading}
              className={`w-full py-3 px-4 rounded-md font-heading font-bold text-white shadow-sm transition-all duration-200 flex items-center justify-center gap-2 text-[14px] disabled:opacity-50 uppercase ${isOrderMode ? 'bg-primary hover:bg-primary-dark' : 'bg-accent hover:bg-accent/90'}`}>
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>ĐANG XỬ LÝ...</span></>
              ) : isOrderMode ? (
                <><ShoppingBag className="w-4 h-4" /><span>XÁC NHẬN ĐẶT HÀNG</span></>
              ) : (
                <><Send className="w-4 h-4" /><span>GỬI YÊU CẦU TƯ VẤN</span></>
              )}
            </button>
          </div>

          <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            <span>WASY PRO bảo mật thông tin khách hàng tuyệt đối.</span>
          </p>
        </form>
      </div>
    </div>
  );
};
