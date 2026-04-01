import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Şifre gerekli." },
        { status: 400 }
      );
    }

    const adminPassword = process.env.ADMIN_PANEL_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: "ADMIN_PANEL_PASSWORD tanımlı değil." },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: "Hatalı şifre." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      role: "super_admin",
      user: {
        id: "admin-1",
        full_name: "Admin Kullanıcı",
        email: "admin@dsec.com",
      },
    });

    // 🔥 ADMIN AUTH
    response.cookies.set("dsec_admin_auth", "ok", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    // 🔥 USER AUTH (PORTAL İÇİN ŞART)
    response.cookies.set("dsec_user_auth", "ok", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    response.cookies.set("dsec_user_role", "super_admin", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    response.cookies.set("dsec_user_id", "admin-1", {
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