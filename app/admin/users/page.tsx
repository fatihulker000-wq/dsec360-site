"use client";

import { useEffect, useMemo, useState } from "react";

type UserApiRow = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  company_id?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
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

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  company_id: string;
  is_active: boolean;
  created_at: string;
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

     const [usersRes, companiesRes] = await Promise.all([
  fetch("/api/admin/users", {
    method: "GET",
    cache: "no-store",
    credentials: "include",
  }),
  fetch("/api/admin/companies", {
    method: "GET",
    cache: "no-store",
    credentials: "include",
  }),
]);

if (usersRes.status === 401 || companiesRes.status === 401) {
  window.location.href = "/admin/login";
  return;
}

const json: UserResponse = await usersRes.json();
const companiesJson = await companiesRes.json();

      if (!usersRes.ok) {
        setError(json?.error || "Kullanıcılar alınamadı.");
        setUsers([]);
        return;
      }

      const normalized: UserRow[] = Array.isArray(json.data)
        ? json.data.map((u) => ({
            id: String(u.id || ""),
            full_name: String(u.full_name || "Adsız Kullanıcı").trim(),
            email: String(u.email || "-").trim(),
            role: getRoleLabel(u.role),
            company_id: String(u.company_id || "Firma bilgisi yok").trim(),
            is_active: Boolean(u.is_active),
            created_at: String(u.created_at || ""),
          }))
        : [];

      setUsers(normalized);
      setCompanies(
  Array.isArray(companiesJson?.data)
    ? companiesJson.data.map((c: { id: string; name: string }) => ({
        id: String(c.id),
        name: String(c.name || "").trim(),
      }))
    : []
);
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
        `${u.full_name} ${u.email} ${u.role} ${u.company_id}`.toLowerCase();

      const matchesSearch =
        !search || text.includes(search.toLowerCase());

      const matchesRole =
        roleFilter === "all" ? true : u.role === roleFilter;

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
  const companyCount = new Set(users.map((u) => u.company_id)).size;

  return (
    <main style={{ minHeight: "100%", background: BRAND.bg, padding: 24 }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div
          style={{
            ...cardStyle(),
            background: `linear-gradient(135deg, ${BRAND.redDark} 0%, ${BRAND.red} 100%)`,
            color: "#fff",
            marginBottom: 20,
          }}
        >
          <h1
            style={{
              marginTop: 0,
              marginBottom: 8,
              fontSize: 36,
              fontWeight: 900,
            }}
          >
            Kullanıcı Yönetimi
          </h1>

          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1.7,
            }}
          >
            Kullanıcıları listele, ara, rol ve durum bazlı filtrele.
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
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div style={cardStyle()}>
            <div style={{ fontSize: 13, color: BRAND.muted }}>
              Toplam Kullanıcı
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
              Firma Sayısı
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
            gridTemplateColumns: "2fr 1fr 1fr",
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

          <div>
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
                  {role}
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
              Kullanıcı Listesi
            </h2>

            <div style={badgeStyle("#f3f4f6", "#d1d5db", "#374151")}>
              {filteredUsers.length} kayıt
            </div>
          </div>

          {loading ? (
            <div>Yükleniyor...</div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ color: BRAND.muted }}>Kullanıcı bulunamadı.</div>
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
                    <div>
                      <div
                        style={{
                          fontSize: 17,
                          fontWeight: 900,
                          color: BRAND.text,
                        }}
                      >
                        {u.full_name}
                      </div>

                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 13,
                          color: BRAND.muted,
                        }}
                      >
                        {u.email || "-"}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={badgeStyle("#f3f4f6", "#d1d5db", "#374151")}>
                        {u.role}
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

                      <span style={badgeStyle("#fff7ed", "#fed7aa", "#9a3412")}>
                        {u.company_id || "Firma bilgisi yok"}
                      </span>
                    </div>
                  </div>

<div style={{ marginTop: 10 }}>
  <select
    defaultValue={u.company_id || ""}
    onChange={async (e) => {
      const companyId = e.target.value;

      await fetch("/api/admin/users/update-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: u.id,
          companyId,
        }),
      });

      location.reload();
    }}
    style={{
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid #d1d5db",
      fontSize: 13,
      minWidth: 220,
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

                  <div
                    style={{
                      marginTop: 12,
                      fontSize: 12,
                      color: BRAND.muted,
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