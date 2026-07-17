import type {
  ReportEnterpriseDashboardPatch,
  ReportEnterpriseSummary,
} from "./types";

export function mapEnterpriseSummaryToDashboard(
  summary?: ReportEnterpriseSummary | null
): ReportEnterpriseDashboardPatch {

  return {

    totalRisks:
      summary?.risk.total || 0,

    highRiskCount:
      summary?.risk.high || 0,

    mediumRiskCount:
      summary?.risk.medium || 0,

    lowRiskCount:
      summary?.risk.low || 0,

    totalHealthRecords:
      summary?.health.total || 0,

    expiringHealthCount:
      summary?.health.expiring || 0,

    expiredHealthCount:
      summary?.health.expired || 0,

    totalPpeAssignments:
      summary?.ppe.total || 0,

    pendingPpeCount:
      summary?.ppe.pending || 0,

    accidentCount:
      summary?.accident.accident || 0,

    nearMissCount:
      summary?.accident.nearMiss || 0,

    occupationalDiseaseCount:
      summary?.accident.occupationalDisease || 0,

    ibysSuccessCount:
      summary?.ibys.success || 0,

    ibysPendingCount:
      summary?.ibys.pending || 0,

    ibysErrorCount:
      summary?.ibys.error || 0,

  };

}