"use client";

import { useEffect, useMemo, useState } from "react";

type UserFirmRow = {
  firm_id?: string | null;
  firm_name?: string | null;
  role?: string | null;
  is_primary?: boolean | null;
};

type UserApiRow = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  company_id?: string | null;
  company?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  permissions?: string[] | null;
  firms?: UserFirmRow[] | null;
};

type UserResponse = {
  data?: UserApiRow[];
  stats?: {
    total_count?: number;
    active_count?: number;
    passive_count?: number;
  };
  error?: string;
};

type MeResponse = {
  success?: boolean;
  user?: {
    id?: string;
    full_name?: string;
    email?: string;
    role?: string;
    company_id?: string;
  };
  error?: string;
};

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  company_id: string;
  company: string;
  is_active: boolean;
  created_at: string;
  permissions: string[];
  firms: {
    firm_id: string;
    firm_name: string;
    role: string;
    is_primary: boolean;
  }[];
};

type CompanyOption = {
  id: string;
  name: string;
};

const BRAND = {
  bg: "#f7f8fb",
  white: "#ffffff",
  text: "#1f2937",
  muted: "#6b7280",
  border: "#e5e7eb",
  red: "#c62828",
  redDark: "#5a0f1f",
  green: "#166534",
  blue: "#1d4ed8",
  shadow: "0 10px 30px rgba(15,23,42,0.06)",
};

const ALL_PERMISSIONS = [
  "AJANDA",
  "CALISANLAR",
  "DENETIM",
  "DOKUMANTASYON",
  "EGITIM",
  "MEVZUAT",
  "RAPORLAMA",
  "SAGLIK",
  "CBS",
  "RISK_YONETIMI",
  "KAZA_OLAY_YONETIMI",
  "FIRMA_YONETIM",
  "KULLANICI_YONETIMI",
  "ADMIN",
];

