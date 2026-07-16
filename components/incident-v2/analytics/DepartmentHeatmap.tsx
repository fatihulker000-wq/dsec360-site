"use client";

import { IncidentDistributionItem } from "./types";

interface Props {
  items: IncidentDistributionItem[];
}

export default function DepartmentHeatmap({
  items,
}: Props) {
  return (
    <section style={cardStyle}>
      <Header
        eyebrow="DEPARTMENT HEATMAP"
        title="Departman Risk Haritası"
      />

      {items.length === 0 ? (
        <Empty />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(165px,1fr))",
            gap: 12,
          }}
        >
          {items.slice(0, 12).map((item) => (
            <article
              key={item.label}
              title={`${item.count} olay · %${item.percentage}`}
              style={{
                minHeight: 118,
                padding: 16,
                borderRadius: 16,
                color: "#fff",
                background: riskColor(
                  item.riskLevel
                ),
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow:
                  "0 8px 22px rgba(15,23,42,.08)",
              }}
            >
              <strong
                style={{
                  fontSize: 15,
                  lineHeight: 1.35,
                }}
              >
                {item.label}
              </strong>

              <div>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 950,
                  }}
                >
                  {item.count}
                </div>

                <div
                  style={{
                    marginTop: 2,
                    fontSize: 12,
                    opacity: 0.9,
                  }}
                >
                  %{item.percentage} pay
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function riskColor(
  level?: string
) {
  switch (level) {
    case "LOW":
      return "#15803d";

    case "MEDIUM":
      return "#ca8a04";

    case "HIGH":
      return "#ea580c";

    case "CRITICAL":
      return "#b91c1c";

    default:
      return "#475569";
  }
}

function Header({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          color: "#64748b",
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 1,
        }}
      >
        {eyebrow}
      </div>

      <h3
        style={{
          margin: "6px 0 0",
          fontSize: 22,
          fontWeight: 950,
        }}
      >
        {title}
      </h3>
    </div>
  );
}

function Empty() {
  return (
    <div
      style={{
        padding: 28,
        textAlign: "center",
        color: "#64748b",
      }}
    >
      Departman verisi bulunamadı.
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  padding: 22,
  borderRadius: 20,
  background: "#fff",
  border: "1px solid #e5e7eb",
  boxShadow:
    "0 10px 28px rgba(15,23,42,.05)",
};