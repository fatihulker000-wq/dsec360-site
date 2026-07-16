export type IncidentWorkflowStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "SKIPPED";

export type IncidentWorkflowStepType =
  | "INVESTIGATION"
  | "RISK_REVISION"
  | "INSPECTION"
  | "TRAINING"
  | "CORRECTIVE_ACTION"
  | "CALENDAR"
  | "NOTIFICATION"
  | "IBYS_PREPARATION";

export type IncidentWorkflowPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface IncidentWorkflowContext {
  incidentId: string;

  incidentNo: string;

  companyId: string;

  companyName?: string;

  title: string;

  description?: string;

  incidentType: string;

  severity: number;

  department?: string;

  location?: string;

  employeeId?: string;

  employeeName?: string;

  occurredAt: string;

  createdBy?: string;

  lostWorkDays?: number;

  isFatal?: boolean;

  isLostTime?: boolean;

  rootCauseCategory?: string;

  equipmentId?: string;

  riskAssessmentId?: string;
}

export interface IncidentWorkflowStep {
  id: string;

  type: IncidentWorkflowStepType;

  title: string;

  description: string;

  status: IncidentWorkflowStatus;

  priority: IncidentWorkflowPriority;

  required: boolean;

  startedAt?: string;

  completedAt?: string;

  failedAt?: string;

  error?: string;

  output?: Record<string, unknown>;
}

export interface IncidentWorkflowResult {
  workflowId: string;

  incidentId: string;

  status: IncidentWorkflowStatus;

  startedAt: string;

  completedAt?: string;

  progress: number;

  steps: IncidentWorkflowStep[];

  errors: string[];

  outputs: {
    investigationId?: string;

    riskRevisionId?: string;

    inspectionId?: string;

    trainingAssignmentIds?: string[];

    correctiveActionIds?: string[];

    calendarEventId?: string;

    notificationIds?: string[];

    ibysPreparationId?: string;
  };
}

export interface IncidentWorkflowOptions {
  createInvestigation: boolean;

  createRiskRevision: boolean;

  createInspection: boolean;

  createTrainingAssignments: boolean;

  createCorrectiveActions: boolean;

  createCalendarTask: boolean;

  sendNotifications: boolean;

  prepareIbys: boolean;
}

export interface IncidentWorkflowEvent {
  id: string;

  workflowId: string;

  incidentId: string;

  stepType: IncidentWorkflowStepType;

  status: IncidentWorkflowStatus;

  message: string;

  createdAt: string;

  createdBy?: string;

  metadata?: Record<string, unknown>;
}