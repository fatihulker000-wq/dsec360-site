import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveReportScope } from "../../reports/_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;
type ExecutorKind = "EMERGENCY_SUPPORT_TEAM" | "EMPLOYEE_REPRESENTATIVE" | "TRAINING_ASSIGNMENT" | "ISG_BOARD_MEMBER" | "";

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are missing.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function text(v: unknown) { return String(v ?? "").trim(); }
function norm(v: unknown) {
  return text(v).toLocaleUpperCase("tr-TR")
    .replaceAll("İ","I").replaceAll("Ş","S").replaceAll("Ğ","G")
    .replaceAll("Ü","U").replaceAll("Ö","O").replaceAll("Ç","C")
    .replace(/[^A-Z0-9]+/g,"_");
}
function hay(row:AnyRow){
  return norm([row.source_gap_id,row.source_domain,row.title,row.description,row.recommendation,JSON.stringify(row.requested_payload||{})].join(" "));
}
function employeeName(e: AnyRow) { return text(e.full_name || e.name || e.employee_name); }
function employeeDepartment(e: AnyRow) { return text(e.department || e.department_name || e.unit || e.job_title) || "-"; }
function employeePhone(e: AnyRow) { return text(e.phone || e.mobile_phone || e.mobile || e.telephone) || "-"; }

function executorKindFor(row:AnyRow):ExecutorKind {
  const h=hay(row);
  if(text(row.source_gap_id)==="isg-board" || h.includes("ISG_KURULU_YAPISI")) return "ISG_BOARD_MEMBER";
  if(h.includes("CALISAN_TEMSILCI") || text(row.source_gap_id)==="employee-representatives") return "EMPLOYEE_REPRESENTATIVE";
  if(!h.includes("YILLIK_EGITIM_PLANI") && !h.includes("DOKUMAN") && (h.includes("EGITIM_TAMAMLAMA") || h.includes("TAMAMLANMAMIS_EGITIM") || h.includes("EGITIM_ATAMA") || h.includes("ATANMAMIS_EGITIM"))) return "TRAINING_ASSIGNMENT";
  if(
    h.includes("KORUMA") || h.includes("SONDUR") || h.includes("YANGINLA_MUCADELE") ||
    h.includes("KURTAR") || h.includes("ARAMA_KURTARMA") ||
    h.includes("ILKYARDIM") || h.includes("ILK_YARDIM") || h.includes("FIRST_AID")
  ) return "EMERGENCY_SUPPORT_TEAM";
  return "";
}

function teamTypeFrom(row: AnyRow) {
  const h=hay(row);
  if (h.includes("ILKYARDIM") || h.includes("ILK_YARDIM") || h.includes("FIRST_AID")) return "ILK_YARDIM";
  if (h.includes("SONDUR") || h.includes("YANGINLA_MUCADELE")) return "YANGINLA_MUCADELE";
  if (h.includes("KURTAR") || h.includes("ARAMA_KURTARMA")) return "ARAMA_KURTARMA_TAHLIYE";
  if (h.includes("KORUMA")) return "KORUMA";
  return "";
}
function teamLabel(v:string){
  return v==="YANGINLA_MUCADELE"?"Yangınla Mücadele":
    v==="ARAMA_KURTARMA_TAHLIYE"?"Arama-Kurtarma-Tahliye":
    v==="ILK_YARDIM"?"İlk Yardım":
    v==="KORUMA"?"Koruma":v;
}
function missingCountFrom(row:AnyRow){
  const raw=row?.requested_payload?.missing ?? row?.requested_payload?.required;
  const n=Number(raw);
  return Number.isFinite(n)&&n>0?Math.floor(n):null;
}

function correctedSourceUrl(row:AnyRow){
  const h=hay(row);
  if(h.includes("CALISAN_TEMSILCI") || text(row.source_gap_id)==="employee-representatives")
    return "/admin/documentation/employee-representatives";
  if(h.includes("ISG_KURUL")) return "/admin/documentation/board";
  if(h.includes("POLITIKA") || h.includes("DOKUMAN")) return "/admin/documentation";
  if(
    h.includes("ACIL_DURUM") || h.includes("KORUMA") || h.includes("SONDUR") ||
    h.includes("YANGINLA_MUCADELE") || h.includes("KURTAR") ||
    h.includes("ILKYARDIM") || h.includes("ILK_YARDIM") ||
    h.includes("TATBIKAT") || h.includes("ACIL_DURUM_PLANI")
  ) return "";
  const current=text(row.source_url || row?.requested_payload?.sourceUrl);
  if(!current || current==="/admin/dora") return "/admin/dora";
  // Known obsolete/non-existent DORA source paths are collapsed to their real module roots.
  if(current.startsWith("/admin/documentation/employee-representatives")) return "/admin/documentation/employee-representatives";
  if(current.startsWith("/admin/documentation/emergency")) return "";
  return current;
}

