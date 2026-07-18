import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import ExecutiveHero from "../../../components/inspection-v2/ExecutiveHero";
import FilterToolbar, {
  type InspectionFirmOption,
} from "../../../components/inspection-v2/FilterToolbar";
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
import Pagination from "../../../components/inspection-v2/Pagination";
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
  if (!remoteId) return;

  const supabase = getSupabase();

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
    dofPage?: string;
    runPage?: string;
    tab?: string;
    status?: string;
    priority?: string;
  }>;
}) {
  const sp = await searchParams;
  const activeType = String(sp?.type || "ALL").toUpperCase();
  const activeFirm = String(sp?.firm || "ALL");
  const activeTab = String(sp?.tab || "").trim().toLowerCase();
  const activeDofStatus = String(sp?.status || "").trim().toUpperCase();
  const activeDofPriority = String(sp?.priority || "").trim().toUpperCase();

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
  const isCompanyScoped =
    sessionRole === "company_admin" || sessionRole === "demo_user";

  if (isCompanyScoped && !sessionCompanyId) {
    redirect("/login");
  }

  let scopedRunFirmId = sessionCompanyId;

  if (isCompanyScoped) {
    const { data: scopedCompany } = await supabase
      .from("companies")
      .select("id, local_firm_id")
      .eq("id", sessionCompanyId)
      .maybeSingle();

    scopedRunFirmId = String(
      scopedCompany?.local_firm_id ?? scopedCompany?.id ?? sessionCompanyId
    ).trim();
  }

  let runsQuery = supabase
    .from("denetim_runs")
    .select("*")
    .order("inserted_at", { ascending: false });

  if (isCompanyScoped) {
    runsQuery = runsQuery.eq("firm_id", scopedRunFirmId);
  }

  const { data: runs, error } = await runsQuery;

  const safeRuns = runs || [];
  const runIds = safeRuns.map((r: any) => r.id);

  const { data: answers } = runIds.length
    ? await supabase
        .from("denetim_answers")
        .select("*")
        .in("run_remote_id", runIds)
    : { data: [] as any[] };

  const answerList = answers || [];

  let companiesQuery = supabase
    .from("companies")
    .select("id, name")
    .order("name", { ascending: true });

  if (isCompanyScoped) {
    companiesQuery = companiesQuery.eq("id", sessionCompanyId);
  }

  const { data: companies } = await companiesQuery;

const companyList = companies || [];

const companyNameById = new Map<string, string>();
companyList.forEach((c: any) => {
  const id = String(c.id || "").trim();
  const name = cleanFirmName(c.name);
  if (id) companyNameById.set(id, name);
});

function getRunFirmId(run: any) {
  return String(run.firm_id || "").trim();
}

function getRunFirmName(run: any) {
  const firmId = getRunFirmId(run);
  return cleanFirmName(companyNameById.get(firmId) || run.firm_name);
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
    result === "UYGUNSUZ" ||
    result.includes("YETERSIZ") ||
    result.includes("YETERSİZ") ||
    result.includes("EKSIK") ||
    result.includes("EKSİK")
  ) {
    return true;
  }

  if (result.startsWith("SCORE:")) {
    const score = Number(result.replace("SCORE:", ""));
    return Number.isFinite(score) && score < 70;
  }

  if (result.startsWith("ELMERI:")) {
    const parts = result.split(":");
    const wrong = Number(parts[2] || 0);
    return Number.isFinite(wrong) && wrong > 0;
  }

  return false;
}

const firmMap = new Map<string, { id: string; name: string }>();

safeRuns.forEach((r: any) => {
  const firmId = String(r.firm_id || "").trim();

  let firmName =
    cleanFirmName(
      companyNameById.get(firmId) ||
      r.firm_name ||
      r.firma_adi
    );

  if (!firmName || firmName === "Firma Ünvanı Yok") return;

  const key = firmId || firmName;

  if (!firmMap.has(key)) {
    firmMap.set(key, {
      id: key,
      name: firmName,
    });
  }
});

