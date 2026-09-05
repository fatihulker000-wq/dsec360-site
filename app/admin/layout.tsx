"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ShieldCheck,
  HeartPulse,
  Building2,
  ClipboardCheck,
  FileBarChart,
  MessageSquareText,
  FolderArchive,
  AlertTriangle,
  Settings2,
  HardHat,
  Search,
  Bell,
  Sparkles,
  UserRound,
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
  "/admin/agenda": "Ajanda Yönetimi",
  "/admin/risk": "Risk Yönetimi",
  "/admin/trainings": "Eğitimler",
  "/admin/health": "Sağlık Yönetimi",
  "/admin/health/employees": "Çalışan Sağlık Kartları",
  "/admin/participants": "Eğitim Katılımcıları",
  "/admin/users": "Sistem Kullanıcıları",
  "/admin/reports": "Raporlar",
  "/admin/cbs": "ÇBS Yönetimi",
  "/admin/companies": "Firmalar",
  "/admin/accidents": "Kaza ve Olay Yönetimi",
  "/admin/permissions": "Modül ve Yetki Yönetimi V3",
  "/admin/ibys": "İBYS Entegrasyon Merkezi",
  "/admin/denetimler": "Denetimler",
  "/admin/employees": "Çalışanlar",
  "/admin/documentation": "Dokümantasyon Merkezi",
  "/admin/subcontractors": "Taşeron Yönetimi",
  "/admin/dora": "DORA AI İSG Asistanı",
  "/admin/profile": "Profil",
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

      if (!matches) {
        setMobileMenuOpen(false);
      }
    };

    applyMobileState(media.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      applyMobileState(event.matches);
    };

    media.addEventListener?.("change", handleChange);

    return () => {
      media.removeEventListener?.("change", handleChange);
    };
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
          sessionStorage.setItem(
            "dsec_admin_role_cached",
            nextRole
          );
        } else {
          sessionStorage.removeItem(
            "dsec_admin_role_cached"
          );
        }
      } catch (error) {
        console.error("admin role load error:", error);

        setRole("");

        sessionStorage.removeItem(
          "dsec_admin_role_cached"
        );
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
  }, [
    roleLoaded,
    role,
    pathname,
    isLoggingOutFlow,
  ]);

  /*
   * ============================================================
   * D-SEC SOL MENÜ
   * ============================================================
   *
   * Dashboard her zaman en üstte kalır.
   *
   * Dashboard dışındaki modüller Türkçe alfabetik
   * olarak otomatik sıralanır.
   *
   * Böylece ileride yeni bir modül eklendiğinde
   * menü sırasını elle değiştirmek gerekmez.
   *
   * Route, ikon ve rol/yetki yapısına dokunulmamıştır.
   * ============================================================
   */
  const menu = useMemo<MenuItem[]>(() => {
    const items: MenuItem[] = [
      {
        name: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },

      {
        name: "Eğitimler",
        href: "/admin/trainings",
        icon: GraduationCap,
      },

      {
        name: "Sağlık",
        href: "/admin/health",
        icon: HeartPulse,
      },

      {
        name: "Ajanda",
        href: "/admin/agenda",
        icon: ClipboardCheck,
      },

      {
        name: "Risk Yönetimi",
        href: "/admin/risk",
        icon: AlertTriangle,
      },

      {
        name: "Dokümantasyon",
        href: "/admin/documentation",
        icon: FolderArchive,
      },

      {
        name: "Taşeron Yönetimi",
        href: "/admin/subcontractors",
        icon: HardHat,
      },

      {
        name: "DORA AI İSG Asistanı",
        href: "/admin/dora",
        icon: Sparkles,
      },

      {
        name: "Profil",
        href: "/admin/profile",
        icon: UserRound,
      },

      {
        name: "Sistem Kullanıcıları",
        href: "/admin/users",
        icon: Users,
      },

      {
        name: "Modül ve Yetki Yönetimi V3",
        href: "/admin/permissions",
        icon: Settings2,
      },

      {
        name: "İBYS Entegrasyon Merkezi",
        href: "/admin/ibys",
        icon: ShieldCheck,
      },

      {
        name: "Denetimler",
        href: "/admin/denetimler",
        icon: ClipboardCheck,
      },

      {
        name: "Çalışanlar",
        href: "/admin/employees",
        icon: ShieldCheck,
      },

      {
        name: "Raporlar",
        href: "/admin/reports",
        icon: FileBarChart,
      },

      {
        name: "ÇBS Yönetimi",
        href: "/admin/cbs",
        icon: MessageSquareText,
      },

      {
        name: "Kaza ve Olay Yönetimi",
        href: "/admin/accidents",
        icon: AlertTriangle,
      },
    ];

    /*
     * SUPER ADMIN
     *
     * Firma Yönetimi yalnızca super_admin
     * kullanıcısına eklenir.
     *
     * Eskiden splice ile belirli bir konuma
     * ekleniyordu. Artık alfabetik sıralama
     * yapılacağı için push yeterlidir.
     */
    if (role === "super_admin") {
      items.push({
        name: "Firmalar",
        href: "/admin/companies",
        icon: Building2,
      });
    }

    /*
     * DEMO USER
     *
     * Demo kullanıcının mevcut erişim
     * listesi aynen korunmuştur.
     */
    let visibleItems = items;

    if (role === "demo_user") {
      // Demo / Tanıtım: tüm ticari modüller görünür, yönetim alanları gizlidir.
      const demoVisibleRoutes = new Set([
        "/admin/dashboard",
        "/admin/agenda",
        "/admin/employees",
        "/admin/cbs",
        "/admin/dora",
        "/admin/denetimler",
        "/admin/documentation",
        "/admin/trainings",
        "/admin/accidents",
        "/admin/reports",
        "/admin/risk",
        "/admin/health",
        "/admin/subcontractors",
        "/admin/profile",
      ]);

      visibleItems = items.filter((item) => demoVisibleRoutes.has(item.href));
    }

    /*
     * DASHBOARD
     *
     * Dashboard alfabetik sıralamaya
     * dahil edilmez.
     */
    const dashboard = visibleItems.find(
      (item) => item.href === "/admin/dashboard"
    );

    /*
     * TÜRKÇE ALFABETİK SIRALAMA
     *
     * localeCompare + "tr" kullanıldığı için
     * Ç, Ğ, İ, Ö, Ş, Ü gibi Türkçe
     * karakterler doğru sırada değerlendirilir.
     */
    const alphabeticalItems = visibleItems
      .filter(
        (item) =>
          item.href !== "/admin/dashboard"
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, "tr", {
          sensitivity: "base",
        })
      );

    /*
     * Dashboard en başa alınır,
     * alfabetik modüller arkasına eklenir.
     */
    return dashboard
      ? [dashboard, ...alphabeticalItems]
      : alphabeticalItems;
  }, [role]);

  const activeLabel =
    ACTIVE_LABELS[pathname] || "Yönetim";

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
      console.error(
        "admin logout error:",
        error
      );
    } finally {
      sessionStorage.removeItem(
        "dsec_admin_role_cached"
      );

      localStorage.removeItem(
        "dsec_admin_role_cached"
      );

      setMobileMenuOpen(false);
      setRole("");
      setRoleLoaded(true);

      window.location.href = "/admin/login";
    }
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (
    roleLoaded &&
    role === "training_user"
  ) {
    return null;
  }

  const renderMenuItems = () =>
    menu.map((item) => {
      const isActive =
        pathname === item.href;

      const Icon = item.icon;

      return (
        <Link
          key={item.href}
          href={item.href}
          prefetch={false}
          className={`admin-menu-item ${
            isActive ? "active" : ""
          }`}
          onClick={(e) => {
            e.preventDefault();

            if (isMobile) {
              setMobileMenuOpen(false);
            }

            router.push(item.href);
          }}
        >
          <span className="admin-menu-icon">
            <Icon size={18} />
          </span>

          <span className="admin-menu-text">
            {item.name}
          </span>
        </Link>
      );
    });

  return (
    <div className="admin-layout">
      {/* =========================
          MOBİL ÜST BAR
         ========================= */}
      {isMobile && (
        <header className="admin-mobile-header">
          <div className="admin-mobile-title">
            <span>
              D-SEC360 Enterprise
            </span>

            <strong>
              {activeLabel}
            </strong>
          </div>

          <button
            type="button"
            className="admin-mobile-menu-button"
            onClick={() =>
              setMobileMenuOpen(
                (prev) => !prev
              )
            }
          >
            {mobileMenuOpen ? (
              <X size={18} />
            ) : (
              <Menu size={18} />
            )}

            {mobileMenuOpen
              ? "Kapat"
              : "Menü"}
          </button>
        </header>
      )}

      {/* =========================
          DESKTOP SOL MENÜ
         ========================= */}
      {!isMobile && (
        <aside className="admin-sidebar-shell">
          <div className="admin-sidebar-brand premium">
            <div className="admin-logo-mark">
              D
            </div>

            <div>
              <span>
                D-SEC360 Enterprise
              </span>

              <strong>
                Yönetim Merkezi
              </strong>
            </div>
          </div>

          <div className="admin-active-box">
            <small>
              AKTİF BÖLÜM
            </small>

            <strong>
              {activeLabel}
            </strong>

            <span>
              {role === "super_admin"
                ? "Süper Admin"
                : role === "demo_user"
                ? "Demo • Salt Okunur"
                : "Firma Admin"}
            </span>
          </div>

          <nav className="admin-sidebar-nav">
            {renderMenuItems()}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="admin-logout-button"
          >
            <LogOut size={17} />

            {loggingOut
              ? "Çıkış yapılıyor..."
              : "Çıkış Yap"}
          </button>
        </aside>
      )}

      {/* =========================
          MOBİL DRAWER
         ========================= */}
      {isMobile && mobileMenuOpen && (
        <>
          <div
            className="admin-mobile-overlay"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          />

          <aside className="admin-mobile-drawer">
            <div className="admin-mobile-drawer-head">
              <div>
                <span>
                  D-SEC360 Enterprise
                </span>

                <strong>
                  Yönetim Merkezi
                </strong>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
              >
                <X size={17} />
                Kapat
              </button>
            </div>

            <div className="admin-active-box mobile">
              <small>
                AKTİF BÖLÜM
              </small>

              <strong>
                {activeLabel}
              </strong>

              <span>
                {role === "super_admin"
                  ? "Süper Admin"
                  : role === "demo_user"
                  ? "Demo • Salt Okunur"
                  : "Firma Admin"}
              </span>
            </div>

            <nav className="admin-sidebar-nav mobile">
              {renderMenuItems()}
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="admin-logout-button"
            >
              <LogOut size={17} />

              {loggingOut
                ? "Çıkış yapılıyor..."
                : "Çıkış Yap"}
            </button>
          </aside>
        </>
      )}

      {/* =========================
          ANA İÇERİK
         ========================= */}
      <main className="admin-layout-main">
        <div className="admin-topbar-premium">
          <div className="admin-breadcrumb">
            <span>Panel</span>
            <strong>{activeLabel}</strong>
          </div>

          <div className="admin-topbar-search">
            <Search size={17} />

            <input
              placeholder="D-SEC içinde ara..."
            />
          </div>

          <div className="admin-topbar-actions">
            <button
              type="button"
              className="admin-icon-button"
            >
              <Bell size={18} />
            </button>

            <button
              type="button"
              className="admin-ai-button"
            >
              <Sparkles size={17} />
              DORA AI
            </button>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}