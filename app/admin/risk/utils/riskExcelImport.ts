"use client";

export type ImportedRiskMethod = "MATRIX" | "FINE_KINNEY";
export type ImportedDofStatus = "OPEN" | "CLOSED";

export type ImportedRiskRow = {
  rowNumber: number;
  method: ImportedRiskMethod;
  companyId: string;
  title: string;
  hazard: string;
  consequence: string;
  control: string;
  probability: number;
  severity: number;
  probabilityValue: number;
  frequencyValue: number;
  severityValue: number;
  department: string;
  location: string;
  machine: string;
  responsible: string;
  dofStatus: ImportedDofStatus;
  dofAction: string;
  dofResponsible: string;
  dofDueDate: string;
  dofNote: string;
  valid: boolean;
  errors: string[];
};

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[İIı]/g, "i")
    .replace(/[Şş]/g, "s")
    .replace(/[Ğğ]/g, "g")
    .replace(/[Üü]/g, "u")
    .replace(/[Öö]/g, "o")
    .replace(/[Çç]/g, "c")
    .replace(/\s+/g, " ");
}

function readValue(
  row: Record<string, unknown>,
  aliases: string[]
) {
  const entries = Object.entries(row);

  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    const match = entries.find(
      ([key]) => normalizeHeader(key) === normalizedAlias
    );

    if (match) {
      return match[1];
    }
  }

  return "";
}

function toNumber(value: unknown, fallback = 0) {
  const normalized = String(value ?? "")
    .trim()
    .replace(",", ".");

  const number = Number(normalized);

  return Number.isFinite(number) ? number : fallback;
}

function normalizeMethod(value: unknown): ImportedRiskMethod {
  const text = normalizeHeader(value);

  if (
    text.includes("fine") ||
    text.includes("kinney") ||
    text === "fk"
  ) {
    return "FINE_KINNEY";
  }

  return "MATRIX";
}

function normalizeDofStatus(value: unknown): ImportedDofStatus {
  const text = normalizeHeader(value);

  if (
    text === "kapali" ||
    text === "closed" ||
    text === "tamamlandi"
  ) {
    return "CLOSED";
  }

  return "OPEN";
}

function normalizeDate(value: unknown) {
  if (!value) return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    const epoch = new Date(
      Math.round((value - 25569) * 86400 * 1000)
    );

    if (!Number.isNaN(epoch.getTime())) {
      return epoch.toISOString().slice(0, 10);
    }
  }

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const trMatch = text.match(
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/
  );

  if (trMatch) {
    const [, day, month, year] = trMatch;

    return `${year}-${month.padStart(2, "0")}-${day.padStart(
      2,
      "0"
    )}`;
  }

  const date = new Date(text);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toISOString().slice(0, 10);
}

export async function parseRiskExcel(
  file: File
): Promise<ImportedRiskRow[]> {
  const XLSX = await import("xlsx-js-style");

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("Excel dosyasında çalışma sayfası bulunamadı.");
  }

  const sheet = workbook.Sheets[firstSheetName];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    sheet,
    {
      defval: "",
      raw: false,
    }
  );

  return rows.map((row, index) => {
    const method = normalizeMethod(
      readValue(row, ["Yöntem", "Method", "Risk Yöntemi"])
    );

    const title = String(
      readValue(row, [
        "Risk Başlığı",
        "Başlık",
        "Title",
        "Risk",
      ])
    ).trim();

    const hazard = String(
      readValue(row, ["Tehlike", "Hazard"])
    ).trim();

    const probability = toNumber(
      readValue(row, ["Olasılık", "Probability"]),
      1
    );

    const severity = toNumber(
      readValue(row, ["Şiddet", "Severity"]),
      1
    );

    const probabilityValue = toNumber(
      readValue(row, [
        "FK Olasılık",
        "Fine Kinney Olasılık",
        "Probability Value",
      ]),
      1
    );

    const frequencyValue = toNumber(
      readValue(row, [
        "FK Frekans",
        "Fine Kinney Frekans",
        "Frequency Value",
      ]),
      1
    );

    const severityValue = toNumber(
      readValue(row, [
        "FK Şiddet",
        "Fine Kinney Şiddet",
        "Severity Value",
      ]),
      1
    );

    const errors: string[] = [];

    if (!title) {
      errors.push("Risk başlığı eksik.");
    }

    if (!hazard) {
      errors.push("Tehlike alanı eksik.");
    }

    if (
      method === "MATRIX" &&
      (
        probability < 1 ||
        probability > 5 ||
        severity < 1 ||
        severity > 5
      )
    ) {
      errors.push("5x5 olasılık ve şiddet 1-5 arasında olmalıdır.");
    }

    if (
      method === "FINE_KINNEY" &&
      (
        probabilityValue < 0 ||
        frequencyValue < 0 ||
        severityValue < 0
      )
    ) {
      errors.push("Fine-Kinney değerleri negatif olamaz.");
    }

    return {
      rowNumber: index + 2,
      method,
      companyId: String(
        readValue(row, [
          "Firma",
          "Firma ID",
          "Company",
          "Company ID",
        ])
      ).trim(),
      title,
      hazard,
      consequence: String(
        readValue(row, ["Olası Sonuç", "Sonuç", "Consequence"])
      ).trim(),
      control: String(
        readValue(row, [
          "Mevcut / Önerilen Kontrol",
          "Kontrol",
          "Control",
        ])
      ).trim(),
      probability,
      severity,
      probabilityValue,
      frequencyValue,
      severityValue,
      department: String(
        readValue(row, ["Bölüm", "Department"])
      ).trim(),
      location: String(
        readValue(row, ["Lokasyon", "Location"])
      ).trim(),
      machine: String(
        readValue(row, [
          "Makine / Ekipman",
          "Makine",
          "Ekipman",
          "Machine",
        ])
      ).trim(),
      responsible: String(
        readValue(row, ["Sorumlu", "Responsible"])
      ).trim(),
      dofStatus: normalizeDofStatus(
        readValue(row, ["DÖF Durumu", "DOF Durumu", "Status"])
      ),
      dofAction: String(
        readValue(row, ["DÖF Aksiyonu", "DOF Aksiyonu"])
      ).trim(),
      dofResponsible: String(
        readValue(row, [
          "DÖF Sorumlusu",
          "DOF Sorumlusu",
        ])
      ).trim(),
      dofDueDate: normalizeDate(
        readValue(row, [
          "DÖF Termin",
          "DÖF Termin Tarihi",
          "Termin Tarihi",
        ])
      ),
      dofNote: String(
        readValue(row, ["DÖF Notu", "DOF Notu", "Not"])
      ).trim(),
      valid: errors.length === 0,
      errors,
    };
  });
}