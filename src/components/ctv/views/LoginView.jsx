import React, { useState, useEffect } from 'react';

export default function LoginView({ onLogin }) {
  const query = new URLSearchParams(window.location.search);
  const refFromUrl = query.get('ref') || '';

  const [isRegister, setIsRegister] = useState(!!refFromUrl);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [refCode, setRefCode] = useState(refFromUrl);
  const [regRole, setRegRole] = useState('ctv');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // NPP registration state
  const [wantNpp, setWantNpp] = useState(false);
  const [nppPackages, setNppPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [loadingPackages, setLoadingPackages] = useState(false);

  // Load NPP packages when user checks NPP
  useEffect(() => {
    if (!wantNpp) {
      setNppPackages([]);
      setSelectedPackageId('');
      return;
    }
    setLoadingPackages(true);
    fetch('/api/npp/packages/available-public')
      .then(r => r.ok ? r.json() : Promise.resolve({ data: [] }))
      .then(d => setNppPackages(d.data || []))
      .catch(() => setNppPackages([]))
      .finally(() => setLoadingPackages(false));
  }, [wantNpp]);

  const formatVND = (v) => {
    if (v == null) return '—';
    const n = typeof v === 'string' ? parseInt(v, 10) : v;
    if (isNaN(n)) return '—';
    return n.toLocaleString('vi-VN') + ' ₫';
  };

  const rankLabel = (r) => ({ AMBASSADOR: 'Đại sứ', MANAGER: 'Trưởng nhóm', DIRECTOR: 'Quản lý' }[r] || r);

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

    // Validate NPP selection
    if (wantNpp && !selectedPackageId) {
      setError('Vui lòng chọn một gói NPP.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Register account
      const res = await fetch('/api/auth/register', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          password: '123456',
          refCode: refCode || undefined,
          joinSystem: regRole === 'ctv' ? true : false,
        })
      }).then(r => r.json());

      if (!res.success) {
        setError(res.message || 'Đăng ký thất bại');
        setLoading(false);
        return;
      }

      // Step 2: If NPP selected, auto-login then register NPP
      if (wantNpp && selectedPackageId) {
        try {
          const loginRes = await fetch('/api/auth/login', {
            credentials: 'include',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password: '123456' })
          }).then(r => r.json());

          if (loginRes.success) {
            const csrfMatch = document.cookie.match(/(^|;\s*)csrf_token=([^;]*)/);
            const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[2]) : '';

            const nppRes = await fetch('/api/npp/register', {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
              },
              body: JSON.stringify({ packageId: selectedPackageId })
            }).then(r => r.json());

            if (nppRes.success) {
              setSuccess('Đăng ký thành công! Đăng ký NPP đã được ghi nhận (chờ xử lý). Mật khẩu mặc định: 123456.');
            } else {
              setSuccess('Đăng ký tài khoản thành công! Tuy nhiên đăng ký NPP bị lỗi: ' + (nppRes.error || nppRes.message || '') + '. Mật khẩu mặc định: 123456.');
            }
            // Logout so user can login fresh
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
          } else {
            setSuccess('Đăng ký tài khoản thành công! Đăng ký NPP sẽ được thực hiện sau khi đăng nhập. Mật khẩu mặc định: 123456.');
          }
        } catch (nppErr) {
          setSuccess('Đăng ký tài khoản thành công! Đăng ký NPP bị lỗi kết nối. Mật khẩu mặc định: 123456.');
        }
      } else {
        setSuccess('Đăng ký thành công! Mật khẩu mặc định của bạn là: 123456');
      }

      setIsRegister(false);
      setPassword('123456');
      setWantNpp(false);
      setSelectedPackageId('');
    } catch (err) { setError('Lỗi kết nối máy chủ'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'url(/images/752b2cf15d91dccf85802.jpg) center/cover no-repeat' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2rem', margin: '1rem', background: 'var(--bg-glass)', maxHeight: '90vh', overflowY: 'auto' }}>
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

            {/* ═══ NPP REGISTRATION OPTION ═══ */}
            <div style={{
              background: 'rgba(14, 165, 233, 0.06)',
              border: '1px solid rgba(14, 165, 233, 0.2)',
              borderRadius: '12px',
              padding: '12px 14px',
            }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={wantNpp}
                  onChange={e => setWantNpp(e.target.checked)}
                  style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: '#0ea5e9', flexShrink: 0 }}
                />
                <div>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>Đăng ký trở thành Nhà Phân Phối (NPP)</span>
                  <p style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    Đăng ký nhu cầu tham gia hệ thống NPP và lựa chọn gói NPP.
                  </p>
                </div>
              </label>

              {/* Package selection — only when NPP checked */}
              {wantNpp && (
                <div style={{ marginTop: '12px', borderTop: '1px solid rgba(14, 165, 233, 0.15)', paddingTop: '12px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Chọn gói NPP *</p>
                  
                  {loadingPackages ? (
                    <p style={{ fontSize: '13px', opacity: 0.6, textAlign: 'center', padding: '12px 0' }}>Đang tải gói NPP...</p>
                  ) : nppPackages.length === 0 ? (
                    <p style={{ fontSize: '13px', opacity: 0.6, textAlign: 'center', padding: '12px 0' }}>Hiện chưa có gói NPP nào.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {nppPackages.map(pkg => (
                        <label
                          key={pkg.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            border: selectedPackageId === pkg.id
                              ? '2px solid #0ea5e9'
                              : '1px solid rgba(148, 163, 184, 0.3)',
                            background: selectedPackageId === pkg.id
                              ? 'rgba(14, 165, 233, 0.08)'
                              : 'rgba(255,255,255,0.5)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="radio"
                            name="nppPackage"
                            value={pkg.id}
                            checked={selectedPackageId === pkg.id}
                            onChange={() => setSelectedPackageId(pkg.id)}
                            style={{ marginTop: '2px', accentColor: '#0ea5e9', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '13px' }}>{pkg.name}</div>
                            {pkg.packageType === 'CAPITAL' ? (
                              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>
                                {formatVND(pkg.grossPrice)} · {rankLabel(pkg.assignedRank)}
                              </div>
                            ) : (
                              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>
                                {pkg.requiredQuantity} máy · Chiết khấu {(pkg.defaultDiscount / 100)}% · {rankLabel(pkg.assignedRank)}
                              </div>
                            )}
                            {pkg.description && (
                              <div style={{ fontSize: '11px', opacity: 0.55, marginTop: '2px', lineHeight: 1.3 }}>{pkg.description}</div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
