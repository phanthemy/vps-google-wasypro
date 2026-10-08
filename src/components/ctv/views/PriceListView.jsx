import React, { useState, useEffect, Fragment } from 'react';
import { Edit, Trash2, PlusCircle, Layers, Award } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';

export default function PriceListView({ isAdmin, serviceList, onRefresh }) {
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editForm, setEditForm] = useState({ price: '', commissionPoints: 0, description: '', imageUrl: '' });
  const [localServices, setLocalServices] = useState([]);

  useEffect(() => {
    if (!serviceList || serviceList.length === 0) {
      fetch('/api/services', { credentials: 'include' })
        .then(r => r.json())
        .then(d => { if (d.success && Array.isArray(d.data)) setLocalServices(d.data); })
        .catch(() => {});
    }
  }, [serviceList]);

  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState({ name: '', group: '', price: '', commissionPoints: 0, categoryName: 'Máy Lọc Nước', description: '', imageUrl: '' });

  const handleSavePrice = async (id) => {
    try {
      const res = await fetch(`/api/services/${id}`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          price: Number(editForm.price),
          commissionPoints: Number(editForm.commissionPoints || 0)
        })
      }).then(r => r.json());
      if (res.success) {
        setEditingServiceId(null);
        if (onRefresh) onRefresh();
      } else {
        alert('Lỗi cập nhật sản phẩm: ' + (res.message || ''));
      }
    } catch (e) {
      alert('Lỗi kết nối máy chủ!');
    }
  };

  const handleCreateService = async () => {
    if (!newService.name || !newService.price) return alert('Vui lòng nhập tên và giá sản phẩm');
    try {
      const res = await fetch('/api/services', {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newService,
          price: Number(newService.price),
          commissionPoints: Number(newService.commissionPoints || 0)
        })
      }).then(r => r.json());
      if (res.success) {
        setNewService({ name: '', group: '', price: '', commissionPoints: 0, categoryName: 'Máy Lọc Nước', description: '', imageUrl: '' });
        setIsAdding(false);
        if (onRefresh) onRefresh();
      } else alert('Lỗi tạo sản phẩm: ' + (res.message || ''));
    } catch (e) { alert('Lỗi kết nối máy chủ!'); }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này? Hành động này không thể hoàn tác.')) return;
    try {
      const res = await fetch(`/api/services/${id}`, { credentials: 'include', method: 'DELETE' }).then(r => r.json());
      if (res.success && onRefresh) onRefresh();
    } catch (e) { alert('Lỗi kết nối máy chủ!'); }
  };

  const activeList = (serviceList && serviceList.length > 0) ? serviceList : localServices;
  const filteredServices = activeList.filter(s => 
    (s.name || '').toLowerCase().includes(search.toLowerCase()) || ((s.group || s.category?.name || '')).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-col gap-6" style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginBottom: '1rem', width: '100%' }}>
        <PageHeader title="Menu Bảng Giá Sản Phẩm" subtitle="Bảng giá niêm yết và điểm hoa hồng (commission points) chuẩn Phase 2C." />
        {isAdmin && (
          <button className="btn btn-secondary" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Xem Dạng Thẻ (Card View)' : 'Sửa Giá & Điểm Hoa Hồng'}
          </button>
        )}
      </div>

      {isEditing && isAdmin ? (
        <div className="card glass-panel flex-col gap-4" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
          <div className="flex justify-between items-center w-full gap-2">
            <input 
              className="input-field" 
              placeholder="Tìm kiếm sản phẩm để sửa giá và điểm..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: '100%', flex: 1, minWidth: '150px' }}
            />
            <button className="btn btn-primary flex items-center gap-1 shrink-0" onClick={() => setIsAdding(!isAdding)}>
              <PlusCircle size={16}/> Thêm mới
            </button>
          </div>
           
          <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Tên Sản Phẩm</th>
                  <th>Danh Mục</th>
                  <th>Nhóm</th>
                  <th>Giá Bán (VNĐ)</th>
                  <th style={{ color: '#c084fc' }}>Điểm Hoa Hồng (Points)</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isAdding && (
                  <tr style={{ background: '#f8fafc' }}>
                    <td><input className="input-field" placeholder="Tên SP..." value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} autoFocus /></td>
                    <td>
                      <select className="input-field" value={newService.categoryName} onChange={e => setNewService({...newService, categoryName: e.target.value})}>
                        <option value="Máy Lọc Nước">Máy Lọc Nước</option>
                        <option value="Lõi Lọc">Lõi Lọc</option>
                        <option value="Phụ Kiện">Phụ Kiện</option>
                      </select>
                    </td>
                    <td><input className="input-field" placeholder="Nhóm..." value={newService.group} onChange={e => setNewService({...newService, group: e.target.value})} /></td>
                    <td><input type="number" className="input-field" placeholder="10000000" value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} style={{ width: '110px' }}/></td>
                    <td><input type="number" className="input-field font-bold text-purple-600" placeholder="5000" value={newService.commissionPoints} onChange={e => setNewService({...newService, commissionPoints: e.target.value})} style={{ width: '90px' }}/></td>
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
                      <td className="text-xs text-muted">{s.group || '-'}</td>
                      <td>
                        {editingServiceId === s.id ? (
                          <input type="number" className="input-field" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} style={{ padding: '6px', width: '100px' }} autoFocus />
                        ) : (
                          <span className="text-diamond font-bold">{new Intl.NumberFormat('vi-VN').format(s.price)}đ</span>
                        )}
                      </td>
                      <td>
                        {editingServiceId === s.id ? (
                          <input type="number" className="input-field font-bold text-purple-600" value={editForm.commissionPoints} onChange={e => setEditForm({...editForm, commissionPoints: e.target.value})} style={{ padding: '6px', width: '90px' }} />
                        ) : (
                          <span className="font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                            {(s.commissionPoints || 0).toLocaleString('vi-VN')} pts
                          </span>
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
                            <button className="btn-icon flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--accent-blue)', background: 'transparent', border: 'none' }} onClick={() => { setEditingServiceId(s.id); setEditForm({ price: s.price, commissionPoints: s.commissionPoints || 0, description: s.description || '', imageUrl: s.imageUrl || '' }); }}><Edit size={16}/> Sửa</button>
                            <button className="btn-icon flex items-center gap-1 text-sm font-semibold" style={{ color: 'red', background: 'transparent', border: 'none' }} onClick={() => handleDeleteService(s.id)}><Trash2 size={16}/></button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {editingServiceId === s.id && (
                      <tr style={{ background: 'var(--bg-secondary)' }}>
                        <td colSpan="6" style={{ padding: '16px' }}>
                          <div className="flex-col gap-4" style={{ width: '100%' }}>
                            <div className="flex-col gap-2">
                              <label className="text-xs text-muted font-bold uppercase">Link Ảnh Đại Diện (Nên dùng tỷ lệ 16:9 hoặc Chữ nhật ngang)</label>
                              <input className="input-field" style={{ flex: 1, width: '100%' }} value={editForm.imageUrl} onChange={e => setEditForm({...editForm, imageUrl: e.target.value})} placeholder="/uploads/products/... hoặc link URL ảnh..." />
                            </div>
                            <div className="flex-col gap-2">
                              <label className="text-xs text-muted font-bold uppercase">Giới thiệu & Tính năng thiết bị</label>
                              <textarea className="input-field" rows="4" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Thông số kỹ thuật, số lõi lọc, công nghệ Hydro..."></textarea>
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
                {s.imageUrl || "/images/product-1.webp" ? (
                  <img src={s.imageUrl || "/images/product-1.webp"} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="flex items-center justify-center h-full w-full text-muted"><Layers size={48} /></div>
                )}
                <div style={{ position: 'absolute', top: 10, right: 10, background: 'var(--accent-diamond)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  {s.category?.name || 'Sản Phẩm'}
                </div>
              </div>
              <div style={{ padding: '16px' }} className="flex-col gap-2">
                <h3 className="text-primary m-0" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{s.name}</h3>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-diamond font-bold text-lg">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.price)}</span>
                  <span className="text-xs font-mono font-bold text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                    {(s.commissionPoints || 0).toLocaleString('vi-VN')} pts
                  </span>
                </div>
                <p className="text-muted text-sm m-0" style={{ whiteSpace: 'pre-line', minHeight: '40px' }}>{s.description || 'Máy lọc nước công nghệ cao HappyLife Water King'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
