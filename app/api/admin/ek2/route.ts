import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime="nodejs";
function db(){return createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!)}
function s(v:any){return String(v??"").trim()}
function normDate(v:any){const x=s(v);if(!x)return null;if(/^\d{4}-\d{2}-\d{2}$/.test(x))return x;if(/^\d{2}\.\d{2}\.\d{4}$/.test(x)){const[d,m,y]=x.split(".");return `${y}-${m}-${d}`}return null}
async function auth(){const c=await cookies();const a=c.get("dsec_admin_auth")?.value;const role=s(c.get("dsec_admin_role")?.value||"super_admin");const firm=s(c.get("dsec_company_id")?.value);if(a!=="ok"&&role)return null;if(!["super_admin","admin","company_admin","demo_user"].includes(role))return null;return{role,firm,scoped:role==="company_admin"||role==="demo_user"}}
function examType(formType:any){return s(formType).toLocaleUpperCase("tr-TR").includes("PERİYOD")||s(formType).toUpperCase().includes("PERIYOD")?"EK2_PERIYODIK":"EK2_ISE_GIRIS"}

export async function GET(req:Request){
 try{const a=await auth();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});const u=new URL(req.url);const employeeId=s(u.searchParams.get("employeeId"));const requestedCompany=s(u.searchParams.get("companyId"));if(!employeeId)return NextResponse.json({success:false,error:"Çalışan bilgisi eksik."},{status:400});if(a.scoped&&requestedCompany&&requestedCompany!==a.firm)return NextResponse.json({success:false,error:"Bu firma için yetkiniz yok."},{status:403});const companyId=a.scoped?a.firm:requestedCompany;
 let q=db().from("health_ek2_forms").select("*").eq("employee_id",employeeId).or("is_active.is.null,is_active.eq.true").order("exam_date",{ascending:false}).limit(100);if(companyId)q=q.eq("company_id",companyId);const{data,error}=await q;if(error)throw error;return NextResponse.json({success:true,forms:data||[]});
 }catch(e:any){return NextResponse.json({success:false,error:e?.message||"EK-2 kayıtları alınamadı."},{status:500})}
}

export async function POST(req:Request){
 try{const a=await auth();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});if(a.role==="demo_user")return NextResponse.json({success:false,error:"Demo kullanıcı sağlık kaydı oluşturamaz."},{status:403});const body=await req.json();const employeeId=s(body.employeeId||body.employee_id);const requestedCompany=s(body.companyId||body.company_id);const companyId=a.scoped?a.firm:requestedCompany;if(!employeeId||!companyId)return NextResponse.json({success:false,error:"Firma ve çalışan bilgisi zorunludur."},{status:400});if(a.scoped&&requestedCompany&&requestedCompany!==a.firm)return NextResponse.json({success:false,error:"Bu firma için işlem yetkiniz yok."},{status:403});const supabase=db();
 const examDate=normDate(body.examDate||body.exam_date)||new Date().toISOString().slice(0,10);const nextExamDate=normDate(body.nextExamDate||body.next_exam_date);const status=s(body.status||"Taslak");let examinationId:null|string=null;
 if(status!=="Taslak"){
   const{data:exam,error:examError}=await supabase.from("health_examinations").insert({employee_id:employeeId,company_id:companyId,exam_date:examDate,next_exam_date:nextExamDate,decision:body.decision||null,exam_type:examType(body.formType||body.form_type),is_deleted:false,created_at:new Date().toISOString(),updated_at:new Date().toISOString()}).select("id").single();if(examError)throw examError;examinationId=exam.id;
 }
 const payload:any={employee_id:employeeId,company_id:companyId,examination_id:examinationId,form_type:body.formType||body.form_type||"İşe Giriş",status,file_no:body.fileNo||body.file_no||null,revision_no:body.revisionNo||body.revision_no||"0",exam_date:examDate,next_exam_date:nextExamDate,doctor_name:body.doctorName||body.doctor_name||null,employee_name:body.employeeName||body.employee_name||null,identity_number:body.identityNumber||body.identity_number||null,birth_date:normDate(body.birthDate||body.birth_date),gender:body.gender||null,blood_group:body.bloodGroup||body.blood_group||null,phone:body.phone||null,company_name:body.companyName||body.company_name||null,workplace_address:body.workplaceAddress||body.workplace_address||null,job_title:body.jobTitle||body.job_title||null,department:body.department||null,start_date:normDate(body.startDate||body.start_date),danger_class:body.dangerClass||body.danger_class||null,nace_code:body.naceCode||body.nace_code||null,decision:body.decision||null,doctor_opinion:body.doctorOpinion||body.doctor_opinion||null,signature_note:body.signatureNote||body.signature_note||null,raw_json:body,is_active:true,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};
 const{data,error}=await supabase.from("health_ek2_forms").insert(payload).select("*").single();if(error)throw error;return NextResponse.json({success:true,ek2:data,examinationId});
 }catch(e:any){return NextResponse.json({success:false,error:e?.message||"EK-2 kaydedilemedi."},{status:500})}
}
