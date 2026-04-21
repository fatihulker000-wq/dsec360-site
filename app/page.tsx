import Link from "next/link";

const modules = [
  {
    title: "Ajanda ve Görev Yönetimi",
    desc: "Görev, ziyaret, saha planı ve kritik hatırlatmaları tek merkezden yöneterek operasyon akışınızı düzenli hale getirin.",
  },
  {
    title: "Dijital Denetim Sistemi",
    desc: "Form bazlı saha denetimleri, uygunsuzluk takibi ve düzeltici faaliyet süreçlerini dijitalleştirerek kontrol gücü kazanın.",
  },
  {
    title: "Eğitim Yönetim Platformu",
    desc: "Senkron ve asenkron eğitimleri çalışan bazlı planlayın, katılım ve tamamlama durumlarını merkezi olarak takip edin.",
  },
  {
    title: "Sağlık Takip Modülü",
    desc: "Muayene, sağlık evrakları ve periyodik takip süreçlerini tek panel üzerinden daha görünür yönetin.",
  },
  {
    title: "ÇBS Kayıt Yönetimi",
    desc: "Şikayet, öneri ve talepleri sistematik şekilde toplayın, kayıt altına alın ve sonuçlandırma sürecini izleyin.",
  },
  {
    title: "Raporlama ve Analitik",
    desc: "Yönetim kararlarını hızlandıran özet ekranlar, performans göstergeleri ve aksiyon odaklı kurumsal raporlar alın.",
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
     <section className="hero hero-premium">
  <div className="hero-orb hero-orb-1" />
  <div className="hero-orb hero-orb-2" />

  <div className="hero-inner">
    <div className="hero-badge">D-SEC Kurumsal İSG Yönetim Platformu</div>

    <h1 className="hero-title">
      İSG Süreçlerinizi Dijitalleştirin,
      <br />
      Denetim ve Eğitim Yönetimini Tek Platformda Toplayın
    </h1>

    <p className="hero-desc">
      D-SEC; eğitim, denetim, sağlık, ÇBS ve raporlama süreçlerini tek merkezde
      toplayarak işletmelere hız, kontrol, görünürlük ve kurumsal yönetim gücü sağlar.
    </p>

    <div className="hero-actions">
      <Link href="/demo" className="btn-primary">
        Ücretsiz Demo Talep Et
      </Link>

      <Link href="/contact" className="btn-outline-light">
        Teklif Al
      </Link>
    </div>

    <div className="hero-trust-row">
      <span>13+ yıl İSG tecrübesi</span>
      <span>Kurumsal modül mimarisi</span>
      <span>Web + mobil uyumlu yapı</span>
      <span>Eğitim + denetim + raporlama entegrasyonu</span>
    </div>

    <div className="hero-stats">
      <div className="hero-stat-card">
        <strong>Tek Platform</strong>
        <p>Dağınık süreçleri tek merkezde toplayın.</p>
      </div>

      <div className="hero-stat-card">
        <strong>Anlık Görünürlük</strong>
        <p>Eksik, açık ve kritik kayıtları hızlıca görün.</p>
      </div>

      <div className="hero-stat-card">
        <strong>Kurumsal Yönetim</strong>
        <p>Yönetim için aksiyon alınabilir raporlar üretin.</p>
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
            {modules.map((item) => (
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
      <h2 className="section-title">Neden D-SEC?</h2>
      <p className="section-subtitle">
        Sadece kayıt tutan bir yazılım değil; süreçlerinizi görünür, takip edilebilir ve yönetilebilir hale getiren kurumsal altyapı
      </p>
    </div>

    <div className="grid-3">
      <div className="card">
        <div className="card-icon" />
        <h3 className="card-title">Tek Platform Mantığı</h3>
        <p className="card-text">
          Ayrı Excel dosyaları, dağınık takip yöntemleri ve kopuk süreçler yerine tüm operasyonu tek yapıda toplayın.
        </p>
      </div>

      <div className="card">
        <div className="card-icon" />
        <h3 className="card-title">Gerçek Zamanlı Takip</h3>
        <p className="card-text">
          Eğitim, denetim, sağlık ve kayıt akışlarındaki durum değişimlerini daha hızlı görün ve gecikmeleri azaltın.
        </p>
      </div>

      <div className="card">
        <div className="card-icon" />
        <h3 className="card-title">Yönetim İçin Net Sonuç</h3>
        <p className="card-text">
          Üst yönetim ve operasyon ekipleri için anlamlı raporlar, özet ekranlar ve takip göstergeleri üretin.
        </p>
      </div>
    </div>
  </div>
</section>

<section className="section section-soft">
  <div className="page-container" style={{ textAlign: "center" }}>
    <div className="section-title-wrap">
      <h2 className="section-title">Size Uygun Paketi Seçin</h2>
      <p className="section-subtitle">
        İşletmenizin ölçeğine uygun paketi seçin, D-SEC ile süreçlerinizi kontrollü ve kurumsal şekilde yönetin.
      </p>
    </div>

    <div
      style={{
        marginTop: 20,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
        gap: 20,
      }}
    >
      <div className="card">
        <h3 className="card-title">Başlangıç</h3>
        <p className="card-text">Küçük işletmeler için temel yapı</p>
        <div style={{ marginTop: 16, fontSize: 30, fontWeight: 900, color: "#111827" }}>
          ₺4.999<span style={{ fontSize: 15, color: "#6b7280" }}> / yıl</span>
        </div>
      </div>

      <div
        className="card"
        style={{
          border: "2px solid #c62828",
          boxShadow: "0 22px 46px rgba(198, 40, 40, 0.16)",
        }}
      >
        <div
          style={{
            display: "inline-block",
            marginBottom: 12,
            padding: "6px 12px",
            borderRadius: 999,
            background: "#c62828",
            color: "#fff",
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          EN ÇOK TERCİH EDİLEN
        </div>

        <h3 className="card-title">Profesyonel</h3>
        <p className="card-text">Büyüyen firmalar için tam kontrol</p>
        <div style={{ marginTop: 16, fontSize: 30, fontWeight: 900, color: "#111827" }}>
          ₺9.999<span style={{ fontSize: 15, color: "#6b7280" }}> / yıl</span>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">Kurumsal</h3>
        <p className="card-text">Özel ihtiyaçlar için teklif bazlı çözüm</p>
        <div style={{ marginTop: 16, fontSize: 30, fontWeight: 900, color: "#111827" }}>
          Teklif Al
        </div>
      </div>
    </div>

    <div style={{ marginTop: 26 }}>
      <Link href="/pricing" className="nav-cta">
        Tüm Paketleri Gör
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