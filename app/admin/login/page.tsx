"use client";

import { useEffect, useState } from "react";

const BRAND = {
  pageTop: "#fff4f5",
  pageMid: "#fff8f8",
  pageBottom: "#ffffff",

  heroDark: "#5a0f1f",
  heroMid: "#8f172c",
  heroMain: "#c62828",
  heroSoft: "#ef5350",

  white: "#ffffff",
  textStrong: "#3b0a15",
  textBody: "#6f4a53",
  textMuted: "#8b6770",

  border: "#efd8dc",
  borderStrong: "#e7c0c7",
  inputBorder: "#dec7cc",
  softChip: "#fff0f1",

  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerText: "#b91c1c",

  shadowSoft: "0 24px 60px rgba(87, 14, 26, 0.10)",
  shadowStrong: "0 30px 80px rgba(87, 14, 26, 0.24)",
};

function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

export default function AdminLoginPage() {
  const isMobile = useIsMobile();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Giriş başarısız.");
        return;
      }

      window.location.href = "/admin/dashboard";
    } catch (err) {
      console.error("admin login error:", err);
      setError("Giriş sırasında bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${BRAND.pageTop} 0%, ${BRAND.pageMid} 45%, ${BRAND.pageBottom} 100%)`,
        padding: isMobile ? "16px" : "48px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1180px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.15fr 0.85fr",
          gap: isMobile ? "16px" : "24px",
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${BRAND.heroDark} 0%, ${BRAND.heroMid} 44%, ${BRAND.heroMain} 78%, ${BRAND.heroSoft} 100%)`,
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: isMobile ? "22px" : "30px",
            padding: isMobile ? "22px 18px" : "36px",
            color: "#ffffff",
            boxShadow: BRAND.shadowStrong,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at top right, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 38%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: isMobile ? "-110px" : "-90px",
              top: isMobile ? "-110px" : "-90px",
              width: isMobile ? "220px" : "280px",
              height: isMobile ? "220px" : "280px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.10)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: isMobile ? "58%" : "58%",
              bottom: isMobile ? "-120px" : "-120px",
              width: isMobile ? "180px" : "240px",
              height: isMobile ? "180px" : "240px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.07)",
            }}
          />

          <div style={{ position: "relative", zIndex: 2 }}>
            <div
              style={{
                display: "inline-flex",
                padding: isMobile ? "7px 12px" : "8px 14px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.18)",
                fontSize: isMobile ? "11px" : "12px",
                fontWeight: 800,
                marginBottom: isMobile ? "14px" : "18px",
                letterSpacing: "0.2px",
              }}
            >
              D-SEC • Yönetim Girişi
            </div>

            <h1
              style={{
                fontSize: isMobile ? "34px" : "56px",
                lineHeight: isMobile ? 1.08 : 1.02,
                fontWeight: 900,
                margin: 0,
                letterSpacing: isMobile ? "-0.6px" : "-1.2px",
                textShadow: "0 6px 24px rgba(0,0,0,0.12)",
                wordBreak: "break-word",
              }}
            >
              Eğitim Yönetim
              <br />
              Merkezine Giriş
            </h1>

            <p
              style={{
                marginTop: isMobile ? "14px" : "18px",
                marginBottom: isMobile ? "18px" : "28px",
                fontSize: isMobile ? "15px" : "20px",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.92)",
                maxWidth: "760px",
              }}
            >
              Firma admini ve süper admin; eğitim atama, takip, risk analizi ve
              yönetim görünümüne bu giriş üzerinden erişir.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              <FeatureCard title="Yönetim" value="Eğitim Kontrolü" isMobile={isMobile} />
              <FeatureCard title="Firma" value="Kendi Verin" isMobile={isMobile} />
              <FeatureCard title="Dashboard" value="Canlı Durum" isMobile={isMobile} />
            </div>
          </div>
        </div>

        <div
          style={{
            background: BRAND.white,
            borderRadius: isMobile ? "22px" : "30px",
            padding: isMobile ? "22px 18px" : "34px",
            border: `1px solid ${BRAND.border}`,
            boxShadow: BRAND.shadowSoft,
            alignSelf: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "8px 12px",
              borderRadius: "999px",
              background: BRAND.softChip,
              border: `1px solid ${BRAND.borderStrong}`,
              color: BRAND.heroMain,
              fontWeight: 800,
              fontSize: "12px",
              marginBottom: "16px",
            }}
          >
            Güvenli Yönetim Girişi
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: isMobile ? "32px" : "42px",
              fontWeight: 900,
              color: BRAND.textStrong,
              letterSpacing: isMobile ? "-0.4px" : "-0.8px",
              lineHeight: 1.08,
            }}
          >
            Hoş geldiniz
          </h2>

          <p
            style={{
              marginTop: "14px",
              marginBottom: "26px",
              color: BRAND.textBody,
              lineHeight: 1.8,
              fontSize: isMobile ? "15px" : "16px",
            }}
          >
            Yönetim paneline erişmek için kurumsal email ve şifrenizi girin.
          </p>

          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 800,
                color: BRAND.textStrong,
                marginBottom: "10px",
              }}
            >
              Email
            </label>

            <input
              type="email"
              placeholder="firma@dsec360.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                height: "56px",
                borderRadius: "15px",
                border: `1px solid ${BRAND.inputBorder}`,
                padding: "0 16px",
                fontSize: "16px",
                outline: "none",
                boxSizing: "border-box",
                background: BRAND.white,
                color: BRAND.textStrong,
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
              }}
            />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 800,
                color: BRAND.textStrong,
                marginBottom: "10px",
              }}
            >
              Şifre
            </label>

            <input
              type="password"
              placeholder="Şifreyi girin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleLogin();
                }
              }}
              style={{
                width: "100%",
                height: "56px",
                borderRadius: "15px",
                border: `1px solid ${BRAND.inputBorder}`,
                padding: "0 16px",
                fontSize: "16px",
                outline: "none",
                boxSizing: "border-box",
                background: BRAND.white,
                color: BRAND.textStrong,
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
              }}
            />
          </div>

<div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "-6px",
    marginBottom: "18px",
  }}
>
  <a
    href="/admin/forgot-password"
    style={{
      color: BRAND.heroMid,
      fontSize: "13px",
      fontWeight: 800,
      textDecoration: "none",
    }}
  >
    Şifremi Unuttum
  </a>
</div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              minHeight: "58px",
              borderRadius: "15px",
              border: "none",
              background: loading
                ? "#d98b8b"
                : `linear-gradient(135deg, ${BRAND.heroSoft} 0%, ${BRAND.heroMain} 55%, ${BRAND.heroMid} 100%)`,
              color: "#ffffff",
              fontSize: isMobile ? "16px" : "17px",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 18px 36px rgba(198, 40, 40, 0.22)",
              padding: isMobile ? "12px 14px" : undefined,
            }}
          >
            {loading ? "Kontrol ediliyor..." : "Yönetim Paneline Giriş Yap"}
          </button>

          {error ? (
            <div
              style={{
                marginTop: "16px",
                padding: "14px 16px",
                borderRadius: "14px",
                background: BRAND.dangerBg,
                border: `1px solid ${BRAND.dangerBorder}`,
                color: BRAND.dangerText,
                lineHeight: 1.7,
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          ) : null}

          <p
            style={{
              marginTop: "18px",
              marginBottom: 0,
              fontSize: "13px",
              color: BRAND.textMuted,
              lineHeight: 1.7,
            }}
          >
            Firma admini yalnız kendi firmasının eğitim atama ve takip verilerini
            görür. Süper admin tüm firmaları görür.
          </p>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  value,
  isMobile,
}: {
  title: string;
  value: string;
  isMobile: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: "20px",
        padding: isMobile ? "14px" : "18px",
        background: "rgba(255,255,255,0.11)",
        border: "1px solid rgba(255,255,255,0.16)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          opacity: 0.84,
          fontWeight: 800,
          marginBottom: "8px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: isMobile ? "16px" : "18px",
          fontWeight: 900,
          lineHeight: 1.25,
        }}
      >
        {value}
      </div>
    </div>
  );
}