import type {
  EmployeeIntegrationData,
  EmployeeIntegrationStatus,
} from "../integration/types";

export type DoraEmployeeRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type DoraEmployeePriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type DoraEmployeeRecommendationCategory =
  | "TRAINING"
  | "HEALTH"
  | "PPE"
  | "RISK"
  | "ACCIDENT"
  | "DOCUMENT"
  | "AGENDA"
  | "SGK"
  | "IBYS"
  | "DATA_QUALITY";

export type DoraEmployeeRecommendation = {
  id: string;

  title: string;

  description: string;

  action: string;

  category: DoraEmployeeRecommendationCategory;

  priority: DoraEmployeePriority;

  scoreImpact: number;
};

export type DoraEmployeeMetric = {
  key:
    | "TRAINING"
    | "HEALTH"
    | "PPE"
    | "RISK"
    | "ACCIDENT"
    | "DOCUMENT"
    | "UPCOMING"
    | "DATA";

  title: string;

  value: string;

  score: number;

  weight: number;

 status:
  | EmployeeIntegrationStatus
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";
  explanation: string;
};

export type DoraEmployeeAnalysis = {
  employeeId: string;

  score: number;

  riskLevel: DoraEmployeeRiskLevel;

  confidence: number;

  headline: string;

  summary: string;

  metrics: DoraEmployeeMetric[];

  recommendations: DoraEmployeeRecommendation[];

  positiveSignals: string[];

  riskSignals: string[];

  generatedAt: string;
};

export type DoraEmployeeAnalysisInput = {
  employeeId: string;

  employeeName: string;

  jobTitle?: string | null;

  department?: string | null;

  integration?: EmployeeIntegrationData | null;

  missingProfileFields?: string[];

  active?: boolean;
};