import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  ShoppingCart, 
  Users, 
  Settings, 
  TrendingUp, 
  LogOut, 
  Copy, 
  Check, 
  Key, 
  Contact, 
  BookOpen, 
  Network, 
  Truck, 
  Award,
  Wallet,
  PieChart as PieChartIcon,
  UserCog,
  History,
  Info,
  ArrowLeft,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';

// Subviews
// @ts-ignore
import DashboardView from './views/DashboardView.jsx';
// @ts-ignore
import OrdersView from './views/OrdersView.jsx';
// @ts-ignore
import CustomersView from './views/CustomersView.jsx';
// @ts-ignore
import UsersView from './views/UsersView.jsx';
// @ts-ignore
import SettingsView from './views/SettingsView.jsx';
// @ts-ignore
import NetworkView from './views/NetworkView.jsx';
// @ts-ignore
import PriceListView from './views/PriceListView.jsx';
// @ts-ignore
import ServiceDetailView from './views/ServiceDetailView.jsx';
// @ts-ignore
import StatisticsView from './views/StatisticsView.jsx';
// @ts-ignore
import CommissionHistoryView from './views/CommissionHistoryView.jsx';
// @ts-ignore
import SystemUsersView from './views/SystemUsersView.jsx';
// @ts-ignore
import SystemLogsView from './views/SystemLogsView.jsx';
// @ts-ignore
import AboutView from './views/AboutView.jsx';
// @ts-ignore
import WholesaleOrdersView from './views/WholesaleOrdersView.jsx';
// @ts-ignore
import RankView from './views/RankView.jsx';

// Shared Modals
// @ts-ignore
import CustomerModal from './components/modals/CustomerModal.jsx';
// @ts-ignore
import OrderModal from './components/modals/OrderModal.jsx';
// @ts-ignore
import UserModal from './components/modals/UserModal.jsx';
// @ts-ignore
import ChangePasswordModal from './components/modals/ChangePasswordModal.jsx';

