import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const FALLBACK_SYNC_KEY = "dsec_mobile_123456";

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase yapılandırması eksik.");
  return createClient(url, key);
}
function authorized(req: Request) {
  const incoming = (req.headers.get("x-dsec-sync-key") || "").trim();
  const envKey = (process.env.CBS_MOBILE_SYNC_KEY || "").trim();

  // Geriye uyumluluk: Android uygulamanın mevcut sabit anahtarı ile
  // Vercel ortam anahtarından herhangi biri geçerlidir.
  // Böylece env anahtarı tanımlandığında eski App istemcisi 401'e düşmez.
  return incoming.length > 0 && (
    incoming === FALLBACK_SYNC_KEY ||
    (envKey.length > 0 && incoming === envKey)
  );
}
function unauthorized() { return NextResponse.json({ success:false, error:"Yetkisiz." }, { status:401 }); }
function uuid(v: unknown) {
  const s=String(v||"").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s) ? s : null;
}
async function requireCompany(db: ReturnType<typeof supabaseAdmin>, firmId:string) {
  const { data, error } = await db.from("companies").select("id,name").eq("id", firmId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function GET(req: Request) {
  try {
    if (!authorized(req)) return unauthorized();
    const firmId=uuid(new URL(req.url).searchParams.get("firmId"));
    if (!firmId) return NextResponse.json({success:false,error:"Geçerli firmId UUID zorunlu."},{status:400});
    const db=supabaseAdmin();
    const company=await requireCompany(db, firmId);
    if (!company) return NextResponse.json({success:false,error:"Firma bulunamadı."},{status:404});
    const { data,error }=await db.from("cbs_forms").select("*").eq("firm_id",firmId).order("created_at",{ascending:false});
    if (error) throw error;
    return NextResponse.json({success:true,firmId,firmName:company.name,count:(data||[]).length,data:data||[]});
  } catch(e:any) {
    console.error("CBS mobile GET",e);
    return NextResponse.json({success:false,error:"Sunucu hatası.",detail:e?.message||null},{status:500});
  }
}

export async function POST(req: Request) {
  try {
    if (!authorized(req)) return unauthorized();
    const body=await req.json();
    const firmId=uuid(body?.firm_id);
    const full_name=String(body?.full_name||"").trim();
    const message=String(body?.message||"").trim();
    if (!firmId || !full_name || !message) return NextResponse.json({success:false,error:"firm_id, full_name ve message zorunlu."},{status:400});
    const db=supabaseAdmin();
    const company=await requireCompany(db,firmId);
    if (!company) return NextResponse.json({success:false,error:"Firma bulunamadı."},{status:404});
    const payload={
      full_name,email:String(body?.email||"").trim()||null,message,
      firm_id:firmId,firma_adi:String(company.name||body?.firma_adi||"").trim()||null,
      category:String(body?.category||"Genel").trim(),priority:String(body?.priority||"normal").trim(),
      assigned_to:String(body?.assigned_to||"").trim()||null,resolution_note:String(body?.resolution_note||"").trim()||null,
      status:String(body?.status||"new").trim()||"new",source_type:"APP",updated_at:new Date().toISOString()
    };
    const {data,error}=await db.from("cbs_forms").insert(payload).select("id,firm_id").single();
    if(error) throw error;
    return NextResponse.json({success:true,firmId,remoteId:data.id});
  } catch(e:any) {
    console.error("CBS mobile POST",e);
    return NextResponse.json({success:false,error:"Sunucu hatası.",detail:e?.message||null},{status:500});
  }
}

export async function PUT(req: Request) {
  try {
    if (!authorized(req)) return unauthorized();
    const body=await req.json();
    const id=Number(body?.id); const firmId=uuid(body?.firm_id);
    if(!id || !firmId) return NextResponse.json({success:false,error:"id ve firm_id zorunlu."},{status:400});
    const db=supabaseAdmin();
    if(!await requireCompany(db,firmId)) return NextResponse.json({success:false,error:"Firma bulunamadı."},{status:404});
    const allowed:any={updated_at:new Date().toISOString()};
    for(const k of ["status","category","priority","assigned_to","resolution_note","message","full_name","email","firma_adi"]){
      if(body?.[k]!==undefined) allowed[k]=String(body[k]??"").trim()||null;
    }
    if(body?.status!==undefined) allowed.closed_at=String(body.status).trim().toLowerCase()==="closed"?new Date().toISOString():null;
    const {data,error}=await db.from("cbs_forms").update(allowed).eq("id",id).eq("firm_id",firmId).select("id").maybeSingle();
    if(error) throw error;
    if(!data) return NextResponse.json({success:false,error:"Bu firmaya ait kayıt bulunamadı."},{status:404});
    return NextResponse.json({success:true,firmId});
  } catch(e:any) {
    console.error("CBS mobile PUT",e);
    return NextResponse.json({success:false,error:"Sunucu hatası.",detail:e?.message||null},{status:500});
  }
}
