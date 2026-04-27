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

function formatDate(value?: number | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("tr-TR");
}

export default async function DenetimDetailPage({ params }: any) {
  const supabase = getSupabase();

  // URL'den gelen değer: app_run_id
  const appRunId = Number(params?.id);

  const { data: run } = await supabase
    .from("denetim_runs")
    .select("*")
    .eq("app_run_id", appRunId)
    .maybeSingle();

  const remoteRunId = run?.id ? Number(run.id) : 0;

  const { data: answers } = remoteRunId
    ? await supabase
        .from("denetim_answers")
        .select("*")
        .eq("run_remote_id", remoteRunId)
        .order("id", { ascending: true })
    : { data: [] as any[] };

  if (!run) {
    return (
      <main style={{ padding: 32 }}>
        <h1>Denetim bulunamadı</h1>
        <Link href="/admin/denetimler">Geri dön</Link>
      </main>
    );
  }

  return (
    <main style={{ padding: 32 }}>
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
          borderRadius: 28,
          padding: 28,
          background: "linear-gradient(135deg, #5a0f1f, #c62828)",
          color: "#fff",
          marginBottom: 24,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 900, opacity: 0.85 }}>
          D-SEC Denetim Detayı
        </div>

        <h1 style={{ fontSize: 34, margin: "10px 0 8px", fontWeight: 1000 }}>
          {run.firm_name || "Firma Ünvanı Yok"}
        </h1>

        <p style={{ margin: 0, opacity: 0.9 }}>
          {modeLabel(run.eval_mode)} • {run.template_type || "-"} •{" "}
          {formatDate(run.audit_date_millis || run.created_at_millis)}
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <Info title="Denetçi" value={run.inspector_name || "-"} />
        <Info title="Sorumlu" value={run.responsible || "-"} />
        <Info title="Lokasyon" value={run.location || "-"} />
        <Info title="Madde Sayısı" value={String((answers || []).length)} />
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: 22,
          border: "1px solid #eee",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "0.4fr 2fr 1fr 2fr 2fr",
            padding: "14px 18px",
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
        </div>

        {(answers || []).map((a: any, index: number) => (
          <div
            key={a.id}
            style={{
              display: "grid",
              gridTemplateColumns: "0.4fr 2fr 1fr 2fr 2fr",
              padding: "16px 18px",
              borderTop: "1px solid #eef2f7",
              fontSize: 14,
              alignItems: "start",
              gap: 10,
            }}
          >
            <div style={{ fontWeight: 900 }}>{index + 1}</div>
            <div style={{ fontWeight: 800 }}>{a.item_title || "-"}</div>
            <div style={{ fontWeight: 900 }}>{a.result || "-"}</div>
            <div>{a.recommended_action || "-"}</div>
            <div>{a.note || "-"}</div>
          </div>
        ))}
      </section>
    </main>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 18,
        padding: 18,
        border: "1px solid #eee",
      }}
    >
      <div style={{ color: "#64748b", fontSize: 13, fontWeight: 800 }}>
        {title}
      </div>
      <div style={{ fontSize: 18, fontWeight: 1000, marginTop: 8 }}>
        {value}
      </div>
    </div>
  );
}