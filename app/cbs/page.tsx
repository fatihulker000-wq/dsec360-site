"use client";

import { useState } from "react";

export default function CbsPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const handleSubmit = async () => {
    if (!form.full_name.trim() || !form.email.trim() || !form.message.trim()) {
      setResultMessage("Lütfen tüm alanları doldurun.");
      return;
    }

    try {
      setLoading(true);
      setResultMessage("");

      const response = await fetch("/api/cbs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        setResultMessage(result?.error || "Gönderim sırasında hata oluştu.");
        return;
      }

      setResultMessage("Başvurunuz başarıyla gönderildi.");
      setForm({
        full_name: "",
        email: "",
        message: "",
      });
    } catch (error) {
      console.error("ÇBS gönderim hatası:", error);
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
                />
              </div>
            </div>

            <div className="cbs-textarea-wrap">
              <label className="cbs-label">Mesajınız</label>
              <textarea
                value={form.message}
                placeholder="Mesajınız"
                className="cbs-textarea"
                onChange={(e) =>
                  setForm({ ...form, message: e.target.value })
                }
              />
            </div>

            <div className="cbs-actions">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="cbs-button cbs-button-strong"
              >
                {loading ? "Gönderiliyor..." : "Gönder"}
              </button>
            </div>

            {resultMessage && <p className="cbs-result">{resultMessage}</p>}

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