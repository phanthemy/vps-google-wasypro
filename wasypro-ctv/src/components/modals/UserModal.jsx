import React, { useState } from 'react';

export default function UserModal({ userList, editingUser, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ 
    fullName: editingUser ? (editingUser.name || '') : '', 
    phone: editingUser ? (editingUser.phone || '') : '', 
    tier: editingUser ? (editingUser.tier || 'SILVER') : 'SILVER', 
    parentId: editingUser ? (editingUser.parentId || (editingUser.parent && editingUser.parent.includes('(') ? editingUser.parent.substring(editingUser.parent.indexOf('(')+1, editingUser.parent.indexOf(')')) : '')) : '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }).then(r => r.json());

      if (res.success) onSuccess();
      else setError(res.message || 'Lỗi lưu thông tin CTV');
    } catch (err) { setError('Lỗi kết nối máy chủ'); }
    finally { setLoading(false); }
  };

  const selectableParents = userList.filter(u => !editingUser || u.id !== editingUser.id);

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
        <h2 className="text-primary mb-4">{editingUser ? `Chỉnh sửa CTV: ${editingUser.id}` : 'Tạo Cộng Tác Viên'}</h2>
        <form onSubmit={submit} className="flex-col gap-4">
          {error && <div className="text-sm p-2 bg-red-100 text-red-600 rounded">{error}</div>}
          <div className="flex-col gap-1">
            <label className="text-sm font-bold">Họ và Tên</label>
            <input required className="input-field" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Nguyễn Văn A" />
          </div>
          <div className="flex-col gap-1">
            <label className="text-sm font-bold">Số điện thoại</label>
            <input required className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="09..." />
          </div>
          <div className="flex-col gap-1">
            <label className="text-sm font-bold">Mật khẩu {editingUser && '(Bỏ trống nếu không muốn đổi)'}</label>
            <input type="text" className="input-field" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={editingUser ? "Không đổi thì bỏ trống..." : "123456"} />
          </div>
          <div className="flex-col gap-1">
            <label className="text-sm font-bold">Cấp Bậc</label>
            <select className="input-field" value={formData.tier} onChange={e => setFormData({...formData, tier: e.target.value})}>
              <option value="SILVER">Đại sứ KD (Silver)</option>
              <option value="GOLD">Quản lý PT (Gold)</option>
              <option value="DIAMOND">Giám đốc PT (Diamond)</option>
            </select>
          </div>
          <div className="flex-col gap-1">
            <label className="text-sm font-bold">Người Giới Thiệu (Tuyến trên)</label>
            <select className="input-field" value={formData.parentId} onChange={e => setFormData({...formData, parentId: e.target.value})}>
              <option value="">-- Trực tiếp Công ty --</option>
              {selectableParents.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.tier === 'DIAMOND' ? 'Giám đốc PT' : u.tier === 'GOLD' ? 'Quản lý PT' : 'Đại sứ KD'})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-between mt-4">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Huỷ bỏ</button>
            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Đang lưu...' : (editingUser ? 'Cập nhật Dữ liệu' : 'Lưu Hệ thống')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
