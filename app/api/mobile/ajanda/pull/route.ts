import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

type RawRow = Record<string, any>;
const text = (v: unknown) => String(v ?? "").trim();
const isoToMillis = (v: string | null | undefined) => {
  if (!v) return null;
  const n = new Date(v).getTime();
  return Number.isFinite(n) ? n : null;
};
const booleanToInt = (v: unknown) => v === true ? 1 : 0;
const parsePositiveLong = (v: string | null) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const syncMillis = (row: RawRow) => {
  const appMs = Number(row.app_updated_at ?? 0);
  const dbMs = isoToMillis(row.updated_at) ?? 0;
  const createdMs = Number(row.app_created_at ?? 0) || (isoToMillis(row.created_at) ?? 0);
  return Math.max(
    Number.isFinite(appMs) ? appMs : 0,
    dbMs,
    Number.isFinite(createdMs) ? createdMs : 0
  );
};


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



async function buildFirmSourceRecords(
  firmId: string,
  role: string,
  viewerUserId: string,
  viewerEmail: string
): Promise<AgendaSourceRecord[]> {
  const s=supabase; const records:AgendaSourceRecord[]=[];
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
  return records;
}

function sourceIdentity(item: any) {
  // Web app/admin/agenda/api.ts ile BİREBİR aynı kimlik.
  return `${text(item.web_firm_id)}|${text(item.module_ref || item.source)}|${text(item.module_remote_id || item.module_ref_id || item.id)}`;
}

function requireMobileKey(req: NextRequest) {
  const configured = text(process.env.DSEC_MOBILE_API_KEY || "dsec_mobile_123");
  if (text(req.headers.get("x-api-key")) !== configured) {
    throw Object.assign(new Error("Geçersiz mobil API anahtarı."), { status: 401 });
  }
}

async function resolveViewer(req: NextRequest) {
  requireMobileKey(req);
  const email = text(req.headers.get("x-user-email")).toLowerCase();
  if (!email) throw Object.assign(new Error("x-user-email zorunludur."), { status: 401 });

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id,role,company_id")
    .ilike("email", email)
    .maybeSingle();
  if (userError) throw userError;
  if (!user?.id) throw Object.assign(new Error("Kullanıcı bulunamadı."), { status: 401 });

  let ids: string[] = [];
  const role = text(user.role).toLowerCase();
  if (role === "super_admin" || role === "admin") {
    const { data, error } = await supabase.from("companies").select("id").eq("is_active", true);
    if (error) throw error;
    ids = (data ?? []).map((x) => text(x.id)).filter(Boolean);
  } else {
    const { data, error } = await supabase.from("user_firm_access").select("firm_id").eq("user_id", user.id);
    if (error) throw error;
    ids = (data ?? []).map((x) => text(x.firm_id)).filter(Boolean);
    if (!ids.length && text(user.company_id)) ids = [text(user.company_id)];
    if (ids.length) {
      const { data: active, error: e2 } = await supabase.from("companies").select("id").in("id", [...new Set(ids)]).eq("is_active", true);
      if (e2) throw e2;
      ids = (active ?? []).map((x) => text(x.id)).filter(Boolean);
    }
  }

  return { userId: text(user.id), role, email, allowedFirmIds: [...new Set(ids)] };
}

async function resolveFirm(firmId: number | null, webFirmId: string | null, allowed: string[]) {
  let webId = webFirmId;
  if (!webId && firmId) {
    const { data, error } = await supabase.from("companies").select("id,local_firm_id").eq("local_firm_id", firmId).eq("is_active", true).maybeSingle();
    if (error) throw error;
    webId = text(data?.id) || null;
  }
  if (!webId || !allowed.includes(webId)) throw Object.assign(new Error("Firma yetkisi bulunmuyor veya firma pasif."), { status: 403 });

  const { data, error } = await supabase.from("companies").select("id,local_firm_id").eq("id", webId).eq("is_active", true).maybeSingle();
  if (error) throw error;
  if (!data?.id) throw Object.assign(new Error("Aktif firma bulunamadı."), { status: 403 });
  const localId = Number(data.local_firm_id ?? firmId);
  if (!Number.isFinite(localId) || localId <= 0) throw Object.assign(new Error("Firma local_firm_id bilgisi eksik."), { status: 400 });
  return { webFirmId: webId, localFirmId: Math.trunc(localId) };
}

