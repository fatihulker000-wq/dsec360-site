"use client";

import type {
  ExecutivePrediction,
} from "./types";

export default function ExecutivePredictionCard({
  predictions,
}: {
  predictions: ExecutivePrediction[];
}) {
  return (
    <section
      style={{
        padding: 24,
        borderRadius: 22,
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        display: "grid",
        gap: 18,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            color: "#2563eb",
            letterSpacing: 1,
          }}
        >
          DORA AI
        </div>

        <h2
          style={{
            margin: "6px 0 0",
            fontSize: 28,
            fontWeight: 900,
            color: "#111827",
          }}
        >
          Kurumsal Tahmin Analizi
        </h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 18,
        }}
      >
        {predictions.map((prediction) => (
          <PredictionCard
            key={prediction.period}
            prediction={prediction}
          />
        ))}
      </div>
    </section>
  );
}

function PredictionCard({
  prediction,
}: {
  prediction: ExecutivePrediction;
}) {

  const scoreColor =
    prediction.expectedScore >= 90
      ? "#16a34a"
      : prediction.expectedScore >= 75
      ? "#2563eb"
      : prediction.expectedScore >= 60
      ? "#ea580c"
      : "#dc2626";

  const riskColor =
    prediction.expectedRisk <= 20
      ? "#16a34a"
      : prediction.expectedRisk <= 40
      ? "#2563eb"
      : prediction.expectedRisk <= 60
      ? "#ea580c"
      : "#dc2626";

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 18,
        border: "1px solid #e5e7eb",
        background: "#f8fafc",
        display: "grid",
        gap: 16,
      }}
    >
      <div
        style={{
          fontWeight: 900,
          fontSize: 22,
          color: "#111827",
        }}
      >
        {prediction.period}
      </div>

      <div>
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            fontWeight: 700,
          }}
        >
          Beklenen Kurumsal Skor
        </div>

        <div
          style={{
            marginTop: 5,
            fontSize: 34,
            fontWeight: 900,
            color: scoreColor,
          }}
        >
          {prediction.expectedScore}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            fontWeight: 700,
          }}
        >
          Beklenen Risk
        </div>

        <div
          style={{
            marginTop: 5,
            fontSize: 30,
            fontWeight: 900,
            color: riskColor,
          }}
        >
          %{prediction.expectedRisk}
        </div>
      </div>
    </div>
  );
}