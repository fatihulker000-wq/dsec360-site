"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menu = [
    { name: "Dashboard", href: "/admin/dashboard" },
    { name: "Eğitimler", href: "/admin/trainings" },
    { name: "Eğitim Katılımcıları", href: "/admin/participants" },
    { name: "Sistem Kullanıcıları", href: "/admin/users" },
    { name: "Firmalar", href: "/admin/companies" },
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
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 20 }}>D-SEC Admin</div>

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