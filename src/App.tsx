import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { useCart } from './hooks/useCart';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderLookup } from './components/OrderLookup';
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
import MyOrdersView from './components/MyOrdersView';
import { AdminNews } from './components/admin/AdminNews';
import AdminUsers from './components/admin/AdminUsers';
import AdminPolicyConfig from './components/admin/AdminPolicyConfig';
import AdminSystemView from './components/admin/AdminSystemView';
import AdminPeriods from './components/admin/AdminPeriods';
import AdminNppPackages from './components/admin/AdminNppPackages';
import AdminNppManagement from './components/admin/AdminNppManagement';
import AdminPeriodDetail from './components/admin/AdminPeriodDetail';
import AdminCTVManagement from './components/admin/AdminCTVManagement';
import AdminMembersView from './components/admin/AdminMembersView';

// CTV & Unified Auth Integrations
import { CTVPortalContainer } from './components/ctv/CTVPortalContainer';
import UnifiedAuthModal from './components/auth/UnifiedAuthModal';
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
  const { referralCode, setReferralCode } = useReferralAttribution();

  // Auth Modal State: Auto-open directly to 'register' if visiting with referral link (?ref=Uxxx)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const urlRef = params.get('ref') || params.get('refCode') || params.get('referral');
    const isBoss = params.get('register') === '0937353535';
    return Boolean(urlRef && urlRef.trim()) || isBoss;
  });
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>(() => {
    if (typeof window === 'undefined') return 'login';
    const params = new URLSearchParams(window.location.search);
    const urlRef = params.get('ref') || params.get('refCode') || params.get('referral');
    const isBoss = params.get('register') === '0937353535';
    return ((urlRef && urlRef.trim()) || isBoss) ? 'register' : 'login';
  });
  const [authModalMode, setAuthModalMode] = useState<'ctv' | 'system'>('ctv');

  // Admin Legacy State
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    return !!localStorage.getItem('wasy_admin_user');
  });
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const saved = localStorage.getItem('wasy_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [adminActiveTab, setAdminActiveTab] = useState('overview');
  const [isMobileAdminSidebarOpen, setIsMobileAdminSidebarOpen] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  // Check URL path, hash, or referral code on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get('ref') || params.get('refCode') || params.get('referral');
      const isBoss = params.get('register') === '0937353535';

      if ((urlRef && urlRef.trim()) || isBoss) {
        // Tự động mở ngay form đăng ký khi vào từ link ref
        setAuthModalTab('register');
        setIsAuthModalOpen(true);
      } else if (path.startsWith('/ctv') || hash === '#ctv') {
        setActiveSection('ctv');
        if (!user && !localStorage.getItem('crm_user')) {
          setIsAuthModalOpen(true);
        }
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



  const handleAuthSuccess = (loggedInUser: UserSession) => {
    setUser(loggedInUser);
    localStorage.setItem('crm_user', JSON.stringify(loggedInUser));
    showToast(`Xin chào, ${loggedInUser.fullName}! Đăng nhập thành công.`);

    if (loggedInUser.role === 'admin' || loggedInUser.role === 'accountant') {
      // System staff → Admin Portal
      const adminData: AdminUser = {
        id: loggedInUser.id,
        name: loggedInUser.fullName || 'System Administrator',
        email: 'admin@wasypro.com',
        role: 'superadmin',
      };
      setAdminUser(adminData);
      localStorage.setItem('wasy_admin_user', JSON.stringify(adminData));
      setIsAdminMode(true);
      window.history.pushState(null, '', '/');
    } else if (loggedInUser.isSystemParticipant || ((loggedInUser as any).nppStatus && (loggedInUser as any).nppStatus !== 'NONE') || ['AMBASSADOR','MANAGER','DIRECTOR'].includes(loggedInUser.rank || '')) {
      // CTV partner → CTV Portal
      setActiveSection('ctv');
      window.history.pushState(null, '', '/ctv');
    } else {
      // Regular customer → stay on website
      setActiveSection('hero');
      window.history.pushState(null, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logout();
    setReferralCode('');
    try {
      localStorage.removeItem('wasy_ref_code');
      sessionStorage.removeItem('wasy_ref_code');
      document.cookie = 'wasy_ref=; max-age=0; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
    } catch (e) {}
    showToast('Đã đăng xuất khỏi hệ thống.');
    setActiveSection('hero');
    window.history.pushState(null, '', '/');
  };

  // Synchronize Unified Admin session with CMS mode
  useEffect(() => {
    if (user?.role === 'admin') {
      if (!adminUser || adminUser.id !== user.id) {
        setAdminUser({
          id: user.id,
          name: user.fullName || 'System Administrator',
          email: 'admin@wasypro.com',
          role: 'superadmin'
        });
      }
    }
  }, [user, adminUser]);

  const handleOpenAuthModal = (tab: 'login' | 'register' = 'login', mode: 'ctv' | 'system' = 'ctv') => {
    setAuthModalTab(tab);
    setAuthModalMode(mode);
    // Instant real-time ref sync so opening modal never requires F5
    const params = new URLSearchParams(window.location.search);
    const urlRef = params.get('ref') || params.get('refCode') || params.get('referral');
    if (!urlRef || !urlRef.trim()) {
      setReferralCode('');
      try {
        localStorage.removeItem('wasy_ref_code');
        sessionStorage.removeItem('wasy_ref_code');
        document.cookie = 'wasy_ref=; max-age=0; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
      } catch (e) {}
    } else {
      setReferralCode(urlRef.trim().toUpperCase());
    }
    setIsAuthModalOpen(true);
  };

  const handleOpenAdminPortal = () => {
    if (user?.role === 'admin') {
      if (!adminUser) {
        setAdminUser({
          id: user.id,
          name: user.fullName || 'System Administrator',
          email: 'admin@wasypro.com',
          role: 'superadmin'
        });
      }
      setIsAdminMode(true);
    } else {
      handleOpenAuthModal('login', 'system');
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
          onSelectTab={(tab) => { setAdminActiveTab(tab); setSelectedPeriodId(null); }}
          isMobileOpen={isMobileAdminSidebarOpen}
          onCloseMobile={() => setIsMobileAdminSidebarOpen(false)}
          onSwitchToClient={() => setIsAdminMode(false)}
          userPhone={user?.phone}
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
            {adminActiveTab === 'ctv' && <AdminCTVManagement />}
            {adminActiveTab === 'members' && <AdminMembersView />}
            {adminActiveTab === 'news' && <AdminNews />}
            {adminActiveTab === 'users' && <AdminUsers />}
            {adminActiveTab === 'periods' && (
              selectedPeriodId
                ? <AdminPeriodDetail periodId={selectedPeriodId} onBack={() => setSelectedPeriodId(null)} />
                : <AdminPeriods onSelectPeriod={(id) => setSelectedPeriodId(id)} />
            )}
            {adminActiveTab === 'policy' && <AdminPolicyConfig />}
            {adminActiveTab === 'npp-packages' && <AdminNppPackages />}
            {adminActiveTab === 'npp-management' && <AdminNppManagement />}
            {adminActiveTab === 'system' && <AdminSystemView />}
            {activeSection === 'order-lookup' && <OrderLookup />}
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
        {activeSection === 'my-orders' && user ? (
          <MyOrdersView
            user={user}
            onBack={() => { setActiveSection('hero'); window.history.pushState(null, '', '/'); }}
          />
        ) : activeSection === 'ctv' ? (
          /* CTV Portal Section */
          user ? (
            (user.isSystemParticipant || ((user as any).nppStatus && (user as any).nppStatus !== 'NONE') || ['AMBASSADOR','MANAGER','DIRECTOR'].includes((user as any).rank || '') || user.role === 'admin' || user.role === 'accountant') ? (
              <CTVPortalContainer
                currentUser={user}
                onLogout={handleLogout}
                onNavigateHome={() => handleNavigate('hero')}
              />
            ) : (
              <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fadeIn">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg text-white">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-primary uppercase tracking-wide">
                  Chào {user.fullName}!
                </h2>
                <p className="text-sm text-gray-600 mt-3 max-w-md mx-auto font-medium leading-relaxed">
                  Bạn chưa tham gia hệ thống kinh doanh WATER KING. Hãy tham gia ngay để mở khoá Dashboard, theo dõi hoa hồng và quản lý đội nhóm.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/users/me/join-system', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' } });
                        const data = await res.json();
                        if (data.success) {
                          await checkSession();
                          showToast('Chúc mừng! Bạn đã tham gia hệ thống kinh doanh WATER KING.');
                        } else {
                          showToast(data.message || 'Không thể tham gia. Vui lòng thử lại.');
                        }
                      } catch { showToast('Lỗi kết nối máy chủ.'); }
                    }}
                    className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm uppercase tracking-wider shadow-md shadow-primary/20 hover:scale-[1.02] transition-all"
                  >
                    Tham Gia Hệ Thống Kinh Doanh
                  </button>
                  <button
                    onClick={() => { setActiveSection('hero'); window.history.pushState(null, '', '/'); }}
                    className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-all"
                  >
                    Quay Về Trang Chủ
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fadeIn">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg text-white">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-primary uppercase tracking-wide">
                Kinh Doanh WATER KING
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-md mx-auto font-medium leading-relaxed">
                Khu vực dành riêng cho Đại sứ & CTV. Vui lòng đăng nhập để truy cập Dashboard, xem cây hệ thống và theo dõi hoa hồng.
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => handleOpenAuthModal('login')}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-md shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  Đăng Nhập Kinh Doanh
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
              onOrderProduct={(product) => { addItem({ productId: product.id, title: product.title, image: product.image, price: product.price }); setIsCartOpen(true); }}
              onCallHotline={handleCallHotline}
            />
            <HydrogenBenefits />
            <SocialProof />
            <WarrantyLookupSection />
            <NewsSection />
            <FaqSection />
          </>
        )}
        {activeSection === 'order-lookup' && <OrderLookup />}
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

      {/* Unified Auth Modal (Login / Register CTV & System Admin) */}
      <UnifiedAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
        mode={authModalMode}
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
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={items} 
        onUpdateQuantity={updateQuantity} 
        onRemoveItem={removeItem} 
        onCheckout={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} 
        totalAmount={totalAmount} 
      />
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        items={items} 
        totalAmount={totalAmount} 
        onSuccess={clearCart} 
      />
    </div>
  );
};

export default App;
