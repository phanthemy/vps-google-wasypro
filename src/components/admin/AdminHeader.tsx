import React from 'react';
import { ExternalLink, LogOut, Menu, Shield, User } from 'lucide-react';
import { AdminUser } from '../../types/schema';

interface AdminHeaderProps {
  adminUser: AdminUser;
  activeTab: string;
  onSwitchToClient: () => void;
  onLogout: () => void;
  onToggleMobileSidebar: () => void;
}

const TAB_NAMES: Record<string, string> = {
  overview: 'Tổng Quan Hệ Thống',
  products: 'Quản Lý Sản Phẩm & Lõi Lọc',
  warranties: 'Quản Lý Tra Cứu Bảo Hành',
  leads: 'Quản Lý Đơn Đăng Ký Tư Vấn',
  news: 'Quản Lý Bài Viết & Tin Tức',
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  adminUser,
  activeTab,
  onSwitchToClient,
  onLogout,
  onToggleMobileSidebar,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Mở menu điều hướng"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex w-9 h-9 rounded-xl bg-slate-900 text-cyan-400 items-center justify-center font-bold text-sm shadow-sm">
            <Shield className="w-5 h-5 text-ocean-400" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase hidden sm:block">
              WASY PRO Portal
            </span>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {TAB_NAMES[activeTab] || 'Admin Dashboard'}
            </h1>
          </div>
        </div>
      </div>

      {/* Right: Switch Client button & User Info & Logout */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Switch to Client Website */}
        <button
          onClick={onSwitchToClient}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-ocean-50 text-slate-700 hover:text-ocean-700 font-semibold text-xs sm:text-sm border border-slate-200 hover:border-ocean-200 transition-all flex items-center gap-1.5 shadow-2xs"
          title="Chuyển sang giao diện người dùng"
        >
          <ExternalLink className="w-4 h-4 text-ocean-600" />
          <span className="hidden sm:inline">Xem Website Khách</span>
          <span className="sm:hidden">Website</span>
        </button>

        {/* Admin User Profile */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-ocean-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
            {adminUser.avatar ? (
              <img src={adminUser.avatar} alt={adminUser.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight">{adminUser.name}</div>
            <div className="text-[11px] text-ocean-600 font-semibold">Quản trị viên</div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2 ml-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
            title="Đăng xuất khỏi Admin"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
