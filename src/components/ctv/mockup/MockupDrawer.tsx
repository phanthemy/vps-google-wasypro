import React from 'react';
import { 
  X, 
  Home, 
  Package, 
  Newspaper, 
  ShieldCheck, 
  Gift, 
  HelpCircle, 
  ShoppingBag, 
  LayoutGrid, 
  LogOut, 
  ChevronRight 
} from 'lucide-react';

interface MockupDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateHome: (section?: string) => void;
  onNavigateCTV: () => void;
  onNavigateOrders: () => void;
  onLogout: () => void;
}

export const MockupDrawer: React.FC<MockupDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateHome,
  onNavigateCTV,
  onNavigateOrders,
  onLogout
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden animate-fadeIn" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
      {/* Dark overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel: width ~320px, max-width 85vw */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-8">
        <div 
          className="bg-[#FFFFFF] shadow-2xl flex flex-col justify-between overflow-y-auto"
          style={{ width: '320px', maxWidth: '85vw' }}
        >
          <div>
            {/* Header: Logo + Close X Button */}
            <div className="p-4 flex items-center justify-between border-b border-[#EEF2F6]">
              <img
                src="/images/logo-rbg.webp"
                alt="WASY PRO HYDROGEN"
                className="h-8 w-auto object-contain"
              />
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>

            {/* ============================================================
                SECTION 19: DRAWER — SECTION WEBSITE
                ============================================================ */}
            <div className="p-4 space-y-1">
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>
                WEBSITE
              </div>

              {/* Menu items: height 52px, font-size 16px, font-weight 600, color #334155 */}
              <button
                onClick={() => { onNavigateHome('hero'); onClose(); }}
                className="w-full flex items-center justify-between px-2 hover:bg-[#F8FAFC] rounded-xl transition-colors text-left"
                style={{ height: '52px' }}
              >
                <div className="flex items-center gap-3">
                  <Home className="w-5 h-5 text-[#334155] stroke-[2]" />
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#334155' }}>Trang chủ</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] stroke-[2.5]" />
              </button>

              <button
                onClick={() => { onNavigateHome('products'); onClose(); }}
                className="w-full flex items-center justify-between px-2 hover:bg-[#F8FAFC] rounded-xl transition-colors text-left"
                style={{ height: '52px' }}
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-[#334155] stroke-[2]" />
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#334155' }}>Sản phẩm</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] stroke-[2.5]" />
              </button>

              <button
                onClick={() => { onNavigateHome('news'); onClose(); }}
                className="w-full flex items-center justify-between px-2 hover:bg-[#F8FAFC] rounded-xl transition-colors text-left"
                style={{ height: '52px' }}
              >
                <div className="flex items-center gap-3">
                  <Newspaper className="w-5 h-5 text-[#334155] stroke-[2]" />
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#334155' }}>Tin tức</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] stroke-[2.5]" />
              </button>

              <button
                onClick={() => { onNavigateHome('warranty'); onClose(); }}
                className="w-full flex items-center justify-between px-2 hover:bg-[#F8FAFC] rounded-xl transition-colors text-left"
                style={{ height: '52px' }}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#334155] stroke-[2]" />
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#334155' }}>Chính sách bảo hành</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] stroke-[2.5]" />
              </button>

              <button
                onClick={() => { onNavigateHome('benefits'); onClose(); }}
                className="w-full flex items-center justify-between px-2 hover:bg-[#F8FAFC] rounded-xl transition-colors text-left"
                style={{ height: '52px' }}
              >
                <div className="flex items-center gap-3">
                  <Gift className="w-5 h-5 text-[#334155] stroke-[2]" />
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#334155' }}>Lợi ích</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] stroke-[2.5]" />
              </button>

              <button
                onClick={() => { onNavigateHome('faq'); onClose(); }}
                className="w-full flex items-center justify-between px-2 hover:bg-[#F8FAFC] rounded-xl transition-colors text-left"
                style={{ height: '52px' }}
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-[#334155] stroke-[2]" />
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#334155' }}>Hỏi đáp</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] stroke-[2.5]" />
              </button>
            </div>

            {/* ============================================================
                SECTION 19: DRAWER — TÀI KHOẢN CỦA TÔI
                ============================================================ */}
            <div className="p-4 pt-2 border-t border-[#EEF2F6] space-y-1">
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>
                TÀI KHOẢN CỦA TÔI
              </div>

              <button
                onClick={() => { onNavigateOrders(); onClose(); }}
                className="w-full flex items-center justify-between px-2 hover:bg-[#F8FAFC] rounded-xl transition-colors text-left"
                style={{ height: '52px' }}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-[#334155] stroke-[2]" />
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#334155' }}>Đơn hàng của tôi</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] stroke-[2.5]" />
              </button>

              <button
                onClick={() => { onNavigateCTV(); onClose(); }}
                className="w-full flex items-center justify-between px-2 hover:bg-[#F8FAFC] rounded-xl transition-colors text-left"
                style={{ height: '52px' }}
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid className="w-5 h-5 text-[#0072F5] stroke-[2]" />
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#0072F5' }}>Quản lý tài khoản CTV</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#0072F5] stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* SECTION 19: Logout background #FFF0F2, color #ED4956 */}
          <div className="p-4 border-t border-[#EEF2F6]">
            <button
              onClick={() => { onLogout(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                height: '48px',
                borderRadius: '14px',
                background: '#FFF0F2',
                color: '#ED4956',
                fontSize: '16px',
                fontWeight: 600
              }}
            >
              <LogOut className="w-5 h-5 stroke-[2.2]" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
