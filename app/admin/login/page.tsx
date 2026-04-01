"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
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
      setError(data.error || "Giriş başarısız");
      return;
    }

    router.push("/admin/cbs");
    router.refresh();
  };

  return (
    <main className="cbs-page">
      <div className="cbs-wrap" style={{ maxWidth: "560px" }}>
        <div className="cbs-card">
          <h1 className="cbs-title">Admin Giriş</h1>
          <p className="cbs-desc" style={{ marginBottom: "18px" }}>
            Yönetim paneline erişmek için şifrenizi girin.
          </p>

          <div className="cbs-field">
            <label className="cbs-label">Şifre</label>
            <input
              type="password"
              placeholder="Şifre"
              className="cbs-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="cbs-actions">
            <button onClick={handleLogin} className="cbs-button">
              Giriş Yap
            </button>
          </div>

          {error && <p className="cbs-result">{error}</p>}
        </div>
      </div>
    </main>
  );
}