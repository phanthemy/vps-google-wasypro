import React, { useState } from 'react';
import { UserSession } from '../../hooks/useUnifiedAuth';

// Mockup UI Components
import { MockupHeader } from './mockup/MockupHeader';
import { MockupBottomNav } from './mockup/MockupBottomNav';
import { MockupDashboard } from './mockup/MockupDashboard';
import { MockupRank } from './mockup/MockupRank';
import { MockupCommissions } from './mockup/MockupCommissions';
import { MockupOrders } from './mockup/MockupOrders';
import { MockupMore } from './mockup/MockupMore';
import { MockupDrawer } from './mockup/MockupDrawer';

// Real Functional Views (for subpages)
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

  // Invite member: open register modal with current user's referral
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
    <div className="min-h-screen bg-slate-50 font-sans pb-24 text-slate-800">
      {/* 1. TOP HEADER (Mockup style) */}
      <MockupHeader
        title={headerTitle}
        showBack={!isHome}
        onBack={handleHeaderBack}
        onSearchClick={onNavigateHome}
        onCartClick={onCartClick || onNavigateHome}
        onMenuClick={() => setDrawerOpen(true)}
        cartCount={cartItemCount}
      />

      {/* 2. MAIN BODY (Max width for phone feel, scales on desktop) */}
      <main className="max-w-md mx-auto px-4 pt-3.5">
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
            onViewDetails={() => alert('Chi tiết hoa hồng được tính theo chính sách Water King')}
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
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm animate-fadeIn">
            <NetworkView currentUser={currentUser} />
          </div>
        )}

        {/* Subpage: Thông tin tài khoản */}
        {activeTab === 'account' && (
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm animate-fadeIn">
            <SettingsView currentUser={currentUser} onLogout={onLogout} />
          </div>
        )}
      </main>

      {/* 3. FIXED BOTTOM NAVIGATION BAR (Mockup style) */}
      <MockupBottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* 4. SLIDE-OUT DRAWER MENU (Mockup Screen 6) */}
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
