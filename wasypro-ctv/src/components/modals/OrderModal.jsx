import React, { useState } from 'react';
import { X } from 'lucide-react';
import SearchableProductSelect from '../common/SearchableProductSelect.jsx';

export default function OrderModal({ currentUser, customerList, userList, productList, onClose, onSuccess }) {
  const [customerId, setCustomerId] = useState('');
  const [cart, setCart] = useState([]);
  
  // Filter lists for CTV
  const isCtv = currentUser?.role === 'ctv';
  const filteredCustomers = isCtv ? customerList.filter(c => c.sourceCtvId === currentUser.id || (c.sourceCtv && c.sourceCtv.userId === currentUser.id)) : customerList;
  const filteredUsers = isCtv ? userList.filter(u => u.id === currentUser.id) : userList;
  
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentQty, setCurrentQty] = useState(1);
  const [currentAmount, setCurrentAmount] = useState('');
  
  const [error, setError] = useState('');

  const handleProductChange = (pId) => {
     const prod = productList.find(p => p.id === pId);
     setCurrentProductId(pId);
     setCurrentAmount(prod ? prod.price * currentQty : '');
  };

  const handleQtyChange = (e) => {
     const newQty = Math.max(1, parseInt(e.target.value, 10)) || 1;
     setCurrentQty(newQty);
     const prod = productList.find(p => p.id === currentProductId);
     if (prod) {
        setCurrentAmount(prod.price * newQty);
     }
  };

  const addToCart = () => {
     if(!currentProductId || !currentAmount) {
         setError('Vui lòng chọn sản phẩm và nhập số tiền!');
         return;
     }
     const prod = productList.find(p => p.id === currentProductId);
     const newCart = [...cart, { productId: currentProductId, qty: currentQty, amount: Number(currentAmount), name: prod?.title || 'Sản phẩm', cp: prod?.commissionPoints || 0 }];
     setCart(newCart);
     
     // Reset form
     setCurrentProductId('');
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
    
    let finalCart = [...cart];
    if (currentProductId && currentAmount) {
       const prod = productList.find(p => p.id === currentProductId);
       finalCart.push({ productId: currentProductId, qty: currentQty, amount: Number(currentAmount), name: prod?.title || 'Sản phẩm', cp: prod?.commissionPoints || 0 });
       setCart(finalCart);
       setCurrentProductId('');
       setCurrentQty(1);
       setCurrentAmount('');
    }
    
    if (!customerId) return setError('Vui lòng chọn khách hàng!');
    if (finalCart.length === 0) return setError('Vui lòng chọn sản phẩm và nhập số tiền!');

    try {
      let payload = {
         items: finalCart.map(c => ({ productId: c.productId, amount: Number(c.amount), qty: Number(c.qty) }))
      };
      if (customerId.startsWith('CTV_')) {
          payload.ctvBuyerId = customerId.replace('CTV_', '');
      } else {
          payload.customerId = customerId;
      }

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
            <label className="text-sm font-bold text-primary">Khách Hàng Mục Tiêu / CTV Nhập Hàng</label>
            <select required className="input-field" value={customerId} onChange={e => setCustomerId(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px' }}>
              <option value="">-- Chọn Khách Hàng / CTV --</option>
              <optgroup label="Khách hàng đăng ký (Pre-check)">
                {filteredCustomers.map(c => <option key={c.id} value={c.id}>{c.fullName} - {c.phone} (Nguồn: {c.sourceCtv?.fullName})</option>)}
              </optgroup>
              <optgroup label="Đại lý / CTV Tự Nhập Hàng">
                {filteredUsers && filteredUsers.map(u => <option key={`ctv_${u.id}`} value={`CTV_${u.id}`}>[CTV tự nhập] {u.name} - {u.phone} ({u.tier})</option>)}
              </optgroup>
            </select>
          </div>

          <div className="p-4 rounded-xl border border-subtle mt-2" style={{ background: '#f8fafc', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}>
             <h4 className="font-bold mb-3 text-sm text-primary">Kho Cục Sản Phẩm</h4>
             <div className="flex-col gap-3">
                <div className="flex-col gap-1">
                   <label className="text-xs font-semibold text-muted uppercase tracking-wider" style={{ fontSize: '10px' }}>Sản phẩm / Dịch vụ</label>
                   <SearchableProductSelect 
                      productList={productList}
                      value={currentProductId}
                      onChange={handleProductChange}
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