async function authorize(supabase:any, requested:any) {
  const resolved = await resolveReportScope(supabase, text(requested) || null);
  if (!resolved.ok) return { error: NextResponse.json({ok:false,error:resolved.error},{status:resolved.status||403}) };
  const companyId = resolved.scope.selectedCompanyId;
  if (!companyId || companyId === "ALL")
    return { error: NextResponse.json({ok:false,error:"DORA Faz 2 için tek bir firma seçilmelidir."},{status:400}) };
  return { companyId };
}

async function companyInfo(supabase:any, companyId:string) {
  const {data,error}=await supabase.from("companies").select("id,name,local_firm_id").eq("id",companyId).maybeSingle();
  if(error) throw error;
  return {localFirmId:data?.local_firm_id ?? null,name:text(data?.name)||"Firma"};
}

async function activeEmployees(supabase:any, companyId:string){
  const {data,error}=await supabase.from("employees").select("*").eq("firm_id",companyId).eq("active",true).order("full_name");
  if(error) throw error;
  return data||[];
}

async function emergencyCandidates(supabase:any, companyId:string, current:AnyRow) {
  const teamType=teamTypeFrom(current);
  if(!teamType) return {teamType:"", candidates:[] as AnyRow[]};

  const employees=await activeEmployees(supabase,companyId);
  const {data:members,error}=await supabase.from("emergency_support_teams")
    .select("employee_id,full_name,team_type,is_active,is_deleted")
    .eq("company_id",companyId).eq("is_active",true).eq("is_deleted",false);
  if(error) throw error;

  const usedIds=new Set((members||[]).map((m:any)=>text(m.employee_id)).filter(Boolean));
  const usedNames=new Set((members||[]).map((m:any)=>norm(m.full_name)).filter(Boolean));

  return {
    teamType,
    candidates:employees
      .filter((e:any)=>!usedIds.has(text(e.id))&&!usedNames.has(norm(employeeName(e))))
      .map((e:any)=>({id:e.id,full_name:employeeName(e),department:employeeDepartment(e),phone:employeePhone(e),job_title:text(e.job_title)||"-"}))
      .filter((e:any)=>e.full_name)
      .slice(0,250)
  };
}

async function representativeCandidates(supabase:any, companyId:string) {
  const employees=await activeEmployees(supabase,companyId);
  const {data:reps,error}=await supabase.from("employee_representatives")
    .select("employee_id,employee_name,status,is_deleted")
    .eq("firm_id",companyId).eq("status","ACTIVE").eq("is_deleted",false);
  if(error) throw error;

  const usedIds=new Set((reps||[]).map((r:any)=>text(r.employee_id)).filter(Boolean));
  const usedNames=new Set((reps||[]).map((r:any)=>norm(r.employee_name)).filter(Boolean));

  return employees
    .filter((e:any)=>!usedIds.has(text(e.id))&&!usedNames.has(norm(employeeName(e))))
    .map((e:any)=>({id:e.id,full_name:employeeName(e),department:employeeDepartment(e),phone:employeePhone(e),job_title:text(e.job_title)||"-"}))
    .filter((e:any)=>e.full_name)
    .slice(0,250);
}


function parseBoardMissingRoles(row:AnyRow){
  const evidence=Array.isArray(row?.requested_payload?.evidence)?row.requested_payload.evidence:[];
  const n=norm([...evidence,text(row.description),text(row.recommendation)].join(" "));
  const expected=[
    {key:"BASKAN",label:"Başkan"},
    {key:"ISG_UZMANI",label:"İSG Uzmanı"},
    {key:"ISYERI_HEKIMI",label:"İşyeri Hekimi"},
    {key:"CALISAN_TEMSILCISI",label:"Çalışan Temsilcisi"}
  ];
  const found=expected.filter(x=>n.includes(x.key));
  return found.length?found:expected;
}

