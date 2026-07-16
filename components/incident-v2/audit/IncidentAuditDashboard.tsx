"use client";

import { IncidentAuditSummary } from "./types";

interface Props {
  summary: IncidentAuditSummary;
}

export default function IncidentAuditDashboard({
  summary,
}: Props) {
  const cards = [
    {
      title: "Toplam Log",
      value: summary.total,
      color: "#2563eb",
    },
    {
      title: "Bugün",
      value: summary.today,
      color: "#16a34a",
    },
    {
      title: "Son 7 Gün",
      value: summary.lastSevenDays,
      color: "#0891b2",
    },
    {
      title: "Kritik",
      value: summary.critical,
      color: "#dc2626",
    },
    {
      title: "Başarısız",
      value: summary.failed,
      color: "#ea580c",
    },
    {
      title: "Kullanıcı",
      value: summary.uniqueUsers,
      color: "#7c3aed",
    },
    {
      title: "Olay",
      value: summary.uniqueIncidents,
      color: "#0f766e",
    },
    {
      title: "Başarılı",
      value: summary.successful,
      color: "#15803d",
    },
  ];

  return (
    <section
      style={{
        display: "grid",
        gap: 22,
      }}
    >
      <header
        style={{
          padding: 26,
          borderRadius: 24,
          color: "#fff",
          background:
            "linear-gradient(135deg,#111827,#1e3a8a,#2563eb)",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 1,
            opacity: .85,
          }}
        >
          D-SEC AUDIT CENTER
        </div>

        <h2
          style={{
            marginTop: 8,
            fontSize: 32,
            fontWeight: 900,
          }}
        >
          Incident Audit Merkezi
        </h2>

        <p
          style={{
            marginTop: 14,
            lineHeight: 1.7,
            maxWidth: 900,
            opacity: .92,
          }}
        >
          İş kazası modülünde gerçekleştirilen tüm
          işlemler kayıt altına alınır ve
          geriye dönük izlenebilirlik sağlanır.
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
        {cards.map(card => (
          <article
            key={card.title}
            style={{
              background: "#fff",
              borderRadius: 18,
              border: "1px solid #e5e7eb",
              padding: 18,
              boxShadow:
                "0 10px 25px rgba(15,23,42,.05)",
            }}
          >
            <div
              style={{
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
                fontSize: 34,
                fontWeight: 900,
                color: card.color,
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