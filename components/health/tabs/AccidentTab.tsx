"use client";

import { useEffect, useState, type CSSProperties } from "react";

type Props = { employee:any };
type AccidentRow = {
  id:string; title?:string; employeeName?:string; employeeId?:string|number; webEmployeeId?:string|null;
  eventType?:string; location?:string; severity?:number; lostWorkDays?:number; eventDate?:string|number|null;
  description?:string; department?:string; shift?:string; injuryBodyPart?:string; injuryType?:string;
  rootCauseCategory?:string; eventHour?:string|number|null; eventWeekDay?:string; source?:string;
  duplicateState?:"EXACT"|"POSSIBLE"|"NONE";
};

export default function AccidentTab({employee}:Props){
  const [items,setItems]=useState<AccidentRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [dup,setDup]=useState({exact:0,possible:0});

  useEffect(()=>{
    let alive=true;
    (async()=>{
      try{
        setLoading(true); setError("");
        const params=new URLSearchParams();
        if(employee?.company_id) params.set("firmId",String(employee.company_id));
        if(employee?.id) params.set("employeeId",String(employee.id));

        const res=await fetch(`/api/admin/accidents?${params.toString()}`,{cache:"no-store",credentials:"include"});
        const json=await res.json().catch(()=>({}));
        if(!res.ok||!json.success) throw new Error(json?.error||"İş kazası kayıtları alınamadı.");

        if(!alive)return;
        setItems(Array.isArray(json.rows)?json.rows:[]);
        setDup(json.duplicateSummary||{exact:0,possible:0});
      }catch(e:any){
        if(alive){setItems([]);setError(e?.message||"İş kazası kayıtları alınamadı.");}
      }finally{if(alive)setLoading(false);}
    })();
    return()=>{alive=false};
  },[employee?.id,employee?.company_id]);

  return <div style={{display:"grid",gap:14}}>
    <section style={cardStyle}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div>
          <div style={eyebrow}>İŞ KAZALARI</div>
          <h2 style={{margin:"5px 0 4px",fontSize:20}}>Çalışan Kaza Geçmişi</h2>
          <div style={{fontSize:12,color:"#667085"}}>Kayıtlar çalışan UUID + firma UUID üzerinden eşleştirilir; isim eşleşmesi kullanılmaz.</div>
        </div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          <Badge text={`${items.length} kayıt`} tone="neutral"/>
          {dup.exact>0&&<Badge text={`${dup.exact} kesin mükerrer adayı`} tone="bad"/>}
          {dup.possible>0&&<Badge text={`${dup.possible} olası mükerrer`} tone="warning"/>}
        </div>
      </div>
    </section>

    {(dup.exact>0||dup.possible>0)&&<section style={{...cardStyle,background:"#fffbeb",borderColor:"#fde68a"}}>
      <b style={{color:"#92400e"}}>Mükerrer kayıt kontrolü gerekli.</b>
      <div style={{fontSize:11.5,color:"#92400e",marginTop:5,lineHeight:1.55}}>
        DORA/sağlık ekranı kayıtları otomatik silmez. Aynı çalışan + olay türü + tarih + başlık + lokasyon eşleşmesi “kesin aday”,
        benzer olay imzasının 3 gün içinde tekrar etmesi “olası aday” olarak işaretlenir. Farklı tarihler tek başına mükerrer sayılmaz.
      </div>
    </section>}

    <section style={cardStyle}>
      {loading?<Empty text="İş kazası kayıtları yükleniyor..."/>:
       error?<Empty text={error} bad/>:
       items.length===0?<Empty text="Bu çalışan için eşleşen iş kazası kaydı bulunamadı."/>:
       <div style={{display:"grid",gap:10}}>
        {items.map(item=>{
          const tone=item.duplicateState==="EXACT"?"bad":item.duplicateState==="POSSIBLE"?"warning":"neutral";
          return <div key={item.id} style={accidentCardStyle}>
            <div style={{minWidth:0}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <b style={{fontSize:15,color:"#101828"}}>{item.title||"İş Kazası Kaydı"}</b>
                {item.duplicateState&&item.duplicateState!=="NONE"&&
                  <Badge text={item.duplicateState==="EXACT"?"Kesin mükerrer adayı":"Olası mükerrer"} tone={tone}/>}
              </div>
              <div style={{color:"#667085",marginTop:5,fontSize:11.5,fontWeight:700}}>
                {formatDate(item.eventDate)} • {item.eventType||"-"} • {item.location||"-"}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:7,marginTop:11}}>
                <Info label="Bölüm" value={item.department||"-"}/>
                <Info label="Vardiya" value={item.shift||"-"}/>
                <Info label="Yaralanan Bölge" value={item.injuryBodyPart||"-"}/>
                <Info label="Yaralanma Türü" value={item.injuryType||"-"}/>
                <Info label="Kök Neden" value={item.rootCauseCategory||"-"}/>
                <Info label="Kayıp Gün" value={String(item.lostWorkDays??0)}/>
              </div>
              {item.description&&<div style={{marginTop:10,padding:10,borderRadius:10,background:"#f8fafc",fontSize:11.5,color:"#475467",lineHeight:1.5}}>{item.description}</div>}
            </div>
            <div style={{display:"grid",gap:6,justifyItems:"end",flex:"0 0 auto"}}>
              <Badge text={`Şiddet ${item.severity??0}`} tone={Number(item.severity||0)>=3?"bad":"neutral"}/>
              <Badge text={item.source||"APP"} tone="neutral"/>
              <span style={{fontSize:9,color:"#98a2b3"}}>ID: {item.id}</span>
            </div>
          </div>
        })}
       </div>}
    </section>
  </div>;
}
function Info({label,value}:{label:string;value:string}){return <div style={{padding:8,borderRadius:9,background:"#f8fafc",minWidth:0}}><div style={{fontSize:9.5,color:"#667085",fontWeight:850}}>{label}</div><div style={{fontSize:11.5,fontWeight:850,color:"#101828",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={value}>{value}</div></div>}
function Empty({text,bad=false}:{text:string;bad?:boolean}){return <div style={{padding:24,borderRadius:12,background:bad?"#fef2f2":"#f8fafc",color:bad?"#b91c1c":"#667085",textAlign:"center",fontWeight:800,fontSize:12}}>{text}</div>}
function Badge({text,tone}:{text:string;tone:"neutral"|"warning"|"bad"}){const x=tone==="bad"?["#fee2e2","#b91c1c"]:tone==="warning"?["#fef3c7","#b45309"]:["#f2f4f7","#475467"];return <span style={{display:"inline-flex",padding:"6px 9px",borderRadius:999,background:x[0],color:x[1],fontSize:10,fontWeight:950,whiteSpace:"nowrap"}}>{text}</span>}
function formatDate(value?:string|number|null){if(value==null||value==="")return"-";const n=Number(value);const d=Number.isFinite(n)&&n>0?new Date(n):new Date(String(value));return Number.isNaN(d.getTime())?"-":d.toLocaleDateString("tr-TR")}
const cardStyle:CSSProperties={background:"#fff",border:"1px solid #e4e7ec",borderRadius:16,padding:17,boxShadow:"0 8px 22px rgba(16,24,40,.035)"};
const accidentCardStyle:CSSProperties={display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:14,border:"1px solid #e4e7ec",borderRadius:14,padding:14,background:"#fff"};
const eyebrow:CSSProperties={fontSize:10,fontWeight:950,letterSpacing:.7,color:"#9f1239"};
