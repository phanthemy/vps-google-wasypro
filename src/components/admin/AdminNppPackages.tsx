import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
  Power,
  PowerOff,
  ChevronDown,
  ShoppingBag,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface NppPackageItem {
  id: string;
  productId: string;
  quantity: number;
  note: string | null;
  product: {
    id: string;
    slug: string;
    title: string;
    price: number;
    image: string | null;
    stock?: number;
  };
}

interface NppPackage {
  id: string;
  code: string;
  name: string;
  description: string | null;
  grossPrice: number;
  defaultDiscount: number;
  assignedRank: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items: NppPackageItem[];
  _count?: { purchases: number };
}

interface ProductOption {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
}

interface PackageItemInput {
  productId: string;
  quantity: number;
  note: string;
}

interface PackageFormData {
  code: string;
  name: string;
  description: string;
  grossPrice: string;
  defaultDiscount: string;
  assignedRank: string;
  isActive: boolean;
  items: PackageItemInput[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^|;\\s*)csrf_token=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : '';
}

function getAuthHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const csrfToken = getCsrfToken();
  const authHeaders: Record<string, string> = { ...headers };
  if (csrfToken) {
    authHeaders['X-CSRF-Token'] = csrfToken;
  }
  return authHeaders;
}

const RANK_LABELS: Record<string, string> = {
  AMBASSADOR: 'Đại sứ',
  MANAGER: 'Trưởng nhóm',
  DIRECTOR: 'Quản lý',
};

const RANK_OPTIONS = [
  { value: 'AMBASSADOR', label: 'Đại sứ (Ambassador)' },
  { value: 'MANAGER', label: 'Trưởng nhóm (Manager)' },
  { value: 'DIRECTOR', label: 'Quản lý (Director)' },
];

function formatVND(value: number | string): string {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(num)) return '0 ₫';
  return num.toLocaleString('vi-VN') + ' ₫';
}

function formatBPS(bps: number): string {
  return (bps / 100).toFixed(bps % 100 === 0 ? 0 : 2) + '%';
}

function calcNetPrice(grossPrice: string, discountBps: string): number {
  const gp = parseInt(grossPrice, 10) || 0;
  const bps = parseInt(discountBps, 10) || 0;
  return Math.floor(gp * (10000 - bps) / 10000);
}

