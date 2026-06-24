import Link from "next/link";
import {
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  HeartPulse,
  Leaf,
  BarChart3,
  Factory,
  HardHat,
  Truck,
  Building2,
  Hospital,
  School,
} from "lucide-react";

const modules = [
  {
    title: "Ajanda ve Görev Yönetimi",
    icon: CalendarDays,
    desc: "Görev, ziyaret, saha planı ve kritik hatırlatmaları tek merkezden yönetin.",
  },
  {
    title: "Dijital Denetim Sistemi",
    icon: ClipboardCheck,
    desc: "Denetim, uygunsuzluk ve DÖF süreçlerini dijital yönetin.",
  },
  {
    title: "Eğitim Yönetim Platformu",
    icon: GraduationCap,
    desc: "Senkron ve asenkron eğitimleri merkezi olarak takip edin.",
  },
  {
    title: "Sağlık Takip Modülü",
    icon: HeartPulse,
    desc: "Muayene, EK-2 ve sağlık süreçlerini görünür hale getirin.",
  },
  {
    title: "ÇBS Kayıt Yönetimi",
    icon: Leaf,
    desc: "Çevre, öneri ve kayıt süreçlerini yönetin.",
  },
  {
    title: "Raporlama ve Analitik",
    icon: BarChart3,
    desc: "Yönetime özel dashboard ve rapor çıktıları oluşturun.",
  },
];

const targetSectors = [
  {
    title: "Üretim Tesisleri",
    icon: Factory,
    desc: "Saha denetimi, eğitim takibi, risk yönetimi ve aksiyon süreçlerini tek merkezde yönetin.",
  },
  {
    title: "Şantiyeler",
    icon: HardHat,
    desc: "Taşeron, çalışan, eğitim, uygunsuzluk ve saha kontrol süreçlerinde güçlü takip sağlayın.",
  },
  {
    title: "Lojistik Firmaları",
    icon: Truck,
    desc: "Depo, sevkiyat, sürücü, saha operasyonları ve güvenlik süreçlerini daha görünür hale getirin.",
  },
  {
    title: "Ofisler",
    icon: Building2,
    desc: "Ofis ergonomisi, eğitim, acil durum, çalışan kayıtları ve periyodik kontrolleri düzenli yönetin.",
  },
  {
    title: "Sağlık Kuruluşları",
    icon: Hospital,
    desc: "Personel eğitimleri, sağlık takipleri, denetim kayıtları ve dokümantasyon süreçlerini dijitalleştirin.",
  },
  {
    title: "Eğitim Kurumları",
    icon: School,
    desc: "Çalışan ve öğrenci güvenliği, acil durum planları, eğitim ve denetim kayıtlarını takip edin.",
  },
];

const trainingTypes = [
  {
    title: "Asenkron Eğitim",
    desc: "Çalışanlar eğitime istedikleri zaman erişir, kendi hızında tamamlar ve sistem üzerinden takip edilir.",
    href: "/training/async",
  },
  {
    title: "Senkron Eğitim",
    desc: "Canlı oturumlar, planlı eğitim yapısı ve katılım takibi ile daha kontrollü süreç yönetimi sunar.",
    href: "/training/sync",
  },
  {
    title: "Online Eğitim",
    desc: "Dijital erişim, eğitim linkleri ve merkezi platform yapısı ile kurumsal online eğitim kurgusu oluşturur.",
    href: "/training/online",
  },
];

const processSteps = [
  {
    step: "01",
    title: "Firmanızı ve Sürecinizi Tanımlayın",
    desc: "İSG, eğitim, sağlık, ÇBS ve denetim yapınızı işletmenize uygun modüllerle sisteme alın.",
  },
  {
    step: "02",
    title: "Verileri Tek Merkezde Toplayın",
    desc: "Çalışan kayıtları, saha işlemleri, eğitim durumları ve operasyonel veriler tek yapıda birleşsin.",
  },
  {
    step: "03",
    title: "Eksikleri ve Riskleri Anlık İzleyin",
    desc: "Açık aksiyonlar, eksik eğitimler, geciken süreçler ve kritik durumlar görünür hale gelsin.",
  },
  {
    step: "04",
    title: "Raporlayın ve Karar Alın",
    desc: "Yönetim ekranları, rapor çıktıları ve analiz panelleri ile daha güçlü ve hızlı aksiyon alın.",
  },
];

