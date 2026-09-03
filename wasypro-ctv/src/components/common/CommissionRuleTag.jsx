import React from "react";

const POLICY_CONFIG = {
  "AM-01": { label: "T? mua", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" },
  "AM-02": { label: "B?n l?", color: "bg-green-500/20 text-green-300 border-green-500/40" },
  "AM-03": { label: "??i t?c", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  "AM-04": { label: "V?ng", color: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  "DIRECT": { label: "Tr?c ti?p", color: "bg-gray-500/20 text-gray-300 border-gray-500/40" },
  "OVERRIDE_F1": { label: "Override F1", color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" },
  "OVERRIDE_F2": { label: "Override F2", color: "bg-sky-500/20 text-sky-300 border-sky-500/40" },
};

export default function CommissionRuleTag({ policyRef, size = "sm" }) {
  if (!policyRef) return <span className="text-secondary text-xs">?</span>;

  const config = POLICY_CONFIG[policyRef];
  if (!config) return (
    <span className="text-xs border rounded px-1.5 py-0.5 border-gray-600 text-gray-400">
      {policyRef}
    </span>
  );

  const sizeClass = size === "md" ? "text-sm px-2.5 py-1" : "text-xs px-1.5 py-0.5";

  return (
    <span className={`inline-flex items-center gap-1 border rounded font-semibold ${sizeClass} ${config.color}`}>
      <span className="opacity-60 font-normal">{policyRef}</span>
      {config.label}
    </span>
  );
}
