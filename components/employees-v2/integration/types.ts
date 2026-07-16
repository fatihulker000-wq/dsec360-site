export type EmployeeIntegrationStatus =
  | "COMPLETE"
  | "MISSING"
  | "EXPIRING"
  | "UNKNOWN";

export type EmployeeIntegrationRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "UNKNOWN";

export type EmployeeIntegrationItem = {

  id: string;

  title: string;

  description?: string;

  status?: string;

  date?: string;

  meta?: string;

  source?: string;

};

export type EmployeeIntegrationActivity = {

  id: string;

  title: string;

  description?: string;

  date: string;

  category:
    | "EMPLOYEE"
    | "TRAINING"
    | "HEALTH"
    | "PPE"
    | "RISK"
    | "AUDIT"
    | "ACCIDENT"
    | "DOCUMENT"
    | "AGENDA"
    | "SGK"
    | "IBYS";

};

export type EmployeeIntegrationSummary = {

  training_status: EmployeeIntegrationStatus;

  health_status: EmployeeIntegrationStatus;

  ppe_status: EmployeeIntegrationStatus;

  document_status: EmployeeIntegrationStatus;

  risk_status: EmployeeIntegrationRisk;

  training_completion_rate?: number;

  ppe_completion_rate?: number;

  open_risk_count: number;

  open_action_count: number;

  accident_count: number;

  upcoming_count: number;

};

export type EmployeeIntegrationData = {

  employeeId: string;

  summary: EmployeeIntegrationSummary;

  trainingItems: EmployeeIntegrationItem[];

  healthItems: EmployeeIntegrationItem[];

  ppeItems: EmployeeIntegrationItem[];

  riskItems: EmployeeIntegrationItem[];

  auditItems: EmployeeIntegrationItem[];

  accidentItems: EmployeeIntegrationItem[];

  documentItems: EmployeeIntegrationItem[];

  agendaItems: EmployeeIntegrationItem[];

  sgkItems: EmployeeIntegrationItem[];

  ibysItems: EmployeeIntegrationItem[];

  activityItems: EmployeeIntegrationActivity[];

  loadedAt: string;

  warnings?: string[];

};

export type EmployeeIntegrationResponse = {

  success: boolean;

  data?: EmployeeIntegrationData;

  error?: string;

};