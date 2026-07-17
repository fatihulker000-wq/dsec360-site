export type ExecutiveReportTone =
  | "GOOD"
  | "WARNING"
  | "CRITICAL"
  | "NEUTRAL";

export type ExecutiveReportKpi = {
  key: string;
  title: string;
  value: number | string;
  subtitle?: string;
  tone?: ExecutiveReportTone;
};

export type ExecutiveReportModuleScore = {
  key:
    | "EMPLOYEE"
    | "TRAINING"
    | "AUDIT"
    | "RISK"
    | "HEALTH"
    | "PPE"
    | "ACCIDENT"
    | "IBYS";

  title: string;

  score: number;

  summary: string;

  tone: ExecutiveReportTone;
};

export type ExecutiveReportCompany = {
  id: string;

  name: string;

  companyTitle?: string;

  employeeCount: number;
};

export type ExecutiveReportDashboardData = {

  company: ExecutiveReportCompany;

  kpis: ExecutiveReportKpi[];

  moduleScores: ExecutiveReportModuleScore[];

  overallScore: number;

  overallTone: ExecutiveReportTone;

  executiveSummary: string;

  priorityActions: string[];

  generatedAt: string;
};

export type ExecutiveReportDashboardInput = {

  companyId: string;

  companyName: string;

  companyTitle?: string;

  employeeCount?: number;

  activeEmployeeCount?: number;

  passiveEmployeeCount?: number;

  totalTrainings?: number;

  completedTrainings?: number;

  missingTrainings?: number;

  inProgressTrainings?: number;

  totalAudits?: number;

  completedAudits?: number;

  draftAudits?: number;

  complianceScore?: number;

  nonconformityCount?: number;

  openDofCount?: number;

  closedDofCount?: number;

  totalRisks?: number;

  highRiskCount?: number;

  mediumRiskCount?: number;

  lowRiskCount?: number;

  totalHealthRecords?: number;

  expiringHealthCount?: number;

  expiredHealthCount?: number;

  totalPpeAssignments?: number;

  pendingPpeCount?: number;

  accidentCount?: number;

  nearMissCount?: number;

  occupationalDiseaseCount?: number;

  ibysSuccessCount?: number;

  ibysPendingCount?: number;

  ibysErrorCount?: number;
};