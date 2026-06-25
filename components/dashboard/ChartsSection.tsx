"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { BRAND, cardStyle } from "./styles";
import type { TrendItem } from "./types";

type ChartsSectionProps = {
  isMobile: boolean;
  dashboardTrendData: TrendItem[];
  dashboardPieData: {
    name: string;
    value: number;
  }[];
};

const pieColors = ["#16a34a", "#2563eb", "#f59e0b"];

export default function ChartsSection({
  isMobile,
  dashboardTrendData,
  dashboardPieData,
}: ChartsSectionProps) {
  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.4fr 0.6fr",
        gap: 18,
        marginBottom: 22,
      }}
    >
      <div style={cardStyle(isMobile)}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 950 }}>
          Eğitim Performans Trendi
        </h2>

        <div style={{ height: 280, marginTop: 18 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dashboardTrendData}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke={BRAND.red}
                fill="#fee2e2"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={cardStyle(isMobile)}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 950 }}>
          Eğitim Durum Dağılımı
        </h2>

        <div style={{ height: 280, marginTop: 18 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dashboardPieData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={4}
              >
                {dashboardPieData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={pieColors[index % pieColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}