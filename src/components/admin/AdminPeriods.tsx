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
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="glass-panel card p-6 w-full max-w-md flex flex-col gap-4" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-primary text-base flex items-center gap-2"><Calendar size={16} /> Tạo Kỳ Mới</h3>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted font-semibold">Tên kỳ <span className="text-red-400">*</span></label>
          <input className="input-field" placeholder='VD: 10/2026' value={periodName} onChange={e => setPeriodName(e.target.value)} />
          <span className="text-xs text-muted">Định dạng: MM/YYYY</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted font-semibold">Ngày bắt đầu <span className="text-red-400">*</span></label>
            <input type="date" className="input-field" value={startAt} onChange={e => setStartAt(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted font-semibold">Ngày kết thúc <span className="text-red-400">*</span></label>
            <input type="date" className="input-field" value={endAt} onChange={e => setEndAt(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted font-semibold">Sao chép policy từ kỳ trước</label>
          <select className="input-field" value={copyFromId} onChange={e => setCopyFromId(e.target.value)}>
            <option value="">Tạo mới (tất cả NOT_CONFIGURED)</option>
            {closedPeriods.map(p => (
              <option key={p.id} value={p.id}>{p.periodName} (đã chốt)</option>
            ))}
          </select>
          <span className="text-xs text-muted">Nếu sao chép, policy mới sẽ lấy giá trị từ kỳ được chọn.</span>
        </div>

        {error && <div className="text-red-400 text-xs bg-red-900/30 rounded p-2">{error}</div>}

        <div className="flex gap-2">
          <button className="btn btn-outline flex-1" onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary flex-1" disabled={saving} onClick={handleCreate}>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="glass-panel card p-6 w-full max-w-md flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-red-400 text-base flex items-center gap-2"><Lock size={16} /> Chốt Kỳ Hoa Hồng</h3>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={18} /></button>
        </div>

        <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 flex flex-col gap-2 text-sm">
          <div className="font-bold text-red-300">⚠ Bạn đang chốt kỳ {period.periodName}</div>
          <div className="text-muted text-xs">
            <div>Tổng đơn hàng: <b className="text-white">{period.totalOrders}</b></div>
            <div>Tổng hoa hồng: <b className="text-white">{period.totalCommissions}</b> bản ghi</div>
          </div>
          <div className="text-red-300 text-xs mt-1 font-semibold">Sau khi chốt:</div>
          <ul className="text-xs text-muted list-disc list-inside space-y-1">
            <li>Toàn bộ policy kỳ này bị khóa</li>
            <li>Toàn bộ commission bị khóa</li>
            <li>Không thể sửa, xóa, hoặc recalculate</li>
            <li>CTV chỉ được xem</li>
          </ul>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted font-semibold">
            Nhập để xác nhận: <span className="text-yellow-300 font-mono">{expectedPhrase}</span>
          </label>
          <input
            className="input-field font-mono"
            value={confirmPhrase}
            onChange={e => setConfirmPhrase(e.target.value)}
            placeholder={expectedPhrase}
          />
        </div>

        {error && <div className="text-red-400 text-xs bg-red-900/30 rounded p-2">{error}</div>}

        <div className="flex gap-2">
          <button className="btn btn-outline flex-1" onClick={onClose}>Huỷ</button>
          <button
            className="btn flex-1 bg-red-600 hover:bg-red-500 text-white"
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
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar size={20} className="text-primary" /> Kỳ Hoa Hồng
          </h2>
          <p className="text-sm text-muted mt-1">Quản lý kỳ hoa hồng, policy và chốt kỳ.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadPeriods} className="btn btn-outline flex items-center gap-2 text-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          {!openPeriod && (
            <button onClick={() => setShowCreate(true)} className="btn btn-primary flex items-center gap-2 text-sm">
              <Plus size={14} /> Tạo Kỳ Mới
            </button>
          )}
        </div>
      </div>

      {openPeriod && (
        <div className="flex items-center gap-3 bg-green-900/20 border border-green-700/30 rounded-xl px-4 py-3 text-sm">
          <Unlock size={16} className="text-green-400 shrink-0" />
          <span className="text-green-300">
            Kỳ <b>{openPeriod.periodName}</b> đang mở ({fmtDate(openPeriod.startAt)} → {fmtDate(openPeriod.endAt)}).
            Đơn hàng mới sẽ thuộc kỳ này.
          </span>
        </div>
      )}

      {!openPeriod && periods.length > 0 && (
        <div className="flex items-center gap-3 bg-yellow-900/20 border border-yellow-700/30 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle size={16} className="text-yellow-400 shrink-0" />
          <span className="text-yellow-300">Không có kỳ nào đang mở. Đơn hàng mới sẽ không gắn vào kỳ nào. <button onClick={() => setShowCreate(true)} className="underline ml-1">Tạo kỳ mới</button></span>
        </div>
      )}

      <div className="card glass-panel overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-muted">Đang tải...</div>
        ) : periods.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <Calendar size={32} className="mx-auto mb-3 opacity-30" />
            <div className="text-sm">Chưa có kỳ nào.</div>
            <button onClick={() => setShowCreate(true)} className="btn btn-primary mt-3 text-sm flex items-center gap-2 mx-auto">
              <Plus size={14} /> Tạo Kỳ Đầu Tiên
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-xs text-muted uppercase tracking-wide">
                <th className="py-3 px-4 text-left">Kỳ</th>
                <th className="py-3 px-4 text-center">Thời gian</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Đơn hàng</th>
                <th className="py-3 px-4 text-center">Hoa hồng</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {periods.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{p.periodName}</div>
                    <div className="text-xs text-muted">Tạo bởi {p.createdBy}</div>
                  </td>
                  <td className="py-3 px-4 text-center text-xs text-muted">
                    {fmtDate(p.startAt)} → {fmtDate(p.endAt)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.status === 'OPEN' ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">
                        <Unlock size={10} /> Đang mở
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full">
                        <Lock size={10} /> Đã chốt {p.closedAt ? fmtDateTime(p.closedAt) : ''}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-sm">{p.totalOrders}</td>
                  <td className="py-3 px-4 text-center text-sm">
                    {p.closeAudit ? (
                      <div>
                        <div className="text-green-400">{(p.closeAudit.totalEarnedPoints || 0).toLocaleString()} CP</div>
                        <div className="text-xs text-muted">{(p.closeAudit.totalEarnedMoney || 0).toLocaleString()} đ</div>
                      </div>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onSelectPeriod(p.id)}
                        className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/20 hover:bg-primary/40 text-primary transition-colors"
                      >
                        <ChevronRight size={12} />
                        {p.status === 'OPEN' ? 'Cấu hình' : 'Xem'}
                      </button>
                      {p.status === 'OPEN' && (
                        <button
                          onClick={() => setClosingPeriod(p)}
                          className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 transition-colors"
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
