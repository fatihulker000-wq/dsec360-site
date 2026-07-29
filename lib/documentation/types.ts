export type DocumentationCategory =
  | "TRAINING"
  | "INSPECTION"
  | "RISK"
  | "FORMS"
  | "INSTRUCTIONS"
  | "BOARD"
  | "EMPLOYEE_REPRESENTATIVE"
  | "PERIODIC_CONTROL";

export type DocumentationStatus =
  | "ACTIVE"
  | "REVISION"
  | "EXPIRED"
  | "DRAFT"
  | "ARCHIVED";

export type DocumentationFileType =
  | "PDF"
  | "DOC"
  | "DOCX"
  | "XLS"
  | "XLSX"
  | "PPT"
  | "PPTX"
  | "IMAGE"
  | "OTHER";

export type DocumentationRecord = {
  id: string;

  firmId: string;

  localFirmId?: number | null;

  syncKey?: string;

  category: DocumentationCategory;

  title: string;

  description?: string;

  documentNo: string;

  revisionNo: string;

  preparedBy: string;

  approvedBy: string;

  department?: string;

  fileName?: string;

  fileUrl?: string | null;

  fileType?: DocumentationFileType | null;

  fileSizeBytes?: number | null;

  publishedAtMillis: number | null;

  validUntilMillis: number | null;

  revisionDateMillis?: number | null;

  status: DocumentationStatus;

  tags?: string[];

  notes?: string;

  readApprovalRequired?: boolean;

  qrEnabled?: boolean;

  source?: "APP" | "WEB";

  version?: number;

  syncStatus?: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";

  syncError?: string | null;

  lastSyncedAtMillis?: number | null;

  isDeleted?: boolean;

  deletedAtMillis?: number | null;

  createdAtMillis: number;

  updatedAtMillis: number;
};

export type DocumentationRevision = {
  id: string;

  documentationId: string;

  firmId: string;

  revisionNo: string;

  revisionDateMillis: number;

  revisionReason: string;

  preparedBy: string;

  approvedBy: string;

  fileName?: string;

  fileUrl?: string | null;

  createdAtMillis: number;
};

export type DocumentationReadApproval = {
  id: string;

  documentationId: string;

  firmId: string;

  employeeId?: string | null;

  employeeName: string;

  approved: boolean;

  approvedAtMillis?: number | null;

  createdAtMillis: number;
};

export type DocumentationDashboard = {
  total: number;

  active: number;

  revision: number;

  expired: number;

  draft: number;

  archived: number;

  revisionSoon: number;

  readApprovalWaiting: number;

  fileCount: number;
};

export type DocumentationBundle = {
  records: DocumentationRecord[];

  revisions: DocumentationRevision[];

  readApprovals: DocumentationReadApproval[];

  dashboard: DocumentationDashboard;
};

export type DocumentationSavePayload = Partial<
  DocumentationRecord
> & {
  firmId: string;

  category: DocumentationCategory;

  title: string;

  documentNo: string;
};