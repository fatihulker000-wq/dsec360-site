"use client";
import HealthTestRegistry from "@/components/health/tests/HealthTestRegistry";
type Props={employee:{id:string;company_id?:string}&Record<string,any>};
export default function RespiratoryTab({employee}:Props){return <HealthTestRegistry employee={employee} kind="SFT" title="Solunum / SFT" description="Solunum fonksiyon testi sonuçlarını FEV1, FVC, oran ve PEF değerleriyle kalıcı olarak izleyin." legacyKeys={["sft","respiratory","solunum"]} fields={[{key:"fev1",label:"FEV1",unit:"L",type:"number"},{key:"fvc",label:"FVC",unit:"L",type:"number"},{key:"fev1Fvc",label:"FEV1/FVC",unit:"%",type:"number"},{key:"pef",label:"PEF",unit:"L/dk",type:"number"},{key:"conclusion",label:"SFT Sonucu"}]}/>}
