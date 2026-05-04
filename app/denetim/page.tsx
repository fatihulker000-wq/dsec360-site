import Image from "next/image";
import Link from "next/link";

const appScreens = [
  {
    title: "Denetim Merkezi",
    desc: "Klasik, fotoğraflı, puanlamalı ve ELMERI denetim akışları tek merkezde.",
    image: "/denetim-screen-1.png",
  },
  {
    title: "DÖF Takip Merkezi",
    desc: "Uygunsuzluklardan otomatik DÖF takibi ve kapanış süreci.",
    image: "/denetim-screen-2.png",
  },
  {
    title: "Canlı Web Paneli",
    desc: "App üzerinden gelen denetimler web panelde firma bazlı takip edilir.",
    image: "/denetim-screen-3.png",
  },
];

export default function DenetimPage() {
  return (
    <main style={{ background: "#fafafa", minHeight: "100vh" }}>
      <section
        style={{
          padding: "86px 20px",
          background:
            "radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 34%), linear-gradient(135deg, #4a0d1a 0%, #7a1224 45%, #c62828 100%)",
          color: "#fff",
        }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.18)",
              fontSize: 13,
              fontWeight: 900,
              marginBottom: 18,
            }}
          >
            D-SEC Denetim Modülü
          </div>

          <h1 style={{ fontSize: 46, fontWeight: 1000, margin: 0 }}>
            Saha Denetimlerini Dijital, İzlenebilir ve Raporlanabilir Hale Getirin
          </h1>

          <p
            style={{
              margin: "18px auto 0",
              maxWidth: 860,
              fontSize: 18,
              lineHeight: 1.7,
              opacity: 0.92,
              fontWeight: 600,
            }}
          >
            Klasik denetim, fotoğraflı kanıt, puanlamalı kontrol, ELMERI analizi,
            uygunsuzluk takibi ve DÖF kapanış süreçlerini mobil ve web destekli
            tek yapıda yönetin.
          </p>

          <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/contact"
              style={{
                padding: "15px 24px",
                background: "#fff",
                color: "#9f1239",
                borderRadius: 14,
                fontWeight: 900,
                textDecoration: "none",
              }}
            >
              Demo Talep Et
            </Link>

            <Link
              href="/pricing"
              style={{
                padding: "15px 24px",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.35)",
                color: "#fff",
                borderRadius: 14,
                fontWeight: 900,
                textDecoration: "none",
              }}
            >
              Fiyatları İncele
            </Link>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 20px" }}>
        <h2 style={{ fontSize: 32, fontWeight: 1000, marginBottom: 12 }}>
          Denetim Akışı Nasıl Görünür?
        </h2>

        <p style={{ color: "#64748b", fontWeight: 650, marginBottom: 28 }}>
          Kullanıcılar app içinde denetimi başlatır, uygunsuzlukları işler, DÖF oluşturur ve web panelde süreç takip edilir.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 22,
          }}
        >
          {appScreens.map((screen) => (
            <div
              key={screen.title}
              style={{
                background: "#fff",
                borderRadius: 28,
                padding: 18,
                border: "1px solid #e5e7eb",
                boxShadow: "0 18px 54px rgba(15,23,42,0.07)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 420,
                  borderRadius: 22,
                  overflow: "hidden",
                  background: "#f1f5f9",
                  border: "1px solid #e5e7eb",
                }}
              >
                <Image
                  src={screen.image}
                  alt={screen.title}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>

              <h3 style={{ margin: "18px 0 8px", fontSize: 20, fontWeight: 1000 }}>
                {screen.title}
              </h3>

              <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6, fontWeight: 650 }}>
                {screen.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "#fff", padding: "64px 20px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, fontWeight: 1000, marginBottom: 24 }}>
            Modülün Sağladığı Kurumsal Avantajlar
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 18,
            }}
          >
            {[
              "Mobil ve web senkronizasyonu",
              "Fotoğraflı saha kanıtı",
              "DÖF açma ve kapatma takibi",
              "Firma bazlı denetim geçmişi",
              "PDF rapor çıktısı",
              "Yönetim için ölçülebilir performans",
            ].map((item) => (
              <div
                key={item}
                style={{
                  padding: 22,
                  borderRadius: 20,
                  background: "#fafafa",
                  border: "1px solid #e5e7eb",
                  fontWeight: 900,
                  color: "#111827",
                }}
              >
                ✔️ {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "76px 20px",
          textAlign: "center",
          background: "#f9fafb",
        }}
      >
        <h2 style={{ fontSize: 34, fontWeight: 1000, margin: 0 }}>
          Denetim Süreçlerinizi D-SEC ile Kurumsallaştırın
        </h2>

        <p style={{ marginTop: 12, color: "#64748b", fontWeight: 650 }}>
          Saha kontrolünden web raporlamaya kadar tüm denetim yönetimini tek çatı altında toplayın.
        </p>

        <div style={{ marginTop: 24 }}>
          <Link
            href="/contact"
            style={{
              padding: "15px 28px",
              background: "linear-gradient(135deg, #5a0f1f, #c62828)",
              color: "#fff",
              borderRadius: 14,
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            Demo Talep Et
          </Link>
        </div>
      </section>
    </main>
  );
}