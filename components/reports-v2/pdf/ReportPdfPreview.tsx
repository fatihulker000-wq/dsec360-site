"use client";
import type {ReportDocument} from "./types";

export default function ReportPdfPreview({document}:{document:ReportDocument}){
 return(
  <div style={{background:"#fff",padding:24,borderRadius:20,border:"1px solid #e5e7eb"}}>
   <h1>{document.reportTitle}</h1>
   <h2>{document.companyName}</h2>
   <p><b>D-SEC Skoru:</b> {document.score}/100</p>
   <h3>Yönetici Özeti</h3>
   <p>{document.executiveSummary}</p>
   <h3>DORA Analizi</h3>
   <p>{document.doraSummary}</p>
   {document.sections.map((s,i)=>(
    <section key={i}>
      <h3>{s.title}</h3>
      <p>{s.content}</p>
    </section>
   ))}
   <hr/>
   <small>D-SEC Kurumsal PDF Önizleme</small>
  </div>
 );
}
