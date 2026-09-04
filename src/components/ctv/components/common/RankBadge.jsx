import React from 'react';

const RANK_CONFIG = {
  // Tier (hi?n t?i ? Phase 1A)
  SILVER:          { label: 'B?c',         color: '#94a3b8', bg: '#f1f5f9', icon: '??' },
  GOLD:            { label: 'V?ng',        color: '#f59e0b', bg: '#fffbeb', icon: '??' },
  DIAMOND:         { label: 'Kim c??ng',   color: '#06b6d4', bg: '#ecfeff', icon: '??' },
  // Rank m?i (Phase 2A foundation ? display only)
  AMBASSADOR:      { label: '??i s? TM',  color: '#7c3aed', bg: '#f5f3ff', icon: '??' },
  SALES_MANAGER:   { label: 'Tr??ng PGD', color: '#059669', bg: '#ecfdf5', icon: '?' },
  SALES_DIRECTOR:  { label: 'Gi?m ??c KD',color: '#dc2626', bg: '#fef2f2', icon: '??' },
  EXEC_OPERATIONS: { label: 'G? V?n h?nh',color: '#1d4ed8', bg: '#eff6ff', icon: '??' },
  EXEC_PROVINCE:   { label: 'TG? T?nh',   color: '#7e22ce', bg: '#fdf4ff', icon: '??' },
  EXEC_STRATEGIC:  { label: 'L?nh ??o CL',color: '#be123c', bg: '#fff1f2', icon: '??' },
};

/**
 * RankBadge ? Phase 2A display-only component
 * Shows tier (SILVER/GOLD/DIAMOND) or rank (AMBASSADOR etc.) if set
 * @param {string} tier - User.tier value
 * @param {string|null} rank - User.rank value (nullable)
 * @param {'sm'|'md'|'lg'} size
 */
export default function RankBadge({ tier, rank, size = 'md' }) {
  const key = rank || tier || 'SILVER';
  const cfg = RANK_CONFIG[key] || RANK_CONFIG.SILVER;

  const sizeClass = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap ${sizeClass}`}
      style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.color}33` }}
      title={rank ? `C?p b?c: ${cfg.label}` : `H?ng: ${cfg.label}`}
    >
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
}
