import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function clean(v: unknown) {
  return String(v ?? "").trim();
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);

    const firmIdRaw = clean(searchParams.get("firmId"));
    const localFirmIdRaw = clean(searchParams.get("localFirmId"));
    const firmNameRaw = clean(searchParams.get("firmName"));

    const numericCandidates = [firmIdRaw, localFirmIdRaw]
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v) && v > 0);

    const textCandidates = [firmIdRaw]
      .filter((v) => v && Number.isNaN(Number(v)));

    let runsQuery = supabase
      .from("denetim_runs")
      .select("*")
      .order("created_at_millis", { ascending: false, nullsFirst: false });

    const filters: string[] = [];

    for (const n of [...new Set(numericCandidates)]) {
      filters.push(`firm_id.eq.${n}`);
    }

    // UUID tabanlı firma eşlemesi olan kayıtlarda web_firm_id kullan.
    for (const id of [...new Set(textCandidates)]) {
      filters.push(`web_firm_id.eq.${id}`);
    }

    // Sadece ID eşlemesi bulunamıyorsa firma adı fallback olsun.
    if (filters.length === 0 && firmNameRaw) {
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
      return NextResponse.json({ success: true, count: 0, runs: [] });
    }

    // denetim_runs.id tipi bigint/numeric olabilir; JS Number'a zorlamadan string tut.
    const runIds = safeRuns
      .map((r: any) => clean(r.id))
      .filter(Boolean);

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
      const runRemoteId = clean(run.id);

      const runAnswers = safeAnswers
        .filter((a: any) => clean(a.run_remote_id) === runRemoteId)
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
        appRunId: run.app_run_id || 0,
        remoteId: run.id,
        firmId: run.firm_id || 0,
        firmName: run.firm_name || "",
        templateType: run.template_type || run.title || "",
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
      count: runsWithAnswers.length,
      runs: runsWithAnswers,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, step: "catch", error: e?.message || "Liste hatası" },
      { status: 500 }
    );
  }
}
