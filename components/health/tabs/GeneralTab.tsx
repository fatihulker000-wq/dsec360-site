"use client";

type Props={employee:any};
function fmt(v?:string){if(!v||v==="-")return"-";const d=new Date(v);return Number.isNaN(d.getTime())?v:d.toLocaleDateString("tr-TR")}
function riskText(v?:string){return v==="CRITICAL"?"Kritik":v==="WARNING"?"Takip":v==="MISSING"?"Kayıt Eksik":"Normal"}
function riskStyle(v?:string){return v==="CRITICAL"?{background:"#fee2e2",color:"#b91c1c"}:v==="WARNING"||v==="MISSING"?{background:"#fef3c7",color:"#b45309"}:{background:"#dcfce7",color:"#15803d"}}
export default function GeneralTab({employee}:Props){
 const cards=[
  ["Ad Soyad",employee?.full_name],["Firma",employee?.company_name],["Görev",employee?.job_title],["E-posta",employee?.email],
  ["İşe Giriş",fmt(employee?.start_date)],["Son Muayene",fmt(employee?.last_examination_date)],["Sonraki Muayene",fmt(employee?.next_examination_date)],["Son EK-2",fmt(employee?.last_ek2_date||employee?.last_ek2)]
 ];
 return <div style={{display:"grid",gap:16}}>
  <section style={card}>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,marginBottom:16}}>
    <div><div style={eyebrow}>GENEL BİLGİLER</div><h2 style={{margin:"4px 0 0",fontSize:20}}>Çalışan Profili</h2></div>
    <span style={{...riskStyle(employee?.health_status),padding:"7px 11px",borderRadius:999,fontSize:11,fontWeight:900}}>{riskText(employee?.health_status)}</span>
   </div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:10}}>
    {cards.map(([k,v])=><div key={k} style={{padding:13,borderRadius:12,background:"#f8fafc",border:"1px solid #eef2f6",minWidth:0}}><div style={{fontSize:10,fontWeight:900,color:"#667085",textTransform:"uppercase",letterSpacing:.45}}>{k}</div><div style={{fontSize:13,fontWeight:850,color:"#101828",marginTop:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={String(v||"-")}>{v||"-"}</div></div>)}
   </div>
  </section>
  <section style={card}>
   <div style={eyebrow}>SAĞLIK KAYIT KAPSAMI</div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginTop:12}}>
    <Kpi title="Muayene" value={employee?.examination_count||0}/><Kpi title="EK-2" value={employee?.ek2_count||0}/><Kpi title="Reçete" value={employee?.prescription_count||0}/><Kpi title="Laboratuvar" value={employee?.lab_count||0}/><Kpi title="Aşı" value={employee?.vaccine_count||0}/><Kpi title="İş Kazası" value={employee?.accident_count||0}/>
   </div>
   <div style={{marginTop:12,fontSize:11,color:"#667085"}}>0 değeri, D-SEC içinde eşleşen kayıt bulunmadığını ifade eder; tıbbi işlemin gerçekte yapılmadığını tek başına kanıtlamaz.</div>
  </section>
 </div>;
}
function Kpi({title,value}:{title:string;value:number}){return <div style={{padding:14,borderRadius:14,border:"1px solid #e4e7ec",background:"#fff"}}><div style={{fontSize:11,color:"#667085",fontWeight:850}}>{title}</div><div style={{fontSize:27,fontWeight:950,color:"#101828",marginTop:5}}>{value}</div></div>}
const card:React.CSSProperties={background:"#fff",border:"1px solid #e4e7ec",borderRadius:16,padding:18,boxShadow:"0 8px 22px rgba(16,24,40,.035)"};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:950,letterSpacing:.7,color:"#9f1239"};
