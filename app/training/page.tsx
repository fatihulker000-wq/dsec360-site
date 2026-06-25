import Link from "next/link";

const trainingTypes = [
  {
    title: "Asenkron Eğitimler",
    desc: "Çalışanlar eğitime istedikleri zaman erişir, kendi hızında tamamlar ve sistem üzerinden ilerleme durumu izlenir.",
    points: [
      "Zaman bağımsız erişim",
      "Tamamlanma takibi",
      "Çalışan bazlı görünürlük",
    ],
  },
  {
    title: "Senkron Eğitimler",
    desc: "Canlı oturum, eğitmen eşliğinde planlanan eğitim yapısı ile katılım ve zaman yönetimi daha kontrollü hale gelir.",
    points: [
      "Canlı eğitim planlama",
      "Katılım kontrolü",
      "Tarih ve oturum yönetimi",
    ],
  },
];

const whyDsecItems = [
  {
    title: "Dağınık Yapıyı Toplar",
    desc: "Excel, WhatsApp, e-posta ve farklı platformlara dağılmış eğitim süreçlerini tek merkezde birleştirir.",
  },
  {
    title: "Eksikleri Net Gösterir",
    desc: "Kim eğitim aldı, kim eksik, kim tamamladı gibi kritik bilgiler yöneticiler için görünür hale gelir.",
  },
  {
    title: "Denetime Hazır Hale Getirir",
    desc: "Eğitim geçmişi, katılım durumu ve gelişen belge yapısı sayesinde denetim süreçleri daha güçlü yönetilir.",
  },
];

const moduleFeatures = [
  {
    title: "Çalışan Bazlı Takip",
    desc: "Hangi çalışanın hangi eğitimi aldığı, tamamladığı veya eksik bıraktığı tek görünümde izlenebilir.",
  },
  {
    title: "Tamamlama ve Katılım Yönetimi",
    desc: "Eğitim süreçleri yalnızca açılmış değil, gerçekten tamamlanmış ve raporlanabilir hale getirilir.",
  },
  {
    title: "Belge ve Sertifika Kurgusu",
    desc: "Katılım formu, sertifika ve eğitim dokümanları ileride aynı akış içinde yönetilebilecek şekilde yapılandırılır.",
  },
  {
    title: "Kurumsal Planlama",
    desc: "Eğitimlerin türü, zamanı, hedef çalışan grubu ve durum bilgileri daha düzenli bir yapıda planlanır.",
  },
  {
    title: "Eksik Eğitim Görünürlüğü",
    desc: "Henüz tamamlanmamış veya atanmış ancak başlanmamış eğitimler yöneticiler için görünür hale gelir.",
  },
  {
    title: "Raporlama Uyumlu Yapı",
    desc: "Eğitim verileri, yönetim paneli ve ileri seviye raporlama ekranlarına taşınabilecek şekilde kurgulanır.",
  },
];

const processSteps = [
  {
    step: "01",
    title: "Eğitimi Tanımla",
    desc: "Eğitimin türü asenkron veya senkron olarak belirlenir ve kurumsal yapıya uygun şekilde hazırlanır.",
  },
  {
    step: "02",
    title: "Çalışana Ata",
    desc: "Eğitim ilgili çalışanlara veya gruplara atanır, erişim ve görünürlük merkezi panel üzerinden sağlanır.",
  },
  {
    step: "03",
    title: "Katılımı ve Süreci İzle",
    desc: "Başladı, devam ediyor, tamamlandı veya eksik kaldı gibi tüm durumlar sistem üzerinden takip edilir.",
  },
  {
    step: "04",
    title: "Belgele ve Raporla",
    desc: "Eğitim sonuçları, eksik listeleri ve çalışan bazlı durumlar yönetim ekranlarında değerlendirilebilir hale gelir.",
  },
];

const targetGroups = [
  "İş güvenliği uzmanları",
  "İnsan kaynakları ekipleri",
  "Firma yöneticileri",
  "Saha ve operasyon ekipleri",
  "Danışmanlık ve kurumsal yapı kullanan işletmeler",
  "Merkezi eğitim takibi isteyen kurumlar",
];

