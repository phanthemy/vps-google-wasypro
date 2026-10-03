import React, { useState } from 'react';
import { Crown, Award, Medal, ChevronDown } from 'lucide-react';

export default function TreeNode({ node, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const iconMap = {
    'DIAMOND': <Crown size={16}/>,
    'GOLD': <Award size={14}/>,
    'SILVER': <Medal size={14}/>,
    'DIRECTOR': <Crown size={16}/>,
    'MANAGER': <Award size={14}/>,
    'AMBASSADOR': <Medal size={14}/>
  };
  const tierClass = (node.tier || 'silver').toLowerCase() + '-node';
  const hasChildren = node.children && node.children.length > 0;

  const roleLabel = node.rank === 'DIRECTOR' || node.tier === 'DIAMOND' ? 'Giám đốc'
    : node.rank === 'MANAGER' || node.tier === 'GOLD' ? 'Quản lý'
    : 'Đại sứ';

  return (
    <div className="flex-col items-center tree-branch-wrapper">
      <div 
        className={`tree-node ${tierClass} relative z-10 flex-col gap-1 w-full`}
        onClick={() => hasChildren && setExpanded(!expanded)}
        style={{ cursor: hasChildren ? 'pointer' : 'default', padding: '12px 16px', minWidth: '180px' }}
      >
        <div className="flex justify-between items-center w-full" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '6px', marginBottom: '4px' }}>
          <div className="flex items-center gap-1 font-bold text-xs" style={{ color: 'var(--accent-diamond)' }}>
            {iconMap[node.rank || node.tier] || <Medal size={14} />} 
            <span className="uppercase">{roleLabel}</span>
          </div>
          <div className="text-xs text-muted font-mono">{node.businessId || node.id?.slice(0, 8)}</div>
        </div>
        <div className="font-bold text-sm text-primary w-full text-left truncate" title={node.name}>{node.name}</div>
        <div className="flex-col w-full mt-1" style={{ alignItems: 'flex-start' }}>
          <div className="text-xs text-muted mt-1" style={{ whiteSpace: 'nowrap' }}>Doanh số:</div>
          <div className="text-sm font-bold" style={{ color: 'var(--accent-diamond)', marginTop: '2px' }}>{new Intl.NumberFormat('vi-VN').format(node.totalSales)}đ</div>
        </div>
        {hasChildren && (
          <div className="text-muted mt-2 mx-auto w-full flex justify-center pt-1" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'flex', alignItems: 'center' }}>
              <ChevronDown size={14} />
            </div>
          </div>
        )}
      </div>
      {hasChildren && expanded && (
        <div className="flex-col items-center w-full">
          <div style={{ width: '2px', height: '20px', background: 'var(--border-strong)' }}></div>
          <div className="flex justify-center relative" style={{ paddingTop: '20px', position: 'relative' }}>
            {/* Horizontal Line Bridge */}
            {node.children.length > 1 && (
              <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px', background: 'var(--border-strong)'}}></div>
            )}
            {node.children.map((child) => (
              <div key={child.id} className="relative flex-col items-center shrink-0">
                <div style={{ position: 'absolute', top: '-20px', left: '50%', width: '2px', height: '20px', background: 'var(--border-strong)'}}></div>
                <TreeNode node={child} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
