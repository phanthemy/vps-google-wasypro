import React, { useState } from 'react';
import { 
  User, 
  Link as LinkIcon, 
  UserPlus, 
  LogOut, 
  ArrowLeft, 
  ShoppingCart, 
  Coins, 
  Trophy, 
  Users, 
  ChevronRight,
  Check
} from 'lucide-react';
import { UserSession } from '../../../hooks/useUnifiedAuth';

interface MockupDashboardProps {
  currentUser: UserSession;
  onSelectTab: (tabId: string) => void;
  onNavigateHome: () => void;
  onLogout: () => void;
  onInviteMember: () => void;
}

export const MockupDashboard: React.FC<MockupDashboardProps> = ({
  currentUser,
  onSelectTab,
  onNavigateHome,
  onLogout,
  onInviteMember,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const ref = currentUser.id || currentUser.userId;
    navigator.clipboard?.writeText(`${origin}/?ref=${ref}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const partnerCode = (currentUser as any).businessId || `WK-${currentUser.id || currentUser.userId || '10002'}`;
  const rankText = (currentUser.rank === 'MANAGER' ? '★ QUẢN LÝ' : currentUser.rank === 'DIRECTOR' ? '★ GIÁM ĐỐC' : '★ ĐẠI SỨ');

  return (
    <div className="space-y-4 pb-4">
      {/* 1. HERO PROFILE CARD (Chính xác theo Mockup 1 Screen 1) */}
      <div className="bg-[#0072F5] rounded-3xl p-5 text-white shadow-md">
        <div className="flex items-center gap-4">
          {/* Avatar Circle */}
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
            <User className="w-9 h-9 text-[#0072F5] stroke-[2.2]" />
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <span className="bg-[#FFCC00] text-black font-black text-[12px] px-2.5 py-0.5 rounded-md leading-tight">
                {rankText}
              </span>
              <span className="bg-[#0055CC] text-white font-mono font-bold text-[11px] px-2.5 py-0.5 rounded-md leading-tight">
                Mã đối tác: {partnerCode}
              </span>
            </div>

            <div className="text-blue-100 text-[12px] font-semibold">
              ID: {currentUser.id || currentUser.userId} (Đối Tác CTV)
            </div>

            <h2 className="text-[22px] font-black text-white leading-tight tracking-tight mt-0.5 truncate">
              {currentUser.fullName || 'Phan Thế Mỹ'}
            </h2>
          </div>
        </div>

        {/* 3 Action Buttons */}
        <div className="grid grid-cols-3 gap-2.5 mt-4 pt-3.5 border-t border-white/20">
          <button
            onClick={handleCopyLink}
            className="bg-[#0052CC] hover:bg-[#0042A6] text-white rounded-2xl py-2.5 px-1 flex flex-col items-center justify-center transition-all active:scale-95 shadow-xs"
          >
            {copied ? <Check className="w-5 h-5 text-green-300" /> : <LinkIcon className="w-5 h-5" />}
            <span className="text-[12px] font-bold mt-1 text-center leading-tight">
              {copied ? 'Đã chép!' : 'Link\nGiới thiệu'}
            </span>
          </button>

          <button
            onClick={onInviteMember}
            className="bg-[#00B050] hover:bg-[#009644] text-white rounded-2xl py-2.5 px-1 flex flex-col items-center justify-center transition-all active:scale-95 shadow-xs"
          >
            <UserPlus className="w-5 h-5" />
            <span className="text-[12px] font-bold mt-1 text-center leading-tight">
              Giới thiệu<br />Thành viên
            </span>
          </button>

          <button
            onClick={onLogout}
            className="bg-[#ED4956] hover:bg-[#D93C49] text-white rounded-2xl py-2.5 px-1 flex flex-col items-center justify-center transition-all active:scale-95 shadow-xs"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[12px] font-bold mt-1 text-center leading-tight">
              Đăng xuất
            </span>
          </button>
        </div>

        {/* Full-width "Xem Website" button */}
        <div className="mt-3">
          <button
            onClick={onNavigateHome}
            className="w-full bg-white hover:bg-blue-50 text-[#0066FF] font-black text-[14px] py-2.5 rounded-2xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>← Xem Website</span>
          </button>
        </div>
      </div>

      {/* 2. 4 METRIC CARDS (Lưới 2x2 chuẩn Mockup 1 Screen 1) */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Card 1: Đơn hàng */}
        <div
          onClick={() => onSelectTab('orders')}
          className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] cursor-pointer hover:shadow-md transition-all active:scale-95 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-[#0072F5] flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="text-right">
              <div className="text-[13px] font-bold text-gray-700">Đơn hàng</div>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className="text-[24px] font-black text-gray-900 leading-none">12</span>
                <ChevronRight className="w-4 h-4 text-gray-400 stroke-[2.5]" />
              </div>
            </div>
          </div>
          <div className="text-[12px] text-gray-400 font-medium mt-3">
            Đơn mới hôm nay
          </div>
        </div>

        {/* Card 2: Hoa hồng */}
        <div
          onClick={() => onSelectTab('commissions')}
          className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] cursor-pointer hover:shadow-md transition-all active:scale-95 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#D97706] flex items-center justify-center">
              <Coins className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="text-right">
              <div className="text-[13px] font-bold text-gray-700">Hoa hồng</div>
              <div className="flex items-center justify-end gap-0.5 mt-0.5">
                <span className="text-[17px] font-black text-[#0066FF] leading-none tracking-tight">31.920.000 đ</span>
                <ChevronRight className="w-4 h-4 text-gray-400 stroke-[2.5]" />
              </div>
            </div>
          </div>
          <div className="text-[12px] text-gray-400 font-medium mt-3">
            Tháng 10/2026
          </div>
        </div>

        {/* Card 3: Cấp bậc & điểm */}
        <div
          onClick={() => onSelectTab('rank')}
          className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] cursor-pointer hover:shadow-md transition-all active:scale-95 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#9333EA] flex items-center justify-center">
              <Trophy className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="text-right flex-1 pl-2">
              <div className="text-[13px] font-bold text-gray-700">Cấp bậc & điểm</div>
              <div className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                Tiến trình lên cấp Trưởng nhóm
              </div>
            </div>
          </div>
          <div className="mt-2.5">
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div className="bg-[#0072F5] h-full rounded-full w-[20%]" />
            </div>
            <div className="text-[11px] font-black text-gray-900 text-right mt-1">20%</div>
          </div>
        </div>

        {/* Card 4: Đội nhóm */}
        <div
          onClick={() => onSelectTab('rank')}
          className="bg-white rounded-2xl p-4 border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] cursor-pointer hover:shadow-md transition-all active:scale-95 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="text-right">
              <div className="text-[13px] font-bold text-gray-700">Đội nhóm</div>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span className="text-[22px] font-black text-gray-900 leading-none">5 / 5</span>
                <ChevronRight className="w-4 h-4 text-gray-400 stroke-[2.5]" />
              </div>
            </div>
          </div>
          <div className="text-[12px] text-gray-400 font-medium mt-3">
            Thành viên F1 hợp lệ
          </div>
        </div>
      </div>

      {/* 3. PROMO BANNER (Chuẩn Mockup 1 Screen 1) */}
      <div 
        onClick={onNavigateHome}
        className="relative rounded-2xl overflow-hidden shadow-xs border border-gray-100 cursor-pointer group"
      >
        <img 
          src="/images/banner-web.webp" 
          alt="WASY PRO HYDROGEN" 
          className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-sky-950/85 via-sky-900/50 to-transparent flex items-center p-5">
          <div className="text-white space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-300 bg-sky-900/70 px-2 py-0.5 rounded">
              WASY PRO HYDROGEN
            </span>
            <h3 className="text-[16px] font-black leading-tight">
              NƯỚC TỐT — THÂN AN — TRÍ SÁNG
            </h3>
            <button className="text-[12px] font-bold text-sky-200 flex items-center gap-1 hover:underline pt-0.5">
              <span>Xem chi tiết</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
