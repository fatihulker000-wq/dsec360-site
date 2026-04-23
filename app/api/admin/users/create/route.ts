import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function checkAdmin() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("dsec_admin_auth")?.value;
  const role = cookieStore.get("dsec_admin_role")?.value;

  return auth === "ok" && role === "super_admin";
}

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();

    const full_name = String(body?.full_name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "").trim();
    const role = String(body?.role || "").trim();
    const company_id = String(body?.company_id || "").trim();
    const is_active = Boolean(body?.is_active);

    if (!full_name) {
      return NextResponse.json({ error: "Ad soyad zorunlu." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email zorunlu." }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Şifre zorunlu." }, { status: 400 });
    }

    const allowedRoles = ["operator", "company_admin", "super_admin", "training_user"];

    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
    }
    if (role === "training_user" && !company_id) {
  return NextResponse.json(
    { error: "Eğitim katılımcısı için firma zorunludur." },
    { status: 400 }
  );
}

    const supabase = getSupabase();

    const { data: existingUser, error: existingError } = await supabase
      .from("users")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existingError) {
      console.error("create user existing check error:", existingError);
      return NextResponse.json(
        { error: "Kullanıcı kontrolü yapılamadı." },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email ile kayıtlı kullanıcı zaten var." },
        { status: 400 }
      );
    }

    const password_hash = sha256(password);

    const { data: insertedUser, error: insertError } = await supabase
      .from("users")
      .insert({
        full_name,
        email,
        password_hash,
        role,
        company_id: company_id || null,
        is_active,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("create user insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      userId: insertedUser?.id || null,
    });
  } catch (error) {
    console.error("create user general error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}