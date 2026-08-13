import React, { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductSection } from './components/ProductSection';
import { HydrogenBenefits } from './components/HydrogenBenefits';
import { SocialProof } from './components/SocialProof';
import { WarrantyLookupSection } from './components/WarrantyLookupSection';
import { NewsSection } from './components/NewsSection';
import { FaqSection } from './components/FaqSection';
import { ContactModal } from './components/ContactModal';
import { Footer } from './components/Footer';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminHeader } from './components/admin/AdminHeader';
import { AdminSidebar } from './components/admin/AdminSidebar';
import { AdminOverview } from './components/admin/AdminOverview';
import { AdminProducts } from './components/admin/AdminProducts';
import { AdminWarranties } from './components/admin/AdminWarranties';
import { AdminLeads } from './components/admin/AdminLeads';
import { AdminOrders } from './components/admin/AdminOrders';
import { AdminNews } from './components/admin/AdminNews';
import { Product, AdminUser } from './types/schema';
import { PhoneCall, MessageSquare, CheckCircle2, X, ArrowUp, Send } from 'lucide-react';

export const App: React.FC = () => {
  // Client View States
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Scroll listener for scroll-to-top button
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Admin View States
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [adminActiveTab, setAdminActiveTab] = useState<string>('overview');
  const [isMobileAdminSidebarOpen, setIsMobileAdminSidebarOpen] = useState<boolean>(false);

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenWarranty = () => {
    handleNavigate('warranty');
  };

  const handleOpenContact = (product?: Product | null) => {
    setSelectedProductForOrder(product || null);
    setIsContactModalOpen(true);
  };

  const handleCallHotline = () => {
    window.location.href = 'tel:1900989878';
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
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
    showToast(`Chào mừng quay trở lại, ${user.name}!`);
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    setIsAdminMode(false);
    showToast('Đã đăng xuất khỏi hệ thống Admin Portal.');
  };

  // Render Admin Portal View
  if (isAdminMode && adminUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row text-slate-800 font-sans selection:bg-ocean-500 selection:text-white">
        {/* Toast Alert Notification */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 max-w-md bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-cyan-400/40 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm font-medium">{toastMessage}</div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white p-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sidebar */}
        <AdminSidebar
          activeTab={adminActiveTab}
          onSelectTab={(tab) => setAdminActiveTab(tab)}
          isMobileOpen={isMobileAdminSidebarOpen}
          onCloseMobile={() => setIsMobileAdminSidebarOpen(false)}
          onSwitchToClient={() => setIsAdminMode(false)}
        />

        {/* Main Workspace Area */}
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
          </main>
        </div>
      </div>
    );
  }

  // Render Client Website View
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

      {/* Main Header */}
      <Header
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onOpenWarranty={handleOpenWarranty}
        onOpenContact={() => handleOpenContact(null)}
        onOpenAdmin={handleOpenAdminPortal}
      />

      {/* Main Container Content */}
      <main>
        {/* Hero Section */}
        <Hero
          onExploreClick={() => handleNavigate('products')}
          onContactClick={() => handleOpenContact(null)}
        />

        {/* Products Section */}
        <ProductSection
          onOrderProduct={(product) => handleOpenContact(product)}
          onCallHotline={handleCallHotline}
        />

        {/* Hydrogen Benefits Science Section */}
        <HydrogenBenefits />

        {/* Social Proof Section */}
        <SocialProof />

        {/* Electronic Warranty Lookup Section */}
        <WarrantyLookupSection />

        {/* News & Blog Section */}
        <NewsSection />

        {/* FAQ Accordion Section */}
        <FaqSection />
      </main>

      {/* Footer */}
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

      {/* Admin Login Modal */}
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

      {/* Sticky CTA Mobile Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] px-3 py-2.5 flex items-center gap-2">
        <a 
          href="tel:1900989878" 
          className="flex-1 py-2.5 rounded-lg bg-primary text-white text-center text-[13px] font-bold flex items-center justify-center gap-1.5"
        >
          <PhoneCall className="w-4 h-4" />
          GỌI NGAY
        </a>
        <a 
          href="https://zalo.me/1900989878" 
          target="_blank"
          className="flex-1 py-2.5 rounded-lg bg-[#0068FF] text-white text-center text-[13px] font-bold flex items-center justify-center gap-1.5"
        >
          <MessageSquare className="w-4 h-4" />
          ZALO
        </a>
        <button 
          onClick={() => handleOpenContact(null)}
          className="flex-1 py-2.5 rounded-lg bg-accent text-primary-darker text-center text-[13px] font-bold flex items-center justify-center gap-1.5"
        >
          <Send className="w-4 h-4" />
          TƯ VẤN
        </button>
      </div>
    </div>
  );
};

export default App;
