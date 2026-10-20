import React, { useState, useEffect } from 'react';
import { GitFork, ListTree, ZoomIn, ZoomOut, RotateCcw, Users, DollarSign } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import TreeNode from '../components/network/TreeNode.jsx';
import HierarchyListView from '../components/network/HierarchyListView.jsx';
import { RANK_CONFIG } from '../components/common/RankBadge.jsx';

export default function NetworkView({ refreshKey, currentUser }) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%, 0.85 = 85%, 0.7 = 70%
  
  // Default to 'list' on mobile screens (< 768px), otherwise 'tree'
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'list';
    }
    return 'tree';
  });

  useEffect(() => {
    fetch('/api/tree', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if(res.success) {
          if (currentUser.role === 'admin' || currentUser.role === 'accountant' || currentUser.id === 'ADMIN' || currentUser.id === 'ACCOUNTANT') {
            setTree(res.data);
          } else {
            const findNode = (nodes, id) => {
              for (let n of nodes) {
                if (n.id === id) return n;
                const found = findNode(n.children || [], id);
                if (found) return found;
              }
              return null;
            };
            const myNode = findNode(res.data, currentUser.id);
            setTree(myNode ? [myNode] : []);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [refreshKey, currentUser]);

  if (loading) return (
    <div className="flex items-center justify-center p-12 text-slate-500 text-xs font-semibold animate-pulse">
      Đang tải cấu trúc mạng lưới tuyến dưới...
    </div>
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      <PageHeader title="SƠ ĐỒ TUYẾN DƯỚI" />

      {/* Upline Sponsor Card (Người bảo trợ F0) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-sky-50 via-white to-sky-50/50 rounded-2xl border border-sky-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
            F0
          </div>
          <div>
            <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Người Bảo Trợ Trực Tiếp (Tuyến Trên)</div>
            {currentUser?.sponsor ? (
              <div className="font-extrabold text-slate-900 text-sm flex flex-wrap items-center gap-2 mt-0.5">
                <span>{currentUser.sponsor.fullName}</span>
                <span className="text-xs font-mono font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                  Mã: {currentUser.sponsor.userId || currentUser.sponsor.id}
                </span>
                {currentUser.sponsor.phone && (
                  <span className="text-xs font-mono text-slate-600 bg-gray-100 px-2 py-0.5 rounded">
                    SĐT: {currentUser.sponsor.phone}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-xs font-semibold text-slate-500 mt-0.5">Hệ Thống Trực Tiếp (Công Ty)</div>
            )}
          </div>
        </div>
        {currentUser?.sponsor?.businessId && (
          <div className="text-left sm:text-right">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Business ID Sponsor</div>
            <div className="text-xs font-mono font-bold text-slate-800">{currentUser.sponsor.businessId}</div>
          </div>
        )}
      </div>

      {/* Control Bar: Mode Switcher & Zoom Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/70 shadow-xs">
        {/* Switch View Mode */}
        <div className="flex items-center gap-1 p-1 bg-gray-100/90 rounded-xl border border-gray-200/50">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-primary shadow-xs'
                : 'text-gray-500 hover:text-primary'
            }`}
          >
            <ListTree size={14} />
            <span>Danh Sách Gọn</span>
          </button>

          <button
            onClick={() => setViewMode('tree')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'tree'
                ? 'bg-white text-primary shadow-xs'
                : 'text-gray-500 hover:text-primary'
            }`}
          >
            <GitFork size={14} />
            <span>Sơ Đồ Cây</span>
          </button>
        </div>

        {/* Tree Zoom Controls (Only shown in tree view mode) */}
        {viewMode === 'tree' && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Thu phóng:</span>
            <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-xl border border-gray-200/50 text-xs">
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.15))}
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-primary transition-all disabled:opacity-40"
                disabled={zoomLevel <= 0.6}
                title="Thu nhỏ sơ đồ"
              >
                <ZoomOut size={13} />
              </button>
              <span className="px-2 font-mono font-bold text-slate-700 text-[11px] min-w-[42px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(1.2, prev + 0.15))}
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-primary transition-all disabled:opacity-40"
                disabled={zoomLevel >= 1.2}
                title="Phóng to sơ đồ"
              >
                <ZoomIn size={13} />
              </button>
              {zoomLevel !== 1 && (
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-primary transition-all ml-0.5 border-l border-gray-200"
                  title="Đặt lại 100%"
                >
                  <RotateCcw size={12} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rank Legend Strip */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-3 py-2 bg-slate-50/80 rounded-xl border border-slate-200/60 text-xs font-semibold">
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="text-sm">👑</span>
          <span className="text-[11px] font-bold text-amber-900">Quản lý</span>
        </div>
        <span className="text-slate-300">·</span>
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="text-sm">🛡️</span>
          <span className="text-[11px] font-bold text-slate-800">Trưởng nhóm</span>
        </div>
        <span className="text-slate-300">·</span>
        <div className="flex items-center gap-1.5 text-slate-700">
          <span className="text-sm">⭐</span>
          <span className="text-[11px] font-bold text-amber-700">Đại sứ</span>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'list' ? (
        <HierarchyListView tree={tree} />
      ) : (
        <div className="w-full bg-slate-50/50 rounded-2xl border border-slate-200/70 p-4 sm:p-8 overflow-x-auto shadow-inner min-h-[500px]">
          <div 
            className="flex justify-center transition-transform duration-200 ease-out"
            style={{ 
              minWidth: 'max-content',
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
            }}
          >
            {tree.length === 0 ? (
              <div className="text-xs text-slate-400 py-16 text-center">
                Chưa có dữ liệu tuyến dưới.
              </div>
            ) : (
              tree.map(rootNode => (
                <div key={rootNode.id} className="inline-flex justify-center mx-6">
                  <TreeNode node={rootNode} defaultExpanded={true} isRoot={true} />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        .tree-node-card {
          backdrop-filter: blur(12px);
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .tree-node-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </div>
  );
}