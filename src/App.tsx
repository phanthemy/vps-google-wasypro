import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductSection } from './components/ProductSection';
import { HydrogenBenefits } from './components/HydrogenBenefits';
import { SocialProof } from './components/SocialProof';
import { WarrantyLookupSection } from './components/WarrantyLookupSection';
import { NewsSection } from './components/NewsSection';
import { FaqSection } from './components/FaqSection';
import { Footer } from './components/Footer';
import { ContactModal } from './components/ContactModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminSidebar } from './components/admin/AdminSidebar';
import { AdminHeader } from './components/admin/AdminHeader';
import { AdminOverview } from './components/admin/AdminOverview';
import { AdminProducts } from './components/admin/AdminProducts';
import { AdminWarranties } from './components/admin/AdminWarranties';
import { AdminLeads } from './components/admin/AdminLeads';
import { AdminOrders } from './components/admin/AdminOrders';
import { AdminNews } from './components/admin/AdminNews';
import AdminUsers from './components/admin/AdminUsers';

// CTV & Unified Auth Integrations
import { CTVPortalContainer } from './components/ctv/CTVPortalContainer';
import { UnifiedAuthModal } from './components/auth/UnifiedAuthModal';
import { useUnifiedAuth, UserSession } from './hooks/useUnifiedAuth';
import { useReferralAttribution } from './hooks/useReferralAttribution';

