"use client";

import { IncidentDistributionItem } from "./types";

interface Props {
  items: IncidentDistributionItem[];
}

export default function RootCauseChart({
  items,
}: Props) {
  const max = Math.max(
    ...items.map((item) => item.count),
    1
  );

  return (
    <section style={cardStyle}>
      <Header
        eyebrow="ROOT CAUSE ANALYSIS"
        title="Kök Neden Dağılımı"
      />

      {items.length === 0 ? (
        <Empty />
      ) : (
        <div
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          {items.slice(0, 10).map((item) => {
            const width = Math.max(
              8,
              Math.round(
                (item.count / max) * 100
              )
            );

            return (
              <div key={item.label}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: 7,
                  }}
                >
                  <strong>{item.label}</strong>

                  <span
                    style={{
                      color: "#64748b",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {item.count} · %{item.percentage}
                  </span>
                </div>

                <div
                  style={{
                    height: 12,
                    borderRadius: 999,
                    background: "#e5e7eb",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${width}%`,
                      height: "100%",
                      borderRadius: 999,
                      background:
                        width >= 80
                          ? "#b91c1c"
                          : width >= 60
                          ? "#ea580c"
                          : width >= 40
                          ? "#ca8a04"
                          : "#16a34a",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
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
      Kök neden verisi bulunamadı.
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