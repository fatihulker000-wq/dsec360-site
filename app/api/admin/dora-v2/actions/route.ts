import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveReportScope } from "../../reports/_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;

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
function isEmergencyGap(row: AnyRow) {
  const hay = norm([row.source_domain,row.title,row.description,row.recommendation].join(" "));
  return hay.includes("ACIL") && (
    hay.includes("DESTEK") || hay.includes("EKIP") || hay.includes("SONDUR") ||
    hay.includes("KURTAR") || hay.includes("KORUMA")
  );
}
function teamTypeFrom(row: AnyRow) {
  const hay = norm([row.title,row.description,row.recommendation,JSON.stringify(row.requested_payload||{})].join(" "));
  if (hay.includes("SONDUR")) return "SÖNDÜRME";
  if (hay.includes("KURTAR")) return "KURTARMA";
  if (hay.includes("KORUMA")) return "KORUMA";
  return "";
}
function employeeName(e: AnyRow) { return text(e.full_name || e.name || e.employee_name); }
function employeeDepartment(e: AnyRow) { return text(e.department || e.department_name || e.unit || e.job_title) || "-"; }
function employeePhone(e: AnyRow) { return text(e.phone || e.mobile_phone || e.mobile || e.telephone) || "-"; }

async function authorize(supabase:any, requested:any) {
  const resolved = await resolveReportScope(supabase, text(requested) || null);
  if (!resolved.ok) return { error: NextResponse.json({ok:false,error:resolved.error},{status:resolved.status||403}) };
  const companyId = resolved.scope.selectedCompanyId;
  if (!companyId || companyId === "ALL")
    return { error: NextResponse.json({ok:false,error:"DORA Faz 2 için tek bir firma seçilmelidir."},{status:400}) };
  return { companyId };
}

async function companyLocalFirmId(supabase:any, companyId:string) {
  const {data,error}=await supabase.from("companies").select("id,local_firm_id").eq("id",companyId).maybeSingle();
  if(error) throw error;
  return data?.local_firm_id ?? null;
}

