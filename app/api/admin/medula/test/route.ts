import {NextResponse} from "next/server";
import {readMedulaSession} from "@/lib/medula/session";
import {callMedula} from "@/lib/medula/client";

import {cookies} from "next/headers";
function s(v:any){return String(v??"").trim()}
async function dsecAuth(){
 const c=await cookies(),auth=c.get("dsec_admin_auth")?.value||c.get("dsec_user_auth")?.value,role=s(c.get("dsec_admin_role")?.value||c.get("dsec_user_role")?.value);
 if(auth!=="ok"||!["super_admin","admin","company_admin"].includes(role))return null;
 return {role};
}

export const runtime="nodejs";
export async function POST(req:Request){
 try{const a=await dsecAuth();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});const session=await readMedulaSession();if(!session)return NextResponse.json({success:false,error:"MEDULA oturumu yok."},{status:401});const b=await req.json(),patientTc=s(b.patientTc);
 if(!/^\d{10,11}$/.test(patientTc))return NextResponse.json({success:false,error:"Bağlantı testi için geçerli test/hasta T.C. girin."},{status:400});
 const result=await callMedula(session,"ereceteListeSorgula",{tesisKodu:Number(session.facilityCode),doktorTcKimlikNo:Number(session.doctorTc),hastaTcKimlikNo:Number(patientTc)});
 return NextResponse.json({success:result.ok,authenticated:result.ok,resultCode:result.resultCode,resultMessage:result.resultMessage,warningMessage:result.warningMessage,environment:session.environment},{status:result.ok?200:422});
 }catch(e:any){return NextResponse.json({success:false,authenticated:false,error:e?.message||"MEDULA bağlantı testi başarısız."},{status:502})}}
