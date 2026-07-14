"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TrainingExecutiveHero,
  TrainingKpiGrid,
} from "../../../components/training-v2";

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

type EmployeeRow = {
  id: string;
  firm_id: string;
  full_name: string;
  job_title?: string | null;
  phone?: string | null;
  email?: string | null;
  registry_no?: string | null;
  active: boolean;
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

type TrainingVideoRow = {
  id: string;
  training_id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration_seconds: number | null;
  sort_order: number | null;
  is_required: boolean | null;
  is_active: boolean | null;
};

type AssignResponse = {
  success?: boolean;
  insertedCount?: number;
  skippedCount?: number;
  emailedCount?: number;
  mailFailedCount?: number;
  noEmailCount?: number;
  trainingTitle?: string | null;
  message?: string;
  mailResults?: Array<{
    userId: string;
    email: string | null;
    ok: boolean;
    reason?: string;
  }>;
  error?: string;
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
    const [trainingVideos, setTrainingVideos] = useState<TrainingVideoRow[]>([]);
const [videosLoading, setVideosLoading] = useState(false);
const [videoTitle, setVideoTitle] = useState("");
const [videoDescription, setVideoDescription] = useState("");
const [videoUrl, setVideoUrl] = useState("");
const [videoDurationSeconds, setVideoDurationSeconds] = useState("");
const [videoSortOrder, setVideoSortOrder] = useState("1");
const [savingVideo, setSavingVideo] = useState(false);
const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
const [editingVideoTitle, setEditingVideoTitle] = useState("");
const [editingVideoDescription, setEditingVideoDescription] = useState("");
const [editingVideoUrl, setEditingVideoUrl] = useState("");
const [editingVideoDuration, setEditingVideoDuration] = useState("");
const [editingVideoSortOrder, setEditingVideoSortOrder] = useState("");
  const [assignSummary, setAssignSummary] = useState<AssignResponse | null>(null);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
const [previewErrors, setPreviewErrors] = useState<Record<number, string[]>>({});
const [previewReady, setPreviewReady] = useState(false);
const [previewLoading, setPreviewLoading] = useState(false);

  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<string>("");
  const [showUserModal, setShowUserModal] = useState(false);
const [editingUser, setEditingUser] = useState<UserRow | null>(null);
const [formFullName, setFormFullName] = useState("");
const [formEmail, setFormEmail] = useState("");
const [formPassword, setFormPassword] = useState("");
const [formCompanyId, setFormCompanyId] = useState("");
const [formIsActive, setFormIsActive] = useState(true);
const [savingUser, setSavingUser] = useState(false);

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


const loadTrainingVideos = async (selectedTrainingId: string) => {
  if (!selectedTrainingId) {
    setTrainingVideos([]);
    return;
  }

  try {
    setVideosLoading(true);

    const res = await fetch(
      `/api/admin/training-videos?trainingId=${encodeURIComponent(
        selectedTrainingId
      )}`,
      {
        cache: "no-store",
        credentials: "include",
      }
    );

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json?.error || "Videolar alınamadı.");
      setTrainingVideos([]);
      return;
    }

    setTrainingVideos(Array.isArray(json?.data) ? json.data : []);
  } finally {
    setVideosLoading(false);
  }
};

const saveTrainingVideo = async () => {
  if (!trainingId) {
    alert("Önce eğitim seç.");
    return;
  }

  if (!videoTitle.trim()) {
    alert("Video başlığı zorunlu.");
    return;
  }

  if (!videoUrl.trim()) {
    alert("Video URL zorunlu.");
    return;
  }

  try {
    setSavingVideo(true);

    const res = await fetch("/api/admin/training-videos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        trainingId,
        title: videoTitle.trim(),
        description: videoDescription.trim(),
        videoUrl: videoUrl.trim(),
        durationSeconds: Number(videoDurationSeconds || 0),
        sortOrder: Number(videoSortOrder || 1),
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json?.error || "Video eklenemedi.");
      return;
    }

    setVideoTitle("");
    setVideoDescription("");
    setVideoUrl("");
    setVideoDurationSeconds("");
    setVideoSortOrder(String(trainingVideos.length + 2));

    await loadTrainingVideos(trainingId);
    await loadAll();

    alert("Video eklendi ✅");
  } catch (err) {
    console.error(err);
    alert("Video eklenirken hata oluştu.");
  } finally {
    setSavingVideo(false);
  }
};

