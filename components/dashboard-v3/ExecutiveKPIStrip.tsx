"use client";

import { DashboardGrid, MetricCard } from "@/components/atlas";
import type { DashboardMetric } from "./types";

type ExecutiveKPIStripProps = {
  metrics: DashboardMetric[];
};

export default function ExecutiveKPIStrip({
  metrics,
}: ExecutiveKPIStripProps) {
  return (
    <DashboardGrid columns={4}>
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          icon={metric.icon}
          trend={metric.trend}
          change={metric.change}
          color={metric.color}
          description={metric.description}
          href={metric.href}
        />
      ))}
    </DashboardGrid>
  );
}
