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

function topicsToHtml(topics: string[]) {
  if (!topics.length) {
    return `
      <li>
        <span class="topic-index">-</span>
        <span class="topic-text">Bu eğitim için konu bilgisi girilmemiştir.</span>
      </li>
    `;
  }

  return topics
    .map(
      (topic, index) => `
        <li>
          <span class="topic-index">${index + 1}</span>
          <span class="topic-text">${escapeHtml(topic)}</span>
        </li>
      `
    )
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
};

type TrainingRow = {
  id: string;
  title: string | null;
  description: string | null;
  type: string | null;
  topics_text: string | null;
};

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();

    const userId = cookieStore.get("dsec_user_id")?.value;
    const userEmail = cookieStore.get("dsec_user_email")?.value || "Kullanıcı";
    const userFullName =
      cookieStore.get("dsec_user_full_name")?.value ||
      cookieStore.get("dsec_user_name")?.value ||
      userEmail;

    const companyName =
      cookieStore.get("dsec_company_name")?.value || "Firma Adı Tanımlanmadı";

    if (!userId) {
      return new NextResponse("Yetkisiz erişim", { status: 401 });
    }

    const { id } = await context.params;
    const supabase = getSupabase();

    let assignmentQuery = supabase
      .from("training_assignments")
      .select(
        "id, status, completed_at, started_at, training_id, certificate_no, certificate_issued_at, verification_code"
      )
      .eq("id", id);

    if (userId !== "admin-1") {
      assignmentQuery = assignmentQuery.eq("user_id", userId);
    }

    const { data: assignment, error: assignmentError } =
      await assignmentQuery.single<AssignmentRow>();

    if (assignmentError || !assignment) {
      console.error("ASSIGNMENT ERROR:", assignmentError);
      return new NextResponse("Sertifika kaydı bulunamadı.", { status: 404 });
    }

    if (assignment.status !== "completed") {
      return new NextResponse(
        "Belge yalnızca tamamlanan eğitimler için oluşturulur.",
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
        .select("id, title, description, type, topics_text")
        .eq("id", assignment.training_id)
        .maybeSingle<TrainingRow>();

      if (trainingError) {
        console.error("TRAINING ERROR:", trainingError);
      } else {
        training = trainingData;
      }
    }

    const safeUserEmail = escapeHtml(userEmail);
    const safeUserFullName = escapeHtml(userFullName);
    const safeCompanyName = escapeHtml(companyName);

    const trainingTitle = escapeHtml(training?.title || "Eğitim adı bulunamadı");
    const trainingDescription = escapeHtml(training?.description || "-");
    const trainingType = escapeHtml(training?.type || "online");
    const durationText = "Süre bilgisi tanımlanmadı";

    const topics = parseTrainingTopics(training?.topics_text);
    const topicsHtml = topicsToHtml(topics);

    const completedDate = formatDateTr(assignment.completed_at);
    const startedDate = formatDateTr(assignment.started_at);
    const issueDate = formatDateTr(certificateIssuedAt);

    const origin =
      process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    const verifyUrl = `${origin}/verify/certificate/${verificationCode}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      verifyUrl
    )}`;

    const html = `
      <!doctype html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>D-SEC Eğitim Sertifikası</title>
          <style>
            * { box-sizing: border-box; }

            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, Helvetica, sans-serif;
              background:
                radial-gradient(circle at top left, rgba(220,38,38,0.10), transparent 30%),
                radial-gradient(circle at bottom right, rgba(22,101,52,0.10), transparent 28%),
                #f8fafc;
              color: #111827;
            }

            .page {
              max-width: 1240px;
              margin: 0 auto;
            }

            .toolbar {
              display: flex;
              justify-content: flex-end;
              gap: 12px;
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

            .certificate {
              position: relative;
              overflow: hidden;
              background: #ffffff;
              border: 10px solid #cf3d2e;
              border-radius: 28px;
              padding: 34px 38px 28px;
              box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
            }

            .certificate::before {
              content: "";
              position: absolute;
              inset: 12px;
              border: 2px solid rgba(207,61,46,0.18);
              border-radius: 18px;
              pointer-events: none;
            }

            .top {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              align-items: flex-start;
              position: relative;
              z-index: 1;
            }

            .brand {
              display: flex;
              align-items: center;
              gap: 16px;
            }

            .brand-icon {
              width: 70px;
              height: 70px;
              border-radius: 20px;
              background: linear-gradient(135deg, #ef4444, #f97316);
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 30px;
              font-weight: 900;
              box-shadow: 0 10px 24px rgba(239, 68, 68, 0.22);
            }

            .brand-main {
              font-size: 30px;
              font-weight: 900;
              color: #cf3d2e;
              letter-spacing: 0.4px;
            }

            .brand-sub {
              font-size: 13px;
              color: #6b7280;
              margin-top: 4px;
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
              font-weight: 700;
              line-height: 1.7;
            }

            .content {
              position: relative;
              z-index: 1;
              text-align: center;
              padding-top: 18px;
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
              font-size: 44px;
              line-height: 1.1;
              font-weight: 900;
              color: #1f2937;
            }

            .desc {
              max-width: 920px;
              margin: 14px auto 0;
              font-size: 17px;
              line-height: 1.7;
              color: #4b5563;
            }

            .label {
              margin-top: 26px;
              font-size: 13px;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 1.2px;
              font-weight: 800;
            }

            .value-lg {
              margin-top: 10px;
              font-size: 34px;
              line-height: 1.2;
              font-weight: 900;
              color: #111827;
              word-break: break-word;
            }

            .value-md {
              margin-top: 10px;
              font-size: 26px;
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
              max-width: 960px;
              margin: 12px auto 0;
              font-size: 15px;
              line-height: 1.8;
              color: #4b5563;
            }

            .grid {
              margin-top: 26px;
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

            .topics-wrap {
              margin-top: 24px;
              text-align: left;
              background: #f8fafc;
              border: 1px solid #e5e7eb;
              border-radius: 18px;
              padding: 18px 20px;
            }

            .topics-title {
              font-size: 14px;
              font-weight: 800;
              color: #111827;
              margin-bottom: 12px;
              text-transform: uppercase;
              letter-spacing: 0.8px;
            }

            .topics-list {
              list-style: none;
              margin: 0;
              padding: 0;
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px 16px;
            }

            .topics-list li {
              display: flex;
              align-items: flex-start;
              gap: 10px;
              font-size: 14px;
              line-height: 1.6;
              color: #374151;
            }

            .topic-index {
              min-width: 24px;
              height: 24px;
              border-radius: 999px;
              background: #fee2e2;
              color: #b91c1c;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 800;
            }

            .topic-text {
              flex: 1;
            }

            .verify-box {
              margin-top: 24px;
              display: grid;
              grid-template-columns: 180px 1fr;
              gap: 18px;
              align-items: center;
              background: #ffffff;
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

            @page {
              size: A4 landscape;
              margin: 10mm;
            }

            @media (max-width: 900px) {
              body { padding: 14px; }
              .certificate { padding: 24px 18px; }
              .top, .bottom, .verify-box {
                grid-template-columns: 1fr;
                display: grid;
              }
              .badge-wrap, .seal-wrap { text-align: left; }
              h1 { font-size: 38px; }
              .value-lg { font-size: 30px; }
              .value-md { font-size: 24px; }
              .grid, .topics-list { grid-template-columns: 1fr; }
            }

            @media print {
              body {
                background: #fff;
                padding: 0;
              }
              .toolbar { display: none; }
              .certificate { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="toolbar">
              <a class="print-btn" href="#" onclick="window.print(); return false;">PDF İndir / Yazdır</a>
            </div>

            <div class="certificate">
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
                  <div class="badge">Eğitim Sertifikası</div>
                  <div class="cert-no">
                    Belge No: ${certificateNo}<br/>
                    Doğrulama Kodu: ${verificationCode}<br/>
                    Doğrulama: ${escapeHtml(verifyUrl)}
                  </div>
                </div>
              </div>

              <div class="content">
                <div class="eyebrow">6331 KAPSAMINDA DÜZENLENMİŞTİR</div>
                <h1>EĞİTİM SERTİFİKASI</h1>

                <div class="desc">
                  Bu belge, ilgili eğitim kaydı esas alınarak düzenlenmiş olup katılımcının aşağıda
                  belirtilen eğitimi tamamladığını ve eğitim içeriğine iştirak ettiğini göstermek amacıyla oluşturulmuştur.
                </div>

                <div class="label">Katılımcı</div>
                <div class="value-lg">${safeUserFullName}</div>
                <div class="email">${safeUserEmail}</div>

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
                </div>

                <div class="topics-wrap">
                  <div class="topics-title">Alınan Eğitim Konuları</div>
                  <ul class="topics-list">
                    ${topicsHtml}
                  </ul>
                </div>

                <div class="verify-box">
                  <div class="verify-qr">
                    <img src="${qrImageUrl}" alt="QR Doğrulama" />
                  </div>

                  <div class="verify-text">
                    Bu belge D-SEC sistemi üzerinden oluşturulmuştur. Belgenin ait olduğu firma
                    bilgisi: <strong>${safeCompanyName}</strong>.
                    <br/>
                    Belge doğrulaması için QR kodu okutabilir veya aşağıdaki bağlantıyı açabilirsiniz.
                    <br/>
                    <a class="verify-link" href="${verifyUrl}" target="_blank" rel="noreferrer">
                      ${escapeHtml(verifyUrl)}
                    </a>
                  </div>
                </div>

                <div class="note">
                  Bu belge, eğitim kaydının ve eğitim başlıklarının kayıt altına alındığını göstermek amacıyla düzenlenmiştir.
                  Belge ve ilgili eğitim kayıtlarının çalışan özlük dosyasında saklanması tavsiye edilir.
                </div>

                <div class="bottom">
                  <div>
                    <div class="signature-line"></div>
                    <div class="signature-title">D-SEC Eğitim Yetkilisi</div>
                    <div class="signature-sub">Onay / İmza</div>
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