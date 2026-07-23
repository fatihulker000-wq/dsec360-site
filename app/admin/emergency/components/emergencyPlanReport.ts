import type { EmergencyPlanContent } from "./emergencyPlanTemplate";

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
}) {
  const popup = window.open("", "_blank", "width=1400,height=950");

  if (!popup) {
    throw new Error("PDF penceresi açılamadı.");
  }

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
        </section>
      `
    )
    .join("");

  popup.document.write(`
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>${esc(params.planTitle)}</title>
        <style>
          @page { size: A4; margin: 16mm; }
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color:#111827; line-height:1.45; }
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
          .cover h1 { color:#7f1d1d; font-size:30px; margin:0 0 24px; }
          .cover h2 { font-size:22px; margin:0 0 30px; }
          .meta, table { width:100%; border-collapse:collapse; }
          .meta { margin-top:25px; }
          th, td { border:1px solid #94a3b8; padding:8px; vertical-align:top; }
          th { background:#f1f5f9; text-align:left; width:28%; }
          h2 { color:#7f1d1d; border-bottom:2px solid #7f1d1d; padding-bottom:6px; margin-top:28px; }
          h3 { color:#7f1d1d; }
          .scenario { page-break-inside:avoid; margin-bottom:18px; }
          .signature-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; margin-top:22px; }
          .signature { min-height:100px; border:1px solid #94a3b8; padding:10px; text-align:center; }
        </style>
      </head>
      <body>
        <section class="cover">
          <h1>D-SEC</h1>
          <h2>${esc(params.planTitle)}</h2>
          <strong>${esc(params.companyName)}</strong>
          <table class="meta">
            <tr><th>Plan No</th><td>${esc(params.planNo)}</td></tr>
            <tr><th>Revizyon No</th><td>${esc(params.revisionNo)}</td></tr>
            <tr><th>Plan Tarihi</th><td>${esc(params.planDate)}</td></tr>
            <tr><th>Geçerlilik</th><td>${esc(params.validUntil)}</td></tr>
            <tr><th>Tehlike Sınıfı</th><td>${esc(params.dangerClass)}</td></tr>
            <tr><th>Çalışan Sayısı</th><td>${esc(params.employeeCount)}</td></tr>
            <tr><th>Adres</th><td>${esc(params.workplaceAddress)}</td></tr>
          </table>
        </section>

        <h2>1. Amaç</h2><p>${esc(params.content.purpose)}</p>
        <h2>2. Kapsam</h2><p>${esc(params.content.scope)}</p>
        <h2>3. Görev ve Sorumluluklar</h2><p>${esc(params.content.responsibilities)}</p>
        <h2>4. Alarm ve Haberleşme</h2><p>${esc(params.content.alarmAndCommunication)}</p>
        <h2>5. Tahliye Esasları</h2><p>${esc(params.content.evacuationPrinciples)}</p>
        <h2>6. Özel Gruplar</h2><p>${esc(params.content.specialGroups)}</p>

        <h2>7. Acil Durum Senaryoları</h2>
        ${scenarioHtml}

        <h2>8. Acil İletişim Listesi</h2>
        <table>
          <tr><th>Kurum / Kişi</th><th>Telefon</th><th>Not</th></tr>
          ${params.content.contacts
            .map(
              (item) =>
                `<tr><td>${esc(item.title)}</td><td>${esc(item.phone)}</td><td>${esc(item.note)}</td></tr>`
            )
            .join("")}
        </table>

        <h2>9. Toplanma Alanları</h2>
        <table>
          <tr><th>Adı</th><th>Konum</th><th>Kapasite</th><th>Sorumlu</th><th>Not</th></tr>
          ${params.content.assemblyAreas
            .map(
              (item) =>
                `<tr><td>${esc(item.name)}</td><td>${esc(item.location)}</td><td>${esc(item.capacity)}</td><td>${esc(item.responsible)}</td><td>${esc(item.note)}</td></tr>`
            )
            .join("")}
        </table>

        <h2>10. Acil Durum Ekipmanı</h2>
        <table>
          <tr><th>Ekipman</th><th>Konum</th><th>Adet</th><th>Son Kontrol</th><th>Sonraki Kontrol</th><th>Durum</th></tr>
          ${params.content.equipment
            .map(
              (item) =>
                `<tr><td>${esc(item.name)}</td><td>${esc(item.location)}</td><td>${esc(item.quantity)}</td><td>${esc(item.lastControlDate)}</td><td>${esc(item.nextControlDate)}</td><td>${esc(item.status)}</td></tr>`
            )
            .join("")}
        </table>

        <h2>11. Acil Durum Sonrası İşlemler</h2>
        <p>${esc(params.content.postEmergencyActions)}</p>

        <h2>12. Onaylar</h2>
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
