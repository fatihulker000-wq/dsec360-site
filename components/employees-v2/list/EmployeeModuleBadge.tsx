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
  displayText,
}: {
  label: string;
  status?: ModuleStatus;
  displayText?: string;
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

  const visibleText = displayText?.trim() || config[2];

  return (
    <div
      title={`${label}: ${visibleText}`}
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
      <span>{visibleText}</span>
    </div>
  );
}
