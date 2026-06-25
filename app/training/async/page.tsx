import Link from "next/link";

const features = [
  {
    title: "Zaman Bağımsız Erişim",
    desc: "Çalışanlar eğitime vardiya, saha veya ofis programına göre istedikleri zaman erişebilir.",
  },
  {
    title: "Video Tabanlı Eğitim",
    desc: "Eğitim içerikleri dijital ortamda sunulur ve çalışanlar kendi hızında ilerleyebilir.",
  },
  {
    title: "Tamamlama Takibi",
    desc: "Başlayan, devam eden ve tamamlayan çalışanlar yönetim ekranlarında izlenebilir.",
  },
  {
    title: "Çalışan Bazlı Görünürlük",
    desc: "Her çalışanın eğitim durumu ayrı ayrı takip edilerek eksikler net şekilde görülebilir.",
  },
  {
    title: "Eğitim Geçmişi",
    desc: "Tamamlanan eğitimler ve süreç kayıtları kurumsal takip için düzenli hale gelir.",
  },
  {
    title: "Raporlama Altyapısı",
    desc: "Eğitim verileri yönetim raporları ve dashboard ekranlarına aktarılabilecek yapıda tutulur.",
  },
];

const steps = [
  {
    step: "01",
    title: "Eğitim İçeriği Hazırlanır",
    desc: "Video, doküman veya eğitim içeriği kurumsal eğitim yapısına uygun hale getirilir.",
  },
  {
    step: "02",
    title: "Çalışanlara Atanır",
    desc: "Eğitim ilgili çalışanlara veya gruplara atanır.",
  },
  {
    step: "03",
    title: "Çalışan Kendi Hızında Tamamlar",
    desc: "Çalışan eğitime uygun zamanda girer ve ilerlemesini tamamlar.",
  },
  {
    step: "04",
    title: "Yönetim Takip Eder",
    desc: "Tamamlayan, devam eden ve eksik kalan çalışanlar izlenir.",
  },
];

export default function AsyncTrainingPage() {
  return (
    <main>
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC Asenkron Eğitim</div>

          <h1 className="hero-title">
            Çalışanların Kendi Zamanında Tamamlayabileceği Dijital Eğitim Yapısı
          </h1>

          <p className="hero-desc">
            D-SEC Asenkron Eğitim yapısı; çalışanların eğitimlere zaman ve mekan
            bağımsız erişmesini, işletmenin ise tüm ilerleme ve tamamlama
            süreçlerini merkezi olarak takip etmesini sağlar.
          </p>

          <div className="hero-actions">
            <Link href="/contact" className="btn-primary">
              Demo Talep Et
            </Link>

            <Link href="/training" className="btn-outline-light">
              Eğitim Modülüne Dön
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">Asenkron Eğitim Neler Sağlar?</h2>
            <p className="section-subtitle">
              Özellikle vardiyalı, saha ağırlıklı veya çok lokasyonlu yapılarda
              eğitim takibini kolaylaştırır.
            </p>
          </div>

          <div className="grid-3">
            {features.map((item) => (
              <div key={item.title} className="card module-card">
                <div className="module-icon">✓</div>
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
            <h2 className="section-title">Asenkron Eğitim Akışı</h2>
            <p className="section-subtitle">
              İçerik hazırlamadan yönetim raporlamasına kadar süreç tek akışta
              ilerler.
            </p>
          </div>

          <div className="flow-grid">
            {steps.map((item) => (
              <div key={item.step} className="flow-card">
                <strong>{item.step} {item.title}</strong>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="training-problem-solution">
            <div className="training-problem-card problem">
              <span>Mevcut Zorluk</span>
              <h2>Çalışanların aynı anda eğitime katılması her zaman mümkün değildir.</h2>
              <p>
                Vardiya, saha görevi, izin, lokasyon farkı veya operasyon
                yoğunluğu nedeniyle eğitimlerin aynı anda verilmesi çoğu
                işletmede sürdürülebilir olmayabilir.
              </p>
            </div>

            <div className="training-problem-card solution">
              <span>D-SEC Çözümü</span>
              <h2>Eğitimler çalışanların erişebileceği dijital bir yapıya taşınır.</h2>
              <p>
                Çalışanlar uygun zamanda eğitime erişir; yönetim ise tamamlama,
                eksik kalan eğitim ve çalışan bazlı ilerleme durumunu sistemden
                takip eder.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="hero hero-cta-band">
        <div className="hero-inner hero-compact">
          <div className="hero-badge">Asenkron Eğitim Yönetimi</div>

          <h2 className="hero-title" style={{ fontSize: 42 }}>
            Eğitimleri Zaman Bağımsız ve İzlenebilir Hale Getirin
          </h2>

          <p className="hero-desc">
            D-SEC ile çalışan eğitimlerini dijitalleştirin, eksikleri görünür
            hale getirin ve yönetim için raporlanabilir bir yapı oluşturun.
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
    </main>
  );
}