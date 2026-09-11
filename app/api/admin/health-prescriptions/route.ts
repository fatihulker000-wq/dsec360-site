import {createClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";
import {cookies} from "next/headers";
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

type Item={medicineName?:string;activeIngredient?:string;dosage?:string;usageType?:string;duration?:string;morning?:boolean;noon?:boolean;evening?:boolean;night?:boolean;beforeMeal?:boolean;afterMeal?:boolean;notes?:string};
function cleanItems(v:any):Item[]{return Array.isArray(v)?v.filter(x=>s(x?.medicineName)):[]}
async function verifyEmployee(db:any,employeeId:string,companyId:string){
  const {data,error}=await db.from("employees").select("id,firm_id").eq("id",employeeId).single();
  return !error&&data&&s(data.firm_id)===companyId;
}
async function audit(db:any,p:any,action:string,role:string,note?:string){
  await db.from("health_prescription_audit_logs").insert({prescription_id:p.id,company_id:p.company_id,employee_id:p.employee_id,action,old_status:null,new_status:p.status||null,actor_role:role,note:note||null,metadata:{medula_status:p.medula_status||"NOT_SENT"}});
}
export async function GET(req:Request){
 try{const a=await authorize();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});
 const u=new URL(req.url),employeeId=s(u.searchParams.get("employeeId")),requestedCompany=s(u.searchParams.get("companyId"));const limit=Math.min(Math.max(Number(u.searchParams.get("limit")||20),1),100),offset=Math.max(Number(u.searchParams.get("offset")||0),0);
 if(a.scoped&&requestedCompany&&requestedCompany!==a.companyId)return NextResponse.json({success:false,error:"Bu firma için yetkiniz yok."},{status:403});
 const companyId=a.scoped?a.companyId:requestedCompany;let q=getSupabase().from("health_prescriptions").select("*,health_prescription_items(*)").eq("is_active",true).order("created_at",{ascending:false}).range(offset,offset+limit-1);
 if(companyId)q=q.eq("company_id",companyId);if(employeeId)q=q.eq("employee_id",employeeId);const{data,error}=await q;if(error)throw error;
 return NextResponse.json({success:true,prescriptions:data||[],integration:{medulaConnected:false,mode:"PREPARATION"}});
 }catch(e:any){return NextResponse.json({success:false,error:e?.message||"Reçeteler alınamadı."},{status:500})}}
export async function POST(req:Request){
 try{const a=await authorize();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});if(a.role==="demo_user")return NextResponse.json({success:false,error:"Demo kullanıcı reçete kaydedemez."},{status:403});
 const b=await req.json(),requestedCompany=s(b.companyId||b.company_id),companyId=a.scoped?a.companyId:requestedCompany,employeeId=s(b.employeeId||b.employee_id),items=cleanItems(b.items);
 if(!companyId||!employeeId)return NextResponse.json({success:false,error:"Firma ve çalışan zorunludur."},{status:400});
 if(a.scoped&&requestedCompany&&requestedCompany!==a.companyId)return NextResponse.json({success:false,error:"Bu firma için işlem yetkiniz yok."},{status:403});
 const db=getSupabase();if(!(await verifyEmployee(db,employeeId,companyId)))return NextResponse.json({success:false,error:"Çalışan seçili firmaya ait değil."},{status:409});
 const status=s(b.status||"draft");if(status!=="draft"&&(!s(b.diagnosisCode)||items.length===0))return NextResponse.json({success:false,error:"Tamamlanan reçetede tanı ve en az bir ilaç zorunludur."},{status:400});
 const requestedMedula=s(b.ePrescriptionStatus||"NOT_SENT");const medulaStatus=["NOT_SENT","READY"].includes(requestedMedula)?requestedMedula:"NOT_SENT";
 const payload={company_id:companyId,employee_id:employeeId,doctor_id:s(b.doctorId)||null,examination_id:s(b.examinationId)||null,ek2_form_id:s(b.ek2FormId)||null,prescription_no:s(b.prescriptionNo)||null,e_prescription_no:s(b.ePrescriptionNo)||null,medula_tracking_no:s(b.medulaTrackingNo)||null,medula_status:medulaStatus,medula_response:s(b.medulaResponse)||null,doctor_identity_number:s(b.doctorIdentityNumber)||null,doctor_diploma_no:s(b.doctorDiplomaNo)||null,diagnosis_code:s(b.diagnosisCode)||null,diagnosis_name:s(b.diagnosisName)||null,notes:s(b.notes)||null,status,created_by:s(b.createdBy)||null,items};
 const{data:id,error}=await db.rpc("dsec_health_prescription_save",{p_payload:payload});if(error)throw error;
 const medulaPatch={
  patient_identity_number:s(b.patientIdentityNumber)||null,facility_code:s(b.facilityCode)||null,
  provision_type:s(b.provisionType)||null,prescription_date:s(b.prescriptionDate)||null,
  prescription_type:s(b.prescriptionType)||null,prescription_subtype:s(b.prescriptionSubtype)||null,
  protocol_no:s(b.protocolNo)||null,doctor_branch_code:s(b.doctorBranchCode)||null,
  doctor_certificate_code:s(b.doctorCertificateCode)||null,medula_environment:s(b.medulaEnvironment||"TEST")||"TEST"
 };
 const{error:medulaErr}=await db.from("health_prescriptions").update(medulaPatch).eq("id",id);if(medulaErr)throw medulaErr;
 const{data:savedItems,error:itemLoadErr}=await db.from("health_prescription_items").select("id,created_at").eq("prescription_id",id).order("created_at",{ascending:true});if(itemLoadErr)throw itemLoadErr;
 for(let i=0;i<(savedItems||[]).length;i++){const x:any=items[i]||{};const{error:itemErr}=await db.from("health_prescription_items").update({
  barcode:s(x.barcode)||null,quantity:Number(x.quantity||1),usage_form:s(x.usageForm)||null,
  dose1:s(x.dose1)||null,dose2:s(x.dose2)||null,usage_period:s(x.usagePeriod)||null,
  usage_period_unit:s(x.usagePeriodUnit)||null,reimbursement_flag:s(x.reimbursementFlag||"E")||"E"
 }).eq("id",(savedItems as any[])[i].id);if(itemErr)throw itemErr}
 const{data:p,error:loadErr}=await db.from("health_prescriptions").select("*,health_prescription_items(*)").eq("id",id).single();if(loadErr)throw loadErr;await audit(db,p,"CREATED",a.role,"Reçete atomik olarak oluşturuldu.");
 return NextResponse.json({success:true,prescription:p,integration:{medulaConnected:false,mode:"PREPARATION"}},{status:201});
 }catch(e:any){return NextResponse.json({success:false,error:e?.message||"Reçete kaydedilemedi."},{status:500})}}
