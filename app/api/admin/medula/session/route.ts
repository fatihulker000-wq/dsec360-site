import {NextResponse} from "next/server";
import {saveMedulaSession,clearMedulaSession,readMedulaSession} from "@/lib/medula/session";
import type {MedulaEnvironment} from "@/lib/medula/types";

import {cookies} from "next/headers";
function s(v:any){return String(v??"").trim()}
async function dsecAuth(){
 const c=await cookies(),auth=c.get("dsec_admin_auth")?.value||c.get("dsec_user_auth")?.value,role=s(c.get("dsec_admin_role")?.value||c.get("dsec_user_role")?.value);
 if(auth!=="ok"||!["super_admin","admin","company_admin"].includes(role))return null;
 return {role};
}

export async function GET(){
 const a=await dsecAuth();if(!a)return NextResponse.json({success:false},{status:401});
 const x=await readMedulaSession();return NextResponse.json({success:true,connected:!!x,session:x?{doctorTc:x.doctorTc,facilityCode:x.facilityCode,environment:x.environment}:null});
}
export async function POST(req:Request){
 const a=await dsecAuth();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});
 const b=await req.json(),username=s(b.username),password=s(b.password),doctorTc=s(b.doctorTc||b.username),facilityCode=s(b.facilityCode),environment=s(b.environment||"TEST").toUpperCase() as MedulaEnvironment;
 if(!/^\d{11}$/.test(username)||!password||!/^\d{11}$/.test(doctorTc)||!/^\d{8}$/.test(facilityCode)||!["TEST","PROD"].includes(environment))return NextResponse.json({success:false,error:"Hekim kullanıcı adı/T.C., parola, 8 haneli tesis kodu ve ortam bilgisi zorunludur."},{status:400});
 await saveMedulaSession({username,password,doctorTc,facilityCode,environment});
 return NextResponse.json({success:true,connected:true,expiresInSeconds:900,environment,doctorTc,facilityCode});
}
export async function DELETE(){const a=await dsecAuth();if(!a)return NextResponse.json({success:false},{status:401});await clearMedulaSession();return NextResponse.json({success:true})}
