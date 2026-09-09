"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createAgenda, patchAgenda, removeAgenda } from "./api";
import { isOverdue, useAgendaData, useAgendaStats, useCompanyData, useEmployeeData, useFilteredAgenda } from "./hooks";
import CompanySelect from "./components/CompanySelect";
import EmployeeSelect from "./components/EmployeeSelect";
import type { AgendaScope, AgendaTask, AgendaView, CompanyItem, EmployeeItem, TaskFilter, TaskType } from "./types";

const TYPES:[TaskType,string][]=[["TASK","Görev"],["MEETING","Toplantı"],["INSPECTION","Denetim"],["TRAINING","Eğitim"],["VISIT","Ziyaret"],["REMINDER","Hatırlatma"]];
const FILTERS:[TaskFilter,string][]=[["ALL","Tümü"],["OPEN","Açık"],["TODAY","Bugün"],["UPCOMING","Yaklaşan"],["OVERDUE","Geciken"],["CRITICAL","Kritik"],["DONE","Tamamlanan"]];
const burgundy="#7f1d2d", red="#a61f32", ink="#172033", muted="#667085", line="#e8eaf0";

function useIsMobile(){const[m,setM]=useState(false);useEffect(()=>{const q=window.matchMedia("(max-width: 760px)");const sync=()=>setM(q.matches);sync();q.addEventListener?.("change",sync);return()=>q.removeEventListener?.("change",sync)},[]);return m}

