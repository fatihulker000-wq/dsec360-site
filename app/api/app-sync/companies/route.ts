import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// 🔐 Basit APP AUTH (sonra güçlendiririz)
function checkAppAuth(req: NextRequest) {
  const key = req.headers.get("x-app-key");
  return key === "DSEC_APP_2026"; // 👉 sonra env yaparız
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
// ======================
export async function POST(req: NextRequest) {
  if (!checkAppAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const supabase = getSupabase();

  const { error } = await supabase.from("companies").insert({
    name: body.name,
    yetkili: body.yetkili,
    phone: body.phone,
    email: body.email,
    address: body.address,
    is_active: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
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

  const { error } = await supabase
    .from("companies")
    .update({
      name: body.name,
      yetkili: body.yetkili,
      phone: body.phone,
      email: body.email,
      address: body.address,
      is_active: body.is_active,
    })
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}