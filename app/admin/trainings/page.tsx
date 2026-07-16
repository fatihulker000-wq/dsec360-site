"use client";

import { useEffect, useMemo, useState } from "react";
import TrainingExecutiveHero from "../../../components/training-v2/TrainingExecutiveHero";
import TrainingKpiGrid from "../../../components/training-v2/TrainingKpiGrid";
import TrainingAnalytics from "../../../components/training-v2/TrainingAnalytics";
import DoraTraining from "../../../components/training-v2/DoraTraining";
import TrainingContentReadiness from "../../../components/training-v2/TrainingContentReadiness";
import TrainingVideoManager from "../../../components/training-v2/videos/TrainingVideoManager";
import AssignmentCenter, {
  type EmployeeRow,
  type AssignResponse,
} from "../../../components/training-v2/assignments/AssignmentCenter";
import ParticipantImportCenter from "../../../components/training-v2/participants";
import TrainingCatalog from "../../../components/training-v2/catalog";
import TrainingExamCenter from "../../../components/training-v2/exams";
import TrainingCertificateCenter from "../../../components/training-v2/certificates";
import TrainingAuditCenter from "../../../components/training-v2/audit";
import TrainingExecutiveDashboard from "../../../components/training-v2/executive";

type UserApiRow = {
  id: string;
  employee_id?: string | null;
  full_name?: string | null;
  email?: string | null;
  company?: string | null;
  company_id?: string | null;
  role?: string | null;
  is_active?: boolean | null;
};

type TrainingApiRow = {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  type?: string | null;
  duration_minutes?: number | null;
  content_url?: string | null;
  topics_text?: string | null;
  assigned_count?: number | null;
  not_started_count?: number | null;
  in_progress_count?: number | null;
  completed_count?: number | null;
  video_count?: number | null;
pre_exam_count?: number | null;
final_exam_count?: number | null;
};

type CompanyApiRow = {
  id?: string | null;
  name?: string | null;
  is_active?: boolean | null;
};

type UserRow = {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  company: string;
  company_id: string;
  role: string;
  is_active: boolean;
};

type CompanyRow = {
  id: string;
  name: string;
};

type TrainingRow = {
  id: string;
  title: string;
  description: string;
  type: string;
  duration_minutes: number | null;
  content_url: string;
  topics_text: string;
  assigned_count: number;
  not_started_count: number;
  in_progress_count: number;
  completed_count: number;
  video_count: number;
  pre_exam_count: number;
  final_exam_count: number;
};

const BRAND = {
  bg: "#f7f8fb",
  white: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  red: "#c62828",
  redDark: "#5a0f1f",
  shadow: "0 10px 30px rgba(15,23,42,0.06)",
};

function getRoleLabel(role?: string | null) {
  if (role === "super_admin") return "Süper Admin";
  if (role === "company_admin") return "Firma Yöneticisi";
  if (role === "operator") return "Operatör";
  if (role === "training_user") return "Eğitim Kullanıcısı";
  return role || "-";
}

function buildCompanyLabel(user: UserApiRow) {
  if (user.company && user.company.trim()) {
    return user.company.trim();
  }

  return "❗ Firma yok";
}

function parseTopicsCount(topicsText?: string | null) {
  const raw = String(topicsText || "").trim();
  if (!raw) return 0;

  return raw
    .replace(/\r/g, "\n")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => x.replace(/^[-–—•]\s*/, "").trim())
    .filter(Boolean).length;
}

function cardStyle(): React.CSSProperties {
  return {
    border: `1px solid ${BRAND.border}`,
    borderRadius: 18,
    background: BRAND.white,
    padding: 18,
    boxShadow: BRAND.shadow,
  };
}

function badgeStyle(
  bg: string,
  border: string,
  color: string
): React.CSSProperties {
  return {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: 999,
    background: bg,
    border: `1px solid ${border}`,
    fontSize: 12,
    fontWeight: 700,
    color,
  };
}

function normalizeTrainingTypeText(value?: string | null) {
  const t = String(value || "").toLowerCase();

  if (t.includes("asenkron")) return "Asenkron";
  if (t.includes("senkron")) return "Senkron";
  if (t.includes("orgun") || t.includes("örgün")) return "Örgün";
  if (t.includes("ozel") || t.includes("özel")) return "Özel";
  if (t.includes("online")) return "Asenkron";

  return "Eğitim";
}

