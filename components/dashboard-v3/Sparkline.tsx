"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";

export type SparklineTone = "red" | "green" | "blue" | "orange" | "purple";

type SparklineProps = {
  values: number[];
  tone?: SparklineTone;
  height?: number;
};

const COLORS: Record<SparklineTone, string> = {
  red: "#dc2626",
  green: "#16a34a",
  blue: "#2563eb",
  orange: "#f59e0b",
  purple: "#7c3aed",
};

export default function Sparkline({
  values,
  tone = "red",
  height = 52,
}: SparklineProps) {
  const data = (values.length ? values : [0]).map((value, index) => ({
    index,
    value: Number.isFinite(value) ? value : 0,
  }));
  const color = COLORS[tone];
  const gradientId = `sparkline-${tone}`;

  return (
    <div style={{ width: "100%", height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 1, bottom: 0, left: 1 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.34} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.4}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
