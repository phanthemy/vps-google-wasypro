import React, { useState, useEffect } from 'react';
import { Star, Award, Clock, TrendingUp, Info, Loader, RefreshCw } from 'lucide-react';
import AmbassadorProgressCard from '../components/common/AmbassadorProgressCard.jsx';
import RankBadge from '../components/common/RankBadge.jsx';

// Map policy keys to display metadata
// Keys match SystemPolicyConfig / PeriodPolicyConfig in DB
const RANK_GROUPS = [
  {
    role: 'AMBASSADOR',
    title: '\u0110\u1EA1i s\u1EE9 (Ambassador)',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    keys: [
      { key: 'AMBASSADOR_SELF_BUY',       label: 'T\u1EF1 ti\xEAu d\xF9ng',              desc: '\u0110i\u1EC3m hoa h\u1ED3ng khi t\u1EF1 mua thi\u1EBFt b\u1ECB' },
      { key: 'AMBASSADOR_DIRECT_NO_ID',   label: 'B\xE1n tr\u1EF1c ti\u1EBFp (Kh\xE1ch m\u1EDB\u0069)', desc: 'Khi b\xE1n cho kh\xE1ch h\xE0ng ch\u01B0a c\xF3 ID th\xE0nh vi\xEAn' },
      { key: 'AMBASSADOR_DIRECT_WITH_ID', label: 'B\xE1n tr\u1EF1c ti\u1EBFp (Th\xE0nh vi\xEAn)', desc: 'Khi b\xE1n cho kh\xE1ch h\xE0ng \u0111\xE3 c\xF3 ID th\xE0nh vi\xEAn' },
    ],
  },
  {
    role: 'MANAGER',
    title: 'Qu\u1EA3n l\xFD (Manager)',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    keys: [
      { key: 'MANAGER_SELF_BUY',          label: 'T\u1EF1 ti\xEAu d\xF9ng',              desc: '\u0110i\u1EC3m hoa h\u1ED3ng khi t\u1EF1 mua thi\u1EBFt b\u1ECB' },
      { key: 'MANAGER_DIRECT_NO_ID',      label: 'B\xE1n tr\u1EF1c ti\u1EBFp (Kh\xE1ch m\u1EDB\u0069)', desc: 'Khi b\xE1n cho kh\xE1ch h\xE0ng ch\u01B0a c\xF3 ID th\xE0nh vi\xEAn' },
      { key: 'MANAGER_DIRECT_WITH_ID',    label: 'B\xE1n tr\u1EF1c ti\u1EBFp (Th\xE0nh vi\xEAn)', desc: 'Khi b\xE1n cho kh\xE1ch h\xE0ng \u0111\xE3 c\xF3 ID th\xE0nh vi\xEAn' },
      { key: 'MANAGER_F1_PURCHASE',       label: '\u0110\u1ED3ng h\xE0nh F1 (D1)',         desc: '\u0110i\u1EC3m hoa h\u1ED3ng t\u1EEB \u0111\u01A1n h\xE0ng c\u1EE7a F1 tr\u1EF1c ti\u1EBFp' },
      { key: 'MANAGER_F2_PURCHASE',       label: '\u0110\u1ED3ng h\xE0nh F2 (D2)',         desc: '\u0110i\u1EC3m hoa h\u1ED3ng t\u1EEB \u0111\u01A1n h\xE0ng c\u1EE7a F2 tr\u1EF1c thu\u1ED9c' },
    ],
  },
  {
    role: 'DIRECTOR',
    title: 'Gi\xE1m \u0111\u1ED1c (Director)',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    keys: [
      { key: 'DIRECTOR_SELF_BUY',         label: 'T\u1EF1 ti\xEAu d\xF9ng',              desc: '\u0110i\u1EC3m hoa h\u1ED3ng khi t\u1EF1 mua thi\u1EBFt b\u1ECB' },
      { key: 'DIRECTOR_DIRECT_NO_ID',     label: 'B\xE1n tr\u1EF1c ti\u1EBFp (Kh\xE1ch m\u1EDB\u0069)', desc: 'Khi b\xE1n cho kh\xE1ch h\xE0ng ch\u01B0a c\xF3 ID th\xE0nh vi\xEAn' },
      { key: 'DIRECTOR_DIRECT_WITH_ID',   label: 'B\xE1n tr\u1EF1c ti\u1EBFp (Th\xE0nh vi\xEAn)', desc: 'Khi b\xE1n cho kh\xE1ch h\xE0ng \u0111\xE3 c\xF3 ID th\xE0nh vi\xEAn' },
      { key: 'DIRECTOR_F1',               label: '\u0110\u1ED3ng h\xE0nh F1 (D1)',         desc: '\u0110i\u1EC3m hoa h\u1ED3ng t\u1EEB \u0111\u01A1n h\xE0ng c\u1EE7a F1 tr\u1EF1c ti\u1EBFp' },
      { key: 'DIRECTOR_F2',               label: '\u0110\u1ED3ng h\xE0nh F2 (D2)',         desc: '\u0110i\u1EC3m hoa h\u1ED3ng t\u1EEB \u0111\u01A1n h\xE0ng c\u1EE7a F2 tr\u1EF1c thu\u1ED9c' },
    ],
  },
];

