export type ReportPdfOrientation =
  | "portrait"
  | "landscape";

export type ReportPdfPageSize =
  | "a4"
  | "letter";

export type ReportPdfSignature = {
  preparedBy?: string;

  approvedBy?: string;

  preparedTitle?: string;

  approvedTitle?: string;

  preparedAt?: string;

  approvedAt?: string;
};

export type ReportPdfMetadata = {
  title: string;

  subject?: string;

  author?: string;

  creator?: string;

  keywords?: string[];
};

export type ReportPdfExportOptions = {

  filename: string;

  orientation?: ReportPdfOrientation;

  pageSize?: ReportPdfPageSize;

  marginTopMm?: number;

  marginRightMm?: number;

  marginBottomMm?: number;

  marginLeftMm?: number;

  scale?: number;

  backgroundColor?: string;

  headerText?: string;

  footerText?: string;

  watermark?: string;

  showPageNumbers?: boolean;

  pageNumberFormat?: string;

  reportNo?: string;

  revisionNo?: string;

  verificationCode?: string;

  verificationUrl?: string;

  signature?: ReportPdfSignature;

  metadata?: ReportPdfMetadata;
};

export type ReportPdfExportResult = {

  success: boolean;

  filename: string;

  pageCount: number;

  createdAt: string;

  error?: string;
};

export type ReportPdfVerification = {

  reportNo?: string;

  revisionNo?: string;

  verificationCode?: string;

  verificationUrl?: string;
};