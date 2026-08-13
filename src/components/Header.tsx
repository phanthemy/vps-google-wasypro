import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  PhoneCall, 
  ShieldCheck, 
  Menu, 
  X, 
  MessageSquare, 
  Sparkles,
  ChevronRight,
  Clock,
  Shield,
  Search,
  ShoppingCart,
  User
} from 'lucide-react';

interface HeaderProps {
  onOpenWarranty: () => void;
  onOpenContact: () => void;
  onOpenAdmin: () => void;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenWarranty,
  onOpenContact,
  onOpenAdmin,
  activeSection,
  onNavigate,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'hero', label: 'TRANG CHỦ' },
    { id: 'products', label: 'SẢN PHẨM' },
    { id: 'news', label: 'TIN TỨC' },
    { id: 'warranty', label: 'CHÍNH SÁCH BẢO HÀNH' },
  ];

  const handleNavClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
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

          {/* CTA Action Buttons */}
          <div className="hidden sm:flex items-center gap-4 text-primary">
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 text-[13px] font-semibold uppercase hover:text-primary-dark transition-colors"
            >
              <User className="w-4 h-4" />
              <span>ĐĂNG NHẬP / ĐĂNG KÝ</span>
            </button>
            <button className="hover:text-primary-dark transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="hover:text-primary-dark transition-colors">
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
               <button
                onClick={() => {
                  onOpenAdmin();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-md font-semibold text-primary bg-gray-50 border border-gray-200 text-sm uppercase"
              >
                <User className="w-4 h-4" />
                <span>ĐĂNG NHẬP / ĐĂNG KÝ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
