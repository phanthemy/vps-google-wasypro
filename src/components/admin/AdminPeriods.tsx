import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Lock, Unlock, ChevronRight, AlertTriangle, RefreshCw, X, CheckCircle } from 'lucide-react';

interface CommissionPeriod {
  id: string;
  periodName: string;
  startAt: string;
  endAt: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  createdBy: string;
  closedAt?: string;
  closedBy?: string;
  totalOrders: number;
  totalCommissions: number;
  closeAudit?: {
    totalEarnedPoints: number;
    totalEarnedMoney: number;
  };
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('vi-VN'); } catch { return iso; }
}
function fmtDateTime(iso: string): string {
  try { return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }); } catch { return iso; }
}
function getCsrfToken(): string {
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : '';
}

// ── Create Period Modal ──────────────────────────────────────────
function CreatePeriodModal({ onClose, onCreated, periods }: {
  onClose: () => void;
  onCreated: () => void;
  periods: CommissionPeriod[];
}) {
  const [periodName, setPeriodName] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [copyFromId, setCopyFromId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!periodName.trim() || !startAt || !endAt) {
      setError('Vui lòng điền đầy đủ tên kỳ, ngày bắt đầu và ngày kết thúc.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
        credentials: 'include',
        body: JSON.stringify({ periodName: periodName.trim(), startAt, endAt, copyFromPeriodId: copyFromId || undefined }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Lỗi tạo kỳ.'); }
      else { onCreated(); onClose(); }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối.');
    } finally { setSaving(false); }
  }

  const closedPeriods = periods.filter(p => p.status === 'CLOSED');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* FIXED HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Calendar size={16} className="text-sky-600" /> Tạo Kỳ Mới
          </h3>
          <button
            onClick={onClose} disabled={saving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Đóng (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 min-h-0">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Tên kỳ <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder-slate-400"
              placeholder="VD: 10/2026"
              value={periodName}
              onChange={e => setPeriodName(e.target.value)}
            />
            <span className="text-xs text-slate-400">Định dạng: MM/YYYY</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                value={startAt}
                onChange={e => setStartAt(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                value={endAt}
                onChange={e => setEndAt(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Sao chép policy từ kỳ trước
            </label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              value={copyFromId}
              onChange={e => setCopyFromId(e.target.value)}
            >
              <option value="">Tạo mới (tất cả NOT_CONFIGURED)</option>
              {closedPeriods.map(p => (
                <option key={p.id} value={p.id}>{p.periodName} (đã chốt)</option>
              ))}
            </select>
            <span className="text-xs text-slate-400">Nếu sao chép, policy mới sẽ lấy giá trị từ kỳ được chọn.</span>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />{error}
            </div>
          )}
        </div>

        {/* FIXED FOOTER */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose} disabled={saving}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            className="flex-1 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
            onClick={handleCreate}
          >
            {saving ? 'Đang tạo...' : 'Tạo Kỳ'}
          </button>
        </div>
      </div>
    </div>
  );

}

// ── Close Period Modal ───────────────────────────────────────────
function ClosePeriodModal({ period, onClose, onClosed }: {
  period: CommissionPeriod;
  onClose: () => void;
  onClosed: () => void;
}) {
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const expectedPhrase = `CHỐT KỲ ${period.periodName}`;

  async function handleClose() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/periods/${period.id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
        credentials: 'include',
        body: JSON.stringify({ confirmPhrase: confirmPhrase.trim() }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Lỗi chốt kỳ.'); }
      else { onClosed(); onClose(); }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối.');
    } finally { setSaving(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* FIXED HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="font-bold text-red-600 text-base flex items-center gap-2">
            <Lock size={16} /> Chốt Kỳ Hoa Hồng
          </h3>
          <button
            onClick={onClose} disabled={saving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col gap-2 text-sm">
            <div className="font-bold text-red-700">⚠ Bạn đang chốt kỳ {period.periodName}</div>
            <div className="text-slate-600 text-xs">
              <div>Tổng đơn hàng: <b className="text-slate-900">{period.totalOrders}</b></div>
              <div>Tổng hoa hồng: <b className="text-slate-900">{period.totalCommissions}</b> bản ghi</div>
            </div>
            <div className="text-red-600 text-xs mt-1 font-semibold">Sau khi chốt:</div>
            <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
              <li>Toàn bộ policy kỳ này bị khóa</li>
              <li>Toàn bộ commission bị khóa</li>
              <li>Không thể sửa, xóa, hoặc recalculate</li>
              <li>CTV chỉ được xem</li>
            </ul>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Nhập để xác nhận: <span className="text-amber-600 font-mono font-bold">{expectedPhrase}</span>
            </label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-slate-400"
              value={confirmPhrase}
              onChange={e => setConfirmPhrase(e.target.value)}
              placeholder={expectedPhrase}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />{error}
            </div>
          )}
        </div>

        {/* FIXED FOOTER */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose} disabled={saving}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving || confirmPhrase.trim() !== expectedPhrase}
            onClick={handleClose}
          >
            {saving ? 'Đang chốt...' : 'CHỐT HOA HỒNG'}
          </button>
        </div>
      </div>
    </div>
  );

}

// ── Main Component ──────────────────────────────────────────────
interface AdminPeriodsProps {
  onSelectPeriod: (periodId: string) => void;
}

export default function AdminPeriods({ onSelectPeriod }: AdminPeriodsProps) {
  const [periods, setPeriods] = useState<CommissionPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [closingPeriod, setClosingPeriod] = useState<CommissionPeriod | null>(null);

  const loadPeriods = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/periods', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setPeriods(d.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadPeriods(); }, [loadPeriods]);

  const openPeriod = periods.find(p => p.status === 'OPEN');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar size={20} className="text-emerald-600" /> Kỳ Hoa Hồng
          </h2>
          <p className="text-sm text-slate-500 mt-1">Quản lý kỳ hoa hồng, policy và chốt kỳ.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadPeriods}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          {!openPeriod && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors"
            >
              <Plus size={14} /> Tạo Kỳ Mới
            </button>
          )}
        </div>
      </div>

      {openPeriod && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
          <Unlock size={16} className="text-emerald-600 shrink-0" />
          <span className="text-emerald-800">
            Kỳ <b>{openPeriod.periodName}</b> đang mở ({fmtDate(openPeriod.startAt)} → {fmtDate(openPeriod.endAt)}).
            Đơn hàng mới sẽ thuộc kỳ này.
          </span>
        </div>
      )}

      {!openPeriod && periods.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <span className="text-amber-800">Không có kỳ nào đang mở. Đơn hàng mới sẽ không gắn vào kỳ nào. <button onClick={() => setShowCreate(true)} className="underline font-semibold ml-1">Tạo kỳ mới</button></span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin" /> Đang tải...
          </div>
        ) : periods.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Calendar size={32} className="mx-auto mb-3 opacity-30" />
            <div className="text-sm">Chưa có kỳ nào.</div>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors mx-auto"
            >
              <Plus size={14} /> Tạo Kỳ Đầu Tiên
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wide">
                <th className="py-3 px-4 text-left font-semibold">Kỳ</th>
                <th className="py-3 px-4 text-center font-semibold">Thời gian</th>
                <th className="py-3 px-4 text-center font-semibold">Trạng thái</th>
                <th className="py-3 px-4 text-center font-semibold">Đơn hàng</th>
                <th className="py-3 px-4 text-center font-semibold">Hoa hồng</th>
                <th className="py-3 px-4 text-center font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {periods.map(p => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-sky-50/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{p.periodName}</div>
                    <div className="text-xs text-slate-500">Tạo bởi {p.createdBy}</div>
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-slate-500">
                    {fmtDate(p.startAt)} → {fmtDate(p.endAt)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.status === 'OPEN' ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                        <Unlock size={10} /> Đang mở
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full font-medium">
                        <Lock size={10} /> Đã chốt {p.closedAt ? fmtDateTime(p.closedAt) : ''}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-sm text-slate-700">{p.totalOrders}</td>
                  <td className="py-3 px-4 text-center text-sm">
                    {p.closeAudit ? (
                      <div>
                        <div className="text-emerald-600 font-semibold">{(p.closeAudit.totalEarnedPoints || 0).toLocaleString()} CP</div>
                        <div className="text-xs text-slate-500">{(p.closeAudit.totalEarnedMoney || 0).toLocaleString()} đ</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onSelectPeriod(p.id)}
                        className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors font-medium"
                      >
                        <ChevronRight size={12} />
                        {p.status === 'OPEN' ? 'Cấu hình' : 'Xem'}
                      </button>
                      {p.status === 'OPEN' && (
                        <button
                          onClick={() => setClosingPeriod(p)}
                          className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors font-medium"
                        >
                          <Lock size={12} /> Chốt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>


      {showCreate && (
        <CreatePeriodModal
          periods={periods}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadPeriods(); }}
        />
      )}
      {closingPeriod && (
        <ClosePeriodModal
          period={closingPeriod}
          onClose={() => setClosingPeriod(null)}
          onClosed={() => { setClosingPeriod(null); loadPeriods(); }}
        />
      )}
    </div>
  );
}
