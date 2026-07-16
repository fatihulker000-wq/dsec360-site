export type StageKey =
  | "INITIAL"
  | "EVIDENCE"
  | "WITNESSES"
  | "INTERVIEWS"
  | "ROOT_CAUSE"
  | "ACTIONS"
  | "CONCLUSION";

export type StageStatus =
  | "WAITING"
  | "IN_PROGRESS"
  | "COMPLETED";

export interface IncidentOption {
  id: string;

  incidentNo: string;

  title: string;

  employeeName?: string;

  eventDate?: string;

  department?: string;

  location?: string;

  severity?: number;

  description?: string;
}

export interface Attachment {
  id: string;

  name: string;

  type: string;

  size: number;

  addedAt: string;

  dataUrl?: string;

  category?:
    | "PHOTO"
    | "VIDEO"
    | "AUDIO"
    | "DOCUMENT"
    | "OTHER";
}

export interface Witness {
  id: string;

  fullName: string;

  jobTitle: string;

  phone: string;

  statement: string;

  statementDate: string;

  signed: boolean;

  identityVerified?: boolean;

  cameraRecordAvailable?: boolean;

  attachments: Attachment[];
}

export interface Interview {
  id: string;

  personName: string;

  role: string;

  interviewDate: string;

  startTime?: string;

  endTime?: string;

  interviewer: string;

  notes: string;

  attachments: Attachment[];
}

export interface ActionItem {
  id: string;

  title: string;

  description: string;

  responsible: string;

  priority:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";

  dueDate: string;

  status:
    | "OPEN"
    | "IN_PROGRESS"
    | "COMPLETED";

  closingNote: string;

  attachments: Attachment[];
}

export interface InvestigationLog {
  id: string;

  title: string;

  description?: string;

  createdAt: string;
}

export interface InvestigationFile {
  incidentId: string;

  incidentNo: string;

  incidentTitle: string;

  employeeName?: string;

  eventDate?: string;

  department?: string;

  location?: string;

  severity?: number;

  initial: {
    eventSummary: string;

    firstResponse: string;

    firstObservations: string;

    investigator: string;

    assessmentDate: string;

    attachments: Attachment[];
  };

  evidence: {
    description: string;

    attachments: Attachment[];
  };

  witnesses: Witness[];

  interviews: Interview[];

  rootCause: {
    method:
      | "FIVE_WHY"
      | "FISHBONE"
      | "RCA"
      | "OTHER";

    analysisText: string;

    directCause: string;

    contributingCauses: string;

    systemicCause: string;

    finalRootCause: string;

    attachments: Attachment[];
  };

  actions: ActionItem[];

  conclusion: {
    overallAssessment: string;

    legalAssessment: string;

    recommendations: string;

    recurrencePrevention: string;

    preparedBy: string;

    approvedBy: string;

    sgkNotified?: boolean;

    ibysReady?: boolean;

    actionCreated?: boolean;

    documentsComplete?: boolean;

    managerApproved?: boolean;

    completedAt?: string;
  };

  completed: boolean;

  logs?: InvestigationLog[];

  createdAt: string;

  updatedAt: string;
}