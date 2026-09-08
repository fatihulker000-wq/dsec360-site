import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import ExecutiveHero from "../../../components/inspection-v2/ExecutiveHero";
import KPISection, {
  type InspectionKpiItem,
} from "../../../components/inspection-v2/KPISection";
import AnalyticsSection from "../../../components/inspection-v2/AnalyticsSection";
import DoraExecutive from "../../../components/inspection-v2/DoraExecutive";
import DofCommandCenter, {
  type DofViewItem,
} from "../../../components/inspection-v2/DofCommandCenter";
import InspectionCards, {
  type InspectionViewItem,
} from "../../../components/inspection-v2/InspectionCards";
import AnalysisCard from "../../../components/inspection-v2/AnalysisCard";
import {
  cleanFirmName,
  formatDate,
  makeDofQuery,
  makePagedQuery,
  makeQuery,
  modeColor,
  modeLabel,
  normalizeFirmKey,
  normalizeText,
} from "../../../lib/inspection/utils";


type InspectionFirmOption = {
  id: string;
  name: string;
};

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function deleteDenetimAction(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
  const role = String(
    cookieStore.get("dsec_user_role")?.value ||
      cookieStore.get("dsec_admin_role")?.value ||
      ""
  ).trim();
  if (role === "demo_user") return;

  const remoteId = Number(formData.get("remoteId") || 0);
  const firmId = String(formData.get("firmId") || "").trim();
  if (!remoteId || !firmId) return;

  const supabase = getSupabase();

  const { data: run } = await supabase
    .from("denetim_runs")
    .select("id, web_firm_id, firm_id")
    .eq("id", remoteId)
    .maybeSingle();

  const runFirmId = String(run?.web_firm_id || run?.firm_id || "").trim();
  if (!run || runFirmId !== firmId) return;

  await supabase.from("denetim_answers").delete().eq("run_remote_id", remoteId);
  await supabase.from("denetim_runs").delete().eq("id", remoteId);

  revalidatePath("/admin/denetimler");
  redirect("/admin/denetimler");
}

async function closeDofAction(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
  const role = String(
    cookieStore.get("dsec_user_role")?.value ||
      cookieStore.get("dsec_admin_role")?.value ||
      ""
  ).trim();
  if (role === "demo_user") return;

  const answerId = Number(formData.get("answerId") || 0);
  const runRemoteId = Number(formData.get("runRemoteId") || 0);
  const itemTitle = String(formData.get("itemTitle") || "").trim();

  const supabase = getSupabase();

  if (answerId > 0) {
    await supabase
      .from("denetim_answers")
      .update({
        dof_status: "CLOSED",
        dof_closed_at: Date.now(),
      })
      .eq("id", answerId);
  } else if (runRemoteId > 0 && itemTitle) {
    await supabase
      .from("denetim_answers")
      .update({
        dof_status: "CLOSED",
        dof_closed_at: Date.now(),
      })
      .eq("run_remote_id", runRemoteId)
      .eq("item_title", itemTitle);
  }

  revalidatePath("/admin/denetimler");
  redirect("/admin/denetimler");
}

