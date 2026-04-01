import Link from "next/link";

const services = [
  {
    title: "Ajanda",
    subtitle: "Görev & Takip",
    desc: "Görev, hatırlatma, açık iş ve tamamlanan süreçleri tek ekranda izleyerek günlük operasyon takibini merkezi hale getirin.",
    points: [
      "Görev ve termin takibi",
      "Açık / tamamlanan iş görünürlüğü",
      "Operasyonel planlama desteği",
    ],
    badge: "Planlama",
    accent: "#b91c1c",
    soft: "linear-gradient(135deg, rgba(185,28,28,0.14), rgba(248,113,113,0.05))",
  },
  {
    title: "Çalışanlar",
    subtitle: "Aktif & Pasif",
    desc: "Çalışan bilgilerini, durumlarını ve temel insan kaynağı kayıtlarını düzenli ve erişilebilir yapıda yönetin.",
    points: [
      "Aktif / pasif çalışan görünümü",
      "Çalışan bazlı kayıt yapısı",
      "Merkezi personel görünürlüğü",
    ],
    badge: "İK",
    accent: "#b91c1c",
    soft: "linear-gradient(135deg, rgba(185,28,28,0.14), rgba(248,113,113,0.05))",
  },
  {
    title: "ÇBS",
    subtitle: "Şikayet & Süreç",
    desc: "Şikayet, öneri ve bildirimleri kayıt altına alın; süreç durumlarını yönetim paneli üzerinden izlenebilir hale getirin.",
    points: [
      "Web form ile başvuru alma",
      "Kayıt ve durum yönetimi",
      "Süreç görünürlüğü",
    ],
    badge: "Kayıt",
    accent: "#ea580c",
    soft: "linear-gradient(135deg, rgba(234,88,12,0.14), rgba(251,146,60,0.05))",
  },
  {
    title: "Denetim",
    subtitle: "Saha Kontrolleri",
    desc: "Saha denetimlerini planlayın, dijital olarak yürütün ve kayıt altına alarak denetim süreçlerinizi daha güçlü hale getirin.",
    points: [
      "Saha denetim planlama",
      "Dijital kayıt ve takip",
      "Özet ve sonuç görünürlüğü",
    ],
    badge: "Operasyon",
    accent: "#b91c1c",
    soft: "linear-gradient(135deg, rgba(185,28,28,0.14), rgba(248,113,113,0.05))",
  },
  {
    title: "Dokümantasyon",
    subtitle: "Evrak & Arşiv",
    desc: "Belge, dosya ve kayıt süreçlerini tek merkezde toplayarak arşiv yapınızı daha düzenli ve daha denetlenebilir hale getirin.",
    points: [
      "Belge düzeni",
      "Arşiv erişim kolaylığı",
      "Kurumsal kayıt yapısı",
    ],
    badge: "Arşiv",
    accent: "#b91c1c",
    soft: "linear-gradient(135deg, rgba(185,28,28,0.14), rgba(248,113,113,0.05))",
  },
  {
    title: "Eğitim",
    subtitle: "Plan & Kayıtlar",
    desc: "Senkron ve asenkron eğitim süreçlerini çalışan bazlı olarak planlayın, atayın ve izlenebilir hale getirin.",
    points: [
      "Çalışan bazlı eğitim takibi",
      "Eksik eğitim görünürlüğü",
      "Tamamlama ve katılım yönetimi",
    ],
    badge: "Gelişim",
    accent: "#334e8a",
    soft: "linear-gradient(135deg, rgba(51,78,138,0.16), rgba(148,163,184,0.06))",
  },
  {
    title: "Kaza ve Olay Yönetimi",
    subtitle: "Kaza & Ramak Kala",
    desc: "Kaza, olay ve ramak kala kayıtlarını dijital ortamda toplayarak analiz ve aksiyon süreçlerini daha yönetilebilir kılın.",
    points: [
      "Kaza ve olay kayıtları",
      "Ramak kala görünürlüğü",
      "Olay sonrası takip desteği",
    ],
    badge: "Vaka",
    accent: "#ea580c",
    soft: "linear-gradient(135deg, rgba(234,88,12,0.14), rgba(251,146,60,0.06))",
  },
  {
    title: "Mevzuat",
    subtitle: "Kanun & Yönetmelikler",
    desc: "İlgili mevzuat, yükümlülük ve referans içeriklerini daha düzenli bir yapıda izleyin ve erişilebilir hale getirin.",
    points: [
      "Mevzuat görünürlüğü",
      "Düzenli içerik takibi",
      "Kurumsal erişim kolaylığı",
    ],
    badge: "Uyum",
    accent: "#b7791f",
    soft: "linear-gradient(135deg, rgba(183,121,31,0.16), rgba(245,158,11,0.05))",
  },
  {
    title: "Raporlama",
    subtitle: "PDF & Kayıtlar",
    desc: "Yönetim görünürlüğünü artıran raporlar, özet ekranlar ve karar destek yapısı ile verileri anlamlı hale getirin.",
    points: [
      "Özet ve detay raporlar",
      "Yönetim görünürlüğü",
      "Karar destek yaklaşımı",
    ],
    badge: "Analiz",
    accent: "#b91c1c",
    soft: "linear-gradient(135deg, rgba(185,28,28,0.14), rgba(248,113,113,0.05))",
  },
  {
    title: "Risk Yönetimi",
    subtitle: "Analiz & Kontrol",
    desc: "Riskleri tanımlayın, sınıflandırın ve kontrol yaklaşımı ile kurumsal risk görünürlüğünü güçlendirin.",
    points: [
      "Risk görünürlüğü",
      "Analiz ve değerlendirme",
      "Kontrol yaklaşımı",
    ],
    badge: "Risk",
    accent: "#ea580c",
    soft: "linear-gradient(135deg, rgba(234,88,12,0.14), rgba(251,146,60,0.06))",
  },
  {
    title: "Sağlık",
    subtitle: "Kayıt & Muayene",
    desc: "Sağlık kayıtları, periyodik muayeneler ve çalışan bazlı takip süreçlerini merkezi görünürlük ile yönetin.",
    points: [
      "Sağlık kayıt görünürlüğü",
      "Muayene ve takip planlama",
      "Kurumsal sağlık düzeni",
    ],
    badge: "Sağlık",
    accent: "#b91c1c",
    soft: "linear-gradient(135deg, rgba(185,28,28,0.14), rgba(248,113,113,0.05))",
  },
  {
    title: "Profil",
    subtitle: "Hesap & Firma",
    desc: "Kullanıcı, firma ve hesap yapısını düzenli şekilde yönetin; sistemin temel organizasyon omurgasını güçlendirin.",
    points: [
      "Hesap görünürlüğü",
      "Firma bazlı yapı",
      "Merkezi kullanıcı düzeni",
    ],
    badge: "Yönetim",
    accent: "#4b5563",
    soft: "linear-gradient(135deg, rgba(75,85,99,0.14), rgba(148,163,184,0.06))",
  },
];

