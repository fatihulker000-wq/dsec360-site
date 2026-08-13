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
  app_user_type?: string | null;
  company_id?: string | null;
  company?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  permissions?: string[] | null;
  permission_modules?: string[] | null;
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
  app_user_type: string;
  company_id: string;
  company: string;
  is_active: boolean;
  created_at: string;
  permissions: string[];
  permission_modules: string[];
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

type AccessFilter = "all" | "web" | "app" | "web_app";
type ModalTab = "general" | "company" | "security";

const BRAND = {
  bg: "#f6f7f9",
  white: "#ffffff",
  text: "#18212f",
  muted: "#667085",
  softMuted: "#98a2b3",
  border: "#e4e7ec",
  soft: "#f9fafb",
  red: "#b42318",
  redDark: "#65151d",
  redSoft: "#fff1f0",
  green: "#067647",
  greenSoft: "#ecfdf3",
  amber: "#b54708",
  amberSoft: "#fffaeb",
  blue: "#175cd3",
  blueSoft: "#eff8ff",
  purple: "#6941c6",
  purpleSoft: "#f4f3ff",
  shadow: "0 1px 2px rgba(16,24,40,.04), 0 8px 24px rgba(16,24,40,.05)",
};

function getRoleLabel(role?: string | null) {
  if (role === "app_users") return "App Kullanıcıları";
  if (role === "super_admin") return "Süper Admin";
  if (role === "company_admin") return "Firma Yöneticisi";
  if (role === "operator") return "Operatör";
  if (role === "training_user") return "Eğitim Kullanıcısı";
  if (role === "demo_user") return "Demo Kullanıcı";
  return role || "-";
}

function getRoleDescription(role?: string | null, appUserType?: string | null) {
  if (appUserType === "isg_uzmani") return "İş güvenliği uzmanı";
  if (appUserType === "hekim") return "İşyeri hekimi";
  if (appUserType === "dsp") return "Diğer sağlık personeli";
  if (appUserType === "diger") return "Diğer saha kullanıcısı";

  if (role === "super_admin") return "Tam sistem yönetim yetkisi";
  if (role === "company_admin") return "Firma bazlı yönetim yetkisi";
  if (role === "operator") return "Operasyon ve sınırlı erişim";
  if (role === "training_user") return "Eğitim portalı kullanıcısı";
  if (role === "demo_user") return "Demo / salt okunur kullanıcı";

  return "Standart kullanıcı";
}

function getAppUserTypeLabel(type?: string | null) {
  if (type === "isg_uzmani") return "İSG Uzmanı";
  if (type === "hekim") return "İşyeri Hekimi";
  if (type === "dsp") return "DSP";
  if (type === "diger") return "Diğer";
  return "";
}

function isWebUser(u: UserRow) {
  return [
    "super_admin",
    "company_admin",
    "operator",
    "training_user",
    "demo_user",
  ].includes(String(u.role || "").trim());
}

function isAppUser(u: UserRow) {
  if (u.app_user_type) return true;

  const modules = u.permission_modules || [];
  const permissions = u.permissions || [];

  return [...modules, ...permissions].some((p) => {
    const key = String(p || "").toUpperCase();

    return (
      key.startsWith("AI_ISG") ||
      key.startsWith("CALISANLAR") ||
      key.startsWith("DASHBOARD") ||
      key.startsWith("RAPORLAMA") ||
      key.startsWith("AJANDA") ||
      key.startsWith("DENETIM") ||
      key.startsWith("EGITIM") ||
      key.startsWith("SAGLIK") ||
      key.startsWith("RISK") ||
      key.startsWith("CBS")
    );
  });
}

function initials(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "KU";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toLocaleUpperCase("tr-TR");
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toLocaleUpperCase(
    "tr-TR"
  );
}

function formatDate(date?: string | null) {
  if (!date) return "-";

  try {
    return new Date(date).toLocaleString("tr-TR");
  } catch {
    return "-";
  }
}

function cardStyle(): React.CSSProperties {
  return {
    background: BRAND.white,
    border: `1px solid ${BRAND.border}`,
    borderRadius: 16,
    boxShadow: BRAND.shadow,
  };
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 42,
    padding: "10px 12px",
    borderRadius: 10,
    border: `1px solid ${BRAND.border}`,
    background: "#fff",
    color: BRAND.text,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };
}

function buttonStyle(
  variant: "primary" | "secondary" | "danger" | "dark" = "secondary"
): React.CSSProperties {
  const common: React.CSSProperties = {
    minHeight: 40,
    padding: "9px 14px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    transition: "all .15s ease",
  };

  if (variant === "primary") {
    return {
      ...common,
      border: "none",
      color: "#fff",
      background: `linear-gradient(135deg, ${BRAND.redDark}, ${BRAND.red})`,
      boxShadow: "0 5px 14px rgba(180,35,24,.16)",
    };
  }

  if (variant === "danger") {
    return {
      ...common,
      border: "1px solid #fecdca",
      background: "#fff",
      color: "#b42318",
    };
  }

  if (variant === "dark") {
    return {
      ...common,
      border: "none",
      background: "#101828",
      color: "#fff",
    };
  }

  return {
    ...common,
    border: `1px solid ${BRAND.border}`,
    background: "#fff",
    color: "#344054",
  };
}

