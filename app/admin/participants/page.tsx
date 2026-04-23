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
};

type CompanyApiRow = {
  id?: string | null;
  name?: string | null;
  is_active?: boolean | null;
};

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  company: string;
  company_id: string | null; //;
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

  return "Firma atanmamış";
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
    minWidth: 0,
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
    whiteSpace: "nowrap",
  };
}

export default function AdminParticipantsPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [trainings, setTrainings] = useState<TrainingRow[]>([]);
  const [companies, setCompanies] = useState<{id: string, name: string}[]>([]);
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
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

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

      const [trainingsRes, usersRes, companiesRes] = await Promise.all([
        fetch("/api/admin/trainings", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/admin/users?type=training", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch("/api/admin/companies", {
          cache: "no-store",
          credentials: "include",
        }),
      ]);

      if (
        trainingsRes.status === 401 ||
        usersRes.status === 401 ||
        companiesRes.status === 401
      ) {
        window.location.href = "/admin/login";
        return;
      }

      const trainingsJson = await trainingsRes.json();
      const usersJson = await usersRes.json();
      const companiesJson = await companiesRes.json();

      if (!trainingsRes.ok) {
        throw new Error(trainingsJson?.error || "Eğitim listesi alınamadı.");
      }

      if (!usersRes.ok) {
        throw new Error(usersJson?.error || "Katılımcı listesi alınamadı.");
      }

      if (!companiesRes.ok) {
        throw new Error(companiesJson?.error || "Firma listesi alınamadı.");
      }

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
          }))
        : [];

      const normalizedUsers: UserRow[] = Array.isArray(usersJson?.data)
        ? usersJson.data
            .map((u: UserApiRow) => ({
              id: String(u.id || ""),
              full_name: (u.full_name || "Adsız Kullanıcı").trim(),
              email: (u.email || "-").trim(),
              company: buildCompanyLabel(u),
              company_id: u.company_id || null, //
              role: getRoleLabel(u.role),
              is_active: Boolean(u.is_active),
            }))
        : [];

      const normalizedCompanies = Array.isArray(companiesJson?.data)
  ? companiesJson.data
      .filter((c: CompanyApiRow) => (c?.is_active ?? true) === true)
      .map((c: CompanyApiRow) => ({
        id: String(c?.id || ""),
        name: String(c?.name || "").trim(),
      }))
      .filter((c: { id: string; name: string }) => c.name)
  : [];

      setTrainings(normalizedTrainings);
      setUsers(normalizedUsers);
      setCompanies(normalizedCompanies);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Veriler alınırken hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    const found = trainings.find((t) => t.id === trainingId) || null;
    setSelectedTrainingInfo(found);
  }, [trainingId, trainings]);

  const resetForm = () => {
  setFormFullName("");
  setFormEmail("");
  setFormPassword("");
  setFormCompanyId("");
  setFormIsActive(true);
  setSelectedUser(null);
};

const openCreateModal = () => {
  resetForm();
  setShowCreateModal(true);
};

const openEditModal = (user: UserRow) => {
  setSelectedUser(user);
  setFormFullName(user.full_name);
  setFormEmail(user.email === "-" ? "" : user.email);
  setFormPassword("");
  setFormCompanyId(user.company_id || "");
  setFormIsActive(user.is_active);
  setShowEditModal(true);
};

const createTrainingUser = async () => {
  try {
    if (!formFullName.trim()) {
      alert("Ad soyad zorunlu.");
      return;
    }

    if (!formEmail.trim()) {
      alert("Email zorunlu.");
      return;
    }

    if (!formPassword.trim()) {
      alert("Şifre zorunlu.");
      return;
    }

    if (!formCompanyId.trim()) {
      alert("Firma zorunlu.");
      return;
    }

    setSavingUser(true);

    const res = await fetch("/api/admin/users/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        full_name: formFullName.trim(),
        email: formEmail.trim().toLowerCase(),
        password: formPassword,
        role: "training_user",
        company_id: formCompanyId,
        is_active: formIsActive,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json?.error || "Katılımcı oluşturulamadı.");
      return;
    }

    setShowCreateModal(false);
    resetForm();
    await loadAll();
  } catch (err) {
    console.error(err);
    alert("Katılımcı oluşturulamadı.");
  } finally {
    setSavingUser(false);
  }
};

