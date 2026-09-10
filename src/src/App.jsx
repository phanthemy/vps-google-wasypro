import React, { useState, useEffect, Fragment } from 'react';
import { 
  BarChart3, 
  Users, 
  Network, 
  Settings, 
  Menu, 
  Bell, 
  User, 
  TrendingUp, 
  Wallet,
  TrendingDown,
  Layers,
  Award,
  Crown,
  Medal,
  AlertCircle,
  Plus,
  Contact,
  BookOpen,
  ChevronDown,
  Edit,
  Download,
  X,
  Trash2,
  PlusCircle,
  PieChart as PieChartIcon,
  Clock,
  UserCog,
  History,
  Key,
  ShoppingCart
} from 'lucide-react';

import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('crm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
  const [isOrderModalOpen, setOrderModalOpen] = useState(false);
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [isPassModalOpen, setPassModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Data for forms
  const [userList, setUserList] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [serviceList, setServiceList] = useState([]);

  const [refreshKey, setRefreshKey] = useState(0);

  // Service Menu State
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);
  const [isServicesShowAll, setIsServicesShowAll] = useState(false);
  const [activeServiceId, setActiveServiceId] = useState(null);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showiOSPrompt, setShowiOSPrompt] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    // Listen for Android/Chrome install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if on iOS Safari and not installed
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    
    if (isIos() && !isStandalone) {
      // Small timeout to not be too aggressive
      setTimeout(() => setShowiOSPrompt(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowiOSPrompt(true); // Fallback to iOS/Manual instructions if clicked
    }
  };

  useEffect(() => {
    // Tải dữ liệu dùng chung cho các Form
    fetch('/api/users').then(r=>r.json()).then(res => res.success && setUserList(res.data));
    fetch('/api/customers').then(r=>r.json()).then(res => {
      if(res.success) {
        if (currentUser?.role === 'admin' || currentUser?.userId === 'admin') {
          setCustomerList(res.data);
        } else {
          setCustomerList(res.data.filter(c => c.sourceCtvId === currentUser?.id));
        }
      }
    });
    fetch('/api/services').then(r=>r.json()).then(res => res.success && setServiceList(res.data));
  }, [refreshKey, currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('crm_user');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginView onLogin={(user) => {
      localStorage.setItem('crm_user', JSON.stringify(user));
      setCurrentUser(user);
      setActiveTab('dashboard');
    }} />
  }

  const isAdmin = currentUser?.role === 'admin' || currentUser?.id === 'ADMIN';
  const isAccountant = currentUser?.role === 'accountant' || currentUser?.id === 'ACCOUNTANT';
  const isAdminOrAccountant = isAdmin || isAccountant;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <a href="/" style={{textDecoration:'none',display:'flex',alignItems:'center',gap:'0.75rem',cursor:'pointer'}}>
            <div className="logo-icon">
              <Layers size={24} />
            </div>
            <span className="logo-text text-gradient">WATER KING</span>
          </a>
        </div>
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
          >
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'network' ? 'active' : ''}`}
            onClick={() => { setActiveTab('network'); setSidebarOpen(false); }}
          >
            <Network size={20} />
            <span>Sơ đồ</span>
          </div>
          {isAdminOrAccountant && (
            <div 
              className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
            >
              <Users size={20} />
              <span>Danh sách CTV</span>
            </div>
          )}
          <div 
            className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => { setActiveTab('customers'); setSidebarOpen(false); }}
          >
            <Contact size={20} />
            <span>Danh sách Khách</span>
          </div>
          {isAdminOrAccountant && (
            <div 
              className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => { setActiveTab('orders'); setSidebarOpen(false); }}
            >
              <ShoppingCart size={20} />
              <span>Quản lý Đơn Hàng</span>
            </div>
          )}
          {isAdmin && (
            <div 
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
            >
              <Settings size={20} />
              <span>Cấu hình Cơ chế</span>
            </div>
          )}
          <div className="nav-group" style={{ display: 'flex', flexDirection: 'column' }}>
            <div 
              className={`nav-item ${(activeTab === 'pricelist' || activeTab === 'service-detail') ? 'active' : ''}`}
              onClick={() => { setIsServicesExpanded(!isServicesExpanded); setActiveTab('pricelist'); }}
              style={{ justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BookOpen size={20} />
                <span>Danh Mục Sản Phẩm</span>
              </div>
              <span style={{ fontSize: '10px', transform: isServicesExpanded ? 'rotate(180deg)' : 'none', transition: '0.3s' }}>▼</span>
            </div>
            
            {isServicesExpanded && (
              <div style={{ paddingLeft: '32px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {(isServicesShowAll ? serviceList : serviceList.slice(0, 5)).map(s => (
                  <div 
                    key={s.id}
                    className="nav-item" 
                    style={{ 
                       padding: '8px', 
                       fontSize: '13px', 
                       minHeight: 'auto',
                       color: activeServiceId === s.id && activeTab === 'service-detail' ? 'var(--accent-diamond)' : 'var(--text-secondary)',
                       background: activeServiceId === s.id && activeTab === 'service-detail' ? 'rgba(0, 240, 255, 0.05)' : 'transparent' 
                    }}
                    onClick={() => { setActiveTab('service-detail'); setActiveServiceId(s.id); setSidebarOpen(false); }}
                  >
                    {s.name}
                  </div>
                ))}
                {serviceList.length > 5 && (
                  <div 
                    className="nav-item" 
                    style={{ padding: '8px', fontSize: '12px', fontStyle: 'italic', minHeight: 'auto', color: 'var(--text-muted)' }}
                    onClick={() => setIsServicesShowAll(!isServicesShowAll)}
                  >
                    {isServicesShowAll ? '▲ Thu gọn' : '▼ Xem thêm...'}
                  </div>
                )}
              </div>
            )}
          </div>
          <div 
            className={`nav-item ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => { setActiveTab('statistics'); setSidebarOpen(false); }}
          >
            <PieChartIcon size={20} />
            <span>Thống Kê Bán Hàng</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'commissions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('commissions'); setSidebarOpen(false); }}
          >
            <Wallet size={20} />
            <span>Lịch sử Hoa Hồng</span>
          </div>
          {isAdmin && (
            <div 
              className={`nav-item ${activeTab === 'internal-users' ? 'active' : ''}`}
              onClick={() => { setActiveTab('internal-users'); setSidebarOpen(false); }}
            >
              <UserCog size={20} />
              <span>Quản lý Nhân Sự</span>
            </div>
          )}
          {isAdminOrAccountant && (
            <div 
              className={`nav-item ${activeTab === 'audit-logs' ? 'active' : ''}`}
              onClick={() => { setActiveTab('audit-logs'); setSidebarOpen(false); }}
            >
              <History size={20} />
              <span>Lịch sử Hệ thống</span>
            </div>
          )}
          <div 
            className={`nav-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => { setActiveTab('about'); setSidebarOpen(false); }}
          >
            <AlertCircle size={20} />
            <span>Chính sách WATER KING</span>
          </div>
        </nav>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={toggleSidebar}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40
          }}
        />
      )}

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header">
          <div className="flex items-center gap-4">
            <button className="mobile-toggle" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <h2 className="text-primary hidden md:block">
              {activeTab === 'dashboard' && 'Tổng quan Hệ thống'}
              {activeTab === 'network' && 'Sơ đồ Mạng lưới Kinh doanh'}
              {activeTab === 'users' && 'Danh sách Cộng tác viên'}
              {activeTab === 'customers' && 'Quản Lý Danh Sách Khách Hàng'}
              {activeTab === 'settings' && 'Cấu Hình Cơ Chế & Thưởng'}
              {activeTab === 'pricelist' && 'Danh Mục Sản Phẩm WATER KING'}
              {activeTab === 'statistics' && 'Thống Kê Bán Hàng CTV'}
              {activeTab === 'commissions' && 'Lịch Sử Dòng Tiền Hoa Hồng'}
              {activeTab === 'about' && 'Thông Tin Hợp Tác WATER KING'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {(deferredPrompt || showiOSPrompt) && (
              <button className="btn btn-primary flex items-center gap-2" onClick={handleInstallClick} style={{ background: '#ec4899', border: 'none' }}>
                <span className="hide-text-mobile flex items-center gap-1"><Download size={16}/> Tải App</span>
                <span className="md:hidden flex items-center gap-1"><Download size={16}/> App</span>
              </button>
            )}
            <button className="btn btn-primary flex items-center gap-2" onClick={() => setCustomerModalOpen(true)}>
               <Plus size={16}/> <span className="hide-text-mobile">Pre-check Khách</span>
            </button>
            <button className="btn btn-action flex items-center gap-2" onClick={() => setOrderModalOpen(true)}>
               <Wallet size={16}/> <span className="hide-text-mobile">Tạo Đơn Hàng</span>
            </button>
            <button className="btn-icon btn-secondary">
              <Bell size={20} />
            </button>
            <button className="btn-icon btn-secondary" title="Đổi mật khẩu" onClick={() => setPassModalOpen(true)}>
              <Key size={18} />
            </button>
            <div className="flex items-center gap-2 cursor-pointer btn-secondary" onClick={handleLogout} style={{ padding: '0.375rem 1rem', borderRadius: '24px' }} title="Đăng xuất">
              <div className="btn-icon" style={{ padding: '0', background: 'var(--grad-primary)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <User size={16} />
              </div>
              <span className="text-primary font-medium" style={{ fontSize: '0.875rem' }}>{currentUser.fullName}</span>
            </div>
          </div>
        </header>

        <div className="page-content animate-fade-in">
          {activeTab === 'dashboard' && <DashboardView refreshKey={refreshKey} currentUser={currentUser} setActiveTab={setActiveTab} />}
          {activeTab === 'network' && <NetworkView refreshKey={refreshKey} currentUser={currentUser} />}
          {activeTab === 'users' && isAdminOrAccountant && <UsersView 
             refreshKey={refreshKey} 
             onAddUser={() => { setEditingUser(null); setUserModalOpen(true); }} 
             onEditUser={(user) => { setEditingUser(user); setUserModalOpen(true); }}
          />}
          {activeTab === 'customers' && <CustomersView refreshKey={refreshKey} currentUser={currentUser} onAddCustomer={() => setCustomerModalOpen(true)} />}
          {activeTab === 'orders' && isAdminOrAccountant && <OrdersView currentUser={currentUser} />}
          {activeTab === 'settings' && isAdmin && <SettingsView />}
          {activeTab === 'pricelist' && <PriceListView isAdmin={isAdminOrAccountant} serviceList={serviceList} onRefresh={() => setRefreshKey(prev => prev + 1)} />}
          {activeTab === 'service-detail' && <ServiceDetailView service={serviceList.find(s => s.id === activeServiceId)} onBack={() => setActiveTab('pricelist')} />}
          {activeTab === 'statistics' && <StatisticsView currentUser={currentUser} userList={userList} />}
          {activeTab === 'commissions' && <CommissionHistoryView currentUser={currentUser} />}
          {activeTab === 'internal-users' && isAdmin && <SystemUsersView />}
          {activeTab === 'audit-logs' && isAdminOrAccountant && <SystemLogsView currentUser={currentUser} />}
          {activeTab === 'about' && <AboutView />}
        </div>
      </main>

      {/* Modals */}
      {isCustomerModalOpen && (
        <CustomerModal 
           currentUser={currentUser}
           userList={userList} 
           onClose={() => setCustomerModalOpen(false)}
           onSuccess={() => {
              setCustomerModalOpen(false);
              setRefreshKey(prev => prev + 1);
           }}
        />
      )}

      {isOrderModalOpen && (
        <OrderModal 
           customerList={customerList}
           serviceList={serviceList}
           onClose={() => setOrderModalOpen(false)}
           onSuccess={() => {
              setOrderModalOpen(false);
              setRefreshKey(prev => prev + 1);
           }}
        />
      )}

      {isUserModalOpen && (
        <UserModal 
           userList={userList}
           editingUser={editingUser}
           onClose={() => setUserModalOpen(false)}
           onSuccess={() => {
              setUserModalOpen(false);
              setRefreshKey(prev => prev + 1);
           }}
        />
      )}

      {isPassModalOpen && (
        <ChangePasswordModal currentUser={currentUser} onClose={() => setPassModalOpen(false)} />
      )}


      {/* PWA iOS Instruction Modal */}
      {showiOSPrompt && !deferredPrompt && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '350px', padding: '1.5rem', textAlign: 'center' }}>
            <h3 className="text-primary mb-2">Cài Đặt Ứng Dụng</h3>
            <p className="text-muted text-sm mb-4">Để có trải nghiệm mượt mà nhất, hãy cài đặt ứng dụng WATER KING về điện thoại của bạn.</p>
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', textAlign: 'left', fontSize: '0.875rem' }}>
              <p>📍 <strong>Website Android:</strong> Sẽ hiện bảng hỏi cài đặt.</p>
              <p>📍 <strong>Trình duyệt Safari (iPhone/iPad):</strong></p>
              <ol style={{ paddingLeft: '20px', marginTop: '10px' }}>
                <li>Nhấn vào biểu tượng Chia sẻ (Share) ở dưới cùng màn hình <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg></li>
                <li>Vuốt lên và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.</li>
              </ol>
            </div>
            <button className="btn btn-primary mt-4 w-full" onClick={() => setShowiOSPrompt(false)}>Đã Hiểu</button>
          </div>
        </div>
      )}

    </div>
  );
}

// ---- Login View ----
function LoginView({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
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
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'url(/images/752b2cf15d91dccf85802.jpg) center/cover no-repeat' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', margin: '1rem', background: 'var(--bg-glass)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
           <div className="logo-icon" style={{ margin: '0 auto 1rem auto', width: '80px', height: '80px', overflow: 'hidden', background: 'transparent', border: 'none', boxShadow: 'none' }}>
              <img src="/images/logo-moi-1.png" alt="WATER KING Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
           </div>
           <h2 className="text-primary" style={{ margin: 0, fontFamily: 'Outfit', fontWeight: 800 }}>WATER KING</h2>
           <p className="text-muted text-sm mt-2 font-medium">NƯỚC TỐT - THÂN AN - TRÍ SÁNG</p>
        </div>
        <form onSubmit={submit} className="flex-col gap-4">
          {error && <div className="text-sm p-3 bg-red-100 text-red-600 rounded" style={{ textAlign: 'center' }}>{error}</div>}
          <div className="flex-col gap-1">
             <label className="text-sm font-bold">Số điện thoại</label>
             <input required className="input-field" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="09..." autoFocus />
          </div>
          <div className="flex-col gap-1">
             <label className="text-sm font-bold">Mật khẩu</label>
             <input required type="password" className="input-field" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '12px' }}>Đăng Nhập Hệ Thống</button>
        </form>
      </div>
    </div>
  );
}

// ---- Modals ----

function CustomerModal({ userList, onClose, onSuccess, currentUser }) {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.userId === 'admin';
  const [formData, setFormData] = useState({ fullName: '', phone: '', sourceCtvId: isAdmin ? '' : (currentUser?.id || '') });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/customers', {
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

function SearchableServiceSelect({ serviceList, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedService = serviceList.find(s => s.id === value);
  const displayValue = selectedService ? `[${selectedService.category.name}] ${selectedService.name}` : '';

  const filtered = serviceList.filter(s => 
    (s.name.toLowerCase() + ' ' + (s.group || '').toLowerCase()).includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, curr) => {
    const group = curr.group || 'Khác';
    if(!acc[group]) acc[group] = [];
    acc[group].push(curr);
    return acc;
  }, {});

  return (
    <div style={{ position: 'relative' }}>
       {!isOpen ? (
          <div className="input-field cursor-pointer flex justify-between items-center" onClick={() => setIsOpen(true)}>
             <span className="truncate" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '90%' }}>{displayValue || '-- Chọn Sản Phẩm --'}</span>
             <ChevronDown size={16} />
          </div>
       ) : (
          <div className="searchable-dropdown">
             <div style={{ padding: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                <input 
                  autoFocus 
                  className="input-field" 
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: 'none', borderRadius: '4px' }}
                  placeholder="Gõ để tìm kiếm..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
             </div>
             <div style={{ flex: 1, overflowY: 'auto' }}>
                <div 
                   className="text-sm cursor-pointer font-bold text-center flex items-center justify-center gap-2"
                   style={{ padding: '8px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                   onClick={() => setIsOpen(false)}
                >
                   <X size={16} /> Đóng Danh Sách
                </div>
                {Object.keys(grouped).map(group => (
                   <div key={group}>
                     <div className="text-xs font-bold text-muted uppercase" style={{ padding: '6px 12px', background: '#f8fafc' }}>{group}</div>
                     {grouped[group].map(s => (
                        <div 
                           key={s.id} 
                           className="cursor-pointer hover-service-item"
                           style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}
                           onClick={() => {
                             onChange(s.id);
                             setIsOpen(false);
                             setSearch('');
                           }}
                        >
                           <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                           <div className="text-xs font-bold mt-1" style={{ color: 'var(--accent-diamond)' }}>{new Intl.NumberFormat('vi-VN').format(s.price)}đ</div>
                        </div>
                     ))}
                   </div>
                ))}
                {filtered.length === 0 && <div className="p-4 text-center text-sm text-muted">Không tìm thấy sản phẩm</div>}
             </div>
          </div>
       )}
    </div>
  )
}

function OrderModal({ customerList, serviceList, onClose, onSuccess }) {
  const [customerId, setCustomerId] = useState('');
  const [cart, setCart] = useState([]);
  
  const [currentServiceId, setCurrentServiceId] = useState('');
  const [currentQty, setCurrentQty] = useState(1);
  const [currentAmount, setCurrentAmount] = useState('');
  
  const [error, setError] = useState('');

  const handleServiceChange = (svId) => {
     const svc = serviceList.find(s => s.id === svId);
     setCurrentServiceId(svId);
     setCurrentAmount(svc ? svc.price * currentQty : '');
  };

  const handleQtyChange = (e) => {
     const newQty = Math.max(1, parseInt(e.target.value, 10)) || 1;
     setCurrentQty(newQty);
     const svc = serviceList.find(s => s.id === currentServiceId);
     if (svc) {
        setCurrentAmount(svc.price * newQty);
     }
  };

  const addToCart = () => {
     if(!currentServiceId || !currentAmount) {
         setError('Vui lòng chọn sản phẩm và nhập số tiền!');
         return;
     }
     const svc = serviceList.find(s => s.id === currentServiceId);
     const newCart = [...cart, { serviceId: currentServiceId, qty: currentQty, amount: Number(currentAmount), name: svc?.name || 'Sản phẩm' }];
     setCart(newCart);
     
     // Reset form
     setCurrentServiceId('');
     setCurrentQty(1);
     setCurrentAmount('');
     setError('');
  };

  const removeFromCart = (index) => {
     const newCart = [...cart];
     newCart.splice(index, 1);
     setCart(newCart);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!customerId) return setError('Vui lòng chọn khách hàng!');
    if (cart.length === 0) return setError('Vui lòng thêm ít nhất 1 sản phẩm vào giỏ hàng!');

    try {
      const payload = {
         customerId,
         items: cart.map(c => ({ serviceId: c.serviceId, amount: Number(c.amount), qty: Number(c.qty) }))
      };
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json());

      if (res.success) onSuccess();
      else setError(res.message || 'Lỗi tạo hóa đơn');
    } catch (err) { setError('Lỗi kết nối máy chủ'); }
  };

  const totalAmount = cart.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="modal-overlay z-50">
      <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="text-primary mb-4" style={{ color: 'var(--accent-green)'}}>Khởi Tạo Đơn Hàng (Chốt Sale)</h2>
        <div className="flex-col gap-4">
          {error && <div className="text-sm p-3 bg-red-100 border border-red-200 text-red-600 rounded-lg">{error}</div>}
          
          <div className="flex-col gap-1">
            <label className="text-sm font-bold text-primary">Khách Hàng Mục Tiêu</label>
            <select required className="input-field" value={customerId} onChange={e => setCustomerId(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px' }}>
              <option value="">-- Chọn Khách Hàng --</option>
              {customerList.map(c => <option key={c.id} value={c.id}>{c.fullName} - {c.phone} (Nguồn: {c.sourceCtv?.fullName})</option>)}
            </select>
          </div>

          <div className="p-4 rounded-xl border border-subtle mt-2" style={{ background: '#f8fafc', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}>
             <h4 className="font-bold mb-3 text-sm text-primary">Kho Cục Sản Phẩm</h4>
             <div className="flex-col gap-3">
                <div className="flex-col gap-1">
                   <label className="text-xs font-semibold text-muted uppercase tracking-wider" style={{ fontSize: '10px' }}>Sản phẩm / Dịch vụ</label>
                   <SearchableServiceSelect 
                      serviceList={serviceList}
                      value={currentServiceId}
                      onChange={handleServiceChange}
                   />
                </div>
                <div className="flex gap-4 items-end">
                   <div className="flex-col gap-1" style={{ flex: '0 0 80px' }}>
                      <label className="text-xs font-semibold text-muted uppercase tracking-wider" style={{ fontSize: '10px' }}>Số Lượng</label>
                      <input type="number" min="1" className="input-field" value={currentQty} onChange={handleQtyChange} style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '8px', textAlign: 'center' }} />
                   </div>
                   <div className="flex-col gap-1" style={{ flex: 1 }}>
                      <label className="text-xs font-semibold text-muted uppercase tracking-wider" style={{ fontSize: '10px' }}>Thực Thu (VND)</label>
                      <input type="number" className="input-field" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} placeholder="0" style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '8px' }} />
                   </div>
                   <button type="button" className="btn hover-scale" onClick={addToCart} style={{ background: 'var(--accent-blue)', color: 'white', padding: '0 16px', height: '38px', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}>
                      Thêm
                   </button>
                </div>
             </div>
          </div>

          {cart.length > 0 && (
             <div className="mt-2 p-4 rounded-xl" style={{ border: '2px dashed #cbd5e1', background: '#ffffff' }}>
                <h4 className="font-bold mb-3 text-sm" style={{ color: 'var(--accent-green)' }}>Giỏ Hàng Đã Chọn ({cart.length})</h4>
                <div className="flex-col gap-2">
                   {cart.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-lg fade-in" style={{ background: '#f1f5f9', borderLeft: '4px solid var(--accent-green)' }}>
                         <div>
                            <div className="font-bold text-sm text-primary">{item.name}</div>
                            <div className="flex gap-3 mt-1">
                               <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded">x{item.qty}</span>
                               <span className="text-xs text-blue-600 font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount)}</span>
                            </div>
                         </div>
                         <button type="button" onClick={() => removeFromCart(idx)} className="btn-icon hover-scale" style={{ color: '#ef4444', background: '#fee2e2', borderRadius: '50%', padding: '6px', border: 'none' }}><X size={14} /></button>
                      </div>
                   ))}
                   
                   <div className="flex justify-between items-center p-4 mt-3 rounded-xl shadow-sm" style={{ background: 'linear-gradient(to right, #ecfdf5, #d1fae5)', border: '1px solid #10b981' }}>
                      <span className="font-bold text-green-800 uppercase tracking-widest" style={{ fontSize: '12px' }}>TỔNG THU THEO ĐƠN:</span>
                      <span className="font-bold text-2xl text-green-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</span>
                   </div>
                </div>
             </div>
          )}

          <div className="flex justify-between items-center mt-4 pt-5 border-t border-subtle">
            <div className="text-xs text-muted leading-relaxed" style={{ flex: '1', paddingRight: '1rem' }}>
               Hoa hồng cấp quản lý sẽ được tự động tính toán dựa trên số lượng sỉ và thành tiền của giỏ hàng.
            </div>
            <div className="flex gap-2 justify-end" style={{ flex: 'none' }}>
               <button type="button" className="hover-scale" style={{ padding: '10px 16px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={onClose}>Hủy Bỏ</button>
               <button type="button" onClick={submit} className="hover-scale" style={{ padding: '10px 24px', background: 'var(--accent-green)', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', cursor: 'pointer', whiteSpace: 'nowrap' }}>Lưu & Tính Hoa Hồng</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- Views ----

function DashboardView({ refreshKey, currentUser, setActiveTab }) {
  const [data, setData] = useState({ totalDiamond: 0, totalGold: 0, totalSilver: 0, totalSales: 0 });
  const [personalStats, setPersonalStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser.role === 'admin') {
      fetch('/api/dashboard')
        .then(r => r.json())
        .then(res => {
          if(res.success) setData(res.data);
        })
        .finally(() => setLoading(false));
    } else {
      fetch('/api/users')
        .then(r => r.json())
        .then(res => {
          if(res.success) {
            const me = res.data.find(u => u.id === currentUser.id);
            setPersonalStats(me);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [refreshKey, currentUser]);

  if (loading) return <div className="text-muted p-4">Đang tải dữ liệu...</div>;

  if (currentUser.role !== 'admin' && personalStats) {
    const gross = personalStats.totalCommission || 0;
    const sales = personalStats.totalSales || 0;
    const net = gross * 0.9 - sales * 0.01;
    
    return (
      <div className="flex-col gap-6">
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 className="text-secondary" style={{ margin: 0, textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
            Doanh số Hệ thống Của Bạn
          </h3>
          <h1 style={{ margin: '10px 0 0 0', fontSize: '3rem', color: 'var(--text-primary)' }}>
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(sales)}
          </h1>
          
          <div 
            style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0, 240, 255, 0.05)', border: '1px solid var(--accent-diamond)', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '5px' }}
            onClick={() => setActiveTab('commissions')}
            className="hover-effect transition-transform transform hover:scale-105"
          >
            <div className="text-diamond font-bold flex justify-between items-center" style={{ fontSize: '1.1rem' }}>
              <span>Hoa hồng Gộp (Chưa trừ Thuế/Phí):</span>
              <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(gross)}</span>
            </div>
            <div className="text-green-500 font-bold flex justify-between items-center" style={{ fontSize: '1.5rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.2)' }}>
              <span>THỰC NHẬN:</span>
              <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(net)}</span>
            </div>
            <div className="text-muted text-xs text-center mt-3 animate-pulse border-t border-gray-800 pt-2">
              👉 Click vào đây để xem chi tiết sao kê trừ Thuế TNCN (10%) và Phí (1%)
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col gap-6">
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 className="text-secondary" style={{ margin: 0, textTransform: 'uppercase', fontSize: '0.875rem', letterSpacing: '0.05em' }}>
          Tổng Doanh Thu Hóa Đơn
        </h3>
        <h1 style={{ margin: '10px 0 0 0', fontSize: '3rem', color: 'var(--text-primary)' }}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.totalSales)}
        </h1>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--accent-diamond)', background: '#E0F2FE' }}>
            <Crown size={28} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Giám đốc PT</div>
            <div className="stat-value">{data.totalDiamond} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Giám Đốc</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--accent-gold)', background: '#FEF3C7' }}>
            <Award size={28} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Quản lý PT</div>
            <div className="stat-value">{data.totalGold} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Quản Lý</span></div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--accent-silver)', background: '#F1F5F9' }}>
            <Medal size={28} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Đại sứ KD</div>
            <div className="stat-value">{data.totalSilver} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Đại Sứ</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom Recursive Tree Node
function TreeNode({ node, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const iconMap = {
    'DIAMOND': <Crown size={16}/>,
    'GOLD': <Award size={14}/>,
    'SILVER': <Medal size={14}/>
  };
  const tierClass = node.tier.toLowerCase() + '-node';
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex-col items-center tree-branch-wrapper">
      <div 
         className={`tree-node ${tierClass} relative z-10 flex-col gap-1 w-full`}
         onClick={() => hasChildren && setExpanded(!expanded)}
         style={{ cursor: hasChildren ? 'pointer' : 'default', padding: '12px 16px', minWidth: '180px' }}
      >
         <div className="flex justify-between items-center w-full" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '6px', marginBottom: '4px' }}>
            <div className={`flex items-center gap-1 font-bold text-xs`} style={{ color: `var(--accent-${node.tier.toLowerCase()})` }}>
               {iconMap[node.tier]} <span className="uppercase">{node.tier === 'DIAMOND' ? 'Giám đốc PT' : node.tier === 'GOLD' ? 'Quản lý PT' : 'Đại sứ KD'}</span>
            </div>
            <div className="text-xs text-muted font-mono">{node.id}</div>
         </div>
         <div className="font-bold text-sm text-primary w-full text-left truncate" title={node.name}>{node.name}</div>
         <div className="flex-col w-full mt-1" style={{ alignItems: 'flex-start' }}>
            <div className="text-xs text-muted mt-1" style={{ whiteSpace: 'nowrap' }}>Doanh số:</div>
            <div className="text-sm font-bold" style={{ color: 'var(--accent-diamond)', marginTop: '2px' }}>{new Intl.NumberFormat('vi-VN').format(node.totalSales)}đ</div>
         </div>
         {hasChildren && (
            <div className="text-muted mt-2 mx-auto w-full flex justify-center pt-1" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
               <div style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'flex', alignItems: 'center' }}>
                  <ChevronDown size={14} />
               </div>
            </div>
         )}
      </div>
      {hasChildren && expanded && (
         <div className="flex-col items-center w-full">
            <div style={{ width: '2px', height: '20px', background: 'var(--border-strong)' }}></div>
            <div className="flex justify-center relative" style={{ paddingTop: '20px', position: 'relative' }}>
              {/* Horizontal Line Bridge */}
              {node.children.length > 1 && (
                <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px', background: 'var(--border-strong)'}}></div>
              )}
              {node.children.map((child, i) => (
                <div key={child.id} className="relative flex-col items-center shrink-0">
                  <div style={{ position: 'absolute', top: '-20px', left: '50%', width: '2px', height: '20px', background: 'var(--border-strong)'}}></div>
                  <TreeNode node={child} />
                </div>
              ))}
            </div>
         </div>
      )}
    </div>
  );
}

function PageHeader({ title, subtitle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '1rem', width: '100%' }}>
      <div style={{ textAlign: 'center', background: 'rgba(2, 6, 23, 0.6)', padding: '12px 24px', borderRadius: '16px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ color: 'var(--accent-diamond)', fontSize: '1.8rem', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{title}</h2>
        <p style={{ color: '#e2e8f0', fontSize: '0.95rem', margin: '4px 0 0' }}>{subtitle}</p>
      </div>
    </div>
  );
}

function NetworkView({ refreshKey, currentUser }) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tree')
      .then(r => r.json())
      .then(res => {
        if(res.success) {
          if (currentUser.role === 'admin' || currentUser.role === 'accountant' || currentUser.id === 'ADMIN' || currentUser.id === 'ACCOUNTANT') {
            setTree(res.data);
          } else {
            const findNode = (nodes, id) => {
              for (let n of nodes) {
                if (n.id === id) return n;
                const found = findNode(n.children || [], id);
                if (found) return found;
              }
              return null;
            };
            const myNode = findNode(res.data, currentUser.id);
            setTree(myNode ? [myNode] : []);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [refreshKey, currentUser]);

  if (loading) return <div className="text-muted p-4">Đang tải biểu đồ mạng lưới...</div>;

  return (
    <div className="flex-col gap-6">
      <PageHeader title="Sơ đồ Cây 3 Cấp Nhóm" subtitle="Dữ liệu phân nhánh trực tiếp từ hệ thống." />
      
      <div className="card glass-panel flex flex-col network-tree-card" style={{ overflowX: 'auto', paddingBottom: '20px', alignItems: 'flex-start' }}>
        <div className="tree-container flex" style={{ minWidth: 'min-content', padding: '0 20px' }}>
          {tree.map(rootNode => (
             <div key={rootNode.id} style={{ display: 'inline-flex', marginRight: '40px' }}>
                <TreeNode node={rootNode} defaultExpanded={true} />
             </div>
          ))}
        </div>
      </div>
      <style>{`
        .tree-node {
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s, box-shadow 0.2s;
          border: 1px solid rgba(255,255,255,0.6);
        }
        .tree-node:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .diamond-node { border-left: 4px solid var(--accent-diamond); background: #F0F9FF; }
        .gold-node { border-left: 4px solid var(--accent-gold); background: #FFFBEB; }
        .silver-node { border-left: 4px solid #94A3B8; background: #F8FAFC; }
      `}</style>
    </div>
  );
}

function UsersView({ refreshKey, onAddUser, onEditUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });

  const [hoveredTooltip, setHoveredTooltip] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaxes, setShowTaxes] = useState(false);

  const computedUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (u.name?.toLowerCase() || '').includes(q) || (u.phone || '').includes(q);
  });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/users?timeFilter=${timeFilter}&period=${period}`)
      .then(r => r.json())
      .then(res => {
        if(res.success) {
           setUsers(res.data);
           setCurrentPage(1);
        }
      })
      .finally(() => setLoading(false));
  }, [refreshKey, timeFilter, period]);

  const handleNoteChange = async (id, note) => {
    try {
      await fetch(`/api/users/${id}/note`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });
    } catch(e) {}
  };

  const totalSalesAll = computedUsers.reduce((acc, u) => acc + (u.totalSales || 0), 0);
  const totalCommissionAll = computedUsers.reduce((acc, u) => acc + (u.totalCommission || 0), 0);
  const totalNetCommissionAll = computedUsers.reduce((acc, u) => acc + ((u.totalCommission || 0) * 0.9 - (u.totalSales || 0) * 0.01), 0);

  const exportToCSV = () => {
    const headers = ['Mã CTV', 'Họ Tên CTV', 'Cấp Bậc', 'Số Điện Thoại', 'Người Giới Thiệu', 'Doanh Số (VNĐ)', 'Hoa Hồng Gộp (VNĐ)', 'Thuế TNCN 10%', 'Phí Nền Tảng 1%', 'Thực Nhận (VNĐ)', 'Ghi Chú Admin'];
    
    const rows = computedUsers.map(user => [
      user.id,
      `"${user.name}"`,
      user.tier,
      `="${user.phone}"`,
      `"${user.parent || ''}"`,
      user.totalSales,
      user.totalCommission || 0,
      (user.totalCommission || 0) * 0.1,
      (user.totalSales || 0) * 0.01,
      (user.totalCommission || 0) * 0.9 - (user.totalSales || 0) * 0.01,
      `"${(user.note || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DanhSach_CTV_DoanhSo_${timeFilter === 'all' ? 'ToanThoiGian' : period.replace('-', '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getIcon = (tier) => {
    if (tier === 'DIAMOND') return <Crown size={14} className="text-diamond"/>;
    if (tier === 'GOLD') return <Award size={14} className="text-gold"/>;
    return <Medal size={14} className="text-silver"/>;
  };

  const getColor = (tier) => {
    if (tier === 'DIAMOND') return 'var(--accent-diamond)';
    if (tier === 'GOLD') return 'var(--accent-gold)';
    return 'var(--accent-silver)';
  };

  if (loading) return <div className="text-muted p-4">Đang tải danh sách...</div>;

  return (
    <div className="flex-col gap-6" style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '1rem', width: '100%' }}>
         <PageHeader title="Quản lý & Chốt Lương CTV" subtitle="Tính toán hoa hồng và trích xuất bảng kê Excel." />
         <div className="flex gap-4 items-center flex-wrap justify-center">
            <button className="btn flex items-center gap-2" style={{ background: '#10B981', color: 'white' }} onClick={exportToCSV}>
               <Download size={16} /> Xuất Excel
            </button>
            <select className="input-field" value={timeFilter} onChange={e => setTimeFilter(e.target.value)} style={{ padding: '6px' }}>
               <option value="all">Toàn Thời Gian</option>
               <option value="month">Theo Tháng</option>
            </select>
            {timeFilter === 'month' && (
               <input type="month" className="input-field" value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '6px' }} />
            )}
            <input type="text" className="input-field" placeholder="🔎 Tìm Tên, SĐT CTV..." value={searchQuery} onChange={e => {setSearchQuery(e.target.value); setCurrentPage(1);}} style={{ padding: '6px', minWidth: '200px' }} />
            <button className="btn btn-primary" onClick={onAddUser}>+ Thêm CTV Mới</button>
            <label className="flex items-center gap-1 text-sm font-bold text-muted cursor-pointer" style={{ marginLeft: '10px' }}>
                <input type="checkbox" checked={showTaxes} onChange={e => setShowTaxes(e.target.checked)} />
                Áp dụng Thuế & Phí (11%)
            </label>
         </div>
      </div>

      {/* Summary Cards */}
      <div className="grid-cols gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
         <div className="card glass-panel flex items-center justify-between" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-blue)' }}>
            <div>
              <div className="text-muted text-sm uppercase">Tổng Doanh Số {timeFilter === 'month' ? 'Tháng' : 'Toàn TG'}</div>
              <div className="text-2xl font-bold mt-1 text-primary">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalSalesAll)}</div>
            </div>
            <div className="bg-secondary p-3 rounded-full"><BarChart3 size={24} className="text-blue-500" /></div>
         </div>
         <div className="card glass-panel flex items-center justify-between" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-diamond)' }}>
            <div>
              <div className="text-muted text-sm uppercase">Tổng Hoa Hồng Phải Trả</div>
              <div className="text-2xl font-bold mt-1 text-diamond" style={{ textShadow: '0 0 10px rgba(0, 240, 255, 0.4)' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalNetCommissionAll)}</div>
            </div>
            <div className="bg-secondary p-3 rounded-full"><Wallet size={24} className="text-diamond" /></div>
         </div>
         <div className="card glass-panel flex items-center justify-between" style={{ padding: '16px 20px', borderLeft: '4px solid var(--accent-pink)' }}>
            <div>
              <div className="text-muted text-sm uppercase">Số CTV Ghi Nhận</div>
              <div className="text-2xl font-bold mt-1 text-primary">{computedUsers.length} <span className="text-sm font-normal text-muted">người</span></div>
            </div>
            <div className="bg-secondary p-3 rounded-full"><Users size={24} className="text-pink-500" /></div>
         </div>
      </div>

      <div className="card glass-panel flex-col gap-4" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        {/* Table */}
        <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Cộng Tác Viên</th>
                <th>Cấp Bậc</th>
                <th>Người Giới Thiệu (Tuyến trên)</th>
                <th>Doanh Số</th>
                <th style={{ color: 'var(--accent-diamond)' }}>Hoa Hồng Gộp</th>
                {showTaxes && (
                  <>
                    <th style={{ color: '#F43F5E' }}>Thuế TNCN (10%)</th>
                    <th style={{ color: '#F59E0B' }}>Phí Quản Lý (1%)</th>
                    <th style={{ color: '#10B981' }}>Thực Nhận</th>
                  </>
                )}
                <th>Phân Tích / Note</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {computedUsers.slice((currentPage - 1) * 20, currentPage * 20).map((user, i) => (
                <tr key={i}>
                  <td>
                    <div className="font-bold text-primary">{user.name}</div>
                    <div className="text-xs text-muted">{user.id} - {user.phone}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 font-bold" style={{ color: getColor(user.tier) }}>
                      {getIcon(user.tier)} {user.tier === 'DIAMOND' ? 'Giám đốc PT' : user.tier === 'GOLD' ? 'Quản lý PT' : 'Đại sứ KD'}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">{user.parent}</div>
                  </td>
                  <td>
                    <div className="font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.totalSales)}</div>
                  </td>
                  <td style={{ position: 'relative' }} 
                      onMouseEnter={() => setHoveredTooltip(user.id)} 
                      onMouseLeave={() => setHoveredTooltip(null)}>
                    <div className="font-bold text-diamond" style={{ textShadow: '0 0 10px rgba(0, 240, 255, 0.4)', cursor: 'pointer' }}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.totalCommission || 0)}
                    </div>
                    {hoveredTooltip === user.id && user.commissions && user.commissions.length > 0 && (
                        <div className="tooltip-card glass-panel" style={{
                           position: 'absolute', top: '100%', right: '100%', transform: 'none',
                           background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                           padding: '10px', width: '250px', zIndex: 50, borderRadius: '8px',
                           boxShadow: '0 10px 25px rgba(0,0,0,0.5)', pointerEvents: 'none'
                        }}>
                           <h4 className="text-sm text-primary mb-2 border-b border-gray-700 pb-1">Chi tiết Hoa hồng</h4>
                           <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                               {user.commissions.map((c, idx) => {
                                   let sourceText = c.type === 'DIRECT' 
                                       ? `Khách: ${c.order?.customer?.fullName}` 
                                       : `Tuyến dưới (${c.order?.customer?.fullName})`;
                                   
                                   const amountFmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.amount);
                                   return (
                                     <li key={idx} className="flex justify-between" style={{ borderBottom: '1px dashed #334155', paddingBottom: '2px' }}>
                                        <span className="truncate" style={{ maxWidth: '60%' }} title={sourceText}>{sourceText}</span>
                                        <span className="text-diamond font-bold">{amountFmt}</span>
                                     </li>
                                   )
                               })}
                           </ul>
                        </div>
                    )}
                  </td>
                  {showTaxes && (
                    <>
                      <td>
                        <div className="text-red-500 font-bold">-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((user.totalCommission || 0) * 0.1)}</div>
                      </td>
                      <td>
                        <div className="text-amber-500 font-bold">-{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((user.totalSales || 0) * 0.01)}</div>
                      </td>
                      <td>
                        <div className="text-green-500 font-bold text-lg">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((user.totalCommission || 0) * 0.89)}</div>
                      </td>
                    </>
                  )}
                  <td>
                    <textarea 
                       className="input-field" 
                       defaultValue={user.note} 
                       placeholder="Ghi chú CTV..."
                       onBlur={(e) => handleNoteChange(user.id, e.target.value)}
                       style={{ minHeight: '40px', width: '150px', fontSize: '12px', padding: '4px', resize: 'vertical' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                     <button className="btn-icon flex items-center gap-1" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-blue)', margin: '0 auto'}}
                        onClick={() => onEditUser(user)}
                        title="Sửa thông tin CTV"
                     ><Edit size={16}/></button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="5" className="text-center p-4 text-muted">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {users.length > 20 && (
          <div className="flex justify-between items-center p-4 mt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
             <button className="btn btn-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Trang Trước</button>
             <span className="text-sm font-bold text-muted">Trang {currentPage} / {Math.ceil(users.length / 20)}</span>
             <button className="btn btn-secondary" disabled={currentPage >= Math.ceil(users.length / 20)} onClick={() => setCurrentPage(p => p + 1)}>Trang Sau</button>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsView() {
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

function PriceListView({ isAdmin, serviceList, onRefresh }) {
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editForm, setEditForm] = useState({ price: '', description: '', imageUrl: '' });

  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState({ name: '', group: '', price: '', categoryName: 'Chăm sóc', description: '', imageUrl: '' });

  // Dựa vào danh sách Artboard 2.jpg -> 12.jpg
  const images = [];
  for (let i = 2; i <= 12; i++) {
    images.push(`/Bang Gia Dich Vu/Artboard ${i}.jpg`);
  }

  const handleSavePrice = async (id) => {
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      }).then(r => r.json());
      if (res.success) {
        setEditingServiceId(null);
        if (onRefresh) onRefresh();
      } else {
        alert('Lỗi cập nhật giá!');
      }
    } catch (e) {
      alert('Lỗi kết nối!');
    }
  };

  const handleCreateService = async () => {
    if (!newService.name || !newService.price) return alert('Vui lòng nhập tên và giá sản phẩm');
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
      }).then(r => r.json());
      if (res.success) {
        setNewService({ name: '', group: '', price: '', categoryName: 'Máy Lọc Nước' });
        setIsAdding(false);
        if (onRefresh) onRefresh();
      } else alert('Lỗi tạo sản phẩm!');
    } catch (e) { alert('Lỗi kết nối!'); }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này? Hành động này không thể hoàn tác.')) return;
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success && onRefresh) onRefresh();
    } catch (e) { alert('Lỗi kết nối!'); }
  };

  const filteredServices = (serviceList || []).filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || (s.group || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-col gap-6" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '1rem', width: '100%' }}>
        <PageHeader title="Menu Bảng Giá" subtitle="Các sản phẩm được cập nhật tự động bằng hình ảnh." />
        {isAdmin && (
          <button className="btn btn-secondary" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Xem Bảng Giá Ảnh' : 'Sửa Giá Sản Phẩm'}
          </button>
        )}
      </div>

      {isEditing && isAdmin ? (
        <div className="card glass-panel flex-col gap-4" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
           <div className="flex justify-between items-center w-full">
             <input 
               className="input-field" 
               placeholder="Tìm kiếm sản phẩm để phân loại sửa giá..." 
               value={search} 
               onChange={e => setSearch(e.target.value)}
               style={{ maxWidth: '100%', flex: 1, minWidth: '150px' }}
             />
             <button className="btn btn-primary flex items-center gap-1" onClick={() => setIsAdding(!isAdding)}><PlusCircle size={16}/> Thêm mới</button>
           </div>
           
           <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Tên Sản Phẩm</th>
                    <th>Danh Mục</th>
                    <th>Nhóm</th>
                    <th>Giá Cấu Hình (VNĐ)</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {isAdding && (
                     <tr style={{ background: '#f8fafc' }}>
                       <td><input className="input-field" placeholder="Tên SP, VD: Máy lọc nước..." value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} autoFocus /></td>
                       <td>
                           <select className="input-field" value={newService.categoryName} onChange={e => setNewService({...newService, categoryName: e.target.value})}>
                              <option value="Máy Lọc Nước">Máy Lọc Nước</option>
                              <option value="Lõi Lọc">Lõi Lọc</option>
                              <option value="Phụ Kiện">Phụ Kiện</option>
                           </select>
                       </td>
                       <td><input className="input-field" placeholder="Nhóm, VD: Nhóm bảo hành" value={newService.group} onChange={e => setNewService({...newService, group: e.target.value})} /></td>
                       <td><input type="number" className="input-field" placeholder="10000000" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} style={{ width: '120px' }}/></td>
                       <td>
                           <div className="flex gap-2">
                             <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={handleCreateService}>Lưu</button>
                             <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setIsAdding(false)}>Hủy</button>
                           </div>
                       </td>
                     </tr>
                  )}
                  {filteredServices.map(s => (
                    <Fragment key={s.id}>
                      <tr>
                        <td className="font-bold text-sm">{s.name}</td>
                        <td className="text-xs text-muted uppercase font-bold">{s.category?.name || 'N/A'}</td>
                        <td className="text-xs text-muted">{s.group}</td>
                        <td>
                          {editingServiceId === s.id ? (
                             <input type="number" className="input-field" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} style={{ padding: '6px', width: '100px', minWidth: '80px' }} autoFocus />
                          ) : (
                             <span className="text-diamond font-bold">{new Intl.NumberFormat('vi-VN').format(s.price)}</span>
                          )}
                        </td>
                        <td>
                          {editingServiceId === s.id ? (
                             <div className="flex gap-2">
                               <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handleSavePrice(s.id)}>Lưu</button>
                               <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setEditingServiceId(null)}>Hủy</button>
                             </div>
                          ) : (
                             <div className="flex gap-2">
                                <button className="btn-icon flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--accent-blue)', background: 'transparent', border: 'none' }} onClick={() => { setEditingServiceId(s.id); setEditForm({ price: s.price, description: s.description || '', imageUrl: s.imageUrl || '' }); }}><Edit size={16}/> Sửa</button>
                                <button className="btn-icon flex items-center gap-1 text-sm font-semibold" style={{ color: 'red', background: 'transparent', border: 'none' }} onClick={() => handleDeleteService(s.id)}><Trash2 size={16}/></button>
                             </div>
                          )}
                        </td>
                      </tr>
                      {editingServiceId === s.id && (
                        <tr style={{ background: 'var(--bg-secondary)' }}>
                           <td colSpan="5" style={{ padding: '16px' }}>
                             <div className="flex-col gap-4" style={{ width: '100%' }}>
                               <div className="flex-col gap-2">
                                  <label className="text-xs text-muted font-bold uppercase">Link Ảnh Đại Diện (Nên dùng tỷ lệ 16:9 hoặc Chữ nhật ngang)</label>
                                  <div className="flex flex-wrap gap-2">
                                     <input className="input-field" style={{ flex: 1, minWidth: '200px' }} value={editForm.imageUrl} onChange={e => setEditForm({...editForm, imageUrl: e.target.value})} placeholder="/Bang Gia Dich Vu/Artboard x.jpg hoặc chèn URL bất kỳ..." />
                                     <input type="file" accept="image/*" onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onload = (ev) => {
                                             setEditForm({...editForm, imageFileBase64: ev.target.result, imageUrl: file.name});
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                     }} className="input-field p-1" style={{ width: '100%', maxWidth: '250px', fontSize: '12px' }} />
                                  </div>
                               </div>
                               <div className="flex-col gap-2">
                                  <label className="text-xs text-muted font-bold uppercase">Giới thiệu & Công dụng (Hỗ trợ xuống dòng)</label>
                                  <textarea className="input-field" rows="5" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Tính năng, ưu điểm, gói sản phẩm..."></textarea>
                               </div>
                             </div>
                           </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
           </div>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(s => (
             <div key={s.id} className="card glass-panel flex-col" style={{ padding: '0', overflow: 'hidden', border: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
                 <div style={{ height: '200px', width: '100%', overflow: 'hidden', background: 'var(--bg-secondary)', position: 'relative' }}>
                    {s.imageUrl ? (
                       <img src={s.imageUrl} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                       <div className="flex items-center justify-center h-full w-full text-muted"><Layers size={48} /></div>
                    )}
                    <div style={{ position: 'absolute', top: 10, right: 10, background: 'var(--accent-diamond)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                       {s.category?.name || 'Sản Phẩm'}
                    </div>
                 </div>
                 <div style={{ padding: '16px' }} className="flex-col gap-2">
                    <h3 className="text-primary m-0" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{s.name}</h3>
                    <div className="text-diamond font-bold text-lg">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.price)}</div>
                    <p className="text-muted text-sm m-0" style={{ whiteSpace: 'pre-line', minHeight: '40px' }}>{s.description || 'Chưa có mô tả'}</p>
                 </div>
             </div>
          ))}
         </div>
      )}
    </div>
  );
}

// --- COMMISSION HISTORY COMPONENT ---
function CommissionHistoryView({ currentUser }) {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaxes, setShowTaxes] = useState(false);

  useEffect(() => {
    const fetchId = (currentUser.role === 'admin' || currentUser.role === 'accountant' || currentUser.id === 'ADMIN' || currentUser.id === 'ACCOUNTANT') ? 'ADMIN' : currentUser.id;
    fetch(`/api/commissions?userId=${fetchId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCommissions(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [currentUser]);

  if (loading) return <div className="p-8 text-center text-primary">Đang tải sao kê...</div>;

  return (
    <div className="space-y-6">
      <div className="card glass-panel text-center">
        <h2 className="text-xl font-bold text-primary mb-2">Sao Kê Chi Tiết Dòng Tiền</h2>
        <p className="text-sm text-secondary">
          Bảng liệt kê toàn bộ lịch sử hoa hồng bạn nhận được từ hệ thống
        </p>
        <div className="flex justify-center mt-4">
            <label className="flex items-center gap-1 text-sm font-bold text-muted cursor-pointer">
                <input type="checkbox" checked={showTaxes} onChange={e => setShowTaxes(e.target.checked)} />
                Áp dụng Thuế & Phí (11%)
            </label>
        </div>
      </div>

      <div className="card glass-panel">
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="w-full text-left" style={{ minWidth: '600px' }}>
            <thead>
              <tr className="border-b border-gray-700 text-secondary">
                <th className="py-3 px-4 font-medium" style={{ whiteSpace: 'nowrap' }}>Thời Gian</th>
                <th className="py-3 px-4 font-medium" style={{ whiteSpace: 'nowrap' }}>Loại Chiết Khấu</th>
                <th className="py-3 px-4 font-medium" style={{ whiteSpace: 'nowrap' }}>Khách Hàng Áp Dụng</th>
                <th className="py-3 px-4 font-medium" style={{ whiteSpace: 'nowrap' }}>Tên Sản Phẩm</th>
                <th className="py-3 px-4 font-medium" style={{ whiteSpace: 'nowrap' }}>Đơn Hàng</th>
                <th className="py-3 px-4 font-medium text-right" style={{ whiteSpace: 'nowrap' }}>Hoa Hồng Gộp</th>
                {showTaxes && (
                  <>
                    <th className="py-3 px-4 font-medium text-right" style={{ whiteSpace: 'nowrap' }}>Thuế TNCN (10%)</th>
                    <th className="py-3 px-4 font-medium text-right" style={{ whiteSpace: 'nowrap' }}>Phí Nền Tảng (1%)</th>
                    <th className="py-3 px-4 font-medium text-right" style={{ whiteSpace: 'nowrap' }}>Thực Nhận</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={showTaxes ? 9 : 6} className="py-8 text-center text-secondary">
                    Chưa có phát sinh hoa hồng nào.
                  </td>
                </tr>
              ) : (
                commissions.map(c => {
                  let typeText = 'Không rõ';
                  let typeColor = 'var(--text-primary)';
                  if (c.type === 'DIRECT') { typeText = 'Hoa hồng Trực tiếp'; typeColor = '#3b82f6'; }
                  if (c.type === 'OVERRIDE') { typeText = 'Hoa hồng Cắt cầu (Tuyến dưới)'; typeColor = '#f59e0b'; }
                  if (c.type === 'SPECIAL_BONUS_120M') { typeText = 'Thưởng Vượt Mốc 120M'; typeColor = '#ec4899'; }

                  const dt = new Date(c.createdAt).toLocaleString('vi-VN');
                  const amt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.amount);
                  const customerName = c.order?.customer?.fullName || 'Khách Vãng Lai';
                  const orderVal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.order?.totalAmount || 0);
                  const serviceNames = c.order?.items?.map(i => i.service?.name).join(', ') || 'Sản Phẩm rỗng';

                  return (
                    <tr key={c.id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 text-sm text-secondary">{dt}</td>
                      <td className="py-4 px-4 font-medium" style={{ color: typeColor }}>{typeText}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-secondary" />
                          <span>{customerName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold" style={{ color: 'var(--accent-blue)' }}>{serviceNames}</td>
                      <td className="py-4 px-4 text-sm text-secondary">Trị giá: {orderVal}</td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-diamond text-lg" style={{ textShadow: '0 0 10px rgba(0,240,255,0.3)' }}>
                          {amt}
                        </span>
                      </td>
                      {showTaxes && (
                        <>
                          <td className="py-4 px-4 text-right">
                            <span className="text-red-500 font-bold text-sm">
                              -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.amount * 0.1)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-amber-500 font-bold text-sm">
                              {c.type === 'DIRECT' ? '-' + new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((c.order?.totalAmount || 0) * 0.01) : '-'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-bold text-green-500 text-lg">
                              +{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((c.amount * 0.9) - (c.type === 'DIRECT' ? (c.order?.totalAmount || 0) * 0.01 : 0))}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SystemUsersView() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ fullName: '', phone: '', role: 'accountant', password: '' });
  const [error, setError] = useState('');

  const loadUsers = () => {
    setLoading(true);
    fetch('/api/internal-users').then(r => r.json()).then(res => {
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

function SystemLogsView({ currentUser }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/audit-logs').then(r => r.json()).then(res => {
      if (res.success) setLogs(res.data);
      setLoading(false);
    });
  }, []);

  const STATUS_MAP = {
    'NEW': { label: 'Pre-check', bg: '#E2E8F0', color: '#475569' },
    'CONSULTED': { label: 'Đã tư vấn', bg: '#DBEAFE', color: '#1E40AF' },
    'DEPOSITED': { label: 'Đã cọc', bg: '#FEF3C7', color: '#B45309' },
    'DONE': { label: 'Đã làm', bg: '#D1FAE5', color: '#065F46' },
    'POST_OP': { label: 'Hậu phẫu', bg: '#FCE7F3', color: '#9D174D' },
    'ARRIVED': { label: 'Đã có Đơn', bg: '#FEF3C7', color: '#B45309' }
  };

  if (loading) return <div className="p-4 text-muted">Đang tải lịch sử...</div>;

  const filteredLogs = currentUser?.role === 'accountant'
    ? logs.filter(l => !l.userId?.toUpperCase().includes('(ADM'))
    : logs;

  return (
    <div className="flex-col gap-6">
      <PageHeader title="Lịch Sử Thao Tác Hệ Thống" subtitle="Ghi nhận mọi sự thay đổi đối với dữ liệu từ các tài khoản nội bộ." />
      
      <div className="card glass-panel flex-col gap-4" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="premium-table w-full">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Người thực hiện</th>
                <th>Khách hàng thao tác</th>
                <th>Chi tiết Thay đổi</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => {
                 let detailsObj = {};
                 try { detailsObj = JSON.parse(log.details); } catch(e){}
                 
                 return (
                   <tr key={idx}>
                     <td className="text-sm text-secondary whitespace-nowrap">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                     <td className="font-mono text-xs font-bold text-blue-500">{log.userId}</td>
                     <td className="font-bold">{log.customer?.fullName} <span className="text-muted font-normal text-xs">({log.customer?.phone})</span></td>
                     <td>
                        {log.action === 'UPDATE_STATUS' && (
                           <span className="text-sm">
                             Đã đổi trạng thái từ{' '}
                             <span className="font-bold text-muted">{STATUS_MAP[detailsObj.from]?.label || detailsObj.from}</span>{' '}
                             ➡{' '}
                             <span className="font-bold text-primary">{STATUS_MAP[detailsObj.to]?.label || detailsObj.to}</span>
                           </span>
                        )}
                        {log.action !== 'UPDATE_STATUS' && <span className="text-sm text-muted">{log.action}</span>}
                     </td>
                   </tr>
                 )
              })}
              {logs.length === 0 && <tr><td colSpan="4" className="text-center p-4 text-muted">Chưa có lịch sử.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordModal({ currentUser, onClose }) {
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch(`/api/users/${currentUser.id}/password`, {
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


function ServiceDetailView({ service, onBack }) {
  if (!service) return <div className="p-8 text-center text-muted">Không tìm thấy sản phẩm.</div>;

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <button className="btn flex items-center gap-2" style={{ width: 'fit-content', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={onBack}>
        Trở về Bảng Giá
      </button>

      <div className="card glass-panel flex-col gap-0" style={{ padding: '0', overflow: 'hidden' }}>
        {service.imageUrl && (
          <div style={{ width: '100%', maxHeight: '450px', background: 'var(--bg-secondary)' }}>
             <img src={service.imageUrl} alt={service.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} loading="lazy" />
          </div>
        )}
        
        <div style={{ padding: '2rem' }}>
          <div className="flex justify-between items-start flex-wrap gap-4" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.5rem' }}>
            <div style={{ flex: '1 1 300px' }}>
              <div className="text-muted text-xs uppercase font-bold tracking-widest" style={{ color: 'var(--accent-diamond)', marginBottom: '4px' }}>
                {service.category?.name || 'Sản Phẩm'} {service.group ? '• ' + service.group : ''}
              </div>
              <h1 className="mt-1 mb-2" style={{ 
                  wordBreak: 'break-word', 
                  fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', 
                  fontWeight: '700', 
                  lineHeight: 1.3, 
                  letterSpacing: '-0.01em', 
                  color: 'var(--text-primary)',
                  fontFamily: '"Plus Jakarta Sans", "Outfit", sans-serif' 
              }}>{service.name}</h1>
            </div>
            <div className="text-left" style={{ minWidth: '150px' }}>
              <div className="text-xs text-muted font-bold tracking-widest uppercase mb-1">Giá Niêm Yết</div>
              <div className="font-bold text-diamond" style={{ fontSize: '1.8rem', letterSpacing: '-0.02em', color: '#0369a1' }}>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
              </div>
            </div>
          </div>

          {service.description ? (
             <div className="mt-6">
               <h3 className="text-primary mb-3 font-bold" style={{ fontSize: '1.1rem', color: '#334155' }}>
                 Tóm tắt Sản Phẩm
               </h3>
               <div className="text-secondary" style={{ lineHeight: 1.8, fontSize: '1rem', whiteSpace: 'pre-line', color: '#475569' }}>
                 {service.description}
               </div>
             </div>
          ) : (
            !service.imageUrl && (
             <div className="mt-8 text-center text-muted" style={{ padding: '3rem', border: '1px dashed var(--border-subtle)', borderRadius: '12px' }}>
                <p>Nội dung chi tiết cho sản phẩm này đang cập nhật.</p>
             </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

function UserModal({ userList, editingUser, onClose, onSuccess }) {
  const [formData, setFormData] = useState({ 
    fullName: editingUser ? editingUser.name : '', 
    phone: editingUser ? editingUser.phone : '', 
    tier: editingUser ? editingUser.tier : 'SILVER', 
    parentId: editingUser ? (editingUser.parent && editingUser.parent !== 'Trực tiếp Công ty' ? editingUser.parent.substring(editingUser.parent.indexOf('(')+1, editingUser.parent.indexOf(')')) : '') : '' 
  });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
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
  };

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
              {userList.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.tier === 'DIAMOND' ? 'Giám đốc PT' : u.tier === 'GOLD' ? 'Quản lý PT' : 'Đại sứ KD'})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-between mt-4">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Huỷ bỏ</button>
            <button type="submit" className="btn btn-primary">{editingUser ? 'Cập nhật Dữ liệu' : 'Lưu Hệ thống'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CustomersView({ refreshKey, currentUser, onAddCustomer }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [auditCustomer, setAuditCustomer] = useState(null);

  const computedCustomers = customers.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const cName = (c.fullName || '').toLowerCase();
    const phone = c.phone || '';
    const ctvName = (c.sourceCtv?.fullName || '').toLowerCase();
    return cName.includes(q) || phone.includes(q) || ctvName.includes(q);
  });
  const [auditLogs, setAuditLogs] = useState([]);

  const STATUS_MAP = {
    'NEW': { label: 'Pre-check', bg: '#E2E8F0', color: '#475569' },
    'CONSULTED': { label: 'Đã tư vấn', bg: '#DBEAFE', color: '#1E40AF' },
    'DEPOSITED': { label: 'Đã cọc', bg: '#FEF3C7', color: '#B45309' },
    'DONE': { label: 'Đã làm', bg: '#D1FAE5', color: '#065F46' },
    'POST_OP': { label: 'Hậu phẫu', bg: '#FCE7F3', color: '#9D174D' },
    'ARRIVED': { label: 'Đã có Đơn', bg: '#FEF3C7', color: '#B45309' }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/customers/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, userId: currentUser.id, userFullName: currentUser.fullName })
      }).then(r => r.json());
      if (res.success) {
         setCustomers(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      } else alert('Lỗi cập nhật trạng thái');
    } catch(e) { alert('Lỗi kết nối'); }
  };

  const showAuditLogs = async (id) => {
    try {
      const res = await fetch(`/api/customers/${id}/audit-log`).then(r => r.json());
      if (res.success) {
         setAuditLogs(res.data);
         setAuditCustomer(customers.find(c => c.id === id));
      }
    } catch(e) { alert('Lỗi tải lịch sử thao tác'); }
  };

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.json())
      .then(res => {
        if(res.success) {
          if (currentUser.role === 'admin' || currentUser.role === 'accountant') {
            setCustomers(res.data);
          } else {
            const mine = res.data.filter(c => c.sourceCtv && c.sourceCtv.userId === currentUser.id);
            setCustomers(mine);
          }
          setCurrentPage(1);
        }
      })
      .finally(() => setLoading(false));
  }, [refreshKey, currentUser]);

  if (loading) return <div className="text-muted p-4">Đang tải danh sách...</div>;

  return (
    <div className="flex-col gap-6">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '1rem', width: '100%' }}>
        <PageHeader title="Bảng Check-in Khách Hàng" subtitle="Danh sách khách hàng và CTV nguồn." />
        <div className="flex gap-2 w-full justify-center">
            <input type="text" className="input-field" placeholder="🔎 Tìm Tên, SĐT Khách, Tên CTV..." value={searchQuery} onChange={e => {setSearchQuery(e.target.value); setCurrentPage(1);}} style={{ maxWidth: '400px' }} />
            <button className="btn btn-action" onClick={onAddCustomer}>+ Pre-check Khách Mới</button>
         </div>
      </div>

      <div className="card glass-panel flex-col gap-4" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Họ và Tên Khách</th>
                <th>Số điện thoại</th>
                <th>Người Giới Thiệu (CTV Nguồn)</th>
                <th>Ngày tạo</th>
                <th>Chăm sóc / Theo dõi</th>
              </tr>
            </thead>
            <tbody>
              {computedCustomers.slice((currentPage - 1) * 20, currentPage * 20).map((cus, i) => (
                <tr key={i}>
                  <td>
                    <div className="font-bold text-primary">{cus.fullName}</div>
                    <div className="text-xs text-muted">ID: {cus.id}</div>
                  </td>
                  <td>
                    <div className="font-bold">{cus.phone}</div>
                  </td>
                  <td>
                    {cus.sourceCtv ? (
                      <div className="flex-col">
                        <span className="font-bold">{cus.sourceCtv.fullName}</span>
                        <span className="text-xs text-muted">ID: {cus.sourceCtv.userId}</span>
                      </div>
                    ) : (
                      <span className="text-muted text-sm" style={{ fontStyle: 'italic' }}>-- Trực tiếp Công ty --</span>
                    )}
                  </td>
                  <td>
                    <div className="text-sm">{new Date(cus.registeredAt).toLocaleDateString('vi-VN')}</div>
                  </td>
                  <td>
                     <div className="flex items-center gap-2">
                       {currentUser.role === 'admin' || currentUser.role === 'accountant' ? (
                         <select 
                            className="input-field" 
                            value={cus.status}
                            onChange={(e) => handleStatusChange(cus.id, e.target.value)}
                            style={{
                               padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold',
                               background: (STATUS_MAP[cus.status] || STATUS_MAP.NEW).bg,
                               color: (STATUS_MAP[cus.status] || STATUS_MAP.NEW).color,
                               border: 'none', cursor: 'pointer', outline: 'none'
                            }}
                         >
                           {Object.entries(STATUS_MAP).map(([val, {label}]) => (
                              <option key={val} value={val}>{label}</option>
                           ))}
                         </select>
                       ) : (
                         <span className="badge" style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            background: (STATUS_MAP[cus.status] || STATUS_MAP.NEW).bg,
                            color: (STATUS_MAP[cus.status] || STATUS_MAP.NEW).color
                         }}>
                            {(STATUS_MAP[cus.status] || STATUS_MAP.NEW).label}
                         </span>
                       )}
                       {(currentUser.role === 'admin' || currentUser.role === 'accountant') && (
                         <button className="btn-icon" title="Xem lịch sử thao tác" 
                                 onClick={() => showAuditLogs(cus.id)}
                                 style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '4px' }}>
                            <Clock size={16} className="text-muted" />
                         </button>
                       )}
                     </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan="5" className="text-center p-4 text-muted">Chưa có khách hàng nào được ghi nhận.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {customers.length > 20 && (
          <div className="flex justify-between items-center p-4 mt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
             <button className="btn btn-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Trang Trước</button>
             <span className="text-sm font-bold text-muted">Trang {currentPage} / {Math.ceil(customers.length / 20)}</span>
             <button className="btn btn-secondary" disabled={currentPage >= Math.ceil(customers.length / 20)} onClick={() => setCurrentPage(p => p + 1)}>Trang Sau</button>
          </div>
        )}
      </div>

      {/* Audit Log Modal */}
      {auditCustomer && (
        <div className="modal-overlay z-50">
           <div className="modal-content glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-primary" style={{ color: 'var(--accent-blue)'}}>Lịch Sử Chăm Sóc</h2>
                 <button className="btn-icon" onClick={() => setAuditCustomer(null)}><X size={20}/></button>
              </div>
              <div className="mb-4 pb-2 border-b border-gray-700">
                 <div><b>Khách hàng:</b> <span className="text-primary">{auditCustomer.fullName}</span></div>
                 <div className="text-sm text-muted">SĐT: {auditCustomer.phone}</div>
              </div>
              <div className="flex-col gap-3">
                 {auditLogs.length === 0 ? (
                    <div className="text-center p-4 text-muted border border-dashed rounded border-gray-600">Chưa có thao tác nào được ghi nhận.</div>
                 ) : (
                    auditLogs.map((log, idx) => {
                       let detailsObj = {};
                       try { detailsObj = JSON.parse(log.details); } catch(e){}
                       
                       return (
                          <div key={idx} className="bg-secondary p-3 rounded" style={{ borderLeft: '3px solid var(--accent-blue)' }}>
                             <div className="flex justify-between items-start mb-1">
                                <div className="text-xs text-muted" style={{ fontWeight: '600' }}>{new Date(log.createdAt).toLocaleString('vi-VN')}</div>
                                <div className="badge" style={{ background: '#E2E8F0', color: '#334155', fontSize: '10px' }}>{log.userId}</div>
                             </div>
                             <div className="text-sm mt-1">
                                {log.action === 'UPDATE_STATUS' && (
                                   <span>
                                     Đã đổi trạng thái từ{' '}
                                     <span className="font-bold text-muted">{STATUS_MAP[detailsObj.from]?.label || detailsObj.from}</span>{' '}
                                     ➡{' '}
                                     <span className="font-bold text-primary">{STATUS_MAP[detailsObj.to]?.label || detailsObj.to}</span>
                                   </span>
                                )}
                             </div>
                          </div>
                       )
                    })
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function StatisticsView({ currentUser, userList }) {
  const [data, setData] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all');
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });
  const [userId, setUserId] = useState(currentUser?.role === 'admin' ? '' : currentUser?.id);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/statistics?timeFilter=${timeFilter}&period=${period}&userId=${userId}`)
      .then(r => r.json())
      .then(res => {
         if(res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [timeFilter, period, userId]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff7300', '#eb4d4b', '#6ab04c', '#f0932b'];

  return (
    <div className="flex-col gap-6">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ textAlign: 'center', background: 'rgba(2, 6, 23, 0.6)', padding: '12px 24px', borderRadius: '16px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ color: 'var(--accent-diamond)', fontSize: '1.8rem', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>Thống Kê Bán Hàng</h2>
          <p style={{ color: '#e2e8f0', fontSize: '0.95rem', margin: '4px 0 0' }}>Phân tích tỷ trọng sản phẩm chốt Sale theo doanh thu.</p>
        </div>
        <div className="flex gap-4 items-center" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            {currentUser?.role === 'admin' && (
               <select className="input-field" value={userId} onChange={e => setUserId(e.target.value)} style={{ padding: '6px' }}>
                  <option value="">-- Tất cả CTV --</option>
                  {userList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
               </select>
            )}
            <select className="input-field" value={timeFilter} onChange={e => setTimeFilter(e.target.value)} style={{ padding: '6px' }}>
               <option value="all">Toàn Thời Gian</option>
               <option value="month">Theo Tháng</option>
               <option value="quarter">Theo Quý</option>
            </select>
            
            {timeFilter === 'month' && (
               <input type="month" className="input-field" value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '6px' }} />
            )}
            {timeFilter === 'quarter' && (
               <select className="input-field" value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '6px' }}>
                  <option value="2026-1">Quý 1 / 2026</option>
                  <option value="2026-2">Quý 2 / 2026</option>
                  <option value="2026-3">Quý 3 / 2026</option>
                  <option value="2026-4">Quý 4 / 2026</option>
               </select>
            )}
        </div>
      </div>

      <div className="card glass-panel" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
         {loading ? <div className="text-muted">Đang phân tích dữ liệu...</div> : data.length === 0 ? <div className="text-muted">Không có dữ liệu bán hàng.</div> : (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={130}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)} />
              </PieChart>
            </ResponsiveContainer>
         )}
      </div>
    </div>
  )
}

function AboutView() {
  return (
    <div className="flex-col gap-6 fade-in">
      {/* Hero Section */}
      <div className="card glass-panel" style={{ padding: '0', overflow: 'hidden', borderRadius: '16px' }}>
        <div style={{ position: 'relative', height: '350px', width: '100%' }}>
            <img src="/Hinh Anh/34e3a635d755560b0f441.jpg" alt="Cơ sở HappyLife" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-primary), rgba(0,0,0,0.2))' }} />
            <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', zIndex: 10 }}>
               <h1 className="text-primary text-4xl mb-2" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)', color: '#fff' }}>HAPPYLIFE WATER PURIFIER</h1>
               <p style={{ color: '#F8FAFC', fontSize: '1.2rem', textShadow: '0 1px 4px rgba(0,0,0,0.9)', maxWidth: '700px', lineHeight: '1.6' }}>
                 Nơi kết tinh của y học thẩm mỹ hiện đại và sản phẩm chăm sóc khách hàng đẳng cấp. Không gian làm đẹp 5 sao mang lại vẻ đẹp hoàn mỹ, sự thư giãn tuyệt đối cho khách hàng và cơ chế thu nhập hấp dẫn nhất cho Đối tác kinh doanh.
               </p>
            </div>
        </div>
      </div>

      {/* Info Grids */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div className="card glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
           <h3 className="text-primary mb-4 flex items-center gap-2 text-xl"><Award className="text-gold"/> Đội Ngũ Y kỹ thuật viên</h3>
           <img src="/Hinh Anh/2aa0c377b21733496a063.jpg" alt="Đội ngũ kỹ thuật viên" style={{ width: '100%', borderRadius: '12px', marginBottom: '1.5rem', height: '240px', objectFit: 'cover', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }} />
           <p className="text-muted leading-relaxed" style={{ flex: 1, fontSize: '0.95rem' }}>
             Tự hào hội tụ đội ngũ chuyên gia da liễu và kỹ thuật viên phẫu thuật thẩm mỹ tu nghiệp trong và ngoài nước. 
             Với hơn 10 năm kinh nghiệm lâm sàng cùng hàng ngàn ca làm đẹp thành công, đội ngũ kỹ thuật viên tại HappyLife cam kết mang lại phác đồ bảo hành cá nhân hóa, 
             với tiêu chí <b>"An toàn chuẩn Y khoa - Hiệu quả bền vững"</b>.
             <br/><br/>
             Chúng tôi thường xuyên chuyển giao các công nghệ làm đẹp tiên tiến nhất thế giới để phục vụ khách hàng.
           </p>
        </div>
        
        <div className="card glass-panel flex-col gap-5">
           <h3 className="text-primary mb-2 flex items-center gap-2 text-xl"><Users className="text-diamond"/> Lãnh đạo & Cố vấn</h3>
           <div className="flex items-start gap-4 p-4 rounded-xl border border-subtle" style={{ background: 'var(--bg-secondary)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '50%' }}>
                 <Contact size={28} className="text-blue-500" />
              </div>
              <div>
                 <h4 className="font-bold text-md mb-1" style={{ color: 'var(--accent-blue)' }}>Chăm sóc chuẩn Y khoa</h4>
                 <p className="text-sm text-muted">Đội ngũ điều dưỡng viên thân thiện, tận tâm, được đào tạo bài bản về kiểm soát nhiễm khuẩn, sơ cấp cứu và chăm sóc xoa dịu tâm lý khách hàng hậu phẫu thuật.</p>
              </div>
           </div>
           
           <div className="flex items-start gap-4 p-4 rounded-xl border border-subtle" style={{ background: 'var(--bg-secondary)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
              <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '10px', borderRadius: '50%' }}>
                 <User size={28} className="text-pink-500" />
              </div>
              <div>
                 <h4 className="font-bold text-md mb-1" style={{ color: 'var(--accent-pink)' }}>Tư Vấn Chuyên Sâu 24/7</h4>
                 <p className="text-sm text-muted">Hỗ trợ tư vấn giải phẫu, gói sản phẩm làm đẹp chi tiết rõ ràng. Cam kết đồng hành cùng Khách hàng và CTV suốt 24/7, luôn giải đáp và cập nhật tiến trình bảo hành sát sao.</p>
              </div>
           </div>

           <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
             <p className="text-sm text-muted text-center italic">
               "HappyLife không chỉ là nơi kiến tạo sắc đẹp, mà là một trải nghiệm sản phẩm xuất sắc từ trái tim tới trái tim."
             </p>
           </div>
        </div>
      </div>
    </div>
  )
}

function OrdersView({ currentUser }) {
  const [ctvOrders, setCtvOrders] = useState([]);
  const [websiteOrders, setWebsiteOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('manage');

  const statusMap = {
    'NEW': { text: 'Mới', color: '#3b82f6', bg: '#eff6ff' },
    'CONFIRMED': { text: 'Đã xác nhận', color: '#f59e0b', bg: '#fffbeb' },
    'SHIPPING': { text: 'Đang giao', color: '#8b5cf6', bg: '#f5f3ff' },
    'COMPLETED': { text: 'Hoàn thành', color: '#10b981', bg: '#ecfdf5' },
    'CANCELLED': { text: 'Đã hủy', color: '#ef4444', bg: '#fef2f2' },
  };

  const renderStatus = (status) => {
    const s = statusMap[status] || { text: status || 'N/A', color: '#6b7280', bg: '#f9fafb' };
    return <span style={{ color: s.color, background: s.bg, padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, border: `1px solid ${s.color}30` }}>{s.text}</span>;
  };

  const getNextStatuses = (current) => {
    const t = { 'NEW': ['CONFIRMED', 'CANCELLED'], 'CONFIRMED': ['SHIPPING', 'CANCELLED'], 'SHIPPING': ['COMPLETED', 'CANCELLED'], 'COMPLETED': ['CANCELLED'], 'CANCELLED': [] };
    return t[current] || [];
  };

  const loadOrders = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/admin/website-orders').then(r => r.json()),
    ]).then(([ctvRes, woRes]) => {
      if (ctvRes.success) setCtvOrders(ctvRes.data);
      if (woRes.success) setWebsiteOrders(woRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, []);

  // ─── STATUS CHANGE: Website Orders (source of truth → syncs to shadow CTV) ───
  const handleWebsiteOrderStatus = async (woId, newStatus) => {
    const msg = newStatus === 'COMPLETED'
      ? 'Hoàn thành đơn → tự động tính hoa hồng + cộng điểm. Tiếp tục?'
      : newStatus === 'CANCELLED'
      ? 'Hủy đơn → thu hồi hoa hồng + hoàn trả điểm (nếu đã tính). Tiếp tục?'
      : `Chuyển sang "${statusMap[newStatus]?.text}"?`;
    if (!window.confirm(msg)) return;
    try {
      const res = await fetch(`/api/admin/website-orders/${woId}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }).then(r => r.json());
      if (res.success) {
        let extra = res.settlement ? ` → ${res.settlement.commissions} hoa hồng` : '';
        extra += res.reversal ? ` → Thu hồi ${res.reversal.commissionsRevoked} hoa hồng` : '';
        alert('Cập nhật thành công!' + extra);
        loadOrders();
      } else { alert('Lỗi: ' + res.message); }
    } catch (e) { alert('Lỗi kết nối'); }
  };

  // ─── STATUS CHANGE: Standalone CTV Portal orders (đơn gốc, không có WebsiteOrder) ───
  const handleCtvPortalStatus = async (orderId, newStatus) => {
    const msg = newStatus === 'COMPLETED'
      ? 'Hoàn thành đơn → tự động tính hoa hồng + cộng điểm. Tiếp tục?'
      : newStatus === 'CANCELLED'
      ? 'Hủy đơn → thu hồi hoa hồng + hoàn trả điểm (nếu đã tính). Tiếp tục?'
      : `Chuyển sang "${statusMap[newStatus]?.text}"?`;
    if (!window.confirm(msg)) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }).then(r => r.json());
      if (res.success) {
        let extra = res.settlement ? ` → ${res.settlement.commissions} hoa hồng` : '';
        extra += res.reversal ? ` → Thu hồi ${res.reversal.commissionsRevoked} hoa hồng` : '';
        alert('Cập nhật thành công!' + extra);
        loadOrders();
      } else { alert('Lỗi: ' + res.message); }
    } catch (e) { alert('Lỗi kết nối'); }
  };

  if (loading) return <div className="p-4 text-center">Đang tải danh sách đơn hàng...</div>;

  // Separate CTV orders: shadow (linked from WebsiteOrder) vs standalone (CTV Portal)
  const shadowOrderIds = new Set(websiteOrders.filter(wo => wo.shadowOrderId).map(wo => wo.shadowOrderId));
  const standaloneCtvOrders = ctvOrders.filter(o => !shadowOrderIds.has(o.id));

  return (
    <div className="flex-col gap-6 fade-in">
       <div className="card glass-panel flex-col gap-4">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-primary flex items-center gap-2"><ShoppingCart className="text-blue-500"/> Quản lý Đơn Hàng</h2>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setActiveSubTab('manage')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeSubTab === 'manage' ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-muted hover:bg-gray-200'}`}>
              ⚙️ Quản lý trạng thái ({websiteOrders.length + standaloneCtvOrders.length})
            </button>
            <button onClick={() => setActiveSubTab('ctv')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeSubTab === 'ctv' ? 'bg-purple-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-muted hover:bg-gray-200'}`}>
              📋 Đơn CTV — Chỉ xem ({ctvOrders.length})
            </button>
          </div>

          {/* ════════ TAB 1: QUẢN LÝ TRẠNG THÁI (Website + CTV Portal standalone) ════════ */}
          {activeSubTab === 'manage' && (
          <div className="flex-col gap-6">

            {/* ── Section A: Website Orders ── */}
            <div className="table-container fade-in bg-secondary rounded-xl p-1" style={{ border: '1px solid var(--border-subtle)' }}>
              <div className="p-3 text-xs font-bold" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(59,130,246,0.05)', color: '#3b82f6' }}>
                📦 Đơn Website ({websiteOrders.length}) — Thay đổi trạng thái ở đây sẽ tự động đồng bộ sang Đơn CTV
              </div>
              <table className="data-table" style={{ width: '100%', minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Mã Đơn / Ngày</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Khách Hàng</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Sản Phẩm / Giá</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Trạng Thái</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {websiteOrders.length === 0 ? (
                    <tr><td colSpan="5" className="text-center p-6 text-muted">Chưa có đơn Website nào</td></tr>
                  ) : websiteOrders.map(wo => {
                    const next = getNextStatuses(wo.status);
                    return (
                    <tr key={wo.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px' }}>
                        <div className="font-bold text-primary" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{wo.id.slice(0, 8).toUpperCase()}</div>
                        <div className="text-xs text-muted mt-1">{new Date(wo.createdAt).toLocaleString('vi-VN')}</div>
                        {wo.isCtvOrder && <span className="text-xs font-bold text-purple-500">CTV ↗</span>}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div className="font-bold" style={{ color: 'var(--accent-diamond)' }}>{wo.customerName}</div>
                        <div className="text-xs text-muted mt-1">{wo.customerPhone}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div className="font-medium text-secondary text-sm">{wo.productTitle || 'N/A'}</div>
                        <div className="text-green-500 font-bold text-sm mt-1">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(wo.totalAmount)}</div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {renderStatus(wo.status)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {next.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {next.map(ns => (
                              <button key={ns} onClick={() => handleWebsiteOrderStatus(wo.id, ns)}
                                className="text-xs font-bold px-3 py-1 rounded-lg transition-all hover:opacity-80"
                                style={{ color: statusMap[ns]?.color, background: statusMap[ns]?.bg, border: `1px solid ${statusMap[ns]?.color}40` }}>
                                → {statusMap[ns]?.text}
                              </button>
                            ))}
                          </div>
                        ) : <span className="text-xs text-muted">—</span>}
                      </td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Section B: Standalone CTV Portal Orders ── */}
            {standaloneCtvOrders.length > 0 && (
            <div className="table-container fade-in bg-secondary rounded-xl p-1" style={{ border: '1px solid var(--border-subtle)' }}>
              <div className="p-3 text-xs font-bold" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(139,92,246,0.05)', color: '#8b5cf6' }}>
                🏪 Đơn CTV Portal ({standaloneCtvOrders.length}) — Đơn tạo trực tiếp từ CTV Portal, không có đơn Website liên kết
              </div>
              <table className="data-table" style={{ width: '100%', minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Mã Đơn / Ngày</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Khách Hàng</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Sản Phẩm / Doanh Thu</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Trạng Thái</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {standaloneCtvOrders.map(order => {
                    const next = getNextStatuses(order.status);
                    return (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px' }}>
                        <div className="font-bold text-primary" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{order.id.slice(0, 8).toUpperCase()}</div>
                        <div className="text-xs text-muted mt-1">{new Date(order.createdAt).toLocaleString('vi-VN')}</div>
                        <div className="text-xs text-muted">{order.purchaseType === 'SELF_PURCHASE' ? '🛒 Tự mua' : '👤 Khách mua'}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div className="font-bold" style={{ color: 'var(--accent-diamond)' }}>{order.customer?.fullName}</div>
                        <div className="text-xs text-muted mt-1">SĐT: {order.customer?.phone}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {order.items?.map((item, idx) => {
                          const prod = item.product || item.service;
                          return (<div key={idx} className="text-sm">
                            <span className="font-medium text-secondary">{prod?.title || prod?.name || 'Sản phẩm'}</span>
                            <span className="text-muted ml-1">x{item.qty || 1}</span>
                            <span className="text-green-500 font-bold ml-2">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount)}</span>
                          </div>);
                        })}
                        <div className="font-bold text-blue-500 text-sm mt-1">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {renderStatus(order.status)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {next.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {next.map(ns => (
                              <button key={ns} onClick={() => handleCtvPortalStatus(order.id, ns)}
                                className="text-xs font-bold px-3 py-1 rounded-lg transition-all hover:opacity-80"
                                style={{ color: statusMap[ns]?.color, background: statusMap[ns]?.bg, border: `1px solid ${statusMap[ns]?.color}40` }}>
                                → {statusMap[ns]?.text}
                              </button>
                            ))}
                          </div>
                        ) : <span className="text-xs text-muted">—</span>}
                      </td>
                    </tr>);
                  })}
                </tbody>
              </table>
            </div>
            )}
          </div>
          )}

          {/* ════════ TAB 2: ĐƠN CTV — CHỈ XEM (READ-ONLY) ════════ */}
          {activeSubTab === 'ctv' && (
          <div className="table-container fade-in bg-secondary rounded-xl p-1" style={{ border: '1px solid var(--border-subtle)' }}>
            <div className="p-3 text-xs text-muted" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(139,92,246,0.03)' }}>
              📋 Tab này chỉ hiển thị — trạng thái được đồng bộ từ đơn gốc. Để thay đổi trạng thái, vui lòng sử dụng tab "Quản lý trạng thái".
            </div>
            <table className="data-table" style={{ width: '100%', minWidth: '700px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Mã Đơn / Ngày</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Khách Hàng</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Doanh Thu</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Loại / CTV</th>
                </tr>
              </thead>
              <tbody>
                {ctvOrders.length === 0 ? (
                  <tr><td colSpan="5" className="text-center p-6 text-muted">Chưa có đơn CTV nào</td></tr>
                ) : ctvOrders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px' }}>
                      <div className="font-bold text-primary" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{order.id.slice(0, 8).toUpperCase()}</div>
                      <div className="text-xs text-muted mt-1">{new Date(order.createdAt).toLocaleString('vi-VN')}</div>
                      {shadowOrderIds.has(order.id) && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#dbeafe', color: '#2563eb', fontSize: '0.65rem', fontWeight: 700 }}>Shadow ↤ Website</span>}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div className="font-bold" style={{ color: 'var(--accent-diamond)' }}>{order.customer?.fullName}</div>
                      <div className="text-xs text-muted mt-1">SĐT: {order.customer?.phone}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {order.items?.map((item, idx) => {
                        const prod = item.product || item.service;
                        return (<div key={idx} className="text-sm">
                          <span className="text-secondary">{prod?.title || prod?.name || 'SP'}</span>
                          <span className="text-green-500 font-bold ml-2">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount)}</span>
                        </div>);
                      })}
                      <div className="font-bold text-blue-500 text-sm mt-1">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}</div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {renderStatus(order.status)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div className="text-xs">{order.purchaseType === 'SELF_PURCHASE' ? '🛒 Tự mua' : '👤 Khách mua'}</div>
                      <div className="badge mt-1" style={{ background: 'rgba(234,179,8,0.1)', color: '#ca8a04', border: '1px solid rgba(202,138,4,0.3)', padding: '2px 8px', display: 'inline-block', fontSize: '0.7rem' }}>
                        {order.customer?.sourceCtv?.fullName || 'Khách Tự Do'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
       </div>
    </div>
  )

}

