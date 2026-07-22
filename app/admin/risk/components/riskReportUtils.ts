import type { RiskRecord } from "../types";
import {
  formatDate,
  riskLabel,
} from "../helpers";

export type RiskReportType =
  | "EXECUTIVE"
  | "ALL_RISKS"
  | "CRITICAL"
  | "OPEN_DOF"
  | "PHOTO"
  | "FINE_KINNEY"
  | "MATRIX_5X5";

export type RiskReportSummary = {
  totalRisk: number;
  criticalRisk: number;
  openDof: number;
  closedDof: number;
  overdueDof: number;
  averageScore: number;
};

export function filterReportRecords(
  records: RiskRecord[],
  type: RiskReportType
) {
  switch (type) {
    case "CRITICAL":
      return records.filter(
        (record) =>
          record.level === "HIGH" ||
          record.level === "VERY_HIGH" ||
          record.level === "INTOLERABLE"
      );

    case "OPEN_DOF":
      return records.filter(
        (record) => !record.completed
      );

    case "PHOTO":
      return records.filter(
        (record) =>
          Boolean(record.photoUrl) ||
          Boolean(record.attachmentUrl)
      );

    case "FINE_KINNEY":
      return records.filter(
        (record) =>
          record.method === "FINE_KINNEY"
      );

    case "MATRIX_5X5":
      return records.filter(
        (record) =>
          record.method === "MATRIX_5X5"
      );

    case "EXECUTIVE":
    case "ALL_RISKS":
    default:
      return records;
  }
}

