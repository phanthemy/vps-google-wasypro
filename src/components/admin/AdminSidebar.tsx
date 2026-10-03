import React from 'react';
import { LayoutDashboard, MapPin,  Package, ShieldCheck, PhoneCall, Newspaper, X, Waves, ExternalLink, ShoppingCart, Users, Settings2, Calendar, UserCheck, UserCircle2, ShoppingBag, Layers } from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onSwitchToClient: () => void;
  userPhone?: string;
}

export const NAV_ITEMS = [
  { id: 'overview', label: 'Tổng Quan', icon: LayoutDashboard, badge: null },
  { id: 'products', label: 'Sản Phẩm', icon: Package, badge: null },
  { id: 'categories', label: 'Danh Mục', icon: Layers, badge: null },
  { id: 'warranties', label: 'Bảo Hành', icon: ShieldCheck, badge: null },
  { id: 'leads', label: 'Đơn Tư Vấn', icon: PhoneCall, badge: 'Mới' },
  { id: 'orders', label: 'Đơn Hàng', icon: ShoppingCart, badge: 'Mới' },
  { id: 'ctv', label: 'Quản Lý CTV', icon: UserCheck, badge: null },
  { id: 'members', label: 'Tài Khoản Thành Viên', icon: UserCircle2, badge: null },
  { id: 'news', label: 'Bài Viết', icon: Newspaper, badge: null },
  { id: 'users', label: 'Tài Khoản Admin', icon: Users, badge: null },
  { id: 'periods', label: 'Kỳ Hoa Hồng', icon: Calendar, badge: null },
  { id: 'npp-packages', label: 'Gói NPP', icon: ShoppingBag, badge: null },
  { id: 'npp-management', label: 'Quản Lý NPP', icon: ShoppingBag, badge: 'Mới' },
  { id: 'policy', label: 'Cấu Hình Hoa Hồng', icon: Settings2, badge: null },
  { id: 'dealers', label: 'Đại Lý', icon: MapPin, badge: null },
  { id: 'system', label: 'Hệ Thống', icon: Settings2, badge: null },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  onSwitchToClient,
  userPhone,
}) => {
  // Only phone 0999999999 can see "Hệ Thống" (system) menu
  const visibleNavItems = NAV_ITEMS.filter(item =>
    item.id !== 'system' || userPhone === '0999999999'
  );
  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-ocean-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-ocean-500/20">
            <Waves className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="text-base font-black text-white tracking-wider">WASY PRO</div>
            <div className="text-[11px] text-cyan-400 font-semibold tracking-wide">ADMIN PORTAL</div>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Menu Items */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Menu Điều Hướng
        </div>

        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-ocean-600 to-cyan-600 text-white shadow-lg shadow-ocean-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-400 text-slate-950 uppercase tracking-wide">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer info & Website Switch */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <button
          onClick={onSwitchToClient}
          className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-2 border border-slate-700/60"
        >
          <ExternalLink className="w-4 h-4 text-cyan-400" />
          <span>Về Website Khách Hàng</span>
        </button>

        <div className="text-center text-[11px] text-slate-400 font-medium">
          WASY PRO v2.4 Admin System
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 min-h-screen border-r border-slate-800">
        {content}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Sidebar Panel */}
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