export default async function AdminDenetimlerPage({
  searchParams,
}: {
  searchParams?: Promise<{
    type?: string;
    firm?: string;
    firmId?: string;
    dofPage?: string;
    runPage?: string;
    tab?: string;
    status?: string;
    priority?: string;
    due?: string;
  }>;
}) {
  const sp = await searchParams;
  const activeType = String(sp?.type || "ALL").toUpperCase();
  const activeFirm = String(sp?.firmId || sp?.firm || "ALL").trim();
  const activeTab = String(sp?.tab || "").trim().toLowerCase();
  const activeDofStatus = String(sp?.status || "").trim().toUpperCase();
  const activeDofPriority = String(sp?.priority || "").trim().toUpperCase();
  const activeDofDue = String(sp?.due || "").trim().toUpperCase();

  const activeDofPage = Math.max(1, Number(sp?.dofPage || 1));
  const activeRunPage = Math.max(1, Number(sp?.runPage || 1));

  const dofPageSize = 5;
  const runPageSize = 10;

  const supabase = getSupabase();

  const cookieStore = await cookies();
  const sessionRole = String(
    cookieStore.get("dsec_user_role")?.value ||
      cookieStore.get("dsec_admin_role")?.value ||
      ""
  ).trim();
  const sessionCompanyId = String(
    cookieStore.get("dsec_company_id")?.value || ""
  ).trim();
  const sessionUserId = String(
    cookieStore.get("dsec_user_id")?.value || ""
  ).trim();
  const isCompanyScoped =
    sessionRole === "company_admin" || sessionRole === "demo_user";

  if (isCompanyScoped && !sessionUserId) {
    redirect("/login");
  }

  // Denetim kayıtlarını server tarafında alıyoruz; aşağıda erişilebilir firma UUID
  // listesi ile kesin olarak scope ediyoruz. Firma adı / ilk firma fallback'i yoktur.
  const { data: runs, error } = await supabase
    .from("denetim_runs")
    .select("*")
    .order("inserted_at", { ascending: false });

  const safeRuns = runs || [];
  const runIds = safeRuns.map((r: any) => r.id);

  const { data: answers } = runIds.length
    ? await supabase
        .from("denetim_answers")
        .select("*")
        .in("run_remote_id", runIds)
    : { data: [] as any[] };

  const answerList = answers || [];

  let accessibleCompanyIds: string[] | null = null;

  if (isCompanyScoped) {
    const [{ data: accessRows }, { data: userRow }] = await Promise.all([
      supabase
        .from("user_firm_access")
        .select("firm_id")
        .eq("user_id", sessionUserId),
      supabase
        .from("users")
        .select("company_id")
        .eq("id", sessionUserId)
        .maybeSingle(),
    ]);

    accessibleCompanyIds = Array.from(
      new Set(
        [
          ...(accessRows || []).map((row: any) => String(row.firm_id || "").trim()),
          String(userRow?.company_id || "").trim(),
          sessionCompanyId,
        ].filter(Boolean)
      )
    );

    if (accessibleCompanyIds.length === 0) {
      redirect("/login");
    }
  }

  let companiesQuery = supabase
    .from("companies")
    .select("id, name, local_firm_id")
    .order("name", { ascending: true });

  if (accessibleCompanyIds) {
    companiesQuery = companiesQuery.in("id", accessibleCompanyIds);
  }

  const { data: companies } = await companiesQuery;

const companyList = companies || [];

const companyNameById = new Map<string, string>();
const companyUuidByAnyFirmKey = new Map<string, string>();

companyList.forEach((c: any) => {
  const uuid = String(c.id || "").trim();
  const localId = String(c.local_firm_id ?? "").trim();
  const name = cleanFirmName(c.name);

  if (!uuid) return;

  companyNameById.set(uuid, name);
  companyUuidByAnyFirmKey.set(normalizeFirmKey(uuid), uuid);
  if (localId) companyUuidByAnyFirmKey.set(normalizeFirmKey(localId), uuid);
  if (name) companyUuidByAnyFirmKey.set(normalizeFirmKey(name), uuid);
});

const accessibleFirmUuidSet = new Set(
  companyList.map((c: any) => String(c.id || "").trim()).filter(Boolean)
);

function getRunStoredFirmKey(run: any) {
  return String(run.web_firm_id || run.firm_id || "").trim();
}

function getRunFirmId(run: any) {
  const storedKey = getRunStoredFirmKey(run);
  const byStoredKey = companyUuidByAnyFirmKey.get(normalizeFirmKey(storedKey));
  if (byStoredKey) return byStoredKey;

  return "";
}

function getRunFirmName(run: any) {
  const canonicalFirmId = getRunFirmId(run);
  return cleanFirmName(
    companyNameById.get(canonicalFirmId) || run.firm_name || run.firma_adi
  );
}


function resultRequiresDof(result?: string | null) {
  const r = normalizeText(result);

  if (!r) return false;

  if (
    r === "UYGUNSUZ" ||
    r === "KISMEN" ||
    r.includes("UYGUNSUZ") ||
    r.includes("KISMEN") ||
    r.includes("YETERSIZ") ||
    r.includes("YETERSİZ") ||
    r.includes("EKSIK") ||
    r.includes("EKSİK")
  ) {
    return true;
  }

  if (r.startsWith("SCORE:")) {
    const score = Number(r.replace("SCORE:", ""));
    return Number.isFinite(score) && score < 100;
  }

  if (r.startsWith("ELMERI:")) {
    const parts = r.split(":");
    const wrong = Number(parts[2] || 0);
    return Number.isFinite(wrong) && wrong > 0;
  }

  return false;
}

function normalizeDofStatusFromAnswer(a: any) {
  const status = normalizeText(a.dof_status || a.dofStatus);

  if (status === "CLOSED" || status === "KAPALI") return "CLOSED";
  if (status === "OPEN" || status === "IN_PROGRESS" || status === "AÇIK") return "OPEN";

  if (resultRequiresDof(a.result)) return "OPEN";

  return "NONE";
}

function isCriticalDof(a: any) {
  const result = normalizeText(a.result);
  const priority = normalizeText(
    a.dof_priority ||
      a.priority ||
      a.risk_level ||
      a.riskLevel
  );

  if (
    priority === "CRITICAL" ||
    priority === "KRITIK" ||
    priority === "KRİTİK" ||
    priority === "VERY_HIGH" ||
    priority === "ÇOK YÜKSEK"
  ) {
    return true;
  }

  if (
    priority === "HIGH" ||
    priority === "YUKSEK" ||
    priority === "YÜKSEK" ||
    priority === "CRITICAL" ||
    priority === "KRITIK" ||
    priority === "KRİTİK" ||
    priority === "VERY_HIGH" ||
    priority === "COK_YUKSEK" ||
    priority === "ÇOK YÜKSEK" ||
    priority === "INTOLERABLE" ||
    priority === "KABUL_EDILEMEZ" ||
    priority === "KABUL EDİLEMEZ"
  ) {
    return true;
  }

  return false;
}

const firmOptions: InspectionFirmOption[] = companyList
  .map((c: any) => ({
    id: String(c.id || "").trim(),
    name: cleanFirmName(c.name),
  }))
  .filter((firm: InspectionFirmOption) => Boolean(firm.id && firm.name))
  .sort((a: InspectionFirmOption, b: InspectionFirmOption) =>
    a.name.localeCompare(b.name, "tr")
  );

// URL ile yetkisiz / bilinmeyen firma UUID enjekte edilirse veri göstermeyiz.
if (
  activeFirm !== "ALL" &&
  !firmOptions.some(
    (firm) => normalizeFirmKey(firm.id) === normalizeFirmKey(activeFirm)
  )
) {
  redirect("/admin/denetimler?firm=ALL");
}

const activeFirmName =
  activeFirm === "ALL"
    ? "Tüm Firmalar"
    : firmOptions.find(
        (firm) => normalizeFirmKey(firm.id) === normalizeFirmKey(activeFirm)
      )?.name || "Firma seçilmedi";

const filteredRuns = safeRuns.filter((r: any) => {
  const label = modeLabel(r.eval_mode).toUpperCase();
  const firmId = getRunFirmId(r);

  // Fail closed: erişilebilir firmaya canonical UUID ile bağlanamayan kayıt gösterilmez.
  if (!firmId || !accessibleFirmUuidSet.has(firmId)) return false;

  const typeOk =
    activeType === "ALL" ||
    (activeType === "KLASIK" && label === "KLASIK") ||
    (activeType === "FOTO" && label === "FOTOĞRAFLI") ||
    (activeType === "PUAN" && label === "PUANLAMALI") ||
    (activeType === "ELMERI" && label === "ELMERI");

  const firmName = getRunFirmName(r);

const firmOk =
  activeFirm === "ALL" ||
  normalizeFirmKey(firmId) === normalizeFirmKey(activeFirm);

  return typeOk && firmOk;
});

const scopedRunIds = new Set(
  filteredRuns.map((r: any) => Number(r.id))
);

const scopedAnswers = answerList.filter((a: any) =>
  scopedRunIds.has(Number(a.run_remote_id))
);

const dofItems = scopedAnswers.filter((a: any) => {
  const status = normalizeDofStatusFromAnswer(a);
  return status !== "NONE";
});

const openDofItems = dofItems.filter(
  (a: any) => normalizeDofStatusFromAnswer(a) === "OPEN"
);

const closedDofItems = dofItems.filter(
  (a: any) => normalizeDofStatusFromAnswer(a) === "CLOSED"
);

const criticalFindingItems = scopedAnswers.filter((a: any) => isCriticalDof(a));
const criticalOpenDofItems = openDofItems.filter((a: any) => isCriticalDof(a));

function readDofDueValue(a: any) {
  return (
    a.dof_due_at ??
    a.dof_due_date ??
    a.due_at ??
    a.due_date ??
    a.deadline ??
    a.deadline_at ??
    a.target_date ??
    a.termin_tarihi ??
    null
  );
}

function toDateMillis(value: any): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    const ms = value < 10_000_000_000 ? value * 1000 : value;
    return Number.isFinite(ms) ? ms : null;
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric) && String(value).trim() !== "") {
    const ms = numeric < 10_000_000_000 ? numeric * 1000 : numeric;
    return ms;
  }
  const parsed = new Date(String(value)).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function startOfTodayMillis() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isOverdueDof(a: any) {
  if (normalizeDofStatusFromAnswer(a) !== "OPEN") return false;
  const due = toDateMillis(readDofDueValue(a));
  return due !== null && due < startOfTodayMillis();
}