function getRoleLabel(role?: string | null) {
  if (role === "super_admin") return "Süper Admin";
  if (role === "company_admin") return "Firma Yöneticisi";
  if (role === "operator") return "Operatör";
  if (role === "training_user") return "Eğitim Kullanıcısı";
  return role || "-";
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

function prettyPermissionLabel(perm: string) {
  return String(perm || "")
    .replace(/_/g, " ")
    .replace(/:/g, " / ")
    .trim();
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingPerm, setSavingPerm] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [autoApplyRole, setAutoApplyRole] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  const [formFullName, setFormFullName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("operator");
  const [formCompanyId, setFormCompanyId] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  const resetForm = () => {
    setFormFullName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("operator");
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
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(user.role);
    setFormCompanyId(user.company_id || "");
    setFormIsActive(user.is_active);
    setShowEditModal(true);
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const meRes = await fetch("/api/admin/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (meRes.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const meJson: MeResponse = await meRes.json();

      if (!meRes.ok) {
        setError(meJson?.error || "Oturum bilgisi alınamadı.");
        setUsers([]);
        return;
      }

      const currentRole = String(meJson?.user?.role || "").trim();
      setAdminRole(currentRole);

      const usersRes = await fetch("/api/admin/users", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      if (usersRes.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const json: UserResponse = await usersRes.json();

      if (!usersRes.ok) {
        setError(json?.error || "Kullanıcılar alınamadı.");
        setUsers([]);
        return;
      }

      if (currentRole === "super_admin") {
        const companiesRes = await fetch("/api/admin/companies", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        if (companiesRes.status === 401) {
          window.location.href = "/admin/login";
          return;
        }

        const companiesJson = await companiesRes.json();

        setCompanies(
          Array.isArray(companiesJson?.data)
            ? companiesJson.data.map((c: { id: string; name: string }) => ({
                id: String(c.id || ""),
                name: String(c.name || "").trim(),
              }))
            : []
        );
      } else {
        setCompanies([]);
      }

      const normalized: UserRow[] = Array.isArray(json.data)
        ? json.data
            .filter((u) => String(u.role || "") !== "training_user")
            .map((u) => ({
              id: String(u.id || ""),
              full_name: String(u.full_name || "Adsız Kullanıcı").trim(),
              email: String(u.email || "-").trim(),
              role: String(u.role || "").trim(),
              company_id: String(u.company_id || "").trim(),
              company: String(u.company || "").trim(),
              is_active: Boolean(u.is_active),
              created_at: String(u.created_at || ""),
              permissions: Array.isArray(u.permissions)
                ? u.permissions.map((p) => String(p || "").trim()).filter(Boolean)
                : [],
              firms: Array.isArray(u.firms)
                ? u.firms
                    .map((f) => ({
                      firm_id: String(f?.firm_id || "").trim(),
                      firm_name: String(f?.firm_name || "").trim() || "Firma",
                      role: String(f?.role || "").trim() || "operator",
                      is_primary: Boolean(f?.is_primary),
                    }))
                    .filter((f) => f.firm_id)
                : [],
            }))
        : [];

      setUsers(normalized);
    } catch (err) {
      console.error(err);
      setError("Kullanıcılar alınamadı.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const roles = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.role))).sort((a, b) =>
      a.localeCompare(b, "tr")
    );
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const firmsText = (u.firms || []).map((f) => f.firm_name).join(" ");
      const text =
        `${u.full_name} ${u.email} ${u.role} ${u.company} ${firmsText}`.toLowerCase();

      const matchesSearch = !search || text.includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? u.is_active
          : !u.is_active;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalCount = users.length;
  const activeCount = users.filter((u) => u.is_active).length;
  const passiveCount = users.filter((u) => !u.is_active).length;
  const companyCount = new Set(
    users.flatMap((u) => u.firms.map((f) => f.firm_id)).filter(Boolean)
  ).size;

  const updateCompany = async (userId: string, companyId: string) => {
    try {
      setSavingCompany(true);

      const res = await fetch("/api/admin/users/update-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId,
          companyId,
        }),
      });

      const json = await res.json();

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!res.ok) {
        alert(json?.error || "Firma ataması güncellenemedi.");
        return;
      }

      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("Firma ataması güncellenemedi.");
    } finally {
      setSavingCompany(false);
    }
  };

  const addCompany = async (userId: string, companyId: string) => {
    try {
      setSavingCompany(true);

      const res = await fetch("/api/admin/users/add-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId,
          companyId,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!res.ok) {
        alert(json?.error || "Firma eklenemedi.");
        return;
      }

      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("Firma eklenemedi.");
    } finally {
      setSavingCompany(false);
    }
  };

  const removeCompany = async (userId: string, companyId: string) => {
    const ok = window.confirm("Bu firma kullanıcıdan kaldırılsın mı?");
    if (!ok) return;

    try {
      setSavingCompany(true);

      const res = await fetch("/api/admin/users/remove-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId,
          companyId,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!res.ok) {
        alert(json?.error || "Firma kaldırılamadı.");
        return;
      }

      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("Firma kaldırılamadı.");
    } finally {
      setSavingCompany(false);
    }
  };

  const setPrimaryCompany = async (userId: string, companyId: string) => {
    try {
      setSavingCompany(true);

      const res = await fetch("/api/admin/users/set-primary-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId,
          companyId,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      if (!res.ok) {
        alert(json?.error || "Primary firma güncellenemedi.");
        return;
      }

      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("Primary firma güncellenemedi.");
    } finally {
      setSavingCompany(false);
    }
  };

  const updatePermissions = async (userId: string, perms: string[]) => {
    try {
      setSavingPerm(true);

      const res = await fetch("/api/admin/users/update-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId,
          permissions: perms,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json?.error || "Yetki güncellenemedi");
        return;
      }

      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("Yetki güncellenemedi");
    } finally {
      setSavingPerm(false);
    }
  };

  const updateRole = async (userId: string, role: string) => {
    try {
      const res = await fetch("/api/admin/users/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId,
          role,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json?.error || "Rol güncellenemedi");
        return false;
      }

      return true;
    } catch (error) {
      console.error(error);
      alert("Rol güncellenemedi");
      return false;
    }
  };

  const createUser = async () => {
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
          role: formRole,
          company_id: formCompanyId || null,
          is_active: formIsActive,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json?.error || "Kullanıcı oluşturulamadı.");
        return;
      }

      setShowCreateModal(false);
      resetForm();
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("Kullanıcı oluşturulamadı.");
    } finally {
      setSavingUser(false);
    }
  };

  const updateUser = async () => {
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
          role: formRole,
          company_id: formCompanyId || null,
          is_active: formIsActive,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json?.error || "Kullanıcı güncellenemedi.");
        return;
      }

      setShowEditModal(false);
      resetForm();
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("Kullanıcı güncellenemedi.");
    } finally {
      setSavingUser(false);
    }
  };

  const deleteUser = async (userId: string, fullName: string) => {
    const ok = window.confirm(
      `${fullName} kullanıcısını silmek istediğinize emin misiniz?`
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
        alert(json?.error || "Kullanıcı silinemedi.");
        return;
      }

      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("Kullanıcı silinemedi.");
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
          <h1
            style={{
              marginTop: 0,
              marginBottom: 8,
              fontSize: "clamp(28px, 4vw, 36px)",
              fontWeight: 900,
              lineHeight: 1.1,
            }}
          >
            {adminRole === "company_admin"
              ? "Alt Sistem Kullanıcıları"
              : "Sistem Kullanıcıları"}
          </h1>

          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.7,
            }}
          >
            {adminRole === "company_admin"
              ? "Kendi firmanıza ait yetkili alt kullanıcıları yönetin. Eğitim katılımcıları bu ekranda gösterilmez."
              : "Admin, firma yöneticisi ve operatör kullanıcılarını yönetin. Eğitim katılımcıları bu ekranda gösterilmez."}
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
            <div style={{ fontSize: 13, color: BRAND.muted }}>
              Toplam Sistem Kullanıcısı
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8 }}>
              {totalCount}
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: BRAND.muted }}>Aktif</div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8 }}>
              {activeCount}
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: BRAND.muted }}>Pasif</div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8 }}>
              {passiveCount}
            </div>
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: BRAND.muted }}>
              Firma Bağlı Kullanıcı
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, marginTop: 8 }}>
              {companyCount}
            </div>
          </div>
        </div>

        <div
          style={{
            ...cardStyle(),
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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
              placeholder="Ad soyad, email, rol veya firma ara..."
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
              Rol
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${BRAND.border}`,
                background: "#fff",
                fontSize: 14,
              }}
            >
              <option value="all">Tüm Roller</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
              Durum
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${BRAND.border}`,
                background: "#fff",
                fontSize: 14,
              }}
            >
              <option value="all">Tümü</option>
              <option value="active">Aktif</option>
              <option value="passive">Pasif</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 10, marginBottom: 20 }}>
          <label
            style={{
              fontSize: 13,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <input
              type="checkbox"
              checked={autoApplyRole}
              onChange={(e) => setAutoApplyRole(e.target.checked)}
            />
            Rol değişince yetkileri otomatik uygula
          </label>
        </div>

        <div style={cardStyle()}>
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
              Sistem Kullanıcı Listesi
            </h2>

            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={openCreateModal}
                style={{
                  border: "none",
                  background: `linear-gradient(135deg, ${BRAND.redDark} 0%, ${BRAND.red} 100%)`,
                  color: "#fff",
                  borderRadius: 12,
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                + Yeni Kullanıcı
              </button>

              <div style={badgeStyle("#f3f4f6", "#d1d5db", "#374151")}>
                {filteredUsers.length} kayıt
              </div>
            </div>
          </div>

          {loading ? (
            <div>Yükleniyor...</div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ color: BRAND.muted }}>
              Sistem kullanıcısı bulunamadı.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  style={{
                    border: `1px solid ${BRAND.border}`,
                    borderRadius: 16,
                    padding: 16,
                    background: "#fff",
                    minWidth: 0,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 900,
                          color: BRAND.text,
                          wordBreak: "break-word",
                        }}
                      >
                        {u.full_name}
                      </div>

                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 13,
                          color: BRAND.muted,
                          wordBreak: "break-word",
                        }}
                      >
                        {u.email || "-"}
                      </div>

                      <div
                        style={{
                          marginTop: 10,
                          display: "flex",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        {(u.permissions || []).slice(0, 3).map((perm) => (
                          <span
                            key={`${u.id}-${perm}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "5px 9px",
                              borderRadius: 999,
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#334155",
                              lineHeight: 1,
                            }}
                          >
                            {prettyPermissionLabel(perm)}
                          </span>
                        ))}

                        {(u.permissions || []).length > 3 ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "5px 9px",
                              borderRadius: 999,
                              background: "#eef2ff",
                              border: "1px solid #c7d2fe",
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#3730a3",
                              lineHeight: 1,
                            }}
                          >
                            +{u.permissions.length - 3}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        minWidth: 0,
                        alignItems: "center",
                      }}
                    >
                      <select
                        value={u.role}
                        onChange={async (e) => {
                          const newRole = e.target.value;

                          const roleSaved = await updateRole(u.id, newRole);
                          if (!roleSaved) return;

                          if (autoApplyRole) {
                            const res = await fetch("/api/admin/roles/template", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({ role: newRole }),
                            });

                            const json = await res.json();

                            if (!res.ok) {
                              alert(
                                "Rol kaydedildi ama varsayılan yetkiler alınamadı"
                              );
                              await loadUsers();
                              return;
                            }

                            await updatePermissions(u.id, json.permissions || []);
                            return;
                          }

                          const confirmChange = window.confirm(
                            "Rol güncellendi. Bu role ait varsayılan yetkiler de yüklensin mi?"
                          );

                          if (!confirmChange) {
                            await loadUsers();
                            return;
                          }

                          const res = await fetch("/api/admin/roles/template", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ role: newRole }),
                          });

                          const json = await res.json();

                          if (!res.ok) {
                            alert(
                              "Rol kaydedildi ama varsayılan yetkiler alınamadı"
                            );
                            await loadUsers();
                            return;
                          }

                          await updatePermissions(u.id, json.permissions || []);
                        }}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: `1px solid ${BRAND.border}`,
                          fontSize: 12,
                          fontWeight: 700,
                          background: "#fff",
                        }}
                      >
                        <option value="operator">Operatör</option>
                        <option value="company_admin">Firma Yöneticisi</option>
                        <option value="super_admin">Süper Admin</option>
                      </select>

                      <div
                        style={{
                          width: "100%",
                          fontSize: 11,
                          color: BRAND.muted,
                          marginTop: 4,
                          fontWeight: 600,
                        }}
                      >
                        {u.role === "super_admin"
                          ? "Tam sistem yetkisi"
                          : u.role === "company_admin"
                          ? "Firma bazlı yönetim yetkisi"
                          : u.role === "operator"
                          ? "Operasyon / sınırlı erişim"
                          : "Rol tanımı yok"}
                      </div>

                      <span
                        style={
                          u.is_active
                            ? badgeStyle("#dcfce7", "#86efac", "#166534")
                            : badgeStyle("#fee2e2", "#fca5a5", "#b91c1c")
                        }
                      >
                        {u.is_active ? "Aktif" : "Pasif"}
                      </span>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {u.firms.length === 0 ? (
                          <span style={badgeStyle("#fff7ed", "#fed7aa", "#9a3412")}>
                            Firma yok
                          </span>
                        ) : (
                          u.firms.map((f) => (
                            <span
                              key={`${u.id}-${f.firm_id}`}
                              style={badgeStyle(
                                f.is_primary ? "#dcfce7" : "#f1f5f9",
                                f.is_primary ? "#86efac" : "#cbd5e1",
                                f.is_primary ? "#166534" : "#334155"
                              )}
                            >
                              {f.firm_id === "ALL" ? "🌍 TÜM FİRMALAR" : f.firm_name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, minWidth: 0 }}>
                    {adminRole === "super_admin" && (
                      <>
                        <select
                          value={u.company_id || ""}
                          onChange={(e) => void updateCompany(u.id, e.target.value)}
                          disabled={savingCompany}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "1px solid #d1d5db",
                            fontSize: 13,
                            minWidth: 220,
                            width: "100%",
                            maxWidth: 320,
                            background: "#fff",
                            marginBottom: 10,
                          }}
                        >
                          <option value="">Eski tekil firma alanı</option>
                          {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>

                        <div
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 12,
                            padding: 12,
                            background: "#fafafa",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: BRAND.text,
                              marginBottom: 8,
                            }}
                          >
                            Çoklu Firma Yönetimi
                          </div>

                          <select
                            defaultValue=""
                            onChange={async (e) => {
                              const selectedFirmId = e.target.value;
                              if (!selectedFirmId) return;
                              await addCompany(u.id, selectedFirmId);
                              e.currentTarget.value = "";
                            }}
                            disabled={savingCompany}
                            style={{
                              padding: "10px 12px",
                              borderRadius: 10,
                              border: "1px solid #d1d5db",
                              fontSize: 13,
                              width: "100%",
                              maxWidth: 360,
                              background: "#fff",
                              marginBottom: 10,
                            }}
                          >
                            <option value="">+ Çoklu firmaya firma ekle</option>
                            <option value="ALL">🌍 Tüm Firmalar (Global)</option>
                            {companies
                              .filter(
                                (c) => !u.firms.some((f) => f.firm_id === c.id)
                              )
                              .map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                          </select>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            {u.firms.length === 0 ? (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: BRAND.muted,
                                }}
                              >
                                Çoklu firma kaydı yok.
                              </div>
                            ) : (
                              u.firms.map((f) => (
                                <div
                                  key={`${u.id}-manage-${f.firm_id}`}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 8,
                                    flexWrap: "wrap",
                                    padding: "8px 10px",
                                    borderRadius: 10,
                                    background: "#fff",
                                    border: "1px solid #e5e7eb",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 700,
                                      color: BRAND.text,
                                    }}
                                  >
                                    {f.firm_name} {f.is_primary ? "⭐ Primary" : ""}
                                  </div>

                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 8,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    {!f.is_primary && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void setPrimaryCompany(u.id, f.firm_id)
                                        }
                                        disabled={savingCompany}
                                        style={{
                                          border: "1px solid #bbf7d0",
                                          background: "#f0fdf4",
                                          color: "#166534",
                                          borderRadius: 8,
                                          padding: "6px 10px",
                                          fontSize: 12,
                                          fontWeight: 700,
                                          cursor: "pointer",
                                        }}
                                      >
                                        Primary Yap
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void removeCompany(u.id, f.firm_id)
                                      }
                                      disabled={savingCompany}
                                      style={{
                                        border: "1px solid #fecaca",
                                        background: "#fff5f5",
                                        color: "#b91c1c",
                                        borderRadius: 8,
                                        padding: "6px 10px",
                                        fontSize: 12,
                                        fontWeight: 700,
                                        cursor: "pointer",
                                      }}
                                    >
                                      Firmayı Kaldır
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: BRAND.muted,
                      marginRight: 2,
                      marginTop: 10,
                    }}
                  >
                    İşlemler:
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={async () => {
                        const res = await fetch("/api/admin/roles/template", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ role: u.role }),
                        });

                        const json = await res.json();

                        if (!res.ok) {
                          alert("Rol yetkileri alınamadı");
                          return;
                        }

                        await updatePermissions(u.id, json.permissions || []);
                      }}
                      style={{
                        background: "#111827",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        padding: "8px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      🔥 Role Göre Yetki Yükle
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedUserId((prev) => (prev === u.id ? null : u.id))
                      }
                      style={{
                        border: `1px solid ${BRAND.border}`,
                        background: expandedUserId === u.id ? "#111827" : "#fff",
                        borderRadius: 12,
                        padding: "10px 14px",
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: "pointer",
                        color: expandedUserId === u.id ? "#fff" : BRAND.text,
                      }}
                    >
                      {expandedUserId === u.id
                        ? "Yetkileri Gizle"
                        : `Yetkileri Göster (${u.permissions?.length || 0})`}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(u)}
                      style={{
                        border: "1px solid #d1d5db",
                        background: "#fff",
                        borderRadius: 10,
                        padding: "9px 14px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Düzenle
                    </button>

                    <button
                      type="button"
                      onClick={() => void deleteUser(u.id, u.full_name)}
                      style={{
                        border: "1px solid #fecaca",
                        background: "#fff5f5",
                        color: "#b91c1c",
                        borderRadius: 10,
                        padding: "9px 14px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Sil
                    </button>
                  </div>

                  {expandedUserId === u.id && (
                    <div
                      style={{
                        marginTop: 12,
                        border: `1px solid ${BRAND.border}`,
                        borderRadius: 14,
                        padding: 14,
                        background: "#fafafa",
                      }}
                    >
                      {!u.permissions || u.permissions.length === 0 ? (
                        <div style={{ fontSize: 13, color: BRAND.muted }}>
                          Yetki yok
                        </div>
                      ) : null}

                      <div style={{ display: "grid", gap: 8 }}>
                        {ALL_PERMISSIONS.map((perm) => {
                          const isChecked = u.permissions?.includes(perm);

                          return (
                            <label
                              key={`${u.id}-${perm}-checkbox`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={savingPerm}
                                onChange={(e) => {
                                  const currentPerms = u.permissions || [];

                                  let newPerms: string[];

                                  if (e.target.checked) {
                                    newPerms = [...currentPerms, perm];
                                  } else {
                                    newPerms = currentPerms.filter(
                                      (p) => p !== perm
                                    );
                                  }

                                  newPerms = Array.from(new Set(newPerms));

                                  void updatePermissions(u.id, newPerms);
                                }}
                              />
                              {prettyPermissionLabel(perm)}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 12,
                      color: BRAND.muted,
                      wordBreak: "break-word",
                    }}
                  >
                    Kayıt tarihi:{" "}
                    {u.created_at
                      ? new Date(u.created_at).toLocaleString("tr-TR")
                      : "-"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(showCreateModal || showEditModal) && (
        <div
          onClick={() => {
            if (savingUser) return;
            setShowCreateModal(false);
            setShowEditModal(false);
            resetForm();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.42)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 560,
              background: "#fff",
              borderRadius: 20,
              border: `1px solid ${BRAND.border}`,
              boxShadow: "0 30px 80px rgba(15,23,42,0.18)",
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: BRAND.text,
                marginBottom: 14,
              }}
            >
              {showCreateModal ? "Yeni Kullanıcı Ekle" : "Kullanıcı Düzenle"}
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    marginBottom: 8,
                    color: BRAND.text,
                  }}
                >
                  Ad Soyad
                </div>
                <input
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  placeholder="Ad soyad"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${BRAND.border}`,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    marginBottom: 8,
                    color: BRAND.text,
                  }}
                >
                  Email
                </div>
                <input
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="ornek@mail.com"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${BRAND.border}`,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    marginBottom: 8,
                    color: BRAND.text,
                  }}
                >
                  {showCreateModal
                    ? "Şifre"
                    : "Yeni Şifre (boş bırakırsan değişmez)"}
                </div>
                <input
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={showCreateModal ? "Şifre girin" : "İsteğe bağlı"}
                  type="password"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1px solid ${BRAND.border}`,
                    fontSize: 14,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 14,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      marginBottom: 8,
                      color: BRAND.text,
                    }}
                  >
                    Rol
                  </div>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1px solid ${BRAND.border}`,
                      background: "#fff",
                      fontSize: 14,
                    }}
                  >
                    <option value="operator">Operatör</option>
                    <option value="company_admin">Firma Yöneticisi</option>
                    <option value="super_admin">Süper Admin</option>
                  </select>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      marginBottom: 8,
                      color: BRAND.text,
                    }}
                  >
                    Firma
                  </div>
                  <select
                    value={formCompanyId}
                    onChange={(e) => setFormCompanyId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1px solid ${BRAND.border}`,
                      background: "#fff",
                      fontSize: 14,
                    }}
                  >
                    <option value="">Firma yok</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  fontSize: 14,
                  color: BRAND.text,
                  fontWeight: 700,
                }}
              >
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                />
                Kullanıcı aktif
              </label>
            </div>

            <div
              style={{
                marginTop: 20,
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                disabled={savingUser}
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                style={{
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  borderRadius: 12,
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: savingUser ? "not-allowed" : "pointer",
                }}
              >
                Vazgeç
              </button>

              <button
                type="button"
                disabled={savingUser}
                onClick={() => {
                  if (showCreateModal) {
                    void createUser();
                  } else {
                    void updateUser();
                  }
                }}
                style={{
                  border: "none",
                  background: `linear-gradient(135deg, ${BRAND.redDark} 0%, ${BRAND.red} 100%)`,
                  color: "#fff",
                  borderRadius: 12,
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: savingUser ? "not-allowed" : "pointer",
                }}
              >
                {savingUser
                  ? "Kaydediliyor..."
                  : showCreateModal
                  ? "Kullanıcıyı Oluştur"
                  : "Değişiklikleri Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}