const entryPoints = [
  {
    title: "Kullanıcı Girişi",
    desc: "Çalışan, eğitim kullanıcısı, operatör ve firma yöneticileri tek kullanıcı giriş ekranından sisteme erişir.",
    href: "/login",
    cta: "Kullanıcı Girişine Git",
  },
  {
    title: "Admin Girişi",
    desc: "Sistem yönetimi, eğitim atamaları, katılımcı ekranları ve rapor alanları için güvenli admin erişimi kullanılır.",
    href: "/admin/login",
    cta: "Admin Girişine Git",
  },
  {
    title: "Demo Alanı",
    desc: "Kurumsal yapıyı ve ekran kurgusunu hızlıca incelemek için demo görünümü kullanılabilir.",
    href: "/demo",
    cta: "Demoyu İncele",
  },
];

export default function HomePage() {
  return (
    <main>
    
    <section className="home-premium-hero">
  <div className="page-container premium-hero-grid">
    <div className="premium-hero-content">
      <div className="premium-badge">
        D-SEC360 Kurumsal İSG Yönetim Platformu
      </div>

      <h1 className="premium-hero-title">
        İSG, Eğitim, Sağlık ve Denetim Süreçlerini Tek Platformda Yönetin
      </h1>

      <p className="premium-hero-desc">
        D-SEC360; eğitim yönetimi, dijital denetim, sağlık takibi, ÇBS,
        çalışan yönetimi ve kurumsal raporlamayı web ve mobil uyumlu tek
        yapıda birleştirir.
      </p>

      <div className="premium-hero-actions">
        <Link href="/demo" className="premium-primary-btn">
          Demo Talep Et
        </Link>

        <Link href="/contact" className="premium-secondary-btn">
          Teklif Al
        </Link>
      </div>

      <div className="premium-trust-list">
        <span>✓ Web + Mobil Uyumlu</span>
        <span>✓ Senkron & Asenkron Eğitim</span>
        <span>✓ Denetim & DÖF Yönetimi</span>
        <span>✓ Sağlık, Çevre ve Raporlama</span>
      </div>
    </div>

    <div className="premium-hero-visual">
      <div className="premium-dashboard-card">
        <div className="premium-dashboard-top">
          <span />
          <span />
          <span />
        </div>

        <div className="premium-dashboard-body">
          <div className="premium-side">
            <strong>D-SEC360</strong>
            <p>Dashboard</p>
            <p>Eğitimler</p>
            <p>Denetimler</p>
            <p>Çalışanlar</p>
            <p>Raporlar</p>
          </div>

          <div className="premium-main">
            <div className="premium-main-head">
              <div>
                <small>Yönetim Paneli</small>
                <h3>Kurumsal İSG Kontrol Merkezi</h3>
              </div>
              <b>Canlı</b>
            </div>

            <div className="premium-mini-stats">
              <div>
                <strong>428</strong>
                <p>Çalışan</p>
              </div>
              <div>
                <strong>36</strong>
                <p>Eğitim</p>
              </div>
              <div>
                <strong>24</strong>
                <p>Açık Aksiyon</p>
              </div>
            </div>

            <div className="premium-lines">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      <section className="section section-light">
        <div className="page-container">
          <div className="section-title-wrap">
         <h2 className="section-title">Platforma Nasıl Başlarsınız?</h2>

<p className="section-subtitle">
  Kullanıcı, firma yöneticisi ve admin tarafı için ayrıştırılmış giriş yapısıyla
  D-SEC’e hızlı ve kontrollü şekilde başlayın.
</p>
          </div>

          <div className="grid-3 entry-grid">
  {entryPoints.map((item) => (
    <div key={item.title} className="card entry-card">
      <div className="card-icon" />
      <h3 className="card-title">{item.title}</h3>
      <p className="card-text">{item.desc}</p>

      <div style={{ marginTop: 18 }}>
        <Link href={item.href} className="nav-cta entry-cta">
          {item.cta}
        </Link>
      </div>
    </div>
  ))}
</div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="page-container">
          <div className="grid-3">
            <div className="card">
            <p className="card-text" style={{ marginTop: 0 }}>
  Kurumsal Yapı
</p>
<h3 className="card-title">Tek Merkezden Yönetim</h3>
<p className="card-text">
  Eğitim, denetim, sağlık ve kayıt süreçlerini ayrı araçlar yerine tek platformdan yönetin.
</p>
            </div>

            <div className="card">
             <p className="card-text" style={{ marginTop: 0 }}>
  Operasyonel Kontrol
</p>
<h3 className="card-title">Saha ve Ofis Entegrasyonu</h3>
<p className="card-text">
  Saha verilerini ofis takibi ve yönetim görünürlüğü ile aynı akışta birleştirir.
</p>
            </div>

            <div className="card">
              <p className="card-text" style={{ marginTop: 0 }}>
  Yönetim Gücü
</p>
<h3 className="card-title">Raporlama ve Analitik</h3>
<p className="card-text">
  Yönetim için sadece veri değil, yorumlanabilir ve aksiyon alınabilir çıktılar üretir.
</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">D-SEC Modülleri</h2>
            <p className="section-subtitle">
              İş süreçlerinizi dijital olarak yönetecek temel modüller
            </p>
          </div>

<div className="grid-3">
  {modules.map((item) => {
    const Icon = item.icon;

    return (
      <div key={item.title} className="card module-card">
        <div className="module-icon">
          <Icon size={30} />
        </div>

        <h3 className="card-title">{item.title}</h3>
        <p className="card-text">{item.desc}</p>
      </div>
    );
  })}
</div>
</div>
</section>

<section className="section platform-overview-section">
  <div className="page-container">
    <div className="section-title-wrap">
      <h2 className="section-title">
        D-SEC360 Platformunda Neler Var?
      </h2>

      <p className="section-subtitle">
        Eğitimden denetime, çalışan yönetiminden sağlık ve çevre süreçlerine
        kadar tüm operasyonlar tek platform altında birleşir.
      </p>
    </div>

    <div className="platform-overview-grid">

      <div className="platform-overview-card">
        <h3>📚 Eğitim Yönetimi</h3>
        <p>
          Senkron, asenkron ve online eğitim süreçlerini çalışan bazlı yönetin.
        </p>
      </div>

      <div className="platform-overview-card">
        <h3>🔎 Dijital Denetim</h3>
        <p>
          Mobil saha denetimleri, uygunsuzluklar ve DÖF süreçlerini takip edin.
        </p>
      </div>

      <div className="platform-overview-card">
        <h3>❤️ Sağlık Takibi</h3>
        <p>
          EK-2, muayene ve çalışan sağlık kayıtlarını merkezi yönetin.
        </p>
      </div>

      <div className="platform-overview-card">
        <h3>👷 Çalışan Yönetimi</h3>
        <p>
          Personel bilgileri, eğitim geçmişi ve yetkilendirmeleri tek noktadan yönetin.
        </p>
      </div>

      <div className="platform-overview-card">
        <h3>♻️ ÇBS Süreçleri</h3>
        <p>
          Çevre kayıtları, öneri sistemleri ve sürdürülebilirlik süreçlerini takip edin.
        </p>
      </div>

      <div className="platform-overview-card">
        <h3>📊 Yönetim Dashboardları</h3>
        <p>
          Üst yönetim için anlık raporlar ve karar destek ekranları oluşturun.
        </p>
      </div>
 
    </div>
  </div>
</section>

<section className="section section-soft">
  <div className="page-container">
    <div className="section-title-wrap">
      <h2 className="section-title">Gerçek D-SEC360 Ekranları</h2>
      <p className="section-subtitle">
  Dashboard, eğitim, denetim, sağlık, çalışan ve raporlama ekranlarıyla
  D-SEC360’ın kurumsal yönetim gücünü yakından inceleyin.
</p>
    </div>

    <div className="product-screen-grid">
      <div className="product-screen-card large">
        <div className="screen-top">
          <span>Dashboard</span>
          <strong>Yönetim Paneli</strong>
        </div>

        <div className="screen-body">
          <div className="screen-metric-row">
            <div>
              <strong>428</strong>
              <p>Çalışan</p>
            </div>
            <div>
              <strong>36</strong>
              <p>Eğitim</p>
            </div>
            <div>
              <strong>24</strong>
              <p>Açık Aksiyon</p>
            </div>
          </div>

          <div className="screen-bars">
            <span style={{ height: "72%" }} />
            <span style={{ height: "46%" }} />
            <span style={{ height: "84%" }} />
            <span style={{ height: "58%" }} />
            <span style={{ height: "76%" }} />
          </div>
        </div>
      </div>

      <div className="product-screen-card">
        <div className="screen-top">
          <span>Eğitim</span>
          <strong>Katılım Takibi</strong>
        </div>

        <div className="screen-list">
          <p>
            <b>Temel İSG Eğitimi</b>
            <small>%86 tamamlandı</small>
          </p>
          <p>
            <b>Yangın Eğitimi</b>
            <small>%72 tamamlandı</small>
          </p>
          <p>
            <b>Acil Durum Eğitimi</b>
            <small>%91 tamamlandı</small>
          </p>
        </div>
      </div>

      <div className="product-screen-card">
        <div className="screen-top">
          <span>Denetim</span>
          <strong>DÖF ve Bulgu Yönetimi</strong>
        </div>

        <div className="screen-status-list">
          <div>
            <span className="dot red" /> Açık Uygunsuzluk
          </div>
          <div>
            <span className="dot orange" /> Devam Eden Aksiyon
          </div>
          <div>
            <span className="dot green" /> Kapatılan Faaliyet
          </div>
        </div>
      </div>

      <div className="product-screen-card">
        <div className="screen-top">
          <span>Sağlık</span>
          <strong>Muayene & EK-2</strong>
        </div>

        <div className="screen-health-box">
          <strong>Periyodik Takip</strong>
          <p>
            Muayene, sağlık evrakları ve çalışan bazlı takip kayıtları tek panelde.
          </p>
        </div>
      </div>

      <div className="product-screen-card">
        <div className="screen-top">
          <span>Raporlama</span>
          <strong>Kurumsal Çıktılar</strong>
        </div>

        <div className="screen-report-lines">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  </div>
</section>

<section className="section section-light">
  <div className="page-container">

    <div className="section-title-wrap">
      <h2 className="section-title">
        Kimler İçin Tasarlandı?
      </h2>

      <p className="section-subtitle">
        D-SEC360 farklı sektörlerin ihtiyaçlarına uyum sağlayan esnek yapıya sahiptir.
      </p>
    </div>

    <div className="grid-3">
      {targetSectors.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.title} className="card sector-card">
            <div className="sector-icon">
              <Icon size={30} />
            </div>

            <h3 className="card-title">{item.title}</h3>

            <p className="card-text">
              {item.desc}
            </p>
          </div>
        );
      })}
    </div>

  </div>
