"use client";

import { CompanyModulePerformance } from "../types";

const BRAND = {
  text: "#1f2937",
  muted: "#6b7280",
};

interface Props {
  module: CompanyModulePerformance;
}

export default function CompanyPerformanceRow({
  module,
}: Props) {
  const score = Math.max(
    0,
    Math.min(100, Math.round(module.score))
  );

  const visual =
    module.status === "GOOD"
      ? {
          label: "İYİ",
          color: "#166534",
          soft: "#f0fdf4",
          border: "#bbf7d0",
        }
      : module.status === "DEVELOP"
      ? {
          label: "GELİŞTİRİLMELİ",
          color: "#92400e",
          soft: "#fffbeb",
          border: "#fde68a",
        }
      : module.status === "HIGH"
      ? {
          label: "YÜKSEK RİSK",
          color: "#c2410c",
          soft: "#fff7ed",
          border: "#fed7aa",
        }
      : {
          label: "KRİTİK",
          color: "#b91c1c",
          soft: "#fff7f7",
          border: "#fecaca",
        };

  return (
    <article
      style={{
        padding: 16,
        borderRadius: 16,
        background: visual.soft,
        border: `1px solid ${visual.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 950,
              color: BRAND.text,
            }}
          >
            {module.title}
          </div>

          <div
            style={{
              marginTop: 5,
              color: BRAND.muted,
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {module.detail}
          </div>
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 950,
            color: visual.color,
          }}
        >
          %{score}
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          height: 10,
          borderRadius: 999,
          background: "#e5e7eb",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: "100%",
            background: visual.color,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 8,
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
          fontSize: 11,
          color: BRAND.muted,
          fontWeight: 800,
        }}
      >
        <span>Toplam: {module.total}</span>
        <span>Tamamlanan: {module.completed}</span>
        <span>Eksik/Açık: {module.missing}</span>
        <span style={{ color: visual.color }}>
          {visual.label}
        </span>
      </div>
    </article>
  );
}