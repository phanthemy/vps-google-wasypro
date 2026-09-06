import React, { useState, useEffect, useCallback } from 'react';
import { Settings2, Clock, AlertTriangle, CheckCircle, X, Edit3, RefreshCw } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────
interface PolicyEntry {
  key: string;
  value: string;
  description: string | null;
  version: string;
  updatedBy: string | null;
  updatedAt: string;
  status: 'ACTIVE' | 'NOT_CONFIGURED';
}

interface AuditEntry {
  oldValue: string | null;
  newValue: string;
  version: string;
  updatedBy: string | null;
  reason: string | null;
  createdAt: string;
}

// ── Constants ─────────────────────────────────────────────────────────────
const GROUPS: { id: string; label: string; color: string; keys: string[] }[] = [
  {
    id: 'AMBASSADOR',
    label: 'Đại Sứ Kinh Doanh',
    color: 'text-slate-300',
    keys: [
      'AMBASSADOR_SELF_BUY',
      'AMBASSADOR_DIRECT_NO_ID',
      'AMBASSADOR_DIRECT_WITH_ID',
      'AMBASSADOR_THRESHOLD',
    ],
  },
  {
    id: 'MANAGER',
    label: 'Quản Lý',
    color: 'text-yellow-400',
    keys: [
      'MANAGER_SELF_BUY',
      'MANAGER_DIRECT_NO_ID',
      'MANAGER_DIRECT_WITH_ID',
      'MANAGER_F1_PURCHASE',
      'MANAGER_F2_PURCHASE',
      'MANAGER_F1_SELL_TO_CUSTOMER_NO_ID',
    ],
  },
  {
    id: 'DIRECTOR',
    label: 'Giám Đốc PT',
    color: 'text-cyan-400',
    keys: [
      'DIRECTOR_SELF_BUY',
      'DIRECTOR_DIRECT_NO_ID',
      'DIRECTOR_DIRECT_WITH_ID',
      'DIRECTOR_F1',
      'DIRECTOR_F2',
    ],
  },
  {
    id: 'META',
    label: 'Hệ Thống',
    color: 'text-purple-400',
    keys: ['POLICY_VERSION'],
  },
];

const KEY_LABELS: Record<string, string> = {
  AMBASSADOR_SELF_BUY: 'Đại Sứ — Tự mua',
  AMBASSADOR_DIRECT_NO_ID: 'Đại Sứ — Bán cho khách chưa có ID',
  AMBASSADOR_DIRECT_WITH_ID: 'Đại Sứ — Bán cho khách đã có ID',
  AMBASSADOR_THRESHOLD: 'Ngưỡng điểm tích lũy (Qualifying Points)',
  MANAGER_SELF_BUY: 'Quản Lý — Tự mua',
  MANAGER_DIRECT_NO_ID: 'Quản Lý — Bán cho khách chưa có ID',
  MANAGER_DIRECT_WITH_ID: 'Quản Lý — Bán cho khách đã có ID',
  MANAGER_F1_PURCHASE: 'Quản Lý — F1 tự mua',
  MANAGER_F2_PURCHASE: 'Quản Lý — F2 tự mua',
  MANAGER_F1_SELL_TO_CUSTOMER_NO_ID: 'Quản Lý — F1 bán khách chưa ID (OPEN)',
  DIRECTOR_SELF_BUY: 'Giám Đốc — Tự mua',
  DIRECTOR_DIRECT_NO_ID: 'Giám Đốc — Bán cho khách chưa có ID',
  DIRECTOR_DIRECT_WITH_ID: 'Giám Đốc — Bán cho khách đã có ID',
  DIRECTOR_F1: 'Giám Đốc — F1 (D1)',
  DIRECTOR_F2: 'Giám Đốc — F2 (D2)',
  POLICY_VERSION: 'Phiên bản Policy (tự động)',
};

const READ_ONLY_KEYS = new Set(['POLICY_VERSION']);
const THRESHOLD_KEYS = new Set(['AMBASSADOR_THRESHOLD']);

