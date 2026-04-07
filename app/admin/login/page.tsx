"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
        background:
          "linear-gradient(135deg, #0f172a 0%, #1d4ed8 45%, #0f766e 100%)",
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
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.18)",
            backdropFilter: "blur(12px)",
            borderRadius: "28px",
            padding: "34px",
            color: "#ffffff",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "8px 14px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.16)",
              border: "1px solid rgba(255,255,255,0.16)",
              fontSize: "12px",
              fontWeight: 700,
              marginBottom: "18px",
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
              color: "rgba(255,255,255,0.90)",
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
            <div
              style={{
                borderRadius: "20px",
                padding: "18px",
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  opacity: 0.82,
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                Yönetim
              </div>
              <div style={{ fontSize: "18px", fontWeight: 800 }}>
                Eğitim Kontrolü
              </div>
            </div>

            <div
              style={{
                borderRadius: "20px",
                padding: "18px",
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  opacity: 0.82,
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                Analiz
              </div>
              <div style={{ fontSize: "18px", fontWeight: 800 }}>
                Risk Takibi
              </div>
            </div>

            <div
              style={{
                borderRadius: "20px",
                padding: "18px",
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  opacity: 0.82,
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                Dashboard
              </div>
              <div style={{ fontSize: "18px", fontWeight: 800 }}>
                Canlı Durum
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "28px",
            padding: "34px",
            border: "1px solid #dbeafe",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
            alignSelf: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "8px 12px",
              borderRadius: "999px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              fontWeight: 700,
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
              color: "#0f172a",
              letterSpacing: "-0.8px",
            }}
          >
            Hoş geldiniz
          </h2>

          <p
            style={{
              marginTop: "14px",
              marginBottom: "26px",
              color: "#475569",
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
                color: "#334155",
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
                height: "54px",
                borderRadius: "14px",
                border: "1px solid #cbd5e1",
                padding: "0 16px",
                fontSize: "16px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              height: "56px",
              borderRadius: "14px",
              border: "none",
              background: loading ? "#93c5fd" : "#2563eb",
              color: "#ffffff",
              fontSize: "17px",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 16px 36px rgba(37, 99, 235, 0.22)",
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
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
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
              color: "#64748b",
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