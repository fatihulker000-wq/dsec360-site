import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const FALLBACK_SYNC_KEY = "dsec_mobile_123456";

function db() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase yapılandırması eksik.");
  return createClient(url, key);
}

function authorized(req: Request) {
  const incoming = (req.headers.get("x-dsec-sync-key") || "").trim();
  const envKey = (process.env.CBS_MOBILE_SYNC_KEY || "").trim();
  return incoming.length > 0 &&
    (incoming === FALLBACK_SYNC_KEY || (envKey && incoming === envKey));
}

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function deny() {
  return NextResponse.json(
    { success: false, error: "Yetkisiz." },
    { status: 401 }
  );
}

async function requireFirm(
  client: ReturnType<typeof db>,
  firmIdRaw: unknown
): Promise<string> {
  const firmId = clean(firmIdRaw);

  if (!isUuid(firmId)) {
    throw new Error("Geçerli firma UUID zorunlu.");
  }

  const { data, error } = await client
    .from("companies")
    .select("id")
    .eq("id", firmId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) throw new Error("Firma bulunamadı.");

  return clean(data.id);
}

export async function GET(req: Request) {
  try {
    if (!authorized(req)) return deny();

    const u = new URL(req.url);
    const client = db();
    const firmId = await requireFirm(client, u.searchParams.get("firmId"));

    const { data, error } = await client
      .from("cbs_forms")
      .select("*")
      .eq("firm_id", firmId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      firmId,
      count: (data || []).length,
      data: data || [],
    });
  } catch (e: any) {
    console.error("CBS mobile GET", e);
    const message = e?.message || "Sunucu hatası.";
    const status =
      message.includes("UUID zorunlu") || message.includes("Firma bulunamadı")
        ? 400
        : 500;

    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!authorized(req)) return deny();

    const body = await req.json();
    const client = db();
    const firmId = await requireFirm(client, body?.firm_id);

    const full_name = clean(body?.full_name);
    const message = clean(body?.message);

    if (!full_name || !message) {
      return NextResponse.json(
        { success: false, error: "full_name ve message zorunlu." },
        { status: 400 }
      );
    }

    const payload: any = {
      full_name,
      email: clean(body?.email) || null,
      message,
      firm_id: firmId,
      firma_adi: clean(body?.firma_adi) || null,
      category: clean(body?.category) || "Genel",
      priority: clean(body?.priority) || "normal",
      assigned_to: clean(body?.assigned_to) || null,
      assigned_username: clean(body?.assigned_username) || null,
      assigned_role: clean(body?.assigned_role) || null,
      target_role: clean(body?.target_role) || null,
      resolution_note: clean(body?.resolution_note) || null,
      response_note: clean(body?.response_note) || null,
      rejected_reason: clean(body?.rejected_reason) || null,
      opened_by_email: clean(body?.opened_by_email) || null,
      mail_subject: clean(body?.mail_subject) || null,
      mail_message_id: clean(body?.mail_message_id) || null,
      first_receiver_username: clean(body?.first_receiver_username) || null,
      forwarded_by: clean(body?.forwarded_by) || null,
      created_by: clean(body?.created_by) || null,
      status: clean(body?.status) || "new",
      source_type: "APP",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from("cbs_forms")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      firmId,
      remoteId: data.id,
    });
  } catch (e: any) {
    console.error("CBS mobile POST", e);
    const message = e?.message || "Sunucu hatası.";
    const status =
      message.includes("UUID zorunlu") || message.includes("Firma bulunamadı")
        ? 400
        : 500;

    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}

export async function PUT(req: Request) {
  try {
    if (!authorized(req)) return deny();

    const body = await req.json();
    const id = Number(body?.id);
    const client = db();
    const firmId = await requireFirm(client, body?.firm_id);

    if (!id || id <= 0) {
      return NextResponse.json(
        { success: false, error: "Geçerli kayıt id zorunlu." },
        { status: 400 }
      );
    }

    const update: any = {
      updated_at: new Date().toISOString(),
    };

    for (const k of [
      "status",
      "category",
      "priority",
      "assigned_to",
      "assigned_username",
      "assigned_role",
      "target_role",
      "resolution_note",
      "response_note",
      "rejected_reason",
      "opened_by_email",
      "mail_subject",
      "mail_message_id",
      "first_receiver_username",
      "forwarded_by",
      "created_by",
      "message",
      "full_name",
      "email",
      "firma_adi",
    ]) {
      if (body?.[k] !== undefined) {
        update[k] = clean(body[k]) || null;
      }
    }

    if (body?.closed_at !== undefined) {
      update.closed_at = clean(body.closed_at) || null;
    } else if (body?.status !== undefined) {
      update.closed_at =
        clean(body.status).toLowerCase() === "closed"
          ? new Date().toISOString()
          : null;
    }

    const { data, error } = await client
      .from("cbs_forms")
      .update(update)
      .eq("id", id)
      .eq("firm_id", firmId)
      .select("id")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Bu firmaya ait kayıt bulunamadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, firmId });
  } catch (e: any) {
    console.error("CBS mobile PUT", e);
    const message = e?.message || "Sunucu hatası.";
    const status =
      message.includes("UUID zorunlu") || message.includes("Firma bulunamadı")
        ? 400
        : 500;

    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
