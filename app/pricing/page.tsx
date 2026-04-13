"use client";

import Link from "next/link";

const plans = [
  {
    name: "Başlangıç",
    price: "₺4.999",
    period: "/yıl",
    desc: "Küçük işletmeler için temel İSG yönetimi altyapısı.",
    features: [
      "Eğitim yönetimi",
      "Denetim kayıtları",
      "ÇBS kayıt sistemi",
      "Temel raporlama",
      "1 firma kullanımı",
    ],
    highlight: false,
    cta: "Başlangıç Paketi İçin Teklif Al",
  },
  {
    name: "Profesyonel",
    price: "₺9.999",
    period: "/yıl",
    desc: "Büyüyen firmalar için daha güçlü kontrol ve görünürlük.",
    features: [
      "Tüm ana modüller",
      "Sınırsız çalışan takibi",
      "Gelişmiş raporlama",
      "Eğitim + denetim entegrasyonu",
      "Öncelikli destek",
    ],
    highlight: true,
    cta: "Profesyonel Paket İçin Teklif Al",
  },
  {
    name: "Kurumsal",
    price: "Teklif Al",
    period: "",
    desc: "Büyük ölçekli işletmeler ve özel ihtiyaçlar için kurumsal çözüm.",
    features: [
      "Sınırsız firma yapısı",
      "Özel entegrasyonlar",
      "Yönetici dashboard kurgusu",
      "Kurumsal danışmanlık",
      "Özel destek süreci",
    ],
    highlight: false,
    cta: "Kurumsal Teklif Al",
  },
];

export default function PricingPage() {
  return (
    <main>
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC Fiyatlandırma</div>

          <h1 className="hero-title">
            İşletmenize Uygun D-SEC Paketini Seçin
          </h1>

          <p className="hero-desc">
            Küçük işletmelerden kurumsal yapılara kadar farklı ihtiyaçlara uygun
            D-SEC paketleri ile eğitim, denetim, sağlık ve raporlama
            süreçlerinizi daha kontrollü ve daha görünür yönetin.
          </p>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">Fiyatlandırma Paketleri</h2>
            <p className="section-subtitle">
              Küçük işletmelerden kurumsal yapılara kadar farklı ihtiyaçlara
              uygun esnek seçenekler
            </p>
          </div>

          <div className="grid-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="card"
                style={
                  plan.highlight
                    ? {
                        border: "2px solid #c62828",
                        boxShadow: "0 24px 52px rgba(198, 40, 40, 0.16)",
                        position: "relative",
                        transform: "translateY(-8px)",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }
                    : {
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                      }
                }
              >
                {plan.highlight && (
                  <div
                    style={{
                      position: "absolute",
                      top: -14,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "#c62828",
                      color: "#ffffff",
                      padding: "6px 14px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    EN ÇOK TERCİH EDİLEN
                  </div>
                )}

                <h3 className="card-title">{plan.name}</h3>
                <p className="card-text">{plan.desc}</p>

                <div style={{ marginTop: 20 }}>
                  <span
                    style={{
                      fontSize: 34,
                      fontWeight: 900,
                      color: plan.highlight ? "#c62828" : "#111827",
                    }}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{ color: "#6b7280", fontSize: 15 }}>
                      {" "}
                      {plan.period}
                    </span>
                  )}
                </div>

                <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
                  {plan.features.map((item) => (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        color: "#374151",
                        fontSize: 14,
                        lineHeight: 1.6,
                      }}
                    >
                      <span style={{ color: "#c62828", fontWeight: 900 }}>
                        ✓
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "auto", paddingTop: 24 }}>
                  <Link
                    href="/contact"
                    className="nav-cta"
                    style={{ width: "100%" }}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hero hero-cta-band">
        <div className="hero-inner hero-compact">
          <div className="hero-badge">Demo ve Teklif Süreci</div>

          <h2 className="hero-title" style={{ fontSize: 42 }}>
            D-SEC ile Dijital İSG Yönetimine Geçin
          </h2>

          <p className="hero-desc">
            Size uygun paketi seçin, işletmenize özel kurumsal yapıyı birlikte
            planlayalım.
          </p>

          <div className="hero-actions">
            <Link href="/demo" className="btn-primary">
              Ücretsiz Demo
            </Link>

            <Link href="/contact" className="btn-outline-light">
              Teklif Al
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}