"use client";
import HealthTestRegistry from "@/components/health/tests/HealthTestRegistry";
type Props={employee:{id:string;company_id?:string}&Record<string,any>};
export default function AudiometryTab({employee}:Props){return <HealthTestRegistry employee={employee} kind="AUDIOMETRY" title="Odyometri" description="İşitme testlerini sağ/sol kulak eşikleri ve değerlendirme sonucu ile kalıcı olarak izleyin." legacyKeys={["audiometry","odyometri","hearing"]} fields={[{key:"rightEarAvg",label:"Sağ Kulak Ortalama",unit:"dB",type:"number"},{key:"leftEarAvg",label:"Sol Kulak Ortalama",unit:"dB",type:"number"},{key:"rightEar4000",label:"Sağ 4000 Hz",unit:"dB",type:"number"},{key:"leftEar4000",label:"Sol 4000 Hz",unit:"dB",type:"number"},{key:"conclusion",label:"Odyometri Sonucu"}]}/>}
