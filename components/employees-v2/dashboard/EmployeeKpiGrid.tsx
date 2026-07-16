"use client";

import type { EmployeeDashboardStats } from "./types";

export default function EmployeeKpiGrid({
  stats,
}: {
  stats: EmployeeDashboardStats;
}) {
  const cards = [
    ["Toplam Çalışan", stats.total, "Seçili firma kapsamındaki tüm kayıtlar", "#111827", "Σ"],
    ["Aktif", stats.active, "Aktif çalışan kayıtları", "#166534", "✓"],
    ["Pasif", stats.passive, "İşten çıkış veya pasif kayıtlar", "#b91c1c", "×"],
    ["Kadın", stats.female, "Aktif kadın çalışanlar", "#7c3aed", "K"],
    ["Erkek", stats.male, "Aktif erkek çalışanlar", "#1d4ed8", "E"],
    ["Engelli", stats.disabled, "Engellilik kaydı bulunan aktif çalışanlar", "#0f766e", "♿"],
    ["Eksik Bilgili", stats.incomplete, "Kritik alanları eksik çalışanlar", "#ca8a04", "!"],
    ["Görünen", stats.visible, "Mevcut filtre sonucundaki kayıtlar", "#334155", "↳"],
  ] as const;

  return (
    <section style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:14 }}>
      {cards.map(([title,value,subtitle,accent,icon]) => (
        <article key={title} style={{ position:"relative", minHeight:148, overflow:"hidden", borderRadius:22, padding:18, background:`linear-gradient(145deg,#fff 0%,${accent}10 100%)`, border:`1px solid ${accent}28`, boxShadow:"0 14px 34px rgba(15,23,42,.06)" }}>
          <div style={{ position:"absolute", top:15, right:15, width:42, height:42, display:"grid", placeItems:"center", borderRadius:14, background:accent, color:"#fff", fontWeight:950, fontSize:18 }}>{icon}</div>
          <div style={{ color:"#64748b", fontSize:12, fontWeight:900, maxWidth:120 }}>{title}</div>
          <div style={{ marginTop:12, color:accent, fontSize:36, fontWeight:950 }}>{value}</div>
          <div style={{ marginTop:7, maxWidth:190, color:"#64748b", fontSize:11, lineHeight:1.5, fontWeight:700 }}>{subtitle}</div>
        </article>
      ))}
    </section>
  );
}
