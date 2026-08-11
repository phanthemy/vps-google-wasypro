import React, { useState } from 'react';
import { Product } from '../types/schema';
import { api } from '../services/api';
import { 
  X, 
  PhoneCall, 
  Send, 
  User, 
  Phone, 
  MapPin, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

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
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    message: selectedProduct ? `Tư vấn mua máy: ${selectedProduct.title}` : 'Tôi muốn đăng ký tư vấn máy lọc nước Hydrogen ion kiềm tận nơi.',
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend phone regex check
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!formData.name.trim()) {
      setError('Vui lòng nhập họ và tên của bạn.');
      return;
    }

    if (!formData.phone || !phoneRegex.test(formData.phone.trim())) {
      setError('Số điện thoại không đúng định dạng (Ví dụ: 0912345678).');
      return;
    }

    if (!formData.message.trim()) {
      setError('Vui lòng nhập nội dung yêu cầu.');
      return;
    }

    setIsLoading(true);

    try {
      await api.submitContact(formData);
      onSuccessToast('Đã gửi yêu cầu tư vấn thành công! Chuyên viên WASY PRO sẽ gọi lại trong 5 phút.');
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể gửi form. Vui lòng kiểm tra lại.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/70 backdrop-blur-md overflow-y-auto">
      <div 
        className="bg-white w-full max-w-lg rounded-md overflow-hidden shadow-xl relative animate-in fade-in zoom-in duration-200 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center shadow-md transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-primary-darker p-6 text-white text-center relative overflow-hidden">
          
          <div className="w-12 h-12 rounded-md bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-3 text-accent">
            <PhoneCall className="w-6 h-6 animate-pulse" />
          </div>

          <h3 className="text-xl font-heading font-extrabold uppercase">
            Đăng Ký Tư Vấn & Lắp Đặt
          </h3>
          <p className="text-[13px] text-gray-300 mt-1 max-w-xs mx-auto">
            Hỗ trợ miễn phí kiểm tra nguồn nước & khảo sát vị trí lắp đặt tại nhà.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4 bg-white">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-[13px] text-red-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {selectedProduct && (
            <div className="p-3 rounded-md bg-green-50 border border-primary-light text-[13px] text-primary-dark font-bold flex items-center justify-between">
              <span>Sản phẩm chọn mua:</span>
              <strong className="text-primary truncate max-w-[200px]">{selectedProduct.title}</strong>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-gray-700 flex items-center gap-1 uppercase">
              <User className="w-3.5 h-3.5 text-primary" />
              <span>Họ và tên *</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              className="w-full px-3 py-2.5 rounded-md bg-gray-50 border border-gray-200 text-[14px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-gray-700 flex items-center gap-1 uppercase">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span>Số điện thoại (Zalo) *</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="0912345678"
              className="w-full px-3 py-2.5 rounded-md bg-gray-50 border border-gray-200 text-[14px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-gray-700 flex items-center gap-1 uppercase">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Địa chỉ khảo sát / lắp đặt</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Quận/Huyện, Tỉnh/Thành phố..."
              className="w-full px-3 py-2.5 rounded-md bg-gray-50 border border-gray-200 text-[14px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[12px] font-bold text-gray-700 flex items-center gap-1 uppercase">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>Nội dung lời nhắn</span>
            </label>
            <textarea
              name="message"
              rows={3}
              value={formData.message}
              onChange={handleChange}
              placeholder="Nhập nội dung cần tư vấn..."
              className="w-full px-3 py-2.5 rounded-md bg-gray-50 border border-gray-200 text-[14px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all resize-none"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-md font-heading font-bold text-white bg-primary hover:bg-primary-dark shadow-sm transition-all duration-200 flex items-center justify-center gap-2 text-[14px] disabled:opacity-50 uppercase"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>ĐANG GỬI THÔNG TIN...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>GỬI YÊU CẦU TƯ VẤN</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1 pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            <span>WASY PRO bảo mật thông tin khách hàng tuyệt đối.</span>
          </p>
        </form>
      </div>
    </div>
  );
};
