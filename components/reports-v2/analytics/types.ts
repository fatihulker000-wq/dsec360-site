export type ReportTrendPoint = {
  label: string;
  value: number;
  secondaryValue?: number;
  tertiaryValue?: number;
};

export type ReportComparisonRow = {
  id: string;
  companyName: string;

  overallScore: number;

  trainingScore: number;

  auditScore: number;

  riskScore: number;

  healthScore?: number;

  ppeScore?: number;
};

export type ReportMonthlyChange = {
  key:
    | "TRAINING"
    | "AUDIT"
    | "DOF"
    | "RISK"
    | "ACCIDENT"
    | "HEALTH"
    | "PPE";

  title: string;

  current: number;

  previous: number;

  unit?: string;

  inversePositive?: boolean;
};

export type ReportHeatmapCell = {
  rowLabel: string;

  columnLabel: string;

  value: number;
};

export type ReportAnalyticsData = {

  trainingTrend: ReportTrendPoint[];

  auditTrend: ReportTrendPoint[];

  dofTrend: ReportTrendPoint[];

  accidentTrend: ReportTrendPoint[];

  riskTrend: ReportTrendPoint[];

  healthTrend: ReportTrendPoint[];

  ppeTrend: ReportTrendPoint[];

  companyComparison: ReportComparisonRow[];

  monthlyChanges: ReportMonthlyChange[];

  heatmap: ReportHeatmapCell[];

  generatedAt: string;
};

export type ReportAnalyticsInput =
  Partial<ReportAnalyticsData>;