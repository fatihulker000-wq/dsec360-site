import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function unauthorized() {
  return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
}

export async function GET() {
  try {
    const cookieStore = await cookies();

    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
    const adminRole = String(
      cookieStore.get("dsec_admin_role")?.value || ""
    ).trim();
    const companyId = String(
      cookieStore.get("dsec_company_id")?.value || ""
    ).trim();

    if (adminAuth !== "ok") return unauthorized();

    const supabase = getSupabase();

    let query = supabase
      .from("employees")
      .select("*")
      .order("full_name", { ascending: true });

    // 🔴 Firma admin sadece kendi firmasını görür
    if (adminRole === "company_admin") {
      if (!companyId) return unauthorized();
      query = query.eq("firm_id", companyId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Çalışanlar alınamadı.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Sunucu hatası.", detail: e?.message || null },
      { status: 500 }
    );
  }
}