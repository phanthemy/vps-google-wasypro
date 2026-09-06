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
    label: '\u0110\u1ea1i S\u1ee9 Kinh Doanh',
    keys: ['AMBASSADOR_SELF_BUY','AMBASSADOR_DIRECT_NO_ID','AMBASSADOR_DIRECT_WITH_ID','AMBASSADOR_THRESHOLD'],
  },
  {
    id: 'MANAGER',
    label: 'Qu\u1ea3n L\xfd',
    keys: ['MANAGER_SELF_BUY','MANAGER_DIRECT_NO_ID','MANAGER_DIRECT_WITH_ID','MANAGER_F1_PURCHASE','MANAGER_F2_PURCHASE','MANAGER_F1_SELL_TO_CUSTOMER_NO_ID'],
  },
  {
    id: 'DIRECTOR',
    label: 'Gi\xe1m \u0110\u1ed1c',
    keys: ['DIRECTOR_SELF_BUY','DIRECTOR_DIRECT_NO_ID','DIRECTOR_DIRECT_WITH_ID','DIRECTOR_F1','DIRECTOR_F2'],
  },
  {
    id: 'META',
    label: 'H\u1ec7 Th\u1ed1ng',
    keys: ['POLICY_VERSION'],
  },
];

const KEY_LABELS: Record<string, string> = {
  AMBASSADOR_SELF_BUY: '\u0110\u1ea1i S\u1ee9 \u2014 T\u1ef1 mua',
  AMBASSADOR_DIRECT_NO_ID: '\u0110\u1ea1i S\u1ee9 \u2014 B\xe1n cho kh\xe1ch ch\u01b0a c\xf3 ID',
  AMBASSADOR_DIRECT_WITH_ID: '\u0110\u1ea1i S\u1ee9 \u2014 B\xe1n cho kh\xe1ch \u0111\xe3 c\xf3 ID',
  AMBASSADOR_THRESHOLD: 'Ng\u01b0\u1ee1ng \u0111i\u1ec3m t\xedch l\u0169y (Qualifying Points)',
  MANAGER_SELF_BUY: 'Qu\u1ea3n L\xfd \u2014 T\u1ef1 mua',
  MANAGER_DIRECT_NO_ID: 'Qu\u1ea3n L\xfd \u2014 B\xe1n cho kh\xe1ch ch\u01b0a c\xf3 ID',
  MANAGER_DIRECT_WITH_ID: 'Qu\u1ea3n L\xfd \u2014 B\xe1n cho kh\xe1ch \u0111\xe3 c\xf3 ID',
  MANAGER_F1_PURCHASE: 'Qu\u1ea3n L\xfd \u2014 F1 t\u1ef1 mua',
  MANAGER_F2_PURCHASE: 'Qu\u1ea3n L\xfd \u2014 F2 t\u1ef1 mua',
  MANAGER_F1_SELL_TO_CUSTOMER_NO_ID: 'Qu\u1ea3n L\xfd \u2014 Khi F1 b\xe1n cho kh\xe1ch m\u1edbi ch\u01b0a ID (OPEN)',
  DIRECTOR_SELF_BUY: 'Gi\xe1m \u0110\u1ed1c \u2014 T\u1ef1 mua',
  DIRECTOR_DIRECT_NO_ID: 'Gi\xe1m \u0110\u1ed1c \u2014 B\xe1n cho kh\xe1ch ch\u01b0a c\xf3 ID',
  DIRECTOR_DIRECT_WITH_ID: 'Gi\xe1m \u0110\u1ed1c \u2014 B\xe1n cho kh\xe1ch \u0111\xe3 c\xf3 ID',
  DIRECTOR_F1: 'Gi\xe1m \u0110\u1ed1c \u2014 Upstream t\u1eeb F1 (D1)',
  DIRECTOR_F2: 'Gi\xe1m \u0110\u1ed1c \u2014 Upstream t\u1eeb F2 (D2)',
  POLICY_VERSION: 'Phi\xean b\u1ea3n Policy (t\u1ef1 \u0111\u1ed9ng)',
};

