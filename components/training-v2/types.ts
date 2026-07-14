export interface TrainingExecutiveHeroProps {
  title: string;
  companyName: string;

  totalTrainings: number;
  activeTrainings: number;
  completedTrainings: number;
  pendingTrainings: number;

  certificatesWaiting: number;
  complianceScore: number;

  participantCount: number;

  lastSync: string;

  aiEnabled: boolean;
}

export interface TrainingKpiItem {
  title: string;
  value: string | number;

  color:
    | "blue"
    | "green"
    | "orange"
    | "red"
    | "purple";

  icon: string;

  subtitle?: string;
}

export interface TrainingAnalyticsItem {
  title: string;

  value: number;

  percent: number;

  color: string;
}

export interface TrainingContentStatus {

  video: boolean;

  pdf: boolean;

  exam: boolean;

  certificate: boolean;

}

export interface DoraTrainingItem {

  priority:
    | "critical"
    | "warning"
    | "info";

  title: string;

  description: string;

}