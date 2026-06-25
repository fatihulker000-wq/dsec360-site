"use client";

import { useState } from "react";

type CbsForm = {
  full_name: string;
  email: string;
  firma_adi: string;
  message: string;
};

const cbsFeatures = [
  "Çalışan şikayet ve önerilerinin kayıt altına alınması",
  "Dış paydaş başvurularının izlenebilir hale getirilmesi",
  "Web panel üzerinden durum takibi",
  "Yeni, işlemde, okundu ve kapalı durum yönetimi",
  "SLA ve gecikme takibi",
  "Yönetici dashboard görünürlüğü",
];

const cbsFlow = [
  {
    title: "1. Başvuru Alınır",
    desc: "Çalışan, ziyaretçi veya dış paydaş talebini dijital form üzerinden iletir.",
  },
  {
    title: "2. Kayıt Oluşur",
    desc: "Talep sistemde izlenebilir kayıt haline gelir ve ilgili yönetim ekranına düşer.",
  },
  {
    title: "3. Süreç Takip Edilir",
    desc: "Talep okundu, işlemde veya kapalı durumlarıyla takip edilir.",
  },
  {
    title: "4. Raporlanır",
    desc: "Açık kayıtlar, kapanış performansı ve geciken talepler yönetim tarafından izlenir.",
  },
];

