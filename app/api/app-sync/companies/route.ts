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

  const { data: existingRows, error: findError } = await supabase
    .from("companies")
    .select("id, name")
    .order("created_at", { ascending: true });

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  const existing = (existingRows || []).find(
    (item) => normalizeCompanyName(item.name) === normalizedName
  );

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

  const id = String(body?.id ?? "").trim();
  const rawName = String(body?.name ?? "").trim();

  if (!id) {
    return NextResponse.json({ error: "Firma id zorunlu." }, { status: 400 });
  }

  if (!rawName) {
    return NextResponse.json({ error: "Firma adı zorunlu." }, { status: 400 });
  }

  const payload = buildCompanyPayload(body, rawName);

  const { error } = await supabase
    .from("companies")
    .update(payload)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, mode: "updated", id });
}