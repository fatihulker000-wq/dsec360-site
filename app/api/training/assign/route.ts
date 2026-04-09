import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type TrainingRow = {
  id: string;
  title: string | null;
  description: string | null;
  type: string | null;
};

type AssignmentRow = {
  user_id: string;
  training_id: string;
};

function generatePassword() {
  return Math.random().toString(36).slice(-8);
}

function escapeHtml(value: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isValidEmail(email?: string | null) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function getTrainingTypeLabel(type?: string | null) {
  const value = String(type || "").trim().toLowerCase();

  if (value === "senkron") return "Senkron Eğitim";
  if (value === "asenkron") return "Asenkron Eğitim";

  return type || "Eğitim";
}

function getSafeTrainingDescription(description?: string | null) {
  const raw = String(description || "").trim();
  if (!raw) return "Bu eğitim için sistemde ek açıklama bulunmamaktadır.";
  return raw.length > 500 ? `${raw.slice(0, 497)}...` : raw;
}

async function insertMailLog(params: {
  supabase: ReturnType<typeof getSupabase>;
  userId: string;
  email: string | null;
  trainingTitle: string | null;
  status: "sent" | "failed";
  errorText?: string | null;
}) {
  try {
    const { error } = await params.supabase.from("mail_logs").insert({
      user_id: params.userId,
      email: params.email,
      training_title: params.trainingTitle,
      status: params.status,
      error: params.errorText || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("MAIL LOG INSERT ERROR:", error);
    }
  } catch (err) {
    console.error("MAIL LOG INSERT GENERAL ERROR:", err);
  }
}

async function sendTrainingInviteEmail(params: {
  to: string;
  fullName: string;
  trainingTitle: string;
  trainingDescription?: string | null;
  trainingType?: string | null;
  tempPassword: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://dsec360.com";

  if (!apiKey || !emailFrom) {
    return {
      ok: false,
      reason:
        "Mail ortam değişkenleri eksik. RESEND_API_KEY veya EMAIL_FROM tanımlı değil.",
    };
  }

  const loginUrl = `${appUrl.replace(/\/$/, "")}/login`;
  const safeName = escapeHtml(params.fullName);
  const safeTraining = escapeHtml(params.trainingTitle);
  const safePassword = escapeHtml(params.tempPassword);
  const safeLoginUrl = escapeHtml(loginUrl);
  const safeTrainingType = escapeHtml(getTrainingTypeLabel(params.trainingType));
  const safeTrainingDescription = escapeHtml(
    getSafeTrainingDescription(params.trainingDescription)
  );

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;padding:30px;color:#111827;">
      <div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 10px 30px rgba(0,0,0,0.08);">

        <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:26px;text-align:center;">
          <div style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:0.3px;">D-SEC</div>
          <div style="font-size:13px;color:#cbd5e1;margin-top:6px;">Dijital Sağlık • Emniyet • Çevre</div>
        </div>

        <div style="padding:30px 28px;">
          <div style="display:inline-block;padding:8px 12px;border-radius:999px;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;font-size:12px;font-weight:700;margin-bottom:18px;">
            Yeni Eğitim Ataması
          </div>

          <p style="font-size:15px;margin:0 0 16px;line-height:1.7;">
            Merhaba <strong>${safeName}</strong>,
          </p>

          <p style="font-size:15px;line-height:1.8;margin:0 0 16px;color:#374151;">
            D-SEC Eğitim Portalı üzerinden tarafınıza aşağıdaki eğitim tanımlanmıştır:
          </p>

          <div style="background:#f9fafb;border-radius:14px;padding:18px;margin:18px 0;border:1px solid #e5e7eb;">
            <div style="font-size:13px;color:#6b7280;">Eğitim Adı</div>
            <div style="font-size:20px;font-weight:800;color:#111827;margin-top:6px;">
              ${safeTraining}
            </div>

            <div style="margin-top:16px;font-size:13px;color:#6b7280;">Eğitim Tipi</div>
            <div style="font-size:15px;font-weight:700;color:#374151;margin-top:6px;">
              ${safeTrainingType}
            </div>

            <div style="margin-top:16px;font-size:13px;color:#6b7280;">Eğitim Açıklaması</div>
            <div style="font-size:14px;line-height:1.8;color:#374151;margin-top:6px;">
              ${safeTrainingDescription}
            </div>
          </div>

          <p style="font-size:14px;line-height:1.8;margin:0 0 16px;color:#374151;">
            Eğitime erişim sağlamak için aşağıda yer alan portal bağlantısı ve geçici giriş bilgilerini kullanabilirsiniz.
          </p>

          <div style="background:#f9fafb;border-radius:14px;padding:18px;margin:20px 0;border:1px solid #e5e7eb;">
            <div style="font-size:13px;color:#6b7280;">Portal Giriş Linki</div>
            <div style="font-weight:700;margin:6px 0 14px;word-break:break-all;color:#111827;">
              ${safeLoginUrl}
            </div>

            <div style="font-size:13px;color:#6b7280;">Geçici Şifre</div>
            <div style="font-size:24px;font-weight:900;color:#16a34a;margin-top:6px;letter-spacing:0.4px;">
              ${safePassword}
            </div>
          </div>

          <p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:#374151;">
            Giriş ekranında <strong>email / TC / sicil no</strong> bilgilerinizden uygun olan bilgi ile giriş yapabilirsiniz.
          </p>

          <p style="margin:0 0 18px;font-size:14px;line-height:1.8;color:#374151;">
            Bilgi güvenliği kapsamında ilk girişiniz sonrasında şifrenizi değiştirmeniz önerilir.
          </p>

          <div style="margin-top:20px;">
            <a
              href="${safeLoginUrl}"
              style="display:inline-block;background:#111827;color:#ffffff;padding:13px 22px;border-radius:10px;text-decoration:none;font-weight:800;font-size:14px;"
            >
              Eğitime Başla
            </a>
          </div>

          <div style="margin-top:24px;padding:14px 16px;border-radius:12px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-size:13px;line-height:1.7;">
            Bu bildirim sistem tarafından otomatik oluşturulmuştur. Atanan eğitiminizi zamanında tamamlamanız önerilir.
          </div>
        </div>

        <div style="background:#f9fafb;padding:18px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
          © ${new Date().getFullYear()} D-SEC
          <br />
          www.dsec360.com
        </div>
      </div>
    </div>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [params.to],
        subject: `D-SEC Eğitim Ataması: ${params.trainingTitle}`,
        html,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        reason:
          data?.message ||
          data?.error ||
          data?.name ||
          `Mail gönderilemedi. HTTP ${response.status}`,
        data,
      };
    }

    return {
      ok: true,
      data,
    };
  } catch (err: any) {
    return {
      ok: false,
      reason: err?.message || "Mail servisine bağlanılamadı.",
    };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const userIds = Array.isArray(body?.userIds)
      ? body.userIds.map((x: unknown) => String(x)).filter(Boolean)
      : [];

    const trainingId = body?.trainingId ? String(body.trainingId) : "";

    if (!userIds.length || !trainingId) {
      return NextResponse.json({ error: "Eksik veri" }, { status: 400 });
    }

    const uniqueUserIds = Array.from(new Set(userIds));
    const supabase = getSupabase();

    const { data: training, error: trainingError } = await supabase
      .from("trainings")
      .select("id, title, description, type")
      .eq("id", trainingId)
      .maybeSingle<TrainingRow>();

    if (trainingError || !training) {
      return NextResponse.json(
        { error: "Eğitim bilgisi alınamadı." },
        { status: 500 }
      );
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email, phone")
      .in("id", uniqueUserIds);

    if (usersError) {
      return NextResponse.json(
        { error: "Kullanıcılar alınamadı." },
        { status: 500 }
      );
    }

    const typedUsers = (users || []) as UserRow[];

    const { data: existingRows, error: existingError } = await supabase
      .from("training_assignments")
      .select("user_id, training_id")
      .eq("training_id", trainingId)
      .in("user_id", uniqueUserIds);

    if (existingError) {
      return NextResponse.json(
        { error: "Mevcut atamalar kontrol edilemedi." },
        { status: 500 }
      );
    }

    const existingSet = new Set(
      ((existingRows || []) as AssignmentRow[]).map(
        (row) => `${row.user_id}::${row.training_id}`
      )
    );

    const assignableUsers: Array<{
      user: UserRow;
      tempPassword: string;
    }> = [];

    let skippedCount = 0;

    for (const user of typedUsers) {
      const exists = existingSet.has(`${user.id}::${trainingId}`);

      if (exists) {
        skippedCount += 1;
        continue;
      }

      assignableUsers.push({
        user,
        tempPassword: generatePassword(),
      });
    }

    if (assignableUsers.length === 0) {
      return NextResponse.json({
        success: true,
        insertedCount: 0,
        skippedCount,
        emailedCount: 0,
        mailFailedCount: 0,
        noEmailCount: 0,
        trainingTitle: training.title,
        message:
          "Yeni atama yapılmadı. Seçilen kullanıcıların tamamında bu eğitim zaten vardı.",
        mailResults: [],
      });
    }

    const inserts = assignableUsers.map(({ user }) => ({
      user_id: user.id,
      training_id: trainingId,
      status: "not_started" as const,
    }));

    const { error: insertError } = await supabase
      .from("training_assignments")
      .insert(inserts);

    if (insertError) {
      console.error("ASSIGNMENT INSERT ERROR:", insertError);
      return NextResponse.json(
        { error: "Atama kaydı başarısız." },
        { status: 500 }
      );
    }

    let insertedCount = assignableUsers.length;
    let emailedCount = 0;
    let mailFailedCount = 0;
    let noEmailCount = 0;

    const mailResults: Array<{
      userId: string;
      email: string | null;
      ok: boolean;
      reason?: string;
    }> = [];

    for (const item of assignableUsers) {
      const user = item.user;
      const tempPassword = item.tempPassword;

      const { error: updateUserError } = await supabase
        .from("users")
        .update({
          temp_password: tempPassword,
          temp_password_created_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateUserError) {
        console.error("TEMP PASSWORD UPDATE ERROR:", updateUserError);
      }

      if (!isValidEmail(user.email)) {
        noEmailCount += 1;

        mailResults.push({
          userId: user.id,
          email: user.email,
          ok: false,
          reason: "Kullanıcı email bilgisi yok veya email formatı geçersiz.",
        });

        await insertMailLog({
          supabase,
          userId: user.id,
          email: user.email,
          trainingTitle: training.title,
          status: "failed",
          errorText: "Kullanıcı email bilgisi yok veya email formatı geçersiz.",
        });

        continue;
      }

      const mailResult = await sendTrainingInviteEmail({
        to: user.email!.trim(),
        fullName: user.full_name || "Kullanıcı",
        trainingTitle: training.title || "D-SEC Eğitimi",
        trainingDescription: training.description,
        trainingType: training.type,
        tempPassword,
      });

      if (mailResult.ok) {
        emailedCount += 1;
      } else {
        mailFailedCount += 1;
        console.error("MAIL SEND ERROR:", {
          userId: user.id,
          email: user.email,
          reason: mailResult.reason,
        });
      }

      mailResults.push({
        userId: user.id,
        email: user.email,
        ok: mailResult.ok,
        reason: mailResult.ok ? undefined : mailResult.reason,
      });

      await insertMailLog({
        supabase,
        userId: user.id,
        email: user.email,
        trainingTitle: training.title,
        status: mailResult.ok ? "sent" : "failed",
        errorText: mailResult.ok ? null : mailResult.reason,
      });

      console.log("📩 DAVET İŞLENDİ:", {
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        training: training.title,
       link: `${process.env.NEXT_PUBLIC_APP_URL || "https://dsec360.com"}/login`,
        mailOk: mailResult.ok,
      });
    }

    return NextResponse.json({
      success: true,
      insertedCount,
      skippedCount,
      emailedCount,
      mailFailedCount,
      noEmailCount,
      trainingTitle: training.title,
      message:
        insertedCount > 0
          ? "Eğitim atandı. Mail gönderimleri işlendi."
          : "Yeni atama yapılmadı.",
      mailResults,
    });
  } catch (err) {
    console.error("TRAINING ASSIGN GENERAL ERROR:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
