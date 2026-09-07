import { createHash, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function db(){
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) throw new Error("Supabase yapılandırması eksik.");
  return createClient(url,key);
}
function clean(v:unknown,max=120){ return String(v??"").trim().slice(0,max); }
function uuid(v:unknown){ const s=clean(v,80); return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)?s:null; }
function safeEqual(a:string,b:string){
  const aa=Buffer.from(a), bb=Buffer.from(b);
  return aa.length===bb.length && timingSafeEqual(aa,bb);
}

export async function POST(request:Request){
  try{
    const body=await request.json();
    const firmId=uuid(body?.firm_id);
    const referenceNo=clean(body?.reference_no,40).toUpperCase();
    const trackingCode=clean(body?.tracking_code,40).toUpperCase();

    if(!firmId||!referenceNo||!trackingCode)
      return Response.json({error:"Firma, başvuru numarası ve takip kodu zorunludur."},{status:400});

    const {data,error}=await db()
      .from("cbs_forms")
      .select("reference_no,status,category,category_code,application_type,priority,created_at,updated_at,closed_at,sla_due_at,first_response_at,privacy_mode,admin_reply")
      .eq("firm_id",firmId)
      .eq("reference_no",referenceNo)
      .maybeSingle();

    // Kayıt var/yok bilgisini brute-force için ayırmıyoruz.
    if(error||!data)
      return Response.json({error:"Başvuru bilgileri doğrulanamadı."},{status:404});

    const {data:secret}=await db()
      .from("cbs_forms")
      .select("tracking_code_hash")
      .eq("firm_id",firmId)
      .eq("reference_no",referenceNo)
      .maybeSingle();

    const supplied=createHash("sha256").update(trackingCode).digest("hex");
    if(!secret?.tracking_code_hash || !safeEqual(supplied,String(secret.tracking_code_hash)))
      return Response.json({error:"Başvuru bilgileri doğrulanamadı."},{status:404});

    return Response.json({
      success:true,
      application:{
        reference_no:data.reference_no,
        status:data.status,
        category:data.category,
        category_code:data.category_code,
        application_type:data.application_type,
        priority:data.priority,
        created_at:data.created_at,
        updated_at:data.updated_at,
        closed_at:data.closed_at,
        sla_due_at:data.sla_due_at,
        first_response_at:data.first_response_at,
        privacy_mode:data.privacy_mode,
        // Public tarafta iç notlar/atanan kişi/kimlik bilgileri ASLA dönmez.
        latest_response:data.admin_reply || null
      }
    });
  }catch(e){
    console.error("CBS TRACK:",e);
    return Response.json({error:"Sunucu hatası."},{status:500});
  }
}
