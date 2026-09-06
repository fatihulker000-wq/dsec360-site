"use client";

import { useMemo } from "react";

type Employee = {
  id: string;
  full_name: string;
  department?: string | null;
  job_title?: string | null;
  start_date?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  disability_status?: string | null;
  education_level?: string | null;
  blood_type?: string | null;
  training_status?: string | null;
  health_status?: string | null;
  ppe_status?: string | null;
  document_status?: string | null;
  risk_status?: string | null;
  accident_count?: number | null;
  training_completion_rate?: number | null;
  legal_training_completed_minutes?: number | null;
  legal_training_required_minutes?: number | null;
  legal_training_missing_minutes?: number | null;
  health_ek2_count?: number | null;
  health_next_due_at?: string | null;
  active: boolean;
};

type Props = {
  employees: Employee[];
  selectedCompanyName: string;
  onEmployeeClick?: (employeeId: string) => void;
};

const card: React.CSSProperties = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, boxShadow: "0 8px 24px rgba(15,23,42,.04)" };
const title: React.CSSProperties = { fontSize: 17, fontWeight: 950, color: "#111827" };
const muted: React.CSSProperties = { color: "#64748b", fontSize: 12, lineHeight: 1.5 };

function norm(v: unknown) { return String(v ?? "").trim().toUpperCase(); }
function missing(v: unknown) { return !String(v ?? "").trim(); }
function age(date?: string | null) { if (!date) return null; const d=new Date(date); if(Number.isNaN(d.getTime())) return null; const n=new Date(); let a=n.getFullYear()-d.getFullYear(); const m=n.getMonth()-d.getMonth(); if(m<0 || (m===0 && n.getDate()<d.getDate())) a--; return a>=0&&a<100?a:null; }
function years(date?: string | null) { if(!date) return null; const d=new Date(date); if(Number.isNaN(d.getTime())) return null; return Math.max(0,(Date.now()-d.getTime())/31557600000); }
function pct(a:number,b:number){ return b ? Math.round((a/b)*100) : 0; }
function fmtDate(v?:string|null){ if(!v) return "—"; const d=new Date(v); return Number.isNaN(d.getTime())?"—":d.toLocaleDateString("tr-TR"); }

function countBy(items: Employee[], getter:(e:Employee)=>string, unknown="Bilinmiyor") {
  const m=new Map<string,number>();
  items.forEach(e=>{ const raw=getter(e).trim(); const k=raw||unknown; m.set(k,(m.get(k)||0)+1); });
  return [...m.entries()].sort((a,b)=>b[1]-a[1]);
}

