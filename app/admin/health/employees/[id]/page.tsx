"use client";
import Link from "next/link";
import {useParams,useSearchParams} from "next/navigation";
import {useEffect,useMemo,useState} from "react";
import DocumentsTab from "@/components/health/tabs/DocumentsTab";
import EmployeeHealthTabs from "@/components/health/EmployeeHealthTabs";
import GeneralTab from "@/components/health/tabs/GeneralTab";
import PrescriptionTab from "@/components/health/tabs/PrescriptionTab";
import Ek2Tab from "@/components/health/tabs/Ek2Tab";
import ExaminationTab from "@/components/health/tabs/ExaminationTab";
import AccidentTab from "@/components/health/tabs/AccidentTab";
import HealthTimelineTab from "@/components/health/tabs/HealthTimelineTab";
import LaboratoryTab from "@/components/health/tabs/LaboratoryTab";
import AudiometryTab from "@/components/health/tabs/AudiometryTab";
import RespiratoryTab from "@/components/health/tabs/RespiratoryTab";
import VaccinationTab from "@/components/health/tabs/VaccinationTab";

type Employee={id:string;company_id:string;full_name:string;email:string;company_name:string;job_title:string;start_date:string;examination_count?:number;last_examination_date?:string;last_examination_decision?:string;next_examination_date?:string;ek2_count?:number;last_ek2?:string;last_ek2_date?:string;last_ek2_status?:string;prescription_count?:number;last_prescription?:string;last_prescription_date?:string;last_prescription_status?:string;lab_count?:number;vaccine_count?:number;accident_count?:number;health_status?:"NORMAL"|"WARNING"|"CRITICAL"|"MISSING"};
function fmt(v?:string){if(!v||v==="-")return"-";const d=new Date(v);return Number.isNaN(d.getTime())?v:d.toLocaleDateString("tr-TR")}
function riskLabel(v?:string){return v==="CRITICAL"?"Kritik":v==="WARNING"?"Takip":v==="MISSING"?"Kayıt Eksik":"Normal"}
function riskColors(v?:string){return v==="CRITICAL"?{bg:"#fee2e2",fg:"#b91c1c"}:v==="WARNING"||v==="MISSING"?{bg:"#fef3c7",fg:"#b45309"}:{bg:"#dcfce7",fg:"#15803d"}}

