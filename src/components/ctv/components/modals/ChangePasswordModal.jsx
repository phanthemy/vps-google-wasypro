import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';

export default function ChangePasswordModal({ currentUser, onClose }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/users/${currentUser.id}/password`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword, isForce: false })
      });
      const data = await res.json();
      
      setLoading(false);
      if (data.success) {
        setSuccessMsg('Đổi mật khẩu thành công!');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setLoading(false);
      setError('Lỗi mạng');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-[Inter]">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[400px] p-6 flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#E5F1FF]">
            <KeyRound size={20} className="text-[#0072F5]" />
          </div>
          <h2 className="text-[18px] font-bold text-[#0072F5] m-0">Đổi Mật Khẩu Cá Nhân</h2>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="flex flex-col gap-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-600 rounded-xl p-3 text-sm">
              {successMsg}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-semibold text-[#334155]">Mật khẩu Hiện tại</label>
            <input 
              required 
              type="password" 
              className="border border-[#E2E8F0] rounded-xl px-4 h-[52px] text-[16px] text-[#334155] focus:outline-none focus:border-[#0072F5] transition-colors"
              value={oldPassword} 
              onChange={e => setOldPassword(e.target.value)} 
              placeholder="Nhập mật khẩu hiện tại" 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-semibold text-[#334155]">Mật khẩu Mới</label>
            <input 
              required 
              type="password" 
              className="border border-[#E2E8F0] rounded-xl px-4 h-[52px] text-[16px] text-[#334155] focus:outline-none focus:border-[#0072F5] transition-colors"
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              placeholder="Nhập mật khẩu mới" 
              minLength="3" 
            />
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button 
              type="button" 
              className="bg-[#F1F5F9] text-[#334155] font-semibold rounded-xl h-[48px] px-6 transition-colors hover:bg-[#E2E8F0]" 
              onClick={onClose} 
              disabled={loading}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="bg-[#0072F5] text-white font-semibold rounded-xl h-[48px] px-6 transition-colors hover:bg-[#005bb5]" 
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu Mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
