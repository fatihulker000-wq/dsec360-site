export default function DenetimPage() {
  return (
    <main style={{ background: "#fafafa", minHeight: "100vh" }}>
      
      {/* HERO */}
      <section
        style={{
          padding: "80px 20px",
          textAlign: "center",
          background: "linear-gradient(135deg, #5a0f1f, #c62828)",
          color: "#fff",
        }}
      >
        <h1 style={{ fontSize: 42, fontWeight: 900 }}>
          Denetim Süreçlerinizi Dijitalleştirin
        </h1>

        <p style={{ marginTop: 16, fontSize: 18, opacity: 0.9 }}>
          Klasik, Fotoğraflı, Puanlamalı ve ELMERI denetimlerini tek platformdan yönetin.
        </p>

        <div style={{ marginTop: 30 }}>
          <a
            href="/contact"
            style={{
              padding: "14px 24px",
              background: "#fff",
              color: "#c62828",
              borderRadius: 12,
              fontWeight: 800,
              textDecoration: "none",
              marginRight: 10,
            }}
          >
            Demo Talep Et
          </a>

          <a
            href="/pricing"
            style={{
              padding: "14px 24px",
              background: "transparent",
              border: "1px solid #fff",
              color: "#fff",
              borderRadius: 12,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Fiyatları İncele
          </a>
        </div>
      </section>

      {/* ÖZELLİKLER */}
      <section style={{ padding: "60px 20px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 30 }}>
          Denetim Türleri
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
          {[
            "Klasik Denetim",
            "Fotoğraflı Denetim",
            "Puanlamalı Denetim",
            "ELMERI Analizi",
          ].map((item) => (
            <div
              key={item}
              style={{
                background: "#fff",
                padding: 20,
                borderRadius: 16,
                border: "1px solid #eee",
                fontWeight: 700,
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* FAYDALAR */}
      <section style={{ padding: "60px 20px", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 30 }}>
            Neler Kazanırsınız?
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {[
              "Mobil + Web senkron",
              "Anlık PDF rapor",
              "DÖF takip sistemi",
              "Fotoğraf kanıt",
              "Firma bazlı analiz",
              "Gerçek zamanlı veri",
            ].map((item) => (
              <div
                key={item}
                style={{
                  padding: 20,
                  background: "#fafafa",
                  borderRadius: 14,
                  fontWeight: 700,
                }}
              >
                ✔️ {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "70px 20px",
          textAlign: "center",
          background: "#f9fafb",
        }}
      >
        <h2 style={{ fontSize: 30, fontWeight: 900 }}>
          Denetimlerinizi Dijitalleştirmeye Hazır mısınız?
        </h2>

        <p style={{ marginTop: 10, color: "#555" }}>
          D-SEC ile tüm süreçlerinizi tek platformdan yönetin.
        </p>

        <div style={{ marginTop: 20 }}>
          <a
            href="/contact"
            style={{
              padding: "14px 26px",
              background: "#c62828",
              color: "#fff",
              borderRadius: 12,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Demo Talep Et
          </a>
        </div>
      </section>
    </main>
  );
}