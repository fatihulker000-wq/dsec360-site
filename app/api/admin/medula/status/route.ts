import {NextResponse} from "next/server";
import {readMedulaSession} from "@/lib/medula/session";
import {medulaConfig} from "@/lib/medula/config";

import {cookies} from "next/headers";
function s(v:any){return String(v??"").trim()}
async function dsecAuth(){
 const c=await cookies(),auth=c.get("dsec_admin_auth")?.value||c.get("dsec_user_auth")?.value,role=s(c.get("dsec_admin_role")?.value||c.get("dsec_user_role")?.value);
 if(auth!=="ok"||!["super_admin","admin","company_admin"].includes(role))return null;
 return {role};
}

export async function GET(){
 const a=await dsecAuth();if(!a)return NextResponse.json({success:false},{status:401});const x=await readMedulaSession();
 return NextResponse.json({success:true,sessionActive:!!x,environment:x?.environment||null,doctorTc:x?`${x.doctorTc.slice(0,3)}*****${x.doctorTc.slice(-3)}`:null,facilityCode:x?.facilityCode||null,endpoint:x?medulaConfig(x.environment).RECETE_ENDPOINT:null});
}
