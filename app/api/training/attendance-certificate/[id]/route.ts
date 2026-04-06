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

function topicsToHtml(topics: string[]) {
  if (!topics.length) {
    return `
      <li>
        <span class="idx">-</span>
        <span>Bu eğitim için konu bilgisi girilmemiştir.</span>
      </li>
    `;
  }

  return topics
    .map(
      (topic, index) => `
        <li>
          <span class="idx">${index + 1}</span>
          <span>${escapeHtml(topic)}</span>
        </li>
      `
    )
    .join("");
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

export async function GET(
  _request: Request,
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
      return new NextResponse("Katılım belgesi kaydı bulunamadı.", {
        status: 404,
      });
    }

    const assignment = data;

    const canShowAttendance =
      assignment.status === "completed" || assignment.training_reset_required === true;

    if (!canShowAttendance) {
      return new NextResponse(
        "Katılım belgesi yalnızca tamamlanan veya başarısızlık sonrası kapanan eğitimler için oluşturulur.",
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

    const safeUserEmail = escapeHtml(userEmail);
    const safeUserFullName = escapeHtml(userFullName);
    const safeCompanyName = escapeHtml(companyName);

    const trainingTitle = escapeHtml(training?.title || "Eğitim adı bulunamadı");
    const trainingDescription = escapeHtml(training?.description || "-");
    const trainingType = escapeHtml(training?.type || "online");
    const durationMinutes = training?.duration_minutes ?? null;

    const topics = parseTrainingTopics(training?.topics_text);
    const topicsHtml = topicsToHtml(topics);

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

    const resultBadge = finalPassed ? "BAŞARILI KATILIM" : "BAŞARISIZ KATILIM";
    const resultColor = finalPassed ? "#166534" : "#991b1b";
    const resultBg = finalPassed ? "#dcfce7" : "#fee2e2";
    const resultBorder = finalPassed ? "#86efac" : "#fca5a5";

    const resultText = finalPassed
      ? "Katılımcı eğitimi tamamlamış ve final sınavında başarılı olmuştur."
      : "Katılımcı eğitime katılmıştır; ancak final sınavında başarılı olamadığı için bu belge yalnızca katılım belgesi niteliğindedir. Sertifika yerine geçmez.";

    const html = `
      <!doctype html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>D-SEC Eğitim Katılım Belgesi</title>
          <style>
            * { box-sizing: border-box; }

            body {
              margin: 0;
              padding: 22px;
              font-family: Arial, Helvetica, sans-serif;
              background: #f8fafc;
              color: #111827;
            }

            .page {
              max-width: 1180px;
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
              background: #fff;
              border: 8px solid #0f766e;
              border-radius: 24px;
              padding: 32px 34px 28px;
              box-shadow: 0 20px 40px rgba(15, 23, 42, 0.10);
            }

            .top {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              align-items: flex-start;
            }

            .brand-title {
              font-size: 30px;
              font-weight: 900;
              color: #0f766e;
            }

            .brand-sub {
              margin-top: 4px;
              font-size: 13px;
              color: #6b7280;
            }

            .badge {
              padding: 10px 14px;
              border-radius: 999px;
              background: #ecfeff;
              border: 1px solid #99f6e4;
              color: #115e59;
              font-size: 12px;
              font-weight: 800;
            }

            h1 {
              margin: 18px 0 0;
              font-size: 40px;
              font-weight: 900;
              text-align: center;
            }

            .desc {
              margin: 14px auto 0;
              max-width: 860px;
              text-align: center;
              font-size: 17px;
              line-height: 1.7;
              color: #4b5563;
            }

            .result-box {
              margin: 18px auto 0;
              max-width: 900px;
              padding: 14px 16px;
              border-radius: 14px;
              text-align: center;
              font-size: 15px;
              line-height: 1.7;
              font-weight: 700;
              color: ${resultColor};
              background: ${resultBg};
              border: 1px solid ${resultBorder};
            }

            .result-chip {
              display: inline-flex;
              margin-top: 12px;
              padding: 8px 12px;
              border-radius: 999px;
              background: ${resultBg};
              border: 1px solid ${resultBorder};
              color: ${resultColor};
              font-size: 12px;
              font-weight: 800;
            }

            .person {
              margin-top: 26px;
              text-align: center;
            }

            .name {
              font-size: 34px;
              font-weight: 900;
            }

            .mail {
              margin-top: 8px;
              color: #6b7280;
              font-size: 15px;
            }

            .training {
              margin-top: 24px;
              text-align: center;
            }

            .training-title {
              font-size: 28px;
              font-weight: 800;
              color: #166534;
            }

            .training-desc {
              margin-top: 10px;
              font-size: 15px;
              line-height: 1.75;
              color: #4b5563;
            }

            .grid {
              margin-top: 24px;
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 14px;
            }

            .card {
              background: #f8fafc;
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              padding: 16px;
            }

            .label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              font-weight: 700;
              margin-bottom: 8px;
            }

            .value {
              font-size: 15px;
              font-weight: 800;
              line-height: 1.6;
            }

            .topics {
              margin-top: 22px;
              background: #f8fafc;
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              padding: 16px 18px;
            }

            .topics-title {
              font-size: 14px;
              font-weight: 800;
              margin-bottom: 10px;
            }

            .topics ul {
              list-style: none;
              margin: 0;
              padding: 0;
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px 16px;
            }

            .topics li {
              display: flex;
              gap: 10px;
              align-items: flex-start;
              font-size: 14px;
              line-height: 1.6;
              color: #374151;
            }

            .idx {
              min-width: 24px;
              height: 24px;
              border-radius: 999px;
              background: #ccfbf1;
              color: #115e59;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 800;
            }

            .bottom {
              margin-top: 28px;
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
            }

            .signature-sub {
              margin-top: 4px;
              font-size: 13px;
              color: #6b7280;
            }

            .warning-note {
              margin-top: 18px;
              padding: 14px 16px;
              border-radius: 14px;
              background: #fff7ed;
              border: 1px solid #fdba74;
              color: #9a3412;
              font-size: 14px;
              line-height: 1.7;
              font-weight: 700;
            }

            @page {
              size: A4 landscape;
              margin: 10mm;
            }

            @media (max-width: 900px) {
              .grid,
              .topics ul {
                grid-template-columns: 1fr;
              }
            }

            @media print {
              body {
                background: #fff;
                padding: 0;
              }
              .toolbar { display: none; }
              .doc { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="toolbar">
              <a class="print-btn" href="#" onclick="window.print(); return false;">Yazdır / PDF</a>
            </div>

            <div class="doc">
              <div class="top">
                <div>
                  <div class="brand-title">D-SEC</div>
                  <div class="brand-sub">Dijital Sağlık • Emniyet • Çevre</div>
                </div>
                <div class="badge">Eğitim Katılım Belgesi</div>
              </div>

              <h1>KATILIM BELGESİ</h1>

              <div class="desc">
                Bu belge, aşağıda bilgileri yer alan katılımcının ilgili eğitime katılım sağladığını
                ve eğitim kaydının oluşturulduğunu göstermek amacıyla düzenlenmiştir.
              </div>

              <div style="text-align:center;">
                <div class="result-chip">${resultBadge}</div>
              </div>

              <div class="result-box">
                ${escapeHtml(resultText)}
              </div>

              <div class="person">
                <div class="name">${safeUserFullName}</div>
                <div class="mail">${safeUserEmail}</div>
              </div>

              <div class="training">
                <div class="training-title">${trainingTitle}</div>
                <div class="training-desc">${trainingDescription}</div>
              </div>

              <div class="grid">
                <div class="card">
                  <div class="label">Firma / Kurum</div>
                  <div class="value">${safeCompanyName}</div>
                </div>
                <div class="card">
                  <div class="label">Eğitim Tipi</div>
                  <div class="value">${trainingType}</div>
                </div>
                <div class="card">
                  <div class="label">Eğitim Süresi</div>
                  <div class="value">${durationText}</div>
                </div>
                <div class="card">
                  <div class="label">Başlangıç Kaydı</div>
                  <div class="value">${startedDate}</div>
                </div>
                <div class="card">
                  <div class="label">Tamamlanma / Kapanış Tarihi</div>
                  <div class="value">${completedDate}</div>
                </div>
                <div class="card">
                  <div class="label">Belge Düzenleme Tarihi</div>
                  <div class="value">${issueDate}</div>
                </div>
                <div class="card">
                  <div class="label">Final Sonucu</div>
                  <div class="value">${finalPassed ? "Başarılı" : "Başarısız"}</div>
                </div>
                <div class="card">
                  <div class="label">Final Puanı</div>
                  <div class="value">${finalScore !== null ? "%" + finalScore : "-"}</div>
                </div>
                <div class="card">
                  <div class="label">Kullanılan Final Hakkı</div>
                  <div class="value">${attemptsText}</div>
                </div>
              </div>

              <div class="topics">
                <div class="topics-title">Katılım Sağlanan Eğitim Konuları</div>
                <ul>
                  ${topicsHtml}
                </ul>
              </div>

              ${
                finalPassed
                  ? ""
                  : `
                    <div class="warning-note">
                      Not: Bu belge yalnızca katılımı gösterir. Final sınavı başarısız olduğundan sertifika yerine geçmez ve başarılı tamamlanmış eğitim olarak değerlendirilmez.
                    </div>
                  `
              }

              <div class="bottom">
                <div>
                  <div class="signature-line"></div>
                  <div class="signature-title">D-SEC Eğitim Yetkilisi</div>
                  <div class="signature-sub">Onay / İmza</div>
                </div>

                <div style="text-align:right;">
                  <strong>D-SEC</strong><br/>
                  Eğitim Kayıt Birimi
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
    console.error("Attendance certificate route hata:", err);
    return new NextResponse("Sunucu hatası", { status: 500 });
  }
}