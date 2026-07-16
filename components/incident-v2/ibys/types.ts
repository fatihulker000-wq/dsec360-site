export type IbysPreparationStatus =
  | "NOT_REQUIRED"
  | "DRAFT"
  | "MISSING_INFORMATION"
  | "READY"
  | "SENT"
  | "FAILED";

export type IbysIncidentType =
  | "WORK_ACCIDENT"
  | "NEAR_MISS"
  | "OCCUPATIONAL_DISEASE"
  | "UNSAFE_CONDITION"
  | "ENVIRONMENTAL_INCIDENT"
  | "OTHER";

export interface IbysIncidentRecord {
  incidentId: string;

  incidentNo: string;

  companyId: string;

  companyName: string;

  workplaceSgkNo: string;

  naceCode?: string;

  employeeId?: string;

  employeeName: string;

  employeeTcNo: string;

  incidentType: IbysIncidentType;

  incidentDate: string;

  incidentTime: string;

  department: string;

  location: string;

  description: string;

  severity: number;

  lostDay: number;

  fatal: boolean;

  hospitalTransfer: boolean;

  investigationCompleted: boolean;

  rootCauseCompleted: boolean;

  correctiveActionCreated: boolean;

  preparedAt?: string;

  sentAt?: string;

  externalReferenceNo?: string;

  errorMessage?: string;

  missingFields: string[];

  status: IbysPreparationStatus;
}

export interface IbysDashboardSummary {
  total: number;

  draft: number;

  missing: number;

  ready: number;

  sent: number;

  failed: number;
}

export interface IbysValidationResult {
  valid: boolean;

  required: boolean;

  missingFields: string[];

  warnings: string[];

  completionRate: number;
}

export interface IbysIncidentPayload {
  sourceSystem: "D-SEC";

  sourceVersion: "2";

  generatedAt: string;

  incident: {
    localIncidentId: string;

    incidentNo: string;

    companyId: string;

    companyName: string;

    workplaceSgkNo: string;

    naceCode?: string;

    incidentType: IbysIncidentType;

    incidentDate: string;

    incidentTime: string;

    department: string;

    location: string;

    description: string;

    severity: number;

    lostDay: number;

    fatal: boolean;

    hospitalTransfer: boolean;
  };

  employee: {
    employeeId?: string;

    fullName: string;

    tcNo: string;
  };

  process: {
    investigationCompleted: boolean;

    rootCauseCompleted: boolean;

    correctiveActionCreated: boolean;
  };
}