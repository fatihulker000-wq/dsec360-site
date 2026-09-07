import { createHash, randomBytes } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const APPLICATION_TYPES = new Set(["SIKAYET", "ONERI", "TALEP", "BILGI"]);
const CATEGORY_CODES = new Set([
  "ISG","CALISMA_KOSULLARI","INSAN_KAYNAKLARI","CEVRE",
  "TESIS_TEKNIK","YEMEKHANE","SERVIS_ULASIM","DIGER"
]);
const PRIVACY_MODES = new Set(["identified","confidential","anonymous"]);

const CATEGORY_LABELS: Record<string,string> = {
  ISG:"İSG", CALISMA_KOSULLARI:"Çalışma Koşulları",
  INSAN_KAYNAKLARI:"İnsan Kaynakları", CEVRE:"Çevre",
  TESIS_TEKNIK:"Tesis / Teknik", YEMEKHANE:"Yemekhane",
  SERVIS_ULASIM:"Servis / Ulaşım", DIGER:"Diğer"
};

function supabase() {
  const url=process.env.SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) throw new Error("Supabase yapılandırması eksik.");
  return createClient(url,key);
}
function resend(){ const k=process.env.RESEND_API_KEY; return k?new Resend(k):null; }
function clean(v:unknown,max:number){ return String(v??"").replace(/\s+/g," ").trim().slice(0,max); }
function email(v:unknown){ return String(v??"").trim().toLowerCase().slice(0,180); }
function uuid(v:unknown){ const s=String(v??"").trim(); return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)?s:null; }
function esc(v:unknown){ return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;"); }
function priority(message:string, type:string, category:string){
  const t=message.toLocaleLowerCase("tr-TR");
  if(["ölüm","yaralanma","yangın","patlama","ciddi kaza"].some(x=>t.includes(x))) return "critical";
  if(category==="ISG" && ["acil","risk","tehlike","ramak kala"].some(x=>t.includes(x))) return "high";
  if(type==="ONERI") return "low";
  return "normal";
}
function slaHours(p:string,category:string){
  if(p==="critical") return 4;
  if(p==="high") return 8;
  if(category==="ISG") return 8;
  return p==="low"?48:24;
}

export async function POST(request:Request){
  try{
    const body=await request.json();
    const url=new URL(request.url);

    // Canonical tenant: yalnızca gerçek remote company UUID.
    const firmId=uuid(body?.firm_id) || uuid(url.searchParams.get("firm"));
    if(!firmId) return Response.json({error:"Geçerli firma bağlantısı bulunamadı. Başvuruyu firmanıza ait ÇBS bağlantısından açın."},{status:400});

    const applicationType=String(body?.application_type||"SIKAYET").trim().toUpperCase();
    const categoryCode=String(body?.category||"DIGER").trim().toUpperCase();
    const privacyMode=String(body?.privacy_mode||"identified").trim().toLowerCase();
    if(!APPLICATION_TYPES.has(applicationType)) return Response.json({error:"Geçersiz başvuru türü."},{status:400});
    if(!CATEGORY_CODES.has(categoryCode)) return Response.json({error:"Geçersiz konu kategorisi."},{status:400});
    if(!PRIVACY_MODES.has(privacyMode)) return Response.json({error:"Geçersiz gizlilik seçimi."},{status:400});

    const isAnonymous=privacyMode==="anonymous";
    const fullName=isAnonymous?"Anonim Başvuru":clean(body?.full_name,120);
    const mail=isAnonymous?"":email(body?.email);
    const message=clean(body?.message,5000);

    if(!message || message.length<10) return Response.json({error:"Başvuru açıklaması en az 10 karakter olmalıdır."},{status:400});
    if(!isAnonymous && fullName.length<2) return Response.json({error:"Ad Soyad zorunludur."},{status:400});
    if(!isAnonymous && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return Response.json({error:"Geçerli e-posta adresi girin."},{status:400});

    const db=supabase();
    const {data:company,error:companyError}=await db.from("companies").select("id,name").eq("id",firmId).maybeSingle();
    if(companyError||!company) return Response.json({error:"Firma bulunamadı veya ÇBS bağlantısı geçersiz."},{status:404});

    const p=priority(message,applicationType,categoryCode);
    const trackingCode=randomBytes(6).toString("hex").toUpperCase();
    const trackingCodeHash=createHash("sha256").update(trackingCode).digest("hex");
    const now=new Date();
    const due=new Date(now.getTime()+slaHours(p,categoryCode)*3600000);

    const payload={
      full_name:fullName,
      email:mail||null,
      firma_adi:String(company.name||"").trim(),
      message,
      firm_id:firmId,
      status:"new",
      category:CATEGORY_LABELS[categoryCode]||"Diğer",
      category_code:categoryCode,
      application_type:applicationType,
      privacy_mode:privacyMode,
      priority:p,
      sla_due_at:due.toISOString(),
      source_type:"WEB",
      mail_sent_count:0,
      created_at:now.toISOString(),
      updated_at:now.toISOString(),
      last_status_at:now.toISOString(),
      tracking_code_hash:trackingCodeHash,
    };

    const {data,error}=await db.from("cbs_forms").insert(payload).select("*").single();
    if(error||!data){
      console.error("CBS insert:",error);
      return Response.json({error:"Başvuru kaydedilemedi."},{status:500});
    }

    // Trigger sonrası reference_no görünmüyorsa güvenli fallback.
    const referenceNo=String(data.reference_no||`CBS-${now.getFullYear()}-${String(data.id).padStart(6,"0")}`);
    if(!data.reference_no){
      await db.from("cbs_forms").update({reference_no:referenceNo}).eq("id",data.id);
    }

    const mailer=resend(), from=process.env.RESEND_FROM_EMAIL||"onboarding@resend.dev";
    const notify=process.env.ADMIN_NOTIFICATION_EMAIL;
    if(mailer&&notify){
      try{
        await mailer.emails.send({
          from,to:[notify],
          subject:`Yeni ÇBS • ${referenceNo} • ${CATEGORY_LABELS[categoryCode]||categoryCode}`,
          html:`<h2>D-SEC ÇBS</h2><p><strong>Başvuru:</strong> ${esc(referenceNo)}</p><p><strong>Firma:</strong> ${esc(company.name)}</p><p><strong>Tür:</strong> ${esc(applicationType)}</p><p><strong>Kategori:</strong> ${esc(CATEGORY_LABELS[categoryCode])}</p><p><strong>Öncelik:</strong> ${esc(p)}</p><hr/><p>${esc(message)}</p>`
        });
      }catch(e){ console.error("CBS admin mail:",e); }
    }
    if(mailer&&mail){
      try{
        await mailer.emails.send({
          from,to:[mail],subject:`Başvurunuz alındı • ${referenceNo}`,
          html:`<h2>Başvurunuz alındı</h2><p>Başvuru numaranız: <strong>${esc(referenceNo)}</strong></p><p>Durum: Yeni</p>`
        });
      }catch(e){ console.error("CBS kullanıcı mail:",e); }
    }

    return Response.json({
      success:true,
      reference_no:referenceNo,
      tracking_code:trackingCode,
      data:{id:data.id,reference_no:referenceNo,status:"new",firm_id:firmId,category:CATEGORY_LABELS[categoryCode],application_type:applicationType,priority:p,sla_due_at:due.toISOString()}
    });
  }catch(e){
    console.error("CBS POST:",e);
    return Response.json({error:"Sunucu hatası."},{status:500});
  }
}
