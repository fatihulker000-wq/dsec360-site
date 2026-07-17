"use client";

import {
  getMonthlyChange,
} from "./ReportAnalyticsUtils";

import type {
  ReportMonthlyChange,
} from "./types";

export default function ReportMonthlyChangeGrid({
  items,
}: {
  items: ReportMonthlyChange[];
}) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(190px,1fr))",
        gap: 13,
      }}
    >
      {items.map((item) => {
        const change =
          getMonthlyChange(item);

        const color =
          change.positive
            ? "#166534"
            : "#b91c1c";

        const background =
          change.positive
            ? "#ecfdf5"
            : "#fef2f2";

        const arrow =
          change.direction === "UP"
            ? "▲"
            : change.direction === "DOWN"
            ? "▼"
            : "●";

        return (
          <article
            key={item.key}
            style={{
              padding: 16,
              borderRadius: 18,
              background,
              border:
                `1px solid ${color}22`,
            }}
          >
            <div
              style={{
                color: "#64748b",
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              {item.title}
            </div>

            <div
              style={{
                marginTop: 8,
                color: "#111827",
                fontSize: 25,
                fontWeight: 950,
              }}
            >
              {item.current}
              {item.unit || ""}
            </div>

            <div
              style={{
                marginTop: 8,
                color,
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              {arrow} %{change.percent}
            </div>

            <div
              style={{
                marginTop: 5,
                color: "#64748b",
                fontSize: 10,
              }}
            >
              Önceki dönem: {item.previous}
              {item.unit || ""}
            </div>
          </article>
        );
      })}
    </section>
  );
}
