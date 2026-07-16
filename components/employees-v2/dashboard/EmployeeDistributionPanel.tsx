"use client";

import type { EmployeeDashboardDistributionItem } from "./types";

export default function EmployeeDistributionPanel({
  title,
  description,
  items,
  accent = "#b91c1c",
}: {
  title: string;
  description: string;
  items: EmployeeDashboardDistributionItem[];
  accent?: string;
}) {
  const max = items[0]?.count || 1;

  return (
    <section style={{ padding:20, borderRadius:20, background:"#fff", border:"1px solid #e5e7eb" }}>
      <div style={{ fontSize:19, fontWeight:950 }}>{title}</div>
      <p style={{ margin:"7px 0 16px", color:"#64748b", lineHeight:1.6, fontSize:13 }}>{description}</p>

      {items.length === 0 ? (
        <div style={{ padding:22, borderRadius:14, background:"#f8fafc", color:"#64748b", fontWeight:800, textAlign:"center" }}>
          Dağılım oluşturmak için yeterli veri bulunmuyor.
        </div>
      ) : (
        <div style={{ display:"grid", gap:13 }}>
          {items.map((item) => (
            <div key={item.label}>
              <div style={{ display:"flex", justifyContent:"space-between", gap:10, fontSize:13, fontWeight:850 }}>
                <span>{item.label}</span><span>{item.count}</span>
              </div>
              <div style={{ height:9, marginTop:7, borderRadius:999, background:"#e5e7eb", overflow:"hidden" }}>
                <div style={{ width:`${Math.max(8,Math.round(item.count/max*100))}%`, height:"100%", borderRadius:999, background:accent }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
