"use client";

import { calculateIncidentAiScore } from "./incidentAiScoreEngine";
import { IncidentMetrics } from "./types";

type Props = {
  metrics: IncidentMetrics;
};

export default function IncidentExecutiveHero({
  metrics,
}: Props) {

  const ai =
    calculateIncidentAiScore(metrics);

  return (

    <section
      style={{
        borderRadius: 26,
        padding: 28,
        background:
          "linear-gradient(135deg,#4a0d1a 0%,#7a0017 55%,#b91c1c 100%)",
        color: "#fff",
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: 28,
        boxShadow:
          "0 24px 60px rgba(122,0,23,.25)",
      }}
    >

      <div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: 1,
            opacity: .9,
          }}
        >
          D-SEC INCIDENT MANAGEMENT
        </div>

        <h1
          style={{
            marginTop: 12,
            fontSize: 38,
            fontWeight: 900,
            lineHeight: 1.15,
          }}
        >
          Kaza ve Olay Yönetim Merkezi
        </h1>

        <p
          style={{
            marginTop: 14,
            maxWidth: 820,
            lineHeight: 1.7,
            opacity: .92,
            fontSize: 15,
          }}
        >
          İş kazaları, ramak kala olayları,
          tehlikeli durumlar, araştırmalar,
          kök neden analizleri, DÖF süreçleri,
          AI destekli olay analizi ve
          kurumsal raporlama tek merkezden
          yönetilmektedir.
        </p>

        <div
          style={{
            display: "flex",
            gap: 18,
            marginTop: 26,
            flexWrap: "wrap",
          }}
        >

          <HeroMiniCard
            title="Toplam Olay"
            value={metrics.totalEvents}
          />

          <HeroMiniCard
            title="Açık Soruşturma"
            value={metrics.openInvestigations}
          />

          <HeroMiniCard
            title="Açık DÖF"
            value={metrics.openCorrectiveActions}
          />

          <HeroMiniCard
            title="Kayıp Gün"
            value={metrics.totalLostDays}
          />

        </div>

      </div>

      <div>

        <div
          style={{
            background: "rgba(255,255,255,.12)",
            backdropFilter: "blur(12px)",
            borderRadius: 22,
            padding: 24,
            border: "1px solid rgba(255,255,255,.18)",
          }}
        >

          <div
            style={{
              fontSize: 13,
              opacity: .85,
              fontWeight: 800,
            }}
          >
            AI INCIDENT SCORE
          </div>

          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              marginTop: 10,
              lineHeight: 1,
            }}
          >
            {ai.score}
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            {ai.label}
          </div>

          <div
            style={{
              marginTop: 18,
              lineHeight: 1.7,
              opacity: .92,
              fontSize: 14,
            }}
          >
            {ai.description}
          </div>

        </div>

      </div>

    </section>

  );

}

function HeroMiniCard({

  title,

  value,

}: {

  title: string;

  value: string | number;

}) {

  return (

    <div
      style={{
        minWidth: 145,
        padding: 18,
        borderRadius: 18,
        background: "rgba(255,255,255,.10)",
        border: "1px solid rgba(255,255,255,.18)",
      }}
    >

      <div
        style={{
          fontSize: 12,
          opacity: .85,
          fontWeight: 700,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 30,
          fontWeight: 900,
        }}
      >
        {value}
      </div>

    </div>

  );

}