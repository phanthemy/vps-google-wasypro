import React from 'react';
import { Coins, ArrowRight } from 'lucide-react';

interface MockupCommissionsProps {
  totalCommission?: number;
  periodName?: string;
  onViewDetails?: () => void;
}

export const MockupCommissions: React.FC<MockupCommissionsProps> = ({
  totalCommission = 31920000,
  periodName = '10/2026',
  onViewDetails
}) => {
  const history = [
    { period: '10/2026', amount: '+ 31.920.000 đ' },
    { period: '09/2026', amount: '+ 28.450.000 đ' },
    { period: '08/2026', amount: '+ 25.120.000 đ' },
    { period: '07/2026', amount: '+ 18.750.000 đ' },
    { period: '06/2026', amount: '+ 12.300.000 đ' },
  ];

  return (
    <div className="space-y-4 pb-6">
      {/* 1. TỔNG HOA HỒNG CARD (Mockup 1 Screen 3) */}
      <div className="bg-white rounded-3xl p-5 border border-amber-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-[#D97706] flex items-center justify-center">
              <Coins className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="text-[15px] font-bold text-gray-800">
              Tổng hoa hồng
            </span>
          </div>

          <span className="bg-[#EBF5FF] text-[#0070F3] font-bold text-[12px] px-3 py-1 rounded-full">
            {periodName}
          </span>
        </div>

        <div className="text-[36px] font-black text-[#0070F3] tracking-tight py-1">
          {totalCommission.toLocaleString('vi-VN')} đ
        </div>

        <button
          onClick={onViewDetails}
          className="w-full py-3 rounded-2xl border border-gray-200 text-[#0070F3] font-bold text-[14px] hover:bg-blue-50 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <span>Xem chi tiết hoa hồng</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* 2. LỊCH SỬ HOA HỒNG GẦN ĐÂY */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
        <h3 className="text-[15px] font-bold text-gray-800 pb-1">
          Lịch sử hoa hồng gần đây
        </h3>

        <div className="divide-y divide-gray-100">
          {history.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-3.5">
              <span className="text-[14px] font-bold text-gray-700 font-mono">
                {item.period}
              </span>
              <span className="text-[15px] font-extrabold text-[#00B050] font-mono">
                {item.amount}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onViewDetails}
          className="w-full py-3 rounded-2xl bg-sky-50 text-[#0070F3] font-extrabold text-[14px] hover:bg-sky-100 flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
