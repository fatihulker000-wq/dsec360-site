import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function cleanFirmName(name?: string | null) {
  const v = String(name || "").trim();
  if (!v) return "Firma Yok";
  if (v.toLowerCase() === "firma") return "Firma Yok";
  return v;
}

function getInspectionDate(row: any) {
  return (
    row.audit_date_millis ||
    row.created_at_millis ||
    row.inserted_at ||
    row.created_at ||
    new Date().toISOString()
  );
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
    const adminRole = cookieStore.get("dsec_admin_role")?.value;
    const companyIdFromCookie = String(
      cookieStore.get("dsec_company_id")?.value || ""
    ).trim();

    const isAllowedRole =
      adminRole === "super_admin" || adminRole === "company_admin";

    if (adminAuth !== "ok" || !isAllowedRole) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const supabase = getSupabase();

    let query = supabase
      .from("denetim_runs")
      .select("*")
      .order("inserted_at", { ascending: false })
      .limit(8);

    if (adminRole === "company_admin" && companyIdFromCookie) {
      query = query.eq("firm_id", companyIdFromCookie);
    }

    const { data: runs, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const firmIds = Array.from(
      new Set((runs || []).map((x: any) => String(x.firm_id || "").trim()).filter(Boolean))
    );

    let companyMap: Record<string, string> = {};

    if (firmIds.length > 0) {
      const { data: companies } = await supabase
        .from("companies")
        .select("id, name")
        .in("id", firmIds);

      companyMap = Object.fromEntries(
        (companies || []).map((c: any) => [
          String(c.id || "").trim(),
          cleanFirmName(c.name),
        ])
      );
    }

    const upcoming_inspections = (runs || []).slice(0, 5).map((row: any) => {
      const firmId = String(row.firm_id || "").trim();

      return {
        id: String(row.id),
        title: row.template_type || "Denetim",
        company: companyMap[firmId] || cleanFirmName(row.firm_name),
        due_date: getInspectionDate(row),
      };
    });

    return NextResponse.json({
      success: true,
      upcoming_inspections,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Upcoming inspections could not be loaded." },
      { status: 500 }
    );
  }
}