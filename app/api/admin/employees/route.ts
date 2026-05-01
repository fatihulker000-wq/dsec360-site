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
  .order("full_name", { ascending: true })
  .range(0, 5000);

    // ✅ Firma filtresi
    if (firmId && firmId !== "all") {
      query = query.eq("firm_id", firmId);
    }

    let allEmployees: any[] = [];
let from = 0;
const step = 1000;

while (true) {
  let pagedQuery = supabase
    .from("employees")
    .select("*")
    .order("full_name", { ascending: true })
    .range(from, from + step - 1);

  if (firmId && firmId !== "all") {
    pagedQuery = pagedQuery.eq("firm_id", firmId);
  }

  const { data, error } = await pagedQuery;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const rows = data || [];
  allEmployees = [...allEmployees, ...rows];

  if (rows.length < step) break;

  from += step;
}

    // ✅ Firma listesi
    const { data: companies } = await supabase
      .from("companies")
      .select("id, name");

    return NextResponse.json({
  data: allEmployees,
  companies: companies || [],
});

  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}