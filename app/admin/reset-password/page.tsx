"use client";

import { useEffect, useState } from "react";

const BRAND = {
  bg: "#fff8f8",
  card: "#ffffff",
  border: "#efd8dc",
  text: "#3b0a15",
  muted: "#8b6770",
  red: "#c62828",
  redDark: "#5a0f1f",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerText: "#b91c1c",
};

export default function AdminResetPasswordPage() {
 const [token, setToken] = useState("");

useEffect(() => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const t = String(params.get("token") || "").trim();
    setToken(t);
  }
}, []);

  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (!token) {
        setError("Geçersiz reset bağlantısı.");
        return;
      }

      if (!newPassword || !newPassword2) {
        setError("Tüm alanları doldurun.");
        return;
      }

      if (newPassword !== newPassword2) {
        setError("Şifreler aynı değil.");
        return;
      }

      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Şifre sıfırlanamadı.");
        return;
      }

      setSuccess("Şifreniz güncellendi. Birkaç saniye içinde giriş ekranına yönlendirileceksiniz.");
      setTimeout(() => {
  window.location.href = "/admin/login";
}, 1800);

      setNewPassword("");
      setNewPassword2("");
    } catch (error) {
      console.error(error);
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: BRAND.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: BRAND.card,
          border: `1px solid ${BRAND.border}`,
          borderRadius: 24,
          padding: 24,
          boxShadow: "0 20px 60px rgba(87,14,26,0.10)",
        }}
      >
        <h1
          style={{
            margin: 0,
            marginBottom: 12,
            color: BRAND.text,
            fontSize: 34,
            fontWeight: 900,
          }}
        >
          Yeni Şifre Belirle
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: 20,
            color: BRAND.muted,
            lineHeight: 1.7,
          }}
        >
          Yönetim paneli için yeni şifrenizi belirleyin.
        </p>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 800, color: BRAND.text }}>
            Yeni Şifre
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 14,
              border: `1px solid ${BRAND.border}`,
              padding: "0 14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 800, color: BRAND.text }}>
            Yeni Şifre Tekrar
          </label>
          <input
            type="password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleReset();
              }
            }}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 14,
              border: `1px solid ${BRAND.border}`,
              padding: "0 14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          style={{
            width: "100%",
            height: 54,
            borderRadius: 14,
            border: "none",
            background: `linear-gradient(135deg, ${BRAND.red} 0%, ${BRAND.redDark} 100%)`,
            color: "#fff",
            fontWeight: 800,
            fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
        </button>

        {error ? (
          <div
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 14,
              background: BRAND.dangerBg,
              border: `1px solid ${BRAND.dangerBorder}`,
              color: BRAND.dangerText,
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        ) : null}

        {success ? (
          <div
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 14,
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
              fontWeight: 700,
            }}
          >
            {success}
          </div>
        ) : null}

        <div style={{ marginTop: 16 }}>
          <a
            href="/admin/login"
            style={{
              color: BRAND.redDark,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Giriş sayfasına dön
          </a>
        </div>
      </div>
    </main>
  );
}