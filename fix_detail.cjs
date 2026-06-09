const fs = require('fs');

let appCode = fs.readFileSync('src/App.jsx', 'utf-8');

// 1. Service Detail View Replacement
const detailRegex = /function ServiceDetailView\(\{ service, onBack \}\) \{[\s\S]*?export default App;/;

const newDetail = `function ServiceDetailView({ service, onBack }) {
  if (!service) return <div className="p-8 text-center text-muted">Không tìm thấy dịch vụ.</div>;

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
                {service.category?.name || 'Dịch Vụ'} {service.group ? '• ' + service.group : ''}
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
                 Tóm tắt Dịch vụ
               </h3>
               <div className="text-secondary" style={{ lineHeight: 1.8, fontSize: '1rem', whiteSpace: 'pre-line', color: '#475569' }}>
                 {service.description}
               </div>
             </div>
          ) : (
            !service.imageUrl && (
             <div className="mt-8 text-center text-muted" style={{ padding: '3rem', border: '1px dashed var(--border-subtle)', borderRadius: '12px' }}>
                <p>Nội dung chi tiết cho dịch vụ này đang cập nhật.</p>
             </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default App;`;

appCode = appCode.replace(detailRegex, newDetail);


// 2. Fix Flex parent blowing up table width on mobile (PriceListView)
const glassPanelRegex = /<div className="card glass-panel flex-col gap-4">/g;
// Replace with width: '100%', overflow: 'hidden' to constrain the flex child
const newGlassPanel = `<div className="card glass-panel flex-col gap-4" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>`;
appCode = appCode.replace(glassPanelRegex, newGlassPanel);

const searchInputRegex = /style=\{\{ maxWidth: '300px' \}\}/;
appCode = appCode.replace(searchInputRegex, `style={{ maxWidth: '100%', flex: 1, minWidth: '150px' }}`);

fs.writeFileSync('src/App.jsx', appCode, 'utf-8');
console.log("Fixes applied successfully!");
