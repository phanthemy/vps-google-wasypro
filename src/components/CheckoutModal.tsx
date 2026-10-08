import React, { useState } from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { CartItem } from '../hooks/useCart';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totalAmount: number;
  onSuccess: () => void;
}

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  totalAmount,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    address: '',
    note: '',
    wantInvoice: false,
    companyName: '',
    taxCode: '',
    companyAddr: '',
    invoiceEmail: ''
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
    if (!formData.customerName) return "Vui lòng nhập họ và tên.";
    if (!/^0\d{9}$/.test(formData.customerPhone)) return "Số điện thoại không hợp lệ (Bắt đầu bằng 0, gồm 10 chữ số).";
    if (!formData.address) return "Vui lòng nhập địa chỉ giao hàng.";
    if (formData.wantInvoice) {
      if (!formData.companyName) return "Vui lòng nhập tên công ty.";
      if (!formData.taxCode) return "Vui lòng nhập mã số thuế.";
      if (!formData.companyAddr) return "Vui lòng nhập địa chỉ công ty.";
      if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.invoiceEmail)) return "Email nhận hóa đơn không hợp lệ.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const refCode = new URLSearchParams(window.location.search).get('ref') || undefined;
      const res = await fetch('/api/orders/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          address: formData.address,
          message: formData.note,
          type: 'ORDER',
          // Backward compat
          productId: items[0]?.productId,
          productTitle: items.map(i => i.title + ' x' + i.quantity).join(', '),
          productPrice: items[0]?.price || 0,
          qty: items.reduce((s, i) => s + i.quantity, 0),
          totalAmount,
          // Invoice
          wantInvoice: formData.wantInvoice,
          companyName: formData.companyName,
          taxCode: formData.taxCode,
          companyAddr: formData.companyAddr,
          invoiceEmail: formData.invoiceEmail,
          items: items.map(i => ({ 
            productId: i.productId, 
            productTitle: i.title, 
            productPrice: i.price, 
            qty: i.quantity, 
            totalAmount: i.price * i.quantity 
          })),
          refCode
        })
      });

      if (!res.ok) throw new Error('Có lỗi xảy ra, vui lòng thử lại sau.');
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
          <button 
            onClick={() => {
              onSuccess();
              onClose();
            }} 
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-opacity-90 transition-all"
          >
            Quay Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88dvh] overflow-hidden flex flex-col my-auto relative animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Title and X Button */}
        <div className="sticky top-0 z-50 px-4 py-3 sm:px-6 sm:py-3.5 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 shadow-2xs">
          <h2 className="text-base sm:text-lg font-bold text-gray-800">Thanh Toán & Đặt Hàng</h2>
          <button 
            type="button"
            onClick={onClose} 
            aria-label="Đóng"
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* 2-Column Body Container */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row overscroll-contain">
          {/* Order Summary */}
          <div className="w-full md:w-1/3 bg-gray-50 p-5 sm:p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-200">
            <h3 className="text-base font-bold mb-4 text-gray-800">Tóm tắt đơn hàng</h3>
            <div className="flex flex-col gap-3 mb-6">
              {items.map(item => (
                <div key={item.productId} className="flex gap-3">
                  <div className="relative">
                    <img src={item.image} alt={item.title} className="w-14 h-14 object-cover rounded-md border" />
                    <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {item.quantity}
                    </span>
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
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                <input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" placeholder="09..." />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng *</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú (Tùy chọn)</label>
              <textarea name="note" value={formData.note} onChange={handleChange} rows={2} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none" placeholder="Ghi chú về đơn hàng..." />
            </div>

            <div className="mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="wantInvoice" checked={formData.wantInvoice} onChange={handleChange} className="w-4 h-4 text-primary focus:ring-primary rounded" />
                <span className="font-medium text-gray-700">Xuất hóa đơn công ty</span>
              </label>
            </div>

            {formData.wantInvoice && (
              <div className="p-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên công ty *</label>
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã số thuế *</label>
                  <input type="text" name="taxCode" value={formData.taxCode} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email nhận HĐ *</label>
                  <input type="email" name="invoiceEmail" value={formData.invoiceEmail} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ công ty *</label>
                  <input type="text" name="companyAddr" value={formData.companyAddr} onChange={handleChange} className="w-full p-2 border rounded-lg" />
                </div>
              </div>
            )}

            <div className="mt-2 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">Phương thức thanh toán</h4>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full border-4 border-primary bg-white flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">Thanh toán khi nhận hàng (COD)</p>
                  <p className="text-xs text-gray-500 mt-0.5">Kiểm tra hàng trước khi thanh toán</p>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-3 italic">* Lưu ý: Đối với Ứng dụng Zalo Mini App, hiện tại chúng tôi chỉ hỗ trợ thanh toán trực tiếp khi nhận hàng. Vui lòng thanh toán cho nhân viên giao hàng sau khi kiểm tra sản phẩm.</p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="mt-4 w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-opacity-90 disabled:bg-gray-400 flex justify-center items-center gap-2 transition-all shadow-md text-lg"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : 'ĐẶT MUA'}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
);
};
