import Link from "next/link";

const flowItems = [
  {
    title: "1. Denetim Planlanır",
    desc: "Firma, denetim türü ve saha kontrol başlıkları belirlenir.",
  },
  {
    title: "2. Mobil App Üzerinden Denetim Yapılır",
    desc: "Klasik, fotoğraflı, puanlamalı veya ELMERI denetim akışı sahada tamamlanır.",
  },
  {
    title: "3. Uygunsuzluklar ve DÖF Süreci Oluşur",
    desc: "Uygunsuz ve kısmen uygun tespitler DÖF takibine alınır.",
  },
  {
    title: "4. Web Panelde İzlenir",
    desc: "Denetimler, bulgular, açık/kapalı DÖF kayıtları ve rapor çıktıları web panelde takip edilir.",
  },
];

const advantages = [
  "Mobil ve web senkronizasyonu",
  "Fotoğraflı saha kanıtı",
  "Klasik, puanlamalı ve ELMERI denetim desteği",
  "Otomatik DÖF takip altyapısı",
  "Firma bazlı denetim geçmişi",
  "PDF rapor çıktısı",
  "Yönetim için ölçülebilir performans",
  "Kurumsal denetim standardizasyonu",
];

export default function DenetimPage() {
  return (
    <main style={{ background: "#fafafa", minHeight: "100vh" }}>
      <section
        style={{
          padding: "88px 20px",
          background:
            "linear-gradient(135deg, #4a0d1a 0%, #7a1224 45%, #c62828 100%)",
          color: "#fff",
        }}
      >
        <div style={{ maxWidth: 1120, margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.20)",
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
              maxWidth: 850,
              fontSize: 18,
              lineHeight: 1.7,
              opacity: 0.94,
              fontWeight: 600,
            }}
          >
            D-SEC Denetim Modülü; saha kontrollerini, uygunsuzluk takibini,
            DÖF süreçlerini ve yönetim raporlarını tek merkezde toplayarak
            işletmelere ölçülebilir ve kurumsal bir denetim yapısı kazandırır.
          </p>

          <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link href="/contact" style={primaryButton}>
              Demo Talep Et
            </Link>

            <Link href="/pricing" style={secondaryButton}>
              Fiyatları İncele
            </Link>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "68px 20px" }}>
        <h2 style={sectionTitle}>Denetim Akışı Nasıl Çalışır?</h2>

        <p style={sectionDesc}>
          Kullanıcı sahada denetimi başlatır, tespitleri işler, uygunsuzlukları kayıt altına alır.
          Süreç web panelde DÖF, takip ve raporlama yapısına dönüşür.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 18,
            marginTop: 30,
          }}
        >
          {flowItems.map((item) => (
            <div key={item.title} style={cardStyle}>
              <h3 style={{ fontSize: 20, fontWeight: 1000, margin: 0, color: "#111827" }}>
                {item.title}
              </h3>
              <p style={{ margin: "12px 0 0", color: "#64748b", lineHeight: 1.6, fontWeight: 650 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "#fff", padding: "68px 20px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <h2 style={sectionTitle}>Modülün Sağladığı Kurumsal Avantajlar</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 16,
              marginTop: 28,
            }}
          >
            {advantages.map((item) => (
              <div key={item} style={advantageCard}>
                <span style={{ color: "#7a1224", fontWeight: 1000 }}>✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          padding: "78px 20px",
          textAlign: "center",
          background: "#f9fafb",
        }}
      >
        <h2 style={{ fontSize: 34, fontWeight: 1000, margin: 0, color: "#111827" }}>
          Denetim Süreçlerinizi D-SEC ile Kurumsallaştırın
        </h2>

        <p style={{ marginTop: 12, color: "#64748b", fontWeight: 650 }}>
          Saha kontrolünden web raporlamaya kadar tüm denetim yönetimini tek çatı altında toplayın.
        </p>

        <div style={{ marginTop: 24 }}>
          <Link href="/contact" style={primaryButtonDark}>
            Demo Talep Et
          </Link>
        </div>
      </section>
    </main>
  );
}

const sectionTitle = {
  fontSize: 34,
  fontWeight: 1000,
  margin: 0,
  color: "#111827",
};

const sectionDesc = {
  color: "#64748b",
  fontWeight: 650,
  lineHeight: 1.7,
  marginTop: 12,
  maxWidth: 840,
};

const cardStyle = {
  background: "#fff",
  borderRadius: 24,
  padding: 24,
  border: "1px solid #e5e7eb",
  boxShadow: "0 18px 54px rgba(15,23,42,0.06)",
};

const advantageCard = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: 20,
  borderRadius: 20,
  background: "#fafafa",
  border: "1px solid #e5e7eb",
  fontWeight: 900,
  color: "#111827",
};

const primaryButton = {
  padding: "15px 24px",
  background: "#fff",
  color: "#9f1239",
  borderRadius: 14,
  fontWeight: 900,
  textDecoration: "none",
};

const secondaryButton = {
  padding: "15px 24px",
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.35)",
  color: "#fff",
  borderRadius: 14,
  fontWeight: 900,
  textDecoration: "none",
};

const primaryButtonDark = {
  padding: "15px 28px",
  background: "linear-gradient(135deg, #5a0f1f, #c62828)",
  color: "#fff",
  borderRadius: 14,
  fontWeight: 900,
  textDecoration: "none",
};