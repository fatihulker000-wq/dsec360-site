"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/services", label: "Hizmetler" },
  { href: "/cbs", label: "ÇBS" },
  { href: "/contact", label: "İletişim" },
];

const trainingItems = [
  { href: "/training", label: "Eğitim Modülü" },
  { href: "/training/async", label: "Asenkron Eğitim" },
  { href: "/training/sync", label: "Senkron Eğitim" },
];

export default function Navbar() {
  const pathname = usePathname();

  const [trainingOpen, setTrainingOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileTrainingOpen, setMobileTrainingOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const showLogoutButton =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/panel") ||
    pathname.startsWith("/portal/training");

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await fetch("/api/admin/logout", {
        method: "POST",
      }).catch(() => null);

      await fetch("/api/auth/logout", {
        method: "POST",
      }).catch(() => null);
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <header className="site-navbar">
      <div className="site-navbar-inner">
        <Link href="/" className="brand-wrap" onClick={() => setMobileOpen(false)}>
          <Image
            src="/logo.png"
            alt="D-SEC Logo"
            width={42}
            height={42}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              objectFit: "cover",
              flexShrink: 0,
              boxShadow: "0 10px 24px rgba(220, 38, 38, 0.18)",
            }}
            priority
          />

          <div>
            <h1 className="brand-title">D-SEC</h1>
            <p className="brand-subtitle">Dijital Sağlık • Emniyet • Çevre</p>
          </div>
        </Link>

        <nav
          className="nav-links"
          style={{
            position: "relative",
          }}
        >
          {navItems.slice(0, 2).map((item) => (
            <Link key={item.href} href={item.href} className="nav-link-item">
              {item.label}
            </Link>
          ))}

          <div
            style={{
              position: "relative",
              paddingBottom: trainingOpen ? "14px" : "0",
              marginBottom: trainingOpen ? "-14px" : "0",
            }}
            onMouseEnter={() => setTrainingOpen(true)}
            onMouseLeave={() => setTrainingOpen(false)}
          >
            <button
              type="button"
              className="nav-link-item"
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                font: "inherit",
              }}
              onClick={() => setTrainingOpen((prev) => !prev)}
            >
              Eğitim
            </button>

            {trainingOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  minWidth: "240px",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "18px",
                  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
                  padding: "10px",
                  display: "grid",
                  gap: "6px",
                  zIndex: 100,
                }}
              >
                {trainingItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="nav-link-item"
                    style={{
                      padding: "10px 12px",
                      borderRadius: "12px",
                      justifyContent: "flex-start",
                    }}
                    onClick={() => setTrainingOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {navItems.slice(2).map((item) => (
            <Link key={item.href} href={item.href} className="nav-link-item">
              {item.label}
            </Link>
          ))}
        </nav>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {showLogoutButton && (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                borderRadius: "14px",
                background: "#111827",
                color: "#ffffff",
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: 800,
                cursor: loggingOut ? "not-allowed" : "pointer",
                opacity: loggingOut ? 0.7 : 1,
              }}
            >
              {loggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
            </button>
          )}

          <Link href="/contact" className="nav-cta">
            Demo Talep Et
          </Link>

          <button
            type="button"
            aria-label="Menüyü Aç"
            onClick={() => setMobileOpen((prev) => !prev)}
            style={{
              display: "none",
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              color: "#111827",
              fontSize: "18px",
              fontWeight: 700,
              cursor: "pointer",
            }}
            className="mobile-menu-button"
          >
            ☰
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            background: "#ffffff",
          }}
          className="mobile-nav-panel"
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "14px 20px 18px",
              display: "grid",
              gap: "10px",
            }}
          >
            <Link href="/" className="nav-link-item" onClick={() => setMobileOpen(false)}>
              Ana Sayfa
            </Link>

            <Link
              href="/services"
              className="nav-link-item"
              onClick={() => setMobileOpen(false)}
            >
              Hizmetler
            </Link>

            <button
              type="button"
              className="nav-link-item"
              onClick={() => setMobileTrainingOpen((prev) => !prev)}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                textAlign: "left",
                cursor: "pointer",
                font: "inherit",
              }}
            >
              Eğitim
            </button>

            {mobileTrainingOpen && (
              <div
                style={{
                  display: "grid",
                  gap: "8px",
                  paddingLeft: "14px",
                }}
              >
                {trainingItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="nav-link-item"
                    onClick={() => {
                      setMobileOpen(false);
                      setMobileTrainingOpen(false);
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            <Link href="/cbs" className="nav-link-item" onClick={() => setMobileOpen(false)}>
              ÇBS
            </Link>

            <Link
              href="/contact"
              className="nav-link-item"
              onClick={() => setMobileOpen(false)}
            >
              İletişim
            </Link>

            {showLogoutButton && (
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                style={{
                  width: "fit-content",
                  border: "none",
                  borderRadius: "14px",
                  background: "#111827",
                  color: "#ffffff",
                  padding: "12px 16px",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: loggingOut ? "not-allowed" : "pointer",
                  opacity: loggingOut ? 0.7 : 1,
                  marginTop: "6px",
                }}
              >
                {loggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
              </button>
            )}

            <Link
              href="/contact"
              className="nav-cta"
              onClick={() => setMobileOpen(false)}
              style={{ width: "fit-content", marginTop: "6px" }}
            >
              Demo Talep Et
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}