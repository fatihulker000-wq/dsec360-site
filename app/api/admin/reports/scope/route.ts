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

function text(v: unknown) {
  return String(v ?? "").trim();
}

export async function GET() {
  try {
    const store = await cookies();

    const auth = text(
      store.get("dsec_admin_auth")?.value ||
        store.get("dsec_user_auth")?.value
    );

    const role = text(
      store.get("dsec_admin_role")?.value ||
        store.get("dsec_user_role")?.value
    );

    const userId = text(store.get("dsec_user_id")?.value);

    const global = role === "admin" || role === "super_admin";
    const companyRole = role === "company_admin" || role === "demo_user";

    if (auth !== "ok" || (!global && !companyRole)) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    if (global) {
      return NextResponse.json({
        success: true,
        role,
        can_select_company: true,
        can_view_all_companies: true,
        allowed_company_id: null,
        allowed_company_ids: [],
        allowed_companies: [],
      });
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı bilgisi bulunamadı." },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("role,company_id,is_active")
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı bilgisi alınamadı." },
        { status: 500 }
      );
    }

    if (
      !userRow ||
      userRow.is_active === false ||
      text(userRow.role) !== role
    ) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı yetkisi doğrulanamadı." },
        { status: 403 }
      );
    }

    const ids = new Set<string>();

    const direct = text(userRow.company_id);
    if (direct && direct !== "ALL") ids.add(direct);

    const { data: accesses, error: accessError } = await supabase
      .from("user_firm_access")
      .select("firm_id")
      .eq("user_id", userId);

    if (accessError) {
      return NextResponse.json(
        { success: false, error: "Firma erişim yetkileri alınamadı." },
        { status: 500 }
      );
    }

    for (const row of accesses ?? []) {
      const id = text(row?.firm_id);
      if (id && id !== "ALL") ids.add(id);
    }

    const allowedIds = [...ids];

    if (!allowedIds.length) {
      return NextResponse.json(
        { success: false, error: "Firma atanmamış." },
        { status: 403 }
      );
    }

    const { data: companyRows, error: companyError } = await supabase
      .from("companies")
      .select("id,name,is_active")
      .in("id", allowedIds)
      .eq("is_active", true);

    if (companyError) {
      return NextResponse.json(
        { success: false, error: "Firma bilgileri alınamadı." },
        { status: 500 }
      );
    }

    const allowedCompanies = (companyRows ?? []).map((x: any) => ({
      id: String(x.id),
      name: String(x.name || ""),
    }));

    return NextResponse.json({
      success: true,
      role,
      can_select_company: allowedCompanies.length > 1,
      can_view_all_companies: false,
      allowed_company_id:
        allowedCompanies.length === 1 ? allowedCompanies[0].id : null,
      allowed_company_ids: allowedCompanies.map((x: any) => x.id),
      allowed_companies: allowedCompanies,
    });
  } catch (e) {
    console.error("reports scope error:", e);
    return NextResponse.json(
      { success: false, error: "Rapor yetki bilgisi alınamadı." },
      { status: 500 }
    );
  }
}