export default function AgendaPage(){
 const mobile=useIsMobile();
 const {companies,loading:companiesLoading}=useCompanyData();
 const[selectedCompany,setSelectedCompany]=useState<CompanyItem|null>(null);
 const {tasks,viewer,loading,loadError,refresh}=useAgendaData(selectedCompany?.id??"");
 const {employees,loading:employeesLoading}=useEmployeeData(selectedCompany?.id??"");
 const[selectedEmployee,setSelectedEmployee]=useState<EmployeeItem|null>(null);
 const[scope,setScope]=useState<AgendaScope>("COMPANY");
 const[filter,setFilter]=useState<TaskFilter>("ALL");
 const[typeFilter,setTypeFilter]=useState("ALL");
 const[search,setSearch]=useState("");
 const[view,setView]=useState<AgendaView>("LIST");
 const[month,setMonth]=useState(()=>new Date());
 const[showCreate,setShowCreate]=useState(false);
 const[saving,setSaving]=useState(false);
 const[error,setError]=useState("");
 const[message,setMessage]=useState("");
 const[title,setTitle]=useState("");const[note,setNote]=useState("");const[type,setType]=useState<TaskType>("TASK");const[priority,setPriority]=useState("1");const[dueAt,setDueAt]=useState("");const[endAt,setEndAt]=useState("");const[location,setLocation]=useState("");const[meetingLink,setMeetingLink]=useState("");const[isAllDay,setIsAllDay]=useState(false);

 useEffect(()=>{if(!selectedCompany&&companies.length)setSelectedCompany(companies[0])},[companies,selectedCompany]);
 useEffect(()=>setSelectedEmployee(null),[selectedCompany?.id]);

 const personalAvailable=!!(viewer?.employeeId||viewer?.name);
 useEffect(()=>{if(scope==="MINE"&&!personalAvailable)setScope("COMPANY")},[scope,personalAvailable]);

 const scopedTasks=useMemo(()=>{
  if(scope==="COMPANY")return tasks;
  const eid=viewer?.employeeId||"";
  const name=(viewer?.name||"").trim().toLocaleLowerCase("tr-TR");
  return tasks.filter(t=>{
   if(eid&&t.assigned_employee_remote_id===eid)return true;
   const assigned=(t.assigned_to||"").trim().toLocaleLowerCase("tr-TR");
   return !!name&&!!assigned&&(assigned===name||assigned.includes(name)||name.includes(assigned));
  });
 },[tasks,scope,viewer?.employeeId,viewer?.name]);

 const stats=useAgendaStats(scopedTasks);
 const filtered=useFilteredAgenda(scopedTasks,filter,typeFilter,search);
 const sourceStats=useMemo(()=>{const m=new Map<string,number>();scopedTasks.filter(t=>t.status===0).forEach(t=>{const k=sourceLabel(t);m.set(k,(m.get(k)||0)+1)});return[...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5)},[scopedTasks]);

 function clear(){setTitle("");setNote("");setType("TASK");setPriority("1");setDueAt("");setEndAt("");setLocation("");setMeetingLink("");setSelectedEmployee(null);setIsAllDay(false)}
 async function handleCreate(e:FormEvent){e.preventDefault();if(!selectedCompany)return setError("Firma seçilmelidir.");if(!selectedCompany.localId||selectedCompany.localId<=0)return setError("Seçilen firmanın mobil firma ID bilgisi eksik.");if(!title.trim())return setError("Görev başlığı zorunludur.");try{setSaving(true);setError("");await createAgenda({firm_id:selectedCompany.localId,web_firm_id:selectedCompany.id,title:title.trim(),note:note.trim()||null,type,priority:Number(priority),due_at:dueAt?new Date(dueAt).toISOString():null,end_at:endAt?new Date(endAt).toISOString():null,location:location.trim()||null,meeting_link:meetingLink.trim()||null,assigned_to:selectedEmployee?.full_name||null,assigned_employee_remote_id:selectedEmployee?.id||null,assigned_employee_local_id:selectedEmployee?.local_employee_id??null,is_all_day:isAllDay});clear();setShowCreate(false);setMessage("Ajanda kaydı oluşturuldu.");await refresh()}catch(v){setError(v instanceof Error?v.message:"Kayıt oluşturulamadı.")}finally{setSaving(false)}}
 async function toggle(t:AgendaTask){if(t.source_readonly||t.source!=="WEB"||!selectedCompany)return;try{await patchAgenda(t.id,selectedCompany.id,{status:t.status===1?0:1,progress:t.status===1?0:100});setMessage(t.status===1?"Görev tekrar açıldı.":"Görev tamamlandı.");await refresh()}catch(v){setError(v instanceof Error?v.message:"Görev güncellenemedi.")}}
 async function del(t:AgendaTask){if(!selectedCompany||!confirm(`“${t.title}” kaydı silinsin mi?`))return;try{await removeAgenda(t.id,selectedCompany.id);setMessage("Ajanda kaydı silindi.");await refresh()}catch(v){setError(v instanceof Error?v.message:"Kayıt silinemedi.")}}

 return <main style={{...page,padding:mobile?"14px 12px 44px":"28px 30px 60px"}}><div style={{maxWidth:1540,margin:"0 auto",width:"100%",minWidth:0}}>
  <section style={{...hero,flexDirection:mobile?"column":"row",alignItems:mobile?"stretch":"center",gap:mobile?18:30,padding:mobile?"24px 20px":"30px 34px"}}>
   <div style={{minWidth:0}}><div style={eyebrow}>D-SEC AKILLI OPERASYON AJANDASI</div><h1 style={{fontSize:mobile?34:38,margin:"14px 0 8px",letterSpacing:-1,lineHeight:1.05}}>Ajanda ve İş Asistanı</h1><p style={{margin:0,maxWidth:820,opacity:.88,lineHeight:1.65,fontSize:mobile?16:14}}>Günlük işleri, toplantıları ve kritik İSG yükümlülüklerini tek merkezden yönetin. Ajanda yalnızca aksiyon gerektiren tarihleri öne çıkarır.</p></div>
   <div style={{display:"grid",gridTemplateColumns:mobile?"1fr 1fr":"auto auto",gap:10,width:mobile?"100%":"auto"}}><button style={{...heroGhost,width:"100%"}} onClick={()=>void refresh()}>↻ Yenile</button><button style={{...heroButton,width:"100%"}} onClick={()=>{setError("");setMessage("");setShowCreate(true)}}>+ Yeni Kayıt</button></div>
  </section>

  {(error||loadError)&&<Notice text={error||loadError} danger/>}{message&&<Notice text={message}/>} 

  <section style={{...toolbar,display:"grid",gridTemplateColumns:mobile?"1fr":"minmax(280px,360px) auto auto 1fr",alignItems:"end",gap:mobile?10:16}}>
   <div style={{minWidth:0}}><CompanySelect companies={companies} loading={companiesLoading} value={selectedCompany?.id??""} onChange={setSelectedCompany}/></div>
   <div style={{...segmented,width:mobile?"100%":"auto"}}><button style={{...seg(scope==="COMPANY"),flex:1}} onClick={()=>setScope("COMPANY")}>Firma Ajandası</button><button disabled={!personalAvailable} title={!personalAvailable?"Kullanıcı hesabı bir çalışan profiliyle eşleşmiyor.":undefined} style={{...seg(scope==="MINE"),flex:1,opacity:personalAvailable?1:.45,cursor:personalAvailable?"pointer":"not-allowed"}} onClick={()=>personalAvailable&&setScope("MINE")}>Benim Ajandam</button></div>
   <div style={{...segmented,width:mobile?"100%":"auto"}}><button style={{...seg(view==="LIST"),flex:1}} onClick={()=>setView("LIST")}>☷ Operasyon</button><button style={{...seg(view==="CALENDAR"),flex:1}} onClick={()=>setView("CALENDAR")}>▦ Takvim</button></div>
   <div style={{marginLeft:mobile?0:"auto",fontSize:12,color:muted,overflowWrap:"anywhere"}}>Firma kilitli görünüm • {selectedCompany?.name||"Firma seçiliyor"}</div>
  </section>

  <section style={{...kpiGrid,gridTemplateColumns:mobile?"repeat(2,minmax(0,1fr))":"repeat(6,minmax(0,1fr))"}}><Kpi label="Bugün" value={stats.today} sub="Bugünkü aksiyon"/><Kpi label="Bu Hafta" value={stats.upcoming} sub="7 gün içinde"/><Kpi label="Geciken" value={stats.overdue} sub="Müdahale gerekli" danger={stats.overdue>0}/><Kpi label="Kritik" value={stats.critical} sub="Kritik öncelik" danger={stats.critical>0}/><Kpi label="Açık" value={stats.open} sub="Devam eden"/><Kpi label="Tamamlanan" value={stats.done} sub="Kapanan işler"/></section>

  <section style={{...assistant,flexDirection:mobile?"column":"row",alignItems:mobile?"stretch":"center"}}><div><div style={{fontSize:12,fontWeight:800,color:red,letterSpacing:.6}}>D-SEC İŞ ASİSTANI</div><h2 style={{margin:"7px 0 6px",fontSize:21}}>{scope==="MINE"?"Kişisel iş özeti":"Firma operasyon özeti"}</h2><div style={{color:muted,lineHeight:1.6}}>{assistantText(stats)}</div>{!personalAvailable&&scope==="COMPANY"&&<div style={{marginTop:8,fontSize:12,color:muted}}>Benim Ajandam için kullanıcı hesabının çalışan profiliyle eşleştirilmesi gerekir.</div>}</div><div style={{...sourceWrap,justifyContent:mobile?"flex-start":"flex-end"}}>{sourceStats.length?sourceStats.map(([s,n])=><span key={s} style={sourceChip}>{s}<b>{n}</b></span>):<span style={{color:muted,fontSize:13}}>Açık yükümlülük bulunmuyor.</span>}</div></section>

  <section style={{...filters,display:"grid",gridTemplateColumns:mobile?"1fr":"minmax(260px,1fr) 190px auto",alignItems:"center"}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Başlık, çalışan, lokasyon veya kaynak ara..." style={input}/><select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={input}><option value="ALL">Tüm kayıt türleri</option>{TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><div style={{...filterRow,overflowX:mobile?"auto":"visible",flexWrap:mobile?"nowrap":"wrap",paddingBottom:mobile?4:0}}>{FILTERS.map(([v,l])=><button key={v} style={{...pill(filter===v,v==="OVERDUE"||v==="CRITICAL"),flex:mobile?"0 0 auto":"initial"}} onClick={()=>setFilter(v)}>{l}</button>)}</div></section>

  {loading?<div style={empty}>Ajanda yükleniyor...</div>:view==="LIST"?<TaskList tasks={filtered} onToggle={toggle} onDelete={del} mobile={mobile}/>:<Calendar tasks={filtered} month={month} setMonth={setMonth} mobile={mobile}/>} 
 </div>

 {showCreate&&<div style={overlay}><form style={{...dialog,padding:mobile?18:24}} onSubmit={handleCreate}><div style={{display:"flex",justifyContent:"space-between",gap:20}}><div><div style={{fontSize:12,fontWeight:800,color:red}}>YENİ AJANDA KAYDI</div><h2 style={{margin:"5px 0 0"}}>Görev / toplantı / hatırlatma</h2></div><button type="button" style={close} onClick={()=>setShowCreate(false)}>×</button></div><div style={{...formGrid,gridTemplateColumns:mobile?"1fr":"1fr 1fr"}}><label style={label}>Firma<CompanySelect companies={companies} loading={companiesLoading} value={selectedCompany?.id??""} onChange={setSelectedCompany}/></label><label style={label}>İlgili çalışan<EmployeeSelect employees={employees} loading={employeesLoading} value={selectedEmployee?.id??""} onChange={setSelectedEmployee}/></label><label style={{...label,gridColumn:mobile?"auto":"1/-1"}}>Başlık<input required value={title} onChange={e=>setTitle(e.target.value)} style={input}/></label><label style={label}>Tür<select value={type} onChange={e=>setType(e.target.value as TaskType)} style={input}>{TYPES.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label><label style={label}>Öncelik<select value={priority} onChange={e=>setPriority(e.target.value)} style={input}><option value="0">Düşük</option><option value="1">Normal</option><option value="2">Kritik</option></select></label><label style={label}>Başlangıç / Son tarih<input type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)} style={input}/></label><label style={label}>Bitiş<input type="datetime-local" value={endAt} onChange={e=>setEndAt(e.target.value)} style={input}/></label><label style={label}>Lokasyon<input value={location} onChange={e=>setLocation(e.target.value)} style={input}/></label><label style={label}>Toplantı bağlantısı<input value={meetingLink} onChange={e=>setMeetingLink(e.target.value)} style={input}/></label><label style={{...label,gridColumn:mobile?"auto":"1/-1"}}>Açıklama<textarea value={note} onChange={e=>setNote(e.target.value)} style={{...input,minHeight:90,resize:"vertical"}}/></label><label style={{display:"flex",gap:9,alignItems:"center",fontSize:13}}><input type="checkbox" checked={isAllDay} onChange={e=>setIsAllDay(e.target.checked)}/> Tüm gün</label></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:20}}><button type="button" style={secondary} onClick={()=>setShowCreate(false)}>Vazgeç</button><button disabled={saving} style={save}>{saving?"Kaydediliyor...":"Kaydet"}</button></div></form></div>}
 </main>
}

