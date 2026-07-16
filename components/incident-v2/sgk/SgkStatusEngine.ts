import {SgkIncidentCheck} from "./types";

export class SgkStatusEngine{

static status(
item:SgkIncidentCheck
){

if(item.notificationDate)
return "SENT";

if(item.missingFields.length>0)
return "MISSING_INFORMATION";

if(
new Date(item.notificationDeadline)
<
new Date()
)
return "OVERDUE";

return "READY";

}

}