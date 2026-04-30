import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data: runs, error } = await supabase
      .from("denetim_runs")
      .select("*")
      .order("created_at_millis", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      runs: runs || [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Liste hatası" },
      { status: 500 }
    );
  }
}