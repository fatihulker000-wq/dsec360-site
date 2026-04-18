"use client";

import { useState } from "react";

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

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setResetUrl("");

      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "İşlem başarısız.");
        return;
      }

      setSuccess("Reset bağlantısı üretildi.");
      if (data?.resetUrl) {
        setResetUrl(data.resetUrl);
      }
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
          maxWidth: 560,
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
          Şifremi Unuttum
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: 20,
            color: BRAND.muted,
            lineHeight: 1.7,
          }}
        >
          Yönetim hesabınızın email adresini girin. Sistem size yeni şifre bağlantısı oluşturur.
        </p>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 800, color: BRAND.text }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          onClick={handleSend}
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
          {loading ? "Oluşturuluyor..." : "Reset Bağlantısı Oluştur"}
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

        {resetUrl ? (
          <div
            style={{
              marginTop: 14,
              padding: 14,
              borderRadius: 14,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              fontWeight: 700,
              wordBreak: "break-all",
            }}
          >
            <div style={{ marginBottom: 8 }}>Reset Linki:</div>
            <a href={resetUrl} style={{ color: "#1d4ed8" }}>
              {resetUrl}
            </a>
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