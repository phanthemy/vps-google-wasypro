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

          {/* Right Area: Account Only */}
          <div className="hidden sm:flex items-center gap-3 text-primary flex-shrink-0">
            {/* User Profile Menu (logged in) or Login Button */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold hover:bg-primary/15 transition-all"
                >
                  <User className="w-4 h-4 text-primary" />
                  <span className="max-w-[120px] truncate text-gray-700">{user.fullName}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-gray-100 bg-gray-50/60">
                      <p className="text-[10px] text-gray-500 font-medium uppercase">Tài khoản:</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{user.fullName}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{user.phone}</p>
                    </div>

                    {/* CTV Portal — visible to all logged-in users */}
                    <a
                      href="/ctv"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors text-left"
                    >
                      <LayoutDashboard className="w-4 h-4 text-primary" />
                      <span>Quản lý tài khoản CTV</span>
                    </a>

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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="text-xs font-bold uppercase hover:text-primary-dark transition-colors px-3 py-1.5 rounded-full border border-primary/25 hover:border-primary hover:bg-primary/5"
                >
                  Đăng Nhập
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="text-xs font-bold uppercase text-white bg-primary hover:bg-primary-dark transition-colors px-3 py-1.5 rounded-full"
                >
                  Đăng Ký
                </button>
              </div>
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


            {/* User Profile / Auth Button */}
            <div className="pt-3 border-t border-gray-100">
              {user ? (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div>
                    <p className="text-xs font-bold text-gray-900">{user.fullName}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{user.phone}</p>
                  </div>
                  {/* CTV Portal — all logged-in users */}
                  <a
                    href="/ctv"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Quản lý tài khoản CTV
                  </a>
                  {isAdmin && (
                    <button
                      onClick={() => { onOpenAdmin(); setMobileMenuOpen(false); }}
                      className="w-full py-2.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold uppercase"
                    >
                      Quản Trị Website
                    </button>
                  )}
                  <button
                    onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                    className="w-full py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold uppercase"
                  >
                    Đăng Xuất
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { onOpenAuth('login'); setMobileMenuOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-primary bg-primary/10 border border-primary/20 text-xs uppercase"
                  >
                    Đăng Nhập
                  </button>
                  <button
                    onClick={() => { onOpenAuth('register'); setMobileMenuOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-primary text-xs uppercase"
                  >
                    Đăng Ký
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
