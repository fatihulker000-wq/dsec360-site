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
          title="Sağlık"
          status={employee.health_status}
          description="Muayene ve sağlık takip durumu."
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
}: {
  title: string;
  description: string;
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

        <EmployeeProfileStatusBadge
          status={status}
        />
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
