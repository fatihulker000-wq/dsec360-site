export type ReportSection = {
  title: string;
  content: string;
};

export type ReportDocument = {
  companyName: string;

  reportTitle: string;

  generatedAt: string;

  score: number;

  executiveSummary: string;

  doraSummary: string;

  sections: ReportSection[];
};