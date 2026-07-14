"use client";

import type { DashboardActivity } from "@/components/dashboard/types";
import type { CompanyPerformanceItem } from "./CompanyRanking";
import ActivityTimeline from "./ActivityTimeline";
import CompanyRanking from "./CompanyRanking";
import RiskHeatmap from "./RiskHeatmap";
import styles from "./DashboardV3.module.css";

type OperationalInsightsProps = {
  activities: DashboardActivity[];
  riskMatrix: number[][];
  companyPerformance: CompanyPerformanceItem[];
};

export default function OperationalInsights({
  activities,
  riskMatrix,
  companyPerformance,
}: OperationalInsightsProps) {
  return (
    <section>
      <div className={styles.sectionHeading}>
        <div>
          <h2>Operasyon Kontrol Merkezi</h2>
          <p>Risk, firma performansı ve canlı aktivitelerin ortak görünümü.</p>
        </div>
      </div>

      <div className={styles.operationsGrid}>
        <div className={styles.operationsHeatmap}>
          <RiskHeatmap matrix={riskMatrix} />
        </div>

        <div className={styles.operationsRanking}>
          <CompanyRanking companies={companyPerformance} />
        </div>

        <div className={styles.operationsTimeline}>
          <ActivityTimeline activities={activities} />
        </div>
      </div>
    </section>
  );
}
