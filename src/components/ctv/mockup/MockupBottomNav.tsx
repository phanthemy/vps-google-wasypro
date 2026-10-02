import React from 'react';
import { Home, ShoppingBag, Coins, Users, LayoutGrid } from 'lucide-react';

interface MockupBottomNavProps {
  activeTab: string;
  onChangeTab: (tabId: string) => void;
}

export const MockupBottomNav: React.FC<MockupBottomNavProps> = ({
  activeTab,
  onChangeTab
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Trang chủ', icon: Home },
    { id: 'orders', label: 'Đơn hàng', icon: ShoppingBag },
    { id: 'commissions', label: 'Hoa hồng', icon: Coins },
    { id: 'rank', label: 'Đội nhóm', icon: Users },
    { id: 'more', label: 'Thêm', icon: LayoutGrid },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.05)]">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          // Special highlight for active tab matching mockup
          if (isActive) {
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className="flex flex-col items-center justify-center w-full h-full text-[#0066FF] font-bold"
              >
                {tab.id === 'commissions' ? (
                  <div className="w-8 h-8 rounded-full bg-[#0066FF] text-white flex items-center justify-center shadow-xs">
                    <Icon className="w-4 h-4 stroke-[2.5]" />
                  </div>
                ) : tab.id === 'more' ? (
                  <div className="w-8 h-8 rounded-xl bg-[#0066FF] text-white flex items-center justify-center shadow-xs">
                    <Icon className="w-4 h-4 stroke-[2.5]" />
                  </div>
                ) : tab.id === 'dashboard' ? (
                  <div className="w-8 h-8 rounded-xl bg-[#0066FF] text-white flex items-center justify-center shadow-xs">
                    <Icon className="w-4 h-4 stroke-[2.5]" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-[#0066FF] text-white flex items-center justify-center shadow-xs">
                    <Icon className="w-4 h-4 stroke-[2.5]" />
                  </div>
                )}
                <span className="text-[11px] mt-0.5 leading-tight font-extrabold">{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-gray-800 transition-colors"
            >
              <Icon className="w-5 h-5 stroke-[1.8]" />
              <span className="text-[11px] mt-1 font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