const deleteTrainingVideo = async (video: TrainingVideoRow) => {
  const ok = window.confirm(
    `"${video.title}" videosunu silmek istediğine emin misin?`
  );

  if (!ok) return;

  try {
    const res = await fetch(`/api/admin/training-videos/${video.id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json?.error || "Video silinemedi.");
      return;
    }

    await loadAll();

    if (trainingId) {
      await loadTrainingVideos(trainingId);
    }

    alert("Video silindi ✅");
  } catch (err) {
    console.error(err);
    alert("Video silinirken hata oluştu.");
  }
};

const updateTrainingVideo = async () => {
  if (!editingVideoId) return;

  if (!editingVideoTitle.trim()) {
    alert("Video başlığı zorunlu.");
    return;
  }

  if (!editingVideoUrl.trim()) {
    alert("Video URL zorunlu.");
    return;
  }

  try {
    const res = await fetch(`/api/admin/training-videos/${editingVideoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        title: editingVideoTitle.trim(),
        description: editingVideoDescription.trim(),
        videoUrl: editingVideoUrl.trim(),
        durationSeconds: Number(editingVideoDuration || 0),
        sortOrder: Number(editingVideoSortOrder || 1),
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json?.error || "Video güncellenemedi.");
      return;
    }

    setEditingVideoId(null);
    setEditingVideoTitle("");
    setEditingVideoDescription("");
    setEditingVideoUrl("");
    setEditingVideoDuration("");
    setEditingVideoSortOrder("");

    await loadAll();

    if (trainingId) {
      await loadTrainingVideos(trainingId);
    }

    alert("Video güncellendi ✅");
  } catch (err) {
    console.error(err);
    alert("Video güncellenirken hata oluştu.");
  }
};

const startEditVideo = (video: TrainingVideoRow) => {
  setEditingVideoId(video.id);
  setEditingVideoTitle(video.title || "");
  setEditingVideoDescription(video.description || "");
  setEditingVideoUrl(video.video_url || "");
  setEditingVideoDuration(
    video.duration_seconds ? String(video.duration_seconds) : ""
  );
  setEditingVideoSortOrder(
    video.sort_order ? String(video.sort_order) : "1"
  );
};

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
  const found = trainings.find((t) => t.id === trainingId) || null;
  setSelectedTrainingInfo(found);

  if (trainingId) {
    void loadTrainingVideos(trainingId);
  } else {
    setTrainingVideos([]);
  }
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

  const selectedCompanyCount = useMemo(() => {
    return new Set(selectedUserDetails.map((u) => u.company)).size;
  }, [selectedUserDetails]);

  const selectedWithoutEmailCount = useMemo(() => {
    return selectedUserDetails.filter((u) => !u.email || u.email === "-").length;
  }, [selectedUserDetails]);

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
  
  const downloadTemplate = () => {
  const csv =
    "full_name,email,password,company_id,is_active\n" +
    "Ali Veli,ali.veli@mail.com,123456,FIRMA_ID,true\n";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "dsec-egitim-katilimci-sablon.csv";
  a.click();

  URL.revokeObjectURL(url);
};

const parseFileForPreview = async (file: File) => {
  setPreviewLoading(true);
  setPreviewRows([]);
  setPreviewErrors({});
  setPreviewReady(false);

  try {
    let rows: any[] = [];

    if (file.name.endsWith(".csv")) {
      const text = await file.text();
      const lines = text.replace(/\r/g, "").split("\n").filter(Boolean);
      const headers = lines[0].split(",");

      rows = lines.slice(1).map((line) => {
        const values = line.split(",");
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h.trim()] = values[i]?.trim() || "";
        });
        return obj;
      });
    } else if (file.name.endsWith(".xlsx")) {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
    }

    // 🔥 VALIDATION
    const errors: Record<number, string[]> = {};

    rows.forEach((row, index) => {
      const rowErrors: string[] = [];

      if (!row.full_name) rowErrors.push("Ad soyad eksik");
      if (!row.email) rowErrors.push("Email eksik");
      if (!row.password) rowErrors.push("Şifre eksik");
      if (!row.company_id) rowErrors.push("Firma eksik");

      if (rowErrors.length) {
        errors[index] = rowErrors;
      }
    });

    setPreviewRows(rows);
    setPreviewErrors(errors);
    setPreviewReady(true);

  } catch (err) {
    console.error(err);
    alert("Dosya okunamadı");
  } finally {
    setPreviewLoading(false);
  }
};

