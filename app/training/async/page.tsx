import Link from "next/link";

const features = [
  "İstediği zaman erişim",
  "Video tabanlı eğitimler",
  "Tamamlama takibi",
  "Çalışan bazlı ilerleme",
  "Eğitim geçmişi kayıtları",
];

export default function AsyncTrainingPage() {
  return (
    <main>
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">Asenkron Eğitim</div>

          <h1 className="hero-title">
            Zaman ve Mekan Bağımsız Eğitim Yönetimi
          </h1>

          <p className="hero-desc">
            Çalışanlarınız eğitimlere istedikleri zaman erişir, siz ise tüm süreci
            merkezi olarak takip edersiniz.
          </p>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="grid-3">
            {features.map((item) => (
              <div key={item} className="card">
                <div className="card-icon" />
                <h3 className="card-title">{item}</h3>
                <p className="card-text">
                  Eğitim süreçlerinin daha esnek ve sürdürülebilir şekilde
                  yönetilmesini sağlar.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hero">
        <div className="hero-inner" style={{ paddingTop: 70, paddingBottom: 70 }}>
          <h2 className="hero-title" style={{ fontSize: 40 }}>
            Asenkron Eğitim Süreçlerinizi Dijitalleştirin
          </h2>

          <p className="hero-desc">
            D-SEC ile eğitimleri kontrol altına alın, eksikleri görünür hale getirin.
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
