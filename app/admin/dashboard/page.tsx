"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Building2,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  HeartPulse,
  ShieldAlert,
  Siren,
  Stethoscope,
  UserRoundPlus,
} from "lucide-react";

import { DashboardV3 } from "@/components/dashboard-v3";


import type {
  Training,
  RiskUser,
  DashboardSummary,
  CompanyDistributionItem,
  TrendItem,
  DashboardResponse,
  MeResponse,
  DashboardActivity,
  UpcomingTraining,
  UpcomingHealth,
  UpcomingInspection,
  UpcomingPeriodicControl,
  DofSummary,
  RiskSummary,
  DoraSummary,
} from "@/components/dashboard/types";

import ChartsSection from "@/components/dashboard/ChartsSection";
import ExecutiveSection from "@/components/dashboard/ExecutiveSection";
import ListsSection from "@/components/dashboard/ListsSection";
import { BRAND } from "../../../components/dashboard/styles";

import {
  calculateTotals,
  calculateRates,
  buildCeoSummary,
} from "../../../components/dashboard/dashboardHelpers";

function normalizeCompanyKey(value?: string | null) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

function withFirmParam(
  path: string,
  firm?: string | null
) {
  const normalizedFirm = normalizeCompanyKey(firm);

  if (!firm || normalizedFirm === "all") {
    return path;
  }

  const [basePath, hash = ""] = path.split("#");
  const separator = basePath.includes("?") ? "&" : "?";
  const href = `${basePath}${separator}firm=${encodeURIComponent(
    String(firm).trim()
  )}`;

  return hash ? `${href}#${hash}` : href;
}


