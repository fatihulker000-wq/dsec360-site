"use client";

import { BRAND } from "./styles";

type MiniBarChartProps = {
  items: {
    label: string;
    value: number;
  }[];
  color: string;
  emptyText?: string;
};

export default function MiniBarChart({
  items,
  color,
  emptyText = "Veri bulunamadı.",
}: MiniBarChartProps) {
  if (!items.length) {
    return (
      <div style={{ color: BRAND.muted }}>
        {emptyText}
      </div>
    );
  }

  const max = Math.max(
    ...items.map((x) => x.value),
    1
  );

  return (
    <div
      style={{
        display: "grid",
        gap: 12,
      }}
    >
      {items.map((item) => {
        const width = Math.max(
          6,
          Math.round((item.value / max) * 100)
        );

        return (
          <div key={item.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: BRAND.text,
                }}
              >
                {item.label}
              </div>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color,
                }}
              >
                {item.value}
              </div>
            </div>

            <div
              style={{
                height: 10,
                borderRadius: 999,
                background: "#f3f4f6",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${width}%`,
                  height: "100%",
                  background: color,
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}