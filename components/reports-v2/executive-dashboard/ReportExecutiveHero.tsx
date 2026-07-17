"use client";
import ReportOverallScore from "./ReportOverallScore";
import type { ExecutiveReportDashboardData } from "./types";
export default function ReportExecutiveHero({ data }: { data: ExecutiveReportDashboardData }) {
  return <section style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) minmax(210px,280px)", gap:20, alignItems:"center", padding:26, borderRadius:26, color:"#fff", background:"linear-gradient(135deg,#111827 0%,#4a0d1a 52%,#b91c1c 100%)", boxShadow:"0 22px 60px rgba(74,13,26,.20)" }}>
    <div>
      <div style={{ fontSize:12, fontWeight:900, letterSpacing:1.1, opacity:.82 }}>D-SEC EXECUTIVE REPORTING</div>
      <h2 style={{ margin:"9px 0 0", fontSize:"clamp(28px,4vw,42px)", fontWeight:950, lineHeight:1.1 }}>{data.company.name}</h2>
      <p style={{ margin:"12px 0 0", maxWidth:880, lineHeight:1.75, opacity:.92 }}>{data.executiveSummary}</p>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:16 }}>
        <span style={chip}>{data.company.employeeCount} çalışan</span>
        <span style={chip}>{data.moduleScores.length} modül analizi</span>
        <span style={chip}>{data.priorityActions.length} öncelikli aksiyon</span>
      </div>
    </div>
    <ReportOverallScore score={data.overallScore} tone={data.overallTone} />
  </section>;
}
const chip: React.CSSProperties = { padding:"7px 10px", borderRadius:999, background:"rgba(255,255,255,.12)", border:"1px solid rgba(255,255,255,.18)", fontSize:11, fontWeight:850 };
