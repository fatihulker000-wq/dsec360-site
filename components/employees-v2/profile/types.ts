export type EmployeeProfileTab =
  | "OVERVIEW"
  | "IDENTITY"
  | "CONTACT"
  | "TRAINING"
  | "HEALTH"
  | "PPE"
  | "RISK"
  | "AUDITS"
  | "ACCIDENTS"
  | "DOCUMENTS"
  | "AGENDA"
  | "SGK"
  | "IBYS"
  | "ACTIVITY";

export type EmployeeProfileStatus =
  | "COMPLETE"
  | "MISSING"
  | "EXPIRING"
  | "UNKNOWN";

export type EmployeeProfileRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "UNKNOWN";

export type EmployeeProfileEmployee = {
  id: string;

  firm_id?: string | null;
  firm_name?: string | null;

  full_name: string;

  department?: string | null;
  job_title?: string | null;

  phone?: string | null;
  email?: string | null;

  registry_no?: string | null;
  tc_no?: string | null;

  start_date?: string | null;
  exit_date?: string | null;

  birth_date?: string | null;

  gender?: string | null;
  disability_status?: string | null;

  education_level?: string | null;

  blood_type?: string | null;

  active: boolean;

  training_status?: EmployeeProfileStatus;
  health_status?: EmployeeProfileStatus;
  ppe_status?: EmployeeProfileStatus;
  document_status?: EmployeeProfileStatus;
  risk_status?: EmployeeProfileRisk;

  training_completion_rate?: number;
  ppe_completion_rate?: number;

  open_risk_count?: number;
  open_action_count?: number;
  accident_count?: number;
  upcoming_count?: number;
};

export type EmployeeProfileModuleItem = {
  id: string;

  title: string;

  description?: string;

  status?: string;

  date?: string;

  meta?: string;
};

export type EmployeeProfileActivity = {
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