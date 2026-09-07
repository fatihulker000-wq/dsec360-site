"use client";

import { FormEvent, useMemo, useState } from "react";

type ApplicationType = "SIKAYET" | "ONERI" | "TALEP" | "BILGI";
type Category =
  | "ISG"
  | "CALISMA_KOSULLARI"
  | "INSAN_KAYNAKLARI"
  | "CEVRE"
  | "TESIS_TEKNIK"
  | "YEMEKHANE"
  | "SERVIS_ULASIM"
  | "DIGER";

type CbsForm = {
  full_name: string;
  email: string;
  firma_adi: string;
  application_type: ApplicationType;
  category: Category;
  message: string;
  privacy_mode: "identified" | "confidential" | "anonymous";
};

const APPLICATION_TYPES: Array<{ value: ApplicationType; label: string; desc: string }> = [
  { value: "SIKAYET", label: "Şikâyet", desc: "Çözüm veya inceleme beklediğiniz bir durum" },
  { value: "ONERI", label: "Öneri", desc: "İyileştirme veya geliştirme öneriniz" },
  { value: "TALEP", label: "Talep", desc: "Destek, hizmet veya işlem talebiniz" },
  { value: "BILGI", label: "Bilgi Bildirimi", desc: "Kayıt altına alınmasını istediğiniz bilgi" },
];

const CATEGORIES: Array<{ value: Category; label: string }> = [
  { value: "ISG", label: "İş Sağlığı ve Güvenliği" },
  { value: "CALISMA_KOSULLARI", label: "Çalışma Koşulları" },
  { value: "INSAN_KAYNAKLARI", label: "İnsan Kaynakları" },
  { value: "CEVRE", label: "Çevre" },
  { value: "TESIS_TEKNIK", label: "Tesis / Teknik" },
  { value: "YEMEKHANE", label: "Yemekhane" },
  { value: "SERVIS_ULASIM", label: "Servis / Ulaşım" },
  { value: "DIGER", label: "Diğer" },
];

const cbsFeatures = [
  "Çalışan, ziyaretçi ve dış paydaş başvurularını tek merkezde toplar",
  "Şikâyet, öneri, talep ve bilgi bildirimlerini sınıflandırır",
  "Başvuruların durum ve kapanış sürecini izlenebilir hale getirir",
  "SLA ve gecikme takibi için operasyonel altyapı oluşturur",
  "Yönetici görünürlüğü ve dönemsel raporlamayı güçlendirir",
  "Kurumsal hafıza oluşturarak tekrar eden konuları görünür kılar",
];

