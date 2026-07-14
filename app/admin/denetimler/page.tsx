import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { CSSProperties, ReactNode } from "react";
import ExecutiveHero from "@/components/inspection-v2/ExecutiveHero";
import FilterToolbar, {
  type InspectionFirmOption,
} from "@/components/inspection-v2/FilterToolbar";
import KPISection, {
  type InspectionKpiItem,
} from "@/components/inspection-v2/KPISection";
import AnalyticsSection from "../../../components/inspection-v2/AnalyticsSection";
import DoraExecutive from "../../../components/inspection-v2/DoraExecutive";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function modeLabel(mode?: string | null) {
  const m = String(mode || "").toUpperCase();

  if (m.includes("FOTO") || m.includes("PHOTO")) return "Fotoğraflı";
  if (m.includes("PUAN") || m.includes("SCOR") || m.includes("SKOR")) return "Puanlamalı";
  if (m.includes("ELMERI")) return "ELMERI";
  return "Klasik";
}

function modeColor(mode?: string | null) {
  const label = modeLabel(mode);

  if (label === "Fotoğraflı") return { bg: "#eff6ff", color: "#1d4ed8" };
  if (label === "Puanlamalı") return { bg: "#fff7ed", color: "#c2410c" };
  if (label === "ELMERI") return { bg: "#f0fdf4", color: "#15803d" };

  return { bg: "#f1f5f9", color: "#334155" };
}

function formatDate(value?: number | string | null) {
  if (!value) return "-";

  const numeric = Number(value);
  const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("tr-TR");
}

function cleanFirmName(name?: string | null) {
  const v = String(name || "").trim();
  if (!v) return "Firma Ünvanı Yok";
  if (v.toLowerCase() === "firma") return "Firma Ünvanı Yok";
  return v;
}

function normalizeFirmKey(value?: string | null) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

function makeQuery(type: string, firm: string) {
  const params = new URLSearchParams();

  if (type && type !== "ALL") params.set("type", type);
  if (firm && firm !== "ALL") params.set("firm", firm);

  const q = params.toString();
  return q ? `/admin/denetimler?${q}` : "/admin/denetimler";
}

function makePagedQuery(
  type: string,
  firm: string,
  dofPage: number,
  runPage: number,
  tab = "",
  status = "",
  priority = ""
) {
  const params = new URLSearchParams();

  if (type && type !== "ALL") params.set("type", type);
  if (firm && firm !== "ALL") params.set("firm", firm);
  if (dofPage > 1) params.set("dofPage", String(dofPage));
  if (runPage > 1) params.set("runPage", String(runPage));
  if (tab) params.set("tab", tab);
  if (status) params.set("status", status);
  if (priority) params.set("priority", priority);

  const q = params.toString();
  const hash = tab === "dof" ? "#dof" : "";

  return q
    ? `/admin/denetimler?${q}${hash}`
    : `/admin/denetimler${hash}`;
}

function makeDofQuery(
  type: string,
  firm: string,
  status = "",
  priority = ""
) {
  const params = new URLSearchParams();

  if (type && type !== "ALL") params.set("type", type);
  if (firm && firm !== "ALL") params.set("firm", firm);

  params.set("tab", "dof");

  if (status) params.set("status", status);
  if (priority) params.set("priority", priority);

  return `/admin/denetimler?${params.toString()}#dof`;
}

