"use client";

import { ArrowRight, Bot, CheckCircle2, Sparkles, Target } from "lucide-react";
import Link from "next/link";

type ExecutiveAIProps = {
  insights: string[];
};

export default function ExecutiveAI({ insights }: ExecutiveAIProps) {
  const visibleInsights = insights.filter(Boolean).slice(0, 4);

  return (
    <section
      style={{
        height: "100%",
        padding: 22,
        borderRadius: 24,
        border: "1px solid #ddd6fe",
        background:
          "radial-gradient(circle at top right, rgba(139,92,246,.16), transparent 34%), linear-gradient(180deg,#ffffff,#faf7ff)",
        boxShadow: "0 14px 34px rgba(76,29,149,.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
        <div
          style={{
            width: 48,
            height: 48,
            display: "grid",
            placeItems: "center",
            borderRadius: 16,
            color: "#fff",
            background: "linear-gradient(135deg,#7c3aed,#a855f7)",
            boxShadow: "0 10px 24px rgba(124,58,237,.24)",
            flex: "0 0 auto",
          }}
        >
          <Bot size={24} />
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
          <h3 style={{ margin: "5px 0 0", color: "#111827", fontSize: 18, fontWeight: 900 }}>
            DORA Executive Intelligence
          </h3>
          <p style={{ margin: "5px 0 0", color: "#6b7280", fontSize: 12 }}>
            Canlı verilerden oluşturulan yönetici özeti
          </p>
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
        {visibleInsights.map((insight, index) => (
          <div
            key={`${insight}-${index}`}
            style={{
              minHeight: 112,
              padding: 14,
              borderRadius: 15,
              border: "1px solid #ede9fe",
              background: "rgba(255,255,255,.82)",
            }}
          >
            <CheckCircle2 size={17} color="#7c3aed" />
            <p
              style={{
                margin: "9px 0 0",
                color: "#374151",
                fontSize: 12,
                lineHeight: 1.55,
              }}
            >
              {insight}
            </p>
          </div>
        ))}
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
            width: 34,
            height: 34,
            display: "grid",
            placeItems: "center",
            borderRadius: 11,
            color: "#b45309",
            background: "#fef3c7",
            flex: "0 0 auto",
          }}
        >
          <Target size={17} />
        </div>
        <div>
          <strong style={{ color: "#92400e", fontSize: 12 }}>Öncelikli aksiyon</strong>
          <p style={{ margin: "4px 0 0", color: "#78350f", fontSize: 12, lineHeight: 1.5 }}>
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
          marginTop: 16,
          color: "#7c3aed",
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 900,
        }}
      >
        DORA analiz merkezini aç
        <ArrowRight size={16} />
      </Link>
    </section>
  );
}
