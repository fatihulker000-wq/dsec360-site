"use client";

import ExecutiveScoreCard from "./ExecutiveScoreCard";
import ExecutiveRecommendationCard from "./ExecutiveRecommendationCard";
import ExecutivePredictionCard from "./ExecutivePredictionCard";
import ExecutiveTimeline from "./ExecutiveTimeline";

import type {
  ExecutiveModuleScore,
  ExecutivePriority,
  ExecutiveSummary,
} from "./types";

export default function ExecutiveAiPanel({
  summary,
}: {
  summary: ExecutiveSummary;
}) {
  return (
    <main
      style={{
        display: "grid",
        gap: 24,
      }}
    >
      <ExecutiveScoreCard
        summary={summary}
      />

      <section style={cardStyle}>
        <div style={eyebrowStyle}>
          DORA AI
        </div>

        <h2 style={headingStyle}>
          Executive Summary
        </h2>

        <div
          style={{
            marginTop: 20,
            whiteSpace: "pre-wrap",
            lineHeight: 1.9,
            color: "#334155",
            fontSize: 16,
          }}
        >
          {summary.executiveText}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(420px,1fr))",
          gap: 24,
        }}
      >
        <ExecutiveRecommendationCard
          recommendations={
            summary.recommendations
          }
        />

        <ExecutivePredictionCard
          predictions={
            summary.predictions
          }
        />
      </section>

      <ExecutiveTimeline
        timeline={summary.timeline}
      />

      <section style={cardStyle}>
        <div style={eyebrowStyle}>
          DORA AI
        </div>

        <h2 style={headingStyle}>
          Modül Performansları
        </h2>

        <p
          style={{
            margin: "8px 0 0",
            color: "#64748b",
            lineHeight: 1.6,
          }}
        >
          Puanlar, modüllerdeki gerçek
          tamamlanma ve uygunluk oranlarına
          göre hesaplanır. Veri veya faaliyet
          yoksa performans 0 ve durum kritik
          kabul edilir.
        </p>

        <div
          style={{
            marginTop: 22,
            display: "grid",
            gap: 14,
          }}
        >
          {summary.modules.map(
            (module) => (
              <ModulePerformanceRow
                key={module.key}
                module={module}
              />
            )
          )}
        </div>
      </section>
    </main>
  );
}

function ModulePerformanceRow({
  module,
}: {
  module: ExecutiveModuleScore;
}) {
  const score =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Number(module.score || 0)
        )
      )
    );

  const visual =
    priorityVisual(
      module.priority,
      score
    );

  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(190px,260px) minmax(240px,1fr) 105px",
        gap: 18,
        alignItems: "center",
        padding: "16px 18px",
        borderRadius: 16,
        background: visual.soft,
        border:
          `1px solid ${visual.border}`,
      }}
    >
      <div>
        <div
          style={{
            fontWeight: 900,
            color: "#111827",
            fontSize: 16,
          }}
        >
          {module.title}
        </div>

        <div
          style={{
            marginTop: 5,
            fontSize: 12,
            lineHeight: 1.5,
            color: "#64748b",
          }}
        >
          {module.detail ||
            "Performans verisi bulunmuyor."}
        </div>
      </div>

      <div>
        <div
          style={{
            height: 13,
            borderRadius: 999,
            background: "#e5e7eb",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${score}%`,
              minWidth:
                score > 0
                  ? 8
                  : 0,
              height: "100%",
              borderRadius: 999,
              background: visual.color,
            }}
          />
        </div>

        <div
          style={{
            marginTop: 7,
            display: "flex",
            justifyContent:
              "space-between",
            gap: 12,
            color: "#64748b",
            fontSize: 11,
            fontWeight: 750,
          }}
        >
          <span>
            Tamamlanan:{" "}
            {module.completed ?? 0}
          </span>

          <span>
            Eksik/Açık:{" "}
            {module.missing ?? 0}
          </span>

          <span>
            Toplam:{" "}
            {module.total ?? 0}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          justifyItems: "end",
          gap: 7,
        }}
      >
        <strong
          style={{
            color: visual.color,
            fontSize: 24,
            lineHeight: 1,
          }}
        >
          %{score}
        </strong>

        <span
          style={{
            padding: "5px 9px",
            borderRadius: 999,
            background: visual.color,
            color: "#fff",
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 0.4,
          }}
        >
          {visual.label}
        </span>
      </div>
    </article>
  );
}

function priorityVisual(
  priority: ExecutivePriority,
  score: number
) {
  if (
    priority === "CRITICAL" ||
    score < 60
  ) {
    return {
      label: "KRİTİK",
      color: "#dc2626",
      soft: "#fff7f7",
      border: "#fecaca",
    };
  }

  if (
    priority === "HIGH" ||
    score < 75
  ) {
    return {
      label: "YÜKSEK RİSK",
      color: "#ea580c",
      soft: "#fff7ed",
      border: "#fed7aa",
    };
  }

  if (
    priority === "MEDIUM" ||
    score < 90
  ) {
    return {
      label: "GELİŞTİRİLMELİ",
      color: "#d97706",
      soft: "#fffbeb",
      border: "#fde68a",
    };
  }

  return {
    label: "İYİ",
    color: "#16a34a",
    soft: "#f0fdf4",
    border: "#bbf7d0",
  };
}

const cardStyle: React.CSSProperties = {
  padding: 24,
  borderRadius: 22,
  background: "#fff",
  border: "1px solid #e5e7eb",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#2563eb",
  fontWeight: 900,
  letterSpacing: 1,
};

const headingStyle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: 28,
  fontWeight: 900,
  color: "#111827",
};