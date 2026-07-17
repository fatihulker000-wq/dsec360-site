"use client";

import type {
  ReportComparisonRow,
} from "./types";

export default function ReportBarChart({
  rows,
}: {
  rows: ReportComparisonRow[];
}) {
  const max = Math.max(
    100,
    ...rows.flatMap((row) => [
      row.overallScore,
      row.trainingScore,
      row.auditScore,
      row.riskScore,
    ])
  );

  return (
    <section
      style={{
        padding: 20,
        borderRadius: 20,
        background: "#fff",
        border: "1px solid #e5e7eb",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 950,
        }}
      >
        Firma Karşılaştırması
      </h3>

      <p
        style={{
          margin: "6px 0 16px",
          color: "#64748b",
          fontSize: 12,
        }}
      >
        Genel skor, eğitim, denetim ve risk performanslarının firma bazlı karşılaştırması.
      </p>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          style={{
            display: "grid",
            gap: 14,
          }}
        >
          {rows.map((row) => (
            <article
              key={row.id}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "170px minmax(0,1fr)",
                gap: 14,
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: "#111827",
                  }}
                >
                  {row.companyName}
                </div>

                <div
                  style={{
                    marginTop: 4,
                    color: "#64748b",
                    fontSize: 11,
                  }}
                >
                  Genel: {row.overallScore}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 7,
                }}
              >
                <Bar
                  label="Genel"
                  value={row.overallScore}
                  max={max}
                  background="#111827"
                />

                <Bar
                  label="Eğitim"
                  value={row.trainingScore}
                  max={max}
                  background="#7c3aed"
                />

                <Bar
                  label="Denetim"
                  value={row.auditScore}
                  max={max}
                  background="#1d4ed8"
                />

                <Bar
                  label="Risk"
                  value={row.riskScore}
                  max={max}
                  background="#b91c1c"
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Bar({
  label,
  value,
  max,
  background,
}: {
  label: string;
  value: number;
  max: number;
  background: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "60px minmax(0,1fr) 34px",
        gap: 8,
        alignItems: "center",
      }}
    >
      <span
        style={{
          color: "#64748b",
          fontSize: 10,
          fontWeight: 800,
        }}
      >
        {label}
      </span>

      <div
        style={{
          height: 9,
          borderRadius: 999,
          background: "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.max(
              3,
              (value / max) * 100
            )}%`,
            height: "100%",
            borderRadius: 999,
            background,
          }}
        />
      </div>

      <strong
        style={{
          fontSize: 10,
          color: background,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: 26,
        borderRadius: 14,
        background: "#f8fafc",
        color: "#64748b",
        textAlign: "center",
        fontWeight: 800,
      }}
    >
      Firma karşılaştırma verisi bulunmuyor.
    </div>
  );
}
