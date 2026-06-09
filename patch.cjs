const fs = require('fs');

let content = fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/scratch/myspa/src/App.jsx', 'utf8');

// 1. App State for Service Dropdown
content = content.replace(
  "  const [refreshKey, setRefreshKey] = useState(0);",
  "  const [refreshKey, setRefreshKey] = useState(0);\n\n  // Service Menu State\n  const [isServicesExpanded, setIsServicesExpanded] = useState(false);\n  const [isServicesShowAll, setIsServicesShowAll] = useState(false);\n  const [activeServiceId, setActiveServiceId] = useState(null);"
);

// 2. Login UI changes
content = content.replace(
  "<Building2 size={32} className=\"text-diamond\" />",
  "<img src=\"/logo.jpg\" alt=\"JINSHANG Logo\" style={{ width: '80%', height: '80%', objectFit: 'contain', borderRadius: '50%' }} />"
);
content = content.replace(
  "Myspa ERP/CRM",
  "JINSHANG CRM"
);
content = content.replace(
  "Hệ Thống Quản Trị Tích Hợp Đa Dịch Vụ",
  "Hệ thống Quản lý Đối tác Tích hợp"
);
content = content.replace(
  "url(\"/bg.jpg\")",
  "url(\"/Bang Gia Dich Vu/Artboard 2.jpg\")"
);

// 3. AdminCommissions Layout Fix
content = content.replace(
  "  return (\n    <div className=\"flex-col gap-6\">\n      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '1rem', width: '100%' }}>",
  "  return (\n    <div className=\"flex-col gap-6\" style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>\n      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '1rem', width: '100%' }}>"
);

// 4. AdminCommissions Net Calculation
content = content.replace(
  "  const totalCommissionAll = computedUsers.reduce((acc, u) => acc + (u.totalCommission || 0), 0);",
  "  const totalCommissionAll = computedUsers.reduce((acc, u) => acc + (u.totalCommission || 0), 0);\n  const totalNetCommissionAll = computedUsers.reduce((acc, u) => acc + ((u.totalCommission || 0) * 0.9 - (u.totalSales || 0) * 0.01), 0);"
);
content = content.replace(
  "<div className=\"text-2xl font-bold mt-1 text-diamond\" style={{ textShadow: '0 0 10px rgba(0, 240, 255, 0.4)' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalCommissionAll)}</div>",
  "<div className=\"text-2xl font-bold mt-1 text-diamond\" style={{ textShadow: '0 0 10px rgba(0, 240, 255, 0.4)' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalNetCommissionAll)}</div>"
);

// 5. Service Menu Dropdown
const oldMenu = `          <div 
            className={\`nav-item \${activeTab === 'pricelist' ? 'active' : ''}\`}
            onClick={() => { setActiveTab('pricelist'); setSidebarOpen(false); }}
          >
            <BookOpen size={20} />
            <span>Bảng Giá Dịch Vụ</span>
          </div>`;

const newMenu = `          <div className="nav-group" style={{ display: 'flex', flexDirection: 'column' }}>
            <div 
              className={\`nav-item \${(activeTab === 'pricelist' || activeTab === 'service-detail') ? 'active' : ''}\`}
              onClick={() => { setIsServicesExpanded(!isServicesExpanded); setActiveTab('pricelist'); }}
              style={{ justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BookOpen size={20} />
                <span>Danh Mục Dịch Vụ</span>
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
          </div>`;
content = content.replace(oldMenu, newMenu);

// 6. ServiceDetailView Router
content = content.replace(
  "{activeTab === 'pricelist' && <PriceListView isAdmin={isAdminOrAccountant} serviceList={serviceList} onRefresh={() => setRefreshKey(prev => prev + 1)} />}",
  "{activeTab === 'pricelist' && <PriceListView isAdmin={isAdminOrAccountant} serviceList={serviceList} onRefresh={() => setRefreshKey(prev => prev + 1)} />}\n          {activeTab === 'service-detail' && <ServiceDetailView service={serviceList.find(s => s.id === activeServiceId)} onBack={() => setActiveTab('pricelist')} />}"
);

// 7. PriceListView forms
content = content.replace(
  "const [editPrice, setEditPrice] = useState('');\n\n  const [isAdding, setIsAdding] = useState(false);\n  const [newService, setNewService] = useState({ name: '', group: '', price: '', categoryName: 'DVB NỘI KHOA' });",
  "const [editForm, setEditForm] = useState({ price: '', description: '', imageUrl: '' });\n\n  const [isAdding, setIsAdding] = useState(false);\n  const [newService, setNewService] = useState({ name: '', group: '', price: '', categoryName: 'Chăm sóc', description: '', imageUrl: '' });"
);

content = content.replace(
  "body: JSON.stringify({ price: editPrice })",
  "body: JSON.stringify(editForm)"
);

// 8. ServiceDetailView export replace
const serviceDetailStr = `
function ServiceDetailView({ service, onBack }) {
  if (!service) return <div className="p-8 text-center text-muted">Không tìm thấy dịch vụ.</div>;

  return (
    <div className="flex-col gap-6 animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <button className="btn flex items-center gap-2" style={{ width: 'fit-content', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} onClick={onBack}>
        Trở về Bảng Giá
      </button>

      <div className="card glass-panel flex-col gap-6" style={{ padding: '0', overflow: 'hidden' }}>
        {service.imageUrl && (
          <div style={{ width: '100%', height: '400px', background: '#000' }}>
             <img src={service.imageUrl} alt={service.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
          </div>
        )}
        
        <div style={{ padding: '2rem' }}>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <div className="text-muted text-sm uppercase font-bold tracking-widest" style={{ color: 'var(--accent-diamond)' }}>{service.category?.name || 'Dịch Vụ'} {service.group ? '• ' + service.group : ''}</div>
              <h1 className="text-primary mt-2" style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1.2 }}>{service.name}</h1>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted">Giá Niêm Yết</div>
              <div className="text-2xl font-bold text-diamond">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}</div>
            </div>
          </div>

          {service.description && (
             <div className="mt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
               <h3 className="text-primary mb-4 font-bold" style={{ fontSize: '1.2rem', color: 'var(--accent-blue)' }}>Giới Thiệu & Công Dụng</h3>
               <div className="text-secondary" style={{ lineHeight: 1.8, fontSize: '15px', whiteSpace: 'pre-line' }}>
                 {service.description}
               </div>
             </div>
          )}

          {!service.description && !service.imageUrl && (
             <div className="mt-8 text-center text-muted" style={{ padding: '3rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                <p>Nội dung chi tiết cho dịch vụ này đang được cập nhật.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;`;

content = content.replace("export default App;", serviceDetailStr);

fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/scratch/myspa/src/App.jsx', content, 'utf8');
console.log('App.jsx repatched successfully');
