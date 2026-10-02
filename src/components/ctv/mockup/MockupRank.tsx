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
    <div className="space-y-4 pb-6">
      {/* 1. RANK PROGRESS CARD (Mockup 1 Screen 2) */}
      <div className="bg-white rounded-3xl p-5 border border-purple-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#9333EA] flex items-center justify-center shrink-0">
            <Trophy className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-[20px] font-black text-[#581C87] tracking-tight">
              ĐẠI SỨ
            </h2>
            <p className="text-[13px] font-medium text-gray-600 mt-0.5">
              Tiến trình lên cấp Trưởng nhóm (Manager)
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-100 h-3 rounded-full overflow-hidden">
              <div className="bg-[#0070F3] h-full rounded-full w-[20%]" />
            </div>
            <span className="text-[14px] font-black text-gray-800">20%</span>
          </div>
        </div>

        {/* Condition note */}
        <div className="pt-2 border-t border-gray-100">
          <div className="text-[14px] font-bold text-[#0070F3]">
            1 / 5 F1 Đại sứ
          </div>
          <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">
            Cần đủ 5 thành viên F1 trực tiếp đạt chuẩn Đại sứ (có Business ID)
          </p>
        </div>
      </div>

      {/* Button: Danh sách F1 hợp lệ */}
      <button
        onClick={onOpenF1List}
        className="w-full bg-white hover:bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center justify-between text-left transition-all active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-purple-600 stroke-[2.2]" />
          <span className="text-[14px] font-bold text-gray-800">Danh sách F1 hợp lệ (1)</span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 stroke-[2.5]" />
      </button>

      {/* 2. ĐIỂM TÍCH LŨY (CP) CARD (Mockup 1 Screen 2) */}
      <div className="bg-[#F0F7FF] rounded-3xl p-5 border border-blue-100/90 shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#0070F3] stroke-[2.5]" />
            <span className="text-[13px] font-black text-[#004ACC] uppercase tracking-wider">
              ĐIỂM TÍCH LŨY (CP)
            </span>
          </div>
          <span className="bg-[#E0EEFF] text-[#0070F3] text-[11px] font-extrabold px-3 py-1 rounded-full">
            Xét chuẩn
          </span>
        </div>

        <div className="text-[34px] font-black text-[#004ACC] tracking-tight pt-1">
          {qp.toLocaleString('vi-VN')} <span className="text-[20px] font-bold">CP</span>
        </div>

        <p className="text-[12px] text-gray-500 pt-1 leading-relaxed">
          Điểm chuẩn tích lũy từ các đơn hàng cá nhân trên hệ thống
        </p>
      </div>

      {/* 3. ĐIỂM S TÍCH LŨY CARD (Mockup 1 Screen 2) */}
      <div className="bg-[#FAF5FF] rounded-3xl p-5 border border-purple-100/90 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-black text-[#6B21A8]">
            Điểm S tích lũy
          </span>
          <span className="bg-purple-100 text-purple-700 text-[11px] font-extrabold px-3 py-1 rounded-full">
            1 điểm = 1.000đ
          </span>
        </div>

        <div className="flex items-end justify-between pt-1">
          <div>
            <div className="text-[34px] font-black text-[#6B21A8] leading-none">
              {sPoints.toLocaleString('vi-VN')}
            </div>
            <div className="text-[13px] font-bold text-[#7E22CE] mt-1.5">
              ≈ {(sPoints * 1000).toLocaleString('vi-VN')}đ
            </div>
          </div>

          <div className="text-right">
            <div className="text-[12px] text-gray-500 font-medium">Số máy đã mua</div>
            <div className="text-[22px] font-black text-gray-900 mt-0.5">
              0 <span className="text-[14px] font-medium text-gray-500">máy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
