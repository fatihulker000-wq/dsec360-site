"use client";

import { IncidentTrendPoint } from "./types";

interface Props {
  items: IncidentTrendPoint[];
}

export default function IncidentTrendChart({
  items,
}: Props) {
  const maxValue = Math.max(
    ...items.map((item) => item.total),
    1
  );

  return (
    <section style={cardStyle}>
      <Header
        eyebrow="12 AYLIK TREND"
        title="Olay Eğilimi"
      />

      {items.length === 0 ? (
        <Empty />
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              height: 260,
              overflowX: "auto",
              paddingBottom: 8,
            }}
          >
            {items.map((item) => {
              const totalHeight = Math.max(
                16,
                Math.round(
                  (item.total / maxValue) * 185
                )
              );

              return (
                <div
                  key={item.key}
                  title={[
                    `Toplam: ${item.total}`,
                    `İş Kazası: ${item.accidents}`,
                    `Ramak Kala: ${item.nearMisses}`,
                    `Kayıp Gün: ${item.lostDays}`,
                  ].join("\n")}
                  style={{
                    minWidth: 44,
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <strong
                    style={{
                      fontSize: 12,
                      color: "#111827",
                    }}
                  >
                    {item.total}
                  </strong>

                  <div
                    style={{
                      width: "78%",
                      height: totalHeight,
                      borderRadius: "10px 10px 4px 4px",
                      background:
                        "linear-gradient(180deg,#ef4444,#7f1d1d)",
                    }}
                  />

                  <span
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      fontWeight: 700,
                      textTransform: "capitalize",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(4,minmax(0,1fr))",
              gap: 12,
              marginTop: 18,
            }}
          >
            <Summary
              title="Toplam"
              value={sum(items, "total")}
              color="#dc2626"
            />

            <Summary
              title="İş Kazası"
              value={sum(items, "accidents")}
              color="#ea580c"
            />

            <Summary
              title="Ramak Kala"
              value={sum(items, "nearMisses")}
              color="#16a34a"
            />

            <Summary
              title="Kayıp Gün"
              value={sum(items, "lostDays")}
              color="#7a0017"
            />
          </div>
        </>
      )}
    </section>
  );
}

function sum(
  items: IncidentTrendPoint[],
  field:
    | "total"
    | "accidents"
    | "nearMisses"
    | "lostDays"
) {
  return items.reduce(
    (total, item) =>
      total + Number(item[field] || 0),
    0
  );
}

function Summary({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 14,
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          color: "#64748b",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 7,
          color,
          fontSize: 24,
          fontWeight: 950,
        }}
      >
        {value}
      </div>
    </div>
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
        padding: 32,
        textAlign: "center",
        color: "#64748b",
      }}
    >
      Trend verisi bulunamadı.
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