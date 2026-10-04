import React, { useState, useEffect } from 'react';
import {
  LogOut,
  ShoppingCart,
  Coins,
  Trophy,
  Users,
  ChevronRight,
  Globe,
  Phone,
  Plus,
  Gift,
  Bell,
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
  const [userSession, setUserSession] = useState(currentUser);
  const [stats, setStats] = useState({
    orderCount: 12,
    commissionTotal: 31920000,
    directCount: 5,
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    fetch('/api/orders/my', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setStats(prev => ({ ...prev, orderCount: res.data.length }));
        }
      })
      .catch(() => {});

    fetch('/api/commissions/my-total', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data?.total !== undefined) {
          setStats(prev => ({ ...prev, commissionTotal: res.data.total }));
        }
      })
      .catch(() => {});

    fetch('/api/network/direct-count', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data?.count !== undefined) {
          setStats(prev => ({ ...prev, directCount: res.data.count }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setUserSession(currentUser);
  }, [currentUser]);

  const rankText = (userSession as any).rank || 'Quản Lý';
  const formatNumber = (n: number) => n.toLocaleString('vi-VN');

  return (
    <div className="space-y-4" style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* ============================================================
          HERO SECTION — Premium Profile Card
          ============================================================ */}
      <div
        className="relative overflow-hidden"
        style={{
          borderRadius: '24px',
          background: 'linear-gradient(180deg, #0A1628 0%, #0D3B8F 40%, #1E6DD9 70%, #4BA3F5 100%)',
          padding: '24px 20px 20px',
          minHeight: '280px',
        }}
      >
        {/* Background water/building image overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(/images/hero-poster.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Notification bell */}
        <div className="absolute top-4 right-4 z-10">
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
            <Bell className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Rank Crown Badge */}
          <div className="flex justify-center mb-2">
            <div className="relative">
              <span className="text-3xl">👑</span>
              <div
                className="mt-1 px-6 py-1.5 rounded-full text-center"
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  boxShadow: '0 4px 15px rgba(255,165,0,0.4)',
                }}
              >
                <span className="text-sm font-extrabold text-[#1a0a00] tracking-wider uppercase">
                  {rankText}
                </span>
              </div>
            </div>
          </div>

          {/* Chairman photo + User info */}
          <div className="flex items-start gap-4 mt-3">
            {/* Chairman photo */}
            <div className="shrink-0">
              <div
                className="w-20 h-24 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-lg"
                style={{ background: '#1a2a4a' }}
              >
                <img
                  src="/images/chairman.png"
                  alt="Chairman"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div
                className="mt-1.5 px-3 py-1 rounded-lg text-center mx-auto"
                style={{ background: '#FFD700', color: '#0F172A' }}
              >
                <span className="text-[11px] font-extrabold">
                  {userSession.id || userSession.userId || 'U1002'}
                </span>
              </div>
            </div>

            {/* User name + quote */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white leading-tight truncate">
                {userSession.fullName || 'Đối tác CTV'}
              </h2>
              <p
                className="text-[12px] text-white/70 italic leading-snug mt-2"
                style={{ maxWidth: '220px' }}
              >
                "Cuộc đời là một hành trình, hãy làm cuộc đời trở nên ý nghĩa hơn"
              </p>
              <p className="text-[11px] text-amber-300/80 font-semibold mt-1.5">
                (Founder & Chairman Nguyễn Đức Quang)
              </p>
              <p
                className="text-white/50 mt-1"
                style={{ fontFamily: 'cursive', fontSize: '14px' }}
              >
                Nguyễn Đức Quang
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          2 ACTION BUTTONS — Website + Hotline
          ============================================================ */}
      <div className="grid grid-cols-2 gap-3">
        {/* Truy cập Website */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#EEF2F6] shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
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

        {/* Hỗ trợ tổng đài */}
        <a
          href="tel:1900989878"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#EEF2F6] shadow-sm hover:shadow-md transition-all active:scale-[0.98] no-underline"
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
          6 GRADIENT CARDS — Stats & Quick Actions
          ============================================================ */}
      <div className="grid grid-cols-3 gap-3">
        {/* Card 1: Đơn hàng (Purple gradient) */}
        <button
          onClick={() => onSelectTab('orders')}
          className="relative overflow-hidden rounded-2xl p-3 text-left transition-all active:scale-[0.97]"
          style={{
            background: 'linear-gradient(145deg, #7C3AED 0%, #A855F7 50%, #C084FC 100%)',
            minHeight: '130px',
            boxShadow: '0 8px 20px rgba(124,58,237,0.3)',
          }}
        >
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div className="text-[12px] font-bold text-white/90">Đơn hàng</div>
          <div className="text-[28px] font-extrabold text-white leading-none mt-1">
            {stats.orderCount}
          </div>
          <div className="text-[10px] text-white/70 mt-1">Đơn mới hôm nay</div>
        </button>

        {/* Card 2: Hoa hồng (Gold gradient) */}
        <button
          onClick={() => onSelectTab('commissions')}
          className="relative overflow-hidden rounded-2xl p-3 text-left transition-all active:scale-[0.97]"
          style={{
            background: 'linear-gradient(145deg, #D97706 0%, #F59E0B 50%, #FBBF24 100%)',
            minHeight: '130px',
            boxShadow: '0 8px 20px rgba(217,119,6,0.3)',
          }}
        >
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div className="text-[12px] font-bold text-white/90">Hoa hồng</div>
          <div className="text-[18px] font-extrabold text-white leading-tight mt-1">
            {formatNumber(stats.commissionTotal)} <span className="text-[14px]">đ</span>
          </div>
          <div className="text-[10px] text-white/70 mt-1">Tháng 10/2026</div>
        </button>

        {/* Card 3: Cấp bậc & điểm (Blue gradient) */}
        <button
          onClick={() => onSelectTab('rank')}
          className="relative overflow-hidden rounded-2xl p-3 text-left transition-all active:scale-[0.97]"
          style={{
            background: 'linear-gradient(145deg, #1D4ED8 0%, #3B82F6 50%, #60A5FA 100%)',
            minHeight: '130px',
            boxShadow: '0 8px 20px rgba(29,78,216,0.3)',
          }}
        >
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className="text-[12px] font-bold text-white/90">Cấp bậc & điểm</div>
          <div className="text-[11px] text-white/80 mt-1 leading-snug">
            Tiến trình lên cấp<br />Trưởng nhóm
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
              <div className="bg-white h-full rounded-full" style={{ width: '20%' }} />
            </div>
            <span className="text-[11px] font-bold text-white">20%</span>
          </div>
        </button>

        {/* Card 4: Đội ngũ đối tác (Green gradient) */}
        <button
          onClick={() => onSelectTab('team-network')}
          className="relative overflow-hidden rounded-2xl p-3 text-left transition-all active:scale-[0.97]"
          style={{
            background: 'linear-gradient(145deg, #059669 0%, #10B981 50%, #34D399 100%)',
            minHeight: '130px',
            boxShadow: '0 8px 20px rgba(5,150,105,0.3)',
          }}
        >
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="text-[12px] font-bold text-white/90">Đội ngũ đối tác</div>
          <div className="text-[28px] font-extrabold text-white leading-none mt-1">
            {stats.directCount} / 5
          </div>
          <div className="text-[10px] text-white/70 mt-1">Đối tác Trực tiếp</div>
        </button>

        {/* Card 5: Tạo đơn hàng mới (Red/Pink gradient) */}
        <button
          onClick={() => onSelectTab('orders')}
          className="relative overflow-hidden rounded-2xl p-3 text-left transition-all active:scale-[0.97]"
          style={{
            background: 'linear-gradient(145deg, #DC2626 0%, #EF4444 50%, #F87171 100%)',
            minHeight: '130px',
            boxShadow: '0 8px 20px rgba(220,38,38,0.3)',
          }}
        >
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div className="text-[12px] font-bold text-white/90">Tạo đơn hàng mới</div>
          <div className="text-[11px] text-white/80 mt-1.5 leading-snug">
            Đặt hàng nhanh chóng
          </div>
        </button>

        {/* Card 6: Hoa hồng & Ưu đãi (Yellow/Orange gradient) */}
        <button
          onClick={() => onSelectTab('commissions')}
          className="relative overflow-hidden rounded-2xl p-3 text-left transition-all active:scale-[0.97]"
          style={{
            background: 'linear-gradient(145deg, #EA580C 0%, #F97316 50%, #FB923C 100%)',
            minHeight: '130px',
            boxShadow: '0 8px 20px rgba(234,88,12,0.3)',
          }}
        >
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div className="text-[12px] font-bold text-white/90">Hoa hồng & Ưu đãi</div>
          <div className="text-[11px] text-white/80 mt-1.5 leading-snug">
            Chương trình thưởng dành cho đối tác
          </div>
        </button>
      </div>

      {/* ============================================================
          LOGOUT CONFIRM MODAL
          ============================================================ */}
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
