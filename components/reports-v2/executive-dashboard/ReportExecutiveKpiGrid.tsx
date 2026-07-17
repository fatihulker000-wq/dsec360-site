"use client";
import type { ExecutiveReportKpi, ExecutiveReportTone } from "./types";
export default function ReportExecutiveKpiGrid({ kpis }: { kpis: ExecutiveReportKpi[] }) {
  return <section style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:14 }}>
    {kpis.map((kpi) => { const color = toneColor(kpi.tone || "NEUTRAL"); return <article key={kpi.key} style={{ minHeight:142, padding:17, borderRadius:19, background:`linear-gradient(145deg,#fff 0%,${color}0D 100%)`, border:`1px solid ${color}24`, boxShadow:"0 12px 28px rgba(15,23,42,.05)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:10 }}><div style={{ color:"#64748b", fontSize:11, fontWeight:900 }}>{kpi.title}</div><span style={{ width:10, height:10, borderRadius:"50%", background:color }} /></div>
      <div style={{ marginTop:12, color, fontSize:31, fontWeight:950 }}>{kpi.value}</div>
      <div style={{ marginTop:8, color:"#64748b", fontSize:11, fontWeight:750, lineHeight:1.5 }}>{kpi.subtitle || "-"}</div>
    </article>; })}
  </section>;
}
function toneColor(tone: ExecutiveReportTone) { return { GOOD:"#166534", WARNING:"#b45309", CRITICAL:"#b91c1c", NEUTRAL:"#334155" }[tone]; }
