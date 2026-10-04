import React, { useState, useEffect, useMemo } from 'react';
import { 
  PhoneCall, 
  Search, 
  ShoppingCart, 
  Menu, 
  X, 
  ChevronRight, 
  Droplet, 
  Zap, 
  Activity, 
  ShieldCheck, 
  Award, 
  Truck, 
  Lock, 
  Star, 
  Eye, 
  Settings, 
  Heart, 
  Leaf, 
  Users, 
  FileText, 
  ArrowRight, 
  User,
  LayoutGrid, 
  MessageSquare, 
  ArrowUp,
  CheckCircle2,
  Play,
  Calendar,
  Sparkles,
  Coffee,
  Wrench,
  Video,
  LogOut,
  MapPin,
  Home,
  HelpCircle,
  Newspaper,
  Droplets,
  Layers,
  Gift,
} from 'lucide-react';
import { api } from '../services/api';
import { Product, Article } from '../types/schema';
import { ProductQuickViewModal } from './ProductQuickViewModal';
import { DealerSection } from './DealerSection';

interface MobileLandingViewProps {
  onOrderProduct: (product: any) => void;
  onCallHotline: () => void;
  onOpenWarranty: () => void;
  onOpenContact: (product?: any) => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
  onCartClick: () => void;
  cartItemCount: number;
  user: any;
  onNavigate: (section: string) => void;
}

// Hàm lấy YouTube Embed URL
function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  let videoId = '';
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0];
  } else if (url.includes('watch?v=')) {
    videoId = url.split('watch?v=')[1].split('&')[0];
  } else if (url.includes('embed/')) {
    videoId = url.split('embed/')[1].split('?')[0];
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : null;
}

// 4 Nhóm danh mục chính chuẩn theo wasypro.com
const CATEGORY_TABS = [
  { id: 'may-loc-nuoc', name: 'Máy Lọc Nước', icon: Droplet },
  { id: 'dung-cu-test-nuoc', name: 'Dụng Cụ Test Nước', icon: Coffee },
  { id: 'phu-kien', name: 'Phụ Kiện Máy Lọc Nước', icon: Wrench },
  { id: 'all', name: 'Tất Cả Sản Phẩm', icon: CheckCircle2 }
];

