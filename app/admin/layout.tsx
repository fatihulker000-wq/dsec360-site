"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ShieldCheck,
  Building2,
  ClipboardCheck,
  FileBarChart,
  MessageSquareText,
  AlertTriangle,
  Settings2,
  Search,
  Bell,
  Sparkles,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type MeResponse = {
  success?: boolean;
  user?: {
    role?: string;
  };
  error?: string;
};

type MenuItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const ACTIVE_LABELS: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/trainings": "Eğitimler",
  "/admin/participants": "Eğitim Katılımcıları",
  "/admin/users": "Sistem Kullanıcıları",
  "/admin/reports": "Raporlar",
  "/admin/cbs": "ÇBS Yönetimi",
  "/admin/companies": "Firmalar",
  "/admin/accidents": "Kaza ve Olay Yönetimi",
  "/admin/permissions": "Modül ve Yetki Yönetimi V3",
  "/admin/denetimler": "Denetimler",
  "/admin/employees": "Çalışanlar",
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
  const [isLoggingOutFlow, setIsLoggingOutFlow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(max-width: 900px)");

    const applyMobileState = (matches: boolean) => {
      setIsMobile(matches);
      if (!matches) setMobileMenuOpen(false);
    };

    applyMobileState(media.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      applyMobileState(event.matches);
    };

    media.addEventListener?.("change", handleChange);
    return () => media.removeEventListener?.("change", handleChange);
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
      setRoleLoaded(true);
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
          sessionStorage.removeItem("dsec_admin_role_cached");
          setRoleLoaded(true);
          return;
        }

        const json: MeResponse = await res.json().catch(() => ({}));
        const nextRole = String(json?.user?.role || "").trim();

        setRole(nextRole);

        if (nextRole) {
          sessionStorage.setItem("dsec_admin_role_cached", nextRole);
        } else {
          sessionStorage.removeItem("dsec_admin_role_cached");
        }
      } catch (error) {
        console.error("admin role load error:", error);
        setRole("");
        sessionStorage.removeItem("dsec_admin_role_cached");
      } finally {
        setRoleLoaded(true);
      }
    };

    void loadRole();
  }, [pathname]);

  useEffect(() => {
    if (!roleLoaded) return;
    if (pathname === "/admin/login") return;
    if (isLoggingOutFlow) return;

    if (role === "training_user") {
      window.location.href = "/portal/training";
    }
  }, [roleLoaded, role, pathname, isLoggingOutFlow]);

  const menu = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [
      { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { name: "Eğitimler", href: "/admin/trainings", icon: GraduationCap },
      { name: "Sistem Kullanıcıları", href: "/admin/users", icon: Users },
      {
        name: "Modül ve Yetki Yönetimi V3",
        href: "/admin/permissions",
        icon: Settings2,
      },
      { name: "Denetimler", href: "/admin/denetimler", icon: ClipboardCheck },
      { name: "Çalışanlar", href: "/admin/employees", icon: ShieldCheck },
      { name: "Raporlar", href: "/admin/reports", icon: FileBarChart },
      { name: "ÇBS Yönetimi", href: "/admin/cbs", icon: MessageSquareText },
      {
        name: "Kaza ve Olay Yönetimi",
        href: "/admin/accidents",
        icon: AlertTriangle,
      },
    ];

    if (role === "super_admin") {
      items.splice(4, 0, {
        name: "Firmalar",
        href: "/admin/companies",
        icon: Building2,
      });
    }

    return items;
  }, [role]);

  const activeLabel = ACTIVE_LABELS[pathname] || "Yönetim";

  const handleLogout = async () => {
    if (loggingOut || isLoggingOutFlow) return;

    setLoggingOut(true);
    setIsLoggingOutFlow(true);

    try {
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
    } catch (error) {
      console.error("admin logout error:", error);
    } finally {
      sessionStorage.removeItem("dsec_admin_role_cached");
      localStorage.removeItem("dsec_admin_role_cached");

      setMobileMenuOpen(false);
      setRole("");
      setRoleLoaded(true);

      window.location.href = "/admin/login";
    }
  };

  if (pathname === "/admin/login") return <>{children}</>;

  if (roleLoaded && role === "training_user") return null;

  const renderMenuItems = () =>
    menu.map((item) => {
      const isActive = pathname === item.href;
      const Icon = item.icon;

      return (
        <Link
          key={item.href}
          href={item.href}
          prefetch={false}
          className={`admin-menu-item ${isActive ? "active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            if (isMobile) setMobileMenuOpen(false);
            router.push(item.href);
          }}
        >
          <span className="admin-menu-icon">
            <Icon size={18} />
          </span>

          <span className="admin-menu-text">{item.name}</span>
        </Link>
      );
    });

  return (
    <div className="admin-layout">
      {isMobile && (
        <header className="admin-mobile-header">
          <div className="admin-mobile-title">
            <span>D-SEC360 Enterprise</span>
            <strong>{activeLabel}</strong>
          </div>

          <button
            type="button"
            className="admin-mobile-menu-button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            {mobileMenuOpen ? "Kapat" : "Menü"}
          </button>
        </header>
      )}

      {!isMobile && (
        <aside className="admin-sidebar-shell">
          <div className="admin-sidebar-brand premium">
            <div className="admin-logo-mark">D</div>

            <div>
              <span>D-SEC360 Enterprise</span>
              <strong>Yönetim Merkezi</strong>
            </div>
          </div>

          <div className="admin-active-box">
            <small>AKTİF BÖLÜM</small>
            <strong>{activeLabel}</strong>
            <span>{role === "super_admin" ? "Süper Admin" : "Firma Admin"}</span>
          </div>

          <nav className="admin-sidebar-nav">{renderMenuItems()}</nav>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="admin-logout-button"
          >
            <LogOut size={17} />
            {loggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
          </button>
        </aside>
      )}

      {isMobile && mobileMenuOpen && (
        <>
          <div
            className="admin-mobile-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />

          <aside className="admin-mobile-drawer">
            <div className="admin-mobile-drawer-head">
              <div>
                <span>D-SEC360 Enterprise</span>
                <strong>Yönetim Merkezi</strong>
              </div>

              <button type="button" onClick={() => setMobileMenuOpen(false)}>
                <X size={17} />
                Kapat
              </button>
            </div>

            <div className="admin-active-box mobile">
              <small>AKTİF BÖLÜM</small>
              <strong>{activeLabel}</strong>
              <span>
                {role === "super_admin" ? "Süper Admin" : "Firma Admin"}
              </span>
            </div>

            <nav className="admin-sidebar-nav mobile">{renderMenuItems()}</nav>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="admin-logout-button"
            >
              <LogOut size={17} />
              {loggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
            </button>
          </aside>
        </>
      )}

      <main className="admin-layout-main">
        <div className="admin-topbar-premium">
          <div className="admin-breadcrumb">
            <span>Panel</span>
            <strong>{activeLabel}</strong>
          </div>

          <div className="admin-topbar-search">
            <Search size={17} />
            <input placeholder="D-SEC içinde ara..." />
          </div>

          <div className="admin-topbar-actions">
            <button type="button" className="admin-icon-button">
              <Bell size={18} />
            </button>

            <button type="button" className="admin-ai-button">
              <Sparkles size={17} />
              DORA AI
            </button>
          </div>
        </div>

        {children}
      </main>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        html,
        body {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
          background: #fafafa;
        }

        .admin-layout {
          display: flex;
          min-height: 100vh;
          width: 100%;
          max-width: 100vw;
          background: #fafafa;
          overflow-x: hidden;
          position: relative;
        }

        .admin-layout-main {
          margin-left: 280px;
          width: calc(100% - 280px);
          max-width: calc(100% - 280px);
          min-height: 100vh;
          background: #fafafa;
          overflow-x: hidden;
        }

        .admin-sidebar-shell {
          width: 280px;
          min-width: 280px;
          position: fixed;
          inset: 0 auto 0 0;
          background: linear-gradient(180deg, #4a0d1a 0%, #5a0f1f 100%);
          color: #fff;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.16);
          z-index: 20;
        }

        .admin-sidebar-brand {
          margin-bottom: 22px;
        }

        .admin-sidebar-brand.premium {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-logo-mark {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          background: linear-gradient(135deg, #ffffff 0%, #ffe4e6 100%);
          color: #8f172c;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 950;
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.18);
          flex-shrink: 0;
        }

        .admin-sidebar-brand span {
          display: inline-flex;
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.14);
          font-size: 11px;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .admin-sidebar-brand strong {
          display: block;
          font-size: 21px;
          font-weight: 950;
          line-height: 1.1;
        }

        .admin-active-box {
          border-radius: 18px;
          padding: 15px;
          margin-bottom: 20px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .admin-active-box small {
          display: block;
          font-size: 11px;
          opacity: 0.8;
          margin-bottom: 6px;
          font-weight: 900;
          letter-spacing: 0.06em;
        }

        .admin-active-box strong {
          display: block;
          font-weight: 950;
          line-height: 1.25;
        }

        .admin-active-box span {
          display: block;
          margin-top: 8px;
          font-size: 12px;
          opacity: 0.82;
        }

        .admin-sidebar-nav {
          flex: 1;
        }

        .admin-menu-item {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: inherit;
          padding: 10px 12px;
          border-radius: 14px;
          margin-bottom: 8px;
          cursor: pointer;
          background: transparent;
          border: 1px solid transparent;
          font-weight: 800;
          transition: all 0.2s ease;
          line-height: 1.25;
        }

        .admin-menu-item:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(3px);
        }

        .admin-menu-item.active {
          background: linear-gradient(135deg, #ffffff 0%, #fff1f2 100%);
          color: #8f172c;
          border-color: rgba(255, 255, 255, 0.2);
          font-weight: 950;
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.14);
        }

        .admin-menu-icon {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.08);
          flex-shrink: 0;
        }

        .admin-menu-item.active .admin-menu-icon {
          background: rgba(143, 23, 44, 0.1);
        }

        .admin-menu-text {
          flex: 1;
          min-width: 0;
        }

        .admin-logout-button {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: #111827;
          color: #fff;
          border-radius: 14px;
          padding: 12px 14px;
          font-weight: 950;
          cursor: pointer;
          margin-top: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .admin-logout-button:disabled {
          background: #7f1d1d;
          cursor: not-allowed;
        }

        .admin-topbar-premium {
          position: sticky;
          top: 0;
          z-index: 15;
          height: 72px;
          padding: 0 22px;
          background: rgba(255, 255, 255, 0.86);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid #ead7db;
          display: grid;
          grid-template-columns: minmax(180px, auto) minmax(260px, 520px) auto;
          gap: 18px;
          align-items: center;
        }

        .admin-breadcrumb span {
          display: block;
          font-size: 12px;
          color: #8b6770;
          font-weight: 800;
        }

        .admin-breadcrumb strong {
          display: block;
          color: #22070d;
          font-size: 18px;
          font-weight: 950;
          line-height: 1.15;
        }

        .admin-topbar-search {
          height: 44px;
          border: 1px solid #ead7db;
          border-radius: 16px;
          background: #ffffff;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          color: #8f172c;
        }

        .admin-topbar-search input {
          border: none;
          outline: none;
          width: 100%;
          color: #111827;
          font-weight: 700;
          background: transparent;
        }

        .admin-topbar-search input::placeholder {
          color: #9ca3af;
        }

        .admin-topbar-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;
        }

        .admin-icon-button,
        .admin-ai-button {
          height: 44px;
          border: 1px solid #ead7db;
          background: #ffffff;
          color: #5a0f1f;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-weight: 950;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .admin-icon-button {
          width: 44px;
        }

        .admin-ai-button {
          padding: 0 14px;
          background: linear-gradient(135deg, #fff 0%, #fff1f2 100%);
        }

        .admin-ai-button:hover,
        .admin-icon-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(90, 15, 31, 0.08);
        }

        .admin-mobile-header {
          position: sticky;
          top: 0;
          z-index: 80;
          width: 100%;
          background: #ffffff;
          border-bottom: 1px solid #ead7db;
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .admin-mobile-title {
          min-width: 0;
        }

        .admin-mobile-title span {
          display: block;
          font-size: 12px;
          font-weight: 800;
          color: #7a5962;
          line-height: 1.2;
        }

        .admin-mobile-title strong {
          display: block;
          font-size: 17px;
          font-weight: 950;
          color: #22070d;
          line-height: 1.2;
          margin-top: 2px;
          max-width: 68vw;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-mobile-menu-button {
          border: 1px solid #dec7cc;
          background: #fff;
          color: #2b0f16;
          border-radius: 14px;
          padding: 10px 14px;
          font-weight: 950;
          font-size: 14px;
          cursor: pointer;
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .admin-mobile-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.34);
          z-index: 89;
        }

        .admin-mobile-drawer {
          position: fixed;
          top: 0;
          right: 0;
          width: min(88vw, 360px);
          max-width: 88vw;
          height: 100dvh;
          background: linear-gradient(180deg, #4a0d1a 0%, #5a0f1f 100%);
          color: #fff;
          padding: 16px 14px 18px;
          display: flex;
          flex-direction: column;
          box-shadow: -14px 0 40px rgba(0, 0, 0, 0.28);
          z-index: 90;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .admin-mobile-drawer-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .admin-mobile-drawer-head span {
          display: block;
          font-size: 12px;
          font-weight: 800;
          opacity: 0.82;
        }

        .admin-mobile-drawer-head strong {
          display: block;
          font-size: 22px;
          font-weight: 950;
          line-height: 1.1;
          margin-top: 4px;
        }

        .admin-mobile-drawer-head button {
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          border-radius: 14px;
          padding: 10px 14px;
          font-weight: 950;
          font-size: 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .admin-active-box.mobile {
          margin-bottom: 16px;
        }

        .admin-sidebar-nav.mobile {
          flex: 1;
        }

        @media (max-width: 900px) {
          .admin-layout {
            display: block;
            min-height: 100dvh;
          }

          .admin-layout-main {
            margin-left: 0;
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
          }

          .admin-topbar-premium {
            display: none;
          }

          .admin-layout-main > * {
            max-width: 100%;
            overflow-x: hidden;
          }

          table {
            max-width: 100%;
          }

          button,
          a {
            -webkit-tap-highlight-color: transparent;
          }
        }
      `}</style>
    </div>
  );
}