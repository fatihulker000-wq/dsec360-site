import {createClient} from "@supabase/supabase-js";
import {NextRequest,NextResponse} from "next/server";
import {readMedulaSession} from "@/lib/medula/session";
import {callMedula} from "@/lib/medula/client";

import {cookies} from "next/headers";
function s(v:any){return String(v??"").trim()}
async function dsecAuth(){
 const c=await cookies();
 const auth=c.get("dsec_admin_auth")?.value||c.get("dsec_user_auth")?.value;
 const role=s(c.get("dsec_admin_role")?.value||c.get("dsec_user_role")?.value);
 const companyId=s(c.get("dsec_company_id")?.value);
 if(auth!=="ok"||!["super_admin","admin","company_admin"].includes(role))return null;
 return {role,companyId,scoped:role==="company_admin"};
}


function db(){return createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}})}

export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{
  const a=await dsecAuth();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});
  const session=await readMedulaSession();if(!session)return NextResponse.json({success:false,error:"Önce MEDULA hekim oturumu açılmalıdır."},{status:401});
  const b=await req.json().catch(()=>({}));if(b.confirm!==true)return NextResponse.json({success:false,error:"Açık onay gereklidir."},{status:400});
  const{id}=await params;const supabase=db();let q=supabase.from("health_prescriptions").select("*").eq("id",id).eq("is_active",true);if(a.scoped)q=q.eq("company_id",a.companyId);
  const{data:p,error}=await q.single();if(error||!p)return NextResponse.json({success:false,error:"Reçete bulunamadı."},{status:404});
  const no=s(p.e_prescription_no);if(!no)return NextResponse.json({success:false,error:"e-Reçete numarası bulunmuyor."},{status:400});
  if(s(p.doctor_identity_number)&&s(p.doctor_identity_number)!==session.doctorTc)return NextResponse.json({success:false,error:"Reçete hekimi ile MEDULA oturumu eşleşmiyor."},{status:409});
  if(s(p.facility_code)&&s(p.facility_code)!==session.facilityCode)return NextResponse.json({success:false,error:"Tesis kodu aktif MEDULA oturumuyla eşleşmiyor."},{status:409});
  const result=await callMedula(session,"ereceteSil",{tesisKodu:session.facilityCode,doktorTcKimlikNo:session.doctorTc,ereceteNo:no});
  await supabase.from("health_prescriptions").update({medula_last_result_code:result.resultCode||null,medula_last_result_message:result.resultMessage||null,medula_last_warning_message:result.warningMessage||null,medula_last_checked_at:new Date().toISOString(),...(result.ok?{medula_status:"CANCELLED"}:{})}).eq("id",id);
  await supabase.from("health_prescription_audit_logs").insert({prescription_id:id,company_id:p.company_id,employee_id:p.employee_id,action:result.ok?"MEDULA_DELETED":"MEDULA_DELETE_ERROR",old_status:p.medula_status||null,new_status:result.ok?"CANCELLED":p.medula_status||null,actor_role:a.role,note:result.resultMessage||result.warningMessage||null,metadata:{resultCode:result.resultCode,ereceteNo:no,explicitConfirmation:true}});
  return NextResponse.json({success:result.ok,resultCode:result.resultCode,resultMessage:result.resultMessage,warningMessage:result.warningMessage,medulaStatus:result.ok?"CANCELLED":p.medula_status},{status:result.ok?200:422});
 }catch(e:any){return NextResponse.json({success:false,error:e?.message||"MEDULA reçete silme işlemi başarısız."},{status:502})}}
