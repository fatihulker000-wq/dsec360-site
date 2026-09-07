"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, AlertTriangle, ArrowRight, BookOpenCheck, Building2, CheckCircle2,
  ClipboardCheck, Clock3, Gauge, HeartPulse, RefreshCw, ShieldAlert, ShieldCheck,
  Stethoscope, Target, Wrench, MessageSquareWarning, Siren, BarChart3, ChevronDown,
  CalendarDays, DatabaseZap
} from "lucide-react";
import styles from "./ExecutiveDashboard.module.css";

type Severity="critical"|"high"|"medium";
type ComponentScore={key:string;label:string;score:number|null;weight:number;weightedScore?:number|null;normalizedContribution?:number|null;available:boolean};
type Action={id:string;severity:Severity;title:string;description:string;count:number;href:string;source:string};
type Firm={id:string;name:string;localFirmId:number|null;hazardClass?:string;isPrimary?:boolean};
type Modules={
  risk?:{total:number;critical:number;high:number}|null;
  inspection?:{total:number;compliant:number;partial:number}|null;
  dof?:{total:number;closed:number;overdue:number}|null;
  training?:{totalEmployees:number;compliantEmployees:number;nonCompliantEmployees:number;requiredMinutes:number;hazardClass:string}|null;
  incident?:{total:number;lostTime:number;openInvestigations:number}|null;
  health?:{totalEmployees:number;valid:number;approaching:number;overdue:number;missing:number;ek2Employees:number}|null;
  periodic?:{total:number;valid:number;overdue:number}|null;
  environment?:{total:number;valid:number;overdue:number}|null;
  cbs?:{total:number;open:number;critical:number;slaExceeded:number;actionRequired?:number}|null;
};
type ExecutiveResponse={
  success:boolean;firmId:string;firm:{id:string;name:string;localFirmId:number|null;hazardClass:string};generatedAt:string;period:{key:string;days:number};
  performance:{score:number|null;coverage:number;grade:string;components:ComponentScore[];availableComponents:number;totalComponents:number;formula?:string};
  priorityActions:Action[];modules:Modules;
  trend?:{periodDays:number;inspection:{current:number;previous:number;delta:number};incident:{current:number;previous:number;delta:number}};
  integrity:{tenantVerified:boolean;strictFirmIsolation?:boolean;syntheticTrend:boolean;syntheticRiskMatrix:boolean;sensitiveHealthData:boolean;doraIncluded:boolean};error?:string;
};

const pct=(a:number,b:number)=>b>0?Math.round((a/b)*100):null;
const display=(v:number|null|undefined,suffix="")=>v==null?"Veri yok":`${v}${suffix}`;
const state=(v:number|null,good=85,warn=70)=>v==null?"neutral":v>=good?"good":v>=warn?"warning":"critical";
const PERIODS=[{value:"7d",label:"Son 7 Gün"},{value:"30d",label:"Son 30 Gün"},{value:"90d",label:"Son 3 Ay"},{value:"180d",label:"Son 6 Ay"},{value:"365d",label:"Son 12 Ay"}];

const readJsonResponse=async<T,>(response:Response,context:string):Promise<T>=>{
  const contentType=response.headers.get("content-type")||"";
  const raw=await response.text();

  if(!raw.trim()){
    throw new Error(`${context}: Sunucu boş yanıt döndürdü (HTTP ${response.status}).`);
  }

  if(!contentType.toLowerCase().includes("application/json")){
    const preview=raw.replace(/\s+/g," ").trim().slice(0,180);
    throw new Error(
      `${context}: JSON yerine geçersiz yanıt alındı (HTTP ${response.status})${preview?` · ${preview}`:""}.`
    );
  }

  try{
    return JSON.parse(raw) as T;
  }catch{
    const preview=raw.replace(/\s+/g," ").trim().slice(0,180);
    throw new Error(
      `${context}: Sunucudan bozuk JSON yanıtı geldi (HTTP ${response.status})${preview?` · ${preview}`:""}.`
    );
  }
};

