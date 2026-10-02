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
    <div className="space-y-4 pb-4" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
      {/* ============================================================
          SECTION 2: PROFILE CARD (Exact Design Tokens)
          ============================================================ */}
      <div 
        className="text-[#FFFFFF] shadow-sm"
        style={{
          borderRadius: '22px',
          padding: '20px',
          background: 'linear-gradient(135deg, #0072F5 0%, #087EF5 100%)',
        }}
      >
        <div className="flex items-center gap-4">
          {/* Avatar Circle: 64x64px white circle, blue user icon */}
          <div 
            className="rounded-full bg-[#FFFFFF] flex items-center justify-center shrink-0 shadow-sm"
            style={{ width: '64px', height: '64px' }}
          >
            <User className="w-9 h-9 text-[#0072F5] stroke-[2.2]" />
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span 
                className="text-[12px] font-bold px-2.5 py-0.5 rounded-[6px]"
                style={{ background: '#FFCC00', color: '#0F172A' }}
              >
                {rankText}
              </span>
              <span 
                className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-[6px]"
                style={{ background: '#0055CC', color: '#FFFFFF' }}
              >
                Mã đối tác: {partnerCode}
              </span>
            </div>

            <div className="text-[13px] font-medium text-white/90">
              ID: {currentUser.id || currentUser.userId} (Đối Tác CTV)
            </div>

            <h2 className="text-[22px] font-bold text-[#FFFFFF] leading-[1.3] truncate mt-0.5">
              {currentUser.fullName || 'Phan Thế Mỹ'}
            </h2>
          </div>
        </div>

        {/* SECTION 7: 3 Action Buttons (Exact height 74–76px, radius 16px, font 14px 600) */}
        <div className="grid grid-cols-3 gap-2.5 mt-4 pt-3.5 border-t border-white/20">
          {/* LINK GIỚI THIỆU: background #0052CC */}
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center justify-center text-center transition-all active:scale-95"
            style={{
              height: '75px',
              borderRadius: '16px',
              background: '#0052CC',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              padding: '6px 4px'
            }}
          >
            {copied ? <Check className="w-5 h-5 text-emerald-300" /> : <LinkIcon className="w-5 h-5" />}
            <span className="text-[13px] font-semibold mt-1 leading-tight">
              {copied ? 'Đã chép!' : <>Link<br />Giới thiệu</>}
            </span>
          </button>

          {/* GIỚI THIỆU THÀNH VIÊN: background #00B050 */}
          <button
            onClick={onInviteMember}
            className="flex flex-col items-center justify-center text-center transition-all active:scale-95"
            style={{
              height: '75px',
              borderRadius: '16px',
              background: '#00B050',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              padding: '6px 4px'
            }}
          >
            <UserPlus className="w-5 h-5" />
            <span className="text-[13px] font-semibold mt-1 leading-tight">
              Giới thiệu<br />Thành viên
            </span>
          </button>

          {/* ĐĂNG XUẤT: background #ED4956 */}
          <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center text-center transition-all active:scale-95"
            style={{
              height: '75px',
              borderRadius: '16px',
              background: '#ED4956',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 600,
              padding: '6px 4px'
            }}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[13px] font-semibold mt-1 leading-tight">
              Đăng xuất
            </span>
          </button>
        </div>

        {/* Full-width "Xem Website" button (height 48px, radius 14px, font 15px 600) */}
        <div className="mt-3">
          <button
            onClick={onNavigateHome}
            className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{
              height: '48px',
              borderRadius: '14px',
              background: '#FFFFFF',
              color: '#0072F5',
              fontSize: '15px',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>← Xem Website</span>
          </button>
        </div>
      </div>

      {/* ============================================================
          SECTION 5, 8, 9, 10: 4 DASHBOARD CARDS (Exact Tokens)
          ============================================================ */}
      <div className="grid grid-cols-2 gap-3" style={{ gap: '12px' }}>
        {/* Card 1: Đơn hàng (ĐƠN HÀNG: 28px, 700, #0F172A) */}
        <div
          onClick={() => onSelectTab('orders')}
          className="cursor-pointer hover:shadow-md transition-all active:scale-95 flex flex-col justify-between"
          style={{
            background: '#FFFFFF',
            border: '1px solid #EEF2F6',
            borderRadius: '18px',
            padding: '16px',
            minHeight: '124px',
            boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
          }}
        >
          <div className="flex items-start justify-between">
            {/* Icon container: #F0F7FF, icon #0072F5 */}
            <div 
              className="rounded-[12px] flex items-center justify-center shrink-0"
              style={{ width: '40px', height: '40px', background: '#F0F7FF', color: '#0072F5' }}
            >
              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="text-right">
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', lineHeight: 1.4 }}>
                Đơn hàng
              </div>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>
                  12
                </span>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] stroke-[2.5]" />
              </div>
            </div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 400, color: '#94A3B8', marginTop: '8px' }}>
            Đơn mới hôm nay
          </div>
        </div>

        {/* Card 2: Hoa hồng (HOA HỒNG: 22–24px, 700, #0072F5) */}
        <div
          onClick={() => onSelectTab('commissions')}
          className="cursor-pointer hover:shadow-md transition-all active:scale-95 flex flex-col justify-between"
          style={{
            background: '#FFFFFF',
            border: '1px solid #EEF2F6',
            borderRadius: '18px',
            padding: '16px',
            minHeight: '124px',
            boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
          }}
        >
          <div className="flex items-start justify-between">
            {/* Icon container: #FFF7E6, icon #F5A623 */}
            <div 
              className="rounded-[12px] flex items-center justify-center shrink-0"
              style={{ width: '40px', height: '40px', background: '#FFF7E6', color: '#F5A623' }}
            >
              <Coins className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="text-right">
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', lineHeight: 1.4 }}>
                Hoa hồng
              </div>
              <div className="flex items-center justify-end gap-0.5 mt-0.5">
                <span style={{ fontSize: '22px', fontWeight: 700, color: '#0072F5', lineHeight: 1 }}>
                  31.920.000 đ
                </span>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] stroke-[2.5]" />
              </div>
            </div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 400, color: '#94A3B8', marginTop: '8px' }}>
            Tháng 10/2026
          </div>
        </div>

        {/* Card 3: Cấp bậc & điểm (Progress Bar: 8px, track #E2E8F0, progress #0072F5) */}
        <div
          onClick={() => onSelectTab('rank')}
          className="cursor-pointer hover:shadow-md transition-all active:scale-95 flex flex-col justify-between"
          style={{
            background: '#FFFFFF',
            border: '1px solid #EEF2F6',
            borderRadius: '18px',
            padding: '16px',
            minHeight: '124px',
            boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
          }}
        >
          <div className="flex items-start justify-between">
            {/* Icon container: #FAF5FF, icon #7C3AED */}
            <div 
              className="rounded-[12px] flex items-center justify-center shrink-0"
              style={{ width: '40px', height: '40px', background: '#FAF5FF', color: '#7C3AED' }}
            >
              <Trophy className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="text-right flex-1 pl-2">
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', lineHeight: 1.4 }}>
                Cấp bậc & điểm
              </div>
              <div style={{ fontSize: '12px', fontWeight: 400, color: '#475569' }} className="truncate">
                Tiến trình lên cấp Trưởng nhóm
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div 
              className="w-full overflow-hidden" 
              style={{ background: '#E2E8F0', height: '8px', borderRadius: '999px' }}
            >
              <div 
                style={{ background: '#0072F5', height: '8px', borderRadius: '999px', width: '20%' }} 
              />
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', textAlign: 'right', marginTop: '2px' }}>
              20%
            </div>
          </div>
        </div>

        {/* Card 4: Đội nhóm (ĐỘI NHÓM: 24–26px, 700, #0F172A) */}
        <div
          onClick={() => onSelectTab('rank')}
          className="cursor-pointer hover:shadow-md transition-all active:scale-95 flex flex-col justify-between"
          style={{
            background: '#FFFFFF',
            border: '1px solid #EEF2F6',
            borderRadius: '18px',
            padding: '16px',
            minHeight: '124px',
            boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
          }}
        >
          <div className="flex items-start justify-between">
            {/* Icon container: #ECFDF5, icon #00B050 */}
            <div 
              className="rounded-[12px] flex items-center justify-center shrink-0"
              style={{ width: '40px', height: '40px', background: '#ECFDF5', color: '#00B050' }}
            >
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="text-right">
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', lineHeight: 1.4 }}>
                Đội nhóm
              </div>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>
                  5 / 5
                </span>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] stroke-[2.5]" />
              </div>
            </div>
          </div>
          <div style={{ fontSize: '12px', fontWeight: 400, color: '#94A3B8', marginTop: '8px' }}>
            Thành viên F1 hợp lệ
          </div>
        </div>
      </div>

      {/* PROMO BANNER (Chuẩn Mockup 1 Screen 1) */}
      <div 
        onClick={onNavigateHome}
        className="relative overflow-hidden cursor-pointer group shadow-sm"
        style={{
          borderRadius: '18px',
          border: '1px solid #EEF2F6',
        }}
      >
        <img 
          src="/images/banner-web.webp" 
          alt="WASY PRO HYDROGEN" 
          className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/50 to-transparent flex items-center p-5">
          <div className="text-white space-y-1">
            <span 
              className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[6px]"
              style={{ background: '#0052CC', color: '#FFFFFF' }}
            >
              WASY PRO HYDROGEN
            </span>
            <h3 className="text-[17px] font-bold text-white leading-tight">
              NƯỚC TỐT — THÂN AN — TRÍ SÁNG
            </h3>
            <button className="text-[13px] font-semibold text-sky-200 flex items-center gap-1 hover:underline pt-0.5">
              <span>Xem chi tiết</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
