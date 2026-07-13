"use client";

import ChartsSection from "@/components/dashboard/ChartsSection";
import type { CbsSummary, TrendItem } from "@/components/dashboard/types";
import ExecutiveAI from "./ExecutiveAI";
import styles from "./DashboardV3.module.css";

type AnalyticsSectionProps = {
  isMobile: boolean;
  trendData: TrendItem[];
  pieData: { name: string; value: number }[];
  riskCompanies: { name: string; count: number }[];
  completionRate: number;
  inProgressRate: number;
  riskRate: number;
  cbsSummary: CbsSummary | null;
  inspectionSummary?: {
    total?: number;
    completed?: number;
    planned?: number;
    overdue?: number;
  } | null;
  doraInsights: string[];
};

export default function AnalyticsSection({
  isMobile,
  trendData,
  pieData,
  riskCompanies,
  completionRate,
  inProgressRate,
  riskRate,
  cbsSummary,
  inspectionSummary,
  doraInsights,
}: AnalyticsSectionProps) {
  return (
    <section>
      <div className={styles.sectionHeading}>
        <div>
          <h2>Executive Analytics</h2>
          <p>Performans, risk ve operasyon verilerinin bütünleşik görünümü.</p>
        </div>
      </div>

      <div className={styles.analyticsLayout}>
        <div className={styles.analyticsMain}>
          <ChartsSection
            isMobile={isMobile}
            dashboardTrendData={trendData}
            dashboardPieData={pieData}
            groupedRiskCompanies={riskCompanies}
            completionRate={completionRate}
            inProgressRate={inProgressRate}
            riskRate={riskRate}
            cbsSummary={cbsSummary}
            inspectionSummary={inspectionSummary}
          />
        </div>

        <ExecutiveAI insights={doraInsights} />
      </div>
    </section>
  );
}
