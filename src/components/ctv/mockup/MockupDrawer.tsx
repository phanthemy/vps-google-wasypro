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
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Dark overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel from right */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-12">
        <div className="w-screen max-w-xs bg-white shadow-2xl flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Header: Logo + Close X Button */}
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
              <img
                src="/images/logo-rbg.webp"
                alt="WASY PRO HYDROGEN"
                className="h-8 w-auto"
              />
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>

            {/* SECTION 1: WEBSITE */}
            <div className="p-4 space-y-1">
              <div className="text-[12px] font-black text-gray-400 uppercase tracking-wider mb-2">
                WEBSITE
              </div>

              <button
                onClick={() => { onNavigateHome('hero'); onClose(); }}
                className="w-full flex items-center justify-between py-2.5 px-1 rounded-xl text-[14px] font-bold text-gray-800 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Home className="w-5 h-5 text-gray-700 stroke-[2.2]" />
                  <span>Trang chủ</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 stroke-[2.5]" />
              </button>

              <button
                onClick={() => { onNavigateHome('products'); onClose(); }}
                className="w-full flex items-center justify-between py-2.5 px-1 rounded-xl text-[14px] font-bold text-gray-800 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-700 stroke-[2.2]" />
                  <span>Sản phẩm</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 stroke-[2.5]" />
              </button>

              <button
                onClick={() => { onNavigateHome('news'); onClose(); }}
                className="w-full flex items-center justify-between py-2.5 px-1 rounded-xl text-[14px] font-bold text-gray-800 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Newspaper className="w-5 h-5 text-gray-700 stroke-[2.2]" />
                  <span>Tin tức</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 stroke-[2.5]" />
              </button>

              <button
                onClick={() => { onNavigateHome('warranty'); onClose(); }}
                className="w-full flex items-center justify-between py-2.5 px-1 rounded-xl text-[14px] font-bold text-gray-800 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-gray-700 stroke-[2.2]" />
                  <span>Chính sách bảo hành</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 stroke-[2.5]" />
              </button>

              <button
                onClick={() => { onNavigateHome('benefits'); onClose(); }}
                className="w-full flex items-center justify-between py-2.5 px-1 rounded-xl text-[14px] font-bold text-gray-800 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Gift className="w-5 h-5 text-gray-700 stroke-[2.2]" />
                  <span>Lợi ích</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 stroke-[2.5]" />
              </button>

              <button
                onClick={() => { onNavigateHome('faq'); onClose(); }}
                className="w-full flex items-center justify-between py-2.5 px-1 rounded-xl text-[14px] font-bold text-gray-800 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-gray-700 stroke-[2.2]" />
                  <span>Hỏi đáp</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 stroke-[2.5]" />
              </button>
            </div>

            {/* SECTION 2: TÀI KHOẢN CỦA TÔI */}
            <div className="p-4 pt-2 border-t border-gray-100 space-y-1">
              <div className="text-[12px] font-black text-gray-400 uppercase tracking-wider mb-2">
                TÀI KHOẢN CỦA TÔI
              </div>

              <button
                onClick={() => { onNavigateOrders(); onClose(); }}
                className="w-full flex items-center justify-between py-2.5 px-1 rounded-xl text-[14px] font-bold text-gray-800 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-gray-700 stroke-[2.2]" />
                  <span>Đơn hàng của tôi</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 stroke-[2.5]" />
              </button>

              <button
                onClick={() => { onNavigateCTV(); onClose(); }}
                className="w-full flex items-center justify-between py-2.5 px-1 rounded-xl text-[14px] font-bold text-gray-800 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <LayoutGrid className="w-5 h-5 text-gray-700 stroke-[2.2]" />
                  <span>Quản lý tài khoản CTV</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Bottom Button: Đăng xuất (Mockup 1 Screen 6) */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => { onLogout(); onClose(); }}
              className="w-full py-3 rounded-2xl bg-[#FFF0F0] text-[#ED4956] font-black text-[14px] hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
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
