import {SgkIncidentCheck} from "./types";

export class SgkValidationEngine{

static validate(
item:SgkIncidentCheck
){

const missing:string[]=[];

if(!item.employeeName)
missing.push("Çalışan");

if(!item.tcNo)
missing.push("T.C.");

if(!item.companyName)
missing.push("Firma");

if(!item.incidentDate)
missing.push("Kaza Tarihi");

if(!item.notificationDeadline)
missing.push("Bildirim Süresi");

return{

valid:
missing.length===0,

missing

};

}

}