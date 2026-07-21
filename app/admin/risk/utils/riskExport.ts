export type RiskExportRecord = {
  id: string;
  company: string;
  title: string;
  hazard: string;
  consequence?: string | null;
  control?: string | null;
  method: "MATRIX" | "FINE_KINNEY";
  probability?: number | null;
  severity?: number | null;
  probabilityValue?: number | null;
  frequencyValue?: number | null;
  severityValue?: number | null;
  score: number;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  department?: string | null;
  responsible?: string | null;
  dofStatus: "OPEN" | "CLOSED";
  dofDueDate?: string | null;
  source?: "APP" | "WEB" | "MERGED";
  updatedAt: string;
};

const LEVEL_LABELS: Record<RiskExportRecord["level"], string> = {
  LOW: "Düşük",
  MEDIUM: "Orta",
  HIGH: "Yüksek",
  CRITICAL: "Kritik",
};

const METHOD_LABELS: Record<RiskExportRecord["method"], string> = {
  MATRIX: "5x5 Matris",
  FINE_KINNEY: "Fine-Kinney",
};

function escapeCsv(value: unknown) {
  const text = String(value ?? "");

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function formatDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function exportRisksToCsv(
  records: RiskExportRecord[],
  fileName = "DSEC_Risk_Listesi"
) {
  const headers = [
    "Risk ID",
    "Firma",
    "Risk Başlığı",
    "Tehlike",
    "Olası Sonuç",
    "Mevcut Kontrol",
    "Yöntem",
    "Olasılık",
    "Şiddet",
    "Fine-Kinney Olasılık",
    "Fine-Kinney Frekans",
    "Fine-Kinney Şiddet",
    "Risk Skoru",
    "Risk Seviyesi",
    "Bölüm",
    "Sorumlu",
    "DÖF Durumu",
    "DÖF Termin Tarihi",
    "Kaynak",
    "Güncelleme Tarihi",
  ];

  const rows = records.map((record) => [
    record.id,
    record.company,
    record.title,
    record.hazard,
    record.consequence || "",
    record.control || "",
    METHOD_LABELS[record.method],
    record.probability ?? "",
    record.severity ?? "",
    record.probabilityValue ?? "",
    record.frequencyValue ?? "",
    record.severityValue ?? "",
    record.score,
    LEVEL_LABELS[record.level],
    record.department || "",
    record.responsible || "",
    record.dofStatus === "CLOSED" ? "Kapalı" : "Açık",
    formatDate(record.dofDueDate),
    record.source || "",
    formatDate(record.updatedAt),
  ]);

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStamp = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `${fileName}_${dateStamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}