"use client";
import type { ExecutiveReportModuleScore } from "./types";
export default function ReportModuleScores({ items }: { items: ExecutiveReportModuleScore[] }) {
  return <section style={{ padding:20, borderRadius:21, background:"#fff", border:"1px solid #e5e7eb" }}>
    <h3 style={{ margin:0, fontSize:21, fontWeight:950, color:"#111827" }}>Modül Performans Skorları</h3>
    <p style={{ margin:"7px 0 16px", color:"#64748b", fontSize:13, lineHeight:1.6 }}>Çalışan, eğitim, denetim, risk, sağlık, KKD, kaza ve İBYS performansının karşılaştırmalı görünümü.</p>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:13 }}>
      {items.map((item) => { const color = item.tone === "GOOD" ? "#166534" : item.tone === "WARNING" ? "#b45309" : "#b91c1c"; return <article key={item.key} style={{ padding:15, borderRadius:16, background:"#f8fafc", border:"1px solid #e5e7eb" }}>
        <div style={{ display:"flex", justifyContent:"space-between", gap:10, fontSize:12, fontWeight:900 }}><span>{item.title}</span><span style={{ color }}>{item.score}/100</span></div>
        <div style={{ height:9, marginTop:10, borderRadius:999, background:"#e5e7eb", overflow:"hidden" }}><div style={{ width:`${item.score}%`, height:"100%", borderRadius:999, background:color }} /></div>
        <div style={{ marginTop:9, color:"#64748b", fontSize:11, lineHeight:1.5 }}>{item.summary}</div>
      </article>; })}
    </div>
  </section>;
}
