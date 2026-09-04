import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader.jsx';
import TreeNode from '../components/network/TreeNode.jsx';

export default function NetworkView({ refreshKey, currentUser }) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tree')
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

  if (loading) return <div className="text-muted p-4">Đang tải biểu đồ mạng lưới...</div>;

  return (
    <div className="flex-col gap-6">
      <PageHeader title="Sơ đồ Cây 3 Cấp Nhóm" subtitle="Dữ liệu phân nhánh trực tiếp từ hệ thống." />
      
      <div className="card glass-panel flex flex-col network-tree-card" style={{ overflowX: 'auto', paddingBottom: '20px', alignItems: 'flex-start' }}>
        <div className="tree-container flex" style={{ minWidth: 'min-content', padding: '0 20px' }}>
          {tree.map(rootNode => (
             <div key={rootNode.id} style={{ display: 'inline-flex', marginRight: '40px' }}>
                <TreeNode node={rootNode} defaultExpanded={true} />
             </div>
          ))}
        </div>
      </div>
      <style>{`
        .tree-node {
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s, box-shadow 0.2s;
          border: 1px solid rgba(255,255,255,0.6);
        }
        .tree-node:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .diamond-node { border-left: 4px solid var(--accent-diamond); background: #F0F9FF; }
        .gold-node { border-left: 4px solid var(--accent-gold); background: #FFFBEB; }
        .silver-node { border-left: 4px solid #94A3B8; background: #F8FAFC; }
      `}</style>
    </div>
  );
}