async function getCandidates(supabase:any, companyId:string, current:AnyRow) {
  const teamType=teamTypeFrom(current);
  if(!teamType) return {teamType:"", candidates:[]};

  const {data:employees,error:empError}=await supabase
    .from("employees").select("*").eq("firm_id",companyId).eq("active",true).order("full_name");
  if(empError) throw empError;

  const {data:members,error:memberError}=await supabase
    .from("emergency_support_teams")
    .select("employee_id,full_name,team_type,is_active,is_deleted")
    .eq("company_id",companyId)
    .eq("is_active",true)
    .eq("is_deleted",false);
  if(memberError) throw memberError;

  const usedIds=new Set((members||[]).map((m:any)=>text(m.employee_id)).filter(Boolean));
  const usedNames=new Set((members||[]).map((m:any)=>norm(m.full_name)).filter(Boolean));

  const candidates=(employees||[])
    .filter((e:any)=>!usedIds.has(text(e.id)) && !usedNames.has(norm(employeeName(e))))
    .map((e:any)=>({
      id:e.id,
      full_name:employeeName(e),
      department:employeeDepartment(e),
      phone:employeePhone(e),
      job_title:text(e.job_title)||"-",
    }))
    .filter((e:any)=>e.full_name)
    .slice(0,100);

  return {teamType,candidates};
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
      let executor:any={supported:false,teamType:"",candidates:[]};
      if(isEmergencyGap(row)) {
        const c=await getCandidates(supabase,companyId,row);
        executor={supported:Boolean(c.teamType),...c};
      }
      enriched.push({...row,executor});
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
        source_url:g.sourceUrl||null,
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

      const selectedIds=Array.isArray(body?.selectedEmployeeIds)
        ? body.selectedEmployeeIds.map((x:any)=>text(x)).filter(Boolean) : [];

      let approvalPayload=current.requested_payload||{};
      if(isEmergencyGap(current)) {
        const c=await getCandidates(supabase,companyId,current);
        if(!c.teamType) return NextResponse.json({ok:false,error:"DORA acil durum ekip türünü güvenli biçimde belirleyemedi."},{status:400});
        if(!selectedIds.length) return NextResponse.json({ok:false,error:"Onaydan önce en az bir çalışan seçilmelidir."},{status:400});
        const allowed=new Set(c.candidates.map((x:any)=>text(x.id)));
        if(selectedIds.some((x:string)=>!allowed.has(x)))
          return NextResponse.json({ok:false,error:"Seçilen çalışanlardan biri artık uygun aday listesinde değil."},{status:409});
        approvalPayload={...approvalPayload,dora_execution:{executor:"EMERGENCY_SUPPORT_TEAM",teamType:c.teamType,selectedEmployeeIds:selectedIds}};
      }

      const {data,error}=await supabase.from("dora_action_queue")
        .update({status:"APPROVED",approved_at:new Date().toISOString(),requested_payload:approvalPayload})
        .eq("id",id).eq("company_id",companyId).select("*").single();
      if(error) throw error;
      return NextResponse.json({ok:true,command,item:data});
    }

    if(command==="START") {
      if(current.status!=="APPROVED")
        return NextResponse.json({ok:false,error:"Kullanıcı onayı olmadan DORA işlemi başlatamaz."},{status:409});

      const exec=current.requested_payload?.dora_execution;
      if(!exec || exec.executor!=="EMERGENCY_SUPPORT_TEAM") {
        const {data,error}=await supabase.from("dora_action_queue")
          .update({status:"STARTED",started_at:new Date().toISOString(),
            execution_note:"Kullanıcı Başla komutunu verdi. Bu bulgu için gerçek modül yürütücüsü henüz bağlı değil."})
          .eq("id",id).eq("company_id",companyId).select("*").single();
        if(error) throw error;
        return NextResponse.json({ok:true,command,item:data,moduleWritePerformed:false});
      }

      const teamType=text(exec.teamType);
      const selectedIds=(exec.selectedEmployeeIds||[]).map((x:any)=>text(x)).filter(Boolean);
      if(!teamType || !selectedIds.length)
        return NextResponse.json({ok:false,error:"Onaylı DORA yürütme planı eksik."},{status:409});

      const {data:employees,error:empError}=await supabase.from("employees").select("*")
        .eq("firm_id",companyId).in("id",selectedIds).eq("active",true);
      if(empError) throw empError;
      if((employees||[]).length!==selectedIds.length)
        return NextResponse.json({ok:false,error:"Onaylanan çalışanlardan biri artık aktif firma çalışanı değil."},{status:409});

      const localFirmId=await companyLocalFirmId(supabase,companyId);
      const now=Date.now();
      const rows=(employees||[]).map((e:any)=>({
        sync_key:`dora:${companyId}:${teamType}:${e.id}`,
        company_id:companyId,
        local_firm_id:localFirmId,
        employee_id:Number.isFinite(Number(e.id))?Number(e.id):null,
        team_type:teamType,
        team_role:"ÜYE",
        full_name:employeeName(e),
        duty:"Acil durum destek elemanı",
        department:employeeDepartment(e),
        phone:employeePhone(e),
        certificate_info:"DORA ataması - belge bilgisi doğrulanmalı",
        assigned_date_millis:now,
        signature_status:"BEKLIYOR",
        is_active:true,
        version:1,
        source:"DORA",
        sync_status:"SYNCED",
        sync_error:null,
        is_deleted:false,
        updated_at:new Date().toISOString(),
        last_synced_at:new Date().toISOString(),
      }));

      // Idempotent: sync_key prevents duplicate DORA assignment if DB has/gets a unique constraint.
      // Also pre-check exact DORA sync keys so repeated START cannot duplicate rows.
      const keys=rows.map((r:any)=>r.sync_key);
      const {data:existing,error:existingError}=await supabase.from("emergency_support_teams")
        .select("sync_key").in("sync_key",keys);
      if(existingError) throw existingError;
      const existingKeys=new Set((existing||[]).map((x:any)=>text(x.sync_key)));
      const insertRows=rows.filter((r:any)=>!existingKeys.has(r.sync_key));

      let inserted:any[]=[];
      if(insertRows.length) {
        const {data,error}=await supabase.from("emergency_support_teams").insert(insertRows).select("*");
        if(error) {
          await supabase.from("dora_action_queue").update({
            status:"FAILED",failed_at:new Date().toISOString(),
            execution_note:`Acil durum ekibi kaydı oluşturulamadı: ${error.message}`,
            execution_result:{executor:"EMERGENCY_SUPPORT_TEAM",error:error.message}
          }).eq("id",id).eq("company_id",companyId);
          throw error;
        }
        inserted=data||[];
      }

      const result={
        executor:"EMERGENCY_SUPPORT_TEAM",
        teamType,
        requested:selectedIds.length,
        inserted:inserted.length,
        alreadyExisting:rows.length-insertRows.length,
        employeeIds:selectedIds,
      };
      const {data:done,error:doneError}=await supabase.from("dora_action_queue").update({
        status:"COMPLETED",
        started_at:new Date().toISOString(),
        completed_at:new Date().toISOString(),
        execution_note:`DORA ${teamType} ekibine ${inserted.length} çalışan kaydetti.`,
        execution_result:result
      }).eq("id",id).eq("company_id",companyId).select("*").single();
      if(doneError) throw doneError;
      return NextResponse.json({ok:true,command,item:done,moduleWritePerformed:inserted.length>0,result});
    }

    if(command==="SKIP") {
      const {data,error}=await supabase.from("dora_action_queue")
        .update({status:"SKIPPED",skipped_at:new Date().toISOString()})
        .eq("id",id).eq("company_id",companyId).select("*").single();
      if(error) throw error;
      return NextResponse.json({ok:true,command,item:data});
    }

    return NextResponse.json({ok:false,error:"Geçersiz DORA komutu."},{status:400});
  } catch(e:any) {
    return NextResponse.json({ok:false,error:e?.message||"DORA Faz 2 işlemi başarısız."},{status:500});
  }
}
