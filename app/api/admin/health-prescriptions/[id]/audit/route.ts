import {createClient} from "@supabase/supabase-js";
import {cookies} from "next/headers";
import {NextRequest,NextResponse} from "next/server";

type AuthScope={role:string;companyId:string;scoped:boolean};
function s(v:any){return String(v??"").trim()}
function getSupabase(){return createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}})}
async function authorize():Promise<AuthScope|null>{
  const c=await cookies();
  const auth=c.get("dsec_admin_auth")?.value||c.get("dsec_user_auth")?.value;
  const role=s(c.get("dsec_admin_role")?.value||c.get("dsec_user_role")?.value);
  const companyId=s(c.get("dsec_company_id")?.value);
  if(auth!=="ok") return null;
  if(!["super_admin","admin","company_admin","demo_user"].includes(role)) return null;
  return {role,companyId,scoped:role==="company_admin"||role==="demo_user"};
}

export async function GET(_:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{const a=await authorize();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});const{id}=await params;const db=getSupabase();let p=db.from("health_prescriptions").select("id,company_id").eq("id",id);if(a.scoped)p=p.eq("company_id",a.companyId);const{data:prescription}=await p.maybeSingle();if(!prescription)return NextResponse.json({success:false,error:"Reçete bulunamadı."},{status:404});const{data,error}=await db.from("health_prescription_audit_logs").select("*").eq("prescription_id",id).eq("company_id",prescription.company_id).order("created_at",{ascending:false}).limit(100);if(error)throw error;return NextResponse.json({success:true,audit:data||[]})}catch(e:any){return NextResponse.json({success:false,error:e?.message||"Audit kayıtları alınamadı."},{status:500})}}
