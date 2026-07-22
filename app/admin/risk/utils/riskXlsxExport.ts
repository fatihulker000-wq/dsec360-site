"use client";

export type RiskXlsxLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskXlsxMethod = "MATRIX" | "FINE_KINNEY";
export type RiskXlsxDofStatus = "OPEN" | "CLOSED";

export type RiskXlsxRecord = {
  id: string;
  company: string;
  title: string;
  hazard: string;
  consequence?: string | null;
  control?: string | null;
  method: RiskXlsxMethod;
  probability?: number | null;
  severity?: number | null;
  probabilityValue?: number | null;
  frequencyValue?: number | null;
  severityValue?: number | null;
  score: number;
  level: RiskXlsxLevel;
  department?: string | null;
  responsible?: string | null;
  dofStatus: RiskXlsxDofStatus;
  dofDueDate?: string | null;
  source?: "APP" | "WEB" | "MERGED";
  updatedAt: string;
};

const LEVEL_LABELS: Record<RiskXlsxLevel, string> = {
  LOW: "Düşük",
  MEDIUM: "Orta",
  HIGH: "Yüksek",
  CRITICAL: "Kritik",
};

const METHOD_LABELS: Record<RiskXlsxMethod, string> = {
  MATRIX: "5x5 Matris",
  FINE_KINNEY: "Fine-Kinney",
};

const LEVEL_STYLE: Record<
  RiskXlsxLevel,
  { fill: string; font: string }
> = {
  LOW: { fill: "DCFCE7", font: "166534" },
  MEDIUM: { fill: "FEF3C7", font: "92400E" },
  HIGH: { fill: "FFEDD5", font: "C2410C" },
  CRITICAL: { fill: "FEE2E2", font: "B91C1C" },
};

function formatDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function applyHeaderStyle(
  sheet: Record<string, any>,
  columns: number,
  row = 1
) {
  const XLSXRange = {
    s: { r: row - 1, c: 0 },
    e: { r: row - 1, c: columns - 1 },
  };

  for (
    let column = XLSXRange.s.c;
    column <= XLSXRange.e.c;
    column += 1
  ) {
    const address = String.fromCharCode(65 + column) + row;
    const cell = sheet[address];

    if (!cell) continue;

    cell.s = {
      fill: {
        patternType: "solid",
        fgColor: { rgb: "6B1020" },
      },
      font: {
        bold: true,
        color: { rgb: "FFFFFF" },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "D1D5DB" } },
        bottom: { style: "thin", color: { rgb: "D1D5DB" } },
        left: { style: "thin", color: { rgb: "D1D5DB" } },
        right: { style: "thin", color: { rgb: "D1D5DB" } },
      },
    };
  }
}

function applyBodyBorders(
  sheet: Record<string, any>,
  rowCount: number,
  columnCount: number
) {
  for (let row = 2; row <= rowCount; row += 1) {
    for (let column = 0; column < columnCount; column += 1) {
      const address = String.fromCharCode(65 + column) + row;
      const cell = sheet[address];

      if (!cell) continue;

      cell.s = {
        ...(cell.s || {}),
        alignment: {
          vertical: "top",
          wrapText: true,
        },
        border: {
          top: { style: "thin", color: { rgb: "E5E7EB" } },
          bottom: { style: "thin", color: { rgb: "E5E7EB" } },
          left: { style: "thin", color: { rgb: "E5E7EB" } },
          right: { style: "thin", color: { rgb: "E5E7EB" } },
        },
      };
    }
  }
}

