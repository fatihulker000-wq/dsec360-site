import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveReportScope } from "../../reports/_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;
type Severity = "CRITICAL"|"HIGH"|"MEDIUM"|"LOW"|"INFO";
type ScanFinding = {
  id:string;
  domain:string;
  title:string;
  state:"MISSING"|"SHORTAGE"|"WARNING"|"VERIFY";
  severity:Severity;
  summary:string;
  recommendation:string;
  sourceUrl:string;
  confidence:"HIGH"|"MEDIUM"|"LOW";
  actionable:boolean;
  actionKind?:string;
  evidence?:string[];
};
type ModuleScan = {
  key:string;
  label:string;
  available:boolean;
  total:number;
  findings:number;
  status:"CRITICAL"|"WARNING"|"OK"|"UNAVAILABLE";
  sourceUrl:string;
  warning?:string;
};

function db(){
  const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)throw new Error("Supabase environment variables are missing.");
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
function text(v:unknown){return String(v??"").trim();}
function norm(v:unknown){
  return text(v).toLocaleUpperCase("tr-TR")
    .replaceAll("İ","I").replaceAll("Ş","S").replaceAll("Ğ","G")
    .replaceAll("Ü","U").replaceAll("Ö","O").replaceAll("Ç","C");
}
function isOpen(v:unknown){
  const s=norm(v);
  return !["COMPLETED","TAMAMLANDI","CLOSED","KAPALI","DONE","OK","UYGUN","PASIF","IPTAL","CANCELLED"].includes(s);
}
function asBool(v:unknown){return v===true||v===1||v==="1"||norm(v)==="TRUE"||norm(v)==="EVET";}
function millis(v:unknown){
  if(v===null||v===undefined||v==="")return null;
  const n=Number(v);
  if(Number.isFinite(n)){
    if(n>1e12)return n;
    if(n>1e9)return n*1000;
  }
  const d=new Date(String(v)).getTime();
  return Number.isFinite(d)?d:null;
}
function daysFromNow(v:unknown){
  const m=millis(v); if(m===null)return null;
  const now=new Date(); now.setHours(0,0,0,0);
  const d=new Date(m); d.setHours(0,0,0,0);
  return Math.ceil((d.getTime()-now.getTime())/86400000);
}
async function safe(label:string,promise:any){
  try{
    const {data,error}=await promise;
    if(error)return {rows:[] as AnyRow[],warning:`${label}: ${error.message}`};
    const rows=Array.isArray(data)?data:(data?[data]:[]);
    return {rows:rows as AnyRow[],warning:""};
  }catch(e:any){
    return {rows:[] as AnyRow[],warning:`${label}: ${e?.message||"okunamadı"}`};
  }
}
function addFinding(list:ScanFinding[], f:ScanFinding){
  if(!list.some(x=>x.id===f.id))list.push(f);
}
function moduleStatus(findings:ScanFinding[], label:string, warning?:string){
  if(warning)return "UNAVAILABLE" as const;
  const own=findings.filter(x=>x.domain===label);
  if(own.some(x=>x.severity==="CRITICAL"))return "CRITICAL" as const;
  if(own.some(x=>["HIGH","MEDIUM"].includes(x.severity)))return "WARNING" as const;
  return "OK" as const;
}

