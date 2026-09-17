import React, { useState, useEffect } from 'react';
import { GitFork, ListTree } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import TreeNode from '../components/network/TreeNode.jsx';
import HierarchyListView from '../components/network/HierarchyListView.jsx';

export default function NetworkView({ refreshKey, currentUser }) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  
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

  if (loading) return <div className="text-muted p-4">Đang tải sơ đồ tuyến dưới...</div>;

  return (
    <div className="flex flex-col gap-4 w-full">
      <PageHeader title="SƠ ĐỒ TUYẾN DƯỚI" />

      {/* View Mode Switcher */}
      <div className="flex items-center justify-center gap-1 p-1 bg-gray-100/80 backdrop-blur-md rounded-xl max-w-xs mx-auto border border-gray-200/60 shadow-xs">
        <button
          onClick={() => setViewMode('list')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'list'
              ? 'bg-white text-primary shadow-sm scale-[1.02]'
              : 'text-gray-500 hover:text-primary'
          }`}
        >
          <ListTree size={14} />
          <span>Danh Sách Gọn</span>
        </button>

        <button
          onClick={() => setViewMode('tree')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'tree'
              ? 'bg-white text-primary shadow-sm scale-[1.02]'
              : 'text-gray-500 hover:text-primary'
          }`}
        >
          <GitFork size={14} />
          <span>Sơ Đồ Cây</span>
        </button>
      </div>

      {/* View Content */}
      {viewMode === 'list' ? (
        <HierarchyListView tree={tree} />
      ) : (
        <div className="card glass-panel flex flex-col network-tree-card" style={{ overflowX: 'auto', paddingBottom: '20px', alignItems: 'flex-start' }}>
          <div className="tree-container flex" style={{ minWidth: 'min-content', padding: '0 20px' }}>
            {tree.map(rootNode => (
               <div key={rootNode.id} style={{ display: 'inline-flex', marginRight: '40px' }}>
                  <TreeNode node={rootNode} defaultExpanded={true} />
               </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .tree-node {
          border-radius: 12px;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .tree-node:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}
