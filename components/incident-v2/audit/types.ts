export type IncidentAuditAction =
  | "INCIDENT_CREATED"
  | "INCIDENT_UPDATED"
  | "INCIDENT_CLOSED"
  | "INCIDENT_REOPENED"
  | "PHOTO_ADDED"
  | "VIDEO_ADDED"
  | "DOCUMENT_ADDED"
  | "WITNESS_ADDED"
  | "INTERVIEW_ADDED"
  | "INVESTIGATION_STARTED"
  | "INVESTIGATION_COMPLETED"
  | "ROOT_CAUSE_COMPLETED"
  | "CORRECTIVE_ACTION_CREATED"
  | "CORRECTIVE_ACTION_COMPLETED"
  | "RISK_REVISION_CREATED"
  | "INSPECTION_CREATED"
  | "TRAINING_ASSIGNED"
  | "CALENDAR_TASK_CREATED"
  | "SGK_PREPARED"
  | "SGK_SENT"
  | "IBYS_PREPARED"
  | "IBYS_SENT"
  | "APPROVED"
  | "REJECTED"
  | "ARCHIVED"
  | "OTHER";

export type IncidentAuditStatus =
  | "SUCCESS"
  | "INFO"
  | "WARNING"
  | "FAILED";

export type IncidentAuditSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface IncidentAuditLog {
  id: string;

  incidentId: string;

  incidentNo?: string;

  companyId?: string;

  companyName?: string;

  action: IncidentAuditAction;

  title: string;

  description: string;

  status: IncidentAuditStatus;

  severity: IncidentAuditSeverity;

  userId?: string;

  userName: string;

  userRole?: string;

  ipAddress?: string;

  userAgent?: string;

  device?: string;

  module:
    | "INCIDENT"
    | "INVESTIGATION"
    | "EVIDENCE"
    | "CORRECTIVE_ACTION"
    | "RISK"
    | "INSPECTION"
    | "TRAINING"
    | "CALENDAR"
    | "SGK"
    | "IBYS"
    | "SYSTEM";

  beforeData?: Record<string, unknown>;

  afterData?: Record<string, unknown>;

  metadata?: Record<string, unknown>;

  createdAt: string;
}

export interface IncidentAuditFilters {
  incidentId?: string;

  companyId?: string;

  action?: IncidentAuditAction;

  status?: IncidentAuditStatus;

  severity?: IncidentAuditSeverity;

  module?: IncidentAuditLog["module"];

  userName?: string;

  startDate?: string;

  endDate?: string;

  search?: string;
}

export interface IncidentAuditSummary {
  total: number;

  today: number;

  lastSevenDays: number;

  critical: number;

  failed: number;

  successful: number;

  uniqueUsers: number;

  uniqueIncidents: number;
}