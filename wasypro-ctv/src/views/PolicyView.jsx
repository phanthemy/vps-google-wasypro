import React, { useState, useEffect, useCallback } from 'react';
import { FileText, RefreshCw, AlertTriangle, CheckCircle, Lock, Unlock, ChevronDown, ChevronUp } from 'lucide-react';

// Map policy keys to human-readable Vietnamese labels
const POLICY_LABELS = {
  AMBASSADOR_SELF_BUY:                 'Tự mua (Đại Sứ)',
  AMBASSADOR_DIRECT_NO_ID:             'Bán cho khách chưa có ID (Đại Sứ)',
  AMBASSADOR_DIRECT_WITH_ID:           'Bán cho khách đã có ID (Đại Sứ)',
  AMBASSADOR_THRESHOLD:                'Ngưỡng điểm tích lũy',
  MANAGER_SELF_BUY:                    'Tự mua (Quản Lý)',
  MANAGER_DIRECT_NO_ID:                'Bán cho khách chưa có ID (Quản Lý)',
  MANAGER_DIRECT_WITH_ID:              'Bán cho khách đã có ID (Quản Lý)',
  MANAGER_F1_PURCHASE:                 'F1 tự mua (Quản Lý)',
  MANAGER_F2_PURCHASE:                 'F2 tự mua (Quản Lý)',
  MANAGER_F1_SELL_TO_CUSTOMER_NO_ID:   'F1 bán khách chưa ID (Quản Lý)',
  DIRECTOR_SELF_BUY:                   'Tự mua (Giám Đốc)',
  DIRECTOR_DIRECT_NO_ID:               'Bán cho khách chưa có ID (Giám Đốc)',
  DIRECTOR_DIRECT_WITH_ID:             'Bán cho khách đã có ID (Giám Đốc)',
  DIRECTOR_F1:                         'F1 (Giám Đốc)',
  DIRECTOR_F2:                         'F2 (Giám Đốc)',
};

const THRESHOLD_KEYS = new Set(['AMBASSADOR_THRESHOLD']);

function formatValue(key, value) {
  if (value === 'NOT_CONFIGURED') return null;
  if (THRESHOLD_KEYS.has(key)) return `${value} CP`;
  const n = parseFloat(value);
  return isNaN(n) ? value : `${(n * 100).toFixed(0)}%`;
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch { return iso; }
}
function fmtDateTime(iso) {
  try { return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }); }
  catch { return iso; }
}
function isNew(iso) {
  try {
    const d = new Date(iso);
    return (Date.now() - d.getTime()) < 72 * 60 * 60 * 1000;
  } catch { return false; }
}

