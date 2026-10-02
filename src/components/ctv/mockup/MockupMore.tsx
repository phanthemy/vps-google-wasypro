import React from 'react';
import { Users, User, ShieldCheck, Gift, HelpCircle, ChevronRight } from 'lucide-react';

interface MockupMoreProps {
  onSelectSubtab: (tab: string) => void;
  onNavigateHome: () => void;
}

export const MockupMore: React.FC<MockupMoreProps> = ({
  onSelectSubtab,
  onNavigateHome
}) => {
  return (
    <div className="space-y-5 pb-6">
      {/* 1. KHU VỰC ĐỐI TÁC (Mockup 1 Screen 5) */}
      <div className="space-y-2">
        <h3 className="text-[12px] font-black text-gray-500 uppercase tracking-wider px-1">
          KHU VỰC ĐỐI TÁC
        </h3>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden divide-y divide-gray-100">
          <button
            onClick={() => onSelectSubtab('network')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#0070F3] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[15px] font-bold text-gray-900 group-hover:text-[#0070F3] transition-colors">
                Sơ đồ Tuyến dưới
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 stroke-[2.5] group-hover:text-[#0070F3] transition-colors" />
          </button>

          <button
            onClick={() => onSelectSubtab('account')}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#0070F3] text-white flex items-center justify-center shrink-0 shadow-xs">
                <User className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[15px] font-bold text-gray-900 group-hover:text-[#0070F3] transition-colors">
                Thông tin tài khoản
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 stroke-[2.5] group-hover:text-[#0070F3] transition-colors" />
          </button>
        </div>
      </div>

      {/* 2. HỖ TRỢ (Mockup 1 Screen 5) */}
      <div className="space-y-2">
        <h3 className="text-[12px] font-black text-gray-500 uppercase tracking-wider px-1">
          HỖ TRỢ
        </h3>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden divide-y divide-gray-100">
          <button
            onClick={onNavigateHome}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-[#0070F3] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[15px] font-bold text-gray-900 group-hover:text-[#0070F3] transition-colors">
                Chính sách bảo hành
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 stroke-[2.5] group-hover:text-[#0070F3] transition-colors" />
          </button>

          <button
            onClick={onNavigateHome}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-[#0070F3] flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[15px] font-bold text-gray-900 group-hover:text-[#0070F3] transition-colors">
                Lợi ích
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 stroke-[2.5] group-hover:text-[#0070F3] transition-colors" />
          </button>

          <button
            onClick={onNavigateHome}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-[#0070F3] flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[15px] font-bold text-gray-900 group-hover:text-[#0070F3] transition-colors">
                Hỏi đáp
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 stroke-[2.5] group-hover:text-[#0070F3] transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};
