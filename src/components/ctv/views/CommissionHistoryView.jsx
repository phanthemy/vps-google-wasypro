import React, { useState, useEffect } from 'react';
import { User, Layers, ArrowUpRight } from 'lucide-react';
import CommissionRuleTag from '../components/common/CommissionRuleTag.jsx';

const vnd = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

export default function CommissionHistoryView({ currentUser, setActiveTab }) {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/commissions?userId=${currentUser.id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setCommissions(res.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [currentUser]);

  if (loading) return <div className="p-8 text-center text-primary">Đang tải sao kê...</div>;

  const groupedCommissions = [...commissions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-6">
      <div className="card glass-panel text-center p-6">
        <h2 className="text-xl font-bold text-primary mb-2">Sao Kê Chi Tiết Dòng Tiền & Hoa Hồng</h2>
        <p className="text-sm text-secondary">
          Minh bạch toàn bộ dòng tiền hoa hồng theo cơ chế chuẩn Phase 2C
        </p>
      </div>

      <div className="card glass-panel p-4">
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="w-full text-left" style={{ minWidth: '850px' }}>
            <thead>
              <tr className="border-b border-gray-700 text-secondary text-xs uppercase tracking-wider">
                <th className="py-3 px-3 font-semibold">Thời Gian</th>
                <th className="py-3 px-3 font-semibold">Quy Tắc</th>
                <th className="py-3 px-3 font-semibold text-right">Điểm Cơ Sở</th>
                <th className="py-3 px-3 font-semibold text-center">Tỷ Lệ</th>
                <th className="py-3 px-3 font-semibold text-right">Điểm Nhận</th>
                <th className="py-3 px-3 font-semibold">Khách Hàng</th>
                <th className="py-3 px-3 font-semibold">Mã Đơn</th>
                <th className="py-3 px-3 font-semibold text-right">Hoa Hồng</th>
              </tr>
            </thead>
            <tbody>
              {groupedCommissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-secondary">
                    Chưa có phát sinh hoa hồng nào.
                  </td>
                </tr>
              ) : (
                groupedCommissions.map(c => {
                  const dt = new Date(c.createdAt).toLocaleString('vi-VN');
                  const customerName = c.order?.customer?.fullName || 'Khách Vãng Lai';
                  const basePts = c.basePoints != null ? c.basePoints : (c.baseAmount ? Math.round(c.baseAmount / 1000) : '-');
                  const earnedPts = c.earnedPoints != null ? c.earnedPoints : (c.amount ? Math.round(c.amount / 1000) : 0);
                  const moneyAmount = c.earnedMoney != null ? c.earnedMoney : c.amount;
                  const ruleKey = c.ruleKey || c.policyRef || c.type || 'DIRECT';

                  return (
                    <tr key={c.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors text-sm">
                      <td className="py-3.5 px-3 text-secondary text-xs whitespace-nowrap">{dt}</td>
                      <td className="py-3.5 px-3">
                        <CommissionRuleTag policyRef={ruleKey} size="sm" />
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-secondary">
                        {typeof basePts === 'number' ? basePts.toLocaleString('vi-VN') : basePts}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {c.rateSnapshot ? (
                          <span className="text-green-400 font-semibold">{c.rateSnapshot}%</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-yellow-300">
                        {typeof earnedPts === 'number' ? `+${earnedPts.toLocaleString('vi-VN')}` : earnedPts}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <User size={14} className="text-secondary shrink-0" />
                          <span className="truncate max-w-[140px]" title={customerName}>{customerName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs">
                        {c.orderId ? (
                          <span
                            className="text-blue-400 hover:text-blue-300 cursor-pointer hover:underline"
                            onClick={() => {
                              navigator.clipboard.writeText(c.orderId.slice(0, 8).toUpperCase());
                              alert(`Đã sao chép mã đơn: ${c.orderId.slice(0, 8).toUpperCase()}`);
                              if (setActiveTab) setActiveTab('orders');
                            }}
                            title="Bấm để sao chép mã đơn"
                          >
                            #{c.orderId.slice(0, 8).toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span className="font-bold text-diamond text-base">
                          {vnd(moneyAmount)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
