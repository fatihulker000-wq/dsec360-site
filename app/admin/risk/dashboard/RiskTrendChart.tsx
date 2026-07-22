"use client";

import { useMemo } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from "lucide-react";

import type { RiskRecord } from "../types";

type Props = {
  records: RiskRecord[];
  days?: number;
  loading?: boolean;
};

type TrendPoint = {
  label: string;
  dateKey: string;
  total: number;
  critical: number;
  high: number;
};

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
  }).format(value);
}

function getRecordDate(record: RiskRecord) {
  const millis =
    Number(record.updatedAtMillis || 0) ||
    Number(record.createdAtMillis || 0);

  const date = new Date(millis);

  return Number.isNaN(date.getTime())
    ? null
    : startOfDay(date);
}

function createPath(
  values: number[],
  width: number,
  height: number,
  padding: number
) {
  if (values.length === 0) return "";

  const maxValue = Math.max(...values, 1);
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const stepX =
    values.length > 1
      ? usableWidth / (values.length - 1)
      : 0;

  return values
    .map((value, index) => {
      const x = padding + index * stepX;
      const y =
        height -
        padding -
        (value / maxValue) * usableHeight;

      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export default function RiskTrendChart({
  records,
  days = 30,
  loading = false,
}: Props) {
  const trend = useMemo<TrendPoint[]>(() => {
    const today = startOfDay(new Date());
    const result: TrendPoint[] = [];

    for (let index = days - 1; index >= 0; index -= 1) {
      const current = new Date(today);
      current.setDate(today.getDate() - index);

      result.push({
        label: formatShortDate(current),
        dateKey: dateKey(current),
        total: 0,
        critical: 0,
        high: 0,
      });
    }

    const pointMap = new Map(
      result.map((point) => [point.dateKey, point])
    );

    records.forEach((record) => {
      const recordDate = getRecordDate(record);

      if (!recordDate) return;

      const point = pointMap.get(dateKey(recordDate));

      if (!point) return;

      point.total += 1;

      if (
        record.level === "VERY_HIGH" ||
        record.level === "INTOLERABLE"
      ) {
        point.critical += 1;
      }

      if (record.level === "HIGH") {
        point.high += 1;
      }
    });

    return result;
  }, [records, days]);

  const totals = useMemo(() => {
    const current = trend.reduce(
      (sum, point) => sum + point.total,
      0
    );

    const halfIndex = Math.floor(trend.length / 2);

    const previousHalf = trend
      .slice(0, halfIndex)
      .reduce((sum, point) => sum + point.total, 0);

    const currentHalf = trend
      .slice(halfIndex)
      .reduce((sum, point) => sum + point.total, 0);

    const difference = currentHalf - previousHalf;

    return {
      current,
      difference,
      currentHalf,
      previousHalf,
    };
  }, [trend]);

  const chartWidth = 760;
  const chartHeight = 240;
  const padding = 28;

  const totalPath = useMemo(
    () =>
      createPath(
        trend.map((point) => point.total),
        chartWidth,
        chartHeight,
        padding
      ),
    [trend]
  );

  const criticalPath = useMemo(
    () =>
      createPath(
        trend.map((point) => point.critical),
        chartWidth,
        chartHeight,
        padding
      ),
    [trend]
  );

  const maxValue = Math.max(
    ...trend.map((point) => point.total),
    1
  );

  const trendStatus =
    totals.difference > 0
      ? {
          icon: <ArrowUpRight size={16} />,
          label: `+${totals.difference}`,
          color: "#b91c1c",
          background: "#fef2f2",
        }
      : totals.difference < 0
        ? {
            icon: <ArrowDownRight size={16} />,
            label: String(totals.difference),
            color: "#047857",
            background: "#ecfdf5",
          }
        : {
            icon: <Minus size={16} />,
            label: "0",
            color: "#64748b",
            background: "#f1f5f9",
          };

  return (
    <section
      style={{
        borderRadius: 22,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        padding: 18,
        boxShadow:
          "0 14px 35px rgba(15,23,42,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#0f172a",
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            <Activity size={19} color="#2563eb" />
            Risk Trendi
          </div>

          <p
            style={{
              margin: "5px 0 0",
              color: "#94a3b8",
              fontSize: 13,
            }}
          >
            Son {days} gündeki yeni ve güncellenen
            risk kayıtları
          </p>
        </div>

        <div
          style={{
            borderRadius: 999,
            padding: "6px 10px",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: trendStatus.color,
            background: trendStatus.background,
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          {trendStatus.icon}
          {trendStatus.label}
        </div>
      </div>

      {loading ? (
        <div
          style={{
            height: 260,
            borderRadius: 16,
            background:
              "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)",
            backgroundSize: "200% 100%",
          }}
          className="trendSkeleton"
        />
      ) : records.length === 0 ? (
        <div
          style={{
            height: 260,
            display: "grid",
            placeItems: "center",
            borderRadius: 16,
            border: "1px dashed #cbd5e1",
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          Henüz trend oluşturacak risk kaydı yok.
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{
                width: "100%",
                minWidth: 640,
                height: 260,
                display: "block",
              }}
              role="img"
              aria-label="Risk trend grafiği"
            >
              {[0, 1, 2, 3, 4].map((line) => {
                const y =
                  padding +
                  ((chartHeight - padding * 2) / 4) *
                    line;

                const value = Math.round(
                  maxValue - (maxValue / 4) * line
                );

                return (
                  <g key={line}>
                    <line
                      x1={padding}
                      x2={chartWidth - padding}
                      y1={y}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray="4 6"
                    />

                    <text
                      x={4}
                      y={y + 4}
                      fontSize="10"
                      fill="#94a3b8"
                    >
                      {value}
                    </text>
                  </g>
                );
              })}

              <path
                d={totalPath}
                fill="none"
                stroke="#2563eb"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d={criticalPath}
                fill="none"
                stroke="#dc2626"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="7 6"
              />

              {trend.map((point, index) => {
                const usableWidth =
                  chartWidth - padding * 2;

                const x =
                  padding +
                  (trend.length > 1
                    ? (usableWidth /
                        (trend.length - 1)) *
                      index
                    : 0);

                const y =
                  chartHeight -
                  padding -
                  (point.total / maxValue) *
                    (chartHeight - padding * 2);

                const showLabel =
                  index === 0 ||
                  index === trend.length - 1 ||
                  index % Math.max(
                    1,
                    Math.floor(trend.length / 6)
                  ) ===
                    0;

                return (
                  <g key={point.dateKey}>
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#ffffff"
                      stroke="#2563eb"
                      strokeWidth="3"
                    />

                    {showLabel ? (
                      <text
                        x={x}
                        y={chartHeight - 7}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#94a3b8"
                      >
                        {point.label}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </svg>
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                color: "#64748b",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 3,
                    borderRadius: 999,
                    background: "#2563eb",
                  }}
                />
                Toplam kayıt
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 3,
                    borderRadius: 999,
                    background: "#dc2626",
                  }}
                />
                Kritik risk
              </span>
            </div>

            <div
              style={{
                color: "#475569",
                fontSize: 12,
                fontWeight: 850,
              }}
            >
              Dönem toplamı: {totals.current}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .trendSkeleton {
          animation: trend-loading 1.2s linear
            infinite;
        }

        @keyframes trend-loading {
          from {
            background-position: 200% 0;
          }

          to {
            background-position: -200% 0;
          }
        }
      `}</style>
    </section>
  );
}