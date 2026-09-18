import React, { useState } from 'react';
import { ChevronDown, Users, DollarSign } from 'lucide-react';
import { RANK_CONFIG } from '../common/RankBadge.jsx';

export default function TreeNode({ node, defaultExpanded = true, isRoot = false }) {
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
  const children = node.children || [];
  const hasChildren = children.length > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Node Card - Fixed uniform width 220px for perfect alignment */}
      <div 
        onClick={() => hasChildren && setExpanded(!expanded)}
        className="tree-node-card group relative select-none transition-all duration-200"
        style={{ 
          cursor: hasChildren ? 'pointer' : 'default',
          width: '220px',
          backgroundColor: cfg.bg,
          borderLeft: `4px solid ${cfg.border}`,
          borderTop: `1px solid ${cfg.border}40`,
          borderRight: `1px solid ${cfg.border}40`,
          borderBottom: `1px solid ${cfg.border}40`,
          borderRadius: '14px',
          padding: '12px 14px',
          boxShadow: isRoot 
            ? `0 10px 25px -5px ${cfg.border}30, 0 4px 6px -2px rgba(0,0,0,0.05)` 
            : '0 4px 12px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Header: Rank Badge + Business ID Pill */}
        <div 
          className="flex items-center justify-between gap-2 pb-2 mb-2"
          style={{ borderBottom: `1px solid ${cfg.border}25` }}
        >
          <div className="flex items-center gap-1.5 min-w-0" style={{ color: cfg.color }}>
            <span className="text-sm leading-none shrink-0">{cfg.icon}</span> 
            <span className="text-[11px] font-extrabold uppercase tracking-wide truncate">
              {cfg.label}
            </span>
          </div>

          <div 
            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 shadow-xs"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.85)', 
              color: cfg.color,
              border: `1px solid ${cfg.border}30`
            }}
          >
            {node.businessId || (node.id ? String(node.id).slice(0, 8) : '—')}
          </div>
        </div>

        {/* Member Full Name */}
        <div 
          className="font-extrabold text-[13px] text-slate-800 w-full truncate leading-tight mb-2" 
          title={node.name}
        >
          {node.name}
        </div>

        {/* Sales Metric & F1 Sub-counter */}
        <div className="flex items-end justify-between gap-2 pt-1 border-t border-black/5">
          <div>
            <div className="text-[10px] font-medium text-slate-500 flex items-center gap-0.5">
              <span>Doanh số</span>
            </div>
            <div className="text-xs font-black" style={{ color: cfg.color }}>
              {new Intl.NumberFormat('vi-VN').format(node.totalSales || 0)}đ
            </div>
          </div>

          {hasChildren && (
            <div 
              className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs shrink-0"
              style={{ 
                backgroundColor: `${cfg.border}20`, 
                color: cfg.color 
              }}
            >
              <Users size={10} />
              <span>{children.length} F1</span>
            </div>
          )}
        </div>

        {/* Expand / Collapse Indicator Button */}
        {hasChildren && (
          <div className="flex justify-center mt-2 -mb-1 pt-1.5 border-t border-black/5">
            <div 
              className="flex items-center gap-1 text-[10px] font-bold opacity-75 group-hover:opacity-100 transition-opacity"
              style={{ color: cfg.color }}
            >
              <span>{expanded ? 'Thu gọn' : `Xem ${children.length} nhánh`}</span>
              <ChevronDown 
                size={12} 
                className="transition-transform duration-200"
                style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Children Branches with Precision Org-Chart Connectors */}
      {hasChildren && expanded && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical Stem from Parent Node */}
          <div 
            style={{ 
              width: '2px', 
              height: '24px', 
              backgroundColor: '#94a3b8' 
            }} 
          />

          {/* Children Row */}
          <div className="flex justify-center items-start pt-0 relative">
            {children.map((child, index) => {
              const isFirst = index === 0;
              const isLast = index === children.length - 1;
              const isOnly = children.length === 1;

              return (
                <div 
                  key={child.id} 
                  className="flex flex-col items-center relative px-3 shrink-0"
                >
                  {/* Horizontal Bar segment across children */}
                  {!isOnly && (
                    <div 
                      className="absolute top-0 h-[2px] bg-slate-400"
                      style={{
                        left: isFirst ? '50%' : '0',
                        right: isLast ? '50%' : '0',
                      }}
                    />
                  )}

                  {/* Vertical Drop down into Child Card */}
                  <div 
                    style={{ 
                      width: '2px', 
                      height: '24px', 
                      backgroundColor: '#94a3b8' 
                    }} 
                  />

                  {/* Child Node */}
                  <TreeNode node={child} defaultExpanded={children.length <= 3} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}