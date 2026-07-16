"use client";
export default function InvestigationProgress({ percent, completed, total }: { percent:number; completed:number; total:number }) {
  return (
    <section style={{ padding:18, borderRadius:18, background:"#fff", border:"1px solid #e5e7eb" }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
        <strong style={{ fontSize:22 }}>%{percent} Tamamlandı</strong>
        <span style={{ color:"#64748b", fontWeight:800 }}>{completed} / {total} aşama</span>
      </div>
      <div style={{ height:12, marginTop:14, borderRadius:999, background:"#e5e7eb", overflow:"hidden" }}>
        <div style={{ width:`${percent}%`, height:"100%", background: percent === 100 ? "#16a34a" : "linear-gradient(90deg,#7a0017,#b91c1c)" }} />
      </div>
    </section>
  );
}