const uploadBulkParticipants = async () => {
  if (!bulkFile) {
    alert("Önce CSV veya Excel dosyası seç.");
    return;
  }

  const allowedTypes = [
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const isAllowedByName =
    bulkFile.name.endsWith(".csv") || bulkFile.name.endsWith(".xlsx");

  if (!allowedTypes.includes(bulkFile.type) && !isAllowedByName) {
    alert("Sadece CSV veya Excel (.xlsx) dosyası yükleyebilirsin.");
    return;
  }

  if (!previewReady) {
    alert("Önce dosyayı seç ve önizlemenin oluşmasını bekle.");
    return;
  }

  if (Object.keys(previewErrors).length > 0) {
    const ok = window.confirm(
      "Dosyada hatalı satırlar var. Yine de yüklemeye devam etmek istiyor musun?"
    );

    if (!ok) return;
  }

  try {
    setBulkUploading(true);
    setBulkResult("");

    const formData = new FormData();
    formData.append("file", bulkFile);

    const res = await fetch("/api/admin/training-users/bulk-upload", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json?.error || "Toplu yükleme başarısız.");
      setBulkResult(json?.error || "Toplu yükleme başarısız.");
setBulkErrors(json.errors || []);
return;
    }

    setBulkResult(
      `Yükleme tamamlandı. Eklenen: ${json.insertedCount || 0}, Atlanan: ${
        json.skippedCount || 0
      }`
    );

    setBulkFile(null);
    await loadAll();
  } catch (err) {
    console.error(err);
    alert("Toplu yükleme sırasında hata oluştu.");
  } finally {
    setBulkUploading(false);
  }
};

const resetUserForm = () => {
  setEditingUser(null);
  setFormFullName("");
  setFormEmail("");
  setFormPassword("");
  setFormCompanyId("");
  setFormIsActive(true);
};

const openCreateUserModal = () => {
  resetUserForm();
  setShowUserModal(true);
};

const openEditUserModal = (user: UserRow) => {
  setEditingUser(user);
  setFormFullName(user.full_name);
  setFormEmail(user.email === "-" ? "" : user.email);
  setFormPassword("");
  setFormCompanyId(user.company_id || "");
  setFormIsActive(user.is_active);
  setShowUserModal(true);
};

const saveTrainingUser = async () => {
  if (!formFullName.trim()) {
    alert("Ad soyad zorunlu.");
    return;
  }

  if (!formEmail.trim()) {
    alert("Email zorunlu.");
    return;
  }

  if (!editingUser && !formPassword.trim()) {
    alert("Yeni kullanıcı için şifre zorunlu.");
    return;
  }

  if (!formCompanyId.trim()) {
    alert("Firma seçimi zorunlu.");
    return;
  }

  try {
    setSavingUser(true);

    const endpoint = editingUser
      ? "/api/admin/users/update"
      : "/api/admin/users/create";

    const body = editingUser
      ? {
          userId: editingUser.id,
          full_name: formFullName.trim(),
          email: formEmail.trim().toLowerCase(),
          password: formPassword.trim() || null,
          role: "training_user",
          company_id: formCompanyId,
          is_active: formIsActive,
        }
      : {
          full_name: formFullName.trim(),
          email: formEmail.trim().toLowerCase(),
          password: formPassword.trim(),
          role: "training_user",
          company_id: formCompanyId,
          is_active: formIsActive,
        };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json?.error || "Kullanıcı kaydedilemedi.");
      return;
    }

    setShowUserModal(false);
    resetUserForm();
    await loadAll();
  } catch (err) {
    console.error(err);
    alert("Kullanıcı kaydedilirken hata oluştu.");
  } finally {
    setSavingUser(false);
  }
};

const toggleUserActive = async (user: UserRow) => {
  try {
    const res = await fetch("/api/admin/users/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        userId: user.id,
        full_name: user.full_name,
        email: user.email,
        password: null,
        role: "training_user",
        company_id: user.company_id,
        is_active: !user.is_active,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json?.error || "Durum güncellenemedi.");
      return;
    }

    await loadAll();
  } catch (err) {
    console.error(err);
    alert("Durum güncellenirken hata oluştu.");
  }
};

