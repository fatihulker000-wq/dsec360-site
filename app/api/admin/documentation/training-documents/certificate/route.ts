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

  if (Number.isNaN(date.getTime())) return "-";

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
  if (!minutes) return "-";

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return [
    hours ? `${hours} saat` : "",
    remaining ? `${remaining} dakika` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function modeLabel(value: string): string {
  const normalized = clean(value).toUpperCase();

  if (normalized === "ASENKRON") {
    return "Uzaktan / Asenkron";
  }

  if (normalized === "SENKRON") {
    return "Uzaktan / Senkron";
  }

  return clean(value) || "Yüz yüze";
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const firmId = clean(url.searchParams.get("firmId"));
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
      await archiveResponse.json().catch(() => ({}));

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
        sessionKey(item) === requestedSessionKey &&
        item.employeeRemoteId === employeeRemoteId
    );

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: "Çalışan eğitim kaydı bulunamadı.",
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
      (item: Record<string, unknown>) =>
        clean(item.id) === firmId
    );

    const companyName =
      clean(company?.name) ||
      clean(company?.title) ||
      clean(company?.company_name) ||
      "İşyeri";

    const isBasic =
      /temel|isg|iş sağlığı/i.test(
        record.trainingTitle
      );

    const documentTitle = isBasic
      ? "TEMEL EĞİTİM BELGESİ"
      : "EĞİTİM BELGESİ";

    const certificateNo = [
      "DSEC",
      firmId.slice(-6),
      employeeRemoteId.slice(-6),
      String(record.trainingDate || Date.now()).slice(-8),
    ]
      .join("-")
      .toUpperCase();

    const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(documentTitle)}</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#eef2f7;color:#111827;font-family:Arial,sans-serif}
.toolbar{position:sticky;top:0;z-index:5;padding:12px;text-align:center;background:#111827}
.toolbar button{border:0;border-radius:9px;padding:10px 18px;font-weight:800;cursor:pointer}
.page{width:297mm;min-height:210mm;margin:18px auto;padding:12mm;background:white;box-shadow:0 14px 45px rgba(15,23,42,.15)}
.frame{min-height:184mm;border:4px double #7f1d1d;padding:10mm;position:relative}
.brand{text-align:center;color:#7f1d1d;font-size:24px;font-weight:950}
.title{text-align:center;margin:16px 0 4px;font-size:30px;color:#7f1d1d;letter-spacing:1px}
.subtitle{text-align:center;color:#64748b;font-size:13px}
.lead{text-align:center;margin:22px auto 10px;max-width:900px;font-size:16px;line-height:1.7}
.employee{text-align:center;margin:12px 0;font-size:30px;font-weight:950}
.job{text-align:center;color:#475569;font-size:15px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:24px}
.box{border:1px solid #94a3b8;border-radius:8px;padding:9px;min-height:58px;font-size:12px}
.box strong{display:block;color:#7f1d1d;margin-bottom:5px;font-size:10px;text-transform:uppercase}
.subjects{margin-top:20px;border-collapse:collapse;width:100%}
.subjects th,.subjects td{border:1px solid #94a3b8;padding:7px;font-size:11px}
.subjects th{background:#f8fafc;color:#334155}
.signatures{display:grid;grid-template-columns:1fr 1fr;gap:80px;margin-top:35px;text-align:center}
.sign{border-top:1px solid #334155;padding-top:8px;font-size:11px;line-height:1.55}
.no{position:absolute;right:10mm;bottom:7mm;color:#64748b;font-size:10px}
.note{position:absolute;left:10mm;bottom:7mm;color:#64748b;font-size:9px}
@page{size:A4 landscape;margin:6mm}
@media print{
 body{background:white}
 .toolbar{display:none}
 .page{width:auto;min-height:auto;margin:0;padding:0;box-shadow:none}
}
</style>
</head>
<body>
<div class="toolbar">
<button onclick="window.print()">Yazdır / PDF Kaydet</button>
</div>
<main class="page">
<section class="frame">
<div class="brand">D-SEC</div>
<h1 class="title">${escapeHtml(documentTitle)}</h1>
<div class="subtitle">İş Sağlığı ve Güvenliği Eğitim Belgesi</div>

<p class="lead">
<strong>${escapeHtml(companyName)}</strong> işyerinde çalışan
aşağıda bilgileri bulunan kişinin belirtilen eğitimi
tamamladığı kayıt altına alınmıştır.
</p>

<div class="employee">${escapeHtml(record.employeeName)}</div>
<div class="job">
Sicil No: ${escapeHtml(record.employeeRegistryNo || "-")}
</div>

<section class="grid">
<div class="box"><strong>Eğitimin Adı</strong>${escapeHtml(record.trainingTitle)}</div>
<div class="box"><strong>Eğitim Tarihi</strong>${escapeHtml(formatDate(record.trainingDate))}</div>
<div class="box"><strong>Belge Düzenlenme Tarihi</strong>${escapeHtml(formatDate(Date.now()))}</div>
<div class="box"><strong>Toplam Süre</strong>${escapeHtml(durationLabel(record.durationMinutes))}</div>
<div class="box"><strong>Eğitim Şekli</strong>${escapeHtml(modeLabel(record.deliveryMode))}</div>
<div class="box"><strong>Eğitimi Veren</strong>${escapeHtml(record.trainerName || "-")}</div>
<div class="box"><strong>Eğitici Unvanı</strong>${escapeHtml(record.trainerRole || "-")}</div>
<div class="box"><strong>Eğitici Kurumu</strong>${escapeHtml(record.trainerOrg || "-")}</div>
<div class="box"><strong>Eğitim Yeri</strong>${escapeHtml(record.trainingPlace || "-")}</div>
</section>

<table class="subjects">
<thead>
<tr>
<th>Konu Grubu</th>
<th>Eğitim Konusu</th>
<th>Süre</th>
</tr>
</thead>
<tbody>
<tr>
<td>${isBasic ? "Temel İSG Eğitimi" : "İşe / İşyerine Özgü Eğitim"}</td>
<td>${escapeHtml(record.trainingTitle)}</td>
<td>${escapeHtml(durationLabel(record.durationMinutes))}</td>
</tr>
</tbody>
</table>

<section class="signatures">
<div class="sign">
<strong>EĞİTİCİ</strong><br/>
${escapeHtml(record.trainerName || "Ad Soyad")}<br/>
${escapeHtml(record.trainerRole || "Unvan")}<br/><br/>
İmza
</div>
<div class="sign">
<strong>İŞVEREN / İŞVEREN VEKİLİ</strong><br/>
Ad Soyad<br/>
Unvan<br/><br/>
İmza / Kaşe
</div>
</section>

<div class="note">
İmzalanan belge çalışanın özlük dosyasında muhafaza edilmelidir.
</div>
<div class="no">Belge No: ${escapeHtml(certificateNo)}</div>
</section>
</main>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type":
          "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Eğitim belgesi oluşturulamadı.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}