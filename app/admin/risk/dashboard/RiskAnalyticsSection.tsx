"use client";

import type { RiskRecord } from "../types";

import CriticalRisksCard from "./CriticalRisksCard";
import DepartmentRiskChart from "./DepartmentRiskChart";
import RiskTreeCard from "./RiskTreeCard";

type Props = {
  records: RiskRecord[];
  loading?: boolean;
  onOpenRisks?: () => void;
};

export default function RiskAnalyticsSection({
  records,
  loading = false,
  onOpenRisks,
}: Props) {
  return (
    <section
      style={{
        display: "grid",
        gap: 16,
      }}
    >
      <div
        className="riskAnalyticsTwoColumn"
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <DepartmentRiskChart
          records={records}
          loading={loading}
          onSelectDepartment={() => {
            onOpenRisks?.();
          }}
        />

        <CriticalRisksCard
          records={records}
          loading={loading}
          onSelect={() => {
            onOpenRisks?.();
          }}
        />
      </div>

      <RiskTreeCard
        records={records}
        loading={loading}
        onSelect={() => {
          onOpenRisks?.();
        }}
      />

      <style jsx>{`
        @media (max-width: 1000px) {
          .riskAnalyticsTwoColumn {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}