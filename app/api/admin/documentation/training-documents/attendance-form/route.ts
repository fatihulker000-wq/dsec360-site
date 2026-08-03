import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TrainingRecord = {
  id: string;
  employeeRemoteId: string;
  employeeName: string;
  employeeRegistryNo: string;
  trainingTitle: string;
  trainingType: string;
  deliveryMode: string;
  trainingDate: number | null;
  validUntil: number | null;
  trainingTimeText: string;
  durationMinutes: number;
  trainerName: string;
  trainerRole: string;
  trainerOrg: string;
  trainingPlace: string;
  onlineUrl: string;
  completionNote: string;
  completed: boolean;
  documentUri: string;
  attendanceUri: string;
  certificateUri: string;
};

type ArchiveResponse = {
  success?: boolean;
  trainings?: TrainingRecord[];
  error?: string;
  detail?: string;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function escapeHtml(value: unknown): string {
  return clean(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value: number | null): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function sessionKey(record: TrainingRecord): string {
  return [
    record.trainingTitle.trim(),
    record.trainingDate ?? 0,
    record.trainingTimeText.trim(),
    record.trainerName.trim(),
    record.trainingPlace.trim(),
  ].join("|");
}

function deliveryLabel(value: string): string {
  const normalized = clean(value).toLocaleUpperCase("tr-TR");

  if (normalized === "SENKRON") return "Senkron / Canlı";
  if (normalized === "ASENKRON") return "Asenkron / Uzaktan";
  if (normalized === "YUZ_YUZE" || normalized === "YÜZ_YÜZE") {
    return "Yüz yüze";
  }

  return clean(value) || "Belirtilmedi";
}

function durationLabel(minutes: number): string {
  if (!minutes || minutes <= 0) {
    return "Belirtilmedi";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours} saat ${remainingMinutes} dakika`;
  }

  if (hours > 0) {
    return `${hours} saat`;
  }

  return `${remainingMinutes} dakika`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const firmId = clean(url.searchParams.get("firmId"));
    const requestedSessionKey = clean(
      url.searchParams.get("sessionKey")
    );

    if (!firmId || !requestedSessionKey) {
      return NextResponse.json(
        {
          success: false,
          error: "firmId ve sessionKey zorunlu.",
        },
        { status: 400 }
      );
    }

    const cookie = req.headers.get("cookie") || "";

    const archiveResponse = await fetch(
      `${url.origin}/api/admin/documentation/training-documents?firmId=${encodeURIComponent(
        firmId
      )}`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Cookie: cookie,
        },
      }
    );

    const archiveJson: ArchiveResponse =
      await archiveResponse.json().catch(() => ({}));

    if (!archiveResponse.ok) {
      throw new Error(
        archiveJson.detail ||
          archiveJson.error ||
          "Eğitim kayıtları alınamadı."
      );
    }

    const allTrainings = Array.isArray(archiveJson.trainings)
      ? archiveJson.trainings
      : [];

    const records = allTrainings
      .filter(
        (record) =>
          sessionKey(record) === requestedSessionKey
      )
      .sort((first, second) =>
        first.employeeName.localeCompare(
          second.employeeName,
          "tr"
        )
      );

    if (!records.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Eğitim oturumu bulunamadı.",
        },
        { status: 404 }
      );
    }

    const session = records[0];

    const companyResponse = await fetch(
      `${url.origin}/api/admin/companies`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Cookie: cookie,
        },
      }
    );

    const companyJson = await companyResponse
      .json()
      .catch(() => ({}));

    const companies = Array.isArray(companyJson?.data)
      ? companyJson.data
      : [];

    const selectedCompany =
      companies.find(
        (item: Record<string, unknown>) =>
          clean(item.id) === firmId
      ) || null;

    const companyName =
      clean(selectedCompany?.name) ||
      clean(selectedCompany?.title) ||
      clean(selectedCompany?.company_name) ||
      "İşyeri";

    const participantRows = records
      .map(
        (record, index) => `
          <tr>
            <td class="center">${index + 1}</td>
            <td>${escapeHtml(record.employeeName)}</td>
            <td>${escapeHtml(record.employeeRegistryNo || "-")}</td>
            <td class="center">${
              record.completed ? "Tamamlandı" : "Katıldı"
            }</td>
            <td class="signature"></td>
          </tr>
        `
      )
      .join("");

    /*
     * Mevcut veri modelinde ayrı bir "konu başlıkları" dizisi yok.
     * Yönetmelikte konu başlıklarının tutanakta yer alması gerektiği için
     * bu pakette eğitim başlığı ana konu olarak gösterilmektedir.
     * Eğitimler modülüne konu başlığı alanları eklendiğinde bu bölüm
     * aynı kayıt üzerinden çok satırlı hale getirilebilir.
     */
    const subjectRows = `
      <tr>
        <td>1</td>
        <td>${escapeHtml(session.trainingTitle)}</td>
        <td>${escapeHtml(durationLabel(session.durationMinutes))}</td>
      </tr>
    `;

    const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width,initial-scale=1"
  />
  <title>${escapeHtml(
    session.trainingTitle
  )} - Eğitim Katılım Formu</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #eef2f7;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      justify-content: center;
      gap: 10px;
      padding: 12px;
      background: #111827;
    }

    .toolbar button {
      border: 0;
      border-radius: 9px;
      padding: 10px 16px;
      background: #ffffff;
      color: #111827;
      font-weight: 800;
      cursor: pointer;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 18px auto;
      padding: 13mm;
      background: #ffffff;
      box-shadow: 0 12px 40px rgba(15,23,42,.14);
    }

    .header {
      display: grid;
      grid-template-columns: 92px 1fr 120px;
      align-items: center;
      gap: 12px;
      border: 2px solid #7f1d1d;
      padding: 10px;
    }

    .brand {
      display: grid;
      place-items: center;
      height: 68px;
      border-radius: 10px;
      background: #7f1d1d;
      color: #ffffff;
      font-size: 24px;
      font-weight: 950;
      letter-spacing: .5px;
    }

    .headerTitle {
      text-align: center;
    }

    .headerTitle h1 {
      margin: 0;
      color: #7f1d1d;
      font-size: 19px;
      letter-spacing: .3px;
    }

    .headerTitle div {
      margin-top: 5px;
      color: #475569;
      font-size: 12px;
    }

    .formMeta {
      font-size: 10px;
      line-height: 1.5;
      color: #475569;
      text-align: right;
    }

    .company {
      margin-top: 12px;
      padding: 10px 12px;
      border: 1px solid #94a3b8;
      background: #f8fafc;
      font-size: 14px;
    }

    .infoGrid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      margin-top: 12px;
      border-top: 1px solid #64748b;
      border-left: 1px solid #64748b;
    }

    .info {
      min-height: 42px;
      padding: 7px 9px;
      border-right: 1px solid #64748b;
      border-bottom: 1px solid #64748b;
      font-size: 11px;
      line-height: 1.45;
    }

    .info strong {
      display: block;
      margin-bottom: 3px;
      color: #334155;
      font-size: 10px;
      text-transform: uppercase;
    }

    h2 {
      margin: 17px 0 7px;
      color: #7f1d1d;
      font-size: 13px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    th,
    td {
      border: 1px solid #64748b;
      padding: 6px;
      font-size: 10px;
      vertical-align: middle;
    }

    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 900;
      text-align: left;
    }

    .center {
      text-align: center;
    }

    .signature {
      width: 90px;
      height: 31px;
    }

    .approvalGrid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
      margin-top: 34px;
    }

    .approval {
      min-height: 92px;
      padding-top: 8px;
      border-top: 1px solid #334155;
      text-align: center;
      font-size: 11px;
      line-height: 1.55;
    }

    .note {
      margin-top: 18px;
      padding: 9px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #475569;
      font-size: 9px;
      line-height: 1.5;
    }

    .footer {
      margin-top: 14px;
      color: #64748b;
      font-size: 9px;
      text-align: center;
    }

    @page {
      size: A4 portrait;
      margin: 8mm;
    }

    @media print {
      body {
        background: #ffffff;
      }

      .toolbar {
        display: none;
      }

      .page {
        width: auto;
        min-height: auto;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
    }
  </style>
</head>

<body>
  <div class="toolbar">
    <button onclick="window.print()">
      Yazdır / PDF Kaydet
    </button>
    <button onclick="window.close()">
      Kapat
    </button>
  </div>

  <main class="page">
    <header class="header">
      <div class="brand">D-SEC</div>

      <div class="headerTitle">
        <h1>EĞİTİM KATILIM FORMU</h1>
        <div>
          İş Sağlığı ve Güvenliği Eğitim Kaydı
        </div>
      </div>

      <div class="formMeta">
        Form No: DSEC-EGT-01<br />
        Revizyon: 00<br />
        Düzenleme: ${escapeHtml(
          new Intl.DateTimeFormat("tr-TR").format(
            new Date()
          )
        )}
      </div>
    </header>

    <div class="company">
      <strong>İşyeri / Firma:</strong>
      ${escapeHtml(companyName)}
    </div>

    <section class="infoGrid">
      <div class="info">
        <strong>Eğitimin Adı</strong>
        ${escapeHtml(session.trainingTitle)}
      </div>

      <div class="info">
        <strong>Eğitim Türü</strong>
        ${escapeHtml(session.trainingType || "-")}
      </div>

      <div class="info">
        <strong>Eğitim Tarihi</strong>
        ${escapeHtml(formatDate(session.trainingDate))}
      </div>

      <div class="info">
        <strong>Eğitim Saati</strong>
        ${escapeHtml(
          session.trainingTimeText ||
            "Belirtilmedi"
        )}
      </div>

      <div class="info">
        <strong>Eğitim Süresi</strong>
        ${escapeHtml(
          durationLabel(session.durationMinutes)
        )}
      </div>

      <div class="info">
        <strong>Eğitim Şekli</strong>
        ${escapeHtml(
          deliveryLabel(session.deliveryMode)
        )}
      </div>

      <div class="info">
        <strong>Eğitim Yeri</strong>
        ${escapeHtml(
          session.trainingPlace ||
            "Belirtilmedi"
        )}
      </div>

      <div class="info">
        <strong>Katılımcı Sayısı</strong>
        ${records.length}
      </div>

      <div class="info">
        <strong>Eğitici</strong>
        ${escapeHtml(
          session.trainerName ||
            "Belirtilmedi"
        )}
      </div>

      <div class="info">
        <strong>Eğitici Unvanı / Kurumu</strong>
        ${escapeHtml(
          [
            session.trainerRole,
            session.trainerOrg,
          ]
            .filter(Boolean)
            .join(" • ") || "Belirtilmedi"
        )}
      </div>
    </section>

    <h2>EĞİTİM KONU BAŞLIKLARI</h2>

    <table>
      <thead>
        <tr>
          <th style="width:42px">No</th>
          <th>Konu Başlığı</th>
          <th style="width:130px">Süre</th>
        </tr>
      </thead>
      <tbody>
        ${subjectRows}
      </tbody>
    </table>

    <h2>KATILIMCI LİSTESİ</h2>

    <table>
      <thead>
        <tr>
          <th style="width:38px">No</th>
          <th>Adı Soyadı</th>
          <th style="width:100px">Sicil No</th>
          <th style="width:90px">Durum</th>
          <th style="width:95px">İmza</th>
        </tr>
      </thead>
      <tbody>
        ${participantRows}
      </tbody>
    </table>

    <section class="approvalGrid">
      <div class="approval">
        <strong>EĞİTİCİ</strong><br />
        ${escapeHtml(
          session.trainerName || "Ad Soyad"
        )}<br />
        ${escapeHtml(
          session.trainerRole || "Unvan"
        )}<br /><br />
        İmza
      </div>

      <div class="approval">
        <strong>İŞVEREN / İŞVEREN VEKİLİ</strong><br />
        Ad Soyad<br />
        Unvan<br /><br />
        İmza / Kaşe
      </div>
    </section>

    <div class="note">
      Bu form, eğitim oturumuna katılan çalışanların
      katılımının kayıt altına alınması amacıyla
      düzenlenmiştir. İmzalanan nüsha, eğitim
      kayıtlarıyla birlikte muhafaza edilmelidir.
    </div>

    <div class="footer">
      D-SEC Dijital Sağlık • Emniyet • Çevre
    </div>
  </main>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type":
          "text/html; charset=utf-8",
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Eğitim katılım formu oluşturulamadı.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}