export type TaskType =
  | "TASK"
  | "MEETING"
  | "INSPECTION"
  | "TRAINING"
  | "VISIT"
  | "REMINDER";

export type TaskFilter =
  | "ALL"
  | "OPEN"
  | "DONE"
  | "TODAY"
  | "UPCOMING"
  | "OVERDUE";

export type AgendaTask = {
  id: string;
  sync_key: string | null;
  firm_id: number;
  web_firm_id: string | null;
  title: string;
  note: string | null;
  status: number;
  priority: number;
  progress: number;
  type: TaskType;
  category: string | null;
  due_at: string | null;
  end_at: string | null;
  completed_at: string | null;
  location: string | null;
  meeting_link: string | null;
  assigned_employee_local_id: number | null;
  assigned_employee_remote_id: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  participants_csv: string | null;
  is_all_day: boolean;
  repeat_type: string | null;
  repeat_until: string | null;
  source: string;
  is_archived: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export type CompanyItem = {
  id: string;
  name: string;
  local_firm_id: number | null;
  localId: number | null;
  is_active?: boolean;
};

export type EmployeeItem = {
  id: string;
  firm_id: string | null;
  full_name: string;
  job_title?: string | null;
  email?: string | null;
  phone?: string | null;
  active?: boolean | null;
  local_employee_id?: number | null;
};

export type AgendaResponse = {
  success?: boolean;
  records?: AgendaTask[];
  error?: string;
};

export type CompaniesResponse = {
  data?: CompanyItem[];
  error?: string;
};

export type EmployeesResponse = {
  data?: EmployeeItem[];
  error?: string;
};

export type CreateAgendaRequest = {
  firm_id: number;
  web_firm_id: string;
  title: string;
  note?: string | null;
  type: TaskType;
  priority: number;
  due_at?: string | null;
  end_at?: string | null;
  location?: string | null;
  meeting_link?: string | null;
  assigned_to?: string | null;
  assigned_employee_local_id?: number | null;
  assigned_employee_remote_id?: string | null;
  is_all_day: boolean;
};
