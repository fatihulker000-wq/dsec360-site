"use client";
import { useEffect,useState } from "react";

type HealthTabProps = { employee: { id: string } & Record<string, any> };
export default function AudiometryTab({ employee }: HealthTabProps){
 const [rows,setRows]=useState<any[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 useEffect(()=>{let alive=true;(async()=>{try{const r=await fetch(`/api/admin/ek2?employeeId=${encodeURIComponent(employee.id)}`,{cache:"no-store",credentials:"include"});const j=await r.json();if(!r.ok)throw new Error(j?.error||"Kayıtlar alınamadı.");if(alive)setRows(j.forms||[]);}catch(e:any){if(alive)setError(e?.message||"Kayıtlar alınamadı.");}finally{if(alive)setLoading(false);}})();return()=>{alive=false}},[employee.id]);
 const get=(x:any)=>{const raw=x?.raw_json||{}; const v=raw.audiometry||raw.odyometri||raw.hearing; if(v==null||v===""||(typeof v==="object"&&Object.keys(v).length===0))return "-"; return typeof v==="object"?JSON.stringify(v,null,2):String(v)};
 return <div><h3 style={{marginTop:0}}>Odyometri</h3><p style={{color:"#64748b"}}>EK-2 sağlık kayıtlarındaki Odyometri verileri. Kayıt yoksa sistem bunu tıbbi işlemin yapılmadığı şeklinde yorumlamaz.</p>
 {loading?<p>Yükleniyor...</p>:error?<p style={{color:"#b91c1c"}}>{error}</p>:rows.length===0?<p>Kayıt bulunamadı.</p>:rows.map((x:any)=><div key={x.id} style={{padding:14,border:"1px solid #e5e7eb",borderRadius:14,marginBottom:10,background:"#fff"}}><b>{x.exam_date||x.created_at||"Tarih yok"}</b><pre style={{whiteSpace:"pre-wrap",fontFamily:"inherit",marginBottom:0,color:"#334155"}}>{get(x)}</pre></div>)}</div>;
}