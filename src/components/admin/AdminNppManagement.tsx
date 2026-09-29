import AdminNppDownlineModal from './AdminNppDownlineModal';
import { GitFork } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Search, CheckCircle2, AlertCircle, X, Loader2,
  UserPlus, Clock, FileText, ChevronDown, ShoppingCart
} from 'lucide-react';
import AdminNppPurchases from './AdminNppPurchases';

function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^|;\\s*)csrf_token=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : '';
}
function getAuthHeaders(h: Record<string, string> = {}): Record<string, string> {
  const t = getCsrfToken(); return t ? { ...h, 'X-CSRF-Token': t } : { ...h };
}

const RANK_LABELS: Record<string, string> = { AMBASSADOR: 'Đại sứ', MANAGER: 'Trưởng nhóm', DIRECTOR: 'Quản lý' };
const PAYMENT_OPTIONS = [
  { value: 'UNPAID', label: 'Chưa thanh toán' },
  { value: 'PARTIAL', label: 'Thanh toán một phần' },
];

function formatVND(v: number | string | null): string {
  if (v === null || v === undefined) return '—';
  const n = typeof v === 'string' ? parseInt(v, 10) : v;
  return isNaN(n) ? '—' : n.toLocaleString('vi-VN') + ' ₫';
}

interface NppPackage { id: string; code: string; name: string; packageType: string; grossPrice: number | null; assignedRank: string; }
interface Registration {
  id: string; userId: string; packageId: string; status: string; note: string | null;
  cancelReason: string | null; createdAt: string; updatedAt: string;
  user: { id: string; userId: string; fullName: string; phone: string; isNpp: boolean; businessId: string | null; rank: string | null; };
  package: NppPackage;
}
interface Activation {
  id: string; userId: string; source: string; packageId: string | null;
  assignedRank: string; previousRank: string | null; allocatedBid: string | null;
  activatedBy: string; reason: string | null; note: string | null; paymentStatus: string | null;
  createdAt: string;
  user: { id: string; userId: string; fullName: string; phone: string; businessId: string | null; rank: string | null; };
  package: NppPackage | null;
}

type SubTab = 'registrations' | 'activations' | 'grant' | 'purchases';

