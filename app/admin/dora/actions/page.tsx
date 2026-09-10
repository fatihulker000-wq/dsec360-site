"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

type CompanyRow={id:string;name:string};
type Scope={
  success?:boolean;
  can_view_all_companies?:boolean;
  allowed_company_id?:string|null;
  allowed_companies?:CompanyRow[];
  error?:string;
};
type Gap={
  id:string;domain:string;title:string;state:string;severity:string;
  summary:string;recommendation:string;sourceUrl?:string;confidence?:string;
};
type Candidate={id:string;full_name:string;department:string;phone:string;job_title:string};
type Queue={
  id:string;source_gap_id:string;source_domain:string;title:string;description:string;
  recommendation:string;severity:string;status:string;source_url?:string;
  execution_note?:string;execution_result?:any;target_records?:any[];
  executor?:{
    supported?:boolean;kind?:string;label?:string;teamType?:string;candidates?:Candidate[];
    requiredSelectionCount?:number;requiresQualificationConfirmation?:boolean;qualificationText?:string
  };
};

const C={burgundy:"#7f1d2d",ink:"#101828",muted:"#667085",line:"#e4e7ec",green:"#067647",amber:"#b54708",red:"#b42318",blue:"#175cd3",bg:"#f6f7f9"};

async function readJson<T=any>(r:Response):Promise<T>{
  const raw=await r.text();
  let j:any={};
  try{j=raw?JSON.parse(raw):{};}catch{throw new Error(`Sunucudan geçersiz yanıt geldi (${r.status}).`);}
  if(!r.ok)throw new Error(j?.error||`Sunucu hatası (${r.status}).`);
  return j as T;
}

