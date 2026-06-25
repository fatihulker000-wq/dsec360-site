"use client";

import { BRAND, cardStyle } from "../dashboard/styles";
import type { HealthKpiSummary } from "./types";
import { healthStatusColor } from "./healthHelpers";

type Props = {
  summary: HealthKpiSummary;
  isMobile: boolean;
};

export default function HealthKpiCards({
  summary,
  isMobile,
}: Props) {
  const cards = [
    {
      title: "Bugünkü Muayeneler",
      value: summary.todayExams,
      color: BRAND.blue,
    },
    {
      title: "Yaklaşan Muayeneler",
      value: summary.upcomingExams,
      color: BRAND.green,
    },
    {
      title: "Geciken Muayeneler",
      value: summary.overdueExams,
      color: BRAND.red,
    },
    {
      title: "Bugünkü Reçeteler",
      value: summary.todayPrescriptions,
      color: BRAND.amber,
    },
    {
      title: "Açık İş Kazaları",
      value: summary.openAccidents,
      color: BRAND.red,
    },
    {
      title: "Yaklaşan Aşılar",
      value: summary.upcomingVaccines,
      color: BRAND.blue,
    },
    {
      title: "Kritik Uyarılar",
      value: summary.criticalAlerts,
      color: BRAND.red,
    },
    {
      title: "Riskli Çalışan",
      value: summary.riskyEmployees,
      color: BRAND.green,
    },
  ];

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: isMobile
          ? "1fr"
          : "repeat(auto-fit,minmax(220px,1fr))",
        gap: 18,
      }}
    >
      {cards.map((card) => {
        const tone = healthStatusColor(card.value);

        return (
          <div
            key={card.title}
            style={{
              ...cardStyle(isMobile),
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: BRAND.muted,
              }}
            >
              {card.title}
            </div>

            <div
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: card.color,
              }}
            >
              {card.value}
            </div>

            <div
              style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                padding: "6px 12px",
                borderRadius: 999,
                background: tone.background,
                color: tone.color,
                fontWeight: 800,
                fontSize: 12,
              }}
            >
              Güncel
            </div>
          </div>
        );
      })}
    </section>
  );
}