import type { RiskRecord } from "../types";

const LEVEL_ORDER: Record<RiskRecord["level"], number> = {
  INTOLERABLE: 5,
  VERY_HIGH: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dateText(value?: number | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("tr-TR");
}

function levelText(level: RiskRecord["level"]) {
  const labels = {
    LOW: "Düşük",
    MEDIUM: "Orta",
    HIGH: "Yüksek",
    VERY_HIGH: "Çok Yüksek",
    INTOLERABLE: "Kabul Edilemez",
  };

  return labels[level];
}

export function sortClassicRiskRecords(records: RiskRecord[]) {
  return [...records].sort((a, b) => {
    const levelDiff =
      LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level];

    if (levelDiff !== 0) return levelDiff;
    return Number(b.score || 0) - Number(a.score || 0);
  });
}

export function createRiskReportNo() {
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join("");

  return `RR-${stamp}`;
}

export function printClassicRiskReport(
  records: RiskRecord[],
  companyName: string,
  reportNo = createRiskReportNo()
) {
  const sorted = sortClassicRiskRecords(records);

  const rows = sorted
    .map(
      (record, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${esc(record.department)}</td>
          <td>${esc(record.process)}</td>
          <td>${esc(record.activity)}</td>
          <td>${esc(record.hazard)}</td>
          <td>${esc(record.consequence)}</td>
          <td>${esc(record.existingControl)}</td>
          <td>${esc(record.probability)}</td>
          <td>${esc(record.frequency)}</td>
          <td>${esc(record.severity)}</td>
          <td><strong>${esc(record.score)}</strong></td>
          <td>${esc(levelText(record.level))}</td>
          <td>${esc(record.proposedControl)}</td>
          <td>${esc(record.responsible)}</td>
          <td>${esc(dateText(record.dueDateMillis))}</td>
          <td>${record.completed ? "Kapalı" : "Açık"}</td>
        </tr>`
    )
    .join("");

  const popup = window.open("", "_blank", "width=1500,height=950");

  if (!popup) {
    throw new Error("Yazdırma penceresi açılamadı.");
  }

  popup.document.write(`
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>${esc(reportNo)} - Risk Değerlendirmesi</title>
        <style>
          @page { size: A3 landscape; margin: 10mm; }
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color:#111827; margin:0; }
          header { border:2px solid #6b1020; padding:14px; margin-bottom:10px; }
          h1 { margin:0; font-size:22px; color:#6b1020; }
          .meta { margin-top:8px; display:grid; grid-template-columns:repeat(4,1fr); gap:8px; font-size:11px; }
          .meta div { border:1px solid #cbd5e1; padding:7px; }
          table { width:100%; border-collapse:collapse; table-layout:fixed; font-size:7.5px; }
          th, td { border:1px solid #64748b; padding:4px; vertical-align:top; overflow-wrap:anywhere; }
          th { background:#6b1020; color:#fff; }
          tbody tr:nth-child(even) { background:#f8fafc; }
          .signatures { margin-top:18px; display:grid; grid-template-columns:repeat(4,1fr); gap:16px; page-break-inside:avoid; }
          .signature { height:90px; border:1px solid #94a3b8; padding:8px; text-align:center; }
          footer { margin-top:8px; font-size:9px; color:#64748b; display:flex; justify-content:space-between; }
          @media print { .no-print { display:none; } }
        </style>
      </head>
      <body>
        <header>
          <h1>D-SEC KLASİK RİSK DEĞERLENDİRMESİ</h1>
          <div class="meta">
            <div><strong>Firma:</strong><br/>${esc(companyName || "-")}</div>
            <div><strong>Rapor No:</strong><br/>${esc(reportNo)}</div>
            <div><strong>Tarih:</strong><br/>${new Date().toLocaleDateString("tr-TR")}</div>
            <div><strong>Kayıt Sayısı:</strong><br/>${sorted.length}</div>
          </div>
        </header>

        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Departman</th>
              <th>Süreç</th>
              <th>Faaliyet</th>
              <th>Tehlike</th>
              <th>Olası Sonuç</th>
              <th>Mevcut Kontroller</th>
              <th>O</th>
              <th>F</th>
              <th>Ş</th>
              <th>Skor</th>
              <th>Seviye</th>
              <th>İlave Önlemler</th>
              <th>Sorumlu</th>
              <th>Termin</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="signatures">
          <div class="signature"><strong>Hazırlayan</strong></div>
          <div class="signature"><strong>İSG Uzmanı</strong></div>
          <div class="signature"><strong>İşyeri Hekimi</strong></div>
          <div class="signature"><strong>İşveren / Onaylayan</strong></div>
        </div>

        <footer>
          <span>${esc(reportNo)}</span>
          <span>D-SEC Enterprise Risk Management</span>
        </footer>

        <script>
          window.onload = () => setTimeout(() => window.print(), 300);
        </script>
      </body>
    </html>
  `);

  popup.document.close();
  return reportNo;
}