// ── Helpers ───────────────────────────────────────────────────────────────
function formatValue(key: string, raw: string): string {
  if (raw === 'NOT_CONFIGURED') return 'Chưa cấu hình';
  if (THRESHOLD_KEYS.has(key)) return `${raw} CP`;
  const n = parseFloat(raw);
  return isNaN(n) ? raw : `${(n * 100).toFixed(0)}%`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

// ── Edit Modal ─────────────────────────────────────────────────────────────
function EditModal({ entry, onClose, onSaved }: { entry: PolicyEntry; onClose: () => void; onSaved: () => void }) {
  const isThreshold = THRESHOLD_KEYS.has(entry.key);
  const [inputVal, setInputVal] = useState<string>(
    entry.value === 'NOT_CONFIGURED' ? '' : isThreshold ? entry.value : String(Math.round(parseFloat(entry.value) * 100))
  );
  const [useNotConfigured, setUseNotConfigured] = useState(entry.value === 'NOT_CONFIGURED');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function getApiValue(): string {
    if (useNotConfigured) return 'NOT_CONFIGURED';
    if (isThreshold) return inputVal.trim();
    const n = parseFloat(inputVal);
    return isNaN(n) ? '' : String(n / 100);
  }

  function isValid(): boolean {
    if (!reason.trim()) return false;
    if (useNotConfigured) return true;
    if (isThreshold) {
      const n = parseInt(inputVal, 10);
      return !isNaN(n) && n > 0 && String(n) === inputVal.trim();
    }
    const n = parseFloat(inputVal);
    return !isNaN(n) && n >= 0 && n <= 100;
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/policy/${encodeURIComponent(entry.key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
        credentials: 'include',
        body: JSON.stringify({ value: getApiValue(), reason: reason.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Lỗi không xác định.');
        setConfirmed(false);
      } else {
        onSaved();
        onClose();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối.');
      setConfirmed(false);
    } finally {
      setSaving(false);
    }
  }

  const previewValue = useNotConfigured ? 'Chưa cấu hình' : formatValue(entry.key, getApiValue());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="glass-panel card p-6 w-full max-w-md flex flex-col gap-4" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-primary text-base">Sửa Policy</h3>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={18} /></button>
        </div>
        <div className="text-xs text-muted font-mono break-all">{entry.key}</div>
        <div className="text-sm">{KEY_LABELS[entry.key] || entry.key}</div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted font-semibold">Giá trị hiện tại</label>
          <span className={`text-sm font-bold ${entry.status === 'NOT_CONFIGURED' ? 'text-red-400' : 'text-green-400'}`}>
            {formatValue(entry.key, entry.value)}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-muted font-semibold">
            {isThreshold ? 'Ngưỡng mới (điểm nguyên dương)' : 'Tỉ lệ mới (0–100%)'}
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={useNotConfigured} onChange={e => setUseNotConfigured(e.target.checked)} className="accent-red-500" />
            <span className="text-red-400 text-xs">Đặt NOT_CONFIGURED (tắt commission)</span>
          </label>
          {!useNotConfigured && (
            <input
              type="number" className="input-field"
              min={isThreshold ? 1 : 0} max={isThreshold ? undefined : 100} step={1}
              value={inputVal} onChange={e => setInputVal(e.target.value)}
              placeholder={isThreshold ? 'VD: 5000' : 'VD: 20'}
            />
          )}
          {!useNotConfigured && !isThreshold && <span className="text-xs text-muted">Nhập số % (VD: 20 = 20%)</span>}
        </div>
        {!useNotConfigured && inputVal && (
          <div className="text-xs text-slate-400">Preview: <span className="text-white font-bold">{previewValue}</span></div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted font-semibold">Lý do thay đổi <span className="text-red-400">*</span></label>
          <textarea className="input-field text-sm" rows={3} placeholder="Nhập lý do cụ thể..." value={reason} onChange={e => setReason(e.target.value)} />
        </div>
        {error && <div className="text-red-400 text-xs bg-red-900/30 rounded p-2">{error}</div>}
        {!confirmed ? (
          <button className="btn btn-primary w-full" disabled={!isValid() || saving} onClick={() => setConfirmed(true)}>
            Xem lại & Xác nhận
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="text-xs text-yellow-300 bg-yellow-900/30 rounded p-2">
              ⚠ Xác nhận thay đổi từ <b>{formatValue(entry.key, entry.value)}</b> → <b>{previewValue}</b>?
              Hành động này sẽ được ghi vào audit log.
            </div>
            <div className="flex gap-2">
              <button className="btn btn-outline flex-1" onClick={() => setConfirmed(false)}>Huỷ</button>
              <button className="btn btn-primary flex-1" disabled={saving} onClick={handleSave}>
                {saving ? 'Đang lưu...' : 'Xác nhận Lưu'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── History Panel ──────────────────────────────────────────────────────────
function HistoryPanel({ policyKey, onClose }: { policyKey: string; onClose: () => void }) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/policy/${encodeURIComponent(policyKey)}/history`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setLogs(d.data); })
      .finally(() => setLoading(false));
  }, [policyKey]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="glass-panel card p-6 w-full max-w-lg flex flex-col gap-4" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-primary text-base flex items-center gap-2"><Clock size={16} /> Lịch sử thay đổi</h3>
          <button onClick={onClose} className="text-muted hover:text-white"><X size={18} /></button>
        </div>
        <div className="text-xs font-mono text-muted">{policyKey}</div>
        {loading ? (
          <div className="text-muted text-sm">Đang tải...</div>
        ) : logs.length === 0 ? (
          <div className="text-muted text-sm">Chưa có lịch sử thay đổi.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {logs.map((l, i) => (
              <div key={i} className="border border-white/10 rounded-lg p-3 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted">{fmtDate(l.createdAt)}</span>
                  <span className="text-xs font-mono text-purple-400">v{l.version}</span>
                </div>
                <div className="text-xs">
                  <span className="text-red-400">{l.oldValue ?? '—'}</span>{' → '}
                  <span className="text-green-400">{l.newValue}</span>
                </div>
                {l.reason && <div className="text-xs text-slate-300">📝 {l.reason}</div>}
                {l.updatedBy && <div className="text-xs text-muted">by {l.updatedBy}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Policy Row ─────────────────────────────────────────────────────────────
function PolicyRow({ entry, onEdit, onHistory }: { entry: PolicyEntry; onEdit: (e: PolicyEntry) => void; onHistory: (key: string) => void }) {
  const isNotConfigured = entry.status === 'NOT_CONFIGURED';
  const isReadOnly = READ_ONLY_KEYS.has(entry.key);
  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="py-3 px-4">
        <div className="text-xs font-mono text-muted break-all">{entry.key}</div>
        <div className="text-sm text-white mt-0.5">{KEY_LABELS[entry.key] || entry.key}</div>
      </td>
      <td className="py-3 px-4 text-center">
        <span className={`font-bold text-sm ${isNotConfigured ? 'text-red-400' : 'text-green-400'}`}>
          {formatValue(entry.key, entry.value)}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        {isNotConfigured ? (
          <span className="inline-flex items-center gap-1 text-xs bg-red-900/40 text-red-400 px-2 py-0.5 rounded-full">
            <AlertTriangle size={10} /> Chưa cấu hình
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">
            <CheckCircle size={10} /> Đang dùng
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-center text-xs text-muted font-mono">{entry.version}</td>
      <td className="py-3 px-4 text-center text-xs text-muted">
        {entry.updatedBy && <div>{entry.updatedBy}</div>}
        <div>{fmtDate(entry.updatedAt)}</div>
      </td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          {isReadOnly
            ? <span className="text-xs text-muted italic">Chỉ đọc</span>
            : <button onClick={() => onEdit(entry)} className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/20 hover:bg-primary/40 text-primary transition-colors">
                <Edit3 size={12} /> Sửa
              </button>
          }
          <button onClick={() => onHistory(entry.key)} className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors">
            <Clock size={12} /> Lịch sử
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AdminPolicyConfig() {
  const [policies, setPolicies] = useState<PolicyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState('AMBASSADOR');
  const [editEntry, setEditEntry] = useState<PolicyEntry | null>(null);
  const [historyKey, setHistoryKey] = useState<string | null>(null);

  const loadPolicies = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/policy', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setPolicies(d.data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadPolicies(); }, [loadPolicies]);

  const currentGroup = GROUPS.find(g => g.id === activeGroup)!;
  const groupPolicies = policies.filter(p => currentGroup.keys.includes(p.key));
  const notConfiguredCount = policies.filter(p => p.status === 'NOT_CONFIGURED').length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings2 size={20} className="text-primary" /> Cấu Hình Hoa Hồng
          </h2>
          <p className="text-sm text-muted mt-1">Quản lý tỉ lệ commission chính thức. Mọi thay đổi được ghi audit log đầy đủ.</p>
        </div>
        <button onClick={loadPolicies} className="btn btn-outline flex items-center gap-2 text-sm" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {notConfiguredCount > 0 && (
        <div className="flex items-center gap-3 bg-yellow-900/30 border border-yellow-700/40 rounded-xl px-4 py-3 text-yellow-300 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          <span><b>{notConfiguredCount} key</b> đang NOT_CONFIGURED — commission cho các rule này sẽ không được tạo cho đến khi Boss xác nhận tỉ lệ.</span>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {GROUPS.map(g => {
          const nc = policies.filter(p => g.keys.includes(p.key) && p.status === 'NOT_CONFIGURED').length;
          return (
            <button key={g.id} onClick={() => setActiveGroup(g.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${activeGroup === g.id ? 'bg-primary text-white border-primary' : 'bg-white/5 text-muted border-white/10 hover:bg-white/10'}`}>
              <span className={activeGroup === g.id ? '' : g.color}>{g.label}</span>
              {nc > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{nc}</span>}
            </button>
          );
        })}
      </div>

      <div className="card glass-panel overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-muted">Đang tải cấu hình...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-xs text-muted uppercase tracking-wide">
                <th className="py-3 px-4 text-left">Policy Key</th>
                <th className="py-3 px-4 text-center">Giá trị</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Version</th>
                <th className="py-3 px-4 text-center">Cập nhật bởi</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {groupPolicies.length === 0
                ? <tr><td colSpan={6} className="py-8 text-center text-muted text-sm">Không có dữ liệu.</td></tr>
                : groupPolicies.map(entry => <PolicyRow key={entry.key} entry={entry} onEdit={setEditEntry} onHistory={setHistoryKey} />)
              }
            </tbody>
          </table>
        )}
      </div>

      <div className="text-xs text-muted border border-white/5 rounded-xl px-4 py-3">
        ⚠ Thay đổi policy chỉ ảnh hưởng các commission phát sinh <b>sau</b> thời điểm thay đổi.
        Commission lịch sử giữ nguyên snapshot tại thời điểm phát sinh (ruleKey, rateSnapshot, policyVersion).
      </div>

      {editEntry && <EditModal entry={editEntry} onClose={() => setEditEntry(null)} onSaved={() => { setEditEntry(null); loadPolicies(); }} />}
      {historyKey && <HistoryPanel policyKey={historyKey} onClose={() => setHistoryKey(null)} />}
    </div>
  );
}
