import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneCall, 
  Menu, 
  X, 
  ChevronRight,
  ChevronDown,
  Search,
  ShoppingCart,
  User,
  Award,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  Briefcase,
  Sliders,
  Users,
  History,
  Sparkles
} from 'lucide-react';
import { UserSession } from '../hooks/useUnifiedAuth';

interface HeaderProps {
  onOpenWarranty: () => void;
  onOpenContact: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
  onLogout: () => void;
  user: UserSession | null;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenWarranty,
  onOpenContact,
  onOpenAdmin,
  onOpenAuth,
  onLogout,
  user,
  activeSection,
  onNavigate,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [systemDropdownOpen, setSystemDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const systemDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (systemDropdownRef.current && !systemDropdownRef.current.contains(event.target as Node)) {
        setSystemDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Customer-only main navigation
  const navItems = [
    { id: 'hero', label: 'TRANG CHỦ' },
    { id: 'products', label: 'SẢN PHẨM' },
    { id: 'news', label: 'TIN TỨC' },
    { id: 'warranty', label: 'CHÍNH SÁCH BẢO HÀNH' },
    { id: 'benefits', label: 'LỢI ÍCH' },
    { id: 'faq', label: 'HỎI ĐÁP' },
  ];

  const handleNavClick = (id: string) => {
    if (id === 'ctv') {
      if (!user) {
        onOpenAuth('login');
      } else {
        onNavigate('ctv');
      }
    } else {
      onNavigate(id);
    }
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setSystemDropdownOpen(false);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-sans">
      {/* Top Banner / Announcement Bar */}
      <div className="bg-primary-darker text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2 font-medium">
            <a 
              href="tel:1900989878" 
              className="flex items-center gap-1.5 font-semibold text-white hover:text-accent transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span>HOTLINE: 1900 98 98 78</span>
            </a>
          </div>

          <div className="flex-1 text-center hidden md:block">
            <span className="text-accent font-bold uppercase tracking-wider text-xs">
              CHÀO MỪNG ĐẾN VỚI WATER KING — CÔNG NGHỆ HYDROGEN & ION KIỀM CHUẨN QUỐC TẾ
            </span>
          </div>

          <div className="flex items-center gap-4 text-white ml-auto text-[11px] uppercase tracking-wider font-semibold">
            <span className="cursor-pointer hover:text-accent transition-colors" onClick={() => handleNavClick('benefits')}>GIỚI THIỆU</span>
            <span className="opacity-50">|</span>
            <span className="cursor-pointer hover:text-accent transition-colors" onClick={onOpenContact}>LIÊN HỆ</span>
            <span className="opacity-50">|</span>
            <span className="cursor-pointer hover:text-accent transition-colors" onClick={() => handleNavClick('faq')}>FAQS</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div 
        className={`transition-all duration-300 bg-white ${
          isScrolled 
            ? 'py-3 shadow-md' 
            : 'py-4 border-b border-gray-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Logo */}
          <div 
            onClick={() => handleNavClick('hero')}
            className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
          >
            <img 
              src="/images/logo-rbg.webp" 
              alt="WASY PRO HYDROGEN" 
              className="h-11 sm:h-12 w-auto"
            />
          </div>

          {/* Customer Main Nav Items (Center/Left) */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`text-[13px] font-semibold uppercase tracking-wide transition-colors duration-200 whitespace-nowrap ${
                    isActive
                      ? 'text-primary-dark font-extrabold border-b-2 border-primary pb-0.5'
                      : 'text-gray-700 hover:text-primary-dark'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Area: Account & System Group */}
          <div className="hidden sm:flex items-center gap-3 text-primary flex-shrink-0">
            {/* 1. Nút KINH DOANH (CTV / Đại sứ) */}
            <button
              onClick={() => handleNavClick('ctv')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeSection === 'ctv'
                  ? 'bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]'
                  : 'bg-gradient-to-r from-accent/25 via-primary/10 to-primary/20 text-primary-dark hover:bg-primary hover:text-white border border-primary/25 hover:scale-[1.02]'
              }`}
              title="Khu vực Kinh Doanh dành cho Đại Sứ & CTV"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>🏆 Kinh Doanh</span>
            </button>

            {/* 2. Nút HỆ THỐNG (Hiện cho Anonymous và Admin, ẩn cho CTV thường) */}
            {(!user || isAdmin) && (
              <div className="relative" ref={systemDropdownRef}>
                <button
                  onClick={() => {
                    if (!user) {
                      onOpenAdmin();
                    } else if (isAdmin) {
                      setSystemDropdownOpen(!systemDropdownOpen);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    systemDropdownOpen
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300'
                  }`}
                  title="Khu vực Quản trị Hệ thống & Cấu hình"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>🛡️ Hệ Thống</span>
                  {isAdmin && <ChevronDown className="w-3 h-3 text-gray-500" />}
                </button>

                {systemDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-gray-100 bg-slate-50/70">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quản Trị Hệ Thống</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">System Administration</p>
                    </div>

                    <button
                      onClick={() => { onOpenAdmin(); setSystemDropdownOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors text-left"
                    >
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span>Quản Trị Website (CMS)</span>
                    </button>

                    <button
                      onClick={() => { handleNavClick('ctv'); setSystemDropdownOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors text-left"
                    >
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Quản Lý Toàn Bộ CTV</span>
                    </button>

                    <button
                      onClick={() => { handleNavClick('ctv'); setSystemDropdownOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors text-left"
                    >
                      <Sliders className="w-4 h-4 text-emerald-600" />
                      <span>Cấu Hình Cơ Chế Hoa Hồng</span>
                    </button>

                    <button
                      onClick={() => { handleNavClick('ctv'); setSystemDropdownOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors text-left"
                    >
                      <History className="w-4 h-4 text-amber-600" />
                      <span>Nhật Ký Hệ Thống (Audit Logs)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. User Badge & Profile Menu / Login Button */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold hover:bg-primary/15 transition-all"
                >
                  <Award className="w-4 h-4 text-primary" />
                  <span>{user.tier || 'CTV'} {user.id}</span>
                  <span className="max-w-[110px] truncate text-gray-700">{user.fullName}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/60">
                      <p className="text-[10px] text-gray-500 font-medium uppercase">Tài khoản:</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{user.fullName}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {user.role} • {user.tier || 'SILVER'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleNavClick('ctv')}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors text-left"
                    >
                      <LayoutDashboard className="w-4 h-4 text-primary" />
                      <span>Vào Dashboard CTV</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => { onOpenAdmin(); setUserDropdownOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors text-left"
                      >
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <span>Quản Trị Website</span>
                      </button>
                    )}

                    <div className="my-1 border-t border-gray-100" />

                    <button
                      onClick={() => { onLogout(); setUserDropdownOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng Xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1.5 text-xs font-bold uppercase hover:text-primary-dark transition-colors px-3 py-1.5 rounded-full border border-primary/25 hover:border-primary hover:bg-primary/5"
              >
                <User className="w-3.5 h-3.5" />
                <span>ĐĂNG NHẬP / ĐĂNG KÝ</span>
              </button>
            )}

            <button className="hover:text-primary-dark transition-colors p-1 text-gray-600">
              <Search className="w-4 h-4" />
            </button>
            <button className="hover:text-primary-dark transition-colors p-1 text-gray-600">
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden items-center gap-2 text-primary">
            <button className="p-2 text-gray-600">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600">
              <ShoppingCart className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-100 shadow-xl transition-all duration-300">
          <div className="px-4 pt-3 pb-6 space-y-2">
            {/* Customer Nav items */}
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-left text-sm font-semibold transition-colors ${
                  activeSection === item.id
                    ? 'bg-gray-50 text-primary-dark border-l-4 border-primary font-bold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}

            {/* Quick CTV & System Links */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <button
                onClick={() => handleNavClick('ctv')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-left text-sm font-bold uppercase transition-all ${
                  activeSection === 'ctv'
                    ? 'bg-primary text-white'
                    : 'bg-primary/10 text-primary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>🏆 Kinh Doanh (Đại Sứ & CTV)</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>

              {(!user || isAdmin) && (
                <button
                  onClick={() => { onOpenAdmin(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-left text-sm font-bold uppercase bg-slate-100 text-slate-800 hover:bg-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span>🛡️ Quản Trị Hệ Thống (Website CMS)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* User Profile Card / Auth Button */}
            <div className="pt-3 border-t border-gray-100">
              {user ? (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{user.fullName}</p>
                      <p className="text-[10px] text-gray-500 font-mono">ID: {user.id}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary text-white uppercase">
                      {user.tier || 'CTV'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleNavClick('ctv')}
                    className="w-full py-2.5 rounded-lg bg-primary text-white text-xs font-bold uppercase shadow-sm"
                  >
                    Vào Dashboard CTV
                  </button>
                  <button
                    onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                    className="w-full py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold uppercase"
                  >
                    Đăng Xuất
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-primary bg-primary/10 border border-primary/20 text-xs uppercase"
                >
                  <User className="w-4 h-4" />
                  <span>ĐĂNG NHẬP / ĐĂNG KÝ ĐẠI SỨ</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