export default function HealthEmployeeDetailPage(){
 const params=useParams(); const sp=useSearchParams(); const employeeId=String(params?.id||"");
 const companyId=String(sp.get("companyId")||"ALL"); const requestedTab=String(sp.get("tab")||"Genel");
 const [employee,setEmployee]=useState<Employee|null>(null); const [activeTab,setActiveTab]=useState(requestedTab); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 useEffect(()=>{setActiveTab(requestedTab)},[requestedTab]);
 useEffect(()=>{let alive=true;(async()=>{try{setLoading(true);setError("");const qs=companyId!=="ALL"?`?companyId=${encodeURIComponent(companyId)}`:"";const res=await fetch(`/api/admin/health-employees${qs}`,{cache:"no-store",credentials:"include"});const json=await res.json();if(!res.ok)throw new Error(json?.error||"Çalışan sağlık kartı alınamadı.");const found=(json.employees||[]).find((x:Employee)=>String(x.id)===employeeId)||null;if(alive)setEmployee(found);if(alive&&!found)setError("Çalışan bulunamadı veya bu firmaya erişim yetkiniz yok.");}catch(e:any){if(alive){setEmployee(null);setError(e?.message||"Çalışan sağlık kartı alınamadı.")}}finally{if(alive)setLoading(false)}})();return()=>{alive=false}},[employeeId,companyId]);
 const backHref=companyId==="ALL"?"/admin/health/employees":`/admin/health/employees?companyId=${encodeURIComponent(companyId)}`;
 const risk=riskColors(employee?.health_status);
 const completion=useMemo(()=>{if(!employee)return 0;const checks=[Number(employee.examination_count||0)>0,Number(employee.ek2_count||0)>0,Boolean(employee.email),Boolean(employee.job_title),Boolean(employee.start_date)];return Math.round(checks.filter(Boolean).length/checks.length*100)},[employee]);
 return <main className="health-detail-page">
  <style jsx global>{`
    .health-detail-page{min-height:100vh;background:#f4f7fb;color:#101828;font-family:Inter,Arial,sans-serif;padding:20px 16px 48px}.health-detail-shell{max-width:1500px;margin:0 auto}.health-detail-hero{background:linear-gradient(135deg,#9f151b,#c32628 55%,#861118);border-radius:24px;padding:22px;color:#fff;box-shadow:0 18px 44px rgba(127,29,29,.2)}.health-detail-head{display:flex;justify-content:space-between;gap:20px;align-items:center}.health-detail-person{display:flex;gap:15px;align-items:center}.health-detail-avatar{width:62px;height:62px;border-radius:18px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.2);display:grid;place-items:center;font-size:23px;font-weight:950}.health-detail-metrics{display:grid;grid-template-columns:repeat(5,minmax(110px,1fr));gap:9px;margin-top:16px}.health-detail-kpi{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:12px}.health-detail-grid{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:16px;align-items:start;margin-top:16px}.health-detail-content{min-width:0}.health-detail-aside{background:#fff;border:1px solid #e4e7ec;border-radius:16px;padding:17px;box-shadow:0 8px 22px rgba(16,24,40,.04);position:sticky;top:18px}.summary-row{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #eef2f6;font-size:12px}.summary-row:last-child{border-bottom:0}.summary-label{color:#667085;font-weight:750}.summary-value{text-align:right;color:#101828;font-weight:900;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.health-progress{height:7px;background:#eef2f6;border-radius:999px;overflow:hidden;margin-top:8px}.health-progress>div{height:100%;background:#9f1239;border-radius:999px}.top-actions{display:flex;gap:8px;flex-wrap:wrap}.top-action{display:inline-flex;align-items:center;text-decoration:none;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:900}.top-action.secondary{background:#fff;color:#344054;border:1px solid #d0d5dd}.top-action.primary{background:#fff1f2;color:#9f1239;border:1px solid #f3c0c5}@media(max-width:980px){.health-detail-grid{grid-template-columns:1fr}.health-detail-aside{position:static}.health-detail-metrics{grid-template-columns:repeat(3,1fr)}}@media(max-width:650px){.health-detail-page{padding:10px 8px 34px}.health-detail-head{align-items:flex-start;flex-direction:column}.health-detail-person{align-items:flex-start}.health-detail-avatar{width:50px;height:50px}.health-detail-metrics{grid-template-columns:repeat(2,1fr)}}
  `}</style>
  <div className="health-detail-shell">
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:12,flexWrap:"wrap"}}><Link href={backHref} style={{color:"#7f1d1d",fontWeight:900,textDecoration:"none",fontSize:12}}>← Çalışan Sağlık Kartlarına Dön</Link><div style={{fontSize:11,color:"#667085"}}>Sağlık verileri yalnız yetkili firma kapsamından okunur.</div></div>
   {loading?<div style={notice}>Sağlık kartı yükleniyor…</div>:error||!employee?<div style={{...notice,background:"#fef2f2",color:"#b91c1c",borderColor:"#fecaca"}}>{error||"Çalışan bulunamadı."}</div>:<>
    <section className="health-detail-hero">
     <div className="health-detail-head">
      <div className="health-detail-person"><div className="health-detail-avatar">{employee.full_name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><div><div style={{fontSize:10,fontWeight:950,letterSpacing:.8,opacity:.8}}>D-SEC SAĞLIK KARTI</div><h1 style={{fontSize:30,lineHeight:1.05,margin:"6px 0 5px"}}>{employee.full_name}</h1><div style={{fontSize:12,opacity:.9}}>{employee.company_name} • {employee.job_title||"Görev bilgisi yok"}</div></div></div>
      <div className="top-actions"><Link className="top-action secondary" href={`${backHref}`}>Liste</Link><button className="top-action primary" style={{cursor:"pointer"}} onClick={()=>setActiveTab("Muayeneler")}>+ Muayene</button><button className="top-action primary" style={{cursor:"pointer"}} onClick={()=>setActiveTab("Reçeteler")}>+ Reçete</button></div>
     </div>
     <div className="health-detail-metrics"><HeroKpi label="Muayene" value={employee.examination_count||0}/><HeroKpi label="EK-2" value={employee.ek2_count||0}/><HeroKpi label="Reçete" value={employee.prescription_count||0}/><HeroKpi label="Son Muayene" value={fmt(employee.last_examination_date)}/><HeroKpi label="Risk" value={riskLabel(employee.health_status)}/></div>
    </section>
    <div style={{marginTop:16}}><EmployeeHealthTabs activeTab={activeTab} setActiveTab={setActiveTab}/></div>
    <div className="health-detail-grid">
     <div className="health-detail-content">
      {activeTab==="Genel"&&<GeneralTab employee={employee}/>} {activeTab==="EK-2"&&<Ek2Tab employee={employee as any}/>} {activeTab==="Muayeneler"&&<ExaminationTab employee={employee as any}/>} {activeTab==="Reçeteler"&&<PrescriptionTab employee={employee as any}/>} {activeTab==="Laboratuvar"&&<LaboratoryTab employee={employee as any}/>} {activeTab==="Odyometri"&&<AudiometryTab employee={employee as any}/>} {activeTab==="Solunum"&&<RespiratoryTab employee={employee as any}/>} {activeTab==="Aşılar"&&<VaccinationTab employee={employee as any}/>} {activeTab==="İş Kazaları"&&<AccidentTab employee={employee as any}/>} {activeTab==="Dosyalar"&&<DocumentsTab employee={employee as any}/>} {activeTab==="Geçmiş"&&<HealthTimelineTab employee={employee as any}/>} 
     </div>
     <aside className="health-detail-aside">
      <div style={{fontSize:10,fontWeight:950,letterSpacing:.7,color:"#9f1239"}}>SAĞLIK ÖZETİ</div><h3 style={{fontSize:17,margin:"5px 0 12px"}}>Kayıt Durumu</h3>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,padding:"10px 0 12px"}}><span style={{fontSize:12,color:"#667085",fontWeight:800}}>Risk</span><span style={{background:risk.bg,color:risk.fg,padding:"6px 9px",borderRadius:999,fontSize:11,fontWeight:950}}>{riskLabel(employee.health_status)}</span></div>
      <div style={{fontSize:11,color:"#667085"}}>Kayıt bütünlüğü</div><div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:12,fontWeight:900}}><span>{completion}%</span><span style={{color:"#667085"}}>5 temel alan</span></div><div className="health-progress"><div style={{width:`${completion}%`}}/></div>
      <div style={{marginTop:12}}><Row label="İşe Giriş" value={fmt(employee.start_date)}/><Row label="Son Muayene" value={fmt(employee.last_examination_date)}/><Row label="Sonraki Muayene" value={fmt(employee.next_examination_date)}/><Row label="Son EK-2" value={fmt(employee.last_ek2_date||employee.last_ek2)}/><Row label="Son Reçete" value={fmt(employee.last_prescription_date)}/><Row label="E-posta" value={employee.email||"-"}/></div>
      <div style={{marginTop:12,padding:10,borderRadius:10,background:"#f8fafc",fontSize:10.5,color:"#667085",lineHeight:1.55}}>Bu özet D-SEC içindeki kayıt durumunu gösterir; tek başına tıbbi uygunluk kararı değildir.</div>
     </aside>
    </div>
   </>}
  </div>
 </main>;
}
function HeroKpi({label,value}:{label:string;value:string|number}){return <div className="health-detail-kpi"><div style={{fontSize:10,fontWeight:850,opacity:.78}}>{label}</div><div style={{fontSize:19,fontWeight:950,marginTop:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value}</div></div>}
function Row({label,value}:{label:string;value:string}){return <div className="summary-row"><span className="summary-label">{label}</span><span className="summary-value" title={value}>{value}</span></div>}
const notice:React.CSSProperties={padding:18,borderRadius:14,background:"#fff",border:"1px solid #e4e7ec",fontWeight:800,color:"#667085"};
