import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase yapılandırması eksik.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

function detectCategory(message: string) {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes("maaş") || lowerMsg.includes("ücret")) {
    return "İK";
  }

  if (
    lowerMsg.includes("iş güvenliği") ||
    lowerMsg.includes("kaza") ||
    lowerMsg.includes("ramak kala") ||
    lowerMsg.includes("yangın")
  ) {
    return "İSG";
  }

  if (lowerMsg.includes("öneri")) {
    return "Öneri";
  }

  if (lowerMsg.includes("şikayet")) {
    return "Şikayet";
  }

  if (lowerMsg.includes("risk") || lowerMsg.includes("tehlike")) {
    return "Risk";
  }

  return "Genel";
}

function detectPriority(message: string) {
  const text = message.toLowerCase();

  if (
    text.includes("ölüm") ||
    text.includes("yaralanma") ||
    text.includes("yangın") ||
    text.includes("patlama") ||
    text.includes("kaza")
  ) {
    return "critical";
  }

  if (
    text.includes("risk") ||
    text.includes("tehlike") ||
    text.includes("acil") ||
    text.includes("iş güvenliği")
  ) {
    return "high";
  }

  if (text.includes("öneri")) {
    return "low";
  }

  return "normal";
}

function resolveSlaHours(category: string, priority: string) {
  if (priority === "critical") return 4;
  if (priority === "high") return 8;

  if (category === "İSG") return 8;
  if (category === "Risk") return 8;
  if (category === "Öneri") return 48;

  return 24;
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, email, message } = body ?? {};

    if (!full_name?.trim() || !email?.trim() || !message?.trim()) {
      return Response.json(
        { error: "Tüm alanlar zorunludur." },
        { status: 400 }
      );
    }

    const cleanFullName = full_name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();

    const supabase = getSupabase();

    // 1) Kategori otomatik
    const category = detectCategory(cleanMessage);

    // 2) Öncelik otomatik
    const priority = detectPriority(cleanMessage);

    // 3) SLA otomatik
    const now = new Date();
    const slaHours = resolveSlaHours(category, priority);
    const slaDue = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

    const insertPayload = {
      full_name: cleanFullName,
      email: cleanEmail,
      message: cleanMessage,
      status: "new",
      category,
      priority,
      sla_due_at: slaDue.toISOString(),
      source_type: "WEB",
      mail_sent_count: 0,
    };

    const { data, error } = await supabase
      .from("cbs_forms")
      .insert([insertPayload])
      .select("*")
      .single();

    if (error) {
      console.error("CBS kayıt hatası:", error);
      return Response.json(
        { error: "Kayıt oluşturulamadı." },
        { status: 500 }
      );
    }

    const resend = getResend();
    const notifyEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    // ================================
    // ADMIN BİLDİRİM MAİLİ
    // ================================
    if (resend && notifyEmail) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: [notifyEmail],
          subject: `🚨 Yeni ÇBS Başvurusu #${data.id}`,
          html: `
            <h2>D-SEC Yeni ÇBS Başvurusu</h2>
            <p><strong>ID:</strong> #${data.id}</p>
            <p><strong>Kategori:</strong> ${escapeHtml(data.category || "-")}</p>
            <p><strong>Öncelik:</strong> ${escapeHtml(data.priority || "-")}</p>
            <p><strong>Ad Soyad:</strong> ${escapeHtml(data.full_name || "-")}</p>
            <p><strong>Email:</strong> ${escapeHtml(data.email || "-")}</p>
            <p><strong>Durum:</strong> ${escapeHtml(data.status || "-")}</p>
            <p><strong>SLA:</strong> ${escapeHtml(data.sla_due_at || "-")}</p>
            <hr />
            <p><strong>Mesaj:</strong></p>
            <p>${escapeHtml(data.message || "").replace(/\n/g, "<br/>")}</p>
          `,
        });

        await supabase.from("cbs_mail_logs").insert({
          cbs_form_id: data.id,
          direction: "outbound",
          subject: "Yeni başvuru bildirimi",
          recipient_email: notifyEmail,
          sender_email: fromEmail,
          body: `Yeni ÇBS başvurusu #${data.id}`,
          status: "sent",
        });

        await supabase
          .from("cbs_forms")
          .update({
            mail_sent_count: 1,
            last_mail_sent_at: new Date().toISOString(),
          })
          .eq("id", data.id);
      } catch (mailError) {
        console.error("CBS admin mail gönderim hatası:", mailError);

        await supabase.from("cbs_mail_logs").insert({
          cbs_form_id: data.id,
          direction: "outbound",
          subject: "Yeni başvuru bildirimi",
          recipient_email: notifyEmail,
          sender_email: fromEmail,
          body: `Yeni ÇBS başvurusu #${data.id}`,
          status: "failed",
          error_message: String(mailError),
        });
      }
    }

    // ================================
    // KULLANICIYA OTOMATİK CEVAP
    // ================================
    if (resend) {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: [cleanEmail],
          subject: "Başvurunuz alındı",
          html: `
            <h2>D-SEC Bildirim</h2>
            <p>Sayın ${escapeHtml(cleanFullName)},</p>
            <p>Başvurunuz başarıyla alınmıştır.</p>
            <p>Talebiniz kayıt altına alınmış olup en kısa sürede değerlendirilecektir.</p>
            <hr />
            <p><strong>Başvuru No:</strong> #${data.id}</p>
            <p><strong>Kategori:</strong> ${escapeHtml(category)}</p>
            <p><strong>Öncelik:</strong> ${escapeHtml(priority)}</p>
          `,
        });

        const currentMailCount =
          typeof data.mail_sent_count === "number" ? data.mail_sent_count : 1;

        await supabase.from("cbs_mail_logs").insert({
          cbs_form_id: data.id,
          direction: "outbound",
          subject: "Kullanıcı bilgilendirme",
          recipient_email: cleanEmail,
          sender_email: fromEmail,
          body: `Başvurunuz alındı #${data.id}`,
          status: "sent",
        });

        await supabase
          .from("cbs_forms")
          .update({
            mail_sent_count: currentMailCount + 1,
            last_mail_sent_at: new Date().toISOString(),
          })
          .eq("id", data.id);
      } catch (mailError) {
        console.error("Kullanıcı mail hatası:", mailError);

        await supabase.from("cbs_mail_logs").insert({
          cbs_form_id: data.id,
          direction: "outbound",
          subject: "Kullanıcı bilgilendirme",
          recipient_email: cleanEmail,
          sender_email: fromEmail,
          body: `Başvurunuz alındı #${data.id}`,
          status: "failed",
          error_message: String(mailError),
        });
      }
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("CBS POST hata:", error);
    return Response.json(
      { error: "Sunucu hatası." },
      { status: 500 }
    );
  }
}
