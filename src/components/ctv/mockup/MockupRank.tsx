import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, ChevronRight, Users, Shield, Crown, Star, CheckCircle2 } from 'lucide-react';
import { UserSession } from '../../../hooks/useUnifiedAuth';

interface MockupRankProps {
  currentUser: UserSession;
  onOpenF1List?: () => void;
}

export const MockupRank: React.FC<MockupRankProps> = ({
  currentUser,
  onOpenF1List
}) => {
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<any>(null);

  const rawRank = ((currentUser as any)?.rank || (currentUser as any)?.nppRank || '').toString().toUpperCase().trim();
  const isDirector = rawRank === 'DIRECTOR' || rawRank === 'SALES_DIRECTOR';
  const isManager = rawRank === 'MANAGER' || rawRank === 'SALES_MANAGER';
  const isAmbassador = rawRank === 'AMBASSADOR';

  const qp = currentUser.qualifyingPoints || 25000;
  const sPoints = currentUser.sPoints || 25000;

  useEffect(() => {
    const uid = currentUser.id || currentUser.id;
    if (!uid) return;
    fetch(`/api/rank/promotion-progress/${uid}`, { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data) {
          setProgressData(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  // Derived rank details
  const rankTitle = isDirector ? 'QUẢN LÝ (DIRECTOR)' : (isManager ? 'TRƯỞNG NHÓM (MANAGER)' : 'ĐẠI SỨ (AMBASSADOR)');
  const nextRankTitle = isDirector ? 'Cấp bậc quản trị cao nhất' : (isManager ? 'Tiến trình lên cấp Quản lý (Director)' : 'Tiến trình lên cấp Trưởng nhóm (Manager)');
  
  // Progress computation
  const targetF1 = 5;
  const currentF1 = progressData?.current ?? (isManager ? 1 : (isAmbassador ? 5 : 0));
  const progressPercent = isDirector ? 100 : Math.min(100, Math.round((currentF1 / targetF1) * 100));
  
  const conditionLabel = isDirector 
    ? 'Đã đạt cấp bậc Quản Lý cao nhất'
    : (isManager 
      ? `${currentF1} / ${targetF1} F1 Trưởng nhóm` 
      : `${currentF1} / ${targetF1} F1 Đại sứ`);

  const conditionDesc = isDirector
    ? 'Bạn đã đạt cấp bậc quản trị kinh doanh cao nhất của WasyPro. Tận hưởng toàn bộ đặc quyền hoa hồng F1 (10%), F2 (5%) và bán hàng tối đa.'
    : (isManager
      ? 'Cần đủ 5 thành viên F1 trực tiếp đạt chuẩn Trưởng nhóm (có Business ID) để lên Quản lý'
      : 'Cần đủ 5 thành viên F1 trực tiếp đạt chuẩn Đại sứ (có Business ID) để lên Trưởng nhóm');

  const f1ButtonLabel = isDirector
    ? `Danh sách đội nhóm đối tác (${progressData?.f1List?.length || currentF1})`
    : (isManager
      ? `Danh sách F1 hợp lệ (${currentF1})`
      : `Danh sách F1 hợp lệ (${currentF1})`);

  // Theme colors per rank
  const theme = isDirector
    ? { primary: '#9333EA', bg: '#FAF5FF', border: '#E9D5FF', icon: Crown }
    : (isManager
      ? { primary: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', icon: Shield }
      : { primary: '#7C3AED', bg: '#FAF5FF', border: '#EDE0FF', icon: Trophy });

  const RankIcon = theme.icon;

  return (
    <div className="space-y-4 pb-6" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
      {/* 1. RANK PROGRESS CARD */}
      <div 
        style={{
          background: '#FFFFFF',
          border: `1px solid ${theme.border}`,
          borderRadius: '20px',
          padding: '20px',
          boxShadow: '0 4px 14px rgba(15,23,42,0.05)'
        }}
        className="space-y-3"
      >
        <div className="flex items-center gap-3.5">
          <div 
            className="rounded-[16px] flex items-center justify-center shrink-0"
            style={{ width: '56px', height: '56px', background: theme.bg, color: theme.primary }}
          >
            <RankIcon className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: theme.primary, lineHeight: 1.3 }}>
              {isDirector ? 'QUẢN LÝ' : (isManager ? 'TRƯỞNG NHÓM' : 'ĐẠI SỨ')}
            </h2>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#475569', marginTop: '2px' }}>
              {nextRankTitle}
            </p>
          </div>
        </div>

        {/* PROGRESS BAR */}
        {!isDirector && (
          <div>
            <div className="flex items-center gap-3">
              <div 
                className="flex-1 overflow-hidden" 
                style={{ background: '#E2E8F0', height: '8px', borderRadius: '999px' }}
              >
                <div 
                  style={{ background: '#0072F5', height: '8px', borderRadius: '999px', width: `${progressPercent}%`, transition: 'width 0.4s ease' }} 
                />
              </div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{progressPercent}%</span>
            </div>
          </div>
        )}

        {/* Condition note */}
        <div className="pt-2 border-t border-[#EEF2F6]">
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#0072F5' }}>
            {conditionLabel}
          </div>
          <p style={{ fontSize: '14px', fontWeight: 400, color: '#64748B', marginTop: '2px', lineHeight: 1.4 }}>
            {conditionDesc}
          </p>
        </div>
      </div>

      {/* Button: Danh sách F1 hợp lệ > */}
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
          <Users className="w-5 h-5 text-[#0072F5] stroke-[2.2]" />
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#0F172A' }}>
            {f1ButtonLabel}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-[#94A3B8] stroke-[2.5]" />
      </button>

      {/* ============================================================
          SECTION: CP CARD
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
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0052CC', letterSpacing: '0.05em' }}>
              ĐIỂM TÍCH LŨY (CP)
            </span>
          </div>
          <span 
            className="px-2.5 py-0.5 rounded-full"
            style={{ background: '#E0EEFF', color: '#0072F5', fontSize: '13px', fontWeight: 600 }}
          >
            Xét chuẩn
          </span>
        </div>

        <div style={{ fontSize: '33px', fontWeight: 700, color: '#0052CC', lineHeight: 1.2, paddingTop: '4px' }}>
          {qp.toLocaleString('vi-VN')} <span style={{ fontSize: '21px', fontWeight: 600 }}>CP</span>
        </div>

        <p style={{ fontSize: '14px', fontWeight: 400, color: '#475569', paddingTop: '4px', lineHeight: 1.4 }}>
          Điểm chuẩn tích lũy từ các đơn hàng cá nhân trên hệ thống
        </p>
      </div>

      {/* ============================================================
          SECTION: S POINT CARD
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
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#7C3AED' }}>
            Điểm S tích lũy
          </span>
          <span 
            className="px-2.5 py-0.5 rounded-full"
            style={{ background: '#FAF5FF', color: '#7C3AED', border: '1px solid #EDE0FF', fontSize: '13px', fontWeight: 600 }}
          >
            1 điểm = 1.000đ
          </span>
        </div>

        <div className="flex items-end justify-between pt-1">
          <div>
            <div style={{ fontSize: '31px', fontWeight: 700, color: '#7C3AED', lineHeight: 1 }}>
              {sPoints.toLocaleString('vi-VN')}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#7C3AED', marginTop: '6px' }}>
              ≈ {(sPoints * 1000).toLocaleString('vi-VN')}đ
            </div>
          </div>

          <div className="text-right">
            <div style={{ fontSize: '14px', fontWeight: 400, color: '#94A3B8' }}>Số máy đã mua</div>
            <div style={{ fontSize: '25px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
              {Math.floor(qp / 5000)} <span style={{ fontSize: '15px', fontWeight: 400, color: '#94A3B8' }}>máy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
