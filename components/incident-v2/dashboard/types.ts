export type IncidentAiLevel =
  | "EXCELLENT"
  | "GOOD"
  | "RISKY"
  | "CRITICAL";

export interface IncidentMetrics {

  totalEvents: number;

  accidents: number;

  nearMiss: number;

  dangerousConditions: number;

  occupationalDisease: number;

  firstAidCases: number;

  medicalTreatmentCases: number;

  restrictedWorkCases: number;

  lostTimeInjuries: number;

  fatalities: number;

  totalLostDays: number;

  severityAverage: number;

  openInvestigations: number;

  completedInvestigations: number;

  openCorrectiveActions: number;

  overdueCorrectiveActions: number;

  repeatedEvents: number;

  rootCauseClosedRate: number;

}

export interface IncidentAiScoreResult {

  score: number;

  level: IncidentAiLevel;

  label: string;

  description: string;

}

export interface IncidentKpi {

  title: string;

  value: string | number;

  color:
    | "green"
    | "blue"
    | "orange"
    | "yellow"
    | "red";

}

export interface IncidentTrendItem {

  month: string;

  total: number;

  accident: number;

  nearMiss: number;

}

export interface IncidentDepartmentItem {

  department: string;

  total: number;

}

export interface IncidentRootCauseItem {

  rootCause: string;

  total: number;

}

export interface IncidentInvestigationItem {

  id: string;

  title: string;

  department: string;

  owner: string;

  progress: number;

  status: string;

  day: number;

}

export interface IncidentRecentItem {

  id: string;

  title: string;

  company: string;

  department: string;

  severity: number;

  riskScore: number;

  eventType: string;

}

export interface IncidentDashboardData {

  metrics: IncidentMetrics;

  trend: IncidentTrendItem[];

  departments: IncidentDepartmentItem[];

  rootCauses: IncidentRootCauseItem[];

  investigations: IncidentInvestigationItem[];

  recent: IncidentRecentItem[];

}