export function createRiskReportSummary(
  records: RiskRecord[]
): RiskReportSummary {
  const now = Date.now();
  const totalRisk = records.length;

  const criticalRisk = records.filter(
    (record) =>
      record.level === "VERY_HIGH" ||
      record.level === "INTOLERABLE"
  ).length;

  const openDof = records.filter(
    (record) => !record.completed
  ).length;

  const closedDof = records.filter(
    (record) => record.completed
  ).length;

  const overdueDof = records.filter(
    (record) =>
      !record.completed &&
      Boolean(record.dueDateMillis) &&
      Number(record.dueDateMillis) < now
  ).length;

  const averageScore =
    totalRisk > 0
      ? Math.round(
          records.reduce(
            (sum, record) =>
              sum + Number(record.score || 0),
            0
          ) / totalRisk
        )
      : 0;

  return {
    totalRisk,
    criticalRisk,
    openDof,
    closedDof,
    overdueDof,
    averageScore,
  };
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function reportTitle(type: RiskReportType) {
  const map: Record<RiskReportType, string> = {
    EXECUTIVE: "Yönetici Risk Özeti",
    ALL_RISKS: "Tüm Risk Envanteri",
    CRITICAL: "Kritik Risk Raporu",
    OPEN_DOF: "Açık DÖF Raporu",
    PHOTO: "Fotoğraflı Risk Raporu",
    FINE_KINNEY: "Fine-Kinney Risk Raporu",
    MATRIX_5X5: "5×5 Matris Risk Raporu",
  };

  return map[type];
}

function riskRows(records: RiskRecord[]) {
  return records
    .map(
      (record, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(record.company)}</td>
          <td>${escapeHtml(record.department)}</td>
          <td>${escapeHtml(record.activity)}</td>
          <td>${escapeHtml(record.hazard)}</td>
          <td>${escapeHtml(record.method)}</td>
          <td>${escapeHtml(record.score)}</td>
          <td>${escapeHtml(riskLabel(record.level))}</td>
          <td>${record.completed ? "Kapalı" : "Açık"}</td>
          <td>${escapeHtml(record.responsible)}</td>
          <td>${escapeHtml(formatDate(record.dueDateMillis))}</td>
        </tr>
      `
    )
    .join("");
}

function detailCards(records: RiskRecord[]) {
  return records
    .map(
      (record, index) => `
        <section class="risk-card">
          <div class="risk-card-head">
            <div>
              <div class="eyebrow">RİSK ${index + 1}</div>
              <h2>${escapeHtml(
                record.activity || record.hazard
              )}</h2>
              <p>${escapeHtml(record.company)} · ${escapeHtml(
                record.department
              )} · ${escapeHtml(record.process)}</p>
            </div>
            <div class="score-box">
              <strong>${escapeHtml(record.score)}</strong>
              <span>${escapeHtml(
                riskLabel(record.level)
              )}</span>
            </div>
          </div>

          <div class="grid">
            <div><b>Tehlike</b><p>${escapeHtml(
              record.hazard
            )}</p></div>
            <div><b>Olası Sonuç</b><p>${escapeHtml(
              record.consequence
            )}</p></div>
            <div><b>Mevcut Kontroller</b><p>${escapeHtml(
              record.existingControl
            )}</p></div>
            <div><b>İlave Kontroller</b><p>${escapeHtml(
              record.proposedControl
            )}</p></div>
          </div>

          <div class="meta">
            <span>Yöntem: ${escapeHtml(record.method)}</span>
            <span>Olasılık: ${escapeHtml(record.probability)}</span>
            ${
              record.method === "FINE_KINNEY"
                ? `<span>Frekans: ${escapeHtml(record.frequency)}</span>`
                : ""
            }
            <span>Şiddet: ${escapeHtml(record.severity)}</span>
            <span>DÖF: ${
              record.completed ? "Kapalı" : "Açık"
            }</span>
            <span>Sorumlu: ${escapeHtml(record.responsible)}</span>
            <span>Termin: ${escapeHtml(
              formatDate(record.dueDateMillis)
            )}</span>
          </div>

          ${
            record.photoUrl
              ? `<img class="risk-photo" src="${escapeHtml(
                  record.photoUrl
                )}" alt="Risk fotoğrafı" />`
              : ""
          }
        </section>
      `
    )
    .join("");
}

export function buildRiskReportHtml(
  records: RiskRecord[],
  type: RiskReportType,
  companyName: string
) {
  const filtered = filterReportRecords(records, type);
  const summary = createRiskReportSummary(filtered);
  const title = reportTitle(type);
  const generatedAt = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: #172033; margin: 0; background: #fff; }
  .cover { background: linear-gradient(135deg,#3f0d18,#111827); color:#fff; padding:32px; border-radius:18px; margin-bottom:20px; }
  .cover h1 { margin:0; font-size:28px; }
  .cover p { margin:8px 0 0; opacity:.8; }
  .summary { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:18px; }
  .stat { border:1px solid #e3e8ef; border-radius:12px; padding:14px; }
  .stat span { display:block; font-size:10px; color:#68758a; font-weight:700; }
  .stat strong { display:block; margin-top:5px; font-size:22px; }
  table { width:100%; border-collapse:collapse; font-size:9px; }
  th,td { border:1px solid #dfe5ec; padding:6px; vertical-align:top; }
  th { background:#f1f4f8; text-align:left; }
  .risk-card { page-break-inside:avoid; border:1px solid #dfe5ec; border-radius:14px; padding:15px; margin:0 0 16px; }
  .risk-card-head { display:flex; justify-content:space-between; gap:12px; }
  .risk-card h2 { margin:4px 0 0; font-size:18px; }
  .risk-card p { white-space:pre-wrap; line-height:1.45; font-size:10px; }
  .eyebrow { font-size:9px; color:#7a8799; font-weight:700; }
  .score-box { min-width:100px; padding:12px; border-radius:12px; background:#fff1f2; color:#801524; text-align:center; }
  .score-box strong { display:block; font-size:25px; }
  .score-box span { display:block; margin-top:3px; font-size:9px; font-weight:700; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-top:13px; }
  .grid > div { border:1px solid #e4e9ef; border-radius:10px; padding:10px; }
  .meta { display:flex; flex-wrap:wrap; gap:7px; margin-top:10px; font-size:9px; color:#536176; }
  .meta span { border-radius:999px; background:#f1f4f8; padding:5px 8px; }
  .risk-photo { display:block; max-width:100%; max-height:330px; margin:12px auto 0; object-fit:contain; border-radius:10px; }
  .footer { margin-top:18px; padding-top:8px; border-top:1px solid #dfe5ec; color:#7a8799; font-size:8px; }
  @media print {
    .risk-card { break-inside:avoid; }
  }
</style>
</head>
<body>
  <section class="cover">
    <div>D-SEC · DİJİTAL SAĞLIK, EMNİYET VE ÇEVRE</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(companyName || "Tüm Firmalar")} · ${escapeHtml(
      generatedAt
    )}</p>
  </section>

  <section class="summary">
    <div class="stat"><span>TOPLAM RİSK</span><strong>${
      summary.totalRisk
    }</strong></div>
    <div class="stat"><span>KRİTİK RİSK</span><strong>${
      summary.criticalRisk
    }</strong></div>
    <div class="stat"><span>ORTALAMA SKOR</span><strong>${
      summary.averageScore
    }</strong></div>
    <div class="stat"><span>AÇIK DÖF</span><strong>${
      summary.openDof
    }</strong></div>
    <div class="stat"><span>GECİKMİŞ DÖF</span><strong>${
      summary.overdueDof
    }</strong></div>
    <div class="stat"><span>KAPALI DÖF</span><strong>${
      summary.closedDof
    }</strong></div>
  </section>

  ${
    type === "EXECUTIVE"
      ? `
        <h2>Yönetici Risk Envanteri</h2>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Firma</th><th>Departman</th><th>Faaliyet</th>
              <th>Tehlike</th><th>Yöntem</th><th>Skor</th><th>Seviye</th>
              <th>DÖF</th><th>Sorumlu</th><th>Termin</th>
            </tr>
          </thead>
          <tbody>${riskRows(filtered.slice(0, 50))}</tbody>
        </table>
      `
      : detailCards(filtered)
  }

  <div class="footer">
    Bu rapor D-SEC Risk Yönetim Merkezi tarafından oluşturulmuştur.
  </div>
</body>
</html>`;
}

export function exportRiskCsv(
  records: RiskRecord[],
  type: RiskReportType
) {
  const filtered = filterReportRecords(records, type);

  const header = [
    "Firma",
    "Departman",
    "Süreç",
    "Faaliyet",
    "Tehlike",
    "Olası Sonuç",
    "Mevcut Kontrol",
    "İlave Kontrol",
    "Yöntem",
    "Olasılık",
    "Frekans",
    "Şiddet",
    "Skor",
    "Seviye",
    "DÖF",
    "Sorumlu",
    "Termin",
  ];

  const escapeValue = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const rows = filtered.map((record) => [
    record.company,
    record.department,
    record.process,
    record.activity,
    record.hazard,
    record.consequence,
    record.existingControl,
    record.proposedControl,
    record.method,
    record.probability,
    record.frequency,
    record.severity,
    record.score,
    riskLabel(record.level),
    record.completed ? "Kapalı" : "Açık",
    record.responsible,
    formatDate(record.dueDateMillis),
  ]);

  const csv = [
    header.map(escapeValue).join(";"),
    ...rows.map((row) =>
      row.map(escapeValue).join(";")
    ),
  ].join("\n");

  const blob = new Blob(["\ufeff", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `DSEC_${type}_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function exportRiskWord(
  records: RiskRecord[],
  type: RiskReportType,
  companyName: string
) {
  const html = buildRiskReportHtml(
    records,
    type,
    companyName
  );

  const blob = new Blob(
    ["\ufeff", html],
    {
      type: "application/msword",
    }
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `DSEC_${type}_${new Date()
    .toISOString()
    .slice(0, 10)}.doc`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function printRiskPdf(
  records: RiskRecord[],
  type: RiskReportType,
  companyName: string
) {
  const html = buildRiskReportHtml(
    records,
    type,
    companyName
  );

  const iframe = document.createElement("iframe");

  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "1px";
  iframe.style.height = "1px";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";

  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDocument = iframe.contentDocument;

  if (!frameWindow || !frameDocument) {
    iframe.remove();
    throw new Error("PDF yazdırma görünümü oluşturulamadı.");
  }

  frameDocument.open();
  frameDocument.write(html);
  frameDocument.close();

  const print = () => {
    try {
      frameWindow.focus();
      frameWindow.print();
    } finally {
      window.setTimeout(() => {
        iframe.remove();
      }, 1500);
    }
  };

  if (frameDocument.readyState === "complete") {
    window.setTimeout(print, 300);
  } else {
    iframe.onload = () => {
      window.setTimeout(print, 300);
    };
  }
}