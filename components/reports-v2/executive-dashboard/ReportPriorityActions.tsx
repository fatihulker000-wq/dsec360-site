"use client";
export default function ReportPriorityActions({ actions }: { actions: string[] }) {
  return <section style={{ padding:20, borderRadius:21, background:"#fff", border:"1px solid #e5e7eb" }}>
    <h3 style={{ margin:0, fontSize:21, fontWeight:950 }}>Yönetici Öncelik Listesi</h3>
    <p style={{ margin:"7px 0 16px", color:"#64748b", fontSize:13, lineHeight:1.6 }}>Kurumsal İSG performansını geliştirmek için öncelik sırasına göre önerilen aksiyonlar.</p>
    {actions.length === 0 ? <div style={{ padding:22, borderRadius:14, background:"#ecfdf5", color:"#166534", textAlign:"center", fontWeight:850 }}>Öncelikli kritik aksiyon bulunmuyor.</div> : <div style={{ display:"grid", gap:10 }}>{actions.map((action,index)=><article key={`${index}-${action}`} style={{ display:"grid", gridTemplateColumns:"42px minmax(0,1fr)", gap:12, alignItems:"center", padding:13, borderRadius:14, background:"#f8fafc", border:"1px solid #e5e7eb" }}><div style={{ width:38, height:38, display:"grid", placeItems:"center", borderRadius:12, background:index<3?"#fee2e2":"#fef3c7", color:index<3?"#b91c1c":"#92400e", fontWeight:950 }}>{index+1}</div><div style={{ color:"#111827", fontSize:13, fontWeight:850 }}>{action}</div></article>)}</div>}
  </section>;
}
