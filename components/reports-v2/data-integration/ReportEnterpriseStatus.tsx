"use client";

import type {
  ReportEnterpriseSummary,
} from "./types";

export default function ReportEnterpriseStatus({
  data,
  loading,
  error,
}: {
  data?: ReportEnterpriseSummary | null;
  loading?: boolean;
  error?: string;
}) {

  if (loading) {
    return (
      <div style={boxStyle}>
        Gerçek modül verileri yükleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          ...boxStyle,
          color: "#991b1b",
          background: "#fff7f7",
          borderColor: "#fecaca",
        }}
      >
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section
      style={{
        ...boxStyle,
        display: "grid",
        gap: 12,
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 900,
          color: "#111827",
        }}
      >
        Gerçek Veri Entegrasyonu
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(170px,1fr))",
          gap: 10,
        }}
      >
        <Info
          label="Risk"
          value={data.risk.total}
        />

        <Info
          label="Sağlık"
          value={data.health.total}
        />

        <Info
          label="KKD"
          value={data.ppe.total}
        />

        <Info
          label="Kaza / Olay"
          value={data.accident.total}
        />

        <Info
          label="İBYS"
          value={data.ibys.total}
        />
      </div>

      {data.warnings.length > 0 && (
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#fff7ed",
            color: "#92400e",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {data.warnings.map(
            (warning, index) => (
              <div
                key={`${warning.source}-${index}`}
              >
                <strong>{warning.source}:</strong>{" "}
                {warning.message}
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 13,
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "#64748b",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 5,
          fontSize: 24,
          fontWeight: 900,
          color: "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
}

const boxStyle: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
};