function isAppTrainingRecord(item: any) {
  const source = String(item?.source || "").toLowerCase();
  const type = String(item?.type || "").toLowerCase();
  const status = String(item?.status || "").toLowerCase();

  return (
    source.includes("app") ||
    status === "app_record" ||
    type.includes("orgun") ||
    type.includes("örgün") ||
    type.includes("ozel") ||
    type.includes("özel")
  );
}

function getTrainingStatusLabel(status?: string | null) {
  const s = String(status || "").toLowerCase();

  if (s === "completed") return "Tamamlandı";
  if (s === "in_progress") return "Devam ediyor";
  if (s === "app_record") return "App Kaydı";
  return "Başlamadı";
}

function getTrainingStatusColor(status?: string | null) {
  const s = String(status || "").toLowerCase();

  if (s === "completed") return "#166534";
  if (s === "in_progress") return "#1d4ed8";
  if (s === "app_record") return "#7c2d12";
  return "#92400e";
}

function formatTrainingDate(value?: string | null) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getTrainingDurationText(value?: number | null) {
  if (!value || value <= 0) return "Süre yok";
  return `${value} dk`;
}

export default function AdminTrainingPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalEmployeeCount, setTotalEmployeeCount] = useState(0);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [employeeTrainingMap, setEmployeeTrainingMap] = useState<Record<string, any[]>>({});
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [trainings, setTrainings] = useState<TrainingRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [trainingId, setTrainingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "passive">("all");
  const [selectedTrainingInfo, setSelectedTrainingInfo] =
    useState<TrainingRow | null>(null);
  const [assignSummary, setAssignSummary] = useState<AssignResponse | null>(null);

  const loadAll = async () => {
    try {
      setError("");
      setLoading(true);

      const [usersRes, trainingsRes, companiesRes, employeesRes] = await Promise.all([
  fetch("/api/admin/users?type=training", {
    cache: "no-store",
    credentials: "include",
  }),
  fetch("/api/admin/trainings", {
    cache: "no-store",
    credentials: "include",
  }),
  fetch("/api/admin/companies", {
    cache: "no-store",
    credentials: "include",
  }),
  fetch("/api/admin/employees?firmId=all", {
    cache: "no-store",
    credentials: "include",
  }),
]);

      if (
        usersRes.status === 401 ||
        trainingsRes.status === 401 ||
        companiesRes.status === 401
      ) {
        window.location.href = "/admin/login";
        return;
      }

      const usersJson = await usersRes.json();
      const trainingsJson = await trainingsRes.json();
      const companiesJson = await companiesRes.json();
      const employeesJson = await employeesRes.json();

setTotalEmployeeCount(
  Array.isArray(employeesJson?.data)
    ? employeesJson.data.filter((e: any) => e.active !== false).length
    : 0
);

      if (!usersRes.ok) {
        throw new Error(usersJson?.error || "Kullanıcı listesi alınamadı.");
      }

      if (!trainingsRes.ok) {
        throw new Error(trainingsJson?.error || "Eğitim listesi alınamadı.");
      }

      if (!companiesRes.ok) {
        throw new Error(companiesJson?.error || "Firma listesi alınamadı.");
      }

      const normalizedUsers: UserRow[] = Array.isArray(usersJson?.data)
        ? usersJson.data.map((u: UserApiRow) => ({
            id: String(u.id || ""),
          employee_id: String((u as any).employee_id || "").trim(),
          full_name: (u.full_name || "Adsız Kullanıcı").trim(),
            email: (u.email || "-").trim(),
            company: buildCompanyLabel(u),
            company_id: String(u.company_id || ""),
            role: getRoleLabel(u.role),
           is_active: Boolean(u.is_active),
           }))
            : [];

            const normalizedTrainings: TrainingRow[] = Array.isArray(trainingsJson?.data)
        ? trainingsJson.data.map((t: TrainingApiRow) => ({
            id: String(t.id || ""),
            title: (t.title || "Adsız Eğitim").trim(),
            description: (t.description || "Açıklama bulunmuyor.").trim(),
            type: (t.type || "online").trim(),
            duration_minutes:
              typeof t.duration_minutes === "number" ? t.duration_minutes : null,
            content_url: (t.content_url || "").trim(),
            topics_text: (t.topics_text || "").trim(),
            assigned_count:
              typeof t.assigned_count === "number" ? t.assigned_count : 0,
            not_started_count:
              typeof t.not_started_count === "number" ? t.not_started_count : 0,
            in_progress_count:
              typeof t.in_progress_count === "number" ? t.in_progress_count : 0,
            completed_count:
              typeof t.completed_count === "number" ? t.completed_count : 0,
              video_count:
  typeof t.video_count === "number" ? t.video_count : 0,
pre_exam_count:
  typeof t.pre_exam_count === "number" ? t.pre_exam_count : 0,
final_exam_count:
  typeof t.final_exam_count === "number" ? t.final_exam_count : 0,
          }))
        : [];

      const normalizedCompanies: CompanyRow[] = Array.isArray(companiesJson?.data)
  ? companiesJson.data
      .filter((c: CompanyApiRow) => (c?.is_active ?? true) === true)
      .map((c: CompanyApiRow) => ({
        id: String(c?.id || "").trim(),
        name: String(c?.name || "").trim(),
      }))
      .filter((c: CompanyRow) => c.id && c.name)
      .sort((a: CompanyRow, b: CompanyRow) => a.name.localeCompare(b.name, "tr"))
  : [];

      setUsers(normalizedUsers);
      setTrainings(normalizedTrainings);
      setCompanies(normalizedCompanies);
    } catch (err) {
      console.error(err);
      setUsers([]);
      setTrainings([]);
      setCompanies([]);
      setError(
        err instanceof Error ? err.message : "Veriler alınırken hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeesByCompany = async (firmId: string) => {
  if (!firmId || firmId === "all") {
    setEmployees([]);
    setSelectedEmployees([]);
    return;
  }


  try {
    setEmployeesLoading(true);
    setSelectedEmployees([]);

    const res = await fetch(`/api/admin/employees?firmId=${encodeURIComponent(firmId)}`, {
      cache: "no-store",
      credentials: "include",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json?.error || "Çalışanlar alınamadı.");
      setEmployees([]);
      return;
    }

    setEmployees(
      Array.isArray(json?.data)
        ? json.data.map((e: any) => ({
            id: String(e.id || ""),
            firm_id: String(e.firm_id || ""),
            full_name: String(e.full_name || "Adsız çalışan"),
            job_title: e.job_title || null,
            phone: e.phone || null,
            email: e.email || null,
            registry_no: e.registry_no || null,
            active: Boolean(e.active),
          }))
        : []
    );

  const employeeIds = Array.isArray(json?.data)
  ? json.data.map((e: any) => String(e.id || "")).filter(Boolean)
  : [];

if (employeeIds.length > 0) {
  const historyRes = await fetch(
    `/api/admin/employees/training-history?employeeIds=${encodeURIComponent(employeeIds.join(","))}`,
    {
      cache: "no-store",
      credentials: "include",
    }
  );

  const historyJson = await historyRes.json().catch(() => ({}));

  if (historyRes.ok) {
    setEmployeeTrainingMap(historyJson?.data || {});
  } else {
    setEmployeeTrainingMap({});
  }
} else {
  setEmployeeTrainingMap({});
}

  } finally {
    setEmployeesLoading(false);
  }
};



  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    const found =
      trainings.find((training) => training.id === trainingId) ||
      null;
    setSelectedTrainingInfo(found);
  }, [trainingId, trainings]);

 const filteredUsers = useMemo(() => {
  return users.filter((u) => {
    const text = `${u.full_name} ${u.email} ${u.company} ${u.role}`.toLowerCase();

    const matchesSearch = !search || text.includes(search.toLowerCase());

    const matchesCompany =
  companyFilter === "all" ? true : u.company_id === companyFilter;

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? u.is_active
        : !u.is_active;

    return matchesSearch && matchesCompany && matchesStatus;
  });
}, [users, search, companyFilter, statusFilter]);

  const selectedCount = selectedEmployees.length;

  const allFilteredSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedUsers.includes(u.id));

  const selectedUserDetails = useMemo(() => {
    const selectedSet = new Set(selectedUsers);
    return users.filter((u) => selectedSet.has(u.id));
  }, [users, selectedUsers]);

  const trainingTotals = useMemo(() => {
    const totalAssigned = trainings.reduce((sum, t) => sum + t.assigned_count, 0);
    const totalNotStarted = trainings.reduce(
      (sum, t) => sum + t.not_started_count,
      0
    );
    const totalInProgress = trainings.reduce(
      (sum, t) => sum + t.in_progress_count,
      0
    );
    const totalCompleted = trainings.reduce(
      (sum, t) => sum + t.completed_count,
      0
    );

    return {
      totalAssigned,
      totalNotStarted,
      totalInProgress,
      totalCompleted,
    };
  }, [trainings]);

  const toggleUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) =>
        prev.includes(userId) ? prev : [...prev, userId]
      );
    } else {
      setSelectedUsers((prev) => prev.filter((x) => x !== userId));
    }
  };

  const toggleAllFiltered = (checked: boolean) => {
    if (checked) {
      const filteredIds = filteredUsers.map((u) => u.id);
      setSelectedUsers((prev) => Array.from(new Set([...prev, ...filteredIds])));
    } else {
      const filteredIdSet = new Set(filteredUsers.map((u) => u.id));
      setSelectedUsers((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    }
  };

  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  const assign = async () => {
    if (!trainingId) {
      alert("Önce eğitim seç.");
      return;
    }

    if (!selectedEmployees.length) {
  alert("En az bir çalışan seç.");
  return;
}

    try {
      setAssigning(true);
      setAssignSummary(null);

const linkRes = await fetch("/api/admin/training-users/link-employees", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
  body: JSON.stringify({
    employeeIds: selectedEmployees,
    companyId: companyFilter,
  }),
});

const linkJson = await linkRes.json().catch(() => ({}));

if (!linkRes.ok) {
  alert(linkJson?.error || "Çalışanlar eğitim kullanıcısına bağlanamadı.");
  return;
}

      const res = await fetch("/api/training/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  employeeIds: selectedEmployees,
  trainingId,
  companyId: companyFilter,
}),
      });

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const data: AssignResponse = await res.json();

      if (!res.ok) {
        setAssignSummary(data);
        alert(data?.error || "Eğitim atama başarısız.");
        return;
      }

      setAssignSummary(data);
