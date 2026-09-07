"use client";
import { FormEvent, useState } from "react";

const STATUS:Record<string,string>={
  new:"Yeni", read:"Okundu", assigned:"Atandı", in_progress:"İşlemde",
  waiting:"Yanıt Bekliyor", resolved:"Çözüldü", closed:"Kapalı", rejected:"Reddedildi", duplicate:"Mükerrer"
};
const TYPE:Record<string,string>={SIKAYET:"Şikâyet",ONERI:"Öneri",TALEP:"Talep",BILGI:"Bilgi Bildirimi"};

export default function CbsTrackPage(){
  const firmId=typeof window!=="undefined"?new URLSearchParams(window.location.search).get("firm")?.trim()||"":"";
  const [referenceNo,setReferenceNo]=useState("");
  const [trackingCode,setTrackingCode]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [data,setData]=useState<any>(null);

  async function submit(e:FormEvent){
    e.preventDefault(); setError(""); setData(null);
    if(!firmId){setError("Firmaya özel ÇBS bağlantısı bulunamadı.");return;}
    if(!referenceNo.trim()||!trackingCode.trim()){setError("Başvuru numarası ve takip kodunu girin.");return;}
    try{
      setLoading(true);
      const r=await fetch("/api/cbs/track",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        firm_id:firmId,reference_no:referenceNo.trim(),tracking_code:trackingCode.trim()
      })});
      const j=await r.json();
      if(!r.ok){setError(j?.error||"Başvuru bulunamadı.");return;}
      setData(j.application);
    }catch{setError("Bağlantı hatası oluştu.");}
    finally{setLoading(false);}
  }

  return <main style={{minHeight:"100vh",background:"#f8fafc",padding:"48px 18px",fontFamily:"Arial,sans-serif"}}>
    <div style={{maxWidth:760,margin:"0 auto"}}>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:12,fontWeight:900,color:"#9f1239",letterSpacing:".08em"}}>D-SEC • ÇBS</div>
        <h1 style={{fontSize:36,lineHeight:1.15,margin:"9px 0",color:"#111827"}}>Başvurumu Takip Et</h1>
        <p style={{color:"#64748b",lineHeight:1.7}}>Başvuru numaranız ve size özel takip kodunuzla sürecin güncel durumunu güvenli şekilde görüntüleyin.</p>
      </div>

      <form onSubmit={submit} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:22,padding:22,boxShadow:"0 20px 50px rgba(15,23,42,.08)"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:14}}>
          <label style={{fontSize:12,fontWeight:900,color:"#334155"}}>Başvuru No
            <input value={referenceNo} onChange={e=>setReferenceNo(e.target.value)} placeholder="CBS-2026-000123" maxLength={40}
              style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:7,minHeight:48,border:"1px solid #cbd5e1",borderRadius:12,padding:"0 12px"}}/>
          </label>
          <label style={{fontSize:12,fontWeight:900,color:"#334155"}}>Takip Kodu
            <input value={trackingCode} onChange={e=>setTrackingCode(e.target.value)} placeholder="Örn. A1B2C3D4E5F6" maxLength={40}
              style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:7,minHeight:48,border:"1px solid #cbd5e1",borderRadius:12,padding:"0 12px"}}/>
          </label>
        </div>
        <button disabled={loading} style={{marginTop:16,minHeight:48,border:0,borderRadius:12,padding:"0 20px",background:"#9f1239",color:"#fff",fontWeight:900,cursor:"pointer"}}>
          {loading?"Sorgulanıyor...":"Başvuruyu Sorgula"}
        </button>
        {error?<div style={{marginTop:14,padding:12,borderRadius:12,background:"#fef2f2",color:"#991b1b",fontSize:13}}>{error}</div>:null}
      </form>

      {data?<section style={{marginTop:18,background:"#fff",border:"1px solid #e5e7eb",borderRadius:22,padding:22}}>
        <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
          <div><div style={{fontSize:11,fontWeight:900,color:"#64748b"}}>BAŞVURU NO</div><div style={{fontSize:20,fontWeight:950,color:"#111827"}}>{data.reference_no}</div></div>
          <span style={{height:"fit-content",padding:"8px 11px",borderRadius:999,background:"#fff1f2",color:"#9f1239",fontWeight:900}}>{STATUS[data.status]||data.status}</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginTop:18}}>
          {[["Tür",TYPE[data.application_type]||"Şikâyet"],["Kategori",data.category||"-"],["Öncelik",data.priority||"-"],["Başvuru Tarihi",data.created_at?new Date(data.created_at).toLocaleString("tr-TR"):"-"]].map(([a,b])=>
            <div key={a} style={{padding:13,borderRadius:14,background:"#f8fafc"}}><div style={{fontSize:10,fontWeight:900,color:"#64748b"}}>{a.toUpperCase()}</div><div style={{marginTop:5,fontWeight:850,color:"#111827"}}>{b}</div></div>
          )}
        </div>
        {data.latest_response?<div style={{marginTop:16,padding:15,borderRadius:14,background:"#f0fdf4",border:"1px solid #bbf7d0"}}><strong style={{color:"#166534"}}>Son Yetkili Yanıtı</strong><p style={{margin:"7px 0 0",color:"#334155",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{data.latest_response}</p></div>:null}
      </section>:null}
    </div>
  </main>;
}
