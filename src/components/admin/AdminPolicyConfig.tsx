import React, { useState, useEffect, useCallback } from 'react';
import { Settings2, Clock, AlertTriangle, CheckCircle, X, Edit3, RefreshCw } from 'lucide-react';

// Types
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

// Constants
const GROUPS: { id: string; label: string; keys: string[] }[] = [
  {
    id: 'AMBASSADOR',
    label: 'Đại sứ',
    keys: ['AMBASSADOR_SELF_BUY','AMBASSADOR_DIRECT_NO_ID','AMBASSADOR_DIRECT_WITH_ID','AMBASSADOR_THRESHOLD'],
  },
  {
    id: 'MANAGER',
    label: 'Trưởng nhóm',
    keys: ['MANAGER_SELF_BUY','MANAGER_DIRECT_NO_ID','MANAGER_DIRECT_WITH_ID','MANAGER_F1_PURCHASE','MANAGER_F2_PURCHASE','MANAGER_F1_SELL_TO_CUSTOMER_NO_ID'],
  },
  {
    id: 'DIRECTOR',
    label: 'Quản lý',
    keys: ['DIRECTOR_SELF_BUY','DIRECTOR_DIRECT_NO_ID','DIRECTOR_DIRECT_WITH_ID','DIRECTOR_F1','DIRECTOR_F2'],
  },
  {
    id: 'META',
    label: 'Hệ Thống',
    keys: ['POLICY_VERSION'],
  },
];

const KEY_LABELS: Record<string, string> = {
  AMBASSADOR_SELF_BUY: 'Đại sứ — Tự mua',
  AMBASSADOR_DIRECT_NO_ID: 'Đại sứ — Bán cho khách chưa có ID',
  AMBASSADOR_DIRECT_WITH_ID: 'Đại sứ — Bán cho khách đã có ID',
  AMBASSADOR_THRESHOLD: 'Ngưỡng điểm tích lũy (Qualifying Points)',
  MANAGER_SELF_BUY: 'Trưởng nhóm — Tự mua',
  MANAGER_DIRECT_NO_ID: 'Trưởng nhóm — Bán cho khách chưa có ID',
  MANAGER_DIRECT_WITH_ID: 'Trưởng nhóm — Bán cho khách đã có ID',
  MANAGER_F1_PURCHASE: 'Trưởng nhóm — F1 tự mua',
  MANAGER_F2_PURCHASE: 'Trưởng nhóm — F2 tự mua',
  MANAGER_F1_SELL_TO_CUSTOMER_NO_ID: 'Trưởng nhóm — Khi F1 bán cho khách mới chưa ID (5%)',
  DIRECTOR_SELF_BUY: 'Quản lý — Tự mua',
  DIRECTOR_DIRECT_NO_ID: 'Quản lý — Bán cho khách chưa có ID',
  DIRECTOR_DIRECT_WITH_ID: 'Quản lý — Bán cho khách đã có ID',
  DIRECTOR_F1: 'Quản lý — Upstream từ F1 (D1)',
  DIRECTOR_F2: 'Quản lý — Upstream từ F2 (D2)',
  POLICY_VERSION: 'Phiên bản Policy (tự động)',
};

const READ_ONLY_KEYS = new Set(['POLICY_VERSION']);
const THRESHOLD_KEYS = new Set(['AMBASSADOR_THRESHOLD']);

// Helpers
function formatValue(key: string, raw: string): string {
  if (raw === 'NOT_CONFIGURED') return 'Chưa cấu hình';
  if (key === 'POLICY_VERSION') return `v${raw}`;
  if (THRESHOLD_KEYS.has(key)) return `${raw} CP`;
  const n = parseFloat(raw);
  return isNaN(n) ? raw : `${(n * 100).toFixed(0)}%`;
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return iso; }
}

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

