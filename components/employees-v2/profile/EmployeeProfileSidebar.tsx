"use client";

import type { EmployeeProfileEmployee } from "./types";

export default function EmployeeProfileSidebar({
  employee,
  onEdit,
  onClose,
}: {
  employee: EmployeeProfileEmployee;
  onEdit?(): void;
  onClose?(): void;
}) {
  const age = calculateAge(employee.birth_date);
  const seniority = calculateSeniority(employee.start_date);

  return (
    <aside
      style={{
        display: "grid",
        gap: 14,
        padding: 20,
        borderRadius: 22,
        background:
          "linear-gradient(165deg,#111827 0%,#4a0d1a 55%,#b91c1c 100%)",
        color: "#fff",
        boxShadow: "0 18px 50px rgba(74,13,26,.18)",
      }}
    >
      <div
        style={{
          width: 82,
          height: 82,
          display: "grid",
          placeItems: "center",
          borderRadius: 24,
          background: "rgba(255,255,255,.14)",
          border: "1px solid rgba(255,255,255,.22)",
          fontSize: 30,
          fontWeight: 950,
        }}
      >
        {initials(employee.full_name)}
      </div>

      <div>
        <h2
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 950,
          }}
        >
          {employee.full_name || "Adsız çalışan"}
        </h2>

        <div
          style={{
            marginTop: 7,
            opacity: 0.85,
            fontWeight: 800,
          }}
        >
          {employee.job_title || "Ünvan belirtilmemiş"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 9,
          padding: 14,
          borderRadius: 16,
          background: "rgba(255,255,255,.08)",
        }}
      >
        <Info label="Firma" value={employee.firm_name || employee.firm_id || "-"} />
        <Info label="Departman" value={employee.department || "-"} />
        <Info label="Sicil" value={employee.registry_no || "-"} />
        <Info label="İşe Giriş" value={formatDate(employee.start_date)} />
        <Info label="Yaş" value={age} />
        <Info label="Kıdem" value={seniority} />
        <Info label="Kan Grubu" value={employee.blood_type || "-"} />
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={onEdit}
          style={buttonStyle("#2563eb")}
        >
          Düzenle
        </button>

        <button
          type="button"
          onClick={onClose}
          style={buttonStyle("#111827")}
        >
          Kapat
        </button>
      </div>
    </aside>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 10,
        fontSize: 12,
      }}
    >
      <span style={{ opacity: 0.72, fontWeight: 800 }}>
        {label}
      </span>
      <strong style={{ textAlign: "right" }}>
        {value}
      </strong>
    </div>
  );
}

function initials(name: string) {
  return String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("tr-TR");
}

function calculateAge(value?: string | null) {
  if (!value) return "-";
  const birth = new Date(value);
  if (Number.isNaN(birth.getTime())) return "-";

  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const month = now.getMonth() - birth.getMonth();

  if (
    month < 0 ||
    (month === 0 && now.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return `${age}`;
}

function calculateSeniority(value?: string | null) {
  if (!value) return "-";
  const start = new Date(value);
  if (Number.isNaN(start.getTime())) return "-";

  const years =
    (Date.now() - start.getTime()) /
    (365.25 * 24 * 60 * 60 * 1000);

  if (years < 1) {
    return `${Math.max(0, Math.round(years * 12))} ay`;
  }

  return `${years.toFixed(1)} yıl`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("tr-TR");
}

function buttonStyle(
  background: string
): React.CSSProperties {
  return {
    border: "none",
    borderRadius: 11,
    padding: "10px 14px",
    background,
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  };
}
