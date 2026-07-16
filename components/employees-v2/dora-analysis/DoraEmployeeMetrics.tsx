"use client";

import type {
  DoraEmployeeMetric,
} from "./types";

export default function DoraEmployeeMetrics({
  metrics,
}: {
  metrics: DoraEmployeeMetric[];
}) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(210px,1fr))",
        gap: 13,
      }}
    >
      {metrics.map((metric) => {
        const accent =
          metric.score >= 80
            ? "#b91c1c"
            : metric.score >= 60
            ? "#b45309"
            : metric.score >= 35
            ? "#ca8a04"
            : "#166534";

        return (
          <article
            key={metric.key}
            style={{
              padding: 17,
              borderRadius: 18,
              background: "#fff",
              border: `1px solid ${accent}24`,
              boxShadow:
                "0 10px 28px rgba(15,23,42,.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div
                style={{
                  color: "#64748b",
                  fontSize: 11,
                  fontWeight: 900,
                }}
              >
                {metric.title}
              </div>

              <strong
                style={{
                  color: accent,
                  fontSize: 13,
                }}
              >
                {metric.score}/100
              </strong>
            </div>

            <div
              style={{
                marginTop: 9,
                fontSize: 25,
                fontWeight: 950,
                color: "#111827",
              }}
            >
              {metric.value}
            </div>

            <div
              style={{
                height: 8,
                marginTop: 11,
                borderRadius: 999,
                background: "#e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${metric.score}%`,
                  height: "100%",
                  background: accent,
                }}
              />
            </div>

            <p
              style={{
                margin: "10px 0 0",
                color: "#64748b",
                fontSize: 11,
                lineHeight: 1.55,
              }}
            >
              {metric.explanation}
            </p>
          </article>
        );
      })}
    </section>
  );
}
