import React, { useState, useEffect } from 'react';
import PageHeader from '../components/common/PageHeader.jsx';

export default function SettingsView() {
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then(r => r.json())
      .then(res => res.success && setConfig(res.data));
  }, []);

  const handleUpdate = (tier, category, value) => {
    const num = parseFloat(value);
    setConfig(prev => ({
      ...prev,
      [tier]: { ...prev[tier], [category]: isNaN(num) ? 0 : num / 100 }
    }));
  };

  const saveConfig = async () => {
    setSaving(true);
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    setSaving(false);
    alert('Đã lưu cấu hình Hoa Hồng thành công!');
  };

  if (!config) return <div className="text-muted p-4">Đang tải cấu hình...</div>;

  return (
    <div className="flex-col gap-6" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '1rem', width: '100%' }}>
        <PageHeader title="Cấu Hình Cơ Chế & Thưởng" subtitle="Tỉ lệ (%) Hoa hồng chốt Sale trực tiếp theo từng Cấp Bậc." />
        <button className="btn btn-primary" onClick={saveConfig} disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu Cơ Chế'}
        </button>
      </div>

      <div className="card glass-panel flex-col gap-5">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Chức Danh</th>
              <th>Giới thiệu (%)</th>
              <th>Nhập 1 Máy (%)</th>
              <th>Nhập 5 Máy (%)</th>
              <th>Nhập 10 Máy (%)</th>
              <th>Nhập 20 Máy (%)</th>
            </tr>
          </thead>
          <tbody>
            {[{id: 'DIAMOND', name: 'Giám đốc PT'}, {id: 'GOLD', name: 'Quản lý PT'}, {id: 'SILVER', name: 'Đại sứ KD'}].map(tier => (
              <tr key={tier.id}>
                <td className={`font-bold ${tier.id === 'DIAMOND' ? 'text-diamond' : tier.id === 'GOLD' ? 'text-gold' : 'text-silver'}`}>
                  {tier.name}
                </td>
                <td>
                  <input type="number" className="input-field" style={{ width: '80px' }} 
                    value={Math.round((config[tier.id]?.['referral'] || 0) * 100)} 
                    onChange={e => handleUpdate(tier.id, 'referral', e.target.value)} 
                  />
                </td>
                <td>
                  <input type="number" className="input-field" style={{ width: '80px' }} 
                    value={Math.round((config[tier.id]?.['1'] || 0) * 100)} 
                    onChange={e => handleUpdate(tier.id, '1', e.target.value)} 
                  />
                </td>
                <td>
                  <input type="number" className="input-field" style={{ width: '80px' }} 
                    value={Math.round((config[tier.id]?.['5'] || 0) * 100)} 
                    onChange={e => handleUpdate(tier.id, '5', e.target.value)} 
                  />
                </td>
                <td>
                  <input type="number" className="input-field" style={{ width: '80px' }} 
                    value={Math.round((config[tier.id]?.['10'] || 0) * 100)} 
                    onChange={e => handleUpdate(tier.id, '10', e.target.value)} 
                  />
                </td>
                <td>
                  <input type="number" className="input-field" style={{ width: '80px' }} 
                    value={Math.round((config[tier.id]?.['20'] || 0) * 100)} 
                    onChange={e => handleUpdate(tier.id, '20', e.target.value)} 
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-sm text-muted mt-2">
          * Ghi chú: Cấu hình tỷ lệ % tự động áp dụng theo số lượng máy chốt trong 1 đơn hàng (Phân biệt Giới thiệu và Nhập sỉ).
        </div>
      </div>
    </div>
  );
}
