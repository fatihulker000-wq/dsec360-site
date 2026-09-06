"use client";

import type { EmployeeProfileEmployee } from "./types";

export default function EmployeeProfileKpis({
  employee,
}: {
  employee: EmployeeProfileEmployee;
}) {
  const cards = [
    {
      title: "Eğitim Tamamlama",
      value:
        employee.training_completion_rate != null
          ? `%${employee.training_completion_rate}`
          : "Veri Yok",
      accent: "#7c3aed",
    },
    {
      title: "Sağlık Takibi",
      value: healthStatusText(employee),
      accent: "#0f766e",
    },
    {
      title: "KKD Tamamlama",
      value:
        employee.ppe_completion_rate != null
          ? `%${employee.ppe_completion_rate}`
          : "Veri Yok",
      accent: "#1d4ed8",
    },
    {
      title: "Açık Risk",
      value: employee.open_risk_count ?? 0,
      accent: "#ca8a04",
    },
    {
      title: "Açık DÖF",
      value: employee.open_action_count ?? 0,
      accent: "#b45309",
    },
    {
      title: "İş Kazası",
      value: employee.accident_count ?? 0,
      accent: "#b91c1c",
    },
    {
      title: "Yaklaşan İşlem",
      value: employee.upcoming_count ?? 0,
      accent: "#334155",
    },
  ];

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(160px,1fr))",
        gap: 12,
      }}
    >
      {cards.map((card) => (
        <article
          key={card.title}
          style={{
            padding: 16,
            borderRadius: 18,
            background: "#fff",
            border: `1px solid ${card.accent}24`,
            boxShadow:
              "0 10px 26px rgba(15,23,42,.05)",
          }}
        >
          <div
            style={{
              color: "#64748b",
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            {card.title}
          </div>

          <div
            style={{
              marginTop: 8,
              color: card.accent,
              fontSize:
                typeof card.value === "number"
                  ? 28
                  : 18,
              fontWeight: 950,
            }}
          >
            {card.value}
          </div>
        </article>
      ))}
    </section>
  );
}

function healthStatusText(employee: EmployeeProfileEmployee) {
  const status = employee.health_status;
  const hasHealthRecord =
    (employee.health_record_count || 0) > 0 ||
    (employee.health_examination_count || 0) > 0 ||
    (employee.health_ek2_count || 0) > 0;

  if (!hasHealthRecord && status === "UNKNOWN") {
    return "Kayıt Yok";
  }

  if (status === "MISSING") return "Süresi Geçmiş";
  if (status === "EXPIRING") return "Muayene Yaklaşıyor";
  if (status === "COMPLETE") return "Muayene Geçerli";

  if ((employee.health_ek2_count || 0) > 0) {
    return "EK-2 Mevcut";
  }

  return hasHealthRecord ? "Kayıt Mevcut" : "Kayıt Yok";
}
