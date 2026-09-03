import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader.jsx';

export default function SystemLogsView({ currentUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit-logs').then(r => r.json()).then(res => {
      if (res.success) setLogs(res.data);
      setLoading(false);
    });
  }, []);

  const STATUS_MAP = {
    'NEW': { label: 'Pre-check', bg: '#E2E8F0', color: '#475569' },
    'CONSULTED': { label: 'Đã tư vấn', bg: '#DBEAFE', color: '#1E40AF' },
    'DEPOSITED': { label: 'Đã cọc', bg: '#FEF3C7', color: '#B45309' },
    'DONE': { label: 'Đã làm', bg: '#D1FAE5', color: '#065F46' },
    'POST_OP': { label: 'Hậu phẫu', bg: '#FCE7F3', color: '#9D174D' },
    'ARRIVED': { label: 'Đã có Đơn', bg: '#FEF3C7', color: '#B45309' }
  };

  if (loading) return <div className="p-4 text-muted">Đang tải lịch sử...</div>;

  const filteredLogs = currentUser?.role === 'accountant'
    ? logs.filter(l => !l.userId?.toUpperCase().includes('(ADM'))
    : logs;

  return (
    <div className="flex-col gap-6">
      <PageHeader title="Lịch Sử Thao Tác Hệ Thống" subtitle="Ghi nhận mọi sự thay đổi đối với dữ liệu từ các tài khoản nội bộ." />
      
      <div className="card glass-panel flex-col gap-4" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="premium-table w-full">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Người thực hiện</th>
                <th>Khách hàng thao tác</th>
                <th>Chi tiết Thay đổi</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => {
                 let detailsObj = {};
                 try { detailsObj = JSON.parse(log.details); } catch(e){}
                 
                 return (
                   <tr key={idx}>
                     <td className="text-sm text-secondary whitespace-nowrap">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                     <td className="font-mono text-xs font-bold text-blue-500">{log.userId}</td>
                     <td className="font-bold">{log.customer?.fullName} <span className="text-muted font-normal text-xs">({log.customer?.phone})</span></td>
                     <td>
                        {log.action === 'UPDATE_STATUS' && (
                           <span className="text-sm">
                             Đã đổi trạng thái từ{' '}
                             <span className="font-bold text-muted">{STATUS_MAP[detailsObj.from]?.label || detailsObj.from}</span>{' '}
                             ➡{' '}
                             <span className="font-bold text-primary">{STATUS_MAP[detailsObj.to]?.label || detailsObj.to}</span>
                           </span>
                        )}
                        {log.action !== 'UPDATE_STATUS' && <span className="text-sm text-muted">{log.action}</span>}
                     </td>
                   </tr>
                 )
              })}
              {logs.length === 0 && <tr><td colSpan="4" className="text-center p-4 text-muted">Chưa có lịch sử.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