export async function GET(req:NextRequest){
  try{
    const supabase=db();
    const requested=text(req.nextUrl.searchParams.get("companyId"));
    const resolved=await resolveReportScope(supabase,requested||null);
    if(!resolved.ok)return NextResponse.json({ok:false,error:resolved.error},{status:resolved.status});
    const companyId=resolved.scope.selectedCompanyId;
    if(!companyId||companyId==="ALL")return NextResponse.json({ok:false,error:"Tam DORA taraması için tek firma seçilmelidir."},{status:400});

    const companyRes=await safe("Firma",supabase.from("companies").select("*").eq("id",companyId).maybeSingle());
    const company=companyRes.rows[0]||{};
    const localFirmId=company.local_firm_id;

    const employees=await safe("Çalışanlar",supabase.from("employees").select("*").eq("firm_id",companyId));
    const activeEmployees=employees.rows.filter(x=>x.active!==false);
    const employeeIds=activeEmployees.map(x=>x.id).filter(Boolean);

    const users=employeeIds.length
      ? await safe("Eğitim kullanıcıları",supabase.from("users").select("id,employee_id,company_id,role,full_name,email").in("employee_id",employeeIds))
      : {rows:[] as AnyRow[],warning:""};
    const trainingUserIds=users.rows.filter(x=>norm(x.role)==="TRAINING_USER").map(x=>x.id).filter(Boolean);

    const [
      assignments, matrixRisk, kinneyRisk, healthExams, healthRecords, auditRunsWeb, auditRunsLocal,
      accidentsWeb, accidentsLocal, periodic, environment, surveys, surveyDispatches, surveyFindings,
      surveyActions, representatives, boardMembers, emergencyPlans, emergencyTeams, emergencyDrills,
      docs, ppe, ibys, subcontractorCompanies, subcontractorEmployees, subcontractorDocs,
      subcontractorPermits, cbsForms
    ] = await Promise.all([
      trainingUserIds.length?safe("Eğitim atamaları",supabase.from("training_assignments").select("*").in("user_id",trainingUserIds)):Promise.resolve({rows:[],warning:""}),
      safe("5x5 Risk",supabase.from("risk_items").select("*").eq("company_id",companyId)),
      safe("Fine Kinney",supabase.from("fine_kinney_risks").select("*").eq("company_id",companyId)),
      safe("Sağlık muayeneleri",supabase.from("health_examinations").select("*").eq("company_id",companyId)),
      safe("Sağlık kayıtları",supabase.from("health_records").select("*").eq("firm_id",companyId)),
      safe("Denetimler",supabase.from("denetim_runs").select("*").eq("firm_id",companyId)),
      localFirmId!==null&&localFirmId!==undefined?safe("Denetimler(local)",supabase.from("denetim_runs").select("*").eq("firm_id",localFirmId)):Promise.resolve({rows:[],warning:""}),
      safe("Kaza/Olay",supabase.from("accident_records").select("*").eq("web_firm_id",companyId)),
      localFirmId!==null&&localFirmId!==undefined?safe("Kaza/Olay(local)",supabase.from("accident_records").select("*").eq("firm_id",localFirmId)):Promise.resolve({rows:[],warning:""}),
      safe("Periyodik Kontrol",supabase.from("periodic_control_equipments").select("*").eq("firm_id",companyId)),
      safe("Ortam Ölçümü",supabase.from("environment_measurements").select("*").eq("firm_id",companyId)),
      safe("Çalışan Anketleri",supabase.from("employee_surveys").select("*").eq("firm_id",companyId)),
      safe("Anket Dağıtımları",supabase.from("employee_survey_dispatches").select("*").eq("firm_id",companyId)),
      safe("Anket Bulguları",supabase.from("employee_survey_findings").select("*").eq("firm_id",companyId)),
      safe("Anket Aksiyonları",supabase.from("employee_survey_actions").select("*").eq("firm_id",companyId)),
      safe("Çalışan Temsilcileri",supabase.from("employee_representatives").select("*").eq("firm_id",companyId)),
      safe("İSG Kurulu",supabase.from("documentation_board_members").select("*").eq("firm_id",companyId)),
      safe("Acil Durum Planları",supabase.from("emergency_action_plans").select("*").eq("company_id",companyId)),
      safe("Acil Durum Ekipleri",supabase.from("emergency_support_teams").select("*").eq("company_id",companyId)),
      safe("Acil Durum Tatbikatları",supabase.from("emergency_drills").select("*").eq("company_id",companyId)),
      safe("Dokümantasyon",supabase.from("documentation_records").select("*").eq("firm_id",companyId)),
      employeeIds.length?safe("KKD",supabase.from("employee_ppe_assignments").select("*").in("employee_id",employeeIds)):Promise.resolve({rows:[],warning:""}),
      employeeIds.length?safe("İBYS",supabase.from("employee_ibys_records").select("*").in("employee_id",employeeIds)):Promise.resolve({rows:[],warning:""}),
      safe("Taşeron Firmalar",supabase.from("subcontractor_companies").select("*").eq("firm_id",companyId)),
      safe("Taşeron Çalışanlar",supabase.from("subcontractor_employees").select("*").eq("firm_id",companyId)),
      safe("Taşeron Evrakları",supabase.from("subcontractor_employee_documents").select("*").eq("firm_id",companyId)),
      safe("Taşeron İş İzinleri",supabase.from("subcontractor_work_permits").select("*").eq("firm_id",companyId)),
      safe("ÇBS",supabase.from("cbs_forms").select("*").eq("firm_id",companyId)),
    ]);

    const findings:ScanFinding[]=[];

    // ÇALIŞANLAR
    const missingJob=activeEmployees.filter(x=>!text(x.job_title)).length;
    const missingDept=activeEmployees.filter(x=>!text(x.department)&&!text(x.department_name)).length;
    if(missingJob||missingDept)addFinding(findings,{
      id:"fullscan-employee-data",domain:"Çalışanlar",title:"Çalışan temel veri eksikleri",state:"SHORTAGE",
      severity:(missingJob+missingDept)>=Math.max(5,Math.ceil(activeEmployees.length*.2))?"HIGH":"MEDIUM",
      summary:`${activeEmployees.length} aktif çalışanda ${missingJob} görev/unvan, ${missingDept} departman alanı eksik.`,
      recommendation:"Eksik çalışan kartlarını tamamlayın; DORA'nın risk, eğitim ve kurul eşleştirmeleri daha güvenilir hale gelir.",
      sourceUrl:"/admin/employees",confidence:"HIGH",actionable:false,evidence:[`Aktif çalışan: ${activeEmployees.length}`,`Eksik unvan: ${missingJob}`,`Eksik departman: ${missingDept}`]
    });

    // EĞİTİM
    const linkedEmployeeIds=new Set(users.rows.filter(x=>norm(x.role)==="TRAINING_USER").map(x=>text(x.employee_id)));
    const unlinked=activeEmployees.filter(x=>!linkedEmployeeIds.has(text(x.id))).length;
    const incomplete=assignments.rows.filter(x=>norm(x.status)!=="COMPLETED"&&norm(x.status)!=="TAMAMLANDI"&&!x.completed_at).length;
    if(unlinked>0)addFinding(findings,{
      id:"fullscan-training-link",domain:"Eğitim",title:"Eğitim hesabı eşleşmeyen çalışanlar",state:"SHORTAGE",severity:unlinked>=5?"HIGH":"MEDIUM",
      summary:`${unlinked} aktif çalışan eğitim kullanıcısıyla eşleştirilemedi.`,
      recommendation:"Eşleşme eksiklerini doğrulayın; eğitim ataması öncesinde çalışan-eğitim hesabı bağlantısı kurulmalıdır.",
      sourceUrl:"/admin/trainings",confidence:"HIGH",actionable:false
    });
    if(incomplete>0)addFinding(findings,{
      id:"dora-egitim-atama",domain:"Eğitim",title:"DORA kontrollü eğitim ataması",state:"WARNING",severity:incomplete>=10?"HIGH":"MEDIUM",
      summary:`${assignments.rows.length} eğitim atamasının ${incomplete} tanesi tamamlanmamış.`,
      recommendation:"Çalışanları ve uygun eğitimi seçin; kullanıcı ONAYLA + BAŞLA verdiğinde DORA gerçek eğitim ataması yapabilir.",
      sourceUrl:"/admin/trainings",confidence:"HIGH",actionable:true,actionKind:"TRAINING_ASSIGNMENT"
    });

    // SAĞLIK
    const healthRows=[...healthExams.rows,...healthRecords.rows];
    const healthEmp=new Set(healthRows.map(x=>text(x.employee_id)).filter(Boolean));
    const withoutHealth=activeEmployees.filter(x=>!healthEmp.has(text(x.id))).length;
    const overdueHealth=healthRows.filter(x=>{const d=daysFromNow(x.next_exam_date??x.next_due_millis);return d!==null&&d<0;}).length;
    if(withoutHealth>0)addFinding(findings,{
      id:"fullscan-health-coverage",domain:"Sağlık",title:"Sağlık kayıt kapsamı boşluğu",state:"VERIFY",severity:withoutHealth>=Math.max(5,Math.ceil(activeEmployees.length*.2))?"HIGH":"MEDIUM",
      summary:`${withoutHealth} aktif çalışan için sistemde eşleşen sağlık kaydı bulunamadı.`,
      recommendation:"Gerçek muayene eksikliği ile veri/entegrasyon eksikliğini ayırarak kontrol edin.",
      sourceUrl:"/admin/health",confidence:"MEDIUM",actionable:false
    });
    if(overdueHealth>0)addFinding(findings,{
      id:"fullscan-health-overdue",domain:"Sağlık",title:"Gecikmiş sağlık takip kayıtları",state:"WARNING",severity:overdueHealth>=5?"HIGH":"MEDIUM",
      summary:`${overdueHealth} sağlık kaydında takip tarihi geçmiş görünüyor.`,
      recommendation:"İlgili çalışanların periyodik muayene planlamasını doğrulayın.",
      sourceUrl:"/admin/health",confidence:"HIGH",actionable:false
    });

    // RİSK
    const risks=[...matrixRisk.rows,...kinneyRisk.rows];
    const highRisks=risks.filter(x=>["HIGH","CRITICAL","INTOLERABLE","YUKSEK","COK_YUKSEK"].some(k=>norm(x.level??x.risk_level??x.severity??x.status).includes(k))).length;
    const openRisks=risks.filter(x=>isOpen(x.status)).length;
    if(highRisks>0)addFinding(findings,{
      id:"fullscan-high-risk",domain:"Risk Yönetimi",title:"Yüksek/kritik risk yoğunluğu",state:"WARNING",severity:highRisks>=10?"CRITICAL":"HIGH",
      summary:`Toplam ${risks.length} risk kaydında ${highRisks} yüksek/kritik sinyal ve ${openRisks} açık durum görüldü.`,
      recommendation:"DORA yüksek riskleri önceliklendirerek sorumlu ve termin içeren aksiyon taslağı oluşturmalı; kullanıcı onayına sunulmalıdır.",
      sourceUrl:"/admin/risk",confidence:"HIGH",actionable:false
    });

    // DENETİM & DÖF
    const auditRuns=[...auditRunsWeb.rows,...auditRunsLocal.rows];
    const runIds=auditRuns.map(x=>x.id).filter(Boolean);
    let auditAnswers={rows:[] as AnyRow[],warning:""};
    if(runIds.length)auditAnswers=await safe("Denetim cevapları",supabase.from("denetim_answers").select("*").in("run_remote_id",runIds));
    const openDofs=auditAnswers.rows.filter(x=>norm(x.dof_status)==="OPEN"||norm(x.dof_status)==="ACIK").length;
    const nonconform=auditAnswers.rows.filter(x=>["UYGUNSUZ","KISMEN"].includes(norm(x.result))).length;
    if(openDofs||nonconform)addFinding(findings,{
      id:"fullscan-dof-open",domain:"Denetim & DÖF",title:"Açık DÖF / uygunsuzluk yükü",state:"WARNING",severity:openDofs>=10?"HIGH":"MEDIUM",
      summary:`${openDofs} açık DÖF ve ${nonconform} uygunsuz/kısmen uygun denetim cevabı görüldü.`,
      recommendation:"Açık DÖF'ler sorumlu ve termin bazında önceliklendirilmeli; DORA'nın DÖF yürütücüsü ile kullanıcı onayına sunulabilir.",
      sourceUrl:"/admin/denetimler?tab=dof#dof",confidence:"HIGH",actionable:false
    });

    // KAZA / OLAY
    const accidents=[...accidentsWeb.rows,...accidentsLocal.rows].filter((x,i,a)=>a.findIndex(y=>text(y.id)===text(x.id))===i);
    const rootMissing=accidents.filter(x=>!text(x.root_cause_category)&&!text(x.root_cause)).length;
    if(accidents.length>0)addFinding(findings,{
      id:"fullscan-accidents",domain:"Kaza / Olay",title:"Kaza/olay kayıtları çapraz inceleme gerektiriyor",state:"WARNING",
      severity:accidents.length>=5?"HIGH":"MEDIUM",
      summary:`${accidents.length} kaza/olay kaydı var; ${rootMissing} kayıtta kök neden bilgisi eksik görünüyor.`,
      recommendation:"Kaza kayıtlarını risk, eğitim ve sağlık verisiyle ilişkilendirin; eksik kök nedenleri tamamlayın.",
      sourceUrl:"/admin/accidents",confidence:"HIGH",actionable:false
    });

    // PERİYODİK / ORTAM
    const overduePeriodic=periodic.rows.filter(x=>{const d=daysFromNow(x.next_due_millis??x.next_due_date);return d!==null&&d<0;}).length;
    const overdueEnv=environment.rows.filter(x=>{const d=daysFromNow(x.next_due_millis??x.next_due_date);return d!==null&&d<0;}).length;
    if(overduePeriodic)addFinding(findings,{
      id:"fullscan-periodic-overdue",domain:"Periyodik Kontrol",title:"Gecikmiş periyodik kontroller",state:"WARNING",severity:overduePeriodic>=5?"HIGH":"MEDIUM",
      summary:`${overduePeriodic} ekipman kontrol tarihi geçmiş görünüyor.`,recommendation:"Kontrol planını ve hizmet organizasyonunu güncelleyin.",
      sourceUrl:"/admin/documentation/periodic-controls",confidence:"HIGH",actionable:false
    });
    if(overdueEnv)addFinding(findings,{
      id:"fullscan-env-overdue",domain:"Ortam Ölçümleri",title:"Gecikmiş ortam ölçümleri",state:"WARNING",severity:overdueEnv>=3?"HIGH":"MEDIUM",
      summary:`${overdueEnv} ortam ölçümü yenileme tarihi geçmiş görünüyor.`,recommendation:"Ölçüm kapsamını ve yenileme planını doğrulayın.",
      sourceUrl:"/admin/documentation/periodic-controls",confidence:"HIGH",actionable:false
    });

    // ANKET
    const surveyOpenFindings=surveyFindings.rows.filter(x=>norm(x.status)!=="CLOSED"&&norm(x.status)!=="KAPALI").length;
    const overdueSurveyActions=surveyActions.rows.filter(x=>{const d=daysFromNow(x.due_date);return d!==null&&d<0&&isOpen(x.status);}).length;
    const activeSurveys=surveys.rows.filter(x=>!["CLOSED","ARCHIVED","KAPALI"].includes(norm(x.status)));
    const lowResponse=activeSurveys.filter(s=>{
      const dispatch=surveyDispatches.rows.filter(x=>text(x.survey_id)===text(s.id));
      const completed=dispatch.filter(x=>x.completed_at).length;
      return dispatch.length>=5 && completed/dispatch.length<0.6;
    }).length;
    if(surveyOpenFindings||overdueSurveyActions||lowResponse)addFinding(findings,{
      id:"fullscan-survey",domain:"Çalışan Anketleri",title:"Anket geri bildirimlerinde takip ihtiyacı",state:"WARNING",
      severity:(surveyOpenFindings+overdueSurveyActions)>=5?"HIGH":"MEDIUM",
      summary:`${surveyOpenFindings} açık anket bulgusu, ${overdueSurveyActions} gecikmiş anket aksiyonu, ${lowResponse} düşük katılımlı aktif anket görüldü.`,
      recommendation:"Kritik bulguları ve geciken aksiyonları önceliklendirin; düşük katılımlı anketlerde hatırlatma planlayın.",
      sourceUrl:"/admin/documentation",confidence:"HIGH",actionable:false
    });

    // TEMSİLCİ / KURUL / ACİL DURUM
    const activeReps=representatives.rows.filter(x=>x.is_deleted!==true&&norm(x.status)!=="PASSIVE"&&norm(x.status)!=="PASIF");
    if(activeEmployees.length>0&&activeReps.length===0)addFinding(findings,{
      id:"employee-representatives",domain:"Çalışan Temsilcisi",title:"Çalışan temsilcisi kaydı bulunamadı",state:"MISSING",severity:"HIGH",
      summary:"Aktif çalışan bulunmasına rağmen aktif çalışan temsilcisi kaydı görülmedi.",
      recommendation:"Gerekli temsilci sayısını doğrulayın; kullanıcı onayıyla çalışan seçerek atama yapın.",
      sourceUrl:"/admin/documentation/employee-representatives",confidence:"MEDIUM",actionable:true,actionKind:"EMPLOYEE_REPRESENTATIVE"
    });
    const activeBoard=boardMembers.rows.filter(x=>x.is_active!==false&&x.is_deleted!==true);
    if(activeEmployees.length>=50&&activeBoard.length===0)addFinding(findings,{
      id:"isg-board",domain:"İSG Kurulu",title:"İSG Kurulu yapısı",state:"VERIFY",severity:"HIGH",
      summary:"50+ çalışan bulunmasına rağmen aktif kurul üyesi kaydı görülmedi. 6 aydan fazla sürekli iş kriteri ayrıca doğrulanmalıdır.",
      recommendation:"Kriter doğrulandıktan sonra eksik kurul rollerini çalışan seçerek kullanıcı onayıyla oluşturun.",
      sourceUrl:"/admin/documentation/board",confidence:"MEDIUM",actionable:true,actionKind:"ISG_BOARD_MEMBER"
    });

    const emergencyActive=emergencyTeams.rows.filter(x=>x.is_active!==false&&x.is_deleted!==true);
    const teamCounts=(key:string)=>emergencyActive.filter(x=>norm(x.team_type).includes(key)).length;
    const danger=norm(company.tehlike_sinifi);
    const divisor=danger.includes("COK")||danger.includes("VERY")?30:danger.includes("TEHLIKELI")&&!danger.includes("AZ")?40:danger.includes("AZ")?50:0;
    const firstDiv=danger.includes("COK")||danger.includes("VERY")?10:danger.includes("TEHLIKELI")&&!danger.includes("AZ")?15:danger.includes("AZ")?20:0;
    const reqEach=divisor?Math.max(1,Math.ceil(activeEmployees.length/divisor)):0;
    const reqFirst=firstDiv?Math.max(1,Math.ceil(activeEmployees.length/firstDiv)):0;
    const emergencyDefs=[
      ["fire-team","Acil Durum","Söndürme ekibi","YANGINLA_MUCADELE",reqEach],
      ["rescue-team","Acil Durum","Kurtarma / tahliye ekibi","ARAMA_KURTARMA",reqEach],
      ["protection-team","Acil Durum","Koruma ekibi","KORUMA",reqEach],
      ["first-aid","Acil Durum","Sertifikalı ilkyardımcı yeterliliği","ILK_YARDIM",reqFirst],
    ] as const;
    for(const [id,domain,title,key,required] of emergencyDefs){
      if(!required)continue;
      const current=teamCounts(key);
      if(current<required)addFinding(findings,{
        id,domain,title,state:"SHORTAGE",severity:"HIGH",
        summary:`Hesaplanan ihtiyaç ${required}; aktif kayıt ${current}; eksik ${required-current}.`,
        recommendation:`Eksik ${required-current} kişi için çalışan seçin; kullanıcı ONAYLA + BAŞLA verdiğinde DORA atamayı gerçekleştirebilir.`,
        sourceUrl:"/admin/dora/actions",confidence:"HIGH",actionable:true,actionKind:"EMERGENCY_SUPPORT_TEAM",
        evidence:[`Gerekli: ${required}`,`Mevcut: ${current}`,`Eksik: ${required-current}`]
      });
    }
    if(emergencyPlans.rows.length===0)addFinding(findings,{
      id:"fullscan-emergency-plan",domain:"Acil Durum",title:"Acil durum planı kaydı bulunamadı",state:"MISSING",severity:"CRITICAL",
      summary:"Sistemde seçili firma için acil durum planı kaydı görülmedi.",recommendation:"Planın gerçekte mevcut olup olmadığını doğrulayın; yoksa kontrollü doküman üretim akışına alın.",
      sourceUrl:"/admin/documentation",confidence:"MEDIUM",actionable:false
    });
    if(emergencyDrills.rows.length===0)addFinding(findings,{
      id:"fullscan-emergency-drill",domain:"Acil Durum",title:"Tatbikat kaydı bulunamadı",state:"VERIFY",severity:"MEDIUM",
      summary:"Seçili firma için tatbikat kaydı görülemedi.",recommendation:"Tatbikat geçmişini ve bir sonraki planı doğrulayın.",
      sourceUrl:"/admin/documentation",confidence:"MEDIUM",actionable:false
    });

    // DOKÜMANTASYON
    const docText=docs.rows.map(x=>norm([x.category,x.title,x.description].join(" "))).join(" | ");
    const requiredDocs=[
      ["fullscan-doc-policy","İSG Politikası","ISG POLITIKA"],
      ["fullscan-doc-training-plan","Yıllık Eğitim Planı","YILLIK EGITIM"],
      ["fullscan-doc-risk-team","Risk Değerlendirme Ekibi","RISK DEGERLENDIRME EKIB"],
    ];
    for(const [id,title,key] of requiredDocs){
      if(!docText.includes(key))addFinding(findings,{
        id,domain:"Dokümantasyon",title:`${title} kaydı taramada bulunamadı`,state:"VERIFY",severity:"MEDIUM",
        summary:`Dokümantasyon kayıtlarında "${title}" eşleşmesi bulunamadı.`,recommendation:"Belgenin farklı adla kayıtlı olup olmadığını doğrulayın; yoksa DORA taslak üretim akışına alın.",
        sourceUrl:"/admin/documentation",confidence:"MEDIUM",actionable:false
      });
    }

    // KKD / İBYS
    if(!ppe.warning&&activeEmployees.length){
      const ppeEmp=new Set(ppe.rows.map(x=>text(x.employee_id)).filter(Boolean));
      const missingPpe=activeEmployees.filter(x=>!ppeEmp.has(text(x.id))).length;
      if(missingPpe)addFinding(findings,{
        id:"fullscan-ppe",domain:"KKD",title:"KKD zimmet/kayıt kapsamı eksik",state:"VERIFY",severity:missingPpe>=5?"HIGH":"MEDIUM",
        summary:`${missingPpe} aktif çalışanda eşleşen KKD atama kaydı görülmedi.`,recommendation:"Çalışan bazlı KKD gerekliliğini ve zimmet kayıtlarını doğrulayın.",
        sourceUrl:"/admin/employees",confidence:"MEDIUM",actionable:false
      });
    }
    if(!ibys.warning&&activeEmployees.length){
      const ibysEmp=new Set(ibys.rows.map(x=>text(x.employee_id)).filter(Boolean));
      const missingIbys=activeEmployees.filter(x=>!ibysEmp.has(text(x.id))).length;
      if(missingIbys)addFinding(findings,{
        id:"fullscan-ibys",domain:"İBYS",title:"İBYS kayıt kapsamı eksik",state:"VERIFY",severity:"MEDIUM",
        summary:`${missingIbys} aktif çalışan için eşleşen İBYS kaydı görülmedi.`,recommendation:"İBYS kapsam ve aktarım durumunu doğrulayın.",
        sourceUrl:"/admin/ibys",confidence:"MEDIUM",actionable:false
      });
    }

    // TAŞERON
    const blockedSubs=subcontractorEmployees.rows.filter(x=>x.entry_permission===false||["GIRIS_ENGELLI","YASAKLI"].includes(norm(x.employee_status))).length;
    const missingSubDocs=subcontractorDocs.rows.filter(x=>asBool(x.is_required)&&["EKSIK","EXPIRED","SURESI_DOLMUS"].includes(norm(x.status))).length;
    const overduePermits=subcontractorPermits.rows.filter(x=>{const d=daysFromNow(x.end_millis??x.endMillis);return d!==null&&d<0&&isOpen(x.status);}).length;
    if(blockedSubs||missingSubDocs||overduePermits)addFinding(findings,{
      id:"fullscan-subcontractor",domain:"Taşeron Yönetimi",title:"Taşeron saha uygunluğu sorunları",state:"WARNING",
      severity:(blockedSubs+missingSubDocs)>=5?"HIGH":"MEDIUM",
      summary:`${blockedSubs} giriş engelli çalışan, ${missingSubDocs} eksik/süresi dolmuş zorunlu evrak, ${overduePermits} süresi geçmiş açık iş izni görüldü.`,
      recommendation:"Saha girişinden önce belge, izin ve çalışan uygunluklarını tamamlayın; DORA bu kayıtları risk önceliğine göre sıralamalı.",
      sourceUrl:"/admin/subcontractors",confidence:"HIGH",actionable:false
    });

    // ÇBS
    const openCbs=cbsForms.rows.filter(x=>isOpen(x.status)).length;
    const overdueCbs=cbsForms.rows.filter(x=>{const d=daysFromNow(x.sla_due_at);return d!==null&&d<0&&isOpen(x.status);}).length;
    if(openCbs||overdueCbs)addFinding(findings,{
      id:"fullscan-cbs",domain:"ÇBS",title:"ÇBS açık kayıt / SLA takibi",state:"WARNING",severity:overdueCbs>0?"HIGH":"MEDIUM",
      summary:`${openCbs} açık ÇBS kaydı, ${overdueCbs} SLA süresi geçmiş kayıt görüldü.`,
      recommendation:"Geciken kayıtları sorumlu ve öncelik bazında ele alın.",
      sourceUrl:"/admin/cbs",confidence:"HIGH",actionable:false
    });

    findings.sort((a,b)=>({CRITICAL:5,HIGH:4,MEDIUM:3,LOW:2,INFO:1}[b.severity]-{CRITICAL:5,HIGH:4,MEDIUM:3,LOW:2,INFO:1}[a.severity]));

    const defs=[
      ["EMPLOYEES","Çalışanlar",employees,activeEmployees.length,"/admin/employees"],
      ["TRAINING","Eğitim",assignments,assignments.rows.length,"/admin/trainings"],
      ["HEALTH","Sağlık",healthExams,healthRows.length,"/admin/health"],
      ["RISK","Risk Yönetimi",matrixRisk,risks.length,"/admin/risk"],
      ["AUDIT","Denetim & DÖF",auditRunsWeb,auditRuns.length,"/admin/denetimler"],
      ["ACCIDENT","Kaza / Olay",accidentsWeb,accidents.length,"/admin/accidents"],
      ["PERIODIC","Periyodik Kontrol",periodic,periodic.rows.length,"/admin/documentation/periodic-controls"],
      ["ENV","Ortam Ölçümleri",environment,environment.rows.length,"/admin/documentation/periodic-controls"],
      ["DOC","Dokümantasyon",docs,docs.rows.length,"/admin/documentation"],
      ["SURVEY","Çalışan Anketleri",surveys,surveys.rows.length,"/admin/documentation"],
      ["EMERGENCY","Acil Durum",emergencyTeams,emergencyTeams.rows.length,"/admin/documentation"],
      ["BOARD","İSG Kurulu",boardMembers,boardMembers.rows.length,"/admin/documentation/board"],
      ["REP","Çalışan Temsilcisi",representatives,representatives.rows.length,"/admin/documentation/employee-representatives"],
      ["PPE","KKD",ppe,ppe.rows.length,"/admin/employees"],
      ["IBYS","İBYS",ibys,ibys.rows.length,"/admin/ibys"],
      ["SUB","Taşeron Yönetimi",subcontractorEmployees,subcontractorEmployees.rows.length,"/admin/subcontractors"],
      ["CBS","ÇBS",cbsForms,cbsForms.rows.length,"/admin/cbs"],
      ["AGENDA","Ajanda",{rows:[],warning:""},0,"/admin/agenda"],
      ["REPORTS","Raporlar",{rows:[],warning:""},0,"/admin/reports"],
    ] as const;

    const modules:ModuleScan[]=defs.map(([key,label,res,total,sourceUrl])=>({
      key,label,available:!res.warning,total,findings:findings.filter(x=>x.domain===label).length,
      status:moduleStatus(findings,label,res.warning),sourceUrl,warning:res.warning||undefined
    }));

    // Ajanda ve Raporlar veri üreten/derleyen modüllerdir; doğrudan boşluk kaynağı değil.
    const agenda=modules.find(x=>x.key==="AGENDA"); if(agenda){agenda.available=true;agenda.status="OK";}
    const reports=modules.find(x=>x.key==="REPORTS"); if(reports){reports.available=true;reports.status="OK";}

    const actionable=findings.filter(x=>x.actionable);
    const reviewOnly=findings.filter(x=>!x.actionable);
    const unavailable=modules.filter(x=>!x.available);

    return NextResponse.json({
      ok:true,
      generatedAt:new Date().toISOString(),
      company:{id:companyId,name:company.name||"Seçili Firma",employeeCount:activeEmployees.length},
      summary:{
        modulesScanned:modules.length,
        modulesAvailable:modules.filter(x=>x.available).length,
        modulesUnavailable:unavailable.length,
        findings:findings.length,
        critical:findings.filter(x=>x.severity==="CRITICAL").length,
        high:findings.filter(x=>x.severity==="HIGH").length,
        medium:findings.filter(x=>x.severity==="MEDIUM").length,
        actionable:actionable.length,
        reviewOnly:reviewOnly.length,
      },
      modules,findings,actionable,reviewOnly,
      philosophy:"DORA tarar ve önerir. Hedef modüle yazma yalnız desteklenen yürütücülerde kullanıcı ONAYLA + BAŞLA sonrasında yapılır."
    });
  }catch(e:any){
    return NextResponse.json({ok:false,error:e?.message||"DORA tam sistem taraması başarısız."},{status:500});
  }
}
