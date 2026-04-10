"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  // 🔥 ROLE AL
  useEffect(() => {
    const r = document.cookie
      .split("; ")
      .find((row) => row.startsWith("dsec_admin_role="))
      ?.split("=")[1];

    setRole(r || null);
  }, []);

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

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // 🔥 ROLE BASE MENU
  const menu = [
    { name: "Dashboard", href: "/admin/dashboard" },
    { name: "Eğitimler", href: "/admin/trainings" },
    { name: "Eğitim Katılımcıları", href: "/admin/participants" },

    // ✅ HERKES GÖRÜR
    { name: "Sistem Kullanıcıları", href: "/admin/users" },

    // ❌ SADECE SUPER ADMIN GÖRÜR
    ...(role === "super_admin"
      ? [{ name: "Firmalar", href: "/admin/companies" }]
      : []),

    { name: "Raporlar", href: "/admin/reports" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fafafa" }}>
      <div
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

        <div style={{ flex: 1 }}>
          {menu.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    marginBottom: 8,
                    cursor: "pointer",
                    background: isActive ? "#c62828" : "transparent",
                    fontWeight: isActive ? 800 : 600,
                  }}
                >
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>

        <button onClick={handleLogout}>
          {loggingOut ? "Çıkış..." : "Çıkış Yap"}
        </button>
      </div>

      <div style={{ marginLeft: 260, width: "100%" }}>{children}</div>
    </div>
  );
}