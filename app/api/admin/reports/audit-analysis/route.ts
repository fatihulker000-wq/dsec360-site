import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { resolveReportScope } from "../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type AnyRow = Record<string, any>;

function text(value: unknown) {
  return String(value || "").trim();
}

function key(value: unknown) {
  return text(value)
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "");
}

function pickCompanyName(row: AnyRow | null) {
  if (!row) return "";

  return (
    text(row.name) ||
    text(row.company_name) ||
    text(row.firma_adi) ||
    text(row.company_title) ||
    text(row.title)
  );
}

function normalizeResult(value: unknown) {
  const raw = text(value).toUpperCase();

  if (!raw) return "DIGER";

  if (raw.startsWith("SCORE:")) {
    const score = Number(raw.replace("SCORE:", ""));
    if (!Number.isFinite(score)) return "DIGER";
    if (score >= 100) return "UYGUN";
    if (score >= 75) return "KISMEN";
    return "UYGUNSUZ";
  }

  if (raw.startsWith("ELMERI:")) {
    const parts = raw.split(":");
    const wrong = Number(parts[2] || 0);
    const out = Number(parts[3] || 0);

    if (wrong > 0) return "UYGUNSUZ";
    if (out > 0) return "KAPSAMDISI";
    return "UYGUN";
  }

  if (raw.includes("KAPSAM")) return "KAPSAMDISI";
  if (raw.includes("UYGUNSUZ")) return "UYGUNSUZ";
  if (raw.includes("KISMEN")) return "KISMEN";
  if (raw.includes("YETERSIZ") || raw.includes("YETERSİZ")) return "UYGUNSUZ";
  if (raw.includes("EKSIK") || raw.includes("EKSİK")) return "UYGUNSUZ";
  if (raw.includes("UYGUN")) return "UYGUN";

  return "DIGER";
}

function normalizeDofStatus(value: unknown, result: unknown) {
  const s = text(value).toUpperCase();
  const r = normalizeResult(result);

  if (s === "CLOSED" || s === "KAPALI") return "CLOSED";
  if (s === "OPEN" || s === "AÇIK" || s === "IN_PROGRESS") return "OPEN";

  if (r === "UYGUNSUZ" || r === "KISMEN") return "OPEN";

  return "NONE";
}

function runMatchesCompany(
  run: AnyRow,
  companyIds: string[],
  companyNames: string[]
) {
  const runFirmId = key(run.firm_id);
  const runFirmName = key(run.firm_name);

  const normalizedIds = companyIds
    .map((value) => key(value))
    .filter(Boolean);

  const normalizedNames = companyNames
    .map((value) => key(value))
    .filter(Boolean);

  if (
    runFirmId &&
    normalizedIds.includes(runFirmId)
  ) {
    return true;
  }

  if (
    runFirmName &&
    normalizedNames.includes(runFirmName)
  ) {
    return true;
  }

  if (runFirmName) {
    const matchesName = normalizedNames.some(
      (companyName) =>
        runFirmName.includes(companyName) ||
        companyName.includes(runFirmName)
    );

    if (matchesName) {
      return true;
    }
  }

  /*
   * Mobil uygulama kayıtları bazen:
   * Firma#123
   * Firma 123
   * şeklinde gelebilir.
   */
  if (
    runFirmName.startsWith("firma")
  ) {
    const matchesLocalId =
      normalizedIds.some((companyId) =>
        runFirmName.includes(companyId)
      );

    if (matchesLocalId) {
      return true;
    }
  }

  return false;
}

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    const auth = text(
  cookieStore.get("dsec_admin_auth")?.value ||
    cookieStore.get("dsec_user_auth")?.value
);

const role = text(
  cookieStore.get("dsec_admin_role")?.value ||
    cookieStore.get("dsec_user_role")?.value
);

const userId = text(
  cookieStore.get("dsec_user_id")?.value
);

const companyIdFromCookie = text(
  cookieStore.get("dsec_company_id")?.value
);

const companyIdFromQuery = text(
  req.nextUrl.searchParams.get("companyId")
);

const companyNameFromQuery = text(
  req.nextUrl.searchParams.get("companyName")
);

const allowedRoles = [
  "admin",
  "super_admin",
  "company_admin",
  "demo_user",
];

if (
  auth !== "ok" ||
  !allowedRoles.includes(role)
) {
  return NextResponse.json(
    { error: "Yetkisiz erişim." },
    { status: 401 }
  );
}

const supabase = getSupabase();

const reportScope =
  await resolveReportScope(
    supabase,
    companyIdFromQuery
  );

if (!reportScope.ok) {
  return NextResponse.json(
    { error: reportScope.error },
    { status: reportScope.status }
  );
}

let requestedCompanyId =
  reportScope.scope.selectedCompanyId;

    const showAllCompanies = requestedCompanyId === "ALL";

    

    let companyName = "Tüm Firmalar";
let localFirmId = "";

