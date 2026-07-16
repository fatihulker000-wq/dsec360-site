"use client";

import { IncidentRecentItem } from "./types";

type Props = {
  recent: IncidentRecentItem[];
};

export default function IncidentRecentEvents({
  recent,
}: Props) {

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
          marginBottom: 22,
        }}
      >

        <div
          style={{
            fontSize: 12,
            color: "#6b7280",
            fontWeight: 800,
          }}
        >
          RECENT INCIDENTS
        </div>

        <h3
          style={{
            marginTop: 6,
            fontSize: 24,
            fontWeight: 900,
          }}
        >
          Son Olaylar
        </h3>

      </div>

      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >

        {recent.map((item) => (

          <div
            key={item.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              borderRadius: 16,
              background: "#f8fafc",
            }}
          >

            <div>

              <div
                style={{
                  fontWeight: 900,
                }}
              >
                {item.title}
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: "#64748b",
                }}
              >
                {item.company} • {item.department}
              </div>

            </div>

            <div
              style={{
                display: "flex",
                gap: 20,
                alignItems: "center",
              }}
            >

              <SeverityBadge
                severity={item.severity}
              />

              <RiskBadge
                risk={item.riskScore}
              />

            </div>

          </div>

        ))}

      </div>

    </section>

  );

}

function SeverityBadge({
  severity,
}: {
  severity: number;
}) {

  const color =
    severity >= 4
      ? "#dc2626"
      : severity >= 3
      ? "#ea580c"
      : "#16a34a";

  return (
    <span
      style={{
        color,
        fontWeight: 900,
      }}
    >
      Severity {severity}
    </span>
  );

}

function RiskBadge({
  risk,
}: {
  risk: number;
}) {

  return (
    <div
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        background:
          risk >= 80
            ? "#dc2626"
            : risk >= 60
            ? "#ca8a04"
            : "#16a34a",
        color: "#fff",
        fontWeight: 900,
      }}
    >
      AI {risk}
    </div>
  );

}