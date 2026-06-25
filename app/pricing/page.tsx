"use client";

import Link from "next/link";

const plans = [
  {
    name: "Başlangıç",
    badge: "TEMEL PAKET",
    desc: "İSG süreçlerini dijital ortama taşımaya başlamak isteyen küçük işletmeler için sade ve etkili başlangıç paketi.",
    idealFor: "1-50 çalışanlı işletmeler",
    features: [
      "Eğitim yönetimi",
      "Denetim kayıtları",
      "ÇBS kayıt sistemi",
      "Temel raporlama",
      "Tek firma kullanımı",
    ],
    highlight: false,
    cta: "Başlangıç Paketi İçin Görüşme Talep Et",
  },
  {
    name: "Profesyonel",
    badge: "EN ÇOK TERCİH EDİLEN",
    desc: "Eğitim, denetim, çalışan takibi ve raporlama süreçlerini tek merkezden yönetmek isteyen işletmeler için güçlü paket.",
    idealFor: "Büyüyen ve çok kullanıcılı firmalar",
    features: [
      "Tüm ana modüller",
      "Çalışan ve eğitim takibi",
      "Gelişmiş raporlama",
      "Eğitim + denetim entegrasyonu",
      "Yönetici dashboard görünümü",
    ],
    highlight: true,
    cta: "Profesyonel Paket İçin Demo Talep Et",
  },
  {
    name: "Kurumsal",
    badge: "ÖZEL ÇÖZÜM",
    desc: "Çok şubeli, çok firmalı veya özel entegrasyon ihtiyacı bulunan kurumsal yapılar için özel olarak planlanır.",
    idealFor: "Kurumsal ve çok lokasyonlu yapılar",
    features: [
      "Çoklu firma / şube yapısı",
      "Özel entegrasyonlar",
      "Yönetici dashboard kurgusu",
      "Kurumsal danışmanlık",
      "Özel destek süreci",
    ],
    highlight: false,
    cta: "Kurumsal Görüşme Planla",
  },
];

export default function PricingPage() {
  return (
    <main>
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC Paketleri</div>

          <h1 className="hero-title">
            İşletmenize Uygun Dijital İSG Çözümünü Birlikte Planlayalım
          </h1>

          <p className="hero-desc">
            D-SEC paketleri, işletmenizin çalışan sayısı, modül ihtiyacı,
            şube yapısı ve raporlama beklentisine göre değerlendirilir.
            Size en uygun yapıyı demo sonrası birlikte belirleyelim.
          </p>

          <div className="hero-actions">
            <Link href="/demo" className="btn-primary">
              Demo Talep Et
            </Link>

            <Link href="/contact" className="btn-outline-light">
              Teklif Görüşmesi
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">D-SEC Paket Yapısı</h2>
            <p className="section-subtitle">
              Fiyat yerine ihtiyaç analizi odaklı teklif modeli kullanıyoruz.
              Böylece sadece kullanacağınız modüller ve işletmenizin yapısına
              uygun bir çözüm oluşturulur.
            </p>
          </div>

          <div className="grid-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="card"
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  border: plan.highlight
                    ? "2px solid #c62828"
                    : "1px solid rgba(17,24,39,0.08)",
                  boxShadow: plan.highlight
                    ? "0 28px 60px rgba(198, 40, 40, 0.16)"
                    : "0 18px 46px rgba(15,23,42,0.08)",
                  transform: plan.highlight ? "translateY(-8px)" : "none",
                  background:
                    "linear-gradient(180deg, #ffffff 0%, #fffafa 100%)",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignSelf: "flex-start",
                    padding: "7px 12px",
                    borderRadius: 999,
                    background: plan.highlight ? "#c62828" : "#fff1f1",
                    color: plan.highlight ? "#fff" : "#9f1239",
                    fontSize: 12,
                    fontWeight: 900,
                    marginBottom: 16,
                  }}
                >
                  {plan.badge}
                </div>

                <h3 className="card-title">{plan.name}</h3>

                <p className="card-text" style={{ minHeight: 76 }}>
                  {plan.desc}
                </p>

                <div
                  style={{
                    marginTop: 18,
                    padding: 16,
                    borderRadius: 18,
                    background: "#f9fafb",
                    border: "1px solid #eef0f4",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      fontWeight: 800,
                      marginBottom: 6,
                    }}
                  >
                    UYGUN PROFİL
                  </div>

                  <div
                    style={{
                      fontSize: 16,
                      color: "#111827",
                      fontWeight: 900,
                    }}
                  >
                    {plan.idealFor}
                  </div>
                </div>

                <div style={{ marginTop: 20, display: "grid", gap: 11 }}>
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
                    href="/demo"
                    className="nav-cta"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      textAlign: "center",
                    }}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 34,
              padding: 28,
              borderRadius: 28,
              background:
                "linear-gradient(135deg, #fff7f7 0%, #ffffff 55%, #f9fafb 100%)",
              border: "1px solid rgba(198,40,40,0.14)",
              display: "grid",
              gridTemplateColumns: "minmax(0,1.2fr) minmax(260px,0.8fr)",
              gap: 20,
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  color: "#c62828",
                  fontWeight: 900,
                  fontSize: 13,
                  marginBottom: 8,
                }}
              >
                Size özel teklif modeli
              </div>

              <h3
                style={{
                  margin: 0,
                  fontSize: 28,
                  lineHeight: 1.2,
                  color: "#111827",
                }}
              >
                Net fiyatlandırma için önce ihtiyacı doğru analiz edelim.
              </h3>

              <p
                style={{
                  marginTop: 12,
                  color: "#6b7280",
                  lineHeight: 1.8,
                }}
              >
                Çalışan sayısı, modül kapsamı, firma/şube yapısı ve destek
                ihtiyacına göre işletmenize özel teklif hazırlanır.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              {[
                "Demo sonrası net kapsam",
                "Modül bazlı yapılandırma",
                "Kurumsal destek planı",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "#ffffff",
                    border: "1px solid #eef0f4",
                    fontWeight: 800,
                    color: "#374151",
                  }}
                >
                  ✓ {item}
                </div>
              ))}
            </div>
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
            Paket seçimini birlikte netleştirelim, işletmenize uygun demo
            akışını planlayalım.
          </p>

          <div className="hero-actions">
            <Link href="/demo" className="btn-primary">
              Demo Talep Et
            </Link>

            <Link href="/contact" className="btn-outline-light">
              Görüşme Planla
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}