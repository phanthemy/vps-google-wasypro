import React, { useState, useEffect } from "react";
import { Loader, CheckCircle, Circle, Star } from "lucide-react";

export default function AmbassadorProgressCard({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/rank/ambassador/check/${userId}`, { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error("L?i k?t n?i m?y ch?");
        return res.json();
      })
      .then(res => {
        if (res.success) setData(res.data);
        else throw new Error(res.message || "Kh?ng th? t?i d? li?u");
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="glass-panel p-4 rounded-xl flex items-center justify-center gap-2 text-secondary text-sm">
      <Loader size={16} className="animate-spin" />
      <span>?ang t?i th?ng tin...</span>
    </div>
  );

  if (error) return (
    <div className="glass-panel p-4 rounded-xl border border-red-500/30 bg-red-500/10">
      <p className="text-red-400 text-sm text-center">{error}</p>
    </div>
  );

  if (!data) return null;

  const { isAmbassador, eligibility } = data;
  const condA = eligibility?.conditionA || {};
  const condB = eligibility?.conditionB || {};
  const qualifies = eligibility?.qualifies;

  const progressA = Math.min(100, ((condA.current || 0) / (condA.required || 1)) * 100);
  const progressB = Math.min(100, ((condB.current || 0) / (condB.required || 1)) * 100);

  if (isAmbassador) return (
    <div className="glass-panel p-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10 flex items-center gap-3">
      <Star size={20} className="text-yellow-400 shrink-0" />
      <p className="text-yellow-300 font-semibold text-sm">B?n ?ang l? ??i s? Th??ng m?i</p>
    </div>
  );

  return (
    <div className="glass-panel p-4 rounded-xl space-y-4">
      <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
        <Star size={15} className="text-yellow-400" />
        Ti?n tr?nh tr? th?nh ??i s? Th??ng m?i
      </h3>

      {qualifies && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-300 text-sm font-semibold text-center">
          ?? B?n ?? ?i?u ki?n tr? th?nh ??i s? Th??ng m?i! Li?n h? Admin ?? k?ch ho?t.
        </div>
      )}

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-secondary mb-1">
            <span className="flex items-center gap-1">
              {condA.met ? <CheckCircle size={12} className="text-green-400" /> : <Circle size={12} />}
              ?? mua ?t nh?t 1 s?n ph?m
            </span>
            <span className={condA.met ? "text-green-400 font-bold" : ""}>{condA.current || 0}/{condA.required || 1}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${condA.met ? "bg-green-500" : "bg-blue-500"}`}
              style={{ width: `${progressA}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-secondary mb-1">
            <span className="flex items-center gap-1">
              {condB.met ? <CheckCircle size={12} className="text-green-400" /> : <Circle size={12} />}
              S-Points t?ch l?y ? 5,000
            </span>
            <span className={condB.met ? "text-green-400 font-bold" : ""}>{(condB.current || 0).toLocaleString()}/{(condB.required || 5000).toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${condB.met ? "bg-green-500" : "bg-yellow-500"}`}
              style={{ width: `${progressB}%` }}
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-secondary">??p ?ng ?t nh?t 1 trong 2 ?i?u ki?n ?? ?? ti?u chu?n.</p>
    </div>
  );
}
