import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
type Row = Record<string, any>;

function db(){return createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);}
function s(v:any){return String(v??"").trim();}
function dateOnly(d:Date){return d.toISOString().slice(0,10);}
function daysTo(v:string){const a=new Date();a.setHours(0,0,0,0);const b=new Date(v+"T00:00:00");return Math.ceil((b.getTime()-a.getTime())/86400000);}
function uniqueEmployeeCount(rows:Row[]){return new Set(rows.map(x=>s(x.employee_id)).filter(Boolean)).size;}

export async function GET(){
 try{
  const cs=await cookies();
  const auth=s(cs.get("dsec_admin_auth")?.value||cs.get("dsec_user_auth")?.value);
  const role=s(cs.get("dsec_admin_role")?.value||cs.get("dsec_user_role")?.value);
  const cookieCompany=s(cs.get("dsec_company_id")?.value);
  const allowed=["admin","super_admin","company_admin","demo_user"];
  if(auth!=="ok"||!allowed.includes(role)) return NextResponse.json({error:"Yetkisiz erişim."},{status:401});
  const scoped=role==="company_admin"||role==="demo_user";
  if(scoped&&!cookieCompany) return NextResponse.json({error:"Kullanıcı için firma bilgisi bulunamadı."},{status:403});

  const supabase=db();
  let eq=supabase.from("employees").select("id,full_name,firm_id,job_title,active").limit(10000);
  if(scoped) eq=eq.eq("firm_id",cookieCompany);
  const {data:employees,error:ee}=await eq;
  if(ee) throw ee;
  const activeEmployees=(employees||[]).filter((x:any)=>x.active!==false);
  const employeeIds=activeEmployees.map((x:any)=>s(x.id)).filter(Boolean);
  const employeeSet=new Set(employeeIds);

  let exq=supabase.from("health_examinations").select("id,employee_id,company_id,exam_type,exam_date,next_exam_date,decision,bmi,systolic,diastolic,spo2,created_at,is_deleted").or("is_deleted.eq.false,is_deleted.is.null").limit(10000);
  let ekq=supabase.from("health_ek2_forms").select("id,employee_id,company_id,status,exam_date,next_exam_date,decision,created_at,is_active").limit(10000);
  let prq=supabase.from("health_prescriptions").select("id,employee_id,company_id,status,created_at,is_active,health_prescription_items(id)").eq("is_active",true).limit(10000);
  if(scoped){exq=exq.eq("company_id",cookieCompany);ekq=ekq.eq("company_id",cookieCompany);prq=prq.eq("company_id",cookieCompany);}
  const [exr,ekr,prr]=await Promise.all([exq,ekq,prq]);
  if(exr.error) throw exr.error;
  if(ekr.error) throw ekr.error;
  if(prr.error) throw prr.error;

  const exams=(exr.data||[]).filter((x:any)=>employeeSet.has(s(x.employee_id)));
  const ek2=(ekr.data||[]).filter((x:any)=>x.is_active!==false&&employeeSet.has(s(x.employee_id)));
  const prescriptions=(prr.data||[]).filter((x:any)=>employeeSet.has(s(x.employee_id)));

  const today=dateOnly(new Date());
  const d30=new Date(); d30.setDate(d30.getDate()+30); const day30=dateOnly(d30);
  const d90=new Date(); d90.setDate(d90.getDate()+90); const day90=dateOnly(d90);

  const healthIds=new Set([...exams,...ek2,...prescriptions].map((x:any)=>s(x.employee_id)).filter(Boolean));
  const examIds=new Set(exams.map((x:any)=>s(x.employee_id)).filter(Boolean));
  const ek2Ids=new Set(ek2.map((x:any)=>s(x.employee_id)).filter(Boolean));

  // Latest examination per employee prevents an old overdue record from making a currently valid employee overdue.
  const latestByEmployee=new Map<string,Row>();
  for(const x of [...exams].sort((a:any,b:any)=>s(b.exam_date).localeCompare(s(a.exam_date)))){
    const id=s(x.employee_id); if(id&&!latestByEmployee.has(id)) latestByEmployee.set(id,x);
  }
  const latest=[...latestByEmployee.values()];
  const overdue=latest.filter((x:any)=>s(x.next_exam_date)&&s(x.next_exam_date)<today);
  const upcoming30=latest.filter((x:any)=>s(x.next_exam_date)>=today&&s(x.next_exam_date)<=day30);
  const upcoming90=latest.filter((x:any)=>s(x.next_exam_date)>=today&&s(x.next_exam_date)<=day90);
  const critical=latest.filter((x:any)=>{
    const decision=s(x.decision).toLocaleUpperCase("tr-TR");
    return decision.includes("UYGUN DEĞİL")||decision.includes("KISITLI")||Number(x.bmi||0)>=30||Number(x.systolic||0)>=140||Number(x.diastolic||0)>=90||(Number(x.spo2||0)>0&&Number(x.spo2||0)<92);
  });

  const empMap=Object.fromEntries(activeEmployees.map((x:any)=>[s(x.id),x]));
  const recentExaminations=[...exams].sort((a:any,b:any)=>s(b.exam_date).localeCompare(s(a.exam_date))).slice(0,10).map((x:any)=>({
    id:x.id,employeeName:empMap[s(x.employee_id)]?.full_name||"Çalışan",companyName:"",examType:x.exam_type||"Muayene",examDate:x.exam_date||"",decision:x.decision||"",jobTitle:empMap[s(x.employee_id)]?.job_title||""
  }));
  const recentEk2=[...ek2].sort((a:any,b:any)=>s(b.exam_date||b.created_at).localeCompare(s(a.exam_date||a.created_at))).slice(0,10).map((x:any)=>({
    id:x.id,employeeName:empMap[s(x.employee_id)]?.full_name||"Çalışan",companyName:"",decision:x.decision||x.status||"",createdAt:x.exam_date||x.created_at||""
  }));
  const recentPrescriptions=[...prescriptions].sort((a:any,b:any)=>s(b.created_at).localeCompare(s(a.created_at))).slice(0,10).map((x:any)=>({
    id:x.id,employeeName:empMap[s(x.employee_id)]?.full_name||"Çalışan",companyName:"",medicineCount:Array.isArray(x.health_prescription_items)?x.health_prescription_items.length:0,createdAt:x.created_at||""
  }));
  const upcomingExams=upcoming90.sort((a:any,b:any)=>s(a.next_exam_date).localeCompare(s(b.next_exam_date))).slice(0,10).map((x:any)=>({
    id:x.id,employeeName:empMap[s(x.employee_id)]?.full_name||"Çalışan",companyName:"",examType:x.exam_type||"Muayene",dueDate:x.next_exam_date||"",decision:x.decision||"",jobTitle:empMap[s(x.employee_id)]?.job_title||"",daysLeft:daysTo(x.next_exam_date)
  }));

  const alerts=[
    ...overdue.slice(0,5).map((x:any)=>({id:`overdue-${x.id}`,level:"Kritik",title:"Muayene süresi geçmiş",desc:`${empMap[s(x.employee_id)]?.full_name||"Çalışan"} için sistemdeki son muayene kaydının takip tarihi geçti: ${x.next_exam_date}`})),
    ...critical.slice(0,5).map((x:any)=>({id:`critical-${x.id}`,level:"Uyarı",title:"Sağlık kaydı takip gerektiriyor",desc:`${empMap[s(x.employee_id)]?.full_name||"Çalışan"} için kayıtlı karar/bulgular hekim değerlendirmesi gerektiriyor.`}))
  ];

  const total=activeEmployees.length;
  return NextResponse.json({
    success:true,role,read_only:role==="demo_user",
    summary:{
      totalEmployees:total,
      employeesWithHealthRecord:healthIds.size,
      employeesMissingHealthRecord:Math.max(0,total-healthIds.size),
      healthCoveragePercent:total?Math.round(healthIds.size*100/total):0,
      employeesWithExamination:examIds.size,
      employeesMissingExamination:Math.max(0,total-examIds.size),
      ek2Present:ek2Ids.size,
      ek2Missing:Math.max(0,total-ek2Ids.size),
      examinationRecords:exams.length,
      ek2Records:ek2.length,
      prescriptionRecords:prescriptions.length,
      todayExams:exams.filter((x:any)=>x.exam_date===today).length,
      upcomingExams:upcoming90.length,
      criticalUpcomingExams:upcoming30.length,
      overdueExams:overdue.length,
      todayPrescriptions:prescriptions.filter((x:any)=>s(x.created_at).slice(0,10)===today).length,
      openAccidents:0,
      upcomingVaccines:0,
      criticalAlerts:alerts.length,
      riskyEmployees:uniqueEmployeeCount(critical)
    },
    upcomingExams,recentExaminations,recentPrescriptions,recentEk2,
    alerts:alerts.length?alerts:[{id:"health-ok",level:"Bilgi",title:"Sağlık kayıtları izleniyor",desc:"Aktif çalışan, muayene, EK-2 ve reçete kayıtları dashboard'a bağlandı."}],
    dataNotes:[
      "Sağlık kaydı kapsamı; muayene, EK-2 veya reçete kaydı bulunan aktif çalışanları gösterir.",
      "Eksik ifadesi, D-SEC içinde eşleşen kayıt bulunamadığını ifade eder; tıbbi işlemin gerçekte yapılmadığını tek başına kanıtlamaz.",
      "Aşı ve iş kazası KPI'ları kaynak tabloları ayrıca doğrulanana kadar 0 olarak klinik sonuç şeklinde yorumlanmamalıdır."
    ]
  });
 }catch(e:any){
  console.error("HEALTH DASHBOARD ERROR:",e);
  return NextResponse.json({error:e?.message||"Sağlık dashboard oluşturulamadı."},{status:500});
 }
}