async function boardCandidates(supabase:any,companyId:string){
  const employees=await activeEmployees(supabase,companyId);
  const {data,error}=await supabase.from("documentation_board_members").select("employee_id,full_name,is_active,is_deleted").eq("firm_id",companyId).eq("is_active",true).eq("is_deleted",false);
  if(error)throw error;
  const usedIds=new Set((data||[]).map((x:any)=>text(x.employee_id)).filter(Boolean));
  return employees.filter((e:any)=>!usedIds.has(text(e.id))).map((e:any)=>({id:e.id,full_name:employeeName(e),department:employeeDepartment(e),phone:employeePhone(e),job_title:text(e.job_title)||"-"})).filter((e:any)=>e.full_name).slice(0,250);
}

async function trainingOptions(supabase:any){
  const {data,error}=await supabase.from("trainings").select("id,title,description,type,duration_minutes,catalog_visible").eq("catalog_visible",true).order("created_at",{ascending:true});
  if(error)throw error;
  return (data||[]).map((t:any)=>({id:text(t.id),title:text(t.title)||"Eğitim",type:text(t.type)||"EĞİTİM",duration_minutes:Number(t.duration_minutes||0),description:text(t.description)}));
}

async function trainingCandidates(supabase:any,companyId:string){
  const employees=await activeEmployees(supabase,companyId);
  return employees.map((e:any)=>({id:e.id,full_name:employeeName(e),department:employeeDepartment(e),phone:employeePhone(e),job_title:text(e.job_title)||"-"})).filter((e:any)=>e.full_name).slice(0,500);
}

async function buildExecutor(supabase:any,companyId:string,row:AnyRow){
  const kind=executorKindFor(row);
  const missingCount=missingCountFrom(row);
  if(kind==="EMERGENCY_SUPPORT_TEAM"){
    const c=await emergencyCandidates(supabase,companyId,row);
    if(!c.teamType)return {supported:false,kind:"",label:"Sadece öneri",candidates:[],requiredSelectionCount:0,requiresQualificationConfirmation:false};
    return {
      supported:true,kind,label:`${teamLabel(c.teamType)} ekibine çalışan ata`,
      teamType:c.teamType,candidates:c.candidates,
      requiredSelectionCount:missingCount||1,
      requiresQualificationConfirmation:c.teamType==="ILK_YARDIM",
      qualificationText:c.teamType==="ILK_YARDIM"?"Seçilen çalışanların geçerli ilkyardımcı sertifikası bulunduğunu kullanıcı doğrulamalıdır.":""
    };
  }
  if(kind==="EMPLOYEE_REPRESENTATIVE"){
    return {supported:true,kind,label:"Çalışan temsilcisi ata",candidates:await representativeCandidates(supabase,companyId),requiredSelectionCount:missingCount||1,requiresQualificationConfirmation:true,qualificationText:"Çalışan temsilcisinin belirlenme/atama usulünün işyeri kayıtları açısından uygun olduğunu kullanıcı doğrulamalıdır."};
  }
  if(kind==="ISG_BOARD_MEMBER"){
    const roles=parseBoardMissingRoles(row);
    return {supported:true,kind,label:"İSG Kurulu eksik rollerini tamamla",candidates:await boardCandidates(supabase,companyId),requiredSelectionCount:roles.length,boardRoles:roles,requiresQualificationConfirmation:true,qualificationText:"İşyerinde 50+ çalışan kriterine ek olarak işin 6 aydan fazla sürekli sürdüğü ve seçilen kurul rollerinin uygun olduğu kullanıcı tarafından doğrulanmalıdır."};
  }
  if(kind==="TRAINING_ASSIGNMENT"){
    return {supported:true,kind,label:"Çalışanlara eğitim ata",candidates:await trainingCandidates(supabase,companyId),trainings:await trainingOptions(supabase),requiredSelectionCount:0,allowAnySelectionCount:true,requiresTrainingSelection:true,requiresQualificationConfirmation:false};
  }
  return {supported:false,kind:"",label:"Sadece öneri",candidates:[],requiredSelectionCount:0,requiresQualificationConfirmation:false};
}
async function executionRecords(supabase:any,companyId:string,row:AnyRow){
  if(row?.status!=="COMPLETED") return [];
  const result=row?.execution_result||{};
  const ids=Array.isArray(result.employeeIds)?result.employeeIds.map((x:any)=>text(x)).filter(Boolean):[];
  if(!ids.length) return [];

  if(result.executor==="EMERGENCY_SUPPORT_TEAM"){
    const q=supabase.from("emergency_support_teams").select("id,employee_id,full_name,team_type,team_role,duty,department,phone,certificate_info,signature_status,is_active,source,created_at")
      .eq("company_id",companyId).in("employee_id",ids).eq("is_deleted",false);
    const {data,error}=await q;
    if(error) return [];
    return data||[];
  }

  if(result.executor==="EMPLOYEE_REPRESENTATIVE"){
    const {data,error}=await supabase.from("employee_representatives").select("id,employee_id,employee_name,department,job_title,representative_type,determination_method,is_head_representative,selection_date,duty_start_date,duty_end_date,status,source,created_at").eq("firm_id",companyId).in("employee_id",ids).eq("is_deleted",false);
    if(error) return []; return data||[];
  }
  if(result.executor==="ISG_BOARD_MEMBER"){
    const {data,error}=await supabase.from("documentation_board_members").select("id,employee_id,full_name,title,department,board_role,is_active,source,created_at").eq("firm_id",companyId).in("employee_id",ids).eq("is_deleted",false);
    if(error)return []; return data||[];
  }
  if(result.executor==="TRAINING_ASSIGNMENT"){
    const {data:users,error:userError}=await supabase.from("users").select("id,employee_id,full_name,email").in("employee_id",ids);
    if(userError)return []; const userIds=(users||[]).map((u:any)=>u.id); if(!userIds.length)return [];
    const {data:assignments,error:aError}=await supabase.from("training_assignments").select("id,user_id,training_id,status,created_at,completed_at").in("user_id",userIds).eq("training_id",result.trainingId);
    if(aError)return [];
    const userMap = new Map<string, AnyRow>(
      (users || []).map((u:any) => [text(u.id), u as AnyRow])
    );
    return (assignments || []).map((a:any) => {
      const linkedUser = userMap.get(text(a.user_id));
      return {
        ...a,
        employee_id: linkedUser?.employee_id ?? null,
        full_name: linkedUser?.full_name ?? null,
        email: linkedUser?.email ?? null,
        training_title: result.trainingTitle,
      };
    });
  }
  return [];
}


