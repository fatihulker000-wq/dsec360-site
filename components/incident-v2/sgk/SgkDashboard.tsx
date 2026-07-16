"use client";

import { SgkDashboardSummary } from "./types";

interface Props {
  summary: SgkDashboardSummary;
}

export default function SgkDashboard({
  summary,
}: Props) {
  const cards = [
    {
      title: "Toplam Kayıt",
      value: summary.total,
      color: "#2563eb",
    },
    {
      title: "Bildirime Hazır",
      value: summary.ready,
      color: "#16a34a",
    },
    {
      title: "Eksik Bilgi",
      value: summary.missing,
      color: "#ca8a04",
    },
    {
      title: "Süresi Geçen",
      value: summary.overdue,
      color: "#dc2626",
    },
    {
      title: "Gönderilen",
      value: summary.sent,
      color: "#7c3aed",
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
          padding: 24,
          color: "#fff",
          background:
            "linear-gradient(135deg,#0f172a 0%,#4a0d1a 55%,#b91c1c 100%)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 1,
            opacity: 0.85,
          }}
        >
          D-SEC SGK NOTIFICATION CENTER
        </div>

        <h2
          style={{
            margin: "8px 0 0",
            fontSize: 30,
            fontWeight: 950,
          }}
        >
          SGK İş Kazası Bildirim Merkezi
        </h2>

        <p
          style={{
            margin: "12px 0 0",
            maxWidth: 760,
            lineHeight: 1.7,
            opacity: 0.9,
          }}
        >
          İş kazası kayıtlarının bildirim hazırlığı,
          eksik alanları, süresi yaklaşan ve geciken
          bildirimleri tek ekrandan takip edilir.
        </p>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(180px,1fr))",
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
                marginTop: 10,
                paddingLeft: 7,
                color: card.color,
                fontSize: 32,
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