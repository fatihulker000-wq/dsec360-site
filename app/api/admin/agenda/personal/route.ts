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

export async function GET(){
 try{
  const sess=await session(); if(!sess)return unauthorized();
  const allowed=await activeFirmIds(sess);
  if(!allowed.length)return NextResponse.json({success:true,records:[],count:0,activeFirmCount:0},{headers:{"Cache-Control":"no-store"}});
  const s=db();
  const {data:companies,error:companyError}=await s.from("companies").select("id,name").in("id",allowed).eq("is_active",true);
  if(companyError)throw companyError;
  const names=new Map((companies||[]).map((x:any)=>[text(x.id),text(x.name)]));
  const {data,error}=await s.from("ajanda_tasks").select("*")
   .eq("created_by_user_id",sess.userId).eq("category","PERSONAL")
   .in("web_firm_id",allowed).eq("is_deleted",false).eq("is_archived",false)
   .order("status",{ascending:true}).order("due_at",{ascending:true,nullsFirst:false}).order("updated_at",{ascending:false});
  if(error)throw error;
  const records=(data||[]).map((x:any)=>({...x,company_name:names.get(text(x.web_firm_id))||null}));
  return NextResponse.json({success:true,records,count:records.length,activeFirmCount:allowed.length,viewer:{userId:sess.userId,role:sess.role}},{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("Personal agenda GET",e);return NextResponse.json({success:false,error:e instanceof Error?e.message:"Kişisel ajanda alınamadı."},{status:500})}
}