const deleteTrainingUser = async (user: UserRow) => {
  const ok = window.confirm(
    `${user.full_name} isimli katılımcıyı silmek istediğine emin misin?`
  );

  if (!ok) return;

  try {
    const res = await fetch("/api/admin/users/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        userId: user.id,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json?.error || "Kullanıcı silinemedi.");
      return;
    }

    await loadAll();
  } catch (err) {
    console.error(err);
    alert("Kullanıcı silinirken hata oluştu.");
  }
};

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
          totalEmployees={totalEmployeeCount}
          totalTrainings={trainings.length}
          totalAssigned={trainingTotals.totalAssigned}
          completed={trainingTotals.totalCompleted}
          inProgress={trainingTotals.totalInProgress}
          notStarted={trainingTotals.totalNotStarted}
          selectedCount={selectedCount}
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

        <div
          style={{
            ...cardStyle(),
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              Eğitim
            </div>
            <select
              value={trainingId}
              onChange={(e) => setTrainingId(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${BRAND.border}`,
                background: "#fff",
                fontSize: 14,
              }}
            >
              <option value="">Eğitim seç</option>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              border: `1px solid ${BRAND.border}`,
              borderRadius: 16,
              padding: 14,
              background: "#fafafa",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              Seçilen Eğitim Özeti
            </div>

            {selectedTrainingInfo ? (
              <>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 900,
                    lineHeight: 1.35,
                    wordBreak: "break-word",
                  }}
                >
                  {selectedTrainingInfo.title}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: BRAND.muted,
                    lineHeight: 1.6,
                  }}
                >
                  {selectedTrainingInfo.description}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <span style={badgeStyle("#f3f4f6", "#d1d5db", "#374151")}>
                    Tür: {selectedTrainingInfo.type}
                  </span>
                  <span style={badgeStyle("#eff6ff", "#bfdbfe", "#1d4ed8")}>
                    Süre:{" "}
                    {typeof selectedTrainingInfo.duration_minutes === "number"
                      ? `${selectedTrainingInfo.duration_minutes} dk`
                      : "Tanımlı değil"}
                  </span>
                  <span style={badgeStyle("#f0fdf4", "#86efac", "#166534")}>
  Video: {selectedTrainingInfo.video_count}
</span>

<span style={badgeStyle("#eff6ff", "#bfdbfe", "#1d4ed8")}>
  Ön Sınav: {selectedTrainingInfo.pre_exam_count}
</span>

<span style={badgeStyle("#f5f3ff", "#c4b5fd", "#5b21b6")}>
  Final: {selectedTrainingInfo.final_exam_count}
</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: BRAND.muted }}>
                Henüz eğitim seçilmedi.
              </div>
            )}
          </div>
        </div>

{selectedTrainingInfo ? (
  <div style={{ ...cardStyle(), marginBottom: 20 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 16,
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
          Video Yönetimi
        </h2>
        <div style={{ marginTop: 6, fontSize: 13, color: BRAND.muted }}>
          Seçilen eğitime bağlı videoları sıraya göre ekle ve yönet.
        </div>
      </div>

      <span style={badgeStyle("#f0fdf4", "#86efac", "#166534")}>
        Toplam Video: {trainingVideos.length}
      </span>
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
        marginBottom: 16,
      }}
    >
      <input
        value={videoTitle}
        onChange={(e) => setVideoTitle(e.target.value)}
        placeholder="Video başlığı"
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border: `1px solid ${BRAND.border}`,
        }}
      />

      <input
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="Video URL (.mp4)"
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border: `1px solid ${BRAND.border}`,
        }}
      />

      <input
        value={videoDurationSeconds}
        onChange={(e) => setVideoDurationSeconds(e.target.value)}
        placeholder="Süre saniye"
        type="number"
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border: `1px solid ${BRAND.border}`,
        }}
      />

      <input
        value={videoSortOrder}
        onChange={(e) => setVideoSortOrder(e.target.value)}
        placeholder="Sıra"
        type="number"
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border: `1px solid ${BRAND.border}`,
        }}
      />
    </div>

    <textarea
      value={videoDescription}
      onChange={(e) => setVideoDescription(e.target.value)}
      placeholder="Video açıklaması"
      rows={3}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        resize: "vertical",
        marginBottom: 12,
      }}
    />

    <button
      type="button"
      onClick={saveTrainingVideo}
      disabled={savingVideo}
      style={{
        border: "none",
        borderRadius: 12,
        padding: "12px 16px",
        background: savingVideo ? "#9ca3af" : "#2563eb",
        color: "#fff",
        fontWeight: 900,
        cursor: savingVideo ? "not-allowed" : "pointer",
        marginBottom: 18,
      }}
    >
      {savingVideo ? "Kaydediliyor..." : "Video Ekle"}
    </button>

{editingVideoId ? (
  <div
    style={{
      marginTop: 14,
      marginBottom: 18,
      padding: 16,
      borderRadius: 16,
      background: "#eff6ff",
      border: "1px solid #bfdbfe",
    }}
  >
    <div style={{ fontWeight: 900, marginBottom: 12 }}>
      Video Düzenle
    </div>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
        marginBottom: 12,
      }}
    >
      <input
        value={editingVideoTitle}
        onChange={(e) => setEditingVideoTitle(e.target.value)}
        placeholder="Video başlığı"
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border: `1px solid ${BRAND.border}`,
        }}
      />

      <input
        value={editingVideoUrl}
        onChange={(e) => setEditingVideoUrl(e.target.value)}
        placeholder="Video URL"
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border: `1px solid ${BRAND.border}`,
        }}
      />

      <input
        value={editingVideoDuration}
        onChange={(e) => setEditingVideoDuration(e.target.value)}
        placeholder="Süre saniye"
        type="number"
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border: `1px solid ${BRAND.border}`,
        }}
      />

      <input
        value={editingVideoSortOrder}
        onChange={(e) => setEditingVideoSortOrder(e.target.value)}
        placeholder="Sıra"
        type="number"
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border: `1px solid ${BRAND.border}`,
        }}
      />
    </div>

    <textarea
      value={editingVideoDescription}
      onChange={(e) => setEditingVideoDescription(e.target.value)}
      placeholder="Video açıklaması"
      rows={3}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${BRAND.border}`,
        resize: "vertical",
        marginBottom: 12,
      }}
    />

    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={updateTrainingVideo}
        style={{
          border: "none",
          borderRadius: 12,
          padding: "12px 16px",
          background: "#16a34a",
          color: "#fff",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        Değişiklikleri Kaydet
      </button>

      <button
        type="button"
        onClick={() => setEditingVideoId(null)}
        style={{
          border: "none",
          borderRadius: 12,
          padding: "12px 16px",
          background: "#111827",
          color: "#fff",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        Vazgeç
      </button>
    </div>
  </div>
) : null}

    {videosLoading ? (
      <div style={{ color: BRAND.muted }}>Videolar yükleniyor...</div>
    ) : trainingVideos.length === 0 ? (
      <div style={{ color: BRAND.muted }}>
        Bu eğitime henüz video eklenmemiş.
      </div>
    ) : (
      <div style={{ display: "grid", gap: 10 }}>
        {trainingVideos.map((video) => (
          <div
            key={video.id}
            style={{
              padding: 14,
              borderRadius: 14,
              border: `1px solid ${BRAND.border}`,
              background: "#f9fafb",
              display: "grid",
              gridTemplateColumns: "60px 1fr auto",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#fee2e2",
                color: "#991b1b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
              }}
            >
              {video.sort_order || "-"}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 900 }}>{video.title}</div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: BRAND.muted,
                  wordBreak: "break-all",
                }}
              >
                {video.video_url}
              </div>
              <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                <span style={badgeStyle("#fff", "#e5e7eb", "#374151")}>
                  Süre: {video.duration_seconds || 0} sn
                </span>
                <span
                  style={
                    video.is_active
                      ? badgeStyle("#dcfce7", "#86efac", "#166534")
                      : badgeStyle("#fee2e2", "#fca5a5", "#b91c1c")
                  }
                >
                  {video.is_active ? "Aktif" : "Pasif"}
                </span>
              </div>
            </div>

            <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 8,
  }}
>
  <a
    href={video.video_url}
    target="_blank"
    rel="noreferrer"
    style={{
      padding: "8px 10px",
      borderRadius: 10,
      background: "#111827",
      color: "#fff",
      textDecoration: "none",
      fontSize: 12,
      fontWeight: 800,
      textAlign: "center",
    }}
  >
    Aç
  </a>

<button
  type="button"
  onClick={() => startEditVideo(video)}
  style={{
    padding: "8px 10px",
    borderRadius: 10,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  }}
>
  Düzenle
</button>

  <button
    type="button"
    onClick={() => deleteTrainingVideo(video)}
    style={{
      padding: "8px 10px",
      borderRadius: 10,
      background: "#dc2626",
      color: "#fff",
      border: "none",
      fontSize: 12,
      fontWeight: 800,
      cursor: "pointer",
    }}
  >
    Sil
  </button>
</div>
          </div>
        ))}
      </div>
    )}
  </div>
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