export default function DoraActionsPage(){
  const [companyId,setCompanyId]=useState("");
  const [companies,setCompanies]=useState<CompanyRow[]>([]);
  const [gaps,setGaps]=useState<Gap[]>([]);
  const [queue,setQueue]=useState<Queue[]>([]);
  const [selected,setSelected]=useState<Record<string,string[]>>({});
  const [confirmed,setConfirmed]=useState<Record<string,boolean>>({});
  const [busy,setBusy]=useState(false);
  const [recordsOpen,setRecordsOpen]=useState<Queue|null>(null);
  const [booting,setBooting]=useState(true);
  const [msg,setMsg]=useState("");
  const [error,setError]=useState("");

  const boot=useCallback(async()=>{
    try{
      setBooting(true);setError("");
      const s=await readJson<Scope>(await fetch("/api/admin/reports/scope",{cache:"no-store",credentials:"include"}));
      let rows=s.allowed_companies||[];

      if(s.can_view_all_companies){
        const c:any=await readJson(await fetch("/api/admin/companies",{cache:"no-store",credentials:"include"}));
        rows=(c?.data??c??[]).filter((x:any)=>x?.id&&x?.name).map((x:any)=>({id:String(x.id),name:String(x.name)}));
      }

      setCompanies(rows);

      const qs=typeof window!=="undefined"?new URLSearchParams(window.location.search):null;
      const fromUrl=qs?.get("companyId")||"";
      const preferred=rows.some(x=>x.id===fromUrl)
        ? fromUrl
        : (s.allowed_company_id&&rows.some(x=>x.id===s.allowed_company_id)?s.allowed_company_id:"") || rows[0]?.id || "";

      setCompanyId(preferred);
      if(!preferred) setError("DORA Faz 2 için erişilebilir firma bulunamadı.");
    }catch(e:any){
      setError(e?.message||"Firma kapsamı alınamadı.");
    }finally{setBooting(false);}
  },[]);

  const load=useCallback(async(id:string)=>{
    if(!id)return;
    setBusy(true);setError("");
    try{
      const [a,q]=await Promise.all([
        readJson<any>(await fetch(`/api/admin/dora-v2/analysis?companyId=${encodeURIComponent(id)}`,{cache:"no-store",credentials:"include"})),
        readJson<any>(await fetch(`/api/admin/dora-v2/actions?companyId=${encodeURIComponent(id)}`,{cache:"no-store",credentials:"include"})),
      ]);

      // analysis API success contract is success:true (not ok:true)
      if(a?.success===false)throw new Error(a?.error||"DORA analizi okunamadı.");
      setGaps((a?.silentGaps?.items||[]).filter((x:Gap)=>["MISSING","SHORTAGE","WARNING","VERIFY"].includes(x.state)));

      if(q?.ok===false)throw new Error(q?.error||"DORA işlem kuyruğu okunamadı.");
      setQueue(Array.isArray(q?.items)?q.items:[]);
    }catch(e:any){
      setError(e?.message||"İşlem merkezi verileri yüklenemedi.");
    }finally{setBusy(false);}
  },[]);

  useEffect(()=>{void boot();},[boot]);
  useEffect(()=>{if(companyId)void load(companyId);},[companyId,load]);

  const queuedIds=useMemo(()=>new Set(queue.map(x=>x.source_gap_id)),[queue]);
  const newGaps=useMemo(()=>gaps.filter(g=>!queuedIds.has(g.id)),[gaps,queuedIds]);

  const stats=useMemo(()=>({
    waiting:queue.filter(x=>x.status==="WAITING_APPROVAL").length,
    approved:queue.filter(x=>x.status==="APPROVED").length,
    completed:queue.filter(x=>x.status==="COMPLETED").length,
    failed:queue.filter(x=>x.status==="FAILED").length,
  }),[queue]);

  function toggle(qid:string,eid:string){
    setSelected(prev=>{
      const current=prev[qid]||[];
      return {...prev,[qid]:current.includes(eid)?current.filter(x=>x!==eid):[...current,eid]};
    });
  }

  async function cmd(command:string,payload:any={}){
    if(!companyId)return;
    setBusy(true);setMsg("");setError("");
    try{
      const j=await readJson<any>(await fetch("/api/admin/dora-v2/actions",{
        method:"POST",credentials:"include",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({companyId,command,...payload})
      }));
      if(j?.ok===false)throw new Error(j?.error||"İşlem başarısız.");

      setMsg(
        command==="PREPARE"?"Eksiklikler DORA işlem kuyruğuna alındı.":
        command==="APPROVE"?"İşlem planı onaylandı. Şimdi BAŞLA komutu verilebilir.":
        command==="START"?(j?.moduleWritePerformed?"DORA işlemi tamamladı ve hedef modüle kaydı yazdı.":"Başla komutu alındı; bu bulgu için gerçek yürütücü henüz bağlı değil."):
        "İşlem atlandı."
      );
      await load(companyId);
    }catch(e:any){setError(e?.message||"İşlem başarısız.");}
    finally{setBusy(false);}
  }

  return <main className="dora-actions-page" style={{minHeight:"100vh",background:C.bg,color:C.ink,fontFamily:"Inter,Arial,sans-serif"}}>
    <style jsx global>{`
      .dora-actions-page{padding:18px 14px 56px}
      .dora-actions-shell{max-width:1380px;margin:0 auto}
      .dora-actions-toolbar{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;align-items:center}
      .dora-actions-toolbar select{min-width:280px;flex:0 1 360px}
      .dora-actions-grid{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:14px;margin-top:14px}
      .dora-actions-kpis{display:grid;grid-template-columns:repeat(4,minmax(100px,1fr));gap:8px;margin-top:12px}
      .dora-candidate-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;max-height:260px;overflow:auto}
      @media(max-width:900px){
        .dora-actions-grid{grid-template-columns:1fr}
        .dora-actions-kpis{grid-template-columns:repeat(2,1fr)}
      }
      @media(max-width:640px){
        .dora-actions-page{padding:8px 8px 38px}
        .dora-actions-hero{padding:18px 16px!important;border-radius:18px!important}
        .dora-actions-hero h1{font-size:24px!important}
        .dora-actions-toolbar{display:grid;grid-template-columns:1fr}
        .dora-actions-toolbar select,.dora-actions-toolbar button{width:100%!important;min-width:0!important}
        .dora-actions-grid{grid-template-columns:minmax(0,1fr)}
        .dora-actions-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}
        .dora-candidate-grid{grid-template-columns:1fr}
        .dora-action-card{padding:12px!important;border-radius:14px!important;overflow:hidden}
        .dora-action-card b,.dora-action-card div{overflow-wrap:anywhere}
      }
    `}</style>

    <div className="dora-actions-shell">
      <section className="dora-actions-hero" style={{borderRadius:24,padding:24,color:"#fff",background:"linear-gradient(135deg,#51101d,#7f1d2d 55%,#1b2333)",boxShadow:"0 18px 48px rgba(16,24,40,.16)"}}>
        <div style={{fontSize:10,fontWeight:900,letterSpacing:1.4,opacity:.7}}>DORA FAZ 2 • USER-IN-THE-LOOP EXECUTION</div>
        <h1 style={{margin:"7px 0 5px",fontSize:30,lineHeight:1.08}}>DORA Kullanıcı Onaylı İşlem Merkezi</h1>
        <div style={{fontSize:12,opacity:.8,maxWidth:900,lineHeight:1.65}}>DORA eksikliği bulur → işlemi hazırlar → kullanıcı seçer ve onaylar → <b>BAŞLA</b> komutundan sonra desteklenen işlemi hedef modülde gerçekleştirir.</div>
      </section>

      <div className="dora-actions-toolbar">
        <select value={companyId} onChange={e=>setCompanyId(e.target.value)} style={input} disabled={busy||booting}>
          {!companies.length&&<option value="">Firma yükleniyor…</option>}
          {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button disabled={busy||!companyId||!newGaps.length} onClick={()=>cmd("PREPARE",{gaps:newGaps})} style={primary}>{busy?"DORA ÇALIŞIYOR…":`EKSİKLERİ İŞLEME HAZIRLA (${newGaps.length})`}</button>
        <button onClick={()=>void load(companyId)} disabled={busy||!companyId} style={secondary}>YENİDEN TARA</button>
        <button onClick={()=>location.href="/admin/dora"} style={secondary}>← DORA'YA DÖN</button>
      </div>

      <div className="dora-actions-kpis">
        <Kpi n={stats.waiting} label="Onay bekliyor" color={C.amber}/>
        <Kpi n={stats.approved} label="Başla bekliyor" color={C.blue}/>
        <Kpi n={stats.completed} label="Tamamlandı" color={C.green}/>
        <Kpi n={stats.failed} label="Hata" color={C.red}/>
      </div>

      {msg&&<div style={{marginTop:12,padding:12,borderRadius:12,background:"#ecfdf3",border:"1px solid #abefc6",fontSize:12,fontWeight:750,color:C.green}}>{msg}</div>}
      {error&&<div style={{marginTop:12,padding:12,borderRadius:12,background:"#fef3f2",border:"1px solid #fecdca",fontSize:12,fontWeight:750,color:C.red}}>{error}</div>}

      <div className="dora-actions-grid">
        <section style={card}>
          <h2 style={h2}>1. DORA'nın Bulduğu Eksikler</h2>
          <p style={sub}>Henüz işlem kuyruğuna alınmamış tespitler.</p>
          <div style={{display:"grid",gap:9,marginTop:12}}>
            {booting||busy&&!companyId?<Empty text="DORA hazırlanıyor…"/>:
             newGaps.length===0?<Empty text="Yeni eksiklik yok veya tümü işlem kuyruğunda."/>:
             newGaps.map(g=><div className="dora-action-card" key={g.id} style={item}>
              <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"start",flexWrap:"wrap"}}><b>{g.title}</b><Tag t={g.severity}/></div>
              <div style={small}>{g.domain} • {g.state} • Güven: {g.confidence||"-"}</div>
              <div style={body}>{g.summary}</div>
              <div style={{...body,color:C.burgundy}}><b>DORA önerisi:</b> {g.recommendation}</div>
            </div>)}
          </div>
        </section>

        <section style={card}>
          <h2 style={h2}>2. Onay & Başlatma Kuyruğu</h2>
          <p style={sub}>Gerçek işlem, kullanıcı açıkça ONAYLA ve ardından BAŞLA demeden yapılmaz.</p>

          <div style={{display:"grid",gap:10,marginTop:12}}>
            {queue.length===0?<Empty text="Henüz DORA işlem kuyruğu oluşturulmadı."/>:queue.map(q=>{
              const candidates=q.executor?.candidates||[];
              const ids=selected[q.id]||[];
              const executable=Boolean(q.executor?.supported);
              const needed=Math.max(0,Number(q.executor?.requiredSelectionCount||0));
              const requiresConfirmation=Boolean(q.executor?.requiresQualificationConfirmation);
              const exactSelection=!executable || needed===0 || ids.length===needed;
              const confirmationOk=!requiresConfirmation || confirmed[q.id]===true;
              return <div className="dora-action-card" key={q.id} style={{...item,border:q.status==="APPROVED"?`1px solid #84caff`:`1px solid ${C.line}`}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"start",flexWrap:"wrap"}}><b>{q.title}</b><Status s={q.status}/></div>
                <div style={small}>{q.source_domain} • {q.severity}{q.executor?.teamType?` • ${q.executor.teamType}`:""}</div>
                <div style={body}>{q.description}</div>
                <div style={{...body,color:C.burgundy}}><b>Planlanan yaklaşım:</b> {q.recommendation}</div>

                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:9}}>
                  <span style={{padding:"5px 8px",borderRadius:999,fontSize:9,fontWeight:900,background:executable?"#ecfdf3":"#f2f4f7",color:executable?C.green:C.muted}}>
                    {executable?"DORA BU İŞLEMİ YAPABİLİR":"SADECE ÖNERİ / YÜRÜTÜCÜ BEKLİYOR"}
                  </span>
                  {executable&&needed>0&&<span style={{padding:"5px 8px",borderRadius:999,fontSize:9,fontWeight:900,background:"#eff8ff",color:C.blue}}>SEÇİLMESİ GEREKEN: {needed}</span>}
                </div>

                {q.status==="WAITING_APPROVAL"&&executable&&<div style={{marginTop:11,padding:11,borderRadius:11,background:"#f8fafc",border:`1px solid ${C.line}`}}>
                  <div style={{fontSize:10,fontWeight:950,marginBottom:8}}>{q.executor?.label||"DORA ÇALIŞAN SEÇİMİ"}</div>
                  {candidates.length===0?<div style={small}>Atanabilir aktif çalışan bulunamadı.</div>:
                  <div className="dora-candidate-grid">
                    {candidates.map(c=><label key={c.id} style={{display:"flex",alignItems:"center",gap:9,padding:9,borderRadius:9,background:"#fff",border:`1px solid ${C.line}`,cursor:"pointer",minWidth:0}}>
                      <input type="checkbox" checked={ids.includes(String(c.id))} onChange={()=>toggle(q.id,String(c.id))}/>
                      <span style={{fontSize:11,minWidth:0,overflowWrap:"anywhere"}}><b>{c.full_name}</b><br/><span style={{color:C.muted,fontSize:9}}>{c.department} • {c.job_title}</span></span>
                    </label>)}
                  </div>}
                  {requiresConfirmation&&<label style={{display:"flex",gap:8,alignItems:"flex-start",marginTop:10,padding:9,borderRadius:9,background:"#fffaeb",border:"1px solid #fedf89",fontSize:10,lineHeight:1.5,cursor:"pointer"}}>
                    <input type="checkbox" checked={confirmed[q.id]===true} onChange={e=>setConfirmed(p=>({...p,[q.id]:e.target.checked}))}/>
                    <span><b>Kullanıcı doğrulaması:</b> {q.executor?.qualificationText||"Bu işlem için gerekli uygunluk kullanıcı tarafından doğrulanmalıdır."}</span>
                  </label>}
                </div>}

                {q.execution_note&&<div style={{...small,marginTop:8,padding:8,background:q.status==="COMPLETED"?"#ecfdf3":"#f8fafc",borderRadius:8,color:q.status==="COMPLETED"?C.green:C.muted}}>{q.execution_note}</div>}
                {q.status==="COMPLETED"&&Array.isArray(q.execution_result?.employeeNames)&&q.execution_result.employeeNames.length>0&&
                  <div style={{marginTop:8,fontSize:10,color:C.ink}}><b>İşlem yapılan çalışanlar:</b> {q.execution_result.employeeNames.join(", ")}</div>}
                <div style={{display:"flex",gap:7,marginTop:10,flexWrap:"wrap"}}>
                  {q.status==="WAITING_APPROVAL"&&<>
                    <button disabled={busy||!executable||!exactSelection||!confirmationOk} onClick={()=>cmd("APPROVE",{id:q.id,selectedEmployeeIds:ids,qualificationConfirmed:confirmed[q.id]===true})} style={approve}>✓ ONAYLA {ids.length?`(${ids.length}/${needed||ids.length})`:""}</button>
                    <button disabled={busy} onClick={()=>cmd("SKIP",{id:q.id})} style={secondary}>ATLA</button>
                  </>}
                  {q.status==="APPROVED"&&<button disabled={busy} onClick={()=>cmd("START",{id:q.id})} style={start}>▶ BAŞLA — DORA İŞLEMİ YAPSIN</button>}
                  {q.status==="COMPLETED"&&<button onClick={()=>setRecordsOpen(q)} style={secondary}>KAYITLARI AÇ →</button>}
                  {q.source_url&&<button onClick={()=>location.href=q.source_url!} style={secondary}>MODÜLÜ AÇ →</button>}
                </div>
              </div>
            })}
          </div>
        </section>
      </div>

      <div style={{marginTop:14,padding:14,borderRadius:14,background:"#ecfdf3",border:"1px solid #abefc6",fontSize:11,lineHeight:1.65,color:"#05603a"}}>
        <b>Faz 2 güvenlik kilidi:</b> DORA yalnızca desteklenen yürütücülerde, seçili firma kapsamında ve kullanıcı ONAYLA + BAŞLA verdiğinde hedef modüle yazabilir. Desteklenmeyen bulgular hedef modülü değiştirmez.
      </div>

      {recordsOpen&&<div onClick={()=>setRecordsOpen(null)} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(16,24,40,.62)",display:"grid",placeItems:"center",padding:16}}>
        <div onClick={e=>e.stopPropagation()} style={{width:"min(900px,96vw)",maxHeight:"88vh",overflow:"auto",background:"#fff",borderRadius:18,padding:18,boxShadow:"0 24px 70px rgba(0,0,0,.28)"}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start"}}>
            <div>
              <div style={{fontSize:10,fontWeight:900,color:C.green}}>DORA GERÇEK KAYIT DOĞRULAMA</div>
              <h2 style={{margin:"5px 0 0",fontSize:20}}>{recordsOpen.title}</h2>
              <div style={{fontSize:11,color:C.muted,marginTop:5}}>{recordsOpen.execution_note||"İşlem tamamlandı."}</div>
            </div>
            <button onClick={()=>setRecordsOpen(null)} style={secondary}>KAPAT ✕</button>
          </div>

          <div style={{marginTop:14,padding:12,borderRadius:12,background:"#ecfdf3",border:"1px solid #abefc6",fontSize:11,color:C.green}}>
            <b>Hedef tabloya yazılan kayıtlar</b> • {recordsOpen.target_records?.length||0} kayıt doğrulandı.
          </div>

          <div style={{display:"grid",gap:9,marginTop:12}}>
            {(recordsOpen.target_records||[]).map((rec:any,index:number)=><div key={rec.id||index} style={{padding:12,border:`1px solid ${C.line}`,borderRadius:12,background:"#fff"}}>
              <div style={{fontSize:13,fontWeight:900}}>{rec.full_name||rec.employee_name||`Kayıt ${index+1}`}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8,marginTop:9}}>
                {Object.entries(rec).filter(([k,v])=>!["id","employee_id","created_at"].includes(k)&&v!==null&&v!==""&&typeof v!=="object").map(([k,v])=>
                  <div key={k} style={{padding:8,borderRadius:8,background:"#f8fafc"}}>
                    <div style={{fontSize:8,fontWeight:900,color:C.muted,textTransform:"uppercase"}}>{k.replaceAll("_"," ")}</div>
                    <div style={{fontSize:10,fontWeight:700,marginTop:3,overflowWrap:"anywhere"}}>{String(v)}</div>
                  </div>
                )}
              </div>
            </div>)}
            {(recordsOpen.target_records||[]).length===0&&<Empty text="Kayıt hedef tablodan doğrulanamadı. İşlem günlüğünü kontrol edin."/>}
          </div>

          {recordsOpen.source_url&&<div style={{marginTop:14}}>
            <button onClick={()=>location.href=recordsOpen.source_url!} style={primary}>İLGİLİ MODÜLÜ AÇ →</button>
          </div>}
        </div>
      </div>}
    </div>
  </main>;
}

