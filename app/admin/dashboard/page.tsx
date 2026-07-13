"use client";

import { useEffect, useMemo, useState } from "react";


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

import HeroSection from "@/components/dashboard/HeroSection";
import ChartsSection from "@/components/dashboard/ChartsSection";
import CardsSection from "@/components/dashboard/CardsSection";
import ExecutiveSection from "@/components/dashboard/ExecutiveSection";
import ListsSection from "@/components/dashboard/ListsSection";
import AlarmPanel from "../../../components/dashboard/AlarmPanel";
import { BRAND, formatPercent } from "../../../components/dashboard/styles";

import {
  calculateTotals,
  calculateRates,
  buildCeoSummary,
} from "../../../components/dashboard/dashboardHelpers";


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

const loadInspectionDashboard = async () => {
  try {
    const res = await fetch("/api/admin/inspection-dashboard", {
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
  void loadInspectionDashboard();
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

  useEffect(() => {
    if (adminRole === "company_admin" && adminCompanyId) {
      const matched =
        riskyUsers
          .map((u) => (u.company_id || "").trim())
          .find((x) => x && x === adminCompanyId) || adminCompanyId;

      setSelectedCompany(matched);
    }
  }, [adminRole, adminCompanyId, riskyUsers]);

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");

    const element = document.getElementById("admin-dashboard-pdf");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 1.2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

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

    pdf.save("dsec-dashboard.pdf");
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
  return [...companyList].sort((a, b) => a.localeCompare(b, "tr"));
}, [companyList]);

  const effectiveSelectedCompany =
    adminRole === "company_admin" && adminCompanyId
      ? adminCompanyId
      : selectedCompany;

  const filteredRiskUsers = useMemo(() => {
    if (effectiveSelectedCompany === "all") return riskyUsers;

    return riskyUsers.filter(
      (u) =>
        ((u.company_id || "Firma Yok").trim() || "Firma Yok") ===
        effectiveSelectedCompany
    );
  }, [effectiveSelectedCompany, riskyUsers]);

  const filteredInProgressUsers = useMemo(() => {
    if (effectiveSelectedCompany === "all") return inProgressUsers;

    return inProgressUsers.filter(
      (u) =>
        ((u.company_id || "Firma Yok").trim() || "Firma Yok") ===
        effectiveSelectedCompany
    );
  }, [effectiveSelectedCompany, inProgressUsers]);

  const filteredCompletedUsers = useMemo(() => {
    if (effectiveSelectedCompany === "all") return completedUsers;

    return completedUsers.filter(
      (u) =>
        ((u.company_id || "Firma Yok").trim() || "Firma Yok") ===
        effectiveSelectedCompany
    );
  }, [effectiveSelectedCompany, completedUsers]);

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

    riskyUsers.forEach((u) => {
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
  }, [riskyUsers]);

  const completionHeadline =
    completionRate >= 80
      ? "Güçlü Tamamlama"
      : completionRate >= 50
      ? "Orta Performans"
      : "İyileştirme Gerekli";

  const riskHeadline =
    riskStatus === "KRITIK"
      ? "Kritik Müdahale Alanı"
      : riskStatus === "ORTA"
      ? "Kontrollü Risk Alanı"
      : "Sağlıklı Görünüm";

const heroTotalTrainings = trainings.length;
const heroRiskStatus = riskStatus || "IYI";
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
        { label: "Haz", value: Math.round(completionRate) },
      ];

const dashboardPieData = [
  { name: "Tamamlandı", value: summary?.completed_count ?? totals.completed },
  { name: "Devam", value: summary?.in_progress_count ?? totals.inProgress },
  { name: "Başlamadı", value: summary?.not_started_count ?? totals.notStarted },
];

  if (error) {
    return (
      <div style={{ padding: 24, color: BRAND.red, fontWeight: 700 }}>
        {error}
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: "100%",
        background: BRAND.bg,
        padding: isMobile ? 12 : 24,
      }}
    >
    <div
  id="admin-dashboard-pdf"
  style={{
    maxWidth: 1440,
    margin: "0 auto",
    width: "100%",
    opacity: loading ? 0.96 : 1,
    transition: "opacity 0.2s ease",
  }}
>

<HeroSection
  loading={loading}
  isMobile={isMobile}
  heroCompletionHeadline={heroCompletionHeadline}
  heroRiskStatus={heroRiskStatus}
  heroTotalTrainings={heroTotalTrainings}
  completionRate={completionRate}
  ceoSummary={ceoSummary}
  exportPDF={exportPDF}
  refreshDashboard={() => {
  void loadDashboard();
  void loadCbs();
  void loadInspectionDashboard();
  void loadUpcomingTrainings();
}}
/>

<ChartsSection
  isMobile={isMobile}
  dashboardTrendData={dashboardTrendData}
  dashboardPieData={dashboardPieData}
  groupedRiskCompanies={groupedRiskCompanies}
  completionRate={completionRate}
  inProgressRate={inProgressRate}
  riskRate={riskRate}
  cbsSummary={cbsSummary}
  inspectionSummary={inspectionSummary}
/>
 <CardsSection
  isMobile={isMobile}
  adminRole={adminRole}
  cbsSummary={cbsSummary}
  totalAssignments={summary?.total_assignments ?? totals.assigned}
  completionRate={completionRate}
  inProgressRate={inProgressRate}
  riskRate={riskRate}
/>

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
  totals={totals}
/>

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

<AlarmPanel
  isMobile={isMobile}
  ceoSummary={ceoSummary}
/>
      
      </div>
    </main>
  );
}