export default function TrainingPage() {
  return (
    <main>
      <section className="hero">
        <div
          className="hero-inner"
          style={{ paddingTop: 88, paddingBottom: 88 }}
        >
          <div className="hero-badge">D-SEC Eğitim Yönetim Sistemi</div>

          <h1 className="hero-title">
            Senkron ve Asenkron Eğitimleri Tek Platformdan Yönetin
          </h1>

          <p className="hero-desc">
            D-SEC Eğitim Modülü; çalışan eğitimlerini planlama, atama, katılım
            takibi, tamamlama yönetimi ve raporlama süreçlerini tek sistemde
            birleştirerek kurumsal eğitim yapınızı daha görünür ve daha
            yönetilebilir hale getirir.
          </p>

          <div className="hero-actions">
            <Link href="/contact" className="btn-primary">
              Kurumsal Demo İste
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
            <h2 className="section-title">Eğitim Türleri</h2>
            <p className="section-subtitle">
              Kurum yapınıza uygun iki temel eğitim modeli tek modül mantığında
              bir araya gelir
            </p>
          </div>

          <div className="grid-2">
            {trainingTypes.map((item) => (
              <div key={item.title} className="card">
                <div className="card-icon" />
                <h3 className="card-title">{item.title}</h3>
                <p className="card-text">{item.desc}</p>

                <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
                  {item.points.map((point) => (
                    <div
                      key={point}
                      style={{
                        fontSize: 14,
                        color: "#374151",
                        fontWeight: 600,
                      }}
                    >
                      • {point}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">Neden D-SEC Eğitim Modülü?</h2>
            <p className="section-subtitle">
              Sadece eğitim açmaz, eğitim sürecini yönetilebilir hale getirir
            </p>
          </div>

          <div className="grid-3">
            {whyDsecItems.map((item) => (
              <div key={item.title} className="card">
                <div className="card-icon" />
                <h3 className="card-title">{item.title}</h3>
                <p className="card-text">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">Sistem Nasıl Çalışır?</h2>
            <p className="section-subtitle">
              Eğitim sürecini yalnızca açmak değil, uçtan uca yönetmek hedeflenir
            </p>
          </div>

          <div className="grid-2">
            {processSteps.map((item) => (
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

      <section className="section section-soft">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">Eğitim Modülü Neler Sunar?</h2>
            <p className="section-subtitle">
              D-SEC Eğitim Modülü yalnızca içerik göstermez, eğitim yönetimini
              kurumsal hale getirir
            </p>
          </div>

          <div className="grid-3">
            {moduleFeatures.map((item) => (
              <div key={item.title} className="card">
                <div className="card-icon" />
                <h3 className="card-title">{item.title}</h3>
                <p className="card-text">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-light">
  <div className="page-container">
    <div className="training-problem-solution">
      <div className="training-problem-card problem">
        <span>Mevcut Sorun</span>

        <h2>
          Eğitim süreçleri çoğu işletmede dağınık ve takip edilmesi zor ilerler.
        </h2>

        <p>
          Eğitim kayıtları farklı dosyalarda, katılım listeleri ayrı kanallarda,
          tamamlanma durumları ise çoğu zaman manuel takip edilir. Bu durum
          denetim dönemlerinde eksiklerin geç fark edilmesine neden olur.
        </p>
      </div>

      <div className="training-problem-card solution">
        <span>D-SEC Çözümü</span>

        <h2>
          Eğitim planlama, atama, tamamlama ve raporlama tek merkezde birleşir.
        </h2>

        <p>
          D-SEC Eğitim Modülü ile çalışan bazlı eğitim görünürlüğü sağlanır.
          Eksik eğitimler, devam eden süreçler ve tamamlanan kayıtlar yönetici
          ekranlarında daha net takip edilir.
        </p>
      </div>
    </div>
  </div>
</section>

      <section className="section section-light">
        <div className="page-container">
          <div className="grid-2">
            <div className="card">
              <h3 className="card-title">Kimler İçin Uygundur?</h3>
              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                {targetGroups.map((item) => (
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
              <h3 className="card-title">Kurumsal Hedef</h3>
              <p className="card-text">
                Eğitim süreçlerinin dağınık listelerle değil, çalışan bazlı
                görünürlük, eksik eğitim takibi, katılım ve tamamlama mantığı
                ile yönetilmesi hedeflenir.
              </p>

              <p className="card-text">
                Böylece eğitim modülü; İSG süreçleri, insan kaynakları yönetimi
                ve kurumsal gelişim planlarıyla uyumlu bir yapıya dönüşür.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="hero">
        <div
          className="hero-inner"
          style={{ paddingTop: 72, paddingBottom: 72 }}
        >
          <h2 className="hero-title" style={{ fontSize: 42 }}>
            Eğitim Süreçlerinizi Dijital ve İzlenebilir Hale Getirin
          </h2>

          <p className="hero-desc">
            Senkron ve asenkron eğitim kurgusunu tek platformda toplayarak
            çalışan gelişimini, katılım durumunu ve eğitim eksiklerini merkezi
            olarak yönetin.
          </p>

          <div className="hero-actions">
            <Link href="/contact" className="btn-primary">
              Eğitim Modülü İçin İletişime Geç
            </Link>
            <Link href="/services" className="btn-outline-light">
              Tüm Hizmetleri Gör
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}