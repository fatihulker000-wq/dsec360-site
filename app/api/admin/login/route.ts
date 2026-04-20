import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

type LoginUserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  password_hash: string | null;
  role: string | null;
  company_id: string | null;
  is_active: boolean | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body?.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body?.password ?? "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email ve şifre gerekli." },
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
      .select("id, full_name, email, password_hash, role, company_id, is_active")
      .ilike("email", email)
      .in("role", ["super_admin", "company_admin"])
      .maybeSingle<LoginUserRow>();

    if (error) {
      console.error("Admin kullanıcı sorgu hatası:", error);
      return NextResponse.json(
        { error: "Kullanıcı bilgisi okunamadı." },
        { status: 500 }
      );
    }

    if (!adminUser) {
      return NextResponse.json(
        { error: "Yetkili kullanıcı bulunamadı." },
        { status: 401 }
      );
    }

    if (!adminUser.is_active) {
      return NextResponse.json(
        { error: "Kullanıcı pasif durumda." },
        { status: 403 }
      );
    }

    const dbPassword = String(adminUser.password_hash ?? "").trim();

    if (!dbPassword) {
      return NextResponse.json(
        { error: "Kullanıcı şifresi sistemde tanımlı değil." },
        { status: 500 }
      );
    }

    if (sha256(password) !== dbPassword) {
      return NextResponse.json(
        { error: "Hatalı şifre." },
        { status: 401 }
      );
    }

    const secure = process.env.NODE_ENV === "production";
    const cookieDomain =
      process.env.NODE_ENV === "production" ? ".dsec360.com" : undefined;

    const roleValue = String(adminUser.role ?? "").trim();
    const userId = String(adminUser.id);
    const userEmail = String(adminUser.email ?? email).trim().toLowerCase();
    const companyId = String(adminUser.company_id ?? "").trim();

    const response = NextResponse.json({
      success: true,
      role: roleValue,
      user: {
        id: userId,
        full_name: String(adminUser.full_name ?? "Kullanıcı"),
        email: userEmail,
        company_id: companyId || null,
      },
    });

    response.cookies.set("dsec_admin_auth", "ok", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      domain: cookieDomain,
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    response.cookies.set("dsec_admin_role", roleValue, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      domain: cookieDomain,
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    response.cookies.set("dsec_user_auth", "ok", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      domain: cookieDomain,
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    response.cookies.set("dsec_user_role", roleValue, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      domain: cookieDomain,
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    response.cookies.set("dsec_user_id", userId, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      domain: cookieDomain,
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    response.cookies.set("dsec_user_email", userEmail, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      domain: cookieDomain,
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    response.cookies.set("dsec_company_id", companyId || "", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      domain: cookieDomain,
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