</section>

      <section className="section dsec-value-section">
  <div className="page-container">
    <div className="section-title-wrap">
      <h2 className="section-title">D-SEC360 Size Ne Kazandırır?</h2>
      <p className="section-subtitle">
        D-SEC360 sadece kayıt tutmaz; İSG süreçlerinizi ölçülebilir, izlenebilir
        ve yönetilebilir hale getirir.
      </p>
    </div>

    <div className="dsec-value-grid">
      <div className="dsec-value-card">
        <span>01</span>
        <h3>Eğitim Takibinde Kontrol</h3>
        <p>
          Senkron ve asenkron eğitimleri çalışan bazlı takip edin; eksik,
          tamamlanan ve geciken eğitimleri tek ekranda görün.
        </p>
      </div>

      <div className="dsec-value-card">
        <span>02</span>
        <h3>Denetim ve DÖF Yönetimi</h3>
        <p>
          Saha denetimleri, uygunsuzluklar, aksiyonlar ve kapatma süreçleri
          dijital olarak kayıt altında ilerler.
        </p>
      </div>

      <div className="dsec-value-card">
        <span>03</span>
        <h3>Sağlık ve EK-2 Takibi</h3>
        <p>
          Muayene, sağlık evrakları, periyodik takipler ve çalışan bazlı sağlık
          kayıtları daha görünür hale gelir.
        </p>
      </div>

      <div className="dsec-value-card">
        <span>04</span>
        <h3>Yönetim İçin Net Raporlama</h3>
        <p>
          Eğitim, denetim, çalışan, sağlık ve ÇBS verileri yönetime uygun
          özetlerle raporlanır.
        </p>
      </div>
    </div>
  </div>
