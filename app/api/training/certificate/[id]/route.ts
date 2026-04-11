import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateTr(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("tr-TR");
}

function formatDateOnlyTr(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("tr-TR");
}

function buildCertificateNo(assignmentId: string) {
  return `DSEC-ISG-${assignmentId.slice(0, 8).toUpperCase()}-${new Date().getFullYear()}`;
}

function buildVerificationCode() {
  return crypto.randomBytes(8).toString("hex").toUpperCase();
}

function parseTrainingTopics(topicsText?: string | null) {
  const raw = String(topicsText || "").trim();

  if (!raw) return [];

  return raw
    .replace(/\r/g, "\n")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => x.replace(/^[-–—•]\s*/, "").trim())
    .filter(Boolean);
}

function topicsToRows(topics: string[]) {
  if (!topics.length) {
    return `
      <tr>
        <td>1</td>
        <td>Bu eğitim için konu bilgisi girilmemiştir.</td>
      </tr>
    `;
  }

  return topics
    .map(
      (topic, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(topic)}</td>
        </tr>
      `
    )
    .join("");
}

function formatRoleLabel(role?: string | null) {
  const raw = String(role || "").trim();
  if (!raw) return "-";

  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function normalizeTopicText(text: string) {
  return String(text || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "c");
}

type GroupedTopicSections = {
  genel: string[];
  saglik: string[];
  teknik: string[];
  iseOzel: string[];
};

type RegulationSectionKey = keyof GroupedTopicSections;

function detectIsgRegulationSection(
  trainingTitle?: string | null,
  trainingDescription?: string | null,
  topics: string[] = []
): RegulationSectionKey | null {
  const allText = normalizeTopicText(
    [trainingTitle || "", trainingDescription || "", ...topics].join("\n")
  );

  if (
    allText.includes("genel konular") ||
    allText.includes("1. genel konular") ||
    allText === "genel konular"
  ) {
    return "genel";
  }

  if (
    allText.includes("saglik konulari") ||
    allText.includes("2. saglik konulari") ||
    allText === "saglik konulari"
  ) {
    return "saglik";
  }

  if (
    allText.includes("teknik konular") ||
    allText.includes("3. teknik konular") ||
    allText === "teknik konular"
  ) {
    return "teknik";
  }

  if (
    allText.includes("ise ve isyerine ozgu riskler") ||
    allText.includes("ise ve isyerine ozel riskler") ||
    allText.includes("risk degerlendirmesine dayali konular") ||
    allText.includes("4. ise ve isyerine ozgu riskler")
  ) {
    return "iseOzel";
  }

  return null;
}

function isOfficialBasicIsgTemplate(sectionKey: RegulationSectionKey | null) {
  return sectionKey === "genel" || sectionKey === "saglik" || sectionKey === "teknik";
}

function buildRegulationSectionsFromSingleTraining(
  sectionKey: RegulationSectionKey | null,
  topics: string[]
): GroupedTopicSections | null {
  if (!sectionKey) return null;

  return {
    genel: sectionKey === "genel" ? topics : [],
    saglik: sectionKey === "saglik" ? topics : [],
    teknik: sectionKey === "teknik" ? topics : [],
    iseOzel: sectionKey === "iseOzel" ? topics : [],
  };
}

function buildStandardTopicsTableRows(topics: string[]) {
  return topicsToRows(topics);
}

function buildGroupedTopicList(items: string[]) {
  if (!items.length) {
    return `<li style="opacity:.65;">-</li>`;
  }

  return items
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
}

type AssignmentRow = {
  id: string;
  status: string;
  completed_at: string | null;
  started_at: string | null;
  training_id: string | null;
  certificate_no: string | null;
  certificate_issued_at: string | null;
  verification_code: string | null;
  final_exam_passed: boolean | null;
  final_exam_score: number | null;
};

type TrainingRow = {
  id: string;
  title: string | null;
  description: string | null;
  type: string | null;
  topics_text: string | null;
  duration_minutes: number | null;
};

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

function buildStandardCertificateHtml(params: {
  documentTitle: string;
  badgeText: string;
  mainHeading: string;
  introText: string;
  noteText: string;
  certificateNo: string;
  verificationCode: string;
  issueDate: string;
  completedDate: string;
  startedDate: string;
  safeCompanyName: string;
  safeUserFullName: string;
  safeUserEmail: string;
  safeUserRole: string;
  trainingTitle: string;
  trainingDescription: string;
  trainingType: string;
  durationText: string;
  scoreCard: string;
  topicsRows: string;
  verifyUrl: string;
  qrImageUrl: string;
  isCertificate: boolean;
}) {
  const statusChip = params.isCertificate
    ? `<div class="eyebrow">BAŞARIYLA TAMAMLANDI</div>`
    : `<div class="eyebrow secondary">EĞİTİM KAYDI</div>`;

  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${params.documentTitle}</title>
        <style>
          * { box-sizing: border-box; }

          body {
            margin: 0;
            padding: 18px;
            font-family: Arial, Helvetica, sans-serif;
            background:
              radial-gradient(circle at top left, rgba(239,68,68,.06), transparent 28%),
              radial-gradient(circle at top right, rgba(15,118,110,.06), transparent 22%),
              #f4f6fb;
            color: #111827;
          }

          .page-wrap {
            max-width: 1240px;
            margin: 0 auto;
          }

          .toolbar {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 16px;
          }

          .print-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 12px 18px;
            border-radius: 12px;
            background: #111827;
            color: #fff;
            text-decoration: none;
            font-size: 14px;
            font-weight: 700;
          }

          .sheet {
            background: #fff;
            border-radius: 30px;
            overflow: hidden;
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.10);
            margin-bottom: 20px;
            border: 1px solid #e5e7eb;
            position: relative;
          }

          .sheet::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background:
              linear-gradient(135deg, rgba(207,61,46,.05), transparent 18%),
              linear-gradient(315deg, rgba(15,118,110,.05), transparent 18%);
          }

          .sheet-inner {
            position: relative;
            padding: 34px 38px 30px;
          }

          .sheet-front {
            border: 10px solid #cf3d2e;
          }

          .sheet-back {
            border: 10px solid #0f766e;
          }

          .top {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            align-items: flex-start;
          }

          .brand {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .brand-icon {
            width: 78px;
            height: 78px;
            border-radius: 24px;
            background: linear-gradient(135deg, #ef4444, #f97316);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 34px;
            font-weight: 900;
            box-shadow: 0 12px 24px rgba(15, 23, 42, 0.16);
          }

          .brand-main {
            font-size: 31px;
            font-weight: 900;
            color: #cf3d2e;
            letter-spacing: 0.4px;
          }

          .brand-sub {
            margin-top: 4px;
            color: #6b7280;
            font-size: 13px;
          }

          .company-chip {
            margin-top: 10px;
            display: inline-block;
            padding: 8px 12px;
            border-radius: 999px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            color: #374151;
            font-size: 12px;
            font-weight: 700;
          }

          .badge-wrap {
            text-align: right;
          }

          .badge {
            display: inline-block;
            padding: 10px 14px;
            border-radius: 999px;
            background: #fff7ed;
            border: 1px solid #fdba74;
            color: #9a3412;
            font-size: 12px;
            font-weight: 800;
          }

          .cert-no {
            margin-top: 10px;
            font-size: 12px;
            color: #6b7280;
            line-height: 1.8;
            font-weight: 700;
          }

          .content {
            text-align: center;
            padding-top: 20px;
          }

          .eyebrow {
            display: inline-block;
            padding: 8px 14px;
            border-radius: 999px;
            background: #fef2f2;
            color: #b91c1c;
            border: 1px solid #fecaca;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 1px;
          }

          .eyebrow.secondary {
            background: #eff6ff;
            border-color: #bfdbfe;
            color: #1d4ed8;
          }

          h1 {
            margin: 16px 0 0;
            font-size: 46px;
            line-height: 1.1;
            font-weight: 900;
            color: #1f2937;
            letter-spacing: 0.8px;
          }

          .desc {
            max-width: 900px;
            margin: 16px auto 0;
            font-size: 17px;
            line-height: 1.8;
            color: #4b5563;
          }

          .label {
            margin-top: 28px;
            font-size: 13px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            font-weight: 800;
          }

          .value-lg {
            margin-top: 10px;
            font-size: 36px;
            line-height: 1.2;
            font-weight: 900;
            color: #111827;
            word-break: break-word;
          }

          .value-sm {
            margin-top: 10px;
            font-size: 20px;
            line-height: 1.4;
            font-weight: 700;
            color: #374151;
          }

          .value-md {
            margin-top: 10px;
            font-size: 28px;
            line-height: 1.35;
            font-weight: 800;
            color: #166534;
          }

          .email {
            margin-top: 8px;
            font-size: 16px;
            color: #6b7280;
          }

          .training-desc {
            max-width: 940px;
            margin: 12px auto 0;
            font-size: 15px;
            line-height: 1.8;
            color: #4b5563;
          }

          .grid {
            margin-top: 28px;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
          }

          .card {
            background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
            border: 1px solid #e5e7eb;
            border-radius: 18px;
            padding: 16px;
            text-align: left;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.04);
          }

          .card-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
            margin-bottom: 8px;
          }

          .card-value {
            font-size: 15px;
            line-height: 1.6;
            color: #111827;
            font-weight: 800;
            word-break: break-word;
          }

          .verify-box {
            margin-top: 24px;
            display: grid;
            grid-template-columns: 180px 1fr;
            gap: 18px;
            align-items: center;
            background: #fff;
            border: 1px dashed #d1d5db;
            border-radius: 18px;
            padding: 18px;
          }

          .verify-qr {
            width: 180px;
            height: 180px;
            background: #fff;
            border-radius: 14px;
            border: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }

          .verify-qr img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }

          .verify-text {
            font-size: 14px;
            line-height: 1.8;
            color: #374151;
            text-align: left;
          }

          .verify-link {
            display: inline-block;
            margin-top: 8px;
            word-break: break-all;
            color: #b91c1c;
            font-weight: 700;
            text-decoration: none;
          }

          .note {
            margin-top: 22px;
            padding: 16px 18px;
            border-radius: 16px;
            background: #fff7ed;
            border: 1px solid #fed7aa;
            color: #7c2d12;
            font-size: 14px;
            line-height: 1.7;
            text-align: left;
          }

          .bottom {
            margin-top: 30px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            align-items: end;
          }

          .signature-line {
            width: 240px;
            max-width: 100%;
            height: 1px;
            background: #111827;
            margin-bottom: 10px;
          }

          .signature-title {
            font-size: 16px;
            font-weight: 800;
            color: #111827;
          }

          .signature-sub {
            margin-top: 4px;
            font-size: 13px;
            color: #6b7280;
          }

          .seal-wrap {
            text-align: right;
          }

          .seal {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 124px;
            height: 124px;
            border-radius: 999px;
            border: 4px solid #cf3d2e;
            color: #cf3d2e;
            font-weight: 900;
            background: rgba(255,255,255,0.96);
            transform: rotate(-10deg);
          }

          .seal-1 {
            font-size: 12px;
            letter-spacing: 1px;
          }

          .seal-2 {
            font-size: 24px;
            line-height: 1.1;
            margin: 4px 0;
          }

          .seal-3 {
            font-size: 11px;
            letter-spacing: 0.8px;
          }

          .back-title {
            font-size: 34px;
            font-weight: 900;
            color: #0f172a;
            text-align: center;
            margin: 0 0 10px;
          }

          .back-subtitle {
            text-align: center;
            color: #475569;
            font-size: 15px;
            line-height: 1.8;
            max-width: 900px;
            margin: 0 auto 22px;
          }

          .topics-table {
            width: 100%;
            border-collapse: collapse;
          }

          .topics-table th,
          .topics-table td {
            border: 1px solid #dbe3ee;
            padding: 12px 14px;
            text-align: left;
            font-size: 14px;
            vertical-align: top;
          }

          .topics-table th {
            background: #f8fafc;
            color: #334155;
            font-weight: 800;
          }

          .topics-table th:first-child,
          .topics-table td:first-child {
            width: 70px;
            text-align: center;
          }

          .back-info {
            margin-top: 18px;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          .back-info-card {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 14px 16px;
          }

          .back-info-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.8px;
            margin-bottom: 8px;
          }

          .back-info-value {
            font-size: 15px;
            color: #0f172a;
            line-height: 1.7;
            font-weight: 800;
          }

          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          @media (max-width: 900px) {
            body { padding: 12px; }
            .sheet-inner { padding: 24px 18px; }
            .top, .bottom, .verify-box {
              display: grid;
              grid-template-columns: 1fr;
            }
            .badge-wrap, .seal-wrap { text-align: left; }
            .grid, .back-info { grid-template-columns: 1fr; }
            h1 { font-size: 38px; }
            .value-lg { font-size: 30px; }
            .value-md { font-size: 24px; }
          }

          @media print {
            body {
              background: #fff;
              padding: 0;
            }

            .toolbar {
              display: none;
            }

            .sheet {
              box-shadow: none;
            }

            .sheet-break {
              page-break-before: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-wrap">
          <div class="toolbar">
            <a class="print-btn" href="#" onclick="window.print(); return false;">PDF İndir / Yazdır</a>
          </div>

          <div class="sheet sheet-front">
            <div class="sheet-inner">
              <div class="top">
                <div class="brand">
                  <div class="brand-icon">D</div>
                  <div>
                    <div class="brand-main">D-SEC</div>
                    <div class="brand-sub">Dijital Sağlık • Emniyet • Çevre</div>
                    <div class="company-chip">Firma: ${params.safeCompanyName}</div>
                  </div>
                </div>

                <div class="badge-wrap">
                  <div class="badge">${params.badgeText}</div>
                  <div class="cert-no">
                    Belge No: ${params.certificateNo}<br/>
                    Doğrulama Kodu: ${params.verificationCode}<br/>
                    Düzenlenme Tarihi: ${params.issueDate}
                  </div>
                </div>
              </div>

              <div class="content">
                ${statusChip}
                <h1>${params.mainHeading}</h1>

                <div class="desc">
                  ${params.introText}
                </div>

                <div class="label">Katılımcı</div>
                <div class="value-lg">${params.safeUserFullName}</div>
                <div class="email">${params.safeUserEmail}</div>

                <div class="label">Görevi / Rolü</div>
                <div class="value-sm">${params.safeUserRole}</div>

                <div class="label">Eğitim</div>
                <div class="value-md">${params.trainingTitle}</div>
                <div class="training-desc">${params.trainingDescription}</div>

                <div class="grid">
                  <div class="card">
                    <div class="card-label">Firma / Kurum</div>
                    <div class="card-value">${params.safeCompanyName}</div>
                  </div>

                  <div class="card">
                    <div class="card-label">Eğitim Tipi</div>
                    <div class="card-value">${params.trainingType}</div>
                  </div>

                  <div class="card">
                    <div class="card-label">Eğitim Süresi</div>
                    <div class="card-value">${params.durationText}</div>
                  </div>

                  <div class="card">
                    <div class="card-label">Başlangıç Kaydı</div>
                    <div class="card-value">${params.startedDate}</div>
                  </div>

                  <div class="card">
                    <div class="card-label">Tamamlanma Tarihi</div>
                    <div class="card-value">${params.completedDate}</div>
                  </div>

                  <div class="card">
                    <div class="card-label">Belge Düzenleme Tarihi</div>
                    <div class="card-value">${params.issueDate}</div>
                  </div>

                  ${params.scoreCard}
                </div>

                <div class="verify-box">
                  <div class="verify-qr">
                    <img src="${params.qrImageUrl}" alt="QR Doğrulama" />
                  </div>

                  <div class="verify-text">
                    Bu sertifika D-SEC sistemi üzerinden oluşturulmuştur.
                    <br/>
                    Belge doğrulaması için QR kodu okutabilir veya aşağıdaki bağlantıyı açabilirsiniz.
                    <br/>
                    <a class="verify-link" href="${params.verifyUrl}" target="_blank" rel="noreferrer">
                      ${escapeHtml(params.verifyUrl)}
                    </a>
                  </div>
                </div>

                <div class="note">
                  ${params.noteText}
                </div>

                <div class="bottom">
                  <div>
                    <div class="signature-line"></div>
                    <div class="signature-title">Eğitim Yetkilisi</div>
                    <div class="signature-sub">D-SEC Eğitim Kayıt Birimi / İmza</div>
                  </div>

                  <div class="seal-wrap">
                    <div class="seal">
                      <div class="seal-1">ONAYLI</div>
                      <div class="seal-2">D-SEC</div>
                      <div class="seal-3">${new Date().getFullYear()}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="sheet sheet-back sheet-break">
            <div class="sheet-inner">
              <h2 class="back-title">EĞİTİM İÇERİK EKİ</h2>
              <div class="back-subtitle">
                Bu sayfa sertifikanın ayrılmaz eki olup katılımcının tamamladığı eğitim başlıkları,
                temel kayıt bilgileri ve doğrulama referanslarını içerir.
              </div>

              <table class="topics-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Konu Başlığı</th>
                  </tr>
                </thead>
                <tbody>
                  ${params.topicsRows}
                </tbody>
              </table>

              <div class="back-info">
                <div class="back-info-card">
                  <div class="back-info-label">Katılımcı</div>
                  <div class="back-info-value">${params.safeUserFullName}</div>
                </div>

                <div class="back-info-card">
                  <div class="back-info-label">Görevi / Rolü</div>
                  <div class="back-info-value">${params.safeUserRole}</div>
                </div>

                <div class="back-info-card">
                  <div class="back-info-label">Eğitim Adı</div>
                  <div class="back-info-value">${params.trainingTitle}</div>
                </div>

                <div class="back-info-card">
                  <div class="back-info-label">Firma / Kurum</div>
                  <div class="back-info-value">${params.safeCompanyName}</div>
                </div>

                <div class="back-info-card">
                  <div class="back-info-label">Belge No</div>
                  <div class="back-info-value">${params.certificateNo}</div>
                </div>

                <div class="back-info-card">
                  <div class="back-info-label">Doğrulama Kodu</div>
                  <div class="back-info-value">${params.verificationCode}</div>
                </div>
              </div>

              <div class="note">
                Bu ek sayfa, sertifika ile birlikte değerlendirilir. Sertifika doğrulaması yalnızca
                belge numarası, doğrulama kodu ve sistem kaydı birlikte esas alınarak yapılmalıdır.
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildRegulationCertificateHtml(params: {
  documentTitle: string;
  badgeText: string;
  certificateNo: string;
  verificationCode: string;
  issueDate: string;
  completedDate: string;
  safeCompanyName: string;
  safeUserFullName: string;
  safeUserRole: string;
  trainingTitle: string;
  durationText: string;
  verifyUrl: string;
  qrImageUrl: string;
  groupedSections: GroupedTopicSections;
  isCertificate: boolean;
}) {
  const belgeBaslik = params.isCertificate
    ? "TEMEL EĞİTİM BELGESİ"
    : "TEMEL EĞİTİM KATILIM BELGESİ";

  const trainingShortTitle = escapeHtml(params.trainingTitle || "-");

  const backRows = `
    <tr>
      <td class="section-title">1. Genel konular</td>
      <td class="duration-col"></td>
    </tr>
    ${
      params.groupedSections.genel.length
        ? params.groupedSections.genel
            .map(
              (item) => `
                <tr>
                  <td class="topic-item">${escapeHtml(item)}</td>
                  <td class="duration-col"></td>
                </tr>
              `
            )
            .join("")
        : `
          <tr>
            <td class="topic-item">-</td>
            <td class="duration-col"></td>
          </tr>
        `
    }

    <tr>
      <td class="section-title">2. Sağlık konuları</td>
      <td class="duration-col"></td>
    </tr>
    ${
      params.groupedSections.saglik.length
        ? params.groupedSections.saglik
            .map(
              (item) => `
                <tr>
                  <td class="topic-item">${escapeHtml(item)}</td>
                  <td class="duration-col"></td>
                </tr>
              `
            )
            .join("")
        : `
          <tr>
            <td class="topic-item">-</td>
            <td class="duration-col"></td>
          </tr>
        `
    }

    <tr>
      <td class="section-title">3. Teknik konular</td>
      <td class="duration-col"></td>
    </tr>
    ${
      params.groupedSections.teknik.length
        ? params.groupedSections.teknik
            .map(
              (item) => `
                <tr>
                  <td class="topic-item">${escapeHtml(item)}</td>
                  <td class="duration-col"></td>
                </tr>
              `
            )
            .join("")
        : `
          <tr>
            <td class="topic-item">-</td>
            <td class="duration-col"></td>
          </tr>
        `
    }

    <tr>
      <td class="section-title">4. İşe ve işyerine özgü riskler ve risk değerlendirmesine dayalı konular</td>
      <td class="duration-col"></td>
    </tr>
    ${
      params.groupedSections.iseOzel.length
        ? params.groupedSections.iseOzel
            .map(
              (item) => `
                <tr>
                  <td class="topic-item">${escapeHtml(item)}</td>
                  <td class="duration-col"></td>
                </tr>
              `
            )
            .join("")
        : `
          <tr>
            <td class="topic-item">-</td>
            <td class="duration-col"></td>
          </tr>
        `
    }
  `;

  return `
    <!doctype html>
    <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${params.documentTitle}</title>
        <style>
          * { box-sizing: border-box; }

          body {
            margin: 0;
            padding: 10px;
            font-family: "Times New Roman", Arial, serif;
            background: #f3f4f6;
            color: #111827;
          }

          .page-wrap {
            max-width: 930px;
            margin: 0 auto;
          }

          .toolbar {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 10px;
          }

          .print-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 10px 16px;
            border-radius: 10px;
            background: #111827;
            color: #fff;
            text-decoration: none;
            font-size: 13px;
            font-weight: 700;
            font-family: Arial, Helvetica, sans-serif;
          }

          .sheet {
            background: #fff;
            border: 1.2px solid #111827;
            box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
            margin-bottom: 12px;
            padding: 10px;
            page-break-inside: avoid;
          }

          .top-line {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            font-size: 12px;
            margin-bottom: 6px;
          }

          .front-box {
            border: 1px solid #111827;
            min-height: 980px;
            padding: 10px;
          }

          .mini-head {
            font-size: 11px;
            font-weight: 700;
            margin-bottom: 8px;
          }

          .front-paragraph {
            font-size: 11px;
            line-height: 1.4;
            margin-bottom: 10px;
          }

          .front-lines {
            font-size: 11px;
            line-height: 1.4;
            white-space: pre-line;
          }

          .box-line {
            display: inline-block;
            width: 10px;
            height: 10px;
            border: 1px solid #111827;
            margin: 0 4px 0 6px;
            vertical-align: middle;
          }

          .verify-block {
            margin-top: 8px;
            border: 1px solid #111827;
            padding: 5px;
            display: grid;
            grid-template-columns: 58px 1fr;
            gap: 5px;
            align-items: center;
            font-size: 9px;
            line-height: 1.2;
          }

          .verify-block img {
            width: 58px;
            height: 58px;
            object-fit: contain;
            border: 1px solid #111827;
            background: #fff;
            padding: 2px;
          }

          .verify-link {
            color: #111827;
            text-decoration: none;
            word-break: break-all;
            font-weight: 700;
          }

          .footer-note {
            margin-top: 6px;
            font-size: 9px;
            line-height: 1.2;
          }

          .back-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 10px;
          }

          .back-table th,
          .back-table td {
            border: 1px solid #111827;
            padding: 3px 4px;
            vertical-align: top;
            line-height: 1.2;
          }

          .back-table th {
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            background: #fff;
          }

          .section-title {
            font-weight: 700;
          }

          .topic-item {
            padding-left: 8px;
          }

          .duration-col {
            width: 58px;
            text-align: center;
          }

          @page {
            size: A4 portrait;
            margin: 6mm;
          }

          @media print {
            body {
              background: #fff;
              padding: 0;
            }

            .toolbar {
              display: none;
            }

            .sheet {
              box-shadow: none;
              margin-bottom: 0;
            }

            .page-break {
              page-break-before: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-wrap">
          <div class="toolbar">
            <a class="print-btn" href="#" onclick="window.print(); return false;">PDF İndir / Yazdır</a>
          </div>

          <div class="sheet">
            <div class="top-line">
              <div>(ÖN YÜZ)</div>
              <div>${belgeBaslik}</div>
            </div>

            <div class="front-box">
              <div class="mini-head">TEMEL EĞİTİM BELGESİ</div>

              <div class="front-paragraph">
                İşbu belge,<br/><br/>
                <strong>${params.safeUserFullName}</strong> (${params.safeUserRole}) adına,
                Çalışanların İş Sağlığı ve Güvenliği Eğitimlerinin Usul ve Esasları Hakkında
                Yönetmelik kapsamında D-SEC tarafından düzenlenen
                <strong>${trainingShortTitle}</strong> eğitiminin tamamlanması sonucunda düzenlenmiştir.
              </div>

              <div class="front-lines">
Belge düzenlenme tarihi: ${params.issueDate}
Eğitimin süresi: ${params.durationText}
Eğitimin türü: İlk defa verilen temel eğitim<span class="box-line"></span>
               Tekrar verilen temel eğitim<span class="box-line"></span>
Eğitimin şekli: Uzaktan<span class="box-line"></span>
               Yüz yüze<span class="box-line"></span>

Eğiticilerin adı soyadı ve ünvanı: D-SEC Eğitim Yetkilisi
Eğiticilerin imzası:

Çalışanın işyerinin ünvanı: ${params.safeCompanyName}
İşverenin/işveren vekilinin adı soyadı:
İşveren/işveren vekilinin imzası:
              </div>

              <div class="verify-block">
                <img src="${params.qrImageUrl}" alt="QR Doğrulama" />
                <div>
                  Bu belge D-SEC sistemi üzerinden doğrulanabilir.<br/>
                  Belge No: ${params.certificateNo}<br/>
                  Doğrulama Kodu: ${params.verificationCode}<br/>
                  Bağlantı:
                  <a class="verify-link" href="${params.verifyUrl}" target="_blank" rel="noreferrer">
                    ${escapeHtml(params.verifyUrl)}
                  </a>
                </div>
              </div>
            </div>

            <div class="footer-note">
              * Belge No: ${params.certificateNo} &nbsp;&nbsp;|&nbsp;&nbsp; Doğrulama Kodu: ${params.verificationCode}
            </div>
          </div>

          <div class="sheet page-break">
            <div class="top-line">
              <div>(ARKA YÜZ)</div>
              <div>Ek-2</div>
            </div>

            <table class="back-table">
              <thead>
                <tr>
                  <th>EĞİTİM KONULARI</th>
                  <th class="duration-col">SÜRE</th>
                </tr>
              </thead>
              <tbody>
                ${backRows}
              </tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  `;
}
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();

    const userId = cookieStore.get("dsec_user_id")?.value;
    const cookieEmail = cookieStore.get("dsec_user_email")?.value || "Kullanıcı";
    const cookieFullName =
      cookieStore.get("dsec_user_full_name")?.value ||
      cookieStore.get("dsec_user_name")?.value ||
      cookieEmail;

    const companyName =
      cookieStore.get("dsec_company_name")?.value || "Firma Adı Tanımlanmadı";

    if (!userId) {
      return new NextResponse("Yetkisiz erişim", { status: 401 });
    }

    const { id } = await context.params;

    if (!id || String(id).trim().length < 3) {
      return new NextResponse("Geçersiz belge kaydı.", { status: 400 });
    }

    const supabase = getSupabase();
    const url = new URL(request.url);
    const docType =
      url.searchParams.get("type") === "attendance"
        ? "attendance"
        : "certificate";

    const isCertificate = docType === "certificate";

    let assignmentQuery = supabase
      .from("training_assignments")
      .select(
        "id, status, completed_at, started_at, training_id, certificate_no, certificate_issued_at, verification_code, final_exam_passed, final_exam_score"
      )
      .eq("id", id);

    if (userId !== "admin-1") {
      assignmentQuery = assignmentQuery.eq("user_id", userId);
    }

    const { data, error: assignmentError } =
      await assignmentQuery.single<AssignmentRow>();

    if (assignmentError || !data) {
      console.error("ASSIGNMENT ERROR:", assignmentError);
      return new NextResponse(
        isCertificate
          ? "Sertifika kaydı bulunamadı."
          : "Katılım belgesi kaydı bulunamadı.",
        { status: 404 }
      );
    }

    const assignment = data;

    if (assignment.status !== "completed") {
      return new NextResponse(
        isCertificate
          ? "Belge yalnızca tamamlanan eğitimler için oluşturulur."
          : "Katılım belgesi yalnızca tamamlanan eğitimler için oluşturulur.",
        { status: 400 }
      );
    }

    if (isCertificate && !assignment.final_exam_passed) {
      return new NextResponse(
        "Sertifika için final sınavı başarıyla tamamlanmalıdır.",
        { status: 400 }
      );
    }

    if (isCertificate && Number(assignment.final_exam_score || 0) < 60) {
      return new NextResponse(
        "Sertifika için final sınavından en az 60 puan alınmalıdır.",
        { status: 400 }
      );
    }

    let certificateNo = assignment.certificate_no;
    let verificationCode = assignment.verification_code;
    let certificateIssuedAt = assignment.certificate_issued_at;

    if (!certificateNo || !verificationCode || !certificateIssuedAt) {
      certificateNo = certificateNo || buildCertificateNo(String(assignment.id));
      verificationCode = verificationCode || buildVerificationCode();
      certificateIssuedAt = certificateIssuedAt || new Date().toISOString();

      let updateQuery = supabase
        .from("training_assignments")
        .update({
          certificate_no: certificateNo,
          verification_code: verificationCode,
          certificate_issued_at: certificateIssuedAt,
        })
        .eq("id", id);

      if (userId !== "admin-1") {
        updateQuery = updateQuery.eq("user_id", userId);
      }

      const { error: updateError } = await updateQuery;

      if (updateError) {
        console.error("CERTIFICATE META UPDATE ERROR:", updateError);
      }
    }

    let training: TrainingRow | null = null;

    if (assignment.training_id) {
      const { data: trainingData, error: trainingError } = await supabase
        .from("trainings")
        .select("id, title, description, type, topics_text, duration_minutes")
        .eq("id", assignment.training_id)
        .maybeSingle<TrainingRow>();

      if (trainingError) {
        console.error("TRAINING ERROR:", trainingError);
      } else {
        training = trainingData;
      }
    }

    let dbUser: UserRow | null = null;
    if (userId !== "admin-1") {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, full_name, email, role")
        .eq("id", userId)
        .maybeSingle<UserRow>();

      if (userError) {
        console.error("CERTIFICATE USER ERROR:", userError);
      } else {
        dbUser = userData;
      }
    }

    const userFullName = dbUser?.full_name || cookieFullName;
    const userEmail = dbUser?.email || cookieEmail;
    const userRole =
      dbUser?.role ||
      cookieStore.get("dsec_user_role")?.value ||
      cookieStore.get("dsec_user_job_title")?.value ||
      "Katılımcı";

    const safeUserEmail = escapeHtml(userEmail);
    const safeUserFullName = escapeHtml(userFullName);
    const safeUserRole = escapeHtml(formatRoleLabel(userRole));
    const safeCompanyName = escapeHtml(companyName);

    const trainingTitle = escapeHtml(training?.title || "Eğitim adı bulunamadı");
    const trainingDescription = escapeHtml(training?.description || "-");
    const trainingType = escapeHtml(training?.type || "online");
    const durationText =
      training?.duration_minutes && training.duration_minutes > 0
        ? `${training.duration_minutes} dakika`
        : "Süre bilgisi tanımlanmadı";

    const topics = parseTrainingTopics(training?.topics_text);
    const matchedSection = detectIsgRegulationSection(
      training?.title,
      training?.description,
      topics
    );

    const groupedSections = buildRegulationSectionsFromSingleTraining(
      matchedSection,
      topics
    );

    const useOfficialBasicTemplate = isOfficialBasicIsgTemplate(matchedSection);

    const topicsRows = buildStandardTopicsTableRows(topics);

    const completedDate = formatDateTr(assignment.completed_at);
    const startedDate = formatDateTr(assignment.started_at);
    const issueDate = formatDateTr(certificateIssuedAt);
    const issueDateOnly = formatDateOnlyTr(certificateIssuedAt);

    const origin =
      process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    const verifyUrl = `${origin}/verify/certificate/${verificationCode}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      verifyUrl
    )}`;

    const documentTitle = isCertificate
      ? "D-SEC Eğitim Sertifikası"
      : "D-SEC Eğitim Katılım Belgesi";

    const badgeText = isCertificate
      ? "Eğitim Sertifikası"
      : "Eğitim Katılım Belgesi";

    const mainHeading = isCertificate
      ? "EĞİTİM SERTİFİKASI"
      : "EĞİTİM KATILIM BELGESİ";

    const introText = isCertificate
      ? "İşbu belge, aşağıda bilgileri yer alan katılımcının belirtilen eğitimi başarıyla tamamladığını göstermek üzere düzenlenmiştir."
      : "Bu belge, ilgili eğitim kaydı esas alınarak düzenlenmiş olup katılımcının aşağıda belirtilen eğitime katılım sağladığını göstermektedir.";

    const noteText = isCertificate
      ? "Bu sertifika, sistem kayıtları esas alınarak düzenlenmiştir. Belge doğrulaması için karekod veya doğrulama bağlantısı kullanılabilir."
      : "Bu katılım belgesi, eğitim kaydının sistemde bulunduğunu göstermek amacıyla düzenlenmiştir.";

    const realFinalScore = Math.max(
      0,
      Math.min(100, Math.round(Number(assignment.final_exam_score || 0)))
    );

    const scoreCard = isCertificate
      ? `
        <div class="card">
          <div class="card-label">Final Sınav Puanı</div>
          <div class="card-value">${realFinalScore}</div>
        </div>
      `
      : "";

    const html =
      useOfficialBasicTemplate && groupedSections
        ? buildRegulationCertificateHtml({
            documentTitle,
            badgeText,
            certificateNo: certificateNo || "-",
            verificationCode: verificationCode || "-",
            issueDate: issueDateOnly,
            completedDate,
            safeCompanyName,
            safeUserFullName,
            safeUserRole,
            trainingTitle,
            durationText,
            verifyUrl,
            qrImageUrl,
            groupedSections,
            isCertificate,
          })
        : buildStandardCertificateHtml({
            documentTitle,
            badgeText,
            mainHeading,
            introText,
            noteText,
            certificateNo: certificateNo || "-",
            verificationCode: verificationCode || "-",
            issueDate,
            completedDate,
            startedDate,
            safeCompanyName,
            safeUserFullName,
            safeUserEmail,
            safeUserRole,
            trainingTitle,
            trainingDescription,
            trainingType,
            durationText,
            scoreCard,
            topicsRows,
            verifyUrl,
            qrImageUrl,
            isCertificate,
          });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("Certificate route hata:", err);
    return new NextResponse("Sunucu hatası", { status: 500 });
  }
}
