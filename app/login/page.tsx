"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

async function readSafeJson(response: Response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { error: "Sunucudan geçersiz yanıt geldi." };
  }
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email / TC / Sicil ve şifre zorunludur.");
      return;
    }

    try {
      setLoading(true);

      // 🔥 DEBUG LOG
      console.log("LOGIN REQUEST:", email);

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const data = await readSafeJson(response);

      // 🔥 DEBUG LOG
      console.log("LOGIN RESPONSE:", data);

      if (!response.ok) {
        setError(data?.error || "Giriş başarısız.");
        return;
      }

      // 🎯 ROLE YÖNLENDİRME
      if (data.role === "super_admin") {
        router.push("/admin/cbs");
      } else if (data.role === "company_admin" || data.role === "operator") {
        router.push("/panel");
      } else if (data.role === "training_user") {
        router.push("/portal/training");
      } else {
        router.push("/");
      }

      router.refresh();
    } catch (err) {
      console.error("Login hatası:", err);
      setError("Sunucuya bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="cbs-page">
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC Kullanıcı Girişi</div>
          <h1 className="hero-title">Hesabınıza Giriş Yapın</h1>
          <p className="hero-desc">
            Email, TC Kimlik veya Sicil numaranız ile giriş yapabilirsiniz.
          </p>
        </div>
      </section>

      <section className="section section-light">
        <div className="cbs-wrap" style={{ maxWidth: "560px" }}>
          <div className="cbs-card">
            <h2 className="cbs-title">Giriş Yap</h2>

            <div
              style={{
                marginBottom: "18px",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
              }}
            >
              Açık demo için{" "}
              <Link href="/demo" style={{ color: "#b91c1c", fontWeight: 700 }}>
                buraya tıklayın
              </Link>
            </div>

            <div className="cbs-field">
              <label>Email / TC / Sicil</label>
              <input
                type="text"
                className="cbs-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="cbs-field" style={{ marginTop: "14px" }}>
              <label>Şifre</label>
              <input
                type="password"
                className="cbs-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="cbs-actions">
              <button
                onClick={handleLogin}
                className="cbs-button cbs-button-strong"
                disabled={loading}
              >
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </button>
            </div>

            {error && <p className="cbs-result">{error}</p>}
          </div>
        </div>
      </section>
    </main>
  );
}