import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { calculateHsePerformance } from "@/app/admin/dashboard/lib/hse-performance-engine";
import { buildPriorityActions } from "@/app/admin/dashboard/lib/priority-action-engine";
import type { ScoreInput } from "@/app/admin/dashboard/lib/executive-dashboard-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const clean=(v:unknown)=>String(v??"").trim();
const lower=(v:unknown)=>clean(v).toLocaleLowerCase("tr-TR");
const validUuid=(v:unknown)=>UUID_RE.test(clean(v))?clean(v):"";
const num=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)?n:0};
const DAY=24*60*60*1000;

function db(){
  const url=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) throw new Error("Supabase yapılandırması eksik.");
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

async function session(){
  const c=await cookies();
  const auth=clean(c.get("dsec_admin_auth")?.value||c.get("dsec_user_auth")?.value);
  const role=clean(c.get("dsec_admin_role")?.value||c.get("dsec_user_role")?.value).toLowerCase();
  const firmId=validUuid(c.get("dsec_company_id")?.value);
  if(auth!=="ok"||!["super_admin","company_admin","demo_user"].includes(role)||!firmId) return null;
  return {role,firmId};
}

const isClosed=(v:unknown)=>["closed","resolved","rejected","duplicate","cancelled","tamamlandi","tamamlandı","closed_ok","completed"].includes(lower(v));
const isTrainingCompleted=(r:any)=>{
  const s=clean(r?.status).toLocaleUpperCase("tr-TR");
  return ["COMPLETED","TAMAMLANDI","BAŞARILI","BASARILI","PASSED"].includes(s)||Boolean(r?.completed_at)||(r?.watch_completed===true&&r?.final_exam_passed===true);
};
function completionDate(r:any){
  const raw=r?.completed_at||r?.started_at||r?.created_at||null;
  if(!raw) return null;
  const d=new Date(raw); return Number.isNaN(d.getTime())?null:d;
}
function normalizeHazard(v:unknown){return clean(v).toLocaleUpperCase("tr-TR").replace(/\s+/g," ")}
function trainingRule(v:unknown){
  const h=normalizeHazard(v);
  if(h.includes("ÇOK TEHLİKELİ")||h.includes("COK TEHLIKELI")) return {minutes:960,years:1,label:"Çok Tehlikeli"};
  if(h.includes("AZ TEHLİKELİ")||h.includes("AZ TEHLIKELI")) return {minutes:480,years:3,label:"Az Tehlikeli"};
  if(h.includes("TEHLİKELİ")||h.includes("TEHLIKELI")) return {minutes:720,years:2,label:"Tehlikeli"};
  return {minutes:0,years:0,label:"Belirsiz"};
}
function matrixLevel(score:number){if(score>=25)return "INTOLERABLE";if(score>=20)return "VERY_HIGH";if(score>=15)return "HIGH";if(score>=8)return "MEDIUM";return "LOW";}
function fineKinneyLevel(score:number){if(score>=400)return "INTOLERABLE";if(score>=200)return "VERY_HIGH";if(score>=70)return "HIGH";if(score>=20)return "MEDIUM";return "LOW";}
function resultRequiresDof(raw:unknown){
  const v=clean(raw).toLocaleUpperCase("tr-TR");
  if(["UYGUNSUZ","KISMEN","KISMEN UYGUN","KISMEN_UYGUN","KISMEN UYGUNDUR","KISMEN UYGUN DEĞİL","KISMEN UYGUN DEGIL"].includes(v))return true;
  if(v.includes("YETERSİZ")||v.includes("YETERSIZ")||v.includes("EKSİK")||v.includes("EKSIK"))return true;
  if(v.startsWith("SCORE:")){const n=Number(v.replace("SCORE:",""));return Number.isFinite(n)&&n<100;}
  if(v.startsWith("ELMERI:")){const p=v.split(":");const wrong=Number(p[2]||0);return Number.isFinite(wrong)&&wrong>0;}
  return false;
}
function inspectionDofStatus(x:any){
  const s=clean(x?.dof_status||x?.dofStatus).toLocaleUpperCase("tr-TR");
  if(["CLOSED","KAPALI","TAMAMLANDI","COMPLETED","DONE"].includes(s))return "CLOSED";
  if(["OPEN","IN_PROGRESS","AÇIK","ACIK","DEVAM_EDIYOR","DEVAM EDİYOR"].includes(s))return "OPEN";
  return resultRequiresDof(x?.result)?"OPEN":"NONE";
}
function riskHasDof(x:any){
  const status=clean(x?.dof_status);
  const due=x?.dof_due_date_millis??x?.dof_due_date??x?.dof_due_at??x?.corrective_action_due_date??x?.action_due_date??x?.capa_due_date??null;
  const action=clean(x?.corrective_action)||clean(x?.action_plan)||clean(x?.dof_action)||clean(x?.capa_action)||clean(x?.measure)||clean(x?.onlem);
  return Boolean(status||due||action);
}
function riskDofStatus(x:any){
  if(!riskHasDof(x)) return "NONE";
  const s=clean(x?.dof_status).toLocaleUpperCase("tr-TR");
  return ["CLOSED","KAPALI","TAMAMLANDI","COMPLETED","DONE"].includes(s)?"CLOSED":"OPEN";
}
function dofDueOf(x:any){return x?.dof_due_date_millis??x?.dof_due_date??x?.dof_due_at??x?.corrective_action_due_date??x?.action_due_date??x?.capa_due_date??null;}
function toMillis(raw:any){if(raw==null||raw==="")return null;const n=Number(raw);if(Number.isFinite(n)&&n>1e11)return n;const t=new Date(raw).getTime();return Number.isFinite(t)?t:null;}
function legallyValid(row:any,years:number,now:Date){
  if(!isTrainingCompleted(row)||years<=0) return false;
  const d=completionDate(row); if(!d) return false;
  const until=new Date(d); until.setFullYear(until.getFullYear()+years);
  return until>=now;
}
async function safe<T>(promise:PromiseLike<{data:T|null;error:any}>):Promise<T|null>{
  try{const r=await promise;if(r.error){console.error("Executive dashboard source error:",r.error);return null}return r.data}
  catch(e){console.error("Executive dashboard source exception:",e);return null}
}
function uniqueById(rows:any[]){const m=new Map<string,any>();for(const x of rows||[]){const id=clean(x?.id);if(id)m.set(id,x)}return [...m.values()]}
function parsePeriod(request:Request){
  const p=new URL(request.url).searchParams.get("period")||"30d";
  const days=p==="7d"?7:p==="90d"?90:p==="180d"?180:p==="365d"?365:30;
  return {key:p,days,from:Date.now()-days*DAY};
}