{/* TOPLU YÜKLEME */}
<div style={{ ...cardStyle(), marginBottom: 20 }}>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      alignItems: "center",
      flexWrap: "wrap",
      marginBottom: 14,
    }}
  >
    <div>
      <div style={{ fontWeight: 900, fontSize: 18 }}>
        Toplu Katılımcı Yükleme
      </div>
      <div style={{ marginTop: 6, fontSize: 13, color: BRAND.muted }}>
        CSV veya Excel dosyası yükleyerek eğitim katılımcılarını toplu oluştur.
      </div>
    </div>

    <button
      type="button"
      onClick={downloadTemplate}
      style={{
        border: "none",
        borderRadius: 10,
        padding: "10px 14px",
        background: "#111827",
        color: "#fff",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      Şablon İndir
    </button>
  </div>

  <div
    onDragOver={(e) => e.preventDefault()}
    onDrop={(e) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];

      if (file) {
        setBulkFile(file);
        void parseFileForPreview(file);
      }
    }}
    style={{
      border: "2px dashed #cbd5e1",
      padding: 20,
      borderRadius: 12,
      textAlign: "center",
      background: "#f8fafc",
      cursor: "pointer",
    }}
  >
    <div style={{ fontWeight: 800 }}>
      Dosyayı buraya sürükle bırak
    </div>

    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
      veya dosya seç — CSV / XLSX
    </div>

    <input
      type="file"
      accept=".csv,.xlsx"
      onChange={(e) => {
        const file = e.target.files?.[0];

        if (file) {
          setBulkFile(file);
          void parseFileForPreview(file);
        }
      }}
      style={{ marginTop: 10 }}
    />
  </div>

  <button
    type="button"
    onClick={uploadBulkParticipants}
    disabled={!bulkFile || bulkUploading || previewLoading}
    style={{
      marginTop: 12,
      border: "none",
      borderRadius: 10,
      padding: "10px 14px",
      background:
        !bulkFile || bulkUploading || previewLoading ? "#9ca3af" : "#16a34a",
      color: "#fff",
      fontWeight: 800,
      cursor:
        !bulkFile || bulkUploading || previewLoading ? "not-allowed" : "pointer",
    }}
  >
    {previewLoading
      ? "Önizleme hazırlanıyor..."
      : bulkUploading
      ? "Yükleniyor..."
      : "Toplu Yükle"}
  </button>

  <div style={{ marginTop: 10, fontSize: 12, color: BRAND.muted }}>
    Format: full_name, email, password, company_id, is_active
  </div>

  {bulkResult ? (
    <div
      style={{
        marginTop: 10,
        fontSize: 13,
        fontWeight: 800,
        color: bulkErrors.length > 0 ? "#b91c1c" : "#166534",
      }}
    >
      {bulkResult}
    </div>
  ) : null}