export async function exportRisksToXlsx(
  records: RiskXlsxRecord[],
  fileName = "DSEC_Risk_Yonetimi"
) {
  const XLSX = await import("xlsx-js-style");

  const workbook = XLSX.utils.book_new();
  workbook.Props = {
    Title: "D-SEC Risk Yönetimi Raporu",
    Subject: "Risk, DÖF, HeatMap ve İstatistik Raporu",
    Author: "D-SEC",
    Company: "D-SEC Sağlık Emniyet Çevre Yönetimi",
    CreatedDate: new Date(),
  };

  // ----------------------------------------------------------
  // 1. RİSKLER
  // ----------------------------------------------------------
  const riskRows = records.map((record) => ({
    "Risk ID": record.id,
    Firma: record.company,
    "Risk Başlığı": record.title,
    Tehlike: record.hazard,
    "Olası Sonuç": record.consequence || "",
    "Mevcut / Önerilen Kontrol": record.control || "",
    Yöntem: METHOD_LABELS[record.method],
    Olasılık: record.probability ?? "",
    Şiddet: record.severity ?? "",
    "FK Olasılık": record.probabilityValue ?? "",
    "FK Frekans": record.frequencyValue ?? "",
    "FK Şiddet": record.severityValue ?? "",
    "Risk Skoru": record.score,
    "Risk Seviyesi": LEVEL_LABELS[record.level],
    Bölüm: record.department || "",
    Sorumlu: record.responsible || "",
    "DÖF Durumu":
      record.dofStatus === "CLOSED" ? "Kapalı" : "Açık",
    "DÖF Termin": formatDate(record.dofDueDate),
    Kaynak: record.source || "",
    Güncelleme: formatDate(record.updatedAt),
  }));

  const risksSheet = XLSX.utils.json_to_sheet(riskRows);
  applyHeaderStyle(risksSheet, 20);
  applyBodyBorders(risksSheet, riskRows.length + 1, 20);

  riskRows.forEach((_, index) => {
    const record = records[index];
    const row = index + 2;
    const levelCell = risksSheet[`N${row}`];

    if (levelCell) {
      const style = LEVEL_STYLE[record.level];

      levelCell.s = {
        ...(levelCell.s || {}),
        fill: {
          patternType: "solid",
          fgColor: { rgb: style.fill },
        },
        font: {
          bold: true,
          color: { rgb: style.font },
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
        },
      };
    }
  });

  risksSheet["!cols"] = [
    { wch: 18 },
    { wch: 24 },
    { wch: 34 },
    { wch: 32 },
    { wch: 34 },
    { wch: 40 },
    { wch: 18 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
  ];
  risksSheet["!autofilter"] = { ref: `A1:T${riskRows.length + 1}` };

  XLSX.utils.book_append_sheet(workbook, risksSheet, "Riskler");

  // ----------------------------------------------------------
  // 2. DÖF
  // ----------------------------------------------------------
  const dofRows = records.map((record) => ({
    Firma: record.company,
    "Risk Başlığı": record.title,
    "Risk Seviyesi": LEVEL_LABELS[record.level],
    "Risk Skoru": record.score,
    "DÖF Durumu":
      record.dofStatus === "CLOSED" ? "Kapalı" : "Açık",
    "Termin Tarihi": formatDate(record.dofDueDate),
    Sorumlu: record.responsible || "",
    Bölüm: record.department || "",
    Kaynak: record.source || "",
    Güncelleme: formatDate(record.updatedAt),
  }));

  const dofSheet = XLSX.utils.json_to_sheet(dofRows);
  applyHeaderStyle(dofSheet, 10);
  applyBodyBorders(dofSheet, dofRows.length + 1, 10);

  dofRows.forEach((_, index) => {
    const row = index + 2;
    const statusCell = dofSheet[`E${row}`];

    if (statusCell) {
      const closed = records[index].dofStatus === "CLOSED";

      statusCell.s = {
        ...(statusCell.s || {}),
        fill: {
          patternType: "solid",
          fgColor: { rgb: closed ? "DCFCE7" : "FEF3C7" },
        },
        font: {
          bold: true,
          color: { rgb: closed ? "047857" : "92400E" },
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
        },
      };
    }
  });

  dofSheet["!cols"] = [
    { wch: 24 },
    { wch: 36 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 22 },
    { wch: 20 },
    { wch: 12 },
    { wch: 14 },
  ];
  dofSheet["!autofilter"] = { ref: `A1:J${dofRows.length + 1}` };

  XLSX.utils.book_append_sheet(workbook, dofSheet, "DOF");

  // ----------------------------------------------------------
  // 3. HEATMAP
  // ----------------------------------------------------------
  const matrixRecords = records.filter(
    (record) =>
      record.method === "MATRIX" &&
      Number(record.probability) >= 1 &&
      Number(record.probability) <= 5 &&
      Number(record.severity) >= 1 &&
      Number(record.severity) <= 5
  );

  const heatMapRows: Array<Array<string | number>> = [
    ["Olasılık \\ Şiddet", 1, 2, 3, 4, 5],
  ];

  [5, 4, 3, 2, 1].forEach((probability) => {
    const row: Array<string | number> = [probability];

    [1, 2, 3, 4, 5].forEach((severity) => {
      row.push(
        matrixRecords.filter(
          (record) =>
            Number(record.probability) === probability &&
            Number(record.severity) === severity
        ).length
      );
    });

    heatMapRows.push(row);
  });

  const heatMapSheet = XLSX.utils.aoa_to_sheet(heatMapRows);
  applyHeaderStyle(heatMapSheet, 6);
  applyBodyBorders(heatMapSheet, 6, 6);

  [5, 4, 3, 2, 1].forEach((probability, rowIndex) => {
    [1, 2, 3, 4, 5].forEach((severity, columnIndex) => {
      const score = probability * severity;
      const cellAddress =
        String.fromCharCode(66 + columnIndex) + (rowIndex + 2);
      const cell = heatMapSheet[cellAddress];

      if (!cell) return;

      let fill = "DCFCE7";
      let font = "166534";

      if (score >= 20) {
        fill = "DC2626";
        font = "FFFFFF";
      } else if (score >= 15) {
        fill = "F97316";
        font = "FFFFFF";
      } else if (score >= 8) {
        fill = "FACC15";
        font = "713F12";
      }

      cell.s = {
        ...(cell.s || {}),
        fill: {
          patternType: "solid",
          fgColor: { rgb: fill },
        },
        font: {
          bold: true,
          color: { rgb: font },
          sz: 14,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
        },
      };
    });
  });

  heatMapSheet["!cols"] = [
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];
  heatMapSheet["!rows"] = [
    { hpt: 28 },
    { hpt: 42 },
    { hpt: 42 },
    { hpt: 42 },
    { hpt: 42 },
    { hpt: 42 },
  ];

  XLSX.utils.book_append_sheet(workbook, heatMapSheet, "HeatMap");

  // ----------------------------------------------------------
  // 4. İSTATİSTİK
  // ----------------------------------------------------------
  const statisticsRows = [
    ["Gösterge", "Değer"],
    ["Toplam Risk", records.length],
    [
      "Kritik Risk",
      records.filter((record) => record.level === "CRITICAL").length,
    ],
    [
      "Yüksek Risk",
      records.filter((record) => record.level === "HIGH").length,
    ],
    [
      "Orta Risk",
      records.filter((record) => record.level === "MEDIUM").length,
    ],
    [
      "Düşük Risk",
      records.filter((record) => record.level === "LOW").length,
    ],
    [
      "Açık DÖF",
      records.filter((record) => record.dofStatus === "OPEN").length,
    ],
    [
      "Kapalı DÖF",
      records.filter((record) => record.dofStatus === "CLOSED").length,
    ],
    [
      "5x5 Matris",
      records.filter((record) => record.method === "MATRIX").length,
    ],
    [
      "Fine-Kinney",
      records.filter(
        (record) => record.method === "FINE_KINNEY"
      ).length,
    ],
  ];

  const statisticsSheet = XLSX.utils.aoa_to_sheet(statisticsRows);
  applyHeaderStyle(statisticsSheet, 2);
  applyBodyBorders(
    statisticsSheet,
    statisticsRows.length,
    2
  );

  statisticsSheet["!cols"] = [
    { wch: 28 },
    { wch: 16 },
  ];

  for (let row = 2; row <= statisticsRows.length; row += 1) {
    const valueCell = statisticsSheet[`B${row}`];

    if (valueCell) {
      valueCell.s = {
        ...(valueCell.s || {}),
        font: {
          bold: true,
          color: { rgb: "6B1020" },
          sz: 13,
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
        },
      };
    }
  }

  XLSX.utils.book_append_sheet(
    workbook,
    statisticsSheet,
    "Istatistik"
  );

  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(
    workbook,
    `${fileName}_${dateStamp}.xlsx`
  );
}