import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { CSSProperties, ReactNode } from "react";

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

function cleanFirmName(name?: string | null) {
  const v = String(name || "").trim();
  if (!v) return "Firma Ünvanı Yok";
  if (v.toLowerCase() === "firma") return "Firma Ünvanı Yok";
  return v;
}

function makeQuery(type: string, firm: string) {
  const params = new URLSearchParams();

  if (type && type !== "ALL") params.set("type", type);
  if (firm && firm !== "ALL") params.set("firm", firm);

  const q = params.toString();
  return q ? `/admin/denetimler?${q}` : "/admin/denetimler";
}

async function deleteDenetimAction(formData: FormData) {
  "use server";

  const remoteId = Number(formData.get("remoteId") || 0);
  if (!remoteId) return;

  const supabase = getSupabase();

  await supabase.from("denetim_answers").delete().eq("run_remote_id", remoteId);
  await supabase.from("denetim_runs").delete().eq("id", remoteId);

  revalidatePath("/admin/denetimler");
  redirect("/admin/denetimler");
}

export default async function AdminDenetimlerPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string; firm?: string }>;
}) {
  const sp = await searchParams;
  const activeType = String(sp?.type || "ALL").toUpperCase();
  const activeFirm = String(sp?.firm || "ALL");

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

  const answerList = answers || [];

  const countByRun = new Map<number, number>();
  answerList.forEach((a: any) => {
    const key = Number(a.run_remote_id);
    countByRun.set(key, (countByRun.get(key) || 0) + 1);
  });

  const firmOptions = Array.from(
    new Set(
      safeRuns
        .map((r: any) => cleanFirmName(r.firm_name))
        .filter((x: string) => x && x !== "Firma Ünvanı Yok")
    )
  ).sort((a, b) => a.localeCompare(b, "tr"));

  const filteredRuns = safeRuns.filter((r: any) => {
    const label = modeLabel(r.eval_mode).toUpperCase();
    const firmName = cleanFirmName(r.firm_name);

    const typeOk =
      activeType === "ALL" ||
      (activeType === "KLASIK" && label === "KLASIK") ||
      (activeType === "FOTO" && label === "FOTOĞRAFLI") ||
      (activeType === "PUAN" && label === "PUANLAMALI") ||
      (activeType === "ELMERI" && label === "ELMERI");

    const firmOk = activeFirm === "ALL" || firmName === activeFirm;

    return typeOk && firmOk;
  });

  const klasikCount = safeRuns.filter((r: any) => modeLabel(r.eval_mode) === "Klasik").length;
  const fotografliCount = safeRuns.filter((r: any) => modeLabel(r.eval_mode) === "Fotoğraflı").length;
  const puanCount = safeRuns.filter((r: any) => modeLabel(r.eval_mode) === "Puanlamalı").length;
  const elmeriCount = safeRuns.filter((r: any) => modeLabel(r.eval_mode) === "ELMERI").length;
  const totalAnswers = answerList.length;

  const emptyRunCount = safeRuns.filter((r: any) => {
    return (countByRun.get(Number(r.id)) || 0) === 0;
  }).length;

  const firmCount = firmOptions.length;
  const avgAnswerPerRun =
    safeRuns.length > 0 ? Math.round(totalAnswers / safeRuns.length) : 0;

  const topFirmStats = firmOptions
    .map((firm) => {
      const firmRuns = safeRuns.filter(
        (r: any) => cleanFirmName(r.firm_name) === firm
      );

      const firmAnswers = firmRuns.reduce((sum: number, r: any) => {
        return sum + (countByRun.get(Number(r.id)) || 0);
      }, 0);

      return {
        firm,
        count: firmRuns.length,
        answers: firmAnswers,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

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
            maxWidth: 860,
            lineHeight: 1.6,
            fontWeight: 600,
          }}
        >
          Android app üzerinden gelen denetimler firma bazlı, tür bazlı ve tüm kayıtlar olarak izlenir.
          Bu ekran yalnızca kayıt izleme, hızlı kontrol, düzeltme ve silme amacıyla kullanılır.
          Gelişmiş rapor süreçleri Raporlama Modülü içinde yönetilecektir.
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
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Kpi title="Toplam Denetim" value={safeRuns.length} desc="Tüm kayıtlar" href={makeQuery("ALL", activeFirm)} />
        <Kpi title="Klasik" value={klasikCount} desc="Standart kontrol" href={makeQuery("KLASIK", activeFirm)} />
        <Kpi title="Fotoğraflı" value={fotografliCount} desc="Görsel kanıtlı" href={makeQuery("FOTO", activeFirm)} />
        <Kpi title="Puanlamalı" value={puanCount} desc="Skor bazlı denetim" href={makeQuery("PUAN", activeFirm)} />
        <Kpi title="ELMERI" value={elmeriCount} desc="Gözlemsel analiz" href={makeQuery("ELMERI", activeFirm)} />
        <Kpi title="Toplam Madde" value={totalAnswers} desc="Aktarılan bulgu" href={makeQuery(activeType, activeFirm)} />
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 1fr 1fr",
          gap: 16,
          marginBottom: 22,
        }}
      >
        <AnalysisCard
          title="Kayıt Sağlığı"
          value={emptyRunCount === 0 ? "Temiz" : `${emptyRunCount} uyarı`}
          desc={emptyRunCount === 0 ? "Bulgu boş kayıt görünmüyor" : "Bulgu sayısı 0 olan kayıt var"}
          tone={emptyRunCount === 0 ? "good" : "bad"}
        />
        <AnalysisCard
          title="Firma Kapsamı"
          value={`${firmCount} firma`}
          desc={activeFirm === "ALL" ? "Tüm firmalar izleniyor" : `${activeFirm} filtresi aktif`}
          tone="neutral"
        />
        <AnalysisCard
          title="Ortalama Madde"
          value={`${avgAnswerPerRun}`}
          desc="Denetim başına ortalama bulgu/madde"
          tone="neutral"
        />
      </section>

      <section
        style={{
          background: "#fff",
          borderRadius: 24,
          padding: 18,
          border: "1px solid #e5e7eb",
          marginBottom: 22,
          boxShadow: "0 14px 38px rgba(15,23,42,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 1000, color: "#111827" }}>
              Firma Filtresi
            </div>
            <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginTop: 4 }}>
              Firma bazlı denetim kayıtlarını hızlı süz.
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
            }}
          >
            Aktif: {activeFirm === "ALL" ? "Tüm Firmalar" : activeFirm}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <FilterPill href={makeQuery(activeType, "ALL")} active={activeFirm === "ALL"} label="Tüm Firmalar" />

          {firmOptions.map((firm) => (
            <FilterPill
              key={firm}
              href={makeQuery(activeType, firm)}
              active={activeFirm === firm}
              label={firm}
            />
          ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 22,
        }}
      >
        <MiniPanel title="Tür Dağılımı">
          <MiniRow label="Klasik" value={klasikCount} total={safeRuns.length} color="#334155" />
          <MiniRow label="Fotoğraflı" value={fotografliCount} total={safeRuns.length} color="#1d4ed8" />
          <MiniRow label="Puanlamalı" value={puanCount} total={safeRuns.length} color="#c2410c" />
          <MiniRow label="ELMERI" value={elmeriCount} total={safeRuns.length} color="#15803d" />
        </MiniPanel>

        <MiniPanel title="Firma Bazlı İlk 5">
          {topFirmStats.length === 0 ? (
            <div style={{ color: "#64748b", fontWeight: 700, fontSize: 13 }}>
              Firma kaydı yok.
            </div>
          ) : (
            topFirmStats.map((f) => (
              <MiniRow
                key={f.firm}
                label={f.firm}
                value={f.count}
                total={safeRuns.length}
                color="#5a0f1f"
                desc={`${f.answers} madde`}
              />
            ))
          )}
        </MiniPanel>
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
            <div style={{ fontSize: 21, fontWeight: 1000, color: "#111827" }}>
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
              Firma, tür, şablon, denetçi, tarih, bulgu sayısı ve işlem alanı
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
            {filteredRuns.length} kayıt
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 0.8fr 0.9fr 0.9fr 0.8fr 0.55fr 1.9fr",
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

        {filteredRuns.length === 0 ? (
          <div
            style={{
              padding: 34,
              color: "#64748b",
              fontWeight: 700,
              textAlign: "center",
            }}
          >
            Seçilen filtreye uygun denetim kaydı yok.
          </div>
        ) : (
          filteredRuns.map((r: any, index: number) => {
            const mode = modeLabel(r.eval_mode);
            const colors = modeColor(r.eval_mode);
            const detailId = r.app_run_id || r.id;
            const answerCount = countByRun.get(Number(r.id)) || 0;
            const firmName = cleanFirmName(r.firm_name);

            return (
              <div
                key={r.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.3fr 0.8fr 0.9fr 0.9fr 0.8fr 0.55fr 1.9fr",
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
                    {firmName}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: answerCount === 0 ? "#dc2626" : "#64748b",
                      fontWeight: 800,
                    }}
                  >
                    App Run ID: {r.app_run_id || "-"} • Remote ID: {r.id}
                    {answerCount === 0 ? " • Bulgu yok" : ""}
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
                    color: answerCount === 0 ? "#dc2626" : "#5a0f1f",
                    fontSize: 16,
                  }}
                >
                  {answerCount}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Link href={`/admin/denetimler/${detailId}`} style={buttonStyle("primary")}>
                    Detay
                  </Link>

                  <Link
                    href={`/admin/denetimler/${detailId}/print`}
                    target="_blank"
                    style={buttonStyle("dark")}
                  >
                    App Raporu
                  </Link>

                  <Link href={`/admin/denetimler/${r.id}/edit`} style={buttonStyle("warning")}>
                    Düzenle
                  </Link>

                  <form action={deleteDenetimAction}>
                    <input type="hidden" name="remoteId" value={r.id} />
                    <button
                      type="submit"
                      style={{
                        padding: "9px 12px",
                        borderRadius: 12,
                        background: "#fee2e2",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                        fontWeight: 1000,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Sil
                    </button>
                  </form>
                </div>
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}

function buttonStyle(type: "primary" | "dark" | "warning"): CSSProperties {
  if (type === "dark") {
    return {
      padding: "9px 12px",
      borderRadius: 12,
      background: "#111827",
      color: "#fff",
      textDecoration: "none",
      fontWeight: 1000,
      textAlign: "center",
      fontSize: 13,
    };
  }

  if (type === "warning") {
    return {
      padding: "9px 12px",
      borderRadius: 12,
      background: "#fff7ed",
      color: "#9a3412",
      border: "1px solid #fed7aa",
      fontWeight: 1000,
      fontSize: 13,
      textDecoration: "none",
    };
  }

  return {
    padding: "9px 12px",
    borderRadius: 12,
    background: "linear-gradient(135deg, #5a0f1f, #c62828)",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 1000,
    textAlign: "center",
    fontSize: 13,
  };
}

function Kpi({
  title,
  value,
  desc,
  href,
}: {
  title: string;
  value: number;
  desc: string;
  href: string;
}) {
  return (
    <Link href={href} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
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
    </Link>
  );
}

function AnalysisCard({
  title,
  value,
  desc,
  tone,
}: {
  title: string;
  value: string;
  desc: string;
  tone: "good" | "bad" | "neutral";
}) {
  const color = tone === "good" ? "#15803d" : tone === "bad" ? "#b91c1c" : "#5a0f1f";
  const bg = tone === "good" ? "#f0fdf4" : tone === "bad" ? "#fee2e2" : "#fff7f7";

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ color: "#64748b", fontSize: 13, fontWeight: 900 }}>{title}</div>
          <div style={{ color, fontSize: 24, fontWeight: 1000, marginTop: 6 }}>{value}</div>
          <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 750, marginTop: 6 }}>{desc}</div>
        </div>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 16,
            background: bg,
            color,
            display: "grid",
            placeItems: "center",
            fontWeight: 1000,
          }}
        >
          ●
        </div>
      </div>
    </div>
  );
}

function MiniPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      style={{
        background: "#fff",
        borderRadius: 24,
        padding: 18,
        border: "1px solid #e5e7eb",
        boxShadow: "0 14px 38px rgba(15,23,42,0.05)",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 1000, color: "#111827", marginBottom: 14 }}>
        {title}
      </div>
      <div style={{ display: "grid", gap: 12 }}>{children}</div>
    </section>
  );
}

function MiniRow({
  label,
  value,
  total,
  color,
  desc,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  desc?: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          fontSize: 13,
          fontWeight: 900,
        }}
      >
        <span style={{ color: "#334155" }}>{label}</span>
        <span style={{ color }}>
          {value} kayıt {desc ? `• ${desc}` : ""}
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: "#f1f5f9",
          borderRadius: 999,
          overflow: "hidden",
          marginTop: 7,
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background: color,
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        padding: "10px 14px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 1000,
        background: active ? "linear-gradient(135deg, #5a0f1f, #c62828)" : "#fff",
        color: active ? "#fff" : "#5a0f1f",
        border: active ? "1px solid rgba(90,15,31,0.2)" : "1px solid #ead5d5",
        boxShadow: active ? "0 10px 24px rgba(90,15,31,0.18)" : "none",
      }}
    >
      {label}
    </Link>
  );
}