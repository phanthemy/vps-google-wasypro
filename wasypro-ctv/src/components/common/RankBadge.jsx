import React from 'react';

const RANK_CONFIG = {
  // Phase 2C Standard Ranks
  AMBASSADOR:      { label: 'Đại sứ',         color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: '⭐' },
  MANAGER:         { label: 'Quản lý',        color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: '🛡️' },
  DIRECTOR:        { label: 'Giám đốc',       color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '👑' },

  // Non-participant / customer / member
  MEMBER:          { label: 'Thành viên',     color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '🔷' },
  CUSTOMER:        { label: 'Khách hàng',     color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', icon: '👤' },

  // Backward compatibility mappings
  SALES_MANAGER:   { label: 'Quản lý',        color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: '🛡️' },
  SALES_DIRECTOR:  { label: 'Giám đốc',       color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '👑' },
  GOLD:            { label: 'Quản lý',        color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: '🛡️' },
  DIAMOND:         { label: 'Giám đốc',       color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '👑' },
  SILVER:          { label: 'Đại sứ',         color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: '⭐' },
};

/**
 * RankBadge - Phase 2C display component
 * Shows user rank (Ambassador, Manager, Director) or Thành viên / Khách hàng
 * @param {string} tier - User.tier value (legacy fallback)
 * @param {string|null} rank - User.rank value (canonical)
 * @param {boolean} isSystemParticipant - Whether user joined the partner system
 * @param {'sm'|'md'|'lg'} size
 */
export default function RankBadge({ tier, rank, isSystemParticipant, size = 'md' }) {
  let key = 'CUSTOMER';

  // Strict rank mapping:
  // If rank is set, use it.
  // If no rank is set, but user joined system -> they are a MEMBER until they achieve AMBASSADOR.
  // Otherwise -> CUSTOMER.
  if (rank && ['AMBASSADOR', 'MANAGER', 'DIRECTOR', 'SALES_MANAGER', 'SALES_DIRECTOR'].includes(rank.toUpperCase())) {
    key = rank.toUpperCase();
  } else if (tier && ['MANAGER', 'DIRECTOR', 'SALES_MANAGER', 'SALES_DIRECTOR', 'GOLD', 'DIAMOND'].includes(tier.toUpperCase())) {
    key = tier.toUpperCase();
  } else if (isSystemParticipant) {
    key = 'MEMBER';
  } else {
    key = 'CUSTOMER';
  }

  const cfg = RANK_CONFIG[key] || RANK_CONFIG.CUSTOMER;

  const sizeClass = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-bold whitespace-nowrap shadow-sm ${sizeClass}`}
      style={{
        color: cfg.color,
        backgroundColor: cfg.bg,
        border: `1px solid ${cfg.border || cfg.color + '40'}`
      }}
      title={`Cấp bậc: ${cfg.label}`}
    >
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
}
