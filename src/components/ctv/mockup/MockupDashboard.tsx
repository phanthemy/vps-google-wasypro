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
  GitBranch,
  FileText,
  Headphones,
  ShieldCheck,
  AlertCircle,
  BookOpen,
  Layers,
  Package,
  Globe,
  Scale
} from 'lucide-react';
import { UserSession } from '../../../hooks/useUnifiedAuth';
import { AccountModal } from './AccountModal';
import { NetworkSystemModal } from './NetworkSystemModal';
import { TermsModal } from './TermsModal';
import { SupportModal } from './SupportModal';

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
  const [userSession, setUserSession] = useState(currentUser);
  const [stats, setStats] = useState({
    orderCount: 12,
    commissionTotal: 31920000,
    directCount: 5,
  });

  // Modals state (A, B, C, D, E)
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

    // 3. Fetch Direct count (thay cho F1 count)
    fetch('/api/ctv/network-summary', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data && typeof res.data.directCount === 'number') {
          setStats(prev => ({ ...prev, directCount: res.data.directCount }));
        }
      })
      .catch(() => {});
  }, []);

  const partnerCode = (userSession as any).businessId || `WK-${userSession.id || userSession.userId || '10002'}`;
  const rankText = (userSession.rank === 'MANAGER' ? '★ QUẢN LÝ' : userSession.rank === 'DIRECTOR' ? '★ GIÁM ĐỐC' : '★ ĐẠI SỨ');

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
          <div 
            className="rounded-full flex items-center justify-center shrink-0 border-2 border-white/60 bg-white/20 p-1 shadow-sm"
            style={{ width: '64px', height: '64px' }}
          >
            {(userSession as any).avatarUrl ? (
              <img 
                src={(userSession as any).avatarUrl} 
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#FFFFFF] flex items-center justify-center">
                <User className="w-8 h-8 text-[#0072F5] stroke-[2.2]" />
              </div>
            )}
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
              ID: {userSession.id || userSession.userId} (Đối Tác CTV)
            </div>

            <h2 className="text-[23px] font-bold text-[#FFFFFF] leading-[1.3] truncate mt-0.5">
              {userSession.fullName || 'Phan Thế Mỹ'}
            </h2>
          </div>
        </div>


        {/* ============================================================
            6 MỤC CHÍNH — THEO YÊU CẦU SẾP
            ============================================================ */}
        <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-white/25">
          {/* MỤC 1: NỘI DUNG 1 (Bổ sung sau) */}
          <button
            type="button"
            onClick={() => onSelectTab('home-profile')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 transition-all active:scale-[0.98] shadow-md border border-white/80 text-left cursor-pointer"
            style={{ minHeight: '66px' }}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0072F5] shrink-0 shadow-2xs">
              <BookOpen className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-extrabold text-slate-900 leading-tight truncate">Trang Chủ & Hồ Sơ</div>
              <div className="text-[10px] text-amber-600 font-semibold leading-tight truncate mt-0.5">Sắp ra mắt</div>
            </div>
          </button>

          {/* MỤC 2: NỘI DUNG 2 (Bổ sung sau) */}
          <button
            type="button"
            onClick={() => onSelectTab('team-network')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 transition-all active:scale-[0.98] shadow-md border border-white/80 text-left cursor-pointer"
            style={{ minHeight: '66px' }}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#7C3AED] shrink-0 shadow-2xs">
              <Layers className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-extrabold text-slate-900 leading-tight truncate">Đội Nhóm & Mạng Lưới</div>
              <div className="text-[10px] text-amber-600 font-semibold leading-tight truncate mt-0.5">Sắp ra mắt</div>
            </div>
          </button>

          {/* MỤC 3: HOA HỒNG */}
          <button
            type="button"
            onClick={() => onSelectTab('commissions')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 transition-all active:scale-[0.98] shadow-md border border-white/80 text-left cursor-pointer"
            style={{ minHeight: '66px' }}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-[#F59E0B] shrink-0 shadow-2xs">
              <Coins className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-extrabold text-slate-900 leading-tight truncate">Hoa Hồng</div>
              <div className="text-[10px] text-slate-500 font-semibold leading-tight truncate mt-0.5">Trực tiếp, Hệ thống, LS</div>
            </div>
          </button>

          {/* MỤC 4: ĐẶT HÀNG & GÓI ĐẦU TƯ */}
          <button
            type="button"
            onClick={() => onSelectTab('orders')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 transition-all active:scale-[0.98] shadow-md border border-white/80 text-left cursor-pointer"
            style={{ minHeight: '66px' }}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#00B050] shrink-0 shadow-2xs">
              <Package className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-extrabold text-slate-900 leading-tight truncate">Đặt Hàng & Gói Đầu Tư</div>
              <div className="text-[10px] text-slate-500 font-semibold leading-tight truncate mt-0.5">SP lẻ, Gói ĐL, Đầu tư</div>
            </div>
          </button>

          {/* MỤC 5: MẠNG LƯỚI & TRUYỀN THÔNG */}
          <button
            type="button"
            onClick={() => onSelectTab('network-media')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 transition-all active:scale-[0.98] shadow-md border border-white/80 text-left cursor-pointer"
            style={{ minHeight: '66px' }}
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#0284C7] shrink-0 shadow-2xs">
              <Globe className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-extrabold text-slate-900 leading-tight truncate">Mạng Lưới & Truyền Thông</div>
              <div className="text-[10px] text-slate-500 font-semibold leading-tight truncate mt-0.5">Đại lý, Sự kiện, Feedback</div>
            </div>
          </button>

          {/* MỤC 6: PHÁP LÝ & ĐIỀU KHOẢN */}
          <button
            type="button"
            onClick={() => onSelectTab('legal')}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 transition-all active:scale-[0.98] shadow-md border border-white/80 text-left cursor-pointer"
            style={{ minHeight: '66px' }}
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#DC2626] shrink-0 shadow-2xs">
              <Scale className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-extrabold text-slate-900 leading-tight truncate">Pháp Lý & Điều Khoản</div>
              <div className="text-[10px] text-slate-500 font-semibold leading-tight truncate mt-0.5">Giấy CN, Chính sách, PL</div>
            </div>
          </button>
        </div>

        {/* ROW đăng xuất nhỏ gọn */}
        <div className="flex gap-2 mt-2.5">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center justify-center gap-1.5 h-10 flex-1 rounded-xl bg-[#EF4444] hover:bg-red-600 border border-rose-300/40 text-white transition-all active:scale-95 text-xs font-bold shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5 text-white" />
            <span>Đăng xuất</span>
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
              fontSize: '15px',
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
          4 DASHBOARD CARDS (Đơn hàng, Hoa hồng, Cấp bậc, Đội ngũ đối tác)
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

        {/* Card 4: Đội ngũ đối tác (Chuẩn hóa không dùng F1) */}
        <div
          onClick={() => onSelectTab('team-network')}
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
              Đội ngũ đối tác
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1 mb-0.5">
            <span style={{ fontSize: '23px', fontWeight: 700, color: '#0F172A', lineHeight: 1 }}>
              {stats.directCount} / 5
            </span>
            <span style={{ fontSize: '19px', fontWeight: 600, color: '#94A3B8' }}>›</span>
          </div>

          <div className="flex items-center justify-between">
            <span style={{ fontSize: '13px', fontWeight: 400, color: '#94A3B8' }}>
              Đối tác Trực tiếp
            </span>
            <span style={{ fontSize: '17px', fontWeight: 600, color: '#94A3B8' }}>›</span>
          </div>
        </div>
      </div>

      {/* Card 5: Mạng lưới đối tác (Chuẩn hóa không dùng F1/F2) */}
      <div
        onClick={() => onSelectTab('team-network')}
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
              Mạng lưới đối tác kinh doanh
            </div>
            <div style={{ fontSize: '12px', fontWeight: 400, color: '#64748B', marginTop: '2px' }}>
              Xem danh sách đối tác Trực tiếp & Gián tiếp của bạn
            </div>
          </div>
        </div>
        <span style={{ fontSize: '19px', fontWeight: 600, color: '#0072F5' }}>›</span>
      </div>

      {/* PROMO BANNER */}
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

      {/* ============================================================
          ALL 5 MODALS (A, B, C, D, E)
          ============================================================ */}
      {/* MODAL A: TÀI KHOẢN & LINK GIỚI THIỆU */}
      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        currentUser={userSession}
        onUserUpdated={(updated) => setUserSession(prev => ({ ...prev, ...updated }))}
      />

      {/* MODAL B: HỆ THỐNG ĐỐI TÁC (TRỰC TIẾP & GIÁN TIẾP) */}
      <NetworkSystemModal
        isOpen={networkModalOpen}
        onClose={() => setNetworkModalOpen(false)}
        currentUser={userSession}
        onOpenNetworkTree={() => onSelectTab('network')}
      />

      {/* MODAL C: ĐIỀU KHOẢN */}
      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
      />

      {/* MODAL D: HỖ TRỢ */}
      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />

      {/* MODAL E: XÁC NHẬN ĐĂNG XUẤT */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900">Xác nhận đăng xuất</h4>
              <p className="text-xs text-slate-500 mt-1">Bạn có chắc chắn muốn đăng xuất khỏi cổng đối tác WasyPro?</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => { setShowLogoutConfirm(false); onLogout(); }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
