"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, AlertTriangle, ArrowRight, BookOpenCheck, Building2, CheckCircle2,
  ClipboardCheck, Clock3, Gauge, HeartPulse, RefreshCw, ShieldAlert, ShieldCheck,
  Stethoscope, Target, Users, Wrench, MessageSquareWarning, Siren, BarChart3
} from "lucide-react";
import styles from "./ExecutiveDashboard.module.css";

type Severity = "critical" | "high" | "medium";
type ComponentScore = { key:string; label:string; score:number|null; weight:number; available:boolean };
type Action = { id:string; severity:Severity; title:string; description:string; count:number; href:string; source:string };
type Modules = {
  risk?: { total:number; critical:number; high:number } | null;
  inspection?: { total:number; compliant:number; partial:number } | null;
  dof?: { total:number; closed:number; overdue:number } | null;
  training?: { assigned:number; completed:number } | null;
  incident?: { total:number; lostTime:number; openInvestigations:number } | null;
  health?: { totalEmployees:number; valid:number; overdue:number } | null;
  periodic?: { total:number; valid:number; overdue:number } | null;
  environment?: { total:number; valid:number; overdue:number } | null;
  cbs?: { total:number; open:number; critical:number; slaExceeded:number } | null;
};
type ExecutiveResponse = {
  success:boolean; firmId:string; generatedAt:string;
  performance:{ score:number|null; coverage:number; grade:string; components:ComponentScore[] };
  priorityActions:Action[]; modules:Modules;
  integrity:{ syntheticTrend:boolean; syntheticRiskMatrix:boolean; sensitiveHealthData:boolean; doraIncluded:boolean };
  error?:string;
};

const pct=(a:number,b:number)=>b>0?Math.round((a/b)*100):null;
const display=(v:number|null|undefined,suffix="")=>v==null?"Veri yok":`${v}${suffix}`;
const state=(v:number|null, good=85, warn=70)=>v==null?"neutral":v>=good?"good":v>=warn?"warning":"critical";

