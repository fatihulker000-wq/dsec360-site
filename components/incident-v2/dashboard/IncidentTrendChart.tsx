"use client";

import { IncidentTrendItem } from "./types";

type Props = {
  trend: IncidentTrendItem[];
};

export default function IncidentTrendChart({
  trend,
}: Props) {

  const max =
    Math.max(
      ...trend.map((x) => x.total),
      1
    );

  return (

    <section
      style={{
        background: "#fff",
        borderRadius: 22,
        padding: 22,
        border: "1px solid #e5e7eb",
        boxShadow:
          "0 10px 28px rgba(15,23,42,.05)",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 22,
        }}
      >

        <div>

          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            INCIDENT TREND
          </div>

          <h3
            style={{
              marginTop: 6,
              fontSize: 24,
              fontWeight: 900,
              color: "#111827",
            }}
          >
            Son 12 Ay Olay Trendi
          </h3>

        </div>

      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 16,
          height: 260,
        }}
      >

        {trend.map((item) => {

          const height =
            Math.max(
              20,
              Math.round(
                (item.total / max) * 180
              )
            );

          return (

            <div
              key={item.month}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}
            >

              <strong
                style={{
                  fontSize: 13,
                  color: "#111827",
                }}
              >
                {item.total}
              </strong>

              <div
                style={{
                  width: "100%",
                  height,
                  borderRadius: 10,
                  background:
                    "linear-gradient(180deg,#dc2626,#7a0017)",
                  transition: ".25s",
                }}
              />

              <span
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  fontWeight: 700,
                }}
              >
                {item.month}
              </span>

            </div>

          );

        })}

      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3,1fr)",
          gap: 16,
          marginTop: 28,
        }}
      >

        <MiniInfo
          title="Toplam Olay"

          value={
            trend.reduce(
              (s, x) => s + x.total,
              0
            )
          }

          color="#dc2626"
        />

        <MiniInfo
          title="İş Kazası"

          value={
            trend.reduce(
              (s, x) => s + x.accident,
              0
            )
          }

          color="#ea580c"
        />

        <MiniInfo
          title="Ramak Kala"

          value={
            trend.reduce(
              (s, x) => s + x.nearMiss,
              0
            )
          }

          color="#16a34a"
        />

      </div>

    </section>

  );

}

function MiniInfo({

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
        background: "#f8fafc",
        borderRadius: 16,
        padding: 16,
      }}
    >

      <div
        style={{
          fontSize: 12,
          color: "#6b7280",
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 30,
          fontWeight: 900,
          color,
        }}
      >
        {value}
      </div>

    </div>

  );

}