import React from 'react';
import { 
  X, 
  Home, 
  Package, 
  Newspaper, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle, 
  ShoppingBag, 
  LayoutDashboard, 
  LogOut, 
  ChevronRight,
  User,
  ShieldAlert
} from 'lucide-react';
import { UserSession } from '../../hooks/useUnifiedAuth';

interface MobileDrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSession | null;
  onNavigate: (sectionId: string) => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenAdmin?: () => void;
}

export const MobileDrawerMenu: React.FC<MobileDrawerMenuProps> = ({
  isOpen,
  onClose,
  user,
  onNavigate,
  onOpenAuth,
  onLogout,
  onOpenAdmin
}) => {
  if (!isOpen) return null;

  const handleNav = (sectionId: string) => {
    onNavigate(sectionId);
    onClose();
  };

  const isAdmin = user && (user.role === 'admin' || user.id === 'ADMIN01' || user.userId === 'ADMIN01');

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content sliding from right */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xs bg-white shadow-2xl flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div>
            <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <img 
                  src="/images/logo-rbg.webp" 
                  alt="WASY PRO HYDROGEN" 
                  className="h-9 w-auto"
                />
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile greeting if logged in */}
            {user ? (
              <div className="p-4 bg-sky-50/60 border-b border-sky-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-gray-900 truncate">{user.fullName}</p>
                  <p className="text-[11px] text-gray-500 font-mono">{user.phone} • {user.id || user.userId}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <button
                  onClick={() => { onOpenAuth('login'); onClose(); }}
                  className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-bold text-center shadow-xs hover:bg-primary-dark transition-all"
                >
                  Đăng Nhập
                </button>
                <button
                  onClick={() => { onOpenAuth('register'); onClose(); }}
                  className="flex-1 py-2 rounded-xl bg-white border border-primary/30 text-primary text-xs font-bold text-center hover:bg-sky-50 transition-all"
                >
                  Đăng Ký
                </button>
              </div>
            )}

            {/* Navigation Groups */}
            <div className="py-2">
              {/* GROUP 1: WEBSITE */}
              <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                WEBSITE
              </div>
              <div className="space-y-0.5 px-2">
                <button
                  onClick={() => handleNav('home')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="flex items-center gap-3">
                    <Home className="w-4 h-4 text-sky-600" />
                    <span>Trang chủ</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => handleNav('products')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-sky-600" />
                    <span>Sản phẩm</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => handleNav('news')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="flex items-center gap-3">
                    <Newspaper className="w-4 h-4 text-sky-600" />
                    <span>Tin tức</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => handleNav('warranty')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>Chính sách bảo hành</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => handleNav('benefits')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>Lợi ích</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <button
                  onClick={() => handleNav('faq')}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-sky-600" />
                    <span>Hỏi đáp</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* GROUP 2: TÀI KHOẢN CỦA TÔI */}
              {user && (
                <>
                  <div className="mt-3 pt-3 border-t border-gray-100 px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    TÀI KHOẢN CỦA TÔI
                  </div>
                  <div className="space-y-0.5 px-2">
                    <button
                      onClick={() => handleNav('my-orders')}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <span className="flex items-center gap-3">
                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                        <span>Đơn hàng của tôi</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>

                    <button
                      onClick={() => handleNav('ctv')}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-primary hover:bg-primary/5 transition-colors text-left"
                    >
                      <span className="flex items-center gap-3">
                        <LayoutDashboard className="w-4 h-4 text-primary" />
                        <span>Quản lý tài khoản CTV</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-primary" />
                    </button>

                    {isAdmin && onOpenAdmin && (
                      <button
                        onClick={() => { onOpenAdmin(); onClose(); }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-amber-600 hover:bg-amber-50 transition-colors text-left"
                      >
                        <span className="flex items-center gap-3">
                          <ShieldAlert className="w-4 h-4 text-amber-600" />
                          <span>Quản Trị Website</span>
                        </span>
                        <ChevronRight className="w-4 h-4 text-amber-500" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer Action */}
          {user && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={() => { onLogout(); onClose(); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition-all border border-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
