import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, MapPin, Search, ExternalLink, Phone, Clock, Filter, Store, Wrench, Building2, Eye, EyeOff } from 'lucide-react';

export interface Dealer {
  id: string;
  name: string;
  code: string;
  phone: string | null;
  email: string | null;
  address: string;
  province: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapUrl: string | null;
  openHours: string | null;
  imageUrl: string | null;
  type: string; // dealer | showroom | service_center
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const AdminDealerManagement: React.FC = () => {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvince, setFilterProvince] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [deletingDealer, setDeletingDealer] = useState<Dealer | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    phone: '',
    email: '',
    address: '',
    province: '',
    district: '',
    googleMapUrl: '',
    latitude: '',
    longitude: '',
    openHours: '08:00 - 18:00',
    imageUrl: '',
    type: 'dealer',
    description: '',
    sortOrder: 0,
    isActive: true
  });
  const [submitting, setSubmitting] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(csrfMeta ? { 'X-CSRF-Token': csrfMeta.getAttribute('content') || '' } : {}),
    };
  };

  const fetchDealers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/dealers', {
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Không thể tải danh sách đại lý (Mã lỗi: ' + res.status + ')');
      const data = await res.json();
      setDealers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối khi tải danh sách đại lý');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDealers();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const handleOpenForm = (dealer?: Dealer) => {
    setError(null);
    if (dealer) {
      setEditingDealer(dealer);
      setFormData({
        name: dealer.name || '',
        code: dealer.code || '',
        phone: dealer.phone || '',
        email: dealer.email || '',
        address: dealer.address || '',
        province: dealer.province || '',
        district: dealer.district || '',
        googleMapUrl: dealer.googleMapUrl || '',
        latitude: dealer.latitude != null ? dealer.latitude.toString() : '',
        longitude: dealer.longitude != null ? dealer.longitude.toString() : '',
        openHours: dealer.openHours || '08:00 - 18:00',
        imageUrl: dealer.imageUrl || '',
        type: dealer.type || 'dealer',
        description: dealer.description || '',
        sortOrder: dealer.sortOrder != null ? dealer.sortOrder : 0,
        isActive: dealer.isActive !== undefined ? dealer.isActive : true
      });
    } else {
      setEditingDealer(null);
      const randomCode = 'DL-' + Math.floor(1000 + Math.random() * 9000);
      setFormData({
        name: '',
        code: randomCode,
        phone: '',
        email: '',
        address: '',
        province: '',
        district: '',
        googleMapUrl: '',
        latitude: '',
        longitude: '',
        openHours: '08:00 - 18:00 (Thứ 2 - Thứ 7)',
        imageUrl: '',
        type: 'dealer',
        description: '',
        sortOrder: (dealers.length + 1),
        isActive: true
      });
    }
    setIsFormOpen(true);
  };

  // Helper auto extract lat lng from Google Maps link
  const handleMapUrlChange = (url: string) => {
    setFormData(prev => {
      const updated = { ...prev, googleMapUrl: url };
      // Check if URL has coordinates: @10.7627,106.6907 or ?q=10.7627,106.6907
      const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match && (!prev.latitude || !prev.longitude)) {
        updated.latitude = match[1];
        updated.longitude = match[2];
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim(),
        province: formData.province.trim(),
        district: formData.district.trim() || null,
        googleMapUrl: formData.googleMapUrl.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        openHours: formData.openHours.trim() || null,
        imageUrl: formData.imageUrl.trim() || null,
        type: formData.type,
        description: formData.description.trim() || null,
        sortOrder: parseInt(formData.sortOrder.toString(), 10) || 0,
        isActive: Boolean(formData.isActive)
      };

      const url = editingDealer ? `/api/admin/dealers/${editingDealer.id}` : '/api/admin/dealers';
      const method = editingDealer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Lỗi khi lưu thông tin đại lý');
      }

      await fetchDealers();
      setIsFormOpen(false);
      showNotification(editingDealer ? 'Đã cập nhật đại lý thành công!' : 'Đã thêm đại lý mới thành công!');
    } catch (err: any) {
      setError(err.message || 'Lỗi xử lý');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDealer) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/dealers/${deletingDealer.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Lỗi khi xóa đại lý');
      }
      await fetchDealers();
      setIsDeleteOpen(false);
      showNotification(`Đã xóa đại lý "${deletingDealer.name}" thành công!`);
    } catch (err: any) {
      setError(err.message || 'Lỗi xóa đại lý');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (dealer: Dealer) => {
    try {
      const newStatus = !dealer.isActive;
      const res = await fetch(`/api/admin/dealers/${dealer.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ isActive: newStatus })
      });
      if (!res.ok) throw new Error('Không thể đổi trạng thái');
      setDealers(prev => prev.map(d => d.id === dealer.id ? { ...d, isActive: newStatus } : d));
      showNotification(`Đã ${newStatus ? 'hiển thị' : 'ẩn'} đại lý "${dealer.name}"`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Provinces list from current data
  const provinces = Array.from(new Set(dealers.map(d => d.province).filter(Boolean))).sort();

  // Filters
  const filteredDealers = dealers.filter(d => {
    const matchesSearch = 
      (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (d.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.province || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProvince = filterProvince === 'all' || d.province === filterProvince;
    const matchesType = filterType === 'all' || d.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && d.isActive) || 
      (filterStatus === 'inactive' && !d.isActive);

    return matchesSearch && matchesProvince && matchesType && matchesStatus;
  });

  // Stats
  const totalCount = dealers.length;
  const showroomCount = dealers.filter(d => d.type === 'showroom').length;
  const dealerCount = dealers.filter(d => d.type === 'dealer').length;
  const ttbhCount = dealers.filter(d => d.type === 'service_center' || d.type === 'ttbh').length;
  const provinceCount = provinces.length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏪</span>
              <h2 className="text-xl font-bold text-slate-800">Quản Lý Hệ Thống Đại Lý & Showroom</h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý danh sách điểm bán, showroom, trung tâm bảo hành và liên kết Google Maps hiển thị trên trang chủ
            </p>
          </div>
          
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0072F5] text-white rounded-xl hover:bg-blue-600 transition-all font-medium text-sm shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm đại lý mới</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Tổng điểm bán</div>
            <div className="text-lg font-bold text-slate-800 mt-1">{totalCount}</div>
          </div>
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100/60">
            <div className="text-xs text-[#0072F5] font-medium flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Showroom
            </div>
            <div className="text-lg font-bold text-[#0072F5] mt-1">{showroomCount}</div>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/60">
            <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Store className="w-3.5 h-3.5" /> Đại lý ủy quyền
            </div>
            <div className="text-lg font-bold text-emerald-700 mt-1">{dealerCount}</div>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100/60">
            <div className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5" /> TT Bảo hành
            </div>
            <div className="text-lg font-bold text-amber-700 mt-1">{ttbhCount}</div>
          </div>
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100/60 col-span-2 sm:col-span-1">
            <div className="text-xs text-indigo-600 font-medium flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Tỉnh / Thành
            </div>
            <div className="text-lg font-bold text-indigo-700 mt-1">{provinceCount}</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm theo tên đại lý, mã, địa chỉ, SĐT, tỉnh thành..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072F5] focus:bg-white transition-all text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterProvince}
              onChange={(e) => setFilterProvince(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0072F5]"
            >
              <option value="all">Tất cả Tỉnh/Thành ({provinces.length})</option>
              {provinces.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0072F5]"
            >
              <option value="all">Tất cả loại hình</option>
              <option value="showroom">Showroom</option>
              <option value="dealer">Đại lý ủy quyền</option>
              <option value="service_center">Trung tâm bảo hành</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0072F5]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hiển thị</option>
              <option value="inactive">Đã ẩn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên Đại Lý / Mã</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Phân loại</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Địa chỉ & Tỉnh thành</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Liên hệ / Giờ mở</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Google Maps</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#0072F5] border-t-transparent mr-2"></div>
                    <span>Đang tải danh sách đại lý...</span>
                  </td>
                </tr>
              ) : filteredDealers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="font-medium text-slate-700">Không tìm thấy đại lý nào phù hợp</p>
                    <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bấm Thêm đại lý mới</p>
                  </td>
                </tr>
              ) : (
                filteredDealers.map((dealer) => {
                  const mapLink = dealer.googleMapUrl || (dealer.latitude && dealer.longitude ? `https://maps.google.com/?q=${dealer.latitude},${dealer.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dealer.name + ' ' + dealer.address)}`);
                  return (
                    <tr key={dealer.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{dealer.name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">Mã: {dealer.code || dealer.id.slice(-6)}</div>
                        {dealer.sortOrder ? (
                          <div className="text-[11px] text-slate-400">Thứ tự: {dealer.sortOrder}</div>
                        ) : null}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        {dealer.type === 'showroom' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-[#0072F5] border border-blue-200/50">
                            🏪 Showroom
                          </span>
                        ) : dealer.type === 'service_center' || dealer.type === 'ttbh' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/50">
                            🔧 TT Bảo Hành
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                            🤝 Đại Lý
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 max-w-xs">
                        <div className="text-slate-800 font-medium text-xs leading-relaxed">{dealer.address}</div>
                        <div className="text-xs text-[#0072F5] font-medium mt-1 flex items-center gap-1">
                          <MapPin size={12} className="shrink-0" />
                          <span>{dealer.province}{dealer.district ? ` (${dealer.district})` : ''}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        {dealer.phone ? (
                          <div className="text-xs text-slate-800 flex items-center gap-1.5 font-medium">
                            <Phone size={13} className="text-slate-400" />
                            <span>{dealer.phone}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400">-</div>
                        )}
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
                          <Clock size={12} className="text-slate-400" />
                          <span>{dealer.openHours || '08:00 - 17:30'}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {dealer.googleMapUrl ? (
                          <a
                            href={mapLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-[#0072F5] hover:bg-sky-100 rounded-lg text-xs font-medium transition-colors"
                            title="Mở Google Maps"
                          >
                            <span>Xem Map</span>
                            <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-300 italic">Chưa gắn</span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(dealer)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                            dealer.isActive 
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50' 
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                          }`}
                          title="Bấm để bật/tắt hiển thị"
                        >
                          {dealer.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                          <span>{dealer.isActive ? 'Hiển thị' : 'Đã ẩn'}</span>
                        </button>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleOpenForm(dealer)}
                          className="p-1.5 text-slate-500 hover:text-[#0072F5] hover:bg-sky-50 rounded-lg transition-colors mr-1"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setDeletingDealer(dealer); setIsDeleteOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa đại lý"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal (Add / Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col my-auto border border-slate-100">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏪</span>
                <h3 className="text-lg font-bold text-slate-800">
                  {editingDealer ? 'Cập Nhật Thông Tin Đại Lý' : 'Thêm Đại Lý / Showroom Mới'}
                </h3>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {error && (
                <div className="p-3.5 mb-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">Lỗi:</span>
                    <span>{error}</span>
                  </div>
                  <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <form id="dealer-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tên đại lý */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Tên Đại Lý / Showroom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Showroom WasyPro Cần Thơ VIP"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072F5] text-sm"
                    />
                  </div>

                  {/* Mã đại lý */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mã Đại Lý <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: DL-CT-001"
                      value={formData.code}
                      onChange={e => setFormData({...formData, code: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072F5] text-sm font-mono"
                    />
                  </div>

                  {/* Phân loại */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Phân loại hình thức
                    </label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072F5] text-sm"
                    >
                      <option value="showroom">🏪 Showroom Trưng Bày</option>
                      <option value="dealer">🤝 Đại Lý Ủy Quyền</option>
                      <option value="service_center">🔧 Trung Tâm Bảo Hành (TTBH)</option>
                    </select>
                  </div>

                  {/* Tỉnh / Thành */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Tỉnh / Thành Phố <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: TP. Hồ Chí Minh, Hà Nội, Cần Thơ..."
                      value={formData.province}
                      onChange={e => setFormData({...formData, province: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072F5] text-sm"
                    />
                  </div>

                  {/* Quận / Huyện */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Quận / Huyện
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Quận 1, Quận Ninh Kiều..."
                      value={formData.district}
                      onChange={e => setFormData({...formData, district: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072F5] text-sm"
                    />
                  </div>

                  {/* Địa chỉ chi tiết */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Địa chỉ chi tiết <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: 123 Đường 30/4, Phường Hưng Lợi"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072F5] text-sm"
                    />
                  </div>

                  {/* SĐT */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Số điện thoại Hotline
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 0901234567"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072F5] text-sm"
                    />
                  </div>

                  {/* Giờ mở cửa */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Giờ hoạt động
                    </label>
                    <input
                      type="text"
                      placeholder="VD: 8:00 - 18:00 (Thứ 2 - Thứ 7)"
                      value={formData.openHours}
                      onChange={e => setFormData({...formData, openHours: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072F5] text-sm"
                    />
                  </div>

                  {/* LINK GOOGLE MAPS ⭐ */}
                  <div className="md:col-span-2 p-4 bg-sky-50/60 rounded-xl border border-sky-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#0072F5] uppercase tracking-wider">
                        📍 Link Google Maps (Vị trí / Chỉ đường)
                      </label>
                      {formData.googleMapUrl ? (
                        <a
                          href={formData.googleMapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#0072F5] hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>Mở thử link</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : null}
                    </div>
                    <input
                      type="url"
                      placeholder="VD: https://maps.app.goo.gl/... hoặc https://maps.google.com/?q=..."
                      value={formData.googleMapUrl}
                      onChange={e => handleMapUrlChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072F5] text-sm"
                    />
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      💡 <strong>Mẹo:</strong> Khách bấm nút "Chỉ đường" trên website sẽ mở trực tiếp liên kết này.
                    </p>
                  </div>

                  {/* Vĩ độ / Kinh độ (Optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Vĩ độ (Latitude) <span className="text-slate-400 font-normal">(tùy chọn)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="VD: 10.7627"
                      value={formData.latitude}
                      onChange={e => setFormData({...formData, latitude: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072F5] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Kinh độ (Longitude) <span className="text-slate-400 font-normal">(tùy chọn)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="VD: 106.6907"
                      value={formData.longitude}
                      onChange={e => setFormData({...formData, longitude: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072F5] text-sm"
                    />
                  </div>

                  {/* Thứ tự hiển thị */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Thứ tự hiển thị (Sort Order)
                    </label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072F5] text-sm"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email liên hệ <span className="text-slate-400 font-normal">(tùy chọn)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="dealer@wasypro.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072F5] text-sm"
                    />
                  </div>

                  {/* Mô tả ngắn */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Ghi chú / Mô tả bổ sung
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ghi chú thêm về bãi đỗ xe, hotline hỗ trợ kỹ thuật..."
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0072F5] text-sm"
                    />
                  </div>
                  
                  {/* Trạng thái hiển thị */}
                  <div className="md:col-span-2 flex items-center p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <input
                      type="checkbox"
                      id="active-toggle"
                      checked={formData.isActive}
                      onChange={e => setFormData({...formData, isActive: e.target.checked})}
                      className="w-4 h-4 text-[#0072F5] bg-white border-slate-300 rounded focus:ring-[#0072F5]"
                    />
                    <label htmlFor="active-toggle" className="ml-2.5 text-sm font-semibold text-slate-700 cursor-pointer">
                      Kích hoạt hiển thị trên Website (Trang chủ)
                    </label>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/80 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2.5 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-sm font-medium"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="dealer-form"
                disabled={submitting}
                className="px-5 py-2.5 bg-[#0072F5] text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-semibold disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{editingDealer ? 'Cập nhật đại lý' : 'Lưu đại lý mới'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 animate-scaleIn">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Xác nhận xóa đại lý</h3>
            </div>
            
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa đại lý <span className="font-bold text-slate-900">"{deletingDealer?.name}"</span>? 
              Điểm bán này sẽ bị xóa hoàn toàn khỏi hệ thống và không còn hiển thị trên trang chủ.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {submitting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
