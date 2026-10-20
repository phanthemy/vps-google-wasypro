import React, { useState, useEffect } from 'react';
import { UserCog } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';

export default function SystemUsersView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ fullName: '', phone: '', role: 'accountant', password: '' });
  const [error, setError] = useState('');

  const loadUsers = () => {
    setLoading(true);
    fetch('/api/internal-users', { credentials: 'include' }).then(r => r.json()).then(res => {
      if (res.success) setUsers(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const url = editingUser ? '/api/internal-users/' + editingUser.userId : '/api/internal-users';
      const method = editingUser ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      }).then(r => r.json());
      if (res.success) {
        setFormData({ fullName: '', phone: '', role: 'accountant', password: '' });
        setEditingUser(null);
        loadUsers();
      } else setError(res.message || 'Lỗi server');
    } catch(e) { setError('Lỗi kết nối'); }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setFormData({ fullName: '', phone: '', role: 'accountant', password: '' });
    setError('');
  };

  const ROLE_MAP = {
    'admin': 'Admin Hệ thống',
    'accountant': 'Kế toán',
    'marketing': 'Marketing'
  };

  if (loading) return <div className="p-4 text-muted">Đang tải danh sách...</div>;

  return (
    <div className="flex-col gap-6">
      <PageHeader title="Quản lý Tài Khoản Nội Bộ" subtitle="Tạo tài khoản và cấp quyền cho Kế toán, Marketing..." />
      
      <div className="card glass-panel" style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
        <h3 className="text-primary font-bold mb-4 flex items-center gap-2"><UserCog size={18}/> {editingUser ? `Chỉnh sửa: ${editingUser.fullName}` : `Khởi tạo Tài khoản Mới`}</h3>
        <form onSubmit={handleSubmit} className="flex-col gap-3">
          {error && <div className="bg-red-100 text-red-600 p-2 text-sm rounded">{error}</div>}
          <div className="flex-col gap-1">
            <label className="text-sm font-bold">Họ và Tên</label>
            <input required className="input-field" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="Nguyễn Văn Kế Toán" />
          </div>
          <div className="flex-col gap-1">
            <label className="text-sm font-bold">Số điện thoại (Tên đăng nhập)</label>
            <input required className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="0888..." />
          </div>
          <div className="flex-col gap-1">
            <label className="text-sm font-bold">Mật khẩu {editingUser && "(Để trống nếu không đổi)"}</label>
            <input className="input-field" type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={editingUser ? "Không đổi thì bỏ trống..." : "123456"} required={!editingUser} />
          </div>
          <div className="flex-col gap-1">
            <label className="text-sm font-bold">Phân Quyền</label>
            <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="accountant">Kế toán (Quản lý thu chi)</option>
              <option value="marketing">Marketing (Quản trị CTV)</option>
              <option value="admin">Quản trị viên (Toàn quyền)</option>
            </select>
          </div>
          <div className="flex gap-2 mt-2">{editingUser && <button type="button" onClick={() => { setEditingUser(null); setFormData({ fullName: '', phone: '', role: 'accountant', password: '' }); setError(''); }} className="btn btn-secondary flex-1">Hủy</button>}<button type="submit" className="btn btn-primary flex-1">{editingUser ? 'Cập nhật' : 'Tạo Tài Khoản'}</button></div>
        </form>
      </div>

      <div className="card glass-panel flex-col gap-4" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <h3 className="text-primary font-bold">Danh sách Nhân Sự Hệ Thống</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="premium-table w-full">
            <thead>
              <tr>
                <th>Họ Tên</th>
                <th>SĐT (Đăng nhập)</th>
                <th>Phân Quyền</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="font-bold text-primary">{u.fullName}</td>
                  <td className="font-mono text-secondary">{u.phone}</td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                      {ROLE_MAP[u.role] || u.role}
                    </span>
                  </td>
                  <td className="text-sm text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={async () => {
                        const newPass = prompt(`Nhập mật khẩu mới cho ${u.fullName}:`, "123456");
                        if (newPass && newPass.length >= 3) {
                          const res = await fetch(`/api/internal-users/${u.userId}`, {
                            credentials: 'include',
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ password: newPass })
                          }).then(r=>r.json());
                          if (res.success) alert('Thành công!');
                          else alert('Lỗi: ' + res.message);
                        }
                      }}
                      className="btn btn-secondary text-xs" style={{ padding: '0.25rem 0.5rem' }}>Chỉnh sửa</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan="5" className="text-center p-4 text-muted">Chưa có tài khoản nội bộ nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
