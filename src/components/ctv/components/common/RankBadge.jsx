import React from 'react';

const RANK_CONFIG = {
  // Phase 2C Standard Ranks
  AMBASSADOR:      { label: 'Đại sứ',         color: '#7c3aed', bg: '#f5f3ff', icon: '⭐' },
  MANAGER:         { label: 'Quản lý',        color: '#059669', bg: '#ecfdf5', icon: '🛡️' },
  DIRECTOR:        { label: 'Giám đốc',       color: '#dc2626', bg: '#fef2f2', icon: '👑' },

  // Backward compatibility mappings
  SALES_MANAGER:   { label: 'Quản lý',        color: '#059669', bg: '#ecfdf5', icon: '🛡️' },
  SALES_DIRECTOR:  { label: 'Giám đốc',       color: '#dc2626', bg: '#fef2f2', icon: '👑' },
  SILVER:          { label: 'Đại sứ',         color: '#7c3aed', bg: '#f5f3ff', icon: '⭐' },
  GOLD:            { label: 'Quản lý',        color: '#059669', bg: '#ecfdf5', icon: '🛡️' },
  DIAMOND:         { label: 'Giám đốc',       color: '#dc2626', bg: '#fef2f2', icon: '👑' },
};

/**
 * RankBadge - Phase 2C display component
 * Shows user rank (Ambassador, Manager, Director)
 * @param {string} tier - User.tier value (fallback)
 * @param {string|null} rank - User.rank value
 * @param {'sm'|'md'|'lg'} size
 */
export default function RankBadge({ tier, rank, size = 'md' }) {
  const key = rank || tier || 'AMBASSADOR';
  const cfg = RANK_CONFIG[key] || RANK_CONFIG.AMBASSADOR;

  const sizeClass = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap shadow-sm ${sizeClass}`}
      style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.color}33` }}
      title={`Cấp bậc: ${cfg.label}`}
    >
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
}
