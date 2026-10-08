import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types/schema';
import { api } from '../services/api';
import { ProductQuickViewModal } from './ProductQuickViewModal';
import { 
  Search, 
  SlidersHorizontal, 
  Eye, 
  ShoppingBag, 
  Star, 
  Droplet, 
  AlertCircle, 
  RotateCcw, 
  Flame, 
  Sparkles, 
  Tag, 
  PhoneCall,
  Wrench,
  Coffee,
  CheckCircle2
} from 'lucide-react';

interface ProductSectionProps {
  onOrderProduct: (product: Product) => void;
  onCallHotline: () => void;
}

interface CustomTab {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
}

// 3 Nhóm danh mục chính theo yêu cầu của Sếp + Tab Tất Cả
const CATEGORY_TABS: CustomTab[] = [
  { 
    id: 'may-loc-nuoc', 
    name: 'Máy Lọc Nước', 
    icon: Droplet,
    description: 'Máy lọc nước Ion kiềm & Hydrogen công nghệ cao'
  },
  { 
    id: 'dung-cu-test-nuoc', 
    name: 'Dụng Cụ Test Nước', 
    icon: Coffee,
    description: 'Dụng cụ đo kiểm tra chất lượng nước'
  },
  { 
    id: 'phu-kien', 
    name: 'Phụ Kiện Máy Lọc Nước', 
    icon: Wrench,
    description: 'Lõi lọc, linh kiện & thiết bị đo kiểm tra nước'
  },
  { 
    id: 'all', 
    name: 'Tất Cả Sản Phẩm', 
    icon: CheckCircle2,
    description: 'Toàn bộ danh mục sản phẩm chính hãng'
  }
];

