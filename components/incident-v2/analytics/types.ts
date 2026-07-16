export type IncidentAnalyticsRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type IncidentAnalyticsTrend =
  | "UP"
  | "DOWN"
  | "STABLE";

export interface IncidentAnalyticsRecord {
  id: string | number;

  title: string;

  incidentType: string;

  department: string;

  location: string;

  shift: string;

  severity: number;

  lostWorkDays: number;

  eventDate: string | number;

  injuryBodyPart: string;

  injuryType: string;

  rootCauseCategory: string;

  status: string;

  investigationStatus?: string;

  correctiveActionStatus?: string;

  actionDueDate?: string | null;

  isFatal?: boolean;

  isLostTime?: boolean;

  isMedicalTreatment?: boolean;

  isRestrictedWork?: boolean;

  employeeCount?: number;
}

export interface IncidentAnalyticsMetrics {
  totalIncidents: number;

  workAccidents: number;

  nearMisses: number;

  unsafeConditions: number;

  occupationalDiseases: number;

  fatalities: number;

  lostTimeInjuries: number;

  medicalTreatmentCases: number;

  restrictedWorkCases: number;

  totalLostDays: number;

  openInvestigations: number;

  closedInvestigations: number;

  openCorrectiveActions: number;

  overdueCorrectiveActions: number;

  averageSeverity: number;

  completionRate: number;

  nearMissRate: number;

  aiIncidentScore: number;

  riskLevel: IncidentAnalyticsRiskLevel;

  ltifr: number;

  trir: number;

  frequencyRate: number;

  severityRate: number;
}

export interface IncidentTrendPoint {
  key: string;

  label: string;

  total: number;

  accidents: number;

  nearMisses: number;

  lostDays: number;

  severityAverage: number;
}

export interface IncidentDistributionItem {
  label: string;

  count: number;

  percentage: number;

  score?: number;

  riskLevel?: IncidentAnalyticsRiskLevel;
}

export interface IncidentAnalyticsPrediction {
  next30Days: number;

  next60Days: number;

  next90Days: number;

  repeatProbability: number;

  confidence: number;

  trend: IncidentAnalyticsTrend;
}

export interface IncidentAnalyticsRecommendation {
  id: string;

  title: string;

  description: string;

  action: string;

  priority:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  category:
    | "TRAINING"
    | "INSPECTION"
    | "RISK"
    | "INVESTIGATION"
    | "CORRECTIVE_ACTION"
    | "MANAGEMENT";
}

export interface IncidentAnalyticsData {
  metrics: IncidentAnalyticsMetrics;

  monthlyTrend: IncidentTrendPoint[];

  departmentDistribution: IncidentDistributionItem[];

  rootCauseDistribution: IncidentDistributionItem[];

  bodyPartDistribution: IncidentDistributionItem[];

  shiftDistribution: IncidentDistributionItem[];

  locationDistribution: IncidentDistributionItem[];

  incidentTypeDistribution: IncidentDistributionItem[];

  severityDistribution: IncidentDistributionItem[];

  prediction: IncidentAnalyticsPrediction;

  recommendations: IncidentAnalyticsRecommendation[];
}

export interface IncidentAnalyticsFilters {
  companyId?: string;

  department?: string;

  location?: string;

  incidentType?: string;

  startDate?: string;

  endDate?: string;
}