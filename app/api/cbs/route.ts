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

function normalizeFirmId(value: unknown): string | null {
  const v = String(value || "").trim();
  return v || null;
}

function normalizeText(value: unknown): string {
  return String(value || "").trim();
}

function normalizeKey(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();
}

function normalizeFirmName(value: string) {
  return normalizeKey(value)
    .replace(/\s+/g, " ")
    .replace(/a\.s\./g, "as")
    .replace(/a\.ş\./g, "as")
    .replace(/anonim sirketi/g, "")
    .replace(/limited sirketi/g, "")
    .replace(/ltd\.sti\./g, "")
    .replace(/ltd/g, "")
    .replace(/sti/g, "")
    .trim();
}

function detectSourceType(value: unknown) {
  const raw = String(value || "").trim().toUpperCase();

  if (raw === "APP") return "APP";
  return "WEB";
}

async function resolveCompanyIdByName(
  supabase: ReturnType<typeof getSupabase>,
  firmaAdi: string
): Promise<string | null> {
  const normalizedTarget = normalizeFirmName(firmaAdi);
  if (!normalizedTarget) return null;

  const { data, error } = await supabase
    .from("companies")
    .select("id, name")
    .limit(500);

  if (error || !data?.length) {
    return null;
  }

  const exact = data.find((item) => {
    return normalizeFirmName(String(item.name || "")) === normalizedTarget;
  });

  if (exact?.id) {
    return String(exact.id);
  }

  const includes = data.find((item) => {
    const dbName = normalizeFirmName(String(item.name || ""));
    return dbName.includes(normalizedTarget) || normalizedTarget.includes(dbName);
  });

  if (includes?.id) {
    return String(includes.id);
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const full_name = normalizeText(body?.full_name);
    const email = normalizeText(body?.email);
    const firma_adi = normalizeText(body?.firma_adi);
    const message = normalizeText(body?.message);

    if (!full_name || !email || !firma_adi || !message) {
      return Response.json(
        { error: "Tüm alanlar zorunludur." },
        { status: 400 }
      );
    }

    const cleanFullName = full_name;
    const cleanEmail = email;
    const cleanFirmaAdi = firma_adi;
    const cleanMessage = message;

    const url = new URL(request.url);

    const rawFirmId =
      normalizeFirmId(body?.firm_id) ??
      normalizeFirmId(url.searchParams.get("firm"));

    const source_type =
      body?.source_type != null
        ? detectSourceType(body.source_type)
        : rawFirmId
        ? "APP"
        : "WEB";

    const supabase = getSupabase();

    const resolvedFirmId =
      rawFirmId || (await resolveCompanyIdByName(supabase, cleanFirmaAdi));

    const category = detectCategory(cleanMessage);
    const priority = detectPriority(cleanMessage);

    const now = new Date();
    const slaHours = resolveSlaHours(category, priority);
    const slaDue = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

    const insertPayload = {
      full_name: cleanFullName,
      email: cleanEmail,
      firma_adi: cleanFirmaAdi,
      message: cleanMessage,
      firm_id: resolvedFirmId,
      status: "new",
      category: resolvedFirmId ? category : "Firma Eşleşmesi Bekliyor",
      priority,
      sla_due_at: slaDue.toISOString(),
      source_type,
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

    let sentCount =
      typeof data.mail_sent_count === "number" ? data.mail_sent_count : 0;

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
            <p><strong>Kaynak:</strong> ${escapeHtml(data.source_type || "-")}</p>
            <p><strong>Firma / Kurum:</strong> ${escapeHtml(String(data.firma_adi || "-"))}</p>
            <p><strong>Firma ID:</strong> ${escapeHtml(String(data.firm_id || "-"))}</p>
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

        sentCount += 1;

        await supabase
          .from("cbs_forms")
          .update({
            mail_sent_count: sentCount,
            last_mail_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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
            <p><strong>Firma / Kurum:</strong> ${escapeHtml(cleanFirmaAdi)}</p>
            <p><strong>Kategori:</strong> ${escapeHtml(String(data.category || category))}</p>
            <p><strong>Öncelik:</strong> ${escapeHtml(priority)}</p>
          `,
        });

        await supabase.from("cbs_mail_logs").insert({
          cbs_form_id: data.id,
          direction: "outbound",
          subject: "Kullanıcı bilgilendirme",
          recipient_email: cleanEmail,
          sender_email: fromEmail,
          body: `Başvurunuz alındı #${data.id}`,
          status: "sent",
        });

        sentCount += 1;

        await supabase
          .from("cbs_forms")
          .update({
            mail_sent_count: sentCount,
            last_mail_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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