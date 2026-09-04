import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneCall, 
  Menu, 
  X, 
  ChevronRight,
  Search,
  ShoppingCart,
  User,
  Award,
  LogOut,
  LayoutDashboard,
  ShieldCheck
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
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'hero', label: 'TRANG CHỦ' },
    { id: 'products', label: 'SẢN PHẨM' },
    { id: 'ctv', label: '👑 ĐẠI SỨ / CTV', highlight: true },
    { id: 'news', label: 'TIN TỨC' },
    { id: 'warranty', label: 'CHÍNH SÁCH BẢO HÀNH' },
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
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Top Banner / Announcement Bar */}
      <div className="bg-primary-darker text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2 font-medium">
            <a 
              href="tel:1900989878" 
              className="flex items-center gap-1.5 font-semibold text-white hover:text-accent transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>HOTLINE: 1900 98 98 78</span>
            </a>
          </div>

          <div className="flex-1 text-center hidden md:block">
            <span className="text-accent font-bold uppercase tracking-wider text-sm">
              CHÀO MỪNG ĐẾN VỚI WATER KING
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => handleNavClick('hero')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img 
              src="/images/logo-rbg.webp" 
              alt="WASY PRO HYDROGEN" 
              className="h-12 w-auto"
            />
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              if (item.highlight) {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`text-[13px] font-extrabold uppercase tracking-wide px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/25'
                        : 'bg-gradient-to-r from-accent/20 to-primary/15 text-primary-dark hover:bg-primary hover:text-white border border-primary/20'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`text-[13px] font-semibold uppercase tracking-wide transition-colors duration-200 ${
                    isActive
                      ? 'text-primary-dark'
                      : 'text-primary hover:text-primary-dark'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* CTA Action Buttons & User Menu */}
          <div className="hidden sm:flex items-center gap-4 text-primary">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold hover:bg-primary/15 transition-all"
                >
                  <Award className="w-4 h-4 text-primary" />
                  <span>{user.tier || 'CTV'} {user.id}</span>
                  <span className="max-w-[120px] truncate text-gray-700">{user.fullName}</span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500 font-medium">Đang đăng nhập:</p>
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

                    {user.role === 'admin' && (
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
                className="flex items-center gap-1.5 text-[13px] font-semibold uppercase hover:text-primary-dark transition-colors px-3 py-1.5 rounded-lg border border-primary/20 hover:border-primary"
              >
                <User className="w-4 h-4" />
                <span>ĐĂNG NHẬP / ĐĂNG KÝ</span>
              </button>
            )}

            <button className="hover:text-primary-dark transition-colors p-1">
              <Search className="w-5 h-5" />
            </button>
            <button className="hover:text-primary-dark transition-colors p-1">
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex lg:hidden items-center gap-2 text-primary">
            <button className="p-2">
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2">
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
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-md text-left text-sm font-semibold transition-colors ${
                  activeSection === item.id
                    ? 'bg-gray-50 text-primary-dark border-l-4 border-primary'
                    : 'text-primary hover:bg-gray-50'
                }`}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}

            <div className="pt-4 border-t border-gray-100 space-y-2">
              {user ? (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">{user.fullName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary text-white uppercase">
                      {user.tier || 'CTV'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleNavClick('ctv')}
                    className="w-full py-2.5 rounded-lg bg-primary text-white text-xs font-bold uppercase"
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
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-md font-semibold text-primary bg-gray-50 border border-gray-200 text-sm uppercase"
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
