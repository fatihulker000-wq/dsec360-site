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
  if (m.includes("PUAN") || m.includes("SCOR")) return "Puanlamalı";
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

function resultColor(result?: string | null) {
  const r = String(result || "").toUpperCase();

  if (r === "UYGUN") return "#16a34a";
  if (r === "UYGUNSUZ") return "#dc2626";
  if (r === "KISMEN") return "#ca8a04";
  if (r === "KAPSAMDISI" || r === "KAPSAM_DIŞI") return "#64748b";

  return "#334155";
}

function resultBg(result?: string | null) {
  const r = String(result || "").toUpperCase();

  if (r === "UYGUN") return "#dcfce7";
  if (r === "UYGUNSUZ") return "#fee2e2";
  if (r === "KISMEN") return "#fef3c7";
  if (r === "KAPSAMDISI" || r === "KAPSAM_DIŞI") return "#e2e8f0";

  return "#f1f5f9";
}

export default async function DenetimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = getSupabase();

  const { id } = await params;
  const appRunId = Number(id);

  const { data: runData, error: runError } = await supabase
    .from("denetim_runs")
    .select("*")
    .eq("app_run_id", appRunId)
    .maybeSingle();

  if (!runData || runError) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Denetim bulunamadı</h1>
        <p>Aranan App Run ID: {String(id)}</p>
        <Link href="/admin/denetimler">Geri dön</Link>
      </main>
    );
  }

  const remoteRunId = Number(runData.id);

  const { data: answers } = await supabase
    .from("denetim_answers")
    .select("*")
    .eq("run_remote_id", remoteRunId)
    .order("id", { ascending: true });

  const answerList = answers || [];

  const uygunCount = answerList.filter((a: any) => a.result === "UYGUN").length;
  const kismenCount = answerList.filter((a: any) => a.result === "KISMEN").length;
  const uygunsuzCount = answerList.filter((a: any) => a.result === "UYGUNSUZ").length;
  const kapsamDisiCount = answerList.filter((a: any) => a.result === "KAPSAMDISI").length;

  const uyumSkoru = Math.round(
    (uygunCount * 100 + kismenCount * 50) /
      (uygunCount + kismenCount + uygunsuzCount || 1)
  );

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
          <Tag label={modeLabel(runData.eval_mode)} />
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
          Genel Uyum Skoru
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
            gridTemplateColumns: "0.35fr 2.2fr 1fr 2fr 2fr 0.8fr",
            padding: "14px 22px",
            background: "#f8fafc",
            fontWeight: 900,
            fontSize: 13,
            color: "#334155",
          }}
        >
          <div>No</div>
          <div>Madde</div>
          <div>Sonuç</div>
          <div>Önerilen Önlem</div>
          <div>Açıklama</div>
          <div>Foto</div>
        </div>

        {answerList.length === 0 ? (
          <div style={{ padding: 24, color: "#64748b" }}>
            Bu denetime ait bulgu/madde kaydı bulunamadı.
          </div>
        ) : (
          answerList.map((a: any, index: number) => (
            <div
              key={a.id}
              style={{
                display: "grid",
                gridTemplateColumns: "0.35fr 2.2fr 1fr 2fr 2fr 0.8fr",
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
                  {a.result || "-"}
                </span>
              </div>

              <div style={{ color: "#334155", lineHeight: 1.45 }}>
                {a.recommended_action || "-"}
              </div>

              <div style={{ color: "#475569", lineHeight: 1.45 }}>
                {a.note || "-"}
              </div>

              <div>
                {a.photo_url ? (
                  <a href={a.photo_url} target="_blank">
                    <img
                      src={a.photo_url}
                      alt="Denetim fotoğrafı"
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    />
                  </a>
                ) : (
                  "-"
                )}
              </div>
            </div>
          ))
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
}: {
  title: string;
  value: number;
  color: string;
  bg: string;
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
        <div style={{ fontSize: 32, fontWeight: 1000, color }}>{value}</div>

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