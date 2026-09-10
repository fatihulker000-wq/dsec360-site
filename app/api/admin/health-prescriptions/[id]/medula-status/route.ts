import {createClient} from "@supabase/supabase-js";
import {cookies} from "next/headers";
import {NextRequest,NextResponse} from "next/server";
export const runtime="nodejs";

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

const MANUAL=new Set(["NOT_SENT","READY","CANCELLED"]);
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{const a=await authorize();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});if(a.role==="demo_user")return NextResponse.json({success:false,error:"Demo kullanıcı e-Reçete durumunu değiştiremez."},{status:403});const{id}=await params;const b=await req.json(),next=s(b.medulaStatus||b.ePrescriptionStatus||b.status).toUpperCase();
 if(!MANUAL.has(next))return NextResponse.json({success:false,error:"SENT/ERROR gibi MEDULA sonuç durumları manuel verilemez. Bunlar gerçek entegrasyon yanıtından gelmelidir.",integration:{medulaConnected:false}},{status:409});
 const db=getSupabase();let q=db.from("health_prescriptions").select("*").eq("id",id).eq("is_active",true);if(a.scoped)q=q.eq("company_id",a.companyId);const{data:current,error:getErr}=await q.single();if(getErr||!current)return NextResponse.json({success:false,error:"Reçete bulunamadı."},{status:404});
 if(next==="READY"&&(!s(current.diagnosis_code)||!s(current.doctor_identity_number)||!s(current.doctor_diploma_no)))return NextResponse.json({success:false,error:"e-Reçeteye hazır durumuna almak için tanı, hekim T.C. ve diploma numarası zorunludur."},{status:400});
 const{data:p,error}=await db.from("health_prescriptions").update({medula_status:next,updated_at:new Date().toISOString()}).eq("id",id).eq("company_id",current.company_id).select("*").single();if(error)throw error;await db.from("health_prescription_audit_logs").insert({prescription_id:id,company_id:current.company_id,employee_id:current.employee_id,action:"ERECETE_STATUS_CHANGED",old_status:current.medula_status||"NOT_SENT",new_status:next,actor_role:a.role,note:s(b.note)||"D-SEC hazırlık durumu güncellendi.",metadata:{medula_connected:false}});
 return NextResponse.json({success:true,prescription:p,integration:{medulaConnected:false,mode:"PREPARATION"}});
 }catch(e:any){return NextResponse.json({success:false,error:e?.message||"e-Reçete durumu güncellenemedi."},{status:500})}}
