import {NextResponse} from "next/server";
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

function deep(o:any,k:string):any{if(!o||typeof o!=="object")return undefined;if(Object.prototype.hasOwnProperty.call(o,k))return o[k];for(const v of Object.values(o)){const r=deep(v,k);if(r!==undefined)return r}}
export async function POST(req:Request){
 try{
  const a=await dsecAuth();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});
  const session=await readMedulaSession();if(!session)return NextResponse.json({success:false,error:"Önce MEDULA hekim oturumu açılmalıdır."},{status:401});
  const b=await req.json(),patientTc=s(b.patientTc);if(!/^\d{10,11}$/.test(patientTc))return NextResponse.json({success:false,error:"Geçerli hasta T.C. girilmelidir."},{status:400});
  const result=await callMedula(session,"ereceteListeSorgula",{tesisKodu:Number(session.facilityCode),doktorTcKimlikNo:Number(session.doctorTc),hastaTcKimlikNo:Number(patientTc)});
  const found=deep(result.data,"ereceteListesi")||[];
  return NextResponse.json({success:result.ok,resultCode:result.resultCode,resultMessage:result.resultMessage,warningMessage:result.warningMessage,prescriptions:Array.isArray(found)?found:[found]},{status:result.ok?200:422});
 }catch(e:any){return NextResponse.json({success:false,error:e?.message||"MEDULA reçete listesi alınamadı."},{status:502})}}
