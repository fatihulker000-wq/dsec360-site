"use client";

import {useState,type CSSProperties} from "react";
import PrescriptionHistory from "./PrescriptionHistory";
import MedulaConnectionPanel from "./MedulaConnectionPanel";
import MedulaPrescriptionActions from "./MedulaPrescriptionActions";

type Item={
  medicineName:string;activeIngredient:string;dosage:string;usageType:string;duration:string;
  morning:boolean;noon:boolean;evening:boolean;night:boolean;beforeMeal:boolean;afterMeal:boolean;notes:string;
  barcode:string;quantity:number;usageForm:string;dose1:string;dose2:string;usagePeriod:string;usagePeriodUnit:string;reimbursementFlag:"E"|"H";
};
type Props={employee:{id:string;full_name:string;company_id?:string;company_name?:string;job_title?:string;identity_number?:string;tc_identity_number?:string}};
const blank:Item={medicineName:"",activeIngredient:"",dosage:"",usageType:"",duration:"",morning:false,noon:false,evening:false,night:false,beforeMeal:false,afterMeal:false,notes:"",barcode:"",quantity:1,usageForm:"",dose1:"",dose2:"",usagePeriod:"",usagePeriodUnit:"",reimbursementFlag:"E"};

export default function PrescriptionWorkspace({employee}:Props){
 const [id,setId]=useState("");
 const [diagnosisCode,setDiagnosisCode]=useState(""),[diagnosisName,setDiagnosisName]=useState(""),[notes,setNotes]=useState("");
 const [doctorTc,setDoctorTc]=useState(""),[diploma,setDiploma]=useState("");
 const [patientTc,setPatientTc]=useState(employee.identity_number||employee.tc_identity_number||"");
 const [facilityCode,setFacilityCode]=useState("11069903"),[provisionType,setProvisionType]=useState("1");
 const [prescriptionDate,setPrescriptionDate]=useState(new Date().toISOString().slice(0,10));
 const [prescriptionType,setPrescriptionType]=useState("1"),[prescriptionSubtype,setPrescriptionSubtype]=useState("1");
 const [protocolNo,setProtocolNo]=useState(""),[doctorBranchCode,setDoctorBranchCode]=useState(""),[doctorCertificateCode,setDoctorCertificateCode]=useState("");
 const [medulaEnvironment,setMedulaEnvironment]=useState<"TEST"|"PROD">("TEST");
 const [medulaStatus,setMedulaStatus]=useState("NOT_SENT"),[eNo,setENo]=useState(""),[tracking,setTracking]=useState(""),[medulaResponse,setMedulaResponse]=useState("");
 const [items,setItems]=useState<Item[]>([{...blank}]),[saving,setSaving]=useState(false),[sending,setSending]=useState(false),[msg,setMsg]=useState(""),[refresh,setRefresh]=useState(0),[icd,setIcd]=useState<any[]>([]),[drug,setDrug]=useState<Record<number,any[]>>({});

 const upd=<K extends keyof Item>(i:number,k:K,v:Item[K])=>setItems(p=>p.map((x,n)=>n===i?{...x,[k]:v}:x));
 async function searchIcd(q:string){setDiagnosisCode(q);if(q.length<2){setIcd([]);return}try{const r=await fetch(`/api/admin/icd10/search?q=${encodeURIComponent(q)}`);const j=await r.json();setIcd(j.items||[])}catch{setIcd([])}}
 async function searchDrug(i:number,q:string){upd(i,"medicineName",q);if(q.length<2){setDrug(p=>({...p,[i]:[]}));return}try{const r=await fetch(`/api/admin/drugs/search?q=${encodeURIComponent(q)}`);const j=await r.json();setDrug(p=>({...p,[i]:j.items||[]}))}catch{}}
 function selectDrug(i:number,d:any){upd(i,"medicineName",d.drug_name||d.name||"");upd(i,"activeIngredient",d.active_ingredient||"");upd(i,"dosage",d.strength||"");upd(i,"usageType",d.dosage_form||"");if(d.barcode||d.barkod)upd(i,"barcode",String(d.barcode||d.barkod));setDrug(p=>({...p,[i]:[]}))}
 function payload(status:string){return{
   employeeId:employee.id,companyId:employee.company_id,diagnosisCode,diagnosisName,doctorIdentityNumber:doctorTc,doctorDiplomaNo:diploma,notes,status,items:items.map(x=>({...x,usageForm:x.usageForm||null,dose1:x.dose1||null,dose2:x.dose2||null,usagePeriod:x.usagePeriod||null,usagePeriodUnit:x.usagePeriodUnit||null})),
   patientIdentityNumber:patientTc,facilityCode,provisionType,prescriptionDate,prescriptionType,prescriptionSubtype,protocolNo,doctorBranchCode,doctorCertificateCode,medulaEnvironment
 }}
 async function save(status="draft"){
  try{setSaving(true);setMsg("");const r=await fetch(id?`/api/admin/health-prescriptions/${id}`:"/api/admin/health-prescriptions",{method:id?"PUT":"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload(status))});const j=await r.json().catch(()=>({}));if(!r.ok||!j.success)throw new Error(j.error||"Reçete kaydedilemedi.");const p=j.prescription;hydrate(p);setMsg("Reçete kaydedildi.");setRefresh(x=>x+1);return p.id as string}catch(e:any){setMsg(e.message||"Reçete kaydedilemedi.");return ""}finally{setSaving(false)}
 }
 async function ready(){let rid=id;if(!rid)rid=await save("completed");if(!rid)return;try{const r=await fetch(`/api/admin/health-prescriptions/${rid}/medula-status`,{method:"PUT",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({medulaStatus:"READY"})});const j=await r.json();if(!r.ok||!j.success)throw new Error(j.error||"Durum güncellenemedi.");setMedulaStatus(j.prescription.medula_status);setMsg("Reçete MEDULA gönderimine hazır.");setRefresh(x=>x+1)}catch(e:any){setMsg(e.message)}}
 async function sendMedula(){
   let rid=id;
   if(!rid){rid=await save("completed");if(!rid)return}
   if(medulaStatus!=="READY"){await ready()}
   try{setSending(true);setMsg("MEDULA'ya gönderiliyor...");const r=await fetch(`/api/admin/health-prescriptions/${rid}/medula-send`,{method:"POST",credentials:"include"});const j=await r.json().catch(()=>({}));if(!r.ok||!j.success){const detail=Array.isArray(j.missing)&&j.missing.length?` Eksik: ${j.missing.join(", ")}`:"";throw new Error((j.error||j.resultMessage||"MEDULA gönderimi başarısız.")+detail)}setMedulaStatus("SENT");if(j.ePrescriptionNo)setENo(j.ePrescriptionNo);setMedulaResponse(j.resultMessage||j.warningMessage||"");setMsg(`MEDULA gönderimi başarılı.${j.ePrescriptionNo?` e-Reçete No: ${j.ePrescriptionNo}`:""}`);setRefresh(x=>x+1)}catch(e:any){setMedulaStatus("ERROR");setMsg(e.message||"MEDULA gönderimi başarısız.")}finally{setSending(false)}
 }
 async function load(pid:string){const r=await fetch(`/api/admin/health-prescriptions/${pid}`,{cache:"no-store",credentials:"include"});const j=await r.json();if(!r.ok||!j.success){alert(j.error||"Reçete yüklenemedi.");return}hydrate(j.prescription);window.scrollTo({top:0,behavior:"smooth"})}
 function hydrate(p:any){
   setId(p.id||"");setDiagnosisCode(p.diagnosis_code||"");setDiagnosisName(p.diagnosis_name||"");setDoctorTc(p.doctor_identity_number||"");setDiploma(p.doctor_diploma_no||"");setNotes(p.notes||"");setMedulaStatus(p.medula_status||"NOT_SENT");setENo(p.e_prescription_no||"");setTracking(p.medula_tracking_no||"");setMedulaResponse(p.medula_last_result_message||p.medula_response||"");
   setPatientTc(p.patient_identity_number||employee.identity_number||employee.tc_identity_number||"");setFacilityCode(p.facility_code||"11069903");setProvisionType(String(p.provision_type||"1"));setPrescriptionDate(p.prescription_date||new Date().toISOString().slice(0,10));setPrescriptionType(String(p.prescription_type||"1"));setPrescriptionSubtype(String(p.prescription_subtype||"1"));setProtocolNo(p.protocol_no||"");setDoctorBranchCode(p.doctor_branch_code||"");setDoctorCertificateCode(p.doctor_certificate_code||"");setMedulaEnvironment((p.medula_environment||"TEST")==="PROD"?"PROD":"TEST");
   const loaded=(p.health_prescription_items||[]).map((x:any)=>({medicineName:x.medicine_name||"",activeIngredient:x.active_ingredient||"",dosage:x.dosage||"",usageType:x.usage_type||"",duration:x.duration||"",morning:!!x.morning,noon:!!x.noon,evening:!!x.evening,night:!!x.night,beforeMeal:!!x.before_meal,afterMeal:!!x.after_meal,notes:x.notes||"",barcode:x.barcode||"",quantity:Number(x.quantity||1),usageForm:x.usage_form==null?"":String(x.usage_form),dose1:x.dose1==null?"":String(x.dose1),dose2:x.dose2==null?"":String(x.dose2),usagePeriod:x.usage_period==null?"":String(x.usage_period),usagePeriodUnit:x.usage_period_unit==null?"":String(x.usage_period_unit),reimbursementFlag:x.reimbursement_flag==="H"?"H":"E"} as Item));setItems(loaded.length?loaded:[{...blank}])
 }
 function fresh(){setId("");setDiagnosisCode("");setDiagnosisName("");setDoctorTc("");setDiploma("");setPatientTc(employee.identity_number||employee.tc_identity_number||"");setFacilityCode("11069903");setProvisionType("1");setPrescriptionDate(new Date().toISOString().slice(0,10));setPrescriptionType("1");setPrescriptionSubtype("1");setProtocolNo("");setDoctorBranchCode("");setDoctorCertificateCode("");setMedulaEnvironment("TEST");setNotes("");setMedulaStatus("NOT_SENT");setENo("");setTracking("");setMedulaResponse("");setItems([{...blank}]);setMsg("")}

 return <div style={{display:"grid",gap:14}}>
   <MedulaConnectionPanel/>

   <section style={card}>
    <div style={head}><div><div style={eyebrow}>D-SEC SAĞLIK • REÇETE / e-REÇETE</div><h2 style={{margin:"5px 0 4px"}}>SGK MEDULA Gönderim Hazırlığı</h2><div style={muted}>Zorunlu SGK alanları, ilaç kullanım bilgileri ve gerçek gönderim tek ekranda yönetilir.</div></div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}><Badge text={id?"Düzenleme":"Yeni reçete"}/><Badge text={medulaLabel(medulaStatus)} tone={medulaStatus==="SENT"||medulaStatus==="READY"?"good":medulaStatus==="ERROR"?"bad":"neutral"}/><button style={btn} onClick={fresh}>Yeni</button></div></div>
   </section>

   <section style={card}>
    <div style={head}><h3 style={h3}>MEDULA Zorunlu Alanları</h3><Badge text={medulaEnvironment==="TEST"?"SGK TEST":"GERÇEK MEDULA"} tone={medulaEnvironment==="TEST"?"neutral":"bad"}/></div>
    <div style={grid}>
      <Info label="Çalışan" value={employee.full_name}/><Info label="Firma" value={employee.company_name||"-"}/>
      <Field label="Hasta T.C."><input value={patientTc} onChange={e=>setPatientTc(e.target.value.replace(/\D/g,"").slice(0,11))} style={input}/></Field>
      <Field label="Tesis Kodu"><input value={facilityCode} onChange={e=>setFacilityCode(e.target.value.replace(/\D/g,"").slice(0,8))} style={input}/></Field>
      <Field label="Provizyon Tipi"><input type="number" min="1" value={provisionType} onChange={e=>setProvisionType(e.target.value)} style={input}/></Field>
      <Field label="Reçete Tarihi"><input type="date" value={prescriptionDate} onChange={e=>setPrescriptionDate(e.target.value)} style={input}/></Field>
      <Field label="Reçete Türü"><input type="number" min="1" value={prescriptionType} onChange={e=>setPrescriptionType(e.target.value)} style={input}/></Field>
      <Field label="Reçete Alt Türü"><input type="number" min="1" value={prescriptionSubtype} onChange={e=>setPrescriptionSubtype(e.target.value)} style={input}/></Field>
      <Field label="Protokol No"><input value={protocolNo} onChange={e=>setProtocolNo(e.target.value)} style={input}/></Field>
      <Field label="Hekim T.C."><input value={doctorTc} onChange={e=>setDoctorTc(e.target.value.replace(/\D/g,"").slice(0,11))} style={input}/></Field>
      <Field label="Diploma No"><input value={diploma} onChange={e=>setDiploma(e.target.value)} style={input}/></Field>
      <Field label="Doktor Branş Kodu"><input value={doctorBranchCode} onChange={e=>setDoctorBranchCode(e.target.value.replace(/\D/g,""))} style={input}/></Field>
      <Field label="Doktor Sertifika Kodu"><input value={doctorCertificateCode} onChange={e=>setDoctorCertificateCode(e.target.value.replace(/\D/g,""))} style={input}/></Field>
      <Field label="Gönderim Ortamı"><select value={medulaEnvironment} onChange={e=>setMedulaEnvironment(e.target.value as any)} style={input}><option value="TEST">SGK TEST</option><option value="PROD">GERÇEK MEDULA</option></select></Field>
    </div>
    <div style={{...muted,marginTop:8}}>İşyeri hekimliği akışında takip numarası gönderim payloadına eklenmez. Tesis kodu ve hekim bilgileri MEDULA oturumuyla eşleşmelidir.</div>
   </section>

   <section style={card}>
    <h3 style={h3}>Tanı</h3>
    <div style={grid}>
      <Field label="ICD-10"><input value={diagnosisCode} onChange={e=>searchIcd(e.target.value)} style={input}/>{icd.length>0&&<div style={drop}>{icd.slice(0,12).map(x=><button key={x.code} type="button" style={option} onClick={()=>{setDiagnosisCode(x.code);setDiagnosisName(x.name);setIcd([])}}><b>{x.code}</b> — {x.name}</button>)}</div>}</Field>
      <Field label="Tanı Adı"><input value={diagnosisName} onChange={e=>setDiagnosisName(e.target.value)} style={input}/></Field>
    </div>
   </section>

   <section style={card}>
    <div style={head}><h3 style={h3}>İlaçlar / MEDULA Kullanım Bilgileri</h3><button style={btn} onClick={()=>setItems(p=>[...p,{...blank}])}>+ İlaç</button></div>
    <div style={{display:"grid",gap:10}}>
      {items.map((x,i)=><div key={i} style={medicine}>
       <div style={head}><b>İlaç #{i+1}</b>{items.length>1&&<button style={{...btn,color:"#b91c1c"}} onClick={()=>setItems(p=>p.filter((_,n)=>n!==i))}>Kaldır</button>}</div>
       <div style={grid}>
        <Field label="İlaç adı"><input value={x.medicineName} onChange={e=>searchDrug(i,e.target.value)} style={input}/>{drug[i]?.length>0&&<div style={drop}>{drug[i].slice(0,12).map((d:any)=><button type="button" key={d.id||d.drug_name} style={option} onClick={()=>selectDrug(i,d)}><b>{d.drug_name}</b> — {d.active_ingredient||"-"}</button>)}</div>}</Field>
        <Field label="Barkod"><input value={x.barcode} onChange={e=>upd(i,"barcode",e.target.value.replace(/\D/g,""))} style={input}/></Field>
        <Field label="Kutu / Adet"><input type="number" min="1" value={x.quantity} onChange={e=>upd(i,"quantity",Math.max(1,Number(e.target.value||1)))} style={input}/></Field>
        <Field label="Etkin madde"><input value={x.activeIngredient} onChange={e=>upd(i,"activeIngredient",e.target.value)} style={input}/></Field>
        <Field label="Kullanım Şekli Kodu"><input type="number" value={x.usageForm} onChange={e=>upd(i,"usageForm",e.target.value)} style={input}/></Field>
        <Field label="Doz 1"><input type="number" value={x.dose1} onChange={e=>upd(i,"dose1",e.target.value)} style={input}/></Field>
        <Field label="Doz 2"><input type="number" step="0.01" value={x.dose2} onChange={e=>upd(i,"dose2",e.target.value)} style={input}/></Field>
        <Field label="Kullanım Periyodu"><input type="number" value={x.usagePeriod} onChange={e=>upd(i,"usagePeriod",e.target.value)} style={input}/></Field>
        <Field label="Periyot Birimi Kodu"><input type="number" value={x.usagePeriodUnit} onChange={e=>upd(i,"usagePeriodUnit",e.target.value)} style={input}/></Field>
        <Field label="Geri Ödeme"><select value={x.reimbursementFlag} onChange={e=>upd(i,"reimbursementFlag",e.target.value as "E"|"H")} style={input}><option value="E">Evet</option><option value="H">Hayır</option></select></Field>
        <Field label="Doz Açıklaması"><input value={x.dosage} onChange={e=>upd(i,"dosage",e.target.value)} style={input}/></Field>
        <Field label="Kullanım Açıklaması"><input value={x.usageType} onChange={e=>upd(i,"usageType",e.target.value)} style={input}/></Field>
       </div>
      </div>)}
    </div>
   </section>

   <section style={card}>
    <h3 style={h3}>Not ve İşlem</h3>
    <textarea value={notes} onChange={e=>setNotes(e.target.value)} style={{...input,minHeight:80,resize:"vertical"}}/>
    <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:10,flexWrap:"wrap"}}>
      <button disabled={saving||sending} style={btn} onClick={()=>save("draft")}>{saving?"Kaydediliyor...":"Taslak Kaydet"}</button>
      <button disabled={saving||sending} style={primary} onClick={()=>save("completed")}>Tamamla</button>
      <button disabled={saving||sending||medulaStatus==="READY"||medulaStatus==="SENT"} style={readyBtn} onClick={ready}>MEDULA'ya Hazırla</button>
      <button disabled={saving||sending||medulaStatus==="SENT"} style={sendBtn} onClick={sendMedula}>{sending?"Gönderiliyor...":"MEDULA'ya Gönder"}</button>
    </div>
    {msg&&<div style={{marginTop:10,padding:10,borderRadius:10,background:medulaStatus==="ERROR"?"#fef2f2":"#f0fdf4",fontSize:11,fontWeight:850,lineHeight:1.5}}>{msg}</div>}
   </section>

   <section style={card}>
    <h3 style={h3}>MEDULA Sonuç</h3>
    <div style={grid}><Info label="e-Reçete No" value={eNo||"-"}/><Info label="MEDULA Takip No" value={tracking||"-"}/><Info label="Durum" value={medulaLabel(medulaStatus)}/></div>
    {medulaResponse&&<div style={{...muted,marginTop:10}}>SGK Yanıtı: {medulaResponse}</div>}
   </section>

   {id&&<MedulaPrescriptionActions prescriptionId={id} ePrescriptionNo={eNo} patientTc={patientTc} medulaStatus={medulaStatus} onChanged={({status,message})=>{if(status)setMedulaStatus(status);if(message)setMedulaResponse(message);setRefresh(x=>x+1)}}/>}
   <PrescriptionHistory employeeId={employee.id} companyId={employee.company_id} refreshKey={refresh} onEdit={load}/>
 </div>
}
function medulaLabel(v:string){return ({NOT_SENT:"Gönderilmedi",READY:"Hazır",SENT:"Gönderildi",ERROR:"Hata",CANCELLED:"İptal"} as any)[v]||v}
function Badge({text,tone="neutral"}:{text:string;tone?:"neutral"|"good"|"bad"}){return <span style={{padding:"6px 9px",borderRadius:999,fontSize:10,fontWeight:950,background:tone==="good"?"#dcfce7":tone==="bad"?"#fee2e2":"#f2f4f7",color:tone==="good"?"#15803d":tone==="bad"?"#b91c1c":"#475467"}}>{text}</span>}
function Info({label,value}:{label:string;value:string}){return <div><div style={labelStyle}>{label}</div><div style={{fontWeight:900,fontSize:12}}>{value}</div></div>}
function Field({label,children}:{label:string;children:any}){return <label style={{display:"grid",gap:5,position:"relative"}}><span style={labelStyle}>{label}</span>{children}</label>}
const card:CSSProperties={background:"#fff",border:"1px solid #e4e7ec",borderRadius:16,padding:16,boxShadow:"0 7px 20px rgba(16,24,40,.035)"};const eyebrow:CSSProperties={fontSize:9.5,fontWeight:950,letterSpacing:.7,color:"#9f1239"};const muted:CSSProperties={fontSize:11.5,color:"#667085",lineHeight:1.55};const h3:CSSProperties={margin:"0 0 11px",fontSize:15};const grid:CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10};const input:CSSProperties={width:"100%",border:"1px solid #d0d5dd",borderRadius:9,padding:"9px 10px",fontSize:11.5,outline:"none"};const labelStyle:CSSProperties={fontSize:10,color:"#667085",fontWeight:850};const head:CSSProperties={display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"};const medicine:CSSProperties={padding:12,border:"1px solid #e4e7ec",borderRadius:12,background:"#f8fafc"};const btn:CSSProperties={border:"1px solid #d0d5dd",background:"#fff",borderRadius:9,padding:"8px 10px",fontSize:10.5,fontWeight:900,cursor:"pointer"};const primary:CSSProperties={...btn,background:"#7f1d1d",borderColor:"#7f1d1d",color:"#fff"};const readyBtn:CSSProperties={...btn,background:"#111827",borderColor:"#111827",color:"#fff"};const sendBtn:CSSProperties={...btn,background:"#065f46",borderColor:"#065f46",color:"#fff"};const drop:CSSProperties={position:"absolute",top:"100%",left:0,right:0,zIndex:20,background:"#fff",border:"1px solid #d0d5dd",borderRadius:9,maxHeight:220,overflow:"auto",boxShadow:"0 10px 25px rgba(0,0,0,.12)"};const option:CSSProperties={display:"block",width:"100%",textAlign:"left",border:0,borderBottom:"1px solid #eee",background:"#fff",padding:9,cursor:"pointer",fontSize:10.5};