import { UserSession } from '../../hooks/useUnifiedAuth';

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
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
  const [isOrderModalOpen, setOrderModalOpen] = useState(false);
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [isPassModalOpen, setPassModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Shared Data state
  const [userList, setUserList] = useState<any[]>([]);
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [serviceList, setServiceList] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Service Detail State
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetch('/api/users', { credentials: 'include' }).then(r=>r.json()).then(res => res.success && setUserList(res.data)).catch(()=>{});
    fetch('/api/customers', { credentials: 'include' }).then(r=>r.json()).then(res => {
      if(res.success) {
        if (currentUser?.role === 'admin' || currentUser?.id === 'ADMIN' || currentUser?.id === 'ADMIN01') {
          setCustomerList(res.data);
        } else {
          setCustomerList(res.data.filter((c: any) => c.sourceCtvId === currentUser?.id));
        }
      }
    }).catch(()=>{});
    fetch('/api/services', { credentials: 'include' }).then(r=>r.json()).then(res => res.success && setServiceList(res.data)).catch(()=>{});
  }, [refreshKey, currentUser]);

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
  const isCustomer = currentUser?.role === 'customer';

  // 1. Primary Navigation Tabs (Pinned on main bar)
  const primaryNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, visible: true },
    { id: 'orders', label: 'Đơn Hàng', icon: ShoppingCart, visible: true },
    { id: 'customers', label: 'Khách Hàng', icon: Contact, visible: !isCustomer },
    { id: 'rank', label: 'Cấp Bậc & Điểm Tích Lũy', icon: TrendingUp, visible: true },
    { id: 'commissions', label: 'Hoa Hồng', icon: Wallet, visible: !isCustomer },
  ];

  // 2. Secondary Navigation Tabs (Grouped in "Thêm ▾" dropdown)
  const moreNavItems = [
    { id: 'network', label: 'Sơ đồ Tuyến dưới', icon: Network, visible: !isCustomer, group: 'ctv' },
    { id: 'pricelist', label: 'Bảng Giá Sản Phẩm', icon: BookOpen, visible: true, group: 'ctv' },
    { id: 'statistics', label: 'Thống Kê Bán Hàng', icon: PieChartIcon, visible: !isCustomer, group: 'ctv' },
    { id: 'about', label: 'Chính sách WATER KING', icon: Info, visible: true, group: 'ctv' },
    { id: 'users', label: 'Quản Lý CTV Toàn HT', icon: Users, visible: isAdminOrAccountant, group: 'admin' },
    { id: 'settings', label: 'Cấu Hình Cơ Chế', icon: Settings, visible: false, group: 'admin' },
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
      {/* Top CTV Quick Banner */}
      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary-dark via-primary to-accent text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30 text-white font-extrabold text-lg shadow-inner">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 uppercase tracking-wider">
                {currentUser.tier || 'SILVER'}
              </span>
              {(currentUser as any).businessId && (
                <span className="text-xs font-extrabold bg-amber-400 text-slate-900 px-2 py-0.5 rounded shadow-sm">
                  Mã đối tác: {(currentUser as any).businessId}
                </span>
              )}
              <span className="text-xs font-mono bg-black/20 px-2 py-0.5 rounded text-white/90">
                ID: {currentUser.id}
              </span>
              <span className="text-xs text-white/70">({currentUser.role.toUpperCase()})</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-wide mt-0.5">
              {currentUser.fullName}
            </h2>
          </div>
        </div>

        {/* Action Buttons & Referral Copy */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          <button
            onClick={copyReferralLink}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all border border-white/30"
            title="Sao chép link giới thiệu của bạn"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedLink ? 'Đã sao chép link!' : 'Link giới thiệu của tôi'}</span>
          </button>

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
                  {/* CTV Group */}
                  <div className="py-1">
                    <p className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Khu vực CTV</p>
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
                      <p className="px-4 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quản trị & Cấu hình</p>
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

        {/* View Content Rendering Area */}
        <div className="p-4 sm:p-6 min-h-[600px]">
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

          {activeTab === 'wholesale' && (
            <WholesaleOrdersView 
              currentUser={currentUser} 
            />
          )}

          {activeTab === 'rank' && (
            <RankView 
              currentUser={currentUser} 
            />
          )}

          {activeTab === 'network' && (
            <NetworkView 
              refreshKey={refreshKey} 
              currentUser={currentUser} 
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView 
              refreshKey={refreshKey} 
              currentUser={currentUser} 
              onAddCustomer={() => setCustomerModalOpen(true)} 
            />
          )}

          {activeTab === 'commissions' && (
            <CommissionHistoryView 
              currentUser={currentUser} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'pricelist' && (
            <PriceListView 
              isAdmin={isAdminOrAccountant} 
              serviceList={serviceList} 
              onRefresh={() => setRefreshKey(prev => prev + 1)} 
            />
          )}

          {activeTab === 'service-detail' && activeServiceId && (
            <ServiceDetailView 
              service={serviceList.find((s: any) => s.id === activeServiceId)} 
              onBack={() => setActiveTab('pricelist')} 
            />
          )}

          {activeTab === 'statistics' && (
            <StatisticsView 
              currentUser={currentUser} 
              userList={userList} 
            />
          )}

          {activeTab === 'users' && isAdminOrAccountant && (
            <UsersView 
              refreshKey={refreshKey} 
              onAddUser={() => { setEditingUser(null); setUserModalOpen(true); }} 
              onEditUser={(user: any) => { setEditingUser(user); setUserModalOpen(true); }} 
            />
          )}

          {activeTab === 'settings' && isAdmin && (
            <SettingsView />
          )}

          {activeTab === 'internal-users' && isAdmin && (
            <SystemUsersView />
          )}

          {activeTab === 'audit-logs' && isAdminOrAccountant && (
            <SystemLogsView 
              currentUser={currentUser} 
            />
          )}

          {activeTab === 'about' && (
            <AboutView />
          )}
        </div>
      </div>

      {/* Shared Modals */}
      {isCustomerModalOpen && (
        <CustomerModal 
          currentUser={currentUser}
          userList={userList}
          onClose={() => setCustomerModalOpen(false)}
          onSuccess={() => { setCustomerModalOpen(false); setRefreshKey(k => k + 1); }}
        />
      )}

      {isOrderModalOpen && (
        <OrderModal 
          currentUser={currentUser}
          customerList={customerList}
          userList={userList}
          serviceList={serviceList}
          onClose={() => setOrderModalOpen(false)}
          onSuccess={() => { setOrderModalOpen(false); setRefreshKey(k => k + 1); }}
        />
      )}

      {isUserModalOpen && (
        <UserModal 
          editingUser={editingUser}
          userList={userList}
          onClose={() => setUserModalOpen(false)}
          onSuccess={() => { setUserModalOpen(false); setRefreshKey(k => k + 1); }}
        />
      )}

      {isPassModalOpen && (
        <ChangePasswordModal 
          currentUser={currentUser}
          onClose={() => setPassModalOpen(false)}
        />
      )}
    </div>
  );
};
