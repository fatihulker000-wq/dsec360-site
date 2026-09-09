"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
type ModuleStatus = "CRITICAL" | "WARNING" | "GOOD" | "UNAVAILABLE";
type CompanyRow = { id: string; name: string };
type Finding = { id:string; module:string; moduleLabel:string; severity:Severity; title:string; description:string; recommendation:string; sourceUrl:string; evidence:string[] };
type Topic = { id:string; score:number; severity:Severity; title:string; interpretation:string; recommendation:string; evidence:string[]; modules:string[] };
type Cross = { id:string; title:string; status:"SIGNAL"|"LIMITED"|"POSITIVE"; confidence:"HIGH"|"MEDIUM"|"LOW"; interpretation:string; evidence:string[]; recommendation:string; modules:string[] };
type XrayCat = { key:string; label:string; status:ModuleStatus; headline:string; detail:string; sourceUrl:string; critical:number; high:number; medium:number; low:number };
type HorizonItem = { id:string; module:string; label:string; days:number; date?:string; sourceUrl:string };
type Analysis = {
  generatedAt?:string;
  company?:{id:string;name:string;employeeCount:number;dangerClass?:string;naceCode?:string;sector?:string};
  summary?:{scannedModules:number;unavailableModules:number;totalFindings:number;critical:number;high:number;medium:number;low:number;info:number};
  findings?:Finding[];
  executiveCommentary?:string[];
  managementTopics?:Topic[];
  crossAnalyses?:Cross[];
  dataQuality?:{overallScore:number;items:Array<{key:string;label:string;score:number;status:"GOOD"|"WARNING"|"POOR";interpretation:string;evidence:string[]}>};
  xray?:{score:number;status:string;criticalIssues:number;highSignals:number;upcoming30:number;systemicSignals:number;categories:XrayCat[]};
  horizon?:{due7:number;due15:number;due30:number;due60:number;due90:number;items:HorizonItem[]};
};
type Scope = { can_view_all_companies?:boolean; allowed_company_id?:string|null; allowed_companies?:CompanyRow[] };

const C = {
  bg:"#f4f5f7", ink:"#17212b", muted:"#667085", line:"#e4e7ec",
  burgundy:"#7f1d2d", dark:"#3d0914", red:"#b42318", orange:"#b54708",
  green:"#067647", blue:"#175cd3", cyan:"#0e7490", white:"#fff", soft:"#faf7f8"
};

async function readJson<T>(r:Response){
  const t=await r.text(); let j:any={};
  try{ j=t?JSON.parse(t):{} }catch{ throw new Error(`Geçersiz sunucu yanıtı (${r.status}).`) }
  if(!r.ok) throw new Error(j?.error||`Sunucu hatası (${r.status}).`);
  return j as T;
}
function sev(v:Severity){ return v==="CRITICAL"?"Kritik":v==="HIGH"?"Yüksek":v==="MEDIUM"?"Orta":v==="LOW"?"Düşük":"Bilgi"; }
function tone(s:ModuleStatus){
  return s==="CRITICAL"?{t:"KRİTİK",c:C.red,b:"#fef3f2"}:
         s==="WARNING"?{t:"DİKKAT",c:C.orange,b:"#fffaeb"}:
         s==="GOOD"?{t:"NORMAL",c:C.green,b:"#ecfdf3"}:
         {t:"VERİ YOK",c:C.muted,b:"#f2f4f7"};
}
function sevStyle(s:Severity):React.CSSProperties{
  return s==="CRITICAL"?{background:"#fef3f2",color:C.red,borderColor:"#fecdca"}:
         s==="HIGH"||s==="MEDIUM"?{background:"#fffaeb",color:C.orange,borderColor:"#fedf89"}:
         {background:"#eff8ff",color:C.blue,borderColor:"#b2ddff"};
}

