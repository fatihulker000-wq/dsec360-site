import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type Row = Record<string, any>;
type Session = { userId:string; role:string; email:string };

function text(v:any){ return String(v ?? "").trim(); }
function db(){
  const url=process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) throw new Error("Supabase ortam değişkenleri eksik.");
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
async function session():Promise<Session|null>{
  const cs=await cookies();
  const auth=text(cs.get("dsec_admin_auth")?.value||cs.get("dsec_user_auth")?.value);
  if(auth!=="ok") return null;
  const role=text(cs.get("dsec_admin_role")?.value||cs.get("dsec_user_role")?.value).toLowerCase();
  let userId=text(cs.get("dsec_user_id")?.value);
  const email=text(cs.get("dsec_user_email")?.value||cs.get("dsec_admin_email")?.value).toLowerCase();
  if(!userId&&email){
    const s=db();
    const {data}=await s.from("users").select("id").ilike("email",email).limit(1).maybeSingle();
    userId=text(data?.id);
  }
  if(!userId) return null;
  return {userId,role,email};
}
async function activeFirmIds(sess:Session):Promise<string[]>{
  const s=db();
  if(sess.role==="super_admin"){
    const {data,error}=await s.from("companies").select("id").eq("is_active",true);
    if(error) throw error;
    return (data||[]).map((x:any)=>text(x.id)).filter(Boolean);
  }
  const {data:access,error:accessError}=await s.from("user_firm_access").select("firm_id").eq("user_id",sess.userId);
  if(accessError) throw accessError;
  let ids=(access||[]).map((x:any)=>text(x.firm_id)).filter(Boolean);
  if(!ids.length){
    const {data:user,error:userError}=await s.from("users").select("company_id").eq("id",sess.userId).maybeSingle();
    if(userError) throw userError;
    const fallbackCompanyId=text(user?.company_id);
    if(fallbackCompanyId) ids=[fallbackCompanyId];
  }
  ids=[...new Set(ids)];
  if(!ids.length) return [];
  const {data:companies,error}=await s.from("companies").select("id").in("id",ids).eq("is_active",true);
  if(error) throw error;
  return (companies||[]).map((x:any)=>text(x.id)).filter(Boolean);
}
function unauthorized(){ return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401}); }

import { randomUUID } from "crypto";

function nullableString(value:unknown):string|null{const v=text(value);return v||null}
function nullableDate(value:unknown):string|null{const v=nullableString(value);if(!v)return null;const ms=new Date(v).getTime();return Number.isFinite(ms)?new Date(ms).toISOString():null}
function normalizeTaskType(value:unknown){const a=new Set(["TASK","MEETING","INSPECTION","TRAINING","VISIT","REMINDER"]);const v=text(value||"TASK").toUpperCase();return a.has(v)?v:"TASK"}
function normalizePriority(value:unknown){const n=Number(value);return Number.isFinite(n)?Math.min(2,Math.max(0,Math.trunc(n))):1}

export const dynamic="force-dynamic";
export const revalidate=0;

export async function GET(req:NextRequest){
 try{
  const sess=await session(); if(!sess)return unauthorized();
  const firmId=text(req.nextUrl.searchParams.get("firmId"));
  if(!firmId)return NextResponse.json({success:false,error:"Firma UUID bilgisi zorunludur."},{status:400});
  const allowed=await activeFirmIds(sess);
  if(!allowed.includes(firmId))return NextResponse.json({success:false,error:"Bu firma aktif yetkileriniz arasında değil."},{status:403});
  const s=db();
  const {data,error}=await s.from("ajanda_tasks").select("*")
   .eq("web_firm_id",firmId).eq("is_deleted",false).eq("is_archived",false)
   .order("status",{ascending:true}).order("due_at",{ascending:true,nullsFirst:false}).order("updated_at",{ascending:false});
  if(error)throw error;
  // Şahsi kayıtlar Firma Ajandasında görünmez.
  const records=(data||[]).filter((x:any)=>text(x.category).toUpperCase()!=="PERSONAL");
  return NextResponse.json({success:true,firmId,records,count:records.length},{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("Agenda GET",e);return NextResponse.json({success:false,error:e instanceof Error?e.message:"Ajanda alınamadı."},{status:500})}
}

export async function POST(req:NextRequest){
 try{
  const sess=await session(); if(!sess)return unauthorized();
  const body=await req.json().catch(()=>({}));
  const webFirmId=text(body?.web_firm_id);
  const firmId=Number(body?.firm_id);
  const title=text(body?.title);
  if(!webFirmId||!Number.isFinite(firmId)||firmId<=0)return NextResponse.json({success:false,error:"Geçerli firma bilgisi zorunludur."},{status:400});
  if(!title)return NextResponse.json({success:false,error:"Görev başlığı zorunludur."},{status:400});
  const allowed=await activeFirmIds(sess);
  if(!allowed.includes(webFirmId))return NextResponse.json({success:false,error:"Bu firma aktif yetkileriniz arasında değil."},{status:403});
  const dueAt=nullableDate(body?.due_at), endAt=nullableDate(body?.end_at);
  if(dueAt&&endAt&&new Date(endAt).getTime()<new Date(dueAt).getTime())return NextResponse.json({success:false,error:"Bitiş zamanı başlangıç zamanından önce olamaz."},{status:400});
  const personal=body?.personal===true;
  const now=Date.now();
  const nowIso=new Date(now).toISOString();
  const payload={
   sync_key:randomUUID(),firm_id:Math.trunc(firmId),web_firm_id:webFirmId,title,
   note:nullableString(body?.note),status:0,priority:normalizePriority(body?.priority),progress:0,
   type:normalizeTaskType(body?.type),category:personal?"PERSONAL":nullableString(body?.category),
   due_at:dueAt,end_at:endAt,completed_at:null,location:nullableString(body?.location),meeting_link:nullableString(body?.meeting_link),
   assigned_employee_local_id:personal?null:(Number.isFinite(Number(body?.assigned_employee_local_id))?Math.trunc(Number(body.assigned_employee_local_id)):null),
   assigned_employee_remote_id:personal?null:nullableString(body?.assigned_employee_remote_id),
   assigned_to:personal?null:nullableString(body?.assigned_to),assigned_by:null,
   created_by_user_id:sess.userId,participants_csv:nullableString(body?.participants_csv),is_all_day:body?.is_all_day===true,
   module_ref:personal?"PERSONAL":nullableString(body?.module_ref),module_ref_id:null,module_remote_id:null,parent_task_id:null,parent_remote_id:null,
   remind_minutes_csv:nullableString(body?.remind_minutes_csv),remind_at:nullableDate(body?.remind_at),
   repeat_type:nullableString(body?.repeat_type)?.toUpperCase()??null,repeat_until:nullableDate(body?.repeat_until),
   source:"WEB",is_archived:false,is_deleted:false,deleted_at:null,
   app_created_at:now,app_updated_at:now,created_at:nowIso,updated_at:nowIso
  };
  const s=db(); const {data,error}=await s.from("ajanda_tasks").insert(payload).select("*").single(); if(error)throw error;
  return NextResponse.json({success:true,record:data},{status:201});
 }catch(e){console.error("Agenda POST",e);return NextResponse.json({success:false,error:e instanceof Error?e.message:"Ajanda kaydı oluşturulamadı."},{status:500})}
}
