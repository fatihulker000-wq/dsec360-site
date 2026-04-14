import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase yapılandırması eksik.");
  }

  return createClient(url, key);
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

function detectCategory(message: string) {
  const msg = message.toLowerCase();

  if (msg.includes("maaş") || msg.includes("ücret")) return "İK";
  if (
    msg.includes("kaza") ||
    msg.includes("iş güvenliği") ||
    msg.includes("ramak kala")
  ) {
    return "İSG";
  }
  if (msg.includes("öneri")) return "Öneri";
  if (msg.includes("şikayet")) return "Şikayet";

  return "Genel";
}

function normalizeFirmId(value: unknown): string | null {
  const v = String(value || "").trim();
  return v || null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const full_name = String(body?.full_name || "").trim();
    const email = String(body?.email || "").trim();
    const message = String(body?.message || "").trim();

    if (!full_name || !email || !message) {
      return NextResponse.json(
        { error: "Tüm alanlar zorunludur." },
        { status: 400 }
      );
    }

    const url = new URL(req.url);

    // Öncelik:
    // 1) body.firm_id
    // 2) query ?firm=...
    // 3) null
    const firmId = normalizeFirmId(body?.firm_id) ??
      normalizeFirmId(url.searchParams.get("firm"));

    const supabase = getSupabase();

    const now = new Date();
    const slaDue = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const category = detectCategory(message);

    const insertPayload: Record<string, unknown> = {
      full_name,
      email,
      message,
      status: "new",
      category,
      priority: "normal",
      sla_due_at: slaDue.toISOString(),
      firm_id: firmId,
      source_type: "WEB",
      mail_sent_count: 0,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { data, error } = await supabase
      .from("cbs_forms")
      .insert([insertPayload])
      .select("*")
      .single();

    if (error || !data) {
      console.error("CBS insert hatası:", error);
      return NextResponse.json(
        { error: "Kayıt oluşturulamadı." },
        { status: 500 }
      );
    }

    const resend = getResend();
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

    let adminMailStatus: "sent" | "failed" | "skipped" = "skipped";
    let adminMailError = "";

    if (resend && adminEmail) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: [adminEmail],
          subject: `🚨 Yeni ÇBS #${data.id}`,
          html: `
            <h2>Yeni Başvuru</h2>
            <p><strong>${escapeHtml(full_name)}</strong></p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Kategori:</strong> ${escapeHtml(category)}</p>
            <p><strong>Firma ID:</strong> ${escapeHtml(firmId || "-")}</p>
            <hr/>
            <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
            <hr/>
            <p><strong>ID:</strong> #${data.id}</p>
          `,
        });

        adminMailStatus = "sent";

        await supabase
          .from("cbs_forms")
          .update({
            mail_sent_count: Number(data.mail_sent_count || 0) + 1,
            last_mail_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id);
      } catch (e) {
        adminMailStatus = "failed";
        adminMailError = e instanceof Error ? e.message : String(e);
        console.error("Admin mail hatası:", e);
      }
    }

    let userMailStatus: "sent" | "failed" | "skipped" = "skipped";
    let userMailError = "";

    if (resend) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: [email],
          subject: "Başvurunuz alındı",
          html: `
            <h2>Başvurunuz alındı</h2>
            <p>Sayın ${escapeHtml(full_name)},</p>
            <p>Başvurunuz başarıyla alınmıştır.</p>
            <p>En kısa sürede dönüş yapılacaktır.</p>
            <hr/>
            <p><strong>Başvuru No:</strong> #${data.id}</p>
          `,
        });

        userMailStatus = "sent";
      } catch (e) {
        userMailStatus = "failed";
        userMailError = e instanceof Error ? e.message : String(e);
        console.error("User mail hatası:", e);
      }
    }

    await supabase.from("cbs_mail_logs").insert([
      {
        cbs_form_id: data.id,
        direction: "outbound",
        subject: "Yeni başvuru bildirimi",
        recipient_email: adminEmail || null,
        status: adminMailStatus,
        error_message: adminMailError || null,
      },
      {
        cbs_form_id: data.id,
        direction: "outbound",
        subject: "Kullanıcı bilgilendirme",
        recipient_email: email,
        status: userMailStatus,
        error_message: userMailError || null,
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        full_name: data.full_name,
        email: data.email,
        message: data.message,
        status: data.status,
        category: data.category,
        firm_id: data.firm_id,
        priority: data.priority,
        sla_due_at: data.sla_due_at,
        created_at: data.created_at,
      },
    });
  } catch (err) {
    console.error("CBS create genel hata:", err);
    return NextResponse.json(
      { error: "Sunucu hatası." },
      { status: 500 }
    );
  }
}