import { Product, AdminUser } from './types/schema';
import { 
  PhoneCall, 
  MessageSquare, 
  ArrowUp, 
  CheckCircle2, 
  X,
  Award,
  Sparkles
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<Product | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Unified Auth & Referral Hooks
  const { user, setUser, logout, checkSession } = useUnifiedAuth();
  const { referralCode } = useReferralAttribution();

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  // Admin Legacy State
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('wasy_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [adminActiveTab, setAdminActiveTab] = useState('overview');
  const [isMobileAdminSidebarOpen, setIsMobileAdminSidebarOpen] = useState(false);

  // Check URL path or hash on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.startsWith('/ctv') || hash === '#ctv') {
        setActiveSection('ctv');
      }
    }
  }, []);

  // Listen for browser popstate
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.startsWith('/ctv') || hash === '#ctv') {
        setActiveSection('ctv');
      } else if (hash) {
        setActiveSection(hash.replace('#', ''));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Scroll listener for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    if (sectionId === 'ctv') {
      window.history.pushState(null, '', '/ctv');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (window.location.pathname.startsWith('/ctv')) {
      window.history.pushState(null, '', '/');
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenWarranty = () => {
    handleNavigate('warranty');
  };

  const handleOpenContact = (product: Product | null = null) => {
    setSelectedProductForOrder(product);
    setIsContactModalOpen(true);
  };

  const handleCallHotline = () => {
    window.location.href = 'tel:1900989878';
  };

  const handleOpenAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (loggedInUser: UserSession) => {
    setUser(loggedInUser);
    localStorage.setItem('crm_user', JSON.stringify(loggedInUser));
    showToast(`Xin chào, ${loggedInUser.fullName}! Đăng nhập thành công.`);
    setActiveSection('ctv');
    window.history.pushState(null, '', '/ctv');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logout();
    showToast('Đã đăng xuất khỏi hệ thống.');
    setActiveSection('hero');
    window.history.pushState(null, '', '/');
  };

  const handleOpenAdminPortal = () => {
    if (adminUser) {
      setIsAdminMode(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleSuccessAdminLogin = (user: AdminUser) => {
    setAdminUser(user);
    setIsAdminMode(true);
    setIsAdminLoginOpen(false);
    showToast(`Chào mừng ${user.name} trở lại trang Quản trị Website!`);
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    setIsAdminMode(false);
    localStorage.removeItem('wasy_admin_user');
    showToast('Đã đăng xuất khỏi hệ thống Admin Portal.');
  };

  // Render Admin Portal View (Website content management)
  if (isAdminMode && adminUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row text-slate-800 font-sans selection:bg-ocean-500 selection:text-white">
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 max-w-md bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-cyan-400/40 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm font-medium">{toastMessage}</div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white p-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <AdminSidebar
          activeTab={adminActiveTab}
          onSelectTab={(tab) => setAdminActiveTab(tab)}
          isMobileOpen={isMobileAdminSidebarOpen}
          onCloseMobile={() => setIsMobileAdminSidebarOpen(false)}
          onSwitchToClient={() => setIsAdminMode(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <AdminHeader
            adminUser={adminUser}
            activeTab={adminActiveTab}
            onSwitchToClient={() => setIsAdminMode(false)}
            onLogout={handleAdminLogout}
            onToggleMobileSidebar={() => setIsMobileAdminSidebarOpen(!isMobileAdminSidebarOpen)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {adminActiveTab === 'overview' && (
              <AdminOverview onNavigateTab={(tab) => setAdminActiveTab(tab)} />
            )}
            {adminActiveTab === 'products' && <AdminProducts />}
            {adminActiveTab === 'warranties' && <AdminWarranties />}
            {adminActiveTab === 'leads' && <AdminLeads />}
            {adminActiveTab === 'orders' && <AdminOrders />}
            {adminActiveTab === 'news' && <AdminNews />}
            {adminActiveTab === 'users' && <AdminUsers />}
          </main>
        </div>
      </div>
    );
  }

  // Render Unified Client Website View
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative selection:bg-ocean-500 selection:text-white">
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-md bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-cyan-400/40 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm font-medium">{toastMessage}</div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Referral Attribution Notification Banner */}
      {referralCode && activeSection !== 'ctv' && (
        <div className="bg-gradient-to-r from-accent via-amber-400 to-amber-500 text-primary-darker text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-primary-darker animate-pulse" />
          <span>Bạn đang được giới thiệu bởi Đại sứ WATER KING (Mã: {referralCode}). Hãy đăng ký nhận ưu đãi độc quyền!</span>
        </div>
      )}

      {/* Main Unified Header */}
      <Header
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onOpenWarranty={handleOpenWarranty}
        onOpenContact={() => handleOpenContact(null)}
        onOpenAdmin={handleOpenAdminPortal}
        onOpenAuth={handleOpenAuthModal}
        onLogout={handleLogout}
        user={user}
      />

      {/* Main Container Content */}
      <main className="pt-28 sm:pt-32">
        {activeSection === 'ctv' ? (
          /* CTV Portal Section */
          user ? (
            <CTVPortalContainer
              currentUser={user}
              onLogout={handleLogout}
              onNavigateHome={() => handleNavigate('hero')}
            />
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-16 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-xl text-white">
                <Award className="w-10 h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary uppercase tracking-wide">
                Cổng Quản Trị Đại Sứ & CTV WATER KING
              </h2>
              <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto font-medium">
                Vui lòng đăng nhập để truy cập Dashboard, quản lý sơ đồ tuyến dưới, theo dõi đơn sỉ và lịch sử hoa hồng.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => handleOpenAuthModal('login')}
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-primary/25 transition-all"
                >
                  Đăng Nhập Ngay
                </button>
                <button
                  onClick={() => handleOpenAuthModal('register')}
                  className="px-6 py-3 rounded-xl bg-white border border-primary/30 text-primary hover:bg-primary/5 font-bold text-sm uppercase tracking-wider transition-all"
                >
                  Đăng Ký Làm Đại Sứ
                </button>
              </div>
            </div>
          )
        ) : (
          /* Landing Page Sections */
          <>
            <Hero
              onExploreClick={() => handleNavigate('products')}
              onContactClick={() => handleOpenContact(null)}
            />
            <ProductSection
              onOrderProduct={(product) => handleOpenContact(product)}
              onCallHotline={handleCallHotline}
            />
            <HydrogenBenefits />
            <SocialProof />
            <WarrantyLookupSection />
            <NewsSection />
            <FaqSection />
          </>
        )}
      </main>

      {/* Main Unified Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenWarranty={handleOpenWarranty}
        onOpenContact={() => handleOpenContact(null)}
        onOpenAdmin={handleOpenAdminPortal}
        onSuccessToast={showToast}
      />

      {/* Contact & Consultation Drawer Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
          setSelectedProductForOrder(null);
        }}
        selectedProduct={selectedProductForOrder}
        onSuccessToast={showToast}
      />

      {/* Unified Auth Modal (Login / Register CTV) */}
      <UnifiedAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
        referralCode={referralCode}
        onSuccess={handleAuthSuccess}
      />

      {/* Admin Legacy Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccessLogin={handleSuccessAdminLogin}
      />

      {/* Sticky Floating Action Buttons (Right Bottom) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        <button
          onClick={handleCallHotline}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group"
          title="Gọi Hotline 1900 98 98 78"
        >
          <PhoneCall className="w-6 h-6 animate-pulse" />
          <span className="absolute right-16 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Hotline: 1900 98 98 78
          </span>
        </button>

        <button
          onClick={() => handleOpenContact(null)}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-ocean-600 to-cyan-500 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group"
          title="Tư vấn lắp đặt tận nơi"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute right-16 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Đăng ký tư vấn free
          </span>
        </button>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-primary-darker text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-primary-dark hover:scale-110 transition-all duration-300"
          title="Lên đầu trang"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default App;