// ─── API Functions ───────────────────────────────────────────────────────────
const nppApi = {
  list: async (): Promise<NppPackage[]> => {
    const res = await fetch('/api/admin/npp/packages', { credentials: 'include', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Lỗi tải danh sách gói NPP');
    const data = await res.json();
    return data.data || data;
  },

  get: async (id: string): Promise<NppPackage> => {
    const res = await fetch(`/api/admin/npp/packages/${id}`, { credentials: 'include', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Không tìm thấy gói NPP');
    const data = await res.json();
    return data.data || data;
  },

  create: async (body: object): Promise<NppPackage> => {
    const res = await fetch('/api/admin/npp/packages', {
      credentials: 'include', method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Tạo gói thất bại');
    return data.data || data;
  },

  update: async (id: string, body: object): Promise<NppPackage> => {
    const res = await fetch(`/api/admin/npp/packages/${id}`, {
      credentials: 'include', method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Cập nhật thất bại');
    return data.data || data;
  },

  setStatus: async (id: string, isActive: boolean): Promise<NppPackage> => {
    const res = await fetch(`/api/admin/npp/packages/${id}/status`, {
      credentials: 'include', method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ isActive }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Cập nhật trạng thái thất bại');
    return data.data || data;
  },

  remove: async (id: string): Promise<void> => {
    const res = await fetch(`/api/admin/npp/packages/${id}`, {
      credentials: 'include', method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Xóa gói thất bại');
  },
};

const loadProducts = async (): Promise<ProductOption[]> => {
  const res = await fetch('/api/products');
  if (!res.ok) return [];
  const data = await res.json();
  const arr = Array.isArray(data) ? data : data.data || [];
  return arr.map((p: any) => ({ id: p.id, slug: p.slug, title: p.title, price: p.price, image: p.image }));
};

// ─── Component ───────────────────────────────────────────────────────────────
const AdminNppPackages: React.FC = () => {
  const [packages, setPackages] = useState<NppPackage[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<NppPackage | null>(null);
  const [deletingPkg, setDeletingPkg] = useState<NppPackage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form
  const emptyForm: PackageFormData = {
    code: '', name: '', description: '',
    grossPrice: '', defaultDiscount: '0',
    assignedRank: 'AMBASSADOR', isActive: true,
    items: [{ productId: '', quantity: 1, note: '' }],
  };
  const [form, setForm] = useState<PackageFormData>(emptyForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pkgs, prods] = await Promise.all([nppApi.list(), loadProducts()]);
      setPackages(pkgs);
      setProducts(prods);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter
  const filtered = packages.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
  });

  // Open create
  const openCreate = () => {
    setEditingPkg(null);
    setForm(emptyForm);
    setModalError(null);
    setIsFormOpen(true);
  };

  // Open edit
  const openEdit = (pkg: NppPackage) => {
    setEditingPkg(pkg);
    setForm({
      code: pkg.code,
      name: pkg.name,
      description: pkg.description || '',
      grossPrice: String(pkg.grossPrice),
      defaultDiscount: String(pkg.defaultDiscount),
      assignedRank: pkg.assignedRank,
      isActive: pkg.isActive,
      items: pkg.items.length > 0
        ? pkg.items.map(i => ({ productId: i.productId, quantity: i.quantity, note: i.note || '' }))
        : [{ productId: '', quantity: 1, note: '' }],
    });
    setModalError(null);
    setIsFormOpen(true);
  };

  // Add item row
  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: 1, note: '' }] }));
  };

  // Remove item row
  const removeItem = (index: number) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  // Update item field
  const updateItem = (index: number, field: keyof PackageItemInput, value: string | number) => {
    setForm(f => ({
      ...f,
      items: f.items.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      const body = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        grossPrice: form.grossPrice,
        defaultDiscount: parseInt(form.defaultDiscount, 10) || 0,
        assignedRank: form.assignedRank,
        isActive: form.isActive,
        items: form.items
          .filter(i => i.productId)
          .map(i => ({
            productId: i.productId,
            quantity: parseInt(String(i.quantity), 10) || 1,
            note: i.note.trim() || null,
          })),
      };

      if (editingPkg) {
        await nppApi.update(editingPkg.id, body);
        showSuccess('Cập nhật gói NPP thành công');
      } else {
        await nppApi.create(body);
        showSuccess('Tạo gói NPP thành công');
      }

      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle status
  const handleToggleStatus = async (pkg: NppPackage) => {
    try {
      await nppApi.setStatus(pkg.id, !pkg.isActive);
      showSuccess(pkg.isActive ? 'Đã vô hiệu hóa gói' : 'Đã kích hoạt gói');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deletingPkg) return;
    setSubmitting(true);
    try {
      await nppApi.remove(deletingPkg.id);
      showSuccess('Đã xóa gói NPP');
      setDeletingPkg(null);
      fetchData();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Available products (not selected in other items)
  const getAvailableProducts = (currentIndex: number): ProductOption[] => {
    const selectedIds = new Set(form.items.filter((_, i) => i !== currentIndex).map(i => i.productId).filter(Boolean));
    return products.filter(p => !selectedIds.has(p.id));
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        <span className="ml-3 text-slate-400">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 text-cyan-600" />
            Quản Lý Gói NPP
          </h1>
          <p className="text-sm text-slate-500 mt-1">Tạo và quản lý các gói sản phẩm NPP</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-ocean-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Tạo Gói Mới
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4 text-red-400" /></button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo mã hoặc tên gói..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        />
      </div>

      {/* Package List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Chưa có gói NPP nào</p>
          <button onClick={openCreate} className="mt-4 text-cyan-600 font-semibold text-sm hover:underline">
            + Tạo gói đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                {/* Left */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${pkg.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {pkg.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{pkg.code}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 truncate">{pkg.name}</h3>
                  {pkg.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{pkg.description}</p>}

                  {/* Price info */}
                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-slate-400">Giá gốc: </span>
                      <span className="font-bold text-slate-700">{formatVND(pkg.grossPrice)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Chiết khấu: </span>
                      <span className="font-bold text-amber-600">{formatBPS(pkg.defaultDiscount)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Giá sau CK: </span>
                      <span className="font-bold text-emerald-600">{formatVND(calcNetPrice(String(pkg.grossPrice), String(pkg.defaultDiscount)))}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Cấp bậc: </span>
                      <span className="font-bold text-cyan-600">{RANK_LABELS[pkg.assignedRank] || pkg.assignedRank}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mt-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Sản phẩm ({pkg.items.length})</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {pkg.items.map(item => (
                        <span key={item.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs text-slate-600">
                          <Package className="w-3 h-3" />
                          {item.product?.title || item.productId} × {item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Purchase count */}
                  {pkg._count && pkg._count.purchases > 0 && (
                    <div className="mt-2 text-xs text-slate-400">
                      📦 {pkg._count.purchases} đơn hàng NPP
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggleStatus(pkg)}
                    className={`p-2 rounded-xl transition-colors ${pkg.isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                    title={pkg.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                  >
                    {pkg.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(pkg)}
                    className="p-2 rounded-xl text-cyan-600 hover:bg-cyan-50 transition-colors"
                    title="Sửa"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setDeletingPkg(pkg); setModalError(null); }}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                    title="Xóa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Create/Edit Modal ───────────────────────────────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 backdrop-blur-sm overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                {editingPkg ? 'Sửa Gói NPP' : 'Tạo Gói NPP Mới'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {modalError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700">{modalError}</span>
                </div>
              )}

              {/* Row 1: Code + Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mã gói *</label>
                  <input
                    type="text" required value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="NPP-001"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tên gói *</label>
                  <input
                    type="text" required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Gói Đại sứ 5 máy"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Mô tả gói NPP..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Row 2: Price + Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Giá gốc (VNĐ) *</label>
                  <input
                    type="text" required value={form.grossPrice}
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setForm(f => ({ ...f, grossPrice: val }));
                    }}
                    placeholder="300000000"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  {form.grossPrice && (
                    <p className="text-xs text-slate-400 mt-1">{formatVND(form.grossPrice)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Chiết khấu (BPS) *</label>
                  <input
                    type="number" value={form.defaultDiscount}
                    onChange={e => setForm(f => ({ ...f, defaultDiscount: e.target.value }))}
                    min="0" max="10000" step="100"
                    placeholder="2500 = 25%"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {formatBPS(parseInt(form.defaultDiscount, 10) || 0)} — 2500 = 25%, 1000 = 10%
                  </p>
                </div>
              </div>

              {/* Net price preview */}
              {form.grossPrice && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <span className="text-sm text-emerald-700 font-medium">Giá sau chiết khấu: </span>
                  <span className="text-lg font-bold text-emerald-700">
                    {formatVND(calcNetPrice(form.grossPrice, form.defaultDiscount))}
                  </span>
                </div>
              )}

              {/* Rank */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Cấp bậc gán *</label>
                <select
                  value={form.assignedRank}
                  onChange={e => setForm(f => ({ ...f, assignedRank: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  {RANK_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              {/* ─── Items ─────────────────────────────────────────────────── */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Sản phẩm trong gói *</label>
                <div className="space-y-3">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <div className="flex-1 min-w-0">
                        <select
                          value={item.productId}
                          onChange={e => updateItem(idx, 'productId', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="">-- Chọn sản phẩm --</option>
                          {getAvailableProducts(idx).map(p => (
                            <option key={p.id} value={p.id}>{p.title} — {formatVND(p.price)}</option>
                          ))}
                          {/* Keep current selection visible even if filtered */}
                          {item.productId && !getAvailableProducts(idx).find(p => p.id === item.productId) && (
                            <option value={item.productId}>
                              {products.find(p => p.id === item.productId)?.title || item.productId}
                            </option>
                          )}
                        </select>
                      </div>
                      <div className="w-20">
                        <input
                          type="number" min="1" value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                          className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-cyan-500"
                          placeholder="SL"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text" value={item.note}
                          onChange={e => updateItem(idx, 'note', e.target.value)}
                          placeholder="Ghi chú..."
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-400 hover:text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button" onClick={addItem}
                  className="mt-2 text-sm text-cyan-600 hover:text-cyan-700 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Thêm sản phẩm
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-ocean-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingPkg ? 'Cập Nhật' : 'Tạo Gói'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ───────────────────────────────────── */}
      {deletingPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Xóa gói NPP?</h3>
            <p className="text-sm text-slate-500 mb-4">
              Bạn có chắc muốn xóa gói <strong>{deletingPkg.name}</strong> ({deletingPkg.code})?
              {deletingPkg._count && deletingPkg._count.purchases > 0 && (
                <span className="block mt-2 text-amber-600 font-semibold">
                  ⚠️ Gói này đã có {deletingPkg._count.purchases} đơn hàng. Không thể xóa.
                </span>
              )}
            </p>
            {modalError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{modalError}</span>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingPkg(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete} disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNppPackages;