const SELECT = `id,sync_key,firm_id,web_firm_id,title,note,status,priority,progress,type,category,due_at,end_at,completed_at,location,meeting_link,assigned_employee_local_id,assigned_employee_remote_id,assigned_to,assigned_by,created_by_user_id,participants_csv,is_all_day,module_ref,module_ref_id,module_remote_id,parent_task_id,parent_remote_id,remind_minutes_csv,remind_at,repeat_type,repeat_until,source,is_archived,is_deleted,deleted_at,app_created_at,app_updated_at,created_at,updated_at`;

function toRecord(item: RawRow, localFirmId: number) {
  return {
    remote_id: item.id,
    sync_key: item.sync_key,
    firm_id: localFirmId,
    web_firm_id: item.web_firm_id,
    title: item.title,
    note: item.note,
    status: item.status,
    priority: item.priority,
    progress: item.progress,
    type: item.type,
    category: item.category,
    due_at_millis: isoToMillis(item.due_at),
    end_at_millis: isoToMillis(item.end_at),
    completed_at_millis: isoToMillis(item.completed_at),
    location: item.location,
    meeting_link: item.meeting_link,
    assigned_employee_local_id: item.assigned_employee_local_id,
    assigned_employee_remote_id: item.assigned_employee_remote_id,
    assigned_to: item.assigned_to,
    assigned_by: item.assigned_by,
    created_by_user_id: item.created_by_user_id,
    participants_csv: item.participants_csv,
    is_all_day: booleanToInt(item.is_all_day),
    module_ref: item.module_ref,
    module_ref_id: item.module_ref_id,
    module_remote_id: item.module_remote_id,
    parent_task_id: item.parent_task_id,
    parent_remote_id: item.parent_remote_id,
    remind_minutes_csv: item.remind_minutes_csv,
    remind_at_millis: isoToMillis(item.remind_at),
    repeat_type: item.repeat_type,
    repeat_until_millis: isoToMillis(item.repeat_until),
    source: item.source,
    is_archived: booleanToInt(item.is_archived),
    is_deleted: booleanToInt(item.is_deleted),
    deleted_at_millis: isoToMillis(item.deleted_at),
    created_at_millis: item.app_created_at ?? isoToMillis(item.created_at) ?? Date.now(),
    updated_at_millis: item.app_updated_at ?? isoToMillis(item.updated_at) ?? Date.now(),
    server_updated_at_millis: syncMillis(item),
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const viewer = await resolveViewer(req);
    const { searchParams } = new URL(req.url);
    const firmId = parsePositiveLong(searchParams.get("firm_id"));
    const webFirmId = text(searchParams.get("web_firm_id")) || null;
    const scope = text(searchParams.get("scope") || "FIRM").toUpperCase();
    const cursor = Math.max(0, Number(searchParams.get("updated_after_millis") ?? 0) || 0);
    const requestedLimit = Number(searchParams.get("limit") ?? 250);
    const limit = Math.min(500, Math.max(1, Number.isFinite(requestedLimit) ? requestedLimit : 250));
    const afterIso = cursor > 0 ? new Date(cursor).toISOString() : null;

    // PERSONAL_ALL: seçili firmadan bağımsız, oturum kullanıcısının
    // bütün AKTİF ve YETKİLİ firmalarındaki kişisel kayıtlarını tek akışta döndürür.
    if (scope === "PERSONAL_ALL") {
      if (!viewer.allowedFirmIds.length) {
        return NextResponse.json({
          success: true, count: 0, records: [],
          next_updated_after_millis: cursor, has_more: false
        });
      }

      let query = supabase
        .from("ajanda_tasks")
        .select(SELECT)
        .in("web_firm_id", viewer.allowedFirmIds)
        .eq("category", "PERSONAL")
        .eq("created_by_user_id", viewer.userId)
        .order("app_updated_at", { ascending: true, nullsFirst: false })
        .order("updated_at", { ascending: true, nullsFirst: false })
        .limit(limit);

      if (cursor > 0 && afterIso) {
        query = query.or(`app_updated_at.gt.${cursor},updated_at.gt.${afterIso}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as RawRow[];
      const records = rows.map((x) => {
        const localId = Number(x.firm_id ?? 0);
        return toRecord(x, Number.isFinite(localId) && localId > 0 ? Math.trunc(localId) : 0);
      });

      const nextCursor = rows.length
        ? Math.max(cursor, ...rows.map(syncMillis))
        : cursor;

      return NextResponse.json({
        success: true,
        count: records.length,
        records,
        next_updated_after_millis: nextCursor,
        has_more: rows.length >= limit,
        scope: "PERSONAL_ALL"
      });
    }

    // FIRM: yalnız seçili firmanın ortak ajandası; PERSONAL kayıtlar hariç.
    if (!firmId && !webFirmId) {
      return NextResponse.json(
        { success: false, error: "firm_id or web_firm_id required" },
        { status: 400 }
      );
    }

    const resolved = await resolveFirm(firmId, webFirmId, viewer.allowedFirmIds);

    // FIRM incremental değildir. Firma Ajandası; Web'deki gibi her yenilemede
    // güncel TAM SNAPSHOT olarak üretilir. Çünkü /agenda/sources kayıtları
    // dinamik kaynaklardan hesaplanır ve bir kayıt artık üretilmiyorsa App'in
    // eski kopyayı saklamaması gerekir.
    const [firmRes, generatedSources] = await Promise.all([
      supabase
        .from("ajanda_tasks")
        .select(SELECT)
        .eq("web_firm_id", resolved.webFirmId)
        .eq("is_deleted", false)
        .eq("is_archived", false)
        .or("category.is.null,category.neq.PERSONAL")
        .order("status", { ascending: true })
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("updated_at", { ascending: false }),
      buildFirmSourceRecords(
        resolved.webFirmId,
        viewer.role,
        viewer.userId,
        viewer.email
      )
    ]);

    if (firmRes.error) throw firmRes.error;

    const manualRows = (firmRes.data ?? []) as RawRow[];
    const sourceRows: RawRow[] = generatedSources.map((x) => ({
      ...x,
      created_by_user_id: null,
      app_created_at: isoToMillis(x.created_at),
      app_updated_at: isoToMillis(x.updated_at)
    }));

    // Web app/admin/agenda/api.ts ile aynı merge:
    // önce otomatik kaynak, sonra aynı identity varsa gerçek/manual kayıt üstün gelir.
    const merged = new Map<string, RawRow>();
    for (const row of sourceRows) merged.set(sourceIdentity(row), row);
    for (const row of manualRows) merged.set(sourceIdentity(row), row);

    const rows = [...merged.values()].sort((a,b) =>
      (Number(b.priority ?? 0) - Number(a.priority ?? 0)) ||
      ((a.due_at ? new Date(a.due_at).getTime() : Number.MAX_SAFE_INTEGER) -
       (b.due_at ? new Date(b.due_at).getTime() : Number.MAX_SAFE_INTEGER))
    );

    const records = rows.map((x) => toRecord(x, resolved.localFirmId));

    // Web useAgendaStats ile aynı kurallar. Tanılama ve geriye uyumluluk için
    // yanıtta tutuluyor; Android ekranı artık ayrı veri seti kullanmıyor.
    const activeRows = rows.filter((x) => !x.is_deleted && !x.is_archived);
    const openRows = activeRows.filter((x) => Number(x.status) === 0);
    const doneRows = activeRows.filter((x) => Number(x.status) === 1);

    const startToday = new Date(); startToday.setHours(0,0,0,0);
    const endToday = new Date(); endToday.setHours(23,59,59,999);
    const end7 = new Date(endToday.getTime() + 7 * 86400000);

    const stats = {
      total: activeRows.length,
      open: openRows.length,
      done: doneRows.length,
      today: openRows.filter((x) => {
        if (!x.due_at) return false;
        const d = new Date(x.due_at);
        return Number.isFinite(d.getTime()) && d >= startToday && d <= endToday;
      }).length,
      upcoming: openRows.filter((x) => {
        if (!x.due_at) return false;
        const d = new Date(x.due_at);
        return Number.isFinite(d.getTime()) && d > endToday && d <= end7;
      }).length,
      overdue: openRows.filter((x) => {
        if (!x.due_at) return false;
        const ms = new Date(x.due_at).getTime();
        return Number.isFinite(ms) && ms < Date.now();
      }).length,
      critical: openRows.filter((x) => Number(x.priority) >= 2).length
    };

    return NextResponse.json({
      success: true,
      count: records.length,
      records,
      stats,
      // FIRM her zaman tek parça TAM snapshot'tır.
      snapshot: true,
      has_more: false,
      next_updated_after_millis: Date.now(),
      scope: "FIRM",
      parity: "WEB_AGENDA_CANONICAL_SNAPSHOT"
    });
  } catch (error: any) {
    console.error("Ajanda mobile pull exception:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Beklenmeyen sunucu hatası" },
      { status: Number(error?.status) || 500 }
    );
  }
}
