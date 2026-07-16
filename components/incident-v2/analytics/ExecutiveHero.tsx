"use client";

import { IncidentAnalyticsData } from "./types";

interface Props {
  data: IncidentAnalyticsData;
}

export default function ExecutiveHero({
  data,
}: Props) {
  const {
    metrics,
    prediction,
  } = data;

  return (
    <section
      style={{
        borderRadius: 26,
        padding: 28,
        background:
          "linear-gradient(135deg,#111827 0%,#4a0d1a 50%,#b91c1c 100%)",
        color: "#fff",
        boxShadow:
          "0 22px 60px rgba(74,13,26,.24)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0,1.7fr) minmax(260px,.8fr)",
          gap: 28,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: 1.2,
              opacity: 0.82,
            }}
          >
            D-SEC INCIDENT ANALYTICS CENTER
          </div>

          <h1
            style={{
              margin: "10px 0 0",
              fontSize: 36,
              lineHeight: 1.15,
              fontWeight: 950,
            }}
          >
            İş Kazası Yönetici Analiz Merkezi
          </h1>

          <p
            style={{
              maxWidth: 850,
              margin: "14px 0 0",
              lineHeight: 1.7,
              opacity: 0.9,
            }}
          >
            İş kazaları, ramak kala olayları,
            soruşturmalar, kayıp günler, DÖF
            durumları ve ileri dönem tahminleri
            tek merkezde analiz edilir.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 24,
            }}
          >
            <MiniCard
              title="Toplam Olay"
              value={metrics.totalIncidents}
            />

            <MiniCard
              title="Kayıp Gün"
              value={metrics.totalLostDays}
            />

            <MiniCard
              title="Açık Soruşturma"
              value={
                metrics.openInvestigations
              }
            />

            <MiniCard
              title="Geciken DÖF"
              value={
                metrics.overdueCorrectiveActions
              }
            />
          </div>
        </div>

        <div
          style={{
            padding: 24,
            borderRadius: 20,
            background:
              "rgba(255,255,255,.11)",
            border:
              "1px solid rgba(255,255,255,.18)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 900,
              opacity: 0.85,
            }}
          >
            AI INCIDENT SCORE
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 64,
              fontWeight: 950,
              lineHeight: 1,
            }}
          >
            {metrics.aiIncidentScore}
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 20,
              fontWeight: 850,
            }}
          >
            {riskLabel(
              metrics.riskLevel
            )}
          </div>

          <div
            style={{
              marginTop: 16,
              lineHeight: 1.7,
              opacity: 0.9,
            }}
          >
            30 günlük tahmini olay sayısı:{" "}
            <strong>
              {prediction.next30Days}
            </strong>
            <br />
            Tekrar olasılığı:{" "}
            <strong>
              %{prediction.repeatProbability}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        minWidth: 150,
        padding: 15,
        borderRadius: 15,
        background:
          "rgba(255,255,255,.09)",
        border:
          "1px solid rgba(255,255,255,.15)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          opacity: 0.78,
          fontWeight: 800,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 7,
          fontSize: 27,
          fontWeight: 950,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function riskLabel(
  level: string
) {
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