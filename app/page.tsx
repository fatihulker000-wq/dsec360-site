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
  ShieldCheck,
  FileText,
  Users,
  AlertTriangle,
  Bot,
  Activity,
  ClipboardList,
  Stethoscope,
  Smartphone,
  Cloud,
} from "lucide-react";

const modules = [
  {
    title: "Eğitim Yönetimi",
    icon: GraduationCap,
    desc: "Senkron, asenkron ve online eğitimleri çalışan bazlı atayın, takip edin ve raporlayın.",
  },
  {
    title: "Dijital Denetim",
    icon: ClipboardCheck,
    desc: "Saha denetimleri, fotoğraflı kayıtlar, uygunsuzluklar ve DÖF süreçlerini dijital yönetin.",
  },
  {
    title: "Risk Yönetimi",
    icon: AlertTriangle,
    desc: "Fine-Kinney, 5x5 matris ve gelişmiş risk analizleriyle tehlikeleri görünür hale getirin.",
  },
  {
    title: "Sağlık Takibi",
    icon: HeartPulse,
    desc: "EK-2, işe giriş/periyodik muayene ve çalışan sağlık süreçlerini merkezi takip edin.",
  },
  {
    title: "ÇBS Yönetimi",
    icon: Leaf,
    desc: "Şikayet, öneri, çevre kayıtları ve başvuru süreçlerini kurumsal şekilde yönetin.",
  },
  {
    title: "Yönetici Dashboard",
    icon: BarChart3,
    desc: "Eğitim, denetim, ÇBS, risk ve aksiyon durumlarını tek ekrandan izleyin.",
  },
  {
    title: "Çalışan Yönetimi",
    icon: Users,
    desc: "Çalışan bilgileri, görevler, eğitim geçmişi ve yetkilendirmeleri tek merkezde toplayın.",
  },
  {
    title: "Dokümantasyon",
    icon: FileText,
    desc: "Formlar, talimatlar, kurul kayıtları, raporlar ve arşiv dokümanlarını düzenli yönetin.",
  },
  {
    title: "Ajanda ve Hatırlatmalar",
    icon: CalendarDays,
    desc: "Eğitim, denetim, sağlık, tatbikat ve kritik görevleri planlı şekilde takip edin.",
  },
  {
    title: "Kaza/Olay Yönetimi",
    icon: Activity,
    desc: "Kaza, ramak kala ve olay kayıtlarını analiz edilebilir şekilde yönetin.",
  },
  {
    title: "Mobil Uygulama",
    icon: Smartphone,
    desc: "Saha ekiplerinin eğitim, denetim, sağlık ve görev süreçlerine mobil erişmesini sağlayın.",
  },
  {
    title: "DORA AI",
    icon: Bot,
    desc: "İSG kurulum, risk analizi, eğitim planlama ve yönetici özetlerinde yapay zekâ desteği alın.",
  },
];

