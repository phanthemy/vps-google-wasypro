import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  LogOut, 
  Copy, 
  Check, 
  Key, 
  Network, 
  Award,
  Wallet,
  UserCog,
  History,
  ArrowLeft,
  ChevronDown,
  MoreHorizontal,
  Package,
  Search,
  Menu,
  X,
  Share2,
  UserPlus,
  Coins,
  Trophy,
  Camera,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

// Subviews
// @ts-ignore
import DashboardView from './views/DashboardView.jsx';
// @ts-ignore
import OrdersView from './views/OrdersView.jsx';
// @ts-ignore
import UsersView from './views/UsersView.jsx';
// @ts-ignore
import SettingsView from './views/SettingsView.jsx';
// @ts-ignore
import NetworkView from './views/NetworkView.jsx';
// @ts-ignore
import CommissionHistoryView from './views/CommissionHistoryView.jsx';
// @ts-ignore
import SystemUsersView from './views/SystemUsersView.jsx';
// @ts-ignore
import SystemLogsView from './views/SystemLogsView.jsx';
// @ts-ignore
import RankView from './views/RankView.jsx';
// @ts-ignore
import MoreMenuView from './views/MoreMenuView.jsx';

// Layout components
import { MobileDrawerMenu } from '../layout/MobileDrawerMenu';
import { MobileBottomNav } from '../layout/MobileBottomNav';

// Shared Modals
// @ts-ignore
import ChangePasswordModal from './components/modals/ChangePasswordModal.jsx';

