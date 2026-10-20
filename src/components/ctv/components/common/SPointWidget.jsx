import React, { useEffect, useState } from 'react';

/**
 * SPointWidget - Phase 2A/2C display-only component
 * Shows S-Point balance and total machines bought for current user
 * Data fetched from GET /api/s-points/:userId
 */
export default function SPointWidget({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/s-points/${userId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data);
        else setError(res.message || 'Không thể tải điểm S');
      })
      .catch(() => setError('Lỗi kết nối'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-24 mb-2" />
        <div className="h-8 bg-gray-100 rounded w-16" />
      </div>
    );
  }

  if (error || !data) {
    return null; // Silent fail - S-Points is supplementary info
  }

  const points = data.sPoints || 0;
  const machines = data.totalMachinesBought || 0;
  const vndValue = (points * 1000).toLocaleString('vi-VN');

  return (
    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-violet-700">Điểm S tích lũy</span>
        <span className="text-xs text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full font-medium">1 điểm = 1.000đ</span>
      </div>
      <div className="flex items-end gap-3">
        <div>
          <p className="text-3xl font-bold text-violet-800">{points.toLocaleString('vi-VN')}</p>
          <p className="text-xs text-violet-600 mt-0.5 font-medium">≈ {vndValue}đ</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-gray-500">Số máy đã mua</p>
          <p className="text-lg font-semibold text-gray-700">{machines} <span className="text-xs font-normal text-gray-400">máy</span></p>
        </div>
      </div>
      {points === 0 && (
        <p className="text-xs text-violet-500 mt-2 italic">
          Điểm S sẽ được cộng sau khi mua thiết bị máy Water King
        </p>
      )}
    </div>
  );
}
