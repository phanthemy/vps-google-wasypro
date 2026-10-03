import React, { useState } from 'react';
import { ChevronDown, X, AlertCircle } from 'lucide-react';

export default function SearchableProductSelect({ productList, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedProduct = productList.find(p => p.id === value);
  const displayValue = selectedProduct
    ? '[' + (selectedProduct.category?.name || 'SP') + '] ' + selectedProduct.title
    : '';

  const filtered = productList.filter(p =>
    (p.title.toLowerCase() + ' ' + (p.category?.name || '').toLowerCase()).includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, curr) => {
    const group = curr.category?.name || 'S\u1ea3n Ph\u1ea9m';
    if (!acc[group]) acc[group] = [];
    acc[group].push(curr);
    return acc;
  }, {});

  return (
    <div style={{ position: 'relative' }}>
      {!isOpen ? (
        <div className="input-field cursor-pointer flex justify-between items-center" onClick={() => setIsOpen(true)}>
          <span className="truncate" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '90%' }}>
            {displayValue || '-- Ch\u1ecdn S\u1ea3n Ph\u1ea9m --'}
          </span>
          <ChevronDown size={16} />
        </div>
      ) : (
        <div className="searchable-dropdown">
          <div style={{ padding: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
            <input
              autoFocus
              className="input-field"
              style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: 'none', borderRadius: '4px' }}
              placeholder="G\u00f5 \u0111\u1ec3 t\u00ecm ki\u1ebfm..."
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
              <X size={16} /> \u0110\u00f3ng Danh S\u00e1ch
            </div>
            {Object.keys(grouped).map(group => (
              <div key={group}>
                <div className="text-xs font-bold text-muted uppercase" style={{ padding: '6px 12px', background: '#f8fafc' }}>{group}</div>
                {grouped[group].map(p => (
                  <div
                    key={p.id}
                    className="cursor-pointer hover-service-item"
                    style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}
                    onClick={() => {
                      onChange(p.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                  >
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{p.title}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-bold" style={{ color: 'var(--accent-diamond)' }}>
                        {new Intl.NumberFormat('vi-VN').format(p.price)}d
                      </span>
                      {p.commissionPoints > 0 ? (
                        <span className="text-xs font-bold" style={{ color: 'var(--accent-green)' }}>
                          {p.commissionPoints.toLocaleString('vi-VN')} CP
                        </span>
                      ) : (
                        <span className="text-xs font-semibold" style={{ color: '#d97706' }}>
                          Ch\u01b0a c\u00f3 CP
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {filtered.length === 0 && <div className="p-4 text-center text-sm text-muted">Kh\u00f4ng t\u00ecm th\u1ea5y s\u1ea3n ph\u1ea9m</div>}
          </div>
        </div>
      )}
    </div>
  );
}