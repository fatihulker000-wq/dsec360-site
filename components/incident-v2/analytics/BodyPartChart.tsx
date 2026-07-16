"use client";

import { IncidentDistributionItem } from "./types";

interface Props {
  items: IncidentDistributionItem[];
}

export default function BodyPartChart({
  items,
}: Props) {
  const total = items.reduce(
    (sum, item) => sum + item.count,
    0
  );

  return (
    <section style={cardStyle}>
      <Header
        eyebrow="INJURY ANALYSIS"
        title="Yaralanan Vücut Bölgeleri"
      />

      {items.length === 0 ? (
        <Empty />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(170px,1fr))",
            gap: 12,
          }}
        >
          {items.slice(0, 12).map((item) => (
            <article
              key={item.label}
              style={{
                padding: 16,
                borderRadius: 16,
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                style={{
                  color: "#64748b",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {item.label}
              </div>

              <div
                style={{
                  marginTop: 8,
                  fontSize: 28,
                  fontWeight: 950,
                  color: "#7a0017",
                }}
              >
                {item.count}
              </div>

              <div
                style={{
                  marginTop: 5,
                  color: "#64748b",
                  fontSize: 12,
                }}
              >
                Toplamın %
                {total <= 0
                  ? 0
                  : Math.round(
                      (item.count / total) * 100
                    )}
              </div>
            </article>
          ))}
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
      Yaralanma bölgesi verisi bulunamadı.
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