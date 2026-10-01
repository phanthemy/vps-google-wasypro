import React from "react";

const RULE_CONFIG = {
  // Phase 2C Standard Rule Keys
  'NPP_D1_10%': {
    label: "Bảo trợ NPP F1 (10%)",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/40"
  },
  'NPP_D2_5%': {
    label: "Bảo trợ NPP F2 (5%)",
    color: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40"
  },

  SELF: {
    label: "Tự tiêu dùng",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
  },
  DIRECT_NO_ID: {
    label: "Bán trực tiếp (Khách mới)",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/40"
  },
  DIRECT_WITH_ID: {
    label: "Bán trực tiếp (Thành viên)",
    color: "bg-sky-500/20 text-green-300 border-sky-500/40"
  },
  SPLIT: {
    label: "Tách điểm (Vượt ngưỡng)",
    color: "bg-orange-500/20 text-orange-300 border-orange-500/40"
  },
  UPSTREAM_D1: {
    label: "Đồng hành F1 (D1)",
    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
  },
  UPSTREAM_D2: {
    label: "Đồng hành F2 (D2)",
    color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
  },
  // Backward compatibility fallbacks
  DIRECT: {
    label: "Trực tiếp",
    color: "bg-gray-500/20 text-gray-300 border-gray-500/40"
  },
  OVERRIDE_F1: {
    label: "Đồng hành F1",
    color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
  },
  OVERRIDE_F2: {
    label: "Đồng hành F2",
    color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
  }
};

export default function CommissionRuleTag({ policyRef, size = "md" }) {
  if (!policyRef) return <span className="text-muted text-xs">-</span>;
  const cfg = RULE_CONFIG[policyRef] || {
    label: policyRef,
    color: "bg-gray-500/20 text-gray-300 border-gray-500/40"
  };
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1";
  return (
    <span className={`inline-flex items-center rounded-full font-medium border ${cfg.color} ${sizeClass} whitespace-nowrap`}>
      {cfg.label}
    </span>
  );
}
