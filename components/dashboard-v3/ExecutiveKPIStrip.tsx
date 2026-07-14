"use client";

import type { DashboardMetric } from "./types";
import KPICardV2 from "./kpi-card-v2";
import styles from "./DashboardV3.module.css";

type ExecutiveKPIStripProps = {
  metrics: DashboardMetric[];
};

export default function ExecutiveKPIStrip({ metrics }: ExecutiveKPIStripProps) {
  return (
    <div className={styles.kpiGridV2}>
      {metrics.map((metric) => (
        <KPICardV2 key={metric.title} {...metric} />
      ))}
    </div>
  );
}
