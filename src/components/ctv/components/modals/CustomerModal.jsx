import React, { useState } from 'react';

export default function CustomerModal({ userList, onClose, onSuccess, currentUser }) {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.userId === 'admin';
  const [formData, setFormData] = useState({ fullName: '', phone: '', sourceCtvId: isAdmin ? '' : (currentUser?.id || '') });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/customers', {
        credentials: 'include',
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }).then(r => r.json());

      if (res.success) onSuccess();
      else setError(res.message || 'Lỗi đăng ký pre-check');
    } catch (err) { setError('Lỗi kết nối máy chủ'); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
        <h2 className="text-primary mb-4">Pre-check Khách Mới</h2>
        <form onSubmit={submit} className="flex-col gap-4">
          {error && <div className="text-sm p-2 bg-red-100 text-red-600 rounded">{error}</div>}
          <div className="flex-col gap-1">
            <label className="text-sm font-bold">Họ và Tên Khách</label>
            <input required className="input-field" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Nguyễn Văn A" />
          </div>
          <div className="flex-col gap-1">
            <label className="text-sm font-bold">Số điện thoại (4 số cuối hoặc đủ)</label>
            <input required className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="09xxxx1234" />
          </div>
          <div className="flex-col gap-1">
            <label className="text-sm font-bold">Người Giới Thiệu (CTV)</label>
            {isAdmin ? (
               <select required className="input-field" value={formData.sourceCtvId} onChange={e => setFormData({...formData, sourceCtvId: e.target.value})}>
                 <option value="">-- Chọn CTV --</option>
                 <option value="ROOT">-- Khách của Công Ty --</option>
                 {userList.map(u => <option key={u.id} value={u.id}>{u.name || u.fullName} ({u.tier})</option>)}
               </select>
            ) : (
               <select disabled className="input-field" value={formData.sourceCtvId}>
                 <option value={currentUser.id}>{currentUser.fullName || currentUser.userId}</option>
               </select>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary">Xác Nhận</button>
          </div>
        </form>
      </div>
      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50; display: flex; align-items: center; justify-content: center; }
        .input-field { padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-subtle); background: var(--bg-primary); width: 100%; outline: none; }
        .input-field:focus { border-color: var(--accent-blue); }
      `}</style>
    </div>
  )
}
