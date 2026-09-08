import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function clean(v: unknown) { return String(v ?? "").trim(); }
function db() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET() {
  try {
    const c = await cookies();
    const userId = clean(c.get("dsec_user_id")?.value);
    const cookieCompanyId = clean(c.get("dsec_company_id")?.value);
    if (!userId) return NextResponse.json({ success: false, error: "Oturum bulunamadı." }, { status: 401 });

    const supabase = db();
    const [{ data: accessRows }, { data: userRow }] = await Promise.all([
      supabase.from("user_firm_access").select("firm_id").eq("user_id", userId),
      supabase.from("users").select("company_id").eq("id", userId).maybeSingle(),
    ]);

    const ids = Array.from(new Set([
      ...(accessRows || []).map((x:any) => clean(x.firm_id)),
      clean(userRow?.company_id),
      cookieCompanyId,
    ].filter(Boolean)));

    if (!ids.length) return NextResponse.json({ success: true, firms: [] });

    const { data, error } = await supabase
      .from("companies")
      .select("id,name")
      .in("id", ids)
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, firms: data || [] });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Firma listesi alınamadı.", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
