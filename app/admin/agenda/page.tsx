"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type AgendaTask = {
  id: string;
  sync_key: string | null;

  firm_id: number;
  web_firm_id: string | null;

  title: string;
  note: string | null;

  status: number;
  priority: number;
  progress: number;

  type: string;
  category: string | null;

  due_at: string | null;
  end_at: string | null;
  completed_at: string | null;

  location: string | null;
  meeting_link: string | null;

  assigned_to: string | null;
  assigned_by: string | null;
  participants_csv: string | null;

  is_all_day: boolean;

  repeat_type: string | null;
  repeat_until: string | null;

  source: string;

  is_archived: boolean;
  is_deleted: boolean;

  created_at: string;
  updated_at: string;
};

type AgendaResponse = {
  success?: boolean;
  records?: AgendaTask[];
  error?: string;
};

type CompanyItem = {
  id: string;
  name: string;
  local_firm_id: number | null;
  localId: number | null;
  is_active?: boolean;
};

type CompaniesResponse = {
  data?: CompanyItem[];
  error?: string;
};

type TaskType =
  | "TASK"
  | "MEETING"
  | "INSPECTION"
  | "TRAINING"
  | "VISIT"
  | "REMINDER";

type TaskFilter =
  | "ALL"
  | "OPEN"
  | "DONE"
  | "TODAY"
  | "UPCOMING"
  | "OVERDUE";

const TASK_TYPES: Array<{
  value: TaskType;
  label: string;
}> = [
  { value: "TASK", label: "Görev" },
  { value: "MEETING", label: "Toplantı" },
  { value: "INSPECTION", label: "Denetim" },
  { value: "TRAINING", label: "Eğitim" },
  { value: "VISIT", label: "Ziyaret" },
  { value: "REMINDER", label: "Hatırlatma" },
];

const FILTERS: Array<{
  value: TaskFilter;
  label: string;
}> = [
  { value: "ALL", label: "Tümü" },
  { value: "OPEN", label: "Açık" },
  { value: "DONE", label: "Tamamlanan" },
  { value: "TODAY", label: "Bugün" },
  { value: "UPCOMING", label: "Yaklaşan" },
  { value: "OVERDUE", label: "Geciken" },
];

function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function endOfToday(): Date {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now;
}

function endOfNextSevenDays(): Date {
  const result = endOfToday();
  result.setDate(result.getDate() + 7);
  return result;
}

function isToday(value: string | null): boolean {
  if (!value) return false;

  const date = new Date(value);

  return date >= startOfToday() && date <= endOfToday();
}

function isOverdue(task: AgendaTask): boolean {
  if (task.status === 1 || !task.due_at) return false;

  return new Date(task.due_at).getTime() < Date.now();
}

function isUpcoming(task: AgendaTask): boolean {
  if (task.status === 1 || !task.due_at) return false;

  const due = new Date(task.due_at);

  return due > endOfToday() && due <= endOfNextSevenDays();
}

