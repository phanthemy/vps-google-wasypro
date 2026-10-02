import React from 'react';
import { ChevronLeft, Search, ShoppingCart, Menu } from 'lucide-react';

interface MockupHeaderProps {
  title?: string;
  onBack?: () => void;
  onSearchClick?: () => void;
  onCartClick?: () => void;
  onMenuClick?: () => void;
  cartCount?: number;
  showBack?: boolean;
}

export const MockupHeader: React.FC<MockupHeaderProps> = ({
  title,
  onBack,
  onSearchClick,
  onCartClick,
  onMenuClick,
  cartCount = 1,
  showBack = false,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-xs">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        {showBack ? (
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
            {title ? (
              <h1 className="text-[17px] font-black text-gray-900 tracking-tight">{title}</h1>
            ) : (
              <img
                src="/images/logo-rbg.webp"
                alt="WASY PRO HYDROGEN"
                className="h-8 w-auto"
              />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <img
              src="/images/logo-rbg.webp"
              alt="WASY PRO HYDROGEN"
              className="h-8 w-auto"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={onSearchClick}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <Search className="w-5 h-5 stroke-[2.2]" />
          </button>

          <button
            onClick={onCartClick}
            className="relative p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#ED4956] text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={onMenuClick}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <Menu className="w-6 h-6 stroke-[2.2]" />
          </button>
        </div>
      </div>
    </header>
  );
};
