import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const firmId = searchParams.get("firmId");

    const supabase = getSupabase();

    let query = supabase
      .from("employees")
      .select("*")
      .order("full_name", { ascending: true });

    // ✅ Firma filtresi
    if (firmId && firmId !== "all") {
      query = query.eq("firm_id", firmId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // ✅ Firma listesi
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name");

    return NextResponse.json({
      data: data || [],
      companies: companies || [],
    });

  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}