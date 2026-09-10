 "use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type HealthEmployee = {
  prescription_count?: number;
  last_prescription?: string;
  last_prescription_date?: string;
  last_prescription_status?: string;

  ek2_count?: number;
  last_ek2?: string;
  last_ek2_date?: string;
  last_ek2_status?: string;

  id: string;
  full_name: string;
  email: string;
  company_id: string;
  company_name: string;
  job_title: string;
  start_date: string;

  examination_count: number;
  last_examination_date: string;
  last_examination_decision: string;
  next_examination_date: string;
  health_status?: "NORMAL"|"WARNING"|"CRITICAL"|"MISSING";
};

export default function HealthEmployeesPage() {
  const [employees, setEmployees] = useState<HealthEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [firm, setFirm] = useState("ALL");
  const [risk, setRisk] = useState("ALL");
  const [sourceCompanyId,setSourceCompanyId] = useState("ALL");
  const [loadError,setLoadError] = useState("");

  useEffect(() => {
    async function loadEmployees() {
      try {
        setLoading(true);
        setLoadError("");

        const params=new URLSearchParams(window.location.search);
        const companyId=String(params.get("companyId")||"ALL").trim()||"ALL";
        setSourceCompanyId(companyId);

        const qs=companyId!=="ALL"?`?companyId=${encodeURIComponent(companyId)}`:"";
        const res = await fetch(`/api/admin/health-employees${qs}`, {
          cache: "no-store",
          credentials: "include",
        });

        const json = await res.json();

        if (!res.ok) {
          setEmployees([]);
          setLoadError(json?.error||"Çalışan sağlık kartları alınamadı.");
          return;
        }

        const rows:HealthEmployee[]=json.employees || [];
        setEmployees(rows);

        if(companyId!=="ALL"){
          const selectedName=rows.find(x=>x.company_id===companyId)?.company_name;
          if(selectedName) setFirm(selectedName);
        }
      } catch(e:any) {
        setEmployees([]);
        setLoadError(e?.message||"Çalışan sağlık kartları alınamadı.");
      } finally {
        setLoading(false);
      }
    }

    void loadEmployees();
  }, []);

  const firmOptions = useMemo(() => {
    return Array.from(
      new Set(
        employees
          .map((x) => x.company_name || "Firma Yok")
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "tr"));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const nameOk =
        !q ||
        employee.full_name.toLowerCase().includes(q) ||
        employee.email.toLowerCase().includes(q) ||
        employee.job_title.toLowerCase().includes(q) ||
        employee.company_name.toLowerCase().includes(q);

      const firmOk = firm === "ALL" || employee.company_name === firm;

      const riskOk = risk === "ALL" || employee.health_status === risk;

      return nameOk && firmOk && riskOk;
    });
  }, [employees, search, firm, risk]);

  const activeFirmName =
    firm === "ALL" ? "Tüm Firmalar" : firm;

  const totalEmployees = filteredEmployees.length;
  const today = new Date().toISOString().slice(0,10);
  const day90Date=new Date(); day90Date.setDate(day90Date.getDate()+90);
  const day90=day90Date.toISOString().slice(0,10);
  const approaching = filteredEmployees.filter(e=>e.next_examination_date && e.next_examination_date>=today && e.next_examination_date<=day90).length;
  const ek2Missing = filteredEmployees.filter(e=>Number(e.ek2_count||0)===0).length;
  const critical = filteredEmployees.filter(e=>e.health_status==="CRITICAL").length;
  const missing = filteredEmployees.filter(e=>e.health_status==="MISSING").length;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        color: "#101828",
        fontFamily: "Inter,Arial,sans-serif",
        padding: "22px 18px 48px",
      }}
    >
      <style jsx global>{`
        *{box-sizing:border-box}
        .health-shell{max-width:1500px;margin:0 auto}
        .health-topbar{display:flex;justify-content:space-between;gap:18px;align-items:center;margin-bottom:16px}
        .health-title-wrap{display:flex;align-items:center;gap:14px;min-width:0}
        .health-icon{width:54px;height:54px;border-radius:16px;background:#fff0f2;color:#b42318;display:grid;place-items:center;font-size:26px;border:1px solid #f7d8dc;box-shadow:0 8px 22px rgba(127,29,29,.06)}
        .health-hero{background:linear-gradient(135deg,#a91519,#c51f22 55%,#8d1218);border-radius:24px;padding:20px;color:white;box-shadow:0 18px 42px rgba(127,29,29,.18)}
        .health-hero-head{display:flex;justify-content:space-between;gap:16px;align-items:center;margin-bottom:16px}
        .health-kpis{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:12px}
        .health-kpi{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16);border-radius:16px;padding:15px 14px;min-height:98px;backdrop-filter:blur(4px)}
        .health-kpi-label{font-size:12px;font-weight:800;opacity:.92}
        .health-kpi-value{font-size:32px;font-weight:950;line-height:1;margin-top:9px}
        .health-kpi-sub{font-size:11px;opacity:.8;margin-top:7px}
        .health-filters{display:grid;grid-template-columns:minmax(280px,1.5fr) minmax(180px,.7fr) minmax(180px,.7fr) auto;gap:10px;margin:16px 0}
        .health-table-card{background:white;border:1px solid #e4e7ec;border-radius:18px;overflow:hidden;box-shadow:0 12px 30px rgba(16,24,40,.05)}
        .health-table{width:100%;border-collapse:collapse;table-layout:fixed}
        .health-table th{background:#f8fafc;color:#344054;font-size:12px;font-weight:900;text-align:left;padding:13px 12px;border-bottom:1px solid #e4e7ec}
        .health-table td{padding:13px 12px;border-bottom:1px solid #eef2f6;vertical-align:middle;font-size:13px;color:#344054;overflow:hidden}
        .health-table tbody tr:hover{background:#fcfcfd}
        .person-cell{display:flex;align-items:center;gap:10px;min-width:0}
        .avatar{width:38px;height:38px;border-radius:50%;background:#f8e3e7;color:#9f1239;display:grid;place-items:center;font-weight:900;flex:0 0 auto}
        .ellipsis{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .muted{font-size:11px;color:#667085;margin-top:3px}
        .action-wrap{display:flex;gap:7px;align-items:center;white-space:nowrap}
        .badge{display:inline-flex;align-items:center;justify-content:center;min-height:28px;border-radius:999px;padding:0 10px;font-size:11px;font-weight:900;white-space:nowrap}
        .badge-good{background:#dcfce7;color:#15803d}
        .badge-warn{background:#fef3c7;color:#b45309}
        .badge-bad{background:#fee2e2;color:#b91c1c}
        .badge-neutral{background:#f2f4f7;color:#475467}
        @media(max-width:1180px){
          .health-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}
          .health-table-card{overflow:auto}
          .health-table{min-width:1180px}
        }
        @media(max-width:760px){
          main{padding:12px 8px 36px!important}
          .health-topbar,.health-hero-head{align-items:flex-start;flex-direction:column}
          .health-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
          .health-filters{grid-template-columns:1fr}
          .health-title-wrap h1{font-size:27px!important}
        }
      `}</style>

      <div className="health-shell">
        <div className="health-topbar">
          <div className="health-title-wrap">
            <div className="health-icon">♡</div>
            <div style={{minWidth:0}}>
              <h1 style={{fontSize:34,fontWeight:950,margin:0,letterSpacing:"-.4px"}}>
                Çalışan Sağlık Kartları
              </h1>
              <div style={{color:"#667085",fontSize:13,marginTop:5}}>
                Çalışanların muayene, EK-2, reçete ve sağlık geçmişini tek ekrandan yönetin.
              </div>
            </div>
          </div>

          <Link
            href={sourceCompanyId==="ALL"?"/admin/health":`/admin/health?companyId=${encodeURIComponent(sourceCompanyId)}`}
            style={{
              textDecoration:"none",border:"1px solid #d0d5dd",background:"#fff",color:"#344054",
              borderRadius:12,padding:"10px 14px",fontSize:12,fontWeight:900,boxShadow:"0 4px 12px rgba(16,24,40,.04)"
            }}
          >
            ← Dashboard'a Dön
          </Link>
        </div>

        <section className="health-hero">
          <div className="health-hero-head">
            <div>
              <div style={{fontSize:11,fontWeight:900,letterSpacing:.8,opacity:.78}}>SAĞLIK YÖNETİM MERKEZİ</div>
              <div style={{fontSize:23,fontWeight:950,marginTop:5}}>{activeFirmName}</div>
              <div style={{fontSize:12,opacity:.86,marginTop:4}}>Çalışan sağlık kayıtları özeti</div>
            </div>
          </div>

          <div className="health-kpis">
            <div className="health-kpi">
              <div className="health-kpi-label">Toplam Çalışan</div>
              <div className="health-kpi-value">{totalEmployees}</div>
              <div className="health-kpi-sub">Aktif kapsam</div>
            </div>
            <div className="health-kpi">
              <div className="health-kpi-label">Muayenesi Olan</div>
              <div className="health-kpi-value">{filteredEmployees.filter(e=>Number(e.examination_count||0)>0).length}</div>
              <div className="health-kpi-sub">Sistemde kayıtlı</div>
            </div>
            <div className="health-kpi">
              <div className="health-kpi-label">Muayenesi Eksik</div>
              <div className="health-kpi-value">{filteredEmployees.filter(e=>Number(e.examination_count||0)===0).length}</div>
              <div className="health-kpi-sub">Kontrol et</div>
            </div>
            <div className="health-kpi">
              <div className="health-kpi-label">EK-2 Mevcut</div>
              <div className="health-kpi-value">{filteredEmployees.filter(e=>Number(e.ek2_count||0)>0).length}</div>
              <div className="health-kpi-sub">Çalışan bazında</div>
            </div>
            <div className="health-kpi">
              <div className="health-kpi-label">EK-2 Eksik</div>
              <div className="health-kpi-value">{ek2Missing}</div>
              <div className="health-kpi-sub">D-SEC'te kayıt yok</div>
            </div>
            <div className="health-kpi">
              <div className="health-kpi-label">Reçete Kaydı</div>
              <div className="health-kpi-value">{filteredEmployees.reduce((n,e)=>n+Number(e.prescription_count||0),0)}</div>
              <div className="health-kpi-sub">Toplam kayıt</div>
            </div>
            <div className="health-kpi">
              <div className="health-kpi-label">Kritik Risk</div>
              <div className="health-kpi-value">{critical}</div>
              <div className="health-kpi-sub">Hekim takibi</div>
            </div>
          </div>
        </section>

        <section className="health-filters">
          <input
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            placeholder="Çalışan adı, görev veya e-posta ara..."
            style={inputStyle}
          />

          <select value={risk} onChange={(e)=>setRisk(e.target.value)} style={inputStyle}>
            <option value="ALL">Tüm Risk Durumları</option>
            <option value="NORMAL">Normal</option>
            <option value="WARNING">Takip</option>
            <option value="CRITICAL">Kritik</option>
            <option value="MISSING">Kayıt Eksik</option>
          </select>

          <select
            value="ALL"
            onChange={()=>{}}
            style={{...inputStyle,color:"#667085"}}
            disabled
            title="Firma seçimi Sağlık Dashboard ekranından yapılır."
          >
            <option>Firma: {activeFirmName}</option>
          </select>

          <button
            onClick={()=>{setSearch("");setRisk("ALL");}}
            style={{
              minHeight:44,padding:"0 16px",borderRadius:12,border:"1px solid #d0d5dd",
              background:"#fff",color:"#344054",fontWeight:900,cursor:"pointer"
            }}
          >
            Temizle
          </button>
        </section>

        {loadError && (
          <div style={{marginBottom:14,padding:"12px 14px",borderRadius:12,background:"#fef2f2",border:"1px solid #fecaca",color:"#b91c1c",fontWeight:800}}>
            {loadError}
          </div>
        )}

        <section className="health-table-card">
          <table className="health-table">
            <colgroup>
              <col style={{width:"48px"}}/>
              <col style={{width:"230px"}}/>
              <col style={{width:"150px"}}/>
              <col style={{width:"160px"}}/>
              <col style={{width:"125px"}}/>
              <col style={{width:"120px"}}/>
              <col style={{width:"100px"}}/>
              <col style={{width:"100px"}}/>
              <col style={{width:"175px"}}/>
            </colgroup>
            <thead>
              <tr>
                <th>#</th>
                <th>Çalışan</th>
                <th>Firma</th>
                <th>Görev</th>
                <th>Son Muayene</th>
                <th>EK-2</th>
                <th>Reçete</th>
                <th>Risk</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{padding:28,textAlign:"center",color:"#667085"}}>Çalışanlar yükleniyor...</td></tr>
              ) : filteredEmployees.length===0 ? (
                <tr><td colSpan={9} style={{padding:28,textAlign:"center",color:"#667085"}}>Çalışan bulunamadı.</td></tr>
              ) : (
                filteredEmployees.map((employee,index)=>(
                  <tr key={employee.id}>
                    <td style={{fontWeight:800,color:"#667085"}}>{index+1}</td>
                    <td>
                      <div className="person-cell">
                        <div className="avatar">{getInitial(employee.full_name)}</div>
                        <div style={{minWidth:0}}>
                          <div className="ellipsis" style={{fontWeight:900,color:"#101828"}} title={employee.full_name}>{employee.full_name}</div>
                          <div className="ellipsis muted" title={employee.email}>{employee.email||"-"}</div>
                        </div>
                      </div>
                    </td>
                    <td><div className="ellipsis" title={employee.company_name}>{employee.company_name||"-"}</div></td>
                    <td><div className="ellipsis" title={employee.job_title}>{employee.job_title||"-"}</div></td>
                    <td>
                      <span className={`badge ${employee.last_examination_date?"badge-neutral":"badge-bad"}`}>
                        {employee.last_examination_date?formatDate(employee.last_examination_date):"Yok"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${Number(employee.ek2_count||0)>0?"badge-good":"badge-bad"}`}>
                        {Number(employee.ek2_count||0)>0?"✓ Var":"✕ Yok"}
                      </span>
                      {Number(employee.ek2_count||0)>0 && employee.last_ek2_date && (
                        <div className="muted">{formatDate(employee.last_ek2_date)}</div>
                      )}
                    </td>
                    <td>
                      {Number(employee.prescription_count||0)>0
                        ? <span className="badge badge-neutral">{employee.prescription_count} kayıt</span>
                        : <span className="muted">-</span>}
                    </td>
                    <td>
                      <span className={`badge ${
                        employee.health_status==="CRITICAL"?"badge-bad":
                        employee.health_status==="WARNING"||employee.health_status==="MISSING"?"badge-warn":"badge-good"
                      }`}>
                        {employee.health_status==="CRITICAL"?"Kritik":
                         employee.health_status==="WARNING"?"Takip":
                         employee.health_status==="MISSING"?"Eksik":"Normal"}
                      </span>
                    </td>
                    <td>
                      <div className="action-wrap">
                        <Link
                          href={`/admin/health/employees/${employee.id}${sourceCompanyId!=="ALL"?`?companyId=${encodeURIComponent(sourceCompanyId)}`:""}`}
                          style={{
                            ...buttonStyle,
                            background:"#fff",
                            color:"#344054",
                            border:"1px solid #d0d5dd",
                            padding:"8px 11px",
                            borderRadius:10,
                            boxShadow:"none"
                          }}
                        >
                          Detay
                        </Link>
                        <Link
                          href={`/admin/health/employees/${employee.id}?tab=Muayeneler${sourceCompanyId!=="ALL"?`&companyId=${encodeURIComponent(sourceCompanyId)}`:""}`}
                          style={{
                            ...lightButtonStyle,
                            color:"#b42318",
                            background:"#fff",
                            border:"1px solid #f2b8bd",
                            padding:"8px 11px",
                            borderRadius:10
                          }}
                        >
                          Muayene
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <div style={{marginTop:12,fontSize:11,color:"#667085"}}>
          Firma seçimi Sağlık Dashboard ekranından devralınır. Bu ekranda firma değiştirilemez; yalnız çalışan ve risk filtreleri uygulanır.
        </div>
      </div>
    </main>
  );
}

function MiniStat({ title, value }: { title: string; value: number }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.14)",
        border: "1px solid rgba(255,255,255,.22)",
        borderRadius: 18,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.82, fontWeight: 800 }}>
        {title}
      </div>
      <div style={{ fontSize: 26, fontWeight: 950, marginTop: 6 }}>
        {value}
      </div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: 40,
        textAlign: "center",
        color: "#64748b",
        fontWeight: 800,
      }}
    >
      {text}
    </div>
  );
}

function Badge({
  text,
  tone,
}: {
  text: string;
  tone: "good" | "warning" | "bad" | "neutral";
}) {
  const styles = {
    good: { bg: "#f0fdf4", color: "#15803d" },
    warning: { bg: "#fff7ed", color: "#c2410c" },
    bad: { bg: "#fef2f2", color: "#b91c1c" },
    neutral: { bg: "#f8fafc", color: "#64748b" },
  }[tone];

  return (
    <span
      style={{
        display: "inline-flex",
        justifyContent: "center",
        padding: "7px 10px",
        borderRadius: 999,
        background: styles.bg,
        color: styles.color,
        fontWeight: 900,
        fontSize: 12,
      }}
    >
      {text}
    </span>
  );
}

function getInitial(name: string) {
  return String(name || "Ç").trim().charAt(0).toUpperCase();
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: 14,
  border: "1px solid #d1d5db",
  outline: "none",
  fontWeight: 700,
  background: "#fff",
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  textDecoration: "none",
  background: "#7f1d1d",
  color: "#fff",
  fontWeight: 900,
  fontSize: 13,
};

const lightButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  textDecoration: "none",
  background: "#fff1f2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  fontWeight: 900,
  fontSize: 13,
};
function formatDate(value?: string) {
  if (!value || value === "-") return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("tr-TR");
}
