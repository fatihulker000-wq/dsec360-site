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
      safe<any[]>(supabase.from("risk_items").select("id,score,is_deleted,company_id,dof_status,dof_due_date").eq("company_id",firmId).eq("is_deleted",false)),
      safe<any[]>(supabase.from("fine_kinney_risks").select("id,score,is_deleted,company_id,dof_status,dof_due_date").eq("company_id",firmId).eq("is_deleted",false)),
      safe<any[]>(supabase.from("denetim_runs").select("id,firm_id,status,inserted_at").eq("firm_id",firmId)),
      localFirmId
        ? safe<any[]>(supabase.from("denetim_runs").select("id,firm_id,status,inserted_at").eq("firm_id",localFirmId))
        : Promise.resolve([]),
      employeeIds.length
        ? safe<any[]>(supabase.from("health_examinations").select("id,employee_id,exam_date,next_exam_date,is_deleted").eq("company_id",firmId).eq("is_deleted",false).in("employee_id",employeeIds))
        : Promise.resolve([]),
      employeeIds.length
        ? safe<any[]>(supabase.from("health_ek2_forms").select("id,employee_id,is_active,next_exam_date").eq("company_id",firmId).eq("is_active",true).in("employee_id",employeeIds))
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
    const activeRuns=(inspectionRuns||[]).filter(x=>{const t=x.inserted_at?new Date(x.inserted_at).getTime():NaN;return !Number.isFinite(t)||t>=period.from});
    const runIds=activeRuns.map(x=>clean(x.id)).filter(Boolean);

    const trainingDefsPromise=trainingIds.length
      ? safe<any[]>(supabase.from("trainings").select("id,duration_minutes,title,type,created_at").in("id",trainingIds))
      : Promise.resolve<any[]>([]);

    const inspectionAnswersPromise=(async()=>{
      if(!runIds.length)return [] as any[];
      const byRemote=await safe<any[]>(supabase.from("denetim_answers").select("id,run_id,run_remote_id,result,dof_status,dof_due_date").in("run_remote_id",runIds));
      if((byRemote||[]).length>0)return byRemote||[];
      return (await safe<any[]>(supabase.from("denetim_answers").select("id,run_id,run_remote_id,result,dof_status,dof_due_date").in("run_id",runIds)))||[];
    })();

    const [trainingDefs,inspectionAnswers]=await Promise.all([trainingDefsPromise,inspectionAnswersPromise]);
    const trainingMap = new Map<string, any>((trainingDefs || []).map((x: any): [string, any] => [clean(x.id), x]));

    const matrixLevels={critical:0,high:0};
    for(const r of matrixRisks||[]){const score=num(r.score);if(score>=20)matrixLevels.critical++;else if(score>=15)matrixLevels.high++}
    for(const r of kinneyRisks||[]){const score=num(r.score);if(score>400)matrixLevels.critical++;else if(score>=200)matrixLevels.high++}
    const riskTotal=(matrixRisks?.length||0)+(kinneyRisks?.length||0);

    const answers=inspectionAnswers||[];
    const suitable=answers.filter(x=>["uygun","suitable","compliant","yes","evet"].includes(lower(x.result))).length;
    const partial=answers.filter(x=>["kismen","kısmen","partial","partially"].includes(lower(x.result))).length;
    const inspectionDofRows=answers.filter(x=>clean(x.dof_status));
    const riskDofRows=[...(matrixRisks||[]),...(kinneyRisks||[])].filter(x=>clean(x.dof_status));
    const dofRows=[...inspectionDofRows,...riskDofRows];
    const dofClosed=dofRows.filter(x=>isClosed(x.dof_status)).length;
    const dofOverdue=dofRows.filter(x=>{if(isClosed(x.dof_status)||!x.dof_due_date)return false;const raw=x.dof_due_date;const n=Number(raw);const t=Number.isFinite(n)&&n>1e11?n:new Date(raw).getTime();return Number.isFinite(t)&&t<now}).length;

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

    const latestExam=new Map<string,any>();
    for(const x of healthExams||[]){
      const id=clean(x.employee_id);if(!id)continue;
      const old=latestExam.get(id);
      const nt=x.exam_date?new Date(x.exam_date).getTime():(x.next_exam_date?new Date(x.next_exam_date).getTime():0);
      const ot=old?.exam_date?new Date(old.exam_date).getTime():(old?.next_exam_date?new Date(old.next_exam_date).getTime():0);
      if(!old||nt>ot)latestExam.set(id,x);
    }
    let healthValid=0,healthOverdue=0,healthApproaching=0,healthMissing=0;
    for(const id of employeeIds){
      const x=latestExam.get(id);
      if(!x||!x.next_exam_date){healthMissing++;continue}
      const due=new Date(x.next_exam_date).getTime();
      if(!Number.isFinite(due)){healthMissing++;continue}
      if(due<now)healthOverdue++;
      else{healthValid++;if(due-now<=30*DAY)healthApproaching++}
    }
    const ek2Employees=new Set((healthEk2||[]).map(x=>clean(x.employee_id)).filter(Boolean)).size;

    const allAccidents=uniqueById([...(accidentsWeb||[]),...(accidentsLocal||[])]).filter(x=>x.is_active!==false);
    const accidentRows=allAccidents.filter(x=>{const raw=x.event_date||x.created_at; if(!raw)return true; const t=new Date(raw).getTime(); return !Number.isFinite(t)||t>=period.from});
    const lostTime=accidentRows.filter(x=>num(x.lost_work_days)>0).length;
    const openInvestigations=0;

    const summarizeDue=(rows:any[]|null)=>{const all=rows||[];let valid=0,overdue=0;for(const x of all){const due=num(x.next_due_millis);if(due>0){if(due<now)overdue++;else valid++;continue}const st=lower(x.status);if(["valid","uygun","ok","gecerli","geçerli"].includes(st))valid++;else if(["overdue","expired","gecikmis","gecikmiş","suresi_gecmis","süresi geçmiş"].includes(st))overdue++}return{total:all.length,valid,overdue}};
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
      risk:riskTotal>0?{total:riskTotal,critical:matrixLevels.critical,high:matrixLevels.high}:undefined,
      inspection:answers.length>0?{total:answers.length,compliant:suitable,partial}:undefined,
      training:employeeIds.length>0&&rule.minutes>0?{totalEmployees:employeeIds.length,compliantEmployees:trainingCompliant,nonCompliantEmployees:trainingMissing,requiredMinutes:rule.minutes,hazardClass:rule.label}:undefined,
      dof:dofRows.length>0?{total:dofRows.length,closed:dofClosed,overdue:dofOverdue}:undefined,
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
      generatedAt:new Date().toISOString(),period:{key:period.key,days:period.days},performance,priorityActions,trend,
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
