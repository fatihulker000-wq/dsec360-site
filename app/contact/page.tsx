"use client";

import { useState } from "react";
import Link from "next/link";

type DemoType = "limited_demo" | "full_demo";

const contactCards = [
  {
    title: "Demo Planlama",
    desc: "D-SEC’in web panel, mobil uygulama ve dashboard yapısını işletmenize uygun senaryolarla inceleyin.",
  },
  {
    title: "Kurumsal Teklif",
    desc: "Çalışan sayısı, modül kapsamı ve firma yapınıza göre size özel teklif süreci başlatılır.",
  },
  {
    title: "İhtiyaç Analizi",
    desc: "Eğitim, denetim, risk, sağlık ve ÇBS süreçleriniz için en uygun dijital kurgu birlikte değerlendirilir.",
  },
];

const contactInfo = [
  "Demo talebiniz alındıktan sonra uygun demo seviyesi belirlenir.",
  "Kısıtlı demo için kontrollü erişim bilgileri paylaşılır.",
  "Kurumsal demo sürecinde canlı sunum ve ihtiyaç analizi yapılır.",
  "Teklif, kullanılacak modül ve işletme yapısına göre hazırlanır.",
];

const reasons = [
  "Eğitim yönetimi",
  "Denetim süreçleri",
  "Risk analizi",
  "Sağlık takibi",
  "ÇBS yönetimi",
  "Yönetici dashboard",
  "Mobil uygulama",
  "Kurumsal teklif",
];

