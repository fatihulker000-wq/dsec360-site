"use client";

import { BRAND, softPanelStyle } from "./styles";

type StatusDonutProps = {
  label: string;
  value: number;
  total: number;
  color: string;
  softBg: string;
};

export default function StatusDonut({
  label,
  value,
  total,
  color,
  softBg,
}: StatusDonutProps) {
  const percent =
    total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div
      style={{
        ...softPanelStyle(softBg),
        display: "grid",
        gap: 10,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: BRAND.text,
        }}
      >
        {label}
      </div>

      <div
        style={{
          width: 70,
          height: 70,
          borderRadius: "50%",
          background: `conic-gradient(${color} ${percent}%, #e5e7eb ${percent}% 100%)`,
          display: "grid",
          placeItems: "center",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: "#fff",
            display: "grid",
            placeItems: "center",
            fontSize: 12,
            fontWeight: 900,
            color: BRAND.text,
          }}
        >
          %{percent}
        </div>
      </div>

      <div
        style={{
          fontSize: 24,
          fontWeight: 900,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}