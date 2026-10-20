import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Users, DollarSign, Search } from 'lucide-react';
import { RANK_CONFIG } from '../common/RankBadge.jsx';

function getRankCfg(node) {
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
  return RANK_CONFIG[rankKey] || RANK_CONFIG.AMBASSADOR;
}

function countDescendants(node) {
  if (!node.children || node.children.length === 0) return 0;
  let count = node.children.length;
  for (const c of node.children) {
    count += countDescendants(c);
  }
  return count;
}

function HierarchyNodeItem({ node, level = 0, searchTerm = '' }) {
  const [expanded, setExpanded] = useState(level < 2); // Mở sẵn cấp 0 và cấp 1
  const cfg = getRankCfg(node);
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const totalSub = countDescendants(node);

  // Search matching
  const matchesSearch = searchTerm === '' || 
    (node.name && node.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (node.businessId && node.businessId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (node.id && node.id.toLowerCase().includes(searchTerm.toLowerCase()));

  // If any child matches search, force expand
  const anyChildMatches = (items) => {
    if (!searchTerm) return false;
    for (const c of items) {
      if (
        (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.businessId && c.businessId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.id && c.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        anyChildMatches(c.children || [])
      ) {
        return true;
      }
    }
    return false;
  };

  const isChildMatched = anyChildMatches(children);
  const isExpanded = searchTerm ? (matchesSearch || isChildMatched) : expanded;

  if (searchTerm && !matchesSearch && !isChildMatched) {
    return null;
  }

  return (
    <div className="flex flex-col w-full my-1.5 animate-fadeIn">
      {/* Node Card */}
      <div
        onClick={() => hasChildren && setExpanded(!expanded)}
        className="flex flex-col p-3 rounded-xl transition-all shadow-sm select-none"
        style={{
          marginLeft: `${Math.min(level * 16, 48)}px`,
          backgroundColor: cfg.bg,
          borderLeft: `4.5px solid ${cfg.border}`,
          borderTop: `1px solid ${cfg.border}33`,
          borderRight: `1px solid ${cfg.border}33`,
          borderBottom: `1px solid ${cfg.border}33`,
          cursor: hasChildren ? 'pointer' : 'default',
        }}
      >
        {/* Top Header: Badge + Business ID + Sub-count */}
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-black/5">
          <div className="flex items-center gap-1 font-bold text-xs" style={{ color: cfg.color }}>
            <span className="text-sm leading-none">{cfg.icon}</span>
            <span className="uppercase tracking-wider font-extrabold text-[11px]">{cfg.label}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {node.businessId && (
              <span 
                className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/70 shadow-xs"
                style={{ color: cfg.color }}
              >
                {node.businessId}
              </span>
            )}
            {hasChildren && (
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs"
                style={{ backgroundColor: `${cfg.border}25`, color: cfg.color }}
              >
                <Users size={10} />
                <span>{children.length} F1 {totalSub > children.length ? `(${totalSub} TV)` : ''}</span>
              </span>
            )}
          </div>
        </div>

        {/* Middle: Name & Sales */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="font-extrabold text-sm text-primary truncate max-w-[200px]" title={node.name}>
            {node.name}
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-secondary font-medium mr-1">Doanh số:</span>
            <span className="text-xs font-black" style={{ color: cfg.color }}>
              {new Intl.NumberFormat('vi-VN').format(node.totalSales || 0)}đ
            </span>
          </div>
        </div>

        {/* Bottom Expansion Bar if has children */}
        {hasChildren && (
          <div 
            className="flex items-center justify-between mt-2 pt-1.5 text-[11px] font-bold border-t border-black/5"
            style={{ color: cfg.color }}
          >
            <span className="text-[10px] opacity-75">
              {isExpanded ? 'Nhấn để thu gọn' : `Chạm xem ${children.length} tuyến dưới`}
            </span>
            <div className="flex items-center gap-0.5">
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </div>
          </div>
        )}
      </div>

      {/* Children list with connector line */}
      {hasChildren && isExpanded && (
        <div 
          className="flex flex-col mt-1 relative pl-2"
          style={{
            borderLeft: `2px dashed ${cfg.border}60`,
            marginLeft: `${Math.min(level * 16 + 10, 58)}px`,
          }}
        >
          {children.map((child) => (
            <HierarchyNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HierarchyListView({ tree = [] }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate totals
  let totalMembers = 0;
  let totalTeamSales = 0;

  const traverse = (nodes) => {
    for (const n of nodes) {
      totalMembers += 1;
      totalTeamSales += (n.totalSales || 0);
      if (n.children) traverse(n.children);
    }
  };
  traverse(tree);

  return (
    <div className="flex flex-col gap-3 w-full max-w-xl mx-auto">
      {/* Quick Summary Strip */}
      <div className="grid grid-cols-2 gap-2 p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2.5 p-2 bg-sky-50/70 border border-sky-100 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Users size={16} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-800">Tổng Thành Viên</div>
            <div className="text-sm font-black text-sky-950">{totalMembers} người</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 bg-amber-50/70 border border-amber-100 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <DollarSign size={16} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Doanh Số Nhóm</div>
            <div className="text-xs font-black text-amber-950 truncate">
              {new Intl.NumberFormat('vi-VN').format(totalTeamSales)}đ
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm đối tác theo tên, mã WK, ID..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs bg-white border border-gray-200 focus:outline-none focus:border-primary shadow-xs"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-bold px-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Hierarchy List */}
      <div className="flex flex-col">
        {tree.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 bg-white rounded-2xl border border-gray-100">
            Chưa có dữ liệu tuyến dưới.
          </div>
        ) : (
          tree.map((rootNode) => (
            <HierarchyNodeItem
              key={rootNode.id}
              node={rootNode}
              level={0}
              searchTerm={searchTerm}
            />
          ))
        )}
      </div>
    </div>
  );
}
