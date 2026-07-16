"use client";

import { IbysDashboardSummary } from "./types";

interface Props {
  summary: IbysDashboardSummary;
}

export default function IbysDashboard({
  summary,
}: Props) {
  const cards = [
    {
      title: "Toplam Kayıt",
      value: summary.total,
      color: "#2563eb",
    },
    {
      title: "Taslak",
      value: summary.draft,
      color: "#64748b",
    },
    {
      title: "Eksik Bilgi",
      value: summary.missing,
      color: "#ca8a04",
    },
    {
      title: "Gönderime Hazır",
      value: summary.ready,
      color: "#16a34a",
    },
    {
      title: "Gönderilen",
      value: summary.sent,
      color: "#7c3aed",
    },
    {
      title: "Hatalı",
      value: summary.failed,
      color: "#dc2626",
    },
  ];

  return (
    <section
      style={{
        display: "grid",
        gap: 20,
      }}
    >
      <header
        style={{
          borderRadius: 22,
          padding: 25,
          color: "#fff",
          background:
            "linear-gradient(135deg,#0f172a 0%,#1e3a8a 55%,#2563eb 100%)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 1,
            opacity: 0.84,
          }}
        >
          D-SEC İBYS PREPARATION CENTER
        </div>

        <h2
          style={{
            margin: "8px 0 0",
            fontSize: 30,
            fontWeight: 950,
          }}
        >
          İBYS Olay Bildirim Hazırlık Merkezi
        </h2>

        <p
          style={{
            maxWidth: 780,
            margin: "12px 0 0",
            lineHeight: 1.7,
            opacity: 0.9,
          }}
        >
          Olay kayıtlarının zorunlu alanları,
          soruşturma durumu ve gönderime hazırlık
          süreci kontrol edilir.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(175px,1fr))",
          gap: 16,
        }}
      >
        {cards.map((card) => (
          <article
            key={card.title}
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
                background: card.color,
              }}
            />

            <div
              style={{
                paddingLeft: 7,
                color: "#64748b",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {card.title}
            </div>

            <div
              style={{
                marginTop: 9,
                paddingLeft: 7,
                color: card.color,
                fontSize: 31,
                fontWeight: 950,
              }}
            >
              {card.value}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}