// Edit Modal
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saving, onClose]);

  function getApiValue(): string {
    if (useNotConfigured) return 'NOT_CONFIGURED';
    if (isThreshold) return inputVal.trim();
    const n = parseFloat(inputVal);
    return isNaN(n) ? '' : String(n / 100);
  }

  function isValid(): boolean {
    if (!reason.trim()) return false;
    if (useNotConfigured) return true;
    if (isThreshold) { const n = parseInt(inputVal, 10); return !isNaN(n) && n > 0 && String(n) === inputVal.trim(); }
    const n = parseFloat(inputVal);
    return !isNaN(n) && n >= 0 && n <= 100;
  }

  async function handleSave() {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/admin/policy/${encodeURIComponent(entry.key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfToken() },
        credentials: 'include',
        body: JSON.stringify({ value: getApiValue(), reason: reason.trim() }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message || 'Lỗi không xác định.'); setConfirmed(false); }
      else { onSaved(); onClose(); }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối.');
      setConfirmed(false);
    } finally { setSaving(false); }
  }

  const previewValue = useNotConfigured ? 'Chưa cấu hình' : formatValue(entry.key, getApiValue());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col border border-slate-200"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* FIXED HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Edit3 size={16} className="text-sky-600" />
            Sửa Policy
          </h3>
          <button
            onClick={onClose} disabled={saving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Dóng (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 min-h-0">
          <div className="bg-slate-50 rounded-xl px-4 py-3 flex flex-col gap-1">
            <div className="text-xs font-mono text-slate-400 break-all">{entry.key}</div>
            <div className="text-sm font-semibold text-slate-800">{KEY_LABELS[entry.key] || entry.key}</div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Giá trị hiện tại</span>
            <span className={`text-sm font-bold ${entry.status === 'NOT_CONFIGURED' ? 'text-red-500' : 'text-sky-600'}`}>
              {formatValue(entry.key, entry.value)}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {isThreshold ? 'Ngưỡng mới (điểm nguyên dương)' : 'Tỉ lệ mới (0–100%)'}
            </span>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox" checked={useNotConfigured}
                onChange={e => setUseNotConfigured(e.target.checked)}
                className="w-4 h-4 accent-red-500 cursor-pointer"
              />
              <span className="text-red-500 text-xs font-medium">Đặt NOT_CONFIGURED (tắt commission)</span>
            </label>
            {!useNotConfigured && (
              <input
                type="number"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder-slate-400"
                min={isThreshold ? 1 : 0} max={isThreshold ? undefined : 100} step={1}
                value={inputVal} onChange={e => setInputVal(e.target.value)}
                placeholder={isThreshold ? 'VD: 5000' : 'VD: 20'}
              />
            )}
            {!useNotConfigured && !isThreshold && (
              <span className="text-xs text-slate-400">Nhập số % (VD: 20 = 20%)</span>
            )}
          </div>
          {!useNotConfigured && inputVal && (
            <div className="flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
              <span className="text-xs text-slate-500">Preview:</span>
              <span className="text-sm font-bold text-sky-700">{previewValue}</span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Lý do thay đổi <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none placeholder-slate-400"
              rows={3} placeholder="Nhập lý do cụ thể..."
              value={reason} onChange={e => setReason(e.target.value)}
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />{error}
            </div>
          )}
          {confirmed && (
            <div className="flex items-start gap-2 text-amber-700 text-xs bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                Xác nhận thay đổi từ{' '}
                <strong>{formatValue(entry.key, entry.value)}</strong>
                {' → '}
                <strong>{previewValue}</strong>?
                {' '}Hành động này sẽ được ghi vào audit log.
              </span>
            </div>
          )}
        </div>

        {/* FIXED FOOTER */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50 rounded-b-2xl">
          {!confirmed ? (
            <>
              <button
                onClick={onClose} disabled={saving}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                className="flex-1 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isValid() || saving} onClick={() => setConfirmed(true)}
              >
                Xem lại &amp; Xác nhận
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setConfirmed(false)} disabled={saving}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Quay lại
              </button>
              <button
                className="flex-1 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving} onClick={handleSave}
              >
                {saving ? 'Đang lưu...' : 'Xác nhận Lưu'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// History Modal
function HistoryModal({ policyKey, onClose }: { policyKey: string; onClose: () => void }) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/policy/${encodeURIComponent(policyKey)}/history`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setLogs(d.data); })
      .finally(() => setLoading(false));
  }, [policyKey]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col border border-slate-200"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* FIXED HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Clock size={16} className="text-sky-600" />
            Lịch sử thay đổi
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Dóng (Esc)"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 pt-3 pb-0 flex-shrink-0">
          <div className="text-xs font-mono text-slate-400 bg-slate-50 rounded-lg px-3 py-2 break-all">{policyKey}</div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
              <RefreshCw size={16} className="animate-spin" /> Đang tải...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Chưa có lịch sử thay đổi.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {logs.map((l, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-2 bg-slate-50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{fmtDate(l.createdAt)}</span>
                    <span className="text-xs font-mono font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">v{l.version}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-red-500">{l.oldValue ?? '—'}</span>
                    <span className="text-slate-400">→</span>
                    <span className="font-semibold text-sky-600">{l.newValue}</span>
                  </div>
                  {l.reason && (
                    <div className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2">📝 {l.reason}</div>
                  )}
                  {l.updatedBy && <div className="text-xs text-slate-400">bởi {l.updatedBy}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FIXED FOOTER */}
        <div className="px-5 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// Policy Row
function PolicyRow({ entry, onEdit, onHistory }: { entry: PolicyEntry; onEdit: (e: PolicyEntry) => void; onHistory: (key: string) => void }) {
  const isNotConfigured = entry.status === 'NOT_CONFIGURED';
  const isReadOnly = READ_ONLY_KEYS.has(entry.key);
  return (
    <tr className="border-b border-slate-100 hover:bg-sky-50/40 transition-colors">
      <td className="py-3 px-4">
        <div className="text-xs font-mono text-slate-400 break-all">{entry.key}</div>
        <div className="text-sm font-semibold text-slate-800 mt-0.5">{KEY_LABELS[entry.key] || entry.key}</div>
      </td>
      <td className="py-3 px-4 text-center">
        <span className={`font-bold text-sm ${isNotConfigured ? 'text-red-500' : 'text-sky-600'}`}>
          {formatValue(entry.key, entry.value)}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        {isNotConfigured ? (
          <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full font-medium">
            <AlertTriangle size={10} /> Chưa cấu hình
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-full font-medium">
            <CheckCircle size={10} /> Đang dùng
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-center text-xs text-slate-500 font-mono">{entry.version}</td>
      <td className="py-3 px-4 text-center text-xs text-slate-500">
        {entry.updatedBy && <div className="font-medium text-slate-700">{entry.updatedBy}</div>}
        <div>{fmtDate(entry.updatedAt)}</div>
      </td>
      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          {isReadOnly
            ? <span className="text-xs text-slate-400 italic">Chỉ đọc</span>
            : (
              <button
                onClick={() => onEdit(entry)}
                className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors font-medium"
              >
                <Edit3 size={12} /> Sửa
              </button>
            )
          }
          <button
            onClick={() => onHistory(entry.key)}
            className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors font-medium"
          >
            <Clock size={12} /> Lịch sử
          </button>
        </div>
      </td>
    </tr>
  );
}

// Main Component
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
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings2 size={20} className="text-sky-600" />
            Cấu Hình Hoa Hồng
          </h2>
          <p className="text-sm text-slate-500 mt-1">Quản lý tỉ lệ commission chính thức. Mọi thay đổi được ghi audit log đầy đủ.</p>
        </div>
        <button
          onClick={loadPolicies} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {notConfiguredCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm">
          <AlertTriangle size={16} className="shrink-0 text-amber-500" />
          <span><strong>{notConfiguredCount} key</strong> đang NOT_CONFIGURED — commission cho các rule này sẽ không được tạo cho đến khi Boss xác nhận tỉ lệ.</span>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {GROUPS.map(g => {
          const nc = policies.filter(p => g.keys.includes(p.key) && p.status === 'NOT_CONFIGURED').length;
          return (
            <button key={g.id} onClick={() => setActiveGroup(g.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                activeGroup === g.id
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {g.label}
              {nc > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{nc}</span>}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin" /> Đang tải cấu hình...
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wide">
                <th className="py-3 px-4 text-left font-semibold">Policy Key</th>
                <th className="py-3 px-4 text-center font-semibold">Giá trị</th>
                <th className="py-3 px-4 text-center font-semibold">Trạng thái</th>
                <th className="py-3 px-4 text-center font-semibold">Version</th>
                <th className="py-3 px-4 text-center font-semibold">Cập nhật bởi</th>
                <th className="py-3 px-4 text-center font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {groupPolicies.length === 0
                ? <tr><td colSpan={6} className="py-12 text-center text-slate-400 text-sm">Không có dữ liệu.</td></tr>
                : groupPolicies.map(entry => <PolicyRow key={entry.key} entry={entry} onEdit={setEditEntry} onHistory={setHistoryKey} />)
              }
            </tbody>
          </table>
        )}
      </div>

      <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        ⚠ Thay đổi policy chỉ ảnh hưởng các commission phát sinh <strong>sau</strong> thời điểm thay đổi.
        Commission lịch sử giữ nguyên snapshot tại thời điểm phát sinh (ruleKey, rateSnapshot, policyVersion).
      </div>

      {editEntry && (
        <EditModal entry={editEntry} onClose={() => setEditEntry(null)} onSaved={() => { setEditEntry(null); loadPolicies(); }} />
      )}
      {historyKey && (
        <HistoryModal policyKey={historyKey} onClose={() => setHistoryKey(null)} />
      )}
    </div>
  );
}