function fmtRate(value, key) {
  if (!value || value === 'NOT_CONFIGURED') return null;
  if (key === 'AMBASSADOR_THRESHOLD') return value + ' CP';
  const n = parseFloat(value);
  return isNaN(n) ? value : (n * 100).toFixed(0) + '%';
}

export default function RankView({ currentUser }) {
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [histError, setHistError] = useState(null);
  const [policyMap, setPolicyMap] = useState({});
  const [policyLoading, setPolicyLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch('/api/rank/history/' + currentUser.id, { credentials: 'include' })
      .then(res => { if (!res.ok) throw new Error('L\u1ED7i t\u1EA3i l\u1ECBch s\u1EED c\u1EA5p b\u1EADc'); return res.json(); })
      .then(res => { if (res.success) setHistory(res.data || []); else throw new Error(res.message); })
      .catch(err => setHistError(err.message))
      .finally(() => setHistLoading(false));
  }, [currentUser]);

  const loadPolicy = () => {
    setPolicyLoading(true);
    fetch('/api/policy/current', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data?.policies) {
          const map = {};
          res.data.policies.forEach(p => { map[p.key] = p.value; });
          setPolicyMap(map);
        }
      })
      .catch(() => {})
      .finally(() => setPolicyLoading(false));
  };

  useEffect(() => { loadPolicy(); }, []);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-1">
          <Star size={22} className="text-yellow-400" /> C\u1EA5p B\u1EADc &amp; C\u01A1 Ch\u1EBF Hoa H\u1ED3ng
        </h2>
        <p className="text-sm text-secondary">
          Quy\u1EC1n l\u1EE3i hoa h\u1ED3ng v\xE0 ti\u1EBFn tr\xECnh ph\xE1t tri\u1EC3n ch\u1EE9c danh theo ch\xEDnh s\xE1ch ch\xEDnh th\u1EE9c WasyPro
        </p>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="glass-panel p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-secondary uppercase tracking-wide">
            <Award size={16} /> C\u1EA5p b\u1EADc hi\u1EC7n t\u1EA1i
          </div>
          <div className="flex items-center gap-4">
            <RankBadge tier={currentUser?.tier} rank={currentUser?.rank} size="lg" />
            <div>
              <p className="font-bold text-primary text-lg">{currentUser?.fullName}</p>
              <p className="text-xs text-secondary">M\xE3 \u0111\u1ED1i t\xE1c: <strong className="text-primary font-mono">{currentUser?.businessId || currentUser?.id}</strong></p>
              {currentUser?.rank && (
                <p className="text-xs text-purple-400 mt-1 font-medium">Ch\u1EE9c danh \u0111\u1ED1i t\xE1c ch\xEDnh th\u1EE9c</p>
              )}
            </div>
          </div>
        </div>
        <AmbassadorProgressCard userId={currentUser?.id} />
      </div>

      <div className="glass-panel p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-secondary uppercase tracking-wide">
            <TrendingUp size={16} /> B\u1EA3ng C\u01A1 Ch\u1EBF Hoa H\u1ED3ng Theo C\u1EA5p B\u1EADc
          </div>
          <button
            onClick={loadPolicy}
            disabled={policyLoading}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors"
            title="T\u1EA3i l\u1EA1i ch\xEDnh s\xE1ch"
          >
            <RefreshCw size={14} className={policyLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {policyLoading ? (
          <div className="flex items-center justify-center gap-2 text-secondary py-8">
            <Loader size={18} className="animate-spin" /> \u0110ang t\u1EA3i ch\xEDnh s\xE1ch...
          </div>
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {RANK_GROUPS.map(grp => {
              const visibleRules = grp.keys
                .map(({ key, label, desc }) => ({ key, label, desc, rate: fmtRate(policyMap[key], key) }))
                .filter(r => r.rate !== null);
              return (
                <div key={grp.role} className="p-4 rounded-xl border border-gray-700/60 bg-gray-800/40 space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-700/50">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${grp.badgeColor}`}>
                      {grp.title}
                    </span>
                  </div>
                  <div className="space-y-2.5 flex-1">
                    {visibleRules.length === 0 ? (
                      <p className="text-xs text-secondary italic text-center py-2">Ch\u01B0a c\xF3 ch\xEDnh s\xE1ch</p>
                    ) : visibleRules.map(r => (
                      <div key={r.key} className="p-2.5 rounded-lg bg-gray-900/40 border border-gray-700/30 flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-semibold text-primary block">{r.label}</span>
                          <span className="text-[11px] text-secondary leading-tight block mt-0.5">{r.desc}</span>
                        </div>
                        <span className="text-sm font-extrabold text-green-400 shrink-0">{r.rate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/50">
          <div className="flex items-start gap-2">
            <Info size={15} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-secondary leading-relaxed">
              Hoa h\u1ED3ng \u0111\u01B0\u1EE3c t\xEDnh theo t\u1EF7 l\u1EC7 ph\u1EA7n tr\u0103m tr\xEAn <strong className="text-primary">\u0110i\u1EC3m hoa h\u1ED3ng (Points)</strong> c\u1EE7a t\u1EEB\u0067 s\u1EA3n ph\u1EA9m trong \u0111\u01A1n h\xE0ng.{' '}
              1 \u0111i\u1EC3m hoa h\u1ED3ng quy \u0111\u1ED5i t\u01B0\u01A1ng \u0111\u01B0\u01A1ng <strong className="text-primary">1.000\u0111</strong> ti\u1EC1n m\u1EB7t (s\u1ED1 nguy\xEAn VND).
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-secondary uppercase tracking-wide">
          <Clock size={16} /> L\u1ECBch s\u1EED thay \u0111\u1ED5i c\u1EA5p b\u1EADc
        </div>
        {histLoading ? (
          <div className="flex items-center justify-center gap-2 text-secondary py-6">
            <Loader size={18} className="animate-spin" /> \u0110ang t\u1EA3i l\u1ECBch s\u1EED...
          </div>
        ) : histError ? (
          <div className="text-red-400 text-sm text-center py-4">\u26A0\uFE0F {histError}</div>
        ) : history.length === 0 ? (
          <div className="text-center text-secondary py-6">
            <Clock size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Ch\u01B0a c\xF3 l\u1ECBch s\u1EED thay \u0111\u1ED5i c\u1EA5p b\u1EADc.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((h, idx) => (
              <div key={h.id || idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-700/30">
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-purple-400" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-secondary text-xs">{new Date(h.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <p className="text-sm font-medium text-primary mt-1">
                    {h.fromTier ? (
                      <><span className="text-secondary">{h.fromTier}</span> \u2192 <span className="text-purple-400 font-bold">{h.toTier}</span></>
                    ) : (
                      <span className="text-purple-400 font-bold">Kh\u1EDF\u0069 t\u1EA1o: {h.toTier}</span>
                    )}
                  </p>
                  {h.reason && <p className="text-xs text-secondary mt-0.5">{h.reason}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}