const stats = [
  {
    value: "30+",
    label: "Kurumsal Modül",
  },
  {
    value: "100+",
    label: "Rapor ve Doküman Çıktısı",
  },
  {
    value: "20+",
    label: "Dijital İSG Süreci",
  },
  {
    value: "7/24",
    label: "Bulut Erişimi",
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
  
];

const platformBenefits = [
  {
    title: "Tek Platform",
    desc: "Eğitim, denetim, sağlık, risk, ÇBS ve raporlama süreçlerini ayrı dosyalar yerine tek sistemde yönetin.",
    icon: ShieldCheck,
  },
  {
    title: "Web + Mobil",
    desc: "Yönetim web panelinden, saha süreçleri mobil uygulamadan takip edilir.",
    icon: Smartphone,
  },
  {
    title: "Bulut Tabanlı",
    desc: "Verilere yetki dahilinde her yerden erişin, süreçleri gerçek zamanlı izleyin.",
    icon: Cloud,
  },
  {
    title: "Yapay Zekâ Desteği",
    desc: "DORA ile kurulum, risk, eğitim ve yönetici özetlerinde karar desteği alın.",
    icon: Bot,
  },
  {
    title: "Denetim Standardı",
    desc: "Saha kontrol, uygunsuzluk, DÖF ve raporlama süreçlerinde kurumsal standart oluşturun.",
    icon: ClipboardList,
  },
  {
    title: "Sağlık Görünürlüğü",
    desc: "Çalışan sağlığı, muayene ve EK-2 süreçlerini görünür ve takip edilebilir hale getirin.",
    icon: Stethoscope,
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
        İş Sağlığı, Güvenliği ve Çevre Yönetimini Tek Platformdan Yönetin
      </h1>

      <p className="premium-hero-desc">
        Eğitim, denetim, risk yönetimi, sağlık takibi, ÇBS, dokümantasyon ve
        yönetici raporlamasını web ve mobil uyumlu tek bir bulut platformunda
        birleştirin.
      </p>

      <div className="premium-hero-actions">
        <Link href="/demo" className="premium-primary-btn">
          Ücretsiz Demo Planla
        </Link>

        <Link href="/contact" className="premium-secondary-btn">
          Canlı Sunum Talep Et
        </Link>
      </div>

      <div className="premium-trust-list">
        <span>✓ 30+ Kurumsal Modül</span>
        <span>✓ Web + Android</span>
        <span>✓ Bulut Altyapısı</span>
        <span>✓ Yapay Zekâ Destekli</span>
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
            <p>Risk</p>
            <p>ÇBS</p>
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
      <h2 className="section-title">
        Sayılarla D-SEC360
      </h2>

      <p className="section-subtitle">
        İşletmelerin İSG süreçlerini dijitalleştirmek için geliştirilen kapsamlı platform.
      </p>
    </div>

    <div className="stats-grid">

      {stats.map((item) => (

        <div
          key={item.label}
          className="stats-card"
        >
          <h3>{item.value}</h3>

          <p>{item.label}</p>

        </div>

      ))}

    </div>

  </div>
</section>

      <section className="section section-soft">
  <div className="page-container">
    <div className="section-title-wrap">
      <h2 className="section-title">
        Tek Platform, Tüm İSG Süreçleri
      </h2>

      <p className="section-subtitle">
        D-SEC360; eğitim, denetim, risk, sağlık, ÇBS ve raporlama süreçlerini
        ayrı araçlara dağılmadan tek merkezde birleştirir.
      </p>
    </div>

    <div className="grid-3">
      {platformBenefits.map((item) => {
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
      <h2 className="section-title">
        D-SEC360 Ekranları
      </h2>

      <p className="section-subtitle">
        Web panel, eğitim, denetim, risk ve mobil uygulama ekranlarıyla
        D-SEC360’ın kurumsal yönetim gücünü yakından inceleyin.
      </p>
    </div>

    <div className="home-screen-showcase">
      <div className="home-screen-main">
        <div className="screen-browser-bar">
          <span />
          <span />
          <span />
          <strong>CEO Dashboard</strong>
        </div>

        <div className="screen-image-placeholder">
          <img
            src="/dsec-screens/dashboard.png"
            alt="D-SEC360 Dashboard"
          />
        </div>
      </div>

      <div className="home-screen-side">
        {[
          {
            title: "Eğitim Yönetimi",
            desc: "Atama, katılım, tamamlama ve raporlama.",
            img: "/dsec-screens/training.png",
          },
          {
            title: "Dijital Denetim",
            desc: "Saha kontrolü, uygunsuzluk ve DÖF takibi.",
            img: "/dsec-screens/inspection.png",
          },
          {
            title: "Risk Yönetimi",
            desc: "Fine-Kinney, 5x5 matris ve aksiyon takibi.",
            img: "/dsec-screens/risk.png",
          },
          {
            title: "Mobil Uygulama",
            desc: "Saha ekipleri için Android erişimi.",
            img: "/dsec-screens/mobile.png",
          },
        ].map((item) => (
          <div key={item.title} className="home-screen-mini">
            <div className="mini-screen-thumb">
              <img src={item.img} alt={item.title} />
            </div>

            <div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
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

      

<section className="section section-soft">
  <div className="page-container">

    <div className="section-title-wrap">
      <h2 className="section-title">
        D-SEC360 Çözüm Modelleri
      </h2>

      <p className="section-subtitle">
        İşletmenizin büyüklüğüne ve operasyon yapısına uygun esnek çözümler sunuyoruz.
      </p>
    </div>

    <div className="package-grid">

      <div className="card package-card">
        <div className="package-badge">
          KOBİ
        </div>

        <h3 className="card-title">
          Küçük ve Orta Ölçekli İşletmeler
        </h3>

        <p className="card-text">
          Eğitim, denetim, çalışan yönetimi ve temel İSG süreçlerini hızlı
          şekilde dijital ortama taşıyın.
        </p>
      </div>

      <div className="card package-card package-featured">

        <div className="package-top-label">
          EN ÇOK TERCİH EDİLEN
        </div>

        <div className="package-badge featured">
          KURUMSAL
        </div>

        <h3 className="card-title">
          Orta ve Büyük Ölçekli İşletmeler
        </h3>

        <p className="card-text">
          Çok lokasyonlu yapı, gelişmiş raporlama, yetkilendirme,
          yönetici dashboardları ve mobil saha yönetimi.
        </p>

      </div>

      <div className="card package-card">

        <div className="package-badge">
          ENTERPRISE
        </div>

        <h3 className="card-title">
          Holding ve Grup Şirketleri
        </h3>

        <p className="card-text">
          Çok firma yönetimi, merkezi kontrol, özel entegrasyonlar,
          DORA AI destekli analizler ve kurumsal çözümler.
        </p>

      </div>

    </div>

    <div style={{ marginTop: 34, textAlign: "center" }}>
      <Link href="/contact" className="nav-cta">
        İşletmenize Uygun Çözümü Birlikte Planlayalım
      </Link>
    </div>

  </div>
</section>

{/* D-SEC360 Size Ne Kazandırır */}

<section className="section section-soft">
  <div className="page-container">

    <div className="section-title-wrap">
      <h2 className="section-title">
        D-SEC360 Size Ne Kazandırır?
      </h2>

      <p className="section-subtitle">
        Tüm İSG süreçlerini tek platformda birleştirerek işletmenize hız,
        görünürlük ve yönetim kolaylığı sağlar.
      </p>
    </div>

    <div className="timeline-grid">

      <div className="timeline-card">
        <span>01</span>
        <h3>Eğitim Yönetimi</h3>
        <p>Çalışan eğitimlerini planlayın, takip edin ve raporlayın.</p>
      </div>

      <div className="timeline-card">
        <span>02</span>
        <h3>Dijital Denetim</h3>
        <p>Mobil saha denetimleri ve DÖF süreçlerini yönetin.</p>
      </div>

      <div className="timeline-card">
        <span>03</span>
        <h3>Risk Analizi</h3>
        <p>Riskleri önceliklendirin ve aksiyonları yönetin.</p>
      </div>

      <div className="timeline-card">
        <span>04</span>
        <h3>Yönetici Dashboard</h3>
        <p>Gerçek zamanlı verilerle hızlı karar alın.</p>
      </div>

    </div>

  </div>
</section>

{/* Platform Akışı */}

<section className="section section-light">

  <div className="page-container">

    <div className="section-title-wrap">

      <h2 className="section-title">
        D-SEC360 Nasıl Çalışır?
      </h2>

      <p className="section-subtitle">
        Kurulumdan sürekli iyileştirmeye kadar tüm süreç tek platformda ilerler.
      </p>

    </div>

    <div className="flow-grid">

      <div className="flow-card">
        <strong>① Kurulum</strong>
        <p>Firma, çalışanlar ve modüller tanımlanır.</p>
      </div>

      <div className="flow-card">
        <strong>② Operasyon</strong>
        <p>Eğitim, denetim, sağlık ve risk süreçleri yürütülür.</p>
      </div>

      <div className="flow-card">
        <strong>③ Analiz</strong>
        <p>Dashboard ve raporlar yönetime sunulur.</p>
      </div>

      <div className="flow-card">
        <strong>④ Sürekli İyileştirme</strong>
        <p>DÖF ve aksiyonlarla süreç sürekli geliştirilir.</p>
      </div>

    </div>

  </div>

</section>

{/* Son CTA */}

<section className="hero hero-cta-band">

  <div className="hero-inner hero-compact">

    <div className="hero-badge">
      D-SEC360
    </div>

    <h2 className="hero-title">
      İSG Süreçlerinizi Dijitalleştirmenin Tam Zamanı
    </h2>

    <p className="hero-desc">
      Eğitim, denetim, sağlık, risk yönetimi ve ÇBS süreçlerini tek platformdan
      yönetin.
    </p>

    <div className="hero-actions">

      <Link href="/demo" className="btn-primary">
        Ücretsiz Demo Planla
      </Link>

      <Link href="/contact" className="btn-outline-light">
        Kurumsal Sunum Talep Et
      </Link>

    </div>

    <div className="premium-trust-list">
      <span>✓ Web + Mobil</span>
      <span>✓ Bulut Altyapısı</span>
      <span>✓ Yapay Zekâ Destekli</span>
      <span>✓ Sürekli Güncellenen Platform</span>
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

          <div className="grid-2">
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

      

     
    </main>
  );
}