export default function AdminDashboardPage(){
  const [data,setData]=useState<ExecutiveResponse|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [firmName,setFirmName]=useState("Aktif Firma");

  const load=useCallback(async()=>{
    setLoading(true); setError("");
    try{
      const [r,me]=await Promise.all([
        fetch("/api/admin/dashboard/executive",{cache:"no-store"}),
        fetch("/api/admin/me",{cache:"no-store"}).catch(()=>null),
      ]);
      const j=await r.json();
      if(!r.ok||!j.success) throw new Error(j.error||"Dashboard verileri alınamadı.");
      setData(j);
      if(me?.ok){
        const m=await me.json();
        const n=m?.user?.company_name||m?.company?.name||m?.activeCompany?.name;
        if(n) setFirmName(String(n));
      }
    }catch(e){setError(e instanceof Error?e.message:"Dashboard yüklenemedi.");}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{void load();},[load]);

  const m=data?.modules;
  const trainingRate=pct(m?.training?.completed??0,m?.training?.assigned??0);
  const inspectionRate=m?.inspection?.total
    ?Math.round((((m.inspection.compliant??0)+(m.inspection.partial??0)*.5)/m.inspection.total)*100):null;
  const healthRate=pct(m?.health?.valid??0,m?.health?.totalEmployees??0);
  const periodicRate=pct(m?.periodic?.valid??0,m?.periodic?.total??0);
  const dofRate=pct(m?.dof?.closed??0,m?.dof?.total??0);

  const cards=useMemo(()=>[
    {label:"Kritik Risk",value:m?.risk?.critical??null,sub:m?.risk?`${m.risk.high} yüksek · ${m.risk.total} toplam`:"Risk verisi yok",icon:ShieldAlert,href:"/admin/risk",tone:(m?.risk?.critical??0)>0?"critical":"good"},
    {label:"Açık / Geciken DÖF",value:m?.dof?Math.max(0,m.dof.total-m.dof.closed):null,sub:m?.dof?`${m.dof.overdue} termin aşımı`:"DÖF verisi yok",icon:Target,href:"/admin/denetimler?tab=dof&status=open#dof",tone:(m?.dof?.overdue??0)>0?"critical":"good"},
    {label:"Eğitim Uyumu",value:trainingRate==null?null:`%${trainingRate}`,sub:m?.training?`${m.training.completed}/${m.training.assigned} tamamlandı`:"Eğitim verisi yok",icon:BookOpenCheck,href:"/admin/trainings",tone:state(trainingRate)},
    {label:"Denetim Uyumu",value:inspectionRate==null?null:`%${inspectionRate}`,sub:m?.inspection?`${m.inspection.total} kontrol maddesi`:"Denetim verisi yok",icon:ClipboardCheck,href:"/admin/denetimler",tone:state(inspectionRate)},
    {label:"Sağlık Gözetimi",value:healthRate==null?null:`%${healthRate}`,sub:m?.health?`${m.health.overdue} süresi geçmiş`:"Sağlık verisi yok",icon:Stethoscope,href:"/admin/health",tone:(m?.health?.overdue??0)>0?"warning":state(healthRate)},
    {label:"Kaza / Olay",value:m?.incident?.total??null,sub:m?.incident?`${m.incident.lostTime} kayıp günlü olay`:"Kaza/olay verisi yok",icon:Siren,href:"/admin/accidents",tone:(m?.incident?.lostTime??0)>0?"critical":"neutral"},
    {label:"Periyodik Kontrol",value:periodicRate==null?null:`%${periodicRate}`,sub:m?.periodic?`${m.periodic.overdue} gecikmiş`:"Periyodik kontrol verisi yok",icon:Wrench,href:"/admin/documentation/periodic-controls",tone:(m?.periodic?.overdue??0)>0?"warning":state(periodicRate)},
    {label:"ÇBS / SLA",value:m?.cbs?.open??null,sub:m?.cbs?`${m.cbs.slaExceeded} SLA aşımı · ${m.cbs.critical} kritik`:"ÇBS verisi yok",icon:MessageSquareWarning,href:"/admin/cbs",tone:(m?.cbs?.slaExceeded??0)>0?"critical":"neutral"},
  ],[m,trainingRate,inspectionRate,healthRate,periodicRate]);

  if(loading) return <div className={styles.loading}><div className={styles.spinner}/><strong>D-SEC Yönetim Merkezi hazırlanıyor</strong><span>Aktif firmanın HSE verileri analiz ediliyor.</span></div>;
  if(error) return <div className={styles.error}><AlertTriangle/><div><strong>Dashboard yüklenemedi</strong><p>{error}</p></div><button onClick={load}><RefreshCw size={16}/>Yeniden dene</button></div>;
  if(!data) return null;

  const score=data.performance.score;
  const grade=data.performance.grade;
  const actions=data.priorityActions||[];

  return <main className={styles.page}>
    <section className={styles.topbar}>
      <div>
        <div className={styles.eyebrow}><ShieldCheck size={15}/> D-SEC · EXECUTIVE HSE COMMAND CENTER</div>
        <h1>İş Sağlığı ve Güvenliği Genel Görünümü</h1>
        <p>Riskleri, yasal uyumu ve operasyonel öncelikleri tek yönetim ekranından izleyin.</p>
      </div>
      <div className={styles.topActions}>
        <div className={styles.company}><Building2 size={17}/><span><small>Aktif firma</small><b>{firmName}</b></span></div>
        <button className={styles.refresh} onClick={load}><RefreshCw size={17}/> Yenile</button>
      </div>
    </section>

    <section className={styles.hero}>
      <div className={styles.scoreBlock}>
        <div className={styles.scoreRing} style={{"--score":score??0} as React.CSSProperties}>
          <div><strong>{score??"—"}</strong><span>/100</span></div>
        </div>
        <div className={styles.scoreCopy}>
          <span>D-SEC HSE PERFORMANCE INDEX</span>
          <h2>{score==null?"Henüz yeterli veri yok":grade==="A"?"Güçlü HSE performansı":grade==="B"?"Kontrollü HSE performansı":grade==="C"?"Gelişim gerektiren performans":"Yönetim müdahalesi gerekli"}</h2>
          <p>Skor yalnız mevcut ve doğrulanabilir modül verilerinden hesaplanır. Veri bulunmayan alanlar sıfır kabul edilmez.</p>
        </div>
      </div>
      <div className={styles.heroFacts}>
        <div><span>Veri kapsama</span><strong>{data.performance.coverage}%</strong><small>Skora katılan veri ağırlığı</small></div>
        <div><span>Kritik öncelik</span><strong>{actions.filter(x=>x.severity==="critical").length}</strong><small>Bugün değerlendirilmesi gereken konu</small></div>
        <div><span>Aktif aksiyon</span><strong>{actions.length}</strong><small>Öncelik motorunun ürettiği aksiyon</small></div>
      </div>
    </section>

    <section>
      <div className={styles.sectionHead}><div><span>YÖNETİM GÖSTERGELERİ</span><h2>HSE performansının anlık fotoğrafı</h2></div><small>Gerçek kayıtlar · Aktif firma UUID</small></div>
      <div className={styles.kpis}>{cards.map((c)=>{
        const Icon=c.icon;
        return <Link href={c.href} key={c.label} className={`${styles.kpi} ${styles[c.tone]}`}>
          <div className={styles.kpiTop}><span className={styles.icon}><Icon size={20}/></span><ArrowRight size={16}/></div>
          <span>{c.label}</span><strong>{c.value??"—"}</strong><small>{c.sub}</small>
        </Link>;
      })}</div>
    </section>

    <section className={styles.grid}>
      <div className={styles.panel}>
        <div className={styles.panelHead}><div><span>ÖNCELİKLİ YÖNETİM AKSİYONLARI</span><h2>Bugün müdahale gerektirenler</h2></div><Activity size={22}/></div>
        {actions.length===0?<div className={styles.empty}><CheckCircle2/><strong>Kritik aksiyon görünmüyor</strong><span>Mevcut verilerde öncelik motorunu tetikleyen açık konu bulunamadı.</span></div>:
        <div className={styles.actionList}>{actions.map((a,i)=><Link href={a.href} className={styles.action} key={a.id}>
          <div className={`${styles.severity} ${styles[a.severity]}`}>{i+1}</div>
          <div><div className={styles.actionTitle}><strong>{a.title}</strong><span>{a.source}</span></div><p>{a.description}</p></div>
          <b className={styles.count}>{a.count}</b><ArrowRight size={17}/>
        </Link>)}</div>}
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHead}><div><span>SKOR BİLEŞENLERİ</span><h2>Performansı ne belirliyor?</h2></div><Gauge size={22}/></div>
        <div className={styles.components}>{data.performance.components.map(c=><div key={c.key} className={styles.component}>
          <div><span>{c.label}</span><b>{c.score==null?"Veri yok":`${c.score}/100`}</b></div>
          <div className={styles.track}><i style={{width:`${c.score??0}%`}}/></div>
          <small>Ağırlık %{c.weight}</small>
        </div>)}</div>
      </div>
    </section>

    <section className={styles.bottomGrid}>
      <div className={styles.panel}>
        <div className={styles.panelHead}><div><span>UYUM MERKEZİ</span><h2>Yasal ve operasyonel takip</h2></div><Clock3 size={22}/></div>
        <div className={styles.compliance}>
          <Compliance icon={BookOpenCheck} label="Eğitim" value={trainingRate} detail={m?.training?`${m.training.completed}/${m.training.assigned}`:"Veri yok"} href="/admin/trainings"/>
          <Compliance icon={HeartPulse} label="Sağlık" value={healthRate} detail={m?.health?`${m.health.overdue} gecikmiş`:"Veri yok"} href="/admin/health"/>
          <Compliance icon={Wrench} label="Periyodik Kontrol" value={periodicRate} detail={m?.periodic?`${m.periodic.overdue} gecikmiş`:"Veri yok"} href="/admin/documentation/periodic-controls"/>
          <Compliance icon={Target} label="DÖF Kapanma" value={dofRate} detail={m?.dof?`${m.dof.overdue} termin aşımı`:"Veri yok"} href="/admin/denetimler?tab=dof&status=open#dof"/>
        </div>
      </div>
      <div className={`${styles.panel} ${styles.integrity}`}>
        <div className={styles.panelHead}><div><span>VERİ GÜVENİ</span><h2>Dashboard bütünlük kontrolü</h2></div><ShieldCheck size={22}/></div>
        <Integrity ok={!data.integrity.syntheticTrend} text="Sahte trend üretilmiyor"/>
        <Integrity ok={!data.integrity.syntheticRiskMatrix} text="Yapay risk matrisi kullanılmıyor"/>
        <Integrity ok={!data.integrity.sensitiveHealthData} text="Hassas sağlık verisi gösterilmiyor"/>
        <Integrity ok={!data.integrity.doraIncluded} text="DORA bu kapsamın dışında"/>
        <div className={styles.generated}><BarChart3 size={16}/> Son üretim: {new Date(data.generatedAt).toLocaleString("tr-TR")}</div>
      </div>
    </section>
  </main>;
}

function Compliance({icon:Icon,label,value,detail,href}:{icon:any;label:string;value:number|null;detail:string;href:string}){
  return <Link href={href} className={styles.complianceRow}><span className={styles.icon}><Icon size={18}/></span><div><b>{label}</b><small>{detail}</small></div><div className={styles.miniTrack}><i style={{width:`${value??0}%`}}/></div><strong>{display(value,"%")}</strong><ArrowRight size={15}/></Link>
}
function Integrity({ok,text}:{ok:boolean;text:string}){return <div className={styles.integrityRow}>{ok?<CheckCircle2 size={18}/>:<AlertTriangle size={18}/>}<span>{text}</span></div>}