async function deleteDenetimAction(formData: FormData) {
  "use server";

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
  const isMobile = false;
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

  const { data: companies } = await supabase
  .from("companies")
  .select("id, name")
  .order("name", { ascending: true });

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

function normalizeText(value?: string | null) {
  return String(value || "").trim().toUpperCase();
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
          desc={emptyRunCount === 0 ? "Bulgu boş kayıt görünmüyor" : "Bulgu sayısı 0 olan kayıt var"}
          tone={emptyRunCount === 0 ? "good" : "bad"}
        />
        <AnalysisCard
          title="Firma Kapsamı"
          value={`${firmCount} firma`}
          desc={activeFirm === "ALL" ? "Tüm firmalar izleniyor" : `${activeFirmName} filtresi aktif`}
          tone="neutral"
        />
        <AnalysisCard
          title="Ortalama Madde"
          value={`${avgAnswerPerRun}`}
          desc="Denetim başına ortalama bulgu/madde"
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

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16,
          marginBottom: 22,
        }}
      >
        <MiniPanel title="Tür Dağılımı">
          <MiniRow label="Klasik" value={klasikCount} total={filteredRuns.length} color="#334155" />
          <MiniRow label="Fotoğraflı" value={fotografliCount} total={filteredRuns.length} color="#1d4ed8" />
          <MiniRow label="Puanlamalı" value={puanCount} total={filteredRuns.length} color="#c2410c" />
          <MiniRow label="ELMERI" value={elmeriCount} total={filteredRuns.length} color="#15803d" />
        </MiniPanel>

        <MiniPanel title="Firma Bazlı İlk 5">
          {topFirmStats.length === 0 ? (
            <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13 }}>
              Firma kaydı yok.
            </div>
          ) : (
            topFirmStats.map((f) => (
              <MiniRow
                key={f.firm}
                label={f.firm}
                value={f.count}
                total={filteredRuns.length}
                color="#5a0f1f"
                desc={`${f.answers} madde`}
              />
            ))
          )}
        </MiniPanel>
      </section>

      <section
        id="dof"
        style={{
          scrollMarginTop: 20,
          background: "#fff",
          borderRadius: 26,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          boxShadow: "0 18px 54px rgba(15,23,42,0.06)",
          marginBottom: 22,
        }}
      >
        <div
          style={{
            padding: "20px 22px",
            borderBottom: "1px solid #eef2f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <div>
            <div style={{ fontSize: 21, fontWeight: 1000, color: "#111827" }}>
              DÖF Takip Merkezi
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: "#64748b", fontWeight: 650 }}>
              Denetimlerde tespit edilen uygunsuzluk ve kısmen uygun maddelerden oluşan düzeltici/önleyici faaliyet kayıtları.
            </div>

            {(activeDofStatus || activeDofPriority) && (
              <div
                style={{
                  display: "inline-flex",
                  marginTop: 9,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1d4ed8",
                  fontSize: 11,
                  fontWeight: 1000,
                }}
              >
                Aktif filtre:
                {activeDofPriority === "CRITICAL"
                  ? " Kritik DÖF"
                  : activeDofStatus === "OPEN"
                  ? " Açık DÖF"
                  : activeDofStatus === "CLOSED"
                  ? " Kapalı DÖF"
                  : " DÖF"}
              </div>
            )}
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: openDofItems.length > 0 ? "#fff7ed" : "#f0fdf4",
              border: openDofItems.length > 0 ? "1px solid #fed7aa" : "1px solid #bbf7d0",
              color: openDofItems.length > 0 ? "#c2410c" : "#15803d",
              fontSize: 12,
              fontWeight: 1000,
              whiteSpace: "nowrap",
            }}
          >
            Açık: {openDofItems.length} • Kapalı: {closedDofItems.length}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            padding: "14px 18px",
            borderBottom: "1px solid #eef2f7",
            background: "#ffffff",
          }}
        >
          <FilterPill
            href={makeDofQuery(activeType, activeFirm)}
            active={!activeDofStatus && !activeDofPriority}
            label="Tüm DÖF"
          />
          <FilterPill
            href={makeDofQuery(activeType, activeFirm, "open")}
            active={activeDofStatus === "OPEN" && !activeDofPriority}
            label="Açık DÖF"
          />
          <FilterPill
            href={makeDofQuery(activeType, activeFirm, "closed")}
            active={activeDofStatus === "CLOSED"}
            label="Kapalı DÖF"
          />
          <FilterPill
            href={makeDofQuery(activeType, activeFirm, "", "critical")}
            active={activeDofPriority === "CRITICAL"}
            label="Kritik DÖF"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            padding: 18,
            borderBottom: "1px solid #eef2f7",
            background: "#fbfbfd",
          }}
        >
          <DofDashCard title="Toplam DÖF" value={dofItems.length} desc="Tüm faaliyetler" tone="neutral" />
          <DofDashCard title="Açık DÖF" value={openDofItems.length} desc="Kapanış bekliyor" tone="warning" />
          <DofDashCard title="Kapalı DÖF" value={closedDofItems.length} desc="Tamamlanan" tone="good" />
          <DofDashCard title="Kapanma Oranı" value={`%${dofClosureRate}`} desc="Kapalı / toplam" tone="neutral" />
        </div>

        {filteredDofItems.length === 0 ? (
          <div style={{ padding: 28, color: "#64748b", fontWeight: 800, textAlign: "center" }}>
            {dofItems.length === 0
              ? "Henüz DÖF kaydı yok."
              : "Seçilen DÖF filtresine uygun kayıt bulunamadı."}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10, padding: 18 }}>
            {pagedDofItems.map((a: any, index: number) => {
              const status = normalizeDofStatusFromAnswer(a);
              const isClosed = status === "CLOSED";

              const relatedRun = safeRuns.find(
                (r: any) => Number(r.id) === Number(a.run_remote_id)
              );

              return (
                <div
                  key={`${a.run_remote_id}-${a.item_title || a.itemTitle}-${index}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
  "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: 12,
                    alignItems: "center",
                    padding: 14,
                    borderRadius: 18,
                    border: "1px solid #e5e7eb",
                    background: isClosed ? "#f8fafc" : "#fff7ed",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 1000, color: "#111827" }}>
                      {relatedRun ? getRunFirmName(relatedRun) : "Firma Ünvanı Yok"}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800, marginTop: 4 }}>
                      Run: {a.run_remote_id} • {modeLabel(relatedRun?.eval_mode)}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontWeight: 900, color: "#334155" }}>
                      {a.item_title || a.itemTitle || "-"}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginTop: 4 }}>
                      {a.dof_note || a.dofNote || a.note || "DÖF notu girilmemiş"}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "inline-flex",
                      justifyContent: "center",
                      padding: "7px 10px",
                      borderRadius: 999,
                      background: isClosed ? "#dcfce7" : "#fed7aa",
                      color: isClosed ? "#15803d" : "#c2410c",
                      fontSize: 12,
                      fontWeight: 1000,
                    }}
                  >
                    {isClosed ? "Kapalı" : "Açık"}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Link
                      href={`/admin/denetimler/${a.run_remote_id}`}
                      style={buttonStyle("primary")}
                    >
                      Denetime Git
                    </Link>

                    {!isClosed && (
                      <form action={closeDofAction}>
                        <input type="hidden" name="answerId" value={a.id || ""} />
                        <input type="hidden" name="runRemoteId" value={a.run_remote_id || ""} />
                        <input type="hidden" name="itemTitle" value={a.item_title || a.itemTitle || ""} />

                        <button
                          type="submit"
                          style={{
                            padding: "9px 12px",
                            borderRadius: 12,
                            background: "#dcfce7",
                            color: "#15803d",
                            border: "1px solid #bbf7d0",
                            fontWeight: 1000,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          DÖF Kapat
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredDofItems.length > dofPageSize && (
          <Pagination
            currentPage={safeDofPage}
            totalPages={dofTotalPages}
            makeHref={(page) =>
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
        )}
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: 26,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          boxShadow: "0 18px 54px rgba(15,23,42,0.06)",
        }}
      >
        <div
          style={{
            padding: "20px 22px",
            borderBottom: "1px solid #eef2f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <div>
            <div style={{ fontSize: 21, fontWeight: 1000, color: "#111827" }}>
              Denetim Kayıtları
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "#64748b",
                fontWeight: 650,
              }}
            >
              Firma, tür, şablon, denetçi, tarih, bulgu sayısı ve işlem alanı
            </div>
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              color: "#334155",
              fontSize: 12,
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {filteredRuns.length} kayıt
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
"repeat(7,minmax(140px,1fr))",
overflowX: "auto",
            padding: "14px 22px",
            background: "#f8fafc",
            fontWeight: 1000,
            fontSize: 12,
            color: "#334155",
            letterSpacing: "0.2px",
          }}
        >
          <div>Firma</div>
          <div>Tür</div>
          <div>Şablon</div>
          <div>Denetçi</div>
          <div>Tarih</div>
          <div>Madde</div>
          <div>İşlem</div>
        </div>

        {filteredRuns.length === 0 ? (
          <div
            style={{
              padding: 34,
              color: "#64748b",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            Seçilen filtreye uygun denetim kaydı yok.
          </div>
        ) : (
          pagedRuns.map((r: any, index: number) => {
            const mode = modeLabel(r.eval_mode);
            const colors = modeColor(r.eval_mode);
            const detailId = r.id;
            const answerCount = countByRun.get(Number(r.id)) || 0;
            const firmName = getRunFirmName(r);
            const dofCount = dofCountByRun.get(Number(r.id)) || 0;

            return (
              <div
                key={r.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
"repeat(7,minmax(140px,1fr))",
overflowX: "auto",
                  padding: "17px 22px",
                  borderTop: "1px solid #eef2f7",
                  alignItems: "center",
                  fontSize: 14,
                  gap: 10,
                  background: index % 2 === 0 ? "#ffffff" : "#fbfbfd",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 1000,
                      color: "#111827",
                      marginBottom: 4,
                    }}
                  >
                    {firmName}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: answerCount === 0 ? "#dc2626" : "#64748b",
                      fontWeight: 800,
                    }}
                  >
                    App Run ID: {r.app_run_id || "-"} • Remote ID: {r.id}
                    {answerCount === 0 ? " • Bulgu yok" : ""}
                  </div>
                </div>

                <div>
                  <span
                    style={{
                      display: "inline-flex",
                      padding: "7px 10px",
                      borderRadius: 999,
                      background: colors.bg,
                      color: colors.color,
                      fontWeight: 1000,
                      fontSize: 12,
                    }}
                  >
                    {mode}
                  </span>
                </div>

                <div style={{ fontWeight: 850, color: "#334155" }}>
                  {r.template_type || "-"}
                </div>

                <div style={{ color: "#334155", fontWeight: 750 }}>
                  {r.inspector_name || "-"}
                </div>

                <div style={{ color: "#334155", fontWeight: 750 }}>
                  {formatDate(r.audit_date_millis || r.created_at_millis)}
                </div>

                <div
                  style={{
                    fontWeight: 1000,
                    color: answerCount === 0 ? "#dc2626" : "#5a0f1f",
                    fontSize: 16,
                  }}
                >
                  <div>{answerCount}</div>
                  {dofCount > 0 && (
                    <div style={{ fontSize: 11, color: "#c2410c", fontWeight: 1000, marginTop: 4 }}>
                      DÖF: {dofCount}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link href={`/admin/denetimler/${detailId}`} style={buttonStyle("primary")}>
                    Detay
                  </Link>

                  <Link
                    href={`/admin/denetimler/${detailId}/print`}
                    target="_blank"
                    style={buttonStyle("dark")}
                  >
                    App Raporu
                  </Link>

                  <Link href={`/admin/denetimler/${r.id}/edit`} style={buttonStyle("warning")}>
                    Düzenle
                  </Link>

                  <form action={deleteDenetimAction}>
                    <input type="hidden" name="remoteId" value={r.id} />
                    <button
                      type="submit"
                      style={{
                        padding: "9px 12px",
                        borderRadius: 12,
                        background: "#fee2e2",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                        fontWeight: 1000,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Sil
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        )}

        {filteredRuns.length > runPageSize && (
          <Pagination
            currentPage={safeRunPage}
            totalPages={runTotalPages}
            makeHref={(page) =>
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
        )}
      </section>
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

function buttonStyle(type: "primary" | "dark" | "warning"): CSSProperties {
  if (type === "dark") {
    return {
      padding: "9px 12px",
      borderRadius: 12,
      background: "#111827",
      color: "#fff",
      textDecoration: "none",
      fontWeight: 1000,
      textAlign: "center",
      fontSize: 13,
    };
  }

  if (type === "warning") {
    return {
      padding: "9px 12px",
      borderRadius: 12,
      background: "#fff7ed",
      color: "#9a3412",
      border: "1px solid #fed7aa",
      fontWeight: 1000,
      fontSize: 13,
      textDecoration: "none",
    };
  }

  return {
    padding: "9px 12px",
    borderRadius: 12,
    background: "linear-gradient(135deg, #5a0f1f, #c62828)",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 1000,
    textAlign: "center",
    fontSize: 13,
  };
}

function Kpi({
  title,
  value,
  desc,
  href,
}: {
  title: string;
  value: number;
  desc: string;
  href: string;
}) {
  return (
    <Link href={href} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 22,
          padding: 20,
          border: "1px solid #e5e7eb",
          boxShadow: "0 14px 38px rgba(15,23,42,0.05)",
        }}
      >
        <div style={{ color: "#64748b", fontSize: 13, fontWeight: 900 }}>
          {title}
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 1000,
            marginTop: 8,
            color: "#111827",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            marginTop: 8,
            color: "#94a3b8",
            fontSize: 12,
            fontWeight: 750,
          }}
        >
          {desc}
        </div>
      </div>
    </Link>
  );
}

function AnalysisCard({
  title,
  value,
  desc,
  tone,
}: {
  title: string;
  value: string;
  desc: string;
  tone: "good" | "bad" | "neutral";
}) {
  const color = tone === "good" ? "#15803d" : tone === "bad" ? "#b91c1c" : "#5a0f1f";
  const bg = tone === "good" ? "#f0fdf4" : tone === "bad" ? "#fee2e2" : "#fff7f7";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 22,
        padding: 20,
        border: "1px solid #e5e7eb",
        boxShadow: "0 14px 38px rgba(15,23,42,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 900 }}>{title}</div>
          <div style={{ color, fontSize: 24, fontWeight: 1000, marginTop: 6 }}>{value}</div>
          <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 750, marginTop: 6 }}>{desc}</div>
        </div>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 16,
            background: bg,
            color,
            display: "grid",
            placeItems: "center",
            fontWeight: 1000,
          }}
        >
          ●
        </div>
      </div>
    </div>
  );
}

function DofDashCard({
  title,
  value,
  desc,
  tone,
}: {
  title: string;
  value: number | string;
  desc: string;
  tone: "good" | "warning" | "neutral";
}) {
  const color = tone === "good" ? "#15803d" : tone === "warning" ? "#c2410c" : "#5a0f1f";
  const bg = tone === "good" ? "#f0fdf4" : tone === "warning" ? "#fff7ed" : "#fff7f7";

  return (
    <div
      style={{
        borderRadius: 20,
        padding: 16,
        background: bg,
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 900, color: "#64748b" }}>
        {title}
      </div>
      <div style={{ marginTop: 8, fontSize: 30, fontWeight: 1000, color }}>
        {value}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, fontWeight: 750, color: "#64748b" }}>
        {desc}
      </div>
    </div>
  );
}

function MiniPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      style={{
        background: "#fff",
        borderRadius: 24,
        padding: 18,
        border: "1px solid #e5e7eb",
        boxShadow: "0 14px 38px rgba(15,23,42,0.05)",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 1000, color: "#111827", marginBottom: 14 }}>
        {title}
      </div>
      <div style={{ display: "grid", gap: 12 }}>{children}</div>
    </section>
  );
}

function MiniRow({
  label,
  value,
  total,
  color,
  desc,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  desc?: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          fontSize: 13,
          fontWeight: 900,
        }}
      >
        <span style={{ color: "#334155" }}>{label}</span>
        <span style={{ color }}>
          {value} kayıt {desc ? `• ${desc}` : ""}
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: "#f1f5f9",
          borderRadius: 999,
          overflow: "hidden",
          marginTop: 7,
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background: color,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  makeHref,
}: {
  currentPage: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        justifyContent: "center",
        flexWrap: "wrap",
        padding: "16px 18px 20px",
        borderTop: "1px solid #eef2f7",
      }}
    >
      {Array.from({ length: totalPages }).map((_, i) => {
        const page = i + 1;
        const active = page === currentPage;

        return (
          <Link
            key={page}
            href={makeHref(page)}
            style={{
              minWidth: 38,
              height: 38,
              display: "grid",
              placeItems: "center",
              borderRadius: 12,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 1000,
              background: active ? "linear-gradient(135deg, #5a0f1f, #c62828)" : "#fff",
              color: active ? "#fff" : "#5a0f1f",
              border: active ? "1px solid rgba(90,15,31,0.2)" : "1px solid #ead5d5",
            }}
          >
            {page}
          </Link>
        );
      })}
    </div>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        padding: "10px 14px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 1000,
        background: active ? "linear-gradient(135deg, #5a0f1f, #c62828)" : "#fff",
        color: active ? "#fff" : "#5a0f1f",
        border: active ? "1px solid rgba(90,15,31,0.2)" : "1px solid #ead5d5",
        boxShadow: active ? "0 10px 24px rgba(90,15,31,0.18)" : "none",
      }}
    >
      {label}
    </Link>
    
  );
}