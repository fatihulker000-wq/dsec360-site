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

    // ✅ RUNS
    const { data: runs, error } = await supabase
      .from("denetim_runs")
      .select("*")
      .order("created_at_millis", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!runs || runs.length === 0) {
      return NextResponse.json({
        success: true,
        runs: [],
      });
    }

    // 🔥 RUN IDS AL
    const runIds = runs.map((r) => r.id);

    // ✅ ANSWERS
    const { data: answers } = await supabase
      .from("denetim_answers")
      .select("*")
      .in("run_remote_id", runIds);

    // 🔥 MAPLE
    const runsWithAnswers = runs.map((run) => ({
      ...run,
      answers: (answers || []).filter(
        (a) => a.run_remote_id === run.id
      ),
    }));

    return NextResponse.json({
      success: true,
      runs: runsWithAnswers,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Liste hatası" },
      { status: 500 }
    );
  }
}