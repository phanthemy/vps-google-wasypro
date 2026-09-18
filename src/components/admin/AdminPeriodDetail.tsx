import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Calendar, Lock, Unlock, Edit3, Clock, X, AlertTriangle, CheckCircle, RefreshCw, ShieldCheck
} from 'lucide-react';

interface Period {
  id: string;
  periodName: string;
  startAt: string;
  endAt: string;
  status: 'OPEN' | 'CLOSED';
  createdBy: string;
  closedAt?: string;
  closedBy?: string;
  totalOrders: number;
  totalCommissions: number;
  totalEarnedPoints: number;
  totalEarnedMoney: number;
  policies: PolicyEntry[];
  closeAudit?: CloseAudit;
}

interface PolicyEntry {
  id: string;
  periodId: string;
  key: string;
  value: string;
  description: string | null;
  version: string;
  updatedBy: string | null;
  updatedAt: string;
  effectiveFrom: string;
  status: 'ACTIVE' | 'NOT_CONFIGURED';
  readOnly: boolean;
}

interface AuditEntry {
  oldValue: string | null;
  newValue: string;
  version: string;
  updatedBy: string | null;
  reason: string | null;
  updatedAt: string;
  effectiveFrom: string | null;
}

interface CloseAudit {
  closedBy: string;
  closedAt: string;
  totalOrders: number;
  totalCommissions: number;
  totalEarnedPoints: number;
  totalEarnedMoney: number;
}

interface Commission {
  id: string;
  type: string;
  ruleKey: string;
  rateSnapshot: number;
  earnedPoints: number;
  earnedMoney: number;
  policyVersion: string;
  createdAt: string;
  receiver: { userId: string; fullName: string; rank: string };
  order: { id: string; customer: { fullName: string } };
}

// ── Constants ──────────────────────────────────────────────────
const GROUPS: { id: string; label: string; keys: string[] }[] = [
  { id: 'AMBASSADOR', label: 'Đại sứ', keys: ['AMBASSADOR_SELF_BUY', 'AMBASSADOR_DIRECT_NO_ID', 'AMBASSADOR_DIRECT_WITH_ID', 'AMBASSADOR_THRESHOLD'] },
  { id: 'MANAGER',   label: 'Trưởng nhóm', keys: ['MANAGER_SELF_BUY', 'MANAGER_DIRECT_NO_ID', 'MANAGER_DIRECT_WITH_ID', 'MANAGER_F1_PURCHASE', 'MANAGER_F2_PURCHASE', 'MANAGER_F1_SELL_TO_CUSTOMER_NO_ID'] },
  { id: 'DIRECTOR',  label: 'Quản lý', keys: ['DIRECTOR_SELF_BUY', 'DIRECTOR_DIRECT_NO_ID', 'DIRECTOR_DIRECT_WITH_ID', 'DIRECTOR_F1', 'DIRECTOR_F2'] },
];

const THRESHOLD_KEYS = new Set(['AMBASSADOR_THRESHOLD']);

function formatValue(key: string, raw: string): string {
  if (raw === 'NOT_CONFIGURED') return 'Chưa cấu hình';
  if (THRESHOLD_KEYS.has(key)) return `${raw} CP`;
  const n = parseFloat(raw);
  return isNaN(n) ? raw : `${(n * 100).toFixed(0)}%`;
}
function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('vi-VN'); } catch { return iso; }
}
function fmtDateTime(iso: string) {
  try { return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }); } catch { return iso; }
}
function getCsrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : '';
}