function TaskList({tasks,onToggle,onDelete,mobile}:{tasks:AgendaTask[];onToggle:(t:AgendaTask)=>void;onDelete:(t:AgendaTask)=>void;mobile:boolean}){if(!tasks.length)return <div style={empty}>Bu filtrelere uygun ajanda kaydı bulunmuyor.</div>;return <section style={{display:"grid",gap:10}}>{tasks.map(t=><article key={t.id} style={{...card,flexDirection:mobile?"column":"row",alignItems:mobile?"stretch":"center",borderLeft:`4px solid ${isOverdue(t)?"#b42318":t.priority>=2?"#d92d20":t.status===1?"#12b76a":"#8f2336"}`}}><div style={{minWidth:0}}><div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:8}}><Tag>{typeLabel(t.type)}</Tag><Tag>{sourceLabel(t)}</Tag>{t.priority>=2&&<Tag danger>Kritik</Tag>}{isOverdue(t)&&<Tag danger>Gecikmiş</Tag>}{t.status===1&&<Tag>Kapalı</Tag>}</div><h3 style={{margin:"0 0 7px",fontSize:17,color:ink,overflowWrap:"anywhere"}}>{t.title}</h3>{t.note&&<p style={{margin:"0 0 9px",color:muted,fontSize:13,lineHeight:1.5,overflowWrap:"anywhere"}}>{t.note}</p>}<div style={meta}><span>◷ {formatDate(t.due_at)}</span>{t.assigned_to&&<span>◎ {t.assigned_to}</span>}{t.location&&<span>⌖ {t.location}</span>}</div></div><div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,width:mobile?"100%":"auto"}}>{t.source_readonly||t.source!=="WEB"?(t.source_url?<button style={{...secondary,width:mobile?"100%":"auto"}} onClick={()=>{window.location.href=t.source_url!}}>Kaynağa Git →</button>:<span style={{fontSize:11,color:muted}}>Sistem kaydı</span>):<><button style={{...secondary,flex:mobile?1:undefined}} onClick={()=>onToggle(t)}>{t.status===1?"Tekrar Aç":"Tamamla"}</button><button style={{...deleteBtn,flex:mobile?1:undefined}} onClick={()=>onDelete(t)}>Sil</button></>}</div></article>)}</section>}

