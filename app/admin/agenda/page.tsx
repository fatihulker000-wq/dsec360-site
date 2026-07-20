"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createAgenda,
  patchAgenda,
  removeAgenda,
} from "./api";

import {
  isOverdue,
  useAgendaData,
  useAgendaStats,
  useCompanyData,
  useEmployeeData,
  useFilteredAgenda,
} from "./hooks";

import CompanySelect from "./components/CompanySelect";
import EmployeeSelect from "./components/EmployeeSelect";

import type {
  CompanyItem,
  EmployeeItem,
  TaskFilter,
  TaskType,
} from "./types";

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

export default function AgendaPage() {
  const { tasks, loading, refresh } = useAgendaData();
  const {
    companies,
    loading: companiesLoading,
  } = useCompanyData();

  const [selectedCompany, setSelectedCompany] =
    useState<CompanyItem | null>(null);

  const {
    employees,
    loading: employeesLoading,
  } = useEmployeeData(selectedCompany?.id ?? "");

  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeItem | null>(null);

  const [filter, setFilter] =
    useState<TaskFilter>("ALL");

  const [typeFilter, setTypeFilter] =
    useState("ALL");

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<TaskType>("TASK");
  const [priority, setPriority] = useState("1");
  const [dueAt, setDueAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);

  useEffect(() => {
    if (!selectedCompany && companies.length > 0) {
      setSelectedCompany(companies[0]);
    }
  }, [companies, selectedCompany]);

  useEffect(() => {
    setSelectedEmployee(null);
  }, [selectedCompany?.id]);

  const stats = useAgendaStats(
    selectedCompany
      ? tasks.filter(
          (task) =>
            !task.web_firm_id ||
            task.web_firm_id === selectedCompany.id
        )
      : tasks
  );

  const filteredTasks = useFilteredAgenda(
    tasks,
    filter,
    typeFilter,
    search,
    selectedCompany?.id ?? ""
  );

  function clearForm() {
    setTitle("");
    setNote("");
    setType("TASK");
    setPriority("1");
    setDueAt("");
    setEndAt("");
    setLocation("");
    setMeetingLink("");
    setSelectedEmployee(null);
    setIsAllDay(false);
  }

  async function handleCreate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedCompany) {
      setError("Görev için firma seçilmelidir.");
      return;
    }

    if (
      !selectedCompany.localId ||
      selectedCompany.localId <= 0
    ) {
      setError(
        "Seçilen firmanın mobil firma ID bilgisi eksik."
      );
      return;
    }

    if (!title.trim()) {
      setError("Görev başlığı zorunludur.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await createAgenda({
        firm_id: selectedCompany.localId,
        web_firm_id: selectedCompany.id,
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
        meeting_link:
          meetingLink.trim() || null,
        assigned_to:
          selectedEmployee?.full_name || null,
        assigned_employee_remote_id:
          selectedEmployee?.id || null,
        assigned_employee_local_id:
          selectedEmployee?.local_employee_id ?? null,
        is_all_day: isAllDay,
      });

      clearForm();
      setShowCreate(false);
      setMessage("Ajanda kaydı oluşturuldu.");
      await refresh();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Ajanda kaydı oluşturulamadı."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(
    id: string,
    completed: boolean
  ) {
    try {
      setError("");
      await patchAgenda(id, {
        status: completed ? 1 : 0,
        progress: completed ? 100 : 0,
      });

      setMessage(
        completed
          ? "Görev tamamlandı."
          : "Görev tekrar açıldı."
      );

      await refresh();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Görev güncellenemedi."
      );
    }
  }

  async function deleteTask(
    id: string,
    titleValue: string
  ) {
    if (
      !window.confirm(
        `"${titleValue}" kaydı silinsin mi?`
      )
    ) {
      return;
    }

    try {
      setError("");
      await removeAgenda(id);
      setMessage("Ajanda kaydı silindi.");
      await refresh();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Ajanda kaydı silinemedi."
      );
    }
  }

  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1500, margin: "0 auto" }}>
        <section style={heroStyle}>
          <div>
            <div style={heroBadgeStyle}>
              D-SEC OPERASYON MERKEZİ
            </div>

            <h1 style={{ margin: "16px 0 8px", fontSize: 34 }}>
              Ajanda ve Görev Yönetimi
            </h1>

            <p style={heroDescriptionStyle}>
              Görev, toplantı, denetim, eğitim, ziyaret ve
              hatırlatma kayıtlarını firma ve çalışan bazında
              yönetin.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              setMessage("");
              setShowCreate(true);
            }}
            style={primaryButtonStyle}
          >
            + Yeni Kayıt
          </button>
        </section>

        {error ? (
          <Notice
            text={error}
            background="#fef2f2"
            border="#fecaca"
            color="#991b1b"
          />
        ) : null}

        {message ? (
          <Notice
            text={message}
            background="#f0fdf4"
            border="#bbf7d0"
            color="#166534"
          />
        ) : null}

        <section style={statsGridStyle}>
          <StatCard title="Toplam" value={stats.total} />
          <StatCard title="Açık" value={stats.open} />
          <StatCard title="Tamamlanan" value={stats.done} />
          <StatCard title="Bugün" value={stats.today} />
          <StatCard title="Yaklaşan" value={stats.upcoming} />
          <StatCard
            title="Geciken"
            value={stats.overdue}
            danger
          />
        </section>

        <section style={filterPanelStyle}>
          <div style={filterGridStyle}>
            <CompanySelect
              companies={companies}
              loading={companiesLoading}
              value={selectedCompany?.id ?? ""}
              onChange={setSelectedCompany}
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Başlık, açıklama, çalışan veya lokasyon ara..."
              style={inputStyle}
            />

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
              style={inputStyle}
            >
              <option value="ALL">
                Tüm kayıt türleri
              </option>

              {TASK_TYPES.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div style={filterButtonsStyle}>
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                style={{
                  ...filterButtonStyle,
                  background:
                    filter === item.value
                      ? "#8a1530"
                      : "#ffffff",
                  color:
                    filter === item.value
                      ? "#ffffff"
                      : "#475569",
                  border:
                    filter === item.value
                      ? "1px solid #8a1530"
                      : "1px solid #e2e8f0",
                }}
              >
                {item.label}
              </button>
            ))}
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
            <div style={{ display: "grid", gap: 14 }}>
              {filteredTasks.map((task) => {
                const completed = task.status === 1;
                const overdue = isOverdue(task);

                return (
                  <article
                    key={task.id}
                    style={{
                      ...taskCardStyle,
                      background: completed
                        ? "#f0fdf4"
                        : overdue
                        ? "#fff1f2"
                        : "#ffffff",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={badgeRowStyle}>
                        <Badge text={typeLabel(task.type)} />
                        <Badge text={priorityLabel(task.priority)} />

                        {overdue ? (
                          <Badge text="GECİKMİŞ" danger />
                        ) : null}

                        {completed ? (
                          <Badge text="TAMAMLANDI" success />
                        ) : null}
                      </div>

                      <h2 style={{ margin: "12px 0 6px" }}>
                        {task.title}
                      </h2>

                      <div style={mutedTextStyle}>
                        {formatDateTime(task.due_at)}
                      </div>

                      {task.note ? (
                        <p style={{ color: "#475569" }}>
                          {task.note}
                        </p>
                      ) : null}

                      <div style={metaRowStyle}>
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

                    <div style={actionRowStyle}>
                      <button
                        type="button"
                        onClick={() =>
                          void toggleTask(
                            task.id,
                            !completed
                          )
                        }
                        style={secondaryActionStyle}
                      >
                        {completed
                          ? "Tekrar Aç"
                          : "Tamamla"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void deleteTask(
                            task.id,
                            task.title
                          )
                        }
                        style={dangerActionStyle}
                      >
                        Sil
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {showCreate ? (
        <div style={dialogOverlayStyle}>
          <form
            onSubmit={handleCreate}
            style={dialogStyle}
          >
            <div style={dialogHeaderStyle}>
              <div>
                <div style={dialogEyebrowStyle}>
                  YENİ AJANDA KAYDI
                </div>
                <h2 style={{ margin: "8px 0 0" }}>
                  Görev veya plan oluştur
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

            <div style={formGridStyle}>
              <CompanySelect
                companies={companies}
                loading={companiesLoading}
                value={selectedCompany?.id ?? ""}
                onChange={setSelectedCompany}
              />

              <EmployeeSelect
                employees={employees}
                loading={employeesLoading}
                value={selectedEmployee?.id ?? ""}
                disabled={!selectedCompany}
                onChange={setSelectedEmployee}
              />

              <label style={labelStyle}>
                Kayıt türü
                <select
                  value={type}
                  onChange={(event) =>
                    setType(
                      event.target.value as TaskType
                    )
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

              <label style={fullLabelStyle}>
                Başlık
                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  style={inputStyle}
                />
              </label>

              <label style={fullLabelStyle}>
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

              <label style={checkboxStyle}>
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

            <div style={dialogActionsStyle}>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                style={cancelButtonStyle}
              >
                İptal
              </button>

              <button
                type="submit"
                disabled={saving}
                style={saveButtonStyle}
              >
                {saving
                  ? "Kaydediliyor..."
                  : "Kaydı Oluştur"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}

function Notice({
  text,
  background,
  border,
  color,
}: {
  text: string;
  background: string;
  border: string;
  color: string;
}) {
  return (
    <div
      style={{
        marginTop: 18,
        borderRadius: 16,
        padding: 14,
        background,
        border: `1px solid ${border}`,
        color,
      }}
    >
      {text}
    </div>
  );
}

function StatCard({
  title,
  value,
  danger = false,
}: {
  title: string;
  value: number;
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
      }}
    >
      <div style={mutedTextStyle}>{title}</div>
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
    </div>
  );
}

function Badge({
  text,
  danger = false,
  success = false,
}: {
  text: string;
  danger?: boolean;
  success?: boolean;
}) {
  const background = danger
    ? "#ffe4e6"
    : success
    ? "#dcfce7"
    : "#eff6ff";

  const color = danger
    ? "#be123c"
    : success
    ? "#166534"
    : "#1d4ed8";

  return (
    <span
      style={{
        padding: "6px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 900,
        background,
        color,
      }}
    >
      {text}
    </span>
  );
}

function typeLabel(type: TaskType) {
  return (
    TASK_TYPES.find((item) => item.value === type)
      ?.label ?? type
  );
}

function priorityLabel(priority: number) {
  if (priority === 2) return "Kritik";
  if (priority === 0) return "Minör";
  return "Normal";
}

function formatDateTime(value: string | null) {
  if (!value) return "Tarih belirtilmedi";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: 30,
  background:
    "linear-gradient(180deg, #fff7f7 0%, #f8fafc 42%, #ffffff 100%)",
  color: "#172033",
};

const heroStyle: React.CSSProperties = {
  borderRadius: 30,
  padding: 28,
  color: "#ffffff",
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  flexWrap: "wrap",
  background:
    "radial-gradient(circle at top right, rgba(255,255,255,0.20), transparent 32%), linear-gradient(135deg, #3b0712, #7a1026 55%, #b4233c)",
};

const heroBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 12,
  fontWeight: 900,
  background: "rgba(255,255,255,0.14)",
};

const heroDescriptionStyle: React.CSSProperties = {
  maxWidth: 760,
  margin: 0,
  color: "rgba(255,255,255,0.78)",
  lineHeight: 1.7,
};

const primaryButtonStyle: React.CSSProperties = {
  minHeight: 48,
  padding: "0 20px",
  borderRadius: 16,
  border: 0,
  background: "#ffffff",
  color: "#7a1026",
  fontWeight: 950,
  cursor: "pointer",
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
  marginTop: 20,
};

const filterPanelStyle: React.CSSProperties = {
  marginTop: 20,
  padding: 18,
  borderRadius: 24,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
};

const filterGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const filterButtonsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 14,
};

const filterButtonStyle: React.CSSProperties = {
  padding: "9px 14px",
  borderRadius: 999,
  fontWeight: 850,
  cursor: "pointer",
};

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

const fullLabelStyle: React.CSSProperties = {
  ...labelStyle,
  gridColumn: "1 / -1",
};

const emptyStyle: React.CSSProperties = {
  padding: 40,
  borderRadius: 22,
  textAlign: "center",
  color: "#64748b",
  background: "#ffffff",
  border: "1px dashed #cbd5e1",
};

const taskCardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 22,
  border: "1px solid #e5e7eb",
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
};

const badgeRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const mutedTextStyle: React.CSSProperties = {
  color: "#64748b",
  fontSize: 13,
};

const metaRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 14,
  marginTop: 14,
  color: "#475569",
  fontSize: 13,
};

const actionRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const secondaryActionStyle: React.CSSProperties = {
  minHeight: 40,
  padding: "0 13px",
  borderRadius: 12,
  border: "1px solid #bbf7d0",
  background: "#f0fdf4",
  color: "#166534",
  fontWeight: 900,
  cursor: "pointer",
};

const dangerActionStyle: React.CSSProperties = {
  minHeight: 40,
  padding: "0 13px",
  borderRadius: 12,
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  fontWeight: 900,
  cursor: "pointer",
};

const dialogOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  display: "grid",
  placeItems: "center",
  padding: 20,
  background: "rgba(15,23,42,0.56)",
  backdropFilter: "blur(8px)",
};

const dialogStyle: React.CSSProperties = {
  width: "min(760px, 100%)",
  maxHeight: "92vh",
  overflowY: "auto",
  borderRadius: 28,
  padding: 24,
  background: "#ffffff",
};

const dialogHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
};

const dialogEyebrowStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 950,
  color: "#8a1530",
};

const closeButtonStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  cursor: "pointer",
  fontSize: 18,
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 14,
  marginTop: 20,
};

const checkboxStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  gridColumn: "1 / -1",
  color: "#334155",
  fontWeight: 800,
};

const dialogActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 24,
};

const cancelButtonStyle: React.CSSProperties = {
  minHeight: 46,
  padding: "0 18px",
  borderRadius: 14,
  border: "1px solid #dbe2ea",
  background: "#ffffff",
  color: "#475569",
  fontWeight: 900,
  cursor: "pointer",
};

const saveButtonStyle: React.CSSProperties = {
  minHeight: 46,
  padding: "0 20px",
  borderRadius: 14,
  border: 0,
  background:
    "linear-gradient(135deg, #5a0f1f, #a51d38)",
  color: "#ffffff",
  fontWeight: 950,
  cursor: "pointer",
};
