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

export default async function AdminDenetimlerPage() {
  const supabase = getSupabase();

  const { data: runs, error } = await supabase
    .from("denetim_runs")
    .select("*")
    .order("inserted_at", { ascending: false });

  const runIds = (runs || []).map((r) => r.id);

  const { data: answers } = runIds.length
    ? await supabase
        .from("denetim_answers")
        .select("*")
        .in("run_remote_id", runIds)
    : { data: [] as any[] };

  const countByRun = new Map<number, number>();

  (answers || []).forEach((a: any) => {
    countByRun.set(
      Number(a.run_remote_id),
      (countByRun.get(Number(a.run_remote_id)) || 0) + 1
    );
  });

  return (
    <main style={{ padding: 32 }}>
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
          D-SEC Denetim Merkezi
        </div>

        <h1 style={{ fontSize: 38, margin: "10px 0 8px", fontWeight: 1000 }}>
          App Denetimleri
        </h1>

        <p style={{ margin: 0, opacity: 0.9 }}>
          Android app üzerinden tamamlanan klasik, fotoğraflı, puanlamalı ve
          ELMERI denetimler burada listelenir.
        </p>
      </section>

      {error && (
        <div
          style={{
            padding: 16,
            borderRadius: 16,
            background: "#fee2e2",
            color: "#991b1b",
            marginBottom: 20,
            fontWeight: 800,
          }}
        >
          Denetimler alınamadı: {error.message}
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 22,
        }}
      >
        <Kpi title="Toplam Denetim" value={(runs || []).length} />
        <Kpi
          title="Klasik"
          value={
            (runs || []).filter(
              (r: any) => modeLabel(r.eval_mode) === "Klasik"
            ).length
          }
        />
        <Kpi
          title="Fotoğraflı"
          value={
            (runs || []).filter(
              (r: any) => modeLabel(r.eval_mode) === "Fotoğraflı"
            ).length
          }
        />
        <Kpi
          title="Puan / ELMERI"
          value={
            (runs || []).filter((r: any) =>
              ["Puanlamalı", "ELMERI"].includes(modeLabel(r.eval_mode))
            ).length
          }
        />
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
            gridTemplateColumns: "1.3fr 1fr 1fr 1fr 1fr 0.8fr 1fr",
            padding: "14px 18px",
            background: "#f8fafc",
            fontWeight: 900,
            fontSize: 13,
            color: "#334155",
          }}
        >
          <div>Firma</div>
          <div>Tür</div>
          <div>Şablon</div>
          <div>Denetçi</div>
          <div>Tarih</div>
          <div>Madde</div>
          <div>Detay</div>
        </div>

        {(runs || []).length === 0 ? (
          <div style={{ padding: 30, color: "#64748b" }}>
            Henüz app üzerinden gelen denetim yok.
          </div>
        ) : (
          (runs || []).map((r: any) => (
            <div
              key={r.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.3fr 1fr 1fr 1fr 1fr 0.8fr 1fr",
                padding: "16px 18px",
                borderTop: "1px solid #eef2f7",
                alignItems: "center",
                fontSize: 14,
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 900 }}>
                {r.firm_name || "Firma Ünvanı Yok"}
              </div>

              <div>{modeLabel(r.eval_mode)}</div>

              <div>{r.template_type || "-"}</div>

              <div>{r.inspector_name || "-"}</div>

              <div>
                {formatDate(r.audit_date_millis || r.created_at_millis)}
              </div>

              <div style={{ fontWeight: 900 }}>
                {countByRun.get(Number(r.id)) || 0}
              </div>

              <Link
                 href={`/admin/denetimler/${r.app_run_id}`}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: "#5a0f1f",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 900,
                  textAlign: "center",
                  fontSize: 13,
                }}
              >
                Aç
              </Link>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
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
      <div style={{ fontSize: 30, fontWeight: 1000, marginTop: 8 }}>
        {value}
      </div>
    </div>
  );
}