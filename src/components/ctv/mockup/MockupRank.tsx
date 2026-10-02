import React from 'react';
import { Trophy, TrendingUp, ChevronRight, Users } from 'lucide-react';
import { UserSession } from '../../../hooks/useUnifiedAuth';

interface MockupRankProps {
  currentUser: UserSession;
  onOpenF1List?: () => void;
}

export const MockupRank: React.FC<MockupRankProps> = ({
  currentUser,
  onOpenF1List
}) => {
  const qp = currentUser.qualifyingPoints || 25000;
  const sPoints = currentUser.sPoints || 25000;

  return (
    <div className="space-y-4 pb-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
      {/* 1. RANK PROGRESS CARD (Mockup 1 Screen 2) */}
      <div 
        style={{
          background: '#FFFFFF',
          border: '1px solid #EEF2F6',
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
        }}
        className="space-y-3"
      >
        <div className="flex items-center gap-3.5">
          <div 
            className="rounded-[16px] flex items-center justify-center shrink-0"
            style={{ width: '56px', height: '56px', background: '#FAF5FF', color: '#7C3AED' }}
          >
            <Trophy className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#7C3AED', lineHeight: 1.3 }}>
              ĐẠI SỨ
            </h2>
            <p style={{ fontSize: '14px', fontWeight: 400, color: '#475569', marginTop: '2px' }}>
              Tiến trình lên cấp Trưởng nhóm (Manager)
            </p>
          </div>
        </div>

        {/* SECTION 14: PROGRESS BAR (track: #E2E8F0, 8px / progress: #0072F5, 8px) */}
        <div>
          <div className="flex items-center gap-3">
            <div 
              className="flex-1 overflow-hidden" 
              style={{ background: '#E2E8F0', height: '8px', borderRadius: '999px' }}
            >
              <div 
                style={{ background: '#0072F5', height: '8px', borderRadius: '999px', width: '20%' }} 
              />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>20%</span>
          </div>
        </div>

        {/* Condition note */}
        <div className="pt-2 border-t border-[#EEF2F6]">
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0072F5' }}>
            1 / 5 F1 Đại sứ
          </div>
          <p style={{ fontSize: '13px', fontWeight: 400, color: '#94A3B8', marginTop: '2px', lineHeight: 1.4 }}>
            Cần đủ 5 thành viên F1 trực tiếp đạt chuẩn Đại sứ (có Business ID)
          </p>
        </div>
      </div>

      {/* Button: Danh sách F1 hợp lệ (1) > */}
      <button
        onClick={onOpenF1List}
        className="w-full flex items-center justify-between text-left transition-all active:scale-[0.99]"
        style={{
          background: '#FFFFFF',
          border: '1px solid #EEF2F6',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
        }}
      >
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-[#7C3AED] stroke-[2.2]" />
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A' }}>
            Danh sách F1 hợp lệ (1)
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
      </button>

      {/* ============================================================
          SECTION 15: CP CARD (background #F0F7FF, border #D6E8FF, radius 20px, number 32px 700 #0052CC)
          ============================================================ */}
      <div 
        style={{
          background: '#F0F7FF',
          border: '1px solid #D6E8FF',
          borderRadius: '20px',
          padding: '18px 20px',
        }}
        className="space-y-1"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#0052CC] stroke-[2.5]" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0052CC', letterSpacing: '0.05em' }}>
              ĐIỂM TÍCH LŨY (CP)
            </span>
          </div>
          <span 
            className="px-2.5 py-0.5 rounded-full"
            style={{ background: '#E0EEFF', color: '#0072F5', fontSize: '12px', fontWeight: 600 }}
          >
            Xét chuẩn
          </span>
        </div>

        <div style={{ fontSize: '32px', fontWeight: 700, color: '#0052CC', lineHeight: 1.2, paddingTop: '4px' }}>
          {qp.toLocaleString('vi-VN')} <span style={{ fontSize: '20px', fontWeight: 600 }}>CP</span>
        </div>

        <p style={{ fontSize: '13px', fontWeight: 400, color: '#475569', paddingTop: '4px', lineHeight: 1.4 }}>
          Điểm chuẩn tích lũy từ các đơn hàng cá nhân trên hệ thống
        </p>
      </div>

      {/* ============================================================
          SECTION 15: S POINT CARD (background #FAF5FF, border #EDE0FF, radius 20px, number 30px 700 #7C3AED)
          ============================================================ */}
      <div 
        style={{
          background: '#FAF5FF',
          border: '1px solid #EDE0FF',
          borderRadius: '20px',
          padding: '18px 20px',
        }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#7C3AED' }}>
            Điểm S tích lũy
          </span>
          <span 
            className="px-2.5 py-0.5 rounded-full"
            style={{ background: '#FAF5FF', color: '#7C3AED', border: '1px solid #EDE0FF', fontSize: '12px', fontWeight: 600 }}
          >
            1 điểm = 1.000đ
          </span>
        </div>

        <div className="flex items-end justify-between pt-1">
          <div>
            <div style={{ fontSize: '30px', fontWeight: 700, color: '#7C3AED', lineHeight: 1 }}>
              {sPoints.toLocaleString('vi-VN')}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#7C3AED', marginTop: '6px' }}>
              ≈ {(sPoints * 1000).toLocaleString('vi-VN')}đ
            </div>
          </div>

          <div className="text-right">
            <div style={{ fontSize: '13px', fontWeight: 400, color: '#94A3B8' }}>Số máy đã mua</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
              0 <span style={{ fontSize: '14px', fontWeight: 400, color: '#94A3B8' }}>máy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
