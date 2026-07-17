export type ExecutiveGrade =
  | "A+"
  | "A"
  | "B"
  | "C"
  | "D";

export type ExecutivePriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface ExecutiveModuleScore {
  key: string;
  title: string;
  score: number;
  weight: number;
  priority: ExecutivePriority;
  trend: number;
}

export interface ExecutiveRecommendation {
  id: string;
  priority: ExecutivePriority;
  title: string;
  description: string;
  dueDays: number;
}

export interface ExecutivePrediction {
  period: string;
  expectedScore: number;
  expectedRisk: number;
}

export interface ExecutiveTimelineItem {
  title: string;
  description: string;
  targetDay: number;
}

export interface ExecutiveSummary {

  overallScore: number;

  grade: ExecutiveGrade;

  maturity: number;

  legalCompliance: number;

  digitalization: number;

  operationalRisk: number;

  modules: ExecutiveModuleScore[];

  recommendations: ExecutiveRecommendation[];

  predictions: ExecutivePrediction[];

  timeline: ExecutiveTimelineItem[];

  executiveText: string;

}