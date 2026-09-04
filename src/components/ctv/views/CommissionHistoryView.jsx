import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import CommissionRuleTag from '../components/common/CommissionRuleTag.jsx';

export default function CommissionHistoryView({ currentUser, setActiveTab }) {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaxes, setShowTaxes] = useState(false);

  useEffect(() => {
    const fetchId = (currentUser.role === 'admin' || currentUser.role === 'accountant' || currentUser.id === 'ADMIN' || currentUser.id === 'ACCOUNTANT') ? 'ADMIN' : currentUser.id;
    fetch(`/api/commissions?userId=${fetchId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCommissions(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [currentUser]);

  if (loading) return <div className="p-8 text-center text-primary">Đang tải sao kê...</div>;

  const groupedCommissions = [];
  const groups = {};
  commissions.forEach(c => {
      const key = c.orderId ? `${c.orderId}_${c.type}` : c.id;
      if (!groups[key]) {
         groups[key] = { ...c };
      } else {
         groups[key].amount += c.amount;
      }
  });
  Object.values(groups).forEach(c => groupedCommissions.push(c));
  groupedCommissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-6">
      <div className="card glass-panel text-center">
        <h2 className="text-xl font-bold text-primary mb-2">Sao Kê Chi Tiết Dòng Tiền</h2>
        <p className="text-sm text-secondary">
          Bảng liệt kê toàn bộ lịch sử hoa hồng bạn nhận được từ hệ thống
        </p>
        <div className="flex justify-center mt-4">
            <label className="flex items-center gap-1 text-sm font-bold text-muted cursor-pointer">
                <input type="checkbox" checked={showTaxes} onChange={e => setShowTaxes(e.target.checked)} />
                Áp dụng Thuế & Phí (11%)
            </label>
        </div>
      </div>

      <div className="card glass-panel">
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="w-full text-left" style={{ minWidth: '600px' }}>
            <thead>
              <tr className="border-b border-gray-700 text-secondary">
                <th className="py-3 px-4 font-medium" style={{ whiteSpace: 'nowrap' }}>Thời Gian</th>
                <th className="py-3 px-4 font-medium" style={{ whiteSpace: 'nowrap' }}>Loại Chiết Khấu</th>
                <th className="py-3 px-4 font-medium" style={{ whiteSpace: 'nowrap' }}>Policy</th>
                <th className="py-3 px-4 font-medium" style={{ whiteSpace: 'nowrap' }}>Tỷ lệ</th>
                <th className="py-3 px-4 font-medium" style={{ whiteSpace: 'nowrap' }}>Khách Hàng Áp Dụng</th>
                <th className="py-3 px-4 font-medium" style={{ whiteSpace: 'nowrap' }}>Mã Đơn Hàng</th>
                <th className="py-3 px-4 font-medium" style={{ whiteSpace: 'nowrap' }}>Đơn Hàng</th>
                <th className="py-3 px-4 font-medium text-right" style={{ whiteSpace: 'nowrap' }}>Hoa Hồng Gộp</th>
                {showTaxes && (
                  <>
                    <th className="py-3 px-4 font-medium text-right" style={{ whiteSpace: 'nowrap' }}>Thuế TNCN (10%)</th>
                    <th className="py-3 px-4 font-medium text-right" style={{ whiteSpace: 'nowrap' }}>Phí Nền Tảng (1%)</th>
                    <th className="py-3 px-4 font-medium text-right" style={{ whiteSpace: 'nowrap' }}>Thực Nhận</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {groupedCommissions.length === 0 ? (
                <tr>
                  <td colSpan={showTaxes ? 11 : 8} className="py-8 text-center text-secondary">
                    Chưa có phát sinh hoa hồng nào.
                  </td>
                </tr>
              ) : (
                groupedCommissions.map(c => {
                  let typeText = 'Không rõ';
                  let typeColor = 'var(--text-primary)';
                  if (c.type === 'DIRECT') { typeText = 'Hoa hồng Trực tiếp'; typeColor = '#3b82f6'; }
                  if (c.type === 'OVERRIDE') { typeText = 'Hoa hồng Cắt cầu (Tuyến dưới)'; typeColor = '#f59e0b'; }
                  if (c.type === 'SPECIAL_BONUS_120M') { typeText = 'Thưởng Vượt Mốc 120M'; typeColor = '#ec4899'; }

                  const dt = new Date(c.createdAt).toLocaleString('vi-VN');
                  const amt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.amount);
                  const customerName = c.order?.customer?.fullName || 'Khách Vãng Lai';
                  const orderVal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.order?.totalAmount || 0);
                  const serviceNames = c.order?.items?.map(i => i.service?.name).join(', ') || 'Sản Phẩm rỗng';

                  return (
                    <tr key={c.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 text-sm text-secondary">{dt}</td>
                      <td className="py-4 px-4 font-medium" style={{ color: typeColor }}>{typeText}</td>
                      <td className="py-4 px-4">
                        <CommissionRuleTag policyRef={c.policyRef} size="sm" />
                      </td>
                      <td className="py-4 px-4 text-sm text-center">
                        {c.rateSnapshot ? <span className="text-green-400 font-semibold">{c.rateSnapshot}%</span> : <span className="text-muted">-</span>}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-secondary" />
                          <span>{customerName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold">
                         {c.orderId ? (
                            <span 
                               className="text-blue-500 hover:text-blue-400 cursor-pointer hover:underline"
                               onClick={() => {
                                  navigator.clipboard.writeText(c.orderId.slice(0, 8).toUpperCase());
                                  alert(`Đã copy mã đơn hàng: ${c.orderId.slice(0, 8).toUpperCase()}`);
                                  setActiveTab('orders');
                               }}
                               title="Click để copy mã và chuyển sang Quản lý Đơn hàng"
                            >
                               #{c.orderId.slice(0, 8).toUpperCase()}
                            </span>
                         ) : <span className="text-muted">N/A</span>}
                      </td>
                      <td className="py-4 px-4 text-sm text-secondary">Trị giá: {orderVal}</td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-diamond text-lg" style={{ textShadow: '0 0 10px rgba(0,240,255,0.3)' }}>
                          {amt}
                        </span>
                      </td>
                      {showTaxes && (
                        <>
                          <td className="py-4 px-4 text-right">
                            <span className="text-red-500 font-bold text-sm">
                              -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.amount * 0.1)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-amber-500 font-bold text-sm">
                              {c.type === 'DIRECT' ? '-' + new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((c.order?.totalAmount || 0) * 0.01) : '-'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-bold text-green-500 text-lg">
                              +{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((c.amount * 0.9) - (c.type === 'DIRECT' ? (c.order?.totalAmount || 0) * 0.01 : 0))}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
