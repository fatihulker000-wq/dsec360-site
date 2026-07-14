export interface ExecutiveStatItem {
  label: string;
  value: string | number;
  tone?:
    | "blue"
    | "green"
    | "amber"
    | "red"
    | "purple"
    | "slate";
}

export interface ExecutiveHeroProps {
  title: string;
  subtitle: string;

  healthScore: number;

  activeFirm: string;

  inspectionCount: number;

  openDof: number;

  criticalCount: number;

  aiScore: number;

  lastSync: string;

  status:
    | "ONLINE"
    | "OFFLINE";

  stats: ExecutiveStatItem[];
}

export interface InspectionFirmOption {
  id: string;
  name: string;
}

export interface InspectionKpiItem {
  title: string;

  value: string | number;

  description?: string;

  href?: string;

  trend?: number;

  trendLabel?: string;

  badge?: string;

  tone?:
    | "blue"
    | "green"
    | "amber"
    | "red"
    | "purple"
    | "slate";
}

export interface AnalyticsItem {
  title: string;

  value: number;

  percent: number;

  tone:
    | "blue"
    | "green"
    | "amber"
    | "red"
    | "purple"
    | "slate";
}

export interface CompanyPerformanceItem {
  company: string;

  score: number;

  inspections: number;

  answers: number;
}

export interface DofViewItem {
  id: string;

  title: string;

  note: string;

  firmName: string;

  mode: string;

  status:
    | "OPEN"
    | "CLOSED";

  critical: boolean;

  createdAt?: string;
}

export interface InspectionViewItem {
  id: number;

  firmName: string;

  mode: string;

  modeBg: string;

  modeColor: string;

  template: string;

  inspector: string;

  date: string;

  answerCount: number;

  dofCount: number;

  score?: number;

  photoCount?: number;
}