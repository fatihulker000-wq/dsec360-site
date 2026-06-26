import Link from "next/link";

const demoTypes = [
  {
    title: "Açık Demo",
    badge: "GENEL İNCELEME",
    desc: "D-SEC’in genel modül mantığını ve kurumsal yaklaşımını incelemek isteyen ziyaretçiler için.",
    items: ["Genel yapı", "Eğitim yaklaşımı", "ÇBS mantığı", "Modül tanıtımları"],
    href: "/services",
    button: "Modülleri İncele",
  },
  {
    title: "Kısıtlı Demo",
    badge: "KONTROLLÜ ERİŞİM",
    desc: "Demo kullanıcı ile örnek firma ekranlarını ve temel iş akışlarını görmek isteyen firmalar için.",
    items: ["Demo kullanıcı", "Örnek firma", "Eğitim takibi", "Denetim ve raporlar"],
    href: "/contact",
    button: "Demo Talep Et",
    highlight: true,
  },
  {
    title: "Kurumsal Demo",
    badge: "ÖZEL SUNUM",
    desc: "Çok modüllü, çok kullanıcılı ve işletmeye özel canlı tanıtım isteyen kurumsal yapılar için.",
    items: ["Canlı sunum", "İhtiyaç analizi", "Yönetici dashboard", "Özel teklif süreci"],
    href: "/contact",
    button: "Görüşme Planla",
  },
];

const process = [
  "Demo talebi alınır",
  "Ön görüşme yapılır",
  "İhtiyaçlar belirlenir",
  "Demo erişimi veya canlı sunum planlanır",
  "Size özel çözüm ve teklif hazırlanır",
];

const modules = [
  "Eğitim Yönetimi",
  "Denetim",
  "Risk Analizi",
  "Sağlık Takibi",
  "ÇBS",
  "Dokümantasyon",
  "Dashboard",
  "Mobil Uygulama",
];

export default function DemoPage() {
  return (
    <main>
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC Kurumsal Demo</div>

          <h1 className="hero-title">D-SEC'i Canlı Olarak Deneyimleyin</h1>

          <p className="hero-desc">
            Eğitim, denetim, risk, sağlık, ÇBS ve yönetici dashboard yapısını
            gerçek kullanım senaryoları ile inceleyin. İşletmenize en uygun
            dijital İSG çözümünü birlikte planlayalım.
          </p>

          <div className="hero-actions">
            <Link href="/contact" className="btn-primary">
              Demo Talep Et
            </Link>

            <Link href="/services" className="btn-outline-light">
              Modülleri İncele
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">Demo Seçenekleri</h2>
            <p className="section-subtitle">
              İhtiyacınıza göre açık, kısıtlı veya kurumsal demo sürecini
              seçebilirsiniz.
            </p>
          </div>

          <div className="grid-3">
            {demoTypes.map((item) => (
              <div
                key={item.title}
                className="card"
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  border: item.highlight
                    ? "2px solid #c62828"
                    : "1px solid rgba(17,24,39,0.08)",
                  boxShadow: item.highlight
                    ? "0 28px 60px rgba(198,40,40,0.16)"
                    : "0 18px 46px rgba(15,23,42,0.08)",
                 transform: item.highlight ? "translateY(0)" : "none",
                  background:
                    "linear-gradient(180deg,#ffffff 0%,#fffafa 100%)",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignSelf: "flex-start",
                    padding: "7px 12px",
                    borderRadius: 999,
                    background: item.highlight ? "#c62828" : "#fff1f1",
                    color: item.highlight ? "#fff" : "#9f1239",
                    fontSize: 12,
                    fontWeight: 900,
                    marginBottom: 16,
                  }}
                >
                  {item.badge}
                </div>

                <h3 className="card-title">{item.title}</h3>
                <p className="card-text">{item.desc}</p>

                <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
                  {item.items.map((x) => (
                    <div
                      key={x}
                      style={{
                        padding: "11px 13px",
                        borderRadius: 14,
                        background: "#f9fafb",
                        border: "1px solid #eef0f4",
                        color: "#374151",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      ✓ {x}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "auto", paddingTop: 24 }}>
                  <Link
                    href={item.href}
                    className="nav-cta"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {item.button}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="page-container">
          <div className="grid-2" style={{ alignItems: "center" }}>
            <div>
              <div className="hero-badge" style={{ color: "#c62828" }}>
                Demo Süreci
              </div>

              <h2 className="section-title" style={{ textAlign: "left" }}>
                D-SEC Demo Süreci Nasıl İlerler?
              </h2>

              <p className="section-subtitle" style={{ textAlign: "left" }}>
                Demo süreci sadece ekran göstermek için değil, işletmenizin
                gerçek ihtiyacını anlamak için planlanır.
              </p>
            </div>

            <div className="card">
              <div style={{ display: "grid", gap: 14 }}>
                {process.map((item, index) => (
                  <div
                    key={item}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "42px 1fr",
                      gap: 14,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        background: "#c62828",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 900,
                      }}
                    >
                      {index + 1}
                    </div>

                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: 16,
                        background: "#f9fafb",
                        border: "1px solid #eef0f4",
                        fontWeight: 800,
                        color: "#374151",
                      }}
                    >
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">Demoda İncelenebilecek Alanlar</h2>
            <p className="section-subtitle">
              Web panel, mobil uygulama ve yönetici dashboard yapısını bütüncül
              olarak değerlendirin.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
              gap: 14,
            }}
          >
            {modules.map((item) => (
              <div
                key={item}
                style={{
                  padding: 18,
                  borderRadius: 20,
                  background: "#fff",
                  border: "1px solid #eef0f4",
                  boxShadow: "0 14px 34px rgba(15,23,42,0.06)",
                  fontWeight: 900,
                  color: "#1f2937",
                }}
              >
                <span style={{ color: "#c62828", marginRight: 8 }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hero hero-cta-band">
        <div className="hero-inner hero-compact">
          <div className="hero-badge">Canlı Tanıtım</div>

          <h2 className="hero-title" style={{ fontSize: 42 }}>
            İşletmeniz İçin D-SEC'i Birlikte İnceleyelim
          </h2>

          <p className="hero-desc">
            Demo talebi bırakın, işletmenizin yapısına uygun ekranları ve
            modülleri birlikte değerlendirelim.
          </p>

          <div className="hero-actions">
            <Link href="/contact" className="btn-primary">
              Demo Talep Et
            </Link>

            <Link href="/pricing" className="btn-outline-light">
              Paketleri İncele
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}