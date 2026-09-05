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
        if (!res.ok) throw new Error("Lỗi kết nối máy chủ");
        return res.json();
      })
      .then(res => {
        if (res.success) setData(res.data);
        else throw new Error(res.message || "Không thể tải dữ liệu");
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="glass-panel p-4 rounded-xl flex items-center justify-center gap-2 text-secondary text-sm">
      <Loader size={16} className="animate-spin" />
      <span>Đang tải thông tin...</span>
    </div>
  );

  if (error) return (
    <div className="glass-panel p-4 rounded-xl border border-red-500/30 bg-red-500/10">
      <p className="text-red-400 text-sm text-center">{error}</p>
    </div>
  );

  if (!data) return null;

  const { isAmbassador, eligibility } = data;
  // Phase 2C: Qualification threshold is 5,000 qualifying points (non-retroactive)
  const currentPoints = eligibility?.conditionB?.value || 0;
  const requiredPoints = 5000;
  const qualifies = currentPoints >= requiredPoints || eligibility?.qualifies;
  const progress = Math.min(100, (currentPoints / requiredPoints) * 100);

  if (isAmbassador) return (
    <div className="glass-panel p-4 rounded-xl border border-yellow-500/40 bg-yellow-500/10 flex items-center gap-3">
      <Star size={20} className="text-yellow-400 shrink-0" />
      <p className="text-yellow-300 font-semibold text-sm">Bạn đang là Đại sứ Thương mại</p>
    </div>
  );

  return (
    <div className="glass-panel p-4 rounded-xl space-y-4">
      <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
        <Star size={15} className="text-yellow-400" />
        Tiến trình đạt chuẩn Đại sứ Thương mại
      </h3>

      {qualifies && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-300 text-sm font-semibold text-center">
          ⭐ Bạn đã đủ điều kiện đạt chuẩn Đại sứ! Liên hệ Admin để kích hoạt.
        </div>
      )}

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-secondary mb-1.5">
            <span className="flex items-center gap-1 font-medium">
              {qualifies ? <CheckCircle size={13} className="text-green-400" /> : <Circle size={13} />}
              Điểm tích lũy xét chuẩn: {currentPoints.toLocaleString('vi-VN')} / {requiredPoints.toLocaleString('vi-VN')}
            </span>
            <span className={qualifies ? "text-green-400 font-bold" : "text-secondary font-semibold"}>
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-700/60 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${qualifies ? "bg-green-500" : "bg-gradient-to-r from-blue-500 to-yellow-500"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-secondary">
        Cần tích lũy tối thiểu 5.000 điểm chuẩn (Qualifying Points) để đạt chuẩn Đại sứ.
      </p>
    </div>
  );
}
