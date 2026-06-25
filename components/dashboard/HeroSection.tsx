"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

import { BRAND, badgeStyle, formatPercent } from "./styles";
import type { ExecutiveSummary } from "./types";

type HeroSectionProps = {
  loading: boolean;
  isMobile: boolean;
  heroCompletionHeadline: string;
  heroRiskStatus: string;
  heroTotalTrainings: number;
  completionRate: number;
  ceoSummary: ExecutiveSummary;
  exportPDF: () => void;
  refreshDashboard: () => void;
};

export default function HeroSection({
  loading,
  isMobile,
  heroCompletionHeadline,
  heroRiskStatus,
  heroTotalTrainings,
  completionRate,
  ceoSummary,
  exportPDF,
  refreshDashboard,
}: HeroSectionProps) {
  return (
    <>
      <section
        style={{
          marginBottom: 24,
          borderRadius: isMobile ? 22 : 30,
          padding: isMobile ? 20 : 30,
          background:
            "linear-gradient(135deg, #4b0d1b 0%, #8f172c 48%, #f97316 100%)",
          color: "#fff",
          boxShadow: "0 28px 70px rgba(90,15,31,0.28)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.4fr 0.6fr",
            gap: 24,
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                padding: "8px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.18)",
                fontWeight: 900,
                fontSize: 12,
                marginBottom: 14,
              }}
            >
              D-SEC360 Executive Dashboard
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: isMobile ? 30 : 46,
                lineHeight: 1.08,
                fontWeight: 950,
                letterSpacing: "-1px",
              }}
            >
              Canlı HSE Yönetim Merkezi
            </h1>

            <p
              style={{
                marginTop: 14,
                maxWidth: 760,
                color: "rgba(255,255,255,0.9)",
                fontSize: isMobile ? 14 : 17,
                lineHeight: 1.7,
              }}
            >
              Eğitim, ÇBS, firma riski, açık kayıtlar ve yönetim karar desteği
              tek ekranda izlenir.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginTop: 18,
              }}
            >
              <span style={badgeStyle("rgba(255,255,255,0.16)", "#fff")}>
                {loading ? "Veriler hazırlanıyor" : heroCompletionHeadline}
              </span>

              <span style={badgeStyle("rgba(255,255,255,0.16)", "#fff")}>
                Risk: {loading ? "Hesaplanıyor" : heroRiskStatus}
              </span>

              <span style={badgeStyle("rgba(255,255,255,0.16)", "#fff")}>
                Eğitim: {loading ? "..." : heroTotalTrainings}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <button
              onClick={exportPDF}
              style={{
                border: "none",
                borderRadius: 16,
                padding: "14px 18px",
                background: "#fff",
                color: BRAND.red,
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              PDF Rapor İndir
            </button>

            <button
              onClick={refreshDashboard}
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 16,
                padding: "14px 18px",
                background: "rgba(255,255,255,0.12)",
                color: "#fff",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              Veriyi Yenile
            </button>
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))",
          gap: 16,
          marginBottom: 22,
        }}
      >
        {[
          {
            title: "Genel Sağlık",
            value: ceoSummary.healthLabel,
            desc: "Kurumsal operasyon durumu",
            icon: ShieldCheck,
            color:
              ceoSummary.healthLabel === "Kritik"
                ? BRAND.red
                : ceoSummary.healthLabel === "Dikkat"
                ? BRAND.amber
                : BRAND.green,
          },
          {
            title: "Risk Skoru",
            value: ceoSummary.executiveRiskScore,
            desc: "Executive risk değerlendirmesi",
            icon: AlertTriangle,
            color: BRAND.red,
          },
          {
            title: "Eğitim Uyumu",
            value: `%${formatPercent(completionRate)}`,
            desc: "Tamamlanan eğitim oranı",
            icon: CheckCircle2,
            color: BRAND.green,
          },
          {
            title: "Açık ÇBS",
            value: ceoSummary.cbsOpen,
            desc: "Bekleyen şikayet / öneri",
            icon: Activity,
            color: BRAND.blue,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 24,
                padding: 20,
                background: "#ffffff",
                border: "1px solid #eceff3",
                boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: `${item.color}18`,
                  color: item.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 18,
                }}
              >
                <Icon size={24} />
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: BRAND.muted,
                  fontWeight: 800,
                }}
              >
                {item.title}
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 34,
                  fontWeight: 950,
                  color: BRAND.text,
                  lineHeight: 1,
                }}
              >
                {item.value}
              </div>

              <div
                style={{
                  marginTop: 10,
                  color: BRAND.muted,
                  fontSize: 13,
                }}
              >
                {item.desc}
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}