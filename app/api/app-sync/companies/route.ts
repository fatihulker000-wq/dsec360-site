import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function checkAppAuth(req: NextRequest) {
  const key = req.headers.get("x-app-key");
  return key === "DSEC_APP_2026";
}

function normalizeCompanyName(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("tr-TR");
}
function normalizeRemoteId(value: unknown) {
  return String(value ?? "").trim();
}

function buildCompanyPayload(body: any, rawName: string) {
  return {
    name: rawName,
    yetkili: body?.yetkili ?? null,
    phone: body?.phone ?? null,
    email: body?.email ?? null,
    address: body?.address ?? null,
    is_active: typeof body?.is_active === "boolean" ? body.is_active : true,

    sgk_sicil_no: body?.sgk_sicil_no ?? null,
    nace_kodu: body?.nace_kodu ?? null,
    tehlike_sinifi: body?.tehlike_sinifi ?? null,
    calisan_sayisi:
      typeof body?.calisan_sayisi === "number" ? body.calisan_sayisi : 0,
    sektor: body?.sektor ?? null,
    isg_uzmani: body?.isg_uzmani ?? null,
    isyeri_hekimi: body?.isyeri_hekimi ?? null,
    dsp: body?.dsp ?? null,
  };
}

// ======================
// GET → App firmaları çeker
// ======================
export async function GET(req: NextRequest) {
  if (!checkAppAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// ======================
// POST → App yeni firma ekler
// Aynı isim varsa duplicate açmaz, mevcut kaydı günceller
// ======================
export async function POST(req: NextRequest) {
  if (!checkAppAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const supabase = getSupabase();

  const rawName = String(body?.name ?? "").trim();

  if (!rawName) {
    return NextResponse.json({ error: "Firma adı zorunlu." }, { status: 400 });
  }

  const normalizedName = normalizeCompanyName(rawName);

  const remoteId = normalizeRemoteId(body?.id || body?.remote_id);

  const { data: existingRows, error: findError } = await supabase
    .from("companies")
.select("id, name")
.order("created_at", { ascending: true });

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  const existing = (existingRows || []).find((item: any) => {
  const rowId = normalizeRemoteId(item?.id);
  const rowName = normalizeCompanyName(item?.name);

  if (remoteId && rowId === remoteId) return true;
  return rowName === normalizedName;
});

  const payload = buildCompanyPayload(body, rawName);

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("companies")
      .update(payload)
      .eq("id", existing.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mode: "updated_existing",
      id: existing.id,
    });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("companies")
    .insert(payload)
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    mode: "inserted",
    id: inserted?.id ?? null,
  });
}

// ======================
// PUT → App günceller
// ======================
export async function PUT(req: NextRequest) {
  if (!checkAppAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const supabase = getSupabase();

  const id = normalizeRemoteId(body?.id);
  const remoteId = normalizeRemoteId(body?.remote_id);
  const rawName = String(body?.name ?? "").trim();

  if (!rawName) {
    return NextResponse.json({ error: "Firma adı zorunlu." }, { status: 400 });
  }

  const normalizedName = normalizeCompanyName(rawName);
  const payload = buildCompanyPayload(body, rawName);

  let targetId = id || remoteId;

  if (!targetId) {
    const { data: existingRows, error: findError } = await supabase
      .from("companies")
      .select("id, name")
      .order("created_at", { ascending: true });

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    const existing = (existingRows || []).find((item: any) => {
      const rowId = normalizeRemoteId(item?.id);
      const rowName = normalizeCompanyName(item?.name);

      if (remoteId && rowId === remoteId) return true;
      return rowName === normalizedName;
    });

    if (existing?.id) {
      targetId = String(existing.id).trim();
    }
  }

  if (!targetId) {
    const { data: inserted, error: insertError } = await supabase
      .from("companies")
      .insert(payload)
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mode: "inserted_from_put",
      id: inserted?.id ?? null,
    });
  }

  const { error } = await supabase
    .from("companies")
    .update(payload)
    .eq("id", targetId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, mode: "updated", id: targetId });
}