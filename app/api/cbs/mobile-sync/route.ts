import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FALLBACK_SYNC_KEY = "dsec_mobile_123456";

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase yapılandırması eksik.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

function isAuthorized(req: Request): boolean {
  const serverKey = (
    process.env.CBS_MOBILE_SYNC_KEY || FALLBACK_SYNC_KEY
  ).trim();

  const requestKey = (
    req.headers.get("x-dsec-sync-key") ||
    req.headers.get("X-DSEC-SYNC-KEY") ||
    ""
  ).trim();

  return requestKey === serverKey;
}

function unauthorized() {
  return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
}

const SELECT_FIELDS = `
  id,
  full_name,
  email,
  message,
  created_at,
  updated_at,
  status,
  category,
  firm_id,
  assigned_to,
  assigned_username,
  assigned_role,
  target_role,
  resolution_note,
  response_note,
  rejected_reason,
  opened_by_email,
  mail_subject,
  mail_message_id,
  first_receiver_username,
  forwarded_by,
  created_by,
  firma_adi,
  priority,
  sla_due_at,
  closed_at
`;

function normalizeFirmName(value: string) {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("tr-TR");
}

export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) return unauthorized();
// if (!isAuthorized(req)) return unauthorized();

    const url = new URL(req.url);
    const firmIdParam = String(url.searchParams.get("firmId") || "").trim();
    const firmaAdiParam = String(url.searchParams.get("firmaAdi") || "").trim();
    const normalizedFirmaAdi = normalizeFirmName(firmaAdiParam);

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("cbs_forms")
      .select(SELECT_FIELDS)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("mobile-sync GET hata:", error);
      return NextResponse.json(
        { error: "Kayıtlar alınamadı." },
        { status: 500 }
      );
    }

    const filtered = (data || []).filter((row: any) => {
      const rowFirmId = String(row?.firm_id || "").trim();
      const rowFirmaAdi = normalizeFirmName(String(row?.firma_adi || ""));

      if (!firmIdParam && !normalizedFirmaAdi) return true;

    const byFirmId = firmIdParam.length > 0 ? rowFirmId === firmIdParam : false;
const byFirmaAdi =
  normalizedFirmaAdi.length > 0
    ? rowFirmaAdi.includes(normalizedFirmaAdi)
    : false;

      return byFirmId || byFirmaAdi;
    });

    return NextResponse.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (e) {
    console.error("mobile-sync GET hata:", e);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) return unauthorized();
