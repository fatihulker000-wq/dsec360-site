import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const FALLBACK_SYNC_KEY = "dsec_mobile_123456";

function db() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase yapılandırması eksik.");
  return createClient(url, key);
}

function authorized(req: Request) {
  const incoming = (req.headers.get("x-dsec-sync-key") || "").trim();
  const envKey = (process.env.CBS_MOBILE_SYNC_KEY || "").trim();
  return incoming.length > 0 && (incoming === FALLBACK_SYNC_KEY || (envKey && incoming === envKey));
}

function clean(v: unknown) { return String(v ?? "").trim(); }
function isUuid(v: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v); }
function normalize(v: string) {
  return v.toLocaleLowerCase("tr-TR").replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s").replace(/ö/g,"o").replace(/ç/g,"c").replace(/\s+/g," ").trim();
}

async function resolveFirmId(client: ReturnType<typeof db>, firmIdRaw: string, firmaAdiRaw: string) {
  if (isUuid(firmIdRaw)) return firmIdRaw;
  const firmaAdi = normalize(firmaAdiRaw);
  if (!firmaAdi) return null;
  const { data, error } = await client.from("companies").select("id,name").limit(5000);
  if (error) throw error;
  const exact = (data || []).find((x:any) => normalize(clean(x.name)) === firmaAdi);
  const loose = exact || (data || []).find((x:any) => {
    const n = normalize(clean(x.name));
    return n && (n.includes(firmaAdi) || firmaAdi.includes(n));
  });
  return loose?.id ? clean(loose.id) : null;
}

function deny() { return NextResponse.json({ success:false, error:"Yetkisiz." }, {status:401}); }

export async function GET(req: Request) {
  try {
    if (!authorized(req)) return deny();
    const u = new URL(req.url);
    const client = db();
    const firmId = await resolveFirmId(client, clean(u.searchParams.get("firmId")), clean(u.searchParams.get("firmaAdi")));
    if (!firmId) return NextResponse.json({success:false,error:"Firma çözümlenemedi."},{status:400});
    const { data, error } = await client.from("cbs_forms").select("*").eq("firm_id", firmId).order("created_at", {ascending:false});
    if (error) throw error;
    return NextResponse.json({success:true, firmId, count:(data||[]).length, data:data||[]});
  } catch (e:any) {
    console.error("CBS mobile GET", e);
    return NextResponse.json({success:false,error:"Sunucu hatası.",detail:e?.message||null},{status:500});
  }
}

export async function POST(req: Request) {
  try {
    if (!authorized(req)) return deny();
    const body = await req.json();
    const client = db();
    const firmId = await resolveFirmId(client, clean(body?.firm_id), clean(body?.firma_adi));
    const full_name = clean(body?.full_name);
    const message = clean(body?.message);
    if (!firmId || !full_name || !message) return NextResponse.json({success:false,error:"Firma, full_name ve message zorunlu."},{status:400});
    const payload:any = {
      full_name,
      email: clean(body?.email) || null,
      message,
      firm_id: firmId,
      firma_adi: clean(body?.firma_adi) || null,
      category: clean(body?.category) || "Genel",
      priority: clean(body?.priority) || "normal",
      assigned_to: clean(body?.assigned_to) || null,
      resolution_note: clean(body?.resolution_note) || null,
      status: clean(body?.status) || "new",
      source_type: "APP",
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await client.from("cbs_forms").insert(payload).select("id").single();
    if (error) throw error;
    return NextResponse.json({success:true,firmId,remoteId:data.id});
  } catch (e:any) {
    console.error("CBS mobile POST",e);
    return NextResponse.json({success:false,error:"Sunucu hatası.",detail:e?.message||null},{status:500});
  }
}

export async function PUT(req: Request) {
  try {
    if (!authorized(req)) return deny();
    const body = await req.json();
    const id = Number(body?.id);
    const client = db();
    const firmId = await resolveFirmId(client, clean(body?.firm_id), clean(body?.firma_adi));
    if (!id || !firmId) return NextResponse.json({success:false,error:"id ve firma zorunlu."},{status:400});
    const update:any = { updated_at:new Date().toISOString() };
    for (const k of ["status","category","priority","assigned_to","resolution_note","message","full_name","email","firma_adi"]) {
      if (body?.[k] !== undefined) update[k] = clean(body[k]) || null;
    }
    if (body?.status !== undefined) update.closed_at = clean(body.status).toLowerCase()==="closed" ? new Date().toISOString() : null;
    const { data, error } = await client.from("cbs_forms").update(update).eq("id",id).eq("firm_id",firmId).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({success:false,error:"Bu firmaya ait kayıt bulunamadı."},{status:404});
    return NextResponse.json({success:true,firmId});
  } catch(e:any) {
    console.error("CBS mobile PUT",e);
    return NextResponse.json({success:false,error:"Sunucu hatası.",detail:e?.message||null},{status:500});
  }
}