function isUpcomingDof(a: any) {
  if (normalizeDofStatusFromAnswer(a) !== "OPEN") return false;
  const due = toDateMillis(readDofDueValue(a));
  if (due === null) return false;
  const today = startOfTodayMillis();
  const limit = today + 7 * 24 * 60 * 60 * 1000;
  return due >= today && due <= limit;
}

const overdueDofItems = openDofItems.filter((a: any) => isOverdueDof(a));
const upcomingDofItems = openDofItems.filter((a: any) => isUpcomingDof(a));

const filteredDofItems = dofItems.filter((a: any) => {
  const status = normalizeDofStatusFromAnswer(a);

  const statusOk =
    !activeDofStatus ||
    activeDofStatus === "ALL" ||
    (activeDofStatus === "OPEN" && status === "OPEN") ||
    (activeDofStatus === "CLOSED" && status === "CLOSED");

  const priorityOk =
    !activeDofPriority ||
    activeDofPriority === "ALL" ||
    (activeDofPriority === "CRITICAL" && isCriticalDof(a));

  const dueOk =
    !activeDofDue ||
    activeDofDue === "ALL" ||
    (activeDofDue === "OVERDUE" && isOverdueDof(a)) ||
    (activeDofDue === "UPCOMING" && isUpcomingDof(a));

  return statusOk && priorityOk && dueOk;
});

