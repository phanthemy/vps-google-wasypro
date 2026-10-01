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
  ChevronUp,
  GripVertical,
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
  grossPrice: number | null;
  packageType: string;
  requiredQuantity: number | null;
  defaultDiscount: number;
  assignedRank: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
  items: NppPackageItem[];
  _count?: { purchases: number; registrations: number };
}

interface ProductOption {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string | null;
}

interface PackageFormData {
  code: string;
  name: string;
  description: string;
  grossPrice: string;
  discountPercent: string; // UI stores percentage (e.g. "35"), NOT BPS
  assignedRank: string;
  isActive: boolean;
  packageType: string;
  requiredQuantity: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^|;\\s*)csrf_token=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : '';
}

function getAuthHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const csrfToken = getCsrfToken();
  const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('crm_token') || '') : '';
  const authHeaders: Record<string, string> = { ...headers };
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }
  if (csrfToken) {
    authHeaders['X-CSRF-Token'] = csrfToken;
  }
  return authHeaders;
}

const RANK_LABELS: Record<string, string> = {
  AMBASSADOR: 'Đại sứ',
  MANAGER: 'Quản lý',
  DIRECTOR: 'Giám đốc',
};

const RANK_OPTIONS = [
  { value: 'AMBASSADOR', label: 'Đại sứ (Ambassador)' },
  { value: 'MANAGER', label: 'Quản lý (Manager)' },
  { value: 'DIRECTOR', label: 'Giám đốc (Director)' },
];

function formatVND(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(num)) return '0 ₫';
  return num.toLocaleString('vi-VN') + ' ₫';
}

/** Convert BPS to display percentage string */
function bpsToPercent(bps: number): string {
  const pct = bps / 100;
  return pct % 1 === 0 ? String(pct) : pct.toFixed(2);
}

