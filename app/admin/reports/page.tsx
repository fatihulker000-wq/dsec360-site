"use client";

import { useEffect, useMemo, useState } from "react";
import { ExecutiveReportsDashboard } from "@/components/reports-v2/executive-dashboard";
import {
  mapEnterpriseSummaryToDashboard,
  ReportEnterpriseStatus,
  useReportEnterpriseSummary,
} from "@/components/reports-v2/data-integration";
import { ReportAdvancedAnalyticsCenter } from "@/components/reports-v2/advanced-analytics";
import ReportSectionPdfExportButton from "@/components/reports-v2/pdf-engine/ReportSectionPdfExportButton";

type CompanyRow = { id: string; name: string };
type ScopeResponse = {
  success?: boolean;
  role?: string;
  can_select_company?: boolean;
  can_view_all_companies?: boolean;
  allowed_company_id?: string | null;
  allowed_company_ids?: string[];
  allowed_companies?: CompanyRow[];
  error?: string;
};
type MatrixStatus = {
  training_id: string;
  status: string;
  source?: string | null;
  type?: string | null;
  training_date?: string | null;
  duration_minutes?: number | null;
};
type MatrixRow = {
  user_id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  statuses: MatrixStatus[];
};
type TrainingMini = { id: string; title: string };
type TrainingReport = {
  success?: boolean;
  company?: {
    id: string;
    name: string;
    company_title?: string;
    employee_count?: number;
  };
  summary?: {
    total_employees: number;
    total_trainings: number;
    total_assignments: number;
    completed_count: number;
    in_progress_count: number;
    not_started_count: number;
  };
  trainings?: TrainingMini[];
  matrix?: MatrixRow[];
  error?: string;
};
type AuditReport = {
  success?: boolean;
  summary?: {
    total_audits: number;
    completed_audits: number;
    unfinished_audits?: number;
    in_progress_audits?: number;
    draft_audits: number;
    total_items: number;
    uygun_count: number;
    uygunsuz_count: number;
    kismen_count: number;
    kapsam_disi_count: number;
    open_dof_count: number;
    closed_dof_count: number;
    compliance_score: number;
  };
  audits?: Array<{
    id: string | number;
    report_no?: string | null;
    template_type?: string | null;
    eval_mode?: string | null;
    location?: string | null;
    responsible?: string | null;
    inspector_name?: string | null;
    status?: string | null;
  }>;
  top_nonconformities?: Array<{ title: string; count: number }>;
  recommended_actions?: Array<{ title: string; count: number }>;
  error?: string;
};

type Center = "OVERVIEW" | "TRAINING" | "AUDIT" | "ANALYTICS";
type TrainingView = "MATRIX" | "EMPLOYEE" | "TRAINING";

const C = {
  bg:"#f6f7f9", ink:"#182230", muted:"#667085", line:"#e4e7ec",
  burgundy:"#7f1d2d", red:"#b42318", green:"#067647", amber:"#b54708",
  blue:"#175cd3", white:"#fff",
};

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  let json: any = {};
  try { json = text ? JSON.parse(text) : {}; } catch {
    throw new Error(`Sunucudan geçersiz yanıt geldi (${res.status}).`);
  }
  if (!res.ok) throw new Error(json?.error || `Sunucu hatası (${res.status}).`);
  return json as T;
}

function statusLabel(v:string) {
  const s=(v||"").toUpperCase();
  if (s==="COMPLETED" || s==="TAMAMLANDI") return "Tamamlandı";
  if (s==="IN_PROGRESS" || s==="DEVAM_EDIYOR") return "Devam Ediyor";
  if (s==="NOT_STARTED" || s==="BASLAMADI" || s==="BAŞLAMADI") return "Başlamadı";
  return v || "Atanmadı";
}
function toneForStatus(v:string) {
  const s=statusLabel(v);
  if(s==="Tamamlandı") return {bg:"#ecfdf3",color:"#027a48"};
  if(s==="Devam Ediyor") return {bg:"#eff8ff",color:"#175cd3"};
  if(s==="Başlamadı") return {bg:"#fffaeb",color:"#b54708"};
  return {bg:"#f2f4f7",color:"#475467"};
}
function pct(ok:number,total:number){ return total>0?Math.round(ok/total*100):0; }

