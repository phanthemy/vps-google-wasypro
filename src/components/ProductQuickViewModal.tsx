import React, { useState } from 'react';
import { Product } from '../types/schema';
import { 
  X, 
  Star, 
  Check, 
  PhoneCall, 
  ShieldCheck, 
  Award, 
  Clock, 
  CheckCircle2, 
  Droplet, 
  Sliders, 
  Zap,
  ShoppingBag
} from 'lucide-react';

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onOrder: (product: Product) => void;
  onCallHotline: () => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product,
  onClose,
  onOrder,
  onCallHotline,
}) => {
  if (!product) return null;

  const [activeImage, setActiveImage] = useState<string>(
    product.image || (product.gallery && product.gallery[0]) || ''
  );

  const images = [product.image, ...(product.gallery || [])].filter(Boolean);

  const formatPrice = (amount: number) => {
    if (!amount || amount <= 0) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/70 backdrop-blur-md overflow-y-auto" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-4xl rounded-md overflow-y-auto max-h-[90vh] shadow-xl relative animate-in fade-in zoom-in duration-200 my-8 border border-primary-light"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="fixed sm:absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white hover:bg-gray-100 text-gray-700 flex items-center justify-center shadow-lg transition-all border border-gray-200"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8">
          
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square rounded-md bg-white p-6 flex items-center justify-center overflow-hidden border border-gray-200 group">
              {/* Product Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                {product.isHot && (
                  <span className="bg-red-500 text-white text-[11px] font-bold px-3 py-1 rounded-sm shadow-sm">
                    🔥 HOT SELLER
                  </span>
                )}
                {product.isNew && (
                  <span className="bg-primary text-white text-[11px] font-bold px-3 py-1 rounded-sm shadow-sm">
                    ✨ MỚI 2026
                  </span>
                )}
              </div>

              {/* Main Display Image */}
              <img
                src={activeImage || product.image}
                alt={product.title}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Fallback visual if image file not present
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            {/* Thumbnail Carousel */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-16 h-16 rounded-md border-2 overflow-hidden flex-shrink-0 transition-all ${
                      activeImage === img
                        ? 'border-primary'
                        : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Key Assurance Badges */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[12px] text-gray-600">
              <div className="p-2.5 rounded-md bg-green-50 border border-primary-light">
                <ShieldCheck className="w-4 h-4 text-primary mx-auto mb-1" />
                <span className="font-bold block text-gray-800">Bảo Hành</span>
                <span>{product.specs.warrantyYears} Năm Tận Nhà</span>
              </div>
              <div className="p-2.5 rounded-md bg-gray-50 border border-gray-200">
                <Award className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                <span className="font-bold block text-gray-800">Xuất Xứ</span>
                <span>{product.specs.origin}</span>
              </div>
              <div className="p-2.5 rounded-md bg-yellow-50 border border-yellow-200">
                <CheckCircle2 className="w-4 h-4 text-yellow-600 mx-auto mb-1" />
                <span className="font-bold block text-gray-800">Cam Kết</span>
                <span>100% Chính Hãng</span>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Specs */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div>
              {/* Category & Rating */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider bg-green-50 px-2 py-1 rounded-sm border border-primary-light">
                  {product.specs.origin} • Premium Series
                </span>

                <div className="flex items-center gap-1 text-[12px]">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.floor(product.rating) ? 'fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-gray-800">{product.rating}</span>
                  <span className="text-gray-500">({product.reviewsCount} đánh giá)</span>
                </div>
              </div>

              <h2 className="text-[20px] sm:text-[24px] font-heading font-bold text-gray-900 leading-snug mb-3 uppercase">
                {product.title}
              </h2>

              <p className="text-[13px] sm:text-[14px] text-gray-600 mb-4 leading-relaxed">
                {product.description}
              </p>

              {/* Pricing Box */}
              <div className="p-4 rounded-md bg-gray-50 border border-gray-200 mb-6 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="text-[24px] sm:text-[28px] font-heading font-extrabold text-price">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="ml-3 text-[14px] text-gray-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[12px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-sm border border-green-200">
                  <Check className="w-3.5 h-3.5" />
                  <span>Còn hàng ({product.stock} sản phẩm)</span>
                </div>
              </div>

              {/* Technical Specifications Table */}
              <div className="space-y-3 mb-6">
                <h3 className="text-[12px] font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-primary" />
                  <span>Bảng Thông Số Kỹ Thuật Ion Kiềm</span>
                </h3>

                <div className="grid grid-cols-2 gap-2 text-[13px]">
                  <div className="p-2.5 rounded-md bg-white border border-gray-200 shadow-sm">
                    <span className="text-gray-500 block">Độ pH Chuẩn:</span>
                    <strong className="text-primary font-bold">{product.specs.pH}</strong>
                  </div>

                  <div className="p-2.5 rounded-md bg-white border border-gray-200 shadow-sm">
                    <span className="text-gray-500 block">Chỉ số ORP:</span>
                    <strong className="text-primary-dark font-bold">{product.specs.orp}</strong>
                  </div>

                  <div className="p-2.5 rounded-md bg-white border border-gray-200 shadow-sm">
                    <span className="text-gray-500 block">Hydrogen ppb:</span>
                    <strong className="text-primary font-bold">{product.specs.hydrogenPpb}</strong>
                  </div>

                  <div className="p-2.5 rounded-md bg-white border border-gray-200 shadow-sm">
                    <span className="text-gray-500 block">Số cấp lọc:</span>
                    <strong className="text-gray-800 font-bold">{product.specs.filterCount} Lõi lọc</strong>
                  </div>
                </div>
              </div>

              {/* Included Benefits List */}
              <ul className="space-y-2 text-[13px] text-gray-600 mb-6">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Miễn phí vận chuyển & lắp đặt tận nhà toàn quốc.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Tặng kèm bộ bút đo chỉ số pH & Hydrogen trị giá 1.200.000đ.</span>
                </li>
              </ul>
            </div>

            
            {product.promotion && (
              <div className="p-3 rounded-md bg-orange-50 border border-orange-200 mb-4 flex items-start gap-2">
                <span className="text-lg">🎁</span>
                <div>
                  <p className="text-[12px] font-bold text-orange-700 uppercase">Khuyến mãi đặc biệt</p>
                  <p className="text-[13px] font-bold text-orange-600">{product.promotion}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  onOrder(product);
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-md font-heading font-bold text-white bg-primary hover:bg-primary-dark shadow-sm transition-all duration-200 flex items-center justify-center gap-2 text-[14px] uppercase"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Đặt Mua Ngay</span>
              </button>

              <button
                onClick={() => {
                  onCallHotline();
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-md font-heading font-bold text-accent bg-white hover:bg-gray-50 border-2 border-accent transition-all duration-200 flex items-center justify-center gap-2 text-[14px] uppercase"
              >
                <PhoneCall className="w-4 h-4 text-accent" />
                <span>Gọi Hotline</span>
              </button>
            </div>

          </div>
        </div>

        {/* Bottom Section: Tabs */}
        <div className="border-t border-gray-200 p-6 sm:p-8 bg-gray-50">
          <div className="flex items-center gap-4 border-b border-gray-200 pb-2 mb-4">
            <button className="text-[14px] font-bold text-primary border-b-2 border-primary pb-2 -mb-[9px]">
              Mô tả chi tiết
            </button>
            <button className="text-[14px] font-bold text-gray-500 hover:text-gray-800 pb-2 -mb-[9px]">
              Thông số
            </button>
            <button className="text-[14px] font-bold text-gray-500 hover:text-gray-800 pb-2 -mb-[9px]">
              Đánh giá ({product.reviewsCount})
            </button>
          </div>
          <div className="text-[14px] text-gray-700 leading-relaxed prose max-w-none">
            {/* Fake Content for now since real content is long */}
            <p className="mb-4">{product.description}</p>
            <p>Sản phẩm ứng dụng Công nghệ Super Water King với quy trình xử lý 4 tầng gồm làm sạch nguồn nước, bổ sung Mg²⁺, Ca²⁺, K⁺, Na⁺, tạo môi trường ion kiềm cân bằng bằng công nghệ điện li và tạo Hydrogen hòa tan H₂, mang đến nguồn nước Hydrogen giàu ion kiềm sạch phục vụ nhiều nhu cầu sử dụng trong gia đình.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

