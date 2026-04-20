"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type MeResponse = {
  success?: boolean;
  user?: {
    role?: string;
  };
  error?: string;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [loggingOut, setLoggingOut] = useState(false);
  const [role, setRole] = useState<string>("");
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setRoleLoaded(true);
      return;
    }

    const cachedRole =
      typeof window !== "undefined"
        ? sessionStorage.getItem("dsec_admin_role_cached") || ""
        : "";

    if (cachedRole) {
      setRole(cachedRole);
    }

    const loadRole = async () => {
      try {
        const res = await fetch("/api/admin/me", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          setRole("");
          if (typeof window !== "undefined") {
            sessionStorage.removeItem("dsec_admin_role_cached");
          }
          setRoleLoaded(true);
          return;
        }

        const json: MeResponse = await res.json().catch(() => ({}));
        const nextRole = String(json?.user?.role || "").trim();

        setRole(nextRole);

        if (typeof window !== "undefined") {
          if (nextRole) {
            sessionStorage.setItem("dsec_admin_role_cached", nextRole);
          } else {
            sessionStorage.removeItem("dsec_admin_role_cached");
          }
        }
      } catch (error) {
        console.error("admin role load error:", error);
        setRole("");
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("dsec_admin_role_cached");
        }
      } finally {
        setRoleLoaded(true);
      }
    };

    void loadRole();
  }, [pathname]);

  useEffect(() => {
    if (!roleLoaded) return;
    if (pathname === "/admin/login") return;

    if (!role) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("dsec_admin_role_cached");
      }
      router.replace("/admin/login");
      router.refresh();
    }
  }, [roleLoaded, role, pathname, router]);

  const menu = useMemo(() => {
    const items = [
      { name: "Dashboard", href: "/admin/dashboard" },
      { name: "Eğitimler", href: "/admin/trainings" },
      { name: "Eğitim Katılımcıları", href: "/admin/participants" },
      { name: "Sistem Kullanıcıları", href: "/admin/users" },
      { name: "Raporlar", href: "/admin/reports" },
      { name: "ÇBS Yönetimi", href: "/admin/cbs" },
    ];

    if (role === "super_admin") {
      items.splice(4, 0, { name: "Firmalar", href: "/admin/companies" });
    }

    return items;
  }, [role]);

  const activeLabel = menu.find((x) => x.href === pathname)?.name || "Yönetim";

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      }).catch(() => null);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      }).catch(() => null);
    } finally {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("dsec_admin_role_cached");
      }
      router.replace("/admin/login");
      router.refresh();
    }
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!roleLoaded) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#fafafa",
        overflowX: "hidden",
      }}
    >
      <aside
        style={{
          width: 260,
          background: "linear-gradient(180deg, #4a0d1a 0%, #5a0f1f 100%)",
          color: "#fff",
          padding: 20,
          overflowY: "auto",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 16px 40px rgba(0,0,0,0.16)",
          zIndex: 20,
        }}
      >
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              display: "inline-flex",
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.14)",
              fontSize: 12,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            D-SEC Yönetim Merkezi
          </div>

          <div style={{ fontWeight: 900, fontSize: 24 }}>Admin Panel</div>
        </div>

        <div
          style={{
            borderRadius: 16,
            padding: 14,
            marginBottom: 20,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>
            AKTİF BÖLÜM
          </div>
          <div style={{ fontWeight: 800 }}>{activeLabel}</div>
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              opacity: 0.8,
            }}
          >
            {role === "super_admin" ? "Süper Admin" : "Firma Admin"}
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {menu.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                style={{
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                  padding: "12px 14px",
                  borderRadius: 12,
                  marginBottom: 8,
                  cursor: "pointer",
                  background: isActive ? "#c62828" : "transparent",
                  border: isActive
                    ? "1px solid rgba(255,255,255,0.16)"
                    : "1px solid transparent",
                  fontWeight: isActive ? 800 : 600,
                  transition: "all 0.2s ease",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  router.push(item.href);
                }}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            width: "100%",
            border: "1px solid rgba(255,255,255,0.18)",
            background: loggingOut ? "#7f1d1d" : "#111827",
            color: "#fff",
            borderRadius: 12,
            padding: "12px 14px",
            fontWeight: 800,
            cursor: loggingOut ? "not-allowed" : "pointer",
            marginTop: 16,
          }}
        >
          {loggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
        </button>
      </aside>

      <main
        style={{
          marginLeft: 260,
          width: "calc(100% - 260px)",
          minHeight: "100vh",
          overflowX: "hidden",
          background: "#fafafa",
        }}
      >
        {children}
      </main>
    </div>
  );
}