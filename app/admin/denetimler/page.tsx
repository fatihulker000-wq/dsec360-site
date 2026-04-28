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

function modeColor(mode?: string | null) {
  const label = modeLabel(mode);

  if (label === "Fotoğraflı") return { bg: "#eff6ff", color: "#1d4ed8" };
  if (label === "Puanlamalı") return { bg: "#fff7ed", color: "#c2410c" };
  if (label === "ELMERI") return { bg: "#f0fdf4", color: "#15803d" };

  return { bg: "#f1f5f9", color: "#334155" };
}

function formatDate(value?: number | string | null) {
  if (!value) return "-";

  const numeric = Number(value);
  const date = Number.isFinite(numeric) ? new Date(numeric) : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("tr-TR");
}

export default async function AdminDenetimlerPage() {
  const supabase = getSupabase();

  const { data: runs, error } = await supabase
    .from("denetim_runs")
    .select("*")
    .order("inserted_at", { ascending: false });

  const safeRuns = runs || [];
  const runIds = safeRuns.map((r: any) => r.id);

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

  const klasikCount = safeRuns.filter(
    (r: any) => modeLabel(r.eval_mode) === "Klasik"
  ).length;

  const fotografliCount = safeRuns.filter(
    (r: any) => modeLabel(r.eval_mode) === "Fotoğraflı"
  ).length;

  const puanElmeriCount = safeRuns.filter((r: any) =>
    ["Puanlamalı", "ELMERI"].includes(modeLabel(r.eval_mode))
  ).length;

  const totalAnswers = (answers || []).length;

  return (
    <main
      style={{
        padding: 32,
        background:
          "radial-gradient(circle at top right, rgba(198,40,40,0.08), transparent 34%), #fafafa",
        minHeight: "100vh",
      }}
    >
      <section
        style={{
          borderRadius: 32,
          padding: 34,
          background:
            "linear-gradient(135deg, #4a0d1a 0%, #7a1224 45%, #c62828 100%)",
          color: "#fff",
          marginBottom: 24,
          boxShadow: "0 22px 70px rgba(90,15,31,0.24)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "7px 12px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.18)",
            fontSize: 12,
            fontWeight: 900,
            marginBottom: 14,
          }}
        >
          D-SEC Denetim Merkezi
        </div>

        <h1
          style={{
            fontSize: 42,
            margin: "0 0 10px",
            fontWeight: 1000,
            letterSpacing: "-0.8px",
          }}
        >
          App Denetimleri
        </h1>

        <p
          style={{
            margin: 0,
            opacity: 0.9,
            fontSize: 15,
            maxWidth: 760,
            lineHeight: 1.6,
            fontWeight: 600,
          }}
        >
          Android app üzerinden tamamlanan klasik, fotoğraflı, puanlamalı ve
          ELMERI denetimler tek merkezden izlenir. Detay ekranından bulgular,
          önerilen önlemler ve kurumsal PDF raporu açılır.
        </p>
      </section>

      {error && (
        <div
          style={{
            padding: 16,
            borderRadius: 18,
            background: "#fee2e2",
            color: "#991b1b",
            marginBottom: 20,
            fontWeight: 900,
            border: "1px solid #fecaca",
          }}
        >
          Denetimler alınamadı: {error.message}
        </div>
      )}

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Kpi title="Toplam Denetim" value={safeRuns.length} desc="App kaynaklı kayıt" />
        <Kpi title="Klasik" value={klasikCount} desc="Standart kontrol" />
        <Kpi title="Fotoğraflı" value={fotografliCount} desc="Görsel kanıtlı" />
        <Kpi title="Toplam Madde" value={totalAnswers} desc="Aktarılan bulgu" />
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: 26,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          boxShadow: "0 18px 54px rgba(15,23,42,0.06)",
        }}
      >
        <div
          style={{
            padding: "20px 22px",
            borderBottom: "1px solid #eef2f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 21,
                fontWeight: 1000,
                color: "#111827",
              }}
            >
              Denetim Kayıtları
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                color: "#64748b",
                fontWeight: 650,
              }}
            >
              Firma, denetim türü, şablon, denetçi, tarih ve madde sayısı
            </div>
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              color: "#334155",
              fontSize: 12,
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            {safeRuns.length} kayıt
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 1fr 1fr 1fr 1fr 0.7fr 1fr",
            padding: "14px 22px",
            background: "#f8fafc",
            fontWeight: 1000,
            fontSize: 12,
            color: "#334155",
            letterSpacing: "0.2px",
          }}
        >
          <div>Firma</div>
          <div>Tür</div>
          <div>Şablon</div>
          <div>Denetçi</div>
          <div>Tarih</div>
          <div>Madde</div>
          <div>İşlem</div>
        </div>

        {safeRuns.length === 0 ? (
          <div
            style={{
              padding: 34,
              color: "#64748b",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            Henüz app üzerinden gelen denetim yok.
          </div>
        ) : (
          safeRuns.map((r: any, index: number) => {
            const mode = modeLabel(r.eval_mode);
            const colors = modeColor(r.eval_mode);
            const detailId = r.app_run_id || r.id;

            return (
              <div
                key={r.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.3fr 1fr 1fr 1fr 1fr 0.7fr 1fr",
                  padding: "17px 22px",
                  borderTop: "1px solid #eef2f7",
                  alignItems: "center",
                  fontSize: 14,
                  gap: 10,
                  background: index % 2 === 0 ? "#ffffff" : "#fbfbfd",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 1000,
                      color: "#111827",
                      marginBottom: 4,
                    }}
                  >
                    {r.firm_name || "Firma Ünvanı Yok"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      fontWeight: 700,
                    }}
                  >
                    App Run ID: {r.app_run_id || "-"} • Remote ID: {r.id}
                  </div>
                </div>

                <div>
                  <span
                    style={{
                      display: "inline-flex",
                      padding: "7px 10px",
                      borderRadius: 999,
                      background: colors.bg,
                      color: colors.color,
                      fontWeight: 1000,
                      fontSize: 12,
                    }}
                  >
                    {mode}
                  </span>
                </div>

                <div style={{ fontWeight: 850, color: "#334155" }}>
                  {r.template_type || "-"}
                </div>

                <div style={{ color: "#334155", fontWeight: 750 }}>
                  {r.inspector_name || "-"}
                </div>

                <div style={{ color: "#334155", fontWeight: 750 }}>
                  {formatDate(r.audit_date_millis || r.created_at_millis)}
                </div>

                <div
                  style={{
                    fontWeight: 1000,
                    color: "#5a0f1f",
                    fontSize: 16,
                  }}
                >
                  {countByRun.get(Number(r.id)) || 0}
                </div>

                <Link
                  href={`/admin/denetimler/${detailId}`}
                  style={{
                    padding: "9px 13px",
                    borderRadius: 12,
                    background: "linear-gradient(135deg, #5a0f1f, #c62828)",
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: 1000,
                    textAlign: "center",
                    fontSize: 13,
                    boxShadow: "0 10px 24px rgba(90,15,31,0.18)",
                  }}
                >
                  Detayı Aç
                </Link>
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}

function Kpi({
  title,
  value,
  desc,
}: {
  title: string;
  value: number;
  desc: string;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 22,
        padding: 20,
        border: "1px solid #e5e7eb",
        boxShadow: "0 14px 38px rgba(15,23,42,0.05)",
      }}
    >
      <div style={{ color: "#64748b", fontSize: 13, fontWeight: 900 }}>
        {title}
      </div>
      <div
        style={{
          fontSize: 34,
          fontWeight: 1000,
          marginTop: 8,
          color: "#111827",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 8,
          color: "#94a3b8",
          fontSize: 12,
          fontWeight: 750,
        }}
      >
        {desc}
      </div>
    </div>
  );
}