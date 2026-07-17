"use client";

import {
  maxTrendValue,
} from "./ReportAnalyticsUtils";

import type {
  ReportTrendPoint,
} from "./types";

export default function ReportLineChart({
  title,
  subtitle,
  rows,
  primaryLabel = "Değer",
  secondaryLabel,
}: {
  title: string;
  subtitle?: string;
  rows: ReportTrendPoint[];
  primaryLabel?: string;
  secondaryLabel?: string;
}) {
  const max = maxTrendValue(rows);

  const width = 760;
  const height = 260;
  const paddingX = 46;
  const paddingY = 34;

  const chartWidth =
    width - paddingX * 2;

  const chartHeight =
    height - paddingY * 2;

  const points = rows.map((row, index) => {
    const x =
      paddingX +
      (index /
        Math.max(1, rows.length - 1)) *
        chartWidth;

    const y =
      paddingY +
      chartHeight -
      (row.value / max) *
        chartHeight;

    return {
      ...row,
      x,
      y,
    };
  });

  const secondaryPoints = rows
    .filter(
      (row) =>
        row.secondaryValue != null
    )
    .map((row, index) => {
      const x =
        paddingX +
        (index /
          Math.max(1, rows.length - 1)) *
          chartWidth;

      const y =
        paddingY +
        chartHeight -
        ((row.secondaryValue || 0) /
          max) *
          chartHeight;

      return {
        ...row,
        x,
        y,
      };
    });

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${
          point.x
        } ${point.y}`
    )
    .join(" ");

  const secondaryPath =
    secondaryPoints
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"} ${
            point.x
          } ${point.y}`
      )
      .join(" ");

  return (
    <section
      style={{
        padding: 20,
        borderRadius: 20,
        background: "#fff",
        border: "1px solid #e5e7eb",
        boxShadow:
          "0 12px 28px rgba(15,23,42,.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 950,
              color: "#111827",
            }}
          >
            {title}
          </h3>

          {subtitle ? (
            <p
              style={{
                margin: "6px 0 0",
                color: "#64748b",
                fontSize: 12,
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            fontSize: 11,
            fontWeight: 850,
          }}
        >
          <span style={{ color: "#b91c1c" }}>
            ● {primaryLabel}
          </span>

          {secondaryLabel ? (
            <span style={{ color: "#1d4ed8" }}>
              ● {secondaryLabel}
            </span>
          ) : null}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{
              width: "100%",
              minWidth: 620,
            }}
          >
            {[0, 1, 2, 3, 4].map(
              (line) => {
                const y =
                  paddingY +
                  (chartHeight / 4) *
                    line;

                return (
                  <line
                    key={line}
                    x1={paddingX}
                    x2={width - paddingX}
                    y1={y}
                    y2={y}
                    stroke="#e5e7eb"
                    strokeDasharray="5 5"
                  />
                );
              }
            )}

            <path
              d={linePath}
              fill="none"
              stroke="#b91c1c"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {secondaryPath ? (
              <path
                d={secondaryPath}
                fill="none"
                stroke="#1d4ed8"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {points.map((point) => (
              <g key={point.label}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="#b91c1c"
                />

                <text
                  x={point.x}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#64748b"
                >
                  {point.label}
                </text>

                <text
                  x={point.x}
                  y={point.y - 11}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="800"
                  fill="#111827"
                >
                  {point.value}
                </text>
              </g>
            ))}

            {secondaryPoints.map(
              (point) => (
                <circle
                  key={`secondary-${point.label}`}
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="#1d4ed8"
                />
              )
            )}
          </svg>
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: 30,
        borderRadius: 14,
        background: "#f8fafc",
        color: "#64748b",
        fontWeight: 800,
        textAlign: "center",
      }}
    >
      Trend verisi bulunmuyor.
    </div>
  );
}
