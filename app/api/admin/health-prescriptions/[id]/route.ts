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

async function load(id:string,a:AuthScope){
 let q=getSupabase().from("health_prescriptions").select("*,health_prescription_items(*)").eq("id",id).eq("is_active",true);
 if(a.scoped)q=q.eq("company_id",a.companyId);return q.maybeSingle();
}
export async function GET(_:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{const a=await authorize();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});const{id}=await params;const{data,error}=await load(id,a);if(error)throw error;if(!data)return NextResponse.json({success:false,error:"Reçete bulunamadı."},{status:404});return NextResponse.json({success:true,prescription:data,integration:{medulaConnected:false,mode:"PREPARATION"}})}catch(e:any){return NextResponse.json({success:false,error:e?.message||"Reçete alınamadı."},{status:500})}}
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{const a=await authorize();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});if(a.role==="demo_user")return NextResponse.json({success:false,error:"Demo kullanıcı reçete güncelleyemez."},{status:403});const{id}=await params;const{data:current,error:getErr}=await load(id,a);if(getErr)throw getErr;if(!current)return NextResponse.json({success:false,error:"Reçete bulunamadı."},{status:404});
 const b=await req.json(),items=Array.isArray(b.items)?b.items.filter((x:any)=>s(x?.medicineName)):[];const status=s(b.status||current.status||"draft");if(status!=="draft"&&(!s(b.diagnosisCode??current.diagnosis_code)||items.length===0))return NextResponse.json({success:false,error:"Tamamlanan reçetede tanı ve en az bir ilaç zorunludur."},{status:400});
 const payload={id,company_id:current.company_id,employee_id:current.employee_id,doctor_id:s(b.doctorId??current.doctor_id)||null,examination_id:s(b.examinationId??current.examination_id)||null,ek2_form_id:s(b.ek2FormId??current.ek2_form_id)||null,prescription_no:s(b.prescriptionNo??current.prescription_no)||null,e_prescription_no:s(current.e_prescription_no)||null,medula_tracking_no:s(current.medula_tracking_no)||null,medula_status:s(current.medula_status||"NOT_SENT"),medula_response:s(current.medula_response)||null,doctor_identity_number:s(b.doctorIdentityNumber??current.doctor_identity_number)||null,doctor_diploma_no:s(b.doctorDiplomaNo??current.doctor_diploma_no)||null,diagnosis_code:s(b.diagnosisCode??current.diagnosis_code)||null,diagnosis_name:s(b.diagnosisName??current.diagnosis_name)||null,notes:s(b.notes??current.notes)||null,status,items};
 const db=getSupabase();const{data:rid,error}=await db.rpc("dsec_health_prescription_save",{p_payload:payload});if(error)throw error;const{data:p,error:loadErr}=await db.from("health_prescriptions").select("*,health_prescription_items(*)").eq("id",rid).single();if(loadErr)throw loadErr;await db.from("health_prescription_audit_logs").insert({prescription_id:p.id,company_id:p.company_id,employee_id:p.employee_id,action:"UPDATED",old_status:current.status||null,new_status:p.status||null,actor_role:a.role,note:"Reçete ve ilaç kalemleri atomik olarak güncellendi."});
 return NextResponse.json({success:true,prescription:p});
 }catch(e:any){return NextResponse.json({success:false,error:e?.message||"Reçete güncellenemedi."},{status:500})}}
export async function DELETE(_:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{const a=await authorize();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});if(a.role==="demo_user")return NextResponse.json({success:false,error:"Demo kullanıcı reçete silemez."},{status:403});const{id}=await params;const{data:current,error:getErr}=await load(id,a);if(getErr)throw getErr;if(!current)return NextResponse.json({success:false,error:"Reçete bulunamadı."},{status:404});const db=getSupabase();const{error}=await db.from("health_prescriptions").update({is_active:false,updated_at:new Date().toISOString()}).eq("id",id).eq("company_id",current.company_id);if(error)throw error;await db.from("health_prescription_audit_logs").insert({prescription_id:id,company_id:current.company_id,employee_id:current.employee_id,action:"SOFT_DELETED",old_status:current.status||null,new_status:"INACTIVE",actor_role:a.role,note:"Reçete pasife alındı."});return NextResponse.json({success:true})}catch(e:any){return NextResponse.json({success:false,error:e?.message||"Reçete silinemedi."},{status:500})}}