if (!showAllCompanies) {
  const {
    data: companyData,
    error: companyError,
  } = await supabase
    .from("companies")
    .select("id, name, local_firm_id")
    .eq("id", requestedCompanyId)
    .maybeSingle();

  if (companyError) {
    console.error(
      "audit company error:",
      companyError
    );

    return NextResponse.json(
      {
        error:
          "Firma bilgisi alınamadı.",
      },
      { status: 500 }
    );
  }

  if (!companyData) {
    return NextResponse.json(
      { error: "Firma bulunamadı." },
      { status: 404 }
    );
  }

  companyName =
    pickCompanyName(
      companyData as AnyRow
    ) ||
    companyNameFromQuery ||
    "-";

  localFirmId = text(
    companyData.local_firm_id
  );
}

    const { data: allRuns, error: runsError } = await supabase
      .from("denetim_runs")
      .select("*")
      .order("created_at_millis", { ascending: false });

    if (runsError) {
      return NextResponse.json(
        {
          error: "Denetim kayıtları alınamadı.",
          detail: runsError.message,
        },
        { status: 500 }
      );
    }

   const companyIds = [
  requestedCompanyId,
  localFirmId,
].filter(Boolean);

const companyNames = [
  companyName,
  companyNameFromQuery,
].filter(Boolean);

const runs = showAllCompanies
  ? allRuns || []
  : (allRuns || []).filter(
      (run: AnyRow) =>
        runMatchesCompany(
          run,
          companyIds,
          companyNames
        )
    );

    const runRemoteIds = runs
      .map((r: AnyRow) => r.id)
      .filter((id: any) => id !== null && id !== undefined);

    let answers: AnyRow[] = [];

    if (runRemoteIds.length > 0) {
      const { data: answersData, error: answersError } = await supabase
        .from("denetim_answers")
        .select("*")
        .in("run_remote_id", runRemoteIds);

      if (answersError) {
        return NextResponse.json(
          {
            error: "Denetim cevapları alınamadı.",
            detail: answersError.message,
          },
          { status: 500 }
        );
      }

      answers = answersData || [];
    }

    let uygunCount = 0;
    let uygunsuzCount = 0;
    let kismenCount = 0;
    let kapsamDisiCount = 0;
    let otherCount = 0;
    let openDofCount = 0;
    let closedDofCount = 0;

    const nonconformityMap = new Map<string, number>();
    const actionMap = new Map<string, number>();

    answers.forEach((answer) => {
      const result = normalizeResult(answer.result);
      const dofStatus = normalizeDofStatus(answer.dof_status, answer.result);

      const itemTitle = text(answer.item_title || answer.itemTitle);
      const action = text(answer.recommended_action || answer.recommendedAction);

      if (result === "UYGUN") uygunCount += 1;
      else if (result === "UYGUNSUZ") uygunsuzCount += 1;
      else if (result === "KISMEN") kismenCount += 1;
      else if (result === "KAPSAMDISI") kapsamDisiCount += 1;
      else otherCount += 1;

      if (result === "UYGUNSUZ" || result === "KISMEN") {
        if (itemTitle) {
          nonconformityMap.set(
            itemTitle,
            (nonconformityMap.get(itemTitle) || 0) + 1
          );
        }

        if (action) {
          actionMap.set(action, (actionMap.get(action) || 0) + 1);
        }
      }

      if (dofStatus === "OPEN") openDofCount += 1;
      if (dofStatus === "CLOSED") closedDofCount += 1;
    });

    const totalItems = answers.length;

    const complianceScore =
      totalItems > 0
        ? Math.max(
            0,
            Math.round(((uygunCount + kismenCount * 0.5) / totalItems) * 100)
          )
        : 0;

    const normalizedRunStatus = (r: AnyRow) =>
      text(r.status).trim().toUpperCase();

    const completedRuns = runs.filter((r: AnyRow) =>
      ["TAMAMLANDI", "COMPLETED", "DONE", "CLOSED"].includes(
        normalizedRunStatus(r)
      )
    ).length;

    const draftRuns = runs.filter((r: AnyRow) =>
      ["TASLAK", "DRAFT"].includes(normalizedRunStatus(r))
    ).length;

    // Toplam denetim ile tamamlanan denetim arasındaki farkı ayrıca göster.
    // Böylece örn. 10 toplam / 8 tamamlanan kayıtta kalan 2 kayıt görünür olur.
    const unfinishedRuns = Math.max(0, runs.length - completedRuns);

    const inProgressRuns = runs.filter((r: AnyRow) =>
      [
        "DEVAM_EDIYOR",
        "DEVAM EDİYOR",
        "DEVAM EDIYOR",
        "IN_PROGRESS",
        "STARTED",
        "PLANLANDI",
        "PLANNED",
        "OPEN",
      ].includes(normalizedRunStatus(r))
    ).length;

    const topNonconformities = Array.from(nonconformityMap.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const recommendedActions = Array.from(actionMap.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

   return NextResponse.json({
  success: true,
  role,
  read_only: role === "demo_user",
      company: {
        id: requestedCompanyId,
        name: companyName || "-",
      },
      summary: {
        total_audits: runs.length,
        completed_audits: completedRuns,
        unfinished_audits: unfinishedRuns,
        in_progress_audits: inProgressRuns,
        draft_audits: draftRuns,
        total_items: totalItems,
        uygun_count: uygunCount,
        uygunsuz_count: uygunsuzCount,
        kismen_count: kismenCount,
        kapsam_disi_count: kapsamDisiCount,
        other_count: otherCount,
        open_dof_count: openDofCount,
        closed_dof_count: closedDofCount,
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
      audits: runs.map((r: AnyRow) => ({
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