function Kpi({n,label,color}:{n:number;label:string;color:string}){return <div style={{background:"#fff",border:`1px solid ${C.line}`,borderRadius:13,padding:12}}><b style={{fontSize:24,color}}>{n}</b><div style={{fontSize:8,fontWeight:950,color:C.muted,marginTop:3}}>{label.toUpperCase()}</div></div>}
function Tag({t}:{t:string}){const c=t==="CRITICAL"?C.red:t==="HIGH"?C.amber:C.blue;return <span style={{fontSize:9,fontWeight:900,color:c,whiteSpace:"nowrap"}}>{t}</span>}
function Status({s}:{s:string}){const map:any={WAITING_APPROVAL:["ONAY BEKLİYOR",C.amber],APPROVED:["ONAYLANDI",C.blue],STARTED:["BAŞLATILDI",C.blue],COMPLETED:["TAMAMLANDI",C.green],FAILED:["HATA",C.red],SKIPPED:["ATLANDI",C.muted]};const [t,c]=map[s]||[s,C.muted];return <span style={{fontSize:9,fontWeight:900,color:c,whiteSpace:"nowrap"}}>{t}</span>}
function Empty({text}:{text:string}){return <div style={{padding:20,textAlign:"center",fontSize:12,color:C.muted,border:`1px dashed ${C.line}`,borderRadius:12}}>{text}</div>}
const card:React.CSSProperties={background:"#fff",border:`1px solid ${C.line}`,borderRadius:18,padding:18,boxShadow:"0 5px 18px rgba(16,24,40,.04)",minWidth:0};
const item:React.CSSProperties={padding:13,border:"1px solid #e4e7ec",borderRadius:13,background:"#fff",minWidth:0};
const h2:React.CSSProperties={fontSize:16,margin:0};
const sub:React.CSSProperties={fontSize:11,color:C.muted,margin:"5px 0 0"};
const small:React.CSSProperties={fontSize:9,color:C.muted,marginTop:5};
const body:React.CSSProperties={fontSize:11,lineHeight:1.55,marginTop:7,overflowWrap:"anywhere"};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"10px 12px",border:`1px solid ${C.line}`,borderRadius:10,background:"#fff",fontSize:12};
const primary:React.CSSProperties={padding:"10px 14px",border:0,borderRadius:10,background:C.burgundy,color:"#fff",fontWeight:900,cursor:"pointer"};
const secondary:React.CSSProperties={padding:"9px 12px",border:`1px solid ${C.line}`,borderRadius:9,background:"#fff",color:C.ink,fontWeight:800,cursor:"pointer"};
const approve:React.CSSProperties={...secondary,background:"#eff8ff",border:"1px solid #b2ddff",color:C.blue};
const start:React.CSSProperties={...primary,background:C.green};
