import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();

    const { searchParams } = new URL(req.url);

    const firmIdRaw = (searchParams.get("firmId") || "").trim();
    const localFirmIdRaw = (searchParams.get("localFirmId") || "").trim();
    const firmNameRaw = (searchParams.get("firmName") || "").trim();

    const firmIdNum = Number(firmIdRaw);
    const localFirmIdNum = Number(localFirmIdRaw);

    let runsQuery = supabase
      .from("denetim_runs")
      .select("*")
      .order("created_at_millis", { ascending: false, nullsFirst: false });

    const filters: string[] = [];

    if (firmIdRaw && firmIdRaw !== "0" && !Number.isNaN(firmIdNum)) {
      filters.push(`firm_id.eq.${firmIdNum}`);
    }

    if (localFirmIdRaw && localFirmIdRaw !== "0" && !Number.isNaN(localFirmIdNum)) {
      filters.push(`firm_id.eq.${localFirmIdNum}`);
    }

    if (firmNameRaw) {
      const safeFirmName = firmNameRaw.replace(/[%_,]/g, "");
      filters.push(`firm_name.ilike.*${safeFirmName}*`);
    }

    if (filters.length > 0) {
      runsQuery = runsQuery.or(filters.join(","));
    }

    const { data: runs, error: runsError } = await runsQuery;

    if (runsError) {
      return NextResponse.json(
        { success: false, step: "runs", error: runsError.message },
        { status: 500 }
      );
    }

    const safeRuns = runs || [];

    if (safeRuns.length === 0) {
      return NextResponse.json({ success: true, runs: [] });
    }

    const runIds = safeRuns
      .map((r: any) => Number(r.id))
      .filter((id) => id > 0);

    let safeAnswers: any[] = [];

    if (runIds.length > 0) {
      const { data: answers, error: answersError } = await supabase
        .from("denetim_answers")
        .select("*")
        .in("run_remote_id", runIds);

      if (answersError) {
        return NextResponse.json(
          { success: false, step: "answers", error: answersError.message },
          { status: 500 }
        );
      }

      safeAnswers = answers || [];
    }

    const runsWithAnswers = safeRuns.map((run: any) => {
      const runRemoteId = Number(run.id);

      const runAnswers = safeAnswers
        .filter((a: any) => Number(a.run_remote_id) === runRemoteId)
        .map((a: any) => ({
          ...a,
          itemTitle: a.item_title || "",
          legalRef: a.legal_ref || "",
          recommendedAction: a.recommended_action || "",
          dofStatus: a.dof_status || "NONE",
          dofClosedAt: a.dof_closed_at || 0,
          dofNote: a.dof_note || "",
          photoUrl: a.photo_url || "",
        }));

      return {
        ...run,

        appRunId: run.app_run_id || run.id,
        firmId: run.firm_id || 0,
        firmName: run.firm_name || "",
        templateType: run.template_type || "",
        evalMode: run.eval_mode || "KLASIK",
        location: run.location || "",
        responsible: run.responsible || "",
        inspectorName: run.inspector_name || "",
        auditDateMillis:
          run.audit_date_millis || run.created_at_millis || Date.now(),
        reportNo: run.report_no || "",
        generalNote: run.general_note || "",
        status: run.status || "TASLAK",
        createdAt: run.created_at_millis || Date.now(),

        answers: runAnswers,
      };
    });

    return NextResponse.json({
      success: true,
      runs: runsWithAnswers,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, step: "catch", error: e?.message || "Liste hatası" },
      { status: 500 }
    );
  }
}