const serviceAdvantages = [
  {
    title: "Tek Platform Yönetimi",
    desc: "Dağınık tablolar, dosyalar ve bağımsız süreçler yerine; tüm modüllerin birbiriyle uyumlu çalıştığı merkezi bir yapı sunulur.",
  },
  {
    title: "Saha + Ofis + Yönetim Uyumu",
    desc: "Sahada toplanan veri, ofis süreçleri ve yönetim görünürlüğü aynı akış içinde buluşturulur.",
  },
  {
    title: "Kurumsal Ölçeklenebilirlik",
    desc: "İşletme büyüdükçe modül yapısı daha güçlü şekilde genişletilebilir ve farklı süreçler sisteme dahil edilebilir.",
  },
  {
    title: "Raporlanabilir Süreçler",
    desc: "Yalnızca veri toplamak değil; bu verileri takip, değerlendirme ve karar destek için anlamlı hale getirmek hedeflenir.",
  },
];

const targetGroups = [
  "İş güvenliği uzmanları",
  "İnsan kaynakları ekipleri",
  "Kurumsal yönetim ekipleri",
  "Saha operasyon birimleri",
  "Danışmanlık ve OSGB yapıları",
  "Merkezi yönetim ihtiyacı olan işletmeler",
];

export default function ServicesPage() {
  return (
    <main>
      <section className="hero">
        <div
          className="hero-inner"
          style={{ paddingTop: 88, paddingBottom: 88 }}
        >
          <div className="hero-badge">D-SEC Hizmetler</div>

          <h1 className="hero-title">
            Kurumsal Süreçler İçin Güçlü ve Bağlantılı Modül Yapısı
          </h1>

          <p className="hero-desc">
            D-SEC; ajanda, çalışanlar, denetim, eğitim, sağlık, ÇBS,
            dokümantasyon, mevzuat, risk ve raporlama süreçlerini tek çatı
            altında toplayarak işletmelere daha görünür, daha yönetilebilir ve
            daha raporlanabilir bir dijital yapı sunar.
          </p>

          <div className="hero-actions">
            <Link href="/contact" className="btn-primary">
              Demo Talep Et
            </Link>
            <Link href="/training" className="btn-outline-light">
              Eğitim Modülünü İncele
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">Hizmet Alanlarımız</h2>
            <p className="section-subtitle">
              App yapınızla uyumlu modül başlıkları artık web tarafında daha
              sade, daha premium ve daha kurumsal bir yapıyla sunulur
            </p>
          </div>

          <div className="services-grid">
            {services.map((item) => (
              <div
                key={item.title}
                className="service-module-card premium-service-card"
                style={{ background: item.soft }}
              >
                <div className="service-simple-top">
                  <div
                    className="service-module-badge service-badge-top"
                    style={{
                      color: item.accent,
                      borderColor: `${item.accent}22`,
                    }}
                  >
                    {item.badge}
                  </div>
                </div>

                <div className="service-module-body premium-service-body simple-service-body">
                  <h3 className="card-title">{item.title}</h3>

                  <p className="service-subtitle">{item.subtitle}</p>

                  <p className="card-text">{item.desc}</p>

                  <div className="service-points">
                    {item.points.map((point) => (
                      <div key={point} className="service-point">
                        <span
                          className="service-point-dot"
                          style={{ background: item.accent }}
                        />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>

                  <div
                    className="service-accent-line"
                    style={{
                      background: `linear-gradient(90deg, ${item.accent}, transparent)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">D-SEC Neden Güçlü?</h2>
            <p className="section-subtitle">
              Sadece modül sunmaz; süreçleri birbirine bağlı ve yönetilebilir
              hale getirir
            </p>
          </div>

          <div className="grid-2">
            {serviceAdvantages.map((item) => (
              <div key={item.title} className="card">
                <h3 className="card-title">{item.title}</h3>
                <p className="card-text">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="grid-2">
            <div className="card">
              <h3 className="card-title">Kimler İçin Uygun?</h3>

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
              <h3 className="card-title">Kurumsal Yaklaşım</h3>
              <p className="card-text">
                D-SEC hizmet yaklaşımı; yalnızca veriyi toplamak değil, bu
                veriyi operasyonel süreçlere, yönetim görünürlüğüne ve karar
                destek yapısına dönüştürmek üzerine kuruludur.
              </p>

              <p className="card-text">
                Böylece işletmeler; saha, eğitim, sağlık, bildirim, mevzuat,
                risk ve raporlama süreçlerini ayrı ayrı takip etmek yerine
                merkezi bir dijital yönetim sistemine kavuşur.
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
            Kurumsal Süreçlerinizi Tek Platformdan Yönetin
          </h2>

          <p className="hero-desc">
            Denetim, eğitim, sağlık, ÇBS, dokümantasyon, mevzuat, risk ve
            raporlama yapısını daha güçlü, daha görünür ve daha yönetilebilir
            hale getirmek için D-SEC modüllerini keşfedin.
          </p>

          <div className="hero-actions">
            <Link href="/contact" className="btn-primary">
              Bizimle İletişime Geçin
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