const READ_ONLY_KEYS = new Set(['POLICY_VERSION']);
const THRESHOLD_KEYS = new Set(['AMBASSADOR_THRESHOLD']);

// Helpers
function formatValue(key: string, raw: string): string {
  if (raw === 'NOT_CONFIGURED') return 'Ch\u01b0a c\u1ea5u h\xecnh';
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
      if (!data.success) { setError(data.message || 'L\u1ed7i kh\xf4ng x\xe1c \u0111\u1ecbnh.'); setConfirmed(false); }
      else { onSaved(); onClose(); }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'L\u1ed7i k\u1ebft n\u1ed1i.');
      setConfirmed(false);
    } finally { setSaving(false); }
  }

  const previewValue = useNotConfigured ? 'Ch\u01b0a c\u1ea5u h\xecnh' : formatValue(entry.key, getApiValue());

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
            S\u1eeda Policy
          </h3>
          <button
            onClick={onClose} disabled={saving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="D\xf3ng (Esc)"
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
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gi\xe1 tr\u1ecb hi\u1ec7n t\u1ea1i</span>
            <span className={`text-sm font-bold ${entry.status === 'NOT_CONFIGURED' ? 'text-red-500' : 'text-emerald-600'}`}>
              {formatValue(entry.key, entry.value)}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {isThreshold ? 'Ng\u01b0\u1ee1ng m\u1edbi (\u0111i\u1ec3m nguy\xean d\u01b0\u01a1ng)' : 'T\u1ec9 l\u1ec7 m\u1edbi (0\u2013100%)'}
            </span>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox" checked={useNotConfigured}
                onChange={e => setUseNotConfigured(e.target.checked)}
                className="w-4 h-4 accent-red-500 cursor-pointer"
              />
              <span className="text-red-500 text-xs font-medium">\u0110\u1eb7t NOT_CONFIGURED (t\u1eaft commission)</span>
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
              <span className="text-xs text-slate-400">Nh\u1eadp s\u1ed1 % (VD: 20 = 20%)</span>
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
              L\xfd do thay \u0111\u1ed5i <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none placeholder-slate-400"
              rows={3} placeholder="Nh\u1eadp l\xfd do c\u1ee5 th\u1ec3..."
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
                X\xe1c nh\u1eadn thay \u0111\u1ed5i t\u1eeb{' '}
                <strong>{formatValue(entry.key, entry.value)}</strong>
                {' \u2192 '}
                <strong>{previewValue}</strong>?
                {' '}H\xe0nh \u0111\u1ed9ng n\xe0y s\u1ebd \u0111\u01b0\u1ee3c ghi v\xe0o audit log.
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
                H\u1ee7y
              </button>
              <button
                className="flex-1 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isValid() || saving} onClick={() => setConfirmed(true)}
              >
                Xem l\u1ea1i &amp; X\xe1c nh\u1eadn
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setConfirmed(false)} disabled={saving}
                className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                Quay l\u1ea1i
              </button>
              <button
                className="flex-1 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving} onClick={handleSave}
              >
                {saving ? '\u0110ang l\u01b0u...' : 'X\xe1c nh\u1eadn L\u01b0u'}
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
            L\u1ecbch s\u1eed thay \u0111\u1ed5i
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="D\xf3ng (Esc)"
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
              <RefreshCw size={16} className="animate-spin" /> \u0110ang t\u1ea3i...
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">Ch\u01b0a c\xf3 l\u1ecbch s\u1eed thay \u0111\u1ed5i.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {logs.map((l, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-2 bg-slate-50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{fmtDate(l.createdAt)}</span>
                    <span className="text-xs font-mono font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">v{l.version}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-red-500">{l.oldValue ?? '\u2014'}</span>
                    <span className="text-slate-400">\u2192</span>
                    <span className="font-semibold text-emerald-600">{l.newValue}</span>
                  </div>
                  {l.reason && (
                    <div className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2">\uD83D\uDCDD {l.reason}</div>
                  )}
                  {l.updatedBy && <div className="text-xs text-slate-400">b\u1edfi {l.updatedBy}</div>}
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
            \u0110\xf3ng
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
        <span className={`font-bold text-sm ${isNotConfigured ? 'text-red-500' : 'text-emerald-600'}`}>
          {formatValue(entry.key, entry.value)}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        {isNotConfigured ? (
          <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full font-medium">
            <AlertTriangle size={10} /> Ch\u01b0a c\u1ea5u h\xecnh
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
            <CheckCircle size={10} /> \u0110ang d\xf9ng
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
            ? <span className="text-xs text-slate-400 italic">Ch\u1ec9 \u0111\u1ecdc</span>
            : (
              <button
                onClick={() => onEdit(entry)}
                className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors font-medium"
              >
                <Edit3 size={12} /> S\u1eeda
              </button>
            )
          }
          <button
            onClick={() => onHistory(entry.key)}
            className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors font-medium"
          >
            <Clock size={12} /> L\u1ecbch s\u1eed
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
            C\u1ea5u H\xecnh Hoa H\u1ed3ng
          </h2>
          <p className="text-sm text-slate-500 mt-1">Qu\u1ea3n l\xfd t\u1ec9 l\u1ec7 commission ch\xednh th\u1ee9c. M\u1ecdi thay \u0111\u1ed5i \u0111\u01b0\u1ee3c ghi audit log \u0111\u1ea7y \u0111\u1ee7.</p>
        </div>
        <button
          onClick={loadPolicies} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? '\u0110ang t\u1ea3i...' : 'L\xe0m m\u1edbi'}
        </button>
      </div>

      {notConfiguredCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm">
          <AlertTriangle size={16} className="shrink-0 text-amber-500" />
          <span><strong>{notConfiguredCount} key</strong> \u0111ang NOT_CONFIGURED \u2014 commission cho c\xe1c rule n\xe0y s\u1ebd kh\xf4ng \u0111\u01b0\u1ee3c t\u1ea1o cho \u0111\u1ebfn khi Boss x\xe1c nh\u1eadn t\u1ec9 l\u1ec7.</span>
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
            <RefreshCw size={16} className="animate-spin" /> \u0110ang t\u1ea3i c\u1ea5u h\xecnh...
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wide">
                <th className="py-3 px-4 text-left font-semibold">Policy Key</th>
                <th className="py-3 px-4 text-center font-semibold">Gi\xe1 tr\u1ecb</th>
                <th className="py-3 px-4 text-center font-semibold">Tr\u1ea1ng th\xe1i</th>
                <th className="py-3 px-4 text-center font-semibold">Version</th>
                <th className="py-3 px-4 text-center font-semibold">C\u1eadp nh\u1eadt b\u1edfi</th>
                <th className="py-3 px-4 text-center font-semibold">Thao t\xe1c</th>
              </tr>
            </thead>
            <tbody>
              {groupPolicies.length === 0
                ? <tr><td colSpan={6} className="py-12 text-center text-slate-400 text-sm">Kh\xf4ng c\xf3 d\u1eef li\u1ec7u.</td></tr>
                : groupPolicies.map(entry => <PolicyRow key={entry.key} entry={entry} onEdit={setEditEntry} onHistory={setHistoryKey} />)
              }
            </tbody>
          </table>
        )}
      </div>

      <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        \u26a0 Thay \u0111\u1ed5i policy ch\u1ec9 \u1ea3nh h\u01b0\u1edfng c\xe1c commission ph\xe1t sinh <strong>sau</strong> th\u1eddi \u0111i\u1ec3m thay \u0111\u1ed5i.
        Commission l\u1ecbch s\u1eed gi\u1eef nguy\xean snapshot t\u1ea1i th\u1eddi \u0111i\u1ec3m ph\xe1t sinh (ruleKey, rateSnapshot, policyVersion).
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