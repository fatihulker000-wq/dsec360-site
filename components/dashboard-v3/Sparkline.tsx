"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";

import type { DashboardMetricColor } from "./types";

type SparklineProps = {
  values: number[];
  tone?: DashboardMetricColor;
};

const toneColors: Record<DashboardMetricColor, string> = {
  red: "#dc2626",
  green: "#16a34a",
  blue: "#2563eb",
  orange: "#f59e0b",
  purple: "#7c3aed",
};

export default function Sparkline({
  values,
  tone = "red",
}: SparklineProps) {
  const chartColor = toneColors[tone];

  const safeValues =
    values.length > 1
      ? values
      : [20, 28, 24, 38, 34, 48, 44];

  const data = safeValues.map((value, index) => ({
    index,
    value: Number(value) || 0,
  }));

  const gradientId = `sparkline-${tone}`;

  return (
    <div
      style={{
        width: "100%",
        height: 54,
      }}
      aria-label="Gösterge eğilim grafiği"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 5,
            right: 1,
            bottom: 1,
            left: 1,
          }}
        >
          <defs>
            <linearGradient
              id={gradientId}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={chartColor}
                stopOpacity={0.28}
              />

              <stop
                offset="100%"
                stopColor={chartColor}
                stopOpacity={0.01}
              />
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey="value"
            stroke={chartColor}
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={false}
            isAnimationActive
            animationDuration={550}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}