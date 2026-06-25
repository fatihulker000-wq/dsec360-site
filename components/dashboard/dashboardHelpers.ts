import type {
  Training,
  DashboardSummary,
  CbsSummary,
} from "./types";

export function calculateTotals(trainings: Training[]) {
  let assigned = 0;
  let completed = 0;
  let notStarted = 0;
  let inProgress = 0;

  trainings.forEach((t) => {
    assigned += Number(t.assigned_count || 0);
    completed += Number(t.completed_count || 0);
    notStarted += Number(t.not_started_count || 0);
    inProgress += Number(t.in_progress_count || 0);
  });

  return {
    assigned,
    completed,
    notStarted,
    inProgress,
  };
}

export function calculateRates(
  summary: DashboardSummary | null,
  totals: {
    assigned: number;
    completed: number;
    notStarted: number;
    inProgress: number;
  }
) {
  const completionRate =
    summary?.completion_rate ??
    (totals.assigned
      ? Number(((totals.completed / totals.assigned) * 100).toFixed(2))
      : 0);

  const inProgressRate =
    summary?.in_progress_rate ??
    (totals.assigned
      ? Number(((totals.inProgress / totals.assigned) * 100).toFixed(2))
      : 0);

  const riskRate =
    summary?.risk_rate ??
    (totals.assigned
      ? Number(((totals.notStarted / totals.assigned) * 100).toFixed(2))
      : 0);

  const riskStatus =
    summary?.risk_status ??
    (totals.notStarted > 20
      ? "KRITIK"
      : totals.notStarted > 10
      ? "ORTA"
      : "IYI");

  return {
    completionRate,
    inProgressRate,
    riskRate,
    riskStatus,
  };
}

export function buildCeoSummary({
  trainings,
  summary,
  totals,
  cbsSummary,
  riskRate,
}: {
  trainings: Training[];
  summary: DashboardSummary | null;
  totals: {
    assigned: number;
    completed: number;
    notStarted: number;
    inProgress: number;
  };
  cbsSummary: CbsSummary | null;
  riskRate: number;
}) {
  const totalTrainings = trainings.length;
  const totalAssignments = summary?.total_assignments ?? totals.assigned;
  const totalCompleted = summary?.completed_count ?? totals.completed;
  const totalInProgress = summary?.in_progress_count ?? totals.inProgress;
  const totalNotStarted = summary?.not_started_count ?? totals.notStarted;

  const cbsTotal = cbsSummary?.total || 0;
  const cbsOpen =
    (cbsSummary?.new || 0) +
    (cbsSummary?.processing || 0) +
    (cbsSummary?.read || 0);

  const cbsClosed = cbsSummary?.closed || 0;
  const cbsSla = cbsSummary?.slaExceeded || 0;

  const executiveRiskScore = Math.min(
    100,
    Math.round(
      riskRate * 0.45 +
        (cbsSla > 0 ? 25 : 0) +
        (cbsOpen > cbsClosed ? 15 : 0) +
        (totalNotStarted > totalCompleted ? 15 : 0)
    )
  );

  const healthLabel =
    executiveRiskScore >= 70
      ? "Kritik"
      : executiveRiskScore >= 40
      ? "Dikkat"
      : "Sağlıklı";

  return {
    totalTrainings,
    totalAssignments,
    totalCompleted,
    totalInProgress,
    totalNotStarted,
    cbsTotal,
    cbsOpen,
    cbsClosed,
    cbsSla,
    executiveRiskScore,
    healthLabel,
  };
}