import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase yapılandırması eksik.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

type ParsedMail = {
  fromEmail: string;
  fromName: string;
  subject: string;
  text: string;
  html: string;
  messageId: string;
};

function normalizeText(value: unknown) {
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

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function parseFromHeader(raw: string) {
  const value = normalizeText(raw);

  const angleMatch = value.match(/^(.*)<([^>]+)>$/);
  if (angleMatch) {
    return {
      fromName: angleMatch[1].replace(/"/g, "").trim(),
      fromEmail: angleMatch[2].trim().toLowerCase(),
    };
  }

  return {
    fromName: "",
    fromEmail: value.toLowerCase(),
  };
}

function findField(text: string, labels: string[]) {
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const clean = line.trim();
    if (!clean) continue;

    const idx = clean.indexOf(":");
    if (idx <= 0) continue;

    const rawKey = clean.slice(0, idx).trim();
    const rawValue = clean.slice(idx + 1).trim();
    const key = normalizeKey(rawKey);

    if (labels.some((x) => key === normalizeKey(x))) {
      return rawValue;
    }
  }

  return "";
}

function parseFirmCode(subject: string, text: string) {
  const sources = [subject, text];

  for (const source of sources) {
    const m1 = source.match(/\[FIRMA_KODU:\s*([A-Z0-9\-_]+)\s*]/i);
    if (m1?.[1]) return m1[1].trim().toUpperCase();

    const m2 = source.match(/Firma\s*Kodu\s*:\s*([A-Z0-9\-_]+)/i);
    if (m2?.[1]) return m2[1].trim().toUpperCase();

    const m3 = source.match(/Firma\s*Kod\s*:\s*([A-Z0-9\-_]+)/i);
    if (m3?.[1]) return m3[1].trim().toUpperCase();
  }

  return "";
}

function parseFirmName(subject: string, text: string) {
  const direct =
    findField(text, ["Firma Adı", "Firma", "Firma Unvanı"]) ||
    findField(subject, ["Firma Adı", "Firma", "Firma Unvanı"]);

  if (direct) return direct.trim();

  const bracket = subject.match(/\[FIRMA:\s*([^\]]+)]/i);
  if (bracket?.[1]) return bracket[1].trim();

  return "";
}

function parseCategory(text: string, subject: string) {
  const explicit = findField(text, ["Bildirim Türü", "Bildirim Turu", "Tür", "Tur"]);
  const source = `${explicit} ${subject} ${text}`.toLocaleLowerCase("tr-TR");

  if (source.includes("şikayet") || source.includes("sikayet")) return "Şikayet";
  if (source.includes("öneri") || source.includes("oneri")) return "Öneri";
  if (source.includes("talep")) return "Talep";
  if (source.includes("ramak kala")) return "Ramak Kala";
  if (source.includes("iş güvenliği") || source.includes("isg")) return "İSG";

  return "Genel";
}

function detectPriority(message: string, subject: string) {
  const text = `${subject} ${message}`.toLocaleLowerCase("tr-TR");

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
    text.includes("iş güvenliği") ||
    text.includes("isg")
  ) {
    return "high";
  }

  if (text.includes("öneri") || text.includes("oneri")) {
    return "low";
  }

  return "normal";
}

function resolveSlaHours(category: string, priority: string) {
  if (priority === "critical") return 4;
  if (priority === "high") return 8;

  if (category === "İSG" || category === "Ramak Kala") return 8;
  if (category === "Öneri") return 48;

  return 24;
}

function buildMessageBody(text: string, html: string) {
  const content = normalizeText(text) || stripHtml(normalizeText(html));
  return content.trim();
}

async function resolveFirmId(
  supabase: ReturnType<typeof getSupabase>,
  firmCode: string,
  firmName: string
): Promise<string | null> {
   if (firmName) {
    const normalizedTarget = normalizeFirmName(firmName);

    const { data, error } = await supabase
      .from("companies")
      .select("id, name")
      .limit(500);

    if (!error && data?.length) {
      const exact = data.find((item) => {
        return normalizeFirmName(String(item.name || "")) === normalizedTarget;
      });

      if (exact?.id) return String(exact.id);

      const includes = data.find((item) => {
        const dbName = normalizeFirmName(String(item.name || ""));
        return dbName.includes(normalizedTarget) || normalizedTarget.includes(dbName);
      });

      if (includes?.id) return String(includes.id);
    }
  }

  return null;
}

