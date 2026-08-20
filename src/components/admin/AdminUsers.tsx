import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Key,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '../../services/api';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create user modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: '', name: '', role: 'admin' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit user modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ email: '', name: '', role: 'admin', isActive: true });
  const [editing, setEditing] = useState(false);

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Delete confirm
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.email || !createForm.password || !createForm.name) {
      setCreateError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await api.createAdminUser(createForm);
      setShowCreateModal(false);
      setCreateForm({ email: '', password: '', name: '', role: 'admin' });
      setSuccess('Tạo tài khoản thành công!');
      fetchUsers();
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditing(true);
    try {
      await api.updateAdminUser(editingUser.id, editForm);
      setShowEditModal(false);
      setSuccess('Cập nhật tài khoản thành công!');
      fetchUsers();
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setEditing(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUser) return;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setCreateError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (passwordForm.newPassword.length < 4) {
      setCreateError('Mật khẩu phải có ít nhất 4 ký tự');
      return;
    }
    setChangingPassword(true);
    setCreateError(null);
    try {
      await api.changePassword(passwordUser.id, '', passwordForm.newPassword);
      setShowPasswordModal(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setSuccess('Đổi mật khẩu thành công!');
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      await api.deleteAdminUser(deletingUser.id);
      setShowDeleteModal(false);
      setSuccess('Đã xóa tài khoản!');
      fetchUsers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({ email: user.email, name: user.name, role: user.role, isActive: user.isActive });
    setShowEditModal(true);
    setCreateError(null);
  };

  const openPasswordModal = (user: AdminUser) => {
    setPasswordUser(user);
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
    setCreateError(null);
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case 'superadmin': return { label: 'Super Admin', icon: ShieldAlert, color: 'text-red-400 bg-red-500/10' };
      case 'admin': return { label: 'Admin', icon: ShieldCheck, color: 'text-ocean-400 bg-ocean-500/10' };
      case 'editor': return { label: 'Biên tập', icon: Shield, color: 'text-emerald-400 bg-emerald-500/10' };
      default: return { label: role, icon: Shield, color: 'text-slate-400 bg-slate-500/10' };
    }
  };

  // Auto-dismiss success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ocean-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-ocean-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Quản Lý Tài Khoản</h2>
            <p className="text-xs text-slate-500">Tạo, sửa, xóa tài khoản quản trị viên</p>
          </div>
        </div>
        <button
          onClick={() => { setShowCreateModal(true); setCreateError(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-ocean-500 hover:bg-ocean-600 text-white rounded-xl text-sm font-bold transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Tạo Tài Khoản
        </button>
      </div>

      {/* Success/Error alerts */}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-bold">
          <CheckCircle2 className="w-4 h-4" /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-bold">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-ocean-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="py-3 px-5 text-left text-xs font-bold text-slate-500 uppercase">Tên</th>
                <th className="py-3 px-5 text-left text-xs font-bold text-slate-500 uppercase">Email</th>
                <th className="py-3 px-5 text-left text-xs font-bold text-slate-500 uppercase">Vai Trò</th>
                <th className="py-3 px-5 text-left text-xs font-bold text-slate-500 uppercase">Trạng Thái</th>
                <th className="py-3 px-5 text-right text-xs font-bold text-slate-500 uppercase">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-sm">Chưa có tài khoản nào</td></tr>
              ) : users.map(user => {
                const role = roleLabel(user.role);
                const RoleIcon = role.icon;
                return (
                  <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-5 font-bold text-sm text-slate-800">{user.name}</td>
                    <td className="py-3 px-5 text-sm text-slate-600">{user.email}</td>
                    <td className="py-3 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${role.color}`}>
                        <RoleIcon className="w-3 h-3" /> {role.label}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${user.isActive ? 'text-emerald-600 bg-emerald-50' : 'text-red-500 bg-red-50'}`}>
                        {user.isActive ? '✓ Hoạt động' : '✕ Vô hiệu'}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditModal(user)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Sửa">
                          <Edit3 className="w-4 h-4 text-slate-500" />
                        </button>
                        <button onClick={() => openPasswordModal(user)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Đổi mật khẩu">
                          <Key className="w-4 h-4 text-amber-500" />
                        </button>
                        <button onClick={() => { setDeletingUser(user); setShowDeleteModal(true); }} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Tạo Tài Khoản Mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {createError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" />{createError}</div>}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Họ và tên *</label>
                <input type="text" value={createForm.name} onChange={e => setCreateForm({...createForm, name: e.target.value})} placeholder="Nguyễn Văn A"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email *</label>
                <input type="email" value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} placeholder="admin@wasypro.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Mật khẩu *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} placeholder="Nhập mật khẩu"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 pr-10" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Vai trò</label>
                <select value={createForm.role} onChange={e => setCreateForm({...createForm, role: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500">
                  <option value="admin">Admin</option>
                  <option value="editor">Biên tập viên</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <button type="submit" disabled={creating} className="w-full py-3 bg-ocean-500 hover:bg-ocean-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {creating ? 'Đang tạo...' : 'Tạo Tài Khoản'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Sửa Tài Khoản</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              {createError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" />{createError}</div>}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Họ và tên</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Vai trò</label>
                <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500">
                  <option value="admin">Admin</option>
                  <option value="editor">Biên tập viên</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isActive" checked={editForm.isActive} onChange={e => setEditForm({...editForm, isActive: e.target.checked})} className="rounded" />
                <label htmlFor="isActive" className="text-sm font-bold text-slate-700">Tài khoản hoạt động</label>
              </div>
              <button type="submit" disabled={editing} className="w-full py-3 bg-ocean-500 hover:bg-ocean-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {editing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
                {editing ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && passwordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Đổi Mật Khẩu</h3>
                <p className="text-xs text-slate-500 mt-1">Cho tài khoản: {passwordUser.email}</p>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {createError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" />{createError}</div>}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Mật khẩu mới *</label>
                <input type={showPassword ? 'text' : 'password'} value={passwordForm.newPassword} onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})} placeholder="Nhập mật khẩu mới"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Xác nhận mật khẩu *</label>
                <input type={showPassword ? 'text' : 'password'} value={passwordForm.confirmPassword} onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} placeholder="Nhập lại mật khẩu"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500" required />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} /> Hiện mật khẩu
              </label>
              <button type="submit" disabled={changingPassword} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                {changingPassword ? 'Đang đổi...' : 'Đổi Mật Khẩu'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Xóa Tài Khoản?</h3>
            <p className="text-sm text-slate-500 mb-6">Bạn có chắc muốn xóa tài khoản <strong>{deletingUser.email}</strong>? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Hủy</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
