import React, { useState, useEffect } from 'react';
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
  Check,
  Plus,
  GitBranch
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
  const [stats, setStats] = useState({
    orderCount: 12,
    commissionTotal: 31920000,
    f1Count: 5,
  });

  useEffect(() => {
    // 1. Fetch Orders Count
    fetch('/api/orders/my', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const count = (res.data.websiteOrders?.length || 0) + (res.data.ctvOrders?.length || 0);
          if (count > 0) setStats(prev => ({ ...prev, orderCount: count }));
        }
      })
      .catch(() => {});

    // 2. Fetch Commissions
    fetch('/api/ctv/commissions', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          const total = res.data.totalCommission || res.data.grossCommission;
          if (typeof total === 'number' && total > 0) setStats(prev => ({ ...prev, commissionTotal: total }));
        }
      })
      .catch(() => {});

    // 3. Fetch F1 Count
    fetch('/api/tree', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          const validF1 = res.data.filter((u: any) => u.depth === 1 || u.level === 1).length;
          if (validF1 > 0) setStats(prev => ({ ...prev, f1Count: validF1 }));
        }
      })
      .catch(() => {});
  }, []);

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
        <div className="flex items-center gap-3.5">
          {/* Avatar Circle: 64x64px white circle, blue user icon */}
          {/* Avatar with double ring matching Screen 1 */}
          <div 
            className="rounded-full flex items-center justify-center shrink-0 border-2 border-white/60 bg-white/20 p-1 shadow-sm"
            style={{ width: '64px', height: '64px' }}
          >
            {(currentUser as any).avatarUrl ? (
              <img 
                src={(currentUser as any).avatarUrl} 
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling && ((e.target as HTMLImageElement).nextElementSibling as HTMLElement).style.removeProperty('display'); }}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#FFFFFF] flex items-center justify-center">
                <User className="w-8 h-8 text-[#0072F5] stroke-[2.2]" />
              </div>
            )}
            <div className="w-full h-full rounded-full bg-[#FFFFFF] flex items-center justify-center" style={{ display: (currentUser as any).avatarUrl ? 'none' : undefined }}>
              <User className="w-8 h-8 text-[#0072F5] stroke-[2.2]" />
            </div>
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span 
                className="text-[13px] font-bold px-2.5 py-0.5 rounded-[6px]"
                style={{ background: '#FFCC00', color: '#0F172A' }}
              >
                {rankText}
              </span>
              <span 
                className="text-[12px] font-bold px-2.5 py-0.5 rounded-[6px]"
                style={{ background: '#F5A623', color: '#0F172A' }}
              >
                Mã đối tác: {partnerCode}
              </span>
            </div>

            <div className="text-[14px] font-medium text-white/90">
              ID: {currentUser.id || currentUser.userId} (Đối Tác CTV)
            </div>

            <h2 className="text-[23px] font-bold text-[#FFFFFF] leading-[1.3] truncate mt-0.5">
              {currentUser.fullName || 'Phan Thế Mỹ'}
            </h2>
          </div>
        </div>

        {/* SECTION 7: 3 Action Buttons (Exact height 74–76px, radius 16px, font 15px 600) */}
        <div className="grid grid-cols-3 gap-2.5 mt-4 pt-3.5 border-t border-white/20">
          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center justify-center text-center transition-all active:scale-95"
            style={{
              height: '75px',
              borderRadius: '16px',
              background: '#0052CC',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 600,
              padding: '6px 4px'
            }}
          >
            {copied ? <Check className="w-5 h-5 text-emerald-300" /> : <LinkIcon className="w-5 h-5" />}
            <span className="text-[14px] font-semibold mt-1 leading-tight">
              {copied ? 'Đã chép!' : <>Link<br />Giới thiệu</>}
            </span>
          </button>

          <button
            onClick={onInviteMember}
            className="flex flex-col items-center justify-center text-center transition-all active:scale-95"
            style={{
              height: '75px',
              borderRadius: '16px',
              background: '#00B050',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 600,
              padding: '6px 4px'
            }}
          >
            <UserPlus className="w-5 h-5" />
            <span className="text-[14px] font-semibold mt-1 leading-tight">
              Giới thiệu<br />Thành viên
            </span>
          </button>

          <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center text-center transition-all active:scale-95"
            style={{
              height: '75px',
              borderRadius: '16px',
              background: '#ED4956',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 600,
              padding: '6px 4px'
            }}
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[14px] font-semibold mt-1 leading-tight">
              Đăng xuất
            </span>
          </button>
        </div>

        {/* Full-width "Xem Website" button */}
        <div className="mt-3">
          <button
            onClick={onNavigateHome}
            className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{
              height: '46px',
              borderRadius: '14px',
              background: '#FFFFFF',
              color: '#0072F5',
              fontSize: '16px',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Xem Website</span>
          </button>
        </div>
      </div>

      {/* QUICK CTA: TẠO ĐƠN HÀNG */}
      <button
        onClick={() => onSelectTab('orders')}
        className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
        style={{
          height: '48px',
          borderRadius: '14px',
          background: '#0072F5',
          color: '#FFFFFF',
          fontSize: '15px',
          fontWeight: 600,
        }}
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Tạo Đơn Hàng Mới</span>
      </button>

      {/* ============================================================
          SECTION 5, 8, 9, 10: 4 DASHBOARD CARDS (Pixel-perfect & Fully Responsive)
          ============================================================ */}
      <div className="grid grid-cols-2" style={{ gap: '12px' }}>
        {/* Card 1: Đơn hàng */}
        <div
          onClick={() => onSelectTab('orders')}
          className="cursor-pointer hover:shadow-md transition-all active:scale-95 flex flex-col justify-between"
          style={{
            background: '#FFFFFF',
            border: '1px solid #EEF2F6',
            borderRadius: '18px',
            padding: '13px 12px',
            minHeight: '124px',
            boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
          }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="rounded-[10px] flex items-center justify-center shrink-0"
              style={{ width: '36px', height: '36px', background: '#F0F7FF', color: '#0072F5' }}
            >
              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>
              Đơn hàng
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1 mb-0.5">
            <span style={{ fontSize: '25px', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>
              {stats.orderCount}
            </span>
            <span style={{ fontSize: '19px', fontWeight: 600, color: '#94A3B8' }}>›</span>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 400, color: '#94A3B8' }} className="truncate">
            Đơn mới hôm nay
          </div>
        </div>

        {/* Card 2: Hoa hồng */}
        <div
          onClick={() => onSelectTab('commissions')}
          className="cursor-pointer hover:shadow-md transition-all active:scale-95 flex flex-col justify-between"
          style={{
            background: '#FFFFFF',
            border: '1px solid #EEF2F6',
            borderRadius: '18px',
            padding: '13px 12px',
            minHeight: '124px',
            boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
          }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="rounded-[10px] flex items-center justify-center shrink-0"
              style={{ width: '36px', height: '36px', background: '#FFF7E6', color: '#F5A623' }}
            >
              <Coins className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>
              Hoa hồng
            </span>
          </div>

          <div className="mt-1 mb-0.5">
            <span style={{ fontSize: '17px', fontWeight: 700, color: '#0072F5', lineHeight: 1.2 }} className="whitespace-nowrap">
              {stats.commissionTotal.toLocaleString('vi-VN')} <span className="underline text-[15px]">đ</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span style={{ fontSize: '13px', fontWeight: 400, color: '#94A3B8' }}>
              Tháng 10/2026
            </span>
            <span style={{ fontSize: '17px', fontWeight: 600, color: '#94A3B8' }}>›</span>
          </div>
        </div>

        {/* Card 3: Cấp bậc & điểm */}
        <div
          onClick={() => onSelectTab('rank')}
          className="cursor-pointer hover:shadow-md transition-all active:scale-95 flex flex-col justify-between"
          style={{
            background: '#FFFFFF',
            border: '1px solid #EEF2F6',
            borderRadius: '18px',
            padding: '13px 12px',
            minHeight: '124px',
            boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
          }}
        >
          <div className="flex items-start gap-2">
            <div 
              className="rounded-[10px] flex items-center justify-center shrink-0 mt-0.5"
              style={{ width: '36px', height: '36px', background: '#FAF5FF', color: '#7C3AED' }}
            >
              <Trophy className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                Cấp bậc & điểm
              </div>
              <div style={{ fontSize: '12px', fontWeight: 400, color: '#64748B', lineHeight: 1.2 }} className="mt-0.5">
                Tiến trình lên cấp<br />Trưởng nhóm
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
              <div 
                className="bg-[#0072F5] h-full rounded-full transition-all duration-500"
                style={{ width: '20%' }}
              />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
              20%
            </span>
          </div>
        </div>

        {/* Card 4: Đội nhóm */}
        <div
          onClick={() => onSelectTab('rank')}
          className="cursor-pointer hover:shadow-md transition-all active:scale-95 flex flex-col justify-between"
          style={{
            background: '#FFFFFF',
            border: '1px solid #EEF2F6',
            borderRadius: '18px',
            padding: '13px 12px',
            minHeight: '124px',
            boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
          }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="rounded-[10px] flex items-center justify-center shrink-0"
              style={{ width: '36px', height: '36px', background: '#ECFDF5', color: '#00B050' }}
            >
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', lineHeight: 1.2 }}>
              Đội nhóm
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1 mb-0.5">
            <span style={{ fontSize: '23px', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>
              {stats.f1Count} / 5
            </span>
            <span style={{ fontSize: '19px', fontWeight: 600, color: '#94A3B8' }}>›</span>
          </div>

          <div className="flex items-center justify-between">
            <span style={{ fontSize: '13px', fontWeight: 400, color: '#94A3B8' }}>
              Thành viên F1 hợp lệ
            </span>
            <span style={{ fontSize: '17px', fontWeight: 600, color: '#94A3B8' }}>›</span>
          </div>
        </div>
      </div>

      {/* Card 5: Sơ đồ cấp dưới (Full width) */}
      <div
        onClick={() => onSelectTab('network')}
        className="cursor-pointer hover:shadow-md transition-all active:scale-95 flex items-center justify-between mt-3"
        style={{
          background: 'linear-gradient(135deg, #F0F7FF 0%, #EEF6FF 100%)',
          border: '1px solid #D4E8FC',
          borderRadius: '18px',
          padding: '14px 16px',
          boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="rounded-[12px] flex items-center justify-center shrink-0"
            style={{ width: '42px', height: '42px', background: '#0072F5', color: '#FFFFFF' }}
          >
            <GitBranch className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
              Sơ đồ cấp dưới
            </div>
            <div style={{ fontSize: '12px', fontWeight: 400, color: '#64748B', marginTop: '2px' }}>
              Xem cây tuyến F1, F2 của bạn
            </div>
          </div>
        </div>
        <span style={{ fontSize: '19px', fontWeight: 600, color: '#0072F5' }}>›</span>
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
              className="text-[12px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[6px]"
              style={{ background: '#0052CC', color: '#FFFFFF' }}
            >
              WASY PRO HYDROGEN
            </span>
            <h3 className="text-[18px] font-bold text-white leading-tight">
              NƯỚC TỐT — THÂN AN — TRÍ SÁNG
            </h3>
            <button className="text-[14px] font-semibold text-sky-200 flex items-center gap-1 hover:underline pt-0.5">
              <span>Xem chi tiết</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
