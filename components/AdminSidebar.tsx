"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type SidebarItem = {
  href: string;
  label: string;
  icon: string;
  badge?: string;
};

const mainItems: SidebarItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: "⌘",
  },
  {
    href: "/training",
    label: "Eğitimler",
    icon: "🎓",
  },
  {
    href: "/training/async",
    label: "Asenkron",
    icon: "▶️",
  },
  {
    href: "/training/sync",
    label: "Senkron",
    icon: "◉",
  },
];

const secondaryItems: SidebarItem[] = [
  {
    href: "/services",
    label: "Hizmetler",
    icon: "▣",
  },
  {
    href: "/cbs",
    label: "ÇBS",
    icon: "✦",
  },
  {
    href: "/contact",
    label: "İletişim",
    icon: "✉",
  },
];

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

export default function AdminSidebar() {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
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
        }
      } catch {
        if (!cancelled) {
          setUserRole("");
        }
      } finally {
        if (!cancelled) {
          setLoadingRole(false);
        }
      }
    }

    void loadMe();

    return () => {
      cancelled = true;
    };
  }, []);

  const pageTitle = useMemo(() => {
    if (pathname.startsWith("/admin/dashboard")) return "Admin Dashboard";
    if (pathname.startsWith("/training/async")) return "Asenkron Eğitim";
    if (pathname.startsWith("/training/sync")) return "Senkron Eğitim";
    if (pathname.startsWith("/training")) return "Eğitim Yönetimi";
    return "Admin Panel";
  }, [pathname]);

  const filteredMainItems = useMemo(() => {
    if (userRole === "training_user") return [];
    return mainItems;
  }, [userRole]);

  const filteredSecondaryItems = useMemo(() => {
    if (userRole === "training_user") return [];
    return secondaryItems;
  }, [userRole]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      }).catch(() => null);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      }).catch(() => null);
    } finally {
      window.location.href = "/admin/login";
    }
  };

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  if (!loadingRole && userRole === "training_user") {
    return null;
  }

  return (
    <aside className="admin-sidebar-shell">
      <div className="admin-sidebar">
        <div className="admin-sidebar-top">
          <div className="admin-sidebar-brand">
            <div className="admin-sidebar-logo">D</div>

            <div className="admin-sidebar-brand-text">
              <div className="admin-sidebar-title">D-SEC Admin</div>
              <div className="admin-sidebar-subtitle">
                Eğitim Yönetim Merkezi
              </div>
            </div>
          </div>

          <div className="admin-sidebar-hero-card">
            <div className="admin-sidebar-hero-badge">AKTİF PANEL</div>
            <div className="admin-sidebar-hero-title">{pageTitle}</div>
            <div className="admin-sidebar-hero-text">
              Kurumsal yönetim, eğitim takibi ve risk görünümü tek panelde.
            </div>
          </div>
        </div>

        <div className="admin-sidebar-section">
          <div className="admin-sidebar-section-title">Yönetim</div>

          <nav className="admin-sidebar-nav">
            {filteredMainItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-sidebar-link ${
                  isActive(item.href) ? "active" : ""
                }`}
              >
                <span className="admin-sidebar-link-icon">{item.icon}</span>
                <span className="admin-sidebar-link-label">{item.label}</span>
                {item.badge ? (
                  <span className="admin-sidebar-link-badge">{item.badge}</span>
                ) : null}
              </Link>
            ))}
          </nav>
        </div>

        <div className="admin-sidebar-section">
          <div className="admin-sidebar-section-title">Kısayollar</div>

          <nav className="admin-sidebar-nav">
            {filteredSecondaryItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-sidebar-link admin-sidebar-link-soft ${
                  isActive(item.href) ? "active" : ""
                }`}
              >
                <span className="admin-sidebar-link-icon">{item.icon}</span>
                <span className="admin-sidebar-link-label">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="admin-sidebar-logout"
          >
            {loggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
          </button>
        </div>
      </div>
    </aside>
  );
}