const cbsFlow = [
  {
    title: "1. Başvuru Alınır",
    desc: "Başvuru türü, konu kategorisi ve açıklamasıyla dijital olarak kayıt altına alınır.",
  },
  {
    title: "2. Sınıflandırılır",
    desc: "Kayıt ilgili kategori ve süreç başlığı altında yönetim merkezine düşer.",
  },
  {
    title: "3. Süreç Takip Edilir",
    desc: "Yeni, okundu, işlemde ve kapalı aşamaları üzerinden operasyonel takip yapılır.",
  },
  {
    title: "4. Yönetim Görünürlüğü Sağlanır",
    desc: "Açık kayıtlar, gecikmeler ve kapanış performansı yönetim ekranında izlenir.",
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

function clean(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export default function CbsPage() {
  const [form, setForm] = useState<CbsForm>({
    full_name: "",
    email: "",
    firma_adi: "",
    application_type: "SIKAYET",
    category: "ISG",
    message: "",
    privacy_mode: "identified",
  });

  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const firmId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("firm")?.trim() || ""
      : "";
  const isAnonymous = form.privacy_mode === "anonymous";
  const messageLength = form.message.length;
  const selectedType = useMemo(
    () => APPLICATION_TYPES.find((item) => item.value === form.application_type),
    [form.application_type]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    const fullName = clean(form.full_name, 120);
    const email = form.email.trim().toLowerCase().slice(0, 180);
    const firmaAdi = clean(form.firma_adi, 180);
    const message = form.message.trim().slice(0, 5000);

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!firmId) {
      setIsSuccess(false);
      setReferenceNo("");
      setResultMessage("Bu ÇBS bağlantısı bir firmaya bağlı değil. Firmanıza ait QR kod veya ÇBS bağlantısını kullanın.");
      return;
    }

    if ((!isAnonymous && (!fullName || !email)) || !message) {
      setIsSuccess(false);
      setReferenceNo("");
      setResultMessage("Lütfen zorunlu alanları doldurun.");
      return;
    }

    if (!isAnonymous && fullName.length < 2) {
      setIsSuccess(false);
      setResultMessage("Ad Soyad alanı en az 2 karakter olmalıdır.");
      return;
    }

    if (!isAnonymous && !emailValid) {
      setIsSuccess(false);
      setResultMessage("Geçerli bir e-posta adresi girin.");
      return;
    }

    if (message.length < 10) {
      setIsSuccess(false);
      setResultMessage("Başvuru açıklaması en az 10 karakter olmalıdır.");
      return;
    }

    try {
      setLoading(true);
      setResultMessage("");
      setReferenceNo("");
      setTrackingCode("");
      setIsSuccess(false);

      const response = await fetch("/api/cbs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Mevcut API ile geriye dönük uyumlu alanlar:
          full_name: isAnonymous ? "" : fullName,
          email: isAnonymous ? "" : email,
          firma_adi: firmaAdi,
          firm_id: firmId,
          privacy_mode: form.privacy_mode,
          message,

          // Yeni ÇBS sınıflandırma alanları.
          // Backend desteklediğinde doğrudan kullanılabilir; eski endpoint bunları yok sayabilir.
          application_type: form.application_type,
          category: form.category,
        }),
      });

      const result = await readSafeJson(response);

      if (!response.ok) {
        setIsSuccess(false);
        setResultMessage(result?.error || "Gönderim sırasında hata oluştu.");
        return;
      }

      const ref =
        result?.reference_no ||
        result?.referenceNo ||
        result?.application_no ||
        result?.applicationNo ||
        "";

      setReferenceNo(String(ref || ""));
      setTrackingCode(String(result?.tracking_code || ""));
      setIsSuccess(true);
      setResultMessage("Başvurunuz başarıyla kayıt altına alındı.");

      setForm({
        full_name: "",
        email: "",
        firma_adi: "",
        application_type: "SIKAYET",
        category: "ISG",
        message: "",
        privacy_mode: "identified",
      });
    } catch (error) {
      console.error("ÇBS gönderim hatası:", error);
      setIsSuccess(false);
      setResultMessage("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="cbs-page cbs-v2">
      <section className="hero hero-compact">
        <div className="hero-inner">
          <div className="hero-badge">D-SEC • ÇBS BAŞVURU MERKEZİ</div>

          <h1 className="hero-title">
            Şikâyet, Öneri ve Başvuruları Tek Merkezde Yönetin
          </h1>

          <p className="hero-desc">
            Çalışanlardan, ziyaretçilerden ve dış paydaşlardan gelen bildirimleri
            kayıt altına alın; sınıflandırın, izleyin ve kurumsal bir süreç
            yönetimine dönüştürün.
          </p>

          <div className="hero-pills">
            <span>İzlenebilir Başvuru</span>
            <span>Kategori Bazlı Yönetim</span>
            <span>SLA Altyapısı</span>
            <span>Yönetim Görünürlüğü</span>
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="section-title-wrap">
            <div className="eyebrow">KURUMSAL BAŞVURU YÖNETİMİ</div>
            <h2 className="section-title">ÇBS Modülü Ne Sağlar?</h2>
            <p className="section-subtitle">
              E-posta, telefon veya sözlü bildirim gibi dağınık kanallar yerine
              tek merkezden yönetilen, ölçülebilir ve izlenebilir bir yapı oluşturur.
            </p>
          </div>

          <div className="grid-3">
            {cbsFeatures.map((item, index) => (
              <div key={item} className="card feature-card">
                <div className="feature-index">{String(index + 1).padStart(2, "0")}</div>
                <h3>{item}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="page-container">
          <div className="section-title-wrap">
            <div className="eyebrow">SÜREÇ AKIŞI</div>
            <h2 className="section-title">Başvurudan Kapanışa Tek Akış</h2>
            <p className="section-subtitle">
              Başvuru yalnızca bir form kaydı olarak kalmaz; yönetilebilir bir
              süreç kaydına dönüşür.
            </p>
          </div>

          <div className="flow-grid">
            {cbsFlow.map((item) => (
              <div key={item.title} className="card flow-card">
                <div className="flow-dot" />
                <h3 className="card-title">{item.title}</h3>
                <p className="card-text">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-light">
        <div className="page-container">
          <div className="application-grid">
            <aside className="card application-aside">
              <div className="eyebrow">BAŞVURU VE TALEP YÖNETİMİ</div>

              <h2>
                Bildiriminizi kayıt altına alın ve kurumsal süreci başlatın.
              </h2>

              <p>
                Başvurunuz seçtiğiniz tür ve kategori ile birlikte sisteme
                iletilir. Yönetim ekranında sınıflandırılabilir ve süreç
                durumuna göre takip edilebilir.
              </p>

              <div className="trust-list">
                {[
                  "Başvuru türü ve konu kategorisi ile sınıflandırma",
                  "Sistem üzerinde kayıt ve süreç takibi",
                  "Yönetici ekranında durum görünürlüğü",
                  "Kurumsal raporlama için standart veri yapısı",
                ].map((item) => (
                  <div key={item} className="trust-item">
                    <span>✓</span>
                    {item}
                  </div>
                ))}
              </div>

              <div className="privacy-note">
                <strong>Gizlilik notu</strong>
                <span>
                  Başvurular yalnızca süreç yönetimi amacıyla değerlendirilmelidir.
                  Anonim/gizli başvuru özelliği backend güvenlik modeli tamamlandıktan
                  sonra ayrıca aktif edilmelidir.
                </span>
              </div>
            </aside>

            <div className="card form-card">
              <div className="form-head">
                <div>
                  <div className="eyebrow">D-SEC ÇBS</div>
                  <h2>Yeni Başvuru</h2>
                  <p>
                    Zorunlu alanları doldurun. Başvuru açıklamanız en az 10,
                    en fazla 5000 karakter olabilir.
                  </p>
                </div>
                <div className="secure-mark">🔒 Güvenli Form</div>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="type-grid">
                  {APPLICATION_TYPES.map((item) => {
                    const selected = form.application_type === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        className={`type-card ${selected ? "selected" : ""}`}
                        onClick={() =>
                          setForm((prev) => ({ ...prev, application_type: item.value }))
                        }
                        disabled={loading}
                        aria-pressed={selected}
                      >
                        <strong>{item.label}</strong>
                        <span>{item.desc}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="privacy-selector">
                  <button type="button" className={form.privacy_mode==="identified"?"privacy-option selected":"privacy-option"} onClick={()=>setForm(p=>({...p,privacy_mode:"identified"}))}>
                    <strong>Kimliğimle</strong><span>Ad ve e-posta ile başvuru</span>
                  </button>
                  <button type="button" className={form.privacy_mode==="confidential"?"privacy-option selected":"privacy-option"} onClick={()=>setForm(p=>({...p,privacy_mode:"confidential"}))}>
                    <strong>Gizli</strong><span>Kimlik bilgileri yetkili erişimle sınırlandırılır</span>
                  </button>
                  <button type="button" className={form.privacy_mode==="anonymous"?"privacy-option selected":"privacy-option"} onClick={()=>setForm(p=>({...p,privacy_mode:"anonymous"}))}>
                    <strong>Anonim</strong><span>Ad ve e-posta kaydedilmez</span>
                  </button>
                </div>

                {!firmId ? <div className="firm-warning">⚠ Bu sayfa firmaya özel ÇBS bağlantısından açılmalıdır. URL içinde <strong>?firm=FIRMA_UUID</strong> bulunmuyor.</div> : null}

                <div className="field-grid">
                  <div className="cbs-field">
                    <label className="cbs-label" htmlFor="cbs-full-name">
                      Ad Soyad <span>*</span>
                    </label>
                    <input
                      id="cbs-full-name"
                      value={form.full_name}
                      placeholder="Ad Soyad"
                      className="cbs-input"
                      maxLength={120}
                      autoComplete="name"
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, full_name: e.target.value }))
                      }
                      disabled={loading || isAnonymous}
                    />
                  </div>

                  <div className="cbs-field">
                    <label className="cbs-label" htmlFor="cbs-email">
                      E-posta <span>*</span>
                    </label>
                    <input
                      id="cbs-email"
                      value={form.email}
                      type="email"
                      placeholder="ornek@firma.com"
                      className="cbs-input"
                      maxLength={180}
                      autoComplete="email"
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      disabled={loading || isAnonymous}
                    />
                  </div>

                  <div className="cbs-field">
                    <label className="cbs-label" htmlFor="cbs-company">
                      Firma / Kurum <span>*</span>
                    </label>
                    <input
                      id="cbs-company"
                      value={firmId ? "Firma bağlantısı doğrulanacak" : ""}
                      placeholder="Firma bağlantısı bulunamadı"
                      className="cbs-input"
                      readOnly
                      disabled
                    />
                    <small>
                      Firma serbest metinle seçilmez; kayıt URL'deki doğrulanmış firma UUID'sine bağlanır.
                    </small>
                  </div>

                  <div className="cbs-field">
                    <label className="cbs-label" htmlFor="cbs-category">
                      Konu Kategorisi <span>*</span>
                    </label>
                    <select
                      id="cbs-category"
                      value={form.category}
                      className="cbs-input"
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          category: e.target.value as Category,
                        }))
                      }
                      disabled={loading}
                    >
                      {CATEGORIES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="cbs-textarea-wrap">
                  <div className="textarea-label-row">
                    <label className="cbs-label" htmlFor="cbs-message">
                      Başvuru Açıklaması <span>*</span>
                    </label>
                    <span className={messageLength > 4750 ? "counter warning" : "counter"}>
                      {messageLength}/5000
                    </span>
                  </div>

                  <textarea
                    id="cbs-message"
                    value={form.message}
                    placeholder={`${selectedType?.label || "Başvurunuz"} ile ilgili durumu, beklentinizi ve varsa önemli ayrıntıları yazın.`}
                    className="cbs-textarea"
                    maxLength={5000}
                    rows={8}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, message: e.target.value }))
                    }
                    disabled={loading}
                  />
                </div>

                <div className="submit-row">
                  <div className="form-disclaimer">
                    Gönderim ile birlikte başvurunuz süreç yönetimi amacıyla kayıt altına alınır.
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="cbs-button cbs-button-strong"
                  >
                    {loading ? "Gönderiliyor..." : "Başvuruyu Gönder"}
                  </button>
                </div>
              </form>

              {resultMessage && (
                <div
                  role="status"
                  className={`result-box ${isSuccess ? "success" : "error"}`}
                >
                  <div className="result-icon">{isSuccess ? "✓" : "!"}</div>
                  <div>
                    <strong>{isSuccess ? "Başvuru Alındı" : "İşlem Tamamlanamadı"}</strong>
                    <p>{resultMessage}</p>
                    {referenceNo ? (
                      <div className="reference-no">
                        Başvuru No: <strong>{referenceNo}</strong>
                        {trackingCode ? <><br/>Takip Kodu: <strong>{trackingCode}</strong><br/><small>Bu kod yalnızca şimdi gösterilir. Güvenli bir yerde saklayın.</small></> : null}
                      </div>
                    ) : null}
                    {isSuccess && firmId ? <div style={{marginTop:10}}><a href={`/cbs/takip?firm=${encodeURIComponent(firmId)}`} style={{fontWeight:900,color:"#166534"}}>Başvurumu Takip Et →</a></div> : null}
                  </div>
                </div>
              )}

              <div className="cbs-security">
                🔒 Kişisel ve kurumsal bilgilerin erişimi backend yetkilendirme ve
                veri güvenliği kurallarıyla sınırlandırılmalıdır.
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .cbs-v2 {
          background: #fff;
        }

        .hero-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 22px;
        }

        .hero-pills span,
        .eyebrow {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hero-pills span {
          padding: 8px 11px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .eyebrow {
          color: #9f1239;
          margin-bottom: 9px;
        }

        .feature-card {
          background: linear-gradient(180deg, #ffffff 0%, #fffafa 100%);
          border: 1px solid rgba(198, 40, 40, 0.1);
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
        }

        .feature-index {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 14px;
          background: #fff1f2;
          color: #be123c;
          font-weight: 950;
          margin-bottom: 15px;
        }

        .feature-card h3 {
          margin: 0;
          font-size: 18px;
          line-height: 1.5;
          color: #111827;
        }

        .flow-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .flow-card {
          position: relative;
          min-height: 188px;
          background: #fff;
          border: 1px solid #eef0f4;
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
        }

        .flow-dot {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: #be123c;
          box-shadow: 0 0 0 7px #fff1f2;
          margin: 7px 0 20px 6px;
        }

        .application-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.82fr) minmax(520px, 1.18fr);
          gap: 26px;
          align-items: start;
        }

        .application-aside {
          position: sticky;
          top: 90px;
          border: 1px solid rgba(198, 40, 40, 0.12);
          background: linear-gradient(180deg, #ffffff 0%, #fff7f7 100%);
        }

        .application-aside h2,
        .form-head h2 {
          color: #111827;
          margin: 0;
        }

        .application-aside h2 {
          font-size: 31px;
          line-height: 1.22;
        }

        .application-aside p,
        .form-head p {
          color: #64748b;
          line-height: 1.75;
        }

        .trust-list {
          display: grid;
          gap: 10px;
          margin-top: 20px;
        }

        .trust-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 12px 14px;
          border-radius: 14px;
          background: #fff;
          border: 1px solid #eef0f4;
          color: #334155;
          font-weight: 750;
          line-height: 1.5;
        }

        .trust-item span {
          color: #be123c;
          font-weight: 950;
        }

        .privacy-note {
          margin-top: 18px;
          padding: 14px;
          border-radius: 16px;
          background: #fff;
          border: 1px dashed #fecdd3;
          display: grid;
          gap: 5px;
        }

        .privacy-note strong {
          color: #9f1239;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .privacy-note span {
          color: #64748b;
          font-size: 12px;
          line-height: 1.6;
        }

        .form-card {
          border-radius: 28px;
          box-shadow: 0 28px 70px rgba(15, 23, 42, 0.11);
          border: 1px solid rgba(17, 24, 39, 0.08);
        }

        .form-head {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: flex-start;
          margin-bottom: 22px;
        }

        .form-head h2 {
          font-size: 30px;
        }

        .form-head p {
          margin: 8px 0 0;
        }

        .secure-mark {
          flex: 0 0 auto;
          padding: 8px 10px;
          border-radius: 999px;
          background: #ecfdf5;
          color: #166534;
          font-size: 11px;
          font-weight: 900;
          white-space: nowrap;
        }

        .type-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }

        .type-card {
          min-height: 96px;
          text-align: left;
          border: 1px solid #e5e7eb;
          background: #fff;
          border-radius: 15px;
          padding: 12px;
          cursor: pointer;
          transition: 0.18s ease;
        }

        .type-card:hover {
          border-color: #fda4af;
          transform: translateY(-1px);
        }

        .type-card.selected {
          background: #fff1f2;
          border-color: #fb7185;
          box-shadow: 0 0 0 2px rgba(244, 63, 94, 0.07);
        }

        .type-card strong {
          display: block;
          color: #111827;
          margin-bottom: 5px;
          font-size: 13px;
        }

        .type-card span {
          color: #64748b;
          font-size: 11px;
          line-height: 1.45;
        }

        .privacy-selector {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 16px;
        }
        .privacy-option {
          text-align: left;
          border: 1px solid #e5e7eb;
          background: #fff;
          border-radius: 14px;
          padding: 12px;
          cursor: pointer;
        }
        .privacy-option.selected {
          border-color: #fb7185;
          background: #fff1f2;
        }
        .privacy-option strong, .privacy-option span { display:block; }
        .privacy-option strong { color:#111827; font-size:12px; margin-bottom:4px; }
        .privacy-option span { color:#64748b; font-size:10px; line-height:1.4; }
        .firm-warning {
          margin-bottom: 16px;
          padding: 12px 14px;
          border-radius: 13px;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #9a3412;
          font-size: 12px;
          line-height: 1.55;
        }

        .field-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .cbs-field {
          min-width: 0;
        }

        .cbs-label {
          display: block;
          margin-bottom: 7px;
          font-size: 12px;
          font-weight: 900;
          color: #334155;
        }

        .cbs-label span {
          color: #be123c;
        }

        .cbs-field small {
          display: block;
          margin-top: 6px;
          color: #94a3b8;
          font-size: 10px;
          line-height: 1.45;
        }

        .cbs-input,
        .cbs-textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #dbe1e8;
          outline: none;
          background: #fff;
          color: #111827;
          transition: 0.18s ease;
        }

        .cbs-input {
          min-height: 48px;
          border-radius: 13px;
          padding: 0 13px;
        }

        .cbs-textarea {
          border-radius: 16px;
          padding: 13px;
          resize: vertical;
          min-height: 164px;
          line-height: 1.6;
        }

        .cbs-input:focus,
        .cbs-textarea:focus {
          border-color: #fb7185;
          box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.08);
        }

        .cbs-textarea-wrap {
          margin-top: 16px;
        }

        .textarea-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .counter {
          color: #94a3b8;
          font-size: 11px;
          font-weight: 800;
        }

        .counter.warning {
          color: #b91c1c;
        }

        .submit-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 20px;
        }

        .form-disclaimer {
          max-width: 420px;
          color: #64748b;
          font-size: 11px;
          line-height: 1.5;
        }

        .cbs-button {
          min-height: 48px;
          border: 0;
          border-radius: 13px;
          padding: 0 18px;
          font-weight: 900;
          cursor: pointer;
        }

        .cbs-button-strong {
          background: linear-gradient(135deg, #991b1b, #be123c);
          color: #fff;
          box-shadow: 0 12px 26px rgba(190, 24, 93, 0.22);
        }

        .cbs-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .result-box {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-top: 18px;
          border-radius: 15px;
          padding: 14px;
        }

        .result-box.success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .result-box.error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .result-icon {
          width: 28px;
          height: 28px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.8);
          font-weight: 950;
        }

        .result-box p {
          margin: 4px 0 0;
          line-height: 1.5;
        }

        .reference-no {
          margin-top: 8px;
          padding: 8px 10px;
          background: rgba(255, 255, 255, 0.78);
          border-radius: 10px;
          font-size: 12px;
        }

        .cbs-security {
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid #eef0f4;
          color: #64748b;
          font-size: 11px;
          line-height: 1.55;
        }

        @media (max-width: 1100px) {
          .flow-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .application-grid {
            grid-template-columns: 1fr;
          }

          .application-aside {
            position: static;
          }
        }

        @media (max-width: 760px) {
          .type-grid,
          .privacy-selector,
          .field-grid,
          .flow-grid {
            grid-template-columns: 1fr;
          }

          .form-head,
          .submit-row {
            flex-direction: column;
            align-items: stretch;
          }

          .secure-mark {
            width: fit-content;
          }

          .cbs-button {
            width: 100%;
          }

          .application-aside h2 {
            font-size: 27px;
          }

          .form-head h2 {
            font-size: 27px;
          }
        }
      `}</style>
    </main>
  );
}
