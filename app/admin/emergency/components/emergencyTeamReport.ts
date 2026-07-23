import type {
  EmergencySupportMember,
} from "../../../../lib/emergency/types";

const TEAM_ORDER = [
  "YANGIN",
  "ARAMA_KURTARMA",
  "TAHLIYE",
  "TAHLİYE",
  "ILKYARDIM",
  "ILK_YARDIM",
  "KORUMA",
  "HABERLESME",
];

const TEAM_LABELS: Record<string, string> = {
  YANGIN: "YANGINLA MÜCADELE EKİBİ",
  ARAMA_KURTARMA:
    "ARAMA VE KURTARMA EKİBİ",
  TAHLIYE: "TAHLİYE EKİBİ",
  "TAHLİYE": "TAHLİYE EKİBİ",
  ILKYARDIM: "İLK YARDIM EKİBİ",
  ILK_YARDIM: "İLK YARDIM EKİBİ",
  KORUMA: "KORUMA EKİBİ",
  HABERLESME: "HABERLEŞME EKİBİ",
};

const ROLE_LABELS: Record<string, string> = {
  EKIP_LIDERI: "Ekip Lideri",
  EKIP_UYESI: "Ekip Üyesi",
  YEDEK_UYE: "Yedek Üye",
};

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeTeamType(value: string) {
  if (value === "TAHLİYE") {
    return "TAHLIYE";
  }

  if (value === "ILK_YARDIM") {
    return "ILKYARDIM";
  }

  return value;
}