export const ProductSection: React.FC<ProductSectionProps> = ({
  onOrderProduct,
  onCallHotline,
}) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  // MẶC ĐỊNH KHI TRUY CẬP VÀO: Chọn ngay tab "Máy Lọc Nước"
  const [selectedCategory, setSelectedCategory] = useState<string>('may-loc-nuoc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('price_desc'); // Default: Giá cao đến thấp
  
  // Trạng thái tải dữ liệu
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<Product | null>(null);

  // Lấy toàn bộ sản phẩm một lần để chuyển tab tức thì
  const loadAllProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getProducts();
      setAllProducts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllProducts();
  }, []);

  // Hàm kiểm tra sản phẩm thuộc Tab nào
  const isProductInTab = (product: Product, tabId: string): boolean => {
    if (tabId === 'all') return true;

    const titleLower = (product.title || '').toLowerCase();
    const catId = product.categoryId;

    // 1. MÁY LỌC NƯỚC: Gom Máy Ion Kiềm (cat-01) & Máy Hydrogen (cat-02)
    if (tabId === 'may-loc-nuoc') {
      const isMachine = catId === 'cat-01' || catId === 'cat-02' || titleLower.includes('máy');
      const isAccessory = catId === 'cat-04' || catId === 'cat-05' || 
                          titleLower.includes('lõi') || 
                          titleLower.includes('bộ điện phân') || 
                          titleLower.includes('bút đo') || 
                          titleLower.includes('màn chống');
      return isMachine && !isAccessory;
    }

    // 2. DỤNG CỤ TEST NƯỚC: cat-03 hoặc sản phẩm test nước
    if (tabId === 'dung-cu-test-nuoc') {
      return catId === 'cat-03' || titleLower.includes('test') || titleLower.includes('đo') || titleLower.includes('bút');
    }

    // 3. PHỤ KIỆN MÁY LỌC NƯỚC: Lõi lọc, màng lọc, bút đo, phụ kiện
    if (tabId === 'phu-kien') {
      return catId === 'cat-04' || catId === 'cat-05' || 
             titleLower.includes('lõi') || 
             titleLower.includes('phụ kiện') || 
             titleLower.includes('điện phân') || 
             titleLower.includes('bút đo') || 
             titleLower.includes('màn chống');
    }

    return true;
  };

  // Đếm số lượng sản phẩm mỗi Tab
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORY_TABS.forEach(tab => {
      counts[tab.id] = allProducts.filter(p => isProductInTab(p, tab.id)).length;
    });
    return counts;
  }, [allProducts]);

  // Danh sách sản phẩm hiển thị sau khi lọc & sắp xếp
  const displayedProducts = useMemo(() => {
    let result = allProducts.filter(p => isProductInTab(p, selectedCategory));

    // Lọc theo từ khóa tìm kiếm
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(p => 
        (p.title || '').toLowerCase().includes(query) || 
        (p.description || '').toLowerCase().includes(query)
      );
    }

    // Sắp xếp
    if (sortBy === 'price_asc') {
      result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price_desc') {
      result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return result;
  }, [allProducts, selectedCategory, searchQuery, sortBy]);

  const formatPrice = (amount: number) => {
    if (!amount || amount <= 0) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  };

  // Tính phần trăm giảm giá nếu có
  const getDiscountPercent = (price: number, originalPrice?: number) => {
    if (!originalPrice || originalPrice <= price) return null;
    const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
    return discount > 0 ? `-${discount}%` : null;
  };

  return (
    <section id="products" className="py-10 sm:py-16 bg-slate-50/70 relative">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Tiêu đề mục sản phẩm */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-sky-50 text-primary text-xs font-bold uppercase tracking-wider mb-2 border border-primary/10">
            <Sparkles className="w-3.5 h-3.5" />
            Sản Phẩm Chính Hãng
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            SẢN PHẨM NỔI BẬT
          </h2>
          <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-500 font-medium">
            Công nghệ tạo nước Hydrogen tươi & Ion kiềm sạch chuẩn y tế quốc tế
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent mx-auto mt-3.5 rounded-full"></div>
        </div>

        {/* Cụm Tìm kiếm, Sắp xếp & HỆ THỐNG TAB MỚI */}
        <div className="bg-white rounded-2xl p-3 sm:p-5 mb-8 shadow-sm border border-slate-100 space-y-4">
          
          {/* HÀNG TAB CHÍNH (Gồm: Máy lọc nước, Bình ly hydrogen, Phụ kiện máy lọc nước, Tất cả) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isSelected = selectedCategory === tab.id;
              const count = tabCounts[tab.id] || 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                    isSelected
                      ? 'bg-gradient-to-r from-primary to-sky-600 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-accent' : 'text-slate-400'}`} />
                  <span>{categoryNames[tab.id] || tab.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isSelected 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-200/80 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dải tìm kiếm & Bộ lọc sắp xếp giá */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm máy, model, thông số..."
                className="w-full pl-10 pr-12 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200/80 rounded-full px-2 py-0.5 font-medium"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Sắp xếp */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs sm:text-sm">
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
              <span className="text-slate-500 font-semibold whitespace-nowrap">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="default">Mặc định</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>

        </div>

        {/* Trạng thái 1: Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-100 shadow-sm animate-pulse space-y-3">
                <div className="w-full aspect-square bg-slate-100 rounded-xl"></div>
                <div className="h-4 bg-slate-100 rounded-md w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded-md w-1/2"></div>
                <div className="h-5 bg-slate-100 rounded-md w-2/3"></div>
                <div className="h-9 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {/* Trạng thái 2: Lỗi */}
        {!isLoading && error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center max-w-md mx-auto my-12 shadow-sm">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-rose-900 mb-1">Không thể tải sản phẩm</h3>
            <p className="text-xs sm:text-sm text-rose-700 mb-4">{error}</p>
            <button
              onClick={loadAllProducts}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* Trạng thái 3: Trống (Ví dụ khi click vào Dụng Cụ Test Nước mà chưa có sản phẩm) */}
        {!isLoading && !error && displayedProducts.length === 0 && (
          <div className="bg-white rounded-2xl p-10 text-center max-w-md mx-auto my-8 border border-slate-100 shadow-sm">
            <Coffee className="w-12 h-12 text-amber-500/60 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {selectedCategory === 'dung-cu-test-nuoc' 
                ? 'Dòng Bình & Ly Hydrogen sắp ra mắt' 
                : 'Không tìm thấy sản phẩm phù hợp'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
              {selectedCategory === 'dung-cu-test-nuoc'
                ? 'Các mẫu bình ly tạo Hydrogen di động đang được chuẩn bị lên kệ. Quý khách vui lòng liên hệ tư vấn để nhận thông tin ưu đãi mở bán sớm!'
                : 'Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc bấm xem mục khác.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedCategory('may-loc-nuoc');
                  setSearchQuery('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-primary bg-sky-50 border border-primary/20 hover:bg-sky-100 transition-colors"
              >
                <Droplet className="w-3.5 h-3.5" />
                <span>Xem Máy Lọc Nước</span>
              </button>
              <button
                onClick={onCallHotline}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-primary hover:bg-primary-dark transition-colors shadow-sm"
              >
                <PhoneCall className="w-3.5 h-3.5 text-accent" />
                <span>Hotline Tư Vấn</span>
              </button>
            </div>
          </div>
        )}

        {/* Trạng thái 4: LƯỚI SẢN PHẨM (2 Cột Mobile, 4 Cột Desktop) */}
        {!isLoading && !error && displayedProducts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {displayedProducts.map((product) => {
              const discount = getDiscountPercent(product.price, product.originalPrice);
              const rawImg = product.image && product.image.startsWith("/uploads") 
                ? product.image 
                : ((product.gallery as any[])?.length > 0 
                  ? (typeof (product.gallery as any[])[0] === "string" ? (product.gallery as any[])[0] : (product.gallery as any[])[0]?.url) 
                  : product.image);
              const imageUrl = rawImg 
                ? (rawImg.includes("?") ? rawImg : `${rawImg}?v=20261008`) 
                : "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80";

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-sky-200/80 transition-all duration-300 group flex flex-col justify-between relative"
                >
                  {/* Khung Ảnh Sản Phẩm */}
                  <div 
                    className="relative aspect-square bg-gradient-to-b from-slate-50/80 via-white to-slate-50/40 p-3 sm:p-5 flex items-center justify-center overflow-hidden cursor-pointer"
                    onClick={() => setSelectedQuickViewProduct(product)}
                  >
                    {/* Badges Góc Trái (HOT / MỚI) */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                      {product.isHot && (
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                          <Flame className="w-3 h-3 fill-white" />
                          HOT
                        </span>
                      )}
                      {product.isNew && (
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-sky-500 to-teal-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                          <Sparkles className="w-3 h-3 fill-white" />
                          MỚI
                        </span>
                      )}
                    </div>

                    {/* Badge Giảm Giá */}
                    {discount && (
                      <div className="absolute top-2.5 right-2.5 z-10">
                        <span className="bg-rose-500 text-white text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded-md shadow-xs">
                          {discount}
                        </span>
                      </div>
                    )}

                    {/* Nút Xem Nhanh Desktop */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQuickViewProduct(product);
                      }}
                      className="hidden sm:flex absolute bottom-2.5 left-1/2 -translate-x-1/2 items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold backdrop-blur-md opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300 z-10 shadow-lg"
                      title="Xem nhanh thông số"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem nhanh</span>
                    </button>

                    {/* Hình Ảnh Sản Phẩm */}
                    <img
                      src={imageUrl}
                      alt={product.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-500 ease-out"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/images/products/prod-1.webp';
                      }}
                    />
                  </div>

                  {/* Phần Nội Dung Thông Tin */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      {/* Đánh Giá & Xuất Xứ */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span className="font-bold text-slate-700">{product.rating || 5}</span>
                          <span className="text-slate-400">({product.reviewsCount || 0})</span>
                        </div>
                        {product.specs?.origin && (
                          <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                            {product.specs.origin}
                          </span>
                        )}
                      </div>

                      {/* Tên Sản Phẩm */}
                      <h3 
                        onClick={() => setSelectedQuickViewProduct(product)}
                        className="font-bold text-slate-800 text-[13px] sm:text-[14px] leading-snug line-clamp-2 hover:text-primary cursor-pointer transition-colors min-h-[2.4rem]"
                        title={product.title}
                      >
                        {product.title}
                      </h3>

                      {/* Thông Số Nổi Bật (pH, Hydro) */}
                      {(product.specs?.hydrogenPpb || product.specs?.pH) && (
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {product.specs?.hydrogenPpb && (
                            <span className="text-[9px] sm:text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                              H₂: {product.specs.hydrogenPpb}
                            </span>
                          )}
                          {product.specs?.pH && (
                            <span className="text-[9px] sm:text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                              pH: {product.specs.pH}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Khuyến Mại / Quà Tặng (Nếu có) */}
                    {product.promotion && (
                      <div className="text-[10px] sm:text-[11px] font-bold text-amber-700 bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200/60 truncate flex items-center gap-1">
                        <Tag className="w-3 h-3 flex-shrink-0 text-amber-500" />
                        <span className="truncate">{product.promotion}</span>
                      </div>
                    )}

                    {/* Khối Giá Tiền & Nút Đặt Hàng */}
                    <div className="pt-1.5 border-t border-slate-100/80 space-y-2">
                      <div className="flex items-baseline justify-between gap-1">
                        <div>
                          <span className="text-[15px] sm:text-[17px] font-black text-rose-600 leading-none">
                            {formatPrice(product.price)}
                          </span>
                          {product.originalPrice && (
                            <span className="text-[11px] text-slate-400 line-through block mt-0.5">
                              {formatPrice(product.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Nút Xem Chi Tiết & Mua Ngay */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedQuickViewProduct(product)}
                          className="py-2.5 px-3 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center text-xs font-bold"
                          title="Xem thông số kỹ thuật"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOrderProduct(product)}
                          className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-primary to-sky-600 hover:from-primary-dark hover:to-primary shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>MUA NGAY</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Modal Xem Nhanh Thông Số */}
      {selectedQuickViewProduct && (
        <ProductQuickViewModal
          product={selectedQuickViewProduct}
          onClose={() => setSelectedQuickViewProduct(null)}
          onOrderProduct={onOrderProduct}
          onCallHotline={onCallHotline}
        />
      )}
    </section>
  );
};
