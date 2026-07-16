"use client";

import type { EmployeeDashboardAlert } from "./types";

export default function EmployeeAlertsPanel({
  alerts,
  onEmployeeClick,
}: {
  alerts: EmployeeDashboardAlert[];
  onEmployeeClick?(employeeId: string): void;
}) {
  return (
    <section style={{ padding:20, borderRadius:20, background:"#fff", border:"1px solid #e5e7eb" }}>
      <div style={{ fontSize:19, fontWeight:950 }}>Eksik Bilgi ve Veri Kalitesi Uyarıları</div>
      <p style={{ margin:"7px 0 16px", color:"#64748b", lineHeight:1.6, fontSize:13 }}>
        Çalışan profillerinde tamamlanması gereken kritik alanlar.
      </p>

      {alerts.length === 0 ? (
        <div style={{ padding:22, borderRadius:14, background:"#ecfdf5", color:"#166534", fontWeight:850, textAlign:"center" }}>
          Kritik eksik bilgi tespit edilmedi.
        </div>
      ) : (
        <div style={{ display:"grid", gap:10 }}>
          {alerts.slice(0,8).map((alert) => {
            const config = {
              LOW: ["#eff6ff","#1d4ed8"],
              MEDIUM: ["#fef3c7","#92400e"],
              HIGH: ["#fee2e2","#b91c1c"],
            }[alert.severity];

            return (
              <button key={alert.id} type="button" onClick={() => onEmployeeClick?.(alert.employeeId)}
                style={{ width:"100%", display:"grid", gridTemplateColumns:"minmax(0,1fr) auto", gap:12, textAlign:"left", padding:13, borderRadius:14, border:"1px solid #e5e7eb", background:"#fff", cursor:onEmployeeClick ? "pointer":"default" }}>
                <div>
                  <div style={{ fontWeight:950 }}>{alert.employeeName}</div>
                  <div style={{ marginTop:4, color:"#64748b", fontSize:12, lineHeight:1.5 }}>{alert.description}</div>
                </div>
                <span style={{ alignSelf:"start", padding:"6px 9px", borderRadius:999, background:config[0], color:config[1], fontSize:10, fontWeight:900 }}>{alert.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