alert(data?.message || "Eğitim atandı ✅");
setSelectedEmployees([]);
await loadAll();

if (companyFilter !== "all") {
  await loadEmployeesByCompany(companyFilter);
}
    } catch (err) {
      console.error(err);
      alert("Sunucu hatası oluştu.");
    } finally {
      setAssigning(false);
    }
  };



  const trainingTypeDistribution = useMemo(() => {
    const map = new Map<string, number>();

    trainings.forEach((training) => {
      const label = normalizeTrainingTypeText(training.type);
      map.set(label, (map.get(label) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [trainings]);

  const contentReadiness = useMemo(() => {
    const asyncTrainings = trainings.filter(
      (training) => normalizeTrainingTypeText(training.type) === "Asenkron"
    );

    const withVideo = asyncTrainings.filter(
      (training) => training.video_count > 0
    ).length;

    const withPreExam = asyncTrainings.filter(
      (training) => training.pre_exam_count > 0
    ).length;

    const withFinalExam = asyncTrainings.filter(
      (training) => training.final_exam_count > 0
    ).length;

    return {
      asyncCount: asyncTrainings.length,
      withVideo,
      withPreExam,
      withFinalExam,
      missingVideo: Math.max(0, asyncTrainings.length - withVideo),
      missingFinalExam: Math.max(0, asyncTrainings.length - withFinalExam),
    };
  }, [trainings]);

  const trainingOverviewItems = useMemo(() => {
    return [...trainings]
      .sort((a, b) => b.assigned_count - a.assigned_count)
      .slice(0, 6)
      .map((training) => ({
        id: training.id,
        title: training.title,
        type: normalizeTrainingTypeText(training.type),
        duration: getTrainingDurationText(training.duration_minutes),
        assigned: training.assigned_count,
        completed: training.completed_count,
        inProgress: training.in_progress_count,
        notStarted: training.not_started_count,
        videoCount: training.video_count,
        preExamCount: training.pre_exam_count,
        finalExamCount: training.final_exam_count,
      }));
  }, [trainings]);

  return (
    <main
      style={{
        minHeight: "100%",
        background: BRAND.bg,
        padding: "clamp(12px, 2vw, 24px)",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", width: "100%" }}>
        <TrainingExecutiveHero
          title="D-SEC Eğitim Yönetim Merkezi"
          companyName={
            companyFilter === "all"
              ? "Tüm Firmalar"
              : companies.find(
                  (company) => company.id === companyFilter
                )?.name || "Seçili Firma"
          }
          totalTrainings={trainings.length}
          activeTrainings={trainingTotals.totalInProgress}
          completedTrainings={trainingTotals.totalCompleted}
          pendingTrainings={trainingTotals.totalNotStarted}
          certificatesWaiting={0}
          complianceScore={
            trainingTotals.totalAssigned > 0
              ? Math.round(
                  (trainingTotals.totalCompleted /
                    trainingTotals.totalAssigned) *
                    100
                )
              : 0
          }
          participantCount={totalEmployeeCount}
          lastSync={new Date().toLocaleString("tr-TR")}
          aiEnabled={true}
        />

        {error ? (
          <div
            style={{
              ...cardStyle(),
              marginBottom: 20,
              color: BRAND.red,
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        ) : null}

        <TrainingKpiGrid
          totalEmployees={totalEmployeeCount}
          totalTrainings={trainings.length}
          totalAssigned={trainingTotals.totalAssigned}
          completed={trainingTotals.totalCompleted}
          inProgress={trainingTotals.totalInProgress}
          notStarted={trainingTotals.totalNotStarted}
        />

        <TrainingExecutiveDashboard
          trainings={trainings}
          totalEmployees={totalEmployeeCount}
          selectedCompanyName={
            companyFilter === "all"
              ? "Tüm Firmalar"
              : companies.find(
                  (company) => company.id === companyFilter
                )?.name || "Seçili Firma"
          }
        />

        <TrainingAnalytics
          totalAssigned={trainingTotals.totalAssigned}
          completed={trainingTotals.totalCompleted}
          inProgress={trainingTotals.totalInProgress}
          notStarted={trainingTotals.totalNotStarted}
          typeDistribution={trainingTypeDistribution}
          totalTrainings={trainings.length}
        />

        <DoraTraining
          totalEmployees={totalEmployeeCount}
          totalTrainings={trainings.length}
          totalAssigned={trainingTotals.totalAssigned}
          completed={trainingTotals.totalCompleted}
          inProgress={trainingTotals.totalInProgress}
          notStarted={trainingTotals.totalNotStarted}
          missingVideo={contentReadiness.missingVideo}
          missingFinalExam={contentReadiness.missingFinalExam}
          selectedTrainingTitle={selectedTrainingInfo?.title || ""}
        />

        <TrainingContentReadiness
          asyncCount={contentReadiness.asyncCount}
          withVideo={contentReadiness.withVideo}
          withPreExam={contentReadiness.withPreExam}
          withFinalExam={contentReadiness.withFinalExam}
          trainings={trainingOverviewItems}
        />


        <TrainingCatalog
          trainings={trainings}
          selectedTrainingId={trainingId}
          onSelectTraining={setTrainingId}
        />

        <TrainingExamCenter
          trainings={trainings}
          selectedTrainingId={trainingId}
          onSelectTraining={setTrainingId}
        />

        <TrainingCertificateCenter
          trainings={trainings}
          selectedTrainingId={trainingId}
          onSelectTraining={setTrainingId}
        />

        <TrainingAuditCenter
          selectedTrainingId={trainingId}
        />


        {selectedTrainingInfo ? (
          <TrainingVideoManager
            trainingId={trainingId}
            trainingTitle={selectedTrainingInfo.title}
            onChanged={loadAll}
          />
        ) : null}

       
{/* FİLTRELER */}
<div
  style={{
    ...cardStyle(),
    marginBottom: 20,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
  }}
>
  <div>
    <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
      Ara
    </div>
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Ad soyad, e-posta, rol veya firma ara..."
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        fontSize: 14,
      }}
    />
  </div>

  <div>
    <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
      Firma
    </div>
    <select
      value={companyFilter}
      onChange={(e) => {
  const firmId = e.target.value;
  setCompanyFilter(firmId);
  void loadEmployeesByCompany(firmId);
}}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        background: "#fff",
        fontSize: 14,
      }}
    >
      <option value="all">Tüm Firmalar</option>
      {companies.map((company) => (
        <option key={company.id} value={company.id}>
  {company.name}
</option>
      ))}
    </select>
  </div>

  <div>
    <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
      Durum
    </div>
    <select
      value={statusFilter}
      onChange={(e) =>
        setStatusFilter(e.target.value as "all" | "active" | "passive")
      }
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        background: "#fff",
        fontSize: 14,
      }}
    >
      <option value="all">Tüm Kullanıcılar</option>
      <option value="active">Aktif Kullanıcılar</option>
      <option value="passive">Pasif Kullanıcılar</option>
    </select>
  </div>
</div>


        <ParticipantImportCenter onCompleted={loadAll} />


        <AssignmentCenter
          companySelected={companyFilter !== "all"}
          employees={employees}
          employeesLoading={employeesLoading}
          search={search}
          selectedEmployees={selectedEmployees}
          employeeTrainingMap={employeeTrainingMap}
          selectedTrainingTitle={selectedTrainingInfo?.title || ""}
          trainingSelected={Boolean(trainingId)}
          assigning={assigning}
          assignSummary={assignSummary}
          onSelectedEmployeesChange={setSelectedEmployees}
          onAssign={assign}
        />

        
      </div>
      </main>
  );
}
