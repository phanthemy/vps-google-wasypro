import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types/schema';
import { 
  X, Star, Check, PhoneCall, ShieldCheck, Award, Clock, CheckCircle2, 
  Droplet, Sliders, Zap, ShoppingBag, ChevronLeft, ChevronRight, Play, Pause
} from 'lucide-react';

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onOrderProduct: (product: Product) => void;
  onCallHotline: () => void;
}

const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)$/i.test(url);

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product, onClose, onOrderProduct, onCallHotline,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // Reset index when product changes
  useEffect(() => { setActiveIndex(0); setIsPlaying(false); }, [product?.id]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailsRef.current) {
      const thumb = thumbnailsRef.current.children[activeIndex] as HTMLElement;
      if (thumb) thumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeIndex]);

  if (!product) return null;

  // Build media list (images + videos)
  const galleryUrls = (product.gallery || []).map((g: any) => typeof g === 'string' ? g : g?.url).filter(Boolean);
  const mainImg = (product.image && product.image.startsWith('/uploads')) ? product.image : (galleryUrls[0] || product.image);
  const allMedia = [mainImg, ...galleryUrls.filter((u: string) => u !== mainImg)].filter(Boolean);
  const activeUrl = allMedia[activeIndex] || '';

  const goNext = () => setActiveIndex(i => (i + 1) % allMedia.length);
  const goPrev = () => setActiveIndex(i => (i - 1 + allMedia.length) % allMedia.length);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? goNext() : goPrev(); }
  };

  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setIsPlaying(true); }
    else { videoRef.current.pause(); setIsPlaying(false); }
  };

  const formatPrice = (amount: number) => {
    if (!amount || amount <= 0) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900/70 backdrop-blur-md overflow-hidden flex flex-col justify-end sm:justify-center sm:items-center sm:p-4" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md sm:max-w-2xl rounded-t-2xl sm:rounded-2xl overflow-y-auto shadow-xl relative sm:border border-gray-200 mx-auto"
        style={{ maxHeight: '88dvh', marginTop: 'auto', paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with X Button */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-sm border-b border-gray-100" style={{ minHeight: '48px' }}>
          <h3 className="text-[15px] font-bold text-gray-800 truncate pr-3">Chi tiết sản phẩm</h3>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-500 flex items-center justify-center transition-all flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col">
          {/* Image Gallery */}
          <div className="bg-gray-50 p-3 sm:p-6">
            {/* Badges */}
            <div className="flex gap-2 mb-3">
              {product.isHot && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-sm shadow-sm">
                  🔥 HOT SELLER
                </span>
              )}
              {product.isNew && (
                <span className="bg-sky-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-sm shadow-sm">
                  ✨ MỚI 2026
                </span>
              )}
            </div>

            {/* Main Image/Video Area */}
            <div 
              className="relative w-full aspect-square bg-white rounded-lg overflow-hidden border border-gray-200 mb-3 select-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {isVideo(activeUrl) ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    src={activeUrl}
                    className="w-full h-full object-contain"
                    loop
                    playsInline
                    onClick={toggleVideo}
                  />
                  {/* Play/Pause overlay */}
                  <button 
                    onClick={toggleVideo}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                  >
                    {!isPlaying && (
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Play className="w-8 h-8 text-gray-800 ml-1" />
                      </div>
                    )}
                  </button>
                </div>
              ) : (
                <img 
                  src={activeUrl} 
                  alt={product.title}
                  className="w-full h-full object-contain transition-all duration-300"
                />
              )}

              {/* Navigation Arrows */}
              {allMedia.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-gray-700 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center text-gray-700 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Slide counter */}
              {allMedia.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {activeIndex + 1} / {allMedia.length}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {allMedia.length > 1 && (
              <div 
                ref={thumbnailsRef}
                className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
                style={{ scrollbarWidth: 'none' }}
              >
                {allMedia.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setActiveIndex(idx); setIsPlaying(false); }}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === activeIndex 
                        ? 'border-green-600 shadow-md ring-1 ring-green-400' 
                        : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {isVideo(url) ? (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <img src={url} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center p-2 bg-white rounded-md border border-gray-200 text-[11px]">
                <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-primary" />
                <span className="font-bold block text-gray-800">Bảo Hành</span>
                <span>{product.specs.warrantyYears || 1} Năm Tận Nhà</span>
              </div>
              <div className="text-center p-2 bg-white rounded-md border border-gray-200 text-[11px]">
                <Award className="w-5 h-5 mx-auto mb-1 text-primary" />
                <span className="font-bold block text-gray-800">Xuất Xứ</span>
                <span>{product.specs.origin || 'Việt Nam'}</span>
              </div>
              <div className="text-center p-2 bg-white rounded-md border border-gray-200 text-[11px]">
                <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-primary" />
                <span className="font-bold block text-gray-800">Cam Kết</span>
                <span>100% Chính Hãng</span>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="flex flex-col space-y-4 p-4 sm:p-6">
            <div>
              {/* Category & Rating */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider bg-sky-50 px-2 py-1 rounded-sm border border-primary-light">
                  {product.specs.origin} • Premium Series
                </span>
                <div className="flex items-center gap-1 text-[12px]">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="font-bold text-gray-800">{product.rating}</span>
                  <span className="text-gray-500">({product.reviewsCount})</span>
                </div>
              </div>

              <h2 className="text-[17px] sm:text-[22px] font-bold text-gray-900 leading-snug mb-2">
                {product.title}
              </h2>

              <div className="text-[13px] text-gray-600 mb-3 leading-relaxed" style={{ maxHeight: '80px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' as any }}>
                {product.description}
              </div>

              {/* Pricing Box */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 mb-4 flex flex-wrap items-center gap-2">
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
                <div className="flex items-center gap-1 text-[12px] font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-sm border border-sky-200">
                  <Check className="w-3.5 h-3.5" />
                  <span>Còn hàng ({product.stock} sản phẩm)</span>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-3 mb-6">
                <h3 className="text-[12px] font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-primary" />
                  <span>Thông Số Kỹ Thuật</span>
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

              {/* Benefits */}
              <ul className="space-y-1.5 text-[13px] text-gray-600 mb-4">
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
                onClick={() => { onOrderProduct(product); onClose(); }}
                className="w-full py-3 px-4 rounded-md font-heading font-bold text-white bg-primary hover:bg-primary-dark shadow-sm transition-all duration-200 flex items-center justify-center gap-2 text-[14px] uppercase"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Đặt Mua Ngay</span>
              </button>
              <button
                onClick={() => { onCallHotline(); onClose(); }}
                className="w-full py-3 px-4 rounded-md font-heading font-bold text-accent bg-white hover:bg-gray-50 border-2 border-accent transition-all duration-200 flex items-center justify-center gap-2 text-[14px] uppercase"
              >
                <PhoneCall className="w-4 h-4 text-accent" />
                <span>Gọi Hotline</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom: Tabs */}
        <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
          <div className="flex items-center gap-4 border-b border-gray-200 pb-2 mb-4">
            <button className="text-[14px] font-bold text-primary border-b-2 border-primary pb-2 -mb-[9px]">Mô tả chi tiết</button>
            <button className="text-[14px] font-bold text-gray-500 hover:text-gray-800 pb-2 -mb-[9px]">Thông số</button>
            <button className="text-[14px] font-bold text-gray-500 hover:text-gray-800 pb-2 -mb-[9px]">Đánh giá ({product.reviewsCount})</button>
          </div>
          <div className="text-[14px] text-gray-700 leading-relaxed prose max-w-none">
            {product.description?.split(/[.。](?=\s|[A-ZĐÀ-ɏ])/g)
              .filter((s: string) => s?.trim())
              .reduce((acc: string[][], s: string, i: number) => {
                const groupIdx = Math.floor(i / 3);
                if (!acc[groupIdx]) acc[groupIdx] = [];
                acc[groupIdx].push(s.trim());
                return acc;
              }, [])
              .map((group: string[], idx: number) => (
                <p key={idx} className="mb-3">{group.join('. ')}.</p>
              ))
            }
            <p>Sản phẩm ứng dụng Công nghệ Super Water King với quy trình xử lý 4 tầng gồm làm sạch nguồn nước, bổ sung Mg²⁺, Ca²⁺, K⁺, Na⁺, tạo môi trường ion kiềm cân bằng bằng công nghệ điện li và tạo Hydrogen hòa tan H₂, mang đến nguồn nước Hydrogen giàu ion kiềm sạch phục vụ nhiều nhu cầu sử dụng trong gia đình.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
