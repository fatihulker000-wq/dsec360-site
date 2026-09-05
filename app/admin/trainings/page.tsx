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
import TrainingComplianceEngine from "../../../components/training-v2/compliance/TrainingComplianceEngine";
import TrainingCertificateEngineV2 from "../../../components/training-v2/certificate-v2/TrainingCertificateEngineV2";
import TrainingReportCenter from "../../../components/training-v2/reports/TrainingReportCenter";

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
  duration_seconds?: number | null;
  duration_minutes?: number | null;
  catalog_visible?: boolean | null;
  catalog_key?: string | null;
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
  tehlike_sinifi?: string | null;
};

type MeResponse = {
  success?: boolean;
  user?: {
    role?: string | null;
    is_demo?: boolean | null;
  };
  error?: string;
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
  tehlike_sinifi: string;
};

type TrainingRow = {
  id: string;
  title: string;
  description: string;
  type: string;
  duration_seconds: number;
  duration_minutes: number | null;
  catalog_visible: boolean;
  catalog_key: string | null;
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

function normalizeHazardClass(value?: string | null) {
  const raw = String(value || "").trim().toLocaleLowerCase("tr-TR");

  if (!raw) return "";
  if (raw.includes("çok") && raw.includes("tehlikeli")) return "Çok Tehlikeli";
  if (raw.includes("az") && raw.includes("tehlikeli")) return "Az Tehlikeli";
  if (raw.includes("tehlikeli")) return "Tehlikeli";

  return String(value || "").trim();
}

function getHazardTrainingRule(value?: string | null) {
  const hazard = normalizeHazardClass(value);

  if (hazard === "Çok Tehlikeli") return { minimumHours: 16, renewalYears: 1 };
  if (hazard === "Tehlikeli") return { minimumHours: 12, renewalYears: 2 };
  if (hazard === "Az Tehlikeli") return { minimumHours: 8, renewalYears: 3 };

  return { minimumHours: 0, renewalYears: 0 };
}

function getTrainingDurationText(
  durationSeconds?: number | null,
  durationMinutes?: number | null
) {
  const totalSeconds = Math.max(
    0,
    Number(durationSeconds || 0)
  );

  if (totalSeconds > 0) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
      return minutes > 0
        ? `${hours} sa ${minutes} dk`
        : `${hours} sa`;
    }

    if (minutes > 0) {
      return seconds > 0
        ? `${minutes} dk ${seconds} sn`
        : `${minutes} dk`;
    }

    return `${seconds} sn`;
  }

  const fallbackMinutes = Math.max(
    0,
    Number(durationMinutes || 0)
  );

  if (fallbackMinutes > 0) {
    return `${fallbackMinutes} dk`;
  }

  return "Süre yok";
}

export default function AdminTrainingPage() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionRole, setSessionRole] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalEmployeeCount, setTotalEmployeeCount] = useState(0);
  const [allEmployeeCount, setAllEmployeeCount] = useState(0);
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
  const [certificatePanelOpen, setCertificatePanelOpen] = useState(false);
  const [employeeTrainingPanelOpen, setEmployeeTrainingPanelOpen] = useState(false);

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

      const usersJson = await usersRes.json().catch(() => ({}));
      const trainingsJson = await trainingsRes.json().catch(() => ({}));
      const companiesJson = await companiesRes.json().catch(() => ({}));
      const employeesJson = await employeesRes.json().catch(() => ({}));

      const apiErrors: string[] = [];

      if (!usersRes.ok) {
        apiErrors.push(
          `Kullanıcı API (${usersRes.status}): ${
            usersJson?.error || "Kullanıcı listesi alınamadı."
          }`
        );
      }

      if (!trainingsRes.ok) {
        apiErrors.push(
          `Eğitim API (${trainingsRes.status}): ${
            trainingsJson?.error || "Eğitim listesi alınamadı."
          }`
        );
      }

      if (!companiesRes.ok) {
        apiErrors.push(
          `Firma API (${companiesRes.status}): ${
            companiesJson?.error || "Firma listesi alınamadı."
          }`
        );
      }

      if (!employeesRes.ok) {
        apiErrors.push(
          `Çalışan API (${employeesRes.status}): ${
            employeesJson?.error || "Çalışan listesi alınamadı."
          }`
        );
      }

