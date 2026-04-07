import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  console.log("🔥 ADMIN LOGIN API CALISTI");

  try {
    const body = await request.json();
    const password = String(body?.password ?? "").trim();

    if (!password) {
      return NextResponse.json(
        { error: "Şifre gerekli." },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Supabase bağlantı bilgileri tanımlı değil." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: adminUser, error } = await supabase
      .from("users")
      .select("id, full_name, email, password, role")
      .eq("email", "admin@dsec360.com")
      .eq("role", "super_admin")
      .maybeSingle();

    console.log("OKUNAN EMAIL:", adminUser?.email);
    console.log("DB ŞIFRE:", adminUser?.password);
    console.log("GELEN ŞIFRE:", password);

    if (error) {
      console.error("Admin kullanıcı sorgu hatası:", error);
      return NextResponse.json(
        { error: "Admin kullanıcı okunamadı." },
        { status: 500 }
      );
    }

    if (!adminUser) {
      return NextResponse.json(
        { error: "Admin kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    const dbPassword = String(adminUser.password ?? "").trim();

    if (!dbPassword) {
      return NextResponse.json(
        { error: "Admin kullanıcısında şifre tanımlı değil." },
        { status: 500 }
      );
    }

    if (password !== dbPassword) {
      return NextResponse.json(
        { error: "Hatalı şifre." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      role: adminUser.role,
      user: {
        id: String(adminUser.id),
        full_name: String(adminUser.full_name ?? "Admin Kullanıcı"),
        email: String(adminUser.email ?? "admin@dsec360.com"),
      },
    });

    response.cookies.set("dsec_admin_auth", "ok", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    response.cookies.set("dsec_user_auth", "ok", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    response.cookies.set("dsec_user_role", String(adminUser.role), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    response.cookies.set("dsec_user_id", String(adminUser.id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    console.error("Admin login hatası:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}