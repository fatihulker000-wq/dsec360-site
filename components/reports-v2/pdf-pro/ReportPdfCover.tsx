"use client";
import type {PdfCoverInfo} from "./types";

export default function ReportPdfCover({cover}:{cover:PdfCoverInfo}){
 return(
 <div style={{padding:40,background:"#fff",border:"1px solid #ddd",borderRadius:18}}>
  <div style={{fontSize:12,fontWeight:900,color:"#666"}}>D-SEC PROFESSIONAL REPORT</div>
  <h1>{cover.reportTitle}</h1>
  <h2>{cover.companyName}</h2>
  <p><b>Rapor No:</b> {cover.reportNo}</p>
  <p><b>Revizyon:</b> {cover.revisionNo}</p>
  <p><b>D-SEC Skoru:</b> {cover.score}/100</p>
  <p><b>Hazırlayan:</b> {cover.preparedBy||"-"}</p>
  <p><b>Onaylayan:</b> {cover.approvedBy||"-"}</p>
 </div>);
}
