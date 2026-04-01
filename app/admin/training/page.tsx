"use client";

import { useEffect, useMemo, useState } from "react";

type UserApiRow = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  company?: string | null;
  company_id?: string | null;
  role?: string | null;
  is_active?: boolean | null;
};

type TrainingApiRow = {
  id: string;
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
};

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  company: string;
  role: string;
  is_active: boolean;
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

function getRoleLabel(role?: string | null) {
  if (role === "super_admin") return "Süper Admin";
  if (role === "company_admin") return "Firma Yöneticisi";
  if (role === "operator") return "Operatör";
  if (role === "training_user") return "Eğitim Kullanıcısı";
  return role || "-";
}

function buildCompanyLabel(user: UserApiRow) {
  if (user.company && user.company.trim()) return user.company.trim();
  if (user.company_id && user.company_id.trim()) {
    return `Firma ID: ${user.company_id.trim()}`;
  }
  return "Firma bilgisi yok";
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

function statCardStyle() {
  return {
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    background: "#ffffff",
    padding: "18px",
    boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
  } as const;
}

function smallBadgeStyle(
  bg: string,
  border: string,
  color: string
): React.CSSProperties {
  return {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: "999px",
    background: bg,
    border: `1px solid ${border}`,
    fontSize: "12px",
    fontWeight: 700,
    color,
  };
}

export default function AdminTrainingPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [trainings, setTrainings] = useState<TrainingRow[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [trainingId, setTrainingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [selectedTrainingInfo, setSelectedTrainingInfo] =
    useState<TrainingRow | null>(null);

  const [assignSummary, setAssignSummary] = useState<AssignResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        setLoading(true);

        const [usersRes, trainingsRes] = await Promise.all([
          fetch("/api/admin/users", { cache: "no-store" }),
          fetch("/api/admin/trainings", { cache: "no-store" }),
        ]);

        const usersJson = await usersRes.json();
        const trainingsJson = await trainingsRes.json();

        if (!usersRes.ok) {
          throw new Error(usersJson?.error || "Kullanıcı listesi alınamadı.");
        }

        if (!trainingsRes.ok) {
          throw new Error(trainingsJson?.error || "Eğitim listesi alınamadı.");
        }

        const normalizedUsers: UserRow[] = Array.isArray(usersJson?.data)
          ? usersJson.data.map((u: UserApiRow) => ({
              id: String(u.id),
              full_name: (u.full_name || "Adsız Kullanıcı").trim(),
              email: (u.email || "-").trim(),
              company: buildCompanyLabel(u),
              role: getRoleLabel(u.role),
              is_active: Boolean(u.is_active),
            }))
          : [];

        const normalizedTrainings: TrainingRow[] = Array.isArray(trainingsJson?.data)
          ? trainingsJson.data.map((t: TrainingApiRow) => ({
              id: String(t.id),
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
            }))
          : [];

        setUsers(normalizedUsers);
        setTrainings(normalizedTrainings);
      } catch (err) {
        console.error(err);
        setUsers([]);
        setTrainings([]);
        setError(
          err instanceof Error ? err.message : "Veriler alınırken hata oluştu."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const found = trainings.find((t) => t.id === trainingId) || null;
    setSelectedTrainingInfo(found);
  }, [trainingId, trainings]);

  const companies = useMemo(() => {
    const list = Array.from(
      new Set(users.map((u) => u.company.trim()).filter(Boolean))
    );

    return list.sort((a, b) => a.localeCompare(b, "tr"));
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const text = `${u.full_name} ${u.email} ${u.company} ${u.role}`.toLowerCase();

      const matchesSearch = !search || text.includes(search.toLowerCase());
      const matchesCompany =
        companyFilter === "all" ? true : u.company === companyFilter;

      return matchesSearch && matchesCompany;
    });
  }, [users, search, companyFilter]);

  const selectedCount = selectedUsers.length;

  const allFilteredSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedUsers.includes(u.id));

  const activeUsersCount = useMemo(
    () => users.filter((u) => u.is_active).length,
    [users]
  );

  const passiveUsersCount = useMemo(
    () => users.filter((u) => !u.is_active).length,
    [users]
  );

  const filteredActiveCount = useMemo(
    () => filteredUsers.filter((u) => u.is_active).length,
    [filteredUsers]
  );

  const filteredPassiveCount = useMemo(
    () => filteredUsers.filter((u) => !u.is_active).length,
    [filteredUsers]
  );

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
    setSelectedUsers([]);
  };

  const assign = async () => {
    if (!trainingId) {
      alert("Önce eğitim seç.");
      return;
    }

    if (!selectedUsers.length) {
      alert("En az bir çalışan seç.");
      return;
    }

    try {
      setAssigning(true);
      setAssignSummary(null);

      const res = await fetch("/api/training/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          trainingId,
        }),
      });

      const data: AssignResponse = await res.json();

      if (!res.ok) {
        setAssignSummary(data);
        alert(data?.error || "Eğitim atama başarısız.");
        return;
      }

      setAssignSummary(data);
      alert(data?.message || "Eğitim atandı ✅");
      setSelectedUsers([]);
    } catch (err) {
      console.error(err);
      alert("Sunucu hatası oluştu.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <main>
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC Eğitim Yönetimi</div>
          <h1 className="hero-title">Premium Eğitim Atama Paneli</h1>
          <p className="hero-desc">
            Eğitim seçin, çalışanları filtreleyin, toplu atama yapın ve gönderim
            sonuçlarını tek ekranda izleyin.
          </p>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "18px",
              marginBottom: "24px",
            }}
          >
            <div style={statCardStyle()}>
              <div style={{ fontSize: "13px", color: "#6b7280" }}>Toplam Çalışan</div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                {users.length}
              </div>
            </div>

            <div style={statCardStyle()}>
              <div style={{ fontSize: "13px", color: "#166534" }}>Aktif Çalışan</div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                {activeUsersCount}
              </div>
            </div>

            <div style={statCardStyle()}>
              <div style={{ fontSize: "13px", color: "#b91c1c" }}>Pasif Çalışan</div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                {passiveUsersCount}
              </div>
            </div>

            <div style={statCardStyle()}>
              <div style={{ fontSize: "13px", color: "#92400e" }}>Toplam Eğitim</div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                {trainings.length}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: "18px",
              marginBottom: "24px",
            }}
          >
            <div style={statCardStyle()}>
              <div style={{ fontSize: "13px", color: "#6b7280" }}>
                Toplam Eğitim Ataması
              </div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                {trainingTotals.totalAssigned}
              </div>
            </div>

            <div style={statCardStyle()}>
              <div style={{ fontSize: "13px", color: "#92400e" }}>
                Başlamayan Toplam
              </div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                {trainingTotals.totalNotStarted}
              </div>
            </div>

            <div style={statCardStyle()}>
              <div style={{ fontSize: "13px", color: "#1d4ed8" }}>
                Devam Eden Toplam
              </div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                {trainingTotals.totalInProgress}
              </div>
            </div>

            <div style={statCardStyle()}>
              <div style={{ fontSize: "13px", color: "#166534" }}>
                Tamamlanan Toplam
              </div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                {trainingTotals.totalCompleted}
              </div>
            </div>
          </div>

          {error ? (
            <div className="card" style={{ marginBottom: "24px" }}>
              <h3 className="card-title" style={{ marginBottom: "8px" }}>
                Hata
              </h3>
              <p className="card-text">{error}</p>
            </div>
          ) : null}

          <div className="card" style={{ marginBottom: "24px" }}>
            <h3 className="card-title" style={{ marginBottom: "16px" }}>
              Eğitim Seçimi
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 1fr",
                gap: "16px",
                alignItems: "start",
              }}
            >
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
                  Eğitim
                </div>
                <select
                  value={trainingId}
                  onChange={(e) => setTrainingId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #d1d5db",
                    outline: "none",
                    fontSize: "14px",
                    background: "#fff",
                  }}
                >
                  <option value="">Eğitim seç</option>
                  {trainings.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>

                <div
                  style={{
                    marginTop: "14px",
                    fontSize: "12px",
                    color: "#6b7280",
                    lineHeight: 1.7,
                  }}
                >
                  Eğitim listesi admin eğitim API’sinden canlı alınır. Seçim yapınca
                  sağda özet ve aşağıda atama etkisi anlık görünür.
                </div>
              </div>

              <div
                style={{
                  background: "linear-gradient(180deg,#f8fafc,#ffffff)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                  padding: "14px",
                  minHeight: "100%",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
                  Seçilen Eğitim Özeti
                </div>

                {selectedTrainingInfo ? (
                  <>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#111827" }}>
                      {selectedTrainingInfo.title}
                    </div>

                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "13px",
                        color: "#6b7280",
                        lineHeight: 1.6,
                      }}
                    >
                      {selectedTrainingInfo.description}
                    </div>

                    <div
                      style={{
                        marginTop: "10px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      <span style={smallBadgeStyle("#f3f4f6", "#d1d5db", "#374151")}>
                        Tür: {selectedTrainingInfo.type}
                      </span>
                      <span style={smallBadgeStyle("#eff6ff", "#bfdbfe", "#1d4ed8")}>
                        Süre:{" "}
                        {typeof selectedTrainingInfo.duration_minutes === "number"
                          ? `${selectedTrainingInfo.duration_minutes} dk`
                          : "Tanımlı değil"}
                      </span>
                      <span style={smallBadgeStyle("#f0fdf4", "#86efac", "#166534")}>
                        Konu başlığı: {parseTopicsCount(selectedTrainingInfo.topics_text)}
                      </span>
                    </div>

                    {selectedTrainingInfo.content_url ? (
                      <div
                        style={{
                          marginTop: "12px",
                          fontSize: "12px",
                          color: "#6b7280",
                          wordBreak: "break-all",
                        }}
                      >
                        İçerik linki: {selectedTrainingInfo.content_url}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    Henüz eğitim seçilmedi.
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedTrainingInfo ? (
            <div className="card" style={{ marginBottom: "24px" }}>
              <h3 className="card-title" style={{ marginBottom: "16px" }}>
                Seçilen Eğitimin İstatistikleri
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    borderRadius: "14px",
                    border: "1px solid #e5e7eb",
                    padding: "14px",
                    background: "#ffffff",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>Toplam Atama</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>
                    {selectedTrainingInfo.assigned_count}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: "14px",
                    border: "1px solid #e5e7eb",
                    padding: "14px",
                    background: "#fefce8",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#854d0e" }}>Başlamayan</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>
                    {selectedTrainingInfo.not_started_count}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: "14px",
                    border: "1px solid #e5e7eb",
                    padding: "14px",
                    background: "#eff6ff",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#1d4ed8" }}>Devam Eden</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>
                    {selectedTrainingInfo.in_progress_count}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: "14px",
                    border: "1px solid #e5e7eb",
                    padding: "14px",
                    background: "#f0fdf4",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#166534" }}>Tamamlanan</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>
                    {selectedTrainingInfo.completed_count}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="card" style={{ marginBottom: "24px" }}>
            <h3 className="card-title" style={{ marginBottom: "16px" }}>
              Çalışan Filtreleme
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: "14px",
              }}
            >
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
                  Ara
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ad soyad, e-posta, rol veya firma ara..."
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #d1d5db",
                    outline: "none",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
                  Firma
                </div>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid #d1d5db",
                    outline: "none",
                    fontSize: "14px",
                    background: "#fff",
                  }}
                >
                  <option value="all">Tüm Firmalar</option>
                  {companies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              <div
                style={{
                  borderRadius: "14px",
                  border: "1px solid #e5e7eb",
                  padding: "14px",
                  background: "#fafafa",
                }}
              >
                <div style={{ fontSize: "12px", color: "#6b7280" }}>Filtrelenen Çalışan</div>
                <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>
                  {filteredUsers.length}
                </div>
              </div>

              <div
                style={{
                  borderRadius: "14px",
                  border: "1px solid #e5e7eb",
                  padding: "14px",
                  background: "#f0fdf4",
                }}
              >
                <div style={{ fontSize: "12px", color: "#166534" }}>Filtrelenen Aktif</div>
                <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>
                  {filteredActiveCount}
                </div>
              </div>

              <div
                style={{
                  borderRadius: "14px",
                  border: "1px solid #e5e7eb",
                  padding: "14px",
                  background: "#fef2f2",
                }}
              >
                <div style={{ fontSize: "12px", color: "#b91c1c" }}>Filtrelenen Pasif</div>
                <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>
                  {filteredPassiveCount}
                </div>
              </div>

              <div
                style={{
                  borderRadius: "14px",
                  border: "1px solid #e5e7eb",
                  padding: "14px",
                  background: "#eff6ff",
                }}
              >
                <div style={{ fontSize: "12px", color: "#1d4ed8" }}>Seçili Çalışan</div>
                <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>
                  {selectedCount}
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "center",
                marginBottom: "16px",
                flexWrap: "wrap",
              }}
            >
              <h3 className="card-title" style={{ margin: 0 }}>
                Çalışan Seçimi
              </h3>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <label
                  style={{
                    display: "inline-flex",
                    gap: "8px",
                    alignItems: "center",
                    fontSize: "13px",
                    color: "#374151",
                    fontWeight: 700,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={(e) => toggleAllFiltered(e.target.checked)}
                  />
                  Filtrelenenleri toplu seç
                </label>

                <button
                  type="button"
                  onClick={clearSelection}
                  style={{
                    border: "none",
                    borderRadius: "10px",
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

            {loading ? (
              <div className="card-text">Yükleniyor...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="card-text">Uygun çalışan bulunamadı.</div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: "14px",
                }}
              >
                {filteredUsers.map((u) => {
                  const checked = selectedUsers.includes(u.id);

                  return (
                    <label
                      key={u.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "16px",
                        borderRadius: "16px",
                        border: checked ? "2px solid #2563eb" : "1px solid #e5e7eb",
                        background: checked
                          ? "linear-gradient(180deg,#eff6ff,#ffffff)"
                          : "#f9fafb",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleUser(u.id, e.target.checked)}
                        style={{ marginTop: "4px" }}
                      />

                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: 800,
                            color: "#111827",
                          }}
                        >
                          {u.full_name}
                        </div>

                        <div
                          style={{
                            marginTop: "6px",
                            fontSize: "13px",
                            color: "#6b7280",
                            lineHeight: 1.6,
                            wordBreak: "break-word",
                          }}
                        >
                          {u.email}
                        </div>

                        <div
                          style={{
                            marginTop: "8px",
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={smallBadgeStyle("#fff", "#e5e7eb", "#374151")}
                          >
                            {u.company}
                          </span>

                          <span
                            style={
                              u.is_active
                                ? smallBadgeStyle("#dcfce7", "#86efac", "#166534")
                                : smallBadgeStyle("#fee2e2", "#fca5a5", "#b91c1c")
                            }
                          >
                            {u.is_active ? "Aktif" : "Pasif"}
                          </span>

                          <span
                            style={smallBadgeStyle("#f3f4f6", "#d1d5db", "#374151")}
                          >
                            {u.role}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card" style={{ marginBottom: "24px" }}>
            <h3 className="card-title" style={{ marginBottom: "16px" }}>
              Atama Ön İzleme
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              <div
                style={{
                  borderRadius: "14px",
                  border: "1px solid #e5e7eb",
                  padding: "14px",
                  background: "#ffffff",
                }}
              >
                <div style={{ fontSize: "12px", color: "#6b7280" }}>Seçilen Eğitim</div>
                <div style={{ fontSize: "15px", fontWeight: 800, marginTop: "8px" }}>
                  {selectedTrainingInfo?.title || "-"}
                </div>
              </div>

              <div
                style={{
                  borderRadius: "14px",
                  border: "1px solid #e5e7eb",
                  padding: "14px",
                  background: "#eff6ff",
                }}
              >
                <div style={{ fontSize: "12px", color: "#1d4ed8" }}>Seçilen Kişi</div>
                <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>
                  {selectedCount}
                </div>
              </div>

              <div
                style={{
                  borderRadius: "14px",
                  border: "1px solid #e5e7eb",
                  padding: "14px",
                  background: "#f0fdf4",
                }}
              >
                <div style={{ fontSize: "12px", color: "#166534" }}>Firma Sayısı</div>
                <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>
                  {selectedCompanyCount}
                </div>
              </div>

              <div
                style={{
                  borderRadius: "14px",
                  border: "1px solid #e5e7eb",
                  padding: "14px",
                  background: "#fff7ed",
                }}
              >
                <div style={{ fontSize: "12px", color: "#9a3412" }}>Mail Eksik</div>
                <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>
                  {selectedWithoutEmailCount}
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: assignSummary ? "24px" : "0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "14px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#111827" }}>
                  Atama Özeti
                </div>
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "13px",
                    color: "#6b7280",
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
                  borderRadius: "14px",
                  padding: "14px 20px",
                  background:
                    !trainingId || selectedCount === 0 || assigning
                      ? "#9ca3af"
                      : "#16a34a",
                  color: "#fff",
                  fontWeight: 800,
                  cursor:
                    !trainingId || selectedCount === 0 || assigning
                      ? "not-allowed"
                      : "pointer",
                  minWidth: "180px",
                }}
              >
                {assigning ? "Atanıyor..." : "Eğitimi Ata"}
              </button>
            </div>
          </div>

          {assignSummary ? (
            <div className="card" style={{ marginTop: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <h3 className="card-title" style={{ marginBottom: "6px" }}>
                    Son Atama Sonucu
                  </h3>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>
                    {assignSummary.message || "İşlem sonucu hazır."}
                  </div>
                </div>

                <div
                  style={
                    assignSummary.success
                      ? smallBadgeStyle("#dcfce7", "#86efac", "#166534")
                      : smallBadgeStyle("#fee2e2", "#fca5a5", "#b91c1c")
                  }
                >
                  {assignSummary.success ? "Başarılı" : "Hata"}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                  gap: "12px",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    borderRadius: "14px",
                    border: "1px solid #e5e7eb",
                    padding: "14px",
                    background: "#ffffff",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#6b7280" }}>Yeni Atama</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>
                    {assignSummary.insertedCount || 0}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: "14px",
                    border: "1px solid #e5e7eb",
                    padding: "14px",
                    background: "#fefce8",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#854d0e" }}>Atlandı</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>
                    {assignSummary.skippedCount || 0}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: "14px",
                    border: "1px solid #e5e7eb",
                    padding: "14px",
                    background: "#f0fdf4",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#166534" }}>Mail Başarılı</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>
                    {assignSummary.emailedCount || 0}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: "14px",
                    border: "1px solid #e5e7eb",
                    padding: "14px",
                    background: "#fef2f2",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#b91c1c" }}>Mail Başarısız</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>
                    {assignSummary.mailFailedCount || 0}
                  </div>
                </div>

                <div
                  style={{
                    borderRadius: "14px",
                    border: "1px solid #e5e7eb",
                    padding: "14px",
                    background: "#fff7ed",
                  }}
                >
                  <div style={{ fontSize: "12px", color: "#9a3412" }}>Mail Yok</div>
                  <div style={{ fontSize: "24px", fontWeight: 800, marginTop: "6px" }}>
                    {assignSummary.noEmailCount || 0}
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderRadius: "16px",
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#111827",
                  }}
                >
                  Mail Sonuç Listesi
                </div>

                {!assignSummary.mailResults || assignSummary.mailResults.length === 0 ? (
                  <div style={{ padding: "16px", fontSize: "13px", color: "#6b7280" }}>
                    Mail sonuç verisi bulunamadı.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gap: "0",
                    }}
                  >
                    {assignSummary.mailResults.map((item, index) => (
                      <div
                        key={`${item.userId}-${index}`}
                        style={{
                          padding: "14px 16px",
                          borderTop: index === 0 ? "none" : "1px solid #f1f5f9",
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "12px",
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: "240px" }}>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "#111827",
                              wordBreak: "break-word",
                            }}
                          >
                            {item.email || "Email tanımlı değil"}
                          </div>

                          {item.reason ? (
                            <div
                              style={{
                                marginTop: "6px",
                                fontSize: "12px",
                                color: "#6b7280",
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
                              ? smallBadgeStyle("#dcfce7", "#86efac", "#166534")
                              : smallBadgeStyle("#fee2e2", "#fca5a5", "#b91c1c")
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
      </section>
    </main>
  );
}