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

  health_record_count?: number;
  health_examination_count?: number;
  health_ek2_count?: number;
  health_last_exam_at?: string;
  health_last_ek2_at?: string;
  health_next_due_at?: string;
  health_days_until_due?: number;
  health_details_allowed?: boolean;
  health_privacy_level?: "FULL" | "METADATA_ONLY";

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

  privacy?: "FULL" | "RESTRICTED";

  details?: Record<string, string | number | boolean | null | undefined>;
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
export type EmployeeHealthAccess = {
  role?: string;
  detailsAllowed?: boolean;
  privacyLevel?: "FULL" | "METADATA_ONLY";
};
