import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function modeLabel(mode?: string | null) {
  const m = String(mode || "").toUpperCase();

  if (m.includes("FOTO") || m.includes("PHOTO")) return "Fotoğraflı";
  if (m.includes("PUAN") || m.includes("SCOR") || m.includes("SKOR")) return "Puanlamalı";
  if (m.includes("ELMERI")) return "ELMERI";
  return "Klasik";
}

function formatDate(value?: number | string | null) {
  if (!value) return "-";

  const numeric = Number(value);
  const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("tr-TR");
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

function resultColor(result?: string | null) {
  const score = scoreValue(result);

  if (score !== null && Number.isFinite(score)) {
    if (score >= 80) return "#16a34a";
    if (score >= 50) return "#ca8a04";
    return "#dc2626";
  }

  const r = String(result || "").toUpperCase();

  if (r === "UYGUN") return "#16a34a";
  if (r === "UYGUNSUZ") return "#dc2626";
  if (r === "KISMEN") return "#ca8a04";
  if (r === "KAPSAMDISI" || r === "KAPSAM_DIŞI") return "#64748b";

  return "#334155";
}

function resultBg(result?: string | null) {
  const score = scoreValue(result);

  if (score !== null && Number.isFinite(score)) {
    if (score >= 80) return "#dcfce7";
    if (score >= 50) return "#fef3c7";
    return "#fee2e2";
  }

  const r = String(result || "").toUpperCase();

  if (r === "UYGUN") return "#dcfce7";
  if (r === "UYGUNSUZ") return "#fee2e2";
  if (r === "KISMEN") return "#fef3c7";
  if (r === "KAPSAMDISI" || r === "KAPSAM_DIŞI") return "#e2e8f0";

  return "#f1f5f9";
}

function isWebPhoto(src?: string | null) {
  const value = String(src || "").trim();
  return value.startsWith("http://") || value.startsWith("https://");
}

export default async function DenetimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = getSupabase();

  const { id } = await params;
  const requestedId = Number(id);

  let { data: runData, error: runError } = await supabase
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
    runError = fallback.error;
  }

  if (!runData || runError) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Denetim bulunamadı</h1>
        <p>Aranan ID: {String(id)}</p>
        <Link href="/admin/denetimler">Geri dön</Link>
      </main>
    );
  }

  const appRunId = runData.app_run_id || runData.id;
  const remoteRunId = Number(runData.id);
  const mode = modeLabel(runData.eval_mode);

  const { data: answers } = await supabase
    .from("denetim_answers")
    .select("*")
    .eq("run_remote_id", remoteRunId)
    .order("id", { ascending: true });

  const answerList = answers || [];

  const uygunCount = answerList.filter(
    (a: any) => String(a.result || "").toUpperCase() === "UYGUN"
  ).length;

  const kismenCount = answerList.filter(
    (a: any) => String(a.result || "").toUpperCase() === "KISMEN"
  ).length;

  const uygunsuzCount = answerList.filter(
    (a: any) => String(a.result || "").toUpperCase() === "UYGUNSUZ"
  ).length;

  const kapsamDisiCount = answerList.filter((a: any) => {
    const r = String(a.result || "").toUpperCase();
    return r === "KAPSAMDISI" || r === "KAPSAM_DIŞI";
  }).length;

  const scores: number[] = answerList
    .map((a: any) => scoreValue(a.result))
    .filter((v: number | null): v is number => {
      return v !== null && Number.isFinite(v);
    });

  const scoreAverage =
    scores.length > 0
      ? Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length)
      : 0;

  const lowScoreCount = scores.filter((s) => s < 50).length;

  const klasikUyum = Math.round(
    (uygunCount * 100 + kismenCount * 50) /
      (uygunCount + kismenCount + uygunsuzCount || 1)
  );

  const uyumSkoru = mode === "Puanlamalı" ? scoreAverage : klasikUyum;

  return (
    <main
      style={{
        padding: 32,
        background: "#fafafa",
        minHeight: "100vh",
      }}
    >
      <Link
        href="/admin/denetimler"
        style={{
          display: "inline-block",
          marginBottom: 18,
          color: "#5a0f1f",
          fontWeight: 900,
          textDecoration: "none",
        }}
      >
        ← Denetimlere Dön
      </Link>

      <section
        style={{
          borderRadius: 30,
          padding: 34,
          background:
            "linear-gradient(135deg, #5a0f1f 0%, #c62828 58%, #8f172c 100%)",
          color: "#fff",
          marginBottom: 26,
          boxShadow: "0 22px 70px rgba(90,15,31,0.28)",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 900, opacity: 0.86 }}>
          D-SEC • Denetim Raporu
        </div>

        <h1
          style={{
            fontSize: 42,
            fontWeight: 1000,
            margin: "10px 0 12px",
            letterSpacing: "-0.8px",
          }}
        >
          {runData.firm_name || "Firma Ünvanı Yok"}
        </h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Tag label={mode} />
          <Tag label={runData.template_type || "-"} />
          <Tag
            label={formatDate(
              runData.audit_date_millis || runData.created_at_millis
            )}
          />
          <Tag label={`Rapor No: ${runData.report_no || "-"}`} />

          <Link
            href={`/admin/denetimler/${appRunId}/print`}
            target="_blank"
            style={{
              display: "inline-block",
              background: "#111827",
              padding: "10px 16px",
              borderRadius: 10,
              color: "#fff",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            📄 Kurumsal PDF Raporu
          </Link>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <KPI title="Denetçi" value={runData.inspector_name || "-"} />
        <KPI title="Sorumlu" value={runData.responsible || "-"} />
        <KPI title="Lokasyon" value={runData.location || "-"} />
        <KPI title="Toplam Madde" value={String(answerList.length)} />
      </section>

      {mode === "Puanlamalı" ? (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <StatusCard
            title="Ortalama Puan"
            value={scoreAverage}
            color="#5a0f1f"
            bg="#f4e6e6"
            suffix="%"
          />
          <StatusCard
            title="Skorlu Madde"
            value={scores.length}
            color="#2563eb"
            bg="#dbeafe"
          />
          <StatusCard
            title="Düşük Puan"
            value={lowScoreCount}
            color="#dc2626"
            bg="#fee2e2"
          />
          <StatusCard
            title="Kapsam Dışı"
            value={kapsamDisiCount}
            color="#64748b"
            bg="#e2e8f0"
          />
        </section>
      ) : (
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <StatusCard title="Uygun" value={uygunCount} color="#16a34a" bg="#dcfce7" />
          <StatusCard title="Kısmen Uygun" value={kismenCount} color="#ca8a04" bg="#fef3c7" />
          <StatusCard title="Uygunsuz" value={uygunsuzCount} color="#dc2626" bg="#fee2e2" />
          <StatusCard title="Kapsam Dışı" value={kapsamDisiCount} color="#64748b" bg="#e2e8f0" />
        </section>
      )}

      <section
        style={{
          background: "#fff",
          padding: 20,
          borderRadius: 20,
          marginBottom: 20,
          border: "1px solid #eee",
          boxShadow: "0 12px 34px rgba(15,23,42,0.05)",
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 8 }}>
          {mode === "Puanlamalı" ? "Ortalama Skor" : "Genel Uyum Skoru"}
        </div>

        <div style={{ fontSize: 32, fontWeight: 1000, color: "#5a0f1f" }}>
          %{uyumSkoru}
        </div>
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: 24,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          boxShadow: "0 18px 50px rgba(15,23,42,0.06)",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid #eef2f7",
            background: "#fff",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 1000, color: "#111827" }}>
            Denetim Bulguları
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: "#64748b" }}>
            Maddeler, sonuçlar, önerilen önlemler ve açıklamalar
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.35fr 2.1fr 1fr 2.2fr 1.8fr 1.1fr",
            padding: "14px 22px",
            background: "#f8fafc",
            fontWeight: 900,
            fontSize: 13,
            color: "#334155",
          }}
        >
          <div>No</div>
          <div>Madde</div>
          <div>{mode === "Puanlamalı" ? "Puan" : "Sonuç"}</div>
          <div>Önerilen Önlem</div>
          <div>Açıklama</div>
          <div>Foto</div>
        </div>

        {answerList.length === 0 ? (
          <div style={{ padding: 24, color: "#64748b" }}>
            Bu denetime ait bulgu/madde kaydı bulunamadı.
          </div>
        ) : (
          answerList.map((a: any, index: number) => {
            const photoSrc = a.photo_url || a.photo_path || "";
            const canShowPhoto = isWebPhoto(photoSrc);

            return (
              <div
                key={a.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "0.35fr 2.1fr 1fr 2.2fr 1.8fr 1.1fr",
                  padding: "18px 22px",
                  borderTop: "1px solid #eef2f7",
                  background: index % 2 === 0 ? "#ffffff" : "#fbfbfb",
                  fontSize: 14,
                  alignItems: "start",
                  gap: 14,
                }}
              >
                <div style={{ fontWeight: 1000, color: "#475569" }}>
                  {index + 1}
                </div>

                <div style={{ fontWeight: 900, color: "#111827", lineHeight: 1.45 }}>
                  {a.item_title || "-"}
                </div>

                <div>
                  <span
                    style={{
                      display: "inline-flex",
                      padding: "7px 10px",
                      borderRadius: 999,
                      background: resultBg(a.result),
                      color: resultColor(a.result),
                      fontWeight: 1000,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {resultLabel(a.result)}
                  </span>
                </div>

                <div style={{ color: "#334155", lineHeight: 1.45 }}>
                  {a.recommended_action || "-"}
                </div>

                <div style={{ color: "#475569", lineHeight: 1.45 }}>
                  {a.note || "-"}
                </div>

                <div>
                  {canShowPhoto ? (
                    <a
                      href={photoSrc}
                      target="_blank"
                      style={{ display: "inline-block" }}
                    >
                      <img
                        src={photoSrc}
                        alt="Denetim fotoğrafı"
                        style={{
                          width: 96,
                          height: 76,
                          objectFit: "cover",
                          borderRadius: 12,
                          border: "2px solid #e5e7eb",
                          cursor: "pointer",
                          background: "#f8fafc",
                        }}
                      />
                    </a>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}

function KPI({ title, value }: { title: string; value: string }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: 20,
        border: "1px solid #e5e7eb",
        boxShadow: "0 12px 34px rgba(15,23,42,0.05)",
      }}
    >
      <div style={{ color: "#64748b", fontSize: 13, fontWeight: 900 }}>
        {title}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 1000,
          marginTop: 8,
          color: "#111827",
        }}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function StatusCard({
  title,
  value,
  color,
  bg,
  suffix = "",
}: {
  title: string;
  value: number;
  color: string;
  bg: string;
  suffix?: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        padding: 20,
        border: "1px solid #e5e7eb",
        boxShadow: "0 12px 34px rgba(15,23,42,0.05)",
      }}
    >
      <div style={{ color: "#64748b", fontSize: 13, fontWeight: 900 }}>
        {title}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <div style={{ fontSize: 32, fontWeight: 1000, color }}>
          {value}
          {suffix}
        </div>

        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: bg,
            display: "grid",
            placeItems: "center",
            color,
            fontWeight: 1000,
          }}
        >
          ●
        </div>
      </div>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span
      style={{
        padding: "8px 13px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.16)",
        border: "1px solid rgba(255,255,255,0.20)",
        fontSize: 12,
        fontWeight: 900,
      }}
    >
      {label}
    </span>
  );
}