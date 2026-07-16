"use client";

type ModuleStatus =
  | "COMPLETE"
  | "MISSING"
  | "EXPIRING"
  | "UNKNOWN"
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export default function EmployeeModuleBadge({
  label,
  status = "UNKNOWN",
}: {
  label: string;
  status?: ModuleStatus;
}) {
  const config = {
    COMPLETE: ["#dcfce7", "#166534", "Tamam"],
    MISSING: ["#fee2e2", "#b91c1c", "Eksik"],
    EXPIRING: ["#fef3c7", "#92400e", "Yaklaşıyor"],
    LOW: ["#dcfce7", "#166534", "Düşük"],
    MEDIUM: ["#fef3c7", "#92400e", "Orta"],
    HIGH: ["#fee2e2", "#b91c1c", "Yüksek"],
    UNKNOWN: ["#f1f5f9", "#64748b", "Veri Yok"],
  }[status];

  return (
    <div
      title={`${label}: ${config[2]}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 8px",
        borderRadius: 10,
        background: config[0],
        color: config[1],
        fontSize: 10,
        fontWeight: 900,
        whiteSpace: "nowrap",
      }}
    >
      <span>{label}</span>
      <span>{config[2]}</span>
    </div>
  );
}
