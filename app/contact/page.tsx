"use client";

import { useState } from "react";
import Link from "next/link";

const contactHighlights = [
  {
    title: "Açık Demo",
    desc: "D-SEC yapısını herkesin görebileceği genel tanıtım ekranı ile hızlıca inceleyebilirsiniz.",
  },
  {
    title: "Kısıtlı Demo",
    desc: "Belirli modülleri ve örnek verileri içeren kontrollü demo erişimi talep edebilirsiniz.",
  },
  {
    title: "Full Demo",
    desc: "İşletmenize özel daha geniş kapsamlı sunum ve değerlendirme süreci başlatabilirsiniz.",
  },
];

const contactReasons = [
  "Açık demo bağlantısını incelemek",
  "Kısıtlı demo erişimi talep etmek",
  "Full demo / canlı sunum istemek",
  "Kurumsal teklif almak",
  "D-SEC modüllerini işletmeye entegre etmek",
  "Genel bilgi ve destek talebi oluşturmak",
];

type DemoType = "limited_demo" | "full_demo";

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
          <div className="hero-badge">D-SEC Demo & İletişim</div>

          <h1 className="hero-title">
            D-SEC Demo Erişimi ve Kurumsal Değerlendirme
          </h1>

          <p className="hero-desc">
            Açık demo ile sistemi inceleyin, kısıtlı demo ile yapıyı deneyimleyin,
            full demo ile işletmenize özel detaylı değerlendirme sürecini başlatın.
          </p>

          <div className="hero-actions">
            <Link href="/demo" className="btn-primary">
              Açık Demo Gör
            </Link>
            <Link href="/training" className="btn-outline-light">
              Eğitim Modülünü Gör
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">Demo Modelleri</h2>
            <p className="section-subtitle">
              İhtiyacınıza göre üç farklı demo yaklaşımı ile ilerleyebilirsiniz
            </p>
          </div>

          <div className="grid-3">
            {contactHighlights.map((item) => (
              <div key={item.title} className="card">
                <div className="card-icon" />
                <h3 className="card-title">{item.title}</h3>
                <p className="card-text">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="page-container">
          <div className="grid-2">
            <div className="card">
              <h3 className="card-title">Hangi Konular İçin Yazabilirsiniz?</h3>

              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                {contactReasons.map((item) => (
                  <div
                    key={item}
                    style={{
                      fontSize: 14,
                      color: "#374151",
                      lineHeight: 1.7,
                      fontWeight: 600,
                    }}
                  >
                    • {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Demo Süreci Nasıl İlerler?</h3>
              <p className="card-text">
                Önce açık demoyu inceleyebilir, ardından kısıtlı veya full demo
                talebi bırakabilirsiniz. Talebiniz alındığında size otomatik bir
                bilgilendirme maili gider ve uygun sonraki adım planlanır.
              </p>

              <p className="card-text">
                Kısıtlı demo yapısında örnek erişim, full demo yapısında ise
                işletmenize özel değerlendirme ve kurulum görüşmesi hedeflenir.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="cbs-wrap">
          <div className="cbs-header">
            <h2 className="cbs-title">Demo Talep Formu</h2>
            <p className="cbs-desc">
              Formu doldurun, uygun demo akışını sizin için başlatalım.
            </p>
            <p className="cbs-note">
              ✔ Açık Demo • ✔ Kısıtlı Demo • ✔ Full Demo • ✔ Teklif
            </p>
          </div>

          <div className="cbs-card">
            <div className="cbs-grid">
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
                  <option value="full_demo">Full Demo</option>
                </select>
              </div>
            </div>

            <div className="cbs-textarea-wrap">
              <label className="cbs-label">Talebiniz *</label>
              <textarea
                value={form.message}
                className="cbs-textarea"
                placeholder="Örn: 30 çalışanlı firma için eğitim ve denetim modülü demo talebi"
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
                {loading ? "Gönderiliyor..." : "Demo Talep Et"}
              </button>
            </div>

            {resultMessage && <p className="cbs-result">{resultMessage}</p>}

            <div className="cbs-security">
              🔒 Bilgileriniz yalnızca geri dönüş, demo planlama ve teklif süreci
              amacıyla kullanılacaktır.
            </div>
          </div>
        </div>
      </section>

      <section className="hero">
        <div className="hero-inner">
          <h2 className="hero-title">
            Önce İnceleyin, Sonra Size Özel Demo Planlayalım
          </h2>

          <p className="hero-desc">
            Açık demoyu inceleyin, ihtiyacınıza göre kısıtlı veya full demo
            sürecine geçin.
          </p>

          <div className="hero-actions">
            <Link href="/demo" className="btn-primary">
              Açık Demo Gör
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
