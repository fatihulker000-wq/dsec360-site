import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type Row = Record<string, any>;
type AgendaSourceRecord = {
  id: string; sync_key: string | null; firm_id: number; web_firm_id: string;
  title: string; note: string | null; status: number; priority: number; progress: number;
  type: "TASK"|"MEETING"|"INSPECTION"|"TRAINING"|"VISIT"|"REMINDER";
  category: string; due_at: string | null; end_at: string | null; completed_at: string | null;
  location: string | null; meeting_link: string | null; assigned_employee_local_id: number | null;
  assigned_employee_remote_id: string | null; assigned_to: string | null; assigned_by: string | null;
  participants_csv: string | null; is_all_day: boolean; repeat_type: string | null; repeat_until: string | null;
  module_ref: string; module_ref_id: number | null; module_remote_id: string | null;
  remind_minutes_csv: string | null; remind_at: string | null; source: string;
  source_url: string | null; source_readonly: boolean; is_archived: boolean; is_deleted: boolean;
  created_at: string; updated_at: string;
};

function db(){const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error("Supabase ortam değişkenleri eksik.");return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
const text=(v:any)=>String(v??"").trim();
const num=(v:any)=>{const n=Number(v);return Number.isFinite(n)?n:null};
const iso=(v:any)=>{if(v===null||v===undefined||v==="")return null;const n=num(v);const d=n!==null?new Date(n):new Date(String(v));return Number.isFinite(d.getTime())?d.toISOString():null};
const now=()=>Date.now();
const within=(v:any,days:number)=>{const s=iso(v);if(!s)return false;return new Date(s).getTime()<=now()+days*86400000};
const matrixLevel=(score:number)=>score>=20?"INTOLERABLE":score>=15?"VERY_HIGH":score>=10?"HIGH":score>=5?"MEDIUM":"LOW";
const criticalLevel=(v:any)=>["HIGH","VERY_HIGH","INTOLERABLE","CRITICAL"].includes(text(v).toUpperCase());
function priority(v:any){const s=text(v).toUpperCase();return ["CRITICAL","HIGH","VERY_HIGH","INTOLERABLE"].includes(s)?2:s==="LOW"?0:1}
function base(firmId:string,source:string,id:any,patch:Partial<AgendaSourceRecord>):AgendaSourceRecord{const stamp=new Date().toISOString();return {id:`${source}:${text(id)}`,sync_key:null,firm_id:0,web_firm_id:firmId,title:"Yükümlülük",note:null,status:0,priority:1,progress:0,type:"TASK",category:source,due_at:null,end_at:null,completed_at:null,location:null,meeting_link:null,assigned_employee_local_id:null,assigned_employee_remote_id:null,assigned_to:null,assigned_by:null,participants_csv:null,is_all_day:false,repeat_type:null,repeat_until:null,module_ref:source,module_ref_id:null,module_remote_id:text(id)||null,remind_minutes_csv:null,remind_at:null,source,source_url:null,source_readonly:true,is_archived:false,is_deleted:false,created_at:stamp,updated_at:stamp,...patch}}
async function safe<T=Row[]>(p:PromiseLike<{data:T|null,error:any}>):Promise<T>{try{const r=await p;if(r.error){console.warn("Agenda source skipped:",r.error.message);return [] as T}return (r.data??[]) as T}catch(e){console.warn("Agenda source exception:",e);return [] as T}}


function normalizeHazardClass(value:any){return text(value).toLocaleUpperCase("tr-TR").replace(/\s+/g," ")}
function legalRule(value:any){const n=normalizeHazardClass(value);if(n.includes("ÇOK TEHLİKELİ")||n.includes("COK TEHLIKELI"))return{minutes:960,years:1,label:"Çok Tehlikeli"};if(n.includes("AZ TEHLİKELİ")||n.includes("AZ TEHLIKELI"))return{minutes:480,years:3,label:"Az Tehlikeli"};if(n.includes("TEHLİKELİ")||n.includes("TEHLIKELI"))return{minutes:720,years:2,label:"Tehlikeli"};return{minutes:0,years:0,label:""}}
function trainingCompleted(r:Row){const st=text(r.status).toLocaleUpperCase("tr-TR");return ["COMPLETED","TAMAMLANDI","BAŞARILI","BASARILI","PASSED"].includes(st)||!!r.completed_at||(r.watch_completed===true&&r.final_exam_passed===true)}
function completionDate(r:Row){const raw=r.completed_at||r.started_at||r.created_at;if(!raw)return null;const d=new Date(raw);return Number.isFinite(d.getTime())?d:null}
function addYears(d:Date,y:number){const x=new Date(d);x.setFullYear(x.getFullYear()+y);return x}

export async function GET(req:NextRequest){
 try{
  const cs=await cookies(); const auth=cs.get("dsec_admin_auth")?.value||cs.get("dsec_user_auth")?.value; const role=text(cs.get("dsec_admin_role")?.value||cs.get("dsec_user_role")?.value).toLowerCase(); const cookieFirm=text(cs.get("dsec_company_id")?.value); const requested=text(req.nextUrl.searchParams.get("firmId")); const viewerUserId=text(cs.get("dsec_user_id")?.value); const viewerEmail=text(cs.get("dsec_user_email")?.value||cs.get("dsec_admin_email")?.value);
  if(auth!=="ok") return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});
  const scoped=new Set(["company_admin","workplace_physician","workplace_doctor","isyeri_hekimi","işyeri_hekimi"]);
  const firmId=role==="super_admin"?requested:(scoped.has(role)?cookieFirm:requested||cookieFirm);
  if(!firmId)return NextResponse.json({success:false,error:"Firma UUID bilgisi zorunludur."},{status:400});
  if(scoped.has(role)&&requested&&cookieFirm&&requested!==cookieFirm)return NextResponse.json({success:false,error:"Bu firma için yetkiniz bulunmuyor."},{status:403});
  const s=db(); const records:AgendaSourceRecord[]=[];
  const isPhysician=["workplace_physician","workplace_doctor","isyeri_hekimi","işyeri_hekimi"].includes(role);
  const canOperational=!isPhysician;
  const canHealth=["super_admin","company_admin","demo_user","workplace_physician","workplace_doctor","isyeri_hekimi","işyeri_hekimi"].includes(role);
  let viewerEmployeeId="", viewerName="";
  if(viewerUserId||viewerEmail){let uq=s.from("users").select("id,employee_id,full_name,email,company_id").limit(1);uq=viewerUserId?uq.eq("id",viewerUserId):uq.eq("email",viewerEmail);const ur=await safe(uq);const u=(ur as Row[])[0];if(u&&(!u.company_id||text(u.company_id)===firmId)){viewerEmployeeId=text(u.employee_id);viewerName=text(u.full_name)}}

  // 1) İSG Kurulu: planlı toplantılar (90 gün) + açık kurul kararları (45 gün/gecikmiş)
  const meetings=canOperational?await safe(s.from("documentation_board_meetings").select("*").eq("firm_id",firmId).eq("is_deleted",false)):[];
  const meetingIds=(meetings as Row[]).map(x=>text(x.id)).filter(Boolean);
  for(const m of meetings as Row[]){const due=m.meeting_date_millis??m.meeting_date;const st=text(m.status).toUpperCase();if(!due||!within(due,90)||["COMPLETED","CANCELLED","CLOSED"].includes(st))continue;records.push(base(firmId,"BOARD_MEETING",m.id,{title:`İSG Kurul Toplantısı • ${text(m.meeting_title)||text(m.meeting_no)||"Planlı toplantı"}`,note:text(m.meeting_no)?`Toplantı No: ${text(m.meeting_no)}`:null,type:"MEETING",category:"BOARD",due_at:iso(due),priority:1,location:text(m.location)||null,module_ref:"BOARD_MEETING",source_url:`/admin/documentation/board/${encodeURIComponent(text(m.id))}`}))}
  if(meetingIds.length){const decisions=await safe(s.from("documentation_board_decisions").select("*").in("meeting_id",meetingIds).eq("firm_id",firmId).eq("is_deleted",false));for(const d of decisions as Row[]){const st=text(d.decision_status).toUpperCase();const due=d.due_date_millis??d.due_date;if(!due||["COMPLETED","CANCELLED","CLOSED"].includes(st))continue;const pri=priority(d.priority);if(!within(due,45)&&pri<2)continue;records.push(base(firmId,"BOARD_DECISION",d.id,{title:`Kurul Aksiyonu • ${text(d.decision_title)||text(d.decision_no)||"Karar"}`,note:text(d.decision_text)||null,type:"TASK",category:"BOARD_ACTION",due_at:iso(due),priority:pri,assigned_to:text(d.responsible_person)||text(d.responsible_department)||null,module_ref:"BOARD_DECISION",source_url:`/admin/documentation/board/${encodeURIComponent(text(d.meeting_id))}`}))}}

  // 2) Periyodik kontrol ve ortam ölçümü: yaklaşan 45 gün + gecikmiş
  const [eqs,measures]=canOperational?await Promise.all([
   safe(s.from("periodic_control_equipments").select("*").eq("firm_id",firmId).eq("deleted",false)),
   safe(s.from("environment_measurements").select("*").eq("firm_id",firmId).eq("deleted",false))
  ]):[[],[]];
  for(const r of eqs as Row[]){if(!r.next_due_millis||!within(r.next_due_millis,45))continue;const overdue=Number(r.next_due_millis)<now();records.push(base(firmId,"PERIODIC_CONTROL",r.id,{title:`Periyodik Kontrol • ${text(r.equipment_name)||text(r.equipment_type)||"İş ekipmanı"}`,note:text(r.report_no)?`Rapor No: ${text(r.report_no)}`:null,type:"REMINDER",category:"PERIODIC_CONTROL",due_at:iso(r.next_due_millis),priority:overdue?2:1,location:text(r.location)||null,module_ref:"PERIODIC_CONTROL",source_url:"/admin/documentation/periodic-controls"}))}
  for(const r of measures as Row[]){if(!r.next_due_millis||!within(r.next_due_millis,45))continue;const overdue=Number(r.next_due_millis)<now();records.push(base(firmId,"ENVIRONMENT_MEASUREMENT",r.id,{title:`Ortam Ölçümü Yenileme • ${text(r.measurement_type)||"Ölçüm"}`,note:text(r.result_summary)||null,type:"REMINDER",category:"ENVIRONMENT_MEASUREMENT",due_at:iso(r.next_due_millis),priority:overdue?2:1,location:text(r.area_name)||null,assigned_to:text(r.measured_by)||null,module_ref:"ENVIRONMENT_MEASUREMENT",source_url:"/admin/documentation/periodic-controls"}))}

  // 3) Sağlık: yalnızca muayene yenileme tarihi. Tıbbi detay AJANDAYA TAŞINMAZ.
  const employees=canHealth?await safe(s.from("employees").select("*").eq("firm_id",firmId)):[];
  const employeeIds=(employees as Row[]).map(e=>text(e.id)).filter(Boolean);const names=new Map((employees as Row[]).map(e=>[text(e.id),text(e.full_name)||`${text(e.name)} ${text(e.surname)}`.trim()]));
  if(employeeIds.length){const exams=await safe(s.from("health_examinations").select("id,employee_id,company_id,exam_date,next_exam_date,is_deleted").in("employee_id",employeeIds).eq("company_id",firmId).eq("is_deleted",false).not("next_exam_date","is",null).order("next_exam_date",{ascending:true}));const seen=new Set<string>();for(const e of exams as Row[]){const emp=text(e.employee_id);if(seen.has(emp)||!within(e.next_exam_date,45))continue;seen.add(emp);const overdue=new Date(String(e.next_exam_date)).getTime()<now();records.push(base(firmId,"HEALTH_RENEWAL",e.id,{title:`Sağlık Takibi • ${names.get(emp)||"Çalışan"}`,note:"Periyodik muayene yenileme zamanı. Tıbbi içerik Ajandada gösterilmez.",type:"REMINDER",category:"HEALTH",due_at:iso(e.next_exam_date),priority:overdue?2:1,assigned_to:names.get(emp)||null,assigned_employee_remote_id:emp,module_ref:"HEALTH_RENEWAL",source_url:`/admin/health/employees/${encodeURIComponent(emp)}?tab=Muayeneler`}))}}

  // 4) Risk: sadece açık, tarihli ve HIGH/VERY_HIGH/INTOLERABLE veya gecikmiş DÖF
  const [matrix,fine]=canOperational?await Promise.all([
   safe(s.from("risk_items").select("*").eq("company_id",firmId).eq("is_deleted",false).eq("dof_status","OPEN").not("dof_due_date_millis","is",null)),
   safe(s.from("fine_kinney_risks").select("*").eq("company_id",firmId).eq("is_deleted",false).eq("dof_status","OPEN").not("dof_due_date_millis","is",null))
  ]):[[],[]];
  for(const r of [...(matrix as Row[]),...(fine as Row[])]){const due=Number(r.dof_due_date_millis);const level=text(r.level)||matrixLevel(Number(r.score)||Number(r.probability||0)*Number(r.severity||0));const overdue=due<now();if(!overdue&&!criticalLevel(level))continue;records.push(base(firmId,"RISK_ACTION",r.id,{title:`Risk Aksiyonu • ${text(r.title)||text(r.hazard)||"Risk"}`,note:text(r.dof_action)||null,type:"TASK",category:"RISK",due_at:iso(due),priority:2,location:text(r.location)||null,assigned_to:text(r.dof_responsible)||text(r.responsible)||null,module_ref:"RISK_ACTION",source_url:"/admin/risk"}))}

  // 5) Denetim: yalnızca ileri tarihli planlı denetimler. Geçmiş denetim kayıtları Ajandaya taşınmaz.
  const runs=canOperational?await safe(s.from("denetim_runs").select("*").eq("firm_id",firmId)):[];
  for(const r of runs as Row[]){const due=r.audit_date_millis??r.planned_date_millis??r.due_date_millis;const dueIso=iso(due);if(!dueIso)continue;const ms=new Date(dueIso).getTime();if(ms<now()-86400000||ms>now()+60*86400000)continue;const st=text(r.status).toUpperCase();if(["COMPLETED","CLOSED","CANCELLED"].includes(st))continue;records.push(base(firmId,"INSPECTION_PLAN",r.id,{title:`Planlı Denetim • ${text(r.template_type)||text(r.title)||"Denetim"}`,note:text(r.note)||null,type:"INSPECTION",category:"INSPECTION",due_at:dueIso,priority:1,location:text(r.location)||null,module_ref:"INSPECTION_PLAN",source_url:`/admin/denetimler/${encodeURIComponent(text(r.id))}`}))}

  // 6) Eğitim: tüm atamalar DEĞİL; yasal süre açığı ve 45 gün içinde yasal geçerliliği düşecek çalışanlar toplulaştırılır.
  if(canOperational){
   const companyRows=await safe(s.from("companies").select("id,tehlike_sinifi").eq("id",firmId).limit(1));
   const rule=legalRule((companyRows as Row[])[0]?.tehlike_sinifi);
   if(rule.minutes>0){
    const empRows=await safe(s.from("employees").select("id,full_name,name,surname").eq("firm_id",firmId));
    const empIds=(empRows as Row[]).map(e=>text(e.id)).filter(Boolean);
    const userRows=empIds.length?await safe(s.from("users").select("id,employee_id,company_id").in("employee_id",empIds).eq("company_id",firmId)):[];
    const userToEmp=new Map((userRows as Row[]).map(u=>[text(u.id),text(u.employee_id)]));
    const userIds=[...userToEmp.keys()];
    const assigns=userIds.length?await safe(s.from("training_assignments").select("id,user_id,training_id,status,watch_completed,final_exam_passed,started_at,completed_at,created_at").in("user_id",userIds)):[];
    const tids=[...new Set((assigns as Row[]).map(a=>text(a.training_id)).filter(Boolean))];
    const defs=tids.length?await safe(s.from("trainings").select("id,title,duration_minutes,type").in("id",tids)):[];
    const defMap=new Map((defs as Row[]).map(t=>[text(t.id),t]));
    const byEmp=new Map<string,Row[]>();
    for(const a of assigns as Row[]){const eid=userToEmp.get(text(a.user_id));if(!eid)continue;const d=defMap.get(text(a.training_id))||{};(byEmp.get(eid)||byEmp.set(eid,[]).get(eid)!).push({...a,duration_minutes:Number(d.duration_minutes)||0,title:d.title})}
    let missingCount=0,missingMinutes=0,expiringCount=0;let earliestExpiry:Date|null=null;
    const horizon=now()+45*86400000;
    for(const e of empRows as Row[]){const rows=byEmp.get(text(e.id))||[];let validNow=0,validAfter=0;for(const r of rows){if(!trainingCompleted(r))continue;const cd=completionDate(r);if(!cd)continue;const until=addYears(cd,rule.years);const mins=Math.max(0,Number(r.duration_minutes)||0);if(until.getTime()>=now())validNow+=mins;if(until.getTime()>horizon)validAfter+=mins;if(until.getTime()>=now()&&until.getTime()<=horizon&&(!earliestExpiry||until<earliestExpiry))earliestExpiry=until}
      if(validNow<rule.minutes){missingCount++;missingMinutes+=rule.minutes-validNow}else if(validAfter<rule.minutes){expiringCount++}
    }
    if(missingCount>0){records.push(base(firmId,"TRAINING_LEGAL_GAP","legal-gap",{title:`Yasal Eğitim Açığı • ${missingCount} çalışan`,note:`${rule.label} sınıfı için kişi başı ${rule.minutes/60} saat yasal eğitim gerekliliği. Toplam ${Math.ceil(missingMinutes/60)} saat eğitim açığı bulunuyor.`,type:"TRAINING",category:"TRAINING_LEGAL_GAP",due_at:new Date().toISOString(),priority:2,module_ref:"TRAINING_LEGAL_GAP",module_remote_id:"legal-gap",source_url:"/admin/trainings"}))}
    if(expiringCount>0){records.push(base(firmId,"TRAINING_RENEWAL","legal-renewal",{title:`Eğitim Geçerliliği Yaklaşıyor • ${expiringCount} çalışan`,note:`Önümüzdeki 45 gün içinde ${expiringCount} çalışanın geçerli eğitim süresi yasal eşiğin altına düşecek.`,type:"TRAINING",category:"TRAINING_RENEWAL",due_at:(earliestExpiry||new Date(horizon)).toISOString(),priority:1,module_ref:"TRAINING_RENEWAL",module_remote_id:"legal-renewal",source_url:"/admin/trainings"}))}
   }
  }


  // 8) ÇBS: Ajandayı kalabalıklaştırmamak için yalnızca kritik, SLA aşılmış
  // veya SLA bitimine 8 saatten az kalmış AÇIK kayıtlar.
  if(canOperational){
    const cbsRows=await safe(
      s.from("cbs_forms")
       .select("id,reference_no,application_type,category,category_code,priority,status,sla_due_at,created_at,updated_at,firm_id")
       .eq("firm_id",firmId)
    );
    const closedCbs=new Set(["closed","resolved","rejected","duplicate","cancelled"]);
    const slaSoonMs=8*60*60*1000;
    for(const c of cbsRows as Row[]){
      const st=text(c.status).toLowerCase();
      if(closedCbs.has(st)) continue;

      const p=text(c.priority).toLowerCase();
      const dueIso=iso(c.sla_due_at);
      const dueMs=dueIso?new Date(dueIso).getTime():NaN;
      const overdue=Number.isFinite(dueMs)&&dueMs<now();
      const approaching=Number.isFinite(dueMs)&&dueMs>=now()&&(dueMs-now())<=slaSoonMs;
      const critical=p==="critical";

      if(!critical&&!overdue&&!approaching) continue;

      const ref=text(c.reference_no)||`#${text(c.id)}`;
      const reason=overdue
        ?"SLA süresi aşıldı"
        : critical
          ?"Kritik öncelikli ÇBS kaydı"
          :"SLA bitimine 8 saatten az kaldı";
      const categoryLabel=text(c.category)||text(c.category_code)||"Genel";

      records.push(base(firmId,"CBS",c.id,{
        title:`ÇBS • ${ref} • ${reason}`,
        note:`Kategori: ${categoryLabel}. Başvuru operasyon merkezinde takip edilmelidir.`,
        type:"TASK",
        category:overdue?"CBS_SLA_OVERDUE":critical?"CBS_CRITICAL":"CBS_SLA_APPROACHING",
        due_at:dueIso||iso(c.created_at)||new Date().toISOString(),
        priority:2,
        module_ref:"CBS",
        module_remote_id:text(c.id),
        source_url:`/admin/cbs?search=${encodeURIComponent(ref)}`
      }));
    }
  }

  records.sort((a,b)=>(b.priority-a.priority)||((a.due_at?new Date(a.due_at).getTime():9e15)-(b.due_at?new Date(b.due_at).getTime():9e15)));
  return NextResponse.json({success:true,firmId,records,count:records.length,viewer:{employeeId:viewerEmployeeId||null,name:viewerName||null,role},sources:{board:records.filter(x=>x.category.startsWith("BOARD")).length,periodic:records.filter(x=>x.category==="PERIODIC_CONTROL").length,measurement:records.filter(x=>x.category==="ENVIRONMENT_MEASUREMENT").length,health:records.filter(x=>x.category==="HEALTH").length,risk:records.filter(x=>x.category==="RISK").length,inspection:records.filter(x=>x.category==="INSPECTION").length,training:records.filter(x=>x.category.startsWith("TRAINING")).length,cbs:records.filter(x=>x.category.startsWith("CBS")).length}},{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("Agenda sources GET:",e);

return NextResponse.json({success:false,error:e instanceof Error?e.message:"Ajanda kaynakları alınamadı."},{status:500})}
}
