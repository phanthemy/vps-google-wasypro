import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

export default function SearchableServiceSelect({ serviceList, value, onChange }) {
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