// ── Edit Policy Modal ─────────────────────────────────────────
function EditPolicyModal({ entry, periodId, onClose, onSaved }: {
  entry: PolicyEntry; periodId: string; onClose: () => void; onSaved: () => void;
}) {
  const isThreshold = THRESHOLD_KEYS.has(entry.key);
  const [inputVal, setInputVal] = useState(entry.value === 'NOT_CONFIGURED' ? '' : isThreshold ? entry.value : String(Math.round(parseFloat(entry.value) * 100)));
  const [useNC, setUseNC] = useState(entry.value === 'NOT_CONFIGURED');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function getApiValue() {
    if (useNC) return 'NOT_CONFIGURED';
    if (isThreshold) return inputVal.trim();
    const n = parseFloat(inputVal);
    return isNaN(n) ? '' : String(n / 100);
  }
  function isValid() {
    if (!reason.trim()) return false;
    if (useNC) return true;
    if (isThreshold) { const n = parseInt(inputVal, 10); return !isNaN(n) && n > 0; }
    const n = parseFloat(inputVal);
    return !isNaN(n) && n >= 0 && n <= 100;
  }
  async function handleSave() {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/admin/periods/${periodId}/policy/${encodeURIComponent(entry.key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
        credentials: 'include',
        body: JSON.stringify({ value: getApiValue(), reason: reason.trim() }),
      });
      const d = await res.json();
      if (!d.success) { setError(d.message); setConfirmed(false); }
      else { onSaved(); onClose(); }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Lỗi'); setConfirmed(false); }
    finally { setSaving(false); }
  }

  const preview = useNC ? 'Chưa cấu hình' : formatValue(entry.key, getApiValue());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-md flex flex-col gap-4" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sky-700 text-base">Sửa Policy</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="text-xs font-mono text-slate-500">{entry.key}</div>
        <div className="text-sm">{entry.description || entry.key}</div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-semibold">Giá trị hiện tại</label>
          <span className={`text-sm font-bold ${entry.status === 'NOT_CONFIGURED' ? 'text-red-400' : 'text-green-400'}`}>{formatValue(entry.key, entry.value)}</span>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-500 font-semibold">{isThreshold ? 'Ngưỡng mới (điểm)' : 'Tỉ lệ mới (0–100%)'}</label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={useNC} onChange={e => setUseNC(e.target.checked)} className="accent-red-500" />
            <span className="text-red-500">Đặt NOT_CONFIGURED</span>
          </label>
          {!useNC && (
            <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder-slate-400" min={isThreshold ? 1 : 0} max={isThreshold ? undefined : 100}
              value={inputVal} onChange={e => setInputVal(e.target.value)} placeholder={isThreshold ? '5000' : '20'} />
          )}
        </div>
        {!useNC && inputVal && <div className="text-xs text-slate-400">Preview: <span className="text-sky-700 font-bold">{preview}</span></div>}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500 font-semibold">Lý do <span className="text-red-500">*</span></label>
          <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder-slate-400" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="Lý do thay đổi..." />
        </div>
        {error && <div className="text-red-500 text-xs bg-red-50 border border-red-200 rounded p-2">{error}</div>}
        {!confirmed ? (
          <button className="w-full px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!isValid() || saving} onClick={() => setConfirmed(true)}>Xem lại & Xác nhận</button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              ⚠ Thay đổi từ <b>{formatValue(entry.key, entry.value)}</b> → <b>{preview}</b>?
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors" onClick={() => setConfirmed(false)}>Huỷ</button>
              <button className="flex-1 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors disabled:opacity-50" disabled={saving} onClick={handleSave}>{saving ? 'Đang lưu...' : 'Xác nhận'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── History Panel ─────────────────────────────────────────────
function HistoryPanel({ policyKey, periodId, onClose }: { policyKey: string; periodId: string; onClose: () => void }) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/admin/periods/${periodId}/policy/${encodeURIComponent(policyKey)}/history`, { credentials: 'include' })
      .then(r => r.json()).then(d => { if (d.success) setLogs(d.data); }).finally(() => setLoading(false));
  }, [policyKey, periodId]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-lg flex flex-col gap-4" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sky-700 text-base flex items-center gap-2"><Clock size={16} /> Lịch sử</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="text-xs font-mono text-slate-500">{policyKey}</div>
        {loading ? <div className="text-slate-500 text-sm">Đang tải...</div> : logs.length === 0 ? <div className="text-slate-500 text-sm">Chưa có lịch sử.</div> : (
          <div className="flex flex-col gap-3">
            {logs.map((l, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-3 flex flex-col gap-1">
                <div className="flex justify-between"><span className="text-xs text-slate-500">{fmtDateTime(l.updatedAt)}</span><span className="text-xs font-mono text-purple-400">v{l.version}</span></div>
                <div className="text-xs"><span className="text-red-500">{l.oldValue ?? '—'}</span>{' → '}<span className="text-emerald-600">{l.newValue}</span></div>
                {l.effectiveFrom && <div className="text-xs text-slate-500">Áp dụng từ: {fmtDateTime(l.effectiveFrom)}</div>}
                {l.reason && <div className="text-xs text-slate-700">📝 {l.reason}</div>}
                {l.updatedBy && <div className="text-xs text-slate-500">by {l.updatedBy}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
interface AdminPeriodDetailProps {
  periodId: string;
  onBack: () => void;
}

export default function AdminPeriodDetail({ periodId, onBack }: AdminPeriodDetailProps) {
  const [period, setPeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'policy' | 'commissions' | 'audit'>('policy');
  const [activeGroup, setActiveGroup] = useState('AMBASSADOR');
  const [editEntry, setEditEntry] = useState<PolicyEntry | null>(null);
  const [historyKey, setHistoryKey] = useState<string | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commsLoading, setCommsLoading] = useState(false);

  const loadPeriod = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/periods/${periodId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setPeriod(d.data); })
      .finally(() => setLoading(false));
  }, [periodId]);

  useEffect(() => { loadPeriod(); }, [loadPeriod]);

  useEffect(() => {
    if (activeTab === 'commissions' && !commsLoading && commissions.length === 0) {
      setCommsLoading(true);
      fetch(`/api/admin/periods/${periodId}/commissions`, { credentials: 'include' })
        .then(r => r.json()).then(d => { if (d.success) setCommissions(d.data); }).finally(() => setCommsLoading(false));
    }
  }, [activeTab, periodId]);

  if (loading || !period) return <div className="p-8 text-center text-slate-500">Đang tải...</div>;

  const currentGroup = GROUPS.find(g => g.id === activeGroup)!;
  const groupPolicies = (period.policies || []).filter(p => currentGroup.keys.includes(p.key));
  const notConfiguredCount = (period.policies || []).filter(p => p.status === 'NOT_CONFIGURED').length;
  const isClosed = period.status === 'CLOSED';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-700 p-1 rounded"><ArrowLeft size={18} /></button>
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar size={20} className="text-sky-700" />
            Kỳ {period.periodName}
            {isClosed
              ? <span className="ml-2 inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full font-medium"><Lock size={10} /> Đã chốt</span>
              : <span className="ml-2 inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium"><Unlock size={10} /> Đang mở</span>
            }
          </h2>
          <p className="text-sm text-slate-500">{fmtDate(period.startAt)} → {fmtDate(period.endAt)}</p>
        </div>
        <button onClick={loadPeriod} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm hover:bg-slate-50 transition-colors disabled:opacity-50" disabled={loading}>
          <RefreshCw size={12} /> Làm mới
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Đơn hàng', value: period.totalOrders },
          { label: 'Hoa hồng', value: period.totalCommissions },
          { label: 'Tổng CP', value: (period.totalEarnedPoints || 0).toLocaleString() + ' CP' },
          { label: 'Tổng tiền', value: (period.totalEarnedMoney || 0).toLocaleString() + ' đ' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className="font-bold text-white text-sm">{s.value}</div>
          </div>
        ))}
      </div>

      {isClosed && (
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
          <Lock size={16} className="text-slate-400 shrink-0" />
          <span className="text-slate-700">
            🔒 Kỳ này đã chốt lúc {period.closedAt ? fmtDateTime(period.closedAt) : '—'} bởi <b>{period.closedBy}</b>.
            Tất cả policy và commission là <b>READ ONLY</b>.
          </span>
        </div>
      )}

      {/* Tab Bar */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {(['policy', 'commissions', 'audit'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab ? 'bg-sky-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab === 'policy' ? 'Policy' : tab === 'commissions' ? 'Hoa hồng' : 'Audit'}
          </button>
        ))}
      </div>

      {/* ── Policy Tab ── */}
      {activeTab === 'policy' && (
        <div className="flex flex-col gap-4">
          {notConfiguredCount > 0 && !isClosed && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800 text-sm">
              <AlertTriangle size={16} className="shrink-0" />
              <span><b>{notConfiguredCount} key</b> chưa được cấu hình — commission cho các rule này sẽ không phát sinh.</span>
            </div>
          )}

          {/* Group tabs */}
          <div className="flex gap-2">
            {GROUPS.map(g => {
              const nc = (period.policies || []).filter(p => g.keys.includes(p.key) && p.status === 'NOT_CONFIGURED').length;
              return (
                <button key={g.id} onClick={() => setActiveGroup(g.id)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${activeGroup === g.id ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-50 text-slate-500 border-white/10 hover:bg-slate-100'}`}>
                  {g.label}
                  {nc > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full">{nc}</span>}
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="py-3 px-4 text-left">Policy Key</th>
                  <th className="py-3 px-4 text-center">Giá trị</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Version</th>
                  <th className="py-3 px-4 text-center">Áp dụng từ</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {groupPolicies.map(entry => (
                  <tr key={entry.key} className="border-b border-slate-100 hover:bg-sky-50/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="text-xs font-mono text-slate-500">{entry.key}</div>
                      <div className="text-sm text-white mt-0.5">{entry.description || entry.key}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-bold text-sm ${entry.status === 'NOT_CONFIGURED' ? 'text-red-400' : 'text-green-400'}`}>
                        {formatValue(entry.key, entry.value)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {entry.status === 'NOT_CONFIGURED'
                        ? <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full font-medium"><AlertTriangle size={10} /> Chưa cấu hình</span>
                        : <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium"><CheckCircle size={10} /> Đang dùng</span>
                      }
                    </td>
                    <td className="py-3 px-4 text-center text-xs font-mono text-slate-500">{entry.version}</td>
                    <td className="py-3 px-4 text-center text-xs text-slate-500">{fmtDateTime(entry.effectiveFrom)}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {!isClosed && !entry.readOnly && (
                          <button onClick={() => setEditEntry(entry)} className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/20 hover:bg-primary/40 text-sky-700 transition-colors">
                            <Edit3 size={12} /> Sửa
                          </button>
                        )}
                        {isClosed && <span className="text-xs text-slate-500 italic">Đã khoá</span>}
                        <button onClick={() => setHistoryKey(entry.key)} className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors">
                          <Clock size={12} /> Lịch sử
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-slate-500 border border-white/5 rounded-xl px-4 py-3">
            ⚠ Thay đổi policy chỉ ảnh hưởng commission phát sinh <b>sau</b> thay đổi trong kỳ này.
            Commission lịch sử giữ nguyên snapshot tại thời điểm phát sinh.
          </div>
        </div>
      )}

      {/* ── Commissions Tab ── */}
      {activeTab === 'commissions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          {commsLoading ? <div className="p-8 text-center text-slate-500">Đang tải...</div> : commissions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Chưa có hoa hồng trong kỳ này.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                  <th className="py-3 px-3 text-left">CTV</th>
                  <th className="py-3 px-3 text-left">Rule</th>
                  <th className="py-3 px-3 text-center">Rate</th>
                  <th className="py-3 px-3 text-center">CP</th>
                  <th className="py-3 px-3 text-center">Tiền</th>
                  <th className="py-3 px-3 text-center">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {commissions.slice(0, 200).map(c => (
                  <tr key={c.id} className="border-b border-slate-100 hover:bg-sky-50/40 transition-colors">
                    <td className="py-2 px-3">
                      <div className="font-medium">{c.receiver?.fullName}</div>
                      <div className="text-xs text-slate-500">{c.receiver?.userId} · {c.receiver?.rank === 'DIRECTOR' ? 'Quản lý' : c.receiver?.rank === 'MANAGER' ? 'Trưởng nhóm' : c.receiver?.rank === 'AMBASSADOR' ? 'Đại sứ' : c.receiver?.rank}</div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="text-xs font-mono text-sky-700">{c.ruleKey || c.type}</div>
                      <div className="text-xs text-slate-500">{c.policyVersion}</div>
                    </td>
                    <td className="py-2 px-3 text-center text-xs">{c.rateSnapshot != null ? `${(c.rateSnapshot * 100).toFixed(0)}%` : '—'}</td>
                    <td className="py-2 px-3 text-center text-emerald-600 font-bold">{(c.earnedPoints || 0).toLocaleString()}</td>
                    <td className="py-2 px-3 text-center text-xs text-slate-500">{(c.earnedMoney || 0).toLocaleString()} đ</td>
                    <td className="py-2 px-3 text-center text-xs text-slate-500">{fmtDateTime(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Audit Tab ── */}
      {activeTab === 'audit' && (
        <div className="flex flex-col gap-4">
          {period.closeAudit ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
              <h3 className="font-bold text-white flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-600" /> Audit Chốt Kỳ</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Người chốt:</span> <b>{period.closeAudit.closedBy}</b></div>
                <div><span className="text-slate-500">Thời điểm:</span> <b>{fmtDateTime(period.closeAudit.closedAt)}</b></div>
                <div><span className="text-slate-500">Tổng đơn:</span> <b>{period.closeAudit.totalOrders}</b></div>
                <div><span className="text-slate-500">Tổng hoa hồng:</span> <b>{period.closeAudit.totalCommissions}</b></div>
                <div><span className="text-slate-500">Tổng CP:</span> <b className="text-emerald-600">{(period.closeAudit.totalEarnedPoints || 0).toLocaleString()} CP</b></div>
                <div><span className="text-slate-500">Tổng tiền:</span> <b className="text-emerald-600">{(period.closeAudit.totalEarnedMoney || 0).toLocaleString()} đ</b></div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center text-slate-400">Kỳ chưa được chốt — chưa có audit.</div>
          )}
        </div>
      )}

      {editEntry && (
        <EditPolicyModal
          entry={editEntry}
          periodId={periodId}
          onClose={() => setEditEntry(null)}
          onSaved={() => { setEditEntry(null); loadPeriod(); }}
        />
      )}
      {historyKey && (
        <HistoryPanel policyKey={historyKey} periodId={periodId} onClose={() => setHistoryKey(null)} />
      )}
    </div>
  );
}
