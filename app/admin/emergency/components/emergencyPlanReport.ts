import type {
  EmergencyPlanContent,
  EmergencySupportMember,
} from "../../../../lib/emergency/types";
import { buildEmergencyTeamTablesHtml } from "./emergencyTeamReport";

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function imageBlock(title: string, url: string) {
  if (!url) {
    return `<section><h2>${esc(title)}</h2><div class="empty-sketch">Kroki eklenmemiştir.</div></section>`;
  }

  return `
    <section class="page-break">
      <h2>${esc(title)}</h2>
      <img class="sketch" src="${esc(url)}" alt="${esc(title)}" />
    </section>
  `;
}

export function printEmergencyPlan(params: {
  companyName: string;
  planTitle: string;
  planNo: string;
  revisionNo: string;
  planDate: string;
  validUntil: string;
  dangerClass: string;
  employeeCount: number;
  workplaceAddress: string;
  content: EmergencyPlanContent;
  teams?: EmergencySupportMember[];
}) {
  const popup = window.open("", "_blank", "width=1400,height=950");

  if (!popup) {
    throw new Error("PDF penceresi açılamadı.");
  }

  const contents = [
    "Amaç",
    "Kapsam",
    "Yasal Dayanak",
    "Tanımlar",
    "Görev ve Sorumluluklar",
    "Alarm ve Haberleşme",
    "Tahliye Esasları",
    "Özel Gruplar",
    "Acil Durum Senaryoları",
    "Acil Durum Destek Ekipleri",
    "Acil İletişim Listesi",
    "Toplanma Alanları",
    "Acil Durum Ekipmanı",
    "Tahliye Krokisi",
    "Toplanma Alanı Krokisi",
    "Acil Durum Sonrası İşlemler",
    "Revizyon Geçmişi",
    "Onaylar",
  ];

  const scenarioHtml = params.content.scenarios
    .map(
      (item, index) => `
      <section class="scenario">
        <h3>${index + 1}. ${esc(item.title)}</h3>
        <table>
          <tr><th>Risk / Olay</th><td>${esc(item.riskDescription)}</td></tr>
          <tr><th>Alarm</th><td>${esc(item.alarmMethod)}</td></tr>
          <tr><th>İlk Müdahale</th><td>${esc(item.firstResponse)}</td></tr>
          <tr><th>Tahliye</th><td>${esc(item.evacuationMethod)}</td></tr>
          <tr><th>Sorumlu Ekipler</th><td>${esc(item.responsibleTeams)}</td></tr>
          <tr><th>Ekipman</th><td>${esc(item.equipment)}</td></tr>
          <tr><th>Dış Kurumlar</th><td>${esc(item.externalInstitutions)}</td></tr>
        </table>
      </section>`
    )
    .join("");

  popup.document.write(`
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>${esc(params.planTitle)}</title>
        <style>
          @page {
            size: A4;
            margin: 16mm;
            @bottom-center {
              content: "D-SEC Acil Durum Eylem Planı - Sayfa " counter(page);
              font-size: 9px;
              color: #64748b;
            }
          }
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color:#111827; line-height:1.45; margin:0; }
          .cover {
            min-height: 250mm;
            display:flex;
            flex-direction:column;
            justify-content:center;
            text-align:center;
            page-break-after:always;
            border:4px solid #7f1d1d;
            padding:25mm;
          }
          .cover h1 { color:#7f1d1d; font-size:34px; margin:0 0 20px; }
          .cover h2 { font-size:24px; margin:0 0 28px; }
          .toc { page-break-after:always; }
          .toc ol { padding-left:24px; }
          .toc li { margin:7px 0; border-bottom:1px dotted #94a3b8; padding-bottom:4px; }
          h2 { color:#7f1d1d; border-bottom:2px solid #7f1d1d; padding-bottom:6px; margin-top:28px; }
          h3 { color:#7f1d1d; }
          table { width:100%; border-collapse:collapse; font-size:10px; }
          th,td { border:1px solid #94a3b8; padding:7px; vertical-align:top; }
          th { background:#f1f5f9; text-align:left; }
          .scenario { page-break-inside:avoid; margin-bottom:18px; }
          .page-break { page-break-before:always; }
          .sketch { width:100%; max-height:230mm; object-fit:contain; border:1px solid #cbd5e1; }
          .empty-sketch { border:1px dashed #94a3b8; min-height:120px; display:grid; place-items:center; color:#64748b; }
          .signature-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; margin-top:22px; }
          .signature { min-height:100px; border:1px solid #94a3b8; padding:10px; text-align:center; }
        </style>
      </head>
      <body>
        <section class="cover">
          <h1>D-SEC</h1>
          <h2>${esc(params.planTitle)}</h2>
          <strong>${esc(params.companyName)}</strong>
          <table style="margin-top:25px">
            <tr><th>Plan No</th><td>${esc(params.planNo)}</td></tr>
            <tr><th>Revizyon No</th><td>${esc(params.revisionNo)}</td></tr>
            <tr><th>Plan Tarihi</th><td>${esc(params.planDate)}</td></tr>
            <tr><th>Geçerlilik</th><td>${esc(params.validUntil)}</td></tr>
            <tr><th>Tehlike Sınıfı</th><td>${esc(params.dangerClass)}</td></tr>
            <tr><th>Çalışan Sayısı</th><td>${esc(params.employeeCount)}</td></tr>
            <tr><th>Adres</th><td>${esc(params.workplaceAddress)}</td></tr>
          </table>
        </section>

        <section class="toc">
          <h2>İçindekiler</h2>
          <ol>${contents.map((item) => `<li>${esc(item)}</li>`).join("")}</ol>
        </section>

        <h2>1. Amaç</h2><p>${esc(params.content.purpose)}</p>
        <h2>2. Kapsam</h2><p>${esc(params.content.scope)}</p>
        <h2>3. Yasal Dayanak</h2><p>${esc(params.content.legalBasis)}</p>
        <h2>4. Tanımlar</h2><p>${esc(params.content.definitions)}</p>
        <h2>5. Görev ve Sorumluluklar</h2><p>${esc(params.content.responsibilities)}</p>
        <h2>6. Alarm ve Haberleşme</h2><p>${esc(params.content.alarmAndCommunication)}</p>
        <h2>7. Tahliye Esasları</h2><p>${esc(params.content.evacuationPrinciples)}</p>
        <h2>8. Özel Gruplar</h2><p>${esc(params.content.specialGroups)}</p>

        <h2>9. Acil Durum Senaryoları</h2>
        ${scenarioHtml}

        <section class="page-break">
          <h2>10. Acil Durum Destek Ekipleri</h2>
          ${
            params.teams &&
            params.teams.length > 0
              ? buildEmergencyTeamTablesHtml(
                  params.teams,
                  params.companyName,
                  params.planNo,
                  params.revisionNo
                )
              : '<div class="empty-sketch">Destek ekibi kaydı bulunmamaktadır.</div>'
          }
        </section>

        <h2>11. Acil İletişim Listesi</h2>
        <table>
          <tr><th>Kurum / Kişi</th><th>Telefon</th><th>Not</th></tr>
          ${params.content.contacts.map((item) =>
            `<tr><td>${esc(item.title)}</td><td>${esc(item.phone)}</td><td>${esc(item.note)}</td></tr>`
          ).join("")}
        </table>

        <h2>12. Toplanma Alanları</h2>
        <table>
          <tr><th>Alan</th><th>Konum</th><th>Kapasite</th><th>Sorumlu</th><th>Not</th></tr>
          ${params.content.assemblyAreas.map((item) =>
            `<tr><td>${esc(item.name)}</td><td>${esc(item.location)}</td><td>${esc(item.capacity)}</td><td>${esc(item.responsible)}</td><td>${esc(item.note)}</td></tr>`
          ).join("")}
        </table>

        <h2>13. Acil Durum Ekipmanı</h2>
        <table>
          <tr><th>Ekipman</th><th>Konum</th><th>Adet</th><th>Son Kontrol</th><th>Sonraki Kontrol</th><th>Durum</th></tr>
          ${params.content.equipment.map((item) =>
            `<tr><td>${esc(item.name)}</td><td>${esc(item.location)}</td><td>${esc(item.quantity)}</td><td>${esc(item.lastControlDate)}</td><td>${esc(item.nextControlDate)}</td><td>${esc(item.status)}</td></tr>`
          ).join("")}
        </table>

        ${imageBlock("14. Tahliye Krokisi", params.content.evacuationSketchUrl)}
        ${imageBlock("15. Toplanma Alanı Krokisi", params.content.assemblyAreaSketchUrl)}

        <h2>16. Acil Durum Sonrası İşlemler</h2>
        <p>${esc(params.content.postEmergencyActions)}</p>

        <h2>17. Revizyon Geçmişi</h2>
        <table>
          <tr><th>Revizyon</th><th>Tarih</th><th>Değişiklik Nedeni</th><th>Hazırlayan</th><th>Onaylayan</th></tr>
          ${params.content.revisionHistory.map((item) =>
            `<tr><td>${esc(item.revisionNo)}</td><td>${esc(item.revisionDate)}</td><td>${esc(item.changeReason)}</td><td>${esc(item.preparedBy)}</td><td>${esc(item.approvedBy)}</td></tr>`
          ).join("")}
        </table>

        <h2>18. Onaylar</h2>
        <div class="signature-grid">
          <div class="signature"><strong>Hazırlayan</strong><br/>${esc(params.content.approvals.preparedBy)}</div>
          <div class="signature"><strong>Kontrol Eden</strong><br/>${esc(params.content.approvals.checkedBy)}</div>
          <div class="signature"><strong>İSG Uzmanı</strong><br/>${esc(params.content.approvals.occupationalSafetyExpert)}</div>
          <div class="signature"><strong>İşyeri Hekimi</strong><br/>${esc(params.content.approvals.workplacePhysician)}</div>
          <div class="signature"><strong>İşveren / Onaylayan</strong><br/>${esc(params.content.approvals.approvedBy)}</div>
        </div>

        <script>window.onload=()=>setTimeout(()=>window.print(),300);</script>
      </body>
    </html>
  `);

  popup.document.close();
}