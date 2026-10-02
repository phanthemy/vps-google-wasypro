import React from 'react';
import { Home, ShoppingBag, Coins, Users, LayoutGrid } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onChangeTab: (tabId: string) => void;
  orderCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onChangeTab,
  orderCount = 0
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Trang chủ', icon: Home },
    { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag, badge: orderCount > 0 ? orderCount : undefined },
    { id: 'commissions', label: 'Hoa hồng', icon: Coins },
    { id: 'network', label: 'Đội nhóm', icon: Users },
    { id: 'more', label: 'Thêm', icon: LayoutGrid },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:hidden">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (tab.id === 'network' && activeTab === 'rank');
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full relative transition-all ${
                isActive 
                  ? 'text-primary font-bold scale-105' 
                  : 'text-gray-500 hover:text-gray-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 px-1 min-w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 leading-tight tracking-tight">
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-6 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
