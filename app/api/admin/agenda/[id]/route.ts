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

export const dynamic="force-dynamic";
export const revalidate=0;

async function getRecord(id:string){
 const s=db();
 const {data,error}=await s.from("ajanda_tasks").select("*").eq("id",id).maybeSingle();
 if(error)throw error;
 return data as Row|null;
}
async function authorize(record:Row,sess:Session){
 const firmId=text(record.web_firm_id);
 const allowed=await activeFirmIds(sess);
 if(!firmId||!allowed.includes(firmId))return false;
 if(text(record.category).toUpperCase()==="PERSONAL"&&text(record.created_by_user_id)!==sess.userId)return false;
 return true;
}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{
  const sess=await session();if(!sess)return unauthorized();
  const {id}=await params; const record=await getRecord(id);
  if(!record)return NextResponse.json({success:false,error:"Ajanda kaydı bulunamadı."},{status:404});
  if(!(await authorize(record,sess)))return NextResponse.json({success:false,error:"Bu kayıt için yetkiniz bulunmuyor."},{status:403});
  if(text(record.source).toUpperCase()!=="WEB")return NextResponse.json({success:false,error:"Sistem kaynaklı kayıt doğrudan değiştirilemez."},{status:409});
  const b=await req.json().catch(()=>({})); const patch:Record<string,any>={app_updated_at:Date.now(),updated_at:new Date().toISOString()};
  if(b.status!==undefined){patch.status=Number(b.status)===1?1:0;patch.completed_at=patch.status===1?new Date().toISOString():null}
  if(b.progress!==undefined)patch.progress=Math.min(100,Math.max(0,Number(b.progress)||0));
  if(b.title!==undefined&&text(b.title))patch.title=text(b.title);
  if(b.note!==undefined)patch.note=text(b.note)||null;
  if(b.priority!==undefined)patch.priority=Math.min(2,Math.max(0,Math.trunc(Number(b.priority)||0)));
  if(b.due_at!==undefined)patch.due_at=b.due_at?new Date(b.due_at).toISOString():null;
  if(b.end_at!==undefined)patch.end_at=b.end_at?new Date(b.end_at).toISOString():null;
  if(b.location!==undefined)patch.location=text(b.location)||null;
  if(b.meeting_link!==undefined)patch.meeting_link=text(b.meeting_link)||null;
  const s=db();const {data,error}=await s.from("ajanda_tasks").update(patch).eq("id",id).select("*").single();if(error)throw error;
  return NextResponse.json({success:true,record:data});
 }catch(e){console.error("Agenda PATCH",e);return NextResponse.json({success:false,error:e instanceof Error?e.message:"Ajanda kaydı güncellenemedi."},{status:500})}
}
export async function DELETE(_req:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{
  const sess=await session();if(!sess)return unauthorized();
  const {id}=await params; const record=await getRecord(id);
  if(!record)return NextResponse.json({success:false,error:"Ajanda kaydı bulunamadı."},{status:404});
  if(!(await authorize(record,sess)))return NextResponse.json({success:false,error:"Bu kayıt için yetkiniz bulunmuyor."},{status:403});
  if(text(record.source).toUpperCase()!=="WEB")return NextResponse.json({success:false,error:"Sistem kaynaklı kayıt doğrudan silinemez."},{status:409});
  const s=db();const {error}=await s.from("ajanda_tasks").update({is_deleted:true,deleted_at:new Date().toISOString(),app_updated_at:Date.now(),updated_at:new Date().toISOString()}).eq("id",id);if(error)throw error;
  return NextResponse.json({success:true});
 }catch(e){console.error("Agenda DELETE",e);return NextResponse.json({success:false,error:e instanceof Error?e.message:"Ajanda kaydı silinemedi."},{status:500})}
}
