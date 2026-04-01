import Link from "next/link";

const syncFeatures = [
  {
    title: "Canlı Eğitim Planlama",
    desc: "Eğitim tarihleri, saatleri ve oturum yapısı kurumsal takvime uygun şekilde planlanabilir.",
  },
  {
    title: "Katılım Takibi",
    desc: "Kimlerin eğitime katıldığı, kimlerin eksik kaldığı ve oturum bazlı durum bilgileri izlenebilir.",
  },
  {
    title: "Eğitmen Kontrollü Süreç",
    desc: "Canlı eğitimlerde eğitmen odaklı yönetim ile daha disiplinli ve ölçülebilir bir yapı sağlanır.",
  },
  {
    title: "Kurumsal Takvim Uyumu",
    desc: "Senkron eğitimler işletmenin operasyon takvimiyle uyumlu biçimde organize edilebilir.",
  },
  {
    title: "Kayıt ve Sonuç Görünürlüğü",
    desc: "Tamamlanan oturumlar, katılımcılar ve süreç bilgileri yönetim için görünür hale gelir.",
  },
  {
    title: "Raporlamaya Uygun Yapı",
    desc: "Katılım ve eğitim sonuçları daha sonra raporlama ve yönetim ekranlarına taşınabilir.",
  },
];

const syncSteps = [
  {
    step: "01",
    title: "Eğitimi Planla",
    desc: "Canlı eğitim tarihi, saati, eğitmen yapısı ve hedef katılımcı listesi oluşturulur.",
  },
  {
    step: "02",
    title: "Katılımcıları Belirle",
    desc: "İlgili çalışanlar eğitime atanır ve oturum bazlı görünürlük sağlanır.",
  },
  {
    step: "03",
    title: "Canlı Eğitimi Yürüt",
    desc: "Katılım, yoklama ve süreç yönetimi eş zamanlı olarak takip edilir.",
  },
  {
    step: "04",
    title: "Sonuçları İzle",
    desc: "Kimlerin katıldığı, kimlerin eksik kaldığı ve eğitim sonuçları kayıt altına alınır.",
  },
];

export default function SyncTrainingPage() {
  return (
    <main>
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">Senkron Eğitim</div>

          <h1 className="hero-title">
            Canlı ve Planlı Eğitim Yönetimini Merkezileştirin
          </h1>

          <p className="hero-desc">
            D-SEC Senkron Eğitim yapısı ile canlı oturumları planlayın, katılımı
            izleyin ve eğitim süreçlerini daha kontrollü ve kurumsal hale getirin.
          </p>

          <div className="hero-actions">
            <Link href="/contact" className="btn-primary">
              Demo Talep Et
            </Link>
            <Link href="/training" className="btn-outline-light">
              Eğitim Sayfasına Dön
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">Senkron Eğitim Neler Sunar?</h2>
            <p className="section-subtitle">
              Canlı eğitim süreçlerini daha planlı, daha görünür ve daha ölçülebilir hale getirir
            </p>
          </div>

          <div className="grid-3">
            {syncFeatures.map((item) => (
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
          <div className="section-title-wrap">
            <h2 className="section-title">Canlı Eğitim Akışı</h2>
            <p className="section-subtitle">
              Eğitimin planlanmasından katılım takibine kadar uçtan uca süreç görünürlüğü
            </p>
          </div>

          <div className="grid-2">
            {syncSteps.map((item) => (
              <div key={item.step} className="card">
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 16,
                    background: "#fee2e2",
                    color: "#b91c1c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 18,
                    marginBottom: 16,
                  }}
                >
                  {item.step}
                </div>

                <h3 className="card-title">{item.title}</h3>
                <p className="card-text">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hero">
        <div
          className="hero-inner"
          style={{ paddingTop: 72, paddingBottom: 72 }}
        >
          <h2 className="hero-title" style={{ fontSize: 40 }}>
            Canlı Eğitimleri Kurumsal Sisteme Dönüştürün
          </h2>

          <p className="hero-desc">
            Eğitimlerinizi yalnızca düzenlemekle kalmayın; katılım, takip ve
            görünürlük ile yönetim için anlamlı hale getirin.
          </p>

          <div className="hero-actions">
            <Link href="/contact" className="btn-primary">
              Kurumsal Demo İste
            </Link>

            <Link href="/services" className="btn-outline-light">
              Hizmetleri Gör
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