const updateTrainingUser = async () => {
  try {
    if (!selectedUser?.id) {
      alert("Düzenlenecek kullanıcı bulunamadı.");
      return;
    }

    if (!formFullName.trim()) {
      alert("Ad soyad zorunlu.");
      return;
    }

    if (!formEmail.trim()) {
      alert("Email zorunlu.");
      return;
    }

    if (!formCompanyId.trim()) {
      alert("Firma zorunlu.");
      return;
    }

    setSavingUser(true);

    const res = await fetch("/api/admin/users/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        userId: selectedUser.id,
        full_name: formFullName.trim(),
        email: formEmail.trim().toLowerCase(),
        password: formPassword.trim() || null,
        role: "training_user",
        company_id: formCompanyId,
        is_active: formIsActive,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json?.error || "Katılımcı güncellenemedi.");
      return;
    }

    setShowEditModal(false);
    resetForm();
    await loadAll();
  } catch (err) {
    console.error(err);
    alert("Katılımcı güncellenemedi.");
  } finally {
    setSavingUser(false);
  }
};

const deleteTrainingUser = async (userId: string, fullName: string) => {
  const ok = window.confirm(
    '${fullName} isimli eğitim katılımcısını silmek istediğinize emin misiniz?'
  );
  if (!ok) return;

  try {
    const res = await fetch("/api/admin/users/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ userId }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json?.error || "Katılımcı silinemedi.");
      return;
    }

    await loadAll();
  } catch (err) {
    console.error(err);
    alert("Katılımcı silinemedi.");
  }
};