export default function DoraPage(){
  const router=useRouter();
  const [companies,setCompanies]=useState<CompanyRow[]>([]);
  const [companyId,setCompanyId]=useState("");
  const [a,setA]=useState<Analysis|null>(null);
  const [loading,setLoading]=useState(true);
  const [scanning,setScanning]=useState(false);
  const [error,setError]=useState("");
  const [open,setOpen]=useState<string|null>(null);
  const [question,setQuestion]=useState("");
  const [answer,setAnswer]=useState<string[]>([]);
  const [answerTitle,setAnswerTitle]=useState("DORA hazır");
  const [activeTab,setActiveTab]=useState<"XRAY"|"SIGNALS"|"RADAR"|"DATA">("XRAY");

  const load=useCallback(async()=>{
    try{
      setLoading(true); setError("");
      const s=await readJson<Scope>(await fetch("/api/admin/reports/scope",{cache:"no-store",credentials:"include"}));
      let rows=s.allowed_companies||[];
      if(s.can_view_all_companies){
        const j:any=await readJson(await fetch("/api/admin/companies",{cache:"no-store",credentials:"include"}));
        rows=(j?.data??j??[]).filter((x:any)=>x?.id&&x?.name).map((x:any)=>({id:String(x.id),name:String(x.name)}));
      }
      setCompanies(rows); setCompanyId(s.allowed_company_id||rows[0]?.id||"");
    }catch(e){ setError(e instanceof Error?e.message:"Firma kapsamı alınamadı."); }
    finally{ setLoading(false); }
  },[]);

  const scan=useCallback(async(id:string)=>{
    if(!id)return;
    try{
      setScanning(true); setError("");
      const data=await readJson<Analysis>(await fetch(`/api/admin/dora-v2/analysis?companyId=${encodeURIComponent(id)}`,{cache:"no-store",credentials:"include"}));
      setA(data);
      setAnswerTitle("Sistem taraması tamamlandı");
      setAnswer(data.executiveCommentary?.slice(0,3) || ["DORA sistem verilerini taradı."]);
    }catch(e){
      setA(null); setError(e instanceof Error?e.message:"DORA taraması oluşturulamadı.");
    }finally{ setScanning(false); }
  },[]);

  useEffect(()=>{void load()},[load]);
  useEffect(()=>{if(companyId)void scan(companyId)},[companyId,scan]);

  const x=a?.xray;
  const topics=a?.managementTopics||[];
  const cats=x?.categories||[];
  const findings=a?.findings||[];
  const generated=a?.generatedAt?new Date(a.generatedAt).toLocaleString("tr-TR"):"-";
  const criticalCats=cats.filter(c=>c.status==="CRITICAL").length;
  const warningCats=cats.filter(c=>c.status==="WARNING").length;

  const robotState = scanning ? "TARANIYOR" : error ? "BAĞLANTI UYARISI" : "AKTİF";
  const robotColor = scanning ? C.blue : error ? C.red : C.green;

  const quickAsk=(kind:"CRITICAL"|"ACCIDENT"|"30D"|"GAPS"|"WHY")=>{
    if(!a)return;
    if(kind==="CRITICAL"){
      setAnswerTitle("En kritik yönetim öncelikleri");
      setAnswer(topics.slice(0,5).map((t,i)=>`${i+1}. ${t.title} — ${t.interpretation}`));
    }else if(kind==="ACCIDENT"){
      const rel=(a.crossAnalyses||[]).filter(v=>/kaza|olay/i.test(`${v.title} ${v.interpretation}`));
      setAnswerTitle("Kaza / olay çapraz analizi");
      setAnswer(rel.length?rel.map(v=>`${v.title}: ${v.interpretation} Öneri: ${v.recommendation}`):["Kaza/olay için yeterli çapraz analiz sinyali bulunamadı."]);
    }else if(kind==="30D"){
      const h=(a.horizon?.items||[]).filter(v=>v.days<=30).slice(0,10);
      setAnswerTitle("Önümüzdeki 30 gün");
      setAnswer(h.length?h.map(v=>`${v.days===0?"Bugün":v.days+" gün"} • ${v.module}: ${v.label}`):["Önümüzdeki 30 gün için kayıtlı yaklaşan yükümlülük görünmüyor."]);
    }else if(kind==="GAPS"){
      setAnswerTitle("DORA'nın gördüğü eksik ve boşluklar");
      setAnswer(findings.filter(f=>f.severity==="CRITICAL"||f.severity==="HIGH").slice(0,8).map(f=>`${f.moduleLabel}: ${f.title}. ${f.recommendation}`));
    }else{
      setAnswerTitle("Bu sonuca neden ulaştım?");
      setAnswer([
        `${a.summary?.scannedModules??0} modül birlikte okundu; ${a.summary?.unavailableModules??0} modülde veri erişim/kapsama sınırlaması var.`,
        `Veri güvenilirliği ${a.dataQuality?.overallScore??0}/100. DORA veri boşluğunu doğrudan operasyonel uygunsuzluk kabul etmez.`,
        `${topics.length} yönetim önceliği ve ${(a.crossAnalyses||[]).filter(v=>v.status==="SIGNAL").length} çapraz inceleme sinyali üretildi.`,
        "Çapraz eşleşmeler nedensellik olarak değil, doğrulanması gereken araştırma sinyali olarak yorumlanır."
      ]);
    }
  };

  const askCustom=()=>{
    const q=question.trim().toLocaleLowerCase("tr-TR");
    if(!q||!a)return;
    if(q.includes("kaza")||q.includes("olay")) quickAsk("ACCIDENT");
    else if(q.includes("30")||q.includes("yaklaş")||q.includes("süre")) quickAsk("30D");
    else if(q.includes("eksik")||q.includes("boşluk")) quickAsk("GAPS");
    else if(q.includes("neden")||q.includes("kanıt")) quickAsk("WHY");
    else quickAsk("CRITICAL");
    setQuestion("");
  };

  return <main style={{minHeight:"100vh",background:C.bg,padding:"16px 14px 60px",color:C.ink,fontFamily:"Inter,system-ui,-apple-system,'Segoe UI',sans-serif"}}>
    <div style={{maxWidth:1540,margin:"0 auto"}}>

      <section style={{borderRadius:28,overflow:"hidden",background:`radial-gradient(circle at 72% 25%,rgba(255,255,255,.13),transparent 24%),linear-gradient(120deg,${C.dark},${C.burgundy} 58%,#a61f32)`,color:C.white,boxShadow:"0 20px 55px rgba(83,16,31,.22)"}}>
        <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.55fr) minmax(280px,.7fr)",gap:20,padding:"28px 30px"}}>
          <div>
            <div style={{fontSize:11,fontWeight:950,letterSpacing:1.5,opacity:.8}}>D-SEC • DORA AI COMMAND CENTER</div>
            <h1 style={{margin:"8px 0 7px",fontSize:"clamp(30px,4vw,46px)",lineHeight:1.05}}>DORA AI İSG Komuta Merkezi</h1>
            <p style={{margin:0,maxWidth:880,lineHeight:1.65,opacity:.9}}>
              Firmanın dijital İSG röntgenini çıkarır. Sistemi okur, ilişkileri kurar, sessiz eksikleri ve risk sinyallerini bulur, neden önemli olduğunu açıklar ve inceleme önerir.
            </p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:17}}>
              <span style={heroChip}>OKU</span><span style={heroArrow}>→</span><span style={heroChip}>İLİŞKİLENDİR</span><span style={heroArrow}>→</span><span style={heroChip}>ANALİZ ET</span><span style={heroArrow}>→</span><span style={heroChip}>YORUMLA</span><span style={heroArrow}>→</span><span style={heroChip}>ÖNER</span>
            </div>
          </div>
          <div style={{display:"grid",placeItems:"center"}}>
            <RobotCore state={robotState} color={robotColor} scanning={scanning}/>
          </div>
        </div>
        <div style={{borderTop:"1px solid rgba(255,255,255,.14)",padding:"12px 30px",display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",fontSize:11,opacity:.88}}>
          <span>● DORA {robotState} • Son tarama: {generated}</span>
          <span>FAZ 1 • SALT OKUNUR • MODÜLLERE YAZMA YETKİSİ KAPALI</span>
        </div>
      </section>

      <section style={{...card,marginTop:13,display:"grid",gridTemplateColumns:"minmax(230px,420px) minmax(0,1fr) auto",gap:12,alignItems:"end"}}>
        <label style={{fontSize:11,fontWeight:900}}>ANALİZ EDİLEN FİRMA
          <select value={companyId} onChange={e=>setCompanyId(e.target.value)} style={{...input,marginTop:7}} disabled={scanning}>
            {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <div style={{fontSize:12,color:C.muted,lineHeight:1.55}}>
          DORA şu anda <b style={{color:C.ink}}>{a?.summary?.scannedModules??0} modülü</b> birlikte değerlendiriyor. Veri güvenilirliği <b style={{color:C.ink}}>{a?.dataQuality?.overallScore??0}/100</b>.
        </div>
        <button onClick={()=>void scan(companyId)} disabled={!companyId||scanning} style={darkButton}>{scanning?"Taranıyor...":"↻ Tam Sistem Taraması"}</button>
      </section>

      {error&&<div style={{...card,marginTop:13,color:C.red,background:"#fef3f2"}}>{error}</div>}
      {loading&&<div style={{...card,marginTop:13}}>DORA sistemi hazırlıyor...</div>}

      {!loading&&a&&<>
        <section style={{display:"grid",gridTemplateColumns:"minmax(250px,.72fr) minmax(0,1.5fr) minmax(250px,.72fr)",gap:12,marginTop:13}}>
          <div style={{...card,background:"#101828",color:C.white}}>
            <div style={{fontSize:10,fontWeight:900,letterSpacing:1.1,opacity:.7}}>DORA İSG SAĞLIK SKORU</div>
            <div style={{display:"flex",alignItems:"baseline",gap:5,marginTop:10}}><b style={{fontSize:54,lineHeight:1,color:(x?.score??0)<50?"#ff8a80":(x?.score??0)<70?"#fdb022":"#75e0a7"}}>{x?.score??0}</b><span style={{fontSize:16,opacity:.6}}>/100</span></div>
            <div style={{marginTop:7,fontSize:16,fontWeight:900}}>{x?.status??"-"}</div>
            <div style={{height:7,borderRadius:99,background:"rgba(255,255,255,.12)",marginTop:16,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.max(0,Math.min(100,x?.score??0))}%`,background:"rgba(255,255,255,.78)"}}/></div>
            <div style={{marginTop:13,fontSize:10,opacity:.65,lineHeight:1.5}}>Bu puan tek bir KPI değildir; kritik bulgular, yüksek sinyaller, veri kalitesi ve modül sağlığı birlikte değerlendirilir.</div>
          </div>

          <div style={card}>
            <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <Header title="DORA Şu Anda Ne Görüyor?" sub="Yönetici için ilk bakış: ayrıntıya girmeden firmanın dijital röntgeni."/>
              <span style={{...badge,background:"#ecfdf3",color:C.green}}>CANLI ANALİZ</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:14}}>
              <Signal n={x?.criticalIssues??0} t="Kritik eksiklik" c={C.red}/>
              <Signal n={x?.highSignals??0} t="Yüksek sinyal" c={C.orange}/>
              <Signal n={x?.upcoming30??0} t="30 gün radarı" c={C.blue}/>
              <Signal n={x?.systemicSignals??0} t="Sistemik bağ" c={C.burgundy}/>
            </div>
            <div style={{marginTop:13,padding:"12px 14px",borderRadius:13,background:C.soft,border:`1px solid #eadde0`,fontSize:12,lineHeight:1.65}}>
              <b style={{color:C.burgundy}}>DORA:</b> {a.executiveCommentary?.[0] || "Sistem taraması tamamlandı."}
            </div>
          </div>

          <div style={card}>
            <div style={{fontSize:11,fontWeight:950}}>SİSTEM DURUMU</div>
            <div style={{display:"grid",gap:9,marginTop:12}}>
              <StatusLine label="Kritik alan" value={criticalCats} color={C.red}/>
              <StatusLine label="Dikkat alanı" value={warningCats} color={C.orange}/>
              <StatusLine label="Veri güveni" value={`${a.dataQuality?.overallScore??0}%`} color={C.blue}/>
              <StatusLine label="Erişilemeyen modül" value={a.summary?.unavailableModules??0} color={C.muted}/>
            </div>
            <button onClick={()=>quickAsk("WHY")} style={{...secondary,width:"100%",marginTop:13}}>DORA neden böyle düşünüyor?</button>
          </div>
        </section>

        <section style={{...card,marginTop:13,border:"1px solid #d8c4c9",boxShadow:"0 8px 30px rgba(83,16,31,.06)"}}>
          <div style={{display:"grid",gridTemplateColumns:"180px minmax(0,1fr)",gap:16}}>
            <div style={{padding:"15px 12px",borderRadius:16,background:"#101828",color:C.white,textAlign:"center"}}>
              <div style={{fontSize:28}}>◉</div>
              <div style={{fontWeight:950,marginTop:5}}>DORA'YA SOR</div>
              <div style={{fontSize:10,opacity:.65,marginTop:6,lineHeight:1.45}}>Firma verilerinin içinden cevap üretir.</div>
            </div>
            <div>
              <div style={{display:"flex",gap:8}}>
                <input value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")askCustom()}} placeholder="Örn: En kritik eksiklerim ne? Kazalarda ortak nokta var mı? 30 günde ne yaklaşacak?" style={{...input,fontSize:13,padding:"13px 14px"}}/>
                <button onClick={askCustom} style={askButton}>DORA'YA SOR →</button>
              </div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:9}}>
                <Quick onClick={()=>quickAsk("CRITICAL")}>En kritik 5 konu</Quick>
                <Quick onClick={()=>quickAsk("GAPS")}>Eksikleri göster</Quick>
                <Quick onClick={()=>quickAsk("ACCIDENT")}>Kazaları analiz et</Quick>
                <Quick onClick={()=>quickAsk("30D")}>30 günlük radar</Quick>
                <Quick onClick={()=>quickAsk("WHY")}>Bu sonucu neden verdin?</Quick>
              </div>
            </div>
          </div>
          <div style={{marginTop:13,padding:"14px 16px",borderRadius:14,background:"#f8fafc",border:`1px solid ${C.line}`}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{width:9,height:9,borderRadius:99,background:C.green,boxShadow:"0 0 0 5px #ecfdf3"}}/><b style={{fontSize:12}}>{answerTitle}</b></div>
            <div style={{display:"grid",gap:7,marginTop:10}}>
              {answer.map((v,i)=><div key={`${i}-${v.slice(0,12)}`} style={{fontSize:12,lineHeight:1.6,color:C.ink}}><b style={{color:C.burgundy}}>DORA {i+1}.</b> {v}</div>)}
            </div>
          </div>
        </section>

        <section style={{marginTop:15}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"end",flexWrap:"wrap"}}>
            <Header title="DORA Sistem Sinir Ağı" sub="Modülleri ayrı kutular olarak değil, birbirini etkileyen tek bir İSG sistemi olarak görür."/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <Tab active={activeTab==="XRAY"} onClick={()=>setActiveTab("XRAY")}>Sistem Röntgeni</Tab>
              <Tab active={activeTab==="SIGNALS"} onClick={()=>setActiveTab("SIGNALS")}>AI Sinyalleri</Tab>
              <Tab active={activeTab==="RADAR"} onClick={()=>setActiveTab("RADAR")}>Yaklaşanlar</Tab>
              <Tab active={activeTab==="DATA"} onClick={()=>setActiveTab("DATA")}>Veri Güveni</Tab>
            </div>
          </div>

          {activeTab==="XRAY"&&<div style={{...card,marginTop:10,padding:20}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>
              {cats.map((c,i)=>{const t=tone(c.status);return <button key={c.key} onClick={()=>setOpen(open===c.key?null:c.key)} style={{position:"relative",textAlign:"left",border:`1px solid ${C.line}`,borderRadius:16,padding:15,background:C.white,cursor:"pointer",boxShadow:open===c.key?`0 0 0 2px ${t.c}22`:"none"}}>
                <div style={{position:"absolute",top:14,right:14,width:10,height:10,borderRadius:99,background:t.c,boxShadow:`0 0 0 5px ${t.b}`}}/>
                <div style={{fontSize:9,fontWeight:900,color:C.muted}}>NODE {String(i+1).padStart(2,"0")}</div>
                <b style={{display:"block",marginTop:6,fontSize:14,paddingRight:20}}>{c.label}</b>
                <div style={{marginTop:8,fontSize:11,color:C.muted,lineHeight:1.5}}>{c.headline}</div>
                <div style={{display:"flex",gap:5,marginTop:10,flexWrap:"wrap"}}><span style={{...badge,background:t.b,color:t.c}}>{t.t}</span><span style={{...badge,background:"#f2f4f7",color:C.muted}}>K {c.critical} • Y {c.high} • O {c.medium}</span></div>
                {open===c.key&&<div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.line}`}}>
                  <div style={{fontSize:11,lineHeight:1.55,color:C.muted}}>{c.detail}</div>
                  <div onClick={e=>{e.stopPropagation();router.push(c.sourceUrl)}} style={{marginTop:10,color:C.burgundy,fontWeight:900,fontSize:11}}>Kaynak modülü aç →</div>
                </div>}
              </button>})}
            </div>
          </div>}

          {activeTab==="SIGNALS"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:10,marginTop:10}}>
            {(a.crossAnalyses||[]).map(c=><article key={c.id} style={card}>
              <div style={{display:"flex",justifyContent:"space-between",gap:8}}><b>{c.title}</b><span style={{...badge,color:c.status==="SIGNAL"?C.orange:c.status==="POSITIVE"?C.green:C.muted,background:c.status==="SIGNAL"?"#fffaeb":c.status==="POSITIVE"?"#ecfdf3":"#f2f4f7"}}>{c.status==="SIGNAL"?"AI SİNYALİ":c.status==="POSITIVE"?"OLUMLU":"VERİ SINIRLI"}</span></div>
              <p style={{fontSize:11,color:C.muted,lineHeight:1.6}}>{c.interpretation}</p>
              <div style={{fontSize:11}}><b>DORA önerisi:</b> {c.recommendation}</div>
              <div style={{marginTop:10,fontSize:10,color:C.muted}}>Analiz güveni: <b>{c.confidence==="HIGH"?"Yüksek":c.confidence==="MEDIUM"?"Orta":"Düşük"}</b></div>
            </article>)}
          </div>}

          {activeTab==="RADAR"&&<div style={{...card,marginTop:10}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
              {[[7,a.horizon?.due7],[15,a.horizon?.due15],[30,a.horizon?.due30],[60,a.horizon?.due60],[90,a.horizon?.due90]].map(([d,n])=><div key={String(d)} style={{padding:14,borderRadius:13,background:"#f8fafc",textAlign:"center"}}><b style={{fontSize:27}}>{n??0}</b><div style={{fontSize:9,color:C.muted,fontWeight:900}}>{d} GÜN</div></div>)}
            </div>
            <div style={{display:"grid",gap:7,marginTop:12}}>
              {(a.horizon?.items||[]).slice(0,12).map(h=><button key={h.id} onClick={()=>router.push(h.sourceUrl)} style={{border:`1px solid ${C.line}`,borderRadius:11,padding:11,background:C.white,textAlign:"left",cursor:"pointer"}}><b style={{fontSize:11,color:h.days<=7?C.red:h.days<=30?C.orange:C.ink}}>{h.days===0?"BUGÜN":`${h.days} GÜN`} • {h.module}</b><div style={{fontSize:11,color:C.muted,marginTop:3}}>{h.label}</div></button>)}
            </div>
          </div>}

          {activeTab==="DATA"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:10,marginTop:10}}>
            {(a.dataQuality?.items||[]).map(q=>{const col=q.status==="GOOD"?C.green:q.status==="WARNING"?C.orange:C.red;return <div key={q.key} style={card}>
              <div style={{display:"flex",justifyContent:"space-between",gap:8}}><b>{q.label}</b><b style={{color:col}}>{q.score}/100</b></div>
              <div style={{height:7,borderRadius:99,background:"#f2f4f7",overflow:"hidden",margin:"11px 0"}}><div style={{height:"100%",width:`${q.score}%`,background:col}}/></div>
              <div style={{fontSize:11,color:C.muted,lineHeight:1.55}}>{q.interpretation}</div>
            </div>})}
          </div>}
        </section>

        <section style={{marginTop:15}}>
          <Header title="DORA'nın Önceliklendirdiği Yönetim Konuları" sub="Uzun rapor yerine, yönetimin önce incelemesi gereken konular."/>
          <div style={{display:"grid",gap:9,marginTop:10}}>
            {topics.slice(0,5).map((t,i)=><article key={t.id} style={card}>
              <div style={{display:"grid",gridTemplateColumns:"52px minmax(0,1fr) 90px",gap:13,alignItems:"start"}}>
                <div style={rank}>{i+1}</div>
                <div>
                  <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}><b style={{fontSize:15}}>{t.title}</b><span style={{...badge,border:"1px solid",...sevStyle(t.severity)}}>{sev(t.severity)}</span></div>
                  <p style={{fontSize:11,color:C.muted,lineHeight:1.6,margin:"7px 0"}}>{t.interpretation}</p>
                  <div style={{fontSize:11}}><b>DORA önerisi:</b> {t.recommendation}</div>
                </div>
                <div style={{textAlign:"center",padding:"8px 4px",borderRadius:12,background:"#f8fafc"}}><b style={{fontSize:24,color:t.score>=90?C.red:t.score>=70?C.orange:C.blue}}>{t.score}</b><div style={{fontSize:8,color:C.muted,fontWeight:900}}>ÖNCELİK</div></div>
              </div>
            </article>)}
          </div>
        </section>

        <section style={{...card,marginTop:14,background:"#101828",color:C.white,border:"none"}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:14,flexWrap:"wrap",alignItems:"center"}}>
            <div><b>DORA Faz 1 • Güvenli AI sınırı</b><div style={{fontSize:11,opacity:.65,marginTop:4}}>DORA tespit eder ve önerir; hiçbir modülde kayıt oluşturmaz, değiştirmez, kapatmaz veya görev atamaz.</div></div>
            <div style={{fontSize:11,fontWeight:900,letterSpacing:.5}}>OKU → İLİŞKİLENDİR → ANALİZ ET → YORUMLA → ÖNER</div>
          </div>
        </section>
      </>}
    </div>
  </main>;
}

function RobotCore({state,color,scanning}:{state:string;color:string;scanning:boolean}){
  return <div style={{position:"relative",width:210,height:170,display:"grid",placeItems:"center"}}>
    <div style={{position:"absolute",width:155,height:155,borderRadius:"50%",border:"1px solid rgba(255,255,255,.18)",boxShadow:scanning?"0 0 45px rgba(255,255,255,.25)":"0 0 25px rgba(255,255,255,.12)"}}/>
    <div style={{position:"absolute",width:118,height:118,borderRadius:"50%",border:"1px dashed rgba(255,255,255,.35)"}}/>
    <div style={{width:92,height:72,borderRadius:"28px 28px 24px 24px",background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.38)",backdropFilter:"blur(5px)",display:"grid",placeItems:"center",position:"relative"}}>
      <div style={{position:"absolute",top:-18,width:2,height:18,background:"rgba(255,255,255,.6)"}}/><div style={{position:"absolute",top:-24,width:9,height:9,borderRadius:99,background:color,boxShadow:`0 0 14px ${color}`}}/>
      <div style={{display:"flex",gap:18}}><span style={{width:11,height:11,borderRadius:99,background:"#fff",boxShadow:"0 0 12px rgba(255,255,255,.8)"}}/><span style={{width:11,height:11,borderRadius:99,background:"#fff",boxShadow:"0 0 12px rgba(255,255,255,.8)"}}/></div>
      <div style={{position:"absolute",bottom:15,width:34,height:5,borderRadius:99,background:"rgba(255,255,255,.6)"}}/>
    </div>
    <div style={{position:"absolute",bottom:0,textAlign:"center"}}><div style={{fontSize:10,fontWeight:950,letterSpacing:1.4}}>DORA CORE</div><div style={{fontSize:9,marginTop:3,color:"#fff"}}><span style={{color}}>●</span> {state}</div></div>
  </div>;
}
function Header({title,sub}:{title:string;sub:string}){return <div><div style={{fontSize:18,fontWeight:950}}>{title}</div><div style={{marginTop:4,color:C.muted,fontSize:11,lineHeight:1.5}}>{sub}</div></div>}
function Signal({n,t,c}:{n:number;t:string;c:string}){return <div style={{padding:11,border:`1px solid ${C.line}`,borderRadius:12}}><div style={{fontSize:24,fontWeight:950,color:c}}>{n}</div><div style={{fontSize:9,color:C.muted,fontWeight:900}}>{t.toUpperCase()}</div></div>}
function StatusLine({label,value,color}:{label:string;value:string|number;color:string}){return <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",fontSize:11}}><span style={{color:C.muted}}>{label}</span><b style={{color}}>{value}</b></div>}
function Quick({children,onClick}:{children:React.ReactNode;onClick:()=>void}){return <button onClick={onClick} style={{border:`1px solid ${C.line}`,borderRadius:999,padding:"7px 10px",background:C.white,color:C.ink,fontSize:10,fontWeight:800,cursor:"pointer"}}>{children}</button>}
function Tab({children,active,onClick}:{children:React.ReactNode;active:boolean;onClick:()=>void}){return <button onClick={onClick} style={{border:`1px solid ${active?C.burgundy:C.line}`,borderRadius:999,padding:"7px 10px",background:active?"#fff4f5":C.white,color:active?C.burgundy:C.muted,fontSize:10,fontWeight:900,cursor:"pointer"}}>{children}</button>}

const card:React.CSSProperties={background:C.white,border:`1px solid ${C.line}`,borderRadius:16,padding:16,boxShadow:"0 3px 12px rgba(16,24,40,.035)",minWidth:0};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"11px 12px",border:`1px solid ${C.line}`,borderRadius:10,background:C.white,fontSize:12,outline:"none"};
const darkButton:React.CSSProperties={border:"none",borderRadius:11,padding:"11px 14px",background:"#101828",color:C.white,fontWeight:900,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"};
const askButton:React.CSSProperties={border:"none",borderRadius:10,padding:"0 15px",background:C.burgundy,color:C.white,fontWeight:900,fontSize:10,cursor:"pointer",whiteSpace:"nowrap"};
const secondary:React.CSSProperties={border:`1px solid ${C.line}`,borderRadius:9,padding:"8px 10px",background:C.white,fontWeight:850,fontSize:10,cursor:"pointer"};
const badge:React.CSSProperties={display:"inline-flex",alignItems:"center",borderRadius:999,padding:"4px 7px",fontSize:9,fontWeight:900,whiteSpace:"nowrap"};
const rank:React.CSSProperties={width:44,height:44,borderRadius:13,display:"grid",placeItems:"center",background:"#fff4f5",color:C.burgundy,fontWeight:950,fontSize:19};
const heroChip:React.CSSProperties={border:"1px solid rgba(255,255,255,.24)",background:"rgba(255,255,255,.09)",borderRadius:999,padding:"6px 9px",fontSize:9,fontWeight:950,letterSpacing:.5};
const heroArrow:React.CSSProperties={opacity:.45,fontSize:11,alignSelf:"center"};