const dofCountByRun = new Map<number, number>();
dofItems.forEach((a: any) => {
  const key = Number(a.run_remote_id);
  dofCountByRun.set(key, (dofCountByRun.get(key) || 0) + 1);
});

const dofTotalPages = Math.max(
  1,
  Math.ceil(filteredDofItems.length / dofPageSize)
);
const safeDofPage = Math.min(activeDofPage, dofTotalPages);
const pagedDofItems = filteredDofItems.slice(
  (safeDofPage - 1) * dofPageSize,
  safeDofPage * dofPageSize
);

const countByRun = new Map<number, number>();
scopedAnswers.forEach((a: any) => {
  const key = Number(a.run_remote_id);
  countByRun.set(key, (countByRun.get(key) || 0) + 1);
});

const runTotalPages = Math.max(1, Math.ceil(filteredRuns.length / runPageSize));
const safeRunPage = Math.min(activeRunPage, runTotalPages);
const pagedRuns = filteredRuns.slice(
  (safeRunPage - 1) * runPageSize,
  safeRunPage * runPageSize
);

const klasikCount = filteredRuns.filter((r: any) => modeLabel(r.eval_mode) === "Klasik").length;
const fotografliCount = filteredRuns.filter((r: any) => modeLabel(r.eval_mode) === "Fotoğraflı").length;
const puanCount = filteredRuns.filter((r: any) => modeLabel(r.eval_mode) === "Puanlamalı").length;
const elmeriCount = filteredRuns.filter((r: any) => modeLabel(r.eval_mode) === "ELMERI").length;

const totalAnswers = scopedAnswers.length;

const uygunCount = scopedAnswers.filter(
  (a: any) => String(a.result || "").toUpperCase() === "UYGUN"
).length;

const kismenCount = scopedAnswers.filter(
  (a: any) => String(a.result || "").toUpperCase() === "KISMEN"
).length;

const uygunsuzCount = scopedAnswers.filter(
  (a: any) => String(a.result || "").toUpperCase() === "UYGUNSUZ"
).length;

const scoringAnswers = scopedAnswers
  .map((a: any) => normalizeText(a.result))
  .filter((r: string) => r.startsWith("SCORE:"))
  .map((r: string) => Number(r.replace("SCORE:", "")))
  .filter((n: number) => Number.isFinite(n));

const scoringAverage =
  scoringAnswers.length > 0
    ? Math.round(
        scoringAnswers.reduce((sum: number, n: number) => sum + n, 0) /
          scoringAnswers.length
      )
    : null;

const scoringFullCount = scoringAnswers.filter((n: number) => n >= 100).length;
const scoringImprovementCount = scoringAnswers.filter((n: number) => n < 100).length;

const elmeriResults = scopedAnswers
  .map((a: any) => normalizeText(a.result))
  .filter((r: string) => r.startsWith("ELMERI:"))
  .map((r: string) => {
    const parts = r.split(":");
    return {
      correct: Number(parts[1] || 0),
      wrong: Number(parts[2] || 0),
      outOfScope: Number(parts[3] || 0),
    };
  });

const elmeriCorrect = elmeriResults.reduce((s: number, x: any) => s + (Number.isFinite(x.correct) ? x.correct : 0), 0);
const elmeriWrong = elmeriResults.reduce((s: number, x: any) => s + (Number.isFinite(x.wrong) ? x.wrong : 0), 0);
const elmeriOutOfScope = elmeriResults.reduce((s: number, x: any) => s + (Number.isFinite(x.outOfScope) ? x.outOfScope : 0), 0);
const elmeriEvaluated = elmeriCorrect + elmeriWrong;
const elmeriSuccessRate =
  elmeriEvaluated > 0 ? Math.round((elmeriCorrect / elmeriEvaluated) * 100) : null;

const photoAnswerCount = scopedAnswers.filter((a: any) => {
  const run = filteredRuns.find((r: any) => Number(r.id) === Number(a.run_remote_id));
  return modeLabel(run?.eval_mode) === "Fotoğraflı";
}).length;

const emptyRunCount = filteredRuns.filter((r: any) => {
  return (countByRun.get(Number(r.id)) || 0) === 0;
}).length;

const firmCount = activeFirm === "ALL" ? firmOptions.length : 1;

