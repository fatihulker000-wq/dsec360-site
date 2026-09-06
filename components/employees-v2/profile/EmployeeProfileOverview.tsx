"use client";

import EmployeeProfileStatusBadge from "./EmployeeProfileStatusBadge";

import type { EmployeeProfileEmployee } from "./types";

export default function EmployeeProfileOverview({
  employee,
}: {
  employee: EmployeeProfileEmployee;
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 16,
      }}
    >
      <section
        style={{
          padding: 20,
          borderRadius: 20,
          background: "#fff",
          border: "1px solid #e5e7eb",
        }}
      >
        <h3 style={{ margin: 0, fontSize: 20 }}>
          Çalışan Özeti
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(190px,1fr))",
            gap: 12,
            marginTop: 15,
          }}
        >
          <Info
            label="Durum"
            value={employee.active ? "Aktif" : "Pasif"}
          />
          <Info
            label="Firma"
            value={
              employee.firm_name ||
              employee.firm_id ||
              "-"
            }
          />
          <Info
            label="Departman"
            value={employee.department || "-"}
          />
          <Info
            label="Ünvan"
            value={employee.job_title || "-"}
          />
          <Info
            label="Telefon"
            value={employee.phone || "-"}
          />
          <Info
            label="E-posta"
            value={employee.email || "-"}
          />
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 14,
        }}
      >
        <ModuleCard
          title="Eğitim"
          status={employee.training_status}
          description="Tamamlanan ve yaklaşan eğitim kayıtları."
        />

        <ModuleCard
          title="Sağlık Takibi"
          status={employee.health_status}
          statusLabel={healthStatusText(employee)}
          description={healthDescription(employee)}
        />

        <ModuleCard
          title="KKD"
          status={employee.ppe_status}
          description="KKD teslim ve zimmet durumu."
        />

        <ModuleCard
          title="Belgeler"
          status={employee.document_status}
          description="Çalışan evrak ve belge durumu."
        />
      </section>
    </div>
  );
}

function ModuleCard({
  title,
  description,
  status = "UNKNOWN",
  statusLabel,
}: {
  title: string;
  description: string;
  statusLabel?: string;
  status?:
    | "COMPLETE"
    | "MISSING"
    | "EXPIRING"
    | "UNKNOWN";
}) {
  return (
    <article
      style={{
        padding: 18,
        borderRadius: 18,
        background: "#fff",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
        }}
      >
        <strong style={{ fontSize: 17 }}>
          {title}
        </strong>

        {statusLabel ? (
          <span
            style={{
              padding: "6px 9px",
              borderRadius: 999,
              background: "#ecfdf5",
              color: "#047857",
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            {statusLabel}
          </span>
        ) : (
          <EmployeeProfileStatusBadge
            status={status}
          />
        )}
      </div>

      <p
        style={{
          margin: "10px 0 0",
          color: "#64748b",
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
    </article>
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
        padding: 13,
        borderRadius: 14,
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          color: "#64748b",
          fontSize: 11,
          fontWeight: 850,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 5,
          color: "#111827",
          fontWeight: 900,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function healthStatusText(employee: EmployeeProfileEmployee) {
  if (employee.health_status === "MISSING") return "Süresi Geçmiş";
  if (employee.health_status === "EXPIRING") return "Yaklaşıyor";
  if (employee.health_status === "COMPLETE") return "Muayene Geçerli";
  if ((employee.health_ek2_count || 0) > 0) return "EK-2 Mevcut";
  if ((employee.health_record_count || 0) > 0) return "Kayıt Mevcut";
  return "Kayıt Yok";
}

function healthDescription(employee: EmployeeProfileEmployee) {
  const parts: string[] = [];
  if ((employee.health_ek2_count || 0) > 0) parts.push(`EK-2: ${employee.health_ek2_count}`);
  if ((employee.health_examination_count || 0) > 0) parts.push(`Muayene: ${employee.health_examination_count}`);
  if (employee.health_next_due_at) parts.push(`Sonraki muayene: ${formatDate(employee.health_next_due_at)}`);
  return parts.length ? parts.join(" • ") : "Muayene ve sağlık takip kayıtları.";
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}