/** Convert percentage string to BPS integer */
function percentToBps(pct: string): number {
  const val = parseFloat(pct);
  if (isNaN(val)) return 0;
  return Math.round(val * 100);
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

  reorder: async (packageIds: string[]): Promise<void> => {
    const res = await fetch('/api/admin/npp/packages/reorder', {
      credentials: 'include', method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ packageIds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Cập nhật thứ tự thất bại');
  },
};

// ─── Component ───────────────────────────────────────────────────────────────
const AdminNppPackages: React.FC = () => {
  const [packages, setPackages] = useState<NppPackage[]>([]);
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

  // Form — discountPercent stores percentage (e.g. "35"), NOT BPS
  const emptyForm: PackageFormData = {
    code: '', name: '', description: '',
    grossPrice: '', discountPercent: '0',
    assignedRank: 'AMBASSADOR', isActive: true,
    packageType: 'PRODUCT_COMBO',
    requiredQuantity: '',
  };
  const [form, setForm] = useState<PackageFormData>(emptyForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pkgs = await nppApi.list();
      setPackages(pkgs);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Tab category filter
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PRODUCT_COMBO' | 'CAPITAL'>('ALL');

  // Drag and drop state
  const [draggedPkgId, setDraggedPkgId] = useState<string | null>(null);
  const [dragOverPkgId, setDragOverPkgId] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState<boolean>(false);

  // Filter
  const filtered = packages.filter(p => {
    if (typeFilter !== 'ALL' && p.packageType !== typeFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
  });

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, pkgId: string) => {
    setDraggedPkgId(pkgId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', pkgId);
  };

  const handleDragOver = (e: React.DragEvent, pkgId: string) => {
    e.preventDefault();
    if (draggedPkgId === null || draggedPkgId === pkgId) return;
    setDragOverPkgId(pkgId);
  };

  const handleDrop = async (e: React.DragEvent, dropPkgId: string) => {
    e.preventDefault();
    const sourcePkgId = e.dataTransfer.getData('text/plain') || draggedPkgId;
    if (!sourcePkgId || sourcePkgId === dropPkgId) {
      setDraggedPkgId(null);
      setDragOverPkgId(null);
      return;
    }

    const sourceIndex = packages.findIndex(p => p.id === sourcePkgId);
    const targetIndex = packages.findIndex(p => p.id === dropPkgId);
    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedPkgId(null);
      setDragOverPkgId(null);
      return;
    }

    const updated = [...packages];
    const [movedItem] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setPackages(updated);
    setDraggedPkgId(null);
    setDragOverPkgId(null);
    setIsSavingOrder(true);

    try {
      await nppApi.reorder(updated.map(p => p.id));
      showSuccess('✅ Đã lưu thứ tự gói mới!');
    } catch (err: any) {
      setError(err.message || 'Lỗi lưu thứ tự gói');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedPkgId(null);
    setDragOverPkgId(null);
  };

  const handleMove = async (pkgId: string, direction: 'up' | 'down') => {
    const filteredIndex = filtered.findIndex(p => p.id === pkgId);
    if (filteredIndex === -1) return;
    const targetFilteredIndex = direction === 'up' ? filteredIndex - 1 : filteredIndex + 1;
    if (targetFilteredIndex < 0 || targetFilteredIndex >= filtered.length) return;

    const targetPkgId = filtered[targetFilteredIndex].id;
    const sourceIndex = packages.findIndex(p => p.id === pkgId);
    const targetIndex = packages.findIndex(p => p.id === targetPkgId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const updated = [...packages];
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, moved);

    setPackages(updated);
    setIsSavingOrder(true);
    try {
      await nppApi.reorder(updated.map(p => p.id));
      showSuccess('✅ Đã lưu thứ tự gói mới!');
    } catch (err: any) {
      setError(err.message || 'Lỗi lưu thứ tự gói');
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Open create
  const openCreate = () => {
    setEditingPkg(null);
    setForm(emptyForm);
    setModalError(null);
    setIsFormOpen(true);
  };

  // Open edit — convert BPS → percent for display
  const openEdit = (pkg: NppPackage) => {
    setEditingPkg(pkg);
    setForm({
      code: pkg.code,
      name: pkg.name,
      description: pkg.description || '',
      grossPrice: pkg.grossPrice != null ? String(pkg.grossPrice) : '',
      discountPercent: bpsToPercent(pkg.defaultDiscount),
      assignedRank: pkg.assignedRank,
      isActive: pkg.isActive,
      packageType: pkg.packageType || 'PRODUCT_COMBO',
      requiredQuantity: pkg.requiredQuantity ? String(pkg.requiredQuantity) : '',
    });
    setModalError(null);
    setIsFormOpen(true);
  };

  // Submit — convert percent → BPS for backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      // Frontend validation
      if (!form.code.trim()) throw new Error('Mã gói là bắt buộc');
      if (!form.name.trim()) throw new Error('Tên gói là bắt buộc');

      if (form.packageType === 'CAPITAL') {
        const gp = parseInt(form.grossPrice, 10);
        if (!gp || gp <= 0) throw new Error('Gói vốn phải có giá (Giá gói > 0)');
      }

      if (form.packageType === 'PRODUCT_COMBO') {
        const rq = parseInt(form.requiredQuantity, 10);
        if (!rq || rq < 1) throw new Error('Combo phải có số lượng máy yêu cầu (≥ 1)');
        const pct = parseFloat(form.discountPercent);
        if (isNaN(pct) || pct < 0 || pct > 100) throw new Error('Chiết khấu phải từ 0% đến 100%');
      }

      const body: Record<string, any> = {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || null,
        assignedRank: form.assignedRank,
        packageType: form.packageType,
        isActive: form.isActive,
      };

      if (form.packageType === 'CAPITAL') {
        body.grossPrice = form.grossPrice;
        body.requiredQuantity = null;
        body.defaultDiscount = 0;
        body.items = [];
      } else {
        // PRODUCT_COMBO
        body.grossPrice = null;
        body.requiredQuantity = parseInt(form.requiredQuantity, 10);
        body.defaultDiscount = percentToBps(form.discountPercent);
        // No items — combo = buyer chooses any products
      }

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
        <div className="fixed top-4 right-4 z-50 bg-sky-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-top duration-300">
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
          <p className="text-sm text-slate-500 mt-1">Tạo và quản lý các gói NPP</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
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

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              typeFilter === 'ALL'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Tất cả ({packages.length})
          </button>
          <button
            onClick={() => setTypeFilter('PRODUCT_COMBO')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              typeFilter === 'PRODUCT_COMBO'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-blue-600'
            }`}
          >
            📦 Combo ({packages.filter(p => p.packageType === 'PRODUCT_COMBO').length})
          </button>
          <button
            onClick={() => setTypeFilter('CAPITAL')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
              typeFilter === 'CAPITAL'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-slate-500 hover:text-amber-600'
            }`}
          >
            👑 Gói Cổ đông - Vốn ({packages.filter(p => p.packageType === 'CAPITAL').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên gói..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 px-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span>💡 Mẹo: Bạn có thể <b>kéo thả thẻ</b> hoặc dùng mũi tên <b>▲ / ▼</b> để đổi thứ tự.</span>
          {isSavingOrder && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-700 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu thứ tự...
            </span>
          )}
        </div>
        <span className="text-slate-400 font-medium">Tổng cộng: {filtered.length} gói</span>
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
        <div className="grid gap-3">
          {filtered.map((pkg, idx) => {
            const globalIndex = packages.findIndex(p => p.id === pkg.id);
            const isFirst = idx === 0;
            const isLast = idx === filtered.length - 1;
            const isBeingDragged = draggedPkgId === pkg.id;
            const isDragOver = dragOverPkgId === pkg.id;

            return (
              <div
                key={pkg.id}
                draggable
                onDragStart={(e) => handleDragStart(e, pkg.id)}
                onDragOver={(e) => handleDragOver(e, pkg.id)}
                onDrop={(e) => handleDrop(e, pkg.id)}
                onDragEnd={handleDragEnd}
                className={`bg-white rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex items-start gap-3 sm:gap-4 ${
                  isBeingDragged
                    ? 'opacity-40 border-dashed border-cyan-500 bg-cyan-50/40 shadow-inner'
                    : isDragOver
                    ? 'border-t-4 border-t-cyan-500 border-slate-200 shadow-lg scale-[1.008]'
                    : 'border-slate-200 hover:shadow-md hover:border-slate-300'
                }`}
              >
                {/* Drag Handle & Up/Down Arrows */}
                <div className="flex flex-col items-center justify-center gap-1 pt-1 flex-shrink-0 select-none">
                  <div
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing rounded hover:bg-slate-100 transition-colors"
                    title="Kéo thả để đổi thứ tự"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <button
                    type="button"
                    disabled={isFirst}
                    onClick={() => handleMove(pkg.id, 'up')}
                    className="p-1 text-slate-400 hover:text-cyan-600 disabled:opacity-20 disabled:hover:text-slate-400 hover:bg-slate-100 rounded transition-colors"
                    title="Đưa lên trên"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-bold text-slate-400 px-1 font-mono">
                    #{globalIndex + 1}
                  </span>
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => handleMove(pkg.id, 'down')}
                    className="p-1 text-slate-400 hover:text-cyan-600 disabled:opacity-20 disabled:hover:text-slate-400 hover:bg-slate-100 rounded transition-colors"
                    title="Đưa xuống dưới"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Main Card Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    {/* Left */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${pkg.isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>
                          {pkg.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${pkg.packageType === 'CAPITAL' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {pkg.packageType === 'CAPITAL' ? '💰 Gói vốn' : '📦 Combo sản phẩm'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono font-medium">{pkg.code}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 truncate">{pkg.name}</h3>
                      {pkg.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{pkg.description}</p>}

                      {/* Info — conditional by packageType */}
                      <div className="flex flex-wrap gap-4 mt-3 text-sm">
                        {pkg.packageType === 'CAPITAL' ? (
                          <>
                            <div>
                              <span className="text-slate-400">Giá gói: </span>
                              <span className="font-bold text-slate-700">{formatVND(pkg.grossPrice)}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <span className="text-slate-400">Số lượng máy: </span>
                              <span className="font-bold text-slate-700">{pkg.requiredQuantity || '—'} máy</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Chiết khấu: </span>
                              <span className="font-bold text-amber-600">{bpsToPercent(pkg.defaultDiscount)}%</span>
                            </div>
                          </>
                        )}
                        <div>
                          <span className="text-slate-400">Cấp bậc: </span>
                          <span className="font-bold text-cyan-600">{RANK_LABELS[pkg.assignedRank] || pkg.assignedRank}</span>
                        </div>
                      </div>

                      {/* Purchase/Registration count */}
                      {pkg._count && (pkg._count.purchases > 0 || pkg._count.registrations > 0) && (
                        <div className="mt-2 flex gap-3 text-xs text-slate-400">
                          {pkg._count.purchases > 0 && <span>📦 {pkg._count.purchases} đơn hàng</span>}
                          {pkg._count.registrations > 0 && <span>📝 {pkg._count.registrations} đăng ký</span>}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
                      <button
                        onClick={() => handleToggleStatus(pkg)}
                        className={`p-2 rounded-xl transition-colors ${pkg.isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-sky-500 hover:bg-sky-50'}`}
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
              </div>
            );
          })}
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

              {/* ═══ 1. PACKAGE TYPE — FIRST FIELD ═══ */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Loại gói *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, packageType: 'CAPITAL', grossPrice: f.grossPrice, discountPercent: '0', requiredQuantity: '' }))}
                    className={`flex flex-col items-center gap-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.packageType === 'CAPITAL'
                        ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg">💰</span>
                    <span>Gói vốn (CAPITAL)</span>
                    <span className="text-[11px] font-normal text-slate-400">Đóng vốn cố định</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, packageType: 'PRODUCT_COMBO', grossPrice: '', discountPercent: f.discountPercent === '0' ? '' : f.discountPercent, requiredQuantity: f.requiredQuantity }))}
                    className={`flex flex-col items-center gap-1 py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                      form.packageType === 'PRODUCT_COMBO'
                        ? 'border-blue-400 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-lg">📦</span>
                    <span>Combo sản phẩm</span>
                    <span className="text-[11px] font-normal text-slate-400">Mua N máy bất kỳ</span>
                  </button>
                </div>
              </div>

              {/* ═══ 2. Code + Name ═══ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mã gói *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="NPP-001"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tên gói *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder={form.packageType === 'CAPITAL' ? 'Gói NPP chiến lược' : 'Combo 5 máy'}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* ═══ 3. Description ═══ */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={form.packageType === 'CAPITAL'
                    ? 'Mô tả gói vốn...'
                    : 'Mua bất kỳ 05 máy, cùng loại hoặc khác loại, được chiết khấu 35%.'
                  }
                  rows={2}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                />
              </div>

              {/* ═══ CAPITAL FIELDS ═══ */}
              {form.packageType === 'CAPITAL' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Giá gói / Số tiền vốn (VNĐ) *</label>
                  <input
                    type="text"
                    value={form.grossPrice}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      // Auto-assign rank based on price for CAPITAL packages
                      const price = parseInt(raw, 10) || 0;
                      let autoRank = 'AMBASSADOR';
                      if (price >= 2000000000) autoRank = 'DIRECTOR';
                      else if (price >= 300000000) autoRank = 'MANAGER';
                      setForm(f => ({ ...f, grossPrice: raw, ...(f.packageType === 'CAPITAL' ? { assignedRank: autoRank } : {}) }));
                    }}
                    placeholder="300000000"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    required
                  />
                  {form.grossPrice && (
                    <p className="text-xs text-sky-600 mt-1 font-medium">
                      {formatVND(parseInt(form.grossPrice, 10))}
                    </p>
                  )}
                </div>
              )}

              {/* ═══ PRODUCT_COMBO FIELDS ═══ */}
              {form.packageType === 'PRODUCT_COMBO' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Số lượng máy yêu cầu *</label>
                      <input
                        type="number"
                        min="1"
                        value={form.requiredQuantity}
                        onChange={e => setForm(f => ({ ...f, requiredQuantity: e.target.value }))}
                        placeholder="5"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        required
                      />
                      <p className="text-xs text-slate-400 mt-1">Khách hàng được chọn bất kỳ sản phẩm đủ điều kiện</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Chiết khấu (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={form.discountPercent}
                          onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))}
                          placeholder="35"
                          className="w-full px-3 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">%</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">0% — 100%</p>
                    </div>
                  </div>
                </>
              )}

              {/* ═══ Rank ═══ */}
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

              {/* ═══ PREVIEW ═══ */}
              <div className={`rounded-xl p-4 border ${form.packageType === 'CAPITAL' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                <p className="text-xs font-bold uppercase text-slate-500 mb-2">Xem trước</p>
                <p className="font-bold text-slate-800">{form.name || '(Tên gói)'}</p>
                {form.packageType === 'CAPITAL' ? (
                  <div className="mt-1 text-sm space-y-0.5">
                    <p><span className="text-slate-500">Loại:</span> <span className="font-semibold text-amber-700">Gói vốn</span></p>
                    <p><span className="text-slate-500">Giá:</span> <span className="font-bold text-slate-800">{form.grossPrice ? formatVND(parseInt(form.grossPrice, 10)) : '—'}</span></p>
                    <p><span className="text-slate-500">Cấp bậc:</span> <span className="font-semibold text-cyan-700">{RANK_LABELS[form.assignedRank]}</span></p>
                  </div>
                ) : (
                  <div className="mt-1 text-sm space-y-0.5">
                    <p><span className="text-slate-500">Loại:</span> <span className="font-semibold text-blue-700">Combo sản phẩm</span></p>
                    <p><span className="text-slate-500">Số lượng:</span> <span className="font-bold text-slate-800">{form.requiredQuantity || '—'} máy</span></p>
                    <p><span className="text-slate-500">Chiết khấu:</span> <span className="font-bold text-amber-600">{form.discountPercent || '0'}%</span></p>
                    <p><span className="text-slate-500">Cấp bậc:</span> <span className="font-semibold text-cyan-700">{RANK_LABELS[form.assignedRank]}</span></p>
                  </div>
                )}
              </div>

              {/* ═══ Actions ═══ */}
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
                  className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
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
