import Link from "next/link";

const panelCards = [
  {
    title: "Denetim",
    desc: "Saha denetimlerini yönetin ve kayıt altına alın.",
    badge: "Operasyon",
    href: "/panel/inspection",
    buttonText: "Modüle Git",
    color: "#dc2626",
    bg: "linear-gradient(135deg, rgba(220,38,38,0.10), rgba(248,113,113,0.06))",
  },
  {
    title: "Eğitim Atama",
    desc: "Çalışanlara toplu eğitim atayın, firma ve kişi bazlı yönetim sağlayın.",
    badge: "Admin",
    href: "/admin/training",
    buttonText: "Atama Paneli",
    color: "#2563eb",
    bg: "linear-gradient(135deg, rgba(37,99,235,0.10), rgba(96,165,250,0.06))",
  },
  {
    title: "Eğitim Takip",
    desc: "Başlanmadı, devam eden ve tamamlanan eğitimleri premium dashboard ile izleyin.",
    badge: "Rapor",
    href: "/admin/training-report",
    buttonText: "Takip Ekranı",
    color: "#16a34a",
    bg: "linear-gradient(135deg, rgba(22,163,74,0.10), rgba(74,222,128,0.06))",
  },
  {
    title: "Sağlık",
    desc: "Muayene ve sağlık kayıtlarını yönetin.",
    badge: "Sağlık",
    href: "/panel/health",
    buttonText: "Modüle Git",
    color: "#7c3aed",
    bg: "linear-gradient(135deg, rgba(124,58,237,0.10), rgba(167,139,250,0.06))",
  },
  {
    title: "ÇBS",
    desc: "Şikayet ve öneri kayıtlarını görüntüleyin.",
    badge: "Kayıt",
    href: "/panel/cbs",
    buttonText: "Modüle Git",
    color: "#ea580c",
    bg: "linear-gradient(135deg, rgba(234,88,12,0.10), rgba(251,146,60,0.06))",
  },
  {
    title: "Raporlama",
    desc: "Kurumsal analiz ve raporları görüntüleyin.",
    badge: "Analiz",
    href: "/panel/reports",
    buttonText: "Raporlara Git",
    color: "#0f766e",
    bg: "linear-gradient(135deg, rgba(15,118,110,0.10), rgba(45,212,191,0.06))",
  },
];

export default function PanelPage() {
  return (
    <main>
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC Kullanıcı Paneli</div>
          <h1 className="hero-title">Kurumsal Yönetim Paneli</h1>
          <p className="hero-desc">
            Denetim, eğitim, sağlık ve ÇBS süreçlerinizi tek ekrandan yönetin.
          </p>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <div className="card">
              <div style={{ fontSize: "13px", color: "#6b7280" }}>Panel Durumu</div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                Aktif
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: "13px", color: "#6b7280" }}>Eğitim Yönetimi</div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                Hazır
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: "13px", color: "#6b7280" }}>Yönetim Seviyesi</div>
              <div style={{ fontSize: "30px", fontWeight: 800, marginTop: "8px" }}>
                Premium
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "20px",
            }}
          >
            {panelCards.map((card) => (
              <div
                key={card.title}
                className="card"
                style={{
                  background: card.bg,
                  border: "1px solid #e5e7eb",
                  borderRadius: "22px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    padding: "8px 12px",
                    borderRadius: "999px",
                    background: "#ffffff",
                    color: card.color,
                    fontSize: "12px",
                    fontWeight: 800,
                    border: `1px solid ${card.color}22`,
                    marginBottom: "14px",
                  }}
                >
                  {card.badge}
                </div>

                <h3
                  className="card-title"
                  style={{
                    marginBottom: "10px",
                    color: "#111827",
                  }}
                >
                  {card.title}
                </h3>

                <p
                  className="card-text"
                  style={{
                    minHeight: "54px",
                    color: "#4b5563",
                  }}
                >
                  {card.desc}
                </p>

                <div style={{ marginTop: "18px" }}>
                  <Link
                    href={card.href}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textDecoration: "none",
                      padding: "12px 16px",
                      borderRadius: "14px",
                      background: card.color,
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "14px",
                    }}
                  >
                    {card.buttonText}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}