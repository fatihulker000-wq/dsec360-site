import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TrainingRecord = {
  id: string;
  employeeRemoteId: string;
  employeeName: string;
  employeeRegistryNo: string;
  employeeJobTitle?: string;
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
  completed: boolean;
};

type ArchiveResponse = {
  success?: boolean;
  trainings?: TrainingRecord[];
  error?: string;
  detail?: string;
};

type CompanyRow = Record<string, unknown>;

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

function durationLabel(minutes: number): string {
  if (!minutes || minutes <= 0) return "-";

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return [
    hours > 0 ? `${hours} saat` : "",
    remaining > 0 ? `${remaining} dakika` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function trainingModeFlags(value: string) {
  const normalized = clean(value)
    .toLocaleUpperCase("tr-TR");

  const isRemote =
    normalized.includes("ASENKRON") ||
    normalized.includes("SENKRON") ||
    normalized.includes("UZAKTAN");

  const isFaceToFace =
    normalized.includes("ORGUN") ||
    normalized.includes("ÖRGÜN") ||
    normalized.includes("YUZ_YUZE") ||
    normalized.includes("YÜZ_YÜZE");

  return {
    remote: isRemote,
    faceToFace: isFaceToFace || !isRemote,
  };
}

function checkbox(checked: boolean): string {
  return checked ? "☒" : "☐";
}

function certificateNo(
  firmId: string,
  employeeRemoteId: string,
  trainingDate: number | null
): string {
  const year = new Date(
    trainingDate || Date.now()
  ).getFullYear();

  const firmPart =
    firmId.replace(/[^a-zA-Z0-9]/g, "")
      .slice(-6)
      .toUpperCase() || "FIRMA";

  const employeePart =
    employeeRemoteId
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(-6)
      .toUpperCase() || "CALISAN";

  const datePart = String(
    trainingDate || Date.now()
  ).slice(-8);

  return `DSEC-${year}-${firmPart}-${employeePart}-${datePart}-EGT`;
}

const topics = [
  {
    group: "1. Genel konular",
    rows: [
      "a) Çalışma mevzuatı ile ilgili bilgiler",
      "b) Çalışanların yasal hak ve sorumlulukları",
      "c) İşyeri temizliği ve düzeni",
      "ç) İş kazası ve meslek hastalığından doğan hukuki sonuçlar",
    ],
  },
  {
    group: "2. Sağlık konuları",
    rows: [
      "a) Meslek hastalıklarının sebepleri",
      "b) Hastalıktan korunma prensipleri ve korunma tekniklerinin uygulanması",
      "c) Biyolojik ve psikososyal risk etmenleri",
      "ç) İlkyardım",
      "d) Bağımlılık yapıcı maddelerin zararları ve teknoloji bağımlılığı",
    ],
  },
  {
    group: "3. Teknik konular",
    rows: [
      "a) Kimyasal, fiziksel ve ergonomik risk etmenleri",
      "b) Elle kaldırma ve taşıma",
      "c) Parlama, patlama",
      "ç) Yangın ve yangından korunma",
      "d) İş ekipmanlarının güvenli kullanımı",
      "e) Ekranlı araçlarla çalışma",
      "f) Elektrik, tehlikeleri, riskleri ve önlemleri",
      "g) İş kazalarının sebepleri ve korunma prensipleri ile tekniklerinin uygulanması",
      "ğ) Sağlık ve güvenlik işaretleri",
      "h) Kişisel koruyucu donanım kullanımı",
      "ı) İş sağlığı ve güvenliği genel kuralları ve güvenlik kültürü",
      "i) Acil durumlar, tahliye ve kurtarma",
    ],
  },
];

function topicRowsHtml(): string {
  return topics
    .map(
      (section) => `
        <tr class="group-row">
          <td colspan="2">${escapeHtml(section.group)}</td>
        </tr>
        ${section.rows
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(row)}</td>
                <td class="duration-cell"></td>
              </tr>
            `
          )
          .join("")}
      `
    )
    .join("");
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const firmId = clean(
      url.searchParams.get("firmId")
    );

    const requestedSessionKey = clean(
      url.searchParams.get("sessionKey")
    );

    const employeeRemoteId = clean(
      url.searchParams.get("employeeRemoteId")
    );

    if (
      !firmId ||
      !requestedSessionKey ||
      !employeeRemoteId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "firmId, sessionKey ve employeeRemoteId zorunlu.",
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
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Cookie: cookie,
        },
      }
    );

    const archiveJson: ArchiveResponse =
      await archiveResponse
        .json()
        .catch(() => ({}));

    if (!archiveResponse.ok) {
      throw new Error(
        archiveJson.detail ||
          archiveJson.error ||
          "Eğitim kaydı alınamadı."
      );
    }

    const record = (
      Array.isArray(archiveJson.trainings)
        ? archiveJson.trainings
        : []
    ).find(
      (item) =>
        sessionKey(item) ===
          requestedSessionKey &&
        item.employeeRemoteId ===
          employeeRemoteId
    );

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Çalışan eğitim kaydı bulunamadı.",
        },
        { status: 404 }
      );
    }

    const companyResponse = await fetch(
      `${url.origin}/api/admin/companies`,
      {
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

    const company = (
      Array.isArray(companyJson?.data)
        ? companyJson.data
        : []
    ).find(
      (item: CompanyRow) =>
        clean(item.id) === firmId
    );

    const companyName =
      clean(company?.name) ||
      clean(company?.title) ||
      clean(company?.company_name) ||
      "İşyeri";

    const employerName =
      clean(company?.employer_name) ||
      clean(company?.employerName) ||
      clean(company?.authorized_person) ||
      clean(company?.authorizedPerson) ||
      "";

    const mode = trainingModeFlags(
      record.deliveryMode
    );

    const certificateId = certificateNo(
      firmId,
      employeeRemoteId,
      record.trainingDate
    );

    const employeeDisplay = [
      record.employeeName,
      record.employeeJobTitle,
    ]
      .filter(Boolean)
      .join(" - ");

    const trainerDisplay = [
      record.trainerName,
      record.trainerRole,
    ]
      .filter(Boolean)
      .join(" - ");

    const issuerDisplay =
      record.trainerOrg ||
      trainerDisplay ||
      "İşyerinde görevli iş güvenliği uzmanı ve işyeri hekimi";

    const trainingType =
      clean(record.trainingType)
        .toLocaleUpperCase("tr-TR");

    const isRepeat =
      trainingType.includes("TEKRAR") ||
      trainingType.includes("YENILEME") ||
      trainingType.includes("YENİLEME");

    const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width,initial-scale=1"
  />

  <title>Temel Eğitim Belgesi</title>

  <style>
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #eceff3;
      color: #111;
      font-family:
        "Times New Roman",
        Times,
        serif;
    }

    .toolbar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      justify-content: center;
      gap: 10px;
      padding: 11px;
      background: #111827;
    }

    .toolbar button {
      border: 0;
      border-radius: 8px;
      padding: 10px 16px;
      background: #fff;
      color: #111827;
      font-family: Arial, sans-serif;
      font-weight: 800;
      cursor: pointer;
    }

    .sheet {
      width: 210mm;
      min-height: 297mm;
      margin: 16px auto;
      padding: 14mm 13mm 12mm;
      background: #fff;
      box-shadow:
        0 12px 35px
        rgba(15, 23, 42, 0.14);
      page-break-after: always;
      position: relative;
    }

    .sheet:last-child {
      page-break-after: auto;
    }

    .appendix-title {
      margin: 0 0 2mm;
      font-size: 16pt;
      font-weight: 700;
    }

    .face-label {
      margin-bottom: 8mm;
      font-size: 10pt;
    }

    .document-title {
      margin: 0 0 11mm;
      font-size: 14pt;
      font-weight: 700;
    }

    .official-text {
      font-size: 11.5pt;
      line-height: 1.45;
    }

    .official-text p {
      margin: 0 0 7mm;
    }

    .indent-line {
      padding-left: 17mm;
    }

    .field-list {
      margin-top: 14mm;
      font-size: 11.5pt;
      line-height: 1.55;
    }

    .field-list div {
      min-height: 6mm;
    }

    .signature-block {
      margin-top: 11mm;
      font-size: 11.5pt;
      line-height: 1.5;
    }

    .signature-space {
      display: inline-block;
      min-width: 75mm;
      border-bottom:
        1px dotted #555;
    }

    .certificate-no {
      position: absolute;
      right: 13mm;
      bottom: 10mm;
      font-size: 9pt;
    }

    .document-note {
      position: absolute;
      left: 13mm;
      bottom: 10mm;
      max-width: 125mm;
      font-size: 8.5pt;
      font-style: italic;
    }

    .topics-title-row {
      display: grid;
      grid-template-columns: 1fr 34mm;
      border:
        1px solid #111;
      border-bottom: 0;
      font-size: 10pt;
      font-weight: 700;
    }

    .topics-title-row div {
      padding: 2mm 2.5mm;
      border-right:
        1px solid #111;
    }

    .topics-title-row div:last-child {
      border-right: 0;
      text-align: center;
    }

    .topics-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 8.5pt;
      line-height: 1.08;
    }

    .topics-table td {
      border: 1px solid #111;
      padding: 1.15mm 2mm;
      vertical-align: top;
    }

    .topics-table .duration-cell {
      width: 34mm;
      text-align: center;
    }

    .topics-table .group-row td {
      padding-top: 1.3mm;
      padding-bottom: 1.3mm;
      background: #f3f3f3;
      font-weight: 700;
    }

    .risk-title {
      font-weight: 700;
      background: #f3f3f3;
    }

    .risk-option {
      line-height: 1.22;
    }

    .footnote {
      margin-top: 3mm;
      font-size: 8.5pt;
      font-style: italic;
      line-height: 1.25;
    }

    @page {
      size: A4 portrait;
      margin: 0;
    }

    @media print {
      html,
      body {
        background: #fff;
      }

      .toolbar {
        display: none;
      }

      .sheet {
        width: 210mm;
        min-height: 297mm;
        margin: 0;
        box-shadow: none;
      }
    }
  </style>
</head>

<body>
  <div class="toolbar">
    <button onclick="window.print()">
      Yazdır / İki Sayfa PDF Kaydet
    </button>

    <button onclick="window.close()">
      Kapat
    </button>
  </div>

  <!-- SAYFA 1 / ÖN YÜZ -->
  <section class="sheet">
    <h1 class="appendix-title">
      Ek-2 TEMEL EĞİTİM BELGESİ
    </h1>

    <div class="face-label">
      (ÖN YÜZ)
    </div>

    <h2 class="document-title">
      TEMEL EĞİTİM BELGESİ
    </h2>

    <div class="official-text">
      <p>İşbu belge,</p>

      <p>
        <strong>${escapeHtml(
          employeeDisplay || record.employeeName
        )}</strong>
        (çalışanın adı, soyadı ve unvanı) adına
      </p>

      <p class="indent-line">
        Çalışanların İş Sağlığı ve Güvenliği
        Eğitimlerinin Usul ve Esasları Hakkında
        Yönetmelik kapsamında
        <strong>${escapeHtml(
          issuerDisplay
        )}</strong>
        (Eğitimi veren kişi/kurum/kuruluş)
        tarafından
        <strong>${escapeHtml(
          formatDate(record.trainingDate)
        )}</strong>
        tarihinde gerçekleştirilen temel eğitim
        sonunda düzenlenmiştir.
      </p>
    </div>

    <div class="field-list">
      <div>
        Belge düzenlenme tarihi:
        <strong>${escapeHtml(
          formatDate(Date.now())
        )}</strong>
      </div>

      <div>
        Eğitimin süresi:
        <strong>${escapeHtml(
          durationLabel(record.durationMinutes)
        )}</strong>
      </div>

      <div>
        Eğitimin türü:
        İlk defa verilen temel eğitim
        ${checkbox(!isRepeat)}
      </div>

      <div class="indent-line">
        Tekrar verilen temel eğitim
        ${checkbox(isRepeat)}
      </div>

      <div>
        Eğitimin şekli:
        Uzaktan
        ${checkbox(mode.remote)}
        (Başlık
        ${mode.remote
          ? escapeHtml(record.trainingTitle)
          : "………………"}
        )
      </div>

      <div class="indent-line">
        Yüz yüze
        ${checkbox(mode.faceToFace)}
        (Başlık
        ${mode.faceToFace
          ? escapeHtml(record.trainingTitle)
          : "………………"}
        )
      </div>

      <div>
        Eğiticilerin adı soyadı ve unvanı:
        <strong>${escapeHtml(
          trainerDisplay || "-"
        )}</strong>
      </div>

      <div>
        Eğiticilerin imzası:
        <span class="signature-space"></span>
      </div>
    </div>

    <div class="signature-block">
      <div>
        Çalışanın işyerinin unvanı:
        <strong>${escapeHtml(companyName)}</strong>
      </div>

      <div>
        İşverenin/işveren vekilinin adı soyadı:
        <strong>${escapeHtml(
          employerName || "-"
        )}</strong>
      </div>

      <div>
        İşveren/işveren vekilinin imzası:
        <span class="signature-space"></span>
      </div>
    </div>

    <div class="document-note">
      Bu belge, Çalışanların İş Sağlığı ve
      Güvenliği Eğitimlerinin Usul ve Esasları
      Hakkında Yönetmelik Ek-2 örneğine göre
      düzenlenmiştir.
    </div>

    <div class="certificate-no">
      Belge No:
      ${escapeHtml(certificateId)}
    </div>
  </section>

  <!-- SAYFA 2 / ARKA YÜZ -->
  <section class="sheet">
    <h1 class="appendix-title">
      Ek-2 TEMEL EĞİTİM BELGESİ
    </h1>

    <div class="face-label">
      (ARKA YÜZ)
    </div>

    <div class="topics-title-row">
      <div>EĞİTİM KONULARI</div>
      <div>SÜRE</div>
    </div>

    <table class="topics-table">
      <tbody>
        ${topicRowsHtml()}

        <tr class="risk-title">
          <td colspan="2">
            4. İşe ve işyerine özgü riskler ve
            risk değerlendirmesine dayalı konular
            (Tehlikeli ve Çok Tehlikeli Sınıf) /
            Faaliyetin Genel Riskleri
            (Az Tehlikeli Sınıf)
          </td>
        </tr>

        <tr>
          <td class="risk-option">
            a) (Tehlikeli veya Çok Tehlikeli
            Sınıf) İşyerinin acil durum planı,
            risk değerlendirmesi dokümanı,
            bulunması halinde patlamadan korunma
            dokümanı ve iş sağlığı ve güvenliği
            mevzuatı kapsamında hazırlanan diğer
            dokümanlarda belirlenmiş olan hususlar
            ile işyerine ve işe özgü hususları
            içeren yüksekte çalışma, kapalı ortamda
            çalışma, yangın, radyasyon riskinin
            bulunduğu ortamlarda çalışma, kaynakla
            çalışma, özel risk taşıyan ekipman ile
            çalışma, kanserojen veya mutajen
            maddelerle, kimyasal veya biyolojik
            etkenlerle çalışma ve benzeri konular
            ☐
          </td>
          <td class="duration-cell"></td>
        </tr>

        <tr>
          <td class="risk-option">
            b) (Az Tehlikeli Sınıf) Faaliyetin
            genel tehlike ve riskleri
            (yüksekte çalışma, yüksekten düşme,
            kapalı ortamda çalışma, yangın,
            özel risk taşıyan ekipmanla çalışma
            gibi) ☐
          </td>
          <td class="duration-cell"></td>
        </tr>

        <tr>
          <td>
            İlave / işe ve işyerine özgü konu:
            ${escapeHtml(record.trainingTitle)}
          </td>
          <td class="duration-cell">
            ${escapeHtml(
              durationLabel(record.durationMinutes)
            )}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="footnote">
      * İşveren, Ek-2’de yer alan temel eğitimin
      dördüncü konu başlığını tehlike sınıfına
      uygun şekilde a) veya b) seçeneğini işaretler
      ve varsa ilave konuları da ekler.
    </div>

    <div class="certificate-no">
      Belge No:
      ${escapeHtml(certificateId)}
    </div>
  </section>
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
          "Temel eğitim belgesi oluşturulamadı.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}