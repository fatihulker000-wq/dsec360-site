"use client";
import HealthTestRegistry from "@/components/health/tests/HealthTestRegistry";
type Props={employee:{id:string;company_id?:string}&Record<string,any>};
export default function VaccinationTab({employee}:Props){return <HealthTestRegistry employee={employee} kind="VACCINATION" title="Aşılar" description="Çalışan aşı kayıtlarını aşı adı, doz, lot/seri ve sonraki doz tarihi ile kalıcı olarak yönetin." legacyKeys={["vaccination","vaccinations","asi","asilar"]} fields={[{key:"vaccineName",label:"Aşı Adı"},{key:"doseNo",label:"Doz No",type:"number"},{key:"lotNo",label:"Lot / Seri No"},{key:"applicationRoute",label:"Uygulama Yolu"},{key:"appliedBy",label:"Uygulayan"}]}/>}
