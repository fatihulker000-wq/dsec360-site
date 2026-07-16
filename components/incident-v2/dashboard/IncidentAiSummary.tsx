"use client";

import { calculateIncidentAiScore } from "./incidentAiScoreEngine";
import { IncidentMetrics } from "./types";

type Props = {
  metrics: IncidentMetrics;
};

export default function IncidentAiSummary({
  metrics,
}: Props) {

  const ai =
    calculateIncidentAiScore(metrics);

  const recommendations: string[] = [];

  if (metrics.fatalities > 0) {
    recommendations.push(
      "Ölümcül olaylar için üst yönetim incelemesi başlatılmalıdır."
    );
  }

  if (metrics.openInvestigations > 0) {
    recommendations.push(
      "Açık soruşturmalar öncelikli olarak tamamlanmalıdır."
    );
  }

  if (metrics.overdueCorrectiveActions > 0) {
    recommendations.push(
      "Geciken DÖF kayıtları kapatılmalıdır."
    );
  }

  if (metrics.repeatedEvents > 0) {
    recommendations.push(
      "Tekrarlayan olaylar için kök neden analizi yeniden yapılmalıdır."
    );
  }

  if (metrics.rootCauseClosedRate < 80) {
    recommendations.push(
      "Kök neden analizlerinin tamamlanma oranı artırılmalıdır."
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "AI kritik risk tespit etmedi. Mevcut süreçler korunabilir."
    );
  }

  return (

    <section
      style={{
        background: "#fff",
        borderRadius: 22,
        padding: 24,
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
        }}
      >

        <div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#6b7280",
              letterSpacing: 1,
            }}
          >
            DORA AI
          </div>

          <h3
            style={{
              marginTop: 6,
              fontSize: 24,
              fontWeight: 900,
            }}
          >
            Incident Intelligence
          </h3>

        </div>

        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: "50%",
            background:
              ai.score >= 90
                ? "#16a34a"
                : ai.score >= 75
                ? "#2563eb"
                : ai.score >= 50
                ? "#ca8a04"
                : "#dc2626",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontSize: 28,
            fontWeight: 900,
          }}
        >
          {ai.score}
        </div>

      </div>

      <div
        style={{
          marginTop: 24,
          padding: 18,
          borderRadius: 16,
          background: "#f8fafc",
        }}
      >

        <div
          style={{
            fontSize: 20,
            fontWeight: 900,
          }}
        >
          {ai.label}
        </div>

        <div
          style={{
            marginTop: 10,
            lineHeight: 1.8,
            color: "#475569",
          }}
        >
          {ai.description}
        </div>

      </div>

      <div
        style={{
          marginTop: 26,
        }}
      >

        <div
          style={{
            fontWeight: 900,
            marginBottom: 14,
          }}
        >
          Yönetici Önerileri
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >

          {recommendations.map((item) => (

            <div
              key={item}
              style={{
                padding: 14,
                borderRadius: 14,
                background: "#fff7ed",
                borderLeft:
                  "5px solid #ea580c",
              }}
            >

              {item}

            </div>

          ))}

        </div>

      </div>

      <div
        style={{
          marginTop: 28,
          display: "grid",
          gridTemplateColumns:
            "repeat(4,1fr)",
          gap: 16,
        }}
      >

        <SummaryCard
          title="Tekrarlayan"
          value={metrics.repeatedEvents}
        />

        <SummaryCard
          title="Açık DÖF"
          value={metrics.openCorrectiveActions}
        />

        <SummaryCard
          title="Soruşturma"
          value={metrics.openInvestigations}
        />

        <SummaryCard
          title="Kök Neden %"
          value={`${metrics.rootCauseClosedRate}%`}
        />

      </div>

    </section>

  );

}

function SummaryCard({

  title,

  value,

}: {

  title: string;

  value: string | number;

}) {

  return (

    <div
      style={{
        background: "#f8fafc",
        borderRadius: 14,
        padding: 16,
      }}
    >

      <div
        style={{
          fontSize: 12,
          color: "#64748b",
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 28,
          fontWeight: 900,
        }}
      >
        {value}
      </div>

    </div>

  );

}