import Link from "next/link";

const demoCards = [
  {
    title: "Eğitim Modülü",
    desc: "Senkron ve asenkron eğitim yapısını, atama mantığını ve görünürlük yaklaşımını inceleyin.",
    href: "/training",
    button: "Eğitim Modülünü İncele",
  },
  {
    title: "ÇBS Yaklaşımı",
    desc: "Şikayet, öneri ve başvuru süreçlerinin dijital yapıda nasıl kurgulandığını görün.",
    href: "/cbs",
    button: "ÇBS Sayfasını İncele",
  },
  {
    title: "Kurumsal Yapı",
    desc: "D-SEC’in modüler yapısını, işletmelere sunduğu dijital yönetim mantığı ile değerlendirin.",
    href: "/services",
    button: "Hizmetleri Gör",
  },
];

const demoHighlights = [
  "Açık demo herkese açıktır ve genel sistem yaklaşımını gösterir.",
  "Kısıtlı demo talebinde kontrollü erişim bilgileri e-posta ile paylaşılır.",
  "Full demo sürecinde işletmenize özel daha geniş bir değerlendirme planlanır.",
];

export default function DemoPage() {
  return (
    <main>
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC Açık Demo</div>

          <h1 className="hero-title">
            D-SEC Yapısını Açık Demo ile İnceleyin
          </h1>

          <p className="hero-desc">
            Bu alan D-SEC’in genel yaklaşımını, modül mantığını ve kurumsal
            yapısını tanıtmak için hazırlanmıştır. Daha kapsamlı erişim için
            kısıtlı veya full demo talebi oluşturabilirsiniz.
          </p>

          <div className="hero-actions">
            <Link href="/contact" className="btn-primary">
              Kısıtlı / Full Demo Talep Et
            </Link>
            <Link href="/services" className="btn-outline-light">
              Hizmetleri Gör
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">Açık Demoda Neler Var?</h2>
            <p className="section-subtitle">
              Genel yapıyı inceleyin, sonra ihtiyacınıza uygun demo seviyesine geçin
            </p>
          </div>

          <div className="grid-3">
            {demoCards.map((item) => (
              <div key={item.title} className="card">
                <div className="card-icon" />
                <h3 className="card-title">{item.title}</h3>
                <p className="card-text">{item.desc}</p>

                <div style={{ marginTop: 18 }}>
                  <Link href={item.href} className="btn-primary">
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
          <div className="grid-2">
            <div className="card">
              <h3 className="card-title">Demo Katmanları</h3>
              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                {demoHighlights.map((item) => (
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
              <h3 className="card-title">Sonraki Adım</h3>
              <p className="card-text">
                Açık demodan sonra daha kontrollü erişim istiyorsanız kısıtlı
                demo, işletmenize özel detaylı değerlendirme istiyorsanız full
                demo talebi bırakabilirsiniz.
              </p>

              <p className="card-text">
                Böylece her ziyaretçi doğrudan tam erişim almaz, ancak doğru
                ilgiyi gösteren kullanıcılar için daha güçlü demo süreci açılır.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="hero">
        <div className="hero-inner">
          <h2 className="hero-title">
            İhtiyacınıza Uygun Demo Seviyesini Seçin
          </h2>

          <p className="hero-desc">
            Açık demoyu inceledikten sonra kısıtlı veya full demo talebiyle
            bir sonraki aşamaya geçebilirsiniz.
          </p>

          <div className="hero-actions">
            <Link href="/contact" className="btn-primary">
              Demo Talep Et
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