async function readSafeJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export default function CbsPage() {
  const [form, setForm] = useState<CbsForm>({
    full_name: "",
    email: "",
    firma_adi: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;

    const fullName = form.full_name.trim();
    const email = form.email.trim();
    const firmaAdi = form.firma_adi.trim();
    const message = form.message.trim();

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!fullName || !email || !firmaAdi || !message) {
      setIsSuccess(false);
      setResultMessage("Lütfen tüm alanları doldurun.");
      return;
    }

    if (!emailValid) {
      setIsSuccess(false);
      setResultMessage("Geçerli bir email girin.");
      return;
    }

    try {
      setLoading(true);
      setResultMessage("");
      setIsSuccess(false);

      const response = await fetch("/api/cbs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          firma_adi: firmaAdi,
          message,
        }),
      });

      const result = await readSafeJson(response);

      if (!response.ok) {
        setIsSuccess(false);
        setResultMessage(result?.error || "Gönderim sırasında hata oluştu.");
        return;
      }

      setIsSuccess(true);
      setResultMessage(
        "✔️ Başvurunuz başarıyla alındı. En kısa sürede sizinle iletişime geçeceğiz."
      );

      setForm({
        full_name: "",
        email: "",
        firma_adi: "",
        message: "",
      });
    } catch (error) {
      console.error("ÇBS gönderim hatası:", error);
      setIsSuccess(false);
      setResultMessage("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="cbs-page">
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC ÇBS Modülü</div>

          <h1 className="hero-title">
            Şikayet, Öneri ve Başvuruları Dijital Olarak Yönetin
          </h1>

          <p className="hero-desc">
            Çalışanlardan, ziyaretçilerden veya dış paydaşlardan gelen talepleri
            kayıt altına alın; web panelde izleyin, yönetin ve raporlanabilir
            hale getirin.
          </p>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">ÇBS Modülü Ne Sağlar?</h2>
            <p className="section-subtitle">
              Dağınık iletişim kanallarını tek merkezde toplayarak izlenebilir
              ve kurumsal bir başvuru yönetimi oluşturur.
            </p>
          </div>

          <div className="grid-3">
            {cbsFeatures.map((item) => (
              <div
                key={item}
                className="card"
                style={{
                  background:
                    "linear-gradient(180deg,#ffffff 0%,#fffafa 100%)",
                  border: "1px solid rgba(198,40,40,0.10)",
                  boxShadow: "0 16px 40px rgba(15,23,42,0.07)",
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 16,
                    background: "#fff1f1",
                    color: "#c62828",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    marginBottom: 16,
                  }}
                >
                  ✓
                </div>

                <h3
                  style={{
                    margin: 0,
                    fontSize: 19,
                    lineHeight: 1.35,
                    color: "#111827",
                  }}
                >
                  {item}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="page-container">
          <div className="section-title-wrap">
            <h2 className="section-title">ÇBS Akışı Nasıl Çalışır?</h2>
            <p className="section-subtitle">
              Başvuru sadece form olarak kalmaz; kayıt, takip, kapanış ve
              raporlama sürecine dönüşür.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 18,
            }}
          >
            {cbsFlow.map((item) => (
              <div
                key={item.title}
                className="card"
                style={{
                  minHeight: 190,
                  background: "#ffffff",
                  border: "1px solid #eef0f4",
                  boxShadow: "0 18px 46px rgba(15,23,42,0.07)",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    padding: "7px 12px",
                    borderRadius: 999,
                    background: "#fff1f1",
                    color: "#9f1239",
                    fontSize: 12,
                    fontWeight: 900,
                    marginBottom: 14,
                  }}
                >
                  SÜREÇ
                </div>

                <h3 className="card-title">{item.title}</h3>
                <p className="card-text">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,0.9fr) minmax(360px,1.1fr)",
              gap: 26,
              alignItems: "start",
            }}
          >
            <div
              className="card"
              style={{
                position: "sticky",
                top: 90,
                background:
                  "linear-gradient(180deg,#ffffff 0%,#fff7f7 100%)",
                border: "1px solid rgba(198,40,40,0.12)",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  padding: "7px 12px",
                  borderRadius: 999,
                  background: "#fff1f1",
                  color: "#9f1239",
                  fontSize: 12,
                  fontWeight: 900,
                  marginBottom: 16,
                }}
              >
                Başvuru ve Talep Yönetimi
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: 32,
                  lineHeight: 1.2,
                  color: "#111827",
                }}
              >
                Başvuruları sadece almakla kalmayın, yönetilebilir hale getirin.
              </h2>

              <p
                style={{
                  marginTop: 14,
                  color: "#6b7280",
                  lineHeight: 1.8,
                }}
              >
                ÇBS formu; çalışan, ziyaretçi veya dış paydaş başvurularının
                kayıt altına alınması için ilk adımdır. Web panel tarafında bu
                kayıtlar sınıflandırılabilir, takip edilebilir ve yönetici
                dashboardunda izlenebilir.
              </p>

              <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
                {[
                  "Gizlilik ve güven odaklı başvuru yapısı",
                  "24 saat içinde dönüş süreci",
                  "Kayıtların yönetim panelinde izlenmesi",
                  "Kurumsal raporlama ve takip altyapısı",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 14,
                      background: "#ffffff",
                      border: "1px solid #eef0f4",
                      color: "#374151",
                      fontWeight: 700,
                      lineHeight: 1.6,
                    }}
                  >
                    ✓ {item}
                  </div>
                ))}
              </div>
            </div>

            <div
              className="card"
              style={{
                borderRadius: 30,
                boxShadow: "0 30px 70px rgba(15,23,42,0.12)",
                border: "1px solid rgba(17,24,39,0.08)",
              }}
            >
              <div style={{ marginBottom: 22 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 30,
                    color: "#111827",
                  }}
                >
                  Başvuru Formu
                </h2>

                <p
                  style={{
                    marginTop: 8,
                    color: "#6b7280",
                    lineHeight: 1.7,
                  }}
                >
                  Talebinizi iletin, başvurunuz kayıt altına alınsın ve uygun
                  süreç başlatılsın.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 16,
                }}
              >
                <div className="cbs-field">
                  <label className="cbs-label">Ad Soyad</label>
                  <input
                    value={form.full_name}
                    placeholder="Ad Soyad"
                    className="cbs-input"
                    onChange={(e) =>
                      setForm({ ...form, full_name: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>

                <div className="cbs-field">
                  <label className="cbs-label">Email</label>
                  <input
                    value={form.email}
                    type="email"
                    placeholder="Email"
                    className="cbs-input"
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>

                <div className="cbs-field" style={{ gridColumn: "1 / -1" }}>
                  <label className="cbs-label">Firma / Kurum Adı</label>
                  <input
                    value={form.firma_adi}
                    placeholder="İlişkili olduğunuz firma veya kurumu yazın"
                    className="cbs-input"
                    onChange={(e) =>
                      setForm({ ...form, firma_adi: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="cbs-textarea-wrap" style={{ marginTop: 16 }}>
                <label className="cbs-label">Mesajınız</label>
                <textarea
                  value={form.message}
                  placeholder="Talebinizi, önerinizi veya başvurunuzu yazın"
                  className="cbs-textarea"
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  disabled={loading}
                />
              </div>

              <div className="cbs-actions" style={{ marginTop: 22 }}>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="cbs-button cbs-button-strong"
                >
                  {loading ? "Gönderiliyor..." : "Başvuruyu Gönder"}
                </button>
              </div>

              {resultMessage && (
                <p
                  className="cbs-result"
                  style={{
                    color: isSuccess ? "#166534" : "#b91c1c",
                    fontWeight: 700,
                  }}
                >
                  {resultMessage}
                </p>
              )}

              <div className="cbs-security">
                🔒 Verileriniz güvenli şekilde saklanır ve üçüncü kişilerle
                paylaşılmaz.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}