const toggleTrainingUserActive = async (user: UserRow) => {
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
    alert("Durum güncellenemedi.");
  }
};

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const text = `${u.full_name} ${u.email} ${u.company} ${u.role}`.toLowerCase();
      const matchesSearch = !search || text.includes(search.toLowerCase());
      const matchesCompany =
  companyFilter === "all"
    ? true
    : u.company_id === companyFilter;

      return matchesSearch && matchesCompany;
    });
  }, [users, search, companyFilter]);

  const selectedCount = selectedUsers.length;

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
    setSelectedUsers([]);
  };

  const assign = async () => {
    if (!trainingId) {
      alert("Önce eğitim seç.");
      return;
    }

    if (!selectedUsers.length) {
      alert("En az bir katılımcı seç.");
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
      setSelectedUsers([]);
      await loadAll();
    } catch (err) {
      console.error(err);
      alert("Sunucu hatası oluştu.");
    } finally {
      setAssigning(false);
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
        <div
          style={{
            ...cardStyle(),
            background: `linear-gradient(135deg, ${BRAND.redDark} 0%, ${BRAND.red} 100%)`,
            color: "#fff",
            marginBottom: 20,
            padding: "clamp(16px, 2.4vw, 24px)",
            borderRadius: 24,
          }}
        >
          <div
            style={badgeStyle(
              "rgba(255,255,255,0.16)",
              "rgba(255,255,255,0.22)",
              "#fff"
            )}
          >
            D-SEC Eğitim Yönetimi
          </div>
          <h1
            style={{
              marginTop: 14,
              marginBottom: 8,
              fontSize: "clamp(28px, 4vw, 36px)",
              fontWeight: 900,
              lineHeight: 1.1,
            }}
          >
            Eğitim Katılımcıları
          </h1>
          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.7,
            }}
          >
            Sadece eğitim alacak çalışanları listele, filtrele ve eğitime ata.
          </p>
        </div>

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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: BRAND.muted }}>Toplam Katılımcı</div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8 }}>
              {users.length}
            </div>
          </div>
          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: BRAND.muted }}>Toplam Eğitim</div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8 }}>
              {trainings.length}
            </div>
          </div>
          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: BRAND.muted }}>Toplam Atama</div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8 }}>
              {trainingTotals.totalAssigned}
            </div>
          </div>
          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: BRAND.muted }}>Seçili Katılımcı</div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8 }}>
              {selectedCount}
            </div>
          </div>
        </div>

        <div
          style={{
            ...cardStyle(),
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          <div style={{ minWidth: 0 }}>
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
              minWidth: 0,
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
                    wordBreak: "break-word",
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
                    Konu: {parseTopicsCount(selectedTrainingInfo.topics_text)}
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

        <div
          style={{
            ...cardStyle(),
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              Ara
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ad soyad, e-posta veya firma ara..."
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${BRAND.border}`,
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              Firma
            </div>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
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
              {companies.map((c) => (
  <option key={c.id} value={c.id}>
    {c.name}
  </option>
))}

            </select>
          </div>
        </div>

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
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>
              Katılımcı Seçimi
            </h2>

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
                onClick={clearSelection}
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

          {loading ? (
            <div>Yükleniyor...</div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ color: BRAND.muted }}>Uygun katılımcı bulunamadı.</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 14,
              }}
            >
              
              {filteredUsers.map((u) => {
  const checked = selectedUsers.includes(u.id);

  return (
    <div
      key={u.id}
      style={{
        padding: 16,
        borderRadius: 16,
        border: checked
          ? "2px solid #2563eb"
          : '1px solid ${BRAND.border}',
        background: checked ? "#eff6ff" : "#f9fafb",
      }}
    >
      {/* SEÇİM ALANI */}
      <div style={{ display: "flex", gap: 12 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => toggleUser(u.id, e.target.checked)}
        />

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900 }}>{u.full_name}</div>
          <div style={{ fontSize: 13, color: BRAND.muted }}>{u.email}</div>

          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={badgeStyle("#fff", "#e5e7eb", "#374151")}>
              {u.company}
            </span>

            <span
              style={
                u.is_active
                  ? badgeStyle("#dcfce7", "#86efac", "#166534")
                  : badgeStyle("#fee2e2", "#fca5a5", "#b91c1c")
              }
            >
              {u.is_active ? "Aktif" : "Pasif"}
            </span>

            <span style={badgeStyle("#f3f4f6", "#d1d5db", "#374151")}>
              {u.role}
            </span>

            {!u.company_id && (
              <span style={badgeStyle("#fee2e2", "#fca5a5", "#b91c1c")}>
                Firma zorunlu
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 🔥 İŞLEM BUTONLARI (DOĞRU YER) */}
      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => openEditModal(u)}
          style={{
            border: "1px solid #d1d5db",
            background: "#fff",
            borderRadius: 10,
            padding: "8px 12px",
            fontWeight: 700,
          }}
        >
          Düzenle
        </button>

        <button
          onClick={() => toggleTrainingUserActive(u)}
          style={{
            border: "1px solid #fde68a",
            background: "#fffbeb",
            color: "#92400e",
            borderRadius: 10,
            padding: "8px 12px",
            fontWeight: 700,
          }}
        >
          {u.is_active ? "Pasife Al" : "Aktif Yap"}
        </button>

        <button
          onClick={() => deleteTrainingUser(u.id, u.full_name)}
          style={{
            border: "1px solid #fecaca",
            background: "#fff5f5",
            color: "#b91c1c",
            borderRadius: 10,
            padding: "8px 12px",
            fontWeight: 700,
          }}
        >
          Sil
        </button>
      </div>
    </div>
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
            <div
              style={{
                fontSize: 15,
                fontWeight: 900,
                marginTop: 8,
                wordBreak: "break-word",
              }}
            >
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
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: BRAND.text }}>
                Atama Özeti
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
                Seçilen eğitim: {selectedTrainingInfo?.title || "-"}
                <br />
                Seçilen katılımcı sayısı: {selectedCount}
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
              {assigning ? "Atanıyor..." : "Eğitimi Ata"}
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
              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
                  Son Atama Sonucu
                </h3>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    color: BRAND.muted,
                    wordBreak: "break-word",
                  }}
                >
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
                        borderTop: index === 0 ? "none" : "1px solid #f1f5f9",
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
                              wordBreak: "break-word",
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

      {showEditModal && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}
  >
    <div
      style={{
        background: "#fff",
        padding: 24,
        borderRadius: 16,
        width: 420,
      }}
    >
      <h3 style={{ marginBottom: 16 }}>Kullanıcı Düzenle</h3>

      <input
        value={formFullName}
        onChange={(e) => setFormFullName(e.target.value)}
        placeholder="Ad Soyad"
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 10,
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      />

      <input
        value={formEmail}
        onChange={(e) => setFormEmail(e.target.value)}
        placeholder="Email"
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 10,
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      />

      <button
        onClick={updateTrainingUser}
        style={{
          width: "100%",
          padding: 12,
          background: "#16a34a",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Kaydet
      </button>

      <button
        onClick={() => setShowEditModal(false)}
        style={{
          width: "100%",
          padding: 10,
          background: "#e5e7eb",
          border: "none",
          borderRadius: 10,
          fontWeight: 600,
        }}
      >
        Kapat
      </button>
    </div>
  </div>
)}

      </div>
    </main>
  );
}
