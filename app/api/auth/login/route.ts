import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil.");
  }

  return createClient(url, serviceRoleKey);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const rawEmail = typeof body?.email === "string" ? body.email.trim() : "";
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
  .select("*")
  .eq("email", rawEmail)
  .maybeSingle();
  console.log("EMAIL:", rawEmail);
console.log("DATA:", data);
console.log("ERROR:", error);

    if (error) {
      console.error("Supabase kullanıcı sorgu hatası:", error);
      return NextResponse.json(
        { error: "Kullanıcı sorgusu sırasında hata oluştu." },
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

    response.cookies.set("dsec_user_auth", "ok", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    response.cookies.set("dsec_user_role", String(data.role ?? "training_user"), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    response.cookies.set("dsec_user_id", String(data.id ?? ""), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    console.error("User login route hatası:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}