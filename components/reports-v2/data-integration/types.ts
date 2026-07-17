export type ReportDataWarning = {
  source: string;
  message: string;
};

export type ReportRiskSummary = {
  total: number;
  high: number;
  medium: number;
  low: number;
  open: number;
};

export type ReportHealthSummary = {
  total: number;
  expired: number;
  expiring: number;
  complete: number;
};

export type ReportPpeSummary = {
  total: number;
  pending: number;
  complete: number;
};

export type ReportAccidentSummary = {
  total: number;
  accident: number;
  nearMiss: number;
  occupationalDisease: number;
};

export type ReportIbysSummary = {
  total: number;
  success: number;
  pending: number;
  error: number;
};

export type ReportEnterpriseSummary = {
  companyId: string;

  employeeCount: number;

  risk: ReportRiskSummary;

  health: ReportHealthSummary;

  ppe: ReportPpeSummary;

  accident: ReportAccidentSummary;

  ibys: ReportIbysSummary;

  warnings: ReportDataWarning[];

  loadedAt: string;
};

export type ReportEnterpriseSummaryResponse = {
  success: boolean;

  data?: ReportEnterpriseSummary;

  error?: string;
};

export type ReportEnterpriseDashboardPatch = {

  totalRisks: number;

  highRiskCount: number;

  mediumRiskCount: number;

  lowRiskCount: number;

  totalHealthRecords: number;

  expiringHealthCount: number;

  expiredHealthCount: number;

  totalPpeAssignments: number;

  pendingPpeCount: number;

  accidentCount: number;

  nearMissCount: number;

  occupationalDiseaseCount: number;

  ibysSuccessCount: number;

  ibysPendingCount: number;

  ibysErrorCount: number;
};