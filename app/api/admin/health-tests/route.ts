import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime="nodejs";

type RecordType="LABORATORY"|"AUDIOMETRY"|"SFT"|"VACCINATION";
const TYPES=new Set<RecordType>(["LABORATORY","AUDIOMETRY","SFT","VACCINATION"]);
function s(v:any){return String(v??"").trim()}
function dateOnly(v:any){const x=s(v);return /^\d{4}-\d{2}-\d{2}$/.test(x)?x:null}
function supabase(){return createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}})}
async function auth(){
 const c=await cookies(); const auth=c.get("dsec_admin_auth")?.value; const role=s(c.get("dsec_admin_role")?.value||"super_admin"); const firm=s(c.get("dsec_company_id")?.value);
 if(auth!=="ok"&&role)return null;
 if(!["super_admin","admin","company_admin","demo_user"].includes(role))return null;
 return {role,firm,scoped:role==="company_admin"||role==="demo_user"};
}

export async function GET(req:Request){
 try{
  const a=await auth(); if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});
  const u=new URL(req.url); const employeeId=s(u.searchParams.get("employeeId")); const requestedCompany=s(u.searchParams.get("companyId")); const type=s(u.searchParams.get("type")) as RecordType;
  if(!employeeId)return NextResponse.json({success:false,error:"employeeId zorunludur."},{status:400});
  if(type&&!TYPES.has(type))return NextResponse.json({success:false,error:"Geçersiz sağlık kayıt türü."},{status:400});
  if(a.scoped&&requestedCompany&&requestedCompany!==a.firm)return NextResponse.json({success:false,error:"Bu firma için yetkiniz yok."},{status:403});
  const companyId=a.scoped?a.firm:requestedCompany;
  let q=supabase().from("health_test_records").select("*").eq("employee_id",employeeId).eq("is_deleted",false).order("test_date",{ascending:false}).order("created_at",{ascending:false}).limit(250);
  if(companyId)q=q.eq("company_id",companyId); if(type)q=q.eq("record_type",type);
  const{data,error}=await q;if(error)throw error;
  return NextResponse.json({success:true,records:data||[]});
 }catch(e:any){return NextResponse.json({success:false,error:e?.message||"Sağlık test kayıtları alınamadı."},{status:500})}
}

export async function POST(req:Request){
 try{
  const a=await auth();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});
  if(a.role==="demo_user")return NextResponse.json({success:false,error:"Demo kullanıcı sağlık testi kaydedemez."},{status:403});
  const b=await req.json(); const employeeId=s(b.employeeId||b.employee_id); const requestedCompany=s(b.companyId||b.company_id); const companyId=a.scoped?a.firm:requestedCompany; const type=s(b.recordType||b.record_type) as RecordType;
  if(!employeeId||!companyId)return NextResponse.json({success:false,error:"Firma ve çalışan bilgisi zorunludur."},{status:400});
  if(!TYPES.has(type))return NextResponse.json({success:false,error:"Kayıt türü zorunludur/geçersizdir."},{status:400});
  if(a.scoped&&requestedCompany&&requestedCompany!==a.firm)return NextResponse.json({success:false,error:"Bu firma için işlem yetkiniz yok."},{status:403});

  // Çalışanın gerçekten firmaya ait olduğunu doğrula.
  const db=supabase();
  const{data:employee,error:empErr}=await db.from("employees").select("id,firm_id").eq("id",employeeId).single();
  if(empErr||!employee)return NextResponse.json({success:false,error:"Çalışan bulunamadı."},{status:404});
  if(s(employee.firm_id)!==companyId)return NextResponse.json({success:false,error:"Çalışan seçili firmaya ait değil."},{status:409});

  const payload={company_id:companyId,employee_id:employeeId,record_type:type,status:s(b.status||"ACTIVE"),result_status:s(b.resultStatus||b.result_status)||null,test_date:dateOnly(b.testDate||b.test_date)||new Date().toISOString().slice(0,10),next_due_date:dateOnly(b.nextDueDate||b.next_due_date),provider:s(b.provider)||null,report_no:s(b.reportNo||b.report_no)||null,summary:s(b.summary)||null,notes:s(b.notes)||null,details:(b.details&&typeof b.details==="object")?b.details:{},examination_id:s(b.examinationId||b.examination_id)||null,ek2_form_id:s(b.ek2FormId||b.ek2_form_id)||null,source:s(b.source||"HEALTH_MODULE"),is_deleted:false};
  const{data,error}=await db.from("health_test_records").insert(payload).select("*").single();if(error)throw error;
  return NextResponse.json({success:true,record:data},{status:201});
 }catch(e:any){const msg=e?.message||"Sağlık testi kaydedilemedi.";const dup=String(msg).toLowerCase().includes("duplicate");return NextResponse.json({success:false,error:dup?"Aynı rapor numarasıyla kayıt zaten mevcut.":msg},{status:dup?409:500})}
}
