import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Network, 
  Settings, 
  Menu, 
  Bell, 
  User, 
  Wallet,
  Layers,
  Plus,
  Contact,
  BookOpen,
  Download,
  PieChart as PieChartIcon,
  UserCog,
  History,
  Key,
  ShoppingCart,
  Truck,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import './App.css';

// Modals
import CustomerModal from './components/modals/CustomerModal.jsx';
import OrderModal from './components/modals/OrderModal.jsx';
import UserModal from './components/modals/UserModal.jsx';
import ChangePasswordModal from './components/modals/ChangePasswordModal.jsx';

// Views
import LoginView from './views/LoginView.jsx';
import DashboardView from './views/DashboardView.jsx';
import NetworkView from './views/NetworkView.jsx';
import UsersView from './views/UsersView.jsx';
import CustomersView from './views/CustomersView.jsx';
import OrdersView from './views/OrdersView.jsx';
import SettingsView from './views/SettingsView.jsx';
import PriceListView from './views/PriceListView.jsx';
import ServiceDetailView from './views/ServiceDetailView.jsx';
import StatisticsView from './views/StatisticsView.jsx';
import CommissionHistoryView from './views/CommissionHistoryView.jsx';
import SystemUsersView from './views/SystemUsersView.jsx';
import SystemLogsView from './views/SystemLogsView.jsx';
import AboutView from './views/AboutView.jsx';
import WholesaleOrdersView from './views/WholesaleOrdersView.jsx';
import RankView from './views/RankView.jsx';

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

  // Lắng nghe session-expired từ fetch interceptor - show login mà không reload
  useEffect(() => {
    const handler = () => setCurrentUser(null);
    window.addEventListener('session-expired', handler);
    return () => window.removeEventListener('session-expired', handler);
  }, []);

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

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch(e) {}
    localStorage.removeItem('crm_user');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginView onLogin={(user) => {
      localStorage.setItem('crm_user', JSON.stringify(user));
      setCurrentUser(user);
      if (user.mustChangePassword) {
        setPassModalOpen(true);
      }
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
          <div className="logo-icon">
            <Layers size={24} />
          </div>
          <span className="logo-text text-gradient">WATER KING</span>
        </div>
        <nav className="sidebar-nav">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
          >
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </div>
          {currentUser?.role !== 'customer' && (
            <div 
              className={`nav-item ${activeTab === 'network' ? 'active' : ''}`}
              onClick={() => { setActiveTab('network'); setSidebarOpen(false); }}
            >
              <Network size={20} />
              <span>Sơ đồ</span>
            </div>
          )}
          {isAdminOrAccountant && (
            <div 
              className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
            >
              <Users size={20} />
              <span>Danh sách CTV</span>
            </div>
          )}
          {currentUser?.role !== 'customer' && (
            <div 
              className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => { setActiveTab('customers'); setSidebarOpen(false); }}
            >
              <Contact size={20} />
              <span>Danh sách Khách</span>
            </div>
          )}
          <div 
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setSidebarOpen(false); }}
          >
            <ShoppingCart size={20} />
            <span>Quản lý Đơn Hàng</span>
          </div>
          {/* Settings tạm ẩn theo Phase 2C */}
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
          {currentUser?.role !== 'customer' && (
            <>
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
            </>
          )}
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
            className={`nav-item ${activeTab === 'wholesale' ? 'active' : ''}`}
            onClick={() => { setActiveTab('wholesale'); setSidebarOpen(false); }}
          >
            <Truck size={20} />
            <span>Đơn Hàng Sỉ</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'rank' ? 'active' : ''}`}
            onClick={() => { setActiveTab('rank'); setSidebarOpen(false); }}
          >
            <TrendingUp size={20} />
            <span>Hạng & Ambassador</span>
          </div>
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
              {activeTab === 'wholesale' && 'Quản Lý Đơn Hàng Sỉ'}
              {activeTab === 'rank' && 'Hạng & Ambassador'}
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                <span className="text-primary font-medium" style={{ fontSize: '0.875rem' }}>{currentUser.fullName}</span>
                {currentUser.businessId && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#d97706' }}>
                    Mã ĐT: {currentUser.businessId}
                  </span>
                )}
              </div>
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
          {activeTab === 'orders' && <OrdersView currentUser={currentUser} />}
          {activeTab === 'settings' && isAdmin && <SettingsView />}
          {activeTab === 'pricelist' && <PriceListView isAdmin={isAdminOrAccountant} serviceList={serviceList} onRefresh={() => setRefreshKey(prev => prev + 1)} />}
          {activeTab === 'service-detail' && <ServiceDetailView service={serviceList.find(s => s.id === activeServiceId)} onBack={() => setActiveTab('pricelist')} />}
          {activeTab === 'statistics' && <StatisticsView currentUser={currentUser} userList={userList} />}
          {activeTab === 'commissions' && <CommissionHistoryView currentUser={currentUser} setActiveTab={setActiveTab} />}
          {activeTab === 'internal-users' && isAdmin && <SystemUsersView />}
          {activeTab === 'audit-logs' && isAdminOrAccountant && <SystemLogsView currentUser={currentUser} />}
          {activeTab === 'wholesale' && <WholesaleOrdersView currentUser={currentUser} />}
          {activeTab === 'rank' && <RankView currentUser={currentUser} />}
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
           currentUser={currentUser}
           customerList={customerList}
           userList={userList}
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


export default App;
