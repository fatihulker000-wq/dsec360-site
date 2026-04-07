import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE ENV eksik.");
  }

  return createClient(url, serviceRoleKey);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const rawEmail =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const rawPassword =
      typeof body?.password === "string" ? body.password.trim() : "";

    if (!rawEmail || !rawPassword) {
      return NextResponse.json(
        { error: "Giriş bilgileri zorunludur." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, password, role")
      .ilike("email", rawEmail)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: `Supabase hata: ${error.message}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 401 }
      );
    }

    if (typeof data.password !== "string" || data.password !== rawPassword) {
      return NextResponse.json(
        { error: "Hatalı şifre." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      role: data.role ?? "training_user",
      user: {
        id: data.id,
        email: data.email,
        full_name: data.full_name ?? "",
      },
    });

    // 🔥 CRITICAL FIX (PRODUCTION COOKIE)
    const cookieOptions = {
      httpOnly: true,
      secure: true,          // 🔥 zorunlu
      sameSite: "none" as const, // 🔥 zorunlu
      path: "/",
      maxAge: 60 * 60 * 12,
    };

    response.cookies.set("dsec_user_auth", "ok", cookieOptions);

    response.cookies.set(
      "dsec_user_role",
      String(data.role ?? "training_user"),
      cookieOptions
    );

    response.cookies.set(
      "dsec_user_id",
      String(data.id ?? ""),
      cookieOptions
    );

    return response;

  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Bilinmeyen sunucu hatası";

    return NextResponse.json(
      { error: `Sunucu hatası: ${message}` },
      { status: 500 }
    );
  }
}