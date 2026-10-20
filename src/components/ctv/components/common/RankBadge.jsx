import React from 'react';

/**
 * RANK CONFIG — Water King Group
 * Cấp bậc đối tác kinh doanh:
 * AMBASSADOR -> Đại sứ
 * MANAGER    -> Trưởng nhóm
 * DIRECTOR   -> Quản lý
 */
const RANK_CONFIG = {
  AMBASSADOR: {
    label: 'ĐẠI SỨ',
    color: '#B45309',
    bg: '#FEF3C7',
    border: '#F59E0B',
    icon: '🥉',
  },
  MANAGER: {
    label: 'TRƯỞNG NHÓM',
    color: '#1E40AF',
    bg: '#DBEAFE',
    border: '#3B82F6',
    icon: '🛡️',
  },
  DIRECTOR: {
    label: 'QUẢN LÝ',
    color: '#6D28D9',
    bg: '#EDE9FE',
    border: '#8B5CF6',
    icon: '👑',
  },
  MEMBER: {
    label: 'Thành Viên',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#93c5fd',
    icon: '🔵',
  },
  CUSTOMER: {
    label: 'Khách Hàng',
    color: '#64748b',
    bg: '#f1f5f9',
    border: '#cbd5e1',
    icon: '👤',
  },
};

// Backward compatibility
RANK_CONFIG.SALES_MANAGER  = RANK_CONFIG.MANAGER;
RANK_CONFIG.SALES_DIRECTOR = RANK_CONFIG.DIRECTOR;
RANK_CONFIG.GOLD           = RANK_CONFIG.MANAGER;
RANK_CONFIG.DIAMOND        = RANK_CONFIG.DIRECTOR;
RANK_CONFIG.SILVER         = RANK_CONFIG.AMBASSADOR;

/**
 * Helper Single Source of Truth cho Display Label
 */
export function getRankDisplayLabel(rank) {
  if (!rank) return '';
  const r = String(rank).toUpperCase().trim();
  if (r === 'DIRECTOR' || r === 'SALES_DIRECTOR' || r === 'DIAMOND') return 'Quản lý';
  if (r === 'MANAGER' || r === 'SALES_MANAGER' || r === 'GOLD') return 'Trưởng nhóm';
  if (r === 'AMBASSADOR' || r === 'SILVER') return 'Đại sứ';
  return 'Thành viên';
}

/**
 * RankBadge — hiển thị cấp bậc với màu Đồng/Bạc/Vàng
 */
export default function RankBadge({ tier, rank, isSystemParticipant, nppRank, size = 'md' }) {
  let key = 'CUSTOMER';

  if (rank && ['AMBASSADOR', 'MANAGER', 'DIRECTOR', 'SALES_MANAGER', 'SALES_DIRECTOR'].includes(rank.toUpperCase())) {
    key = rank.toUpperCase();
  } else if (nppRank && ['AMBASSADOR', 'MANAGER', 'DIRECTOR'].includes(nppRank.toUpperCase())) {
    key = nppRank.toUpperCase();
  } else if (tier && ['MANAGER', 'DIRECTOR', 'SALES_MANAGER', 'SALES_DIRECTOR', 'GOLD', 'DIAMOND'].includes(tier.toUpperCase())) {
    key = tier.toUpperCase();
  } else if (isSystemParticipant) {
    key = 'MEMBER';
  }

  const cfg = RANK_CONFIG[key] || RANK_CONFIG.CUSTOMER;

  const sizeClass = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold whitespace-nowrap shadow-sm ${sizeClass}`}
      style={{
        color: cfg.color,
        backgroundColor: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
      }}
      title={`Cấp bậc: ${cfg.label}`}
    >
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
}

export { RANK_CONFIG };