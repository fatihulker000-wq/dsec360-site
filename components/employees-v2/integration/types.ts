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

  privacy?: "FULL" | "RESTRICTED";

  details?: Record<string, string | number | boolean | null | undefined>;

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

  health_record_count?: number;
  health_examination_count?: number;
  health_ek2_count?: number;
  health_last_exam_at?: string;
  health_last_ek2_at?: string;
  health_next_due_at?: string;
  health_days_until_due?: number;
  health_details_allowed?: boolean;
  health_privacy_level?: "FULL" | "METADATA_ONLY";

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

  access?: {
    role?: string;
    health_details_allowed?: boolean;
    health_privacy_level?: "FULL" | "METADATA_ONLY";
  };

};

export type EmployeeIntegrationResponse = {

  success: boolean;

  data?: EmployeeIntegrationData;

  error?: string;

};