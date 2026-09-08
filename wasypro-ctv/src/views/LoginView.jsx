import React, { useState } from 'react';

export default function LoginView({ onLogin }) {
  const query = new URLSearchParams(window.location.search);
  const refFromUrl = query.get('ref') || '';

  const [isRegister, setIsRegister] = useState(!!refFromUrl);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [refCode, setRefCode] = useState(refFromUrl);
  const [regRole, setRegRole] = useState('ctv'); // 'ctv' or 'customer'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const submitLogin = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      }).then(r => r.json());

      if (res.success) {
        onLogin(res.data);
      } else {
        setError(res.message || 'Đăng nhập thất bại');
      }
    } catch (err) { setError('Lỗi kết nối máy chủ'); }
    finally { setLoading(false); }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone, password: '123456', refCode })
      }).then(r => r.json());

      if (res.success) {
        setSuccess('Đăng ký thành công! Mật khẩu mặc định: 123456. Vui lòng đăng nhập.');
        setIsRegister(false);
        setPassword('123456');
      } else {
        setError(res.message || 'Đăng ký thất bại');
      }
    } catch (err) { setError('Lỗi kết nối máy chủ'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'url(/images/752b2cf15d91dccf85802.jpg) center/cover no-repeat' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2rem', margin: '1rem', background: 'var(--bg-glass)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
           <div className="logo-icon" style={{ margin: '0 auto 1rem auto', width: '80px', height: '80px', overflow: 'hidden', background: 'transparent', border: 'none', boxShadow: 'none' }}>
              <img src="/images/logo-moi-1.png" alt="WATER KING Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
           </div>
           <h2 className="text-primary" style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 800 }}>WATER KING</h2>
           <p className="text-muted text-sm mt-2 font-medium">NƯỚC TỐT - THÂN AN - TRÍ SÁNG</p>
        </div>
        
        {isRegister ? (
          <form onSubmit={submitRegister} className="flex-col gap-4">
            {error && <div className="text-sm p-3 bg-red-100 text-red-600 rounded" style={{ textAlign: 'center' }}>{error}</div>}
            <div className="flex-col gap-1">
               <label className="text-sm font-bold">Loại tài khoản đăng ký</label>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button type="button" className={`btn ${regRole === 'ctv' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px', fontSize: '13px' }} onClick={() => setRegRole('ctv')}>
                     Đại lý / CTV
                  </button>
                  <button type="button" className={`btn ${regRole === 'customer' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px', fontSize: '13px' }} onClick={() => setRegRole('customer')}>
                     Khách Hàng
                  </button>
               </div>
            </div>
            <div className="flex-col gap-1">
               <label className="text-sm font-bold">Họ và Tên</label>
               <input required className="input-field" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Nhập họ tên của bạn..." autoFocus />
            </div>
            <div className="flex-col gap-1">
               <label className="text-sm font-bold">Số điện thoại</label>
               <input required className="input-field" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="09..." />
            </div>
            <div className="flex-col gap-1">
               <label className="text-sm font-bold">Mã Người Giới Thiệu (Nếu có)</label>
               <input className="input-field" value={refCode} onChange={e=>setRefCode(e.target.value)} placeholder="VD: S123" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '12px' }}>
               {loading ? 'Đang xử lý...' : (regRole === 'ctv' ? 'Tạo Tài Khoản Đại Lý / CTV' : 'Tạo Tài Khoản Khách Hàng')}
            </button>
            <div className="text-center mt-2 text-sm text-secondary cursor-pointer hover:underline" onClick={() => setIsRegister(false)}>
               Đã có tài khoản? Đăng nhập ngay
            </div>
          </form>
        ) : (
          <form onSubmit={submitLogin} className="flex-col gap-4">
            {success && <div className="text-sm p-3 bg-green-100 text-green-700 rounded" style={{ textAlign: 'center' }}>{success}</div>}
            {error && <div className="text-sm p-3 bg-red-100 text-red-600 rounded" style={{ textAlign: 'center' }}>{error}</div>}
            <div className="flex-col gap-1">
               <label className="text-sm font-bold">Số điện thoại</label>
               <input required className="input-field" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="09..." autoFocus={!success} />
            </div>
            <div className="flex-col gap-1">
               <label className="text-sm font-bold">Mật khẩu</label>
               <input required type="password" className="input-field" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '1rem', padding: '12px' }}>
               {loading ? 'Đang đăng nhập...' : 'Đăng Nhập Hệ Thống'}
            </button>
            <div className="text-center mt-2 text-sm text-secondary cursor-pointer hover:underline" onClick={() => setIsRegister(true)}>
               Chưa có tài khoản? Đăng ký ngay
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