function formatDateTime(value: string | null): string {
  if (!value) return "Tarih belirtilmedi";

  const date = new Date(value);

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function typeLabel(value: string): string {
  return (
    TASK_TYPES.find((item) => item.value === value)?.label ??
    value
  );
}

function priorityLabel(priority: number): string {
  if (priority === 2) return "Kritik";
  if (priority === 0) return "Minör";
  return "Normal";
}

function priorityStyle(priority: number) {
  if (priority === 2) {
    return {
      background: "#fff1f2",
      color: "#be123c",
      border: "1px solid #fecdd3",
    };
  }

  if (priority === 0) {
    return {
      background: "#f8fafc",
      color: "#64748b",
      border: "1px solid #e2e8f0",
    };
  }

  return {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  };
}

function typeStyle(type: string) {
  switch (type) {
    case "MEETING":
      return {
        background: "#f5f3ff",
        color: "#6d28d9",
      };

    case "INSPECTION":
      return {
        background: "#fff7ed",
        color: "#c2410c",
      };

    case "TRAINING":
      return {
        background: "#ecfdf5",
        color: "#047857",
      };

    case "VISIT":
      return {
        background: "#ecfeff",
        color: "#0e7490",
      };

    case "REMINDER":
      return {
        background: "#fefce8",
        color: "#a16207",
      };

    default:
      return {
        background: "#eff6ff",
        color: "#1d4ed8",
      };
  }
}

export default function AgendaPage() {
  const [tasks, setTasks] = useState<AgendaTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [filter, setFilter] = useState<TaskFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);

  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedLocalFirmId, setSelectedLocalFirmId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<TaskType>("TASK");
  const [priority, setPriority] = useState("1");
  const [dueAt, setDueAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);

  const loadCompanies = useCallback(async () => {
    try {
      setCompaniesLoading(true);

      const response = await fetch("/api/admin/companies", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json: CompaniesResponse = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(json.error || "Firmalar alınamadı.");
      }

      const activeCompanies = (Array.isArray(json.data) ? json.data : [])
        .filter((company) => company.is_active !== false)
        .map((company) => ({
          ...company,
          id: String(company.id || "").trim(),
          name: String(company.name || "").trim(),
          localId: company.localId ?? company.local_firm_id ?? null,
        }))
        .filter((company) => company.id && company.name);

      setCompanies(activeCompanies);

      if (activeCompanies.length > 0) {
        const firstCompany = activeCompanies[0];
        setSelectedCompanyId((current) => current || firstCompany.id);
        setSelectedLocalFirmId((current) => current ?? firstCompany.localId);
      }
    } catch (companyError) {
      setCompanies([]);
      setSelectedCompanyId("");
      setSelectedLocalFirmId(null);
      setError(
        companyError instanceof Error
          ? companyError.message
          : "Firmalar alınamadı."
      );
    } finally {
      setCompaniesLoading(false);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/agenda", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const json: AgendaResponse = await response
        .json()
        .catch(() => ({}));

      if (!response.ok || !json.success) {
        throw new Error(
          json.error || "Ajanda kayıtları alınamadı."
        );
      }

      setTasks(Array.isArray(json.records) ? json.records : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Ajanda kayıtları alınamadı."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompanies();
    void loadTasks();
  }, [loadCompanies, loadTasks]);

  const stats = useMemo(() => {
    const activeTasks = tasks.filter(
      (task) => !task.is_deleted && !task.is_archived
    );

    return {
      total: activeTasks.length,

      open: activeTasks.filter(
        (task) => task.status === 0
      ).length,

      done: activeTasks.filter(
        (task) => task.status === 1
      ).length,

      today: activeTasks.filter(
        (task) => isToday(task.due_at)
      ).length,

      upcoming: activeTasks.filter(isUpcoming).length,

      overdue: activeTasks.filter(isOverdue).length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    return tasks
      .filter(
        (task) => !task.is_deleted && !task.is_archived
      )
      .filter((task) => {
        if (filter === "OPEN") return task.status === 0;
        if (filter === "DONE") return task.status === 1;
        if (filter === "TODAY") return isToday(task.due_at);
        if (filter === "UPCOMING") return isUpcoming(task);
        if (filter === "OVERDUE") return isOverdue(task);

        return true;
      })
      .filter((task) => {
        return typeFilter === "ALL" || task.type === typeFilter;
      })
      .filter((task) => {
        if (!query) return true;

        const content = [
          task.title,
          task.note,
          task.location,
          task.assigned_to,
          task.assigned_by,
          task.participants_csv,
          typeLabel(task.type),
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("tr-TR");

        return content.includes(query);
      })
      .sort((first, second) => {
        const firstOverdue = isOverdue(first) ? 0 : 1;
        const secondOverdue = isOverdue(second) ? 0 : 1;

        if (firstOverdue !== secondOverdue) {
          return firstOverdue - secondOverdue;
        }

        if (first.status !== second.status) {
          return first.status - second.status;
        }

        const firstDue = first.due_at
          ? new Date(first.due_at).getTime()
          : Number.MAX_SAFE_INTEGER;

        const secondDue = second.due_at
          ? new Date(second.due_at).getTime()
          : Number.MAX_SAFE_INTEGER;

        return firstDue - secondDue;
      });
  }, [tasks, filter, typeFilter, search]);

  function clearCreateForm() {
    setTitle("");
    setNote("");
    setType("TASK");
    setPriority("1");
    setDueAt("");
    setEndAt("");
    setLocation("");
    setAssignedTo("");
    setMeetingLink("");
    setIsAllDay(false);
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Görev başlığı zorunludur.");
      return;
    }

    if (!selectedCompanyId) {
      setError("Görev için firma seçilmelidir.");
      return;
    }

    if (!selectedLocalFirmId || selectedLocalFirmId <= 0) {
      setError(
        "Seçilen firmanın mobil firma ID bilgisi eksik. Firmalar modülünde local_firm_id alanını kontrol edin."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch("/api/admin/agenda", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firm_id: selectedLocalFirmId,
          web_firm_id: selectedCompanyId,
          title: title.trim(),
          note: note.trim() || null,
          type,
          priority: Number(priority),
          due_at: dueAt
            ? new Date(dueAt).toISOString()
            : null,
          end_at: endAt
            ? new Date(endAt).toISOString()
            : null,
          location: location.trim() || null,
          assigned_to: assignedTo.trim() || null,
          meeting_link: meetingLink.trim() || null,
          is_all_day: isAllDay,
        }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.error || "Ajanda kaydı oluşturulamadı."
        );
      }

      clearCreateForm();
      setShowCreate(false);
      setMessage("Ajanda kaydı oluşturuldu.");

      await loadTasks();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Ajanda kaydı oluşturulamadı."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(
    task: AgendaTask,
    completed: boolean
  ) {
    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/agenda/${task.id}`,
        {
          method: "PATCH",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: completed ? 1 : 0,
            progress: completed ? 100 : 0,
          }),
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.error || "Görev durumu güncellenemedi."
        );
      }

      setMessage(
        completed
          ? "Görev tamamlandı."
          : "Görev tekrar açıldı."
      );

      await loadTasks();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Görev durumu güncellenemedi."
      );
    }
  }

  async function deleteTask(task: AgendaTask) {
    const confirmed = window.confirm(
      `"${task.title}" kaydı silinsin mi?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/admin/agenda/${task.id}`,
        {
          method: "DELETE",
          credentials: "include",
          cache: "no-store",
        }
      );

      const json = await response.json().catch(() => ({}));

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.error || "Ajanda kaydı silinemedi."
        );
      }

      setMessage("Ajanda kaydı silindi.");

      await loadTasks();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Ajanda kaydı silinemedi."
      );
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "30px",
        background:
          "linear-gradient(180deg, #fff7f7 0%, #f8fafc 42%, #ffffff 100%)",
        color: "#172033",
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          margin: "0 auto",
        }}
      >
        <section
          style={{
            borderRadius: 30,
            padding: 28,
            color: "#ffffff",
            background:
              "radial-gradient(circle at top right, rgba(255,255,255,0.20), transparent 32%), linear-gradient(135deg, #3b0712, #7a1026 55%, #b4233c)",
            boxShadow: "0 24px 70px rgba(72, 7, 22, 0.24)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  borderRadius: 999,
                  padding: "7px 12px",
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 0.6,
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.16)",
                }}
              >
                D-SEC OPERASYON MERKEZİ
              </div>

              <h1
                style={{
                  margin: "16px 0 8px",
                  fontSize: 34,
                  lineHeight: 1.1,
                }}
              >
                Ajanda ve Görev Yönetimi
              </h1>

              <p
                style={{
                  maxWidth: 760,
                  margin: 0,
                  color: "rgba(255,255,255,0.78)",
                  lineHeight: 1.7,
                }}
              >
                Görev, toplantı, denetim, eğitim, ziyaret ve
                hatırlatma kayıtlarını firma bazında yönetin.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                setMessage("");
                setShowCreate(true);
              }}
              style={{
                minHeight: 48,
                padding: "0 20px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.25)",
                background: "#ffffff",
                color: "#7a1026",
                fontWeight: 950,
                cursor: "pointer",
                boxShadow: "0 14px 32px rgba(0,0,0,0.16)",
              }}
            >
              + Yeni Kayıt
            </button>
          </div>
        </section>

        {error ? (
          <div
            style={{
              marginTop: 18,
              borderRadius: 16,
              padding: 14,
              color: "#991b1b",
              background: "#fef2f2",
              border: "1px solid #fecaca",
            }}
          >
            {error}
          </div>
        ) : null}

        {message ? (
          <div
            style={{
              marginTop: 18,
              borderRadius: 16,
              padding: 14,
              color: "#166534",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
            }}
          >
            {message}
          </div>
        ) : null}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            marginTop: 20,
          }}
        >
          <StatCard
            title="Toplam"
            value={stats.total}
            description="Aktif kayıt"
          />
          <StatCard
            title="Açık"
            value={stats.open}
            description="Devam eden"
          />
          <StatCard
            title="Tamamlanan"
            value={stats.done}
            description="Kapatılan görev"
          />
          <StatCard
            title="Bugün"
            value={stats.today}
            description="Bugünkü plan"
          />
          <StatCard
            title="Yaklaşan"
            value={stats.upcoming}
            description="Önümüzdeki 7 gün"
          />
          <StatCard
            title="Geciken"
            value={stats.overdue}
            description="Termin aşımı"
            danger
          />
        </section>

        <section
          style={{
            marginTop: 20,
            padding: 18,
            borderRadius: 24,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(220px, 1fr) minmax(180px, 240px)",
              gap: 12,
            }}
          >
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Başlık, açıklama, sorumlu veya lokasyon ara..."
              style={inputStyle}
            />

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
              style={inputStyle}
            >
              <option value="ALL">Tüm kayıt türleri</option>

              {TASK_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 14,
            }}
          >
            {FILTERS.map((item) => {
              const active = filter === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 999,
                    border: active
                      ? "1px solid #8a1530"
                      : "1px solid #e2e8f0",
                    background: active ? "#8a1530" : "#ffffff",
                    color: active ? "#ffffff" : "#475569",
                    fontWeight: 850,
                    cursor: "pointer",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ marginTop: 20 }}>
          {loading ? (
            <div style={emptyStyle}>
              Ajanda kayıtları yükleniyor...
            </div>
          ) : filteredTasks.length === 0 ? (
            <div style={emptyStyle}>
              Filtreye uygun Ajanda kaydı bulunamadı.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 14,
              }}
            >
              {filteredTasks.map((task) => {
                const overdue = isOverdue(task);
                const completed = task.status === 1;

                return (
                  <article
                    key={task.id}
                    style={{
                      padding: 20,
                      borderRadius: 22,
                      background: completed
                        ? "#f0fdf4"
                        : overdue
                          ? "#fff1f2"
                          : "#ffffff",
                      border: completed
                        ? "1px solid #bbf7d0"
                        : overdue
                          ? "1px solid #fecdd3"
                          : "1px solid #e5e7eb",
                      boxShadow:
                        "0 14px 38px rgba(15,23,42,0.06)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 240 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              padding: "6px 9px",
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 900,
                              ...typeStyle(task.type),
                            }}
                          >
                            {typeLabel(task.type)}
                          </span>

                          <span
                            style={{
                              padding: "6px 9px",
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 900,
                              ...priorityStyle(task.priority),
                            }}
                          >
                            {priorityLabel(task.priority)}
                          </span>

                          {overdue ? (
                            <span
                              style={{
                                padding: "6px 9px",
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 950,
                                color: "#be123c",
                                background: "#ffe4e6",
                              }}
                            >
                              GECİKMİŞ
                            </span>
                          ) : null}

                          {completed ? (
                            <span
                              style={{
                                padding: "6px 9px",
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 950,
                                color: "#166534",
                                background: "#dcfce7",
                              }}
                            >
                              TAMAMLANDI
                            </span>
                          ) : null}
                        </div>

                        <h2
                          style={{
                            margin: "12px 0 6px",
                            fontSize: 20,
                          }}
                        >
                          {task.title}
                        </h2>

                        <div
                          style={{
                            color: "#64748b",
                            fontSize: 13,
                          }}
                        >
                          {formatDateTime(task.due_at)}
                        </div>

                        {task.note ? (
                          <p
                            style={{
                              margin: "12px 0 0",
                              color: "#475569",
                              lineHeight: 1.65,
                            }}
                          >
                            {task.note}
                          </p>
                        ) : null}

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 14,
                            marginTop: 14,
                            color: "#475569",
                            fontSize: 13,
                          }}
                        >
                          {task.assigned_to ? (
                            <span>
                              <strong>Sorumlu:</strong>{" "}
                              {task.assigned_to}
                            </span>
                          ) : null}

                          {task.location ? (
                            <span>
                              <strong>Lokasyon:</strong>{" "}
                              {task.location}
                            </span>
                          ) : null}

                          <span>
                            <strong>Kaynak:</strong>{" "}
                            {task.source}
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            void updateStatus(task, !completed)
                          }
                          style={{
                            minHeight: 40,
                            padding: "0 13px",
                            borderRadius: 12,
                            border: completed
                              ? "1px solid #bfdbfe"
                              : "1px solid #bbf7d0",
                            background: completed
                              ? "#eff6ff"
                              : "#f0fdf4",
                            color: completed
                              ? "#1d4ed8"
                              : "#166534",
                            fontWeight: 900,
                            cursor: "pointer",
                          }}
                        >
                          {completed
                            ? "Tekrar Aç"
                            : "Tamamla"}
                        </button>

                        <button
                          type="button"
                          onClick={() => void deleteTask(task)}
                          style={{
                            minHeight: 40,
                            padding: "0 13px",
                            borderRadius: 12,
                            border: "1px solid #fecaca",
                            background: "#fef2f2",
                            color: "#b91c1c",
                            fontWeight: 900,
                            cursor: "pointer",
                          }}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {showCreate ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "grid",
            placeItems: "center",
            padding: 20,
            background: "rgba(15,23,42,0.56)",
            backdropFilter: "blur(8px)",
          }}
        >
          <form
            onSubmit={createTask}
            style={{
              width: "min(760px, 100%)",
              maxHeight: "92vh",
              overflowY: "auto",
              borderRadius: 28,
              padding: 24,
              background: "#ffffff",
              boxShadow: "0 34px 90px rgba(0,0,0,0.28)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 950,
                    color: "#8a1530",
                  }}
                >
                  YENİ AJANDA KAYDI
                </div>

                <h2 style={{ margin: "8px 0 0" }}>
                  Görev veya plan oluştur
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 14,
                marginTop: 20,
              }}
            >
              <label style={labelStyle}>
                Firma
                <select
                  value={selectedCompanyId}
                  disabled={companiesLoading || companies.length === 0}
                  onChange={(event) => {
                    const companyId = event.target.value;
                    const company = companies.find(
                      (item) => item.id === companyId
                    );

                    setSelectedCompanyId(companyId);
                    setSelectedLocalFirmId(company?.localId ?? null);
                  }}
                  style={inputStyle}
                >
                  {companiesLoading ? (
                    <option value="">Firmalar yükleniyor...</option>
                  ) : companies.length === 0 ? (
                    <option value="">Aktif firma bulunamadı</option>
                  ) : (
                    companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                        {company.localId ? ` • Mobil ID: ${company.localId}` : " • Mobil ID eksik"}
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label style={labelStyle}>
                Kayıt türü
                <select
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value as TaskType)
                  }
                  style={inputStyle}
                >
                  {TASK_TYPES.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label
                style={{
                  ...labelStyle,
                  gridColumn: "1 / -1",
                }}
              >
                Başlık
                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Örneğin: Aylık saha denetimini tamamla"
                  style={inputStyle}
                />
              </label>

              <label
                style={{
                  ...labelStyle,
                  gridColumn: "1 / -1",
                }}
              >
                Açıklama
                <textarea
                  value={note}
                  onChange={(event) =>
                    setNote(event.target.value)
                  }
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                />
              </label>

              <label style={labelStyle}>
                Öncelik
                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="0">Minör</option>
                  <option value="1">Normal</option>
                  <option value="2">Kritik</option>
                </select>
              </label>

              <label style={labelStyle}>
                Sorumlu
                <input
                  value={assignedTo}
                  onChange={(event) =>
                    setAssignedTo(event.target.value)
                  }
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Başlangıç zamanı
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(event) =>
                    setDueAt(event.target.value)
                  }
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Bitiş zamanı
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(event) =>
                    setEndAt(event.target.value)
                  }
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Lokasyon
                <input
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Toplantı bağlantısı
                <input
                  value={meetingLink}
                  onChange={(event) =>
                    setMeetingLink(event.target.value)
                  }
                  style={inputStyle}
                />
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  gridColumn: "1 / -1",
                  color: "#334155",
                  fontWeight: 800,
                }}
              >
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(event) =>
                    setIsAllDay(event.target.checked)
                  }
                />
                Tüm gün süren kayıt
              </label>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 24,
              }}
            >
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                style={{
                  minHeight: 46,
                  padding: "0 18px",
                  borderRadius: 14,
                  border: "1px solid #dbe2ea",
                  background: "#ffffff",
                  color: "#475569",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                İptal
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  minHeight: 46,
                  padding: "0 20px",
                  borderRadius: 14,
                  border: 0,
                  background: saving
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #5a0f1f, #a51d38)",
                  color: "#ffffff",
                  fontWeight: 950,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Kaydediliyor..." : "Kaydı Oluştur"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function StatCard({
  title,
  value,
  description,
  danger = false,
}: {
  title: string;
  value: number;
  description: string;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 22,
        background: danger ? "#fff1f2" : "#ffffff",
        border: danger
          ? "1px solid #fecdd3"
          : "1px solid #e5e7eb",
        boxShadow: "0 14px 36px rgba(15,23,42,0.06)",
      }}
    >
      <div
        style={{
          color: danger ? "#be123c" : "#64748b",
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontSize: 30,
          fontWeight: 1000,
          color: danger ? "#9f1239" : "#172033",
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 4,
          color: "#94a3b8",
          fontSize: 12,
        }}
      >
        {description}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 46,
  boxSizing: "border-box",
  borderRadius: 14,
  border: "1px solid #dbe2ea",
  background: "#ffffff",
  color: "#172033",
  padding: "11px 13px",
  outline: "none",
  fontSize: 14,
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 7,
  color: "#334155",
  fontSize: 13,
  fontWeight: 850,
};

const emptyStyle: React.CSSProperties = {
  padding: 40,
  borderRadius: 22,
  textAlign: "center",
  color: "#64748b",
  background: "#ffffff",
  border: "1px dashed #cbd5e1",
};