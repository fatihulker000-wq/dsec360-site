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
  const [risk, setRisk] = useState("ALL");
  const [department, setDepartment] = useState("ALL");
  const [job, setJob] = useState("ALL");
  const [sourceCompanyId,setSourceCompanyId] = useState("ALL");
  const [loadError,setLoadError] = useState("");
  const [page,setPage] = useState(1);
  const [pageSize,setPageSize] = useState(8);

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

        setEmployees(json.employees || []);
      } catch(e:any) {
        setEmployees([]);
        setLoadError(e?.message||"Çalışan sağlık kartları alınamadı.");
      } finally {
        setLoading(false);
      }
    }

    void loadEmployees();
  }, []);

  const activeFirmName = useMemo(() => {
    const names=Array.from(new Set(employees.map(e=>e.company_name).filter(Boolean)));
    if(names.length===1) return names[0];
    if(names.length>1) return "Tüm Firmalar";
    return "Seçili Firma";
  },[employees]);

  const departmentOptions=useMemo(
    ()=>Array.from(new Set(employees.map(e=>(e as any).department||"").filter(Boolean))).sort((a,b)=>String(a).localeCompare(String(b),"tr")),
    [employees]
  );
  const jobOptions=useMemo(
    ()=>Array.from(new Set(employees.map(e=>e.job_title||"").filter(Boolean))).sort((a,b)=>String(a).localeCompare(String(b),"tr")),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr-TR");
    return employees.filter((employee) => {
      const haystack=[
        employee.full_name,employee.email,employee.job_title,employee.company_name,(employee as any).department
      ].join(" ").toLocaleLowerCase("tr-TR");

      const searchOk=!q||haystack.includes(q);
      const riskOk=risk==="ALL"||employee.health_status===risk;
      const depOk=department==="ALL"||String((employee as any).department||"")===department;
      const jobOk=job==="ALL"||employee.job_title===job;

      return searchOk&&riskOk&&depOk&&jobOk;
    });
  }, [employees, search, risk, department, job]);

  useEffect(()=>{setPage(1)},[search,risk,department,job,pageSize]);

  const totalEmployees = filteredEmployees.length;
  const examPresent=filteredEmployees.filter(e=>Number(e.examination_count||0)>0).length;
  const examMissing=filteredEmployees.filter(e=>Number(e.examination_count||0)===0).length;
  const ek2Present=filteredEmployees.filter(e=>Number(e.ek2_count||0)>0).length;
  const ek2Missing=filteredEmployees.filter(e=>Number(e.ek2_count||0)===0).length;
  const prescriptionCount=filteredEmployees.reduce((n,e)=>n+Number(e.prescription_count||0),0);
  const critical=filteredEmployees.filter(e=>e.health_status==="CRITICAL").length;

  const pageCount=Math.max(1,Math.ceil(filteredEmployees.length/pageSize));
  const safePage=Math.min(page,pageCount);
  const start=(safePage-1)*pageSize;
  const visibleEmployees=filteredEmployees.slice(start,start+pageSize);

  function clearFilters(){
    setSearch("");setRisk("ALL");setDepartment("ALL");setJob("ALL");setPage(1);
  }

  return (
    <main className="health-employees-page">
      <style jsx global>{`
        *{box-sizing:border-box}
        html,body{max-width:100%;overflow-x:hidden}
        .health-employees-page{
          min-height:100vh;background:#f4f7fb;color:#101828;
          font-family:Inter,Arial,sans-serif;padding:18px 14px 42px;
          width:100%;max-width:100%;overflow-x:hidden
        }
        .health-shell{width:100%;max-width:100%;margin:0 auto;min-width:0}
        .health-topbar{display:flex;justify-content:space-between;gap:14px;align-items:center;margin-bottom:14px;min-width:0}
        .health-title-wrap{display:flex;align-items:center;gap:13px;min-width:0}
        .health-icon{width:50px;height:50px;border-radius:15px;background:#fff0f2;color:#b42318;display:grid;place-items:center;font-size:24px;border:1px solid #f7d8dc;box-shadow:0 8px 22px rgba(127,29,29,.06);flex:0 0 auto}
        .health-hero{background:linear-gradient(135deg,#951419,#b91d21 55%,#7f1117);border-radius:20px;padding:15px;color:white;box-shadow:0 16px 38px rgba(127,29,29,.16);min-width:0}
        .health-hero-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:12px}
        .health-kpis{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;min-width:0}
        .health-kpi{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16);border-radius:13px;padding:11px 10px;min-width:0;min-height:82px}
        .health-kpi-label{font-size:10.5px;font-weight:850;opacity:.92;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .health-kpi-value{font-size:26px;font-weight:950;line-height:1;margin-top:7px}
        .health-kpi-sub{font-size:9.5px;opacity:.78;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .health-filters{display:grid;grid-template-columns:minmax(220px,1.4fr) minmax(140px,.65fr) minmax(140px,.65fr) minmax(140px,.65fr) auto;gap:8px;margin:12px 0;min-width:0}
        .health-table-card{background:white;border:1px solid #e4e7ec;border-radius:16px;overflow:hidden;box-shadow:0 10px 28px rgba(16,24,40,.05);min-width:0}
        .health-grid-row{
          display:grid;
          grid-template-columns:36px minmax(155px,1.55fr) minmax(90px,.75fr) minmax(95px,.75fr) minmax(82px,.65fr) minmax(76px,.62fr) minmax(70px,.55fr) minmax(72px,.55fr) minmax(126px,.95fr);
          gap:7px;align-items:center;min-width:0;padding:10px 11px
        }
        .health-grid-head{background:#f8fafc;border-bottom:1px solid #e4e7ec;color:#344054;font-size:11px;font-weight:950}
        .health-grid-body{border-bottom:1px solid #eef2f6;font-size:12px;color:#344054}
        .health-grid-body:last-child{border-bottom:0}
        .health-grid-body:hover{background:#fcfcfd}
        .cell{min-width:0;overflow:hidden}
        .person-cell{display:flex;align-items:center;gap:8px;min-width:0}
        .avatar{width:32px;height:32px;border-radius:50%;background:#f8e3e7;color:#9f1239;display:grid;place-items:center;font-size:11px;font-weight:950;flex:0 0 auto}
        .ellipsis{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
        .muted{font-size:9.5px;color:#667085;margin-top:2px}
        .badge{display:inline-flex;align-items:center;justify-content:center;min-height:24px;border-radius:999px;padding:0 8px;font-size:9.5px;font-weight:950;white-space:nowrap;max-width:100%}
        .badge-good{background:#dcfce7;color:#15803d}.badge-warn{background:#fef3c7;color:#b45309}.badge-bad{background:#fee2e2;color:#b91c1c}.badge-neutral{background:#f2f4f7;color:#475467}
        .action-wrap{display:flex;gap:5px;align-items:center;min-width:0}
        .action-link{display:inline-flex;align-items:center;justify-content:center;min-width:55px;height:30px;padding:0 8px;border-radius:8px;text-decoration:none;font-size:9.5px;font-weight:900;white-space:nowrap}
        .action-detail{background:#fff;color:#344054;border:1px solid #d0d5dd}
        .action-exam{background:#fff;color:#b42318;border:1px solid #f2b8bd}
        .health-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 12px;background:#fff;border-top:1px solid #eef2f6;flex-wrap:wrap}
        .pager{display:flex;align-items:center;gap:5px;flex-wrap:wrap}
        .pager button{width:30px;height:30px;border-radius:8px;border:1px solid #d0d5dd;background:#fff;color:#344054;font-size:11px;font-weight:900;cursor:pointer}
        .pager button.active{background:#7f1d1d;border-color:#7f1d1d;color:#fff}
        .pager button:disabled{opacity:.4;cursor:not-allowed}

        @media(max-width:1220px){
          .health-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}
          .health-grid-row{grid-template-columns:32px minmax(150px,1.5fr) minmax(90px,.8fr) minmax(88px,.75fr) minmax(74px,.65fr) minmax(70px,.6fr) minmax(68px,.55fr) minmax(68px,.55fr) minmax(116px,.9fr)}
          .health-grid-row .company-col{display:none}
          .health-grid-row{grid-template-columns:32px minmax(155px,1.6fr) minmax(100px,.8fr) minmax(80px,.68fr) minmax(75px,.65fr) minmax(70px,.58fr) minmax(72px,.58fr) minmax(120px,.9fr)}
        }
        @media(max-width:980px){
          .health-filters{grid-template-columns:1fr 1fr 1fr}
          .health-filters .search-field{grid-column:1/-1}
          .health-grid-row .rx-col{display:none}
          .health-grid-row{grid-template-columns:30px minmax(150px,1.65fr) minmax(95px,.85fr) minmax(78px,.7fr) minmax(72px,.65fr) minmax(70px,.6fr) minmax(118px,.95fr)}
        }
        @media(max-width:760px){
          .health-employees-page{padding:10px 7px 30px}
          .health-topbar,.health-hero-head{align-items:flex-start;flex-direction:column}
          .health-title-wrap h1{font-size:25px!important}
          .health-icon{width:43px;height:43px}
          .health-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
          .health-filters{grid-template-columns:1fr}
          .health-filters .search-field{grid-column:auto}
          .health-grid-head{display:none}
          .health-grid-body{grid-template-columns:1fr 1fr;gap:9px;padding:12px}
          .health-grid-body .index-col,.health-grid-body .job-col,.health-grid-body .exam-col,.health-grid-body .ek2-col,.health-grid-body .risk-col,.health-grid-body .action-col{display:block}
          .health-grid-body .person-col{grid-column:1/-1}
          .health-grid-body .job-col,.health-grid-body .exam-col,.health-grid-body .ek2-col,.health-grid-body .risk-col{background:#f8fafc;border-radius:10px;padding:8px}
          .health-grid-body .action-col{grid-column:1/-1}
          .health-grid-body .index-col,.health-grid-body .company-col,.health-grid-body .rx-col{display:none}
          .action-link{height:34px;flex:1;font-size:11px}
        }
      `}</style>

      <div className="health-shell">
        <div className="health-topbar">
          <div className="health-title-wrap">
            <div className="health-icon">♡</div>
            <div style={{minWidth:0}}>
              <h1 style={{fontSize:31,fontWeight:950,margin:0,letterSpacing:"-.4px"}}>
                Çalışan Sağlık Kartları
              </h1>
              <div style={{color:"#667085",fontSize:12,marginTop:4}}>
                Muayene, EK-2, reçete ve sağlık kayıtlarını tek ekrandan yönetin.
              </div>
            </div>
          </div>

          <Link
            href={sourceCompanyId==="ALL"?"/admin/health":`/admin/health?companyId=${encodeURIComponent(sourceCompanyId)}`}
            style={{textDecoration:"none",border:"1px solid #d0d5dd",background:"#fff",color:"#344054",borderRadius:10,padding:"9px 12px",fontSize:11,fontWeight:900}}
          >
            ← Dashboard
          </Link>
        </div>

        <section className="health-hero">
          <div className="health-hero-head">
            <div style={{minWidth:0}}>
              <div style={{fontSize:10,fontWeight:900,letterSpacing:.7,opacity:.8}}>SAĞLIK YÖNETİM MERKEZİ</div>
              <div className="ellipsis" style={{fontSize:20,fontWeight:950,marginTop:4}}>{activeFirmName}</div>
            </div>
            <div style={{fontSize:10.5,opacity:.78}}>Firma seçimi Sağlık Dashboard’dan devralınır.</div>
          </div>

          <div className="health-kpis">
            <Kpi title="Toplam Çalışan" value={totalEmployees} sub="Aktif kapsam"/>
            <Kpi title="Muayenesi Olan" value={examPresent} sub={totalEmployees?`%${Math.round(examPresent*100/totalEmployees)}`:"%0"}/>
            <Kpi title="Muayenesi Eksik" value={examMissing} sub="Kontrol et"/>
            <Kpi title="EK-2 Mevcut" value={ek2Present} sub={totalEmployees?`%${Math.round(ek2Present*100/totalEmployees)}`:"%0"}/>
            <Kpi title="EK-2 Eksik" value={ek2Missing} sub="D-SEC'te kayıt yok"/>
            <Kpi title="Reçete Kaydı" value={prescriptionCount} sub="Toplam kayıt"/>
            <Kpi title="Kritik Risk" value={critical} sub="Hekim takibi"/>
          </div>
        </section>

        <section className="health-filters">
          <input
            className="search-field"
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            placeholder="Çalışan adı, görev veya e-posta ara..."
            style={inputStyle}
          />

          <select value={department} onChange={(e)=>setDepartment(e.target.value)} style={inputStyle}>
            <option value="ALL">Tüm Departmanlar</option>
            {departmentOptions.map(x=><option key={String(x)} value={String(x)}>{String(x)}</option>)}
          </select>

          <select value={job} onChange={(e)=>setJob(e.target.value)} style={inputStyle}>
            <option value="ALL">Tüm Görevler</option>
            {jobOptions.map(x=><option key={String(x)} value={String(x)}>{String(x)}</option>)}
          </select>

          <select value={risk} onChange={(e)=>setRisk(e.target.value)} style={inputStyle}>
            <option value="ALL">Tüm Risk Durumları</option>
            <option value="NORMAL">Normal</option>
            <option value="WARNING">Takip</option>
            <option value="CRITICAL">Kritik</option>
            <option value="MISSING">Kayıt Eksik</option>
          </select>

          <button
            onClick={clearFilters}
            style={{minHeight:40,padding:"0 13px",borderRadius:10,border:"1px solid #d0d5dd",background:"#fff",color:"#344054",fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}
          >
            ↻ Temizle
          </button>
        </section>

        {loadError && (
          <div style={{marginBottom:12,padding:"11px 13px",borderRadius:11,background:"#fef2f2",border:"1px solid #fecaca",color:"#b91c1c",fontWeight:800,fontSize:11}}>
            {loadError}
          </div>
        )}

        <section className="health-table-card">
          <div className="health-grid-row health-grid-head">
            <div>#</div>
            <div>Çalışan</div>
            <div className="company-col">Firma</div>
            <div>Görev</div>
            <div>Son Muayene</div>
            <div>EK-2</div>
            <div className="rx-col">Reçete</div>
            <div>Risk</div>
            <div>İşlem</div>
          </div>

          {loading ? (
            <div style={{padding:28,textAlign:"center",color:"#667085",fontSize:12}}>Çalışanlar yükleniyor...</div>
          ) : visibleEmployees.length===0 ? (
            <div style={{padding:28,textAlign:"center",color:"#667085",fontSize:12}}>Çalışan bulunamadı.</div>
          ) : (
            visibleEmployees.map((employee,index)=>(
              <div key={employee.id} className="health-grid-row health-grid-body">
                <div className="cell index-col" style={{fontWeight:850,color:"#667085"}}>{start+index+1}</div>

                <div className="cell person-col">
                  <div className="person-cell">
                    <div className="avatar">{getInitial(employee.full_name)}</div>
                    <div style={{minWidth:0}}>
                      <div className="ellipsis" style={{fontWeight:900,color:"#101828"}} title={employee.full_name}>{employee.full_name}</div>
                      <div className="ellipsis muted" title={employee.email}>{employee.email||"-"}</div>
                    </div>
                  </div>
                </div>

                <div className="cell company-col"><span className="ellipsis" title={employee.company_name}>{employee.company_name||"-"}</span></div>
                <div className="cell job-col"><span className="ellipsis" title={employee.job_title}>{employee.job_title||"-"}</span></div>

                <div className="cell exam-col">
                  <span className={`badge ${employee.last_examination_date?"badge-neutral":"badge-bad"}`}>
                    {employee.last_examination_date?formatDate(employee.last_examination_date):"Yok"}
                  </span>
                </div>

                <div className="cell ek2-col">
                  <span className={`badge ${Number(employee.ek2_count||0)>0?"badge-good":"badge-bad"}`}>
                    {Number(employee.ek2_count||0)>0?"✓ Var":"✕ Yok"}
                  </span>
                </div>

                <div className="cell rx-col">
                  {Number(employee.prescription_count||0)>0
                    ? <span className="badge badge-neutral">{employee.prescription_count} kayıt</span>
                    : <span className="muted">-</span>}
                </div>

                <div className="cell risk-col">
                  <span className={`badge ${
                    employee.health_status==="CRITICAL"?"badge-bad":
                    employee.health_status==="WARNING"||employee.health_status==="MISSING"?"badge-warn":"badge-good"
                  }`}>
                    {employee.health_status==="CRITICAL"?"Kritik":
                     employee.health_status==="WARNING"?"Takip":
                     employee.health_status==="MISSING"?"Eksik":"Normal"}
                  </span>
                </div>

                <div className="cell action-col">
                  <div className="action-wrap">
                    <Link
                      href={`/admin/health/employees/${employee.id}${sourceCompanyId!=="ALL"?`?companyId=${encodeURIComponent(sourceCompanyId)}`:""}`}
                      className="action-link action-detail"
                    >
                      Detay
                    </Link>
                    <Link
                      href={`/admin/health/employees/${employee.id}?tab=Muayeneler${sourceCompanyId!=="ALL"?`&companyId=${encodeURIComponent(sourceCompanyId)}`:""}`}
                      className="action-link action-exam"
                    >
                      Muayene
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}

          {!loading && filteredEmployees.length>0 && (
            <div className="health-footer">
              <div style={{fontSize:10.5,color:"#667085"}}>
                Toplam {filteredEmployees.length} kayıttan {start+1}-{Math.min(start+pageSize,filteredEmployees.length)} arası gösteriliyor
              </div>

              <div className="pager">
                <select
                  value={pageSize}
                  onChange={e=>setPageSize(Number(e.target.value))}
                  style={{height:30,borderRadius:8,border:"1px solid #d0d5dd",background:"#fff",fontSize:10.5,fontWeight:850,padding:"0 7px"}}
                >
                  <option value={8}>8 / sayfa</option>
                  <option value={12}>12 / sayfa</option>
                  <option value={20}>20 / sayfa</option>
                </select>

                <button disabled={safePage<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>‹</button>
                {Array.from({length:pageCount},(_,i)=>i+1)
                  .filter(n=>pageCount<=7||n===1||n===pageCount||Math.abs(n-safePage)<=2)
                  .map((n,i,arr)=>{
                    const prev=arr[i-1];
                    return <span key={n} style={{display:"contents"}}>
                      {prev && n-prev>1 && <span style={{fontSize:10,color:"#98a2b3"}}>…</span>}
                      <button className={n===safePage?"active":""} onClick={()=>setPage(n)}>{n}</button>
                    </span>
                  })}
                <button disabled={safePage>=pageCount} onClick={()=>setPage(p=>Math.min(pageCount,p+1))}>›</button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Kpi({title,value,sub}:{title:string;value:number;sub:string}){
  return <div className="health-kpi">
    <div className="health-kpi-label" title={title}>{title}</div>
    <div className="health-kpi-value">{value}</div>
    <div className="health-kpi-sub" title={sub}>{sub}</div>
  </div>
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


function formatDate(value?: string) {
  if (!value || value === "-") return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("tr-TR");
}
