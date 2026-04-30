import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type AnyRow = Record<string, any>;

function normalizeText(value: unknown) {
  return String(value || "").trim();
}

function normalizeResult(value: unknown) {
  const raw = normalizeText(value).toUpperCase();

  if (raw.includes("UYGUNSUZ")) return "UYGUNSUZ";
  if (raw.includes("KISMEN")) return "KISMEN";
  if (raw.includes("KAPSAM")) return "KAPSAMDISI";
  if (raw.includes("UYGUN")) return "UYGUN";

  return "DIGER";
}

function pickCompanyName(row: AnyRow | null) {
  if (!row) return "";

  return (
    normalizeText(row.name) ||
    normalizeText(row.company_name) ||
    normalizeText(row.firma_adi) ||
    normalizeText(row.company_title) ||
    normalizeText(row.title)
  );
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    const adminAuth = cookieStore.get("dsec_admin_auth")?.value;
    const adminRole = cookieStore.get("dsec_admin_role")?.value;
    const companyIdFromCookie = normalizeText(
      cookieStore.get("dsec_company_id")?.value
    );

    const companyIdFromQuery = normalizeText(
      req.nextUrl.searchParams.get("companyId")
    );

    const isAllowed =
      adminAuth === "ok" &&
      (adminRole === "super_admin" ||
        adminRole === "admin" ||
        adminRole === "company_admin");

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    let requestedCompanyId =
      adminRole === "company_admin"
        ? companyIdFromCookie || companyIdFromQuery
        : companyIdFromQuery;

    if (!requestedCompanyId) {
      return NextResponse.json(
        { error: "Firma seçilmedi." },
        { status: 400 }
      );
    }

    const { data: companyData } = await supabase
      .from("companies")
      .select("*")
      .eq("id", requestedCompanyId)
      .maybeSingle();

    const companyName = pickCompanyName(companyData as AnyRow | null);

    let runsData: AnyRow[] = [];
let runsError: any = null;

const baseRunsSelect = () =>
  supabase
    .from("denetim_runs")
    .select("*")
    .order("created_at_millis", { ascending: false });

const numericCompanyId = Number(requestedCompanyId);

// 1) Önce gerçek numeric firm_id ile dene
if (Number.isFinite(numericCompanyId) && requestedCompanyId !== "") {
  const result = await baseRunsSelect().eq("firm_id", numericCompanyId);
  runsData = (result.data || []) as AnyRow[];
  runsError = result.error;
}

// 2) Sonuç yoksa firma adı ile dene
if (!runsError && runsData.length === 0 && companyName) {
  const result = await baseRunsSelect().eq("firm_name", companyName);
  runsData = (result.data || []) as AnyRow[];
  runsError = result.error;
}

// 3) Sonuç yoksa mevcut app senkron yapısındaki firm_id = 0 kayıtlarını al
// Şu an app tarafı denetimleri Supabase'e firm_id=0 olarak gönderdiği için
// geçici uyumluluk katmanı olarak bu fallback kullanılıyor.
if (!runsError && runsData.length === 0) {
  const result = await baseRunsSelect().eq("firm_id", 0);
  runsData = (result.data || []) as AnyRow[];
  runsError = result.error;
}

if (runsError) {
  return NextResponse.json(
    {
      error: "Denetim kayıtları alınamadı.",
      detail: runsError.message,
    },
    { status: 500 }
  );
}

    if (runsError) {
      return NextResponse.json(
        {
          error: "Denetim kayıtları alınamadı.",
          detail: runsError.message,
        },
        { status: 500 }
      );
    }

    const runs = (runsData || []) as AnyRow[];

    const runRemoteIds = runs
      .map((r) => r.id)
      .filter((id) => id !== null && id !== undefined);

    const appRunIds = runs
      .map((r) => r.app_run_id)
      .filter((id) => id !== null && id !== undefined);

    let answers: AnyRow[] = [];

    if (runRemoteIds.length > 0 || appRunIds.length > 0) {
      let answerQuery = supabase.from("denetim_answers").select("*");

      if (runRemoteIds.length > 0) {
        answerQuery = answerQuery.in("run_remote_id", runRemoteIds);
      } else {
        answerQuery = answerQuery.in("app_run_id", appRunIds);
      }

      const { data: answersData, error: answersError } = await answerQuery;

      if (answersError) {
        return NextResponse.json(
          {
            error: "Denetim cevapları alınamadı.",
            detail: answersError.message,
          },
          { status: 500 }
        );
      }

      answers = (answersData || []) as AnyRow[];
    }

    let uygunCount = 0;
    let uygunsuzCount = 0;
    let kismenCount = 0;
    let kapsamDisiCount = 0;
    let otherCount = 0;

    const nonconformityMap = new Map<string, number>();
    const categoryMap = new Map<string, number>();

    answers.forEach((answer) => {
      const result = normalizeResult(answer.result);
      const itemTitle = normalizeText(answer.item_title || answer.itemTitle);
      const action = normalizeText(answer.recommended_action);

      if (result === "UYGUN") uygunCount += 1;
      else if (result === "UYGUNSUZ") {
        uygunsuzCount += 1;

        if (itemTitle) {
          nonconformityMap.set(
            itemTitle,
            (nonconformityMap.get(itemTitle) || 0) + 1
          );
        }

        if (action) {
          categoryMap.set(action, (categoryMap.get(action) || 0) + 1);
        }
      } else if (result === "KISMEN") kismenCount += 1;
      else if (result === "KAPSAMDISI") kapsamDisiCount += 1;
      else otherCount += 1;
    });

    const totalItems = answers.length;

    const complianceScore =
      totalItems > 0
        ? Math.max(
            0,
            Math.round(
              ((uygunCount + kismenCount * 0.5) / totalItems) * 100
            )
          )
        : 0;

    const completedRuns = runs.filter(
      (r) => normalizeText(r.status).toUpperCase() === "TAMAMLANDI"
    ).length;

    const draftRuns = runs.filter(
      (r) => normalizeText(r.status).toUpperCase() === "TASLAK"
    ).length;

    const topNonconformities = Array.from(nonconformityMap.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const recommendedActions = Array.from(categoryMap.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return NextResponse.json({
      success: true,
      company: {
        id: requestedCompanyId,
        name: companyName || "-",
      },
      summary: {
        total_audits: runs.length,
        completed_audits: completedRuns,
        draft_audits: draftRuns,
        total_items: totalItems,
        uygun_count: uygunCount,
        uygunsuz_count: uygunsuzCount,
        kismen_count: kismenCount,
        kapsam_disi_count: kapsamDisiCount,
        other_count: otherCount,
        open_dof_count: 0,
        closed_dof_count: 0,
        compliance_score: complianceScore,
      },
      result_distribution: [
        { label: "Uygun", value: uygunCount },
        { label: "Uygunsuz", value: uygunsuzCount },
        { label: "Kısmen", value: kismenCount },
        { label: "Kapsam Dışı", value: kapsamDisiCount },
      ],
      top_nonconformities: topNonconformities,
      recommended_actions: recommendedActions,
      audits: runs.map((r) => ({
        id: r.id,
        app_run_id: r.app_run_id,
        firm_id: r.firm_id,
        firm_name: r.firm_name,
        template_type: r.template_type,
        eval_mode: r.eval_mode,
        location: r.location,
        responsible: r.responsible,
        inspector_name: r.inspector_name,
        report_no: r.report_no,
        status: r.status,
        audit_date_millis: r.audit_date_millis,
      })),
    });
  } catch (error) {
    console.error("audit analysis report error:", error);
    return NextResponse.json(
      { error: "Denetim analiz raporu alınamadı." },
      { status: 500 }
    );
  }
}