import React from 'react';
import { ChevronLeft, Search, ShoppingCart } from 'lucide-react';

interface MockupHeaderProps {
  title?: string;
  onBack?: () => void;
  onSearchClick?: () => void;
  onCartClick?: () => void;
  cartCount?: number;
  showBack?: boolean;
}

export const MockupHeader: React.FC<MockupHeaderProps> = ({
  title,
  onBack,
  onSearchClick,
  onCartClick,
  cartCount = 1,
  showBack = false,
}) => {
  // Subpage header: height 56px. Main header: height 64px.
  const heightClass = showBack ? 'h-[56px]' : 'h-[64px]';

  return (
    <header className="sticky top-0 z-30 bg-[#FFFFFF] border-b border-[#EEF2F6] w-full">
      <div className={`max-w-md mx-auto px-4 ${heightClass} flex items-center justify-between`}>
        {showBack ? (
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#0F172A] hover:bg-[#F8FAFC] active:scale-95 transition-all"
              style={{ minWidth: '40px', minHeight: '40px' }}
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
            <h1 className="text-[18px] font-bold text-[#0F172A] leading-[1.3] truncate max-w-[200px]">
              {title}
            </h1>
          </div>
        ) : (
          <div className="flex items-center">
            <img
              src="/images/logo-rbg.webp"
              alt="WASY PRO HYDROGEN"
              className="h-9 w-auto object-contain"
            />
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={onSearchClick}
            className="w-11 h-11 rounded-full flex items-center justify-center text-[#334155] hover:bg-[#F8FAFC] active:scale-95 transition-all"
            title="Tìm kiếm"
          >
            <Search className="w-6 h-6 stroke-[2]" />
          </button>

          <button
            onClick={onCartClick}
            className="relative w-11 h-11 rounded-full flex items-center justify-center text-[#334155] hover:bg-[#F8FAFC] active:scale-95 transition-all"
            title="Giỏ hàng"
          >
            <ShoppingCart className="w-6 h-6 stroke-[2]" />
            {cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-[#ED4956] text-[#FFFFFF] text-[11px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>


        </div>
      </div>
    </header>
  );
};
