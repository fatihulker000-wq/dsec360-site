"use client";
import React, {useEffect,useMemo,useState} from "react";

type Gap={id:string;domain:string;title:string;state:string;severity:string;summary:string;recommendation:string;sourceUrl?:string;confidence?:string};
type Queue={id:string;source_gap_id:string;source_domain:string;title:string;description:string;recommendation:string;severity:string;status:string;source_url?:string;execution_note?:string};

const C={burgundy:"#7f1d2d",ink:"#101828",muted:"#667085",line:"#e4e7ec",green:"#067647",amber:"#b54708",red:"#b42318",blue:"#175cd3",bg:"#f6f7f9"};

export default function DoraActionsPage(){
  const [companyId,setCompanyId]=useState("");
  const [companies,setCompanies]=useState<any[]>([]);
  const [gaps,setGaps]=useState<Gap[]>([]);
  const [queue,setQueue]=useState<Queue[]>([]);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState("");

  useEffect(()=>{(async()=>{
    const r=await fetch("/api/admin/reports/scope",{cache:"no-store"});
    const j=await r.json();
    const list=j?.allowed_companies||[];
    setCompanies(list);
    const id=j?.allowed_company_id||list?.[0]?.id||"";
    if(id)setCompanyId(String(id));
  })()},[]);

  async function load(){
    if(!companyId)return;
    setBusy(true); setMsg("");
    try{
      const [ar,qr]=await Promise.all([
        fetch(`/api/admin/dora-v2/analysis?companyId=${encodeURIComponent(companyId)}`,{cache:"no-store"}),
        fetch(`/api/admin/dora-v2/actions?companyId=${encodeURIComponent(companyId)}`,{cache:"no-store"}),
      ]);
      const a=await ar.json(); const q=await qr.json();
      if(!a.ok)throw new Error(a.error||"DORA analizi okunamadı.");
      setGaps((a.silentGaps?.items||[]).filter((x:Gap)=>["MISSING","SHORTAGE","WARNING","VERIFY"].includes(x.state)));
      if(q.ok)setQueue(q.items||[]);
      else setMsg(q.error||"İşlem kuyruğu henüz hazır değil.");
    }catch(e:any){setMsg(e.message||"Yüklenemedi.");}
    finally{setBusy(false);}
  }
  useEffect(()=>{load()},[companyId]);

  const queuedIds=useMemo(()=>new Set(queue.map(x=>x.source_gap_id)),[queue]);
  const newGaps=gaps.filter(g=>!queuedIds.has(g.id));

  async function cmd(command:string,payload:any={}){
    setBusy(true);setMsg("");
    try{
      const r=await fetch("/api/admin/dora-v2/actions",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({companyId,command,...payload})});
      const j=await r.json(); if(!j.ok)throw new Error(j.error||"İşlem başarısız.");
      setMsg(command==="PREPARE"?"Eksiklikler DORA onay kuyruğuna alındı.":command==="APPROVE"?"İşlem onaylandı. Şimdi Başla komutu verilebilir.":command==="START"?"DORA Başla komutunu aldı. Bu ilk sürümde hedef modüle henüz yazma yapılmadı.":"İşlem atlandı.");
      await load();
    }catch(e:any){setMsg(e.message||"İşlem başarısız.");}
    finally{setBusy(false);}
  }

  return <main style={{minHeight:"100vh",background:C.bg,padding:20,color:C.ink,fontFamily:"Inter,Arial,sans-serif"}}>
    <div style={{maxWidth:1320,margin:"0 auto"}}>
      <section style={{borderRadius:24,padding:24,color:"#fff",background:"linear-gradient(135deg,#51101d,#7f1d2d 55%,#1b2333)",boxShadow:"0 18px 48px rgba(16,24,40,.16)"}}>
        <div style={{fontSize:10,fontWeight:900,letterSpacing:1.4,opacity:.7}}>DORA FAZ 2 • USER-IN-THE-LOOP EXECUTION</div>
        <h1 style={{margin:"7px 0 5px",fontSize:28}}>DORA Kullanıcı Onaylı İşlem Merkezi</h1>
        <div style={{fontSize:12,opacity:.76,maxWidth:820,lineHeight:1.65}}>DORA eksikleri listeler → kullanıcı işleme hazırlar → açıkça onaylar → <b>Başla</b> komutunu verir. Kullanıcı onayı olmadan hiçbir işlem başlatılamaz.</div>
      </section>

      <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
        <select value={companyId} onChange={e=>setCompanyId(e.target.value)} style={input}>
          {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button disabled={busy||!newGaps.length} onClick={()=>cmd("PREPARE",{gaps:newGaps})} style={primary}>{busy?"DORA TARANIYOR…":`EKSİKLERİ İŞLEME HAZIRLA (${newGaps.length})`}</button>
        <button onClick={load} disabled={busy} style={secondary}>YENİDEN TARA</button>
      </div>

      {msg&&<div style={{marginTop:12,padding:12,borderRadius:12,background:"#fff",border:`1px solid ${C.line}`,fontSize:12,fontWeight:700}}>{msg}</div>}

      <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gap:14,marginTop:14}}>
        <section style={card}>
          <h2 style={h2}>1. DORA'nın Bulduğu Eksikler</h2>
          <p style={sub}>Henüz işlem kuyruğuna alınmamış tespitler.</p>
          <div style={{display:"grid",gap:9,marginTop:12}}>
            {newGaps.length===0?<Empty text="Yeni eksiklik yok veya tümü işlem kuyruğunda."/>:newGaps.map(g=><div key={g.id} style={item}>
              <div style={{display:"flex",justifyContent:"space-between",gap:8}}><b>{g.title}</b><Tag t={g.severity}/></div>
              <div style={small}>{g.domain} • {g.state} • Güven: {g.confidence||"-"}</div>
              <div style={body}>{g.summary}</div>
              <div style={{...body,color:C.burgundy}}><b>DORA önerisi:</b> {g.recommendation}</div>
            </div>)}
          </div>
        </section>

        <section style={card}>
          <h2 style={h2}>2. Onay & Başlatma Kuyruğu</h2>
          <p style={sub}>DORA ancak kullanıcının açık onayından sonra Başla komutunu kabul eder.</p>
          <div style={{display:"grid",gap:9,marginTop:12}}>
            {queue.length===0?<Empty text="Henüz DORA işlem kuyruğu oluşturulmadı."/>:queue.map(q=><div key={q.id} style={item}>
              <div style={{display:"flex",justifyContent:"space-between",gap:8}}><b>{q.title}</b><Status s={q.status}/></div>
              <div style={small}>{q.source_domain} • {q.severity}</div>
              <div style={body}>{q.description}</div>
              <div style={{...body,color:C.burgundy}}><b>Planlanan yaklaşım:</b> {q.recommendation}</div>
              {q.execution_note&&<div style={{...small,marginTop:7}}>{q.execution_note}</div>}
              <div style={{display:"flex",gap:7,marginTop:10,flexWrap:"wrap"}}>
                {q.status==="WAITING_APPROVAL"&&<>
                  <button disabled={busy} onClick={()=>cmd("APPROVE",{id:q.id})} style={approve}>ONAYLA</button>
                  <button disabled={busy} onClick={()=>cmd("SKIP",{id:q.id})} style={secondary}>ATLA</button>
                </>}
                {q.status==="APPROVED"&&<button disabled={busy} onClick={()=>cmd("START",{id:q.id})} style={start}>▶ BAŞLA</button>}
                {q.source_url&&<button onClick={()=>location.href=q.source_url!} style={secondary}>KAYNAĞA GİT</button>}
              </div>
            </div>)}
          </div>
        </section>
      </div>

      <div style={{marginTop:14,padding:14,borderRadius:14,background:"#fffaeb",border:"1px solid #fedf89",fontSize:11,lineHeight:1.6,color:"#7a2e0e"}}>
        <b>Faz 2 güvenlik kilidi:</b> Bu ilk paket kullanıcı onay akışını kurar. “Başla” komutu şu an yalnızca DORA işlem kaydını STARTED yapar; Risk, Eğitim, Sağlık, DÖF veya diğer hedef modüllerde henüz değişiklik yapmaz. Modül yürütücüleri bundan sonra tek tek ve kontrollü bağlanacaktır.
      </div>
    </div>
  </main>
}
function Tag({t}:{t:string}){const c=t==="CRITICAL"?C.red:t==="HIGH"?C.amber:C.blue;return <span style={{fontSize:9,fontWeight:900,color:c}}>{t}</span>}
function Status({s}:{s:string}){const map:any={WAITING_APPROVAL:["ONAY BEKLİYOR",C.amber],APPROVED:["ONAYLANDI",C.blue],STARTED:["BAŞLATILDI",C.green],SKIPPED:["ATLANDI",C.muted]};const [t,c]=map[s]||[s,C.muted];return <span style={{fontSize:9,fontWeight:900,color:c}}>{t}</span>}
function Empty({text}:{text:string}){return <div style={{padding:20,textAlign:"center",fontSize:12,color:C.muted,border:`1px dashed ${C.line}`,borderRadius:12}}>{text}</div>}
const card:React.CSSProperties={background:"#fff",border:"1px solid #e4e7ec",borderRadius:18,padding:18,boxShadow:"0 5px 18px rgba(16,24,40,.04)"};
const item:React.CSSProperties={padding:13,border:"1px solid #e4e7ec",borderRadius:13,background:"#fff"};
const h2:React.CSSProperties={fontSize:16,margin:0};
const sub:React.CSSProperties={fontSize:11,color:C.muted,margin:"5px 0 0"};
const small:React.CSSProperties={fontSize:9,color:C.muted,marginTop:5};
const body:React.CSSProperties={fontSize:11,lineHeight:1.55,marginTop:7};
const input:React.CSSProperties={padding:"10px 12px",border:`1px solid ${C.line}`,borderRadius:10,background:"#fff",minWidth:260};
const primary:React.CSSProperties={padding:"10px 14px",border:0,borderRadius:10,background:C.burgundy,color:"#fff",fontWeight:900,cursor:"pointer"};
const secondary:React.CSSProperties={padding:"9px 12px",border:`1px solid ${C.line}`,borderRadius:9,background:"#fff",color:C.ink,fontWeight:800,cursor:"pointer"};
const approve:React.CSSProperties={...secondary,background:"#eff8ff",border:"1px solid #b2ddff",color:C.blue};
const start:React.CSSProperties={...primary,background:C.green};
