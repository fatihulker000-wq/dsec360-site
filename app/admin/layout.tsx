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
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(max-width: 900px)");

    const applyMobileState = (matches: boolean) => {
      setIsMobile(matches);
      if (!matches) {
        setMobileMenuOpen(false);
      }
    };

    applyMobileState(media.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      applyMobileState(event.matches);
    };

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch (error) {
      console.error("admin logout error:", error);
    } finally {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("dsec_admin_role_cached");
      }

      setMobileMenuOpen(false);
      setRole("");

      window.location.replace("/admin/login");
    }
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!roleLoaded) {
    return null;
  }

  const renderMenuItems = () =>
    menu.map((item) => {
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
            if (isMobile) {
              setMobileMenuOpen(false);
            }
            router.push(item.href);
          }}
        >
          {item.name}
        </Link>
      );
    });

  return (
    <div
      className="admin-layout"
      style={{
        display: "flex",
        flexDirection: "row",
        minHeight: "100vh",
        background: "#fafafa",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {isMobile && (
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 80,
            background: "#ffffff",
            borderBottom: "1px solid #ead7db",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#7a5962",
                lineHeight: 1.2,
              }}
            >
              D-SEC Yönetim Merkezi
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 900,
                color: "#22070d",
                lineHeight: 1.2,
                marginTop: 2,
              }}
            >
              {activeLabel}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            style={{
              border: "1px solid #dec7cc",
              background: "#fff",
              color: "#2b0f16",
              borderRadius: 14,
              padding: "10px 14px",
              fontWeight: 800,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {mobileMenuOpen ? "Kapat" : "Menü"}
          </button>
        </div>
      )}

      {!isMobile && (
        <aside
          className="admin-sidebar-shell"
          style={{
            width: 260,
            minWidth: 260,
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

          <nav style={{ flex: 1 }}>{renderMenuItems()}</nav>

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
      )}

      {isMobile && mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              top: 57,
              background: "rgba(17, 24, 39, 0.28)",
              zIndex: 69,
            }}
          />

          <aside
            className="admin-sidebar-shell"
            style={{
              position: "fixed",
              top: 57,
              left: 0,
              right: 0,
              maxHeight: "calc(100vh - 57px)",
              overflowY: "auto",
              background: "linear-gradient(180deg, #4a0d1a 0%, #5a0f1f 100%)",
              color: "#fff",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
              zIndex: 70,
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 18,
            }}
          >
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  display: "inline-flex",
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                D-SEC Yönetim Merkezi
              </div>

              <div style={{ fontWeight: 900, fontSize: 22 }}>Admin Panel</div>
            </div>

            <div
              style={{
                borderRadius: 16,
                padding: 14,
                marginBottom: 16,
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

            <nav style={{ flex: 1 }}>{renderMenuItems()}</nav>

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
                marginTop: 12,
              }}
            >
              {loggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
            </button>
          </aside>
        </>
      )}

      <main
        className="admin-layout-main"
        style={{
          marginLeft: isMobile ? 0 : 260,
          width: isMobile ? "100%" : "calc(100% - 260px)",
          maxWidth: "100%",
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