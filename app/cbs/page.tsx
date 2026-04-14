"use client";

import { useState } from "react";

type CbsForm = {
  full_name: string;
  email: string;
  message: string;
};

async function readSafeJson(response: Response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export default function CbsPage() {
  const [form, setForm] = useState<CbsForm>({
    full_name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;

    const fullName = form.full_name.trim();
    const email = form.email.trim();
    const message = form.message.trim();

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!fullName || !email || !message) {
      setIsSuccess(false);
      setResultMessage("Lütfen tüm alanları doldurun.");
      return;
    }

    if (!emailValid) {
      setIsSuccess(false);
      setResultMessage("Geçerli bir email girin.");
      return;
    }

    try {
      setLoading(true);
      setResultMessage("");
      setIsSuccess(false);

      const response = await fetch("/api/cbs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          message,
        }),
      });

      const result = await readSafeJson(response);

      if (!response.ok) {
        setIsSuccess(false);
        setResultMessage(
          result?.error || "Gönderim sırasında hata oluştu."
        );
        return;
      }

      setIsSuccess(true);
      setResultMessage(
        "✔ Başvurunuz başarıyla alındı. En kısa sürede sizinle iletişime geçeceğiz."
      );

      setForm({
        full_name: "",
        email: "",
        message: "",
      });
    } catch (error) {
      console.error("ÇBS gönderim hatası:", error);
      setIsSuccess(false);
      setResultMessage("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="cbs-page">
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC ÇBS Modülü</div>
          <h1 className="hero-title">ÇBS – Şikayet & Öneri Sistemi</h1>
          <p className="hero-desc">
            Çalışanlarınızdan veya dış paydaşlardan gelen şikayet, öneri ve
            talepleri kayıt altına alın, yönetin ve izlenebilir hale getirin.
          </p>
        </div>
      </section>

      <section className="section section-light">
        <div className="cbs-wrap">
          <div className="cbs-header">
            <h2 className="cbs-title">Başvuru Formu</h2>
            <p className="cbs-desc">
              Aşağıdaki formu doldurarak bize doğrudan ulaşabilirsiniz.
            </p>
            <p className="cbs-note">
              ✔ Tüm başvurular gizli tutulur • ✔ 24 saat içinde dönüş sağlanır
            </p>
          </div>

          <div className="cbs-card">
            <div className="cbs-grid">
              <div className="cbs-field">
                <label className="cbs-label">Ad Soyad</label>
                <input
                  value={form.full_name}
                  placeholder="Ad Soyad"
                  className="cbs-input"
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                  disabled={loading}
                />
              </div>

              <div className="cbs-field">
                <label className="cbs-label">Email</label>
                <input
                  value={form.email}
                  type="email"
                  placeholder="Email"
                  className="cbs-input"
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
            </div>

            <div className="cbs-textarea-wrap">
              <label className="cbs-label">Mesajınız</label>
              <textarea
                value={form.message}
                placeholder="Mesajınızı yazın"
                className="cbs-textarea"
                onChange={(e) =>
                  setForm({ ...form, message: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div className="cbs-actions">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="cbs-button cbs-button-strong"
              >
                {loading ? "Gönderiliyor..." : "Gönder"}
              </button>
            </div>

            {resultMessage && (
              <p
                className="cbs-result"
                style={{
                  color: isSuccess ? "#166534" : "#b91c1c",
                  fontWeight: 600,
                }}
              >
                {resultMessage}
              </p>
            )}

            <div className="cbs-security">
              🔒 Verileriniz güvenli şekilde saklanır ve üçüncü kişilerle
              paylaşılmaz.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}