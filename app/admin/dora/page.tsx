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
  silentGaps?:{
    summary:{scanned:number;missing:number;shortage:number;warning:number;unavailable:number;ok:number;critical:number;high:number};
    methodology:string;
    items:Array<{id:string;domain:string;title:string;state:"MISSING"|"SHORTAGE"|"WARNING"|"OK"|"VERIFY"|"UNAVAILABLE";severity:Severity;required?:number|null;current?:number|null;missing?:number|null;summary:string;reasoning:string;recommendation:string;sourceUrl:string;evidence:string[];confidence:"HIGH"|"MEDIUM"|"LOW"}>;
  };
};
type Scope = { can_view_all_companies?:boolean; allowed_company_id?:string|null; allowed_companies?:CompanyRow[] };
type DetailPanel = {
  eyebrow:string;
  title:string;
  status?:string;
  statusColor?:string;
  description:string;
  recommendation?:string;
  evidence?:string[];
  metrics?:Array<{label:string;value:string|number;color?:string}>;
  sourceUrl?:string;
  confidence?:string;
};

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
  const [fullScan,setFullScan]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [scanning,setScanning]=useState(false);
  const [error,setError]=useState("");
  const [question,setQuestion]=useState("");
  const [answer,setAnswer]=useState<string[]>([]);
  const [answerTitle,setAnswerTitle]=useState("DORA hazır");
  const [activeTab,setActiveTab]=useState<"XRAY"|"GAPS"|"SIGNALS"|"RADAR"|"DATA">("XRAY");
  const [detail,setDetail]=useState<DetailPanel|null>(null);
  const [thinking,setThinking]=useState(false);
  const [reasonTrail,setReasonTrail]=useState<string[]>([]);

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
      const [data,fs]=await Promise.all([
        readJson<Analysis>(await fetch(`/api/admin/dora-v2/analysis?companyId=${encodeURIComponent(id)}`,{cache:"no-store",credentials:"include"})),
        readJson<any>(await fetch(`/api/admin/dora-v2/full-scan?companyId=${encodeURIComponent(id)}`,{cache:"no-store",credentials:"include"}))
      ]);
      setA(data);
      setFullScan(fs?.ok===false?null:fs);
      setAnswerTitle("Sistem taraması tamamlandı");
      const totalModules=fs?.summary?.modulesScanned??data.summary?.scannedModules??0;
      const availableModules=fs?.summary?.modulesAvailable??data.summary?.scannedModules??0;
      const unavailableModules=fs?.summary?.modulesUnavailable??data.summary?.unavailableModules??0;
      const commentary=(data.executiveCommentary||[]).filter((line:string)=>!/(\b8\s+modül|modülün verisini|modül birlikte)/i.test(line));
      setAnswer([
        `DORA Tam Sistem Taramasında ${totalModules} modülü kontrol etti; ${availableModules} modülden veri okunuyor${unavailableModules>0?`, ${unavailableModules} modülde erişim/kapsam doğrulaması gerekiyor`:""}.`,
        ...commentary
      ].slice(0,3));
    }catch(e){
      setA(null); setFullScan(null); setError(e instanceof Error?e.message:"DORA taraması oluşturulamadı.");
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


  const openModuleDetail=(c:XrayCat)=>{
    const t=tone(c.status);
    const related=findings.filter(f=>f.module===c.key);
    setDetail({
      eyebrow:"DORA SİSTEM RÖNTGENİ",
      title:c.label,
      status:t.t,
      statusColor:t.c,
      description:c.detail || c.headline,
      recommendation:related[0]?.recommendation || "İlgili modül kayıtlarının ve DORA sinyallerinin birlikte incelenmesi önerilir.",
      evidence:related.flatMap(f=>f.evidence||[]).slice(0,8),
      metrics:[
        {label:"Kritik",value:c.critical,color:C.red},
        {label:"Yüksek",value:c.high,color:C.orange},
        {label:"Orta",value:c.medium,color:C.blue},
        {label:"Düşük",value:c.low,color:C.green},
      ],
      sourceUrl:c.sourceUrl
    });
  };

  const openGapDetail=(g:NonNullable<Analysis["silentGaps"]>["items"][number])=>{
    const col=g.severity==="CRITICAL"?C.red:g.severity==="HIGH"?C.orange:g.severity==="MEDIUM"?C.blue:C.muted;
    const stateLabel=g.state==="MISSING"?"KAYIT YOK":g.state==="SHORTAGE"?"EKSİK":g.state==="VERIFY"?"DOĞRULA":g.state==="UNAVAILABLE"?"VERİ YOK":g.state==="OK"?"UYGUN":"UYARI";
    const metrics:Array<{label:string;value:string|number;color?:string}>=[];
    if(g.required!==undefined&&g.required!==null) metrics.push({label:"Gerekli",value:g.required});
    if(g.current!==undefined&&g.current!==null) metrics.push({label:"Mevcut",value:g.current});
    if(g.missing!==undefined&&g.missing!==null) metrics.push({label:"Eksik",value:g.missing,color:g.missing>0?C.red:C.green});
    setDetail({
      eyebrow:g.domain.toUpperCase(),
      title:g.title,
      status:stateLabel,
      statusColor:col,
      description:g.summary,
      recommendation:g.recommendation,
      evidence:[g.reasoning,...(g.evidence||[])],
      metrics,
      sourceUrl:g.sourceUrl,
      confidence:g.confidence==="HIGH"?"Yüksek":g.confidence==="MEDIUM"?"Orta":"Düşük"
    });
  };

  const openCrossDetail=(c:Cross)=>{
    const col=c.status==="SIGNAL"?C.orange:c.status==="POSITIVE"?C.green:C.muted;
    setDetail({
      eyebrow:"DORA ÇAPRAZ MODÜL ANALİZİ",
      title:c.title,
      status:c.status==="SIGNAL"?"İNCELEME SİNYALİ":c.status==="POSITIVE"?"OLUMLU":"VERİ SINIRLI",
      statusColor:col,
      description:c.interpretation,
      recommendation:c.recommendation,
      evidence:c.evidence,
      metrics:c.modules.map(m=>({label:"Modül",value:m})).slice(0,4),
      confidence:c.confidence==="HIGH"?"Yüksek":c.confidence==="MEDIUM"?"Orta":"Düşük"
    });
  };

  const openTopicDetail=(t:Topic,index:number)=>{
    setDetail({
      eyebrow:`YÖNETİM ÖNCELİĞİ #${index+1}`,
      title:t.title,
      status:`ÖNCELİK ${t.score}/100`,
      statusColor:t.score>=90?C.red:t.score>=70?C.orange:C.blue,
      description:t.interpretation,
      recommendation:t.recommendation,
      evidence:t.evidence,
      metrics:t.modules.map(m=>({label:"İlişkili modül",value:m})).slice(0,4)
    });
  };

  const openHorizonDetail=(h:HorizonItem)=>{
    setDetail({
      eyebrow:"DORA YAKLAŞANLAR RADARI",
      title:h.label,
      status:h.days<=7?"KRİTİK SÜRE":h.days<=30?"YAKLAŞIYOR":"PLANLA",
      statusColor:h.days<=7?C.red:h.days<=30?C.orange:C.blue,
      description:`${h.module} kaydı için hedef tarihe ${h.days===0?"bugün ulaşılıyor":`${h.days} gün kaldı`}.`,
      recommendation:h.days<=7?"Kayıt ve planlamanın hemen doğrulanması önerilir.":"İlgili kayıt için planlamanın önceden gözden geçirilmesi önerilir.",
      metrics:[{label:"Kalan gün",value:h.days,color:h.days<=7?C.red:h.days<=30?C.orange:C.blue},{label:"Modül",value:h.module}],
      sourceUrl:h.sourceUrl
    });
  };

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
      const req=(a.silentGaps?.items||[]).filter(g=>g.state!=="OK").slice(0,8).map(g=>`${g.domain}: ${g.title} — ${g.summary} Öneri: ${g.recommendation}`);
      setAnswer(req.length?req:findings.filter(f=>f.severity==="CRITICAL"||f.severity==="HIGH").slice(0,8).map(f=>`${f.moduleLabel}: ${f.title}. ${f.recommendation}`));
    }else{
      setAnswerTitle("Bu sonuca neden ulaştım?");
      setAnswer([
        `${fullScan?.summary?.modulesScanned??a.summary?.scannedModules??0} modül Tam Sistem Taramasında kontrol edildi; ${fullScan?.summary?.modulesAvailable??a.summary?.scannedModules??0} modülden veri okunuyor, ${fullScan?.summary?.modulesUnavailable??a.summary?.unavailableModules??0} modülde erişim/kapsam doğrulaması gerekiyor.`,
        `Veri güvenilirliği ${a.dataQuality?.overallScore??0}/100. DORA veri boşluğunu doğrudan operasyonel uygunsuzluk kabul etmez.`,
        `${topics.length} yönetim önceliği ve ${(a.crossAnalyses||[]).filter(v=>v.status==="SIGNAL").length} çapraz inceleme sinyali üretildi.`,
        "Çapraz eşleşmeler nedensellik olarak değil, doğrulanması gereken araştırma sinyali olarak yorumlanır."
      ]);
    }
  };

  const askCustom=()=>{
    const raw=question.trim();
    const q=raw.toLocaleLowerCase("tr-TR");
    if(!q||!a)return;

    setThinking(true);
    setAnswerTitle("DORA düşünüyor…");
    setReasonTrail(["Soruyu anlamlandırıyorum…","İlgili modülleri seçiyorum…","Kanıt ve çapraz sinyalleri karşılaştırıyorum…"]);
    setAnswer([]);

    window.setTimeout(()=>{
      const words=q.split(/\s+/).filter(w=>w.length>2);
      const scoreText=(textValue:string)=>{
        const z=textValue.toLocaleLowerCase("tr-TR");
        return words.reduce((n,w)=>n+(z.includes(w)?1:0),0);
      };

      const gapHits=(a.silentGaps?.items||[])
        .map(g=>({g,score:scoreText(`${g.domain} ${g.title} ${g.summary} ${g.reasoning} ${g.recommendation}`)}))
        .filter(x=>x.score>0).sort((x,y)=>y.score-x.score);

      const findingHits=findings
        .map(f=>({f,score:scoreText(`${f.moduleLabel} ${f.title} ${f.description} ${f.recommendation} ${(f.evidence||[]).join(" ")}`)}))
        .filter(x=>x.score>0).sort((x,y)=>y.score-x.score);

      const crossHits=(a.crossAnalyses||[])
        .map(c=>({c,score:scoreText(`${c.title} ${c.interpretation} ${c.recommendation} ${c.modules.join(" ")}`)}))
        .filter(x=>x.score>0).sort((x,y)=>y.score-x.score);

      const topicHits=topics
        .map(t=>({t,score:scoreText(`${t.title} ${t.interpretation} ${t.recommendation} ${t.modules.join(" ")}`)}))
        .filter(x=>x.score>0).sort((x,y)=>y.score-x.score);

      let result:string[]=[];
      let title=`DORA analizi: “${raw}”`;

      if(q.includes("kaza")||q.includes("olay")){
        const rel=(a.crossAnalyses||[]).filter(v=>/kaza|olay/i.test(`${v.title} ${v.interpretation}`));
        result=rel.length
          ? rel.slice(0,5).map(v=>`${v.title}: ${v.interpretation} Öneri: ${v.recommendation}`)
          : ["Kaza/olay kayıtlarında bu soruyu destekleyecek yeterli çapraz ilişki sinyali oluşmadı."];
      }else if(q.includes("30")||q.includes("yaklaş")||q.includes("süre")||q.includes("bit")){
        const h=(a.horizon?.items||[]).filter(v=>v.days<=30).sort((x,y)=>x.days-y.days).slice(0,10);
        result=h.length?h.map(v=>`${v.days===0?"Bugün":v.days+" gün"} • ${v.module}: ${v.label}`):["Önümüzdeki 30 gün için kayıtlı yaklaşan yükümlülük görünmüyor."];
      }else if(q.includes("neden")||q.includes("kanıt")||q.includes("niye")){
        result=[
          `${fullScan?.summary?.modulesScanned??a.summary?.scannedModules??0} modül Tam Sistem Taramasında kontrol edildi; ${fullScan?.summary?.modulesAvailable??a.summary?.scannedModules??0} modülden veri okunuyor, ${fullScan?.summary?.modulesUnavailable??a.summary?.unavailableModules??0} modülde erişim/kapsam doğrulaması gerekiyor.`,
          `Veri güvenilirliği ${a.dataQuality?.overallScore??0}/100. Eksik sistem kaydı doğrudan mevzuata aykırılık olarak yorumlanmıyor.`,
          `${topics.length} yönetim önceliği, ${(a.crossAnalyses||[]).filter(v=>v.status==="SIGNAL").length} çapraz inceleme sinyali ve ${a.silentGaps?.summary?.scanned??0} gereklilik kontrolü değerlendirildi.`,
          "DORA korelasyonları nedensellik olarak değil, doğrulanması gereken araştırma sinyali olarak kullanıyor."
        ];
      }else{
        result=[
          ...gapHits.slice(0,3).map(x=>`${x.g.domain}: ${x.g.title} — ${x.g.summary} Öneri: ${x.g.recommendation}`),
          ...crossHits.slice(0,2).map(x=>`Çapraz sinyal: ${x.c.title} — ${x.c.interpretation}`),
          ...findingHits.slice(0,2).map(x=>`${x.f.moduleLabel}: ${x.f.title} — ${x.f.recommendation}`),
          ...topicHits.slice(0,2).map(x=>`Yönetim önceliği ${x.t.score}/100: ${x.t.title} — ${x.t.interpretation}`)
        ].slice(0,7);

        if(!result.length){
          title="DORA yönetim değerlendirmesi";
          result=topics.slice(0,5).map((t,i)=>`${i+1}. ${t.title} — ${t.interpretation} Öneri: ${t.recommendation}`);
        }
      }

      setReasonTrail([
        `${fullScan?.summary?.modulesScanned??a.summary?.scannedModules??0} modül Tam Sistem Taramasında kontrol edildi.`,
        `${gapHits.length+findingHits.length} doğrudan eşleşen bulgu/eksiklik bulundu.`,
        `${crossHits.length} ilgili çapraz modül sinyali karşılaştırıldı.`,
        `Yanıt veri güveni ${a.dataQuality?.overallScore??0}/100 dikkate alınarak oluşturuldu.`
      ]);
      setAnswerTitle(title);
      setAnswer(result.length?result:["Bu soru için mevcut firma verilerinden güvenilir bir sonuç üretilemedi."]);
      setThinking(false);
      setQuestion("");
    },650);
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
          DORA Tam Sistem Taramasında <b style={{color:C.ink}}>{fullScan?.summary?.modulesScanned??a?.summary?.scannedModules??0} modülü</b> kontrol ediyor. <b style={{color:C.green}}>{fullScan?.summary?.modulesAvailable??a?.summary?.scannedModules??0} modülden veri okunuyor</b>{(fullScan?.summary?.modulesUnavailable??a?.summary?.unavailableModules??0)>0&&<>; <b style={{color:C.red}}>{fullScan?.summary?.modulesUnavailable??a?.summary?.unavailableModules??0} modülde erişim/kapsam doğrulaması gerekiyor</b></>}. Veri güvenilirliği <b style={{color:C.ink}}>{a?.dataQuality?.overallScore??0}/100</b>.
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
              <Signal n={x?.criticalIssues??0} t="Kritik eksiklik" c={C.red} onClick={()=>{setActiveTab("GAPS");window.scrollTo({top:900,behavior:"smooth"})}}/>
              <Signal n={x?.highSignals??0} t="Yüksek sinyal" c={C.orange} onClick={()=>{setActiveTab("SIGNALS");window.scrollTo({top:900,behavior:"smooth"})}}/>
              <Signal n={x?.upcoming30??0} t="30 gün radarı" c={C.blue} onClick={()=>{setActiveTab("RADAR");window.scrollTo({top:900,behavior:"smooth"})}}/>
              <Signal n={x?.systemicSignals??0} t="Sistemik bağ" c={C.burgundy} onClick={()=>{setActiveTab("SIGNALS");window.scrollTo({top:900,behavior:"smooth"})}}/>
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
                <Quick onClick={()=>{setQuestion("Eğitim, sağlık ve risk arasında hangi ortak zayıflıklar var?");}}>Ortak zayıflıkları bul</Quick>
                <Quick onClick={()=>{setQuestion("Yönetici olsam bugün ilk hangi konuya bakmalıyım?");}}>Bugün neye bakmalıyım?</Quick>
              </div>
            </div>
          </div>
          <div style={{marginTop:13,padding:"14px 16px",borderRadius:14,background:"#f8fafc",border:`1px solid ${C.line}`}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{width:9,height:9,borderRadius:99,background:thinking?C.blue:C.green,boxShadow:thinking?"0 0 0 5px #eff8ff":"0 0 0 5px #ecfdf3"}}/><b style={{fontSize:12}}>{answerTitle}</b></div>
              <span style={{...badge,background:thinking?"#eff8ff":"#ecfdf3",color:thinking?C.blue:C.green}}>{thinking?"DÜŞÜNÜYOR":"KANITA DAYALI"}</span>
            </div>
            {reasonTrail.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>
              {reasonTrail.map((r,i)=><span key={`${i}-${r}`} style={{...badge,background:"#fff",color:C.muted,border:`1px solid ${C.line}`}}>{i+1}. {r}</span>)}
            </div>}
            <div style={{display:"grid",gap:7,marginTop:10}}>
              {thinking
                ? <div style={{fontSize:12,color:C.muted,lineHeight:1.7}}>DORA firma verilerini, sessiz eksiklikleri ve çapraz modül sinyallerini birlikte değerlendiriyor…</div>
                : answer.map((v,i)=><div key={`${i}-${v.slice(0,12)}`} style={{fontSize:12,lineHeight:1.6,color:C.ink}}><b style={{color:C.burgundy}}>DORA {i+1}.</b> {v}</div>)}
            </div>
          </div>
        </section>

        <section style={{marginTop:15}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"end",flexWrap:"wrap"}}>
            <Header title="DORA Sistem Sinir Ağı" sub="Modülleri ayrı kutular olarak değil, birbirini etkileyen tek bir İSG sistemi olarak görür."/>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <Tab active={activeTab==="XRAY"} onClick={()=>setActiveTab("XRAY")}>Sistem Röntgeni</Tab>
              <Tab active={activeTab==="GAPS"} onClick={()=>setActiveTab("GAPS")}>Sessiz Eksiklikler</Tab><Tab active={activeTab==="SIGNALS"} onClick={()=>setActiveTab("SIGNALS")}>AI Sinyalleri</Tab>
              <Tab active={activeTab==="RADAR"} onClick={()=>setActiveTab("RADAR")}>Yaklaşanlar</Tab>
              <Tab active={activeTab==="DATA"} onClick={()=>setActiveTab("DATA")}>Veri Güveni</Tab>
            </div>
          </div>

          {activeTab==="XRAY"&&<div style={{marginTop:10}}>
            <NeuralNetwork
              categories={cats}
              crossAnalyses={a.crossAnalyses||[]}
              score={x?.score??0}
              status={x?.status??"-"}
              scanning={scanning}
              onNodeClick={openModuleDetail}
              onSignalClick={openCrossDetail}
            />

            <div style={{...card,marginTop:10,padding:18}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                <Header title="Modül Röntgen Kartları" sub="Sinir ağındaki her düğümün kısa özeti. Kartlara basınca DORA gerekçesi, kanıtları ve önerisi açılır."/>
                <span style={{...badge,background:"#f2f4f7",color:C.muted}}>{cats.length} AKTİF DÜĞÜM</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10,marginTop:14}}>
                {cats.map((c,i)=>{const t=tone(c.status);return <button key={c.key} onClick={()=>openModuleDetail(c)} style={{position:"relative",textAlign:"left",border:`1px solid ${C.line}`,borderRadius:18,padding:17,background:`linear-gradient(145deg,${C.white},${t.b})`,cursor:"pointer",boxShadow:"0 6px 18px rgba(16,24,40,.05)",minHeight:150}}>
                  <div style={{position:"absolute",top:14,right:14,width:11,height:11,borderRadius:99,background:t.c,boxShadow:`0 0 0 6px ${t.b},0 0 18px ${t.c}44`}}/>
                  <div style={{fontSize:9,fontWeight:950,color:C.muted,letterSpacing:.8}}>DORA NODE {String(i+1).padStart(2,"0")}</div>
                  <b style={{display:"block",marginTop:8,fontSize:15,paddingRight:24}}>{c.label}</b>
                  <div style={{marginTop:8,fontSize:11,color:C.muted,lineHeight:1.55}}>{c.headline}</div>
                  <div style={{display:"flex",gap:5,marginTop:12,flexWrap:"wrap"}}><span style={{...badge,background:t.b,color:t.c,border:`1px solid ${t.c}22`}}>{t.t}</span><span style={{...badge,background:"#f2f4f7",color:C.muted}}>K {c.critical} • Y {c.high} • O {c.medium}</span></div>
                  <div style={{position:"absolute",right:15,bottom:13,fontSize:10,fontWeight:900,color:C.burgundy}}>DORA DETAY →</div>
                </button>})}
              </div>
            </div>
          </div>}


          {activeTab==="GAPS"&&<div style={{...card,marginTop:10}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
              <Signal n={a.silentGaps?.summary.critical??0} t="Kritik gereklilik" c={C.red}/>
              <Signal n={a.silentGaps?.summary.high??0} t="Yüksek gereklilik" c={C.orange}/>
              <Signal n={a.silentGaps?.summary.missing??0} t="Hiç bulunamadı" c={C.burgundy}/>
              <Signal n={a.silentGaps?.summary.shortage??0} t="Sayısal eksik" c={C.blue}/>
              <Signal n={a.silentGaps?.summary.ok??0} t="Uygun görünen" c={C.green}/>
            </div>
            <div style={{marginTop:12,padding:"11px 13px",borderRadius:12,background:"#f8fafc",fontSize:10,color:C.muted,lineHeight:1.55}}>
              <b style={{color:C.ink}}>DORA metodolojisi:</b> {a.silentGaps?.methodology}
            </div>
            <div style={{display:"grid",gap:8,marginTop:12}}>
              {(a.silentGaps?.items||[]).filter(g=>g.state!=="OK").map(g=>{
                const col=g.severity==="CRITICAL"?C.red:g.severity==="HIGH"?C.orange:g.severity==="MEDIUM"?C.blue:C.muted;
                const stateLabel=g.state==="MISSING"?"KAYIT YOK":g.state==="SHORTAGE"?"EKSİK":g.state==="VERIFY"?"DOĞRULA":g.state==="UNAVAILABLE"?"VERİ YOK":"UYARI";
                return <article key={g.id} onClick={()=>openGapDetail(g)} style={{border:`1px solid ${C.line}`,borderLeft:`5px solid ${col}`,borderRadius:16,padding:16,background:`linear-gradient(145deg,#fff,${col}08)`,cursor:"pointer",boxShadow:"0 5px 16px rgba(16,24,40,.04)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start",flexWrap:"wrap"}}>
                    <div><div style={{fontSize:9,fontWeight:900,color:C.muted}}>{g.domain.toUpperCase()}</div><b style={{display:"block",fontSize:14,marginTop:4}}>{g.title}</b></div>
                    <div style={{display:"flex",gap:6}}><span style={{...badge,background:"#f2f4f7",color:col}}>{stateLabel}</span><span style={{...badge,background:"#f2f4f7",color:C.muted}}>GÜVEN {g.confidence==="HIGH"?"YÜKSEK":g.confidence==="MEDIUM"?"ORTA":"DÜŞÜK"}</span></div>
                  </div>
                  <div style={{marginTop:9,fontSize:12,lineHeight:1.6}}>{g.summary}</div>
                  {(g.required!==undefined&&g.required!==null)&&<div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:9}}>
                    <span style={{...badge,background:"#f8fafc",color:C.ink}}>Gerekli {g.required}</span>
                    <span style={{...badge,background:"#f8fafc",color:C.ink}}>Mevcut {g.current??0}</span>
                    {(g.missing??0)>0&&<span style={{...badge,background:"#fef3f2",color:C.red}}>Eksik {g.missing}</span>}
                  </div>}
                  <div style={{marginTop:9,fontSize:10,color:C.muted,lineHeight:1.55}}><b>DORA nasıl buldu?</b> {g.reasoning}</div>
                  <div style={{marginTop:7,fontSize:11,lineHeight:1.55}}><b>DORA önerisi:</b> {g.recommendation}</div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginTop:11}}><span style={{fontSize:10,color:C.muted}}>Kartı aç → DORA gerekçesi ve kanıtlar</span><button onClick={e=>{e.stopPropagation();router.push(g.sourceUrl)}} style={secondary}>Kaynak modülü incele →</button></div>
                </article>
              })}
            </div>
          </div>}

          {activeTab==="SIGNALS"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:10,marginTop:10}}>
            {(a.crossAnalyses||[]).map(c=><article key={c.id} onClick={()=>openCrossDetail(c)} style={{...card,cursor:"pointer",boxShadow:"0 7px 18px rgba(16,24,40,.05)"}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:8}}><b>{c.title}</b><span style={{...badge,color:c.status==="SIGNAL"?C.orange:c.status==="POSITIVE"?C.green:C.muted,background:c.status==="SIGNAL"?"#fffaeb":c.status==="POSITIVE"?"#ecfdf3":"#f2f4f7"}}>{c.status==="SIGNAL"?"AI SİNYALİ":c.status==="POSITIVE"?"OLUMLU":"VERİ SINIRLI"}</span></div>
              <p style={{fontSize:11,color:C.muted,lineHeight:1.6}}>{c.interpretation}</p>
              <div style={{fontSize:11}}><b>DORA önerisi:</b> {c.recommendation}</div>
              <div style={{display:"flex",justifyContent:"space-between",gap:8,marginTop:10,fontSize:10,color:C.muted}}><span>Analiz güveni: <b>{c.confidence==="HIGH"?"Yüksek":c.confidence==="MEDIUM"?"Orta":"Düşük"}</b></span><b style={{color:C.burgundy}}>DETAYI AÇ →</b></div>
            </article>)}
          </div>}

          {activeTab==="RADAR"&&<div style={{...card,marginTop:10}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
              {[[7,a.horizon?.due7],[15,a.horizon?.due15],[30,a.horizon?.due30],[60,a.horizon?.due60],[90,a.horizon?.due90]].map(([d,n])=><div key={String(d)} style={{padding:14,borderRadius:13,background:"#f8fafc",textAlign:"center"}}><b style={{fontSize:27}}>{n??0}</b><div style={{fontSize:9,color:C.muted,fontWeight:900}}>{d} GÜN</div></div>)}
            </div>
            <div style={{display:"grid",gap:7,marginTop:12}}>
              {(a.horizon?.items||[]).slice(0,12).map(h=><button key={h.id} onClick={()=>openHorizonDetail(h)} style={{border:`1px solid ${C.line}`,borderRadius:11,padding:11,background:C.white,textAlign:"left",cursor:"pointer"}}><b style={{fontSize:11,color:h.days<=7?C.red:h.days<=30?C.orange:C.ink}}>{h.days===0?"BUGÜN":`${h.days} GÜN`} • {h.module}</b><div style={{fontSize:11,color:C.muted,marginTop:3}}>{h.label}</div></button>)}
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
            {topics.slice(0,5).map((t,i)=><article key={t.id} onClick={()=>openTopicDetail(t,i)} style={{...card,cursor:"pointer",boxShadow:"0 7px 20px rgba(16,24,40,.045)"}}>
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

      {detail&&<DetailModal detail={detail} onClose={()=>setDetail(null)} onOpenSource={(url)=>{setDetail(null);router.push(url)}}/>}
    </div>
  </main>;
}

function NeuralNetwork({
  categories,
  crossAnalyses,
  score,
  status,
  scanning,
  onNodeClick,
  onSignalClick,
}:{
  categories:XrayCat[];
  crossAnalyses:Cross[];
  score:number;
  status:string;
  scanning:boolean;
  onNodeClick:(c:XrayCat)=>void;
  onSignalClick:(c:Cross)=>void;
}){
  const positions = [
    {x:13,y:22},{x:35,y:12},{x:65,y:12},{x:87,y:22},
    {x:13,y:76},{x:35,y:87},{x:65,y:87},{x:87,y:76},
  ];
  const nodes = categories.slice(0,8);
  const signalCount = crossAnalyses.filter(x=>x.status==="SIGNAL").length;

  return <section style={{position:"relative",borderRadius:24,overflow:"hidden",background:"linear-gradient(145deg,#0c111d,#151d2d 58%,#251018)",border:"1px solid rgba(255,255,255,.05)",boxShadow:"0 18px 48px rgba(16,24,40,.18)",minHeight:590,color:"#fff"}}>
    <style>{`
      @keyframes doraPulse {0%,100%{transform:scale(1);opacity:.55}50%{transform:scale(1.08);opacity:1}}
      @keyframes doraOrbit {from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @keyframes doraFlow {0%{stroke-dashoffset:40}100%{stroke-dashoffset:0}}
      @keyframes doraScan {0%{transform:translateY(-120%);opacity:0}25%{opacity:.45}75%{opacity:.18}100%{transform:translateY(520%);opacity:0}}
    `}</style>

    <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 50%,rgba(127,29,45,.22),transparent 26%),radial-gradient(circle at 20% 20%,rgba(23,92,211,.08),transparent 24%),radial-gradient(circle at 80% 80%,rgba(6,118,71,.06),transparent 22%)"}}/>
    <div style={{position:"absolute",inset:"0 0 auto 0",height:2,background:"linear-gradient(90deg,transparent,rgba(255,255,255,.5),transparent)",animation:scanning?"doraScan 2.2s linear infinite":"none"}}/>

    <div style={{position:"relative",zIndex:2,padding:"20px 22px 0",display:"flex",justifyContent:"space-between",gap:14,alignItems:"start",flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:10,fontWeight:950,letterSpacing:1.3,opacity:.62}}>DORA NEURAL MAP • CANLI SİSTEM TOPOLOJİSİ</div>
        <div style={{fontSize:22,fontWeight:950,marginTop:4}}>DORA Sistem Sinir Ağı</div>
        <div style={{fontSize:11,opacity:.62,marginTop:5,maxWidth:700,lineHeight:1.55}}>DORA tüm modülleri merkezde birleştirir. Renkli bağlantılar modülün mevcut sağlık durumunu; AI sinyal kartları ise modüller arasında incelenmesi gereken ilişkileri gösterir.</div>
      </div>
      <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
        <span style={{...darkBadge,background:"rgba(180,35,24,.18)",color:"#fda29b"}}>● KRİTİK</span>
        <span style={{...darkBadge,background:"rgba(181,71,8,.18)",color:"#fec84b"}}>● DİKKAT</span>
        <span style={{...darkBadge,background:"rgba(6,118,71,.18)",color:"#75e0a7"}}>● NORMAL</span>
      </div>
    </div>

    <div style={{position:"relative",height:430,marginTop:8}}>
      <svg viewBox="0 0 1000 430" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"100%",height:"100%",overflow:"visible"}}>
        <defs>
          <filter id="doraGlow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <linearGradient id="doraLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#667085" stopOpacity=".15"/>
            <stop offset="48%" stopColor="#d0d5dd" stopOpacity=".5"/>
            <stop offset="100%" stopColor="#667085" stopOpacity=".12"/>
          </linearGradient>
        </defs>
        {nodes.map((n,i)=>{
          const p=positions[i]||positions[0];
          const t=tone(n.status);
          const x=p.x*10, y=p.y*4.3;
          return <g key={`line-${n.key}`}>
            <line x1="500" y1="215" x2={x} y2={y} stroke={t.c} strokeOpacity={n.status==="GOOD"?.28:.58} strokeWidth={n.status==="CRITICAL"?2.5:1.5} strokeDasharray={n.status==="GOOD"?"3 7":"8 7"} filter={n.status==="CRITICAL"?"url(#doraGlow)":undefined} style={{animation:n.status==="GOOD"?"none":"doraFlow 1.8s linear infinite"}}/>
            <circle cx={x} cy={y} r="3.2" fill={t.c} opacity=".9"/>
          </g>
        })}
        <circle cx="500" cy="215" r="85" fill="none" stroke="url(#doraLine)" strokeWidth="1"/>
        <circle cx="500" cy="215" r="118" fill="none" stroke="rgba(255,255,255,.08)" strokeDasharray="5 10" strokeWidth="1"/>
      </svg>

      <div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",width:190,height:190,display:"grid",placeItems:"center"}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"1px solid rgba(255,255,255,.1)",animation:"doraOrbit 18s linear infinite"}}>
          <span style={{position:"absolute",left:"50%",top:-5,width:10,height:10,borderRadius:99,background:"#fff",boxShadow:"0 0 18px rgba(255,255,255,.8)"}}/>
        </div>
        <div style={{position:"absolute",inset:20,borderRadius:"50%",border:"1px dashed rgba(255,255,255,.18)",animation:"doraOrbit 12s linear infinite reverse"}}/>
        <div style={{position:"relative",width:122,height:122,borderRadius:"50%",display:"grid",placeItems:"center",background:"radial-gradient(circle at 45% 35%,rgba(255,255,255,.2),rgba(127,29,45,.28) 45%,rgba(10,16,28,.92) 72%)",border:"1px solid rgba(255,255,255,.2)",boxShadow:"0 0 55px rgba(127,29,45,.45)",animation:scanning?"doraPulse 1.2s ease-in-out infinite":"doraPulse 3s ease-in-out infinite"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:10,fontWeight:950,letterSpacing:1.2,opacity:.66}}>DORA CORE</div>
            <div style={{fontSize:34,fontWeight:950,lineHeight:1,marginTop:5}}>{score}</div>
            <div style={{fontSize:8,opacity:.7,marginTop:3}}>{status}</div>
            <div style={{fontSize:8,color:"#75e0a7",marginTop:5}}>● {scanning?"TARANIYOR":"AKTİF"}</div>
          </div>
        </div>
      </div>

      {nodes.map((n,i)=>{
        const p=positions[i]||positions[0];
        const t=tone(n.status);
        return <button key={n.key} onClick={()=>onNodeClick(n)} style={{
          position:"absolute",left:`${p.x}%`,top:`${p.y}%`,transform:"translate(-50%,-50%)",
          width:150,minHeight:84,padding:"10px 11px",borderRadius:15,
          border:`1px solid ${t.c}55`,background:"rgba(17,24,39,.86)",color:"#fff",
          textAlign:"left",cursor:"pointer",boxShadow:`0 0 0 1px rgba(255,255,255,.025),0 8px 24px rgba(0,0,0,.22),0 0 22px ${t.c}18`,
          backdropFilter:"blur(10px)"
        }}>
          <div style={{display:"flex",justifyContent:"space-between",gap:7,alignItems:"center"}}>
            <span style={{fontSize:8,fontWeight:950,letterSpacing:.8,opacity:.48}}>NODE {String(i+1).padStart(2,"0")}</span>
            <span style={{width:8,height:8,borderRadius:99,background:t.c,boxShadow:`0 0 12px ${t.c}`}}/>
          </div>
          <b style={{display:"block",fontSize:12,marginTop:5,lineHeight:1.2}}>{n.label}</b>
          <div style={{display:"flex",justifyContent:"space-between",gap:6,marginTop:7,alignItems:"center"}}>
            <span style={{fontSize:8,fontWeight:900,color:t.c}}>{t.t}</span>
            <span style={{fontSize:8,opacity:.5}}>K{n.critical} Y{n.high} O{n.medium}</span>
          </div>
        </button>
      })}
    </div>

    <div style={{position:"relative",zIndex:2,borderTop:"1px solid rgba(255,255,255,.08)",padding:"13px 18px 17px"}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:10,fontWeight:950}}>DORA ÇAPRAZ SİNYAL HATTI</div>
          <div style={{fontSize:9,opacity:.52,marginTop:3}}>{signalCount} aktif inceleme sinyali • İlk üç ilişki aşağıda</div>
        </div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {crossAnalyses.filter(x=>x.status==="SIGNAL").slice(0,3).map((s,i)=><button key={s.id} onClick={()=>onSignalClick(s)} style={{border:"1px solid rgba(255,255,255,.12)",borderRadius:999,padding:"7px 10px",background:"rgba(255,255,255,.06)",color:"#fff",fontSize:9,fontWeight:850,cursor:"pointer"}}><span style={{color:"#fec84b"}}>⚡</span> {s.title.length>42?s.title.slice(0,42)+"…":s.title}</button>)}
          {signalCount===0&&<span style={{...darkBadge,background:"rgba(6,118,71,.14)",color:"#75e0a7"}}>Belirgin çapraz sinyal yok</span>}
        </div>
      </div>
    </div>
  </section>;
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
function Signal({n,t,c,onClick}:{n:number;t:string;c:string;onClick?:()=>void}){return <button onClick={onClick} style={{padding:12,border:`1px solid ${C.line}`,borderRadius:14,background:`linear-gradient(145deg,#fff,${c}08)`,textAlign:"left",cursor:onClick?"pointer":"default",boxShadow:"0 5px 14px rgba(16,24,40,.04)"}}><div style={{fontSize:26,fontWeight:950,color:c}}>{n}</div><div style={{fontSize:9,color:C.muted,fontWeight:900}}>{t.toUpperCase()}</div>{onClick&&<div style={{marginTop:7,fontSize:9,fontWeight:900,color:c}}>İNCELE →</div>}</button>}
function StatusLine({label,value,color}:{label:string;value:string|number;color:string}){return <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",fontSize:11}}><span style={{color:C.muted}}>{label}</span><b style={{color}}>{value}</b></div>}
function Quick({children,onClick}:{children:React.ReactNode;onClick:()=>void}){return <button onClick={onClick} style={{border:`1px solid ${C.line}`,borderRadius:999,padding:"7px 10px",background:C.white,color:C.ink,fontSize:10,fontWeight:800,cursor:"pointer"}}>{children}</button>}
function Tab({children,active,onClick}:{children:React.ReactNode;active:boolean;onClick:()=>void}){return <button onClick={onClick} style={{border:`1px solid ${active?C.burgundy:C.line}`,borderRadius:999,padding:"7px 10px",background:active?"#fff4f5":C.white,color:active?C.burgundy:C.muted,fontSize:10,fontWeight:900,cursor:"pointer"}}>{children}</button>}


function DetailModal({detail,onClose,onOpenSource}:{detail:DetailPanel;onClose:()=>void;onOpenSource:(url:string)=>void}){
  return <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(16,24,40,.62)",backdropFilter:"blur(6px)",display:"grid",placeItems:"center",padding:18}}>
    <section onClick={e=>e.stopPropagation()} style={{width:"min(820px,96vw)",maxHeight:"88vh",overflowY:"auto",borderRadius:24,background:C.white,boxShadow:"0 30px 90px rgba(0,0,0,.28)",border:`1px solid ${C.line}`}}>
      <div style={{padding:"22px 24px",background:`radial-gradient(circle at 86% 18%,${detail.statusColor||C.burgundy}33,transparent 30%),linear-gradient(120deg,#101828,#251018 70%,${C.burgundy})`,color:C.white,borderRadius:"24px 24px 0 0"}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"start"}}>
          <div>
            <div style={{fontSize:10,fontWeight:950,letterSpacing:1.1,opacity:.72}}>{detail.eyebrow}</div>
            <h2 style={{margin:"7px 0 0",fontSize:24,lineHeight:1.15}}>{detail.title}</h2>
          </div>
          <button onClick={onClose} style={{width:34,height:34,borderRadius:99,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.08)",color:"#fff",cursor:"pointer",fontSize:18}}>×</button>
        </div>
        {detail.status&&<div style={{display:"inline-flex",marginTop:13,borderRadius:999,padding:"6px 10px",background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.16)",fontSize:10,fontWeight:950,color:"#fff"}}><span style={{color:detail.statusColor||"#fff",marginRight:6}}>●</span>{detail.status}</div>}
      </div>

      <div style={{padding:22}}>
        {detail.metrics&&detail.metrics.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:9}}>
          {detail.metrics.map((m,i)=><div key={`${m.label}-${i}`} style={{padding:13,borderRadius:14,background:"#f8fafc",border:`1px solid ${C.line}`}}><div style={{fontSize:9,fontWeight:900,color:C.muted}}>{m.label.toUpperCase()}</div><div style={{marginTop:5,fontSize:20,fontWeight:950,color:m.color||C.ink}}>{m.value}</div></div>)}
        </div>}

        <div style={{marginTop:16,padding:16,borderRadius:16,background:C.soft,border:"1px solid #eadde0"}}>
          <div style={{fontSize:10,fontWeight:950,color:C.burgundy}}>DORA DEĞERLENDİRMESİ</div>
          <div style={{marginTop:7,fontSize:13,lineHeight:1.7}}>{detail.description}</div>
        </div>

        {detail.recommendation&&<div style={{marginTop:12,padding:16,borderRadius:16,border:`1px solid ${C.line}`}}>
          <div style={{fontSize:10,fontWeight:950,color:C.green}}>DORA ÖNERİSİ</div>
          <div style={{marginTop:7,fontSize:12,lineHeight:1.65}}>{detail.recommendation}</div>
        </div>}

        {detail.evidence&&detail.evidence.length>0&&<div style={{marginTop:12}}>
          <div style={{fontSize:11,fontWeight:950}}>Kanıtlar / DORA neden böyle düşünüyor?</div>
          <div style={{display:"grid",gap:7,marginTop:9}}>
            {detail.evidence.map((e,i)=><div key={`${i}-${e}`} style={{display:"grid",gridTemplateColumns:"24px minmax(0,1fr)",gap:8,alignItems:"start",padding:"9px 11px",borderRadius:11,background:"#f8fafc",fontSize:11,lineHeight:1.55}}><span style={{width:22,height:22,borderRadius:99,display:"grid",placeItems:"center",background:"#fff4f5",color:C.burgundy,fontWeight:950}}>{i+1}</span><span>{e}</span></div>)}
          </div>
        </div>}

        <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap",marginTop:17,paddingTop:15,borderTop:`1px solid ${C.line}`}}>
          <div style={{fontSize:10,color:C.muted}}>Analiz güveni: <b style={{color:C.ink}}>{detail.confidence||"Veri kapsamına göre"}</b></div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={onClose} style={secondary}>Kapat</button>
            {detail.sourceUrl&&<button onClick={()=>onOpenSource(detail.sourceUrl!)} style={askButton}>Kaynak modülü aç →</button>}
          </div>
        </div>
      </div>
    </section>
  </div>
}

const darkBadge:React.CSSProperties={display:"inline-flex",alignItems:"center",border:"1px solid rgba(255,255,255,.08)",borderRadius:999,padding:"6px 8px",fontSize:8,fontWeight:950,letterSpacing:.4,whiteSpace:"nowrap"};
const card:React.CSSProperties={background:C.white,border:`1px solid ${C.line}`,borderRadius:16,padding:16,boxShadow:"0 3px 12px rgba(16,24,40,.035)",minWidth:0};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"11px 12px",border:`1px solid ${C.line}`,borderRadius:10,background:C.white,fontSize:12,outline:"none"};
const darkButton:React.CSSProperties={border:"none",borderRadius:11,padding:"11px 14px",background:"#101828",color:C.white,fontWeight:900,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"};
const askButton:React.CSSProperties={border:"none",borderRadius:10,padding:"0 15px",background:C.burgundy,color:C.white,fontWeight:900,fontSize:10,cursor:"pointer",whiteSpace:"nowrap"};
const secondary:React.CSSProperties={border:`1px solid ${C.line}`,borderRadius:9,padding:"8px 10px",background:C.white,fontWeight:850,fontSize:10,cursor:"pointer"};
const badge:React.CSSProperties={display:"inline-flex",alignItems:"center",borderRadius:999,padding:"4px 7px",fontSize:9,fontWeight:900,whiteSpace:"nowrap"};
const rank:React.CSSProperties={width:44,height:44,borderRadius:13,display:"grid",placeItems:"center",background:"#fff4f5",color:C.burgundy,fontWeight:950,fontSize:19};
const heroChip:React.CSSProperties={border:"1px solid rgba(255,255,255,.24)",background:"rgba(255,255,255,.09)",borderRadius:999,padding:"6px 9px",fontSize:9,fontWeight:950,letterSpacing:.5};
const heroArrow:React.CSSProperties={opacity:.45,fontSize:11,alignSelf:"center"};