</section>

<section className="section section-soft">
  <div className="page-container" style={{ textAlign: "center" }}>
    <div className="section-title-wrap">
      <h2 className="section-title">
        Her Ölçekteki İşletme İçin Uygun Çözüm
      </h2>

      <p className="section-subtitle">
        İhtiyacınıza uygun modüller ve kullanım yapısı ile işletmenize özel
        D-SEC çözümünü oluşturun.
      </p>
    </div>

    <div className="package-grid">
      <div className="card package-card">
        <h3 className="card-title">Başlangıç</h3>

        <p className="card-text">
          Küçük ve orta ölçekli işletmeler için temel eğitim, denetim ve
          çalışan yönetim altyapısı.
        </p>

        <div className="package-badge">Temel Modüller</div>
      </div>

      <div className="card package-card package-featured">
        <div className="package-top-label">EN ÇOK TERCİH EDİLEN</div>

        <h3 className="card-title">Profesyonel</h3>

        <p className="card-text">
          Birden fazla süreci yöneten işletmeler için gelişmiş raporlama,
          yetkilendirme ve operasyon yönetimi.
        </p>

        <div className="package-badge featured">Gelişmiş Yönetim</div>
      </div>

      <div className="card package-card">
        <h3 className="card-title">Kurumsal</h3>

        <p className="card-text">
          Çok lokasyonlu yapılar, özel entegrasyonlar ve kurumsal ihtiyaçlar
          için özelleştirilebilir çözüm.
        </p>

        <div className="package-badge">Özel Yapılandırma</div>
      </div>
    </div>

    <div style={{ marginTop: 26 }}>
      <Link href="/contact" className="nav-cta">
        Demo Talep Et
      </Link>
    </div>
  </div>