export function buildEmergencyTeamTablesHtml(
  teams: EmergencySupportMember[],
  companyName: string,
  planNo = "",
  revisionNo = "R0"
) {
  const activeTeams = teams.filter(
    (member) => member.isActive
  );

  return TEAM_ORDER
    .filter(
      (type, index, array) =>
        array.indexOf(type) === index
    )
    .map((type) => {
      const members = activeTeams.filter(
        (member) =>
          normalizeTeamType(
            String(member.teamType)
          ) === normalizeTeamType(type)
      );

      const rows =
        members.length === 0
          ? `
            <tr>
              <td colspan="8" class="empty">
                Bu ekip için kayıtlı üye bulunmuyor.
              </td>
            </tr>
          `
          : members
              .map(
                (member, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td><strong>${esc(
                      member.fullName
                    )}</strong></td>
                    <td>${esc(
                      member.duty || "-"
                    )}</td>
                    <td>${esc(
                      member.department || "-"
                    )}</td>
                    <td>${esc(
                      ROLE_LABELS[
                        member.teamRole
                      ] ||
                        member.teamRole
                    )}</td>
                    <td>${esc(
                      member.phone || "-"
                    )}</td>
                    <td>${esc(
                      member.certificateInfo ||
                        "-"
                    )}</td>
                    <td class="signature-cell"></td>
                  </tr>
                `
              )
              .join("");

      return `
        <section class="team-page">
          <header class="document-header">
            <div>
              <div class="brand">D-SEC</div>
              <h1>ACİL DURUM DESTEK EKİBİ</h1>
              <h2>${esc(
                TEAM_LABELS[type] || type
              )}</h2>
            </div>

            <table class="meta">
              <tr>
                <th>Firma</th>
                <td>${esc(
                  companyName || "-"
                )}</td>
              </tr>
              <tr>
                <th>Plan No</th>
                <td>${esc(
                  planNo || "-"
                )}</td>
              </tr>
              <tr>
                <th>Revizyon</th>
                <td>${esc(
                  revisionNo
                )}</td>
              </tr>
              <tr>
                <th>Yayın Tarihi</th>
                <td>${esc(
                  new Date().toLocaleDateString(
                    "tr-TR"
                  )
                )}</td>
              </tr>
            </table>
          </header>

          <table class="member-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Ad Soyad</th>
                <th>Şirket İçi Görevi</th>
                <th>Departman</th>
                <th>Ekip Görevi</th>
                <th>Telefon</th>
                <th>Sertifika</th>
                <th>İmza</th>
              </tr>
            </thead>

            <tbody>${rows}</tbody>
          </table>

          <section class="duty-note">
            <strong>Ekip Görevi:</strong>
            Acil durumlarda ekip liderinin ve
            acil durum koordinatörünün
            talimatlarına uygun hareket etmek;
            gerekli ilk müdahale, tahliye,
            haberleşme ve güvenlik görevlerini
            yerine getirmek.
          </section>

          <div class="approval-grid">
            <div>
              <strong>Ekip Lideri</strong>
              <span>Ad Soyad / İmza</span>
            </div>

            <div>
              <strong>İSG Uzmanı</strong>
              <span>Ad Soyad / İmza</span>
            </div>

            <div>
              <strong>İşyeri Yetkilisi</strong>
              <span>Kaşe / İmza</span>
            </div>
          </div>

          <footer>
            Bu liste işletmede görünür bir alana
            asılmak üzere hazırlanmıştır.
          </footer>
        </section>
      `;
    })
    .join("");
}

export function printEmergencyTeamTables(
  teams: EmergencySupportMember[],
  companyName: string,
  planNo = "",
  revisionNo = "R0"
) {
  const popup = window.open(
    "",
    "_blank",
    "width=1400,height=950"
  );

  if (!popup) {
    throw new Error(
      "PDF penceresi açılamadı."
    );
  }

  popup.document.write(`
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />

        <title>
          Acil Durum Destek Ekipleri
        </title>

        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            color: #111827;
            font-family:
              Arial,
              sans-serif;
          }

          .team-page {
            min-height: 185mm;
            page-break-after: always;
            display: flex;
            flex-direction: column;
          }

          .team-page:last-child {
            page-break-after: auto;
          }

          .document-header {
            border: 2px solid #7f1d1d;
            padding: 10px;
            display: grid;
            grid-template-columns:
              minmax(0, 1fr)
              310px;
            gap: 14px;
            align-items: center;
            margin-bottom: 9px;
          }

          .brand {
            color: #7f1d1d;
            font-size: 25px;
            font-weight: 950;
          }

          h1 {
            margin: 4px 0;
            font-size: 17px;
          }

          h2 {
            margin: 0;
            color: #7f1d1d;
            font-size: 20px;
          }

          table {
            width: 100%;
            border-collapse:
              collapse;
          }

          th,
          td {
            border: 1px solid #64748b;
            padding: 6px;
            vertical-align: middle;
          }

          .meta {
            font-size: 10px;
          }

          .meta th {
            width: 34%;
            text-align: left;
            background: #f1f5f9;
          }

          .member-table {
            table-layout: fixed;
            font-size: 9px;
          }

          .member-table th {
            background: #7f1d1d;
            color: #ffffff;
            font-weight: 900;
          }

          .member-table th:nth-child(1) {
            width: 4%;
          }

          .member-table th:nth-child(2) {
            width: 16%;
          }

          .member-table th:nth-child(3) {
            width: 16%;
          }

          .member-table th:nth-child(4) {
            width: 12%;
          }

          .member-table th:nth-child(5) {
            width: 13%;
          }

          .member-table th:nth-child(6) {
            width: 11%;
          }

          .member-table th:nth-child(7) {
            width: 15%;
          }

          .member-table th:nth-child(8) {
            width: 13%;
          }

          .member-table td {
            height: 14mm;
          }

          .signature-cell {
            min-height: 13mm;
          }

          .empty {
            height: 35mm;
            text-align: center;
            color: #64748b;
          }

          .duty-note {
            margin-top: 8px;
            padding: 8px;
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            font-size: 9px;
          }

          .approval-grid {
            margin-top: auto;
            padding-top: 10px;
            display: grid;
            grid-template-columns:
              repeat(3, 1fr);
            gap: 10px;
          }

          .approval-grid > div {
            min-height: 28mm;
            border: 1px solid #64748b;
            padding: 8px;
            text-align: center;
          }

          .approval-grid span {
            display: block;
            margin-top: 18mm;
            font-size: 9px;
          }

          footer {
            margin-top: 7px;
            color: #64748b;
            font-size: 8px;
            text-align: center;
          }
        </style>
      </head>

      <body>
        ${buildEmergencyTeamTablesHtml(
          teams,
          companyName,
          planNo,
          revisionNo
        )}

        <script>
          window.onload = () =>
            setTimeout(
              () => window.print(),
              350
            );
        </script>
      </body>
    </html>
  `);

  popup.document.close();
}