import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { RANK_CONFIG } from '../common/RankBadge.jsx';

export default function TreeNode({ node, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Normalize rank key: DIRECTOR (Vàng), MANAGER (Bạc), AMBASSADOR (Đồng)
  const rawRank = (node.rank || '').toUpperCase();
  const rawTier = (node.tier || '').toUpperCase();

  let rankKey = 'AMBASSADOR';
  if (['DIRECTOR', 'SALES_DIRECTOR', 'DIAMOND'].includes(rawRank) || ['DIRECTOR', 'SALES_DIRECTOR', 'DIAMOND'].includes(rawTier)) {
    rankKey = 'DIRECTOR';
  } else if (['MANAGER', 'SALES_MANAGER', 'GOLD'].includes(rawRank) || ['MANAGER', 'SALES_MANAGER', 'GOLD'].includes(rawTier)) {
    rankKey = 'MANAGER';
  } else {
    rankKey = 'AMBASSADOR';
  }

  const cfg = RANK_CONFIG[rankKey] || RANK_CONFIG.AMBASSADOR;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center tree-branch-wrapper">
      <div 
        className="tree-node relative z-10 flex flex-col gap-1 w-full"
        onClick={() => hasChildren && setExpanded(!expanded)}
        style={{ 
          cursor: hasChildren ? 'pointer' : 'default', 
          padding: '12px 16px', 
          minWidth: '190px',
          backgroundColor: cfg.bg,
          borderLeft: `5px solid ${cfg.border}`,
          borderTop: `1px solid ${cfg.border}44`,
          borderRight: `1px solid ${cfg.border}44`,
          borderBottom: `1px solid ${cfg.border}44`,
          borderRadius: '12px',
        }}
      >
        <div className="flex justify-between items-center w-full" style={{ borderBottom: `1px solid ${cfg.border}33`, paddingBottom: '6px', marginBottom: '4px' }}>
          <div className="flex items-center gap-1.5 font-bold text-xs" style={{ color: cfg.color }}>
            <span style={{ fontSize: '15px' }}>{cfg.icon}</span> 
            <span className="uppercase tracking-wider font-extrabold">{cfg.label}</span>
          </div>
          <div className="text-xs font-mono font-bold" style={{ color: cfg.color, opacity: 0.85 }}>
            {node.businessId || node.id?.slice(0, 8)}
          </div>
        </div>
        <div className="font-extrabold text-sm text-primary w-full text-left truncate mt-0.5" title={node.name}>
          {node.name}
        </div>
        <div className="flex flex-col w-full mt-1" style={{ alignItems: 'flex-start' }}>
          <div className="text-xs text-secondary font-medium" style={{ whiteSpace: 'nowrap' }}>Doanh số:</div>
          <div className="text-sm font-black" style={{ color: cfg.color, marginTop: '1px' }}>
            {new Intl.NumberFormat('vi-VN').format(node.totalSales || 0)}đ
          </div>
        </div>
        {hasChildren && (
          <div className="text-muted mt-2 mx-auto w-full flex justify-center pt-1" style={{ borderTop: `1px solid ${cfg.border}22` }}>
            <div style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'flex', alignItems: 'center', color: cfg.color }}>
              <ChevronDown size={14} />
            </div>
          </div>
        )}
      </div>
      {hasChildren && expanded && (
        <div className="flex flex-col items-center w-full">
          <div style={{ width: '2px', height: '20px', background: 'var(--border-strong, #cbd5e1)' }}></div>
          <div className="flex justify-center relative" style={{ paddingTop: '20px', position: 'relative' }}>
            {/* Horizontal Line Bridge */}
            {node.children.length > 1 && (
              <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px', background: 'var(--border-strong, #cbd5e1)'}}></div>
            )}
            {node.children.map((child) => (
              <div key={child.id} className="relative flex flex-col items-center shrink-0">
                <div style={{ position: 'absolute', top: '-20px', left: '50%', width: '2px', height: '20px', background: 'var(--border-strong, #cbd5e1)'}}></div>
                <TreeNode node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
