export class SgkDeadlineEngine{

static calculate(
incidentDate:string
){

const d=new Date(incidentDate);

d.setDate(d.getDate()+3);

return d.toISOString();

}

}