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

    if (isCertificate && (assignment.final_exam_score || 0) < 60) {
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
    const topicsRows = topicsToRows(topics);

    const completedDate = formatDateTr(assignment.completed_at);
    const startedDate = formatDateTr(assignment.started_at);
    const issueDate = formatDateTr(certificateIssuedAt);

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

    const topicsTitle = isCertificate
      ? "Eğitim Konu Başlıkları"
      : "Katılım Sağlanan Eğitim Konuları";

    const noteText = isCertificate
      ? "Bu sertifika, sistem kayıtları esas alınarak düzenlenmiştir. Belge doğrulaması için karekod veya doğrulama bağlantısı kullanılabilir."
      : "Bu katılım belgesi, eğitim kaydının sistemde bulunduğunu göstermek amacıyla düzenlenmiştir.";

    const scoreCard = isCertificate
      ? `
        <div class="card">
          <div class="card-label">Final Sınav Puanı</div>
          <div class="card-value">${Number(assignment.final_exam_score || 0)}</div>
        </div>
      `
      : "";

    const statusChip = isCertificate
      ? `<div class="eyebrow">BAŞARIYLA TAMAMLANDI</div>`
      : `<div class="eyebrow">EĞİTİM KAYDI</div>`;

    const html = `
      <!doctype html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${documentTitle}</title>
          <style>
            * { box-sizing: border-box; }

            body {
              margin: 0;
              padding: 18px;
              font-family: Arial, Helvetica, sans-serif;
              background: #f4f6fb;
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
              border-radius: 28px;
              overflow: hidden;
              box-shadow: 0 24px 60px rgba(15, 23, 42, 0.10);
              margin-bottom: 20px;
              border: 1px solid #e5e7eb;
            }

            .sheet-inner {
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
              width: 74px;
              height: 74px;
              border-radius: 22px;
              background: linear-gradient(135deg, #ef4444, #f97316);
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 32px;
              font-weight: 900;
              box-shadow: 0 12px 24px rgba(15, 23, 42, 0.16);
            }

            .brand-main {
              font-size: 30px;
              font-weight: 900;
              color: #cf3d2e;
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
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 18px;
              padding: 16px;
              text-align: left;
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
              width: 122px;
              height: 122px;
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
                      <div class="company-chip">Firma: ${safeCompanyName}</div>
                    </div>
                  </div>

                  <div class="badge-wrap">
                    <div class="badge">${badgeText}</div>
                    <div class="cert-no">
                      Belge No: ${certificateNo}<br/>
                      Doğrulama Kodu: ${verificationCode}<br/>
                      Düzenlenme Tarihi: ${issueDate}
                    </div>
                  </div>
                </div>

                <div class="content">
                  ${statusChip}
                  <h1>${mainHeading}</h1>

                  <div class="desc">
                    ${introText}
                  </div>

                  <div class="label">Katılımcı</div>
                  <div class="value-lg">${safeUserFullName}</div>
                  <div class="email">${safeUserEmail}</div>

                  <div class="label">Görevi / Rolü</div>
                  <div class="value-sm">${safeUserRole}</div>

                  <div class="label">Eğitim</div>
                  <div class="value-md">${trainingTitle}</div>
                  <div class="training-desc">${trainingDescription}</div>

                  <div class="grid">
                    <div class="card">
                      <div class="card-label">Firma / Kurum</div>
                      <div class="card-value">${safeCompanyName}</div>
                    </div>

                    <div class="card">
                      <div class="card-label">Eğitim Tipi</div>
                      <div class="card-value">${trainingType}</div>
                    </div>

                    <div class="card">
                      <div class="card-label">Eğitim Süresi</div>
                      <div class="card-value">${durationText}</div>
                    </div>

                    <div class="card">
                      <div class="card-label">Başlangıç Kaydı</div>
                      <div class="card-value">${startedDate}</div>
                    </div>

                    <div class="card">
                      <div class="card-label">Tamamlanma Tarihi</div>
                      <div class="card-value">${completedDate}</div>
                    </div>

                    <div class="card">
                      <div class="card-label">Belge Düzenleme Tarihi</div>
                      <div class="card-value">${issueDate}</div>
                    </div>

                    ${scoreCard}
                  </div>

                  <div class="verify-box">
                    <div class="verify-qr">
                      <img src="${qrImageUrl}" alt="QR Doğrulama" />
                    </div>

                    <div class="verify-text">
                      Bu sertifika D-SEC sistemi üzerinden oluşturulmuştur.
                      <br/>
                      Belge doğrulaması için QR kodu okutabilir veya aşağıdaki bağlantıyı açabilirsiniz.
                      <br/>
                      <a class="verify-link" href="${verifyUrl}" target="_blank" rel="noreferrer">
                        ${escapeHtml(verifyUrl)}
                      </a>
                    </div>
                  </div>

                  <div class="note">
                    ${noteText}
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
                    ${topicsRows}
                  </tbody>
                </table>

                <div class="back-info">
                  <div class="back-info-card">
                    <div class="back-info-label">Katılımcı</div>
                    <div class="back-info-value">${safeUserFullName}</div>
                  </div>

                  <div class="back-info-card">
                    <div class="back-info-label">Görevi / Rolü</div>
                    <div class="back-info-value">${safeUserRole}</div>
                  </div>

                  <div class="back-info-card">
                    <div class="back-info-label">Eğitim Adı</div>
                    <div class="back-info-value">${trainingTitle}</div>
                  </div>

                  <div class="back-info-card">
                    <div class="back-info-label">Firma / Kurum</div>
                    <div class="back-info-value">${safeCompanyName}</div>
                  </div>

                  <div class="back-info-card">
                    <div class="back-info-label">Belge No</div>
                    <div class="back-info-value">${certificateNo}</div>
                  </div>

                  <div class="back-info-card">
                    <div class="back-info-label">Doğrulama Kodu</div>
                    <div class="back-info-value">${verificationCode}</div>
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