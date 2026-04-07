import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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
  started_at: string | null;
  completed_at: string | null;
  training_id: string | null;
  final_exam_passed?: boolean | null;
  final_exam_score?: number | null;
  final_exam_attempts?: number | null;
  training_reset_required?: boolean | null;
};

type TrainingRow = {
  id: string;
  title: string | null;
  description: string | null;
  type: string | null;
  topics_text: string | null;
  duration_minutes?: number | null;
};

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

export async function GET(
  _request: Request,
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
      cookieStore.get("dsec_company_name")?.value || "D-SEC Kurumsal Eğitim";

    if (!userId) {
      return new NextResponse("Yetkisiz erişim", { status: 401 });
    }

    const { id } = await context.params;
    const supabase = getSupabase();

    let assignmentQuery = supabase
      .from("training_assignments")
      .select(
        "id, status, started_at, completed_at, training_id, final_exam_passed, final_exam_score, final_exam_attempts, training_reset_required"
      )
      .eq("id", id);

    if (userId !== "admin-1") {
      assignmentQuery = assignmentQuery.eq("user_id", userId);
    }

    const { data, error: assignmentError } =
      await assignmentQuery.single<AssignmentRow>();

    if (assignmentError || !data) {
      console.error("ATTENDANCE ASSIGNMENT ERROR:", assignmentError);
      return new NextResponse("Katılım formu kaydı bulunamadı.", {
        status: 404,
      });
    }

    const assignment = data;

    const canShowAttendance =
      assignment.status === "completed" ||
      assignment.training_reset_required === true;

    if (!canShowAttendance) {
      return new NextResponse(
        "Katılım formu yalnızca tamamlanan veya başarısızlık sonrası kapanan eğitimler için oluşturulur.",
        { status: 400 }
      );
    }

    let training: TrainingRow | null = null;

    if (assignment.training_id) {
      const { data: trainingData, error: trainingError } = await supabase
        .from("trainings")
        .select("id, title, description, type, topics_text, duration_minutes")
        .eq("id", assignment.training_id)
        .maybeSingle<TrainingRow>();

      if (trainingError) {
        console.error("ATTENDANCE TRAINING ERROR:", trainingError);
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
        console.error("ATTENDANCE USER ERROR:", userError);
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
    const durationMinutes = training?.duration_minutes ?? null;

    const topics = parseTrainingTopics(training?.topics_text);
    const topicsRows = topicsToRows(topics);

    const startedDate = formatDateTr(assignment.started_at);
    const completedDate = formatDateTr(assignment.completed_at);
    const issueDate = formatDateTr(new Date().toISOString());
    const durationText = durationMinutes
      ? `${durationMinutes} dakika`
      : "Süre bilgisi tanımlanmadı";

    const finalPassed = assignment.final_exam_passed === true;
    const finalScore =
      assignment.final_exam_score !== null &&
      assignment.final_exam_score !== undefined
        ? Number(assignment.final_exam_score)
        : null;

    const attemptsText =
      assignment.final_exam_attempts !== null &&
      assignment.final_exam_attempts !== undefined
        ? String(assignment.final_exam_attempts)
        : "-";

    const resultText = finalPassed
      ? "Katılımcı ilgili eğitime katılım sağlamış, eğitimi tamamlamış ve final değerlendirmesinde başarılı olmuştur."
      : "Katılımcı ilgili eğitime katılım sağlamıştır. Ancak final değerlendirmesinde başarılı olamadığından bu çıktı yalnızca katılım formu niteliğindedir; sertifika yerine geçmez.";

    const resultClass = finalPassed ? "success-box" : "warn-box";

    const html = `
      <!doctype html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>D-SEC Eğitim Katılım Formu</title>
          <style>
            * { box-sizing: border-box; }

            body {
              margin: 0;
              padding: 22px;
              font-family: Arial, Helvetica, sans-serif;
              background: #f3f6fb;
              color: #1f2937;
            }

            .page {
              max-width: 1120px;
              margin: 0 auto;
            }

            .toolbar {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 14px;
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

            .doc {
              background: #ffffff;
              border: 1px solid #d7e2ee;
              border-radius: 22px;
              padding: 28px;
              box-shadow: 0 22px 46px rgba(15, 23, 42, 0.08);
            }

            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 18px;
              padding-bottom: 18px;
              border-bottom: 2px solid #e5e7eb;
            }

            .brand-title {
              font-size: 30px;
              font-weight: 900;
              color: #0f766e;
              letter-spacing: 0.4px;
            }

            .brand-sub {
              margin-top: 6px;
              color: #6b7280;
              font-size: 13px;
            }

            .doc-meta {
              text-align: right;
            }

            .doc-chip {
              display: inline-block;
              padding: 8px 12px;
              border-radius: 999px;
              border: 1px solid #bfdbfe;
              background: #eff6ff;
              color: #1d4ed8;
              font-size: 12px;
              font-weight: 800;
            }

            .doc-no {
              margin-top: 10px;
              font-size: 12px;
              color: #6b7280;
              line-height: 1.7;
              font-weight: 700;
            }

            h1 {
              margin: 22px 0 8px;
              font-size: 34px;
              font-weight: 900;
              text-align: center;
              color: #111827;
            }

            .subtitle {
              text-align: center;
              color: #4b5563;
              font-size: 15px;
              line-height: 1.7;
              max-width: 900px;
              margin: 0 auto 18px;
            }

            .status-wrap {
              margin-bottom: 18px;
            }

            .success-box,
            .warn-box {
              border-radius: 14px;
              padding: 14px 16px;
              font-size: 14px;
              line-height: 1.7;
              font-weight: 700;
            }

            .success-box {
              background: #ecfdf5;
              border: 1px solid #86efac;
              color: #166534;
            }

            .warn-box {
              background: #fff7ed;
              border: 1px solid #fdba74;
              color: #9a3412;
            }

            .section-title {
              margin-top: 22px;
              margin-bottom: 10px;
              font-size: 16px;
              font-weight: 900;
              color: #111827;
              letter-spacing: 0.4px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            .info-table td,
            .info-table th,
            .topics-table td,
            .topics-table th {
              border: 1px solid #dbe3ee;
              padding: 12px 14px;
              vertical-align: top;
              font-size: 14px;
            }

            .info-table th,
            .topics-table th {
              background: #f8fafc;
              text-align: left;
              color: #374151;
              font-weight: 800;
              width: 220px;
            }

            .topics-table th:first-child,
            .topics-table td:first-child {
              width: 70px;
              text-align: center;
            }

            .description-box {
              margin-top: 12px;
              padding: 14px 16px;
              border-radius: 14px;
              background: #f8fafc;
              border: 1px solid #e5e7eb;
              color: #4b5563;
              font-size: 14px;
              line-height: 1.8;
            }

            .signatures {
              margin-top: 28px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 28px;
            }

            .signature-card {
              border: 1px solid #dbe3ee;
              border-radius: 16px;
              min-height: 140px;
              padding: 18px;
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
              background: #fff;
            }

            .signature-line {
              width: 240px;
              max-width: 100%;
              height: 1px;
              background: #111827;
              margin-bottom: 10px;
            }

            .signature-title {
              font-size: 15px;
              font-weight: 800;
              color: #111827;
            }

            .signature-sub {
              margin-top: 4px;
              font-size: 13px;
              color: #6b7280;
              line-height: 1.6;
            }

            .footer-note {
              margin-top: 20px;
              padding: 14px 16px;
              border-radius: 14px;
              background: #f8fafc;
              border: 1px solid #e5e7eb;
              color: #4b5563;
              font-size: 13px;
              line-height: 1.7;
            }

            @page {
              size: A4 portrait;
              margin: 10mm;
            }

            @media (max-width: 860px) {
              .header,
              .signatures {
                grid-template-columns: 1fr;
                display: grid;
              }

              .doc-meta {
                text-align: left;
              }
            }

            @media print {
              body {
                background: #ffffff;
                padding: 0;
              }

              .toolbar {
                display: none;
              }

              .doc {
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="toolbar">
              <a class="print-btn" href="#" onclick="window.print(); return false;">Yazdır / PDF</a>
            </div>

            <div class="doc">
              <div class="header">
                <div>
                  <div class="brand-title">D-SEC</div>
                  <div class="brand-sub">Dijital Sağlık • Emniyet • Çevre</div>
                </div>
                <div class="doc-meta">
                  <div class="doc-chip">Eğitim Katılım Formu</div>
                  <div class="doc-no">
                    Düzenlenme Tarihi: ${issueDate}<br/>
                    Belge Türü: Katılım Kayıt Formu
                  </div>
                </div>
              </div>

              <h1>EĞİTİM KATILIM FORMU</h1>
              <div class="subtitle">
                Bu form, aşağıda bilgileri yer alan çalışanın ilgili eğitime katılım sağladığını,
                eğitim kaydının oluşturulduğunu ve değerlendirme sonucunu göstermek amacıyla düzenlenmiştir.
              </div>

              <div class="status-wrap">
                <div class="${resultClass}">
                  ${escapeHtml(resultText)}
                </div>
              </div>

              <div class="section-title">Katılımcı Bilgileri</div>
              <table class="info-table">
                <tr>
                  <th>Ad Soyad</th>
                  <td>${safeUserFullName}</td>
                  <th>Görevi / Rolü</th>
                  <td>${safeUserRole}</td>
                </tr>
                <tr>
                  <th>E-Posta</th>
                  <td>${safeUserEmail}</td>
                  <th>Firma / Kurum</th>
                  <td>${safeCompanyName}</td>
                </tr>
              </table>

              <div class="section-title">Eğitim Bilgileri</div>
              <table class="info-table">
                <tr>
                  <th>Eğitim Adı</th>
                  <td>${trainingTitle}</td>
                  <th>Eğitim Tipi</th>
                  <td>${trainingType}</td>
                </tr>
                <tr>
                  <th>Eğitim Süresi</th>
                  <td>${durationText}</td>
                  <th>Başlangıç Tarihi</th>
                  <td>${startedDate}</td>
                </tr>
                <tr>
                  <th>Tamamlanma / Kapanış</th>
                  <td>${completedDate}</td>
                  <th>Belge Düzenleme Tarihi</th>
                  <td>${issueDate}</td>
                </tr>
                <tr>
                  <th>Final Sonucu</th>
                  <td>${finalPassed ? "Başarılı" : "Başarısız"}</td>
                  <th>Final Puanı</th>
                  <td>${finalScore !== null ? finalScore : "-"}</td>
                </tr>
                <tr>
                  <th>Kullanılan Final Hakkı</th>
                  <td>${attemptsText}</td>
                  <th>Belge Niteliği</th>
                  <td>${finalPassed ? "Katılım + başarı kaydı" : "Yalnızca katılım kaydı"}</td>
                </tr>
              </table>

              <div class="description-box">
                <strong>Eğitim Açıklaması:</strong><br/>
                ${trainingDescription}
              </div>

              <div class="section-title">Eğitim Konu Başlıkları</div>
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

              <div class="signatures">
                <div class="signature-card">
                  <div class="signature-line"></div>
                  <div class="signature-title">Katılımcı</div>
                  <div class="signature-sub">
                    Ad Soyad: ${safeUserFullName}<br/>
                    İmza
                  </div>
                </div>

                <div class="signature-card">
                  <div class="signature-line"></div>
                  <div class="signature-title">Eğitim Yetkilisi / Onay</div>
                  <div class="signature-sub">
                    D-SEC Eğitim Kayıt Birimi<br/>
                    Kaşe / İmza
                  </div>
                </div>
              </div>

              <div class="footer-note">
                Not: Bu form, eğitim katılımının kayıt altına alınması amacıyla düzenlenmiştir.
                ${
                  finalPassed
                    ? " Katılımcı eğitim sürecini başarıyla tamamlamıştır."
                    : " Katılımcı eğitime katılmış olmakla birlikte final değerlendirmesinde başarılı olamadığından bu çıktı sertifika yerine geçmez."
                }
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
    console.error("Attendance form route hata:", err);
    return new NextResponse("Sunucu hatası", { status: 500 });
  }
}