</section>

      <section className="section section-soft">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">Eğitim Modülü Öne Çıkan Yapılar</h2>
            <p className="section-subtitle">
              Eğitim süreçleri tek başlık altında değil, doğru yapıya göre
              ayrıştırılarak yönetilir
            </p>
          </div>

          <div className="grid-3">
            {trainingTypes.map((item) => (
              <div key={item.title} className="card">
                <div className="card-icon" />
                <h3 className="card-title">{item.title}</h3>
                <p className="card-text">{item.desc}</p>

                <div style={{ marginTop: 18 }}>
                  <Link href={item.href} className="nav-cta">
                    İncele
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 28 }}>
            <Link href="/training" className="nav-cta">
              Eğitim Modülünü Detaylı Gör
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">D-SEC Nasıl Çalışır?</h2>
            <p className="section-subtitle">
              Kurumsal süreçlerinizi daha yönetilebilir hale getiren akış yapısı
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

     <section className="hero hero-cta-band">
  <div className="hero-inner hero-compact">
    <div className="hero-badge">Kurumsal Demo ve Teklif Süreci</div>

    <h2 className="hero-title" style={{ fontSize: 42 }}>
      İSG Süreçlerinizi Daha Güçlü,
      <br />
      Daha Görünür ve Daha Yönetilebilir Hale Getirin
    </h2>

    <p className="hero-desc">
      D-SEC ile eğitim, denetim, sağlık ve kayıt süreçlerinizi tek yapıda toplayın;
      yönetime güven veren, sahaya hız kazandıran kurumsal bir sistem kurun.
    </p>

    <div className="hero-actions">
      <Link href="/demo" className="btn-primary">
        Ücretsiz Demo Talep Et
      </Link>

      <Link href="/contact" className="btn-outline-light">
        Kurumsal Teklif Al
      </Link>
    </div>
  </div>
</section>
    </main>
  );
}