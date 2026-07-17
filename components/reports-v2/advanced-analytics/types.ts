export type AnalyticsPeriod = {
  key: string;
  label: string;
};

export type AnalyticsTrendPoint = {
  period: string;
  trainingCompleted: number;
  trainingMissing: number;
  auditsCompleted: number;
  openDof: number;
  closedDof: number;
  highRisk: number;
  mediumRisk: number;
  accident: number;
  nearMiss: number;
};

export type AnalyticsCompanyComparison = {
  companyId: string;
  companyName: string;
  employeeCount: number;
  trainingScore: number;
  auditScore: number;
  riskScore: number;
  overallScore: number;
};

export type AnalyticsHeatmapCell = {
  rowLabel: string;
  columnLabel: string;
  value: number;
};

export type AdvancedAnalyticsResponse = {
  success: boolean;

  data?: {
    periods: AnalyticsPeriod[];
    trends: AnalyticsTrendPoint[];
    comparisons: AnalyticsCompanyComparison[];
    heatmap: AnalyticsHeatmapCell[];
    generatedAt: string;
  };

  error?: string;
};

export type AdvancedAnalyticsDashboardData = {
  periods: AnalyticsPeriod[];
  trends: AnalyticsTrendPoint[];
  comparisons: AnalyticsCompanyComparison[];
  heatmap: AnalyticsHeatmapCell[];
};