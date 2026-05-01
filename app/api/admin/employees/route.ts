import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const firmId = String(url.searchParams.get("firmId") || "").trim();

    const supabase = getSupabase();

    const { data: companies, error: companyError } = await supabase
      .from("companies")
      .select("id, name")
      .order("name", { ascending: true });

    if (companyError) {
      return NextResponse.json({ error: companyError.message }, { status: 500 });
    }

    let query = supabase
      .from("employees")
      .select("*")
      .order("full_name", { ascending: true });

    if (firmId && firmId !== "all") {
      query = query.eq("firm_id", firmId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      companies: companies || [],
      selectedFirmId: firmId || "all",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}