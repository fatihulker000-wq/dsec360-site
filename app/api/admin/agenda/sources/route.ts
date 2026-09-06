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

export async function GET(req:NextRequest){
 try{
  const cs=await cookies(); const auth=cs.get("dsec_admin_auth")?.value; const role=text(cs.get("dsec_admin_role")?.value).toLowerCase(); const cookieFirm=text(cs.get("dsec_company_id")?.value); const requested=text(req.nextUrl.searchParams.get("firmId"));
  if(auth!=="ok") return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});
  const scoped=new Set(["company_admin","workplace_physician","workplace_doctor","isyeri_hekimi","işyeri_hekimi"]);
  const firmId=role==="super_admin"?requested:(scoped.has(role)?cookieFirm:requested||cookieFirm);
  if(!firmId)return NextResponse.json({success:false,error:"Firma UUID bilgisi zorunludur."},{status:400});
  if(scoped.has(role)&&requested&&cookieFirm&&requested!==cookieFirm)return NextResponse.json({success:false,error:"Bu firma için yetkiniz bulunmuyor."},{status:403});
  const s=db(); const records:AgendaSourceRecord[]=[];

  // 1) İSG Kurulu: planlı toplantılar (90 gün) + açık kurul kararları (45 gün/gecikmiş)
  const meetings=await safe(s.from("documentation_board_meetings").select("*").eq("firm_id",firmId).eq("is_deleted",false));
  const meetingIds=(meetings as Row[]).map(x=>text(x.id)).filter(Boolean);
  for(const m of meetings as Row[]){const due=m.meeting_date_millis??m.meeting_date;const st=text(m.status).toUpperCase();if(!due||!within(due,90)||["COMPLETED","CANCELLED","CLOSED"].includes(st))continue;records.push(base(firmId,"BOARD_MEETING",m.id,{title:`İSG Kurul Toplantısı • ${text(m.meeting_title)||text(m.meeting_no)||"Planlı toplantı"}`,note:text(m.meeting_no)?`Toplantı No: ${text(m.meeting_no)}`:null,type:"MEETING",category:"BOARD",due_at:iso(due),priority:1,location:text(m.location)||null,module_ref:"BOARD_MEETING",source_url:"/admin/documentation?tab=board"}))}
  if(meetingIds.length){const decisions=await safe(s.from("documentation_board_decisions").select("*").in("meeting_id",meetingIds).eq("firm_id",firmId).eq("is_deleted",false));for(const d of decisions as Row[]){const st=text(d.decision_status).toUpperCase();const due=d.due_date_millis??d.due_date;if(!due||["COMPLETED","CANCELLED","CLOSED"].includes(st))continue;const pri=priority(d.priority);if(!within(due,45)&&pri<2)continue;records.push(base(firmId,"BOARD_DECISION",d.id,{title:`Kurul Aksiyonu • ${text(d.decision_title)||text(d.decision_no)||"Karar"}`,note:text(d.decision_text)||null,type:"TASK",category:"BOARD_ACTION",due_at:iso(due),priority:pri,assigned_to:text(d.responsible_person)||text(d.responsible_department)||null,module_ref:"BOARD_DECISION",source_url:"/admin/documentation?tab=board"}))}}

  // 2) Periyodik kontrol ve ortam ölçümü: yaklaşan 45 gün + gecikmiş
  const [eqs,measures]=await Promise.all([
   safe(s.from("periodic_control_equipments").select("*").eq("firm_id",firmId).eq("deleted",false)),
   safe(s.from("environment_measurements").select("*").eq("firm_id",firmId).eq("deleted",false))
  ]);
  for(const r of eqs as Row[]){if(!r.next_due_millis||!within(r.next_due_millis,45))continue;const overdue=Number(r.next_due_millis)<now();records.push(base(firmId,"PERIODIC_CONTROL",r.id,{title:`Periyodik Kontrol • ${text(r.equipment_name)||text(r.equipment_type)||"İş ekipmanı"}`,note:text(r.report_no)?`Rapor No: ${text(r.report_no)}`:null,type:"REMINDER",category:"PERIODIC_CONTROL",due_at:iso(r.next_due_millis),priority:overdue?2:1,location:text(r.location)||null,module_ref:"PERIODIC_CONTROL",source_url:"/admin/documentation?tab=periodic-controls"}))}
  for(const r of measures as Row[]){if(!r.next_due_millis||!within(r.next_due_millis,45))continue;const overdue=Number(r.next_due_millis)<now();records.push(base(firmId,"ENVIRONMENT_MEASUREMENT",r.id,{title:`Ortam Ölçümü Yenileme • ${text(r.measurement_type)||"Ölçüm"}`,note:text(r.result_summary)||null,type:"REMINDER",category:"ENVIRONMENT_MEASUREMENT",due_at:iso(r.next_due_millis),priority:overdue?2:1,location:text(r.area_name)||null,assigned_to:text(r.measured_by)||null,module_ref:"ENVIRONMENT_MEASUREMENT",source_url:"/admin/documentation?tab=periodic-controls"}))}

  // 3) Sağlık: yalnızca muayene yenileme tarihi. Tıbbi detay AJANDAYA TAŞINMAZ.
  const employees=await safe(s.from("employees").select("*").eq("firm_id",firmId));
  const employeeIds=(employees as Row[]).map(e=>text(e.id)).filter(Boolean);const names=new Map((employees as Row[]).map(e=>[text(e.id),text(e.full_name)||`${text(e.name)} ${text(e.surname)}`.trim()]));
  if(employeeIds.length){const exams=await safe(s.from("health_examinations").select("id,employee_id,company_id,exam_date,next_exam_date,is_deleted").in("employee_id",employeeIds).eq("company_id",firmId).eq("is_deleted",false).not("next_exam_date","is",null).order("next_exam_date",{ascending:true}));const seen=new Set<string>();for(const e of exams as Row[]){const emp=text(e.employee_id);if(seen.has(emp)||!within(e.next_exam_date,45))continue;seen.add(emp);const overdue=new Date(String(e.next_exam_date)).getTime()<now();records.push(base(firmId,"HEALTH_RENEWAL",e.id,{title:`Sağlık Takibi • ${names.get(emp)||"Çalışan"}`,note:"Periyodik muayene yenileme zamanı. Tıbbi içerik Ajandada gösterilmez.",type:"REMINDER",category:"HEALTH",due_at:iso(e.next_exam_date),priority:overdue?2:1,assigned_to:names.get(emp)||null,assigned_employee_remote_id:emp,module_ref:"HEALTH_RENEWAL",source_url:`/admin/employees?employeeId=${encodeURIComponent(emp)}`}))}}

  // 4) Risk: sadece açık, tarihli ve HIGH/VERY_HIGH/INTOLERABLE veya gecikmiş DÖF
  const [matrix,fine]=await Promise.all([
   safe(s.from("risk_items").select("*").eq("company_id",firmId).eq("is_deleted",false).eq("dof_status","OPEN").not("dof_due_date_millis","is",null)),
   safe(s.from("fine_kinney_risks").select("*").eq("company_id",firmId).eq("is_deleted",false).eq("dof_status","OPEN").not("dof_due_date_millis","is",null))
  ]);
  for(const r of [...(matrix as Row[]),...(fine as Row[])]){const due=Number(r.dof_due_date_millis);const level=text(r.level)||matrixLevel(Number(r.score)||Number(r.probability||0)*Number(r.severity||0));const overdue=due<now();if(!overdue&&!criticalLevel(level))continue;records.push(base(firmId,"RISK_ACTION",r.id,{title:`Risk Aksiyonu • ${text(r.title)||text(r.hazard)||"Risk"}`,note:text(r.dof_action)||null,type:"TASK",category:"RISK",due_at:iso(due),priority:2,location:text(r.location)||null,assigned_to:text(r.dof_responsible)||text(r.responsible)||null,module_ref:"RISK_ACTION",source_url:"/admin/risk-management"}))}

  // 5) Denetim: yalnızca ileri tarihli planlı denetimler. Geçmiş denetim kayıtları Ajandaya taşınmaz.
  const runs=await safe(s.from("denetim_runs").select("*").eq("firm_id",firmId));
  for(const r of runs as Row[]){const due=r.audit_date_millis??r.planned_date_millis??r.due_date_millis;const dueIso=iso(due);if(!dueIso)continue;const ms=new Date(dueIso).getTime();if(ms<now()-86400000||ms>now()+60*86400000)continue;const st=text(r.status).toUpperCase();if(["COMPLETED","CLOSED","CANCELLED"].includes(st))continue;records.push(base(firmId,"INSPECTION_PLAN",r.id,{title:`Planlı Denetim • ${text(r.template_type)||text(r.title)||"Denetim"}`,note:text(r.note)||null,type:"INSPECTION",category:"INSPECTION",due_at:dueIso,priority:1,location:text(r.location)||null,module_ref:"INSPECTION_PLAN",source_url:"/admin/inspections"}))}

  records.sort((a,b)=>(b.priority-a.priority)||((a.due_at?new Date(a.due_at).getTime():9e15)-(b.due_at?new Date(b.due_at).getTime():9e15)));
  return NextResponse.json({success:true,firmId,records,count:records.length,sources:{board:records.filter(x=>x.category.startsWith("BOARD")).length,periodic:records.filter(x=>x.category==="PERIODIC_CONTROL").length,measurement:records.filter(x=>x.category==="ENVIRONMENT_MEASUREMENT").length,health:records.filter(x=>x.category==="HEALTH").length,risk:records.filter(x=>x.category==="RISK").length,inspection:records.filter(x=>x.category==="INSPECTION").length}},{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("Agenda sources GET:",e);return NextResponse.json({success:false,error:e instanceof Error?e.message:"Ajanda kaynakları alınamadı."},{status:500})}
}