// if (!isAuthorized(req)) return unauthorized();
    const body = await req.json();

    const full_name = String(body?.full_name || "").trim();
    const email = String(body?.email || "").trim();
    const message = String(body?.message || "").trim();
    const firm_id = String(body?.firm_id || "").trim();

    const category = String(body?.category || "").trim() || "Şikayet";
    const priority = String(body?.priority || "").trim() || "normal";
    const assigned_to = String(body?.assigned_to || "").trim() || null;
    const resolution_note = String(body?.resolution_note || "").trim() || null;
    const status = String(body?.status || "").trim() || "new";
    const firma_adi = String(body?.firma_adi || "").trim() || null;

    const assigned_username =
      String(body?.assigned_username || "").trim() || null;
    const assigned_role =
      String(body?.assigned_role || "").trim() || null;
    const target_role =
      String(body?.target_role || "").trim() || null;
    const opened_by_email =
      String(body?.opened_by_email || "").trim() || null;
    const mail_subject =
      String(body?.mail_subject || "").trim() || null;
    const mail_message_id =
      String(body?.mail_message_id || "").trim() || null;
    const first_receiver_username =
      String(body?.first_receiver_username || "").trim() || null;
    const forwarded_by =
      String(body?.forwarded_by || "").trim() || null;
    const response_note =
      String(body?.response_note || "").trim() || null;
    const rejected_reason =
      String(body?.rejected_reason || "").trim() || null;
    const created_by =
      String(body?.created_by || "").trim() || null;

   if (!full_name || !message || (!firm_id && !firma_adi)) {
  return NextResponse.json(
    { error: "Eksik alan var." },
    { status: 400 }
  );
}

    const supabase = getSupabase();
    const now = new Date().toISOString();

    const insertPayload = {
      full_name,
      email: email || null,
      message,
      firm_id: firm_id || null,
      category,
      priority,
      assigned_to,
      assigned_username,
      assigned_role,
      target_role,
      resolution_note,
      response_note,
      rejected_reason,
      opened_by_email,
      mail_subject,
      mail_message_id,
      first_receiver_username,
      forwarded_by,
      created_by,
      status,
      firma_adi,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("cbs_forms")
      .insert([insertPayload])
      .select("id")
      .single();

    if (error || !data) {
      console.error("mobile-sync POST supabase hata detayı:", {
        error,
        insertPayload,
      });

      return NextResponse.json(
        {
          error: "Kayıt oluşturulamadı.",
          detail: error?.message || error || null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, remoteId: data.id });
  } catch (e) {
    console.error("mobile-sync POST hata:", e);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!isAuthorized(req)) return unauthorized();
// if (!isAuthorized(req)) return unauthorized();

    const body = await req.json();
    const id = Number(body?.id);

    if (!id) {
      return NextResponse.json({ error: "ID zorunlu." }, { status: 400 });
    }

    const supabase = getSupabase();

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body?.status != null) {
      updatePayload.status = String(body.status).trim();
    }

    if (body?.category != null) {
      updatePayload.category = String(body.category).trim() || null;
    }

    if (body?.priority != null) {
      updatePayload.priority = String(body.priority).trim() || null;
    }

    if (body?.assigned_to != null) {
      updatePayload.assigned_to = String(body.assigned_to).trim() || null;
    }

    if (body?.resolution_note != null) {
      updatePayload.resolution_note =
        String(body.resolution_note).trim() || null;
    }

    if (body?.message != null) {
      updatePayload.message = String(body.message).trim() || null;
    }

    if (body?.full_name != null) {
      updatePayload.full_name = String(body.full_name).trim() || null;
    }

    if (body?.email != null) {
      updatePayload.email = String(body.email).trim() || null;
    }

    if (body?.assigned_username != null) {
      updatePayload.assigned_username =
        String(body.assigned_username).trim() || null;
    }

    if (body?.assigned_role != null) {
      updatePayload.assigned_role =
        String(body.assigned_role).trim() || null;
    }

    if (body?.target_role != null) {
      updatePayload.target_role =
        String(body.target_role).trim() || null;
    }

    if (body?.opened_by_email != null) {
      updatePayload.opened_by_email =
        String(body.opened_by_email).trim() || null;
    }

    if (body?.mail_subject != null) {
      updatePayload.mail_subject =
        String(body.mail_subject).trim() || null;
    }

    if (body?.mail_message_id != null) {
      updatePayload.mail_message_id =
        String(body.mail_message_id).trim() || null;
    }

    if (body?.first_receiver_username != null) {
      updatePayload.first_receiver_username =
        String(body.first_receiver_username).trim() || null;
    }

    if (body?.forwarded_by != null) {
      updatePayload.forwarded_by =
        String(body.forwarded_by).trim() || null;
    }

    if (body?.response_note != null) {
      updatePayload.response_note =
        String(body.response_note).trim() || null;
    }

    if (body?.rejected_reason != null) {
      updatePayload.rejected_reason =
        String(body.rejected_reason).trim() || null;
    }

    if (body?.created_by != null) {
      updatePayload.created_by =
        String(body.created_by).trim() || null;
    }

    if (String(body?.status || "").trim() === "closed") {
      updatePayload.closed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("cbs_forms")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      console.error("mobile-sync PUT supabase hata:", error);
      return NextResponse.json(
        { error: "Güncelleme yapılamadı." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("mobile-sync PUT hata:", e);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}