function Calendar({tasks,month,setMonth,mobile}:{tasks:AgendaTask[];month:Date;setMonth:(d:Date)=>void;mobile:boolean}){const y=month.getFullYear(),m=month.getMonth(),first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),offset=(first.getDay()+6)%7,cells=Array.from({length:Math.ceil((offset+days)/7)*7},(_,i)=>i-offset+1);return <section style={{...calendarBox,overflowX:"auto"}}><div style={calendarHead}><button style={secondary} onClick={()=>setMonth(new Date(y,m-1,1))}>‹</button><h3 style={{margin:0,textTransform:"capitalize",fontSize:mobile?15:18}}>{month.toLocaleDateString("tr-TR",{month:"long",year:"numeric"})}</h3><button style={secondary} onClick={()=>setMonth(new Date(y,m+1,1))}>›</button></div><div style={{...calendarGrid,minWidth:mobile?700:0}}>{["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map(d=><div key={d} style={weekday}>{d}</div>)}{cells.map((d,i)=>{const valid=d>0&&d<=days;const dayTasks=valid?tasks.filter(t=>t.due_at&&new Date(t.due_at).getFullYear()===y&&new Date(t.due_at).getMonth()===m&&new Date(t.due_at).getDate()===d):[];return <div key={i} style={{...dayCell,opacity:valid?1:.25}}>{valid&&<><b style={{fontSize:12}}>{d}</b><div style={{display:"grid",gap:4,marginTop:7}}>{dayTasks.slice(0,3).map(t=><div key={t.id} title={t.title} style={{fontSize:11,padding:"5px 6px",borderRadius:7,background:isOverdue(t)?"#fee4e2":"#f4f5f7",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.title}</div>)}{dayTasks.length>3&&<span style={{fontSize:10,color:muted}}>+{dayTasks.length-3} kayıt</span>}</div></>}</div>})}</div></section>}

function Kpi({label,value,sub,danger=false}:{label:string;value:number;sub:string;danger?:boolean}){return <div style={kpi}><span style={{fontSize:12,color:muted,fontWeight:700}}>{label}</span><strong style={{fontSize:30,color:danger?"#b42318":ink}}>{value}</strong><small style={{color:muted}}>{sub}</small></div>}
function Tag({children,danger=false}:{children:React.ReactNode;danger?:boolean}){return <span style={{fontSize:10,fontWeight:800,padding:"4px 7px",borderRadius:999,background:danger?"#fee4e2":"#f2f4f7",color:danger?"#b42318":"#475467"}}>{children}</span>}
function Notice({text,danger=false}:{text:string;danger?:boolean}){return <div style={{marginTop:12,padding:"11px 14px",borderRadius:10,border:`1px solid ${danger?"#fecdca":"#abefc6"}`,background:danger?"#fef3f2":"#ecfdf3",color:danger?"#b42318":"#067647",fontSize:13}}>{text}</div>}
function assistantText(s:ReturnType<typeof useAgendaStats>){if(!s.open)return "Açık iş bulunmuyor. Ajandanız güncel görünüyor.";const p=[];if(s.today)p.push(`bugün ${s.today} aksiyon`);if(s.upcoming)p.push(`önümüzdeki 7 günde ${s.upcoming} yaklaşan iş`);if(s.overdue)p.push(`${s.overdue} gecikmiş yükümlülük`);if(s.critical)p.push(`${s.critical} kritik öncelikli kayıt`);return `${p.join(", ")} bulunuyor. ${s.overdue||s.critical?"Öncelikli kayıtları önce kapatmanız önerilir.":"Planlanan akış normal ilerliyor."}`}
function sourceLabel(t:AgendaTask){const r=(t.module_ref||t.category||"").toUpperCase();if(r.includes("PERIOD"))return "Periyodik Kontrol";if(r.includes("HEALTH")||r.includes("SAGLIK")||r.includes("EK2"))return "Sağlık";if(r.includes("RISK"))return "Risk/Aksiyon";if(r.includes("BOARD")||r.includes("KURUL"))return "İSG Kurulu";if(r.includes("MEASURE")||r.includes("ORTAM"))return "Ortam Ölçümü";if(r.includes("ACCIDENT")||r.includes("KAZA"))return "Kaza/Olay";if(r.includes("TRAIN"))return "Eğitim";if(r.includes("INSPECT")||r.includes("DENET"))return "Denetim";if(r.includes("CBS"))return "ÇBS";return t.source==="WEB"?"Manuel":"Sistem"}
function typeLabel(t:TaskType){return TYPES.find(x=>x[0]===t)?.[1]||t}
function formatDate(v:string|null){return v?new Date(v).toLocaleString("tr-TR",{dateStyle:"medium",timeStyle:"short"}):"Tarih yok"}

const page:React.CSSProperties={minHeight:"100vh",background:"#f7f8fa",color:ink,fontFamily:"Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",overflowX:"hidden"};
const hero:React.CSSProperties={display:"flex",justifyContent:"space-between",borderRadius:24,color:"white",background:"linear-gradient(115deg,#641626 0%,#8e1f31 48%,#b62b35 100%)",boxShadow:"0 16px 38px rgba(91,22,35,.16)"};
const eyebrow:React.CSSProperties={display:"inline-block",fontSize:11,fontWeight:900,letterSpacing:.7,padding:"7px 10px",borderRadius:999,background:"rgba(255,255,255,.13)",border:"1px solid rgba(255,255,255,.18)"};
const heroButton:React.CSSProperties={border:0,borderRadius:14,padding:"14px 18px",fontWeight:800,cursor:"pointer",background:"white",color:burgundy};
const heroGhost:React.CSSProperties={...heroButton,background:"rgba(255,255,255,.12)",color:"white",border:"1px solid rgba(255,255,255,.22)"};
const toolbar:React.CSSProperties={marginTop:16,padding:"14px 16px",background:"white",border:`1px solid ${line}`,borderRadius:16};
const segmented:React.CSSProperties={display:"flex",padding:3,borderRadius:10,background:"#f2f4f7",minWidth:0};
const seg=(a:boolean):React.CSSProperties=>({border:0,borderRadius:8,padding:"9px 12px",fontWeight:700,cursor:"pointer",background:a?"white":"transparent",color:a?burgundy:muted,boxShadow:a?"0 1px 3px rgba(0,0,0,.08)":"none",whiteSpace:"nowrap"});
const kpiGrid:React.CSSProperties={display:"grid",gap:10,marginTop:14};
const kpi:React.CSSProperties={background:"white",border:`1px solid ${line}`,borderRadius:15,padding:"16px",display:"grid",gap:5,minWidth:0};
const assistant:React.CSSProperties={display:"flex",justifyContent:"space-between",gap:25,marginTop:14,padding:"18px 20px",background:"linear-gradient(90deg,#fff 0%,#fff7f7 100%)",border:"1px solid #f0d8dc",borderRadius:16};
const sourceWrap:React.CSSProperties={display:"flex",gap:7,flexWrap:"wrap"};
const sourceChip:React.CSSProperties={display:"flex",gap:8,alignItems:"center",padding:"7px 9px",borderRadius:999,background:"white",border:`1px solid ${line}`,fontSize:11,color:muted};
const filters:React.CSSProperties={gap:10,margin:"14px 0",padding:"14px",background:"white",border:`1px solid ${line}`,borderRadius:16};
const filterRow:React.CSSProperties={display:"flex",gap:6,minWidth:0};
const pill=(a:boolean,d:boolean):React.CSSProperties=>({border:`1px solid ${a?(d?"#fda29b":"#d6b2ba"):line}`,background:a?(d?"#fef3f2":"#fff4f5"):"white",color:a?(d?"#b42318":burgundy):muted,borderRadius:999,padding:"9px 11px",fontSize:12,fontWeight:750,cursor:"pointer"});
const input:React.CSSProperties={width:"100%",minWidth:0,boxSizing:"border-box",border:"1px solid #d0d5dd",borderRadius:10,padding:"11px 12px",fontSize:13,background:"white",outline:"none"};
const card:React.CSSProperties={display:"flex",justifyContent:"space-between",gap:20,background:"white",border:`1px solid ${line}`,borderRadius:14,padding:"16px 18px",boxShadow:"0 2px 7px rgba(16,24,40,.03)",minWidth:0};
const meta:React.CSSProperties={display:"flex",gap:16,flexWrap:"wrap",fontSize:12,color:muted};
const secondary:React.CSSProperties={border:`1px solid #d0d5dd`,background:"white",borderRadius:9,padding:"9px 11px",fontWeight:700,color:"#344054",cursor:"pointer"};
const deleteBtn:React.CSSProperties={...secondary,color:"#b42318",borderColor:"#fecdca"};
const empty:React.CSSProperties={padding:45,textAlign:"center",background:"white",border:`1px dashed #d0d5dd`,borderRadius:16,color:muted};
const calendarBox:React.CSSProperties={background:"white",border:`1px solid ${line}`,borderRadius:16,padding:16};
const calendarHead:React.CSSProperties={display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0 14px"};
const calendarGrid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderTop:`1px solid ${line}`,borderLeft:`1px solid ${line}`};
const weekday:React.CSSProperties={padding:9,textAlign:"center",fontSize:11,fontWeight:800,color:muted,borderRight:`1px solid ${line}`,borderBottom:`1px solid ${line}`};
const dayCell:React.CSSProperties={minHeight:112,padding:9,borderRight:`1px solid ${line}`,borderBottom:`1px solid ${line}`,background:"#fff"};
const overlay:React.CSSProperties={position:"fixed",inset:0,zIndex:9999,display:"grid",placeItems:"center",padding:12,background:"rgba(16,24,40,.48)",backdropFilter:"blur(3px)"};
const dialog:React.CSSProperties={width:"min(820px,96vw)",maxHeight:"92vh",overflow:"auto",background:"white",borderRadius:20,boxShadow:"0 24px 70px rgba(0,0,0,.22)"};
const close:React.CSSProperties={border:0,background:"#f2f4f7",width:34,height:34,borderRadius:9,fontSize:22,cursor:"pointer"};
const formGrid:React.CSSProperties={display:"grid",gap:14,marginTop:20};
const label:React.CSSProperties={display:"grid",gap:7,fontSize:12,fontWeight:750,color:"#344054"};
const save:React.CSSProperties={...heroButton,background:red,color:"white",padding:"11px 18px"};
