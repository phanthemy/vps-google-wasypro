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
  Package
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
}

export const CTVPortalContainer: React.FC<CTVPortalContainerProps> = ({
  currentUser,
  onLogout,
  onNavigateHome,
  initialTab = 'dashboard',
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [copiedLink, setCopiedLink] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [isPassModalOpen, setPassModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/?ref=${currentUser.id}` 
    : `https://wasypro.com/?ref=${currentUser.id}`;

  const copyReferralLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(referralLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.id === 'ADMIN' || currentUser?.id === 'ADMIN01';
  const isAccountant = currentUser?.role === 'accountant' || currentUser?.id === 'ACCOUNTANT' || currentUser?.id === 'ACC01';
  const isAdminOrAccountant = isAdmin || isAccountant;
  
  // A user is considered a full partner if they joined the system or already have an official rank
  // isParticipant = CTV (joined system) OR NPP with rank (purchased package) OR has official rank OR admin
  const isParticipant = !!currentUser?.isSystemParticipant || 
    (currentUser as any)?.nppStatus === 'ACTIVE' ||
    !!(currentUser as any)?.nppRank ||
    ['AMBASSADOR', 'MANAGER', 'DIRECTOR', 'SALES_MANAGER', 'SALES_DIRECTOR'].includes(currentUser?.rank || '') ||
    isAdminOrAccountant;
  
  // NPP user with pending/approved/purchasing status — show portal but not "partner" badge
  // NPP tab: show for users in active NPP flow
  // PENDING = just submitted, not approved yet — hide tab
  // APPROVED = admin approved, user needs to buy package — SHOW tab
  // PURCHASING/PAID/ACTIVE = in purchase flow or active — SHOW tab
  const hasNppRegistration = ['APPROVED','PURCHASING','PAID','ACTIVE'].includes((currentUser as any)?.nppStatus) || !!(currentUser as any)?.isNpp;

  // Rank Display Information
  const rankLabel = (() => {
    const r = (currentUser?.rank || '').toUpperCase();
    if (r === 'DIRECTOR' || r === 'SALES_DIRECTOR') return '👑 Quản Lý';
    if (r === 'MANAGER' || r === 'SALES_MANAGER') return '🛡️ Trưởng Nhóm';
    if (r === 'AMBASSADOR') return '⭐ Đại Sứ';
    if (isAdmin) return '🔑 Quản Trị Viên';
    if (isAccountant) return '📊 Kế Toán';
    return isParticipant ? 'Thành Viên' : 'Khách Hàng';
  })();

  const rankBadgeStyle = (() => {
    const r = (currentUser?.rank || '').toUpperCase();
    if (r === 'DIRECTOR' || r === 'SALES_DIRECTOR') return 'bg-red-500/25 text-red-200 border border-red-400/40';
    if (r === 'MANAGER' || r === 'SALES_MANAGER') return 'bg-sky-500/25 text-sky-200 border border-sky-400/40';
    if (r === 'AMBASSADOR') return 'bg-purple-500/25 text-purple-200 border border-purple-400/40';
    if (isAdmin || isAccountant) return 'bg-yellow-500/25 text-yellow-200 border border-yellow-400/40';
    if (isParticipant) return 'bg-blue-500/25 text-blue-200 border border-blue-400/40';
    return 'bg-white/20 text-white border border-white/30';
  })();

  const nppS = (currentUser as any)?.nppStatus;
  const nppRoleMap: Record<string, string> = { ACTIVE: 'Nhà Phân Phối (NPP)', PAID: 'NPP — Chờ kích hoạt', PURCHASING: 'NPP — Đang mua gói' };
  const roleText = isAdmin 
    ? 'Quản Trị' 
    : isAccountant 
    ? 'Kế Toán' 
    : (nppS && nppRoleMap[nppS]) 
    ? nppRoleMap[nppS] 
    : isParticipant 
    ? 'Đối Tác CTV' 
    : 'Khách Hàng';

  // 1. Primary Navigation Tabs (Pinned on main bar)
  // Cleaned: Removed 'wholesale' and 'customers'
  const primaryNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, visible: true },
    { id: 'orders', label: isParticipant ? 'Đơn Hàng' : 'Đơn Hàng Của Tôi', icon: ShoppingCart, visible: true },
    { id: 'rank', label: 'Cấp Bậc & Điểm Tích Lũy', icon: TrendingUp, visible: isParticipant },
    { id: 'commissions', label: 'Hoa Hồng', icon: Wallet, visible: isParticipant },
    { id: 'npp', label: 'Gói NPP', icon: Package, visible: hasNppRegistration },
  ];

  // 2. Secondary Navigation Tabs (Grouped in "Thêm ▾" dropdown)
  // Cleaned: Removed 'pricelist', 'statistics', 'about', 'settings'
  const moreNavItems = [
    { id: 'network', label: 'Sơ đồ Tuyến dưới', icon: Network, visible: isParticipant, group: 'ctv' },
    { id: 'account', label: 'Thông Tin Tài Khoản', icon: UserCog, visible: true, group: 'ctv' },
    { id: 'users', label: 'Quản Lý CTV Toàn HT', icon: Users, visible: isAdminOrAccountant, group: 'admin' },
    { id: 'internal-users', label: 'Quản Lý Nhân Sự', icon: UserCog, visible: isAdmin, group: 'admin' },
    { id: 'audit-logs', label: 'Lịch Sử Hệ Thống', icon: History, visible: isAdminOrAccountant, group: 'admin' },
  ];

  const visibleMoreItems = moreNavItems.filter(i => i.visible);
  const isMoreActive = visibleMoreItems.some(i => i.id === activeTab);
  const activeMoreItem = visibleMoreItems.find(i => i.id === activeTab);

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    setMoreDropdownOpen(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Top Header Card */}
      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary-dark via-primary to-accent text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30 text-white font-extrabold text-lg shadow-inner">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${rankBadgeStyle}`}>
                {rankLabel}
              </span>
              {(currentUser as any).businessId ? (
                <span className="text-xs font-extrabold bg-amber-400 text-slate-900 px-2 py-0.5 rounded shadow-sm">
                  Mã đối tác: {(currentUser as any).businessId}
                </span>
              ) : null}
              <span className="text-xs font-mono bg-black/20 px-2 py-0.5 rounded text-white/90">
                ID: {currentUser.id}
              </span>
              <span className="text-xs text-white/80">({roleText})</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-wide mt-0.5">
              {currentUser.fullName}
            </h2>
          </div>
        </div>

        {/* Action Buttons & Referral Copy */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          {/* Referral link only shown if user has BID (completed order) */}
          {isParticipant  && (
            <button
              onClick={copyReferralLink}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all border border-white/30"
              title="Sao chép link giới thiệu của bạn"
            >
              {copiedLink ? <Check className="w-4 h-4 text-sky-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Đã sao chép link!' : 'Link giới thiệu của tôi'}</span>
            </button>
          )}

          <button
            onClick={() => setPassModalOpen(true)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all border border-white/20"
            title="Đổi mật khẩu"
          >
            <Key className="w-4 h-4" />
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/80 hover:bg-red-600 text-white text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>

          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-primary hover:bg-gray-100 text-xs font-extrabold transition-all shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Xem Website</span>
          </button>
        </div>
      </div>

      {/* Main CTV Portal Card Container */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-visible">
        {/* Navigation Tabs Bar with Primary Tabs + "Thêm ▾" Dropdown */}
        <div className="border-b border-gray-100 bg-gray-50/80 p-2 overflow-visible flex items-center gap-1.5 flex-wrap">
          {/* Primary Tabs */}
          {primaryNavItems.filter(i => i.visible).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                    : 'text-gray-600 hover:bg-white hover:text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* "Thêm ▾" Dropdown Menu */}
          {visibleMoreItems.length > 0 && (
            <div className="relative" ref={moreDropdownRef}>
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  isMoreActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                    : 'text-gray-600 hover:bg-white hover:text-primary border border-gray-200/80 bg-white/70'
                }`}
              >
                {isMoreActive && activeMoreItem ? (
                  <>
                    <activeMoreItem.icon className="w-4 h-4" />
                    <span>{activeMoreItem.label}</span>
                  </>
                ) : (
                  <>
                    <MoreHorizontal className="w-4 h-4" />
                    <span>Thêm</span>
                  </>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {moreDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-fadeIn divide-y divide-gray-50">
                  {/* Partner Group */}
                  <div className="py-1">
                    <p className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {isParticipant ? 'Khu vực Đối tác' : 'Tài khoản'}
                    </p>
                    {visibleMoreItems.filter(i => i.group === 'ctv').map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectTab(item.id)}
                          className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-left transition-colors ${
                            isActive
                              ? 'bg-primary/10 text-primary font-bold'
                              : 'text-gray-700 hover:bg-primary/5 hover:text-primary'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-primary/80" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Admin / System Group */}
                  {visibleMoreItems.some(i => i.group === 'admin') && (
                    <div className="py-1 bg-slate-50/50">
                      <p className="px-4 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quản trị Hệ thống</p>
                      {visibleMoreItems.filter(i => i.group === 'admin').map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleSelectTab(item.id)}
                            className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-left transition-colors ${
                              isActive
                                ? 'bg-primary/10 text-primary font-bold'
                                : 'text-gray-700 hover:bg-primary/5 hover:text-primary'
                            }`}
                          >
                            <Icon className="w-4 h-4 text-blue-600" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* View Content Area */}
        <div className="p-4 sm:p-6 min-h-[500px]">
          {activeTab === 'dashboard' && (
            <DashboardView 
              refreshKey={refreshKey} 
              currentUser={currentUser} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView 
              currentUser={currentUser} 
            />
          )}

          {activeTab === 'rank' && (
            <RankView 
              currentUser={currentUser} 
            />
          )}

          {activeTab === 'commissions' && isParticipant && (
            <CommissionHistoryView 
              currentUser={currentUser} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'network' && isParticipant && (
            <NetworkView 
              refreshKey={refreshKey} 
              currentUser={currentUser} 
            />
          )}

          {activeTab === 'users' && isAdminOrAccountant && (
            <UsersView 
              refreshKey={refreshKey} 
              onAddUser={() => {}} 
              onEditUser={() => {}} 
            />
          )}

          {activeTab === 'internal-users' && isAdmin && (
            <SystemUsersView />
          )}

          {activeTab === 'audit-logs' && isAdminOrAccountant && (
            <SystemLogsView 
              currentUser={currentUser} 
            />
          )}

          {activeTab === 'npp' && (
            <UserNppDashboard
              userId={currentUser.id}
              nppStatus={(currentUser as any).nppStatus}
              rank={(currentUser as any).rank}
              businessId={(currentUser as any).businessId}
            />
          )}
          {activeTab === 'account' && (
            <SettingsView currentUser={currentUser} />
          )}
        </div>
      </div>

      {/* Password Modal */}
      {isPassModalOpen && (
        <ChangePasswordModal 
          currentUser={currentUser}
          onClose={() => setPassModalOpen(false)}
        />
      )}
    </div>
  );
};
