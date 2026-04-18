"use client";

import { useEffect, useMemo, useState } from "react";

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
};

type CompanyOption = {
  id: string;
  name: string;
};

type PermissionGroup = {
  title: string;
  items: string[];
};

function getPermissionLabel(key: string) {
  const safe = String(key || "").trim();
  if (!safe) return "-";

  return safe
    .replace(/_/g, " ")
    .replace(/:/g, " / ")
    .toUpperCase();
}

function groupPermissions(permissionList: string[]): PermissionGroup[] {
  const unique = Array.from(
    new Set(
      (permissionList || [])
        .map((p) => String(p || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, "tr"));

  const groups: Record<string, string[]> = {
    Panel: [],
    Sağlık: [],
    Denetim: [],
    Eğitim: [],
    Raporlama: [],
    ÇBS: [],
    Risk: [],
    Profil: [],
    Dokümantasyon: [],
    Mevzuat: [],
    Ajanda: [],
    Çalışanlar: [],
    Diğer: [],
  };

  unique.forEach((perm) => {
    const upper = perm.toUpperCase();

    if (upper.includes("SAGLIK")) groups["Sağlık"].push(perm);
    else if (upper.includes("DENETIM")) groups["Denetim"].push(perm);
    else if (upper.includes("EGITIM")) groups["Eğitim"].push(perm);
    else if (upper.includes("RAPOR")) groups["Raporlama"].push(perm);
    else if (upper.includes("CBS")) groups["ÇBS"].push(perm);
    else if (upper.includes("RISK")) groups["Risk"].push(perm);
    else if (upper.includes("PROFIL")) groups["Profil"].push(perm);
    else if (upper.includes("DOKUMAN")) groups["Dokümantasyon"].push(perm);
    else if (upper.includes("MEVZUAT")) groups["Mevzuat"].push(perm);
    else if (upper.includes("AJANDA")) groups["Ajanda"].push(perm);
    else if (upper.includes("CALISAN")) groups["Çalışanlar"].push(perm);
    else if (upper.includes("CARD:") || upper.includes("MODULE:")) groups["Panel"].push(perm);
    else groups["Diğer"].push(perm);
  });

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([title, items]) => ({
      title,
      items,
    }));
}

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
  "DENETIM",
  "EGITIM",
  "SAGLIK",
  "RAPORLAMA",
  "CBS",
  "CALISANLAR",
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
    border: '1px solid ${BRAND.border}',
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
    border: '1px solid ${border}',
    fontSize: 12,
    fontWeight: 700,
    color,
    whiteSpace: "nowrap",
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingPerm, setSavingPerm] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [autoApplyRole, setAutoApplyRole] = useState(true);

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
          ? u.permissions
              .map((p) => String(p || "").trim())
              .filter(Boolean)
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
      const text =
        `${u.full_name} ${u.email} ${u.role} ${u.company}`.toLowerCase();

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
  const companyCount = new Set(users.map((u) => u.company_id).filter(Boolean))
    .size;

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

  } catch {
    alert("Hata");
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
                border: '1px solid ${BRAND.border}',
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
                border: '1px solid ${BRAND.border}',
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
                border: '1px solid ${BRAND.border}',
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

        <div style={{ marginTop: 10 }}>
  <label style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
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

            <div style={badgeStyle("#f3f4f6", "#d1d5db", "#374151")}>
              {filteredUsers.length} kayıt
            </div>
          </div>

          {loading ? (
            <div>Yükleniyor...</div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ color: BRAND.muted }}>Sistem kullanıcısı bulunamadı.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  style={{
                    border: '1px solid ${BRAND.border}',
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
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        minWidth: 0,
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
      alert("Rol kaydedildi ama varsayılan yetkiler alınamadı");
      await loadUsers();
      return;
    }

    await updatePermissions(u.id, json.permissions || []);
    return;
  }

  const confirmChange = confirm(
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
    alert("Rol kaydedildi ama varsayılan yetkiler alınamadı");
    await loadUsers();
    return;
  }

  await updatePermissions(u.id, json.permissions || []);
}}
  style={{
    padding: "6px 10px",
    borderRadius: 8,
    border: '1px solid ${BRAND.border}',
    fontSize: 12,
    fontWeight: 700,
  }}
>
  <option value="operator">Operatör</option>
  <option value="company_admin">Firma Yöneticisi</option>
  <option value="super_admin">Süper Admin</option>
</select>

                      <span
                        style={
                          u.is_active
                            ? badgeStyle("#dcfce7", "#86efac", "#166534")
                            : badgeStyle("#fee2e2", "#fca5a5", "#b91c1c")
                        }
                      >
                        {u.is_active ? "Aktif" : "Pasif"}
                      </span>

                      <span style={badgeStyle("#fff7ed", "#fed7aa", "#9a3412")}>
                        {u.company || "Firma yok"}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, minWidth: 0 }}>
                    {adminRole === "super_admin" && (
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
                        }}
                      >
                        <option value="">Firma yok</option>
                        {companies.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
<div style={{ marginTop: 14 }}>

  <div style={{ marginBottom: 10 }}>
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

      updatePermissions(u.id, json.permissions || []);
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
</div>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedUserId((prev) => (prev === u.id ? null : u.id))
                      }
                    style={{
  border: '1px solid ${BRAND.border}',
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
                        : 'Yetkileri Göster (${u.permissions?.length || 0})'}
                    </button>

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
                        ) : (
                          <div style={{ display: "grid", gap: 8 }}>
                            {ALL_PERMISSIONS.map((perm) => {
                              const isChecked = u.permissions?.includes(perm);

                              return (
                                <label
                                  key={perm}
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
      newPerms = currentPerms.filter((p) => p !== perm);
    }

    newPerms = Array.from(new Set(newPerms));

    updatePermissions(u.id, newPerms);
  }}
/>

                                  {perm}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

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
    </main>
  );
}