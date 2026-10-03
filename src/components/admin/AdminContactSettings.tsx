import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  Share2, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Mail, 
  MapPin, 
  Globe, 
  Smartphone,
  Eye,
  Info
} from 'lucide-react';

interface ContactConfig {
  facebook: string;
  zalo: string;
  hotline: string;
  hotlineTel: string;
  email: string;
  address: string;
}

const DEFAULT_CONFIG: ContactConfig = {
  facebook: 'https://facebook.com/wasypro',
  zalo: 'https://zalo.me/2928413591064686973',
  hotline: '1900 98 98 78',
  hotlineTel: '1900989878',
  email: 'support@wasypro.com',
  address: 'Tầng 6, Tòa nhà WASY Tower, Q. Cầu Giấy, TP. Hà Nội',
};

export const AdminContactSettings: React.FC = () => {
  const [config, setConfig] = useState<ContactConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getHeaders = () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || localStorage.getItem('crm_token');
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const cookieCsrf = (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/) || [])[1] || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-CSRF-Token': csrfMeta ? csrfMeta.getAttribute('content') || cookieCsrf : cookieCsrf,
    };
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/public/contact-config');
      const data = await res.json();
      if (data && data.success && data.data) {
        setConfig(prev => ({
          ...prev,
          ...data.data,
        }));
      }
    } catch (err) {
      console.error('Lỗi tải cấu hình contact:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setToast(null);

    // Auto format hotlineTel if empty
    const sanitizedHotlineTel = config.hotlineTel?.trim() 
      ? config.hotlineTel.replace(/\s+/g, '') 
      : config.hotline.replace(/\s+/g, '');

    const payload = {
      ...config,
      hotlineTel: sanitizedHotlineTel,
    };

    try {
      const res = await fetch('/api/admin/contact-config', {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data && data.success) {
        setConfig(prev => ({ ...prev, ...data.data }));
        setToast({ type: 'success', message: '✅ Đã lưu cấu hình Facebook, Zalo OA và Hotline thành công!' });
      } else {
        setToast({ type: 'error', message: data.message || 'Lỗi khi lưu cấu hình.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: 'Lỗi kết nối máy chủ khi lưu cấu hình.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục về các giá trị liên hệ mặc định?')) {
      setConfig(DEFAULT_CONFIG);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-xs min-h-[350px]">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 text-sm font-semibold">Đang tải cấu hình kênh liên hệ & Footer...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Feedback */}
      {toast && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm font-semibold shadow-md animate-in fade-in slide-in-from-top-2 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
            <Share2 className="w-3.5 h-3.5" />
            <span>Kênh Liên Hệ & Mạng Xã Hội</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Cấu Hình Footer, Zalo OA & Hotline
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Chủ động điều chỉnh link mạng xã hội (Facebook, Zalo OA), số điện thoại Hotline và thông tin hiển thị tại chân trang website (Footer) cũng như biểu mẫu đăng ký / đăng nhập.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2 active:scale-95"
            title="Khôi phục mặc định"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Mặc định</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Inputs (Left) & Realtime Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-cyan-600" />
              <span>Thông Tin Cấu Hình</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Lưu tự động vào hệ thống</span>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* 1. Facebook Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[10px] font-black">f</span>
                <span>Đường link Facebook / Fanpage</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={config.facebook}
                  onChange={e => setConfig({ ...config, facebook: e.target.value })}
                  placeholder="https://facebook.com/wasypro"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pl-10"
                />
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-500">
                Link mở khi khách hàng bấm vào icon Facebook ở Footer và biểu mẫu Đăng ký / Đăng nhập.
              </p>
            </div>

            {/* 2. Zalo OA Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-white border border-blue-200 text-[#0068FF] flex items-center justify-center text-[9px] font-black">Z</span>
                <span>Đường link Zalo Official Account (OA) / Zalo CSKH</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={config.zalo}
                  onChange={e => setConfig({ ...config, zalo: e.target.value })}
                  placeholder="https://zalo.me/2928413591064686973"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pl-10"
                />
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-500">
                Link mở khi khách hàng bấm vào icon Zalo (Ví dụ: <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-mono">https://zalo.me/ID_OA</code> hoặc <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-mono">https://zalo.me/0937353535</code>).
              </p>
            </div>

            {/* 3. Hotline Display & Hotline Tel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]">📞</span>
                  <span>Số Hotline hiển thị</span>
                </label>
                <input
                  type="text"
                  value={config.hotline}
                  onChange={e => setConfig({ ...config, hotline: e.target.value })}
                  placeholder="1900 98 98 78"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
                <p className="text-[11px] text-slate-500">
                  Số hiển thị dạng text (VD: <span className="font-semibold">1900 98 98 78</span>).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-red-500" />
                  <span>Số Hotline quay số (tel:)</span>
                </label>
                <input
                  type="text"
                  value={config.hotlineTel}
                  onChange={e => setConfig({ ...config, hotlineTel: e.target.value })}
                  placeholder="1900989878"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
                <p className="text-[11px] text-slate-500">
                  Số máy tự gọi khi bấm nút (không dấu cách, VD: <span className="font-semibold">1900989878</span>).
                </p>
              </div>
            </div>

            {/* 4. Support Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-600" />
                <span>Email Hỗ Trợ CSKH</span>
              </label>
              <input
                type="email"
                value={config.email}
                onChange={e => setConfig({ ...config, email: e.target.value })}
                placeholder="support@wasypro.com"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
              />
            </div>

            {/* 5. Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                <span>Địa Chỉ Trụ Sở Công Ty (Hiển thị Footer)</span>
              </label>
              <input
                type="text"
                value={config.address}
                onChange={e => setConfig({ ...config, address: e.target.value })}
                placeholder="Tầng 6, Tòa nhà WASY Tower, Q. Cầu Giấy, TP. Hà Nội"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-7 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Đang lưu cấu hình...' : 'Lưu Cấu Hình Mới'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Live Preview Modal Buttons */}
          <div className="bg-gradient-to-b from-slate-50 to-blue-50/40 rounded-3xl p-6 shadow-xs border border-blue-100/80 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Xem Trước Hiển Thị Biểu Mẫu (Preview)</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                Trực quan
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              3 biểu tượng liên hệ trực tiếp dưới đáy Form Đăng Ký / Đăng Nhập (đã gỡ bỏ chữ phân cách và Google theo yêu cầu):
            </p>

            {/* Preview of the 3 circular icons in Auth Modal */}
            <div className="p-5 bg-white/90 backdrop-blur-md rounded-2xl border border-white shadow-lg flex flex-col items-center justify-center gap-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                3 Icon Liên Hệ Trực Tiếp
              </div>

              <div className="flex items-center justify-center gap-4">
                {/* 1. Facebook */}
                <a
                  href={config.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-[#1877F2] shadow-[0_4px_12px_rgba(24,119,242,0.35)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-white cursor-pointer group"
                  title="Facebook"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* 2. Zalo */}
                <a
                  href={config.zalo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-white shadow-md border-2 border-blue-200 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer group"
                  title="Zalo Official Account"
                >
                  <span className="font-black text-[#0068FF] text-[12px] tracking-tight">Zalo</span>
                </a>

                {/* 3. Hotline */}
                <a
                  href={`tel:${config.hotlineTel}`}
                  className="w-11 h-11 rounded-full bg-gradient-to-br from-[#ff3b30] to-[#e60000] shadow-[0_4px_12px_rgba(255,59,48,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-white cursor-pointer group"
                  title={`Gọi Hotline ${config.hotline}`}
                >
                  <PhoneCall className="w-5 h-5 stroke-[2.2]" />
                </a>
              </div>

              <div className="text-[11px] text-slate-500 text-center mt-1">
                Bấm vào các icon trên để kiểm tra đường dẫn thực tế!
              </div>
            </div>
          </div>

          {/* Card: Live Preview Footer */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>Xem Trước Chân Trang (Footer)</span>
              </h3>
              <span className="text-[10px] text-slate-400">Desktop & Mobile</span>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>Trụ sở: {config.address || 'Chưa cấu hình'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <a href={`tel:${config.hotlineTel}`} className="font-bold text-amber-400 hover:underline">
                  Hotline 24/7: {config.hotline}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Email: {config.email}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Mạng xã hội:</span>
              <div className="flex items-center gap-2">
                <a
                  href={config.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-xs text-xs font-bold"
                  title="Facebook"
                >
                  f
                </a>
                <a
                  href={config.zalo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full bg-white text-[#0068FF] flex items-center justify-center hover:scale-110 transition-transform shadow-xs text-[9px] font-black"
                  title="Zalo"
                >
                  Zalo
                </a>
                <a
                  href={`tel:${config.hotlineTel}`}
                  className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-xs"
                  title="Hotline"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Notice Info */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Lưu ý:</strong> Khi bạn thay đổi thông tin ở đây và bấm <strong>Lưu Thay Đổi</strong>, hệ thống sẽ lưu vào cơ sở dữ liệu trên máy chủ. Khách hàng khi tải lại website sẽ nhìn thấy ngay các link và số Hotline mới nhất.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