</div>

{previewReady && (
  <div style={{ ...cardStyle(), marginBottom: 20 }}>
    <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>
      Yükleme Önizleme
    </div>

    <div style={{ maxHeight: 300, overflow: "auto", fontSize: 13 }}>
      {previewRows.map((row, i) => {
        const hasError = previewErrors[i];

        return (
          <div
            key={i}
            style={{
              padding: 10,
              borderBottom: "1px solid #eee",
              background: hasError ? "#fee2e2" : "#f0fdf4",
            }}
          >
            <div>
              <b>{row.full_name}</b> - {row.email}
            </div>

            {hasError && (
              <div style={{ color: "#b91c1c", marginTop: 4 }}>
                {hasError.join(", ")}
              </div>
            )}
          </div>
        );
      })}
    </div>

    <div style={{ marginTop: 10, fontSize: 12 }}>
      Toplam: {previewRows.length} | Hatalı: {Object.keys(previewErrors).length}
    </div>
  </div>
)}


        <div style={{ ...cardStyle(), marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
          
     
            <div>
  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>
    Çalışan Eğitim Yönetimi
  </h2>

  <div style={{ marginTop: 6, fontSize: 13, color: BRAND.muted }}>
    Çalışan seç, online eğitim ata; app üzerinden gelen örgün/özel eğitim kayıtlarını ve tamamlanma durumlarını takip et.
  </div>
</div>

         
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <label
                style={{
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={(e) => toggleAllFiltered(e.target.checked)}
                />
                Filtrelenenleri seç
              </label>

              <button
                type="button"
                onClick={() => setSelectedEmployees([])}
                style={{
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 14px",
                  background: "#111827",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Seçimi Temizle
              </button>
            </div>
          </div>

          {companyFilter === "all" ? (
  <div style={{ color: BRAND.muted }}>
    Önce firma seç. Eğitim ataması sadece seçili firmaya bağlı çalışanlara yapılabilir.
  </div>
) : employeesLoading ? (
  <div>Çalışanlar yükleniyor...</div>
) : employees.length === 0 ? (
  <div style={{ color: BRAND.muted }}>
    Bu firmaya bağlı çalışan bulunamadı.
  </div>
) : (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
      gap: 14,
    }}
  >
    {employees
      .filter((emp) => emp.active)
      .filter((emp) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;

        return [
          emp.full_name,
          emp.email,
          emp.phone,
          emp.job_title,
          emp.registry_no,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .map((emp) => {
        const checked = selectedEmployees.includes(emp.id);

        return (
          <label
            key={emp.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              padding: 16,
              borderRadius: 16,
              border: checked ? "2px solid #2563eb" : `1px solid ${BRAND.border}`,
              background: checked ? "#eff6ff" : "#f9fafb",
              cursor: "pointer",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                const isChecked = e.target.checked;

                setSelectedEmployees((prev) =>
                  isChecked
                    ? prev.includes(emp.id)
                      ? prev
                      : [...prev, emp.id]
                    : prev.filter((id) => id !== emp.id)
                );
              }}
              style={{ marginTop: 4 }}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>
                {emp.full_name}
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: BRAND.muted,
                  lineHeight: 1.6,
                  wordBreak: "break-word",
                }}
              >
                {emp.job_title || "Ünvan yok"}
                <br />
                {emp.email || "E-posta yok"}
                <br />
                {emp.phone || "Telefon yok"}
              </div>

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span style={badgeStyle("#dcfce7", "#86efac", "#166534")}>
                  Aktif Çalışan
                </span>

                <span style={badgeStyle("#fff", "#e5e7eb", "#374151")}>
                  Sicil: {emp.registry_no || "-"}
                </span>
              </div>
            
<div
  style={{
    marginTop: 12,
    display: "grid",
    gap: 10,
  }}
>
  {(() => {
    const allRecords = employeeTrainingMap[emp.id] || [];
    const appRecords = allRecords.filter((item: any) => isAppTrainingRecord(item));
    const portalRecords = allRecords.filter((item: any) => !isAppTrainingRecord(item));

    return (
      <>
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid #dbeafe",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 900 }}>
              Portal Eğitim Atamaları
            </div>

            <span style={badgeStyle("#eff6ff", "#bfdbfe", "#1d4ed8")}>
              Asenkron / Senkron
            </span>
          </div>

          {portalRecords.length === 0 ? (
            <div style={{ fontSize: 12, color: BRAND.muted }}>
              Portal üzerinden atanmış eğitim yok.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              {portalRecords.map((item: any, index: number) => (
                <div
                  key={`${emp.id}-portal-${item.training_id || item.assignment_id || index}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 8,
                    alignItems: "center",
                    fontSize: 12,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 900,
                        color: BRAND.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title || "Eğitim"}
                    </div>

                    <div style={{ marginTop: 3, color: BRAND.muted, lineHeight: 1.5 }}>
  {normalizeTrainingTypeText(item.type)} • Portal Eğitimi
  <br />
  Süre: {getTrainingDurationText(item.duration_minutes)} • Tarih:{" "}
  {formatTrainingDate(item.completed_at || item.started_at || item.created_at)}
</div>
                  </div>

                  <span
                    style={{
                      fontWeight: 900,
                      color: getTrainingStatusColor(item.status),
                      whiteSpace: "nowrap",
                    }}
                  >
                    {getTrainingStatusLabel(item.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 900 }}>
              App Eğitim Kayıtları
            </div>

            <span style={badgeStyle("#ffedd5", "#fdba74", "#9a3412")}>
              Örgün / Özel
            </span>
          </div>

          {appRecords.length === 0 ? (
            <div style={{ fontSize: 12, color: BRAND.muted }}>
              App üzerinden gelen örgün/özel eğitim kaydı yok.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              {appRecords.map((item: any, index: number) => (
                <div
                  key={`${emp.id}-app-${item.training_id || item.assignment_id || index}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 8,
                    alignItems: "center",
                    fontSize: 12,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1px solid #fed7aa",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 900,
                        color: BRAND.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title || "Eğitim"}
                    </div>

                    <div style={{ marginTop: 3, color: BRAND.muted, lineHeight: 1.5 }}>
  {normalizeTrainingTypeText(item.type)} • App Kaydı
  <br />
  Süre: {getTrainingDurationText(item.duration_minutes)} • Tarih:{" "}
  {formatTrainingDate(item.completed_at || item.started_at || item.created_at)}
</div>
                  </div>

                  <span
                    style={{
                      fontWeight: 900,
                      color: "#7c2d12",
                      whiteSpace: "nowrap",
                    }}
                  >
                    App Kaydı
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    );
  })()}
</div>


            </div>
          </label>
        );
      })}
  </div>
)}
        
        </div>

        <div
          style={{
            ...cardStyle(),
            marginBottom: assignSummary ? 20 : 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          <div style={{ ...cardStyle(), padding: 14 }}>
            <div style={{ fontSize: 12, color: BRAND.muted }}>Seçilen Eğitim</div>
            <div style={{ fontSize: 15, fontWeight: 900, marginTop: 8 }}>
              {selectedTrainingInfo?.title || "-"}
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 14 }}>
            <div style={{ fontSize: 12, color: BRAND.muted }}>Seçilen Kişi</div>
            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 8 }}>
              {selectedCount}
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 14 }}>
            <div style={{ fontSize: 12, color: BRAND.muted }}>Firma Sayısı</div>
            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 8 }}>
              {selectedCompanyCount}
            </div>
          </div>

          <div style={{ ...cardStyle(), padding: 14 }}>
            <div style={{ fontSize: 12, color: BRAND.muted }}>Mail Eksik</div>
            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 8 }}>
              {selectedWithoutEmailCount}
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle(), marginTop: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: BRAND.text }}>
                Atama Özeti
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  color: BRAND.muted,
                  lineHeight: 1.6,
                }}
              >
                Seçilen eğitim: {selectedTrainingInfo?.title || "-"}
                <br />
                Seçilen çalışan sayısı: {selectedCount}
              </div>
            </div>

            <button
              onClick={assign}
              disabled={!trainingId || selectedCount === 0 || assigning}
              style={{
                border: "none",
                borderRadius: 14,
                padding: "14px 20px",
                background:
                  !trainingId || selectedCount === 0 || assigning
                    ? "#9ca3af"
                    : "#16a34a",
                color: "#fff",
                fontWeight: 900,
                cursor:
                  !trainingId || selectedCount === 0 || assigning
                    ? "not-allowed"
                    : "pointer",
                minWidth: 180,
                width: "100%",
                maxWidth: 260,
              }}
            >
              {assigning ? "İşleniyor..." : "Asenkron / Senkron Eğitimi Ata"}
            </button>
          </div>
        </div>

        {assignSummary ? (
          <div style={{ ...cardStyle(), marginTop: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
                  Son Atama Sonucu
                </h3>
                <div style={{ marginTop: 6, fontSize: 13, color: BRAND.muted }}>
                  {assignSummary.message || "İşlem sonucu hazır."}
                </div>
              </div>

              <div
                style={
                  assignSummary.success
                    ? badgeStyle("#dcfce7", "#86efac", "#166534")
                    : badgeStyle("#fee2e2", "#fca5a5", "#b91c1c")
                }
              >
                {assignSummary.success ? "Başarılı" : "Hata"}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
                marginBottom: 18,
              }}
            >
              {[
                ["Yeni Atama", assignSummary.insertedCount || 0],
                ["Atlandı", assignSummary.skippedCount || 0],
                ["Mail Başarılı", assignSummary.emailedCount || 0],
                ["Mail Başarısız", assignSummary.mailFailedCount || 0],
                ["Mail Yok", assignSummary.noEmailCount || 0],
              ].map(([label, value]) => (
                <div key={label as string} style={{ ...cardStyle(), padding: 14 }}>
                  <div style={{ fontSize: 12, color: BRAND.muted }}>{label}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, marginTop: 6 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                borderRadius: 16,
                border: `1px solid ${BRAND.border}`,
                overflow: "hidden",
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  padding: "14px 16px",
                  borderBottom: `1px solid ${BRAND.border}`,
                  background: "#f9fafb",
                  fontSize: 13,
                  fontWeight: 900,
                  color: BRAND.text,
                }}
              >
                Mail Sonuç Listesi
              </div>

              {!assignSummary.mailResults || assignSummary.mailResults.length === 0 ? (
                <div style={{ padding: 16, fontSize: 13, color: BRAND.muted }}>
                  Mail sonuç verisi bulunamadı.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 0 }}>
                  {assignSummary.mailResults.map((item, index) => (
                    <div
                      key={`${item.userId}-${index}`}
                      style={{
                        padding: "14px 16px",
                        borderTop:
                          index === 0 ? "none" : "1px solid #f1f5f9",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                        minWidth: 0,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: BRAND.text,
                            wordBreak: "break-word",
                          }}
                        >
                          {item.email || "Email tanımlı değil"}
                        </div>

                        {item.reason ? (
                          <div
                            style={{
                              marginTop: 6,
                              fontSize: 12,
                              color: BRAND.muted,
                              lineHeight: 1.5,
                            }}
                          >
                            {item.reason}
                          </div>
                        ) : null}
                      </div>

                      <div
                        style={
                          item.ok
                            ? badgeStyle("#dcfce7", "#86efac", "#166534")
                            : badgeStyle("#fee2e2", "#fca5a5", "#b91c1c")
                        }
                      >
                        {item.ok ? "Gönderildi" : "Başarısız"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
        
      </div>
      </main>
  );
}
