"use client";

import { cardStyle } from "./styles";
import type { ExecutiveSummary } from "./types";

type Props = {
  isMobile: boolean;
  ceoSummary: ExecutiveSummary;
};

export default function AlarmPanel({
  isMobile,
  ceoSummary,
}: Props) {
  return (
    <section
      style={{
        ...cardStyle(isMobile),
        marginTop: 20,
        background:
          ceoSummary.executiveRiskScore >= 70
            ? "linear-gradient(135deg,#7f1d1d 0%,#b91c1c 100%)"
            : ceoSummary.executiveRiskScore >= 40
            ? "linear-gradient(135deg,#92400e 0%,#d97706 100%)"
            : "linear-gradient(135deg,#166534 0%,#16a34a 100%)",
        color: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              opacity: 0.9,
              marginBottom: 8,
            }}
          >
            CEO ALARM PANELİ
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              lineHeight: 1.2,
            }}
          >
            {ceoSummary.healthLabel === "Kritik"
              ? "Üst yönetim müdahalesi önerilir"
              : ceoSummary.healthLabel === "Dikkat"
              ? "Yakın takip önerilir"
              : "Operasyon dengeli görünüyor"}
          </div>

          <div
            style={{
              marginTop: 10,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.92)",
            }}
          >
            Açık ÇBS kayıtları: {ceoSummary.cbsOpen}
            {" • "}
            SLA alarmı: {ceoSummary.cbsSla}
            {" • "}
            Başlamayan eğitim: {ceoSummary.totalNotStarted}
            {" • "}
            Tamamlanan eğitim: {ceoSummary.totalCompleted}
          </div>
        </div>

        <div
          style={{
            padding: "12px 16px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.18)",
            fontSize: 24,
            fontWeight: 900,
          }}
        >
          Skor: {ceoSummary.executiveRiskScore}
        </div>
      </div>
    </section>
  );
}