import React, { useState } from 'react';
import { UserSession } from '../../hooks/useUnifiedAuth';

// Mockup UI Components (Strict Design Tokens)
import { MockupHeader } from './mockup/MockupHeader';
import { MockupBottomNav } from './mockup/MockupBottomNav';
import { MockupDashboard } from './mockup/MockupDashboard';
import { MockupRank } from './mockup/MockupRank';
import { MockupCommissions } from './mockup/MockupCommissions';
import { MockupOrders } from './mockup/MockupOrders';
import { MockupMore } from './mockup/MockupMore';
import { MockupDrawer } from './mockup/MockupDrawer';

// Subviews
// @ts-ignore
import NetworkView from './views/NetworkView.jsx';
// @ts-ignore
import SettingsView from './views/SettingsView.jsx';

interface CTVPortalContainerProps {
  currentUser: UserSession;
  onLogout: () => void;
  onNavigateHome: () => void;
  initialTab?: string;
  onOpenAuth?: (tab?: 'login' | 'register') => void;
  onOpenAdmin?: () => void;
  cartItemCount?: number;
  onCartClick?: () => void;
}

export const CTVPortalContainer: React.FC<CTVPortalContainerProps> = ({
  currentUser,
  onLogout,
  onNavigateHome,
  initialTab = 'dashboard',
  onOpenAuth,
  onOpenAdmin,
  cartItemCount = 1,
  onCartClick
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Invite member
  const handleInviteMember = () => {
    if (onOpenAuth) {
      onOpenAuth('register');
    } else {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const ref = currentUser.id || currentUser.userId;
      navigator.clipboard?.writeText(`${origin}/?ref=${ref}`);
      alert('Đã sao chép link giới thiệu của bạn!');
    }
  };

  // Header Title & Back Button state
  const isHome = activeTab === 'dashboard';
  const headerTitle = (() => {
    if (activeTab === 'rank') return 'Cấp bậc & điểm';
    if (activeTab === 'commissions') return 'Hoa hồng của bạn';
    if (activeTab === 'orders') return 'Đơn hàng của tôi';
    if (activeTab === 'more') return 'Menu Thêm';
    if (activeTab === 'network') return 'Sơ đồ Tuyến dưới';
    if (activeTab === 'account') return 'Thông tin tài khoản';
    return undefined;
  })();

  const handleHeaderBack = () => {
    if (activeTab === 'network' || activeTab === 'account') {
      setActiveTab('more');
    } else {
      setActiveTab('dashboard');
    }
  };

  return (
    <div 
      className="min-h-screen font-sans pb-24 text-[#0F172A]"
      style={{ 
        background: '#F8FAFC',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
      }}
    >
      {/* 1. HEADER (64px main / 56px subpage, background #FFFFFF) */}
      <MockupHeader
        title={headerTitle}
        showBack={!isHome}
        onBack={handleHeaderBack}
        onSearchClick={onNavigateHome}
        onCartClick={onCartClick || onNavigateHome}
        onMenuClick={() => setDrawerOpen(true)}
        cartCount={cartItemCount}
      />

      {/* 2. MAIN BODY (Page horizontal padding: 16px, max-w-md) */}
      <main className="max-w-md mx-auto px-4 pt-4">
        {/* Screen 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <MockupDashboard
            currentUser={currentUser}
            onSelectTab={setActiveTab}
            onNavigateHome={onNavigateHome}
            onLogout={onLogout}
            onInviteMember={handleInviteMember}
          />
        )}

        {/* Screen 2: Chi tiết cấp bậc & điểm */}
        {activeTab === 'rank' && (
          <MockupRank
            currentUser={currentUser}
            onOpenF1List={() => setActiveTab('network')}
          />
        )}

        {/* Screen 3: Trang hoa hồng */}
        {activeTab === 'commissions' && (
          <MockupCommissions
            totalCommission={31920000}
            periodName="10/2026"
            onViewDetails={() => alert('Chi tiết hoa hồng')}
          />
        )}

        {/* Screen 4: Trang đơn hàng */}
        {activeTab === 'orders' && (
          <MockupOrders
            onSelectOrder={(id) => alert(`Chi tiết đơn hàng #${id}`)}
          />
        )}

        {/* Screen 5: Menu "Thêm" */}
        {activeTab === 'more' && (
          <MockupMore
            onSelectSubtab={setActiveTab}
            onNavigateHome={onNavigateHome}
          />
        )}

        {/* Subpage: Sơ đồ tuyến dưới */}
        {activeTab === 'network' && (
          <div 
            style={{
              background: '#FFFFFF',
              border: '1px solid #EEF2F6',
              borderRadius: '18px',
              padding: '16px',
              boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
            }}
            className="animate-fadeIn"
          >
            <NetworkView currentUser={currentUser} />
          </div>
        )}

        {/* Subpage: Thông tin tài khoản */}
        {activeTab === 'account' && (
          <div 
            style={{
              background: '#FFFFFF',
              border: '1px solid #EEF2F6',
              borderRadius: '18px',
              padding: '16px',
              boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
            }}
            className="animate-fadeIn"
          >
            <SettingsView currentUser={currentUser} onLogout={onLogout} />
          </div>
        )}
      </main>

      {/* 3. BOTTOM NAVIGATION (Height 66px, 40x40 #0072F5 active icon) */}
      <MockupBottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* 4. SLIDE-OUT DRAWER MENU (Width 320px, 52px item height) */}
      <MockupDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigateHome={onNavigateHome}
        onNavigateCTV={() => { setActiveTab('dashboard'); setDrawerOpen(false); }}
        onNavigateOrders={() => { setActiveTab('orders'); setDrawerOpen(false); }}
        onLogout={onLogout}
      />
    </div>
  );
};
export default CTVPortalContainer;
