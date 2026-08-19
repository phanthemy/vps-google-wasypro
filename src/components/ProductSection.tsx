import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types/schema';
import { api } from '../services/api';
import { ProductQuickViewModal } from './ProductQuickViewModal';
import { 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Eye, 
  ShoppingBag, 
  Star, 
  Droplet, 
  AlertCircle, 
  RotateCcw, 
  Sparkles,
  Flame,
  Check
} from 'lucide-react';

interface ProductSectionProps {
  onOrderProduct: (product: Product) => void;
  onCallHotline: () => void;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  onOrderProduct,
  onCallHotline,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('default');
  
  // 4 States Management
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<Product | null>(null);

  // Fetch Categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await api.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Fetch Products whenever filter, search or sort changes
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getProducts({
        categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
        search: searchQuery.trim() !== '' ? searchQuery : undefined,
        sort: sortBy !== 'default' ? sortBy : undefined,
      });
      setProducts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm. Vui lòng thử lại.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery, sortBy]);

  const formatPrice = (amount: number) => {
    if (!amount || amount <= 0) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <section id="products" className="py-12 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-[24px] sm:text-[28px] font-heading font-bold text-gray-800 tracking-tight uppercase">
            SẢN PHẨM NỔI BẬT
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mt-4 mb-4"></div>
        </div>

        {/* Search, Filter Tabs & Sort Controls */}
        <div className="bg-white rounded-md p-4 sm:p-6 mb-8 shadow-sm border border-gray-100 space-y-4">
          
          {/* Search Input & Sort Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full pl-10 pr-4 py-2.5 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-200 rounded-full px-1.5 py-0.5"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs sm:text-sm">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <span className="text-gray-600 font-bold whitespace-nowrap">Sắp xếp:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-md bg-white border border-gray-200 text-gray-700 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="default">Mặc định</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
              </select>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-md text-xs sm:text-sm font-bold whitespace-nowrap transition-all uppercase ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Tất Cả
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-md text-xs sm:text-sm font-bold whitespace-nowrap transition-all uppercase ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

        </div>

        {/* State 1: Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-md p-4 border border-gray-100 shadow-sm animate-pulse space-y-4">
                <div className="w-full aspect-square bg-gray-100 rounded-md"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                <div className="h-6 bg-gray-100 rounded w-2/3"></div>
                <div className="h-10 bg-gray-100 rounded-md"></div>
              </div>
            ))}
          </div>
        )}

        {/* State 2: Error State */}
        {!isLoading && error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-8 text-center max-w-lg mx-auto my-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3 animate-bounce" />
            <h3 className="text-lg font-bold text-red-900 mb-1">Đã có lỗi xảy ra</h3>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <button
              onClick={fetchProducts}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thử lại</span>
            </button>
          </div>
        )}

        {/* State 3: Empty State */}
        {!isLoading && !error && products.length === 0 && (
          <div className="bg-white rounded-md p-12 text-center max-w-md mx-auto my-12 border border-gray-100 shadow-sm">
            <Droplet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800 mb-1">Không tìm thấy sản phẩm phù hợp</h3>
            <p className="text-[13px] text-gray-500 mb-4">
              Vui lòng thử tìm kiếm từ khóa khác hoặc bỏ lọc danh mục.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] font-bold text-primary bg-green-50 border border-primary-light hover:bg-green-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại bộ lọc</span>
            </button>
          </div>
        )}

        {/* State 4: Normal Product Grid */}
        {!isLoading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-md overflow-hidden border border-gray-200 shadow-sm hover:shadow-md hover:border-primary transition-all duration-300 group flex flex-col justify-between relative"
              >
                {/* Top Image Box */}
                <div 
                  className="relative aspect-square bg-white p-6 flex items-center justify-center overflow-hidden border-b border-gray-100 cursor-pointer"
                  onClick={() => setSelectedQuickViewProduct(product)}
                >
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {product.isHot && (
                      <span className="bg-price text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-sm flex items-center gap-1">
                        HOT
                      </span>
                    )}
                    {product.isNew && (
                      <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-sm flex items-center gap-1">
                        MỚI
                      </span>
                    )}
                  </div>

                  {/* Quick View Floating Action */}
                  <button
                    onClick={() => setSelectedQuickViewProduct(product)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white hover:bg-primary text-gray-600 hover:text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 border border-gray-100"
                    title="Xem nhanh thông số"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Product Image */}
                  <img
                    src={product.image}
                    alt={product.title}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>

                {/* Card Content Info */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {/* Rating & Reviews */}
                    <div className="flex items-center gap-1 text-[12px] text-gray-500 mb-2">
                      <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                      <span className="font-bold text-gray-700">{product.rating}</span>
                      <span>({product.reviewsCount})</span>
                      <span className="ml-auto text-[11px] text-primary-dark font-bold bg-green-50 px-2 py-0.5 rounded-sm border border-primary-light">
                        {product.specs.origin}
                      </span>
                    </div>

                    <h3 
                      onClick={() => setSelectedQuickViewProduct(product)}
                      className="font-heading font-bold text-gray-900 text-[14px] sm:text-[15px] line-clamp-2 hover:text-primary cursor-pointer transition-colors"
                    >
                      {product.title}
                    </h3>
                  </div>

                  {/* Pricing & Buttons */}
                  <div className="pt-2 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[16px] sm:text-[18px] font-heading font-bold text-price block">
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-[12px] text-gray-400 line-through">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                    
                          {product.promotion && (
                            <div className="mt-1.5 text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-sm border border-orange-200 truncate">
                              🎁 {product.promotion}
                            </div>
                          )}</div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedQuickViewProduct(product)}
                        className="py-2 px-2 rounded-md text-[13px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 uppercase"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>CHI TIẾT</span>
                      </button>

                      <button
                        onClick={() => onOrderProduct(product)}
                        className="py-2 px-2 rounded-md text-[13px] font-bold text-white bg-primary hover:bg-primary-dark shadow-sm transition-colors flex items-center justify-center gap-1 uppercase"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>MUA NGAY</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Quick View Modal */}
      {selectedQuickViewProduct && (
        <ProductQuickViewModal
          product={selectedQuickViewProduct}
          onClose={() => setSelectedQuickViewProduct(null)}
          onOrder={onOrderProduct}
          onCallHotline={onCallHotline}
        />
      )}
    </section>
  );
};
