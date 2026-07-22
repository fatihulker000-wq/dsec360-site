"use client";

import { memo } from "react";

import {
  Calculator,
  Check,
  ShieldAlert,
  Star,
} from "lucide-react";

import type {
  RiskLevel,
  RiskMethod,
} from "../types";

import {
  riskBackground,
  riskColor,
  riskLabel,
} from "../helpers";

type Props = {
  method: RiskMethod;
  probability: number;
  frequency: number;
  severity: number;
  score: number;
  level: RiskLevel;
  legislation: string[];
};

function recommendation(score: number) {
  if (score >= 400) {
    return {
      days: 0,
      priority: 5,
      text:
        "Faaliyet derhal durdurulmalı ve risk azaltılmadan çalışma başlatılmamalıdır.",
      actions: [
        "Faaliyeti durdur",
        "Yönetimi bilgilendir",
        "Acil DÖF aç",
        "Geçici tedbir uygula",
      ],
    };
  }

  if (score >= 200) {
    return {
      days: 7,
      priority: 5,
      text:
        "Öncelikli mühendislik kontrolü ve kısa terminli DÖF gereklidir.",
      actions: [
        "Öncelikli DÖF aç",
        "Mühendislik kontrolü planla",
        "Yönetici takibine al",
      ],
    };
  }

  if (score >= 70) {
    return {
      days: 30,
      priority: 4,
      text:
        "Planlı iyileştirme yapılmalı ve kalan risk yeniden hesaplanmalıdır.",
      actions: [
        "Planlı DÖF oluştur",
        "Sorumlu ve termin ata",
        "Etkinliği doğrula",
      ],
    };
  }

  if (score >= 20) {
    return {
      days: 90,
      priority: 3,
      text:
        "Mevcut kontroller sürdürülmeli ve ek iyileştirmeler planlanmalıdır.",
      actions: [
        "Kontrolleri sürdür",
        "İyileştirmeyi planla",
        "Periyodik izle",
      ],
    };
  }

  return {
    days: 180,
    priority: 2,
    text:
      "Mevcut kontroller korunmalı ve periyodik olarak doğrulanmalıdır.",
    actions: [
      "Kontrolleri koru",
      "Periyodik denetim yap",
    ],
  };
}

function RiskSummaryPanel({
  method,
  probability,
  frequency,
  severity,
  score,
  level,
  legislation,
}: Props) {
  const advice = recommendation(score);

  const scaleMaximum =
    method === "FINE_KINNEY"
      ? 400
      : 25;

  const percent = Math.max(
    0,
    Math.min(
      100,
      (Number(score || 0) /
        scaleMaximum) *
        100
    )
  );

  return (
    <aside
      style={{
        position: "sticky",
        top: 0,
        borderRadius: 18,
        border: `1px solid ${riskColor(
          level
        )}44`,
        background: riskBackground(level),
        padding: 16,
        color: riskColor(level),
        display: "grid",
        gap: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          fontWeight: 950,
        }}
      >
        <ShieldAlert size={20} />
        Risk Değerlendirme Sonucu
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 850,
            opacity: 0.75,
          }}
        >
          RİSK SKORU
        </div>

        <div
          style={{
            marginTop: 5,
            fontSize: 46,
            lineHeight: 1,
            fontWeight: 950,
          }}
        >
          {score}
        </div>

        <div
          style={{
            marginTop: 7,
            fontSize: 16,
            fontWeight: 950,
          }}
        >
          {riskLabel(level)}
        </div>
      </div>

      <div
        style={{
          borderRadius: 13,
          background:
            "rgba(255,255,255,.62)",
          padding: 12,
          display: "grid",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#334155",
            fontSize: 10,
            fontWeight: 900,
          }}
        >
          <span>RİSK ÖLÇEĞİ</span>
          <span>
            0 — {scaleMaximum}+
          </span>
        </div>

        <div
          style={{
            position: "relative",
            height: 13,
            borderRadius: 999,
            background:
              "linear-gradient(90deg,#22c55e,#eab308,#f97316,#dc2626,#450a0a)",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: `calc(${percent}% - 7px)`,
              top: -4,
              width: 14,
              height: 21,
              borderRadius: 7,
              background: "#ffffff",
              border: "2px solid #0f172a",
            }}
          />
        </div>
      </div>

      <div
        style={{
          borderRadius: 13,
          background:
            "rgba(255,255,255,.62)",
          padding: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 7,
            alignItems: "center",
            fontSize: 11,
            fontWeight: 900,
          }}
        >
          <Calculator size={15} />
          HESAPLAMA
        </div>

        <div
          style={{
            marginTop: 7,
            color: "#0f172a",
            fontSize: 14,
            fontWeight: 900,
          }}
        >
          {method === "FINE_KINNEY"
            ? `${probability} × ${frequency} × ${severity}`
            : `${probability} × ${severity}`}
          {" = "}
          {score}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
          }}
        >
          ÖNERİLEN AKSİYON
        </div>

        <p
          style={{
            margin: "7px 0 0",
            color: "#334155",
            fontSize: 12,
            lineHeight: 1.5,
          }}
        >
          {advice.text}
        </p>

        <div
          style={{
            marginTop: 8,
            display: "grid",
            gap: 6,
          }}
        >
          {advice.actions.map((item) => (
            <div
              key={item}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "16px 1fr",
                gap: 6,
                color: "#334155",
                fontSize: 11,
              }}
            >
              <Check
                size={14}
                color="#047857"
              />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
          }}
        >
          ÖNCELİK
        </div>

        <div
          style={{
            marginTop: 7,
            display: "flex",
            gap: 3,
          }}
        >
          {Array.from({
            length: 5,
          }).map((_, index) => (
            <Star
              key={index}
              size={18}
              fill={
                index < advice.priority
                  ? "currentColor"
                  : "none"
              }
            />
          ))}
        </div>
      </div>

      <div
        style={{
          borderRadius: 13,
          background:
            "rgba(255,255,255,.62)",
          padding: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 900,
          }}
        >
          İLGİLİ MEVZUAT
        </div>

        {legislation.length > 0 ? (
          <div
            style={{
              marginTop: 8,
              display: "grid",
              gap: 7,
            }}
          >
            {legislation.map((item) => (
              <div
                key={item}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "16px 1fr",
                  gap: 6,
                  color: "#334155",
                  fontSize: 10,
                  lineHeight: 1.4,
                }}
              >
                <Check
                  size={14}
                  color="#047857"
                />
                <span>{item}</span>
              </div>
            ))}
          </div>
        ) : (
          <p
            style={{
              margin: "7px 0 0",
              color: "#64748b",
              fontSize: 10,
            }}
          >
            Hazır senaryo seçildiğinde
            mevzuat gösterilir.
          </p>
        )}
      </div>

      <div
        style={{
          borderRadius: 13,
          background:
            "rgba(255,255,255,.62)",
          padding: 12,
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          fontSize: 11,
          fontWeight: 900,
        }}
      >
        <span>ÖNERİLEN TERMİN</span>

        <strong>
          {advice.days === 0
            ? "Bugün"
            : `${advice.days} gün`}
        </strong>
      </div>
    </aside>
  );
}

export default memo(RiskSummaryPanel);