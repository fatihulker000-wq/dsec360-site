import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const appRunId = Number(body?.appRunId || 0);

    if (!appRunId) {
      return NextResponse.json(
        { error: "appRunId zorunludur." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: run } = await supabase
      .from("denetim_runs")
      .select("id")
      .eq("app_run_id", appRunId)
      .maybeSingle();

    if (!run?.id) {
      return NextResponse.json({
        success: true,
        message: "Web tarafında kayıt bulunamadı, zaten silinmiş kabul edildi.",
      });
    }

    const { error: answersError } = await supabase
      .from("denetim_answers")
      .delete()
      .eq("run_remote_id", run.id);

    if (answersError) {
      return NextResponse.json(
        { error: answersError.message },
        { status: 500 }
      );
    }

    const { error: runError } = await supabase
      .from("denetim_runs")
      .delete()
      .eq("id", run.id);

    if (runError) {
      return NextResponse.json(
        { error: runError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      deletedAppRunId: appRunId,
      deletedRemoteRunId: run.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Denetim silme senkron hatası." },
      { status: 500 }
    );
  }
}