// ── Policy Group Component ─────────────────────────────────────
function PolicyGroup({ title, policies, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const notConfigured = policies.filter(p => p.status === 'NOT_CONFIGURED');

  return (
    <div className="card glass-panel overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">{title}</span>
          {notConfigured.length > 0 && (
            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">
              {notConfigured.length} chưa cấu hình
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
      </button>

      {open && (
        <div className="border-t border-white/10">
          {policies.map(p => {
            const label = POLICY_LABELS[p.key] || p.key;
            const valueDisplay = formatValue(p.key, p.value);
            const newBadge = isNew(p.effectiveFrom || p.updatedAt);

            return (
              <div key={p.key} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0">
                <div className="flex-1">
                  <div className="text-sm text-white flex items-center gap-2">
                    {label}
                    {newBadge && <span className="text-xs bg-blue-500/30 text-blue-300 px-1.5 py-0.5 rounded-full">🆕 Mới</span>}
                  </div>
                  {p.effectiveFrom && (
                    <div className="text-xs text-muted mt-0.5">
                      Áp dụng từ: {fmtDateTime(p.effectiveFrom)}
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  {p.status === 'NOT_CONFIGURED' ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-yellow-900/30 text-yellow-300 px-2 py-0.5 rounded-full">
                      <AlertTriangle size={10} /> Chưa cấu hình
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-green-400">
                      <CheckCircle size={12} /> {valueDisplay}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Period History Card ────────────────────────────────────────
function PeriodHistoryCard({ period, isFirst }) {
  const [open, setOpen] = useState(isFirst);
  const isClosed = period.status === 'CLOSED';

  return (
    <div className="card glass-panel overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isClosed
            ? <Lock size={14} className="text-slate-400" />
            : <Unlock size={14} className="text-green-400" />
          }
          <span className="font-bold text-white">Kỳ {period.periodName}</span>
          <span className="text-xs text-muted">{fmtDate(period.startAt)} → {fmtDate(period.endAt)}</span>
          {isClosed
            ? <span className="text-xs bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded-full">Đã chốt</span>
            : <span className="text-xs bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded-full">Đang mở</span>
          }
        </div>
        <div className="flex items-center gap-3">
          {period.myEarnedPoints > 0 && (
            <span className="text-sm font-bold text-green-400">{period.myEarnedPoints.toLocaleString()} CP</span>
          )}
          {open ? <ChevronUp size={16} className="text-muted" /> : <ChevronDown size={16} className="text-muted" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-white/10 px-4 py-3 flex flex-col gap-2 text-sm">
          <div className="flex justify-between text-muted">
            <span>Hoa hồng của bạn</span>
            <span className="text-green-400 font-bold">{(period.myEarnedPoints || 0).toLocaleString()} CP — {(period.myEarnedMoney || 0).toLocaleString()} đ</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Bản ghi hoa hồng</span>
            <span className="text-white">{period.myCommissions || 0}</span>
          </div>
          {period.closedAt && (
            <div className="flex justify-between text-muted">
              <span>Ngày chốt</span>
              <span className="text-white">{fmtDateTime(period.closedAt)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export default function PolicyView() {
  const [currentPolicy, setCurrentPolicy] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('current');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const p1 = fetch('/api/policy/current', { credentials: 'include' }).then(r => r.json());
    const p2 = fetch('/api/policy/history', { credentials: 'include' }).then(r => r.json());
    Promise.all([p1, p2]).then(([curr, hist]) => {
      if (curr.success) setCurrentPolicy(curr);
      if (hist.success) setHistory(hist.data || []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const period = currentPolicy?.data?.period;
  const policies = currentPolicy?.data?.policies || [];
  const userRank = currentPolicy?.data?.userRank;
  const noPeriod = currentPolicy?.noPeriod;

  // Group policies for display
  const ambPolicies = policies.filter(p => p.key.startsWith('AMBASSADOR'));
  const mgrPolicies = policies.filter(p => p.key.startsWith('MANAGER'));
  const dirPolicies = policies.filter(p => p.key.startsWith('DIRECTOR'));

  // Determine rank group to show first
  const rankLabel = userRank
    ? userRank.includes('DIRECTOR') ? 'Giám Đốc'
      : userRank.includes('MANAGER') ? 'Quản Lý'
      : 'Đại Sứ'
    : '';

  // Count NOT_CONFIGURED in my rank group
  const myPolicies = userRank?.includes('DIRECTOR') ? dirPolicies : userRank?.includes('MANAGER') ? mgrPolicies : ambPolicies;
  const notConfiguredCount = myPolicies.filter(p => p.status === 'NOT_CONFIGURED').length;

  // Find latest policyVersion from policies
  const latestVersion = policies.length > 0 ? policies[0].version : null;

  // Any policy updated in last 24h
  const recentlyUpdated = policies.some(p => isNew(p.updatedAt || p.effectiveFrom));

  return (
    <div className="flex flex-col gap-6 px-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText size={18} className="text-primary" /> Chính Sách Hoa Hồng
          </h2>
          {latestVersion && <div className="text-xs text-muted mt-0.5">Phiên bản: {latestVersion}</div>}
        </div>
        <button onClick={load} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2">
        {['current', 'history'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab ? 'bg-primary text-white' : 'text-muted hover:text-white'}`}>
            {tab === 'current' ? 'Kỳ Hiện Tại' : 'Lịch Sử Kỳ'}
          </button>
        ))}
      </div>

      {loading && <div className="py-8 text-center text-muted text-sm">Đang tải...</div>}

      {/* ── Current Tab ── */}
      {!loading && activeTab === 'current' && (
        <div className="flex flex-col gap-4">
          {noPeriod ? (
            <div className="card glass-panel p-6 text-center flex flex-col gap-3">
              <AlertTriangle size={32} className="mx-auto text-yellow-400" />
              <div className="font-bold text-white">Chưa có kỳ hoa hồng đang mở</div>
              <div className="text-sm text-muted">Vui lòng liên hệ quản trị viên để biết thêm thông tin.</div>
            </div>
          ) : (
            <>
              {/* Period info card */}
              {period && (
                <div className={`rounded-2xl p-4 flex flex-col gap-2 ${period.status === 'OPEN' ? 'bg-green-900/20 border border-green-700/30' : 'bg-slate-800/60 border border-slate-600/40'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {period.status === 'OPEN'
                        ? <Unlock size={16} className="text-green-400" />
                        : <Lock size={16} className="text-slate-400" />
                      }
                      <span className="font-bold text-white">KỲ {period.periodName}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${period.status === 'OPEN' ? 'bg-green-900/60 text-green-300' : 'bg-slate-700/60 text-slate-400'}`}>
                      {period.status === 'OPEN' ? '🟢 ĐANG MỞ' : '🔒 ĐÃ CHỐT'}
                    </span>
                  </div>
                  <div className="text-xs text-muted">{fmtDate(period.startAt)} → {fmtDate(period.endAt)}</div>
                </div>
              )}

              {/* Warnings */}
              {recentlyUpdated && (
                <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl px-4 py-3 text-blue-300 text-sm">
                  🔔 Chính sách đã được cập nhật gần đây — xem badge 🆕 bên dưới.
                </div>
              )}
              {notConfiguredCount > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl px-4 py-3 text-yellow-300 text-sm flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span><b>{notConfiguredCount}</b> chính sách chưa được thiết lập — sẽ không tính hoa hồng cho các rule này.</span>
                </div>
              )}

              {/* My rank badge */}
              {userRank && (
                <div className="text-xs text-muted px-1">
                  Rank hiện tại của bạn: <b className="text-white">{rankLabel}</b>
                  {' — '}Chỉ hiển thị chính sách áp dụng cho rank của bạn.
                </div>
              )}

              {/* Policy groups */}
              {ambPolicies.length > 0 && (
                <PolicyGroup title="Đại Sứ" policies={ambPolicies} defaultOpen={!userRank || userRank.includes('AMBASSADOR')} />
              )}
              {mgrPolicies.length > 0 && (
                <PolicyGroup title="Quản Lý" policies={mgrPolicies} defaultOpen={userRank?.includes('MANAGER')} />
              )}
              {dirPolicies.length > 0 && (
                <PolicyGroup title="Giám Đốc" policies={dirPolicies} defaultOpen={userRank?.includes('DIRECTOR')} />
              )}

              {policies.length === 0 && (
                <div className="card glass-panel p-6 text-center text-muted text-sm">Không có chính sách nào để hiển thị.</div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── History Tab ── */}
      {!loading && activeTab === 'history' && (
        <div className="flex flex-col gap-3">
          {history.length === 0 ? (
            <div className="card glass-panel p-6 text-center text-muted text-sm">Chưa có kỳ nào.</div>
          ) : history.map((p, i) => (
            <PeriodHistoryCard key={p.id} period={p} isFirst={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
