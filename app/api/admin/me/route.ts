import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase yapılandırması eksik.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

export async function GET() {
  try {
    const cookieStore = await cookies();

    const adminAuth = String(cookieStore.get("dsec_admin_auth")?.value || "").trim();
    const adminRole = String(cookieStore.get("dsec_admin_role")?.value || "").trim();
    const userId = String(cookieStore.get("dsec_user_id")?.value || "").trim();

    if (
      adminAuth !== "ok" ||
      !userId ||
      (adminRole !== "super_admin" && adminRole !== "company_admin")
    ) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, company_id, is_active")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("admin/me kullanıcı sorgu hatası:", error);
      return NextResponse.json(
        { error: "Kullanıcı bilgileri okunamadı." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    if (data.is_active === false) {
      return NextResponse.json(
        { error: "Kullanıcı pasif durumda." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: String(data.id || "").trim(),
        full_name: String(data.full_name || ""),
        email: String(data.email || "").trim().toLowerCase(),
        role: String(data.role || "").trim(),
        company_id: String(data.company_id || "").trim(),
      },
    });
  } catch (error) {
    console.error("admin/me genel hata:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}