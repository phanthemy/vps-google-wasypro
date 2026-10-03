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
    <div className="space-y-4 pb-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
      {/* ============================================================
          SECTION 16: COMMISSION CARD (Total: #0072F5, 32px, 700)
          ============================================================ */}
      <div 
        style={{
          background: '#FFFFFF',
          border: '1px solid #EEF2F6',
          borderRadius: '18px',
          padding: '20px',
          boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
        }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="rounded-[12px] flex items-center justify-center shrink-0"
              style={{ width: '40px', height: '40px', background: '#FFF7E6', color: '#F5A623' }}
            >
              <Coins className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
              Tổng hoa hồng
            </span>
          </div>

          <span 
            className="px-2.5 py-0.5 rounded-full font-bold"
            style={{ background: '#F0F7FF', color: '#0072F5', fontSize: '13px' }}
          >
            {periodName}
          </span>
        </div>

        {/* SECTION 16: Total commission 33px 700 #0072F5 */}
        <div style={{ fontSize: '33px', fontWeight: 700, color: '#0072F5', lineHeight: 1.2, paddingTop: '4px' }}>
          {totalCommission.toLocaleString('vi-VN')} đ
        </div>

        <button
          onClick={onViewDetails}
          className="w-full flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          style={{
            height: '46px',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            color: '#0072F5',
            fontSize: '15px',
            fontWeight: 600,
            background: '#FFFFFF'
          }}
        >
          <span>Xem chi tiết hoa hồng</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* 2. LỊCH SỬ HOA HỒNG GẦN ĐÂY */}
      <div 
        style={{
          background: '#FFFFFF',
          border: '1px solid #EEF2F6',
          borderRadius: '18px',
          padding: '20px',
          boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
        }}
        className="space-y-3"
      >
        <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#0F172A', paddingBottom: '4px' }}>
          Lịch sử hoa hồng gần đây
        </h3>

        <div className="divide-y divide-[#EEF2F6]">
          {history.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-3">
              <span style={{ fontSize: '16px', fontWeight: 500, color: '#475569' }}>
                {item.period}
              </span>
              {/* SECTION 16: History positive values: #00B050, 15px, 600 */}
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#00B050' }}>
                {item.amount}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onViewDetails}
          className="w-full flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
          style={{
            height: '46px',
            borderRadius: '14px',
            background: '#F0F7FF',
            color: '#0072F5',
            fontSize: '15px',
            fontWeight: 600,
            marginTop: '8px'
          }}
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
