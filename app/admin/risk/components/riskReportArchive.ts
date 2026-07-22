import type { RiskRecord } from "../types";
import { createRiskReportNo } from "./riskClassicReport";

export type ArchivedRiskReport = {
  id: string;
  reportNo: string;
  companyName: string;
  createdAt: number;
  revision: number;
  records: RiskRecord[];
  pdfFileName?: string;
};

const STORAGE_KEY = "dsec_risk_report_archive_v1";

function readAll(): ArchivedRiskReport[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: ArchivedRiskReport[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listRiskReportArchive() {
  return readAll().sort((a, b) => b.createdAt - a.createdAt);
}

export function archiveRiskReport(
  records: RiskRecord[],
  companyName: string,
  reportNo = createRiskReportNo()
) {
  const current = readAll();

  const item: ArchivedRiskReport = {
    id: crypto.randomUUID(),
    reportNo,
    companyName,
    createdAt: Date.now(),
    revision: 1,
    records,
  };

  writeAll([item, ...current]);
  return item;
}

export function attachPdfToArchive(
  reportNo: string,
  fileName: string
) {
  const current = readAll();

  writeAll(
    current.map((item) =>
      item.reportNo === reportNo
        ? { ...item, pdfFileName: fileName }
        : item
    )
  );
}

export function deleteArchivedRiskReport(id: string) {
  writeAll(readAll().filter((item) => item.id !== id));
}

export function downloadRiskReportPackage(
  report: ArchivedRiskReport
) {
  const blob = new Blob(
    [JSON.stringify(report, null, 2)],
    { type: "application/json;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${report.reportNo}.dsec-risk.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function readRiskReportPackage(
  file: File
): Promise<ArchivedRiskReport> {
  const content = await file.text();
  const parsed = JSON.parse(content) as ArchivedRiskReport;

  if (
    !parsed ||
    !parsed.reportNo ||
    !Array.isArray(parsed.records)
  ) {
    throw new Error("Geçersiz D-SEC risk rapor paketi.");
  }

  return parsed;
}

export function saveUploadedRiskReportPackage(
  report: ArchivedRiskReport
) {
  const current = readAll();
  const withoutSame = current.filter(
    (item) => item.reportNo !== report.reportNo
  );

  writeAll([report, ...withoutSame]);
}