import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase yapılandırması eksik.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

type AdminSession = {
  userId: string;
  role: "super_admin" | "company_admin";
  companyId: string;
};

async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();

  const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
  const adminRole = cookieStore.get("dsec_admin_role")?.value;
  const userId = String(cookieStore.get("dsec_user_id")?.value || "").trim();

  const isAllowedRole =
    adminRole === "super_admin" || adminRole === "company_admin";

  if (adminAuth !== "ok" || !isAllowedRole || !userId) {
    return null;
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("users")
    .select("id, role, company_id")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const role =
    String(data.role || "").trim() === "super_admin"
      ? "super_admin"
      : "company_admin";

  return {
    userId: String(data.id || "").trim(),
    role,
    companyId: String(data.company_id || "").trim(),
  };
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const id = Number(body?.id);
    const replyMessage = String(body?.replyMessage || "").trim();

    if (!id || !replyMessage) {
      return NextResponse.json(
        { error: "ID ve cevap metni zorunludur." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("cbs_forms")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("CBS reply kayıt okuma hatası:", error);
      return NextResponse.json(
        { error: "Kayıt bulunamadı." },
        { status: 404 }
      );
    }

    if (session.role === "company_admin") {
      const recordFirmId = String(data.firm_id || "").trim();

      if (!recordFirmId || recordFirmId !== session.companyId) {
        return NextResponse.json(
          { error: "Bu kayıt için yetkiniz yok." },
          { status: 403 }
        );
      }
    }

    const resend = getResend();
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    let mailStatus: "sent" | "failed" | "skipped" = "skipped";
    let mailErrorMessage = "";

    if (resend && data.email) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: [data.email],
          subject: `Başvurunuz hakkında geri dönüş #${data.id}`,
          html: `
            <h2>Başvurunuza Yanıt</h2>
            <p>Sayın ${escapeHtml(data.full_name || "Kullanıcı")},</p>
            <p>${escapeHtml(replyMessage).replace(/\n/g, "<br/>")}</p>
            <hr/>
            <p><strong>Başvuru No:</strong> #${data.id}</p>
          `,
        });

        mailStatus = "sent";
      } catch (mailError) {
        mailStatus = "failed";
        mailErrorMessage =
          mailError instanceof Error ? mailError.message : String(mailError);
        console.error("CBS reply mail hatası:", mailError);
      }
    }

    const updatePayload: Record<string, unknown> = {
      status: "closed",
      resolution_note: replyMessage,
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (mailStatus === "sent") {
      updatePayload.mail_sent_count = Number(data.mail_sent_count || 0) + 1;
      updatePayload.last_mail_sent_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("cbs_forms")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) {
      console.error("CBS reply update hatası:", updateError);
      return NextResponse.json(
        { error: "Kayıt güncellenemedi." },
        { status: 500 }
      );
    }

    const logPayload: Record<string, unknown> = {
      cbs_form_id: id,
      direction: "outbound",
      subject: "Admin cevap",
      recipient_email: data.email || null,
      status: mailStatus,
    };

    if (mailErrorMessage) {
      logPayload.error_message = mailErrorMessage;
    }

    const { error: logError } = await supabase
      .from("cbs_mail_logs")
      .insert(logPayload);

    if (logError) {
      console.error("CBS reply log hatası:", logError);
    }

    if (mailStatus === "failed") {
      return NextResponse.json({
        success: true,
        warning:
          "Kayıt kapatıldı ancak cevap maili gönderilemedi. Log kaydı oluşturuldu.",
      });
    }

    if (mailStatus === "skipped") {
      return NextResponse.json({
        success: true,
        warning:
          "Kayıt kapatıldı. Mail servisi aktif olmadığı için e-posta gönderilmedi.",
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CBS reply genel hata:", err);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}