export const MobileLandingView: React.FC<MobileLandingViewProps> = ({
  onOrderProduct,
  onCallHotline,
  onOpenWarranty,
  onOpenContact,
  onOpenAuth,
  onCartClick,
  cartItemCount = 0,
  user,
  onNavigate
}) => {
  // Dynamic Contact Config for Drawer & Mobile Footer
  const [contactConfig, setContactConfig] = useState({
    facebook: 'https://facebook.com/wasypro',
    zalo: 'https://zalo.me/2928413591064686973',
    hotline: '1900 98 98 78',
    hotlineTel: '1900989878',
    email: 'support@wasypro.com',
    address: 'Tầng 6, Tòa nhà WASY Tower, Q. Cầu Giấy, TP. Hà Nội',
  });

  useEffect(() => {
    fetch('/api/public/contact-config')
      .then(r => r.json())
      .then(d => {
        if (d && d.success && d.data) {
          setContactConfig(prev => ({ ...prev, ...d.data }));
        }
      })
      .catch(() => {});
  }, []);

  // Banner Slider State
  const bannerImages = [
    '/images/banner1.jpg?v=20261001',
    '/images/banner2.jpg?v=20261001',
    '/images/banner3.jpg?v=20261001'
  ];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerImages.length]);

  // Product Filter & Search (Mặc định chọn Máy Lọc Nước giống wasypro.com)
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('may-loc-nuoc');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price_desc' | 'price_asc'>('price_desc');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Warranty Lookup State
  const [warrantyQuery, setWarrantyQuery] = useState('');
  const [warrantyResult, setWarrantyResult] = useState<any>(null);
  const [warrantyStatus, setWarrantyStatus] = useState<'idle' | 'loading' | 'success' | 'empty' | 'error'>('idle');

  // Video & News State
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeVideoTab, setActiveVideoTab] = useState<string>('all');

  // Mobile Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load Products & Articles
  useEffect(() => {
    api.getProducts().then((data) => {
      if (data && data.length > 0) setProducts(data);
    }).catch(() => {});

    api.getArticles().then((data) => {
      if (data && data.length > 0) setArticles(data);
    }).catch(() => {});
  }, []);

  // Hàm kiểm tra sản phẩm thuộc Tab nào chuẩn wasypro.com
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
      return catId === 'cat-03' || titleLower.includes('test') || titleLower.includes('đo') || titleLower.includes('bút') || titleLower.includes('điện phân');
    }

    // 3. PHỤ KIỆN MÁY LỌC NƯỚC: Lõi lọc, màng lọc, phụ kiện
    if (tabId === 'phu-kien') {
      return catId === 'cat-04' || catId === 'cat-05' || 
             titleLower.includes('lõi') || 
             titleLower.includes('phụ kiện') || 
             titleLower.includes('màn chống');
    }

    return true;
  };

  // Đếm số lượng sản phẩm mỗi Tab
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORY_TABS.forEach(tab => {
      counts[tab.id] = products.filter(p => isProductInTab(p, tab.id)).length;
    });
    return counts;
  }, [products]);

  // Filtered Products
  const displayedProducts = useMemo(() => {
    let result = products.filter((p) => isProductInTab(p, selectedCategory));

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((p) => 
        (p.title || '').toLowerCase().includes(query) || 
        (p.description || '').toLowerCase().includes(query)
      );
    }

    if (sortBy === 'price_asc') {
      result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else {
      result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Danh mục video
  const videoCategories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach(a => { if (a.category) set.add(a.category); });
    return ['all', ...Array.from(set)];
  }, [articles]);

  const displayedArticles = useMemo(() => {
    if (activeVideoTab === 'all') return articles;
    return articles.filter(a => a.category === activeVideoTab);
  }, [articles, activeVideoTab]);

  const activeEmbedUrl = selectedArticle ? getYouTubeEmbedUrl(selectedArticle.videoUrl) : null;

  // Handle Warranty Lookup
  const handleWarrantySearch = async (val?: string) => {
    const term = (val || warrantyQuery).trim();
    if (!term) return;
    setWarrantyStatus('loading');
    setWarrantyResult(null);
    try {
      const res = await api.lookupWarranty(term);
      if (res) {
        setWarrantyResult(res);
        setWarrantyStatus('success');
      } else {
        setWarrantyStatus('empty');
      }
    } catch {
      setWarrantyStatus('empty');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full bg-[#F8FAFC] text-[#0F172A] font-sans pb-10">
      
      {/* ==================== 1. TOP BAR ==================== */}
      <div className="bg-[#0052CC] text-white text-[11px] py-1.5 px-3 flex justify-between items-center font-medium tracking-wide">
        <a href="tel:1900989878" className="flex items-center gap-1 font-bold hover:underline">
          <PhoneCall className="w-3 h-3 text-[#FFCC00]" />
          <span>HOTLINE: 1900 98 98 78</span>
        </a>
        <div className="flex items-center gap-2 text-[10px] uppercase font-semibold text-sky-100">
          <span className="cursor-pointer hover:text-white" onClick={() => onNavigate('benefits')}>GIỚI THIỆU</span>
          <span className="opacity-40">|</span>
          <span className="cursor-pointer hover:text-white" onClick={() => onOpenContact()}>LIÊN HỆ</span>
          <span className="opacity-40">|</span>
          <span className="cursor-pointer hover:text-white" onClick={() => onNavigate('faq')}>FAQS</span>
        </div>
      </div>

      {/* ==================== 2. MOBILE HEADER ==================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#EEF2F6] px-3.5 py-2.5 flex items-center justify-between shadow-xs">
        {/* Logo */}
        <div onClick={() => onNavigate('hero')} className="cursor-pointer flex items-center">
          <img src="/images/logo-rbg.webp" alt="WASY PRO" className="h-9 w-auto object-contain" />
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {/* NÚT ĐĂNG NHẬP NỔI BẬT DÀNH CHO KHÁCH HÀNG & NGƯỜI CAO TUỔI */}
          {!user ? (
            <button
              onClick={() => onOpenAuth('login')}
              className="px-3 py-2 rounded-full bg-[#0072F5]/10 border border-[#0072F5] text-[#0072F5] text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-xs"
              title="Đăng nhập tài khoản"
            >
              <User className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </button>
          ) : (
            <a
              href="/ctv"
              className="px-3 py-1.5 rounded-full bg-[#0072F5] text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-blue-200"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Quản lý CTV</span>
            </a>
          )}

          {/* Search Icon */}
          <button 
            onClick={() => {
              const el = document.getElementById('product-search-input');
              if (el) el.focus();
            }}
            className="p-2 text-[#334155] hover:text-[#0072F5]"
            aria-label="Tìm kiếm"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Cart Icon */}
          <button 
            onClick={onCartClick}
            className="relative p-2 text-[#334155] hover:text-[#0072F5]"
            aria-label="Giỏ hàng"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#ED4956] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {cartItemCount}
              </span>
            )}
          </button>

          {/* Hamburger Menu */}
          <button 
            onClick={() => setDrawerOpen(true)}
            className="p-2 text-[#334155] hover:text-[#0072F5]"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* ==================== 3. HERO BANNER SLIDER ==================== */}
      <section className="relative w-full bg-slate-900 overflow-hidden">
        <div className="relative w-full aspect-[16/9] min-h-[200px]">
          {bannerImages.map((src, idx) => (
            <img
              key={idx}
              src={src}
              alt={`Banner ${idx + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            />
          ))}
        </div>

        {/* Slider Dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full">
          {bannerImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentSlide ? 'w-5 bg-[#0072F5]' : 'w-1.5 bg-white/60'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ==================== 4. KEY METRICS BAR ==================== */}
      <section className="bg-white mx-3.5 -mt-2 relative z-20 rounded-2xl border border-[#EEF2F6] p-3 shadow-xs">
        <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
          {/* Metric 1: pH */}
          <div className="flex flex-col items-center px-1">
            <div className="w-7 h-7 rounded-full bg-[#F0F7FF] flex items-center justify-center text-[#0072F5] mb-1">
              <Droplet className="w-4 h-4 fill-current" />
            </div>
            <span className="text-[20px] font-black text-[#0F172A] leading-none">9.5</span>
            <span className="text-[10px] font-bold text-[#475569] uppercase mt-0.5">pH NƯỚC KIỀM</span>
            <span className="text-[9px] text-[#94A3B8] font-medium leading-tight">GIÀU ION</span>
          </div>

          {/* Metric 2: ORP */}
          <div className="flex flex-col items-center px-1">
            <div className="w-7 h-7 rounded-full bg-[#FFF7E6] flex items-center justify-center text-[#F5A623] mb-1">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <span className="text-[20px] font-black text-[#0F172A] leading-none">-600 <span className="text-[12px] font-bold">mV</span></span>
            <span className="text-[10px] font-bold text-[#475569] uppercase mt-0.5">CHỐNG OXY</span>
            <span className="text-[9px] text-[#94A3B8] font-medium leading-tight">HÓA</span>
          </div>

          {/* Metric 3: Hydrogen */}
          <div className="flex flex-col items-center px-1">
            <div className="w-7 h-7 rounded-full bg-[#F0F7FF] flex items-center justify-center text-[#0072F5] mb-1">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[20px] font-black text-[#0F172A] leading-none">1600 <span className="text-[12px] font-bold">ppb</span></span>
            <span className="text-[10px] font-bold text-[#475569] uppercase mt-0.5">HÀM LƯỢNG</span>
            <span className="text-[9px] text-[#94A3B8] font-medium leading-tight">HYDROGEN</span>
          </div>
        </div>

        {/* 2 CTA Buttons */}
        <div className="mt-4 space-y-2">
          <button
            onClick={() => {
              const el = document.getElementById('featured-products-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full h-12 bg-[#0072F5] hover:bg-[#0052CC] text-white rounded-[14px] font-bold text-[15px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all"
          >
            <span>Khám Phá Sản Phẩm</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onOpenContact()}
            className="w-full h-12 bg-white border-2 border-[#0072F5] text-[#0072F5] rounded-[14px] font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
          >
            <PhoneCall className="w-4 h-4 text-[#0072F5]" />
            <span>Tư Vấn Miễn Phí</span>
          </button>
        </div>
      </section>

      {/* ==================== 5. "MẤY CÁI CỤC" GIỐNG GIAO DIỆN APP (QUICK SHORTCUTS BUBBLES) ==================== */}
      <section className="mt-5 px-3.5">
        <div className="bg-white rounded-2xl border border-[#EEF2F6] p-3.5 shadow-xs">
          <div className="grid grid-cols-4 gap-y-3.5 gap-x-2 text-center">
            {/* Cục 1: Máy Lọc Nước */}
            <div 
              onClick={() => {
                setSelectedCategory('may-loc-nuoc');
                const el = document.getElementById('featured-products-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center cursor-pointer group active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0052CC] to-[#0072F5] text-white flex items-center justify-center shadow-md shadow-[#0072F5]/20 mb-1 group-hover:scale-105 transition-transform">
                <Droplet className="w-6 h-6 fill-white" />
              </div>
              <span className="text-[11px] font-bold text-[#0F172A] leading-tight">Máy Lọc Nước</span>
            </div>

            {/* Cục 2: Dụng Cụ Test */}
            <div 
              onClick={() => {
                setSelectedCategory('dung-cu-test-nuoc');
                const el = document.getElementById('featured-products-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center cursor-pointer group active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F59E0B] to-[#FBBF24] text-white flex items-center justify-center shadow-md shadow-[#F59E0B]/20 mb-1 group-hover:scale-105 transition-transform">
                <Coffee className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-[#0F172A] leading-tight">Dụng Cụ Test</span>
            </div>

            {/* Cục 3: Phụ Kiện Lõi */}
            <div 
              onClick={() => {
                setSelectedCategory('phu-kien');
                const el = document.getElementById('featured-products-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center cursor-pointer group active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#059669] to-[#10B981] text-white flex items-center justify-center shadow-md shadow-[#059669]/20 mb-1 group-hover:scale-105 transition-transform">
                <Wrench className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-[#0F172A] leading-tight">Phụ Kiện Lõi</span>
            </div>

            {/* Cục 4: Tra Cứu BH */}
            <div 
              onClick={() => {
                const el = document.getElementById('warranty-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center cursor-pointer group active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4338CA] to-[#6366F1] text-white flex items-center justify-center shadow-md shadow-[#4338CA]/20 mb-1 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-[#0F172A] leading-tight">Tra Cứu BH</span>
            </div>

            {/* Cục 5: Video Sự Kiện */}
            <div 
              onClick={() => {
                const el = document.getElementById('video-news-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center cursor-pointer group active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#DC2626] to-[#EF4444] text-white flex items-center justify-center shadow-md shadow-[#DC2626]/20 mb-1 group-hover:scale-105 transition-transform">
                <Play className="w-6 h-6 fill-white ml-0.5" />
              </div>
              <span className="text-[11px] font-bold text-[#0F172A] leading-tight">Video Sự Kiện</span>
            </div>

            {/* Cục 6: Kinh Doanh CTV */}
            <div 
              onClick={() => {
                if (user) {
                  window.location.href = '/ctv';
                } else {
                  onOpenAuth('login');
                }
              }}
              className="flex flex-col items-center cursor-pointer group active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] text-white flex items-center justify-center shadow-md shadow-[#7C3AED]/20 mb-1 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-[#0F172A] leading-tight">Đối Tác CTV</span>
            </div>

            {/* Cục 7: Hệ Thống Đại Lý */}
            <div 
              onClick={() => {
                const el = document.getElementById('dealers');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center cursor-pointer group active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] text-white flex items-center justify-center shadow-md shadow-[#0284C7]/20 mb-1 group-hover:scale-105 transition-transform">
                <MapPin className="w-6 h-6 fill-white" />
              </div>
              <span className="text-[11px] font-bold text-[#0F172A] leading-tight">Đại Lý</span>
            </div>

            {/* Cục 8: Tư Vấn 24/7 */}
            <div 
              onClick={() => onOpenContact()}
              className="flex flex-col items-center cursor-pointer group active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white flex items-center justify-center shadow-md shadow-[#EA580C]/20 mb-1 group-hover:scale-105 transition-transform">
                <PhoneCall className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-[#0F172A] leading-tight">Tư Vấn 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 6. 4 TRUST BADGES ==================== */}
      <section className="mt-4 px-3.5">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-[#F0F7FF] border border-[#E0EEFF] flex items-center justify-center text-[#0072F5] mb-1 shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-[#0F172A] leading-tight">Chuẩn Y Tế</span>
            <span className="text-[9px] text-[#475569]">ISO 13485</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-[#F0F7FF] border border-[#E0EEFF] flex items-center justify-center text-[#0072F5] mb-1 shadow-2xs">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-[#0F172A] leading-tight">Chứng nhận</span>
            <span className="text-[9px] text-[#475569]">Hàn Quốc</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-[#F0F7FF] border border-[#E0EEFF] flex items-center justify-center text-[#0072F5] mb-1 shadow-2xs">
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-[#0F172A] leading-tight">Miễn phí</span>
            <span className="text-[9px] text-[#475569]">vận chuyển</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-[#F0F7FF] border border-[#E0EEFF] flex items-center justify-center text-[#0072F5] mb-1 shadow-2xs">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-[#0F172A] leading-tight">Bảo hành</span>
            <span className="text-[9px] text-[#475569]">5 năm</span>
          </div>
        </div>
      </section>

      {/* ==================== 7. SẢN PHẨM NỔI BẬT ==================== */}
      <section id="featured-products-section" className="mt-8 px-3.5">
        {/* Section Header */}
        <div className="text-center mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#F0F7FF] text-[#0072F5] flex items-center justify-center mx-auto mb-2 shadow-2xs">
            <Settings className="w-5 h-5" />
          </div>
          <h2 className="text-[19px] font-black text-[#0F172A] uppercase tracking-wide">
            SẢN PHẨM NỔI BẬT
          </h2>
          <p className="text-[12px] text-[#475569] mt-1 max-w-xs mx-auto leading-relaxed">
            Công nghệ tạo nước Hydrogen tươi & ion kiềm sạch chuẩn y tế quốc tế
          </p>
        </div>

        {/* Filter Pills — Chuẩn Danh Mục Như Trên wasypro.com */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const count = tabCounts[tab.id] || 0;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 py-2.5 rounded-full text-xs font-bold min-h-[40px] whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === tab.id
                    ? 'bg-[#0072F5] text-white shadow-xs'
                    : 'bg-white text-[#475569] border border-[#E2E8F0] hover:bg-slate-50'
                }`}
              >
                <span>{tab.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <input
            id="product-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm máy, model, thông số..."
            className="w-full h-11 pl-9 pr-3.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0072F5] shadow-2xs"
          />
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Bar */}
        <div className="mt-2.5 flex items-center justify-between text-xs text-[#475569]">
          <span className="text-[11px] font-medium text-[#94A3B8]">Hiển thị {displayedProducts.length} sản phẩm</span>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[#475569]">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-bold text-[#0F172A] text-[11px] focus:outline-none"
            >
              <option value="price_desc">Giá: Cao đến Thấp</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
            </select>
          </div>
        </div>

        {/* Product Grid (2 Columns) */}
        <div className="mt-3.5 grid grid-cols-2 gap-2.5">
          {displayedProducts.map((p, idx) => {
            const discounts = [25, 29, 24, 24];
            const discountPercent = discounts[idx % discounts.length];
            const originalPrice = p.originalPrice || Math.round(p.price / (1 - discountPercent / 100));

            return (
              <div 
                key={p.id}
                className="bg-white rounded-2xl border border-[#EEF2F6] p-2.5 flex flex-col justify-between shadow-2xs relative"
              >
                {/* Badges */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    idx % 2 === 0 ? 'bg-[#FFF0F2] text-[#ED4956]' : 'bg-[#ECFDF5] text-[#008A45]'
                  }`}>
                    {idx % 2 === 0 ? '🔥 HOT' : '🌱 MỚI'}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#FFF0F2] text-[#ED4956]">
                    -{discountPercent}%
                  </span>
                </div>

                {/* Product Image với Fallback đầy đủ */}
                <div 
                  onClick={() => setQuickViewProduct(p)}
                  className="w-full aspect-square rounded-xl bg-slate-50 flex items-center justify-center p-1.5 cursor-pointer overflow-hidden group"
                >
                  <img
                    src={p.image || '/images/products/prod-1.webp'}
                    alt={p.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/images/products/prod-1.webp';
                    }}
                  />
                </div>

                {/* Rating & Country */}
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-0.5 text-[#F5A623] font-bold">
                    <Star className="w-3 h-3 fill-current" />
                    <span>5</span>
                    <span className="text-[#94A3B8] font-normal">({p.reviewsCount || 0})</span>
                  </div>
                  <span className="text-[10px] text-[#0072F5] font-semibold bg-[#F0F7FF] px-1.5 py-0.5 rounded-sm">
                    Việt Nam
                  </span>
                </div>

                {/* Product Title */}
                <h3 
                  onClick={() => setQuickViewProduct(p)}
                  className="mt-1.5 text-[13px] font-bold text-[#0F172A] line-clamp-2 leading-tight min-h-[34px] cursor-pointer hover:text-[#0072F5]"
                >
                  {p.title}
                </h3>

                {/* Specs Pills */}
                <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-[#0052CC] font-semibold">
                  <span className="bg-[#F0F7FF] px-1 py-0.5 rounded-sm">H₂: 1500 ppb</span>
                  <span className="bg-[#F0F7FF] px-1 py-0.5 rounded-sm">pH: 3.5 - 10.5</span>
                </div>

                {/* Price */}
                <div className="mt-2">
                  <div className="text-[15px] font-black text-[#ED4956] leading-none">
                    {p.price.toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-[#94A3B8] line-through font-medium mt-0.5">
                    {originalPrice.toLocaleString('vi-VN')} đ
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-2.5 flex items-center gap-1.5">
                  <button
                    onClick={() => setQuickViewProduct(p)}
                    className="w-9 h-9 rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0072F5] hover:border-[#0072F5] transition-all flex-shrink-0"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOrderProduct(p)}
                    className="flex-1 h-10 rounded-xl bg-[#0072F5] hover:bg-[#0052CC] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>MUA NGAY</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Xem tất cả sản phẩm Button */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setSelectedCategory('all')}
            className="w-full py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0072F5] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#F0F7FF] transition-all shadow-2xs"
          >
            <span>Xem tất cả sản phẩm</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ==================== 8. PROMO BANNER GIỮA TRANG ==================== */}
      <section className="mt-6 px-3.5">
        <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-[#0052CC] to-[#0072F5] text-white p-4 shadow-sm flex items-center justify-between">
          <div className="max-w-[65%] z-10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFCC00]">
              GIẢI PHÁP NƯỚC
            </span>
            <h3 className="text-[16px] font-black leading-tight mt-0.5">
              HYDROGEN
            </h3>
            <p className="text-[10px] text-sky-100 font-medium mt-1 leading-snug">
              NƯỚC TỐT – THÂN AN – TRÍ SÁNG
            </p>
            <button
              onClick={() => onOpenContact()}
              className="mt-3 px-3 py-1.5 bg-white text-[#0052CC] font-bold text-xs rounded-lg shadow-xs flex items-center gap-1"
            >
              <span>Xem chi tiết</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="w-[34%] aspect-square rounded-xl overflow-hidden flex items-center justify-center bg-white/10">
            <img
              src="/images/banner1.jpg?v=20261001"
              alt="Hydrogen Solution"
              className="w-full h-full object-cover filter drop-shadow-md"
            />
          </div>
        </div>
      </section>

      {/* ==================== 9. SỨC KHỎE HYDROGEN ==================== */}
      <section id="benefits-section" className="mt-8 px-3.5">
        <div className="text-center mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#F0F7FF] text-[#0072F5] flex items-center justify-center mx-auto mb-2 shadow-2xs">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <h2 className="text-[19px] font-black text-[#0F172A] uppercase tracking-wide">
            SỨC KHỎE HYDROGEN
          </h2>
          <p className="text-[12px] text-[#475569] mt-1 max-w-xs mx-auto leading-relaxed">
            Mang lại nguồn nước khỏe mạnh cho hàng triệu gia đình Việt
          </p>
        </div>

        {/* 4 Benefit Cards */}
        <div className="space-y-2.5">
          <div className="bg-white rounded-2xl border border-[#EEF2F6] p-3.5 flex items-center justify-between shadow-2xs cursor-pointer hover:border-[#0072F5] transition-all">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0072F5] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-[#0F172A] leading-snug">
                  Chống Oxy Hóa Mạnh Giúp Trẻ Hóa Tế Bào
                </h4>
                <p className="text-[12px] text-[#475569] mt-1 leading-relaxed">
                  Loại bỏ gốc tự do dư thừa, làm chậm quá trình lão hóa da & cơ quan nội tạng.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#0072F5] flex-shrink-0 ml-2" />
          </div>

          <div className="bg-white rounded-2xl border border-[#EEF2F6] p-3.5 flex items-center justify-between shadow-2xs cursor-pointer hover:border-[#0072F5] transition-all">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0072F5] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                <Droplet className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-[#0F172A] leading-snug">
                  Cụm Phân Tử Nước Siêu Nhỏ Thấm Thấu Nhanh
                </h4>
                <p className="text-[12px] text-[#475569] mt-1 leading-relaxed">
                  Kích thước chỉ 0.5nm (gấp 5 lần nhỏ hơn nước thường) giúp thẩm thấu sâu vào tế bào.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#0072F5] flex-shrink-0 ml-2" />
          </div>

          <div className="bg-white rounded-2xl border border-[#EEF2F6] p-3.5 flex items-center justify-between shadow-2xs cursor-pointer hover:border-[#00B050] transition-all">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00B050] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                <Heart className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-[#0F172A] leading-snug">
                  Cân Bằng Kiềm Tính & Trung Hòa Axit Dạ Dày
                </h4>
                <p className="text-[12px] text-[#475569] mt-1 leading-relaxed">
                  pH 8.5 - 9.5 tự nhiên giúp giảm triệu chứng trào ngược, viêm loét dạ dày.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#00B050] flex-shrink-0 ml-2" />
          </div>

          <div className="bg-white rounded-2xl border border-[#EEF2F6] p-3.5 flex items-center justify-between shadow-2xs cursor-pointer hover:border-[#00B050] transition-all">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00B050] text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                <Leaf className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-[#0F172A] leading-snug">
                  Đào Thải Độc Tố & Kim Loại Nặng
                </h4>
                <p className="text-[12px] text-[#475569] mt-1 leading-relaxed">
                  Hỗ trợ gan thận lọc máu, thanh lọc cơ thể sau khi vận động mạnh hoặc dùng bia rượu.
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#00B050] flex-shrink-0 ml-2" />
          </div>
        </div>
      </section>

      {/* ==================== 10. KHÁCH HÀNG TIN DÙNG ==================== */}
      <section className="mt-8 px-3.5">
        <div className="text-center mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#F0F7FF] text-[#0072F5] flex items-center justify-center mx-auto mb-2 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-[19px] font-black text-[#0F172A] uppercase tracking-wide">
            KHÁCH HÀNG TIN DÙNG
          </h2>
          <p className="text-[12px] text-[#475569] mt-1 max-w-xs mx-auto leading-relaxed">
            Hàng ngàn gia đình Việt đã lựa chọn WASY PRO
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl border border-[#EEF2F6] p-3 text-center shadow-2xs flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#F0F7FF] flex items-center justify-center text-[#0072F5] mb-1">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[19px] font-black text-[#0F172A] leading-none">1,456+</span>
            <span className="text-[10px] text-[#475569] font-medium mt-1">Gia đình tin dùng</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#EEF2F6] p-3 text-center shadow-2xs flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#FFF7E6] flex items-center justify-center text-[#F5A623] mb-1">
              <Award className="w-4 h-4" />
            </div>
            <span className="text-[19px] font-black text-[#0F172A] leading-none">98%</span>
            <span className="text-[10px] text-[#475569] font-medium mt-1">Khách hài lòng</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#EEF2F6] p-3 text-center shadow-2xs flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#FFF7E6] flex items-center justify-center text-[#FFCC00] mb-1">
              <Star className="w-4 h-4 fill-current" />
            </div>
            <span className="text-[19px] font-black text-[#0F172A] leading-none">5/5</span>
            <span className="text-[10px] text-[#475569] font-medium mt-1">Đánh giá cao</span>
          </div>
        </div>
      </section>

      {/* ==================== 11. TRA CỨU BẢO HÀNH ==================== */}
      <section id="warranty-section" className="mt-8 px-3.5">
        <div className="text-center mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#F0F7FF] text-[#0072F5] flex items-center justify-center mx-auto mb-2 shadow-2xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-[19px] font-black text-[#0F172A] uppercase tracking-wide">
            TRA CỨU BẢO HÀNH
          </h2>
          <p className="text-[12px] text-[#475569] mt-1 max-w-xs mx-auto leading-relaxed">
            Nhập số điện thoại mua hàng hoặc Mã máy/Serial ghi trên tem máy WASY PRO để kiểm tra.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#EEF2F6] p-3.5 shadow-2xs space-y-2.5">
          <div className="relative">
            <input
              type="text"
              value={warrantyQuery}
              onChange={(e) => setWarrantyQuery(e.target.value)}
              placeholder="Ví dụ: 0900000000 hoặc WASY240811"
              className="w-full h-11 pl-9 pr-3.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0072F5]"
            />
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <button
            onClick={() => handleWarrantySearch()}
            className="w-full h-12 bg-[#0072F5] hover:bg-[#0052CC] text-white font-bold text-[15px] rounded-[14px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all"
          >
            <Search className="w-4 h-4" />
            <span>Tra cứu ngay</span>
          </button>

          <div className="pt-1">
            <div className="text-[11px] text-[#94A3B8] font-medium mb-1.5">Mẫu tra cứu:</div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { code: '0900000000', color: 'bg-[#F0F7FF] text-[#0072F5] border-[#E0EEFF]' },
                { code: '0912345678', color: 'bg-[#FFF0F2] text-[#ED4956] border-[#FFE4E6]' },
                { code: 'WASY240811C', color: 'bg-[#FFF7E6] text-[#F5A623] border-[#FEF3C7]' }
              ].map((chip) => (
                <button
                  key={chip.code}
                  onClick={() => {
                    setWarrantyQuery(chip.code);
                    handleWarrantySearch(chip.code);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold ${chip.color} active:scale-95 transition-all`}
                >
                  {chip.code}
                </button>
              ))}
            </div>
          </div>

          {warrantyStatus === 'loading' && (
            <div className="p-3 text-center text-xs text-[#64748B]">Đang tìm kiếm thông tin bảo hành...</div>
          )}
          {warrantyStatus === 'empty' && (
            <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs text-center border border-amber-200">
              Không tìm thấy thông tin bảo hành cho mã này.
            </div>
          )}
          {warrantyStatus === 'success' && warrantyResult && (
            <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs text-[#065F46] space-y-1">
              <div className="font-bold text-sm text-[#008A45] flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Bảo Hành Hợp Lệ</span>
              </div>
              <div>Khách hàng: <span className="font-bold">{warrantyResult.customerName}</span></div>
              <div>Sản phẩm: <span className="font-bold">{warrantyResult.productModel}</span></div>
              <div>Hạn bảo hành: <span className="font-bold">{warrantyResult.expiryDate || '5 Năm'}</span></div>
            </div>
          )}
        </div>
      </section>

      {/* ==================== 12. TIN TỨC & VIDEO SỰ KIỆN (CHẠY VIDEO YOUTUBE THỰC TẾ) ==================== */}
      <section id="video-news-section" className="mt-8 px-3.5">
        <div className="text-center mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#F0F7FF] text-[#0072F5] flex items-center justify-center mx-auto mb-2 shadow-2xs">
            <Video className="w-5 h-5" />
          </div>
          <h2 className="text-[19px] font-black text-[#0F172A] uppercase tracking-wide">
            TIN TỨC & VIDEO SỰ KIỆN
          </h2>
          <p className="text-[12px] text-[#475569] mt-1 max-w-xs mx-auto leading-relaxed">
            Hành trình lan tỏa nguồn nước tốt & sự ghi nhận từ đài truyền hình HTV
          </p>
        </div>

        {/* Video Filter Tabs */}
        {videoCategories.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-3 no-scrollbar">
            {videoCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveVideoTab(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                  activeVideoTab === cat
                    ? 'bg-[#0072F5] text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-[#E2E8F0]'
                }`}
              >
                {cat === 'all' ? 'Tất cả' : cat}
              </button>
            ))}
          </div>
        )}

        {/* Video List Items (Hiển thị dạng Video Card có nút Play YouTube Đỏ) */}
        <div className="space-y-3">
          {displayedArticles.slice(0, 4).map((art) => (
            <div
              key={art.id}
              className="bg-white rounded-2xl border border-[#EEF2F6] overflow-hidden shadow-2xs hover:border-[#0072F5] transition-all group flex flex-col"
            >
              {/* Thumbnail Video chuẩn 16:9 với Nút Play Đỏ Nổi Bật */}
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                <img
                  src={art.image}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/images/banner-web.webp';
                  }}
                />

                {/* Overlay Play Button */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-115 transition-transform duration-300">
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Category Badge */}
                {art.category && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                    {art.category}
                  </span>
                )}
              </div>

              {/* Video Info */}
              <div className="p-3 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium mb-1">
                    <Calendar className="w-3 h-3 text-[#0072F5]" />
                    <span>{art.date}</span>
                    <span>•</span>
                    <span className="font-semibold text-slate-600">{art.author || 'Ban Truyền Thông'}</span>
                  </div>

                  <h3 className="text-[13px] font-bold text-[#0F172A] line-clamp-2 leading-snug group-hover:text-[#0072F5] transition-colors">
                    {art.title}
                  </h3>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-[#0072F5] font-bold">
                  <span className="flex items-center gap-1">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Xem video chi tiết</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#0072F5]" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Xem tất cả video Button */}
        <div className="mt-3.5 text-center">
          <button
            onClick={() => onNavigate('news')}
            className="w-full py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#0072F5] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#F0F7FF] transition-all shadow-2xs"
          >
            <span>Xem tất cả video & tin tức</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* ==================== 12.5. HỆ THỐNG ĐẠI LÝ ==================== */}
      <DealerSection />

      {/* ==================== 13. FOOTER WASY PRO ==================== */}
      <footer className="mt-10 bg-[#003E99] text-white pt-8 pb-12 px-4">
        <div className="mb-4">
          <h3 className="text-[18px] font-black tracking-wider text-white">WASY PRO</h3>
          <span className="text-[11px] font-bold text-sky-200 tracking-wider">WATER KING HYDROGEN</span>
          <p className="text-[11px] text-sky-100/80 mt-2 leading-relaxed">
            WATER KING WASY PRO tiên phong ứng dụng công nghệ điện giải ion kiềm chuẩn y tế Hàn Quốc & Nhật Bản. Mang lại nguồn nước khỏe mạnh cho hàng triệu gia đình Việt.
          </p>
        </div>

        <div className="space-y-1.5 text-[11px] text-sky-100/90 border-t border-sky-800/60 pt-3">
          <div className="flex items-start gap-1.5">
            <span className="text-amber-300">📍</span>
            <span>Trụ sở chính: Tầng 6, Tòa nhà WASY Tower, Q. Cầu Giấy, TP. Hà Nội</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-300">📞</span>
            <a href="tel:1900989878" className="hover:underline font-bold text-white">Hotline 24/7: 1900 98 98 78</a>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-amber-300">✉️</span>
            <span>Email: support@wasypro.com</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-sky-800/60">
          <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white font-bold text-xs">f</a>
          <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white font-bold text-xs">▶</a>
          <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white font-bold text-xs">♪</a>
          <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white font-bold text-xs">in</a>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-5 text-[11px] border-t border-sky-800/60 pt-4">
          <div className="space-y-2">
            <div onClick={() => onNavigate('hero')} className="cursor-pointer hover:underline text-sky-100">› VỀ WASY PRO</div>
            <div onClick={() => onNavigate('products')} className="cursor-pointer hover:underline text-sky-100">› Sản phẩm</div>
            <div onClick={() => onNavigate('news')} className="cursor-pointer hover:underline text-sky-100">› Tin tức</div>
            <div onClick={() => onNavigate('warranty')} className="cursor-pointer hover:underline text-sky-100">› Chính sách bảo hành</div>
            <div onClick={() => onNavigate('benefits')} className="cursor-pointer hover:underline text-sky-100">› Lợi ích</div>
          </div>
          <div className="space-y-2">
            <div onClick={() => onOpenContact()} className="cursor-pointer hover:underline text-sky-100">› Hỗ trợ khách hàng</div>
            <div onClick={() => onOpenWarranty()} className="cursor-pointer hover:underline text-sky-100">› Tra cứu bảo hành</div>
            <div onClick={() => onNavigate('warranty')} className="cursor-pointer hover:underline text-sky-100">› Giao hàng & Lắp đặt</div>
            <div onClick={() => onNavigate('faq')} className="cursor-pointer hover:underline text-sky-100">› FAQs</div>
            <div onClick={() => onOpenContact()} className="cursor-pointer hover:underline text-sky-100">› Liên hệ</div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-sky-800/60 text-center text-[10px] text-sky-200/70">
          <div>© 2026 WASY PRO. Tất cả các quyền được bảo lưu.</div>
          <div className="mt-1 flex justify-center gap-3">
            <span className="cursor-pointer hover:underline">Điều khoản</span>
            <span>|</span>
            <span className="cursor-pointer hover:underline">Chính sách bảo mật</span>
          </div>
        </div>
      </footer>

      {/* ==================== 14. FLOATING ACTION BUTTONS ==================== */}
      <div className="fixed bottom-5 right-3.5 z-40 flex flex-col items-center gap-2.5">
        <a
          href="tel:1900989878"
          className="w-12 h-12 rounded-full bg-[#F5A623] hover:bg-[#e0961d] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all animate-bounce"
          title="Gọi Hotline"
          aria-label="Gọi Hotline"
        >
          <PhoneCall className="w-5 h-5 text-white" />
        </a>

        <button
          onClick={() => onOpenContact()}
          className="w-12 h-12 rounded-full bg-[#0072F5] hover:bg-[#0052CC] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
          title="Tư vấn trực tuyến"
          aria-label="Tư vấn"
        >
          <MessageSquare className="w-5 h-5 text-white" />
        </button>

        <button
          onClick={scrollToTop}
          className="w-10 h-10 rounded-full bg-white text-[#0F172A] border border-[#E2E8F0] flex items-center justify-center shadow-md active:scale-95 transition-all"
          title="Lên đầu trang"
          aria-label="Lên đầu trang"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>

      {/* ===== POPUP XEM VIDEO YOUTUBE (FULL-SCREEN PLAYER) ===== */}
      {selectedArticle && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedArticle(null)}
        >
          <div 
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-slate-50">
              <span className="text-xs font-bold text-[#0072F5] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {selectedArticle.category || 'Video WASY PRO'}
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Trình chiếu Video YouTube hoặc Hình Ảnh */}
            <div className="relative w-full aspect-video bg-black">
              {activeEmbedUrl ? (
                <iframe
                  src={activeEmbedUrl}
                  title={selectedArticle.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <img
                  src={selectedArticle.image}
                  alt={selectedArticle.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Nội dung chi tiết */}
            <div className="p-4 overflow-y-auto space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                <Calendar className="w-3.5 h-3.5 text-[#0072F5]" />
                <span>{selectedArticle.date}</span>
                <span>•</span>
                <span className="font-semibold text-slate-700">{selectedArticle.author || 'Ban Truyền Thông'}</span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 leading-snug">
                {selectedArticle.title}
              </h3>

              {selectedArticle.excerpt && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedArticle.excerpt}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onOrderProduct={(p) => {
            setQuickViewProduct(null);
            onOrderProduct(p);
          }}
          onCallHotline={onCallHotline}
        />
      )}

      {/* ─── Mobile Drawer Menu (Tư Duy Mới Nhất 2026 - Chuẩn App Đẳng Cấp) ─── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[9999] flex">
          {/* Backdrop Blur */}
          <div 
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in" 
          />

          {/* Drawer Container */}
          <div className="relative ml-auto w-[85%] max-w-[340px] bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden z-10 animate-slideInRight border-l border-slate-100">
            {/* 1. Header Bar */}
            <div className="p-4 bg-gradient-to-r from-slate-50 via-white to-sky-50/40 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <img src="/images/logo-rbg.webp" alt="WASY PRO" className="h-8 w-auto object-contain" />
                <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-extrabold tracking-wide uppercase">
                  Menu
                </span>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                aria-label="Đóng menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* User / Member Welcome Card */}
              {!user ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-500 text-white shadow-[0_8px_20px_rgba(0,102,245,0.22)] relative overflow-hidden">
                  <div className="absolute -right-3 -bottom-3 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-2.5 mb-1.5 relative z-10">
                    <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white font-bold shadow-xs">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <div className="text-xs font-black leading-tight">Chào mừng quý khách!</div>
                      <div className="text-[10px] text-white/80">Trải nghiệm hệ sinh thái Water King</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-white/15 relative z-10">
                    <button
                      onClick={() => {
                        setDrawerOpen(false);
                        onOpenAuth('login');
                      }}
                      className="py-2 px-3 rounded-xl bg-white text-blue-700 font-extrabold text-xs shadow-xs hover:bg-blue-50 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>Đăng Nhập</span>
                    </button>
                    <button
                      onClick={() => {
                        setDrawerOpen(false);
                        onOpenAuth('register');
                      }}
                      className="py-2 px-3 rounded-xl bg-white/15 backdrop-blur-xs text-white border border-white/30 font-bold text-xs hover:bg-white/25 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Gift className="w-3.5 h-3.5 text-amber-300" />
                      <span>Đăng Ký</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white shadow-lg border border-slate-700/60 relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black truncate">{user.fullName}</div>
                      <div className="text-[11px] text-cyan-300 font-mono flex items-center gap-1.5">
                        <span>{user.phone}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-200 font-bold">
                          CTV
                        </span>
                      </div>
                    </div>
                  </div>
                  <a
                    href="/ctv"
                    className="mt-3 w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all text-center cursor-pointer"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Vào Bảng Quản Trị CTV</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* 3. Danh Mục Sản Phẩm (Thiết Kế Thẻ Trực Quan) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5 text-sky-500" />
                    <span>Danh Mục Sản Phẩm</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100">
                    {tabCounts['all'] || 8} sản phẩm
                  </span>
                </div>

                <div className="space-y-1.5">
                  {[
                    { id: 'may-loc-nuoc', name: 'Máy Lọc Nước Ion Kiềm', icon: Droplets, color: 'bg-blue-50 text-blue-600 border-blue-100' },
                    { id: 'dung-cu-test-nuoc', name: 'Dụng Cụ Test Nước', icon: Coffee, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                    { id: 'phu-kien', name: 'Phụ Kiện Máy Lọc', icon: Wrench, color: 'bg-amber-50 text-amber-600 border-amber-100' },
                    { id: 'all', name: 'Tất Cả Sản Phẩm', icon: CheckCircle2, color: 'bg-purple-50 text-purple-600 border-purple-100' },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const count = tabCounts[cat.id] || (cat.id === 'all' ? 8 : (cat.id === 'phu-kien' ? 5 : 2));
                    const isSelected = selectedCategory === cat.id;

                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setDrawerOpen(false);
                          const el = document.getElementById('featured-products-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-50/80 border-blue-300 shadow-xs ring-1 ring-blue-400/20' 
                            : 'bg-slate-50/70 border-slate-100/90 hover:bg-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold border ${cat.color} shadow-2xs`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                            {cat.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 shadow-2xs">
                          {count} SP
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Khám Phá & Tiện Ích */}
              <div className="space-y-1 pt-2">
                <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Khám Phá & Tiện Ích</span>
                </div>

                {[
                  { 
                    label: 'Trang Chủ', 
                    sub: 'Về đầu website',
                    badge: null,
                    icon: Home, 
                    color: 'text-blue-600 bg-blue-50',
                    action: () => onNavigate('hero') 
                  },
                  { 
                    label: 'Sức Khỏe Hydrogen', 
                    sub: 'Lợi ích & công nghệ',
                    badge: 'Mới',
                    icon: Droplet, 
                    color: 'text-cyan-600 bg-cyan-50',
                    action: () => onNavigate('benefits') 
                  },
                  { 
                    label: 'Tra Cứu Bảo Hành', 
                    sub: 'Chính hãng 5 năm',
                    badge: '5 Năm',
                    icon: ShieldCheck, 
                    color: 'text-emerald-600 bg-emerald-50',
                    action: () => onOpenWarranty() 
                  },
                  { 
                    label: 'Hệ Thống Đại Lý', 
                    sub: 'Showroom & điểm bán',
                    badge: 'Toàn quốc',
                    icon: MapPin, 
                    color: 'text-amber-600 bg-amber-50',
                    action: () => { const el = document.getElementById('dealers'); if(el) el.scrollIntoView({behavior: 'smooth'}) } 
                  },
                  { 
                    label: 'Tin Tức & Sự Kiện', 
                    sub: 'Bài viết y tế & video',
                    badge: null,
                    icon: Newspaper, 
                    color: 'text-indigo-600 bg-indigo-50',
                    action: () => onNavigate('news') 
                  },
                  { 
                    label: 'Câu Hỏi Thường Gặp', 
                    sub: 'Giải đáp nhanh',
                    badge: 'FAQs',
                    icon: HelpCircle, 
                    color: 'text-purple-600 bg-purple-50',
                    action: () => onNavigate('faq') 
                  },
                  { 
                    label: 'Liên Hệ & Tư Vấn', 
                    sub: 'Chuyên viên 24/7',
                    badge: null,
                    icon: PhoneCall, 
                    color: 'text-rose-600 bg-rose-50',
                    action: () => onOpenContact() 
                  }
                ].map((item, i) => {
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setDrawerOpen(false);
                        item.action();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-50 active:bg-slate-100 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.color}`}>
                          <ItemIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {item.sub}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Drawer Sticky Footer Bar */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 shrink-0 space-y-3">
              {/* Đăng xuất nếu đã login */}
              {user && (
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
                      .finally(() => window.location.reload());
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-100 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng Xuất Khỏi Tài Khoản</span>
                </button>
              )}

              {/* Nút Gọi Hotline Nổi Bật */}
              <a
                href={`tel:${contactConfig.hotlineTel}`}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-md shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <PhoneCall className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] text-white/80 font-semibold leading-tight">Hotline Hỗ Trợ 24/7</div>
                    <div className="text-xs font-black font-mono tracking-wide">{contactConfig.hotline}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.8 rounded-lg bg-white/20 backdrop-blur-xs">
                  Gọi Ngay
                </span>
              </a>

              {/* 3 Icon Mạng Xã Hội Tròn Đồng Bộ Admin */}
              <div className="flex items-center justify-between pt-1 px-1">
                <span className="text-[10px] text-slate-400 font-semibold">Kết nối:</span>
                <div className="flex items-center gap-2">
                  {/* Facebook */}
                  <a
                    href={contactConfig.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-xs"
                    title="Facebook"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>

                  {/* Zalo */}
                  <a
                    href={contactConfig.zalo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-full bg-white text-[#0068FF] border border-blue-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-xs"
                    title="Zalo OA"
                  >
                    <span className="font-extrabold text-[9px]">Zalo</span>
                  </a>

                  {/* Hotline */}
                  <a
                    href={`tel:${contactConfig.hotlineTel}`}
                    className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff3b30] to-[#e60000] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-xs"
                    title="Gọi Hotline"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
