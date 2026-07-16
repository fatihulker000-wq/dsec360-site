export type EmployeeListRow = {
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

  gender?: string | null;
  disability_status?: string | null;

  birth_date?: string | null;

  education_level?: string | null;

  blood_type?: string | null;

  active: boolean;

  training_status?:
    | "COMPLETE"
    | "MISSING"
    | "EXPIRING"
    | "UNKNOWN";

  health_status?:
    | "COMPLETE"
    | "MISSING"
    | "EXPIRING"
    | "UNKNOWN";

  ppe_status?:
    | "COMPLETE"
    | "MISSING"
    | "EXPIRING"
    | "UNKNOWN";

  document_status?:
    | "COMPLETE"
    | "MISSING"
    | "EXPIRING"
    | "UNKNOWN";

  risk_status?:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "UNKNOWN";

  accident_count?: number;
};

export type EmployeeStatusFilter =
  | "all"
  | "active"
  | "passive";

export type EmployeeListFilters = {
  search: string;

  status: EmployeeStatusFilter;

  companyId: string;

  department: string;

  jobTitle: string;
};

export type EmployeeBulkAction =
  | "ACTIVATE"
  | "PASSIVE"
  | "DELETE"
  | "EXPORT_CSV";

export type EmployeeTableSortKey =
  | "full_name"
  | "registry_no"
  | "firm_name"
  | "department"
  | "job_title"
  | "start_date"
  | "active";

export type EmployeeTableSort = {
  key: EmployeeTableSortKey;

  direction:
    | "asc"
    | "desc";
};

export type EmployeeListCompany = {
  id: string;

  name: string;
};