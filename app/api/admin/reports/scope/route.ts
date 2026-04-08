import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
    const adminRole = cookieStore.get("dsec_admin_role")?.value;
    const userId = cookieStore.get("dsec_user_id")?.value;

    if (adminAuth !== "ok") {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    if (adminRole === "super_admin" || adminRole === "admin") {
      return NextResponse.json({
        success: true,
        role: adminRole,
        can_select_company: true,
        allowed_company_id: null,
        allowed_company_name: null,
      });
    }

    if (adminRole === "company_admin") {
      if (!userId) {
        return NextResponse.json(
          { error: "Kullanıcı bilgisi bulunamadı." },
          { status: 401 }
        );
      }

      const supabase = getSupabase();

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id, company_id, companies(name)")
        .eq("id", userId)
        .maybeSingle();

      if (userError || !userRow) {
        return NextResponse.json(
          { error: "Kullanıcı firma bilgisi alınamadı." },
          { status: 500 }
        );
      }

      const companyId = String((userRow as { company_id?: string | null }).company_id || "").trim();

      if (!companyId) {
        return NextResponse.json(
          { error: "Bu kullanıcıya bağlı firma bulunamadı." },
          { status: 403 }
        );
      }

      const companyName =
        (
          userRow as {
            companies?: { name?: string | null } | null;
          }
        ).companies?.name || null;

      return NextResponse.json({
        success: true,
        role: adminRole,
        can_select_company: false,
        allowed_company_id: companyId,
        allowed_company_name: companyName ? String(companyName).trim() : null,
      });
    }

    return NextResponse.json(
      { error: "Bu rol raporlara erişemez." },
      { status: 403 }
    );
  } catch (error) {
    console.error("reports scope error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
