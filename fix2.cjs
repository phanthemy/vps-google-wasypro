const fs = require('fs');
let lines = fs.readFileSync('C:/Users/Administrator/.gemini/antigravity/scratch/myspa/src/App.jsx', 'utf8').split('\n');

const newStr = `                    <React.Fragment key={s.id}>
                      <tr>
                        <td className="font-bold text-sm">{s.name}</td>
                        <td className="text-xs text-muted uppercase font-bold">{s.category?.name || 'N/A'}</td>
                        <td className="text-xs text-muted">{s.group}</td>
                        <td>
                          {editingServiceId === s.id ? (
                             <input type="number" className="input-field" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} style={{ padding: '6px', width: '120px' }} autoFocus />
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
                                  <input className="input-field" value={editForm.imageUrl} onChange={e => setEditForm({...editForm, imageUrl: e.target.value})} placeholder="/Bang Gia Dich Vu/Artboard x.jpg hoặc chèn URL bất kỳ..." />
                               </div>
                               <div className="flex-col gap-2">
                                  <label className="text-xs text-muted font-bold uppercase">Giới thiệu & Công dụng (Hỗ trợ xuống dòng)</label>
                                  <textarea className="input-field" rows="5" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Tính năng, ưu điểm, liệu trình..."></textarea>
                               </div>
                             </div>
                           </td>
                        </tr>
                      )}
                    </React.Fragment>`;

lines.splice(1374, 26, newStr);

fs.writeFileSync('C:/Users/Administrator/.gemini/antigravity/scratch/myspa/src/App.jsx', lines.join('\n'), 'utf8');
console.log('App.jsx patched successfully');