const AdminNppManagement: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('registrations');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [activations, setActivations] = useState<Activation[]>([]);
  const [packages, setPackages] = useState<NppPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDownlineNpp, setSelectedDownlineNpp] = useState<{ id: string; fullName: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Grant form
  const [grantUserId, setGrantUserId] = useState('');
  const [grantPackageId, setGrantPackageId] = useState('');
  const [grantRank, setGrantRank] = useState('AMBASSADOR');
  const [grantReason, setGrantReason] = useState('');
  const [grantNote, setGrantNote] = useState('');
  const [grantPayment, setGrantPayment] = useState('UNPAID');

  // Users for grant
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 4000); };

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [regRes, actRes, pkgRes, usrRes] = await Promise.all([
        fetch('/api/admin/npp/registrations' + (statusFilter ? `?status=${statusFilter}` : ''), { credentials: 'include', headers: getAuthHeaders() }),
        fetch('/api/admin/npp/activations', { credentials: 'include', headers: getAuthHeaders() }),
        fetch('/api/admin/npp/packages', { credentials: 'include', headers: getAuthHeaders() }),
        fetch('/api/admin/ctv', { credentials: 'include', headers: getAuthHeaders() }),
      ]);
      const [regD, actD, pkgD, usrD] = await Promise.all([regRes.json(), actRes.json(), pkgRes.json(), usrRes.json()]);
      setRegistrations((regD.data || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setActivations(actD.data || []);
      setPackages((pkgD.data || []).filter((p: NppPackage) => p).sort((a: NppPackage, b: NppPackage) => a.code.localeCompare(b.code)));
      const u = Array.isArray(usrD) ? usrD : usrD.data || [];
      setUsers(u);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleApproveCancel = async (regId: string, newStatus: 'APPROVED' | 'CANCELLED', cancelReason?: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/npp/registrations/${regId}/status`, {
        credentials: 'include', method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status: newStatus, cancelReason }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Lỗi');
      showSuccess(newStatus === 'APPROVED' ? 'Đã duyệt đăng ký' : 'Đã hủy đăng ký');
      fetchAll();
    } catch (e: any) { setError(e.message); }
    setSubmitting(false);
  };

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantUserId) { setError('Chọn user'); return; }
    if (!grantRank) { setError('Chọn rank'); return; }
    if (!grantReason.trim()) { setError('Lý do là bắt buộc'); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch('/api/admin/npp/grant', {
        credentials: 'include', method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          userId: grantUserId,
          packageId: grantPackageId || null,
          assignedRank: grantRank,
          reason: grantReason.trim(),
          note: grantNote.trim() || null,
          paymentStatus: grantPayment,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Lỗi');
      showSuccess(d.message || 'Đã cấp NPP');
      setGrantUserId(''); setGrantReason(''); setGrantNote('');
      fetchAll();
    } catch (e: any) { setError(e.message); }
    setSubmitting(false);
  };

  const filteredUsers = users.filter((u: any) => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (u.fullName || '').toLowerCase().includes(q) || (u.phone || '').includes(q) || (u.userId || '').toLowerCase().includes(q);
  });

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REPLACED: 'bg-slate-100 text-slate-500',
    CONVERTED: 'bg-emerald-100 text-emerald-700',
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      <span className="ml-3 text-slate-400">Đang tải...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <Shield className="w-7 h-7 text-cyan-600" /> Quản Lý NPP
        </h1>
        <p className="text-sm text-slate-500 mt-1">Đăng ký, kích hoạt và cấp NPP</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4 text-red-400" /></button>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {[
          { key: 'registrations' as SubTab, label: 'Đăng ký', icon: FileText, count: registrations.filter(r => r.status === 'PENDING').length },
          { key: 'purchases' as SubTab, label: 'Đơn hàng', icon: ShoppingCart, count: 0 },
          { key: 'activations' as SubTab, label: 'Lịch sử kích hoạt', icon: Clock, count: activations.length },
          { key: 'grant' as SubTab, label: 'Cấp NPP', icon: UserPlus, count: 0 },
        ].map(tab => (
          <button key={tab.key} onClick={() => setSubTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              subTab === tab.key ? 'border-cyan-500 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
            {tab.count > 0 && <span className="ml-1 px-1.5 py-0.5 bg-cyan-100 text-cyan-700 rounded-full text-[10px] font-bold">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Registrations Tab */}
      {subTab === 'registrations' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {['', 'PENDING', 'APPROVED', 'CANCELLED', 'REPLACED'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {s || 'Tất cả'}
              </button>
            ))}
          </div>
          {registrations.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Chưa có đăng ký NPP nào</div>
          ) : (
            <div className="space-y-3">
              {registrations.map(reg => (
                <div key={reg.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${statusColors[reg.status] || 'bg-slate-100'}`}>{reg.status}</span>
                        <span className="text-xs text-slate-400">{new Date(reg.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                      <p className="font-semibold text-slate-800">{reg.user?.fullName || 'N/A'}</p>
                      <p className="text-xs text-slate-500">{reg.user?.userId} · {reg.user?.phone} {reg.user?.businessId ? ` · BID: ${reg.user.businessId}` : ''}</p>
                      <p className="text-sm text-slate-600 mt-1">Gói: <span className="font-semibold">{reg.package?.name || reg.packageId}</span> ({reg.package?.code})</p>
                      {reg.cancelReason && <p className="text-xs text-red-500 mt-1">Lý do: {reg.cancelReason}</p>}
                    </div>
                    {(reg.status === 'PENDING' || reg.status === 'APPROVED') && (
                      <div className="flex gap-2">
                        {reg.status === 'PENDING' && (
                          <button disabled={submitting} onClick={() => handleApproveCancel(reg.id, 'APPROVED')}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold hover:bg-emerald-100 disabled:opacity-50">
                            ✓ Duyệt
                          </button>
                        )}
                        <button disabled={submitting} onClick={() => handleApproveCancel(reg.id, 'CANCELLED', 'Admin hủy')}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50">
                          ✕ Hủy
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activations Tab */}
      {subTab === 'activations' && (
        <div className="space-y-3">
          {activations.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Chưa có lịch sử kích hoạt</div>
          ) : activations.map(act => (
            <div key={act.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${act.source === 'ADMIN_GRANT' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {act.source === 'ADMIN_GRANT' ? '⚡ Admin Grant' : '📦 Purchase'}
                </span>
                <span className="text-xs text-slate-400">{new Date(act.createdAt).toLocaleString('vi-VN')}</span>
                {act.paymentStatus && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    act.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                    act.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-600'
                  }`}>{act.paymentStatus}</span>
                )}
              </div>
              <p className="font-semibold text-slate-800">{act.user?.fullName || 'N/A'}</p>
              <p className="text-xs text-slate-500">{act.user?.userId} · BID: {act.user?.businessId || '—'}</p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm">
                <div><span className="text-slate-400">Rank: </span><span className="font-bold text-cyan-600">{RANK_LABELS[act.assignedRank] || act.assignedRank}</span></div>
                {act.previousRank && <div><span className="text-slate-400">Trước: </span><span className="text-slate-600">{RANK_LABELS[act.previousRank]}</span></div>}
                {act.allocatedBid && <div><span className="text-slate-400">BID mới: </span><span className="font-bold text-emerald-600">{act.allocatedBid}</span></div>}
                {act.package && <div><span className="text-slate-400">Gói: </span><span className="text-slate-600">{act.package.name}</span></div>}
              </div>
              {act.reason && <p className="text-xs text-slate-500 mt-1">Lý do: {act.reason}</p>}
              {act.note && <p className="text-xs text-slate-400 mt-0.5">Ghi chú: {act.note}</p>}
              <p className="text-xs text-slate-400 mt-1">Bởi: {act.activatedBy}</p>
            </div>
          ))}
        </div>
      )}

      {/* Grant Tab */}
      {subTab === 'grant' && (
        <form onSubmit={handleGrant} className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl space-y-5">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-cyan-600" /> Cấp NPP Trực Tiếp
          </h3>
          <p className="text-sm text-slate-500">Admin cấp NPP cho user mà không cần purchase payment.</p>

          {/* User search */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Chọn User *</label>
            <input type="text" placeholder="Tìm theo tên, SĐT, mã user..." value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500" />
            {userSearch && (
              <div className="mt-1 max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                {filteredUsers.slice(0, 10).map((u: any) => (
                  <button type="button" key={u.id} onClick={() => { setGrantUserId(u.id); setUserSearch(u.fullName + ' (' + u.userId + ')'); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-cyan-50 border-b border-slate-100 ${grantUserId === u.id ? 'bg-cyan-50' : ''}`}>
                    <span className="font-semibold">{u.fullName}</span>
                    <span className="text-slate-400 ml-2">{u.userId} · {u.phone}</span>
                    {u.isNpp && <span className="ml-2 text-xs text-emerald-600 font-bold">NPP ✓</span>}
                    {u.rank && <span className="ml-2 text-xs text-cyan-600">{RANK_LABELS[u.rank]}</span>}
                  </button>
                ))}
              </div>
            )}
            {grantUserId && !userSearch.includes('(') && <p className="text-xs text-emerald-600 mt-1">User đã chọn: {grantUserId}</p>}
          </div>

          {/* Package (optional) */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Gói NPP (tùy chọn)</label>
            <select value={grantPackageId} onChange={e => setGrantPackageId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm">
              <option value="">— Không chọn gói —</option>
              {packages.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
            </select>
          </div>

          {/* Rank */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Cấp bậc *</label>
            <select value={grantRank} onChange={e => setGrantRank(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm">
              <option value="AMBASSADOR">Đại sứ (Ambassador)</option>
              <option value="MANAGER">Trưởng nhóm (Manager)</option>
              <option value="DIRECTOR">Quản lý (Director)</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Lý do *</label>
            <textarea value={grantReason} onChange={e => setGrantReason(e.target.value)} rows={2}
              placeholder="Ví dụ: Đối tác chiến lược, nâng cấp rank..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-cyan-500" />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú</label>
            <input type="text" value={grantNote} onChange={e => setGrantNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>

          {/* Payment status */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Trạng thái thanh toán</label>
            <select value={grantPayment} onChange={e => setGrantPayment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm">
              {PAYMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
            ⚠️ Hành động này sẽ:<br />
            • Set NPP Active<br />
            • Cấp BID nếu chưa có<br />
            • Gán rank được chọn<br />
            • <strong>Không tạo payment giả</strong>
          </div>

          <button type="submit" disabled={submitting || !grantUserId || !grantReason.trim()}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Xác nhận cấp NPP
          </button>
        </form>
      )}
      {subTab === 'purchases' && (
        <AdminNppPurchases />
      )}
    </div>
  );
};

export default AdminNppManagement;
