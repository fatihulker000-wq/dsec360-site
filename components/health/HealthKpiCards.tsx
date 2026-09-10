"use client";
import { BRAND,cardStyle } from "../dashboard/styles";
import type { HealthKpiSummary } from "./types";
type Props={summary:HealthKpiSummary;isMobile:boolean};
export default function HealthKpiCards({summary,isMobile}:Props){
 const cards=[
  ["Aktif Çalışan",summary.totalEmployees,BRAND.blue,"Kapsam"],
  ["Sağlık Kaydı Olan",summary.employeesWithHealthRecord,BRAND.green,`%${summary.healthCoveragePercent} kayıt kapsamı`],
  ["Sağlık Kaydı Eksik",summary.employeesMissingHealthRecord,BRAND.red,"D-SEC'te eşleşen kayıt yok"],
  ["Muayenesi Olan",summary.employeesWithExamination,BRAND.green,`${summary.examinationRecords} kayıt`],
  ["Muayene Kaydı Eksik",summary.employeesMissingExamination,BRAND.red,"Kontrol et"],
  ["EK-2 Mevcut",summary.ek2Present,BRAND.green,`${summary.ek2Records} form`],
  ["EK-2 Eksik",summary.ek2Missing,BRAND.red,"Kontrol et"],
  ["Geciken Muayene",summary.overdueExams,BRAND.red,"Son kayda göre"],
  ["30 Gün İçinde",summary.criticalUpcomingExams||0,BRAND.amber,"Yaklaşan"],
  ["90 Gün İçinde",summary.upcomingExams,BRAND.blue,"Planlama"],
  ["Reçete Kaydı",summary.prescriptionRecords,BRAND.amber,`${summary.todayPrescriptions} bugün`],
  ["Takip Gerektiren",summary.riskyEmployees,BRAND.red,"Hekim değerlendirmesi"],
 ] as const;
 return <section style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(210px,1fr))",gap:16}}>
  {cards.map(([title,value,color,note])=><div key={title} style={{...cardStyle(isMobile),display:"flex",flexDirection:"column",gap:10}}>
   <div style={{fontSize:13,fontWeight:850,color:BRAND.muted}}>{title}</div>
   <div style={{fontSize:36,fontWeight:950,color}}>{value}</div>
   <div style={{fontSize:11,fontWeight:800,color:"#64748b"}}>{note}</div>
  </div>)}
 </section>;
}
