import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { resolveReportScope } from "../_auth";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}
function clamp(v:number,min=0,max=100){ return Math.max(min,Math.min(max,v)); }
function startOfMonth(monthsAgo:number){ const d=new Date(); d.setDate(1); d.setHours(0,0,0,0); d.setMonth(d.getMonth()-monthsAgo); return d; }
function asDate(v:any){ if(v===null||v===undefined||v==="") return null; const n=Number(v); const d=Number.isFinite(n)&&String(v).length<=13?new Date(n):new Date(v); return Number.isFinite(d.getTime())?d:null; }
function periodKey(v:any){ const d=asDate(v); return d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`:""; }
function periodLabel(d:Date){ return d.toLocaleDateString("tr-TR",{month:"short",year:"2-digit"}); }
function upper(v:any){ return String(v||"").trim().toUpperCase(); }
function isCompletedTraining(v:any){ return ["COMPLETED","TAMAMLANDI"].includes(upper(v)); }
function isCompletedAudit(v:any){ return ["COMPLETED","CLOSED","TAMAMLANDI","KAPALI"].includes(upper(v)); }
function dofState(answer:any){ const s=upper(answer.dof_status); if(["CLOSED","KAPALI","COMPLETED","TAMAMLANDI"].includes(s)) return "CLOSED"; if(["OPEN","AÇIK","IN_PROGRESS","DEVAM_EDIYOR"].includes(s)) return "OPEN"; const r=upper(answer.result); return (r.includes("UYGUNSUZ")||r.includes("KISMEN"))?"OPEN":"NONE"; }
function highRisk(row:any){ const l=upper(row.risk_level||row.level||row.priority); return l.includes("HIGH")||l.includes("YÜKSEK")||l.includes("CRITICAL")||l.includes("KRİTİK")||Number(row.score||row.risk_score||0)>=200; }
function mediumRisk(row:any){ const l=upper(row.risk_level||row.level||row.priority); const score=Number(row.score||row.risk_score||0); return l.includes("MEDIUM")||l.includes("ORTA")||(score>=70&&score<200); }

export async function GET(request:Request){
  try{
    const {searchParams}=new URL(request.url);
    let companyId=String(searchParams.get("companyId")||"ALL").trim();
    const months=clamp(Number(searchParams.get("months")||12),1,24);
    const supabase=getSupabase();

    // KRİTİK: service-role sorgularından önce firma yetkisini doğrula.
    const scope=await resolveReportScope(supabase,companyId);
    if(!scope.ok) return NextResponse.json({success:false,error:scope.error},{status:scope.status});
    companyId=scope.scope.selectedCompanyId;

    const periods=Array.from({length:months},(_,i)=>{ const date=startOfMonth(months-i-1); return {key:periodKey(date),label:periodLabel(date)}; });
    const fromDate=startOfMonth(months-1);
    const fromIso=fromDate.toISOString();
    const fromMillis=fromDate.getTime();

    let companiesQuery=supabase.from("companies").select("id,name,local_firm_id");
    if(companyId!=="ALL") companiesQuery=companiesQuery.eq("id",companyId);
    const {data:companies,error:companiesError}=await companiesQuery;
    if(companiesError) throw new Error(`Firma verisi alınamadı: ${companiesError.message}`);
    const companyRows=companies||[];
    const companyIds=companyRows.map((x:any)=>String(x.id));

    let employeeQuery=supabase.from("employees").select("id,firm_id,email");
    if(companyId!=="ALL") employeeQuery=employeeQuery.eq("firm_id",companyId);
    const {data:employees,error:employeeError}=await employeeQuery;
    if(employeeError) throw new Error(`Çalışan verisi alınamadı: ${employeeError.message}`);
    const employeeRows=employees||[];
    const employeeIds=employeeRows.map((x:any)=>String(x.id));

    // Eğitim atamaları employee_id ile değil users.id -> training_assignments.user_id ile bağlıdır.
    let users:any[]=[];
    if(employeeIds.length){
      const {data,error}=await supabase.from("users").select("id,employee_id,company_id,email").eq("role","training_user").in("employee_id",employeeIds);
      if(error) throw new Error(`Eğitim kullanıcıları alınamadı: ${error.message}`);
      users=data||[];
    }
    const userIds=users.map((x:any)=>String(x.id));
    let trainingRows:any[]=[];
    if(userIds.length){
      const {data,error}=await supabase.from("training_assignments").select("user_id,training_id,status,completed_at,created_at").in("user_id",userIds).gte("created_at",fromIso);
      if(error) throw new Error(`Eğitim analitiği alınamadı: ${error.message}`);
      trainingRows=data||[];
    }

    // Denetim modülünün gerçek tabloları denetim_runs + denetim_answers.
    const {data:allRuns,error:runsError}=await supabase.from("denetim_runs").select("*").gte("created_at_millis",fromMillis);
    if(runsError) throw new Error(`Denetim analitiği alınamadı: ${runsError.message}`);
    const normalizedIds=new Set(companyRows.flatMap((c:any)=>[String(c.id),String(c.local_firm_id||"")]).filter(Boolean));
    const normalizedNames=new Set(companyRows.map((c:any)=>String(c.name||"").trim().toLocaleLowerCase("tr-TR")));
    const auditRows=(allRuns||[]).filter((r:any)=>companyId==="ALL"||normalizedIds.has(String(r.firm_id||""))||normalizedNames.has(String(r.firm_name||"").trim().toLocaleLowerCase("tr-TR")));
    const runIds=auditRows.map((r:any)=>r.id).filter((x:any)=>x!==null&&x!==undefined);
    let answerRows:any[]=[];
    if(runIds.length){
      const {data,error}=await supabase.from("denetim_answers").select("*").in("run_remote_id",runIds);
      if(error) throw new Error(`DÖF analitiği alınamadı: ${error.message}`);
      answerRows=data||[];
    }
    const runById=new Map(auditRows.map((r:any)=>[String(r.id),r]));

    let riskRows:any[]=[];
    if(employeeIds.length){
      const {data,error}=await supabase.from("employee_risks").select("employee_id,risk_level,score,created_at").in("employee_id",employeeIds).gte("created_at",fromIso);
      if(error) console.warn("Risk analitiği alınamadı",error.message); else riskRows=data||[];
    }

    // Kaza tablosunda web UUID web_firm_id alanındadır.
    let accidentQuery=supabase.from("accidents").select("web_firm_id,firm_id,event_type,created_at").gte("created_at",fromIso);
    if(companyId!=="ALL"){
      const c=companyRows[0] as any; const local=String(c?.local_firm_id||"").trim();
      accidentQuery=local?accidentQuery.or(`web_firm_id.eq.${companyId},firm_id.eq.${local}`):accidentQuery.eq("web_firm_id",companyId);
    }
    const {data:accidents,error:accidentError}=await accidentQuery;
    if(accidentError) console.warn("Kaza analitiği alınamadı",accidentError.message);
    const accidentRows=accidents||[];

    const trends=periods.map(period=>{
      const tr=trainingRows.filter((r:any)=>periodKey(r.completed_at||r.created_at)===period.key);
      const ar=auditRows.filter((r:any)=>periodKey(r.completed_at||r.created_at||r.created_at_millis)===period.key);
      const ans=answerRows.filter((a:any)=>{ const run=runById.get(String(a.run_remote_id)); return run&&periodKey((run as any).completed_at||(run as any).created_at||(run as any).created_at_millis)===period.key; });
      const rr=riskRows.filter((r:any)=>periodKey(r.created_at)===period.key);
      const ac=accidentRows.filter((r:any)=>periodKey(r.created_at)===period.key);
      return {period:period.label,trainingCompleted:tr.filter((r:any)=>isCompletedTraining(r.status)).length,trainingMissing:tr.filter((r:any)=>!isCompletedTraining(r.status)).length,auditsCompleted:ar.filter((r:any)=>isCompletedAudit(r.status)).length,openDof:ans.filter((a:any)=>dofState(a)==="OPEN").length,closedDof:ans.filter((a:any)=>dofState(a)==="CLOSED").length,highRisk:rr.filter(highRisk).length,mediumRisk:rr.filter(mediumRisk).length,accident:ac.filter((r:any)=>["ACCIDENT","WORK_ACCIDENT","İŞ_KAZASI","IS_KAZASI"].includes(upper(r.event_type))).length,nearMiss:ac.filter((r:any)=>["NEAR_MISS","RAMAK_KALA","RAMAK KALA"].includes(upper(r.event_type))).length};
    });

    const userByEmployee=new Map(users.map((u:any)=>[String(u.employee_id),String(u.id)]));
    const comparisons=companyRows.map((company:any)=>{
      const ce=employeeRows.filter((e:any)=>String(e.firm_id)===String(company.id));
      const cu=new Set(ce.map((e:any)=>userByEmployee.get(String(e.id))).filter(Boolean));
      const ct=trainingRows.filter((r:any)=>cu.has(String(r.user_id)));
      const trainingScore=ct.length?clamp(Math.round(ct.filter((r:any)=>isCompletedTraining(r.status)).length/ct.length*100)):0;
      const ca=auditRows.filter((r:any)=>String(r.firm_id)===String(company.id)||String(r.firm_id)===String(company.local_firm_id||"")||String(r.firm_name||"").trim().toLocaleLowerCase("tr-TR")===String(company.name||"").trim().toLocaleLowerCase("tr-TR"));
      const auditScore=ca.length?clamp(Math.round(ca.filter((r:any)=>isCompletedAudit(r.status)).length/ca.length*100)):0;
      const ceIds=new Set(ce.map((e:any)=>String(e.id))); const cr=riskRows.filter((r:any)=>ceIds.has(String(r.employee_id)));
      // Kayıt yoksa 100 değil 0: "ölçülmedi" durumu başarı gibi gösterilmez.
      const riskScore=cr.length?clamp(Math.round(100-(cr.filter(highRisk).length/cr.length)*100)):0;
      const measured=[ct.length?trainingScore:null,ca.length?auditScore:null,cr.length?riskScore:null].filter((x):x is number=>x!==null);
      const overallScore=measured.length?Math.round(measured.reduce((a,b)=>a+b,0)/measured.length):0;
      return {companyId:String(company.id),companyName:String(company.name||""),employeeCount:ce.length,trainingScore,auditScore,riskScore,overallScore};
    });
    const heatmap=comparisons.flatMap((r:any)=>[{rowLabel:r.companyName,columnLabel:"Eğitim",value:r.trainingScore},{rowLabel:r.companyName,columnLabel:"Denetim",value:r.auditScore},{rowLabel:r.companyName,columnLabel:"Risk",value:r.riskScore}]);

    return NextResponse.json({success:true,data:{periods,trends,comparisons,heatmap,generatedAt:new Date().toISOString()}});
  }catch(errorValue:unknown){
    console.error("Advanced analytics error:",errorValue);
    return NextResponse.json({success:false,error:errorValue instanceof Error?errorValue.message:"Gelişmiş analitik verileri alınamadı."},{status:500});
  }
}
