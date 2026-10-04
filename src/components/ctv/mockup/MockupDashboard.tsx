import React, { useState, useEffect } from 'react';
import {
  LogOut,
  Globe,
  Phone,
  ChevronRight,
  Bell,
  BookOpen,
  Users,
  Coins,
  Package,
  Radio,
  Scale,
  User,
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

const CATEGORIES = [
  {
    id: 'account',
    label: 'Trang Chủ & Hồ Sơ',
    sub: 'Thông tin cá nhân, Ngân hàng',
    icon: BookOpen,
    gradient: 'linear-gradient(145deg, #5B21B6 0%, #7C3AED 60%, #8B5CF6 100%)',
    shadow: 'rgba(91,33,182,0.35)',
  },
  {
    id: 'network',
    label: 'Đội Nhóm & Mạng Lưới',
    sub: 'Sơ đồ tuyến, Đối tác F1',
    icon: Users,
    gradient: 'linear-gradient(145deg, #047857 0%, #059669 60%, #10B981 100%)',
    shadow: 'rgba(4,120,87,0.35)',
  },
  {
    id: 'commissions',
    label: 'Hoa Hồng',
    sub: 'Trực tiếp, Hệ thống, Lịch sử',
    icon: Coins,
    gradient: 'linear-gradient(145deg, #B45309 0%, #D97706 60%, #F59E0B 100%)',
    shadow: 'rgba(180,83,9,0.35)',
  },
  {
    id: 'orders',
    label: 'Đặt Hàng & Gói Đầu Tư',
    sub: 'SP lẻ, Gói ĐL, Đầu tư',
    icon: Package,
    gradient: 'linear-gradient(145deg, #B91C1C 0%, #DC2626 60%, #EF4444 100%)',
    shadow: 'rgba(185,28,28,0.35)',
  },
  {
    id: 'network-media',
    label: 'Mạng Lưới & Truyền Thông',
    sub: 'Đại lý, Sự kiện, Feedback',
    icon: Radio,
    gradient: 'linear-gradient(145deg, #075985 0%, #0369A1 60%, #0EA5E9 100%)',
    shadow: 'rgba(7,89,133,0.35)',
  },
  {
    id: 'legal',
    label: 'Pháp Lý & Điều Khoản',
    sub: 'Giấy CN, Chính sách, PL',
    icon: Scale,
    gradient: 'linear-gradient(145deg, #C2410C 0%, #EA580C 60%, #F97316 100%)',
    shadow: 'rgba(194,65,12,0.35)',
  },
];

export const MockupDashboard: React.FC<MockupDashboardProps> = ({
  currentUser,
  onSelectTab,
  onNavigateHome,
  onLogout,
  onInviteMember,
}) => {
  const [userSession, setUserSession] = useState(currentUser);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  // Modal states
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [networkModalOpen, setNetworkModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  useEffect(() => {
    setUserSession(currentUser);
  }, [currentUser]);

  // Rank mapping — hiển thị đúng cấp bậc CTV/NPP
  const RANK_MAP: Record<string, string> = {
    'AMBASSADOR': 'Đại Sứ',
    'SALES_MANAGER': 'Quản Lý',
    'SALES_DIRECTOR': 'Giám Đốc KD',
    'EXEC_OPERATIONS': 'GĐ Điều Hành',
    'EXEC_PROVINCE': 'GĐ Tỉnh',
    'EXEC_STRATEGIC': 'GĐ Chiến Lược',
    'MANAGER': 'Quản Lý',
    'DIRECTOR': 'Giám Đốc',
    'CTV': 'Đại Sứ',
    'NPP': 'Nhà Phân Phối',
  };
  const rawRank = ((userSession as any).rank || (userSession as any).nppRank || '').toString().toUpperCase().trim();
  const rankText = RANK_MAP[rawRank] || (rawRank ? rawRank : 'Đại Sứ');
  const userId = userSession.id || userSession.userId || 'U1002';
  const userName = userSession.fullName || 'Đối tác CTV';
  const initials = userName.split(' ').map((w: string) => w[0]).join('').slice(-2).toUpperCase();
  const avatarUrl = (userSession as any).avatarUrl;

  return (
    <div className="space-y-4" style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* ============================================================
          HERO SECTION — Profile Card (theo ý sếp)
          ============================================================ */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: '24px',
          background: 'linear-gradient(180deg, #063970 0%, #1565C0 35%, #1E88E5 65%, #42A5F5 100%)',
          padding: '28px 20px 22px',
          minHeight: '300px',
        }}
      >
        {/* Background water splash image */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'url(/images/ctv-hero-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Sparkle decorations */}
        <div className="absolute top-6 right-8 w-2 h-2 rounded-full bg-white/40 animate-pulse" />
        <div className="absolute top-14 right-16 w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-10 left-10 w-1 h-1 rounded-full bg-white/25 animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Notification bell */}
        <div className="absolute top-4 right-4 z-10">
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
            <Bell className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* WasyPro Logo — top left */}
        <div className="absolute top-4 left-4 z-10">
          <img
            src="/images/logo-rbg.webp"
            alt="WasyPro"
            className="h-8 object-contain"
            style={{ filter: 'brightness(1.1)' }}
            onError={(e) => { (e.target as HTMLImageElement).src = '/images/logo-moi-1.png'; }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Rank Crown Badge — centered, color per rank */}
          <div className="flex justify-center mb-4">
            <div className="text-center">
              <span className="text-3xl block">👑</span>
              {(() => {
                const RANK_COLORS: Record<string, { bg: string; shadow: string; text: string }> = {
                  'Đại Sứ': { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', shadow: 'rgba(255,165,0,0.4)', text: '#1a0a00' },
                  'Quản Lý': { bg: 'linear-gradient(135deg, #1565C0, #42A5F5)', shadow: 'rgba(21,101,192,0.4)', text: '#FFFFFF' },
                  'Giám Đốc KD': { bg: 'linear-gradient(135deg, #7B1FA2, #AB47BC)', shadow: 'rgba(123,31,162,0.4)', text: '#FFFFFF' },
                  'GĐ Điều Hành': { bg: 'linear-gradient(135deg, #C62828, #EF5350)', shadow: 'rgba(198,40,40,0.4)', text: '#FFFFFF' },
                  'GĐ Tỉnh': { bg: 'linear-gradient(135deg, #00695C, #26A69A)', shadow: 'rgba(0,105,92,0.4)', text: '#FFFFFF' },
                  'GĐ Chiến Lược': { bg: 'linear-gradient(135deg, #1A237E, #5C6BC0)', shadow: 'rgba(26,35,126,0.4)', text: '#FFFFFF' },
                  'Nhà Phân Phối': { bg: 'linear-gradient(135deg, #E65100, #FB8C00)', shadow: 'rgba(230,81,0,0.4)', text: '#FFFFFF' },
                };
                const colors = RANK_COLORS[rankText] || RANK_COLORS['Đại Sứ'];
                return (
                  <div
                    className="mt-1 px-8 py-2 rounded-full"
                    style={{
                      background: colors.bg,
                      boxShadow: `0 4px 15px ${colors.shadow}`,
                    }}
                  >
                    <span className="text-sm font-extrabold tracking-wider uppercase" style={{ color: colors.text }}>
                      {rankText}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* User photo + User info */}
          <div className="flex items-center gap-4 mt-2">
            {/* User Avatar (ảnh user, nằm giữa-dưới) */}
            <div className="shrink-0 flex flex-col items-center">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1E3A5F, #2563EB)' }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white/90">{initials}</span>
                )}
              </div>
              <div
                className="mt-2 px-3 py-1 rounded-lg text-center"
                style={{ background: '#FFD700', color: '#0F172A' }}
              >
                <span className="text-[11px] font-extrabold">{userId}</span>
              </div>
            </div>

            {/* User name + quote */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white leading-tight">
                {userName}
              </h2>
              <p
                className="text-[12px] text-white/70 italic leading-snug mt-3"
                style={{ maxWidth: '220px' }}
              >
                "Cuộc đời là một hành trình, hãy làm cuộc đời trở nên ý nghĩa hơn"
              </p>
              <p className="text-[11px] text-amber-300/80 font-semibold mt-1.5">
                (Founder &amp; Chairman Nguyễn Đức Quang)
              </p>
              <p className="text-white/40 mt-1" style={{ fontFamily: 'cursive', fontSize: '14px' }}>
                Nguyễn Đức Quang
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          2 ACTION BUTTONS — Website + Hotline (gọi trực tiếp)
          ============================================================ */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-[#0072F5]" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-[13px] font-bold text-[#0F172A] leading-tight">Truy cập Website</div>
            <div className="text-[10px] text-[#64748B] font-medium">waterkinggroup.com</div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8] shrink-0 ml-auto" />
        </button>

        <a
          href="tel:1900989878"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/80 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] no-underline"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-left min-w-0">
            <div className="text-[13px] font-bold text-[#0F172A] leading-tight">Hỗ trợ tổng đài</div>
            <div className="text-[10px] text-[#64748B] font-medium">1900.98.98.78</div>
          </div>
        </a>
      </div>

      {/* ============================================================
          6 MỤC CHÍNH — Gradient Cards (2×3 grid)
          Bấm vào → mở trang con với sub-tabs
          ============================================================ */}
      <div className="grid grid-cols-3 gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectTab(cat.id)}
              className="relative overflow-hidden rounded-2xl p-3 text-left transition-all active:scale-[0.97]"
              style={{
                background: cat.gradient,
                minHeight: '130px',
                boxShadow: `0 8px 20px ${cat.shadow}`,
              }}
            >
              {/* Arrow */}
              <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>

              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                <Icon className="w-5 h-5 text-white" />
              </div>

              {/* Label */}
              <div className="text-[12px] font-extrabold text-white leading-tight" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>{cat.label}</div>

              {/* Subtitle */}
              <div className="text-[10px] text-white/80 mt-1.5 leading-snug font-medium" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{cat.sub}</div>
            </button>
          );
        })}
      </div>

      {/* ============================================================
          VIDEO SECTION — embed từ trang chủ
          ============================================================ */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid rgba(255,255,255,0.6)',
          boxShadow: '0 6px 20px rgba(15,23,42,0.08)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="p-3 pb-2">
          <h3 className="text-[14px] font-bold text-[#0F172A]">🎬 Video giới thiệu</h3>
        </div>
        <div className="aspect-video w-full">
          <iframe
            src="https://www.youtube.com/embed/videoseries?list=PLjVwR9eCJMkSwUUdPVSjY-6h1yCgJNe5w"
            title="WasyPro Videos"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>

      {/* ============================================================
          BANNER QUẢNG CÁO
          ============================================================ */}
      <div
        onClick={onNavigateHome}
        className="relative overflow-hidden cursor-pointer group"
        style={{
          borderRadius: '18px',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 8px 25px rgba(15,23,42,0.12)',
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
            <div className="text-[13px] font-semibold text-sky-200 flex items-center gap-1 pt-0.5">
              <span>Xem chi tiết</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          ĐĂNG XUẤT — nhỏ gọn cuối trang
          ============================================================ */}
      <button
        onClick={() => setShowLogoutConfirm(true)}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold hover:bg-rose-100 transition-all active:scale-[0.98]"
      >
        <LogOut className="w-4 h-4" />
        Đăng xuất
      </button>

      {/* MODAL: XÁC NHẬN ĐĂNG XUẤT */}
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

      {/* MODAL A: TÀI KHOẢN & LINK GIỚI THIỆU */}
      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        currentUser={userSession}
        onUserUpdated={(updated: any) => setUserSession((prev: any) => ({ ...prev, ...updated }))}
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
    </div>
  );
};
