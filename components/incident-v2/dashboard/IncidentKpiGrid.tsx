"use client";

import { calculateIncidentAiScore } from "./incidentAiScoreEngine";
import { IncidentKpi, IncidentMetrics } from "./types";

type Props = {
  metrics: IncidentMetrics;
};

export default function IncidentKpiGrid({
  metrics,
}: Props) {

  const ai =
    calculateIncidentAiScore(metrics);

  const kpis: IncidentKpi[] = [

    {
      title: "Toplam Olay",
      value: metrics.totalEvents,
      color: "blue",
    },

    {
      title: "İş Kazası",
      value: metrics.accidents,
      color: "red",
    },

    {
      title: "Ramak Kala",
      value: metrics.nearMiss,
      color: "green",
    },

    {
      title: "Tehlikeli Durum",
      value: metrics.dangerousConditions,
      color: "orange",
    },

    {
      title: "Meslek Hastalığı",
      value: metrics.occupationalDisease,
      color: "yellow",
    },

    {
      title: "İlk Yardım",
      value: metrics.firstAidCases,
      color: "blue",
    },

    {
      title: "LTI",
      value: metrics.lostTimeInjuries,
      color: "red",
    },

    {
      title: "MTI",
      value: metrics.medicalTreatmentCases,
      color: "orange",
    },

    {
      title: "RWC",
      value: metrics.restrictedWorkCases,
      color: "yellow",
    },

    {
      title: "Fatal",
      value: metrics.fatalities,
      color: "red",
    },

    {
      title: "Kayıp Gün",
      value: metrics.totalLostDays,
      color: "orange",
    },

    {
      title: "Severity",
      value: metrics.severityAverage.toFixed(1),
      color: "yellow",
    },

    {
      title: "Açık Soruşturma",
      value: metrics.openInvestigations,
      color: "blue",
    },

    {
      title: "Açık DÖF",
      value: metrics.openCorrectiveActions,
      color: "orange",
    },

    {
      title: "Risk Index",
      value: `${metrics.repeatedEvents}`,
      color: "red",
    },

    {
      title: "AI Incident",
      value: `${ai.score}/100`,
      color:
        ai.level === "EXCELLENT"
          ? "green"
          : ai.level === "GOOD"
          ? "blue"
          : ai.level === "RISKY"
          ? "yellow"
          : "red",
    },

  ];

  return (

    <section
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(180px,1fr))",
        gap: 18,
      }}
    >

      {kpis.map((item) => (

        <KpiCard
          key={item.title}
          item={item}
        />

      ))}

    </section>

  );

}

function KpiCard({

  item,

}: {

  item: IncidentKpi;

}) {

  const colors = {

    green: "#16a34a",

    blue: "#2563eb",

    yellow: "#ca8a04",

    orange: "#ea580c",

    red: "#dc2626",

  };

  return (

    <div
      style={{

        background: "#fff",

        borderRadius: 18,

        padding: 18,

        borderLeft: `6px solid ${colors[item.color]}`,

        border: "1px solid #e5e7eb",

        boxShadow:
          "0 8px 22px rgba(15,23,42,.05)",

      }}
    >

      <div
        style={{

          fontSize: 13,

          color: "#6b7280",

          fontWeight: 700,

        }}
      >
        {item.title}
      </div>

      <div
        style={{

          marginTop: 12,

          fontSize: 34,

          fontWeight: 900,

          color: colors[item.color],

        }}
      >
        {item.value}
      </div>

    </div>

  );

}