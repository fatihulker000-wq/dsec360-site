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
  return Number(r.replace("SCORE:", "").trim());
}

function resultLabel(result?: string | null) {
  const score = scoreValue(result);
  if (score !== null && Number.isFinite(score)) return `${score} Puan`;

  const r = String(result || "").toUpperCase();
  if (r === "UYGUN") return "Uygun";
  if (r === "KISMEN") return "Kısmen Uygun";
  if (r === "UYGUNSUZ") return "Uygunsuz";
  if (r === "KAPSAMDISI" || r === "KAPSAM_DIŞI") return "Kapsam Dışı";
  return result || "-";
}

function badgeClass(result?: string | null) {
  const score = scoreValue(result);
  if (score !== null && Number.isFinite(score)) {
    if (score >= 80) return "badge good";
    if (score >= 50) return "badge mid";
    return "badge bad";
  }

  const r = String(result || "").toUpperCase();
  if (r === "UYGUN") return "badge good";
  if (r === "KISMEN") return "badge mid";
  if (r === "UYGUNSUZ") return "badge bad";
  return "badge neutral";
}

export default async function InspectionPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = getSupabase();

  const { id } = await params;
  const requestedId = Number(id || 0);

  if (!requestedId) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Geçersiz denetim ID</h1>
        <Link href="/admin/denetimler">Geri dön</Link>
      </main>
    );
  }

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
        <p>Aranan ID: {requestedId}</p>
        <Link href="/admin/denetimler">Geri dön</Link>
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

  const scores: number[] = list
  .map((a: any) => scoreValue(a.result))
  .filter((v: number | null): v is number => {
    return v !== null && Number.isFinite(v);
  });

  const uygun = list.filter((a: any) => String(a.result).toUpperCase() === "UYGUN").length;
  const kismen = list.filter((a: any) => String(a.result).toUpperCase() === "KISMEN").length;
  const uygunsuz = list.filter((a: any) => String(a.result).toUpperCase() === "UYGUNSUZ").length;
  const kapsamDisi = list.filter((a: any) => {
    const r = String(a.result || "").toUpperCase();
    return r === "KAPSAMDISI" || r === "KAPSAM_DIŞI";
  }).length;

  const scoreAverage =
    scores.length > 0
      ? Math.round(scores.reduce((sum: number, v: number) => sum + v, 0) / scores.length)
      : 0;

  const klasikUyum = Math.round(
    (uygun * 100 + kismen * 50) / (uygun + kismen + uygunsuz || 1)
  );

  const uyumSkoru = mode === "Puanlamalı" ? scoreAverage : klasikUyum;

  return (
    <main className="page">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .page { padding: 0 !important; }
          .sheet { box-shadow: none !important; border: none !important; }
          @page { size: A4; margin: 14mm; }
        }

        body { background: #f3f4f6; }

        .page {
          padding: 28px;
          font-family: Arial, sans-serif;
          color: #111827;
        }

        .sheet {
          max-width: 980px;
          margin: 0 auto;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(15,23,42,.10);
        }

        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        tr { page-break-inside: avoid; }
        table { page-break-inside: auto; }

        .hero {
          padding: 30px;
          color: white;
          background: linear-gradient(135deg,#4a0d1a,#c62828,#8f172c);
        }

        .brand {
          font-size: 13px;
          font-weight: 900;
          opacity: .9;
          letter-spacing: .4px;
        }

        .title {
          font-size: 34px;
          font-weight: 1000;
          margin: 10px 0 8px;
        }

        .subtitle {
          font-size: 14px;
          opacity: .92;
          font-weight: 700;
          line-height: 1.5;
        }

        .content { padding: 26px 30px 34px; }

        .grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 22px;
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
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        th {
          background: #f8fafc;
          color: #334155;
          text-align: left;
          padding: 10px;
          border: 1px solid #e5e7eb;
          font-size: 12px;
        }

        td {
          padding: 10px;
          border: 1px solid #e5e7eb;
          vertical-align: top;
          line-height: 1.45;
        }

        .section-title {
          font-size: 18px;
          font-weight: 1000;
          margin: 24px 0 10px;
        }

        .badge {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
        }

        .good { background: #dcfce7; color: #15803d; }
        .mid { background: #fef3c7; color: #b45309; }
        .bad { background: #fee2e2; color: #b91c1c; }
        .neutral { background: #f1f5f9; color: #475569; }

        .footer {
          margin-top: 28px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .sign {
          height: 82px;
          border: 1px dashed #cbd5e1;
          border-radius: 14px;
          padding: 12px;
          font-size: 12px;
          color: #475569;
        }

        .actions {
          max-width: 980px;
          margin: 0 auto 16px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .btn {
          border: 0;
          border-radius: 12px;
          padding: 11px 15px;
          font-weight: 900;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }

        .primary {
          background: #5a0f1f;
          color: white;
        }

        .secondary {
          background: white;
          color: #5a0f1f;
          border: 1px solid #e5e7eb;
        }

        .photo {
          width: 64px;
          height: 64px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #ddd;
        }
      `}</style>

      <div className="actions no-print">
        <Link className="btn secondary" href={`/admin/denetimler/${appRunId}`}>
          ← Detaya Dön
        </Link>

        <button className="btn primary" type="button">
          PDF için: Ctrl + P / Yazdır
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
            {runData.firm_name || "Firma Ünvanı Yok"} • {mode} •{" "}
            {formatDate(runData.audit_date_millis || runData.created_at_millis)} •
            Rapor No: {runData.report_no || "-"}
          </div>
        </div>

        <div className="content">
          <div className="grid">
            <Info label="Firma" value={runData.firm_name || "-"} />
            <Info label="Denetim Türü" value={mode} />
            <Info label="Şablon" value={runData.template_type || "-"} />
            <Info label="Rapor No" value={runData.report_no || "-"} />
            <Info label="Denetçi" value={runData.inspector_name || "-"} />
            <Info label="Sorumlu" value={runData.responsible || "-"} />
            <Info label="Lokasyon" value={runData.location || "-"} />
            <Info label={mode === "Puanlamalı" ? "Ortalama Skor" : "Uyum Skoru"} value={`%${uyumSkoru}`} />
          </div>

          <div className="section-title">Özet Sonuçlar</div>

          <div className="grid">
            <Info label="Toplam Madde" value={String(list.length)} />
            {mode === "Puanlamalı" ? (
              <>
                <Info label="Ortalama Puan" value={`%${scoreAverage}`} />
                <Info label="Skorlu Madde" value={String(scores.length)} />
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

          <div className="section-title">Denetim Bulguları</div>

          <table>
            <thead>
              <tr>
                <th style={{ width: 42 }}>No</th>
                <th>Madde</th>
                <th style={{ width: 110 }}>{mode === "Puanlamalı" ? "Puan" : "Sonuç"}</th>
                <th>Önerilen Önlem</th>
                <th>Açıklama</th>
                <th>Foto</th>
              </tr>
            </thead>

            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6}>Bu denetime ait bulgu bulunamadı.</td>
                </tr>
              ) : (
                list.map((a: any, index: number) => {
                  const photoSrc = a.photo_url || a.photo_path || "";

                  return (
                    <tr key={a.id}>
                      <td>{index + 1}</td>
                      <td>{a.item_title || "-"}</td>
                      <td>
                        <span className={badgeClass(a.result)}>
                          {resultLabel(a.result)}
                        </span>
                      </td>
                      <td>{a.recommended_action || "-"}</td>
                      <td>{a.note || "-"}</td>
                      <td>
                        {photoSrc && !String(photoSrc).startsWith("content://") ? (
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

          <div className="section-title">Sonuç ve Değerlendirme</div>

          <p style={{ lineHeight: 1.7, color: "#334155", fontSize: 13 }}>
            Bu rapor, denetim sırasında elde edilen bulgulara göre hazırlanmıştır.
            Puanlamalı denetimlerde değerlendirme, madde bazlı skor ortalaması üzerinden;
            klasik denetimlerde uygun, kısmen uygun ve uygunsuz sonuçları üzerinden yapılır.
          </p>

          <div className="footer">
            <div className="sign">
              <strong>Denetimi Gerçekleştiren</strong>
              <br />
              Ad Soyad / İmza
            </div>

            <div className="sign">
              <strong>Firma Yetkilisi</strong>
              <br />
              Ad Soyad / İmza
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