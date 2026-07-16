"use client";

export default function EmployeeProfileStatusBadge({
  status,
}: {
  status: "COMPLETE" | "MISSING" | "EXPIRING" | "UNKNOWN";
}) {
  const config = {
    COMPLETE: {
      label: "Tamam",
      background: "#dcfce7",
      color: "#166534",
    },
    MISSING: {
      label: "Eksik",
      background: "#fee2e2",
      color: "#b91c1c",
    },
    EXPIRING: {
      label: "Yaklaşıyor",
      background: "#fef3c7",
      color: "#92400e",
    },
    UNKNOWN: {
      label: "Veri Yok",
      background: "#f1f5f9",
      color: "#64748b",
    },
  }[status];

  return (
    <span
      style={{
        display: "inline-flex",
        padding: "6px 10px",
        borderRadius: 999,
        background: config.background,
        color: config.color,
        fontSize: 11,
        fontWeight: 900,
      }}
    >
      {config.label}
    </span>
  );
}
