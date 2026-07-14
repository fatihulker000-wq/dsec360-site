"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

type ExecutiveAIProps = {
  insights: string[];
};

function getInsightMeta(index: number) {
  const items = [
    {
      label: "Bugünkü öncelik",
      icon: AlertTriangle,
      color: "#b91c1c",
      background: "#fff1f2",
      border: "#fecdd3",
    },
    {
      label: "Operasyon görünümü",
      icon: TrendingUp,
      color: "#1d4ed8",
      background: "#eff6ff",
      border: "#bfdbfe",
    },
    {
      label: "Yaklaşan süreç",
      icon: Clock3,
      color: "#b45309",
      background: "#fffbeb",
      border: "#fde68a",
    },
    {
      label: "Uyum durumu",
      icon: ShieldCheck,
      color: "#15803d",
      background: "#f0fdf4",
      border: "#bbf7d0",
    },
  ];

  return items[index] ?? items[items.length - 1];
}

export default function ExecutiveAI({ insights }: ExecutiveAIProps) {
  const visibleInsights = insights
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);

  const aiConfidence = Math.min(
    98,
    Math.max(72, 78 + visibleInsights.length * 4)
  );

  return (
    <section
      style={{
        position: "relative",
        height: "100%",
        minHeight: 560,
        overflow: "hidden",
        padding: 22,
        borderRadius: 24,
        border: "1px solid #ddd6fe",
        background:
          "radial-gradient(circle at top right, rgba(139,92,246,.18), transparent 32%), radial-gradient(circle at bottom left, rgba(59,130,246,.08), transparent 34%), linear-gradient(180deg,#ffffff,#faf7ff)",
        boxShadow: "0 16px 38px rgba(76,29,149,.10)",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 180,
          height: 180,
          top: -90,
          right: -70,
          borderRadius: 999,
          background: "rgba(139,92,246,.08)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
            <div
              style={{
                width: 50,
                height: 50,
                display: "grid",
                placeItems: "center",
                borderRadius: 17,
                color: "#fff",
                background: "linear-gradient(135deg,#7c3aed,#a855f7)",
                boxShadow: "0 12px 26px rgba(124,58,237,.26)",
                flex: "0 0 auto",
              }}
            >
              <Bot size={25} />
            </div>

            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  color: "#7c3aed",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: ".07em",
                  textTransform: "uppercase",
                }}
              >
                <Sparkles size={14} />
                AI Insight
              </div>

              <h3
                style={{
                  margin: "5px 0 0",
                  color: "#111827",
                  fontSize: 19,
                  fontWeight: 900,
                  letterSpacing: "-.02em",
                }}
              >
                DORA Executive Intelligence
              </h3>

              <p
                style={{
                  margin: "5px 0 0",
                  color: "#6b7280",
                  fontSize: 12,
                  lineHeight: 1.5,
                }}
              >
                Canlı verilerden oluşturulan yönetici özeti
              </p>
            </div>
          </div>

          <div
            style={{
              minWidth: 84,
              padding: "9px 11px",
              borderRadius: 14,
              border: "1px solid #ddd6fe",
              background: "rgba(255,255,255,.84)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: "#7c3aed",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: ".05em",
                textTransform: "uppercase",
              }}
            >
              AI Güveni
            </div>
            <div
              style={{
                marginTop: 4,
                color: "#4c1d95",
                fontSize: 22,
                fontWeight: 950,
              }}
            >
              %{aiConfidence}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gap: 10,
            marginTop: 20,
          }}
        >
          {visibleInsights.length > 0 ? (
            visibleInsights.map((insight, index) => {
              const meta = getInsightMeta(index);
              const Icon = meta.icon;

              return (
                <article
                  key={`${insight}-${index}`}
                  style={{
                    minHeight: 126,
                    padding: 14,
                    borderRadius: 16,
                    border: `1px solid ${meta.border}`,
                    background: meta.background,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 11,
                        color: meta.color,
                        background: "rgba(255,255,255,.76)",
                      }}
                    >
                      <Icon size={17} />
                    </div>

                    <span
                      style={{
                        color: meta.color,
                        fontSize: 9,
                        fontWeight: 900,
                        letterSpacing: ".05em",
                        textTransform: "uppercase",
                      }}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: "11px 0 0",
                      color: "#374151",
                      fontSize: 12,
                      lineHeight: 1.55,
                    }}
                  >
                    {insight}
                  </p>
                </article>
              );
            })
          ) : (
            <div
              style={{
                gridColumn: "1 / -1",
                minHeight: 180,
                display: "grid",
                placeItems: "center",
                alignContent: "center",
                gap: 10,
                padding: 20,
                borderRadius: 16,
                border: "1px dashed #ddd6fe",
                background: "rgba(255,255,255,.72)",
                textAlign: "center",
              }}
            >
              <CheckCircle2 size={30} color="#7c3aed" />
              <strong style={{ color: "#4c1d95", fontSize: 14 }}>
                Kritik AI uyarısı bulunmuyor
              </strong>
              <span
                style={{
                  color: "#6b7280",
                  fontSize: 12,
                }}
              >
                Yeni operasyon verileri geldikçe DORA burada özet oluşturur.
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
            gap: 9,
            marginTop: 14,
          }}
        >
          <div
            style={{
              padding: "11px 10px",
              borderRadius: 13,
              border: "1px solid #ede9fe",
              background: "rgba(255,255,255,.82)",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#6b7280", fontSize: 9, fontWeight: 800 }}>
              İçgörü
            </div>
            <div style={{ marginTop: 4, color: "#7c3aed", fontSize: 18, fontWeight: 950 }}>
              {visibleInsights.length}
            </div>
          </div>

          <div
            style={{
              padding: "11px 10px",
              borderRadius: 13,
              border: "1px solid #bbf7d0",
              background: "#f0fdf4",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#166534", fontSize: 9, fontWeight: 800 }}>
              Uyum
            </div>
            <div style={{ marginTop: 4, color: "#15803d", fontSize: 18, fontWeight: 950 }}>
              Aktif
            </div>
          </div>

          <div
            style={{
              padding: "11px 10px",
              borderRadius: 13,
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#1e40af", fontSize: 9, fontWeight: 800 }}>
              Veri durumu
            </div>
            <div style={{ marginTop: 4, color: "#1d4ed8", fontSize: 18, fontWeight: 950 }}>
              Canlı
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 11,
            marginTop: 14,
            padding: 14,
            borderRadius: 15,
            border: "1px solid #fde68a",
            background: "linear-gradient(135deg,#fffbeb,#fff7ed)",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              display: "grid",
              placeItems: "center",
              borderRadius: 12,
              color: "#b45309",
              background: "#fef3c7",
              flex: "0 0 auto",
            }}
          >
            <Target size={18} />
          </div>

          <div>
            <strong
              style={{
                color: "#92400e",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              Öncelikli aksiyon
            </strong>

            <p
              style={{
                margin: "4px 0 0",
                color: "#78350f",
                fontSize: 12,
                lineHeight: 1.55,
              }}
            >
              Kritik göstergeleri kontrol ederek ilgili modüle doğrudan geçiş yapın.
            </p>
          </div>
        </div>

        <Link
          href="/admin/dora"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            marginTop: "auto",
            paddingTop: 16,
            color: "#7c3aed",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 900,
          }}
        >
          DORA analiz merkezini aç
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}