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

    /*
     * APP localFirmId gönderiyorsa BU değer denetim_runs.firm_id için otoritedir.
     * Önceki sürümde UUID firmId için web_firm_id kolonuna filtre ekleniyordu.
     * denetim_runs tablosunda bu kolon yoksa Supabase sorgusu komple 400/500 düşer
     * ve App "Senkron hatası" gösterir.
     */
    const localFirmIdNum = Number(localFirmIdRaw);
    const firmIdNum = Number(firmIdRaw);

    let resolvedFirmId: number | null = null;

    if (Number.isFinite(localFirmIdNum) && localFirmIdNum > 0) {
      resolvedFirmId = localFirmIdNum;
    } else if (Number.isFinite(firmIdNum) && firmIdNum > 0) {
      resolvedFirmId = firmIdNum;
    } else if (firmIdRaw) {
      /*
       * firmId UUID geldiyse companies.id -> local_firm_id çöz.
       * Bu sorgu başarısız olursa aşağıda firma adı fallback'i kullanılır.
       */
      const { data: company } = await supabase
        .from("companies")
        .select("local_firm_id")
        .eq("id", firmIdRaw)
        .maybeSingle();

      const mapped = Number((company as any)?.local_firm_id);
      if (Number.isFinite(mapped) && mapped > 0) {
        resolvedFirmId = mapped;
      }
    }

    let runsQuery = supabase
      .from("denetim_runs")
      .select("*")
      .order("created_at_millis", { ascending: false, nullsFirst: false });

    if (resolvedFirmId !== null) {
      runsQuery = runsQuery.eq("firm_id", resolvedFirmId);
    } else if (firmNameRaw) {
      const safeFirmName = firmNameRaw.replace(/[%_,]/g, "");
      runsQuery = runsQuery.ilike("firm_name", `%${safeFirmName}%`);
    } else {
      return NextResponse.json(
        {
          success: false,
          step: "resolveFirm",
          error: "Firma eşlemesi yapılamadı.",
          firmId: firmIdRaw,
          localFirmId: localFirmIdRaw,
        },
        { status: 400 }
      );
    }

    const { data: runs, error: runsError } = await runsQuery;

    if (runsError) {
      return NextResponse.json(
        {
          success: false,
          step: "runs",
          error: runsError.message,
          resolvedFirmId,
        },
        { status: 500 }
      );
    }

    const safeRuns = runs || [];

    if (safeRuns.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        resolvedFirmId,
        runs: [],
      });
    }

    /*
     * Mevcut şemada denetim_runs.id sayısal. String karşılaştırma ile
     * gereksiz Number dönüşümünden kaçınıyoruz; Supabase .in() için
     * gerçek id değerlerini aynen kullanıyoruz.
     */
    const runIds = safeRuns
      .map((r: any) => r.id)
      .filter((id: any) => id !== null && id !== undefined);

    let safeAnswers: any[] = [];

    if (runIds.length > 0) {
      const { data: answers, error: answersError } = await supabase
        .from("denetim_answers")
        .select("*")
        .in("run_remote_id", runIds);

      if (answersError) {
        return NextResponse.json(
          {
            success: false,
            step: "answers",
            error: answersError.message,
            resolvedFirmId,
          },
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
        appRunId: run.app_run_id || run.id,
        remoteId: run.id,
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
      count: runsWithAnswers.length,
      resolvedFirmId,
      runs: runsWithAnswers,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        step: "catch",
        error: e?.message || "Liste hatası",
      },
      { status: 500 }
    );
  }
}
