"use client";

import type {
  EmployeeHealthAccess,
  EmployeeProfileEmployee,
  EmployeeProfileModuleItem,
} from "./types";

export default function EmployeeProfileHealthPanel({
  employee,
  items,
  access,
}: {
  employee: EmployeeProfileEmployee;
  items?: EmployeeProfileModuleItem[];
  access?: EmployeeHealthAccess;
}) {
  const list = items || [];
  const detailsAllowed =
    access?.detailsAllowed ??
    employee.health_details_allowed ??
    false;

  const metrics = [
    ["EK-2 Kaydı", String(employee.health_ek2_count ?? 0)],
    ["Muayene Kaydı", String(employee.health_examination_count ?? 0)],
    ["Son EK-2", formatDate(employee.health_last_ek2_at)],
    ["Son Muayene", formatDate(employee.health_last_exam_at)],
    ["Sonraki Muayene", formatDate(employee.health_next_due_at)],
    ["Takip Durumu", healthLabel(employee)],
  ];

  return (
    <section style={{ padding: 20, borderRadius: 20, background: "#fff", border: "1px solid #e5e7eb" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 950 }}>Sağlık Takibi</h3>
          <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
            İşe giriş, periyodik muayene, EK-2 ve sağlık takip kayıtları.
          </p>
        </div>
        <span style={{ padding: "7px 10px", borderRadius: 999, background: detailsAllowed ? "#ecfdf5" : "#f1f5f9", color: detailsAllowed ? "#047857" : "#475569", fontSize: 11, fontWeight: 900 }}>
          {detailsAllowed ? "Detaylı sağlık görünümü" : "Kısıtlı sağlık görünümü"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginTop: 16 }}>
        {metrics.map(([label, value]) => (
          <div key={label} style={{ padding: 13, borderRadius: 14, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
            <div style={{ color: "#64748b", fontSize: 10, fontWeight: 900 }}>{label}</div>
            <div style={{ marginTop: 5, color: "#0f172a", fontSize: 14, fontWeight: 950 }}>{value}</div>
          </div>
        ))}
      </div>

      {!detailsAllowed && (
        <div style={{ marginTop: 14, padding: 13, borderRadius: 14, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", fontSize: 12, lineHeight: 1.6, fontWeight: 750 }}>
          Sağlık verilerinin tıbbi içeriği gizlidir. Bu kullanıcıya yalnızca kayıt türü, muayene tarihi, sonraki muayene tarihi ve takip durumu gösterilir.
        </div>
      )}

      <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
        {list.length === 0 ? (
          <div style={{ padding: 24, borderRadius: 14, background: "#f8fafc", color: "#64748b", textAlign: "center", fontWeight: 800 }}>Sağlık kaydı bulunmuyor.</div>
        ) : list.map((item) => (
          <article key={item.id} style={{ padding: 15, borderRadius: 15, background: "#f8fafc", border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 950, color: "#111827" }}>{friendlyTitle(item.title)}</div>
                <div style={{ marginTop: 5, color: "#64748b", fontSize: 12 }}>{formatDate(item.date)}</div>
              </div>
              <div style={{ textAlign: "right", color: "#475569", fontSize: 11, fontWeight: 850 }}>
                <div>{friendlyStatus(item.status)}</div>
                {item.meta ? <div style={{ marginTop: 4 }}>{formatMeta(item.meta)}</div> : null}
              </div>
            </div>

            {detailsAllowed ? (
              <>
                {item.description ? <p style={{ margin: "10px 0 0", color: "#475569", fontSize: 12, lineHeight: 1.6 }}>{item.description}</p> : null}
                {item.details && Object.keys(item.details).length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8, marginTop: 12 }}>
                    {Object.entries(item.details).filter(([, value]) => value !== null && value !== undefined && value !== "").map(([key, value]) => (
                      <div key={key} style={{ padding: 10, borderRadius: 11, background: "#fff", border: "1px solid #e5e7eb" }}>
                        <div style={{ color: "#64748b", fontSize: 10, fontWeight: 850 }}>{detailLabel(key)}</div>
                        <div style={{ marginTop: 4, color: "#111827", fontSize: 12, fontWeight: 850 }}>{String(value)}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div style={{ marginTop: 10, color: "#64748b", fontSize: 11 }}>Tıbbi detaylar yetki nedeniyle gizlenmiştir.</div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function healthLabel(employee: EmployeeProfileEmployee) {
  if (employee.health_status === "MISSING") return "Süresi Geçmiş";
  if (employee.health_status === "EXPIRING") return "Muayene Yaklaşıyor";
  if (employee.health_status === "COMPLETE") return "Muayene Geçerli";
  if ((employee.health_ek2_count || 0) > 0) return "EK-2 Mevcut";
  return (employee.health_record_count || 0) > 0 ? "Kayıt Mevcut" : "Kayıt Yok";
}
function formatDate(value?: string) { if (!value) return "—"; const d=new Date(value); if(Number.isNaN(d.getTime())) return value; return new Intl.DateTimeFormat("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(d); }
function friendlyTitle(value?: string) { const v=String(value||""); if(v==="EK2_ISE_GIRIS") return "EK-2 İşe Giriş Muayenesi"; if(v==="EK2_PERIYODIK") return "EK-2 Periyodik Muayene"; return v || "Sağlık Kaydı"; }
function friendlyStatus(value?: string) { const v=String(value||"").toUpperCase(); if(["COMPLETE","COMPLETED","ACTIVE","TAMAMLANDI"].includes(v)) return "Kayıt Mevcut"; if(["MISSING","EXPIRED","OVERDUE"].includes(v)) return "Süresi Geçmiş"; if(["EXPIRING","DUE_SOON"].includes(v)) return "Yaklaşıyor"; return value || "Kayıt Mevcut"; }
function formatMeta(value: string) { return value.replace(/T\d{2}:\d{2}:\d{2}[^ ]*/g, (x) => formatDate(x)); }
function detailLabel(key: string) { const labels: Record<string,string>={exam_type:"Muayene Türü",form_type:"Form Türü",exam_date:"Muayene Tarihi",next_exam_date:"Sonraki Muayene",decision:"Hekim Kararı",doctor_name:"İşyeri Hekimi",doctor_opinion:"Hekim Görüşü",file_no:"Dosya No",revision_no:"Revizyon No",status:"Kayıt Durumu",blood_group:"Kan Grubu",workplace_address:"İşyeri Adresi",danger_class:"Tehlike Sınıfı",nace_code:"NACE Kodu",signature_note:"İmza Notu"}; return labels[key] || key.replaceAll("_"," "); }