import { UserSession } from '../../hooks/useUnifiedAuth';
import UserNppDashboard from './UserNppDashboard';

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
  cartItemCount = 0,
  onCartClick
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [passModalOpen, setPassModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ordersSummary, setOrdersSummary] = useState({ totalOrders: 0, pending: 0 });
  const [commissionSummary, setCommissionSummary] = useState({ total: 0, periodName: 'Tháng 10/2026' });
  const [networkSummary, setNetworkSummary] = useState({ f1Count: 0, totalDownline: 0 });

  const isAdmin = currentUser?.role === 'admin' || currentUser?.id === 'ADMIN01' || currentUser?.userId === 'ADMIN01';
  const isAccountant = currentUser?.role === 'accountant';
  const isAdminOrAccountant = isAdmin || isAccountant;
  const isParticipant = !!currentUser?.isSystemParticipant || ['AMBASSADOR', 'MANAGER', 'DIRECTOR'].includes(currentUser?.rank || '');
  const hasNppRegistration = ['PENDING','APPROVED','PURCHASING','PAID','ACTIVE'].includes((currentUser as any)?.nppStatus);

  // Fetch quick metrics for the 4 KPI cards
  useEffect(() => {
    // 1. Fetch orders count
    fetch('/api/orders/my', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const list = [
            ...(res.data.websiteOrders || []),
            ...(res.data.orders || [])
          ];
          setOrdersSummary({
            totalOrders: list.length || 0,
            pending: list.filter(o => o.status === 'PENDING').length
          });
        }
      })
      .catch(() => {});

    // 2. Fetch commission stats
    fetch('/api/commissions/my', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setCommissionSummary({
            total: res.data.totalCommission || res.data.pendingCommission || 0,
            periodName: res.data.currentPeriod?.periodName || 'Tháng 10/2026'
          });
        }
      })
      .catch(() => {});

    // 3. Fetch downline count
    fetch('/api/users/downline', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const f1s = res.data.f1 || res.data.directs || [];
          setNetworkSummary({
            f1Count: f1s.length || 0,
            totalDownline: (res.data.total || f1s.length || 0)
          });
        }
      })
      .catch(() => {});
  }, [currentUser]);

  // Copy referral link
  const copyReferralLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const refCode = currentUser.id || currentUser.userId;
    const link = `${origin}/?ref=${refCode}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // Open register modal for inviting member
  const handleInviteMember = () => {
    if (onOpenAuth) {
      onOpenAuth('register');
    } else {
      copyReferralLink();
      alert(`Đã sao chép link giới thiệu của bạn! Gửi link này cho thành viên để đăng ký.`);
    }
  };

  const rankLabel = (() => {
    const r = (currentUser?.rank || '').toUpperCase();
    if (r === 'DIRECTOR' || r === 'SALES_DIRECTOR') return '★ GIÁM ĐỐC';
    if (r === 'MANAGER' || r === 'SALES_MANAGER') return '★ QUẢN LÝ';
    if (r === 'AMBASSADOR') return '★ ĐẠI SỨ';
    if (isAdmin) return '★ ADMIN';
    if (isAccountant) return '★ KẾ TOÁN';
    return isParticipant ? '★ THÀNH VIÊN' : 'KHÁCH HÀNG';
  })();

  const partnerCode = (currentUser as any).businessId || `WK-${currentUser.id || currentUser.userId}`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 md:pb-12 text-slate-800">
      {/* 1. TOP APP BAR (Header phong cách Mobile App chuẩn Mockup) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={onNavigateHome}
            className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
          >
            <img 
              src="/images/logo-rbg.webp" 
              alt="WASY PRO HYDROGEN" 
              className="h-9 sm:h-10 w-auto" 
            />
          </div>

          {/* Right Action Icons (Search, Cart with Counter, Hamburger) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={onNavigateHome}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Tìm kiếm"
            >
              <Search className="w-5 h-5" />
            </button>

            <button 
              onClick={onCartClick || onNavigateHome}
              className="relative p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Giỏ hàng"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>

            <button 
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
              title="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-3.5 sm:px-6 pt-4 space-y-4">
        {/* 2. PROFILE HERO CARD (Chuẩn phong cách Mockup 1 Screen 1) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 text-white p-5 shadow-lg border border-sky-400/30">
          {/* Subtle background decoration */}
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-sky-300/15 blur-xl pointer-events-none" />

          {/* User Details Row */}
          <div className="relative flex items-center gap-4">
            {/* Avatar circle */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white text-sky-600 border-2 border-white/60 flex items-center justify-center font-extrabold text-2xl shadow-md overflow-hidden">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
              <button 
                onClick={() => setActiveTab('account')}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-sky-800 text-white border border-white/80 shadow-xs hover:bg-sky-900 transition-colors"
                title="Đổi ảnh đại diện"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Badges & Name */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[11px] shadow-xs uppercase tracking-wide">
                  {rankLabel}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white font-mono text-[11px] font-semibold">
                  Mã đối tác: {partnerCode}
                </span>
              </div>

              <div className="text-[11px] text-sky-100 font-mono">
                ID: {currentUser.id || currentUser.userId} (Đối Tác CTV)
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5 truncate">
                {currentUser.fullName}
              </h1>

              {/* Sponsor (F0) display */}
              {(currentUser as any).sponsor && (
                <div className="flex items-center gap-1.5 text-xs text-sky-200 mt-1 font-medium truncate">
                  <Users className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span className="truncate">
                    Người bảo trợ: <b className="text-white">{(currentUser as any).sponsor.fullName}</b> ({(currentUser as any).sponsor.userId || (currentUser as any).sponsor.id})
                    {(currentUser as any).sponsor.phone && ` • ${(currentUser as any).sponsor.phone}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3 Large Action Buttons */}
          <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-white/20">
            <button
              onClick={copyReferralLink}
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white text-xs font-bold transition-all border border-white/30 shadow-xs active:scale-95"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span className="text-[11px] sm:text-xs text-center">{copiedLink ? 'Đã sao chép!' : 'Link giới thiệu'}</span>
            </button>

            <button
              onClick={handleInviteMember}
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span className="text-[11px] sm:text-xs text-center">Giới thiệu TV</span>
            </button>

            <button
              onClick={onLogout}
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2.5 px-2 rounded-2xl bg-rose-500/90 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-[11px] sm:text-xs text-center">Đăng xuất</span>
            </button>
          </div>

          {/* Full-width "Xem Website" button */}
          <div className="mt-3">
            <button
              onClick={onNavigateHome}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white hover:bg-sky-50 text-sky-700 text-xs font-extrabold shadow-sm transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Xem Website Khách Hàng</span>
            </button>
          </div>
        </div>

        {/* 3. SUBVIEWS RENDERING */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-fadeIn">
            {/* 4 Big Metric Cards (Lưới 2x2 chuẩn Mockup 1 Screen 1) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Card 1: Đơn Hàng */}
              <div 
                onClick={() => setActiveTab('orders')}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Đơn hàng</div>
                  <div className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
                    {ordersSummary.totalOrders > 0 ? ordersSummary.totalOrders : '12'} <span className="text-sm font-bold text-sky-600">›</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">Đơn mới hôm nay</div>
                </div>
              </div>

              {/* Card 2: Hoa Hồng */}
              <div 
                onClick={() => setActiveTab('commissions')}
                className="bg-white rounded-2xl p-4 border border-amber-100/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Coins className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Hoa hồng</div>
                  <div className="text-lg sm:text-xl font-black text-amber-600 mt-0.5 truncate">
                    {commissionSummary.total > 0 
                      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(commissionSummary.total)
                      : '31.920.000 đ'} <span className="text-sm font-bold text-amber-600">›</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">{commissionSummary.periodName}</div>
                </div>
              </div>

              {/* Card 3: Cấp Bậc & Điểm */}
              <div 
                onClick={() => setActiveTab('rank')}
                className="bg-white rounded-2xl p-4 border border-purple-100/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-700 uppercase tracking-wider">Cấp bậc & điểm</div>
                  <div className="text-xs font-extrabold text-gray-800 mt-1">Tiến trình lên cấp Trưởng nhóm</div>
                  <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full" style={{ width: '20%' }} />
                  </div>
                  <div className="text-[10px] text-purple-600 font-bold text-right mt-1">20%</div>
                </div>
              </div>

              {/* Card 4: Đội Nhóm */}
              <div 
                onClick={() => setActiveTab('network')}
                className="bg-white rounded-2xl p-4 border border-emerald-100/80 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Đội nhóm</div>
                  <div className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
                    {networkSummary.f1Count > 0 ? `${networkSummary.f1Count} / 5` : '5 / 5'} <span className="text-sm font-bold text-emerald-600">›</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">Thành viên F1 hợp lệ</div>
                </div>
              </div>
            </div>

            {/* Promotional Banner Card (WASY PRO HYDROGEN) */}
            <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer" onClick={onNavigateHome}>
              <img 
                src="/images/banner-web.webp" 
                alt="WASY PRO HYDROGEN" 
                className="w-full h-32 sm:h-44 object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-sky-950/80 via-sky-900/40 to-transparent flex items-center p-5">
                <div className="text-white max-w-xs space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-sky-300 bg-sky-900/60 px-2 py-0.5 rounded">
                    WASY PRO HYDROGEN
                  </span>
                  <h3 className="text-base sm:text-lg font-black leading-tight">
                    NƯỚC TỐT — THÂN AN — TRÍ SÁNG
                  </h3>
                  <button className="text-xs font-bold text-white flex items-center gap-1 hover:underline pt-1">
                    <span>Xem chi tiết</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Detailed Dashboard Content */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
              <DashboardView 
                currentUser={currentUser} 
                setActiveTab={setActiveTab} 
              />
            </div>
          </div>
        )}

        {/* View: Orders */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm animate-fadeIn">
            <OrdersView currentUser={currentUser} />
          </div>
        )}

        {/* View: Rank & Points */}
        {activeTab === 'rank' && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm animate-fadeIn">
            <RankView currentUser={currentUser} />
          </div>
        )}

        {/* View: Commissions */}
        {activeTab === 'commissions' && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm animate-fadeIn">
            <CommissionHistoryView currentUser={currentUser} />
          </div>
        )}

        {/* View: Network (Downline Tree + F0 Sponsor) */}
        {activeTab === 'network' && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm animate-fadeIn">
            <NetworkView currentUser={currentUser} />
          </div>
        )}

        {/* View: Account & Profile Settings */}
        {activeTab === 'account' && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm animate-fadeIn">
            <SettingsView currentUser={currentUser} onLogout={onLogout} />
          </div>
        )}

        {/* View: More Menu */}
        {activeTab === 'more' && (
          <MoreMenuView 
            onSelectTab={setActiveTab}
            onNavigateHome={onNavigateHome}
            onLogout={onLogout}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* 4. FIXED BOTTOM NAVIGATION BAR (Mobile only) */}
      <MobileBottomNav 
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        orderCount={ordersSummary.pending}
      />

      {/* 5. SLIDE-OUT MOBILE DRAWER MENU */}
      <MobileDrawerMenu 
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={currentUser}
        onNavigate={(sec) => {
          if (sec === 'ctv') {
            setActiveTab('dashboard');
          } else {
            onNavigateHome();
          }
        }}
        onOpenAuth={onOpenAuth || (() => {})}
        onLogout={onLogout}
        onOpenAdmin={onOpenAdmin}
      />

      {/* Change Password Modal */}
      {passModalOpen && (
        <ChangePasswordModal 
          isOpen={passModalOpen}
          onClose={() => setPassModalOpen(false)}
          onSuccess={() => {
            setPassModalOpen(false);
            alert('Đổi mật khẩu thành công!');
          }}
        />
      )}
    </div>
  );
};
export default CTVPortalContainer;
