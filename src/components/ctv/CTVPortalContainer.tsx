import React, { useState } from 'react';
// @ts-ignore
import PlaceholderView from './views/PlaceholderView';
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
// @ts-ignore
import CustomersView from './views/CustomersView.jsx';
// @ts-ignore
import PriceListView from './views/PriceListView.jsx';
// @ts-ignore
import CommissionHistoryView from './views/CommissionHistoryView.jsx';
// @ts-ignore
import ChangePasswordModal from './components/modals/ChangePasswordModal.jsx';

interface CTVPortalContainerProps {
  currentUser: UserSession;
  onLogout: () => void;
  onNavigateHome: (section?: string) => void;
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
  const [passModalOpen, setPassModalOpen] = useState(false);

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
    if (activeTab === 'commissions-detail') return 'Lịch sử hoa hồng';
    if (activeTab === 'orders') return 'Đơn hàng của tôi';
    if (activeTab === 'more') return 'Menu Thêm';
    if (activeTab === 'network') return 'Sơ đồ Tuyến dưới';
    if (activeTab === 'account') return 'Thông tin tài khoản';
    if (activeTab === 'customers') return 'Khách hàng của tôi';
    if (activeTab === 'price-list') return 'Bảng giá & Chiết khấu';
    if (activeTab === 'dealers') return 'Đại lý & Showroom';
    if (activeTab === 'events') return 'Sự kiện & Báo chí';
    if (activeTab === 'feedback') return 'Phản hồi khách hàng';
    if (activeTab === 'legal-docs') return 'Pháp lý & Giấy CN';
    if (activeTab === 'company-policy') return 'Chính sách Công ty';
    if (activeTab === 'regulations') return 'Quy định Pháp luật';
    return undefined;
  })();

  const handleHeaderBack = () => {
    if (['network', 'account', 'customers', 'price-list', 'dealers', 'events', 'feedback', 'legal-docs', 'company-policy', 'regulations'].includes(activeTab)) {
      setActiveTab('more');
    } else if (activeTab === 'commissions-detail') {
      setActiveTab('commissions');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleSelectMoreTab = (tab: string) => {
    if (tab === 'change-password') {
      setPassModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div 
      className="min-h-screen font-sans pb-24 text-[#0F172A] overflow-x-hidden"
      style={{ 
        background: '#F8FAFC',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
        maxWidth: '100%',
        width: '100%',
        overflowX: 'hidden'
      }}
    >
      {/* 1. HEADER (64px main / 56px subpage, background #FFFFFF) */}
      <MockupHeader
        title={headerTitle}
        showBack={!isHome}
        onBack={handleHeaderBack}
        onSearchClick={() => onNavigateHome()}
        onCartClick={onCartClick || (() => onNavigateHome())}
        onMenuClick={() => setDrawerOpen(true)}
        cartCount={cartItemCount}
      />

      {/* 2. MAIN BODY (Page horizontal padding: 16px, max-w-md) */}
      <main className="max-w-md mx-auto px-4 pt-4 overflow-x-hidden w-full">
        {/* Screen 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <MockupDashboard
            currentUser={currentUser}
            onSelectTab={setActiveTab}
            onNavigateHome={() => onNavigateHome()}
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
            onViewDetails={() => setActiveTab('commissions-detail')}
          />
        )}

        {/* Screen 3 Subview: Chi tiết lịch sử hoa hồng */}
        {activeTab === 'commissions-detail' && (
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
            <CommissionHistoryView 
              currentUser={currentUser} 
              setActiveTab={setActiveTab} 
            />
          </div>
        )}

        {/* Screen 4: Trang đơn hàng */}
        {activeTab === 'orders' && (
          <MockupOrders
            currentUser={currentUser}
            onSelectOrder={(id) => console.log(`Selected order #${id}`)}
          />
        )}

        {/* Screen 5: Menu "Thêm" */}
        {activeTab === 'more' && (
          <MockupMore
            onSelectSubtab={handleSelectMoreTab}
            onNavigateHome={(sec) => onNavigateHome(sec)}
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

        {/* Subpage: Khách hàng của tôi */}
        {activeTab === 'customers' && (
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
            <CustomersView currentUser={currentUser} />
          </div>
        )}

        {/* Subpage: Bảng giá & Chiết khấu */}
        {activeTab === 'price-list' && (
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
            <PriceListView />
          </div>
        )}

      
        {activeTab === 'dealers' && (
          <PlaceholderView title="Đại lý & Showroom toàn quốc" description="Bản đồ và danh sách điểm bán, địa chỉ, SĐT các đại lý trên 63 tỉnh thành." />
        )}
        {activeTab === 'events' && (
          <PlaceholderView title="Sự kiện & Báo chí" description="Thư viện Video sự kiện, Lịch Zoom đào tạo, các bài báo đưa tin về tập đoàn." />
        )}
        {activeTab === 'feedback' && (
          <PlaceholderView title="Kết quả sử dụng" description="Tổng hợp Video/Hình ảnh phỏng vấn khách hàng thực tế. Nút chia sẻ TikTok/YouTube/Facebook." />
        )}
        {activeTab === 'legal-docs' && (
          <PlaceholderView title="Pháp lý & Giấy chứng nhận" description="Giấy phép ĐKKD, Giấy kiểm định chất lượng nước, Bằng sáng chế. Cho phép tải PDF." />
        )}
        {activeTab === 'company-policy' && (
          <PlaceholderView title="Chính sách Công ty" description="Quy chế hoạt động, chính sách trả thưởng, quyền lợi & nghĩa vụ thành viên." />
        )}
        {activeTab === 'regulations' && (
          <PlaceholderView title="Quy định Pháp luật" description="Điều khoản cam kết hoạt động thương mại điện tử / Affiliate chuẩn mực." />
        )}

      </main>

      {/* 3. BOTTOM NAVIGATION (Height 66px, 40x40 #0072F5 active icon) */}
      <MockupBottomNav
        activeTab={['network', 'account', 'customers', 'price-list', 'more', 'dealers', 'events', 'feedback', 'legal-docs', 'company-policy', 'regulations'].includes(activeTab) ? 'more' : activeTab === 'commissions-detail' ? 'commissions' : activeTab}
        onChangeTab={setActiveTab}
      />

      {/* 4. SLIDE-OUT DRAWER MENU (Width 320px, 52px item height) */}
      <MockupDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigateHome={(sec) => { onNavigateHome(sec); setDrawerOpen(false); }}
        onNavigateCTV={() => { setActiveTab('dashboard'); setDrawerOpen(false); }}
        onNavigateOrders={() => { setActiveTab('orders'); setDrawerOpen(false); }}
        onLogout={onLogout}
      />

      {/* 5. MODAL: ĐỔI MẬT KHẨU */}
      {passModalOpen && (
        <ChangePasswordModal
          currentUser={currentUser}
          onClose={() => setPassModalOpen(false)}
        />
      )}
    </div>
  );
};
export default CTVPortalContainer;
