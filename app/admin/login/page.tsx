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
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Giriş başarısız");
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      console.error("admin login hata:", err);
      setError("Giriş sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a 0%, #1d4ed8 45%, #60a5fa 100%)",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          gap: "24px",
          alignItems: "stretch",
        }}
      >
        <section
          style={{
            borderRadius: "28px",
            padding: "36px",
            color: "#ffffff",
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
            backdropFilter: "blur(12px)",
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
              fontWeight: 700,
              marginBottom: "20px",
            }}
          >
            D-SEC • Admin Paneli
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "56px",
              lineHeight: 1.02,
              fontWeight: 900,
              letterSpacing: "-1px",
              maxWidth: "620px",
            }}
          >
            Eğitim Yönetim
            <br />
            Merkezine Giriş
          </h1>

          <p
            style={{
              marginTop: "20px",
              marginBottom: "28px",
              maxWidth: "760px",
              fontSize: "20px",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.92)",
            }}
          >
            Eğitim atamaları, kullanıcı risk analizi, tamamlama oranları,
            yönetici kontrolleri ve kurumsal raporlama ekranlarına güvenli
            şekilde buradan erişebilirsiniz.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "16px",
              marginTop: "28px",
            }}
          >
            {[
              { label: "Yönetim", value: "Eğitim Kontrolü" },
              { label: "Analiz", value: "Risk Takibi" },
              { label: "Dashboard", value: "Canlı Durum" },
            ].map((item) => (
              <div
                key={item.value}
                style={{
                  borderRadius: "22px",
                  padding: "20px",
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  minHeight: "110px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.72)",
                    marginBottom: "10px",
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    lineHeight: 1.4,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            borderRadius: "28px",
            padding: "32px",
            background: "#ffffff",
            border: "1px solid rgba(255,255,255,0.45)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.16)",
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
              marginBottom: "18px",
            }}
          >
            Güvenli Admin Girişi
          </div>

          <h2
            style={{
              marginTop: 0,
              marginBottom: "12px",
              fontSize: "44px",
              lineHeight: 1.05,
              color: "#0f172a",
              fontWeight: 900,
              letterSpacing: "-0.6px",
            }}
          >
            Hoş geldiniz
          </h2>

          <p
            style={{
              marginTop: 0,
              marginBottom: "28px",
              color: "#64748b",
              fontSize: "17px",
              lineHeight: 1.7,
            }}
          >
            Yönetim paneline erişmek için admin şifrenizi girin.
          </p>

          <div style={{ marginBottom: "10px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontSize: "15px",
                fontWeight: 800,
                color: "#1e293b",
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
                  handleLogin();
                }
              }}
              style={{
                width: "100%",
                height: "58px",
                borderRadius: "16px",
                border: "1px solid #cbd5e1",
                padding: "0 18px",
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
              marginTop: "16px",
              height: "58px",
              width: "100%",
              borderRadius: "16px",
              border: "none",
              background: loading
                ? "#93c5fd"
                : "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 16px 32px rgba(37,99,235,0.28)",
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
                lineHeight: 1.6,
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          ) : null}

          <p
            style={{
              marginTop: "22px",
              marginBottom: 0,
              color: "#64748b",
              lineHeight: 1.7,
              fontSize: "14px",
            }}
          >
            Yetkisiz erişimler engellenir. Giriş başarılı olduğunda eğitim
            dashboard ekranına yönlendirilirsiniz.
          </p>
        </section>
      </div>
    </main>
  );
}
