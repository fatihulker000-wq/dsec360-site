export type PdfCoverInfo = {
  reportNo: string;

  revisionNo: string;

  companyName: string;

  reportTitle: string;

  generatedAt: string;

  preparedBy?: string;

  approvedBy?: string;

  score: number;
};

export type PdfAttachment = {
  title: string;

  description?: string;
};

export type PdfProDocument = {

  cover: PdfCoverInfo;

  executiveSummary: string;

  doraSummary: string;

  recommendations: string[];

  legalReferences: string[];

  attachments: PdfAttachment[];

  qrValue?: string;

  watermark?: string;
};