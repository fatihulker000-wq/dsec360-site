import Link from "next/link";

const modules = [
  {
    title: "Ajanda Yönetimi",
    desc: "Görev, hatırlatma, denetim ve saha planlarını tek merkezden yönetin.",
  },
  {
    title: "Denetim Sistemi",
    desc: "Saha denetimlerini dijital formlar ve kayıt altyapısıyla yönetin.",
  },
  {
    title: "Eğitim Yönetimi",
    desc: "Senkron, asenkron ve online eğitim süreçlerini çalışan bazlı takip edin.",
  },
  {
    title: "Sağlık Modülü",
    desc: "Muayene, sağlık kayıtları ve takip süreçlerini merkezi yönetin.",
  },
  {
    title: "ÇBS Yönetimi",
    desc: "Şikayet, öneri ve talepleri web ve panel üzerinden toplayın.",
  },
  {
    title: "Raporlama Sistemi",
    desc: "Kurumsal karar destek için güçlü raporlar ve analiz ekranları alın.",
  },
];

const advantages = [
  {
    title: "Saha Yönetimi",
    desc: "Mobil ve web destekli yapı ile sahadaki verileri hızlı şekilde yönetin.",
  },
  {
    title: "Kurumsal Raporlama",
    desc: "PDF, özet rapor ve gelişmiş analiz ekranları ile karar sürecini hızlandırın.",
  },
  {
    title: "Merkezi Kontrol",
    desc: "Eğitim, sağlık, denetim ve bildirim süreçlerini tek sistemde toplayın.",
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
    title: "Süreci Tanımla",
    desc: "Denetim, eğitim, sağlık, ÇBS ve raporlama süreçleri modül bazında planlanır.",
  },
  {
    step: "02",
    title: "Veriyi Topla",
    desc: "Saha, çalışan ve yönetim tarafındaki bilgiler merkezi akış içinde sisteme alınır.",
  },
  {
    step: "03",
    title: "Takip Et",
    desc: "Açık işler, eksikler, durum değişimleri ve süreç ilerlemeleri görünür hale gelir.",
  },
  {
    step: "04",
    title: "Raporla ve Yönet",
    desc: "Toplanan veriler özet ekranlar, raporlar ve kurumsal karar destek çıktıları üretir.",
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
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC Kurumsal Yönetim Platformu</div>

          <h1 className="hero-title">
            Dijital Sağlık • Emniyet • Çevre Yönetim Sistemi
          </h1>

          <p className="hero-desc">
            İş güvenliği, saha denetimi, eğitim yönetimi, ÇBS kayıtları ve
            raporlama süreçlerini tek platformda birleştiren kurumsal çözüm.
          </p>

          <div className="hero-actions">
            <Link href="/login" className="btn-primary">
              Kullanıcı Girişi
            </Link>
            <Link href="/admin/login" className="btn-outline-light">
              Admin Girişi
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">Giriş Noktaları</h2>
            <p className="section-subtitle">
              Platform içinde kimin hangi ekrandan giriş yapacağı net ve sade
              şekilde ayrıştırılmıştır
            </p>
          </div>

          <div className="grid-3">
            {entryPoints.map((item) => (
              <div key={item.title} className="card">
                <div className="card-icon" />
                <h3 className="card-title">{item.title}</h3>
                <p className="card-text">{item.desc}</p>

                <div style={{ marginTop: 18 }}>
                  <Link href={item.href} className="nav-cta">
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
                Kurumsal Odak
              </p>
              <h3 className="card-title">Tek Platform</h3>
              <p className="card-text">
                Dağınık süreçleri tek merkezde toplayarak operasyonel verim
                sağlar.
              </p>
            </div>

            <div className="card">
              <p className="card-text" style={{ marginTop: 0 }}>
                Saha + Ofis
              </p>
              <h3 className="card-title">Anlık Yönetim</h3>
              <p className="card-text">
                Ofis, saha ve yönetim tarafını aynı veri akışında buluşturur.
              </p>
            </div>

            <div className="card">
              <p className="card-text" style={{ marginTop: 0 }}>
                Karar Destek
              </p>
              <h3 className="card-title">Raporlama</h3>
              <p className="card-text">
                Analiz, rapor ve takip ekranları ile yönetime net görünürlük
                sağlar.
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

      <section className="section section-soft">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">Neden D-SEC?</h2>
            <p className="section-subtitle">
              Kurumsal yapı, saha kabiliyeti ve merkezi takip gücü
            </p>
          </div>

          <div className="grid-3">
            {advantages.map((item) => (
              <div key={item.title} className="card">
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
          style={{ paddingTop: 70, paddingBottom: 70 }}
        >
          <h2 className="hero-title" style={{ fontSize: 42 }}>
            D-SEC ile Dijital Dönüşüme Başlayın
          </h2>
          <p className="hero-desc">
            İş güvenliği ve kurumsal süreçlerinizi daha güçlü, daha görünür ve
            daha yönetilebilir hale getirin.
          </p>

          <div className="hero-actions">
            <Link href="/contact" className="btn-primary">
              İletişime Geç
            </Link>
            <Link href="/cbs" className="btn-outline-light">
              ÇBS Modülünü Gör
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}