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
    <nav 
      className="fixed bottom-0 inset-x-0 z-40 bg-[#FFFFFF]"
      style={{ borderTop: '1px solid #E2E8F0', height: '66px' }}
    >
      <div className="max-w-md mx-auto grid grid-cols-5 h-full items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (isActive) {
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className="flex flex-col items-center justify-center w-full h-full text-[#0072F5]"
              >
                <div 
                  className="w-10 h-10 rounded-[12px] bg-[#0072F5] text-[#FFFFFF] flex items-center justify-center shadow-xs"
                  style={{ width: '40px', height: '40px' }}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-medium text-[#0072F5] leading-tight mt-0.5">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className="flex flex-col items-center justify-center w-full h-full text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <Icon className="w-6 h-6 stroke-[1.8] text-[#64748B]" />
              </div>
              <span className="text-[11px] font-medium text-[#64748B] leading-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
