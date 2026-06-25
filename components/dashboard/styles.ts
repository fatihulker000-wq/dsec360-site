import React from "react";

export const BRAND = {
  bg: "#f7f8fb",
  white: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",

  red: "#c62828",
  redDark: "#5a0f1f",
  redSoft: "#fff1f1",

  green: "#166534",
  greenSoft: "#f0fdf4",

  blue: "#1d4ed8",
  blueSoft: "#eff6ff",

  amber: "#92400e",
  amberSoft: "#fff7ed",

  slate: "#334155",

  purple: "#6d28d9",
  purpleSoft: "#f5f3ff",

  shadow: "0 10px 30px rgba(15,23,42,.06)",
};

export function cardStyle(
  isMobile = false
): React.CSSProperties {
  return {
    background: BRAND.white,
    border: `1px solid ${BRAND.border}`,
    borderRadius: isMobile ? 16 : 20,
    padding: isMobile ? 14 : 20,
    boxShadow: BRAND.shadow,
    minWidth: 0,
  };
}

export function metricCardStyle(
  accent: string,
  isMobile = false
): React.CSSProperties {
  return {
    ...cardStyle(isMobile),
    position: "relative",
    overflow: "hidden",
    minHeight: isMobile ? 110 : 132,
    borderLeft: `6px solid ${accent}`,
  };
}

export function badgeStyle(
  bg: string,
  color: string,
  border?: string
): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: 999,
    fontWeight: 800,
    fontSize: 12,
    background: bg,
    color,
    border: `1px solid ${border || bg}`,
    whiteSpace: "nowrap",
  };
}

export function softPanelStyle(
  bg: string,
  isMobile = false
): React.CSSProperties {
  return {
    borderRadius: isMobile ? 14 : 18,
    padding: isMobile ? 12 : 16,
    background: bg,
    border: `1px solid ${BRAND.border}`,
  };
}

export function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(1);
}
