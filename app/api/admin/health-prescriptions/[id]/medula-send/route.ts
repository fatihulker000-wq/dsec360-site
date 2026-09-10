import {createClient} from "@supabase/supabase-js";
import {NextRequest,NextResponse} from "next/server";
import {readMedulaSession} from "@/lib/medula/session";
import {callMedula} from "@/lib/medula/client";

import {cookies} from "next/headers";
function s(v:any){return String(v??"").trim()}
async function dsecAuth(){
 const c=await cookies(),auth=c.get("dsec_admin_auth")?.value||c.get("dsec_user_auth")?.value,role=s(c.get("dsec_admin_role")?.value||c.get("dsec_user_role")?.value);
 if(auth!=="ok"||!["super_admin","admin","company_admin"].includes(role))return null;
 return {role};
}

function db(){return createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}})}
function trDate(v:any){const d=new Date(v);if(Number.isNaN(d.getTime()))return"";return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`}
export async function POST(_:NextRequest,{params}:{params:Promise<{id:string}>}){
 try{const a=await dsecAuth();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});const session=await readMedulaSession();if(!session)return NextResponse.json({success:false,error:"Önce MEDULA hekim oturumu açılmalıdır."},{status:401});const{id}=await params;const supabase=db();
 const{data:p,error}=await supabase.from("health_prescriptions").select("*,health_prescription_items(*)").eq("id",id).eq("is_active",true).single();if(error||!p)return NextResponse.json({success:false,error:"Reçete bulunamadı."},{status:404});
 const items=p.health_prescription_items||[];const missing:string[]=[];
 if(!s(p.patient_identity_number))missing.push("Hasta T.C.");if(!s(p.facility_code))missing.push("Tesis kodu");if(!p.provision_type)missing.push("Provizyon tipi");if(!p.prescription_date)missing.push("Reçete tarihi");if(!p.prescription_type)missing.push("Reçete türü");if(!p.prescription_subtype)missing.push("Reçete alt türü");if(!s(p.protocol_no))missing.push("Protokol no");if(!s(p.doctor_branch_code))missing.push("Doktor branş kodu");if(!s(p.doctor_certificate_code))missing.push("Doktor sertifika kodu");if(!s(p.diagnosis_code))missing.push("Tanı");
 if(s(p.doctor_identity_number)!==session.doctorTc)missing.push("Reçete hekimi ile MEDULA oturumu hekimi aynı değil");
 if(s(p.facility_code)!==session.facilityCode)missing.push("Reçete tesis kodu ile MEDULA oturum tesis kodu aynı değil");
 if(items.length===0)missing.push("İlaç");for(const[i,x]of items.entries()){if(!s(x.barcode))missing.push(`İlaç #${i+1} barkod`);if(!x.quantity)missing.push(`İlaç #${i+1} adet`);if(x.dose1==null)missing.push(`İlaç #${i+1} doz1`);if(x.dose2==null)missing.push(`İlaç #${i+1} doz2`);if(x.usage_period==null)missing.push(`İlaç #${i+1} kullanım periyodu`);if(x.usage_period_unit==null)missing.push(`İlaç #${i+1} periyot birimi`)}
 if(missing.length)return NextResponse.json({success:false,error:"MEDULA gönderimi için eksik alanlar var.",missing},{status:400});
 const ereceteDVO={tesisKodu:Number(p.facility_code),tcKimlikNo:Number(p.patient_identity_number),provizyonTipi:Number(p.provision_type),receteTarihi:trDate(p.prescription_date),receteTuru:Number(p.prescription_type),receteAltTuru:Number(p.prescription_subtype),protokolNo:s(p.protocol_no),doktorTcKimlikNo:Number(session.doctorTc),doktorBransKodu:Number(p.doctor_branch_code),doktorSertifikaKodu:Number(p.doctor_certificate_code),ereceteIlacListesi:items.map((x:any)=>({barkod:Number(x.barcode),adet:Number(x.quantity),kullanimSekli:x.usage_form==null?undefined:Number(x.usage_form),kullanimDoz1:Number(x.dose1),kullanimDoz2:Number(x.dose2),kullanimPeriyot:Number(x.usage_period),kullanimPeriyotBirimi:Number(x.usage_period_unit),geriOdemeKapsaminda:s(x.reimbursement_flag||"E")})),ereceteTaniListesi:[{taniKodu:s(p.diagnosis_code),taniAdi:s(p.diagnosis_name)||undefined}]};
 // İşyeri hekimliklerinde takipNo gönderilmez (SGK kılavuzu).
 const result=await callMedula(session,"ereceteGiris",{tesisKodu:Number(session.facilityCode),doktorTcKimlikNo:Number(session.doctorTc),ereceteDVO});
 const raw:any=result.data;const find=(o:any,k:string):any=>{if(!o||typeof o!=="object")return undefined;if(k in o)return o[k];for(const v of Object.values(o)){const r=find(v,k);if(r!==undefined)return r}};
 const medulaNo=s(find(raw,"ereceteNo"));
 const patch:any={medula_last_result_code:result.resultCode,medula_last_result_message:result.resultMessage||null,medula_last_warning_message:result.warningMessage||null,medula_last_checked_at:new Date().toISOString(),medula_environment:session.environment,medula_status:result.ok?"SENT":"ERROR",updated_at:new Date().toISOString()};
 if(result.ok){patch.medula_last_sent_at=new Date().toISOString();if(medulaNo)patch.e_prescription_no=medulaNo}
 await supabase.from("health_prescriptions").update(patch).eq("id",id);
 await supabase.from("health_prescription_audit_logs").insert({prescription_id:id,company_id:p.company_id,employee_id:p.employee_id,action:result.ok?"MEDULA_SENT":"MEDULA_ERROR",old_status:p.medula_status||"READY",new_status:patch.medula_status,actor_role:a.role,note:result.resultMessage||result.warningMessage||null,metadata:{environment:session.environment,resultCode:result.resultCode,ereceteNo:medulaNo||null}});
 return NextResponse.json({success:result.ok,resultCode:result.resultCode,resultMessage:result.resultMessage,warningMessage:result.warningMessage,ePrescriptionNo:medulaNo||null,environment:session.environment},{status:result.ok?200:422});
 }catch(e:any){return NextResponse.json({success:false,error:e?.message||"MEDULA gönderimi başarısız."},{status:502})}}