export default function AdminReportsPage(){
  const [scope,setScope]=useState<ScopeResponse|null>(null);
  const [companies,setCompanies]=useState<CompanyRow[]>([]);
  const [selectedCompanyId,setSelectedCompanyId]=useState("");
  const [center,setCenter]=useState<Center>("OVERVIEW");
  const [trainingView,setTrainingView]=useState<TrainingView>("MATRIX");
  const [training,setTraining]=useState<TrainingReport|null>(null);
  const [audit,setAudit]=useState<AuditReport|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [employeeSearch,setEmployeeSearch]=useState("");
  const [trainingSearch,setTrainingSearch]=useState("");
  const [statusFilter,setStatusFilter]=useState("ALL");
  const [onlyActive,setOnlyActive]=useState(true);

  const {data:enterpriseSummary,loading:enterpriseLoading,error:enterpriseError}=
    useReportEnterpriseSummary(selectedCompanyId && selectedCompanyId!=="ALL" ? selectedCompanyId : selectedCompanyId);

  useEffect(()=>{ void boot(); },[]);
  useEffect(()=>{ if(selectedCompanyId) void loadData(selectedCompanyId); },[selectedCompanyId]);

  async function boot(){
    try{
      setLoading(true); setError("");
      const s=await readJson<ScopeResponse>(await fetch("/api/admin/reports/scope",{credentials:"include",cache:"no-store"}));
      setScope(s);

      if(s.can_view_all_companies){
        const c:any=await readJson(await fetch("/api/admin/companies",{credentials:"include",cache:"no-store"}));
        const rows=(c?.data??[]).filter((x:any)=>x?.id&&x?.name).map((x:any)=>({id:String(x.id),name:String(x.name)}));
        setCompanies([{id:"ALL",name:"Tüm Firmalar"},...rows]);
        setSelectedCompanyId(rows[0]?.id || "");
      }else{
        const rows=s.allowed_companies??[];
        setCompanies(rows);
        setSelectedCompanyId(s.allowed_company_id || rows[0]?.id || "");
      }
    }catch(e){ setError(e instanceof Error?e.message:"Raporlama merkezi açılamadı."); }
    finally{ setLoading(false); }
  }

  async function loadData(companyId:string){
    try{
      setLoading(true); setError("");
      const companyName=companies.find(x=>x.id===companyId)?.name || "";
      const [tr,ar]=await Promise.all([
        readJson<TrainingReport>(await fetch(`/api/admin/reports/company-training-matrix?companyId=${encodeURIComponent(companyId)}`,{credentials:"include",cache:"no-store"})),
        readJson<AuditReport>(await fetch(`/api/admin/reports/audit-analysis?companyId=${encodeURIComponent(companyId)}&companyName=${encodeURIComponent(companyName)}`,{credentials:"include",cache:"no-store"})),
      ]);
      setTraining(tr); setAudit(ar);
    }catch(e){
      setTraining(null); setAudit(null);
      setError(e instanceof Error?e.message:"Rapor verileri alınamadı.");
    }finally{setLoading(false)}
  }

  const companyName=training?.company?.name || companies.find(x=>x.id===selectedCompanyId)?.name || "Firma seçilmedi";
  const ts=training?.summary;
  const as=audit?.summary;
  const enterprisePatch=useMemo(()=>mapEnterpriseSummaryToDashboard(enterpriseSummary),[enterpriseSummary]);

  const activeEmployees=useMemo(()=> (training?.matrix??[]).filter(x=>x.is_active).length,[training]);
  const passiveEmployees=useMemo(()=> (training?.matrix??[]).filter(x=>!x.is_active).length,[training]);

  const executiveInput=useMemo(()=>({
    companyId:selectedCompanyId||"",
    companyName,
    companyTitle:training?.company?.company_title,
    employeeCount:training?.company?.employee_count || ts?.total_employees || 0,
    activeEmployeeCount:activeEmployees,
    passiveEmployeeCount:passiveEmployees,
    totalTrainings:ts?.total_assignments || 0,
    completedTrainings:ts?.completed_count || 0,
    missingTrainings:ts?.not_started_count || 0,
    inProgressTrainings:ts?.in_progress_count || 0,
    totalAudits:as?.total_audits || 0,
    completedAudits:as?.completed_audits || 0,
    // Executive ekranda "taslak" yerine tamamlanmamış tüm denetimleri gösteriyoruz.
    draftAudits:as?.unfinished_audits ?? Math.max(0,(as?.total_audits||0)-(as?.completed_audits||0)),
    complianceScore:as?.compliance_score || 0,
    nonconformityCount:as?.uygunsuz_count || 0,
    openDofCount:as?.open_dof_count || 0,
    closedDofCount:as?.closed_dof_count || 0,
    ...enterprisePatch,
  }),[selectedCompanyId,companyName,training,ts,as,activeEmployees,passiveEmployees,enterprisePatch]);

  const filteredTrainings=useMemo(()=>{
    const q=trainingSearch.trim().toLocaleLowerCase("tr-TR");
    return (training?.trainings??[]).filter(x=>!q||x.title.toLocaleLowerCase("tr-TR").includes(q));
  },[training,trainingSearch]);

  const visibleIds=useMemo(()=>new Set(filteredTrainings.map(x=>x.id)),[filteredTrainings]);
  const filteredEmployees=useMemo(()=>{
    const q=employeeSearch.trim().toLocaleLowerCase("tr-TR");
    return (training?.matrix??[])
      .filter(r=>!onlyActive||r.is_active)
      .filter(r=>!q||`${r.full_name} ${r.email}`.toLocaleLowerCase("tr-TR").includes(q))
      .map(r=>({...r,statuses:r.statuses.filter(s=>visibleIds.has(s.training_id))}))
      .filter(r=>statusFilter==="ALL"||r.statuses.some(s=>statusLabel(s.status)===statusFilter));
  },[training,employeeSearch,onlyActive,statusFilter,visibleIds]);

  const employeeRows=useMemo(()=>filteredEmployees.map(r=>{
    const st=r.statuses.map(s=>statusLabel(s.status));
    return {...r, completed:st.filter(x=>x==="Tamamlandı").length, inProgress:st.filter(x=>x==="Devam Ediyor").length,
      notStarted:st.filter(x=>x==="Başlamadı").length, unassigned:st.filter(x=>!["Tamamlandı","Devam Ediyor","Başlamadı"].includes(x)).length};
  }),[filteredEmployees]);

  const trainingRows=useMemo(()=>filteredTrainings.map(t=>{
    let completed=0,inProgress=0,notStarted=0,unassigned=0;
    for(const r of (training?.matrix??[]).filter(x=>!onlyActive||x.is_active)){
      const s=statusLabel(r.statuses.find(x=>x.training_id===t.id)?.status || "Atanmadı");
      if(s==="Tamamlandı")completed++; else if(s==="Devam Ediyor")inProgress++; else if(s==="Başlamadı")notStarted++; else unassigned++;
    }
    return {...t,completed,inProgress,notStarted,unassigned};
  }),[filteredTrainings,training,onlyActive]);

  const reportNo=`DSEC-${new Date().getFullYear()}-${selectedCompanyId||"NA"}`;
  const verificationCode=`VRF-${selectedCompanyId||"NA"}-${new Date().toISOString().slice(0,10).replaceAll("-","")}`;

  const catalog=[
    {key:"OVERVIEW" as Center,title:"HSE Yönetici Raporu",sub:"Kurumsal KPI, modül skorları ve öncelikli aksiyonlar.",icon:"◉"},
    {key:"TRAINING" as Center,title:"Eğitim Raporları",sub:"Eğitim matrisi, çalışan ve eğitim bazlı durum analizi.",icon:"▦"},
    {key:"AUDIT" as Center,title:"Denetim & DÖF",sub:"Uyum, uygunsuzluk, DÖF ve denetim kayıtları.",icon:"✓"},
    {key:"ANALYTICS" as Center,title:"Analiz Merkezi",sub:"Dönemsel eğilimler ve gelişmiş analitik.",icon:"⌁"},
  ];

  return <main style={{minHeight:"100vh",background:C.bg,padding:"18px 16px 56px",color:C.ink,fontFamily:"Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
    <div style={{maxWidth:1540,margin:"0 auto"}}>
      <section style={{borderRadius:24,padding:"28px 30px",background:"linear-gradient(120deg,#54101f,#7f1d2d 52%,#a61f32)",color:"#fff",boxShadow:"0 18px 45px rgba(83,16,31,.17)"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:22,alignItems:"flex-start",flexWrap:"wrap"}}>
          <div style={{minWidth:0}}>
            <div style={{fontSize:11,fontWeight:950,letterSpacing:1.2,opacity:.8}}>D-SEC • KURUMSAL RAPORLAMA</div>
            <h1 style={{margin:"8px 0 7px",fontSize:"clamp(28px,4vw,42px)",lineHeight:1.08}}>Raporlama ve Analiz Merkezi</h1>
            <p style={{margin:0,maxWidth:800,lineHeight:1.65,opacity:.88}}>Yönetim özetlerini, modül raporlarını ve dönemsel analizleri tek firma kapsamı altında üretin.</p>
          </div>
          {selectedCompanyId?<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>void loadData(selectedCompanyId)} style={ghost}>↻ Yenile</button>
            <ReportSectionPdfExportButton elementId="report-export-area" filename={`${companyName}-kurumsal-rapor`} label="Kurumsal PDF"
              reportTitle="D-SEC Kurumsal İSG Yönetim Raporu" reportNo={reportNo} verificationCode={verificationCode}/>
          </div>:null}
        </div>
      </section>

      <section style={{...card,marginTop:14,display:"grid",gridTemplateColumns:"minmax(220px,420px) minmax(0,1fr)",gap:16,alignItems:"end"}}>
        <label style={{display:"grid",gap:7,fontSize:12,fontWeight:850}}>Firma
          <select value={selectedCompanyId} onChange={e=>setSelectedCompanyId(e.target.value)} style={input}>
            {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>
          <b style={{color:C.ink}}>Aktif kapsam:</b> {companyName}. Tüm rapor sorguları bu firma kapsamıyla çalışır.
        </div>
      </section>

      {error?<div style={{...card,marginTop:14,borderColor:"#fecdca",background:"#fef3f2",color:"#b42318",fontWeight:750}}>{error}</div>:null}
      {loading?<div style={{...card,marginTop:14,color:C.muted}}>Rapor verileri yükleniyor...</div>:null}

      <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginTop:14}}>
        {catalog.map(x=><button key={x.key} onClick={()=>setCenter(x.key)} style={{...card,textAlign:"left",cursor:"pointer",borderColor:center===x.key?"#d6a6af":C.line,background:center===x.key?"#fff7f8":"#fff"}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:12}}><span style={{fontSize:23}}>{x.icon}</span><span style={{fontSize:11,fontWeight:900,color:center===x.key?C.burgundy:C.muted}}>{center===x.key?"AÇIK":"GÖRÜNTÜLE"}</span></div>
          <div style={{marginTop:14,fontSize:17,fontWeight:900}}>{x.title}</div>
          <div style={{marginTop:6,fontSize:12,lineHeight:1.55,color:C.muted}}>{x.sub}</div>
        </button>)}
      </section>

      <div id="report-export-area" style={{marginTop:16}}>
        {center==="OVERVIEW" && !loading ? <>
          <ExecutiveReportsDashboard input={executiveInput}/>
          <div style={{marginTop:14}}><ReportEnterpriseStatus data={enterpriseSummary} loading={enterpriseLoading} error={enterpriseError}/></div>
          <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginTop:14}}>
            <Metric title="Eğitim Atama Tamamlama" value={`%${pct(ts?.completed_count||0,ts?.total_assignments||0)}`} sub={`${ts?.completed_count||0}/${ts?.total_assignments||0} atama`}/>
            <Metric title="Denetim Uygunluğu" value={`%${as?.compliance_score||0}`} sub={`${as?.total_audits||0} denetim`}/>
            <Metric title="Açık DÖF" value={as?.open_dof_count||0} sub={`${as?.closed_dof_count||0} kapalı`} danger={(as?.open_dof_count||0)>0}/>
            <Metric title="Uygunsuzluk" value={as?.uygunsuz_count||0} sub="Aksiyon gerektiren bulgu" danger={(as?.uygunsuz_count||0)>0}/>
          </section>
          <div style={{...card,marginTop:14,fontSize:12,lineHeight:1.65,color:C.muted}}>
            <b style={{color:C.ink}}>Not:</b> “Eğitim Atama Tamamlama” operasyonel metriktir; yasal İSG eğitim uygunluğu ile aynı metrik değildir. Yasal süre/tehlike sınıfı motoru ayrıca bağlanmalıdır.
          </div>
        </> : null}

        {center==="TRAINING" && !loading ? <section style={card}>
          <Header title="Eğitim Raporları" sub="Atama durumu ve eğitim operasyonunu çalışan/eğitim bazında inceleyin."/>
          <div style={filterGrid}>
            <input value={employeeSearch} onChange={e=>setEmployeeSearch(e.target.value)} placeholder="Çalışan ara..." style={input}/>
            <input value={trainingSearch} onChange={e=>setTrainingSearch(e.target.value)} placeholder="Eğitim ara..." style={input}/>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={input}>
              <option value="ALL">Tüm durumlar</option><option>Tamamlandı</option><option>Devam Ediyor</option><option>Başlamadı</option><option>Atanmadı</option>
            </select>
            <label style={{display:"flex",gap:8,alignItems:"center",fontSize:12,fontWeight:750}}><input type="checkbox" checked={onlyActive} onChange={e=>setOnlyActive(e.target.checked)}/> Sadece aktif çalışanlar</label>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"14px 0"}}>
            {(["MATRIX","EMPLOYEE","TRAINING"] as TrainingView[]).map(v=><button key={v} onClick={()=>setTrainingView(v)} style={pill(trainingView===v)}>{v==="MATRIX"?"Eğitim Matrisi":v==="EMPLOYEE"?"Çalışan Bazlı":"Eğitim Bazlı"}</button>)}
          </div>
          {trainingView==="MATRIX"?<div style={{overflowX:"auto"}}><table style={{...table,minWidth:760}}><thead><tr><Th>Çalışan</Th>{filteredTrainings.map(t=><Th key={t.id}>{t.title}</Th>)}</tr></thead><tbody>
            {filteredEmployees.map(r=><tr key={r.user_id}><Td><b>{r.full_name}</b><div style={{fontSize:11,color:C.muted}}>{r.email}</div></Td>
              {filteredTrainings.map(t=>{const s=statusLabel(r.statuses.find(x=>x.training_id===t.id)?.status||"Atanmadı");const st=toneForStatus(s);return <Td key={t.id}><span style={{...badgeStyle,...st}}>{s}</span></Td>})}</tr>)}
          </tbody></table></div>:null}
          {trainingView==="EMPLOYEE"?<div style={{overflowX:"auto"}}><table style={table}><thead><tr>{["Çalışan","Tamamlandı","Devam","Başlamadı","Atanmadı"].map(x=><Th key={x}>{x}</Th>)}</tr></thead><tbody>{employeeRows.map(r=><tr key={r.user_id}><Td><b>{r.full_name}</b></Td><Td>{r.completed}</Td><Td>{r.inProgress}</Td><Td>{r.notStarted}</Td><Td>{r.unassigned}</Td></tr>)}</tbody></table></div>:null}
          {trainingView==="TRAINING"?<div style={{overflowX:"auto"}}><table style={table}><thead><tr>{["Eğitim","Tamamlandı","Devam","Başlamadı","Atanmadı"].map(x=><Th key={x}>{x}</Th>)}</tr></thead><tbody>{trainingRows.map(r=><tr key={r.id}><Td><b>{r.title}</b></Td><Td>{r.completed}</Td><Td>{r.inProgress}</Td><Td>{r.notStarted}</Td><Td>{r.unassigned}</Td></tr>)}</tbody></table></div>:null}
        </section>:null}

        {center==="AUDIT" && !loading ? <section style={{display:"grid",gap:14}}>
          <div style={card}><Header title="Denetim & DÖF Raporları" sub="Denetim uyumu, uygunsuzluk ve aksiyon kapanışını birlikte izleyin."/></div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:10}}>
            <Metric title="Toplam Denetim" value={as?.total_audits||0} sub={`${as?.completed_audits||0} tamamlandı · ${as?.unfinished_audits ?? Math.max(0,(as?.total_audits||0)-(as?.completed_audits||0))} tamamlanmadı`}/>
            <Metric title="Uyum" value={`%${as?.compliance_score||0}`} sub={`${as?.total_items||0} madde`}/>
            <Metric title="Uygunsuz" value={as?.uygunsuz_count||0} sub={`${as?.kismen_count||0} kısmen`} danger={(as?.uygunsuz_count||0)>0}/>
            <Metric title="Açık DÖF" value={as?.open_dof_count||0} sub={`${as?.closed_dof_count||0} kapalı`} danger={(as?.open_dof_count||0)>0}/>
          </div>
          <div style={card}><div style={{overflowX:"auto"}}><table style={{...table,minWidth:780}}><thead><tr>{["Rapor No","Tür","Mod","Lokasyon","Sorumlu","Denetçi","Durum"].map(x=><Th key={x}>{x}</Th>)}</tr></thead><tbody>
            {(audit?.audits??[]).map(a=><tr key={String(a.id)}><Td>{a.report_no||"-"}</Td><Td>{a.template_type||"-"}</Td><Td>{a.eval_mode||"-"}</Td><Td>{a.location||"-"}</Td><Td>{a.responsible||"-"}</Td><Td>{a.inspector_name||"-"}</Td><Td>{a.status||"-"}</Td></tr>)}
          </tbody></table></div></div>
        </section>:null}

        {center==="ANALYTICS" && selectedCompanyId && !loading ? <ReportAdvancedAnalyticsCenter companyId={selectedCompanyId} months={12}/>:null}
      </div>
    </div>
  </main>
}

