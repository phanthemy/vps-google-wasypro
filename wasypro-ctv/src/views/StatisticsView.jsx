import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function StatisticsView({ currentUser, userList }) {
  const [data, setData] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all');
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });
  const [userId, setUserId] = useState(currentUser?.role === 'admin' ? '' : currentUser?.id);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/statistics?timeFilter=${timeFilter}&period=${period}&userId=${userId}`)
      .then(r => r.json())
      .then(res => {
         if(res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [timeFilter, period, userId]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff7300', '#eb4d4b', '#6ab04c', '#f0932b'];

  return (
    <div className="flex-col gap-6">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center', background: 'rgba(2, 6, 23, 0.6)', padding: '12px 24px', borderRadius: '16px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ color: 'var(--accent-diamond)', fontSize: '1.8rem', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Thống Kê Bán Hàng</h2>
          <p style={{ color: '#e2e8f0', fontSize: '0.95rem', margin: '4px 0 0' }}>Phân tích tỷ trọng sản phẩm chốt Sale theo doanh thu.</p>
        </div>
        <div className="flex gap-4 items-center" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            {currentUser?.role === 'admin' && (
               <select className="input-field" value={userId} onChange={e => setUserId(e.target.value)} style={{ padding: '6px' }}>
                  <option value="">-- Tất cả CTV --</option>
                  {userList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
               </select>
            )}
            <select className="input-field" value={timeFilter} onChange={e => setTimeFilter(e.target.value)} style={{ padding: '6px' }}>
               <option value="all">Toàn Thời Gian</option>
               <option value="month">Theo Tháng</option>
               <option value="quarter">Theo Quý</option>
            </select>
            
            {timeFilter === 'month' && (
               <input type="month" className="input-field" value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '6px' }} />
            )}
            {timeFilter === 'quarter' && (
               <select className="input-field" value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '6px' }}>
                  <option value="2026-1">Quý 1 / 2026</option>
                  <option value="2026-2">Quý 2 / 2026</option>
                  <option value="2026-3">Quý 3 / 2026</option>
                  <option value="2026-4">Quý 4 / 2026</option>
               </select>
            )}
        </div>
      </div>

      <div className="card glass-panel" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
         {loading ? <div className="text-muted">Đang phân tích dữ liệu...</div> : data.length === 0 ? <div className="text-muted">Không có dữ liệu bán hàng.</div> : (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={130}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)} />
              </PieChart>
            </ResponsiveContainer>
         )}
      </div>
    </div>
  )
}
