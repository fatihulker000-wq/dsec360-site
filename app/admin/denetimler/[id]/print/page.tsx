import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function formatDate(value?: number | string | null) {
  if (!value) return "-";
  const numeric = Number(value);
  const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("tr-TR");
}

function modeLabel(mode?: string | null) {
  const m = String(mode || "").toUpperCase();
  if (m.includes("FOTO") || m.includes("PHOTO")) return "Fotoğraflı";
  if (m.includes("PUAN") || m.includes("SCOR") || m.includes("SKOR")) return "Puanlamalı";
  if (m.includes("ELMERI")) return "ELMERI";
  return "Klasik";
}

function scoreValue(result?: string | null) {
  const r = String(result || "").toUpperCase().trim();
  if (!r.startsWith("SCORE:")) return null;
  const value = Number(r.replace("SCORE:", "").trim());
  return Number.isFinite(value) ? value : null;
}

function parseElmeri(result?: string | null) {
  const r = String(result || "").toUpperCase().trim();
  if (!r.startsWith("ELMERI:")) return null;

  const parts = r.split(":");
  const correct = Number(parts[1] || 0);
  const wrong = Number(parts[2] || 0);
  const out = Number(parts[3] || 0);
  const observed = correct + wrong;
  const percent = observed > 0 ? Math.round((correct / observed) * 100) : 0;

  return { correct, wrong, out, observed, percent };
}

function resultLabel(result?: string | null) {
  const score = scoreValue(result);
  if (score !== null) return `${score} Puan`;

  const elmeri = parseElmeri(result);
  if (elmeri) return `%${elmeri.percent}`;

  const r = String(result || "").toUpperCase();
  if (r === "UYGUN") return "Uygun";
  if (r === "KISMEN") return "Kısmen Uygun";
  if (r === "UYGUNSUZ") return "Uygunsuz";
  if (r === "KAPSAMDISI" || r === "KAPSAM_DIŞI") return "Kapsam Dışı";
  return result || "-";
}

function badgeClass(result?: string | null) {
  const score = scoreValue(result);
  if (score !== null) {
    if (score >= 80) return "badge good";
    if (score >= 50) return "badge mid";
    return "badge bad";
  }

  const elmeri = parseElmeri(result);
  if (elmeri) {
    if (elmeri.percent >= 80) return "badge good";
    if (elmeri.percent >= 50) return "badge mid";
    return "badge bad";
  }

  const r = String(result || "").toUpperCase();
  if (r === "UYGUN") return "badge good";
  if (r === "KISMEN") return "badge mid";
  if (r === "UYGUNSUZ") return "badge bad";
  return "badge neutral";
}

function cleanFirmName(name?: string | null) {
  const v = String(name || "").trim();
  if (!v || v.toLowerCase() === "firma") return "Firma Ünvanı Belirtilmemiş";
  return v;
}

