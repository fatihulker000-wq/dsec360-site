"use client";
import type { ExecutiveReportTone } from "./types";
export default function ReportOverallScore({ score, tone }: { score: number; tone: ExecutiveReportTone }) {
  const config = {
    GOOD: { label: "Güçlü Uyum", color: "#166534", background: "#dcfce7" },
    WARNING: { label: "Yakın Takip", color: "#92400e", background: "#fef3c7" },
    CRITICAL: { label: "Kritik İzleme", color: "#b91c1c", background: "#fee2e2" },
    NEUTRAL: { label: "Veri Bekleniyor", color: "#475569", background: "#e2e8f0" },
  }[tone];
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
  return <div style={{ display:"grid", justifyItems:"center", gap:10 }}>
    <div style={{ position:"relative", width:142, height:142 }}>
      <svg width="142" height="142" viewBox="0 0 142 142">
        <circle cx="71" cy="71" r={radius} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="12" />
        <circle cx="71" cy="71" r={radius} fill="none" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 71 71)" />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"grid", placeItems:"center", color:"#fff", fontSize:34, fontWeight:950 }}>{score}</div>
    </div>
    <span style={{ display:"inline-flex", padding:"7px 11px", borderRadius:999, background:config.background, color:config.color, fontSize:11, fontWeight:950 }}>{config.label}</span>
  </div>;
}