function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "green" | "red" | "blue" | "purple" | "amber";
}) {
  const styles: Record<string, React.CSSProperties> = {
    gray: {
      background: "#f2f4f7",
      border: "1px solid #eaecf0",
      color: "#475467",
    },
    green: {
      background: BRAND.greenSoft,
      border: "1px solid #abefc6",
      color: BRAND.green,
    },
    red: {
      background: BRAND.redSoft,
      border: "1px solid #fecdca",
      color: BRAND.red,
    },
    blue: {
      background: BRAND.blueSoft,
      border: "1px solid #b2ddff",
      color: BRAND.blue,
    },
    purple: {
      background: BRAND.purpleSoft,
      border: "1px solid #d9d6fe",
      color: BRAND.purple,
    },
    amber: {
      background: BRAND.amberSoft,
      border: "1px solid #fedf89",
      color: BRAND.amber,
    },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        minHeight: 26,
        padding: "3px 8px",
        borderRadius: 999,
        fontSize: 11,
        lineHeight: 1.2,
        fontWeight: 800,
        whiteSpace: "nowrap",
        ...styles[tone],
      }}
    >
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
  tone = "default",
}: {
  label: string;
  value: number;
  description: string;
  icon: string;
  tone?: "default" | "green" | "blue" | "amber" | "red";
}) {
  const iconBg =
    tone === "green"
      ? BRAND.greenSoft
      : tone === "blue"
      ? BRAND.blueSoft
      : tone === "amber"
      ? BRAND.amberSoft
      : tone === "red"
      ? BRAND.redSoft
      : "#f2f4f7";

  return (
    <div
      style={{
        ...cardStyle(),
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 13,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: iconBg,
          display: "grid",
          placeItems: "center",
          fontSize: 19,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: BRAND.muted,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </div>

        <div
          style={{
            marginTop: 2,
            display: "flex",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <strong
            style={{
              fontSize: 25,
              lineHeight: 1,
              color: BRAND.text,
              letterSpacing: "-.5px",
            }}
          >
            {value}
          </strong>

          <span
            style={{
              fontSize: 11,
              color: BRAND.softMuted,
            }}
          >
            {description}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [accessFilter, setAccessFilter] =
    useState<AccessFilter>("all");
  const [companyFilter, setCompanyFilter] = useState("all");

  const [adminRole, setAdminRole] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserRow | null>(
    null
  );

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<ModalTab>("general");

  const [formFullName, setFormFullName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("operator");
  const [formCompanyId, setFormCompanyId] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formAccessType, setFormAccessType] = useState("web_app");
  const [formAppUserType, setFormAppUserType] =
    useState("isg_uzmani");

  const resetForm = () => {
    setFormFullName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("operator");
    setFormCompanyId("");
    setFormIsActive(true);
    setFormAccessType("web_app");
    setFormAppUserType("isg_uzmani");
    setSelectedUser(null);
    setModalTab("general");
  };

  const openCreate = () => {
    resetForm();
    setModalTab("general");
    setShowCreateModal(true);
  };

  const openEdit = (user: UserRow) => {
    setSelectedUser(user);
    setFormFullName(user.full_name);
    setFormEmail(user.email);
    setFormPassword("");
    setFormRole(user.role || "operator");
    setFormCompanyId(user.company_id || "");
    setFormIsActive(user.is_active);
    setFormAppUserType(user.app_user_type || "isg_uzmani");

    if (isWebUser(user) && isAppUser(user)) {
      setFormAccessType("web_app");
    } else if (isAppUser(user)) {
      setFormAccessType("app_only");
    } else {
      setFormAccessType("web_only");
    }

    setModalTab("general");
    setOpenMenuId(null);
    setShowEditModal(true);
  };

  const openCompanies = (user: UserRow) => {
    setSelectedUser(user);
    setOpenMenuId(null);
    setShowCompanyModal(true);
  };

  const openDetails = (user: UserRow) => {
    setSelectedUser(user);
    setOpenMenuId(null);
    setShowDetailDrawer(true);
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

      const currentRole = String(
        meJson?.user?.role || ""
      ).trim();

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
            ? companiesJson.data.map(
                (c: { id: string; name: string }) => ({
                  id: String(c.id || ""),
                  name: String(c.name || "").trim(),
                })
              )
            : []
        );
      } else {
        setCompanies([]);
      }

      const normalized: UserRow[] = Array.isArray(json.data)
        ? json.data.map((u) => {
            const permissions = Array.isArray(u.permissions)
              ? u.permissions
                  .map((p) => String(p || "").trim())
                  .filter(Boolean)
              : [];

            const apiModules = Array.isArray(
              u.permission_modules
            )
              ? u.permission_modules
                  .map((p) => String(p || "").trim())
                  .filter(Boolean)
              : [];

            const permissionModules =
              apiModules.length > 0
                ? apiModules
                : Array.from(
                    new Set(
                      permissions
                        .map((p) => {
                          const normalizedPermission = p.replace(
                            ":",
                            "."
                          );
                          return normalizedPermission.split(".")[0];
                        })
                        .filter(Boolean)
                    )
                  ).sort((a, b) =>
                    a.localeCompare(b, "tr")
                  );

            return {
              id: String(u.id || ""),
              full_name: String(
                u.full_name || "Adsız Kullanıcı"
              ).trim(),
              email: String(u.email || "-").trim(),
              role: String(u.role || "").trim(),
              app_user_type: String(
                u.app_user_type || ""
              ).trim(),
              company_id: String(
                u.company_id || ""
              ).trim(),
              company: String(u.company || "").trim(),
              is_active: Boolean(u.is_active),
              created_at: String(u.created_at || ""),
              permissions,
              permission_modules: permissionModules,
              firms: Array.isArray(u.firms)
                ? u.firms
                    .map((f) => ({
                      firm_id: String(
                        f?.firm_id || ""
                      ).trim(),
                      firm_name:
                        String(
                          f?.firm_name || ""
                        ).trim() || "Firma",
                      role:
                        String(f?.role || "").trim() ||
                        "operator",
                      is_primary: Boolean(f?.is_primary),
                    }))
                    .filter((f) => f.firm_id)
                : [],
            };
          })
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

  useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);

    window.addEventListener("click", closeMenu);

    return () => {
      window.removeEventListener("click", closeMenu);
    };
  }, []);

  const roles = useMemo(() => {
    return Array.from(
      new Set(
        users
          .map((u) => String(u.role || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "tr"));
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const firmsText = (u.firms || [])
        .map((f) => f.firm_name)
        .join(" ");

      const appTypeText = getAppUserTypeLabel(
        u.app_user_type
      ).toLowerCase();

      const text =
        `${u.full_name} ${u.email} ${u.role} ${u.company} ${firmsText} ${appTypeText}`.toLowerCase();

      const matchesSearch =
        !search || text.includes(search.toLowerCase());

      const matchesRole =
        roleFilter === "all" || u.role === roleFilter;

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? u.is_active
          : !u.is_active;

      const web = isWebUser(u);
      const app = isAppUser(u);

      const matchesAccess =
        accessFilter === "all"
          ? true
          : accessFilter === "web_app"
          ? web && app
          : accessFilter === "web"
          ? web
          : app;

      const matchesCompany =
        companyFilter === "all"
          ? true
          : companyFilter === "none"
          ? !u.company_id && u.firms.length === 0
          : u.company_id === companyFilter ||
            u.firms.some(
              (f) => f.firm_id === companyFilter
            );

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus &&
        matchesAccess &&
        matchesCompany
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
    accessFilter,
    companyFilter,
  ]);

  const totalCount = users.length;
  const activeCount = users.filter(
    (u) => u.is_active
  ).length;
  const passiveCount = users.filter(
    (u) => !u.is_active
  ).length;
  const webCount = users.filter(isWebUser).length;
  const appCount = users.filter(isAppUser).length;
  const noCompanyCount = users.filter(
    (u) => !u.company_id && u.firms.length === 0
  ).length;

  const addCompany = async (
    userId: string,
    companyId: string
  ) => {
    try {
      setSavingCompany(true);

      const res = await fetch(
        "/api/admin/users/add-company",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            userId,
            companyId,
          }),
        }
      );

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

      setSelectedUser((prev) => {
        if (!prev) return prev;

        const company =
          companyId === "ALL"
            ? {
                id: "ALL",
                name: "Tüm Firmalar",
              }
            : companies.find((c) => c.id === companyId);

        if (!company) return prev;

        return {
          ...prev,
          firms: [
            ...prev.firms,
            {
              firm_id: company.id,
              firm_name: company.name,
              role: "operator",
              is_primary: false,
            },
          ],
        };
      });
    } catch (err) {
      console.error(err);
      alert("Firma eklenemedi.");
    } finally {
      setSavingCompany(false);
    }
  };

  const removeCompany = async (
    userId: string,
    companyId: string
  ) => {
    const ok = window.confirm(
      "Bu firma kullanıcı erişiminden kaldırılsın mı?"
    );

    if (!ok) return;

    try {
      setSavingCompany(true);

      const res = await fetch(
        "/api/admin/users/remove-company",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            userId,
            companyId,
          }),
        }
      );

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

      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              firms: prev.firms.filter(
                (f) => f.firm_id !== companyId
              ),
            }
          : prev
      );
    } catch (err) {
      console.error(err);
      alert("Firma kaldırılamadı.");
    } finally {
      setSavingCompany(false);
    }
  };

  const createUser = async () => {
    try {
      if (!formFullName.trim()) {
        alert("Ad soyad zorunlu.");
        return;
      }

      if (!formEmail.trim()) {
        alert("E-posta zorunlu.");
        return;
      }

      if (!formPassword.trim()) {
        alert("Şifre zorunlu.");
        return;
      }

      if (formRole === "demo_user" && !formCompanyId) {
        alert(
          "Demo kullanıcı için demo firma seçilmelidir."
        );
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
          role:
            formAccessType === "app_only"
              ? "operator"
              : formRole,
          access_type: formAccessType,
          app_user_type:
            formAccessType === "app_only" ||
            formAccessType === "web_app"
              ? formAppUserType
              : null,
          company_id: formCompanyId || null,
          is_active: formIsActive,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(
          json?.error || "Kullanıcı oluşturulamadı."
        );
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
        alert("E-posta zorunlu.");
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
          role:
            formAccessType === "app_only"
              ? "operator"
              : formRole,
          access_type: formAccessType,
          app_user_type:
            formAccessType === "app_only" ||
            formAccessType === "web_app"
              ? formAppUserType
              : null,
          company_id: formCompanyId || null,
          is_active: formIsActive,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(
          json?.error || "Kullanıcı güncellenemedi."
        );
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

  const deleteUser = async (
    userId: string,
    fullName: string
  ) => {
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

      setOpenMenuId(null);
      setShowDetailDrawer(false);
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert("Kullanıcı silinemedi.");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setAccessFilter("all");
    setCompanyFilter("all");
  };

  const hasActiveFilter =
    search ||
    roleFilter !== "all" ||
    statusFilter !== "all" ||
    accessFilter !== "all" ||
    companyFilter !== "all";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: BRAND.bg,
        padding: "18px clamp(12px, 2vw, 24px) 40px",
      }}
    >
      <style>{`
        .dsec-user-table {
          width: 100%;
          border-collapse: collapse;
        }

        .dsec-user-table th {
          text-align: left;
          padding: 11px 14px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .045em;
          color: #667085;
          background: #f9fafb;
          border-bottom: 1px solid #e4e7ec;
          white-space: nowrap;
        }

        .dsec-user-table td {
          padding: 13px 14px;
          border-bottom: 1px solid #eaecf0;
          vertical-align: middle;
        }

        .dsec-user-table tbody tr {
          transition: background .15s ease;
        }

        .dsec-user-table tbody tr:hover {
          background: #fcfcfd;
        }

        .dsec-user-table tbody tr:last-child td {
          border-bottom: none;
        }

        .dsec-menu-button:hover {
          background: #f2f4f7 !important;
        }

        .dsec-action-item:hover {
          background: #f9fafb !important;
        }

        .dsec-primary-button:hover {
          filter: brightness(.97);
          transform: translateY(-1px);
        }

        .dsec-tab-button:hover {
          background: #f9fafb !important;
        }

        @media (max-width: 980px) {
          .dsec-table-wrap {
            overflow-x: auto;
          }

          .dsec-user-table {
            min-width: 900px;
          }
        }

        @media (max-width: 720px) {
          .dsec-page-header {
            align-items: flex-start !important;
            flex-direction: column !important;
          }

          .dsec-modal {
            max-height: calc(100vh - 24px) !important;
            border-radius: 16px !important;
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: 1500,
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <section
          style={{
            ...cardStyle(),
            padding: "18px 20px",
            marginBottom: 14,
            background:
              "linear-gradient(135deg, #59131b 0%, #811d25 55%, #a52828 100%)",
            border: "none",
            color: "#fff",
            boxShadow:
              "0 8px 24px rgba(89,19,27,.15)",
          }}
        >
          <div
            className="dsec-page-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 18,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  marginBottom: 5,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    padding: "4px 8px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.12)",
                    border:
                      "1px solid rgba(255,255,255,.18)",
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: ".08em",
                  }}
                >
                  D-SEC ACCESS CONTROL
                </span>
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(22px, 3vw, 30px)",
                  letterSpacing: "-.6px",
                  fontWeight: 900,
                }}
              >
                {adminRole === "company_admin"
                  ? "Alt Sistem Kullanıcıları"
                  : "Sistem Kullanıcıları"}
              </h1>

              <p
                style={{
                  margin: "5px 0 0",
                  maxWidth: 780,
                  color: "rgba(255,255,255,.78)",
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                Kullanıcı hesaplarını, erişim tiplerini,
                firma bağlantılarını ve sistem rollerini
                merkezi olarak yönetin.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="dsec-primary-button"
              style={{
                ...buttonStyle("secondary"),
                minHeight: 42,
                background: "#fff",
                color: BRAND.redDark,
                border: "none",
                padding: "10px 16px",
                boxShadow:
                  "0 4px 12px rgba(0,0,0,.10)",
                flexShrink: 0,
              }}
            >
              ＋ Yeni Kullanıcı
            </button>
          </div>
        </section>

        {error ? (
          <div
            style={{
              ...cardStyle(),
              marginBottom: 14,
              padding: 13,
              borderColor: "#fecdca",
              background: BRAND.redSoft,
              color: BRAND.red,
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            ⚠ {error}
          </div>
        ) : null}

        {/* KPI */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(175px, 1fr))",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <StatCard
            label="Toplam Kullanıcı"
            value={totalCount}
            description="hesap"
            icon="👥"
          />

          <StatCard
            label="Aktif"
            value={activeCount}
            description="kullanıcı"
            icon="✓"
            tone="green"
          />

          <StatCard
            label="Pasif"
            value={passiveCount}
            description="hesap"
            icon="○"
            tone={passiveCount ? "red" : "default"}
          />

          <StatCard
            label="Web Erişimi"
            value={webCount}
            description="hesap"
            icon="🌐"
            tone="blue"
          />

          <StatCard
            label="App Erişimi"
            value={appCount}
            description="hesap"
            icon="▣"
            tone="blue"
          />

          <StatCard
            label="Firma Atanmamış"
            value={noCompanyCount}
            description="kullanıcı"
            icon="!"
            tone={noCompanyCount ? "amber" : "green"}
          />
        </section>

        {/* FILTER */}
        <section
          style={{
            ...cardStyle(),
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(260px, 2fr) repeat(4, minmax(145px, 1fr)) auto",
              gap: 9,
              alignItems: "center",
            }}
          >
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: BRAND.softMuted,
                  pointerEvents: "none",
                }}
              >
                ⌕
              </span>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ad, e-posta, rol veya firma ara..."
                style={{
                  ...inputStyle(),
                  paddingLeft: 34,
                }}
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value)
              }
              style={inputStyle()}
            >
              <option value="all">Tüm Roller</option>

              {roles.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              style={inputStyle()}
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="passive">Pasif</option>
            </select>

            <select
              value={accessFilter}
              onChange={(e) =>
                setAccessFilter(
                  e.target.value as AccessFilter
                )
              }
              style={inputStyle()}
            >
              <option value="all">Tüm Erişimler</option>
              <option value="web">Web</option>
              <option value="app">App</option>
              <option value="web_app">Web + App</option>
            </select>

            <select
              value={companyFilter}
              onChange={(e) =>
                setCompanyFilter(e.target.value)
              }
              style={inputStyle()}
            >
              <option value="all">Tüm Firmalar</option>
              <option value="none">Firma Atanmamış</option>

              {companies.map((company) => (
                <option
                  key={company.id}
                  value={company.id}
                >
                  {company.name}
                </option>
              ))}
            </select>

            {hasActiveFilter ? (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  ...buttonStyle("secondary"),
                  whiteSpace: "nowrap",
                }}
              >
                Temizle
              </button>
            ) : (
              <div />
            )}
          </div>
        </section>

        {/* USER TABLE */}
        <section
          style={{
            ...cardStyle(),
            overflow: "visible",
          }}
        >
          <div
            style={{
              padding: "15px 16px",
              borderBottom: `1px solid ${BRAND.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: BRAND.text,
                  fontSize: 17,
                  fontWeight: 900,
                }}
              >
                Kullanıcı Dizini
              </h2>

              <div
                style={{
                  marginTop: 3,
                  color: BRAND.muted,
                  fontSize: 12,
                }}
              >
                Sistem erişimi bulunan yönetici ve
                operasyon kullanıcıları
              </div>
            </div>

            <Badge tone="gray">
              {filteredUsers.length} / {users.length} kayıt
            </Badge>
          </div>

          {loading ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: BRAND.muted,
                fontSize: 13,
              }}
            >
              Kullanıcılar yükleniyor...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div
              style={{
                padding: 45,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  margin: "0 auto 12px",
                  background: "#f2f4f7",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 20,
                }}
              >
                ⌕
              </div>

              <strong
                style={{
                  display: "block",
                  color: BRAND.text,
                  fontSize: 14,
                }}
              >
                Kullanıcı bulunamadı
              </strong>

              <span
                style={{
                  display: "block",
                  marginTop: 4,
                  color: BRAND.muted,
                  fontSize: 12,
                }}
              >
                Arama veya filtre kriterlerini değiştirin.
              </span>
            </div>
          ) : (
            <div className="dsec-table-wrap">
              <table className="dsec-user-table">
                <thead>
                  <tr>
                    <th>Kullanıcı</th>
                    <th>Rol</th>
                    <th>Firma Erişimi</th>
                    <th>Erişim</th>
                    <th>Yetki</th>
                    <th>Durum</th>
                    <th style={{ width: 60 }}>İşlem</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((u) => {
                    const web = isWebUser(u);
                    const app = isAppUser(u);

                    const companyLabel =
                      u.firms.some(
                        (f) => f.firm_id === "ALL"
                      )
                        ? "Tüm Firmalar"
                        : u.firms.length > 0
                        ? u.firms[0].firm_name
                        : u.company || "Firma atanmamış";

                    const extraFirmCount =
                      u.firms.length > 1
                        ? u.firms.length - 1
                        : 0;

                    return (
                      <tr key={u.id}>
                        <td>
                          <button
                            type="button"
                            onClick={() => openDetails(u)}
                            style={{
                              border: "none",
                              background: "transparent",
                              padding: 0,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              textAlign: "left",
                            }}
                          >
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                flexShrink: 0,
                                display: "grid",
                                placeItems: "center",
                                background:
                                  "linear-gradient(135deg,#f2f4f7,#eaecf0)",
                                color: "#344054",
                                fontWeight: 900,
                                fontSize: 12,
                              }}
                            >
                              {initials(u.full_name)}
                            </div>

                            <div
                              style={{
                                minWidth: 0,
                                maxWidth: 240,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 900,
                                  color: BRAND.text,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {u.full_name}
                              </div>

                              <div
                                style={{
                                  marginTop: 2,
                                  fontSize: 11,
                                  color: BRAND.muted,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {u.email}
                              </div>
                            </div>
                          </button>
                        </td>

                        <td>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: BRAND.text,
                            }}
                          >
                            {u.app_user_type
                              ? getAppUserTypeLabel(
                                  u.app_user_type
                                )
                              : getRoleLabel(u.role)}
                          </div>

                          <div
                            style={{
                              marginTop: 2,
                              maxWidth: 170,
                              fontSize: 10,
                              color: BRAND.muted,
                            }}
                          >
                            {getRoleDescription(
                              u.role,
                              u.app_user_type
                            )}
                          </div>
                        </td>

                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              maxWidth: 210,
                            }}
                          >
                            {u.firms.length === 0 &&
                            !u.company ? (
                              <Badge tone="amber">
                                Firma atanmamış
                              </Badge>
                            ) : (
                              <>
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: BRAND.text,
                                    fontWeight: 700,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {companyLabel}
                                </span>

                                {extraFirmCount > 0 ? (
                                  <Badge tone="gray">
                                    +{extraFirmCount}
                                  </Badge>
                                ) : null}
                              </>
                            )}
                          </div>
                        </td>

                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: 4,
                              flexWrap: "wrap",
                            }}
                          >
                            {web ? (
                              <Badge tone="blue">
                                🌐 Web
                              </Badge>
                            ) : null}

                            {app ? (
                              <Badge tone="purple">
                                ▣ App
                              </Badge>
                            ) : null}

                            {!web && !app ? (
                              <Badge tone="amber">
                                Erişim yok
                              </Badge>
                            ) : null}
                          </div>
                        </td>

                        <td>
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href =
                                "/admin/permissions";
                            }}
                            style={{
                              border: "none",
                              background: "transparent",
                              padding: 0,
                              color: BRAND.blue,
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            {u.permissions.length > 0
                              ? `${u.permissions.length} yetki`
                              : "Yetkileri yönet"}
                          </button>
                        </td>

                        <td>
                          {u.is_active ? (
                            <Badge tone="green">
                              ● Aktif
                            </Badge>
                          ) : (
                            <Badge tone="red">
                              ● Pasif
                            </Badge>
                          )}
                        </td>

                        <td>
                          <div
                            style={{
                              position: "relative",
                            }}
                            onClick={(e) =>
                              e.stopPropagation()
                            }
                          >
                            <button
                              type="button"
                              className="dsec-menu-button"
                              onClick={(e) => {
                                e.stopPropagation();

                                setOpenMenuId((prev) =>
                                  prev === u.id
                                    ? null
                                    : u.id
                                );
                              }}
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 9,
                                border: `1px solid ${BRAND.border}`,
                                background: "#fff",
                                cursor: "pointer",
                                color: "#475467",
                                fontSize: 18,
                                lineHeight: 1,
                              }}
                            >
                              ⋮
                            </button>

                            {openMenuId === u.id ? (
                              <div
                                style={{
                                  position: "absolute",
                                  zIndex: 100,
                                  right: 0,
                                  top: 38,
                                  width: 205,
                                  padding: 6,
                                  borderRadius: 12,
                                  background: "#fff",
                                  border: `1px solid ${BRAND.border}`,
                                  boxShadow:
                                    "0 12px 30px rgba(16,24,40,.14)",
                                }}
                              >
                                <button
                                  className="dsec-action-item"
                                  type="button"
                                  onClick={() =>
                                    openDetails(u)
                                  }
                                  style={menuItemStyle()}
                                >
                                  ◎ Kullanıcı detayları
                                </button>

                                <button
                                  className="dsec-action-item"
                                  type="button"
                                  onClick={() => openEdit(u)}
                                  style={menuItemStyle()}
                                >
                                  ✎ Kullanıcıyı düzenle
                                </button>

                                <button
                                  className="dsec-action-item"
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    window.location.href =
                                      "/admin/permissions";
                                  }}
                                  style={menuItemStyle()}
                                >
                                  ◈ Yetkileri yönet
                                </button>

                                {adminRole ===
                                "super_admin" ? (
                                  <button
                                    className="dsec-action-item"
                                    type="button"
                                    onClick={() =>
                                      openCompanies(u)
                                    }
                                    style={menuItemStyle()}
                                  >
                                    ◫ Firma erişimi
                                  </button>
                                ) : null}

                                <div
                                  style={{
                                    height: 1,
                                    background:
                                      BRAND.border,
                                    margin: "5px 4px",
                                  }}
                                />

                                <button
                                  className="dsec-action-item"
                                  type="button"
                                  onClick={() =>
                                    void deleteUser(
                                      u.id,
                                      u.full_name
                                    )
                                  }
                                  style={{
                                    ...menuItemStyle(),
                                    color: BRAND.red,
                                  }}
                                >
                                  ♢ Kullanıcıyı sil
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* CREATE / EDIT MODAL */}
        {(showCreateModal || showEditModal) && (
          <div
            style={overlayStyle()}
            onClick={() => {
              if (savingUser) return;

              setShowCreateModal(false);
              setShowEditModal(false);
              resetForm();
            }}
          >
            <div
              className="dsec-modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 720,
                maxHeight: "calc(100vh - 40px)",
                overflowY: "auto",
                background: "#fff",
                borderRadius: 18,
                boxShadow:
                  "0 24px 70px rgba(16,24,40,.22)",
                border: `1px solid ${BRAND.border}`,
              }}
            >
              <div
                style={{
                  padding: "18px 20px 14px",
                  borderBottom: `1px solid ${BRAND.border}`,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 19,
                      fontWeight: 900,
                      color: BRAND.text,
                    }}
                  >
                    {showCreateModal
                      ? "Yeni Sistem Kullanıcısı"
                      : "Kullanıcıyı Düzenle"}
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      color: BRAND.muted,
                      fontSize: 12,
                    }}
                  >
                    {showCreateModal
                      ? "Kullanıcı hesabını, rolünü ve erişim kapsamını tanımlayın."
                      : `${selectedUser?.full_name || ""} hesabının temel ayarlarını yönetin.`}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={savingUser}
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    border: `1px solid ${BRAND.border}`,
                    background: "#fff",
                    cursor: "pointer",
                    color: BRAND.muted,
                    fontSize: 18,
                  }}
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  padding: "0 20px",
                  borderBottom: `1px solid ${BRAND.border}`,
                }}
              >
                {[
                  ["general", "Genel Bilgiler"],
                  ["company", "Firma & Erişim"],
                  ["security", "Güvenlik"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className="dsec-tab-button"
                    onClick={() =>
                      setModalTab(key as ModalTab)
                    }
                    style={{
                      padding: "12px 13px",
                      border: "none",
                      borderBottom:
                        modalTab === key
                          ? `2px solid ${BRAND.red}`
                          : "2px solid transparent",
                      background: "transparent",
                      color:
                        modalTab === key
                          ? BRAND.red
                          : BRAND.muted,
                      fontSize: 12,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ padding: 20 }}>
                {modalTab === "general" ? (
                  <div
                    style={{
                      display: "grid",
                      gap: 15,
                    }}
                  >
                    <Field label="Ad Soyad">
                      <input
                        value={formFullName}
                        onChange={(e) =>
                          setFormFullName(
                            e.target.value
                          )
                        }
                        placeholder="Ad soyad"
                        style={inputStyle()}
                      />
                    </Field>

                    <Field label="E-posta Adresi">
                      <input
                        value={formEmail}
                        onChange={(e) =>
                          setFormEmail(e.target.value)
                        }
                        placeholder="ornek@firma.com"
                        type="email"
                        style={inputStyle()}
                      />
                    </Field>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 12,
                      }}
                    >
                      <Field label="Sistem Rolü">
                        <select
                          value={formRole}
                          disabled={
                            formAccessType ===
                            "app_only"
                          }
                          onChange={(e) =>
                            setFormRole(
                              e.target.value
                            )
                          }
                          style={{
                            ...inputStyle(),
                            opacity:
                              formAccessType ===
                              "app_only"
                                ? 0.55
                                : 1,
                          }}
                        >
                          <option value="operator">
                            Operatör
                          </option>
                          <option value="company_admin">
                            Firma Yöneticisi
                          </option>
                          <option value="super_admin">
                            Süper Admin
                          </option>
                          <option value="training_user">
                            Eğitim Kullanıcısı
                          </option>
                          <option value="demo_user">
                            Demo Kullanıcı
                          </option>
                        </select>
                      </Field>

                      <Field label="Hesap Durumu">
                        <button
                          type="button"
                          onClick={() =>
                            setFormIsActive(
                              (prev) => !prev
                            )
                          }
                          style={{
                            ...inputStyle(),
                            cursor: "pointer",
                            textAlign: "left",
                            background: formIsActive
                              ? BRAND.greenSoft
                              : BRAND.redSoft,
                            color: formIsActive
                              ? BRAND.green
                              : BRAND.red,
                            borderColor: formIsActive
                              ? "#abefc6"
                              : "#fecdca",
                            fontWeight: 800,
                          }}
                        >
                          {formIsActive
                            ? "● Aktif kullanıcı"
                            : "● Pasif kullanıcı"}
                        </button>
                      </Field>
                    </div>

                    {formRole === "demo_user" ? (
                      <div
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          background:
                            BRAND.amberSoft,
                          border:
                            "1px solid #fedf89",
                          color: BRAND.amber,
                          fontSize: 12,
                          lineHeight: 1.55,
                        }}
                      >
                        <strong>Demo Kullanıcı:</strong>{" "}
                        Yalnızca seçilen demo firma
                        kapsamındaki izinlerle
                        çalıştırılmalıdır.
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {modalTab === "company" ? (
                  <div
                    style={{
                      display: "grid",
                      gap: 16,
                    }}
                  >
                    <Field
                      label="Kullanıcı Erişim Tipi"
                      hint="Kullanıcının hangi D-SEC istemcilerine giriş yapabileceğini belirler."
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(3,1fr)",
                          gap: 8,
                        }}
                      >
                        {[
                          [
                            "web_only",
                            "🌐",
                            "Sadece Web",
                          ],
                          [
                            "app_only",
                            "▣",
                            "Sadece App",
                          ],
                          [
                            "web_app",
                            "◆",
                            "Web + App",
                          ],
                        ].map(
                          ([value, icon, label]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setFormAccessType(
                                  value
                                )
                              }
                              style={{
                                minHeight: 76,
                                padding: 10,
                                borderRadius: 11,
                                border:
                                  formAccessType ===
                                  value
                                    ? `2px solid ${BRAND.red}`
                                    : `1px solid ${BRAND.border}`,
                                background:
                                  formAccessType ===
                                  value
                                    ? BRAND.redSoft
                                    : "#fff",
                                color:
                                  formAccessType ===
                                  value
                                    ? BRAND.red
                                    : BRAND.text,
                                cursor: "pointer",
                                fontWeight: 800,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 18,
                                  marginBottom: 5,
                                }}
                              >
                                {icon}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                }}
                              >
                                {label}
                              </div>
                            </button>
                          )
                        )}
                      </div>
                    </Field>

                    {(formAccessType === "app_only" ||
                      formAccessType === "web_app") && (
                      <Field label="App Kullanıcı Tipi">
                        <select
                          value={formAppUserType}
                          onChange={(e) =>
                            setFormAppUserType(
                              e.target.value
                            )
                          }
                          style={inputStyle()}
                        >
                          <option value="isg_uzmani">
                            İSG Uzmanı
                          </option>
                          <option value="hekim">
                            İşyeri Hekimi
                          </option>
                          <option value="dsp">
                            DSP
                          </option>
                          <option value="diger">
                            Diğer Kullanıcı
                          </option>
                        </select>
                      </Field>
                    )}

                    <Field
                      label="Ana Firma"
                      hint="Kullanıcının varsayılan firma bağlantısı."
                    >
                      <select
                        value={formCompanyId}
                        onChange={(e) =>
                          setFormCompanyId(
                            e.target.value
                          )
                        }
                        style={inputStyle()}
                      >
                        <option value="">
                          Firma atanmamış
                        </option>

                        {companies.map((c) => (
                          <option
                            key={c.id}
                            value={c.id}
                          >
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    {!showCreateModal &&
                    adminRole === "super_admin" ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedUser) return;

                          setShowEditModal(false);
                          setShowCompanyModal(true);
                        }}
                        style={{
                          ...buttonStyle(
                            "secondary"
                          ),
                          justifySelf: "start",
                        }}
                      >
                        Çoklu Firma Erişimini Yönet
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {modalTab === "security" ? (
                  <div
                    style={{
                      display: "grid",
                      gap: 16,
                    }}
                  >
                    <Field
                      label={
                        showCreateModal
                          ? "Başlangıç Şifresi"
                          : "Yeni Şifre"
                      }
                      hint={
                        showCreateModal
                          ? "Kullanıcının ilk girişte kullanacağı şifre."
                          : "Değiştirmek istemiyorsanız boş bırakın."
                      }
                    >
                      <input
                        value={formPassword}
                        onChange={(e) =>
                          setFormPassword(
                            e.target.value
                          )
                        }
                        type="password"
                        placeholder={
                          showCreateModal
                            ? "Şifre girin"
                            : "Değişiklik yok"
                        }
                        style={inputStyle()}
                      />
                    </Field>

                    {!showCreateModal ? (
                      <div
                        style={{
                          padding: 13,
                          borderRadius: 11,
                          background: BRAND.soft,
                          border: `1px solid ${BRAND.border}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 900,
                            color: BRAND.text,
                          }}
                        >
                          Yetki Yönetimi
                        </div>

                        <p
                          style={{
                            margin: "5px 0 10px",
                            fontSize: 11,
                            lineHeight: 1.55,
                            color: BRAND.muted,
                          }}
                        >
                          Modül ve işlem bazlı
                          yetkilendirmeler ayrı Yetki
                          Yönetimi V3 ekranından
                          yönetilir.
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            window.location.href =
                              "/admin/permissions";
                          }}
                          style={buttonStyle("dark")}
                        >
                          Yetki Yönetimi V3'ü Aç
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div
                style={{
                  padding: "14px 20px",
                  borderTop: `1px solid ${BRAND.border}`,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  background: "#fcfcfd",
                  borderRadius: "0 0 18px 18px",
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
                  style={buttonStyle("secondary")}
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
                    ...buttonStyle("primary"),
                    opacity: savingUser ? 0.6 : 1,
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

        {/* COMPANY ACCESS MODAL */}
        {showCompanyModal && selectedUser ? (
          <div
            style={overlayStyle()}
            onClick={() => {
              if (savingCompany) return;
              setShowCompanyModal(false);
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 620,
                maxHeight: "calc(100vh - 40px)",
                overflowY: "auto",
                background: "#fff",
                borderRadius: 18,
                border: `1px solid ${BRAND.border}`,
                boxShadow:
                  "0 24px 70px rgba(16,24,40,.22)",
              }}
            >
              <div
                style={{
                  padding: 20,
                  borderBottom: `1px solid ${BRAND.border}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 19,
                        color: BRAND.text,
                      }}
                    >
                      Firma Erişim Yönetimi
                    </h3>

                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 12,
                        color: BRAND.muted,
                      }}
                    >
                      {selectedUser.full_name} •{" "}
                      {selectedUser.email}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowCompanyModal(false)
                    }
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      border: `1px solid ${BRAND.border}`,
                      background: "#fff",
                      cursor: "pointer",
                      fontSize: 18,
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div style={{ padding: 20 }}>
                <Field
                  label="Yeni Firma Erişimi"
                  hint="Kullanıcının erişebileceği ek firmayı seçin."
                >
                  <select
                    defaultValue=""
                    disabled={savingCompany}
                    onChange={async (e) => {
                      const companyId =
                        e.target.value;

                      if (!companyId) return;

                      await addCompany(
                        selectedUser.id,
                        companyId
                      );

                      e.currentTarget.value = "";
                    }}
                    style={inputStyle()}
                  >
                    <option value="">
                      + Firma erişimi ekle
                    </option>

                    {!selectedUser.firms.some(
                      (f) => f.firm_id === "ALL"
                    ) ? (
                      <option value="ALL">
                        🌍 Tüm Firmalar (Global)
                      </option>
                    ) : null}

                    {companies
                      .filter(
                        (c) =>
                          !selectedUser.firms.some(
                            (f) =>
                              f.firm_id === c.id
                          )
                      )
                      .map((c) => (
                        <option
                          key={c.id}
                          value={c.id}
                        >
                          {c.name}
                        </option>
                      ))}
                  </select>
                </Field>

                <div
                  style={{
                    marginTop: 20,
                    fontSize: 12,
                    fontWeight: 900,
                    color: BRAND.text,
                  }}
                >
                  Tanımlı Firma Erişimleri
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    marginTop: 9,
                  }}
                >
                  {selectedUser.firms.length === 0 ? (
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 11,
                        border: `1px dashed ${BRAND.border}`,
                        background: BRAND.soft,
                        color: BRAND.muted,
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      Bu kullanıcı için çoklu firma
                      erişimi tanımlanmamış.
                    </div>
                  ) : (
                    selectedUser.firms.map((f) => (
                      <div
                        key={f.firm_id}
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems: "center",
                          gap: 12,
                          padding: "11px 12px",
                          borderRadius: 11,
                          border: `1px solid ${BRAND.border}`,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 900,
                              color: BRAND.text,
                            }}
                          >
                            {f.firm_id === "ALL"
                              ? "🌍 Tüm Firmalar"
                              : f.firm_name}
                          </div>

                          <div
                            style={{
                              marginTop: 2,
                              fontSize: 10,
                              color: BRAND.muted,
                            }}
                          >
                            {f.is_primary
                              ? "Ana firma"
                              : "Ek firma erişimi"}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={savingCompany}
                          onClick={() =>
                            void removeCompany(
                              selectedUser.id,
                              f.firm_id
                            )
                          }
                          style={buttonStyle("danger")}
                        >
                          Kaldır
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* DETAIL DRAWER */}
        {showDetailDrawer && selectedUser ? (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              background: "rgba(16,24,40,.32)",
            }}
            onClick={() =>
              setShowDetailDrawer(false)
            }
          >
            <aside
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                width: "min(440px, 94vw)",
                background: "#fff",
                boxShadow:
                  "-15px 0 50px rgba(16,24,40,.15)",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  padding: 20,
                  borderBottom: `1px solid ${BRAND.border}`,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      display: "grid",
                      placeItems: "center",
                      background:
                        "linear-gradient(135deg,#65151d,#b42318)",
                      color: "#fff",
                      fontWeight: 900,
                    }}
                  >
                    {initials(
                      selectedUser.full_name
                    )}
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 900,
                        color: BRAND.text,
                      }}
                    >
                      {selectedUser.full_name}
                    </div>

                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 11,
                        color: BRAND.muted,
                      }}
                    >
                      {selectedUser.email}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowDetailDrawer(false)
                  }
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    border: `1px solid ${BRAND.border}`,
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 18,
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ padding: 20 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginBottom: 18,
                  }}
                >
                  {selectedUser.is_active ? (
                    <Badge tone="green">
                      ● Aktif
                    </Badge>
                  ) : (
                    <Badge tone="red">
                      ● Pasif
                    </Badge>
                  )}

                  {isWebUser(selectedUser) ? (
                    <Badge tone="blue">
                      🌐 Web
                    </Badge>
                  ) : null}

                  {isAppUser(selectedUser) ? (
                    <Badge tone="purple">
                      ▣ App
                    </Badge>
                  ) : null}
                </div>

                <DetailSection title="Hesap Bilgileri">
                  <DetailRow
                    label="Sistem Rolü"
                    value={getRoleLabel(
                      selectedUser.role
                    )}
                  />

                  <DetailRow
                    label="App Kullanıcı Tipi"
                    value={
                      getAppUserTypeLabel(
                        selectedUser.app_user_type
                      ) || "-"
                    }
                  />

                  <DetailRow
                    label="Kayıt Tarihi"
                    value={formatDate(
                      selectedUser.created_at
                    )}
                  />
                </DetailSection>

                <DetailSection title="Firma Erişimi">
                  {selectedUser.firms.length === 0 ? (
                    <div
                      style={{
                        color: BRAND.muted,
                        fontSize: 12,
                      }}
                    >
                      {selectedUser.company ||
                        "Firma atanmamış"}
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      {selectedUser.firms.map((f) => (
                        <Badge
                          key={f.firm_id}
                          tone="gray"
                        >
                          {f.firm_id === "ALL"
                            ? "🌍 Tüm Firmalar"
                            : f.firm_name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </DetailSection>

                <DetailSection title="Yetki Özeti">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    <MiniStat
                      value={
                        selectedUser.permission_modules
                          .length
                      }
                      label="Modül"
                    />

                    <MiniStat
                      value={
                        selectedUser.permissions.length
                      }
                      label="Yetki"
                    />
                  </div>

                  {selectedUser.permission_modules
                    .length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        gap: 5,
                        flexWrap: "wrap",
                        marginTop: 10,
                      }}
                    >
                      {selectedUser.permission_modules
                        .slice(0, 12)
                        .map((module) => (
                          <Badge
                            key={module}
                            tone="gray"
                          >
                            {module}
                          </Badge>
                        ))}
                    </div>
                  ) : null}
                </DetailSection>

                <div
                  style={{
                    display: "grid",
                    gap: 8,
                    marginTop: 22,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailDrawer(false);
                      openEdit(selectedUser);
                    }}
                    style={buttonStyle("secondary")}
                  >
                    Kullanıcıyı Düzenle
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href =
                        "/admin/permissions";
                    }}
                    style={buttonStyle("dark")}
                  >
                    Yetkileri Yönet
                  </button>

                  {adminRole === "super_admin" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowDetailDrawer(false);
                        openCompanies(selectedUser);
                      }}
                      style={buttonStyle("secondary")}
                    >
                      Firma Erişimini Yönet
                    </button>
                  ) : null}
                </div>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function menuItemStyle(): React.CSSProperties {
  return {
    display: "block",
    width: "100%",
    padding: "9px 10px",
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "#344054",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
  };
}

