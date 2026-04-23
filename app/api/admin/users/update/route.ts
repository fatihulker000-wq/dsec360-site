import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const MOBILE_API_KEY = "dsec_mobile_123";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function checkAdmin(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");

  if (apiKey === MOBILE_API_KEY) {
    return true;
  }

  const cookieStore = await cookies();
  const auth = cookieStore.get("dsec_admin_auth")?.value;
  const role = cookieStore.get("dsec_admin_role")?.value;

  return auth === "ok" && role === "super_admin";
}

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkAdmin(req);

    if (!allowed) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const body = await req.json();

    const userId = String(body?.userId || "").trim();
    const full_name = String(body?.full_name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "").trim();
    const role = String(body?.role || "").trim();
    const company_id = String(body?.company_id || "").trim();
    const is_active = Boolean(body?.is_active);

    if (!userId) {
      return NextResponse.json({ error: "userId zorunlu." }, { status: 400 });
    }

    if (!full_name) {
      return NextResponse.json({ error: "Ad soyad zorunlu." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email zorunlu." }, { status: 400 });
    }

    const allowedRoles = ["operator", "company_admin", "super_admin", "training_user"];

// 🔴 TRAINING USER = FİRMA ZORUNLU
if (role === "training_user" && !company_id) {
  return NextResponse.json(
    { error: "Eğitim kullanıcısı için firma zorunludur." },
    { status: 400 }
  );
}

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

    const { data: emailOwner, error: emailOwnerError } = await supabase
      .from("users")
      .select("id")
      .ilike("email", email)
      .neq("id", userId)
      .maybeSingle();

    if (emailOwnerError) {
      console.error("update user email check error:", emailOwnerError);
      return NextResponse.json(
        { error: "Email kontrolü yapılamadı." },
        { status: 500 }
      );
    }

    if (emailOwner) {
      return NextResponse.json(
        { error: "Bu email başka bir kullanıcıda kayıtlı." },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      full_name,
      email,
      role,
      company_id: company_id || null,
      is_active,
    };

    if (password) {
      payload.password_hash = sha256(password);
    }

    const { error: updateError } = await supabase
      .from("users")
      .update(payload)
      .eq("id", userId);

    if (updateError) {
      console.error("update user error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("update user general error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}