export default async function InspectionPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = getSupabase();
  const { id } = await params;
  const requestedId = Number(id || 0);

  let { data: runData } = await supabase
    .from("denetim_runs")
    .select("*")
    .eq("app_run_id", requestedId)
    .maybeSingle();

  if (!runData) {
    const fallback = await supabase
      .from("denetim_runs")
      .select("*")
      .eq("id", requestedId)
      .maybeSingle();

    runData = fallback.data;
  }

  if (!runData) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Rapor bulunamadı</h1>
        <Link href="/admin/denetimler">Denetim listesine dön</Link>
      </main>
    );
  }

  const appRunId = runData.app_run_id || runData.id;

  const { data: answers } = await supabase
    .from("denetim_answers")
    .select("*")
    .eq("run_remote_id", runData.id)
    .order("id", { ascending: true });

  const list = answers || [];
  const mode = modeLabel(runData.eval_mode);

  const uygun = list.filter((a: any) => String(a.result || "").toUpperCase() === "UYGUN").length;
  const kismen = list.filter((a: any) => String(a.result || "").toUpperCase() === "KISMEN").length;
  const uygunsuz = list.filter((a: any) => String(a.result || "").toUpperCase() === "UYGUNSUZ").length;
  const kapsamDisi = list.filter((a: any) => {
    const r = String(a.result || "").toUpperCase();
    return r === "KAPSAMDISI" || r === "KAPSAM_DIŞI";
  }).length;

  const scores = list
    .map((a: any) => scoreValue(a.result))
    .filter((v: number | null): v is number => v !== null);

  const elmeriRows = list
    .map((a: any) => parseElmeri(a.result))
    .filter(Boolean) as Array<{
    correct: number;
    wrong: number;
    out: number;
    observed: number;
    percent: number;
  }>;

  const scoreAverage =
    scores.length > 0
      ? Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length)
      : 0;

  const elmeriAverage =
    elmeriRows.length > 0
      ? Math.round(elmeriRows.reduce((sum, v) => sum + v.percent, 0) / elmeriRows.length)
      : 0;

  const klasikUyum = Math.round(
    (uygun * 100 + kismen * 50) / (uygun + kismen + uygunsuz || 1)
  );

  const uyumSkoru =
    mode === "Puanlamalı" ? scoreAverage : mode === "ELMERI" ? elmeriAverage : klasikUyum;

  const summaryText =
    mode === "ELMERI"
      ? `ELMERI değerlendirmesinde genel performans, madde bazlı doğru / (doğru + yanlış) oranlarının ortalamasıyla hesaplanmıştır. Genel ELMERI puanı %${uyumSkoru}.`
      : mode === "Puanlamalı"
      ? `Puanlamalı denetimde genel performans, skor girilen maddelerin ortalamasıyla hesaplanmıştır. Ortalama skor %${uyumSkoru}.`
      : `Klasik denetimde uygun, kısmen uygun ve uygunsuz sonuçları üzerinden genel uyum skoru hesaplanmıştır. Genel uyum skoru %${uyumSkoru}.`;

  return (
    <main className="page">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .page { padding: 0 !important; }
          .sheet { box-shadow: none !important; border: none !important; }
          @page { size: A4 landscape; margin: 10mm; }
        }

        body { background: #f3f4f6; }

        .page {
          padding: 28px;
          font-family: Arial, sans-serif;
          color: #111827;
        }

        .actions {
          max-width: 1180px;
          margin: 0 auto 16px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .btn {
          border: 0;
          border-radius: 14px;
          padding: 11px 15px;
          font-weight: 900;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .primary {
          background: #5a0f1f;
          color: white;
        }

        .secondary {
          background: linear-gradient(135deg, #5a0f1f, #8f172c);
          color: #fff;
          box-shadow: 0 14px 34px rgba(90,15,31,0.22);
        }

        .backIcon {
          width: 28px;
          height: 28px;
          border-radius: 10px;
          background: rgba(255,255,255,0.16);
          display: inline-grid;
          place-items: center;
          font-size: 14px;
          font-weight: 1000;
        }

        .sheet {
          max-width: 1180px;
          margin: 0 auto;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(15,23,42,.10);
        }

        .hero {
          padding: 32px;
          color: white;
          background: linear-gradient(135deg,#4a0d1a,#c62828,#8f172c);
        }

        .brand {
          font-size: 13px;
          font-weight: 900;
          opacity: .92;
          letter-spacing: .4px;
        }

        .title {
          font-size: 34px;
          font-weight: 1000;
          margin: 12px 0 8px;
        }

        .subtitle {
          font-size: 14px;
          opacity: .92;
          font-weight: 700;
          line-height: 1.5;
        }

        .content { padding: 28px 32px 36px; }

        .section-title {
          font-size: 18px;
          font-weight: 1000;
          margin: 24px 0 12px;
          border-left: 5px solid #5a0f1f;
          padding-left: 10px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .card {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 14px;
          background: #fafafa;
        }

        .label {
          font-size: 12px;
          color: #64748b;
          font-weight: 800;
        }

        .value {
          margin-top: 6px;
          font-size: 17px;
          font-weight: 1000;
          line-height: 1.3;
        }

        .noteBox {
          border: 1px solid #ead5d5;
          background: #fff7f7;
          border-radius: 18px;
          padding: 16px;
          color: #334155;
          line-height: 1.7;
          font-size: 13px;
          font-weight: 650;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 12px;
          page-break-inside: auto;
        }

        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }

        th,
        td {
          padding: 11px 10px;
          border: 1px solid #e5e7eb;
          vertical-align: top;
          line-height: 1.45;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: anywhere;
        }

        th {
          background: #f8fafc;
          color: #334155;
          text-align: left;
          font-size: 12px;
          font-weight: 900;
        }

        tbody tr:nth-child(even) { background: #fbfbfd; }

        .col-no { width: 5%; }
        .col-madde { width: 23%; }
        .col-onlem { width: 28%; }
        .col-sonuc { width: 12%; }
        .col-aciklama { width: 20%; }
        .col-foto { width: 12%; }

        .badge {
          display: inline-block;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
          white-space: normal;
          line-height: 1.25;
        }

        .good { background: #dcfce7; color: #15803d; }
        .mid { background: #fef3c7; color: #b45309; }
        .bad { background: #fee2e2; color: #b91c1c; }
        .neutral { background: #f1f5f9; color: #475569; }

        .photo {
          width: 96px;
          height: 76px;
          object-fit: cover;
          border-radius: 10px;
          border: 1px solid #ddd;
          display: block;
          background: #f8fafc;
        }

        .footer {
          margin-top: 28px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .sign {
          height: 86px;
          border: 1px dashed #cbd5e1;
          border-radius: 14px;
          padding: 12px;
          font-size: 12px;
          color: #475569;
        }
      `}</style>

      <div className="actions no-print">
        <Link className="btn secondary" href={`/admin/denetimler/${appRunId}`}>
          <span className="backIcon">‹</span>
          <span>Denetim Detayına Dön</span>
        </Link>

        <button className="btn primary" type="button" onClick={undefined}>
          Yazdır / PDF Kaydet
        </button>
      </div>

      <section className="sheet">
        <div className="hero">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" style={{ height: 38 }} alt="D-SEC Logo" />
            <div className="brand">D-SEC • Dijital Sağlık • Emniyet • Çevre</div>
          </div>

          <div className="title">İş Sağlığı ve Güvenliği Denetim Raporu</div>

          <div className="subtitle">
            {cleanFirmName(runData.firm_name)} • {mode} •{" "}
            {formatDate(runData.audit_date_millis || runData.created_at_millis)} •
            Rapor No: {runData.report_no || "-"}
          </div>
        </div>

        <div className="content">
          <div className="section-title">Denetim Bilgileri</div>

          <div className="grid">
            <Info label="Firma Ünvanı" value={cleanFirmName(runData.firm_name)} />
            <Info label="Denetim Türü" value={mode} />
            <Info label="Şablon" value={runData.template_type || "-"} />
            <Info label="Rapor No" value={runData.report_no || "-"} />
            <Info label="Denetçi" value={runData.inspector_name || "-"} />
            <Info label="Sorumlu" value={runData.responsible || "-"} />
            <Info label="Lokasyon" value={runData.location || "-"} />
            <Info label={mode === "Puanlamalı" ? "Ortalama Skor" : mode === "ELMERI" ? "ELMERI Puanı" : "Uyum Skoru"} value={`%${uyumSkoru}`} />
          </div>

          <div className="section-title">Amaç ve Kapsam</div>
          <div className="noteBox">
            Bu rapor, belirtilen tarih ve lokasyonda gerçekleştirilen iş sağlığı ve güvenliği
            denetiminin bulgularını, değerlendirme sonuçlarını ve iyileştirme önerilerini içerir.
            Rapor, saha gözlemleri ve app üzerinden aktarılan denetim maddeleri esas alınarak
            hazırlanmıştır.
          </div>

          <div className="section-title">Özet Bilgiler</div>

          <div className="grid">
            <Info label="Toplam Madde" value={String(list.length)} />
            {mode === "Puanlamalı" ? (
              <>
                <Info label="Ortalama Puan" value={`%${scoreAverage}`} />
                <Info label="Skorlu Madde" value={String(scores.length)} />
                <Info label="Kapsam Dışı" value={String(kapsamDisi)} />
              </>
            ) : mode === "ELMERI" ? (
              <>
                <Info label="ELMERI Puanı" value={`%${elmeriAverage}`} />
                <Info label="ELMERI Madde" value={String(elmeriRows.length)} />
                <Info label="Kapsam Dışı" value={String(kapsamDisi)} />
              </>
            ) : (
              <>
                <Info label="Uygun" value={String(uygun)} />
                <Info label="Kısmen Uygun" value={String(kismen)} />
                <Info label="Uygunsuz" value={String(uygunsuz)} />
              </>
            )}
          </div>

          <div className="section-title">Bulguların Özeti</div>
          <div className="noteBox">{summaryText}</div>

          <div className="section-title">Denetim Bulguları</div>

          <table>
            <thead>
              <tr>
                <th className="col-no">No</th>
                <th className="col-madde">Madde</th>
                <th className="col-onlem">Önerilen Önlemler</th>
                <th className="col-sonuc">
                  {mode === "Puanlamalı" ? "Puan" : mode === "ELMERI" ? "ELMERI" : "Sonuç"}
                </th>
                <th className="col-aciklama">Açıklama / Not</th>
                <th className="col-foto">Foto</th>
              </tr>
            </thead>

            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6}>Bu denetime ait bulgu bulunamadı.</td>
                </tr>
              ) : (
                list.map((a: any, index: number) => {
                  const photoSrc = a.photo_url || "";
                  return (
                    <tr key={a.id}>
                      <td>{index + 1}</td>
                      <td>{a.item_title || "-"}</td>
                      <td>{a.recommended_action || "-"}</td>
                      <td>
                        <span className={badgeClass(a.result)}>
                          {resultLabel(a.result)}
                        </span>
                      </td>
                      <td>{a.note || "-"}</td>
                      <td>
                        {photoSrc ? (
                          <img src={photoSrc} className="photo" alt="Denetim fotoğrafı" />
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="section-title">Sonuç ve İyileştirme Önerileri</div>
          <div className="noteBox">
            Denetim kapsamında tespit edilen bulguların ilgili mevzuat, işletme prosedürleri
            ve saha koşulları dikkate alınarak giderilmesi önerilir. Uygunsuz veya düşük puanlı
            maddeler için sorumlu kişi, hedef tarih ve doğrulama yöntemi tanımlanarak düzeltici
            faaliyet planı oluşturulmalıdır.
          </div>

          <div className="section-title">Genel Değerlendirme Notu</div>
          <div className="noteBox">
            {runData.general_note ||
              "Bu rapor, denetim anındaki gözlemler esas alınarak hazırlanmıştır."}
          </div>

          <div className="footer">
            <div className="sign">
              <strong>Denetimi Gerçekleştiren</strong>
              <br />
              {runData.inspector_name || "Ad Soyad / İmza"}
            </div>

            <div className="sign">
              <strong>Firma Yetkilisi</strong>
              <br />
              {runData.responsible || "Ad Soyad / İmza"}
            </div>
          </div>

          <div style={{ marginTop: 20, fontSize: 11, color: "#64748b" }}>
            Oluşturulma Tarihi: {new Date().toLocaleString("tr-TR")}
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="value">{value || "-"}</div>
    </div>
  );
}