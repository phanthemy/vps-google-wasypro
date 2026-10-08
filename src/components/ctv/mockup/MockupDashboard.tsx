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
  ShoppingCart,
  Handshake,
  ShieldCheck,
  GraduationCap,
  Droplet,
  Crown
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

const NEW_CATEGORIES = [
  {
    id: 'account',
    label: 'TÀI KHOẢN CÁ NHÂN',
    icon: User,
    gradient: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
    shadow: 'rgba(59, 130, 246, 0.4)'
  },
  {
    id: 'price-list',
    label: 'SẢN PHẨM',
    icon: Package,
    gradient: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 100%)',
    shadow: 'rgba(6, 182, 212, 0.4)'
  },
  {
    id: 'orders',
    label: 'ĐẶT HÀNG',
    icon: ShoppingCart,
    gradient: 'linear-gradient(135deg, #B45309 0%, #F59E0B 100%)',
    shadow: 'rgba(245, 158, 11, 0.4)'
  },
  {
    id: 'network',
    label: 'DOANH NGHIỆP CỦA BẠN',
    icon: Handshake,
    gradient: 'linear-gradient(135deg, #047857 0%, #10B981 100%)',
    shadow: 'rgba(16, 185, 129, 0.4)'
  },
  {
    id: 'commissions',
    label: 'THU NHẬP',
    icon: Coins,
    gradient: 'linear-gradient(135deg, #D97706 0%, #FBBF24 100%)',
    shadow: 'rgba(251, 191, 36, 0.4)'
  },
  {
    id: 'company-policy',
    label: 'CHÍNH SÁCH',
    icon: ShieldCheck,
    gradient: 'linear-gradient(135deg, #6D28D9 0%, #A855F7 100%)',
    shadow: 'rgba(168, 85, 247, 0.4)'
  },
  {
    id: 'events',
    label: 'SỰ KIỆN ĐÀO TẠO',
    icon: GraduationCap,
    gradient: 'linear-gradient(135deg, #BE185D 0%, #EC4899 100%)',
    shadow: 'rgba(236, 72, 153, 0.4)'
  },
  {
    id: 'feedback',
    label: 'KẾT QUẢ SỬ DỤNG',
    icon: Droplet,
    gradient: 'linear-gradient(135deg, #0369A1 0%, #38BDF8 100%)',
    shadow: 'rgba(56, 189, 248, 0.4)'
  },
  {
    id: 'legal-docs',
    label: 'PHÁP LÝ',
    icon: Scale,
    gradient: 'linear-gradient(135deg, #0F766E 0%, #2DD4BF 100%)',
    shadow: 'rgba(45, 212, 191, 0.4)'
  }
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
    'MANAGER': 'Trưởng Nhóm',
    'SALES_MANAGER': 'Trưởng Nhóm',
    'DIRECTOR': 'Quản Lý',
    'SALES_DIRECTOR': 'Quản Lý',
    'EXEC_OPERATIONS': 'GĐ Điều Hành',
    'EXEC_PROVINCE': 'GĐ Tỉnh',
    'EXEC_STRATEGIC': 'GĐ Chiến Lược',
    'CTV': 'Đại Sứ',
    'NPP': 'Nhà Phân Phối',
  };
  const rawRank = ((userSession as any).rank || (userSession as any).nppRank || '').toString().toUpperCase().trim();
  const rankText = RANK_MAP[rawRank] || (rawRank ? rawRank : 'Đại Sứ');
  const userId = userSession.id || (userSession as any).userId || 'U1002';
  const userName = userSession.fullName || 'Đối tác CTV';
  const initials = userName.split(' ').map((w: string) => w[0]).join('').slice(-2).toUpperCase();
  const avatarUrl = (userSession as any).avatarUrl;

  return (
    <div className="bg-[#eaf4fc] min-h-screen pb-28" style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
      
      {/* 1. HERO BANNER */}
      <div className="relative w-full aspect-[473/275] bg-sky-100 rounded-b-[2.5rem] shadow-sm overflow-hidden">
        <img 
          src="/images/ctv-banner-top-hd.webp" 
          alt="Banner" 
          className="w-full h-full object-cover"
        />
        {/* Transparent Bell button overlay */}
        <button 
          className="absolute top-[8%] right-[5%] w-[12%] aspect-square rounded-full opacity-0" 
          onClick={() => {}}
        />
      </div>

      {/* 2. PROFILE CARD */}
      <div 
        className="relative mx-4 -mt-10 bg-white rounded-[24px] p-4 shadow-xl border border-white flex items-center gap-3 cursor-pointer"
        onClick={() => setAccountModalOpen(true)}
        style={{ zIndex: 10, boxShadow: '0 10px 30px rgba(0,100,200,0.1)' }}
      >
        <div className="relative shrink-0">
          <div className="w-[72px] h-[72px] rounded-full border-[3px] border-[#FBBF24] p-0.5 shadow-sm overflow-hidden bg-slate-50 flex items-center justify-center">
            {/* Avatar */}
            {(userSession as any)?.avatarUrl ? (
               <img src={(userSession as any).avatarUrl} className="w-full h-full object-cover rounded-full" />
            ) : (
               <User className="w-8 h-8 text-slate-300" />
            )}
          </div>
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-300 text-yellow-900 text-[11px] font-bold px-3 py-0.5 rounded-full border border-yellow-200 whitespace-nowrap shadow-sm">
            {userSession?.phone ? `U${userSession.phone.slice(-4)}` : 'U1002'}
          </div>
        </div>
        
        <div className="flex-1 min-w-0 pt-1 ml-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200 shadow-sm">
              <Crown className="w-3 h-3 text-amber-500" />
              {userSession?.rank?.toUpperCase() === 'AMBASSADOR' ? 'ĐẠI SỨ' :
               userSession?.rank?.toUpperCase() === 'DIRECTOR' || userSession?.rank?.toUpperCase() === 'SALES_DIRECTOR' ? 'QUẢN LÝ' :
               userSession?.rank?.toUpperCase() === 'MANAGER' || userSession?.rank?.toUpperCase() === 'SALES_MANAGER' ? 'TRƯỞNG NHÓM' : 'ĐỐI TÁC'}
            </div>
          </div>
          <div className="font-extrabold text-[16px] text-sky-900 truncate tracking-tight">
            {userSession?.fullName || 'Khách hàng'}
          </div>
          <div className="text-[11px] text-slate-500 italic leading-snug mt-1 line-clamp-2">
            "Cuộc đời là một hành trình, hãy làm cuộc đời trở nên ý nghĩa hơn"
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-medium">
            (Nguyễn Đức Quang)
          </div>
        </div>
        
        <div className="shrink-0 w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center border border-sky-100 shadow-sm self-center text-sky-500">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* 3. QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-6">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2 p-3 rounded-[16px] bg-white border border-sky-100 shadow-md shadow-sky-900/5 active:scale-95 transition-transform"
        >
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-left min-w-0 flex-1">
            <div className="text-[12px] font-bold text-sky-900 leading-tight">Website</div>
            <div className="text-[9px] text-slate-500 truncate">waterkinggroup.com</div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        </button>

        <a
          href="tel:1900989878"
          className="flex items-center gap-2 p-3 rounded-[16px] bg-white border border-sky-100 shadow-md shadow-sky-900/5 active:scale-95 transition-transform no-underline"
        >
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-left min-w-0 flex-1">
            <div className="text-[12px] font-bold text-sky-900 leading-tight">Hỗ trợ tổng đài</div>
            <div className="text-[9px] text-slate-500 truncate">1900.98.98.78</div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        </a>
      </div>

      {/* 4. 9 CARDS GRID (Using Sprite Map) */}
      <div className="px-4 mt-5 relative">
        <img 
          src="/images/ctv-grid-full-hd.webp" 
          alt="9 Cards" 
          className="w-full h-auto rounded-[20px] shadow-lg border border-white/50"
        />
        {/* Image Map Grid Overlay */}
        <div className="absolute inset-0 px-4 grid grid-cols-3 grid-rows-3 gap-0">
          <button onClick={() => setAccountModalOpen(true)} className="opacity-0 w-full h-full" aria-label="Tài khoản cá nhân" />
          <button onClick={() => onSelectTab('price-list')} className="opacity-0 w-full h-full" aria-label="Sản phẩm" />
          <button onClick={() => onSelectTab('orders')} className="opacity-0 w-full h-full" aria-label="Đặt hàng" />
          
          <button onClick={() => setNetworkModalOpen(true)} className="opacity-0 w-full h-full" aria-label="Doanh nghiệp của bạn" />
          <button onClick={() => onSelectTab('commissions')} className="opacity-0 w-full h-full" aria-label="Thu nhập" />
          <button onClick={() => onSelectTab('company-policy')} className="opacity-0 w-full h-full" aria-label="Chính sách" />
          
          <button onClick={() => onSelectTab('events')} className="opacity-0 w-full h-full" aria-label="Sự kiện đào tạo" />
          <button onClick={() => onSelectTab('feedback')} className="opacity-0 w-full h-full" aria-label="Kết quả sử dụng" />
          <button onClick={() => onSelectTab('legal-docs')} className="opacity-0 w-full h-full" aria-label="Pháp lý" />
        </div>
      </div>

      {/* 5. BOTTOM BANNER */}
      <div className="px-4 mt-4 mb-3">
        <button 
          className="w-full relative shadow-md rounded-2xl overflow-hidden active:scale-[0.98] transition-transform border border-white/60 block bg-white"
          onClick={() => onSelectTab('price-list')}
          aria-label="Xem sản phẩm Water King"
        >
          <img 
            src="/images/ctv-banner-bottom.jpg" 
            alt="Water King WASY PRO" 
            className="w-full h-auto object-cover block"
          />
        </button>
      </div>

      {/* 6. CAM KẾT CHẤT LƯỢNG & ĐẶC QUYỀN ĐỐI TÁC */}
      <div className="px-4 mb-4">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-sky-100/80 shadow-sm grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-slate-800 leading-tight">Bảo Hành 1 Năm</span>
            <span className="text-[8px] text-slate-400 mt-0.5">Tận nhà chu đáo</span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-100 px-1">
            <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-1 shadow-xs">
              <Droplet className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-slate-800 leading-tight">Hydrogen Chuẩn</span>
            <span className="text-[8px] text-slate-400 mt-0.5">Giàu ion kiềm sạch</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1 shadow-xs">
              <Package className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-slate-800 leading-tight">Lắp Đặt Tận Nơi</span>
            <span className="text-[8px] text-slate-400 mt-0.5">Miễn phí toàn quốc</span>
          </div>
        </div>
      </div>
      
      {/* ĐĂNG XUẤT */}
      <div className="px-4 mt-2">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-slate-200/50 text-slate-500 text-xs font-bold hover:bg-slate-200 hover:text-slate-700 transition-all active:scale-[0.98]"
        >
          <LogOut className="w-3.5 h-3.5" />
          Đăng xuất
        </button>
      </div>

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
