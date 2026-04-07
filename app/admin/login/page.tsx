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
        setError(data?.error || "Giriş başarısız");
        return;
      }

      router.push("/admin/training/dashboard");
      router.refresh();
    } catch (err) {
      console.error("admin login error:", err);
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e3a8a 45%, #2563eb 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: "24px",
        }}
      >
        <div
          style={{
            borderRadius: "28px",
            padding: "34px",
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.20)",
            color: "#fff",
            backdropFilter: "blur(10px)",
          }}
        >
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
            }}
          >
            D-SEC • Admin Paneli
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(30px, 4vw, 50px)",
              lineHeight: 1.05,
              fontWeight: 900,
            }}
          >
            Eğitim Yönetim
            <br />
            Merkezine Giriş
          </h1>

          <p
            style={{
              marginTop: "18px",
              marginBottom: "26px",
              color: "rgba(255,255,255,0.88)",
              lineHeight: 1.8,
              fontSize: "15px",
              maxWidth: "620px",
            }}
          >
            Eğitim atamaları, kullanıcı risk analizi, tamamlama oranları,
            admin kontrolleri ve yönetim ekranlarına buradan güvenli şekilde
            erişebilirsiniz.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "14px",
            }}
          >
            <div
              style={{
                padding: "18px",
                borderRadius: "18px",
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.76)",
                  marginBottom: "8px",
                  fontWeight: 700,
                }}
              >
                Yönetim
              </div>
              <div style={{ fontSize: "22px", fontWeight: 900 }}>
                Eğitim Kontrolü
              </div>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "18px",
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.76)",
                  marginBottom: "8px",
                  fontWeight: 700,
                }}
              >
                Analiz
              </div>
              <div style={{ fontSize: "22px", fontWeight: 900 }}>
                Risk Takibi
              </div>
            </div>

            <div
              style={{
                padding: "18px",
                borderRadius: "18px",
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(255,255,255,0.76)",
                  marginBottom: "8px",
                  fontWeight: 700,
                }}
              >
                Dashboard
              </div>
              <div style={{ fontSize: "22px", fontWeight: 900 }}>
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
            boxShadow: "0 22px 60px rgba(15,23,42,0.22)",
            border: "1px solid #e5e7eb",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              padding: "8px 14px",
              borderRadius: "999px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              fontSize: "12px",
              fontWeight: 800,
              marginBottom: "16px",
            }}
          >
            Güvenli Admin Girişi
          </div>

          <h2
            style={{
              marginTop: 0,
              marginBottom: "10px",
              color: "#0f172a",
              fontSize: "30px",
              fontWeight: 900,
            }}
          >
            Hoş geldiniz
          </h2>

          <p
            style={{
              marginTop: 0,
              marginBottom: "24px",
              color: "#64748b",
              lineHeight: 1.7,
              fontSize: "14px",
            }}
          >
            Yönetim paneline erişmek için admin şifrenizi girin.
          </p>

          <div style={{ marginBottom: "18px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "13px",
                fontWeight: 800,
                color: "#334155",
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
                if (e.key === "Enter" && !loading) {
                  void handleLogin();
                }
              }}
              style={{
                width: "100%",
                height: "54px",
                borderRadius: "14px",
                border: "1px solid #dbe3ef",
                padding: "0 16px",
                fontSize: "15px",
                outline: "none",
                color: "#0f172a",
                background: "#f8fafc",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error ? (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px 14px",
                borderRadius: "12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: "100%",
              height: "54px",
              borderRadius: "14px",
              border: "none",
              background: loading
                ? "#93c5fd"
                : "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 16px 34px rgba(37,99,235,0.24)",
            }}
          >
            {loading ? "Giriş Yapılıyor..." : "Admin Paneline Giriş Yap"}
          </button>

          <div
            style={{
              marginTop: "18px",
              paddingTop: "18px",
              borderTop: "1px solid #e5e7eb",
              color: "#64748b",
              fontSize: "13px",
              lineHeight: 1.7,
            }}
          >
            Yetkisiz erişimler engellenir. Giriş başarılı olduğunda eğitim
            dashboard ekranına yönlendirilirsiniz.
          </div>
        </div>
      </div>
    </main>
  );
}