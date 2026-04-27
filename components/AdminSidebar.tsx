"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type SidebarItem = {
  href: string;
  label: string;
  icon: string;
  desc: string;
};

const mainItems: SidebarItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "⌘", desc: "Genel görünüm" },
  { href: "/training", label: "Eğitimler", icon: "🎓", desc: "Atama ve takip" },
  { href: "/training/async", label: "Asenkron", icon: "▶", desc: "Video eğitimler" },
  { href: "/training/sync", label: "Senkron", icon: "◉", desc: "Canlı eğitimler" },
];

const secondaryItems: SidebarItem[] = [
  { href: "/services", label: "Hizmetler", icon: "▣", desc: "Kurumsal hizmetler" },
  { href: "/cbs", label: "ÇBS", icon: "✦", desc: "Şikayet / öneri" },
  { href: "/contact", label: "İletişim", icon: "✉", desc: "Destek ve iletişim" },
];

type MeResponse = {
  success?: boolean;
  user?: {
    full_name?: string;
    email?: string;
    role?: string;
  };
};

export default function AdminSidebar() {
  const pathname = usePathname();

  const [loggingOut, setLoggingOut] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      try {
        const res = await fetch("/api/admin/me", {
          credentials: "include",
          cache: "no-store",
        });

        const json: MeResponse = await res.json().catch(() => ({}));

        if (!cancelled) {
          setUserRole(String(json?.user?.role || "").trim());
          setUserName(String(json?.user?.full_name || "").trim());
          setUserEmail(String(json?.user?.email || "").trim());
        }
      } catch {
        if (!cancelled) {
          setUserRole("");
          setUserName("");
          setUserEmail("");
        }
      } finally {
        if (!cancelled) setLoadingRole(false);
      }
    }

    void loadMe();

    return () => {
      cancelled = true;
    };
  }, []);

  const pageTitle = useMemo(() => {
    if (pathname.startsWith("/admin/dashboard")) return "Dashboard";
    if (pathname.startsWith("/training/async")) return "Asenkron Eğitim";
    if (pathname.startsWith("/training/sync")) return "Senkron Eğitim";
    if (pathname.startsWith("/training")) return "Eğitim Yönetimi";
    if (pathname.startsWith("/cbs")) return "ÇBS Yönetimi";
    return "Admin Panel";
  }, [pathname]);

  const roleLabel = useMemo(() => {
    if (userRole === "super_admin") return "Süper Admin";
    if (userRole === "company_admin") return "Firma Admin";
    if (userRole === "operator") return "Operatör";
    if (userRole === "training_user") return "Eğitim Kullanıcısı";
    return "Yönetici";
  }, [userRole]);

  const filteredMainItems = userRole === "training_user" ? [] : mainItems;
  const filteredSecondaryItems = userRole === "training_user" ? [] : secondaryItems;

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(href);
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);

      await Promise.allSettled([
        fetch("/api/admin/logout", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        }),
        fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        }),
      ]);
    } finally {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("dsec_admin_role_cached");
        localStorage.removeItem("dsec_admin_role_cached");
      }

      window.location.href = "/admin/login";
    }
  };

  if (!loadingRole && userRole === "training_user") {
    return null;
  }

  const renderItem = (item: SidebarItem) => {
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch={false}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          textDecoration: "none",
          color: active ? "#ffffff" : "rgba(255,255,255,0.82)",
          padding: "12px 12px",
          borderRadius: 16,
          marginBottom: 8,
          background: active
            ? "linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.10))"
            : "transparent",
          border: active
            ? "1px solid rgba(255,255,255,0.24)"
            : "1px solid transparent",
          boxShadow: active ? "0 14px 34px rgba(0,0,0,0.16)" : "none",
          transition: "all 0.2s ease",
        }}
      >
        <span
          style={{
            width: 34,
            height: 34,
            minWidth: 34,
            borderRadius: 12,
            display: "grid",
            placeItems: "center",
            background: active
              ? "rgba(255,255,255,0.20)"
              : "rgba(255,255,255,0.08)",
            fontWeight: 900,
          }}
        >
          {item.icon}
        </span>

        <span style={{ minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: 14,
              fontWeight: active ? 900 : 750,
              lineHeight: 1.2,
            }}
          >
            {item.label}
          </span>
          <span
            style={{
              display: "block",
              fontSize: 11,
              color: "rgba(255,255,255,0.58)",
              marginTop: 3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.desc}
          </span>
        </span>
      </Link>
    );
  };

  return (
    <aside
      style={{
        width: 280,
        minWidth: 280,
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 40,
        padding: 16,
        color: "#fff",
        background:
          "radial-gradient(circle at top left, rgba(255,110,90,0.32), transparent 34%), linear-gradient(180deg, #3b0712 0%, #5a0f1f 48%, #26040a 100%)",
        boxShadow: "18px 0 44px rgba(15,23,42,0.22)",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 18,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(135deg, #ffffff, #ffe2e2)",
                color: "#7a0017",
                fontWeight: 1000,
                fontSize: 24,
                boxShadow: "0 14px 30px rgba(0,0,0,0.20)",
              }}
            >
              D
            </div>

            <div>
              <div style={{ fontSize: 20, fontWeight: 1000, lineHeight: 1.1 }}>
                D-SEC Admin
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.66)",
                  marginTop: 4,
                }}
              >
                Dijital Sağlık • Emniyet • Çevre
              </div>
            </div>
          </div>

          <div
            style={{
              borderRadius: 22,
              padding: 16,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))",
              border: "1px solid rgba(255,255,255,0.16)",
              boxShadow: "0 18px 46px rgba(0,0,0,0.16)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                padding: "6px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.14)",
                fontSize: 11,
                fontWeight: 900,
                marginBottom: 10,
              }}
            >
              AKTİF PANEL
            </div>

            <div style={{ fontSize: 19, fontWeight: 1000 }}>{pageTitle}</div>

            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "rgba(255,255,255,0.70)",
                lineHeight: 1.55,
              }}
            >
              Kurumsal yönetim, eğitim takibi ve operasyon görünümü.
            </div>
          </div>
        </div>

        <div
          style={{
            borderRadius: 18,
            padding: 12,
            marginBottom: 16,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.62)" }}>
            OTURUM
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 14,
              fontWeight: 900,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {userName || roleLabel}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: "rgba(255,255,255,0.56)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {userEmail || roleLabel}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 1000,
              color: "rgba(255,255,255,0.52)",
              letterSpacing: 0.8,
              margin: "10px 8px",
            }}
          >
            YÖNETİM
          </div>

          <nav>{filteredMainItems.map(renderItem)}</nav>

          <div
            style={{
              fontSize: 11,
              fontWeight: 1000,
              color: "rgba(255,255,255,0.52)",
              letterSpacing: 0.8,
              margin: "22px 8px 10px",
            }}
          >
            KISAYOLLAR
          </div>

          <nav>{filteredSecondaryItems.map(renderItem)}</nav>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            width: "100%",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 16,
            padding: "13px 14px",
            background: loggingOut
              ? "rgba(127,29,29,0.86)"
              : "linear-gradient(135deg, #111827, #2b0f16)",
            color: "#fff",
            fontWeight: 900,
            cursor: loggingOut ? "not-allowed" : "pointer",
            marginTop: 18,
            boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
          }}
        >
          {loggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
        </button>
      </div>
    </aside>
  );
}