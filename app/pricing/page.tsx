export default function PricingPage() {
  return (
    <main style={{ padding: "80px 20px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center"}}>
        
        {/* HERO */}
        <h1 style={{ fontSize: 46, fontWeight: 900 }}>
          Kurumsal Ölçeklenebilir Fiyatlandırma
        </h1>

        <p style={{ marginTop: 20, fontSize: 18, opacity: 0.75 }}>
          D-SEC platformu, işletmenizin büyüklüğüne ve ihtiyaçlarına göre
          esnek, sürdürülebilir ve ölçeklenebilir bir fiyatlandırma modeli sunar.
        </p>

        {/* VALUE */}
        <div style={{ marginTop: 50, display: "grid", gap: 20 }}>
          <div style={card}>
            ✔ Tüm modüller tek platformda (Denetim, Eğitim, ÇBS, Sağlık)
          </div>
          <div style={card}>
            ✔ Kullanıcı ve firma bazlı ölçeklenebilir yapı
          </div>
          <div style={card}>
            ✔ Kurumsal raporlama ve yönetim paneli
          </div>
        </div>

        {/* PLAN */}
        <div
          style={{
            marginTop: 60,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 20,
          }}
        >
          {/* BASIC */}
          <div style={planCard}>
            <h3>KOBİ Paket</h3>
            <p>Temel yönetim ihtiyaçları için</p>
            <h2 style={{ marginTop: 10 }}>₺</h2>

            <ul style={list}>
              <li>✔ Eğitim modülü</li>
              <li>✔ ÇBS kayıt sistemi</li>
              <li>✔ Temel raporlama</li>
            </ul>
          </div>

          {/* PRO */}
          <div style={{ ...planCard, border: "2px solid #b91c1c" }}>
            <h3>Kurumsal Paket</h3>
            <p>Profesyonel yönetim için</p>
            <h2 style={{ marginTop: 10 }}>₺₺</h2>

            <ul style={list}>
              <li>✔ Tüm modüller aktif</li>
              <li>✔ Gelişmiş raporlama</li>
              <li>✔ Firma & kullanıcı yönetimi</li>
            </ul>
          </div>

          {/* ENTERPRISE */}
          <div style={planCard}>
            <h3>Enterprise</h3>
            <p>Büyük ölçekli firmalar için</p>
            <h2 style={{ marginTop: 10 }}>Özel Teklif</h2>

            <ul style={list}>
              <li>✔ Özel geliştirme</li>
              <li>✔ API entegrasyonları</li>
              <li>✔ Danışmanlık desteği</li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 60 }}>
          <a href="/contact" style={cta}>
            Size Özel Teklif Al
          </a>
        </div>
      </div>
    </main>
  );
}

/* STYLES */
const card = {
  padding: "14px 20px",
  borderRadius: 12,
  background: "#fff",
  border: "1px solid #eee",
};

const planCard = {
  padding: 24,
  borderRadius: 16,
  background: "#fff",
  border: "1px solid #eee",
  textAlign: "center" as const,
};

const list = {
  marginTop: 15,
  paddingLeft: 18,
  lineHeight: 1.8,
};

const cta = {
  padding: "16px 28px",
  background: "#b91c1c",
  color: "#fff",
  borderRadius: 14,
  fontWeight: 800,
  textDecoration: "none",
};