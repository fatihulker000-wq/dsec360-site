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

function isAuthorized(req: Request) {
  const expectedKey = (process.env.CBS_MOBILE_SYNC_KEY || "").trim();
  const incomingKey = (req.headers.get("X-DSEC-SYNC-KEY") || "").trim();

  if (expectedKey.length > 0) {
    return incomingKey === expectedKey;
  }

  return true;
}

function unauthorized() {
  return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
}

export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) return unauthorized();

    const url = new URL(req.url);
    const firmIdParam = String(url.searchParams.get("firmId") || "").trim();

    const supabase = getSupabase();

    let query = supabase
      .from("cbs_forms")
      .select(`
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
        resolution_note,
        firma_adi,
        priority,
        sla_due_at,
        closed_at
      `)
      .order("created_at", { ascending: false });

    if (firmIdParam) {
      query = query.eq("firm_id", firmIdParam);
    }

    const { data, error } = await query;

    if (error) {
      console.error("mobile-sync GET supabase hata:", error);
      return NextResponse.json(
        { error: "Kayıtlar alınamadı." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (e) {
    console.error("mobile-sync GET hata:", e);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) return unauthorized();

    const body = await req.json();

    const full_name = String(body?.full_name || "").trim();
    const email = String(body?.email || "").trim();
    const message = String(body?.message || "").trim();

    // ✅ APP artık web firması için UUID/string remoteId gönderiyor
    const firm_id = String(body?.firm_id || "").trim();

    const category = String(body?.category || "").trim() || "Şikayet";
    const priority = String(body?.priority || "").trim() || "normal";
    const assigned_to = String(body?.assigned_to || "").trim() || null;
    const resolution_note = String(body?.resolution_note || "").trim() || null;
    const status = String(body?.status || "").trim() || "new";
    const firma_adi = String(body?.firma_adi || "").trim() || null;

    if (!full_name || !message || !firm_id) {
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
      firm_id, // ✅ UUID/string olarak direkt yaz
      category,
      priority,
      assigned_to,
      resolution_note,
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