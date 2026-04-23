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

     const response = await fetch("/api/auth/login", {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: email.trim(),
    password: password.trim(),
  }),
});

      const data = await readSafeJson(response);

      if (!response.ok) {
        setError(data?.error || "Giriş başarısız.");
        return;
      }

    const nextRole = String(data?.role || "").trim();

if (nextRole === "training_user") {
  router.push("/portal/training");
} else if (nextRole === "super_admin") {
  router.push("/admin/dashboard");
} else if (nextRole === "company_admin" || nextRole === "operator") {
  router.push("/panel");
} else {
  router.push("/");
}

      router.refresh();
    } catch (err) {
      console.error("Login hatası:", err);
      setError("Bağlantı hatası oluştu.");
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
            <p className="cbs-desc" style={{ marginBottom: "18px" }}>
              Email, TC Kimlik veya Sicil numaranız ve şifrenizi girin.
            </p>

            <div
              style={{
                marginBottom: "18px",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                color: "#4b5563",
                fontSize: "14px",
                lineHeight: 1.7,
              }}
            >
              Açık demoyu incelemek için{" "}
              <Link
                href="/demo"
                style={{ color: "#b91c1c", fontWeight: 700 }}
              >
                buraya tıklayın
              </Link>
              . Kısıtlı veya full demo erişimi için iletişim formundan talep
              bırakabilirsiniz.
            </div>

            <div className="cbs-field">
              <label className="cbs-label">Email / TC / Sicil</label>

              <input
                type="text"
                className="cbs-input"
                placeholder="Email, TC veya Sicil No"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    handleLogin();
                  }
                }}
              />
            </div>

            <div className="cbs-field" style={{ marginTop: "14px" }}>
              <label className="cbs-label">Şifre</label>
              <input
                type="password"
                className="cbs-input"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) {
                    handleLogin();
                  }
                }}
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

            <div className="cbs-security">
              🔒 Email, TC veya Sicil ile güvenli giriş yapabilirsiniz.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}