const avgAnswerPerRun =
  filteredRuns.length > 0 ? Math.round(totalAnswers / filteredRuns.length) : 0;

const dofClosureRate =
  dofItems.length > 0 ? Math.round((closedDofItems.length / dofItems.length) * 100) : 0;

const scopedFirmStatsSource =
  activeFirm === "ALL"
    ? firmOptions
    : firmOptions.filter(
        (firm) => normalizeFirmKey(firm.id) === normalizeFirmKey(activeFirm)
      );

const topFirmStats = scopedFirmStatsSource
  .map((firm) => {
    const firmRuns = filteredRuns.filter((run: any) => {
      const runFirmId = getRunFirmId(run);
      const runFirmName = getRunFirmName(run);

      return (
        normalizeFirmKey(runFirmId) === normalizeFirmKey(firm.id) ||
        normalizeFirmKey(runFirmName) === normalizeFirmKey(firm.name)
      );
    });

    const firmRunIds = new Set(
      firmRuns.map((run: any) => Number(run.id))
    );

    const firmAnswers = scopedAnswers.filter((answer: any) =>
      firmRunIds.has(Number(answer.run_remote_id))
    ).length;

    return {
      firm: firm.name,
      firmId: firm.id,
      count: firmRuns.length,
      answers: firmAnswers,
    };
  })
  .filter((item) => item.count > 0)
  .sort((a, b) => b.count - a.count)
  .slice(0, 5);


  const premiumKpis: InspectionKpiItem[] = [
    { title: "Toplam Denetim", value: filteredRuns.length, description: activeFirm === "ALL" ? "Tüm kayıtlar" : `${activeFirmName} kayıtları`, href: makeQuery("ALL", activeFirm), tone: "slate", badge: "Canlı" },
    { title: "Klasik", value: klasikCount, description: "Standart kontrol", href: makeQuery("KLASIK", activeFirm), tone: "slate" },
    { title: "Fotoğraflı", value: fotografliCount, description: "Görsel kanıtlı", href: makeQuery("FOTO", activeFirm), tone: "blue" },
    { title: "Puanlamalı", value: puanCount, description: "Skor bazlı denetim", href: makeQuery("PUAN", activeFirm), tone: "amber" },
    { title: "ELMERI", value: elmeriCount, description: "Gözlemsel analiz", href: makeQuery("ELMERI", activeFirm), tone: "green" },
    { title: "Toplam Madde", value: totalAnswers, description: "Aktarılan bulgu", href: makeQuery(activeType, activeFirm), tone: "purple" },
    { title: "Uygun", value: uygunCount, description: "Pozitif bulgu", href: makeQuery(activeType, activeFirm), tone: "green" },
    { title: "Kısmen", value: kismenCount, description: "Geliştirilmeli", href: makeQuery(activeType, activeFirm), tone: "amber" },
    { title: "Uygunsuz", value: uygunsuzCount, description: "Uygunsuz bulgu", href: makeQuery(activeType, activeFirm), tone: "red" },
    { title: "Açık DÖF", value: openDofItems.length, description: "Takip bekliyor", href: makeDofQuery(activeType, activeFirm, "open"), tone: "red", badge: openDofItems.length > 0 ? "Aksiyon" : "Kontrollü" },
    { title: "Kapalı DÖF", value: closedDofItems.length, description: "Tamamlanan faaliyet", href: makeDofQuery(activeType, activeFirm, "closed"), tone: "green" },
  ];

  const evaluatedAnswerCount = uygunCount + kismenCount + uygunsuzCount;
  const conformityRate =
    evaluatedAnswerCount > 0
      ? Math.round((uygunCount / evaluatedAnswerCount) * 100)
      : 0;


  const typeDistribution = [
    {
      label: "Klasik",
      value: klasikCount,
      tone: "slate" as const,
    },
    {
      label: "Fotoğraflı",
      value: fotografliCount,
      tone: "blue" as const,
    },
    {
      label: "Puanlamalı",
      value: puanCount,
      tone: "amber" as const,
    },
    {
      label: "ELMERI",
      value: elmeriCount,
      tone: "green" as const,
    },
  ];

  const companyAnalytics = topFirmStats.map((company) => {
    const matchingRuns = filteredRuns.filter(
      (run: any) =>
        normalizeFirmKey(getRunFirmName(run)) ===
          normalizeFirmKey(company.firm) ||
        normalizeFirmKey(getRunFirmId(run)) ===
          normalizeFirmKey(company.firmId)
    );

    const matchingRunIds = new Set(
      matchingRuns.map((run: any) => Number(run.id))
    );

    const matchingAnswers = scopedAnswers.filter((answer: any) =>
      matchingRunIds.has(Number(answer.run_remote_id))
    );

    const matchingSuitable = matchingAnswers.filter(
      (answer: any) => normalizeText(answer.result) === "UYGUN"
    ).length;

    return {
      name: company.firm,
      inspections: company.count,
      answers: company.answers,
      conformity:
        (() => {
          const evaluated = matchingAnswers.filter((answer: any) => {
            const result = normalizeText(answer.result);
            return result === "UYGUN" || result === "KISMEN" || result === "UYGUNSUZ";
          }).length;
          return evaluated > 0
            ? Math.round((matchingSuitable / evaluated) * 100)
            : 0;
        })(),
    };
  });

  const topDoraCompany =
    companyAnalytics.length > 0
      ? [...companyAnalytics].sort(
          (a, b) =>
            b.conformity - a.conformity ||
            b.inspections - a.inspections
        )[0]
      : null;


  const dofViewItems: DofViewItem[] = pagedDofItems.map(
    (answer: any, index: number) => {
      const relatedRun = safeRuns.find(
        (run: any) =>
          Number(run.id) === Number(answer.run_remote_id)
      );

      return {
        id: `${answer.id || answer.run_remote_id}-${index}`,
        answerId: answer.id,
        runRemoteId: answer.run_remote_id,
        title: answer.item_title || answer.itemTitle || "-",
        note:
          answer.dof_note ||
          answer.dofNote ||
          answer.note ||
          "DÖF notu girilmemiş",
        firmName: relatedRun
          ? getRunFirmName(relatedRun)
          : "Firma Ünvanı Yok",
        mode: modeLabel(relatedRun?.eval_mode),
        status: normalizeDofStatusFromAnswer(answer) as
          | "OPEN"
          | "CLOSED",
        critical: isCriticalDof(answer),
        responsible: String(
          answer.dof_responsible ||
          answer.responsible ||
          answer.action_responsible ||
          answer.owner_name ||
          answer.assignee_name ||
          ""
        ).trim(),
        dueDate: readDofDueValue(answer),
        overdue: isOverdueDof(answer),
        upcoming: isUpcomingDof(answer),
        riskLevel: String(
          answer.dof_priority ||
          answer.priority ||
          answer.risk_level ||
          answer.riskLevel ||
          ""
        ).trim(),
        firmId: relatedRun ? getRunFirmId(relatedRun) : "",
      };
    }
  );

  const inspectionViewItems: InspectionViewItem[] = pagedRuns.map(
    (run: any) => {
      const colors = modeColor(run.eval_mode);

      return {
        id: run.id,
        firmName: getRunFirmName(run),
        mode: modeLabel(run.eval_mode),
        modeBg: colors.bg,
        modeColor: colors.color,
        template: run.template_type || "-",
        inspector: run.inspector_name || "-",
        date: formatDate(
          run.audit_date_millis || run.created_at_millis
        ),
        answerCount: countByRun.get(Number(run.id)) || 0,
        dofCount: dofCountByRun.get(Number(run.id)) || 0,
        appRunId: run.app_run_id,
      };
    }
  );

  return (
    <main
      style={{
        padding: 32,
        background:
          "radial-gradient(circle at top right, rgba(198,40,40,0.08), transparent 34%), #fafafa",
        minHeight: "100vh",
      }}
    >
      <section style={{ marginBottom: 18 }}>
        <div style={{ marginBottom: 10, fontSize: 12, fontWeight: 900, letterSpacing: ".08em", color: "#7f1d1d" }}>
          DENETİM KAPSAMI · FİRMA UUID
        </div>
        <div
          style={{
            border: "1px solid #eadede",
            borderRadius: 24,
            background: "#ffffff",
            padding: 18,
            boxShadow: "0 12px 34px rgba(127,29,29,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 950, color: "#1f2937" }}>
                Firma ve kapsam filtresi
              </div>
              <div style={{ marginTop: 5, fontSize: 13, color: "#6b7280", fontWeight: 700 }}>
                Seçtiğiniz firma tüm KPI, DÖF, analitik ve denetim kayıtlarına uygulanır.
              </div>
            </div>

            <div style={{ textAlign: "right", minWidth: 220 }}>
              <div style={{ fontSize: 10, letterSpacing: ".08em", fontWeight: 900, color: "#9ca3af" }}>
                AKTİF KAPSAM
              </div>
              <div style={{ marginTop: 4, fontSize: 14, fontWeight: 950, color: "#374151" }}>
                {activeFirmName}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Link
              href={makeQuery(activeType, "ALL")}
              style={{
                textDecoration: "none",
                padding: "10px 16px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 900,
                border: activeFirm === "ALL" ? "1px solid #991b1b" : "1px solid #e5e7eb",
                background: activeFirm === "ALL" ? "linear-gradient(135deg,#7f1d1d,#dc2626)" : "#fff",
                color: activeFirm === "ALL" ? "#fff" : "#374151",
                boxShadow: activeFirm === "ALL" ? "0 8px 18px rgba(153,27,27,.18)" : "none",
              }}
            >
              Tüm Firmalar
            </Link>

            {firmOptions.map((firm) => {
              const selected =
                normalizeFirmKey(activeFirm) === normalizeFirmKey(firm.id);

              return (
                <Link
                  key={firm.id}
                  href={makeQuery(activeType, firm.id)}
                  style={{
                    textDecoration: "none",
                    padding: "10px 16px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 900,
                    border: selected ? "1px solid #991b1b" : "1px solid #e5e7eb",
                    background: selected
                      ? "linear-gradient(135deg,#7f1d1d,#ef4444)"
                      : "#fff",
                    color: selected ? "#fff" : "#374151",
                    boxShadow: selected ? "0 8px 18px rgba(153,27,27,.18)" : "none",
                  }}
                >
                  {firm.name}
                </Link>
              );
            })}
          </div>
        </div>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <Link
            href={`/admin/denetimler/yeni${activeFirm !== "ALL" ? `?firmId=${encodeURIComponent(activeFirm)}` : ""}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "11px 16px",
              borderRadius: 12,
              background: "#991b1b",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 900,
              boxShadow: "0 8px 18px rgba(153,27,27,.18)",
            }}
          >
            + Web'den Yeni Denetim
          </Link>
        </div>
      </section>

      <ExecutiveHero
        activeFirmName={activeFirmName}
        totalInspections={filteredRuns.length}
        openDof={openDofItems.length}
        closedDof={closedDofItems.length}
        conformityRate={conformityRate}
        criticalFindings={criticalFindingItems.length}
      />

      {error && (
        <div
          style={{
            padding: 16,
            borderRadius: 18,
            background: "#fee2e2",
            color: "#991b1b",
            marginBottom: 20,
            fontWeight: 900,
            border: "1px solid #fecaca",
          }}
        >
          Denetimler alınamadı: {error.message}
        </div>
      )}

      <KPISection items={premiumKpis} />

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginBottom: 22,
        }}
      >
        <AnalysisCard
          title="Kayıt Sağlığı"
          value={emptyRunCount === 0 ? "Temiz" : `${emptyRunCount} uyarı`}
          description={emptyRunCount === 0 ? "Bulgu boş kayıt görünmüyor" : "Bulgu sayısı 0 olan kayıt var"}
          tone={emptyRunCount === 0 ? "good" : "bad"}
        />
        <AnalysisCard
          title="Firma Kapsamı"
          value={`${firmCount} firma`}
          description={activeFirm === "ALL" ? "Tüm firmalar izleniyor" : `${activeFirmName} filtresi aktif`}
          tone="neutral"
        />
        <AnalysisCard
          title="Ortalama Madde"
          value={`${avgAnswerPerRun}`}
          description="Denetim başına ortalama bulgu/madde"
          tone="neutral"
        />
      </section>



      <section style={{ marginBottom: 22 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: ".08em", color: "#7f1d1d" }}>
            DENETİM SONUÇLARI MERKEZİ
          </div>
          <h2 style={{ margin: "6px 0 4px", fontSize: 24 }}>Dört denetim tipinin sonuç görünümü</h2>
          <p style={{ margin: 0, color: "#64748b", fontWeight: 600 }}>
            Klasik ve fotoğraflı sonuçlar, puanlamalı skorlar ve ELMERI gözlemleri ayrı metodolojiyle gösterilir.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          <article style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 18 }}>
            <strong style={{ display: "block", marginBottom: 10 }}>Klasik / Fotoğraflı</strong>
            <div style={{ fontSize: 28, fontWeight: 1000 }}>%{conformityRate}</div>
            <div style={{ marginTop: 8, color: "#475569", fontWeight: 700 }}>
              {uygunCount} Uygun · {kismenCount} Kısmen · {uygunsuzCount} Uygunsuz
            </div>
            <div style={{ marginTop: 6, color: "#64748b", fontSize: 13 }}>
              Fotoğraflı modda {photoAnswerCount} madde kaydı
            </div>
          </article>

          <article style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 18 }}>
            <strong style={{ display: "block", marginBottom: 10 }}>Puanlamalı Denetim</strong>
            <div style={{ fontSize: 28, fontWeight: 1000 }}>
              {scoringAverage === null ? "Veri yok" : `${scoringAverage}/100`}
            </div>
            <div style={{ marginTop: 8, color: "#475569", fontWeight: 700 }}>
              {scoringFullCount} tam puan · {scoringImprovementCount} geliştirme gerekli
            </div>
            <div style={{ marginTop: 6, color: "#64748b", fontSize: 13 }}>
              {scoringAnswers.length} puanlanmış madde
            </div>
          </article>

          <article style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 18 }}>
            <strong style={{ display: "block", marginBottom: 10 }}>ELMERI Denetimi</strong>
            <div style={{ fontSize: 28, fontWeight: 1000 }}>
              {elmeriSuccessRate === null ? "Veri yok" : `%${elmeriSuccessRate}`}
            </div>
            <div style={{ marginTop: 8, color: "#475569", fontWeight: 700 }}>
              {elmeriCorrect} doğru · {elmeriWrong} hatalı · {elmeriOutOfScope} kapsam dışı
            </div>
            <div style={{ marginTop: 6, color: "#64748b", fontSize: 13 }}>
              {elmeriResults.length} ELMERI madde kaydı
            </div>
          </article>
        </div>
      </section>

      <AnalyticsSection
        totalInspections={filteredRuns.length}
        totalAnswers={totalAnswers}
        suitable={uygunCount}
        partial={kismenCount}
        unsuitable={uygunsuzCount}
        openDof={openDofItems.length}
        closedDof={closedDofItems.length}
        closureRate={dofClosureRate}
        typeDistribution={typeDistribution}
        companyPerformance={companyAnalytics}
      />

      <DoraExecutive
        activeFirmName={activeFirmName}
        totalInspections={filteredRuns.length}
        totalAnswers={totalAnswers}
        suitable={uygunCount}
        partial={kismenCount}
        unsuitable={uygunsuzCount}
        openDof={openDofItems.length}
        closedDof={closedDofItems.length}
        emptyRunCount={emptyRunCount}
        topCompany={topDoraCompany}
        dofHref={makeDofQuery(activeType, activeFirm, "open")}
      />

      <DofCommandCenter
        items={dofViewItems}
        allCount={dofItems.length}
        openCount={openDofItems.length}
        closedCount={closedDofItems.length}
        closureRate={dofClosureRate}
        activeStatus={activeDofStatus}
        activePriority={activeDofPriority}
        allHref={makeDofQuery(activeType, activeFirm)}
        openHref={makeDofQuery(activeType, activeFirm, "open")}
        closedHref={makeDofQuery(activeType, activeFirm, "closed")}
        criticalHref={makeDofQuery(
          activeType,
          activeFirm,
          "",
          "critical"
        )}
        overdueHref={`${makeDofQuery(activeType, activeFirm, "open").replace("#dof", "")}&due=OVERDUE#dof`}
        upcomingHref={`${makeDofQuery(activeType, activeFirm, "open").replace("#dof", "")}&due=UPCOMING#dof`}
        overdueCount={overdueDofItems.length}
        upcomingCount={upcomingDofItems.length}
        activeDue={activeDofDue}
        closeAction={closeDofAction}
        pagination={
          dofTotalPages > 1 ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                marginTop: 18,
              }}
            >
              {Array.from({ length: dofTotalPages }, (_, index) => index + 1).map(
                (page) => {
                  const selected = page === safeDofPage;
                  return (
                    <Link
                      key={page}
                      href={makePagedQuery(
                        activeType,
                        activeFirm,
                        page,
                        safeRunPage,
                        activeTab || "dof",
                        activeDofStatus,
                        activeDofPriority
                      )}
                      style={{
                        minWidth: 36,
                        height: 36,
                        padding: "0 10px",
                        borderRadius: 10,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textDecoration: "none",
                        fontWeight: 900,
                        border: selected ? "1px solid #991b1b" : "1px solid #e5e7eb",
                        background: selected ? "#b91c1c" : "#fff",
                        color: selected ? "#fff" : "#374151",
                      }}
                    >
                      {page}
                    </Link>
                  );
                }
              )}
            </div>
          ) : null
        }
      />

      <InspectionCards
        items={inspectionViewItems}
        deleteAction={deleteDenetimAction}
        pagination={
          runTotalPages > 1 ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                marginTop: 18,
              }}
            >
              {Array.from({ length: runTotalPages }, (_, index) => index + 1).map(
                (page) => {
                  const selected = page === safeRunPage;
                  return (
                    <Link
                      key={page}
                      href={makePagedQuery(
                        activeType,
                        activeFirm,
                        safeDofPage,
                        page,
                        activeTab,
                        activeDofStatus,
                        activeDofPriority
                      )}
                      style={{
                        minWidth: 36,
                        height: 36,
                        padding: "0 10px",
                        borderRadius: 10,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textDecoration: "none",
                        fontWeight: 900,
                        border: selected ? "1px solid #991b1b" : "1px solid #e5e7eb",
                        background: selected ? "#b91c1c" : "#fff",
                        color: selected ? "#fff" : "#374151",
                      }}
                    >
                      {page}
                    </Link>
                  );
                }
              )}
            </div>
          ) : null
        }
      />

      {activeTab === "dof" && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.requestAnimationFrame(function () {
                var target = document.getElementById("dof");
                if (target) {
                  target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                  });
                }
              });
            `,
          }}
        />
      )}

      <style>{`
@media (max-width:900px){

main{
padding:12px !important;
}

section{
max-width:100%;
overflow-x:auto;
}

}
`}</style>
    </main>
  );
}