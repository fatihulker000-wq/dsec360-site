"use client";

import { IncidentAnalyticsData } from "./types";

interface Props {
  data: IncidentAnalyticsData;
}

export default function AiExecutiveSummary({
  data,
}: Props) {
  const {
    metrics,
    prediction,
    recommendations,
  } = data;

  return (
    <section style={cardStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 18,
          alignItems: "center",
          marginBottom: 22,
        }}
      >
        <div>
          <div
            style={{
              color: "#64748b",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            DORA AI
          </div>

          <h3
            style={{
              margin: "6px 0 0",
              fontSize: 22,
              fontWeight: 950,
            }}
          >
            Yönetici Özeti
          </h3>
        </div>

        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontSize: 28,
            fontWeight: 950,
            background: scoreColor(
              metrics.aiIncidentScore
            ),
          }}
        >
          {metrics.aiIncidentScore}
        </div>
      </div>

      <div
        style={{
          padding: 18,
          borderRadius: 16,
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
        }}
      >
        <strong>
          Genel durum:{" "}
          {riskLabel(metrics.riskLevel)}
        </strong>

        <div
          style={{
            marginTop: 10,
            color: "#475569",
            lineHeight: 1.7,
          }}
        >
          30 günlük olay tahmini{" "}
          <strong>
            {prediction.next30Days}
          </strong>
          , tekrar olasılığı{" "}
          <strong>
            %{prediction.repeatProbability}
          </strong>
          , tahmin güveni ise{" "}
          <strong>
            %{prediction.confidence}
          </strong>
          seviyesindedir.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          marginTop: 18,
        }}
      >
        {recommendations.map((item) => (
          <article
            key={item.id}
            style={{
              padding: 16,
              borderRadius: 14,
              background: priorityBackground(
                item.priority
              ),
              borderLeft: `5px solid ${priorityColor(
                item.priority
              )}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <strong>{item.title}</strong>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: priorityColor(
                    item.priority
                  ),
                }}
              >
                {item.priority}
              </span>
            </div>

            <p
              style={{
                margin: "8px 0 0",
                color: "#475569",
                lineHeight: 1.6,
              }}
            >
              {item.description}
            </p>

            <div
              style={{
                marginTop: 10,
                color: "#1d4ed8",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              Aksiyon: {item.action}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function scoreColor(score: number) {
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

function riskLabel(level: string) {
  switch (level) {
    case "LOW":
      return "Düşük Risk";

    case "MEDIUM":
      return "Orta Risk";

    case "HIGH":
      return "Yüksek Risk";

    default:
      return "Kritik Risk";
  }
}

function priorityColor(
  priority: string
) {
  switch (priority) {
    case "CRITICAL":
      return "#dc2626";

    case "HIGH":
      return "#ea580c";

    case "MEDIUM":
      return "#ca8a04";

    default:
      return "#16a34a";
  }
}

function priorityBackground(
  priority: string
) {
  switch (priority) {
    case "CRITICAL":
      return "#fef2f2";

    case "HIGH":
      return "#fff7ed";

    case "MEDIUM":
      return "#fefce8";

    default:
      return "#f0fdf4";
  }
}

const cardStyle: React.CSSProperties = {
  padding: 22,
  borderRadius: 20,
  background: "#fff",
  border: "1px solid #e5e7eb",
  boxShadow:
    "0 10px 28px rgba(15,23,42,.05)",
};