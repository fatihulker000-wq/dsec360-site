"use client";

import type {
  ExecutiveSummary,
} from "./types";

export default function ExecutiveScoreCard({
  summary,
}: {
  summary: ExecutiveSummary;
}) {

  const scoreColor =
    summary.overallScore >= 90
      ? "#16a34a"
      : summary.overallScore >= 75
      ? "#2563eb"
      : summary.overallScore >= 60
      ? "#ea580c"
      : "#dc2626";

  return (

    <section
      style={{
        padding: 24,
        borderRadius: 22,
        background:
          "linear-gradient(135deg,#0f172a 0%,#1e3a8a 55%,#2563eb 100%)",
        color: "#fff",
        display: "grid",
        gap: 24,
        boxShadow:
          "0 25px 60px rgba(37,99,235,.22)",
      }}
    >

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >

        <div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 900,
              opacity: .75,
              letterSpacing: 1,
            }}
          >
            DORA AI
          </div>

          <h2
            style={{
              margin: "8px 0 0",
              fontSize: 32,
              fontWeight: 900,
            }}
          >
            Executive Score
          </h2>

        </div>

        <div
          style={{
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: "#fff",
            color: scoreColor,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            boxShadow:
              "0 12px 40px rgba(0,0,0,.25)",
          }}
        >

          <div
            style={{
              fontSize: 42,
              fontWeight: 900,
            }}
          >
            {summary.overallScore}
          </div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            {summary.grade}
          </div>

        </div>

      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
          gap: 16,
        }}
      >

        <Metric
          title="Kurumsal Olgunluk"
          value={`${summary.maturity}%`}
        />

        <Metric
          title="Yasal Uyum"
          value={`${summary.legalCompliance}%`}
        />

        <Metric
          title="Dijitalleşme"
          value={`${summary.digitalization}%`}
        />

        <Metric
          title="Operasyonel Risk"
          value={`${summary.operationalRisk}%`}
        />

      </div>

    </section>

  );

}

function Metric({

  title,

  value,

}: {

  title: string;

  value: string;

}) {

  return (

    <div
      style={{
        padding: 18,
        borderRadius: 18,
        background: "rgba(255,255,255,.12)",
        border: "1px solid rgba(255,255,255,.18)",
      }}
    >

      <div
        style={{
          fontSize: 12,
          opacity: .72,
          fontWeight: 800,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 30,
          fontWeight: 900,
        }}
      >
        {value}
      </div>

    </div>

  );

}