export default function AdminDashboardPage() {
  const [adminRole, setAdminRole] = useState<string>("");
  const [adminCompanyId, setAdminCompanyId] = useState<string>("");
  const [inspectionSummary, setInspectionSummary] = useState<any>(null);

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [riskyUsers, setRiskyUsers] = useState<RiskUser[]>([]);
  const [inProgressUsers, setInProgressUsers] = useState<RiskUser[]>([]);
  const [completedUsers, setCompletedUsers] = useState<RiskUser[]>([]);
  const [companyDistribution, setCompanyDistribution] = useState<
  CompanyDistributionItem[]
>([]);
const [companyList, setCompanyList] = useState<string[]>([]);
const [trend, setTrend] = useState<TrendItem[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [upcomingTrainings, setUpcomingTrainings] = useState<
  {
    id: string;
    title: string;
    company: string;
    date: string;
  }[]
>([]);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);

const [upcomingHealths, setUpcomingHealths] = useState<UpcomingHealth[]>([]);
const [upcomingInspections, setUpcomingInspections] = useState<UpcomingInspection[]>([]);
const [upcomingPeriodicControls, setUpcomingPeriodicControls] = useState<UpcomingPeriodicControl[]>([]);

const [dofSummary, setDofSummary] = useState<DofSummary | null>(null);
const [riskSummary, setRiskSummary] = useState<RiskSummary | null>(null);
const [doraSummary, setDoraSummary] = useState<DoraSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const [cbsSummary, setCbsSummary] = useState<{
    total: number;
    new: number;
    processing: number;
    read: number;
    closed: number;
    slaExceeded: number;
  } | null>(null);


  
  useEffect(() => {
    const loadAdminContext = async () => {
      try {
        const res = await fetch("/api/admin/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setAdminRole("");
          setAdminCompanyId("");
          return;
        }

        const json: MeResponse = await res.json().catch(() => ({}));

        setAdminRole(String(json?.user?.role || "").trim());
        setAdminCompanyId(String(json?.user?.company_id || "").trim());
      } catch (loadError) {
        console.error("admin me load error:", loadError);
        setAdminRole("");
        setAdminCompanyId("");
      }
    };

    void loadAdminContext();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/training-dashboard", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const json: DashboardResponse = await res.json();

      if (!res.ok) {
        setError(json?.error || "Veri alınamadı.");
       setTrainings([]);
setRiskyUsers([]);
setInProgressUsers([]);
setCompletedUsers([]);
setCompanyDistribution([]);
setCompanyList([]);
setTrend([]);
setSummary(null);
setActivities([]);
setUpcomingHealths([]);
setUpcomingPeriodicControls([]);
setDofSummary(null);
setRiskSummary(null);
setDoraSummary(null);
        return;
      }

     setTrainings(json.trainings || []);
setRiskyUsers(json.risky_users || []);
setInProgressUsers(json.in_progress_users || []);
setCompletedUsers(json.completed_users || []);
setCompanyDistribution(json.company_distribution || []);
setCompanyList(json.company_list || []);
setTrend(json.trend || []);
setSummary(json.summary || null);
setActivities(json.activities || []);
setUpcomingHealths(json.upcoming_healths || []);
setUpcomingPeriodicControls(json.upcoming_periodic_controls || []);
setDofSummary(json.dof_summary || null);
setRiskSummary(json.risk_summary || null);
setDoraSummary(json.dora_summary || null);
    } catch (loadError) {
      console.error(loadError);
      setError("Veri alınamadı.");
setTrainings([]);
setRiskyUsers([]);
setInProgressUsers([]);
setCompletedUsers([]);
setCompanyDistribution([]);
setCompanyList([]);
setTrend([]);
setSummary(null);
setActivities([]);
setUpcomingHealths([]);
setUpcomingPeriodicControls([]);
setDofSummary(null);
setRiskSummary(null);
setDoraSummary(null);
    } finally {
      setLoading(false);
    }
  };

const loadUpcomingTrainings = async () => {
  try {
    const res = await fetch("/api/admin/upcoming-trainings", {
      cache: "no-store",
      credentials: "include",
    });

    const json = await res.json();

    if (!res.ok) {
      setUpcomingTrainings([]);
      return;
    }

    setUpcomingTrainings(json.upcoming_trainings || []);
  } catch {
    setUpcomingTrainings([]);
  }
};

const loadUpcomingInspections = async () => {
  try {
    const res = await fetch("/api/admin/upcoming-inspections", {
      cache: "no-store",
      credentials: "include",
    });

    const json = await res.json();

    if (!res.ok) {
      setUpcomingInspections([]);
      return;
    }

    setUpcomingInspections(json.recent_inspections || []);
  } catch {
    setUpcomingInspections([]);
  }
};

  const loadCbs = async () => {
    try {
      const res = await fetch("/api/admin/cbs-dashboard", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setCbsSummary(null);
        return;
      }

      setCbsSummary(json.summary || null);
    } catch (loadError) {
      console.error("CBS load error:", loadError);
      setCbsSummary(null);
    }
  };

const loadInspectionDashboard = async (firm = "all") => {
  try {
    const params = new URLSearchParams();

    if (firm && normalizeCompanyKey(firm) !== "all") {
      params.set("firm", firm);
    }

    const query = params.toString();

    const endpoint = query
      ? `/api/admin/inspection-dashboard?${query}`
      : "/api/admin/inspection-dashboard";

    const res = await fetch(endpoint, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setInspectionSummary(null);
      return;
    }

    setInspectionSummary(json.summary || null);
  } catch (e) {
    console.error("Inspection dashboard:", e);
    setInspectionSummary(null);
  }
};

  useEffect(() => {
  void loadDashboard();
  void loadCbs();
  void loadInspectionDashboard("all");
  void loadUpcomingTrainings();
  void loadUpcomingInspections();
}, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 900);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const refreshAllDashboardData = () => {
    void loadDashboard();
    void loadCbs();
    void loadInspectionDashboard(effectiveSelectedCompany);
    void loadUpcomingTrainings();
    void loadUpcomingInspections();
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");

    const element = document.getElementById("admin-dashboard-pdf");
    if (!element) return;

    element.classList.add("dashboardPdfMode");

    const canvas = await html2canvas(element, {
      scale: 1.65,
      backgroundColor: "#f5f7fa",
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
    });

    element.classList.remove("dashboardPdfMode");

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const reportDate = new Intl.DateTimeFormat("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(new Date())
      .replaceAll(".", "-");

    pdf.save(`dsec-executive-dashboard-${reportDate}.pdf`);
  };

  const totals = useMemo(
  () => calculateTotals(trainings),
  [trainings]
);

  const {
  completionRate,
  inProgressRate,
  riskRate,
  riskStatus,
} = calculateRates(summary, totals);

 const companies = useMemo(() => {
  const companyMap = new Map<string, string>();

  const collect = (value?: string | null) => {
    const displayValue = String(value || "").trim();
    const key = normalizeCompanyKey(displayValue);

    if (!key || key === "firma yok") return;
    if (!companyMap.has(key)) {
      companyMap.set(key, displayValue);
    }
  };

  companyList.forEach(collect);
  riskyUsers.forEach((user) => collect(user.company_id));
  inProgressUsers.forEach((user) => collect(user.company_id));
  completedUsers.forEach((user) => collect(user.company_id));

  return Array.from(companyMap.values()).sort((a, b) =>
    a.localeCompare(b, "tr")
  );
}, [
  companyList,
  riskyUsers,
  inProgressUsers,
  completedUsers,
]);

  useEffect(() => {
    if (adminRole === "company_admin" && adminCompanyId) {
      const adminKey = normalizeCompanyKey(adminCompanyId);

      const matched =
        companies.find(
          (company) => normalizeCompanyKey(company) === adminKey
        ) || adminCompanyId;

      setSelectedCompany(matched);
    }
  }, [adminRole, adminCompanyId, companies]);

  const resolvedAdminCompany = useMemo(() => {
    if (!adminCompanyId) return "";

    const adminKey = normalizeCompanyKey(adminCompanyId);

    return (
      companies.find(
        (company) => normalizeCompanyKey(company) === adminKey
      ) || adminCompanyId
    );
  }, [adminCompanyId, companies]);

  const effectiveSelectedCompany =
    adminRole === "company_admin" && resolvedAdminCompany
      ? resolvedAdminCompany
      : selectedCompany;

  useEffect(() => {
    void loadInspectionDashboard(effectiveSelectedCompany);
  }, [effectiveSelectedCompany]);

  const normalizedDashboardSearch = dashboardSearch
    .trim()
    .toLocaleLowerCase("tr-TR");

  const matchesDashboardSearch = (user: RiskUser) => {
    if (!normalizedDashboardSearch) return true;

    const searchable = [
      user.full_name,
      user.email,
      user.company_id,
      user.training_title,
      user.status,
    ]
      .join(" ")
      .toLocaleLowerCase("tr-TR");

    return searchable.includes(normalizedDashboardSearch);
  };

  const matchesSelectedCompany = (user: RiskUser) => {
    if (normalizeCompanyKey(effectiveSelectedCompany) === "all") {
      return true;
    }

    return (
      normalizeCompanyKey(user.company_id || "Firma Yok") ===
      normalizeCompanyKey(effectiveSelectedCompany)
    );
  };

  const filteredRiskUsers = useMemo(
    () =>
      riskyUsers.filter(
        (user) =>
          matchesSelectedCompany(user) && matchesDashboardSearch(user)
      ),
    [
      riskyUsers,
      effectiveSelectedCompany,
      normalizedDashboardSearch,
    ]
  );

  const filteredInProgressUsers = useMemo(
    () =>
      inProgressUsers.filter(
        (user) =>
          matchesSelectedCompany(user) && matchesDashboardSearch(user)
      ),
    [
      inProgressUsers,
      effectiveSelectedCompany,
      normalizedDashboardSearch,
    ]
  );

  const filteredCompletedUsers = useMemo(
    () =>
      completedUsers.filter(
        (user) =>
          matchesSelectedCompany(user) && matchesDashboardSearch(user)
      ),
    [
      completedUsers,
      effectiveSelectedCompany,
      normalizedDashboardSearch,
    ]
  );

  const hasActiveDashboardFilter =
    normalizeCompanyKey(effectiveSelectedCompany) !== "all" ||
    normalizedDashboardSearch.length > 0;

  const scopedTotals = useMemo(() => {
    if (!hasActiveDashboardFilter) {
      return totals;
    }

    const completed = filteredCompletedUsers.length;
    const inProgress = filteredInProgressUsers.length;
    const notStarted = filteredRiskUsers.length;

    return {
      assigned: completed + inProgress + notStarted,
      completed,
      inProgress,
      notStarted,
    };
  }, [
    hasActiveDashboardFilter,
    totals,
    filteredCompletedUsers,
    filteredInProgressUsers,
    filteredRiskUsers,
  ]);

  const scopedCompletionRate = scopedTotals.assigned
    ? (scopedTotals.completed / scopedTotals.assigned) * 100
    : 0;

  const scopedInProgressRate = scopedTotals.assigned
    ? (scopedTotals.inProgress / scopedTotals.assigned) * 100
    : 0;

  const scopedRiskRate = scopedTotals.assigned
    ? (scopedTotals.notStarted / scopedTotals.assigned) * 100
    : 0;

  const topRiskTrainings = useMemo(() => {
    return [...trainings]
      .sort((a, b) => b.not_started_count - a.not_started_count)
      .slice(0, 6);
  }, [trainings]);

  const bestTrainings = useMemo(() => {
    return [...trainings]
      .sort((a, b) => b.completed_count - a.completed_count)
      .slice(0, 6);
  }, [trainings]);

  const groupedRiskCompanies = useMemo(() => {
    const map = new Map<string, number>();

    filteredRiskUsers.forEach((u) => {
      const key = (u.company_id || "Firma Yok").trim() || "Firma Yok";
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredRiskUsers]);

  const groupedRiskTrainings = useMemo(() => {
    const map = new Map<string, number>();

    filteredRiskUsers.forEach((u) => {
      const key = u.training_title || "Eğitim";
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredRiskUsers]);

  const aiComment =
    riskRate >= 60
      ? "Risk yüksek. Başlamayan eğitimler için hızlı aksiyon, otomatik hatırlatma ve firma bazlı takip önerilir."
      : riskRate >= 30
      ? "Risk orta seviyede. Devam eden ve başlamayan kullanıcı kümeleri yakından izlenmeli."
      : "Genel görünüm kontrollü. Tamamlanma oranı korunarak sürdürülebilir bir eğitim performansı sağlanıyor.";

  const topEmployees = useMemo(() => {
    const map = new Map<
      string,
      { full_name: string; email: string; count: number }
    >();

    filteredRiskUsers.forEach((u) => {
      const key = u.user_id;
      const current = map.get(key) || {
        full_name: u.full_name,
        email: u.email,
        count: 0,
      };
      current.count += 1;
      map.set(key, current);
    });

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredRiskUsers]);

  const completionHeadline =
    scopedCompletionRate >= 80
      ? "Güçlü Tamamlama"
      : scopedCompletionRate >= 50
      ? "Orta Performans"
      : "İyileştirme Gerekli";

  const scopedRiskStatus =
    scopedRiskRate >= 60
      ? "KRITIK"
      : scopedRiskRate >= 30
      ? "ORTA"
      : "IYI";

  const riskHeadline =
    scopedRiskStatus === "KRITIK"
      ? "Kritik Müdahale Alanı"
      : scopedRiskStatus === "ORTA"
      ? "Kontrollü Risk Alanı"
      : "Sağlıklı Görünüm";

const heroTotalTrainings = hasActiveDashboardFilter
  ? new Set([
      ...filteredRiskUsers.map((user) => user.training_id),
      ...filteredInProgressUsers.map((user) => user.training_id),
      ...filteredCompletedUsers.map((user) => user.training_id),
    ]).size
  : trainings.length;
const heroRiskStatus = scopedRiskStatus;
const heroCompletionHeadline =
  completionHeadline || "Operasyon Yükleniyor";


  const ceoSummary = useMemo(
  () =>
    buildCeoSummary({
      trainings,
      summary,
      totals,
      cbsSummary,
      riskRate,
    }),
  [trainings, summary, totals, cbsSummary, riskRate]
);

const dashboardTrendData =
  trend.length > 0
    ? trend
    : [
        { label: "Oca", value: 20 },
        { label: "Şub", value: 35 },
        { label: "Mar", value: 42 },
        { label: "Nis", value: 58 },
        { label: "May", value: 74 },
        { label: "Haz", value: Math.round(scopedCompletionRate) },
      ];

const dashboardPieData = [
  { name: "Tamamlandı", value: scopedTotals.completed },
  { name: "Devam", value: scopedTotals.inProgress },
  { name: "Başlamadı", value: scopedTotals.notStarted },
];

  const healthCompliance = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
          ((upcomingHealths.length + upcomingPeriodicControls.length) /
            Math.max(1, scopedTotals.assigned)) *
            100
      )
    )
  );

  const inspectionCount = Number(
    inspectionSummary?.total ??
      inspectionSummary?.total_count ??
      inspectionSummary?.totalInspections ??
      0
  );

  const openDofCount = Number(dofSummary?.open ?? 0);

  const criticalRiskCount = hasActiveDashboardFilter
    ? filteredRiskUsers.length
    : Number(
        riskSummary?.veryHigh ??
          riskSummary?.high ??
          filteredRiskUsers.length
      );


  const companyPerformance = useMemo(() => {
    const map = new Map<
      string,
      { name: string; completed: number; total: number }
    >();

    const collect = (users: RiskUser[], completed: boolean) => {
      users.forEach((user) => {
        const name = (user.company_id || "Firma Yok").trim() || "Firma Yok";
        const current = map.get(name) || {
          name,
          completed: 0,
          total: 0,
        };

        current.total += 1;

        if (completed) {
          current.completed += 1;
        }

        map.set(name, current);
      });
    };

    collect(filteredCompletedUsers, true);
    collect(filteredInProgressUsers, false);
    collect(filteredRiskUsers, false);

    return Array.from(map.values())
      .map((company) => ({
        ...company,
        score: company.total
          ? Math.round((company.completed / company.total) * 100)
          : 0,
      }))
      .sort((a, b) => b.score - a.score || b.total - a.total)
      .slice(0, 8);
  }, [filteredCompletedUsers, filteredInProgressUsers, filteredRiskUsers]);

  const riskMatrix = useMemo(() => {
    const low = Math.max(0, Number(riskSummary?.low || 0));
    const medium = Math.max(0, Number(riskSummary?.medium || 0));
    const high = Math.max(0, Number(riskSummary?.high || 0));
    const veryHigh = Math.max(0, Number(riskSummary?.veryHigh || 0));

    const distribute = (total: number, slots: number) => {
      const base = Math.floor(total / slots);
      const remainder = total % slots;

      return Array.from(
        { length: slots },
        (_, index) => base + (index < remainder ? 1 : 0)
      );
    };

    const lowParts = distribute(low, 7);
    const mediumParts = distribute(medium, 7);
    const highParts = distribute(high, 6);
    const criticalParts = distribute(veryHigh, 5);

    return [
      [lowParts[0], lowParts[1], lowParts[2], mediumParts[0], mediumParts[1]],
      [lowParts[3], lowParts[4], mediumParts[2], mediumParts[3], highParts[0]],
      [lowParts[5], mediumParts[4], mediumParts[5], highParts[1], highParts[2]],
      [mediumParts[6], highParts[3], highParts[4], criticalParts[0], criticalParts[1]],
      [lowParts[6], highParts[5], criticalParts[2], criticalParts[3], criticalParts[4]],
    ];
  }, [riskSummary]);

  const visibleCompanyPerformance = useMemo(() => {
    if (!normalizedDashboardSearch) return companyPerformance;

    return companyPerformance.filter((company) =>
      company.name.toLocaleLowerCase("tr-TR").includes(normalizedDashboardSearch)
    );
  }, [companyPerformance, normalizedDashboardSearch]);

  const visibleActivities = useMemo(() => {
    return activities.filter((activity) => {
      const companyMatches =
        normalizeCompanyKey(effectiveSelectedCompany) === "all" ||
        normalizeCompanyKey(activity.company) ===
          normalizeCompanyKey(effectiveSelectedCompany);

      const searchable = `${activity.title} ${activity.company || ""} ${activity.type}`
        .toLocaleLowerCase("tr-TR");

      const searchMatches =
        !normalizedDashboardSearch ||
        searchable.includes(normalizedDashboardSearch);

      return companyMatches && searchMatches;
    });
  }, [
    activities,
    effectiveSelectedCompany,
    normalizedDashboardSearch,
  ]);

  const trainingSparkline = dashboardTrendData.map((item) => Number(item.value) || 0);
  const flatSparkline = (value: number) => Array.from({ length: 6 }, () => value);

  const doraInsights = [
    doraSummary?.message || aiComment,
    `${Math.round(scopedCompletionRate)}% eğitim tamamlama oranı ile ${riskHeadline.toLocaleLowerCase(
      "tr-TR"
    )} izleniyor.`,
    upcomingTrainings.length > 0
      ? `${upcomingTrainings.length} yaklaşan eğitim için planlama kontrolü önerilir.`
      : "Yaklaşan eğitim takviminde kritik bir yoğunluk görünmüyor.",
    cbsSummary?.slaExceeded
      ? `${cbsSummary.slaExceeded} ÇBS kaydı SLA süresini aşmış durumda.`
      : "ÇBS süreçlerinde SLA aşımı görünmüyor.",
  ];

  const metrics = [
    {
      title: "Eğitim Uyumu",
      value: `%${Math.round(scopedCompletionRate)}`,
      icon: GraduationCap,
      trend: scopedCompletionRate >= 70 ? ("up" as const) : ("down" as const),
      change: Math.round(Math.abs(scopedCompletionRate - 70)),
      color: "blue" as const,
      description: "Tamamlanan eğitim atamalarının toplam atamalara oranı.",
      href: withFirmParam("/admin/trainings", effectiveSelectedCompany),
      sparkline: trainingSparkline,
      statusLabel: scopedCompletionRate >= 80 ? "Hedefte" : "Takip gerekli",
    },
    {
      title: "Kritik Risk",
      value: criticalRiskCount,
      icon: ShieldAlert,
      trend: scopedRiskRate <= 30 ? ("down" as const) : ("up" as const),
      change: Math.round(scopedRiskRate),
      color: "red" as const,
      description: "Öncelikli müdahale gerektiren riskli kullanıcı ve süreçler.",
      href: withFirmParam("/admin/denetimler?tab=dof&status=open#dof", effectiveSelectedCompany),
      sparkline: flatSparkline(criticalRiskCount),
      statusLabel: criticalRiskCount > 0 ? "Aksiyon" : "Kontrollü",
    },
    {
      title: "Sağlık Uyumu",
      value: `%${healthCompliance}`,
      icon: HeartPulse,
      trend: healthCompliance >= 80 ? ("up" as const) : ("down" as const),
      change: Math.abs(healthCompliance - 80),
      color: "green" as const,
      description: "Yaklaşan sağlık ve periyodik kontrol yüküne göre uyum görünümü.",
      href: withFirmParam("/admin/health", effectiveSelectedCompany),
      sparkline: flatSparkline(healthCompliance),
      statusLabel: healthCompliance >= 80 ? "Uygun" : "İzlenmeli",
    },
    {
      title: "Denetimler",
      value: inspectionCount,
      icon: ClipboardCheck,
      trend: "neutral" as const,
      color: "purple" as const,
      description: "Sistemde izlenen toplam ve yaklaşan denetim kayıtları.",
      href: withFirmParam("/admin/denetimler", effectiveSelectedCompany),
      sparkline: flatSparkline(inspectionCount),
      statusLabel: upcomingInspections.length > 0 ? "Planlı" : "Güncel",
    },
    {
      title: "Toplam Firma",
      value: companies.length,
      icon: Building2,
      trend: "neutral" as const,
      color: "blue" as const,
      description: "Dashboard kapsamında izlenen aktif firma sayısı.",
      href: withFirmParam("/admin/companies", effectiveSelectedCompany),
      sparkline: flatSparkline(companies.length),
      statusLabel: "Aktif",
    },
    {
      title: "Açık DÖF",
      value: openDofCount,
      icon: Siren,
      trend: openDofCount > 0 ? ("up" as const) : ("neutral" as const),
      color: "orange" as const,
      description: "Kapatılmayı bekleyen düzeltici ve önleyici faaliyetler.",
      href: withFirmParam("/admin/denetimler?tab=dof&status=open#dof", effectiveSelectedCompany),
      sparkline: flatSparkline(openDofCount),
      statusLabel: openDofCount > 0 ? "Açık" : "Kapalı",
    },
    {
      title: "Yaklaşan Muayene",
      value: upcomingHealths.length + upcomingPeriodicControls.length,
      icon: Stethoscope,
      trend:
        upcomingHealths.length + upcomingPeriodicControls.length > 0
          ? ("up" as const)
          : ("neutral" as const),
      color: "green" as const,
      description: "Sağlık muayenesi veya periyodik kontrol zamanı yaklaşan kayıtlar.",
      href: withFirmParam("/admin/health", effectiveSelectedCompany),
      sparkline: flatSparkline(upcomingHealths.length + upcomingPeriodicControls.length),
      statusLabel: upcomingHealths.length + upcomingPeriodicControls.length > 0 ? "Yaklaşıyor" : "Güncel",
    },
    {
      title: "Operasyon Aktivitesi",
      value: activities.length,
      icon: Activity,
      trend: "neutral" as const,
      color: "purple" as const,
      description: "Dashboard üzerinde izlenen güncel işlem ve aktivite sayısı.",
      sparkline: flatSparkline(activities.length),
      statusLabel: "Canlı",
    },
  ];

  const alerts = [
    {
      title: "Kritik risk kaydı",
      value: criticalRiskCount,
      description:
        "Riskli kullanıcılar ve kritik risk kayıtları için öncelikli aksiyon alın.",
      variant: criticalRiskCount > 0 ? ("critical" as const) : ("success" as const),
      href: withFirmParam("/admin/denetimler?tab=dof&status=open#dof", effectiveSelectedCompany),
    },
    {
      title: "Yaklaşan eğitim",
      value: upcomingTrainings.length,
      description:
        "Yaklaşan eğitim planlarının katılımcı ve tarih kontrollerini tamamlayın.",
      variant:
        upcomingTrainings.length > 0 ? ("warning" as const) : ("success" as const),
      href: withFirmParam("/admin/trainings", effectiveSelectedCompany),
    },
    {
      title: "Yaklaşan denetim",
      value: upcomingInspections.length,
      description:
        "Denetim kapsamı, ekip ve saha hazırlıklarını gözden geçirin.",
      variant:
        upcomingInspections.length > 0 ? ("info" as const) : ("success" as const),
      href: withFirmParam("/admin/denetimler", effectiveSelectedCompany),
    },
    {
      title: "ÇBS SLA aşımı",
      value: cbsSummary?.slaExceeded ?? 0,
      description:
        "SLA süresini aşan bildirimlerin sahiplerini ve aksiyonlarını kontrol edin.",
      variant:
        (cbsSummary?.slaExceeded ?? 0) > 0
          ? ("critical" as const)
          : ("success" as const),
      href: withFirmParam("/admin/cbs", effectiveSelectedCompany),
    },
  ];

  const quickActions = [
    {
      title: "Yeni çalışan",
      description: "Firma çalışan kayıtlarına yeni çalışan ekleyin.",
      href: withFirmParam("/admin/employees", effectiveSelectedCompany),
      icon: UserRoundPlus,
    },
    {
      title: "Eğitim planla",
      description: "Yeni eğitim oluşturun veya yaklaşan eğitimi yönetin.",
      href: withFirmParam("/admin/trainings", effectiveSelectedCompany),
      icon: GraduationCap,
    },
    {
      title: "Denetim başlat",
      description: "Saha veya firma denetimi sürecini başlatın.",
      href: withFirmParam("/admin/denetimler", effectiveSelectedCompany),
      icon: FileCheck2,
    },
    {
      title: "Riskleri incele",
      description: "Kritik riskleri ve açık aksiyonları görüntüleyin.",
      href: withFirmParam("/admin/denetimler?tab=dof&status=open#dof", effectiveSelectedCompany),
      icon: ShieldAlert,
    },
  ];

  return (
    <main
      style={{
        minHeight: "100%",
        background: BRAND.bg,
        padding: isMobile ? 12 : 24,
      }}
    >
      <div
        className="dashboardCompleteRoot"
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <DashboardV3
          loading={loading}
          error={error}
          isMobile={isMobile}
          title="Executive Command Center"
          subtitle="İş sağlığı, güvenliği, sağlık, eğitim, denetim ve operasyon süreçlerinin canlı yönetim ekranı."
          heroTitle={heroCompletionHeadline}
          heroDescription={`${heroTotalTrainings} eğitim, ${filteredRiskUsers.length} riskli kullanıcı ve ${inspectionCount} denetim kaydı tek ekranda izleniyor.`}
          heroStats={[
            {
              label: "Eğitim uyumu",
              value: `%${Math.round(scopedCompletionRate)}`,
            },
            { label: "Risk durumu", value: heroRiskStatus },
            { label: "Açık DÖF", value: openDofCount },
            {
              label: "ÇBS SLA aşımı",
              value: cbsSummary?.slaExceeded ?? 0,
            },
          ]}
          metrics={metrics}
          alerts={alerts}
          doraInsights={doraInsights}
          onRefresh={refreshAllDashboardData}
          onExportPDF={exportPDF}
          trendData={dashboardTrendData}
          pieData={dashboardPieData}
          riskCompanies={groupedRiskCompanies}
          completionRate={scopedCompletionRate}
          inProgressRate={scopedInProgressRate}
          riskRate={scopedRiskRate}
          cbsSummary={cbsSummary}
          inspectionSummary={inspectionSummary}
          quickActions={quickActions}
          activities={visibleActivities}
          riskMatrix={riskMatrix}
          companyPerformance={visibleCompanyPerformance}
          companies={companies}
          selectedCompany={effectiveSelectedCompany}
          onCompanyChange={setSelectedCompany}
          searchValue={dashboardSearch}
          onSearchChange={setDashboardSearch}
          companyLocked={adminRole === "company_admin"}
          criticalCount={criticalRiskCount}
          executiveRecommendation={
            hasActiveDashboardFilter
              ? `${effectiveSelectedCompany === "all" ? "Arama sonucu" : effectiveSelectedCompany} kapsamında ${scopedTotals.assigned} atama inceleniyor. ${
                  criticalRiskCount > 0
                    ? "Riskli kayıtları önceliklendirerek sorumlulara aksiyon atayın."
                    : "Filtrelenen görünümde kritik bir eğitim riski bulunmuyor."
                }`
              : criticalRiskCount > 0
              ? "Kritik risk kayıtlarını önceliklendirerek ilgili firma ve sorumlulara aksiyon atayın."
              : upcomingTrainings.length > 0
              ? "Yaklaşan eğitimlerin katılımcı ve tarih kontrollerini tamamlayın."
              : "Mevcut performansı koruyun ve yaklaşan operasyonları izlemeye devam edin."
          }
          legacyExecutive={
            <ExecutiveSection
              isMobile={isMobile}
              adminRole={adminRole}
              adminCompanyId={adminCompanyId}
              companies={companies}
              selectedCompany={selectedCompany}
              setSelectedCompany={setSelectedCompany}
              filteredRiskUsers={filteredRiskUsers}
              ceoSummary={ceoSummary}
              summary={summary}
              totals={scopedTotals}
            />
          }
          legacyLists={
            <ListsSection
              isMobile={isMobile}
              aiComment={aiComment}
              filteredRiskUsers={filteredRiskUsers}
              filteredInProgressUsers={filteredInProgressUsers}
              filteredCompletedUsers={filteredCompletedUsers}
              groupedRiskCompanies={groupedRiskCompanies}
              groupedRiskTrainings={groupedRiskTrainings}
              topRiskTrainings={topRiskTrainings}
              bestTrainings={bestTrainings}
              topEmployees={topEmployees}
              upcomingTrainings={upcomingTrainings}
              upcomingInspections={upcomingInspections}
            />
          }
        />
      </div>
    </main>
  );
}