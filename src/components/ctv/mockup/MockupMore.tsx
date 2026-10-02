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
    <div className="space-y-5 pb-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
      {/* ============================================================
          SECTION 18: MORE MENU — KHU VỰC ĐỐI TÁC
          ============================================================ */}
      <div className="space-y-2">
        <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', paddingLeft: '4px' }}>
          KHU VỰC ĐỐI TÁC
        </h3>

        <div 
          style={{
            background: '#FFFFFF',
            border: '1px solid #EEF2F6',
            borderRadius: '18px',
            boxShadow: '0 4px 14px rgba(15,23,42,0.05)',
            overflow: 'hidden'
          }}
          className="divide-y divide-[#EEF2F6]"
        >
          {/* Menu item: height 56px, font-size 15px 600 #0F172A, icon container 40x40 #F0F7FF/#0072F5, arrow #94A3B8 */}
          <button
            onClick={() => onSelectSubtab('network')}
            className="w-full flex items-center justify-between px-4 hover:bg-[#F8FAFC] transition-colors text-left"
            style={{ height: '56px' }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="rounded-[12px] flex items-center justify-center shrink-0"
                style={{ width: '40px', height: '40px', background: '#F0F7FF', color: '#0072F5' }}
              >
                <Users className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                Sơ đồ Tuyến dưới
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
          </button>

          <button
            onClick={() => onSelectSubtab('account')}
            className="w-full flex items-center justify-between px-4 hover:bg-[#F8FAFC] transition-colors text-left"
            style={{ height: '56px' }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="rounded-[12px] flex items-center justify-center shrink-0"
                style={{ width: '40px', height: '40px', background: '#F0F7FF', color: '#0072F5' }}
              >
                <User className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                Thông tin tài khoản
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ============================================================
          SECTION 18: MORE MENU — HỖ TRỢ
          ============================================================ */}
      <div className="space-y-2">
        <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', paddingLeft: '4px' }}>
          HỖ TRỢ
        </h3>

        <div 
          style={{
            background: '#FFFFFF',
            border: '1px solid #EEF2F6',
            borderRadius: '18px',
            boxShadow: '0 4px 14px rgba(15,23,42,0.05)',
            overflow: 'hidden'
          }}
          className="divide-y divide-[#EEF2F6]"
        >
          <button
            onClick={onNavigateHome}
            className="w-full flex items-center justify-between px-4 hover:bg-[#F8FAFC] transition-colors text-left"
            style={{ height: '56px' }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="rounded-[12px] flex items-center justify-center shrink-0"
                style={{ width: '40px', height: '40px', background: '#F0F7FF', color: '#0072F5' }}
              >
                <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                Chính sách bảo hành
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
          </button>

          <button
            onClick={onNavigateHome}
            className="w-full flex items-center justify-between px-4 hover:bg-[#F8FAFC] transition-colors text-left"
            style={{ height: '56px' }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="rounded-[12px] flex items-center justify-center shrink-0"
                style={{ width: '40px', height: '40px', background: '#F0F7FF', color: '#0072F5' }}
              >
                <Gift className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                Lợi ích
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
          </button>

          <button
            onClick={onNavigateHome}
            className="w-full flex items-center justify-between px-4 hover:bg-[#F8FAFC] transition-colors text-left"
            style={{ height: '56px' }}
          >
            <div className="flex items-center gap-3.5">
              <div 
                className="rounded-[12px] flex items-center justify-center shrink-0"
                style={{ width: '40px', height: '40px', background: '#F0F7FF', color: '#0072F5' }}
              >
                <HelpCircle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
                Hỏi đáp
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
