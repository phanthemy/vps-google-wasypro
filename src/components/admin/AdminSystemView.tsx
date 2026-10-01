import React from 'react';
import { AlertTriangle, Shield, Trash2 } from 'lucide-react';

export default function AdminSystemView() {
  const handleFactoryReset = async () => {
    const code = window.prompt(
      '⚠️ FACTORY RESET — XÓA TOÀN BỘ DỮ LIỆU\n\n' +
      'Sẽ xóa:\n' +
      '✓ Orders (Website + CTV + Portal)\n' +
      '✓ Members + Customers\n' +
      '✓ Ambassadors + CTV\n' +
      '✓ Commission + Wallet\n' +
      '✓ Rank + Genealogy\n' +
      '✓ Points (QP/SP)\n' +
      '✓ NPP (Đăng ký, Đơn mua, Thanh toán, Kích hoạt)\n\n' +
      'Giữ lại:\n' +
      '✓ Super Admin\n' +
      '✓ Sản phẩm\n' +
      '✓ Gói NPP (Combo 5, Combo 15, Chiến lược)\n' +
      '✓ Cấu hình hệ thống\n\n' +
      'Nhập: DELETE ALL DATA'
    );
    if (code !== 'DELETE ALL DATA') return;
    if (!window.confirm('⚠️ LẦN CUỐI: Bạn CHẮC CHẮN muốn xóa TOÀN BỘ dữ liệu?')) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('crm_token');
      const csrf = (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/) || [])[1] || '';
      const res = await fetch('/api/admin/factory-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token, 'X-CSRF-Token': csrf },
        body: JSON.stringify({ confirm: 'DELETE ALL DATA' }),
      }).then(r => r.json());
      if (res.success) {
        window.alert('✅ Factory Reset hoàn tất!\n\n' + Object.entries(res.summary).map(([k,v]) => k + ': ' + v).join('\n'));
      } else {
        window.alert('Lỗi: ' + res.message);
      }
    } catch(e) {
      window.alert('Lỗi kết nối');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-slate-700" />
          <h2 className="text-xl font-bold text-slate-900">Hệ Thống</h2>
        </div>
        <p className="text-sm text-slate-500">Quản lý hệ thống, dữ liệu test, factory reset</p>
      </div>

      <div className="bg-red-50 rounded-3xl p-6 border-2 border-red-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-800 mb-1">Factory Reset</h3>
            <p className="text-sm text-red-700 mb-4">
              Xóa <strong>TOÀN BỘ</strong> dữ liệu hệ thống. Chỉ giữ lại Super Admin và cấu hình.
              <br />Hành động này <strong>KHÔNG THỂ HOÀN TÁC</strong>.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="font-bold text-red-800 mb-2">Sẽ xóa:</p>
                <ul className="space-y-1 text-red-700">
                  <li>✓ Orders (Website + CTV)</li>
                  <li>✓ Members + Customers</li>
                  <li>✓ Ambassadors + CTV</li>
                  <li>✓ Commission + Wallet</li>
                  <li>✓ Rank + Genealogy</li>
                  <li>✓ Points (QP/SP)</li>
                  <li>✓ NPP (Đăng ký, Đơn mua, Thanh toán)</li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-sky-800 mb-2">Giữ lại:</p>
                <ul className="space-y-1 text-sky-700">
                  <li>✓ Super Admin</li>
                  <li>✓ Sản phẩm</li>
                  <li>✓ Cấu hình hoa hồng</li>
                  <li>✓ Gói NPP (cấu hình)</li>
                  <li>✓ Cấu hình hệ thống</li>
                </ul>
              </div>
            </div>

            <button
              onClick={handleFactoryReset}
              className="px-6 py-3 rounded-2xl text-sm font-bold transition-all border-2 border-red-400 bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200 flex items-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              🔥 Factory Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
