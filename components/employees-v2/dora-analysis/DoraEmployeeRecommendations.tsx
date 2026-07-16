"use client";

import type {
  DoraEmployeeRecommendation,
} from "./types";

export default function DoraEmployeeRecommendations({
  recommendations,
}: {
  recommendations: DoraEmployeeRecommendation[];
}) {
  return (
    <section
      style={{
        padding: 20,
        borderRadius: 20,
        background: "#fff",
        border: "1px solid #e5e7eb",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 21,
          fontWeight: 950,
        }}
      >
        DORA Yönetici Aksiyon Önerileri
      </h3>

      <p
        style={{
          margin: "7px 0 16px",
          color: "#64748b",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        Risk skorunu düşürmek ve çalışan uygunluğunu artırmak için öncelikli işlemler.
      </p>

      {recommendations.length === 0 ? (
        <div
          style={{
            padding: 22,
            borderRadius: 14,
            background: "#ecfdf5",
            color: "#166534",
            fontWeight: 850,
            textAlign: "center",
          }}
        >
          Öncelikli aksiyon önerisi bulunmuyor.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 11,
          }}
        >
          {recommendations.map(
            (recommendation, index) => {
              const config =
                priorityConfig(
                  recommendation.priority
                );

              return (
                <article
                  key={recommendation.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "44px minmax(0,1fr) auto",
                    gap: 12,
                    alignItems: "start",
                    padding: 14,
                    borderRadius: 15,
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 13,
                      background: config.background,
                      color: config.color,
                      fontWeight: 950,
                    }}
                  >
                    {index + 1}
                  </div>

                  <div>
                    <div
                      style={{
                        fontWeight: 950,
                        color: "#111827",
                      }}
                    >
                      {recommendation.title}
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        color: "#64748b",
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {recommendation.description}
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        color: "#1d4ed8",
                        fontSize: 12,
                        fontWeight: 850,
                      }}
                    >
                      Aksiyon: {recommendation.action}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      justifyItems: "end",
                      gap: 7,
                    }}
                  >
                    <span
                      style={{
                        padding: "6px 9px",
                        borderRadius: 999,
                        background: config.background,
                        color: config.color,
                        fontSize: 10,
                        fontWeight: 900,
                      }}
                    >
                      {config.label}
                    </span>

                    <span
                      style={{
                        color: "#64748b",
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      Etki: {recommendation.scoreImpact}
                    </span>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}

function priorityConfig(
  value: DoraEmployeeRecommendation["priority"]
) {
  return {
    LOW: {
      label: "Düşük",
      background: "#eff6ff",
      color: "#1d4ed8",
    },
    MEDIUM: {
      label: "Orta",
      background: "#fef3c7",
      color: "#92400e",
    },
    HIGH: {
      label: "Yüksek",
      background: "#ffedd5",
      color: "#b45309",
    },
    CRITICAL: {
      label: "Kritik",
      background: "#fee2e2",
      color: "#b91c1c",
    },
  }[value];
}
