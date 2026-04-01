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

async function sendTrainingInviteEmail(params: {
  to: string;
  fullName: string;
  trainingTitle: string;
  tempPassword: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!apiKey || !emailFrom) {
    return {
      ok: false,
      reason: "Mail ortam değişkenleri eksik.",
    };
  }

  const loginUrl = `${appUrl}/login`;
  const safeName = escapeHtml(params.fullName);
  const safeTraining = escapeHtml(params.trainingTitle);
  const safePassword = escapeHtml(params.tempPassword);
  const safeLoginUrl = escapeHtml(loginUrl);

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;padding:30px;color:#111827;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
        
        <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:24px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:#ffffff;">D-SEC</div>
          <div style="font-size:13px;color:#cbd5e1;margin-top:4px;">Dijital Sağlık • Emniyet • Çevre</div>
        </div>

        <div style="padding:28px;">
          <p style="font-size:15px;margin:0 0 16px;">
            Merhaba <strong>${safeName}</strong>,
          </p>

          <p style="font-size:15px;line-height:1.7;margin:0 0 18px;">
            Size <strong>${safeTraining}</strong> eğitimi atanmıştır.
            Eğitime giriş yapmak için aşağıdaki bilgileri kullanabilirsiniz.
          </p>

          <div style="background:#f9fafb;border-radius:14px;padding:18px;margin:20px 0;border:1px solid #e5e7eb;">
            <div style="font-size:13px;color:#6b7280;">Portal Giriş Linki</div>
            <div style="font-weight:700;margin:6px 0 14px;word-break:break-all;">
              ${safeLoginUrl}
            </div>

            <div style="font-size:13px;color:#6b7280;">Geçici Şifre</div>
            <div style="font-size:22px;font-weight:800;color:#16a34a;margin-top:6px;">
              ${safePassword}
            </div>
          </div>

          <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#374151;">
            Giriş ekranında <strong>email / TC / sicil no</strong> bilgilerinizden uygun olanla giriş yapabilirsiniz.
          </p>

          <p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:#374151;">
            Güvenlik için ilk girişten sonra şifrenizi değiştirmeniz önerilir.
          </p>

          <a
            href="${safeLoginUrl}"
            style="display:inline-block;background:#111827;color:#ffffff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700;"
          >
            Eğitime Başla
          </a>
        </div>

        <div style="background:#f9fafb;padding:18px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;">
          © ${new Date().getFullYear()} D-SEC
          <br />
          www.dsec360.com
        </div>
      </div>
    </div>
  `;

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
      reason: data?.message || "Mail gönderilemedi.",
      data,
    };
  }

  return {
    ok: true,
    data,
  };
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

    const inserts: Array<{
      user_id: string;
      training_id: string;
      status: "not_started";
    }> = [];

    let insertedCount = 0;
    let skippedCount = 0;
    let emailedCount = 0;
    let mailFailedCount = 0;
    let noEmailCount = 0;

    const mailResults: Array<{
      userId: string;
      email: string | null;
      ok: boolean;
      reason?: string;
    }> = [];

    for (const user of typedUsers) {
      const exists = existingSet.has(`${user.id}::${trainingId}`);

      if (exists) {
        skippedCount += 1;
        continue;
      }

      const tempPassword = generatePassword();

      const { error: updateUserError } = await supabase
        .from("users")
        .update({
          temp_password: tempPassword,
          temp_password_created_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateUserError) {
        console.error("TEMP PASSWORD UPDATE ERROR:", updateUserError);
        continue;
      }

      inserts.push({
        user_id: user.id,
        training_id: trainingId,
        status: "not_started",
      });

      insertedCount += 1;

      if (user.email && user.email.trim()) {
        const mailResult = await sendTrainingInviteEmail({
          to: user.email.trim(),
          fullName: user.full_name || "Kullanıcı",
          trainingTitle: training.title || "D-SEC Eğitimi",
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

        const { error: logError } = await supabase.from("mail_logs").insert({
          user_id: user.id,
          email: user.email,
          training_title: training.title,
          status: mailResult.ok ? "sent" : "failed",
          error: mailResult.ok ? null : mailResult.reason,
          created_at: new Date().toISOString(),
        });

        if (logError) {
          console.error("MAIL LOG INSERT ERROR:", logError);
        }
      } else {
        noEmailCount += 1;

        mailResults.push({
          userId: user.id,
          email: null,
          ok: false,
          reason: "Kullanıcıda email yok.",
        });

        const { error: logError } = await supabase.from("mail_logs").insert({
          user_id: user.id,
          email: null,
          training_title: training.title,
          status: "failed",
          error: "Kullanıcıda email yok.",
          created_at: new Date().toISOString(),
        });

        if (logError) {
          console.error("MAIL LOG INSERT ERROR:", logError);
        }
      }

      console.log("📩 DAVET HAZIR:", {
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        training: training.title,
        link: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`,
      });
    }

    if (inserts.length > 0) {
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
          ? "Eğitim atandı ve mail gönderimi işlendi."
          : "Yeni atama yapılmadı. Seçilen kullanıcıların tamamında bu eğitim zaten vardı.",
      mailResults,
    });
  } catch (err) {
    console.error("TRAINING ASSIGN GENERAL ERROR:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}