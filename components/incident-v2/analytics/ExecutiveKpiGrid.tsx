"use client";

import { IncidentAnalyticsData } from "./types";

interface Props {
  data: IncidentAnalyticsData;
}

export default function ExecutiveKpiGrid({
  data,
}: Props) {
  const { metrics } = data;

  const cards = [
    {
      title: "Toplam Olay",
      value: metrics.totalIncidents,
      color: "#2563eb",
    },
    {
      title: "İş Kazası",
      value: metrics.workAccidents,
      color: "#dc2626",
    },
    {
      title: "Ramak Kala",
      value: metrics.nearMisses,
      color: "#16a34a",
    },
    {
      title: "Tehlikeli Durum",
      value: metrics.unsafeConditions,
      color: "#ea580c",
    },
    {
      title: "LTI",
      value: metrics.lostTimeInjuries,
      color: "#b91c1c",
    },
    {
      title: "Fatal",
      value: metrics.fatalities,
      color: "#111827",
    },
    {
      title: "Kayıp Gün",
      value: metrics.totalLostDays,
      color: "#7a0017",
    },
    {
      title: "Ortalama Şiddet",
      value: metrics.averageSeverity.toFixed(1),
      color: "#ca8a04",
    },
    {
      title: "LTIFR",
      value: metrics.ltifr.toFixed(2),
      color: "#7c3aed",
    },
    {
      title: "TRIR",
      value: metrics.trir.toFixed(2),
      color: "#0891b2",
    },
    {
      title: "Frequency Rate",
      value: metrics.frequencyRate.toFixed(2),
      color: "#0f766e",
    },
    {
      title: "Severity Rate",
      value: metrics.severityRate.toFixed(2),
      color: "#9333ea",
    },
    {
      title: "Açık Soruşturma",
      value: metrics.openInvestigations,
      color: "#2563eb",
    },
    {
      title: "Açık DÖF",
      value: metrics.openCorrectiveActions,
      color: "#ea580c",
    },
    {
      title: "Geciken DÖF",
      value: metrics.overdueCorrectiveActions,
      color: "#dc2626",
    },
    {
      title: "AI Incident",
      value: `${metrics.aiIncidentScore}/100`,
      color: getScoreColor(
        metrics.aiIncidentScore
      ),
    },
  ];

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(175px,1fr))",
        gap: 16,
      }}
    >
      {cards.map((item) => (
        <article
          key={item.title}
          style={{
            position: "relative",
            overflow: "hidden",
            padding: 18,
            borderRadius: 18,
            background: "#fff",
            border: "1px solid #e5e7eb",
            boxShadow:
              "0 8px 22px rgba(15,23,42,.05)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "0 auto 0 0",
              width: 5,
              background: item.color,
            }}
          />

          <div
            style={{
              paddingLeft: 6,
              color: "#64748b",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {item.title}
          </div>

          <div
            style={{
              marginTop: 10,
              paddingLeft: 6,
              color: item.color,
              fontSize: 30,
              fontWeight: 950,
            }}
          >
            {item.value}
          </div>
        </article>
      ))}
    </section>
  );
}

function getScoreColor(
  score: number
) {
  if (score >= 80) {
    return "#16a34a";
  }

  if (score >= 60) {
    return "#ca8a04";
  }

  if (score >= 40) {
    return "#ea580c";
  }

  return "#dc2626";
}