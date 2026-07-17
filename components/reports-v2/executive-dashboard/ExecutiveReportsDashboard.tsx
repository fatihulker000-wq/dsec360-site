"use client";
import { useMemo } from "react";
import ReportExecutiveHero from "./ReportExecutiveHero";
import ReportExecutiveKpiGrid from "./ReportExecutiveKpiGrid";
import ReportModuleScores from "./ReportModuleScores";
import ReportPriorityActions from "./ReportPriorityActions";
import { buildExecutiveReportDashboard } from "./ReportExecutiveUtils";
import type { ExecutiveReportDashboardInput } from "./types";
export default function ExecutiveReportsDashboard({ input }: { input: ExecutiveReportDashboardInput }) {
  const data = useMemo(() => buildExecutiveReportDashboard(input), [input]);
  return <div style={{ display:"grid", gap:17 }}>
    <ReportExecutiveHero data={data} />
    <ReportExecutiveKpiGrid kpis={data.kpis} />
    <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1.4fr) minmax(320px,.8fr)", gap:16, alignItems:"start" }}>
      <ReportModuleScores items={data.moduleScores} />
      <ReportPriorityActions actions={data.priorityActions} />
    </div>
  </div>;
}
