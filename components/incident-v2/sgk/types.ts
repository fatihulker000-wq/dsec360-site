export type SgkNotificationStatus =
  | "NOT_REQUIRED"
  | "READY"
  | "MISSING_INFORMATION"
  | "OVERDUE"
  | "SENT";

export interface SgkIncidentCheck {

    incidentId:string;

    employeeName:string;

    tcNo:string;

    companyName:string;

    incidentDate:string;

    notificationDeadline:string;

    notificationDate?:string;

    lostDay:number;

    fatal:boolean;

    occupationalDisease:boolean;

    hospitalReport:boolean;

    status:SgkNotificationStatus;

    missingFields:string[];

}

export interface SgkDashboardSummary{

    total:number;

    ready:number;

    overdue:number;

    sent:number;

    missing:number;

}