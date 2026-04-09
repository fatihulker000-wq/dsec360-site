import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  console.log("🔥 AUTH LOGIN API CALISTI");

  try {
    const body = await request.json();

    const rawEmail = String(body?.email ?? "").trim().toLowerCase();
    const rawPassword = String(body?.password ?? "").trim();

    if (!rawEmail || !rawPassword) {
      return NextResponse.json(
        { error: "Email / TC / Sicil ve şifre zorunludur." },
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

    const { data: user, error } = await supabase
      .from("users")
      .select("id, full_name, email, password, role")
      .eq("email", rawEmail)
      .maybeSingle();

    console.log("OKUNAN EMAIL:", user?.email);
    console.log("DB SIFRE:", user?.password);
    console.log("GELEN SIFRE:", rawPassword);
    console.log("ROL:", user?.role);

    if (error) {
      console.error("Kullanıcı sorgu hatası:", error);
      return NextResponse.json(
        { error: "Kullanıcı bilgileri okunamadı." },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    const userEmail = String(user.email ?? "").trim().toLowerCase();
    const userRole = String(user.role ?? "").trim();
    const dbPassword = String(user.password ?? "").trim();

    if (!dbPassword) {
      return NextResponse.json(
        { error: "Kullanıcı şifresi tanımlı değil." },
        { status: 500 }
      );
    }

    if (userRole === "super_admin" && userEmail !== "admin@dsec360.com") {
      return NextResponse.json(
        { error: "Bu yönetici hesabı ile giriş izni yok." },
        { status: 403 }
      );
    }

    if (rawPassword !== dbPassword) {
      return NextResponse.json(
        { error: "Hatalı şifre." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      role: userRole,
      user: {
        id: String(user.id),
        full_name: String(user.full_name ?? ""),
        email: userEmail,
      },
    });

    const secure = process.env.NODE_ENV === "production";

    const activeCookieBase = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure,
      path: "/",
      maxAge: 60 * 60 * 12,
    };

    const clearCookieBase = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure,
      path: "/",
      expires: new Date(0),
    };

    response.cookies.set("dsec_user_auth", "ok", activeCookieBase);
    response.cookies.set("dsec_user_role", userRole, activeCookieBase);
    response.cookies.set("dsec_user_id", String(user.id ?? ""), activeCookieBase);

    if (userRole === "super_admin") {
      response.cookies.set("dsec_admin_auth", "ok", activeCookieBase);
      response.cookies.set("dsec_admin_role", userRole, activeCookieBase);
    } else {
      response.cookies.set("dsec_admin_auth", "", clearCookieBase);
      response.cookies.set("dsec_admin_role", "", clearCookieBase);
    }

    return response;
  } catch (error) {
    console.error("Auth login hatası:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}