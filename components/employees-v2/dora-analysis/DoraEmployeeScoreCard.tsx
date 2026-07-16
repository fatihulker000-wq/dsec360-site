"use client";

import type {
  DoraEmployeeAnalysis,
} from "./types";

export default function DoraEmployeeScoreCard({
  analysis,
}: {
  analysis: DoraEmployeeAnalysis;
}) {
  const accent = {
    LOW: "#166534",
    MEDIUM: "#ca8a04",
    HIGH: "#b45309",
    CRITICAL: "#b91c1c",
  }[analysis.riskLevel];

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(0,1fr) minmax(210px,270px)",
        gap: 18,
        padding: 22,
        borderRadius: 24,
        background:
          "linear-gradient(135deg,#111827 0%,#4a0d1a 55%,#b91c1c 100%)",
        color: "#fff",
        boxShadow:
          "0 22px 60px rgba(74,13,26,.22)",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 1,
            opacity: 0.8,
          }}
        >
          DORA AI EMPLOYEE ANALYSIS
        </div>

        <h2
          style={{
            margin: "9px 0 0",
            fontSize: 30,
            fontWeight: 950,
          }}
        >
          {analysis.headline}
        </h2>

        <p
          style={{
            margin: "12px 0 0",
            maxWidth: 850,
            lineHeight: 1.7,
            opacity: 0.9,
          }}
        >
          {analysis.summary}
        </p>

        <div
          style={{
            display: "flex",
            gap: 9,
            flexWrap: "wrap",
            marginTop: 16,
          }}
        >
          <span style={chipStyle}>
            Analiz Güveni %{analysis.confidence}
          </span>

          <span style={chipStyle}>
            {analysis.recommendations.length} Aksiyon Önerisi
          </span>

          <span style={chipStyle}>
            {analysis.riskSignals.length} Risk Sinyali
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: 190,
          borderRadius: 22,
          background: "rgba(255,255,255,.1)",
          border: "1px solid rgba(255,255,255,.18)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 118,
              height: 118,
              display: "grid",
              placeItems: "center",
              margin: "0 auto",
              borderRadius: "50%",
              background: accent,
              border: "7px solid rgba(255,255,255,.2)",
              fontSize: 38,
              fontWeight: 950,
            }}
          >
            {analysis.score}
          </div>

          <div
            style={{
              marginTop: 11,
              fontSize: 18,
              fontWeight: 950,
            }}
          >
            {riskLabel(analysis.riskLevel)}
          </div>

          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              opacity: 0.75,
            }}
          >
            100 üzerinden risk skoru
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 780px) {
          section {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

const chipStyle: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,.12)",
  border: "1px solid rgba(255,255,255,.18)",
  fontSize: 11,
  fontWeight: 850,
};

function riskLabel(
  value: DoraEmployeeAnalysis["riskLevel"]
) {
  return {
    LOW: "Düşük Risk",
    MEDIUM: "Orta Risk",
    HIGH: "Yüksek Risk",
    CRITICAL: "Kritik Risk",
  }[value];
}