async function logMail(
  supabase: ReturnType<typeof getSupabase>,
  payload: Record<string, unknown>
) {
  try {
    await supabase.from("cbs_mail_logs").insert(payload);
  } catch (error) {
    console.error("cbs_mail_logs insert hatası:", error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fromRaw =
      body?.from ||
      body?.sender ||
      body?.envelope?.from ||
      "";

    const subject = normalizeText(body?.subject);
    const text = normalizeText(body?.text || body?.textBody || body?.plain);
    const html = normalizeText(body?.html || body?.htmlBody);
    const messageId =
      normalizeText(body?.messageId || body?.message_id || body?.headers?.["message-id"]) ||
      `mail-${Date.now()}`;

    const { fromEmail, fromName } = parseFromHeader(String(fromRaw || ""));

    const parsed: ParsedMail = {
      fromEmail,
      fromName,
      subject,
      text,
      html,
      messageId,
    };

    if (!parsed.fromEmail) {
      return NextResponse.json(
        { error: "Gönderen e-posta bilgisi bulunamadı." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const existing = await supabase
      .from("cbs_forms")
      .select("id")
      .eq("mail_message_id", parsed.messageId)
      .limit(1)
      .maybeSingle();

    if (!existing.error && existing.data?.id) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Bu mail daha önce işlendi.",
        id: existing.data.id,
      });
    }

    const contentText = buildMessageBody(parsed.text, parsed.html);

    const firmCode = parseFirmCode(parsed.subject, contentText);
    const firmName = parseFirmName(parsed.subject, contentText);
    const firmId = await resolveFirmId(supabase, firmCode, firmName);

    const category = parseCategory(contentText, parsed.subject);
    const priority = detectPriority(contentText, parsed.subject);

    const extractedFullName =
      findField(contentText, ["Ad Soyad", "Adı Soyadı", "İsim Soyisim", "Ad Soyisim"]) ||
      parsed.fromName ||
      "Mail Kullanıcısı";

    const extractedEmail =
      findField(contentText, ["E-Posta", "Email", "Eposta"]) ||
      parsed.fromEmail;

    const title =
      findField(contentText, ["Konu", "Başlık", "Baslik"]) ||
      parsed.subject ||
      "Mail ile gelen ÇBS kaydı";

    const now = new Date();
    const slaHours = resolveSlaHours(category, priority);
    const slaDue = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

    const finalCategory = firmId ? category : "Firma Eşleşmesi Bekliyor";

    const insertPayload = {
      full_name: extractedFullName,
      email: extractedEmail,
      message: contentText || parsed.subject || "Mail içeriği alınamadı.",
      firm_id: firmId,
      status: "new",
      category: finalCategory,
      priority,
      sla_due_at: slaDue.toISOString(),
      source_type: "EMAIL",
      mail_sent_count: 0,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      opened_by_email: parsed.fromEmail,
      mail_subject: parsed.subject,
      mail_message_id: parsed.messageId,
      resolution_note: null,
      assigned_to: null,
      closed_at: null,
      title,
    };

    const { data, error } = await supabase
      .from("cbs_forms")
      .insert([insertPayload])
      .select("*")
      .single();

    if (error || !data) {
      console.error("Inbound mail -> CBS kayıt hatası:", error);

      await logMail(supabase, {
        cbs_form_id: null,
        direction: "inbound",
        subject: parsed.subject || "Inbound mail",
        recipient_email: "cbs@dsec360.com",
        sender_email: parsed.fromEmail,
        body: contentText,
        status: "failed",
        error_message: error?.message || "Kayıt oluşturulamadı",
      });

     return NextResponse.json(
  {
    error: "Mail işlenemedi.",
    detail: error?.message,
    hint: error?.hint,
    code: error?.code
  },
  { status: 500 }
);
    }

    await logMail(supabase, {
      cbs_form_id: data.id,
      direction: "inbound",
      subject: parsed.subject || "Inbound mail",
      recipient_email: "cbs@dsec360.com",
      sender_email: parsed.fromEmail,
      body: contentText,
      status: firmId ? "matched" : "unmatched",
      error_message: firmId
        ? null
        : `Firma eşleşemedi. Firma Kodu: ${firmCode || "-"} | Firma Adı: ${firmName || "-"}`,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        firm_id: data.firm_id,
        firm_matched: Boolean(firmId),
        firm_code: firmCode || null,
        firm_name: firmName || null,
        source_type: "EMAIL",
      },
    });
  } catch (error) {
    console.error("Inbound mail genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}