export default function ContactPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    company_name: "",
    phone: "",
    employee_count: "",
    demo_type: "limited_demo" as DemoType,
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const handleSubmit = async () => {
    if (!form.full_name.trim() || !form.email.trim() || !form.message.trim()) {
      setResultMessage("Lütfen zorunlu alanları doldurun.");
      return;
    }

    try {
      setLoading(true);
      setResultMessage("");

      const response = await fetch("/api/contact", {
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

      setResultMessage(
        "✅ Talebiniz alındı. Demo planı ve sonraki adımlar e-posta adresinize gönderildi."
      );

      setForm({
        full_name: "",
        email: "",
        company_name: "",
        phone: "",
        employee_count: "",
        demo_type: "limited_demo",
        message: "",
      });
    } catch (error) {
      console.error(error);
      setResultMessage("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="cbs-page">
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC İletişim</div>

          <h1 className="hero-title">
            İşletmeniz İçin En Uygun D-SEC Yapısını Birlikte Planlayalım
          </h1>

          <p className="hero-desc">
            Demo, kurumsal teklif, modül kapsamı veya canlı tanıtım için
            bizimle iletişime geçin. D-SEC’i işletmenizin İSG süreçlerine uygun
            şekilde değerlendirelim.
          </p>

          <div className="hero-actions">
            <Link href="/demo" className="btn-primary">
              Demo Sayfasını İncele
            </Link>

            <Link href="/pricing" className="btn-outline-light">
              Paketleri Gör
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">Nasıl Yardımcı Olabiliriz?</h2>
            <p className="section-subtitle">
              Formu doldurmadan önce ihtiyacınıza en yakın başlığı
              belirleyebilirsiniz.
            </p>
          </div>

          <div className="grid-3">
            {contactCards.map((item) => (
              <div
                key={item.title}
                className="card"
                style={{
                  background:
                    "linear-gradient(180deg,#ffffff 0%,#fffafa 100%)",
                  border: "1px solid rgba(198,40,40,0.10)",
                  boxShadow: "0 18px 46px rgba(15,23,42,0.07)",
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 16,
                    background: "#fff1f1",
                    color: "#c62828",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    marginBottom: 16,
                  }}
                >
                  ✓
                </div>

                <h3 className="card-title">{item.title}</h3>
                <p className="card-text">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="page-container">
          <div className="contact-form-grid">
            <div
  className="card contact-side-card"
  style={{
    position: "sticky",
    top: 90,
                background:
                  "linear-gradient(180deg,#ffffff 0%,#fff7f7 100%)",
                border: "1px solid rgba(198,40,40,0.12)",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  padding: "7px 12px",
                  borderRadius: 999,
                  background: "#fff1f1",
                  color: "#9f1239",
                  fontSize: 12,
                  fontWeight: 900,
                  marginBottom: 16,
                }}
              >
                Demo ve Teklif Süreci
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: 32,
                  lineHeight: 1.2,
                  color: "#111827",
                }}
              >
                Formu gönderin, uygun demo akışını birlikte başlatalım.
              </h2>

              <p
                style={{
                  marginTop: 14,
                  color: "#6b7280",
                  lineHeight: 1.8,
                }}
              >
                Talebiniz işletmenizin yapısına göre değerlendirilir. Gerekirse
                önce kısa bir ihtiyaç analizi yapılır, ardından demo veya teklif
                süreci planlanır.
              </p>

              <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
                {contactInfo.map((item) => (
                  <div
                    key={item}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 14,
                      background: "#ffffff",
                      border: "1px solid #eef0f4",
                      color: "#374151",
                      fontWeight: 700,
                      lineHeight: 1.6,
                    }}
                  >
                    ✓ {item}
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 22,
                  padding: 16,
                  borderRadius: 18,
                  background: "#111827",
                  color: "#fff",
                  lineHeight: 1.7,
                  fontSize: 14,
                }}
              >
                🔒 Bilgileriniz yalnızca geri dönüş, demo planlama ve teklif
                süreci amacıyla kullanılacaktır.
              </div>
            </div>

            <div
  className="card contact-main-card"
  style={{
    borderRadius: 30,
                boxShadow: "0 30px 70px rgba(15,23,42,0.12)",
                border: "1px solid rgba(17,24,39,0.08)",
              }}
            >
              <div style={{ marginBottom: 22 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 30,
                    color: "#111827",
                  }}
                >
                  Demo Talep Formu
                </h2>

                <p
                  style={{
                    marginTop: 8,
                    color: "#6b7280",
                    lineHeight: 1.7,
                  }}
                >
                  Zorunlu alanları doldurun, size uygun demo seviyesini
                  planlayalım.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 16,
                }}
              >
                <div className="cbs-field">
                  <label className="cbs-label">Ad Soyad *</label>
                  <input
                    value={form.full_name}
                    className="cbs-input"
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                  />
                </div>

                <div className="cbs-field">
                  <label className="cbs-label">Email *</label>
                  <input
                    value={form.email}
                    type="email"
                    className="cbs-input"
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>

                <div className="cbs-field">
                  <label className="cbs-label">Firma Adı</label>
                  <input
                    value={form.company_name}
                    className="cbs-input"
                    onChange={(e) =>
                      setForm({ ...form, company_name: e.target.value })
                    }
                  />
                </div>

                <div className="cbs-field">
                  <label className="cbs-label">Telefon</label>
                  <input
                    value={form.phone}
                    className="cbs-input"
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>

                <div className="cbs-field">
                  <label className="cbs-label">Çalışan Sayısı</label>
                  <input
                    value={form.employee_count}
                    className="cbs-input"
                    onChange={(e) =>
                      setForm({ ...form, employee_count: e.target.value })
                    }
                  />
                </div>

                <div className="cbs-field">
                  <label className="cbs-label">Demo Türü</label>
                  <select
                    value={form.demo_type}
                    className="cbs-input"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        demo_type: e.target.value as DemoType,
                      })
                    }
                  >
                    <option value="limited_demo">Kısıtlı Demo</option>
                    <option value="full_demo">Kurumsal / Full Demo</option>
                  </select>
                </div>
              </div>

              <div className="cbs-textarea-wrap" style={{ marginTop: 16 }}>
                <label className="cbs-label">Talebiniz *</label>
                <textarea
                  value={form.message}
                  className="cbs-textarea"
                  placeholder="Örn: 120 çalışanlı firma için eğitim, denetim ve dashboard demo talebi"
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                />
              </div>

              <div
                style={{
                  marginTop: 16,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
                  gap: 10,
                }}
              >
                {reasons.map((item) => (
                  <div
                    key={item}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 14,
                      background: "#f9fafb",
                      border: "1px solid #eef0f4",
                      color: "#374151",
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="cbs-actions" style={{ marginTop: 22 }}>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="cbs-button cbs-button-strong"
                >
                  {loading ? "Gönderiliyor..." : "Demo Talebini Gönder"}
                </button>
              </div>

              {resultMessage && <p className="cbs-result">{resultMessage}</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="hero hero-cta-band">
        <div className="hero-inner hero-compact">
          <div className="hero-badge">D-SEC Kurumsal Tanıtım</div>

          <h2 className="hero-title" style={{ fontSize: 42 }}>
            Önce İnceleyin, Sonra Size Özel Demo Planlayalım
          </h2>

          <p className="hero-desc">
            Açık demoyu inceleyin, ardından işletmenize uygun kısıtlı veya
            kurumsal demo sürecine geçin.
          </p>

          <div className="hero-actions">
            <Link href="/demo" className="btn-primary">
              Demo Sayfasını Gör
            </Link>

            <Link href="/services" className="btn-outline-light">
              Tüm Modülleri Gör
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}