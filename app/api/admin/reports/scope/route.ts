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

    const userAuth = cookieStore.get("dsec_user_auth")?.value;
    const userRole = cookieStore.get("dsec_user_role")?.value;
    const userId = cookieStore.get("dsec_user_id")?.value;

    if (!(userAuth === "ok" && userRole)) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    // ADMIN → firma seçebilir
    if (userRole === "super_admin" || userRole === "admin") {
      return NextResponse.json({
        success: true,
        role: userRole,
        can_select_company: true,
        allowed_company_id: null,
        allowed_company_name: null,
      });
    }

    // COMPANY ADMIN → firmaya sabit
    if (userRole === "company_admin") {
      if (!userId) {
        return NextResponse.json(
          { error: "Kullanıcı bilgisi yok." },
          { status: 401 }
        );
      }

      // 🔥 USER ÇEK
      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id, company_id")
        .eq("id", userId)
        .maybeSingle();

      if (userError || !userRow) {
        return NextResponse.json(
          { error: "Kullanıcı bulunamadı." },
          { status: 500 }
        );
      }

      const companyId = userRow.company_id;

      if (!companyId) {
        return NextResponse.json(
          { error: "Firma atanmamış." },
          { status: 403 }
        );
      }

      // 🔥 COMPANY AYRI ÇEK (join yok!)
      const { data: companyRow } = await supabase
        .from("companies")
        .select("name")
        .eq("id", companyId)
        .maybeSingle();

      return NextResponse.json({
        success: true,
        role: userRole,
        can_select_company: false,
        allowed_company_id: companyId,
        allowed_company_name: companyRow?.name || null,
      });
    }

    return NextResponse.json(
      { error: "Bu rol erişemez." },
      { status: 403 }
    );
  } catch (error) {
    console.error("scope error:", error);
    return NextResponse.json(
      { error: "Sunucu hatası." },
      { status: 500 }
    );
  }
}