function overlayStyle(): React.CSSProperties {
  return {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    background: "rgba(16,24,40,.42)",
    backdropFilter: "blur(2px)",
  };
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          color: BRAND.text,
          marginBottom: hint ? 3 : 7,
        }}
      >
        {label}
      </div>

      {hint ? (
        <div
          style={{
            marginBottom: 7,
            color: BRAND.muted,
            fontSize: 10,
            lineHeight: 1.45,
          }}
        >
          {hint}
        </div>
      ) : null}

      {children}
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        padding: "15px 0",
        borderBottom: `1px solid ${BRAND.border}`,
      }}
    >
      <div
        style={{
          marginBottom: 10,
          fontSize: 11,
          fontWeight: 900,
          color: BRAND.muted,
          textTransform: "uppercase",
          letterSpacing: ".05em",
        }}
      >
        {title}
      </div>

      {children}
    </section>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 15,
        padding: "5px 0",
        fontSize: 12,
      }}
    >
      <span style={{ color: BRAND.muted }}>{label}</span>

      <strong
        style={{
          color: BRAND.text,
          textAlign: "right",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function MiniStat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 11,
        background: BRAND.soft,
        border: `1px solid ${BRAND.border}`,
      }}
    >
      <div
        style={{
          fontSize: 20,
          fontWeight: 900,
          color: BRAND.text,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 2,
          fontSize: 10,
          color: BRAND.muted,
        }}
      >
        {label}
      </div>
    </div>
  );
}