const firmOptions = Array.from(firmMap.values()).sort((a, b) =>
  a.name.localeCompare(b.name, "tr")
);

const activeFirmName =
  activeFirm === "ALL"
    ? "Tüm Firmalar"
    : firmOptions.find(
        (firm) =>
          normalizeFirmKey(firm.id) === normalizeFirmKey(activeFirm) ||
          normalizeFirmKey(firm.name) === normalizeFirmKey(activeFirm)
      )?.name || activeFirm;

const filteredRuns = safeRuns.filter((r: any) => {
  const label = modeLabel(r.eval_mode).toUpperCase();
  const firmId = getRunFirmId(r);

  const typeOk =
    activeType === "ALL" ||
    (activeType === "KLASIK" && label === "KLASIK") ||
    (activeType === "FOTO" && label === "FOTOĞRAFLI") ||
    (activeType === "PUAN" && label === "PUANLAMALI") ||
    (activeType === "ELMERI" && label === "ELMERI");

  const firmName = getRunFirmName(r);

const firmOk =
  activeFirm === "ALL" ||
  normalizeFirmKey(firmId) === normalizeFirmKey(activeFirm) ||
  normalizeFirmKey(firmName) === normalizeFirmKey(activeFirm);

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

  return statusOk && priorityOk;
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
        (firm) =>
          normalizeFirmKey(firm.id) === normalizeFirmKey(activeFirm) ||
          normalizeFirmKey(firm.name) === normalizeFirmKey(activeFirm)
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
    { title: "Uygunsuz", value: uygunsuzCount, description: "Kritik bulgu", href: makeQuery(activeType, activeFirm), tone: "red" },
    { title: "Açık DÖF", value: openDofItems.length, description: "Takip bekliyor", href: makeDofQuery(activeType, activeFirm, "open"), tone: "red", badge: openDofItems.length > 0 ? "Aksiyon" : "Kontrollü" },
    { title: "Kapalı DÖF", value: closedDofItems.length, description: "Tamamlanan faaliyet", href: makeDofQuery(activeType, activeFirm, "closed"), tone: "green" },
  ];

  const conformityRate =
    totalAnswers > 0 ? Math.round((uygunCount / totalAnswers) * 100) : 100;


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
        matchingAnswers.length > 0
          ? Math.round(
              (matchingSuitable / matchingAnswers.length) * 100
            )
          : 100,
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
      <ExecutiveHero
        activeFirmName={activeFirmName}
        totalInspections={filteredRuns.length}
        openDof={openDofItems.length}
        closedDof={closedDofItems.length}
        conformityRate={conformityRate}
        criticalFindings={uygunsuzCount}
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

      <FilterToolbar
        activeFirm={activeFirm}
        activeFirmName={activeFirmName}
        activeType={activeType}
        firms={firmOptions}
        makeFirmHref={(firm: string) => makeQuery(activeType, firm)}
        isActiveFirm={(firm: InspectionFirmOption) =>
          normalizeFirmKey(activeFirm) === normalizeFirmKey(firm.id) ||
          normalizeFirmKey(activeFirm) === normalizeFirmKey(firm.name)
        }
      />

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
        closeAction={closeDofAction}
        pagination={
          <Pagination
            currentPage={safeDofPage}
            totalPages={dofTotalPages}
            makeHref={(page: number) =>
              makePagedQuery(
                activeType,
                activeFirm,
                page,
                safeRunPage,
                activeTab || "dof",
                activeDofStatus,
                activeDofPriority
              )
            }
          />
        }
      />

      <InspectionCards
        items={inspectionViewItems}
        deleteAction={deleteDenetimAction}
        pagination={
          <Pagination
            currentPage={safeRunPage}
            totalPages={runTotalPages}
            makeHref={(page: number) =>
              makePagedQuery(
                activeType,
                activeFirm,
                safeDofPage,
                page,
                activeTab,
                activeDofStatus,
                activeDofPriority
              )
            }
          />
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