function Distribution({heading, sub, rows}:{heading:string;sub:string;rows:[string,number][]}){
  const max=Math.max(1,...rows.map(x=>x[1]));
  return <section style={{...card,padding:18,minHeight:250}}><div style={title}>{heading}</div><div style={{...muted,marginTop:4,marginBottom:16}}>{sub}</div><div style={{display:"grid",gap:12}}>{rows.slice(0,8).map(([k,v])=><div key={k}><div style={{display:"flex",justifyContent:"space-between",gap:10,fontSize:12,fontWeight:800,color:"#334155"}}><span>{k}</span><b>{v}</b></div><div style={{height:7,background:"#f1f5f9",borderRadius:999,marginTop:6,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.max(4,(v/max)*100)}%`,borderRadius:999,background:"linear-gradient(90deg,#7f1d1d,#b91c1c)"}}/></div></div>)}</div></section>
}

function Metric({label,value,detail,tone="dark"}:{label:string;value:string|number;detail:string;tone?:"dark"|"red"|"amber"|"green"}){
 const colors={dark:"#0f172a",red:"#991b1b",amber:"#b45309",green:"#047857"};
 return <div style={{...card,padding:16}}><div style={{fontSize:11,fontWeight:900,color:"#64748b",letterSpacing:.5}}>{label}</div><div style={{fontSize:28,fontWeight:950,color:colors[tone],marginTop:6}}>{value}</div><div style={{...muted,marginTop:4}}>{detail}</div></div>
}

function statusLabel(e:Employee){
 const issues=[] as string[];
 if(norm(e.training_status)==="MISSING"||norm(e.training_status)==="EXPIRING") issues.push("Eğitim");
 if(norm(e.health_status)==="MISSING"||norm(e.health_status)==="EXPIRING") issues.push("Sağlık");
 if(norm(e.ppe_status)==="MISSING"||norm(e.ppe_status)==="EXPIRING") issues.push("KKD");
 if(norm(e.document_status)==="MISSING"||norm(e.document_status)==="EXPIRING") issues.push("Belge");
 if(["HIGH","CRITICAL"].includes(norm(e.risk_status))) issues.push("Risk");
 if(Number(e.accident_count||0)>0) issues.push("Kaza/Olay");
 return issues;
}

export default function EmployeeExecutiveDashboard({employees,selectedCompanyName,onEmployeeClick}:Props){
 const active=useMemo(()=>employees.filter(e=>e.active!==false),[employees]);
 const analytics=useMemo(()=>{
   const total=active.length;
   const trainingMissing=active.filter(e=>["MISSING","EXPIRING"].includes(norm(e.training_status))).length;
   const healthFollow=active.filter(e=>["MISSING","EXPIRING"].includes(norm(e.health_status))).length;
   const ppeMissing=active.filter(e=>["MISSING","EXPIRING"].includes(norm(e.ppe_status))).length;
   const docMissing=active.filter(e=>["MISSING","EXPIRING"].includes(norm(e.document_status))).length;
   const highRisk=active.filter(e=>["HIGH","CRITICAL"].includes(norm(e.risk_status))).length;
   const accidentPeople=active.filter(e=>Number(e.accident_count||0)>0).length;
   const newStarts=active.filter(e=>{const y=years(e.start_date);return y!==null&&y<=0.25}).length;
   const dataMissing=active.filter(e=>missing(e.blood_type)||missing(e.birth_date)||missing(e.start_date)||missing(e.department)||missing(e.job_title));
   const bloodMissing=active.filter(e=>missing(e.blood_type)).length;
   const birthMissing=active.filter(e=>missing(e.birth_date)).length;
   const startMissing=active.filter(e=>missing(e.start_date)).length;
   const orgMissing=active.filter(e=>missing(e.department)||missing(e.job_title)).length;
   const completeFields=active.reduce((s,e)=>s+[e.blood_type,e.birth_date,e.start_date,e.department,e.job_title].filter(v=>!missing(v)).length,0);
   const quality=pct(completeFields,total*5);
   const actions=active.map(e=>({e,issues:statusLabel(e)})).filter(x=>x.issues.length).sort((a,b)=>b.issues.length-a.issues.length || Number(b.e.accident_count||0)-Number(a.e.accident_count||0));
   return {total,trainingMissing,healthFollow,ppeMissing,docMissing,highRisk,accidentPeople,newStarts,bloodMissing,birthMissing,startMissing,orgMissing,quality,actions,dataMissing:dataMissing.length};
 },[active]);

 const jobs=useMemo(()=>countBy(active,e=>e.job_title||""),[active]);
 const deps=useMemo(()=>countBy(active,e=>e.department||""),[active]);
 const genders=useMemo(()=>countBy(active,e=>e.gender||""),[active]);
 const education=useMemo(()=>countBy(active,e=>e.education_level||""),[active]);
 const blood=useMemo(()=>countBy(active,e=>e.blood_type||""),[active]);
 const ageRows=useMemo(()=>{const b={"18–24":0,"25–34":0,"35–44":0,"45–54":0,"55+":0,"Bilinmiyor":0};active.forEach(e=>{const a=age(e.birth_date);if(a===null)b["Bilinmiyor"]++;else if(a<25)b["18–24"]++;else if(a<35)b["25–34"]++;else if(a<45)b["35–44"]++;else if(a<55)b["45–54"]++;else b["55+"]++;});return Object.entries(b).filter(x=>x[1]>0) as [string,number][]},[active]);
 const seniority=useMemo(()=>{const b={"0–1 yıl":0,"1–3 yıl":0,"3–5 yıl":0,"5–10 yıl":0,"10+ yıl":0,"Bilinmiyor":0};active.forEach(e=>{const y=years(e.start_date);if(y===null)b["Bilinmiyor"]++;else if(y<1)b["0–1 yıl"]++;else if(y<3)b["1–3 yıl"]++;else if(y<5)b["3–5 yıl"]++;else if(y<10)b["5–10 yıl"]++;else b["10+ yıl"]++;});return Object.entries(b).filter(x=>x[1]>0) as [string,number][]},[active]);

 const topInsight = analytics.highRisk>0 ? `${analytics.highRisk} çalışan yüksek risk nedeniyle öncelikli takip gerektiriyor.` : analytics.trainingMissing>0 ? `${analytics.trainingMissing} çalışanın yasal eğitim takibinde aksiyon gerekiyor.` : analytics.healthFollow>0 ? `${analytics.healthFollow} çalışanın sağlık takip sürecinde aksiyon gerekiyor.` : "Kritik çalışan uyum açığı görünmüyor.";

 return <div style={{display:"grid",gap:16}}>
  <section style={{...card,padding:20,background:"linear-gradient(135deg,#fff 0%,#fff 65%,#fef2f2 100%)"}}>
   <div style={{display:"flex",justifyContent:"space-between",gap:16,flexWrap:"wrap"}}><div><div style={{fontSize:11,fontWeight:950,color:"#991b1b",letterSpacing:.8}}>D•SEC İŞGÜCÜ ANALİZ MERKEZİ</div><div style={{fontSize:24,fontWeight:950,color:"#111827",marginTop:6}}>Çalışan ve İSG Uyum Görünümü</div><div style={{...muted,marginTop:5}}>{selectedCompanyName} · İşgücü profili, veri kalitesi ve aksiyon gerektiren İSG yükümlülükleri.</div></div><div style={{padding:"10px 14px",borderRadius:14,background:"#fff",border:"1px solid #fecaca",fontSize:12,fontWeight:850,color:"#7f1d1d",maxWidth:420}}>{topInsight}</div></div>
  </section>

  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:12}}>
   <Metric label="AKTİF ÇALIŞAN" value={analytics.total} detail={`${analytics.newStarts} kişi son 3 ayda başladı`} />
   <Metric label="EĞİTİM AKSİYONU" value={analytics.trainingMissing} detail="Eksik / yaklaşan yasal eğitim" tone={analytics.trainingMissing?"amber":"green"}/>
   <Metric label="SAĞLIK TAKİBİ" value={analytics.healthFollow} detail="Takip veya yenileme gereken" tone={analytics.healthFollow?"amber":"green"}/>
   <Metric label="YÜKSEK RİSK" value={analytics.highRisk} detail="Öncelikli çalışan riskleri" tone={analytics.highRisk?"red":"green"}/>
   <Metric label="KAZA / OLAY" value={analytics.accidentPeople} detail="Kaydı bulunan çalışan" tone={analytics.accidentPeople?"red":"green"}/>
   <Metric label="VERİ KALİTESİ" value={`%${analytics.quality}`} detail={`${analytics.dataMissing} çalışanda temel alan eksiği`} tone={analytics.quality<90?"amber":"green"}/>
  </div>

  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14}}>
   <Distribution heading="Departman Dağılımı" sub="Organizasyonun departman bazındaki çalışan yoğunluğu." rows={deps}/>
   <Distribution heading="Ünvan Dağılımı" sub="Görev ve ünvan bazındaki işgücü dağılımı." rows={jobs}/>
   <Distribution heading="Kıdem Dağılımı" sub="İşe giriş tarihine göre çalışan kıdem grupları." rows={seniority}/>
   <Distribution heading="Yaş Dağılımı" sub="Doğum tarihine göre çalışan yaş grupları." rows={ageRows}/>
   <Distribution heading="Kan Grubu Dağılımı" sub="Acil durum hazırlığı için çalışan ana kaydındaki kan grubu dağılımı." rows={blood}/>
   <Distribution heading="Eğitim Düzeyi" sub="Çalışanların eğitim seviyesi dağılımı." rows={education}/>
   <Distribution heading="Cinsiyet Dağılımı" sub="Çalışan ana kayıtlarındaki cinsiyet dağılımı." rows={genders}/>
   <section style={{...card,padding:18,minHeight:250}}><div style={title}>Veri Kalitesi</div><div style={{...muted,marginTop:4}}>Operasyon ve raporlama kalitesini etkileyen eksik temel çalışan bilgileri.</div><div style={{display:"grid",gap:10,marginTop:18}}>{[["Kan grubu",analytics.bloodMissing],["Doğum tarihi",analytics.birthMissing],["İşe giriş tarihi",analytics.startMissing],["Departman / ünvan",analytics.orgMissing]].map(([k,v])=><div key={String(k)} style={{display:"flex",justifyContent:"space-between",padding:"11px 12px",borderRadius:12,background:Number(v)>0?"#fff7ed":"#f0fdf4",fontSize:12,fontWeight:850}}><span>{k}</span><b>{v} eksik</b></div>)}</div></section>
  </div>

  <section style={{...card,overflow:"hidden"}}>
   <div style={{padding:18,borderBottom:"1px solid #e5e7eb",display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><div style={title}>Aksiyon Gerektiren Çalışanlar</div><div style={{...muted,marginTop:4}}>Eğitim, sağlık takibi, KKD, belge, risk veya kaza/olay nedeniyle öncelikli kontrol gereken çalışanlar.</div></div><div style={{fontSize:12,fontWeight:900,color:"#991b1b"}}>{analytics.actions.length} çalışan</div></div>
   <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:900,fontSize:12}}><thead><tr style={{background:"#f8fafc",color:"#64748b",textAlign:"left"}}>{["Çalışan","Departman","Yasal Eğitim","Sağlık Takibi","KKD","Belge","Risk","Kaza/Olay","Aksiyon"].map(h=><th key={h} style={{padding:"11px 12px",fontWeight:900}}>{h}</th>)}</tr></thead><tbody>{analytics.actions.slice(0,12).map(({e,issues})=><tr key={e.id} style={{borderTop:"1px solid #f1f5f9"}}><td style={{padding:12,fontWeight:900,color:"#111827"}}>{e.full_name}</td><td style={{padding:12}}>{e.department||"—"}</td><td style={{padding:12}}>{norm(e.training_status)==="COMPLETE"?`${Math.round(Number(e.legal_training_completed_minutes||0)/60)} / ${Math.round(Number(e.legal_training_required_minutes||0)/60)} saat`:norm(e.training_status)==="EXPIRING"?"Yaklaşıyor":norm(e.training_status)==="MISSING"?"Eksik":"Veri yok"}</td><td style={{padding:12}}>{norm(e.health_status)==="EXPIRING"?`Yaklaşıyor · ${fmtDate(e.health_next_due_at)}`:norm(e.health_status)==="MISSING"?"Takip gerekli":Number(e.health_ek2_count||0)>0?"EK-2 mevcut":"Kayıt yok"}</td><td style={{padding:12}}>{norm(e.ppe_status)==="COMPLETE"?"Güncel":norm(e.ppe_status)==="MISSING"?"Eksik":"—"}</td><td style={{padding:12}}>{norm(e.document_status)==="COMPLETE"?"Güncel":norm(e.document_status)==="MISSING"?"Eksik":"—"}</td><td style={{padding:12,fontWeight:850,color:["HIGH","CRITICAL"].includes(norm(e.risk_status))?"#991b1b":"#334155"}}>{norm(e.risk_status)==="HIGH"?"Yüksek":norm(e.risk_status)==="CRITICAL"?"Kritik":norm(e.risk_status)==="LOW"?"Düşük":"—"}</td><td style={{padding:12}}>{Number(e.accident_count||0)}</td><td style={{padding:12}}><button onClick={()=>onEmployeeClick?.(e.id)} style={{border:"1px solid #fecaca",background:"#fff",color:"#991b1b",fontWeight:900,borderRadius:10,padding:"7px 10px",cursor:"pointer"}}>Profili Aç</button><div style={{...muted,marginTop:5}}>{issues.join(" · ")}</div></td></tr>)}</tbody></table></div>
   {analytics.actions.length===0?<div style={{padding:24,textAlign:"center",color:"#64748b",fontSize:13}}>Aksiyon gerektiren çalışan kaydı bulunmuyor.</div>:null}
  </section>
 </div>;
}