const allActiveEmployeeCount = Array.isArray(employeesJson?.data)
  ? employeesJson.data.filter((e: any) => e.active !== false).length
  : 0;

setAllEmployeeCount(allActiveEmployeeCount);
setTotalEmployeeCount(allActiveEmployeeCount);

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
            duration_seconds:
              typeof t.duration_seconds === "number" ? t.duration_seconds : 0,
            duration_minutes:
              typeof t.duration_minutes === "number" ? t.duration_minutes : null,
            catalog_visible: t.catalog_visible !== false,
            catalog_key: t.catalog_key ? String(t.catalog_key) : null,
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
        tehlike_sinifi: normalizeHazardClass(c?.tehlike_sinifi),
      }))
      .filter((c: CompanyRow) => c.id && c.name)
      .sort((a: CompanyRow, b: CompanyRow) => a.name.localeCompare(b.name, "tr"))
  : [];

      setUsers(normalizedUsers);
      setTrainings(normalizedTrainings);
      setCompanies(normalizedCompanies);
      setError(apiErrors.join(" • "));
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
    setEmployeeTrainingMap({});
    setTotalEmployeeCount(allEmployeeCount);
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
    setTotalEmployeeCount(
      Array.isArray(json?.data)
        ? json.data.filter((e: any) => e.active !== false).length
        : 0
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



  const canManageTraining = [
    "super_admin",
    "admin",
    "company_admin",
  ].includes(sessionRole);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/admin/me", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const json: MeResponse = await response.json().catch(() => ({}));
        if (!active) return;

        if (!response.ok) {
          setSessionRole("");
          setError(
            `Oturum doğrulanamadı (${response.status}): ${
              json?.error || "Lütfen sayfayı yenileyin."
            }`
          );
          return;
        }

        setSessionRole(String(json?.user?.role || "").trim());
      } catch (sessionError) {
        if (!active) return;
        setSessionRole("");
        setError(
          sessionError instanceof Error
            ? sessionError.message
            : "Oturum bilgisi okunamadı."
        );
      } finally {
        if (active) setSessionLoading(false);
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    void loadAll();
  }, [sessionLoading]);

  useEffect(() => {
    if (sessionLoading || loading) return;

    if (companyFilter === "all") {
      setEmployees([]);
      setSelectedEmployees([]);
      setEmployeeTrainingMap({});
      setTotalEmployeeCount(allEmployeeCount);
      return;
    }

    void loadEmployeesByCompany(companyFilter);
  }, [companyFilter, sessionLoading, loading, allEmployeeCount]);

  useEffect(() => {
    const found =
      trainings.find((training) => training.id === trainingId) ||
      null;
    setSelectedTrainingInfo(found);
  }, [trainingId, trainings]);
  const selectedCompany = useMemo(
    () =>
      companyFilter === "all"
        ? null
        : companies.find((company) => company.id === companyFilter) || null,
    [companies, companyFilter]
  );

  const selectedHazardClass = selectedCompany?.tehlike_sinifi || "";
  const selectedHazardRule = useMemo(
    () => getHazardTrainingRule(selectedHazardClass),
    [selectedHazardClass]
  );

  const displayTrainings = useMemo(() => {
    if (companyFilter === "all") return trainings;

    const stats = new Map<
      string,
      {
        assigned_count: number;
        not_started_count: number;
        in_progress_count: number;
        completed_count: number;
      }
    >();

    Object.values(employeeTrainingMap || {}).forEach((items: any[]) => {
      (Array.isArray(items) ? items : []).forEach((item: any) => {
        const itemTrainingId = String(item?.training_id || "").trim();
        if (!itemTrainingId) return;

        const current = stats.get(itemTrainingId) || {
          assigned_count: 0,
          not_started_count: 0,
          in_progress_count: 0,
          completed_count: 0,
        };

        current.assigned_count += 1;

        const status = String(item?.status || "").toLowerCase();
        if (status === "completed" || status === "app_record") {
          current.completed_count += 1;
        } else if (status === "in_progress") {
          current.in_progress_count += 1;
        } else {
          current.not_started_count += 1;
        }

        stats.set(itemTrainingId, current);
      });
    });

    return trainings.map((training) => {
      const firmStats = stats.get(training.id);

      return {
        ...training,
        assigned_count: firmStats?.assigned_count || 0,
        not_started_count: firmStats?.not_started_count || 0,
        in_progress_count: firmStats?.in_progress_count || 0,
        completed_count: firmStats?.completed_count || 0,
      };
    });
  }, [trainings, companyFilter, employeeTrainingMap]);



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
    const totalAssigned = displayTrainings.reduce(
      (sum, t) => sum + t.assigned_count,
      0
    );

    const totalNotStarted = displayTrainings.reduce(
      (sum, t) => sum + t.not_started_count,
      0
    );

    const totalInProgress = displayTrainings.reduce(
      (sum, t) => sum + t.in_progress_count,
      0
    );

    const totalCompleted = displayTrainings.reduce(
      (sum, t) => sum + t.completed_count,
      0
    );

    // "Aktif Eğitim" çalışan atama sayısı değildir.
    // Eğitim kataloğunda görünür/aktif olan eğitim başlıklarının sayısıdır.
    const activeTrainingCount = displayTrainings.filter(
      (training) => training.catalog_visible !== false
    ).length;

    return {
      totalAssigned,
      totalNotStarted,
      totalInProgress,
      totalCompleted,
      activeTrainingCount,
    };
  }, [displayTrainings]);

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

      const data: AssignResponse = await res.json().catch(() => ({}));

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

    displayTrainings.forEach((training) => {
      const label = normalizeTrainingTypeText(training.type);
      map.set(label, (map.get(label) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [displayTrainings]);

  const contentReadiness = useMemo(() => {
    const asyncTrainings = displayTrainings.filter(
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
  }, [displayTrainings]);

  const trainingOverviewItems = useMemo(() => {
    return [...displayTrainings]
      .sort((a, b) => b.assigned_count - a.assigned_count)
      .slice(0, 6)
      .map((training) => ({
        id: training.id,
        title: training.title,
        type: normalizeTrainingTypeText(training.type),
        duration: getTrainingDurationText(
          training.duration_seconds,
          training.duration_minutes
        ),
        assigned: training.assigned_count,
        completed: training.completed_count,
        inProgress: training.in_progress_count,
        notStarted: training.not_started_count,
        videoCount: training.video_count,
        preExamCount: training.pre_exam_count,
        finalExamCount: training.final_exam_count,
      }));
  }, [displayTrainings]);

  // Rol okunmadan alt eğitim bileşenlerini çalıştırma. Bazı yönetim
  // bileşenleri kendi API çağrılarında demo rolünü admin girişine yönlendiriyor.
  if (sessionLoading) {
    return (
      <main
        style={{
          minHeight: "100%",
          background: BRAND.bg,
          padding: "clamp(12px, 2vw, 24px)",
        }}
      >
        <div
          style={{
            ...cardStyle(),
            maxWidth: 1400,
            margin: "0 auto",
            fontWeight: 800,
          }}
        >
          Eğitim oturumu doğrulanıyor...
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100%",
        background: BRAND.bg,
        padding: "clamp(12px, 2vw, 24px)",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", width: "100%" }}>
        <div
          style={{
            ...cardStyle(),
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14,
            alignItems: "stretch",
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 8 }}>
              Firma Seçimi
            </div>
            <select
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setSelectedUsers([]);
                setSelectedEmployees([]);
                setCertificatePanelOpen(false);
                setEmployeeTrainingPanelOpen(false);
              }}
              style={{
                width: "100%",
                padding: "13px 14px",
                borderRadius: 12,
                border: `1px solid ${BRAND.border}`,
                background: "#fff",
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              <option value="all">Tüm Firmalar</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <div style={{ marginTop: 8, fontSize: 12, color: BRAND.muted }}>
              Firma değiştirildiğinde çalışan ve eğitim verileri otomatik yenilenir.
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              border: `1px solid ${BRAND.border}`,
              background: "#fffaf8",
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.muted }}>
              Tehlike Sınıfı
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 20,
                fontWeight: 900,
                color: selectedHazardClass ? BRAND.redDark : BRAND.muted,
              }}
            >
              {companyFilter === "all"
                ? "Firma seçiniz"
                : selectedHazardClass || "Tanımlı değil"}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: BRAND.muted }}>
              Firma kaydından otomatik alınır.
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              border: `1px solid ${BRAND.border}`,
              background: "#f8fafc",
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: BRAND.muted }}>
              Eğitim Süresi / Yenileme
            </div>
            <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900 }}>
              {selectedHazardRule.minimumHours > 0
                ? `${selectedHazardRule.minimumHours} saat`
                : "-"}
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: BRAND.muted }}>
              {selectedHazardRule.renewalYears > 0
                ? `${selectedHazardRule.renewalYears} yılda bir`
                : "Firma seçildiğinde otomatik belirlenir."}
            </div>
          </div>
        </div>

        <TrainingExecutiveHero
          title="D-SEC Eğitim Yönetim Merkezi"
          companyName={
            companyFilter === "all"
              ? "Tüm Firmalar"
              : companies.find(
                  (company) => company.id === companyFilter
                )?.name || "Seçili Firma"
          }
          totalTrainings={displayTrainings.length}
          activeTrainings={trainingTotals.activeTrainingCount}
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
          totalTrainings={displayTrainings.length}
          totalAssigned={trainingTotals.totalAssigned}
          completed={trainingTotals.totalCompleted}
          inProgress={trainingTotals.totalInProgress}
          notStarted={trainingTotals.totalNotStarted}
        />

        {canManageTraining ? (
          <>
        <TrainingExecutiveDashboard
          trainings={displayTrainings}
          totalEmployees={totalEmployeeCount}
          selectedCompanyName={
            companyFilter === "all"
              ? "Tüm Firmalar"
              : companies.find(
                  (company) => company.id === companyFilter
                )?.name || "Seçili Firma"
          }
        />

        <TrainingComplianceEngine
          trainings={displayTrainings}
          totalEmployees={totalEmployeeCount}
          selectedCompanyName={
            companyFilter === "all"
              ? "Tüm Firmalar"
              : selectedCompany?.name || "Seçili Firma"
          }
          selectedHazardClass={selectedHazardClass}
        />

        <section
          style={{
            ...cardStyle(),
            marginBottom: 20,
            padding: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "18px 20px",
              display: "flex",
              gap: 16,
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 0.4,
                  color: BRAND.red,
                  textTransform: "uppercase",
                }}
              >
                Sertifika Yönetimi
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 18,
                  fontWeight: 900,
                  color: BRAND.text,
                }}
              >
                Premium Sertifika Motoru V2
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  color: BRAND.muted,
                  lineHeight: 1.5,
                }}
              >
                Uzun sertifika listesi kurumsal kompakt görünümde tutulur.
                Detayları yalnızca ihtiyaç halinde açabilirsiniz.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCertificatePanelOpen((prev) => !prev)}
              style={{
                border: `1px solid ${
                  certificatePanelOpen ? "#fecaca" : BRAND.border
                }`,
                background: certificatePanelOpen ? "#fff7f7" : BRAND.white,
                color: certificatePanelOpen ? BRAND.redDark : BRAND.text,
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 900,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {certificatePanelOpen
                ? "Detayları Kapat"
                : "Sertifika Yönetimini Aç"}
            </button>
          </div>

          {certificatePanelOpen ? (
            <div
              style={{
                borderTop: `1px solid ${BRAND.border}`,
                padding: 18,
                maxHeight: "760px",
                overflowY: "auto",
                background: "#fbfcfe",
              }}
            >
              <TrainingCertificateEngineV2
                selectedTrainingId={trainingId}
              />
            </div>
          ) : null}
        </section>

        <div id="training-reports-section" style={{ scrollMarginTop: 24 }}>
          <TrainingReportCenter
            trainings={displayTrainings}
            totalEmployees={totalEmployeeCount}
            selectedCompanyName={
              companyFilter === "all"
                ? "Tüm Firmalar"
                : companies.find(
                    (company) => company.id === companyFilter
                  )?.name || "Seçili Firma"
            }
          />
        </div>
          </>
        ) : (
          <div
            style={{
              ...cardStyle(),
              marginBottom: 20,
              borderColor: "#fecaca",
              background: "#fff7f7",
              color: "#991b1b",
              fontWeight: 800,
            }}
          >
            Demo hesabı salt okunur. Eğitim verilerini ve istatistiklerini
            inceleyebilirsiniz; yönetim motorları ve kayıt işlemleri kapalıdır.
          </div>
        )}

        <TrainingAnalytics
          totalAssigned={trainingTotals.totalAssigned}
          completed={trainingTotals.totalCompleted}
          inProgress={trainingTotals.totalInProgress}
          notStarted={trainingTotals.totalNotStarted}
          typeDistribution={trainingTypeDistribution}
          totalTrainings={displayTrainings.length}
        />

        <DoraTraining
          totalEmployees={totalEmployeeCount}
          totalTrainings={displayTrainings.length}
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


        {canManageTraining ? (
          <>
        <div id="training-catalog-section" style={{ scrollMarginTop: 24 }}>
          <TrainingCatalog
            trainings={displayTrainings}
            selectedTrainingId={trainingId}
            onSelectTraining={setTrainingId}
            onChanged={loadAll}
          />
        </div>

        <TrainingExamCenter
          trainings={displayTrainings}
          selectedTrainingId={trainingId}
          onSelectTraining={setTrainingId}
        />

        <TrainingCertificateCenter
          trainings={displayTrainings}
          selectedTrainingId={trainingId}
          onSelectTraining={setTrainingId}
        />

        <TrainingAuditCenter
          selectedTrainingId={trainingId}
        />


        <div
          id="training-video-manager-section"
          style={{ scrollMarginTop: 24 }}
        >
          {selectedTrainingInfo ? (
            <TrainingVideoManager
              trainingId={trainingId}
              trainingTitle={selectedTrainingInfo.title}
              onChanged={loadAll}
            />
          ) : (
            <div
              style={{
                ...cardStyle(),
                marginBottom: 20,
                borderColor: "#ddd6fe",
                background: "#faf5ff",
                color: "#6b21a8",
                fontWeight: 800,
              }}
            >
              İçerik yüklemek için önce yukarıdaki Eğitim Kataloğu bölümünden
              bir eğitim seçin.
            </div>
          )}
        </div>
          </>
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


        {canManageTraining ? (
          <>
        <ParticipantImportCenter onCompleted={loadAll} />

        <section
          style={{
            ...cardStyle(),
            marginBottom: 20,
            padding: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "18px 20px",
              display: "flex",
              gap: 16,
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 0.4,
                  color: BRAND.red,
                  textTransform: "uppercase",
                }}
              >
                Çalışan Eğitim Yönetimi
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 18,
                  fontWeight: 900,
                  color: BRAND.text,
                }}
              >
                Çalışanlar ve Eğitim Atamaları
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  color: BRAND.muted,
                  lineHeight: 1.5,
                }}
              >
                {companyFilter === "all"
                  ? "Çalışan yönetimi için önce üst bölümden firma seçin."
                  : `${selectedCompany?.name || "Seçili firma"} • ${totalEmployeeCount} çalışan`}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setEmployeeTrainingPanelOpen((prev) => !prev)}
              disabled={companyFilter === "all"}
              style={{
                border: `1px solid ${
                  companyFilter === "all"
                    ? "#e5e7eb"
                    : employeeTrainingPanelOpen
                    ? "#fecaca"
                    : BRAND.border
                }`,
                background:
                  companyFilter === "all"
                    ? "#f3f4f6"
                    : employeeTrainingPanelOpen
                    ? "#fff7f7"
                    : BRAND.white,
                color:
                  companyFilter === "all"
                    ? "#9ca3af"
                    : employeeTrainingPanelOpen
                    ? BRAND.redDark
                    : BRAND.text,
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 900,
                cursor: companyFilter === "all" ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {employeeTrainingPanelOpen
                ? "Çalışan Listesini Kapat"
                : "Çalışan Eğitim Yönetimini Aç"}
            </button>
          </div>

          {employeeTrainingPanelOpen && companyFilter !== "all" ? (
            <div
              style={{
                borderTop: `1px solid ${BRAND.border}`,
                padding: 18,
                maxHeight: "820px",
                overflowY: "auto",
                background: "#fbfcfe",
              }}
            >
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
          ) : null}
        </section>
          </>
        ) : null}

        
      </div>
      </main>
  );
}