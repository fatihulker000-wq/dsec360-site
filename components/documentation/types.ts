import type { DocumentationRecord } from "@/lib/documentation/types";

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
  | "DRAFT"
  | "ACTIVE"
  | "REVISION"
  | "EXPIRED";

export type DocumentDialogMode =
  | "CREATE"
  | "EDIT"
  | "REVISION";

export type UploadState =
  | "IDLE"
  | "UPLOADING"
  | "SUCCESS"
  | "ERROR";

export interface UploadResult {
    storagePath: string;
    fileUrl: string;

    originalFileName: string;
    storedFileName: string;

    mimeType: string;
    fileSize: number;

    extension?: string;
}

export interface DocumentFormData {
  firmId: string;

  category: DocumentationCategory;

  title: string;

  documentNo: string;

  revisionNo: string;

  department: string;

  preparedBy: string;

  controlledBy: string;

  approvedBy: string;

  publishedAt: string;

  validUntil: string;

  revisionReason: string;

  description: string;

  status: DocumentationStatus;

  file: UploadResult | null;
}

export interface DocumentFormErrors {
  firmId?: string;

  category?: string;

  title?: string;

  documentNo?: string;

  revisionNo?: string;

  preparedBy?: string;

  approvedBy?: string;

  publishedAt?: string;

  validUntil?: string;

  file?: string;

  general?: string;
}

export interface RevisionItem {
  id: string;

  documentId: string;

  revisionNo: string;

  revisionReason: string;

  preparedBy: string;

  approvedBy: string;

  publishedAtMillis: number | null;

  createdAtMillis: number | null;

  fileUrl: string | null;

  isLatest: boolean;
}

export interface CompanyOption {
  id: string;

  name: string;
}

export interface DocumentDialogProps {
  open: boolean;

  mode?: DocumentDialogMode;

  companyId: string;

  companyName?: string;

  record?: DocumentationRecord | null;

  onClose: () => void;

  onSaved: (
    record?: DocumentationRecord
  ) => void | Promise<void>;
}

export interface DocumentUploaderProps {
  firmId: string;

  value: UploadResult | null;

  onChange: (
    value: UploadResult | null
  ) => void;

  disabled?: boolean;

  required?: boolean;

  error?: string;

  maxSizeMb?: number;
}

export interface DocumentPreviewProps {
  open: boolean;

  record: DocumentationRecord | null;

  onClose: () => void;
}

export interface RevisionHistoryDialogProps {
  open: boolean;

  documentId: string | null;

  title?: string;

  onClose: () => void;
}

export interface DocumentActionsProps {
  record: DocumentationRecord;

  onPreview: (
    record: DocumentationRecord
  ) => void;

  onEdit: (
    record: DocumentationRecord
  ) => void;

  onRevision: (
    record: DocumentationRecord
  ) => void;

  onHistory: (
    record: DocumentationRecord
  ) => void;

  onDelete: (
    record: DocumentationRecord
  ) => void;
}