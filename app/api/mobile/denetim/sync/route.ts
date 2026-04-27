import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { run, answers } = body;

    if (!run) {
      return NextResponse.json({ error: "Run verisi yok." }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: runData, error: runError } = await supabase
      .from("denetim_runs")
      .insert({
        app_run_id: run.id,
        firm_id: run.firmId,
        firm_name: run.firmName,
        template_type: run.templateType,
        eval_mode: run.evalMode,
        location: run.location,
        responsible: run.responsible,
        inspector_name: run.inspectorName,
        audit_date_millis: run.auditDateMillis,
        report_no: run.reportNo,
        general_note: run.generalNote,
        status: run.status,
        created_at_millis: run.createdAt,
        source: "APP",
      })
      .select("id")
      .single();

    if (runError) {
      return NextResponse.json({ error: runError.message }, { status: 500 });
    }

    if (Array.isArray(answers) && answers.length > 0) {
      const rows = answers.map((a: any) => ({
        run_remote_id: runData.id,
        app_run_id: run.id,
        item_title: a.itemTitle,
        legal_ref: a.legalRef,
        result: a.result,
        note: a.note,
        photo_path: a.photoPath,
        recommended_action: a.recommendedAction,
      }));

      const { error: answersError } = await supabase
        .from("denetim_answers")
        .insert(rows);

      if (answersError) {
        return NextResponse.json({ error: answersError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, remoteRunId: runData.id });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Denetim senkron hatası." },
      { status: 500 }
    );
  }
}