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
    const companyIdFromCookie = String(cookieStore.get("dsec_company_id")?.value || "").trim();
    const isDemoCookie = String(cookieStore.get("dsec_is_demo")?.value || "").trim() === "true";

    if (
      adminAuth !== "ok" ||
      !userId ||
      (adminRole !== "super_admin" &&
        adminRole !== "company_admin" &&
        adminRole !== "demo_user")
    ) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim." },
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
        { success: false, error: "Kullanıcı bilgileri okunamadı." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı bulunamadı." },
        { status: 404 }
      );
    }

    if (data.is_active === false) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı pasif durumda." },
        { status: 403 }
      );
    }

    const dbRole = String(data.role || "").trim();

    if (dbRole !== adminRole) {
      return NextResponse.json(
        { success: false, error: "Oturum rolü ile kullanıcı rolü uyuşmuyor." },
        { status: 403 }
      );
    }

    const companyId = String(data.company_id || companyIdFromCookie || "").trim();
    const isDemo = dbRole === "demo_user" || isDemoCookie;

    if ((adminRole === "company_admin" || adminRole === "demo_user") && !companyId) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı için firma bilgisi bulunamadı." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: String(data.id || "").trim(),
        full_name: String(data.full_name || "").trim(),
        email: String(data.email || "").trim().toLowerCase(),
        role: adminRole as "super_admin" | "company_admin" | "demo_user",
        company_id: companyId,
        is_super_admin: adminRole === "super_admin",
        is_company_admin: adminRole === "company_admin",
        is_demo: isDemo,
      },
    });
  } catch (error) {
    console.error("admin/me genel hata:", error);
    return NextResponse.json(
      { success: false, error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}