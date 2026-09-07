import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const text = (v: unknown) => String(v ?? "").trim();
const uuid = (v: unknown) => UUID_RE.test(text(v)) ? text(v) : "";

function db(){
  const url=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) throw new Error("Supabase yapılandırması eksik.");
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

async function getSession(){
  const c=await cookies();
  const auth=text(c.get("dsec_admin_auth")?.value||c.get("dsec_user_auth")?.value);
  const role=text(c.get("dsec_admin_role")?.value||c.get("dsec_user_role")?.value).toLowerCase();
  const userId=uuid(c.get("dsec_user_id")?.value);
  const firmId=uuid(c.get("dsec_company_id")?.value);
  if(auth!=="ok"||!userId||!["super_admin","company_admin","demo_user"].includes(role)) return null;
  return {role,userId,firmId};
}

async function accessibleFirms(role:string,userId:string){
  const s=db();
  if(role==="super_admin"){
    const {data,error}=await s.from("companies").select("id,name,local_firm_id,is_active,tehlike_sinifi").eq("is_active",true).order("name");
    if(error) throw error;
    return (data||[]).map((x:any)=>({id:text(x.id),name:text(x.name)||"Firma",localFirmId:x.local_firm_id??null,hazardClass:text(x.tehlike_sinifi)})).filter((x:any)=>uuid(x.id));
  }

  const {data:access,error:accessError}=await s.from("user_firm_access").select("firm_id,is_primary").eq("user_id",userId);
  if(accessError) throw accessError;
  let ids=(access||[]).map((x:any)=>uuid(x.firm_id)).filter(Boolean);

  if(ids.length===0){
    const {data:user,error:userError}=await s.from("users").select("company_id").eq("id",userId).maybeSingle();
    if(userError) throw userError;
    const fallback=uuid(user?.company_id);
    if(fallback) ids=[fallback];
  }
  ids=Array.from(new Set(ids));
  if(ids.length===0) return [];

  const {data:companies,error}=await s.from("companies").select("id,name,local_firm_id,is_active,tehlike_sinifi").in("id",ids).eq("is_active",true).order("name");
  if(error) throw error;
  const primary=new Set((access||[]).filter((x:any)=>x.is_primary===true).map((x:any)=>text(x.firm_id)));
  return (companies||[]).map((x:any)=>({id:text(x.id),name:text(x.name)||"Firma",localFirmId:x.local_firm_id??null,hazardClass:text(x.tehlike_sinifi),isPrimary:primary.has(text(x.id))})).filter((x:any)=>uuid(x.id));
}

export async function GET(){
  try{
    const session=await getSession();
    if(!session) return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});
    const firms=await accessibleFirms(session.role,session.userId);
    if(firms.length===0) return NextResponse.json({success:false,error:"Erişilebilir aktif firma bulunamadı."},{status:403});
    const allowed=new Set(firms.map((x:any)=>x.id));
    const activeFirmId=allowed.has(session.firmId)?session.firmId:(firms.find((x:any)=>x.isPrimary)?.id||firms[0].id);
    return NextResponse.json({success:true,activeFirmId,firms,role:session.role},{headers:{"Cache-Control":"no-store"}});
  }catch(e){
    console.error("dashboard firm-context GET",e);
    return NextResponse.json({success:false,error:e instanceof Error?e.message:"Firma bağlamı alınamadı."},{status:500});
  }
}

export async function POST(request:Request){
  try{
    const session=await getSession();
    if(!session) return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});
    const body=await request.json().catch(()=>({}));
    const requested=uuid(body?.firmId);
    if(!requested) return NextResponse.json({success:false,error:"Geçerli firma UUID gerekli."},{status:400});
    const firms=await accessibleFirms(session.role,session.userId);
    const target=firms.find((x:any)=>x.id===requested);
    if(!target) return NextResponse.json({success:false,error:"Bu firmaya erişim yetkiniz yok."},{status:403});

    const response=NextResponse.json({success:true,activeFirmId:requested,firm:target});
    const secure=process.env.NODE_ENV==="production";
    const domain=process.env.NODE_ENV==="production"?".dsec360.com":undefined;
    response.cookies.set("dsec_company_id",requested,{httpOnly:true,sameSite:"lax",secure,domain,path:"/",maxAge:60*60*12});
    return response;
  }catch(e){
    console.error("dashboard firm-context POST",e);
    return NextResponse.json({success:false,error:e instanceof Error?e.message:"Firma değiştirilemedi."},{status:500});
  }
}