export async function GET(req:NextRequest) {
  try {
    const supabase=getSupabase();
    const auth=await authorize(supabase,req.nextUrl.searchParams.get("companyId"));
    if(auth.error) return auth.error;
    const companyId=auth.companyId!;

    const {data,error}=await supabase.from("dora_action_queue").select("*")
      .eq("company_id",companyId).order("created_at",{ascending:false});
    if(error) throw error;

    const enriched=[];
    for(const row of data||[]) {
      enriched.push({
        ...row,
        source_url:correctedSourceUrl(row),
        executor:await buildExecutor(supabase,companyId,row),
        target_records:await executionRecords(supabase,companyId,row)
      });
    }
    return NextResponse.json({ok:true,items:enriched});
  } catch(e:any) {
    return NextResponse.json({ok:false,error:e?.message||"DORA işlem kuyruğu okunamadı."},{status:500});
  }
}

export async function POST(req:NextRequest) {
  try {
    const body=await req.json();
    const supabase=getSupabase();
    const auth=await authorize(supabase,body?.companyId);
    if(auth.error) return auth.error;
    const companyId=auth.companyId!;
    const command=norm(body?.command);

    if(command==="PREPARE") {
      const gaps=Array.isArray(body?.gaps)?body.gaps:[];
      if(!gaps.length) return NextResponse.json({ok:false,error:"İşleme hazırlanacak eksiklik bulunamadı."},{status:400});
      const rows=gaps.slice(0,100).map((g:any)=>({
        company_id:companyId,
        source_gap_id:text(g.id)||crypto.randomUUID(),
        source_domain:text(g.domain)||"DORA",
        title:text(g.title)||"DORA bulgusu",
        description:text(g.summary),
        recommendation:text(g.recommendation),
        source_url:correctedSourceUrl({...g,source_url:g.sourceUrl}),
        severity:text(g.severity)||"MEDIUM",
        status:"WAITING_APPROVAL",
        requested_payload:g,
      }));
      const {data,error}=await supabase.from("dora_action_queue")
        .upsert(rows,{onConflict:"company_id,source_gap_id",ignoreDuplicates:false}).select("*");
      if(error) throw error;
      return NextResponse.json({ok:true,command,items:data||[]});
    }

    const id=text(body?.id);
    if(!id) return NextResponse.json({ok:false,error:"İşlem kimliği eksik."},{status:400});
    const {data:current,error:readError}=await supabase.from("dora_action_queue").select("*")
      .eq("id",id).eq("company_id",companyId).maybeSingle();
    if(readError) throw readError;
    if(!current) return NextResponse.json({ok:false,error:"DORA işlemi bulunamadı."},{status:404});

    if(command==="APPROVE") {
      if(current.status!=="WAITING_APPROVAL")
        return NextResponse.json({ok:false,error:"Yalnızca onay bekleyen işlem onaylanabilir."},{status:409});

      const executor=await buildExecutor(supabase,companyId,current);
      const selectedIds=Array.isArray(body?.selectedEmployeeIds)?body.selectedEmployeeIds.map((x:any)=>text(x)).filter(Boolean):[];
      const qualificationConfirmed=body?.qualificationConfirmed===true;
      const selectedTrainingId=text(body?.selectedTrainingId);
      const roleAssignments=body?.roleAssignments&&typeof body.roleAssignments==="object"?body.roleAssignments:{};

      let approvalPayload=current.requested_payload||{};
      if(executor.supported){
        if(executor.allowAnySelectionCount){
          if(selectedIds.length<1)return NextResponse.json({ok:false,error:"En az bir çalışan seçilmelidir."},{status:400});
        }else if(selectedIds.length!==executor.requiredSelectionCount){
          return NextResponse.json({ok:false,error:`Bu işlem için ${executor.requiredSelectionCount} çalışan seçilmelidir.`},{status:400});
        }
        const allowed=new Set(executor.candidates.map((x:any)=>text(x.id)));
        if(selectedIds.some((x:string)=>!allowed.has(x)))
          return NextResponse.json({ok:false,error:"Seçilen çalışanlardan biri artık uygun aday listesinde değil."},{status:409});
        if(executor.requiresQualificationConfirmation&&!qualificationConfirmed)
          return NextResponse.json({ok:false,error:"Bu işlem için kullanıcı doğrulaması işaretlenmelidir."},{status:400});
        if(executor.requiresTrainingSelection){
          if(!selectedTrainingId)return NextResponse.json({ok:false,error:"Atanacak eğitim seçilmelidir."},{status:400});
          if(!(executor.trainings||[]).some((t:any)=>text(t.id)===selectedTrainingId))return NextResponse.json({ok:false,error:"Seçilen eğitim artık aktif katalogda bulunmuyor."},{status:409});
        }
        if(executor.kind==="ISG_BOARD_MEMBER"){
          const validRoles=new Set((executor.boardRoles||[]).map((x:any)=>text(x.key)));
          const chosen=[] as string[];
          for(const employeeId of selectedIds){
            const role=text(roleAssignments[employeeId]);
            if(!role||!validRoles.has(role))return NextResponse.json({ok:false,error:"Her seçilen çalışan için eksik kurul rollerinden biri seçilmelidir."},{status:400});
            chosen.push(role);
          }
          if(new Set(chosen).size!==chosen.length)return NextResponse.json({ok:false,error:"Aynı kurul rolü birden fazla çalışana atanamaz."},{status:400});
        }
        approvalPayload={...approvalPayload,dora_execution:{executor:executor.kind,teamType:executor.teamType||null,selectedEmployeeIds:selectedIds,selectedTrainingId:selectedTrainingId||null,roleAssignments,qualificationConfirmed,approvedAt:new Date().toISOString()}};
      }

      const {data,error}=await supabase.from("dora_action_queue")
        .update({status:"APPROVED",approved_at:new Date().toISOString(),requested_payload:approvalPayload,source_url:correctedSourceUrl(current)})
        .eq("id",id).eq("company_id",companyId).select("*").single();
      if(error) throw error;
      return NextResponse.json({ok:true,command,item:data});
    }

    if(command==="START") {
      if(current.status!=="APPROVED")
        return NextResponse.json({ok:false,error:"Kullanıcı onayı olmadan DORA işlemi başlatamaz."},{status:409});

      const exec=current.requested_payload?.dora_execution;
      if(!exec?.executor){
        const {data,error}=await supabase.from("dora_action_queue")
          .update({status:"STARTED",started_at:new Date().toISOString(),
            execution_note:"Kullanıcı Başla komutunu verdi. Bu bulgu için gerçek modül yürütücüsü henüz bağlı değil.",
            source_url:correctedSourceUrl(current)})
          .eq("id",id).eq("company_id",companyId).select("*").single();
        if(error) throw error;
        return NextResponse.json({ok:true,command,item:data,moduleWritePerformed:false});
      }

      const selectedIds=(exec.selectedEmployeeIds||[]).map((x:any)=>text(x)).filter(Boolean);
      if(!selectedIds.length)return NextResponse.json({ok:false,error:"Onaylı çalışan seçimi bulunamadı."},{status:409});

      const {data:employees,error:empError}=await supabase.from("employees").select("*")
        .eq("firm_id",companyId).in("id",selectedIds).eq("active",true);
      if(empError) throw empError;
      if((employees||[]).length!==selectedIds.length)
        return NextResponse.json({ok:false,error:"Onaylanan çalışanlardan biri artık aktif firma çalışanı değil."},{status:409});

      const info=await companyInfo(supabase,companyId);
      const now=Date.now();
      const iso=new Date().toISOString();

      if(exec.executor==="EMERGENCY_SUPPORT_TEAM"){
        const teamType=text(exec.teamType);
        if(!teamType)return NextResponse.json({ok:false,error:"Acil durum ekip türü eksik."},{status:409});
        if(teamType==="ILK_YARDIM"&&exec.qualificationConfirmed!==true)
          return NextResponse.json({ok:false,error:"İlkyardımcı sertifika doğrulaması olmadan işlem yapılamaz."},{status:409});

        const rows=(employees||[]).map((e:any)=>({
          sync_key:`dora:${companyId}:emergency:${teamType}:${e.id}`,
          company_id:companyId,
          local_firm_id:info.localFirmId,
          employee_id:e.id,
          team_type:teamType,
          team_role:"EKIP_UYESI",
          full_name:employeeName(e),
          duty:"Acil durum destek elemanı",
          department:employeeDepartment(e),
          phone:employeePhone(e),
          certificate_info:teamType==="ILK_YARDIM"?"İlkyardımcı sertifikası kullanıcı tarafından doğrulandı":"DORA kullanıcı onaylı görevlendirme",
          assigned_date_millis:now,
          signature_status:"IMZA_BEKLIYOR",
          is_active:true,
          version:1,
          source:"WEB",
          sync_status:"SYNCED",
          sync_error:null,
          is_deleted:false,
          updated_at:iso,
          last_synced_at:iso,
        }));

        const keys=rows.map((r:any)=>r.sync_key);
        const {data:existing,error:existingError}=await supabase.from("emergency_support_teams").select("sync_key").in("sync_key",keys);
        if(existingError) throw existingError;
        const existingKeys=new Set((existing||[]).map((x:any)=>text(x.sync_key)));
        const insertRows=rows.filter((r:any)=>!existingKeys.has(r.sync_key));
        let inserted:any[]=[];
        if(insertRows.length){
          const res=await supabase.from("emergency_support_teams").insert(insertRows).select("*");
          if(res.error)throw res.error;
          inserted=res.data||[];
        }

        const result={
          executor:"EMERGENCY_SUPPORT_TEAM",teamType,
          requested:selectedIds.length,inserted:inserted.length,
          alreadyExisting:rows.length-insertRows.length,
          employeeIds:selectedIds,employeeNames:(employees||[]).map((e:any)=>employeeName(e))
        };
        const {data:done,error}=await supabase.from("dora_action_queue").update({
          status:"COMPLETED",started_at:iso,completed_at:iso,
          execution_note:`DORA ${teamLabel(teamType)} ekibine ${inserted.length} çalışan kaydetti.`,
          execution_result:result,source_url:null
        }).eq("id",id).eq("company_id",companyId).select("*").single();
        if(error)throw error;
        return NextResponse.json({ok:true,command,item:done,moduleWritePerformed:true,result});
      }

      if(exec.executor==="EMPLOYEE_REPRESENTATIVE"){
        if(exec.qualificationConfirmed!==true)
          return NextResponse.json({ok:false,error:"Çalışan temsilcisi belirleme usulü kullanıcı tarafından doğrulanmalıdır."},{status:409});

        const rows=(employees||[]).map((e:any)=>({
          sync_key:`dora:${companyId}:employee-representative:${e.id}`,
          firm_id:companyId,
          local_firm_id:info.localFirmId,
          web_firm_id:companyId,
          employee_id:e.id,
          employee_name:employeeName(e),
          department:employeeDepartment(e),
          job_title:text(e.job_title)||null,
          representative_type:"PRIMARY",
          determination_method:"APPOINTMENT",
          is_head_representative:false,
          selection_date:iso.slice(0,10),
          duty_start_date:iso.slice(0,10),
          status:"ACTIVE",
          note:"DORA Faz 2 kullanıcı onaylı atama. İşyerindeki belirleme/atama usulü kullanıcı tarafından doğrulandı.",
          source:"WEB",
          version:1,
          sync_status:"SYNCED",
          sync_error:null,
          last_synced_at_millis:now,
          is_deleted:false,
          updated_at_millis:now,
        }));

        const keys=rows.map((r:any)=>r.sync_key);
        const {data:existing,error:existingError}=await supabase.from("employee_representatives").select("sync_key").in("sync_key",keys);
        if(existingError)throw existingError;
        const existingKeys=new Set((existing||[]).map((x:any)=>text(x.sync_key)));
        const insertRows=rows.filter((r:any)=>!existingKeys.has(r.sync_key));
        let inserted:any[]=[];
        if(insertRows.length){
          const res=await supabase.from("employee_representatives").insert(insertRows).select("*");
          if(res.error)throw res.error;
          inserted=res.data||[];
        }

        const result={
          executor:"EMPLOYEE_REPRESENTATIVE",requested:selectedIds.length,inserted:inserted.length,
          alreadyExisting:rows.length-insertRows.length,
          employeeIds:selectedIds,employeeNames:(employees||[]).map((e:any)=>employeeName(e))
        };
        const {data:done,error}=await supabase.from("dora_action_queue").update({
          status:"COMPLETED",started_at:iso,completed_at:iso,
          execution_note:`DORA ${inserted.length} çalışanı asıl çalışan temsilcisi olarak kaydetti.`,
          execution_result:result,source_url:"/admin/documentation/employee-representatives"
        }).eq("id",id).eq("company_id",companyId).select("*").single();
        if(error)throw error;
        return NextResponse.json({ok:true,command,item:done,moduleWritePerformed:true,result});
      }

      if(exec.executor==="ISG_BOARD_MEMBER"){
        if(exec.qualificationConfirmed!==true)return NextResponse.json({ok:false,error:"İSG Kurulu uygunluk doğrulaması olmadan işlem yapılamaz."},{status:409});
        const roleAssignments=exec.roleAssignments||{}; const info=await companyInfo(supabase,companyId); const nowMs=Date.now(); const nowIso=new Date().toISOString(); const endMs=nowMs+(2*365*24*60*60*1000);
        const rows=(employees||[]).map((e:any)=>{const role=text(roleAssignments[text(e.id)]); return {firm_id:companyId,local_firm_id:info.localFirmId,employee_id:e.id,remote_id:crypto.randomUUID(),web_firm_id:companyId,sync_key:`dora:${companyId}:board:${role}:${e.id}`,member_type:"EMPLOYEE",full_name:employeeName(e),organization_name:info.name,title:text(e.job_title)||role,department:employeeDepartment(e),board_role:role,email:text(e.email)||null,phone:employeePhone(e)==="-"?null:employeePhone(e),notes:"DORA Faz 2 kullanıcı onaylı İSG Kurulu görevlendirmesi.",has_voting_right:true,is_active:true,source:"WEB",version:1,sync_status:"SYNCED",sync_error:null,last_synced_at_millis:nowMs,is_deleted:false,created_at_millis:nowMs,updated_at_millis:nowMs,start_date_millis:nowMs,end_date_millis:endMs};});
        const keys=rows.map((x:any)=>x.sync_key); const ex=await supabase.from("documentation_board_members").select("sync_key").in("sync_key",keys); if(ex.error)throw ex.error; const existingKeys=new Set((ex.data||[]).map((x:any)=>text(x.sync_key))); const insertRows=rows.filter((x:any)=>!existingKeys.has(x.sync_key)); let inserted:any[]=[]; if(insertRows.length){const ins=await supabase.from("documentation_board_members").insert(insertRows).select("*"); if(ins.error)throw ins.error; inserted=ins.data||[];}
        const result={executor:"ISG_BOARD_MEMBER",requested:selectedIds.length,inserted:inserted.length,alreadyExisting:rows.length-insertRows.length,employeeIds:selectedIds,employeeNames:(employees||[]).map((e:any)=>employeeName(e)),roleAssignments};
        const done=await supabase.from("dora_action_queue").update({status:"COMPLETED",started_at:nowIso,completed_at:nowIso,execution_note:`DORA İSG Kurulu için ${inserted.length} kullanıcı onaylı üye/rol kaydı oluşturdu.`,execution_result:result,source_url:"/admin/documentation/board"}).eq("id",id).eq("company_id",companyId).select("*").single(); if(done.error)throw done.error; return NextResponse.json({ok:true,command,item:done.data,moduleWritePerformed:true,result});
      }

      if(exec.executor==="TRAINING_ASSIGNMENT"){
        const trainingId=text(exec.selectedTrainingId); if(!trainingId)return NextResponse.json({ok:false,error:"Onaylı eğitim seçimi bulunamadı."},{status:409});
        const cookie=req.headers.get("cookie")||""; const commonHeaders:Record<string,string>={"content-type":"application/json"}; if(cookie)commonHeaders.cookie=cookie;
        const linkRes=await fetch(`${req.nextUrl.origin}/api/admin/training-users/link-employees`,{method:"POST",headers:commonHeaders,body:JSON.stringify({employeeIds:selectedIds,companyId})}); const linkJson=await linkRes.json().catch(()=>({})); if(!linkRes.ok)throw new Error(linkJson?.error||"Çalışanlar eğitim kullanıcısına bağlanamadı.");
        const assignRes=await fetch(`${req.nextUrl.origin}/api/training/assign`,{method:"POST",headers:commonHeaders,body:JSON.stringify({employeeIds:selectedIds,trainingId,companyId})}); const assignJson=await assignRes.json().catch(()=>({})); if(!assignRes.ok)throw new Error(assignJson?.error||"Eğitim ataması başarısız.");
        const nowIso=new Date().toISOString(); const result={executor:"TRAINING_ASSIGNMENT",trainingId,trainingTitle:text(assignJson?.trainingTitle)||"Eğitim",requested:selectedIds.length,inserted:Number(assignJson?.insertedCount||0),skipped:Number(assignJson?.skippedCount||0),emailed:Number(assignJson?.emailedCount||0),employeeIds:selectedIds,employeeNames:(employees||[]).map((e:any)=>employeeName(e))};
        const done=await supabase.from("dora_action_queue").update({status:"COMPLETED",started_at:nowIso,completed_at:nowIso,execution_note:`DORA "${result.trainingTitle}" eğitimini kullanıcı onayıyla ${selectedIds.length} çalışana işledi. Yeni atama: ${result.inserted}, zaten atanmış: ${result.skipped}.`,execution_result:result,source_url:"/admin/trainings"}).eq("id",id).eq("company_id",companyId).select("*").single(); if(done.error)throw done.error; return NextResponse.json({ok:true,command,item:done.data,moduleWritePerformed:true,result});
      }

      return NextResponse.json({ok:false,error:"Bu işlem türü için yürütücü bulunamadı."},{status:400});
    }

    if(command==="SKIP") {
      const {data,error}=await supabase.from("dora_action_queue")
        .update({status:"SKIPPED",skipped_at:new Date().toISOString(),source_url:correctedSourceUrl(current)})
        .eq("id",id).eq("company_id",companyId).select("*").single();
      if(error) throw error;
      return NextResponse.json({ok:true,command,item:data});
    }

    return NextResponse.json({ok:false,error:"Geçersiz DORA komutu."},{status:400});
  } catch(e:any) {
    return NextResponse.json({ok:false,error:e?.message||"DORA Faz 2 işlemi başarısız."},{status:500});
  }
}
