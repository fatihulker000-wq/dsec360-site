"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  inputFocus: "#c62828",

  softBg: "#fff6f7",
  softChip: "#fff0f1",

  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerText: "#b91c1c",

  shadowSoft: "0 24px 60px rgba(87, 14, 26, 0.10)",
  shadowStrong: "0 30px 80px rgba(87, 14, 26, 0.24)",
};

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Giriş başarısız.");
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
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
        padding: "48px 20px",
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
          gridTemplateColumns: "1.15fr 0.85fr",
          gap: "24px",
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${BRAND.heroDark} 0%, ${BRAND.heroMid} 44%, ${BRAND.heroMain} 78%, ${BRAND.heroSoft} 100%)`,
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "30px",
            padding: "36px",
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
              right: "-90px",
              top: "-90px",
              width: "280px",
              height: "280px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.10)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "58%",
              bottom: "-120px",
              width: "240px",
              height: "240px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.07)",
            }}
          />

          <div style={{ position: "relative", zIndex: 2 }}>
            <div
              style={{
                display: "inline-flex",
                padding: "8px 14px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.18)",
                fontSize: "12px",
                fontWeight: 800,
                marginBottom: "18px",
                letterSpacing: "0.2px",
              }}
            >
              D-SEC • Admin Paneli
            </div>

            <h1
              style={{
                fontSize: "56px",
                lineHeight: 1.02,
                fontWeight: 900,
                margin: 0,
                letterSpacing: "-1.2px",
                textShadow: "0 6px 24px rgba(0,0,0,0.12)",
              }}
            >
              Eğitim Yönetim
              <br />
              Merkezine Giriş
            </h1>

            <p
              style={{
                marginTop: "18px",
                marginBottom: "28px",
                fontSize: "20px",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.92)",
                maxWidth: "760px",
              }}
            >
              Eğitim atamaları, kullanıcı risk analizi, tamamlama oranları,
              yönetim kontrolleri ve karar destek görünümü için güvenli admin
              erişimi.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "14px",
              }}
            >
              <FeatureCard title="Yönetim" value="Eğitim Kontrolü" />
              <FeatureCard title="Analiz" value="Risk Takibi" />
              <FeatureCard title="Dashboard" value="Canlı Durum" />
            </div>
          </div>
        </div>

        <div
          style={{
            background: BRAND.white,
            borderRadius: "30px",
            padding: "34px",
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
            Güvenli Admin Girişi
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: "42px",
              fontWeight: 900,
              color: BRAND.textStrong,
              letterSpacing: "-0.8px",
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
              fontSize: "16px",
            }}
          >
            Yönetim paneline erişmek için admin şifrenizi girin.
          </p>

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
              Admin Şifresi
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

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              height: "58px",
              borderRadius: "15px",
              border: "none",
              background: loading
                ? "#d98b8b"
                : `linear-gradient(135deg, ${BRAND.heroSoft} 0%, ${BRAND.heroMain} 55%, ${BRAND.heroMid} 100%)`,
              color: "#ffffff",
              fontSize: "17px",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 18px 36px rgba(198, 40, 40, 0.22)",
            }}
          >
            {loading ? "Kontrol ediliyor..." : "Admin Paneline Giriş Yap"}
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
            Yetkisiz erişimler engellenir. Giriş başarılı olduğunda eğitim
            dashboard ekranına yönlendirilirsiniz.
          </p>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        borderRadius: "20px",
        padding: "18px",
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
      <div style={{ fontSize: "18px", fontWeight: 900 }}>{value}</div>
    </div>
  );
}