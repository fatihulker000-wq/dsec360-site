import {NextRequest,NextResponse} from "next/server";
import {cookies} from "next/headers";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const COOKIE_MODE="dsec_medula_sim";
const COOKIE_SCENARIO="dsec_medula_sim_scenario";
const SCENARIOS=new Set(["SUCCESS","SEND_ERROR","TIMEOUT","AUTH_ERROR"]);
function s(v:any){return String(v??"").trim()}
async function auth(){const c=await cookies();const a=c.get("dsec_admin_auth")?.value||c.get("dsec_user_auth")?.value;const r=s(c.get("dsec_admin_role")?.value||c.get("dsec_user_role")?.value);return a==="ok"&&["super_admin","admin","company_admin"].includes(r)?{role:r}:null}
export async function GET(){const a=await auth();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});const c=await cookies();return NextResponse.json({success:true,enabled:c.get(COOKIE_MODE)?.value==="1",scenario:c.get(COOKIE_SCENARIO)?.value||"SUCCESS",externalNetwork:false,mode:"SIMULATION"})}
export async function POST(req:NextRequest){const a=await auth();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});const b=await req.json().catch(()=>({}));const scenario=s(b.scenario||"SUCCESS").toUpperCase();if(!SCENARIOS.has(scenario))return NextResponse.json({success:false,error:"Geçersiz simülasyon senaryosu."},{status:400});const res=NextResponse.json({success:true,enabled:true,scenario,externalNetwork:false,mode:"SIMULATION",message:"MEDULA simülasyonu etkin. SGK/MEDULA'ya dış bağlantı yapılmayacak."});res.cookies.set(COOKIE_MODE,"1",{httpOnly:true,sameSite:"strict",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60});res.cookies.set(COOKIE_SCENARIO,scenario,{httpOnly:true,sameSite:"strict",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60});return res}
export async function DELETE(){const a=await auth();if(!a)return NextResponse.json({success:false,error:"Yetkisiz erişim."},{status:401});const res=NextResponse.json({success:true,enabled:false,mode:"REAL",message:"Simülasyon kapatıldı. Gerçek MEDULA işlemleri yeniden gerçek hekim oturumu gerektirir."});res.cookies.set(COOKIE_MODE,"",{httpOnly:true,path:"/",maxAge:0});res.cookies.set(COOKIE_SCENARIO,"",{httpOnly:true,path:"/",maxAge:0});return res}
