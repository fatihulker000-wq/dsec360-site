"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

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

  // Admin login ekranında sidebar gösterme
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const menu = [
    { name: "Dashboard", href: "/admin/dashboard" },
    { name: "Eğitimler", href: "/admin/trainings" },
    { name: "Eğitim Katılımcıları", href: "/admin/participants" },
    { name: "Sistem Kullanıcıları", href: "/admin/users" },
    { name: "Firmalar", href: "/admin/companies" },
    { name: "Raporlar", href: "/admin/reports" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div
        style={{
          width: 240,
          background: "#5a0f1f",
          color: "#fff",
          padding: 20,
          overflowY: "auto",
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 20 }}>D-SEC Admin</div>

        <div style={{ flex: 1 }}>
          {menu.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
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

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            width: "100%",
            border: "1px solid rgba(255,255,255,0.18)",
            background: loggingOut ? "#7f1d1d" : "#111827",
            color: "#fff",
            borderRadius: 10,
            padding: "12px 14px",
            fontWeight: 800,
            cursor: loggingOut ? "not-allowed" : "pointer",
            marginTop: 16,
          }}
        >
          {loggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
        </button>
      </div>

      <div
        style={{
          marginLeft: 240,
          width: "100%",
          height: "100vh",
          overflowY: "auto",
          background: "#fafafa",
        }}
      >
        {children}
      </div>
    </div>
  );
}
