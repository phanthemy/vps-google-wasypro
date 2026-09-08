import React, { useState } from 'react';
import { Key } from 'lucide-react';

export default function ChangePasswordModal({ currentUser, onClose }) {
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch(`/api/users/${currentUser.id}/password`, {
      credentials: 'include',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword, isForce: false })
    }).then(r=>r.json()).catch(() => ({ success: false, message: 'Lỗi mạng' }));
    
    setLoading(false);
    if (res.success) {
      alert('Đổi mật khẩu thành công!');
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="modal-overlay z-50">
      <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
        <h2 className="text-primary mb-4 flex items-center gap-2"><Key size={20} /> Đổi Mật Khẩu Cá Nhân</h2>
        <form onSubmit={submit} className="flex-col gap-4">
          {error && <div className="text-sm p-2 bg-red-100 text-red-600 rounded">{error}</div>}
          <div className="flex-col gap-1">
            <label className="text-sm font-bold">Mật khẩu Hiện tại</label>
            <input required type="password" className="input-field" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Nhập mật khẩu hiện tại" />
          </div>
          <div className="flex-col gap-1">
            <label className="text-sm font-bold">Mật khẩu Mới</label>
            <input required type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Nhập mật khẩu mới" minLength="3" />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>Lưu Mật khẩu</button>
          </div>
        </form>
      </div>
    </div>
  );
}
