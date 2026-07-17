"use client";

import React from "react";

export interface HeatmapItem {
  title: string;
  value: number;
}

interface Props {
  items?: HeatmapItem[];
}

export default function ReportAdvancedHeatmap({
  items = [],
}: Props) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 24,
      }}
    >
      <h2
        style={{
          margin: 0,
          marginBottom: 20,
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        Risk Isı Haritası
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
          gap: 16,
        }}
      >
        {items.map((item) => {
          const color =
            item.value >= 80
              ? "#dc2626"
              : item.value >= 60
              ? "#ea580c"
              : item.value >= 40
              ? "#facc15"
              : "#22c55e";

          return (
            <div
              key={item.title}
              style={{
                background: color,
                color: "#fff",
                borderRadius: 12,
                padding: 16,
                minHeight: 90,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <strong>{item.title}</strong>

              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                {item.value}
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div
            style={{
              gridColumn: "1/-1",
              padding: 24,
              textAlign: "center",
              color: "#64748b",
            }}
          >
            Isı haritası verisi bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}