function Header({title,sub}:{title:string;sub:string}){return <div><div style={{fontSize:20,fontWeight:950}}>{title}</div><div style={{marginTop:5,fontSize:12,color:C.muted,lineHeight:1.55}}>{sub}</div></div>}
function Metric({title,value,sub,danger=false}:{title:string;value:string|number;sub:string;danger?:boolean}){return <div style={card}><div style={{fontSize:11,color:C.muted,fontWeight:800}}>{title}</div><div style={{marginTop:7,fontSize:28,fontWeight:950,color:danger?C.red:C.ink}}>{value}</div><div style={{marginTop:5,fontSize:11,color:C.muted}}>{sub}</div></div>}
function Th({children}:{children:any}){return <th style={{padding:"11px 12px",background:"#f9fafb",borderBottom:`1px solid ${C.line}`,textAlign:"left",fontSize:11,color:C.muted,whiteSpace:"nowrap"}}>{children}</th>}
function Td({children}:{children:any}){return <td style={{padding:"11px 12px",borderBottom:`1px solid ${C.line}`,fontSize:12,verticalAlign:"top"}}>{children}</td>}
const card:React.CSSProperties={background:"#fff",border:`1px solid ${C.line}`,borderRadius:16,padding:16,boxShadow:"0 3px 12px rgba(16,24,40,.035)",minWidth:0};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"11px 12px",border:`1px solid ${C.line}`,borderRadius:10,background:"#fff",fontSize:12,outline:"none"};
const ghost:React.CSSProperties={border:"1px solid rgba(255,255,255,.25)",borderRadius:11,padding:"10px 13px",background:"rgba(255,255,255,.12)",color:"#fff",fontWeight:800,cursor:"pointer"};
const filterGrid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginTop:14,alignItems:"center"};
const table:React.CSSProperties={width:"100%",borderCollapse:"collapse"};
const badgeStyle:React.CSSProperties={display:"inline-flex",padding:"5px 8px",borderRadius:999,fontSize:10,fontWeight:850,whiteSpace:"nowrap"};
const pill=(active:boolean):React.CSSProperties=>({border:`1px solid ${active?"#d6a6af":C.line}`,background:active?"#fff4f5":"#fff",color:active?C.burgundy:C.muted,borderRadius:999,padding:"8px 11px",fontSize:11,fontWeight:850,cursor:"pointer"});