export default function AdminDashboardPage(){
  const [data,setData]=useState<ExecutiveResponse|null>(null);
  const [firms,setFirms]=useState<Firm[]>([]);
  const [activeFirmId,setActiveFirmId]=useState("");
  const [period,setPeriod]=useState("30d");
  const [loading,setLoading]=useState(true);
  const [switching,setSwitching]=useState(false);
  const [error,setError]=useState("");

  const loadFirmContext=useCallback(async()=>{
    const r=await fetch("/api/admin/dashboard/firm-context",{cache:"no-store"});
    const j=await readJsonResponse<{success:boolean;firms?:Firm[];activeFirmId?:string;error?:string}>(r,"Firma bağlamı");
    if(!r.ok||!j.success) throw new Error(j.error||`Firma bağlamı alınamadı (HTTP ${r.status}).`);
    setFirms(Array.isArray(j.firms)?j.firms:[]);
    setActiveFirmId(String(j.activeFirmId||""));
    return String(j.activeFirmId||"");
  },[]);

  const load=useCallback(async(firmOverride?:string)=>{
    setLoading(true);setError("");
    try{
      const firm=firmOverride||activeFirmId||await loadFirmContext();
      if(!firm) throw new Error("Aktif firma seçilemedi.");
      const r=await fetch(`/api/admin/dashboard/executive?period=${encodeURIComponent(period)}&firmId=${encodeURIComponent(firm)}`,{cache:"no-store"});
      const j=await readJsonResponse<ExecutiveResponse>(r,"Dashboard API");
      if(!r.ok||!j.success) throw new Error(j.error||`Dashboard verileri alınamadı (HTTP ${r.status}).`);
      if(j.firmId!==firm) throw new Error("Firma doğrulama hatası: Dashboard farklı firma UUID'si döndürdü.");
      setData(j);
    }catch(e){setError(e instanceof Error?e.message:"Dashboard yüklenemedi.");}
    finally{setLoading(false);}
  },[activeFirmId,loadFirmContext,period]);

  useEffect(()=>{void load();},[period]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchFirm=async(nextFirmId:string)=>{
    if(!nextFirmId||nextFirmId===activeFirmId)return;
    setSwitching(true);setError("");
    try{
      const r=await fetch("/api/admin/dashboard/firm-context",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({firmId:nextFirmId})});
      const j=await readJsonResponse<{success:boolean;activeFirmId?:string;error?:string}>(r,"Firma değiştirme");
      if(!r.ok||!j.success)throw new Error(j.error||`Firma değiştirilemedi (HTTP ${r.status}).`);
      setActiveFirmId(nextFirmId);
      await load(nextFirmId);
    }catch(e){setError(e instanceof Error?e.message:"Firma değiştirilemedi.");}
    finally{setSwitching(false);}
  };

  const m=data?.modules;
  const trainingRate=m?.training?pct(m.training.compliantEmployees,m.training.totalEmployees):null;
  const inspectionRate=m?.inspection?.total?Math.round((((m.inspection.compliant??0)+(m.inspection.partial??0)*.5)/m.inspection.total)*100):null;
  const healthRate=m?.health?pct(m.health.valid,m.health.totalEmployees):null;
  const periodicRate=m?.periodic?pct(m.periodic.valid,m.periodic.total):null;
  const dofRate=m?.dof?pct(m.dof.closed,m.dof.total):null;

  const cards=useMemo(()=>[
    {label:"Yüksek / Kabul Edilemez Risk",value:m?.risk?(m.risk.critical+m.risk.high):null,sub:m?.risk?`${m.risk.critical} kabul edilemez · ${m.risk.high} yüksek · ${m.risk.total} toplam`:"Risk kaydı yok",icon:ShieldAlert,href:"/admin/risk",tone:((m?.risk?.critical??0)+(m?.risk?.high??0))>0?"critical":"good"},
    {label:"Açık / Geciken DÖF",value:m?.dof?Math.max(0,m.dof.total-m.dof.closed):0,sub:m?.dof?`${m.dof.overdue} termin aşımı · ${m.dof.closed}/${m.dof.total} kapalı`:"0 kayıt · açık DÖF bulunmuyor",icon:Target,href:"/admin/denetimler?tab=dof&status=open#dof",tone:(m?.dof?.overdue??0)>0?"critical":"good"},
    {label:"Yasal Eğitim Uyumu",value:trainingRate==null?null:`%${trainingRate}`,sub:m?.training?`${m.training.compliantEmployees}/${m.training.totalEmployees} çalışan uygun · ${m.training.hazardClass}`:"Yasal eğitim verisi yok",icon:BookOpenCheck,href:"/admin/trainings",tone:state(trainingRate)},
    {label:"Denetim Uyumu",value:inspectionRate==null?0:`%${inspectionRate}`,sub:m?.inspection?`${m.inspection.total} kontrol maddesi · önceki döneme göre ${data?.trend?.inspection?.delta===undefined?"—":data.trend.inspection.delta>=0?`+${data.trend.inspection.delta}`:data.trend.inspection.delta}`:"0 kayıt · seçili dönemde denetim yok",icon:ClipboardCheck,href:"/admin/denetimler",tone:state(inspectionRate)},
    {label:"Sağlık Gözetimi",value:healthRate==null?null:`%${healthRate}`,sub:m?.health?`${m.health.overdue} geçmiş · ${m.health.missing} tarih/veri eksik · ${m.health.approaching} yaklaşıyor`:"Sağlık verisi yok",icon:Stethoscope,href:"/admin/health",tone:(m?.health?.overdue??0)>0?"critical":(m?.health?.missing??0)>0?"warning":state(healthRate)},
    {label:"Kaza / Olay",value:m?.incident?.total??0,sub:m?.incident?`${m.incident.lostTime} kayıp günlü · önceki döneme göre ${data?.trend?.incident?.delta===undefined?"—":data.trend.incident.delta>=0?`+${data.trend.incident.delta}`:data.trend.incident.delta}`:"0 kayıt · seçili dönemde kaza/olay yok",icon:Siren,href:"/admin/accidents",tone:(m?.incident?.lostTime??0)>0?"critical":"neutral"},
    {label:"Periyodik Kontrol",value:periodicRate==null?null:`%${periodicRate}`,sub:m?.periodic?`${m.periodic.overdue} gecikmiş · ${m.periodic.valid}/${m.periodic.total} geçerli`:"Periyodik kontrol verisi yok",icon:Wrench,href:"/admin/documentation/periodic-controls",tone:(m?.periodic?.overdue??0)>0?"warning":state(periodicRate)},
    {label:"ÇBS / SLA",value:m?.cbs?(m.cbs.actionRequired??m.cbs.open):0,sub:m?.cbs?`${m.cbs.slaExceeded} SLA aşımı · ${m.cbs.critical} kritik · ${m.cbs.open} açık`:"0 kayıt · aksiyon gerektiren ÇBS yok",icon:MessageSquareWarning,href:"/admin/cbs",tone:(m?.cbs?.slaExceeded??0)>0?"critical":"neutral"},
  ],[m,trainingRate,inspectionRate,healthRate,periodicRate]);

  if(loading&&!data)return <div className={styles.loading}><div className={styles.spinner}/><strong>D-SEC Yönetim Merkezi hazırlanıyor</strong><span>Aktif firmanın HSE verileri analiz ediliyor.</span></div>;
  if(error&&!data)return <div className={styles.error}><AlertTriangle/><div><strong>Dashboard yüklenemedi</strong><p>{error}</p></div><button onClick={()=>void load()}><RefreshCw size={16}/>Yeniden dene</button></div>;
  if(!data)return null;

  const score=data.performance.score;const grade=data.performance.grade;const actions=data.priorityActions||[];
  const currentFirm=firms.find(x=>x.id===activeFirmId)||{id:data.firm.id,name:data.firm.name,localFirmId:data.firm.localFirmId};

  return <main className={styles.page}>
    <section className={styles.topbar}>
      <div><div className={styles.eyebrow}><ShieldCheck size={15}/> D-SEC · EXECUTIVE HSE COMMAND CENTER</div><h1>İş Sağlığı ve Güvenliği Genel Görünümü</h1><p>Riskleri, yasal uyumu ve operasyonel öncelikleri tek yönetim ekranından izleyin.</p></div>
      <div className={styles.topActions}>
        <label className={styles.selectBox}><Building2 size={17}/><span><small>Aktif firma</small><select value={activeFirmId} onChange={e=>void switchFirm(e.target.value)} disabled={switching}>{firms.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></span><ChevronDown size={15}/></label>
        <label className={styles.selectBox}><CalendarDays size={17}/><span><small>Operasyon dönemi</small><select value={period} onChange={e=>setPeriod(e.target.value)}>{PERIODS.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></span><ChevronDown size={15}/></label>
        <button className={styles.refresh} onClick={()=>void load()} disabled={loading||switching}><RefreshCw size={17} className={loading?styles.spin:""}/> Yenile</button>
      </div>
    </section>
    {error&&<div className={styles.inlineError}><AlertTriangle size={16}/>{error}</div>}

    <section className={styles.hero}>
      <div className={styles.scoreBlock}><div className={styles.scoreRing} style={{"--score":score??0} as React.CSSProperties}><div><strong>{score??"—"}</strong><span>/100</span></div></div><div className={styles.scoreCopy}><span>D-SEC HSE PERFORMANCE INDEX</span><h2>{score==null?"Henüz yeterli veri yok":grade==="A"?"Güçlü HSE performansı":grade==="B"?"Kontrollü HSE performansı":grade==="C"?"Gelişim gerektiren performans":"Yönetim müdahalesi gerekli"}</h2><p>Skor yalnız doğrulanabilir firma verilerinden hesaplanır. Yasal eğitim tehlike sınıfı ve geçerlilik süresine göre; sağlık göstergesi geçerli muayene kapsamına göre değerlendirilir.</p><div className={styles.heroFirm}><Building2 size={14}/>{currentFirm.name}<span>•</span><code>{data.firmId.slice(0,8)}…</code></div></div></div>
      <div className={styles.heroFacts}>
        <div><span>Veri kapsamı</span><strong>{data.performance.coverage}%</strong><small>{data.performance.availableComponents}/{data.performance.totalComponents} skor bileşeni hesaplanabiliyor</small></div>
        <div><span>Kritik öncelik</span><strong>{actions.filter(x=>x.severity==="critical").length}</strong><small>Yönetimin bugün değerlendirmesi gereken başlık</small></div>
        <div><span>Aktif aksiyon</span><strong>{actions.length}</strong><small>Öncelik motorunun ürettiği aksiyon başlığı</small></div>
      </div>
    </section>

    <section><div className={styles.sectionHead}><div><span>YÖNETİM GÖSTERGELERİ</span><h2>HSE performansının anlık fotoğrafı</h2></div><small><DatabaseZap size={14}/> Firma UUID doğrulandı · {PERIODS.find(x=>x.value===period)?.label}</small></div><div className={styles.kpis}>{cards.map(c=>{const Icon=c.icon;return <Link href={c.href} key={c.label} className={`${styles.kpi} ${styles[c.tone]}`}><div className={styles.kpiTop}><span className={styles.icon}><Icon size={20}/></span><ArrowRight size={16}/></div><span>{c.label}</span><strong>{c.value??"Veri yok"}</strong><small>{c.sub}</small></Link>})}</div></section>

    <section className={styles.grid}>
      <div className={styles.panel}><div className={styles.panelHead}><div><span>ÖNCELİKLİ YÖNETİM AKSİYONLARI</span><h2>Bugün müdahale gerektirenler</h2></div><Activity size={22}/></div>{actions.length===0?<div className={styles.empty}><CheckCircle2/><strong>Kritik aksiyon görünmüyor</strong><span>Mevcut verilerde öncelik motorunu tetikleyen açık konu bulunamadı.</span></div>:<div className={styles.actionList}>{actions.map((a,i)=><Link href={a.href} className={styles.action} key={a.id}><div className={`${styles.severity} ${styles[a.severity]}`}>{i+1}</div><div><div className={styles.actionTitle}><strong>{a.title}</strong><span>{a.source}</span></div><p>{a.description}</p></div><b className={styles.count}>{a.count}</b><ArrowRight size={17}/></Link>)}</div>}</div>
      <div className={styles.panel}><div className={styles.panelHead}><div><span>SKOR BİLEŞENLERİ</span><h2>Performansı ne belirliyor?</h2></div><Gauge size={22}/></div><div className={styles.formulaNote}>HSE skoru, veri bulunan bileşenlerin ağırlıkları kendi içinde normalize edilerek hesaplanır. Veri olmayan modül sıfır puan sayılmaz.</div><div className={styles.components}>{data.performance.components.map(c=><div key={c.key} className={styles.component}><div><span>{c.label}</span><b>{c.score==null?"Veri yok":`${c.score}/100`}</b></div><div className={styles.track}><i style={{width:`${c.score??0}%`}}/></div><small>{c.available?`Ağırlık %${c.weight} · toplam HSE skoruna +${(c.normalizedContribution??0).toLocaleString("tr-TR")} puan katkı`:`Ağırlık %${c.weight} · veri bekleniyor · skorda sıfır sayılmadı`}</small></div>)}</div></div>
    </section>

    <section className={styles.bottomGrid}>
      <div className={styles.panel}><div className={styles.panelHead}><div><span>UYUM MERKEZİ</span><h2>Yasal ve operasyonel takip</h2></div><Clock3 size={22}/></div><div className={styles.compliance}>
        <Compliance icon={BookOpenCheck} label="Yasal Eğitim" value={trainingRate} detail={m?.training?`${m.training.compliantEmployees}/${m.training.totalEmployees} uygun · ${Math.round(m.training.requiredMinutes/60)} saat / ${m.training.hazardClass}`:"Veri yok"} href="/admin/trainings"/>
        <Compliance icon={HeartPulse} label="Sağlık" value={healthRate} detail={m?.health?`${m.health.overdue} geçmiş · ${m.health.missing} eksik · ${m.health.ek2Employees} EK-2`:"Veri yok"} href="/admin/health"/>
        <Compliance icon={Wrench} label="Periyodik Kontrol" value={periodicRate} detail={m?.periodic?`${m.periodic.overdue} gecikmiş`:"Veri yok"} href="/admin/documentation/periodic-controls"/>
        <Compliance icon={Target} label="DÖF Kapanma" value={dofRate} detail={m?.dof?`${m.dof.overdue} termin aşımı`:"Veri yok"} href="/admin/denetimler?tab=dof&status=open#dof"/>
        <Compliance icon={ClipboardCheck} label="Denetim" value={inspectionRate} detail={m?.inspection?`${m.inspection.total} kontrol maddesi`:"Veri yok"} href="/admin/denetimler"/>
      </div></div>
      <div className={`${styles.panel} ${styles.integrity}`}><div className={styles.panelHead}><div><span>VERİ GÜVENİ</span><h2>Dashboard bütünlük kontrolü</h2></div><ShieldCheck size={22}/></div><Integrity ok={data.integrity.tenantVerified} text="Aktif firma UUID'si sunucu tarafında doğrulandı"/><Integrity ok={data.integrity.strictFirmIsolation!==false} text="Firma sorgularında global / firma adı fallback kullanılmıyor"/><Integrity ok={!data.integrity.syntheticTrend} text="Sahte trend üretilmiyor"/><Integrity ok={!data.integrity.syntheticRiskMatrix} text="Yapay risk matrisi kullanılmıyor"/><Integrity ok={!data.integrity.sensitiveHealthData} text="Hassas sağlık verisi gösterilmiyor"/><Integrity ok={!data.integrity.doraIncluded} text="DORA bu kapsamın dışında"/><div className={styles.generated}><BarChart3 size={16}/> Son üretim: {new Date(data.generatedAt).toLocaleString("tr-TR")}</div></div>
    </section>
  </main>;
}

function Compliance({icon:Icon,label,value,detail,href}:{icon:any;label:string;value:number|null;detail:string;href:string}){return <Link href={href} className={styles.complianceRow}><span className={styles.icon}><Icon size={18}/></span><div><b>{label}</b><small>{detail}</small></div><div className={styles.miniTrack}><i style={{width:`${value??0}%`}}/></div><strong>{display(value,"%")}</strong><ArrowRight size={15}/></Link>}
function Integrity({ok,text}:{ok:boolean;text:string}){return <div className={styles.integrityRow}>{ok?<CheckCircle2 size={18}/>:<AlertTriangle size={18}/>}<span>{text}</span></div>}