export async function GET(request:Request){
  try{
    const s=await session();
    if(!s) return NextResponse.json({success:false,error:"Aktif firma oturumu bulunamadı veya yetkisiz erişim."},{status:401,headers:{"Cache-Control":"no-store"}});

    // İstemciden gönderilen firmId yalnız doğrulama amacıyla kullanılır.
    // Tenant kaynağı her zaman sunucu tarafındaki aktif firma cookie UUID'sidir.
    const requestedFirmId=validUuid(new URL(request.url).searchParams.get("firmId"));
    if(requestedFirmId && requestedFirmId!==s.firmId){
      return NextResponse.json(
        {success:false,error:"Firma doğrulama hatası: İstenen firma aktif oturum firmasıyla eşleşmiyor."},
        {status:409,headers:{"Cache-Control":"no-store"}}
      );
    }

    const supabase=db(); const firmId=s.firmId; const now=Date.now(); const nowDate=new Date(); const period=parsePeriod(request);

    // Firma ve çalışan listesi birbirinden bağımsızdır; ilk iki DB çağrısını paralel başlat.
    const [company,employeesAll]=await Promise.all([
      safe<any>(supabase.from("companies").select("id,name,local_firm_id,tehlike_sinifi").eq("id",firmId).maybeSingle()),
      safe<any[]>(supabase.from("employees").select("id,active").eq("firm_id",firmId)),
    ]);
    if(!company) return NextResponse.json({success:false,error:"Aktif firma bulunamadı."},{status:404,headers:{"Cache-Control":"no-store"}});
    const localFirmId=company.local_firm_id==null?"":clean(company.local_firm_id);
    const employees=(employeesAll||[]).filter(x=>x.active!==false);
    const employeeIds=employees.map(x=>clean(x.id)).filter(Boolean);

    // Kullanıcı eşlemesi eğitim modülüne bağımlıdır.
    // Bağımsız HSE kaynakları bu sorguyu beklemeden paralel başlatılır.
    const usersPromise: Promise<any[] | null> = employeeIds.length
      ? safe<any[]>(
          supabase
            .from("users")
            .select("id,employee_id,company_id")
            .eq("company_id", firmId)
            .in("employee_id", employeeIds)
        )
      : Promise.resolve([]);

    const independentPromise: Promise<
      [
        any[] | null,
        any[] | null,
        any[] | null,
        any[] | null,
        any[] | null,
        any[] | null,
        any[] | null,
        any[] | null,
        any[] | null,
        any[] | null,
        any[] | null
      ]
    > = Promise.all([
      safe<any[]>(supabase.from("risk_items").select("*").eq("company_id",firmId).eq("is_deleted",false)),
      safe<any[]>(supabase.from("fine_kinney_risks").select("*").eq("company_id",firmId).eq("is_deleted",false)),
      safe<any[]>(supabase.from("denetim_runs").select("id,firm_id,status,inserted_at").eq("firm_id",firmId)),
      localFirmId
        ? safe<any[]>(supabase.from("denetim_runs").select("id,firm_id,status,inserted_at").eq("firm_id",localFirmId))
        : Promise.resolve([]),
      employeeIds.length
        ? safe<any[]>(supabase.from("health_examinations").select("id,employee_id,exam_date,next_exam_date,is_deleted").eq("company_id",firmId).eq("is_deleted",false).in("employee_id",employeeIds))
        : Promise.resolve([]),
      employeeIds.length
        ? safe<any[]>(supabase.from("health_ek2_forms").select("id,employee_id,examination_id,form_type,status,exam_date,next_exam_date,is_active,created_at").eq("company_id",firmId).or("is_active.is.null,is_active.eq.true").in("employee_id",employeeIds))
        : Promise.resolve([]),
      safe<any[]>(supabase.from("periodic_control_equipments").select("id,firm_id,next_due_millis,status,deleted").eq("firm_id",firmId).eq("deleted",false)),
      safe<any[]>(supabase.from("environment_measurements").select("id,firm_id,next_due_millis,status,deleted").eq("firm_id",firmId).eq("deleted",false)),
      safe<any[]>(supabase.from("cbs_forms").select("id,firm_id,status,priority,sla_due_at").eq("firm_id",firmId)),
      safe<any[]>(supabase.from("accident_records").select("id,web_firm_id,firm_id,event_date,lost_work_days,is_active,is_deleted,created_at").eq("web_firm_id",firmId).or("is_deleted.is.null,is_deleted.eq.false,is_deleted.eq.0")),
      localFirmId
        ? safe<any[]>(supabase.from("accident_records").select("id,web_firm_id,firm_id,event_date,lost_work_days,is_active,is_deleted,created_at").eq("firm_id",localFirmId).or("is_deleted.is.null,is_deleted.eq.false,is_deleted.eq.0"))
        : Promise.resolve([]),
    ]);

    const [independent, usersRaw] = await Promise.all([
      independentPromise,
      usersPromise,
    ]);

    const [
      matrixRisks,
      kinneyRisks,
      inspectionRunsRemote,
      inspectionRunsLocal,
      healthExams,
      healthEk2,
      periodic,
      environment,
      cbs,
      accidentsWeb,
      accidentsLocal,
    ] = independent;

    const users: any[] = usersRaw ?? [];
    const userIds: string[] = users
      .map((x: any) => clean(x.id))
      .filter((id: string) => Boolean(id));

    const userToEmployee = new Map<string, string>(
      users
        .map((x: any): [string, string] => [clean(x.id), clean(x.employee_id)])
        .filter(([userId, employeeId]: [string, string]) => Boolean(userId && employeeId))
    );

    const trainingAssignments: any[] = userIds.length
      ? (await safe<any[]>(
          supabase
            .from("training_assignments")
            .select("id,user_id,training_id,status,watch_completed,final_exam_passed,started_at,completed_at,created_at")
            .in("user_id",userIds)
        )) ?? []
      : [];

    // Denetim kayıtları yalnız aktif firmanın remote UUID'si veya companies.local_firm_id
    // eşlemesiyle kabul edilir. Firma adı / global fallback YOK.
    const inspectionRuns=uniqueById([...(inspectionRunsRemote||[]),...(inspectionRunsLocal||[])]);

    const trainingIds: string[] = Array.from(new Set<string>(trainingAssignments.map((x: any) => clean(x.training_id)).filter((id: string) => Boolean(id))));
    const activeRuns=(inspectionRuns||[]).filter(x=>{const t=toMillis(x.inserted_at);return t!=null&&t>=period.from&&t<=now;});
    const runIds=activeRuns.map(x=>clean(x.id)).filter(Boolean);

    const trainingDefsPromise=trainingIds.length
      ? safe<any[]>(supabase.from("trainings").select("id,duration_minutes,title,type,created_at").in("id",trainingIds))
      : Promise.resolve<any[]>([]);

    const inspectionAnswersPromise=(async()=>{
      if(!runIds.length)return [] as any[];
      const [byRemote,byLocal]=await Promise.all([
        safe<any[]>(supabase.from("denetim_answers").select("*").in("run_remote_id",runIds)),
        safe<any[]>(supabase.from("denetim_answers").select("*").in("run_id",runIds)),
      ]);
      return uniqueById([...(byRemote||[]),...(byLocal||[])]);
    })();

    const [trainingDefs,inspectionAnswers]=await Promise.all([trainingDefsPromise,inspectionAnswersPromise]);
    const trainingMap = new Map<string, any>((trainingDefs || []).map((x: any): [string, any] => [clean(x.id), x]));

    // RİSK: Risk modülünün KANONİK seviye sınıflandırması birebir kullanılır.
    const riskLevels={intolerable:0,veryHigh:0,high:0,medium:0,low:0};
    for(const row of matrixRisks||[]){const level=matrixLevel(num(row.score)||num(row.probability)*num(row.severity));(riskLevels as any)[level==="INTOLERABLE"?"intolerable":level==="VERY_HIGH"?"veryHigh":level==="HIGH"?"high":level==="MEDIUM"?"medium":"low"]++;}
    for(const row of kinneyRisks||[]){const level=fineKinneyLevel(num(row.score)||num(row.probability_value)*num(row.frequency_value)*num(row.severity_value));(riskLevels as any)[level==="INTOLERABLE"?"intolerable":level==="VERY_HIGH"?"veryHigh":level==="HIGH"?"high":level==="MEDIUM"?"medium":"low"]++;}
    const riskTotal=(matrixRisks?.length||0)+(kinneyRisks?.length||0);
    const riskCritical=riskLevels.intolerable+riskLevels.veryHigh;

    // DENETİM: seçili operasyon dönemindeki run'ların gerçek cevapları.
    const answers=inspectionAnswers||[];
    const suitable=answers.filter(x=>clean(x.result).toLocaleUpperCase("tr-TR")==="UYGUN").length;
    const partial=answers.filter(x=>["KISMEN","KISMEN UYGUN","KISMEN_UYGUN"].includes(clean(x.result).toLocaleUpperCase("tr-TR"))).length;
    const nonCompliant=answers.filter(x=>clean(x.result).toLocaleUpperCase("tr-TR")==="UYGUNSUZ").length;

    // DÖF: Risk ve Denetim modüllerinin kendi kanonik mantığı ayrı ayrı hesaplanır, sonra birleştirilir.
    // Risk modülünde her risk kaydı DÖF durumuna sahiptir: CLOSED ise kapalı, diğerleri açık.
    const riskRows=[...(matrixRisks||[]),...(kinneyRisks||[])].filter(x=>riskHasDof(x));
    const riskDofTotal=riskRows.length;
    const riskDofClosed=riskRows.filter(x=>riskDofStatus(x)==="CLOSED").length;
    const riskDofOpen=riskRows.filter(x=>riskDofStatus(x)==="OPEN").length;

    // Denetim modülünde explicit DÖF durumu veya sonucu DÖF gerektiren maddeler kapsama girer.
    const inspectionDofRows=answers.filter(x=>inspectionDofStatus(x)!=="NONE");
    const inspectionDofClosed=inspectionDofRows.filter(x=>inspectionDofStatus(x)==="CLOSED").length;
    const inspectionDofOpen=Math.max(0,inspectionDofRows.length-inspectionDofClosed);

    const dofTotal=riskDofTotal+inspectionDofRows.length;
    const dofClosed=riskDofClosed+inspectionDofClosed;
    const dofOpen=riskDofOpen+inspectionDofOpen;
    const dofOverdue=[...riskRows.map(x=>({row:x,status:riskDofStatus(x)})),...inspectionDofRows.map(x=>({row:x,status:inspectionDofStatus(x)}))].filter(({row,status})=>{
      if(status==="CLOSED")return false;
      const t=toMillis(dofDueOf(row));
      return t!=null&&t<now;
    }).length;

    const rule=trainingRule(company.tehlike_sinifi);
    const employeeTrainingMinutes=new Map<string,number>();
    if(rule.minutes>0){
      for(const a of trainingAssignments||[]){
        const employeeId=userToEmployee.get(clean(a.user_id)); if(!employeeId)continue;
        const def=trainingMap.get(clean(a.training_id));
        const enriched={...a,duration_minutes:num(def?.duration_minutes)};
        if(!legallyValid(enriched,rule.years,nowDate))continue;
        employeeTrainingMinutes.set(employeeId,(employeeTrainingMinutes.get(employeeId)||0)+Math.max(0,num(def?.duration_minutes)));
      }
    }
    const trainingCompliant=rule.minutes>0?employeeIds.filter(id=>(employeeTrainingMinutes.get(id)||0)>=rule.minutes).length:0;
    const trainingMissing=rule.minutes>0?Math.max(0,employeeIds.length-trainingCompliant):0;

    // Sağlık gözetimi: health_examinations + EK-2 tek kanonik akışta değerlendirilir.
    // Bir çalışanın güncel EK-2 kaydı varsa dashboard bunu yok saymaz.
    const latestHealth=new Map<string,{examAt:number;dueAt:number|null}>();
    const putHealth=(employeeIdRaw:any,examRaw:any,dueRaw:any)=>{
      const employeeId=clean(employeeIdRaw); if(!employeeId)return;
      const examAt=examRaw?new Date(examRaw).getTime():0;
      const dueAt=dueRaw?new Date(dueRaw).getTime():NaN;
      const normalizedExam=Number.isFinite(examAt)?examAt:0;
      const normalizedDue=Number.isFinite(dueAt)?dueAt:null;
      const old=latestHealth.get(employeeId);
      if(!old||normalizedExam>=old.examAt) latestHealth.set(employeeId,{examAt:normalizedExam,dueAt:normalizedDue});
    };
    for(const x of healthExams||[]) putHealth(x.employee_id,x.exam_date,x.next_exam_date);
    for(const x of healthEk2||[]) putHealth(x.employee_id,x.exam_date||x.created_at,x.next_exam_date);

    let healthValid=0,healthOverdue=0,healthApproaching=0,healthMissing=0;
    for(const id of employeeIds){
      const x=latestHealth.get(id);
      if(!x||x.dueAt==null){healthMissing++;continue}
      if(x.dueAt<now)healthOverdue++;
      else{healthValid++;if(x.dueAt-now<=30*DAY)healthApproaching++}
    }
    const ek2Employees=new Set((healthEk2||[]).map(x=>clean(x.employee_id)).filter(Boolean)).size;

    const allAccidents=uniqueById([...(accidentsWeb||[]),...(accidentsLocal||[])]).filter(x=>x.is_active!==false);
    const accidentRows=allAccidents.filter(x=>{const t=toMillis(x.event_date||x.created_at);return t!=null&&t>=period.from&&t<=now;});
    const lostTime=accidentRows.filter(x=>num(x.lost_work_days)>0).length;
    const openInvestigations=0;

    const summarizeDue=(rows:any[]|null)=>{const all=rows||[];let valid=0,approaching=0,overdue=0;for(const x of all){const due=num(x.next_due_millis);if(due>0){if(due<now)overdue++;else if(due-now<=30*DAY)approaching++;else valid++;continue}const st=lower(x.status);if(["overdue","expired","gecikmis","gecikmiş","suresi_gecmis","süresi geçmiş"].includes(st))overdue++;else if(["approaching","yaklasiyor","yaklaşıyor","due_soon"].includes(st))approaching++;else if(["valid","uygun","ok","gecerli","geçerli"].includes(st))valid++}return{total:all.length,valid,approaching,overdue}};
    const periodicSummary=summarizeDue(periodic); const environmentSummary=summarizeDue(environment);

    const cbsRows=cbs||[]; const cbsOpen=cbsRows.filter(x=>!isClosed(x.status)).length;
    const cbsCritical=cbsRows.filter(x=>!isClosed(x.status)&&lower(x.priority)==="critical").length;
    const cbsSla=cbsRows.filter(x=>{if(isClosed(x.status)||!x.sla_due_at)return false;const t=new Date(x.sla_due_at).getTime();return Number.isFinite(t)&&t<now}).length;
    const cbsActionRequired=new Set(cbsRows.filter(x=>{
      if(isClosed(x.status))return false;
      const critical=lower(x.priority)==="critical";
      const t=x.sla_due_at?new Date(x.sla_due_at).getTime():NaN;
      return critical||(Number.isFinite(t)&&t<now);
    }).map(x=>clean(x.id))).size;

    const scoreInput:ScoreInput={
      risk:riskTotal>0?{total:riskTotal,critical:riskCritical,intolerable:riskLevels.intolerable,veryHigh:riskLevels.veryHigh,high:riskLevels.high,medium:riskLevels.medium,low:riskLevels.low}:undefined,
      inspection:answers.length>0?{total:answers.length,compliant:suitable,partial,nonCompliant}:undefined,
      training:employeeIds.length>0&&rule.minutes>0?{totalEmployees:employeeIds.length,compliantEmployees:trainingCompliant,nonCompliantEmployees:trainingMissing,requiredMinutes:rule.minutes,hazardClass:rule.label}:undefined,
      dof:dofTotal>0?{total:dofTotal,open:dofOpen,closed:dofClosed,overdue:dofOverdue,riskTotal:riskDofTotal,riskOpen:riskDofOpen,riskClosed:riskDofClosed,inspectionTotal:inspectionDofRows.length,inspectionOpen:inspectionDofOpen,inspectionClosed:inspectionDofClosed}:undefined,
      incident:accidentRows.length>0?{total:accidentRows.length,lostTime,openInvestigations}:undefined,
      health:employeeIds.length>0?{totalEmployees:employeeIds.length,valid:healthValid,approaching:healthApproaching,overdue:healthOverdue,missing:healthMissing,ek2Employees}:undefined,
      periodic:periodicSummary.total>0?periodicSummary:undefined,
      environment:environmentSummary.total>0?environmentSummary:undefined,
      cbs:cbsRows.length>0?{total:cbsRows.length,open:cbsOpen,critical:cbsCritical,slaExceeded:cbsSla,actionRequired:cbsActionRequired}:undefined,
    };



    // Gerçek dönem karşılaştırması: seçili dönem ile hemen önceki eşit dönem.
    // Yasal eğitim/sağlık gibi snapshot metriklerinde sahte tarihsel veri üretilmez.
    const previousFrom=period.from-period.days*DAY;
    const previousTo=period.from;
    const inWindow=(raw:any,from:number,to:number)=>{
      if(!raw)return false;
      const t=new Date(raw).getTime();
      return Number.isFinite(t)&&t>=from&&t<to;
    };
    const currentRunCount=activeRuns.filter(x=>inWindow(x.inserted_at,period.from,now+1)).length;
    const previousRunCount=inspectionRuns.filter(x=>inWindow(x.inserted_at,previousFrom,previousTo)).length;
    const currentIncidentCount=accidentRows.length;
    const previousIncidentCount=allAccidents.filter(x=>inWindow(x.event_date||x.created_at,previousFrom,previousTo)).length;
    const trend={
      periodDays:period.days,
      inspection:{current:currentRunCount,previous:previousRunCount,delta:currentRunCount-previousRunCount},
      incident:{current:currentIncidentCount,previous:previousIncidentCount,delta:currentIncidentCount-previousIncidentCount},
    };
    const performance=calculateHsePerformance(scoreInput); const priorityActions=buildPriorityActions(scoreInput);
    return NextResponse.json({
      success:true,firmId,firm:{id:firmId,name:clean(company.name)||"Aktif Firma",localFirmId:company.local_firm_id??null,hazardClass:rule.label},
      generatedAt:new Date().toISOString(),period:{key:period.key,days:period.days},scope:{periodBased:["inspection","incident"],snapshot:["risk","dof","training","health","periodic","environment","cbs"]},performance,priorityActions,trend,
      modules:{risk:scoreInput.risk??null,inspection:scoreInput.inspection??null,dof:scoreInput.dof??null,training:scoreInput.training??null,incident:scoreInput.incident??null,health:scoreInput.health??null,periodic:scoreInput.periodic??null,environment:scoreInput.environment??null,cbs:scoreInput.cbs??null},
      integrity:{tenant:"ACTIVE_REMOTE_UUID",tenantVerified:true,strictFirmIsolation:true,syntheticTrend:false,syntheticRiskMatrix:false,sensitiveHealthData:false,doraIncluded:false},
    },{headers:{"Cache-Control":"no-store"}});
  }catch(e){
    console.error("Executive dashboard error:",e);
    return NextResponse.json({success:false,error:e instanceof Error?e.message:"Executive Dashboard oluşturulamadı."},{status:500,headers:{"Cache-Control":"no-store"}});
  }
}


export async function OPTIONS(){
  return new Response(null,{
    status:204,
    headers:{
      "Allow":"GET, OPTIONS",
      "Cache-Control":"no-store",
    },
  });
}
