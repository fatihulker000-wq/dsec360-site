export type IncidentType =
  | "WORK_ACCIDENT"
  | "NEAR_MISS"
  | "UNSAFE_ACT"
  | "UNSAFE_CONDITION"
  | "ENVIRONMENT"
  | "FIRE"
  | "CHEMICAL"
  | "VEHICLE"
  | "FORKLIFT"
  | "ELECTRIC"
  | "FALL"
  | "CUT"
  | "BURN"
  | "OCCUPATIONAL_DISEASE"
  | "SECURITY"
  | "OTHER";

export type IncidentSeverity =
  | 1
  | 2
  | 3
  | 4
  | 5;

export type IncidentStatus =
  | "DRAFT"
  | "OPEN"
  | "INVESTIGATION"
  | "CORRECTIVE_ACTION"
  | "EFFECTIVENESS"
  | "READY_FOR_NOTIFICATION"
  | "CLOSED"
  | "ARCHIVED";

export interface IncidentGeneral {

  id: string;

  incidentNo: string;

  companyId: string;

  companyName: string;

  department: string;

  location: string;

  activity: string;

  workOrderNo?: string;

  permitNo?: string;

  incidentDate: string;

  incidentTime: string;

  shift: string;

  incidentType: IncidentType;

  severity: IncidentSeverity;

  status: IncidentStatus;

}

export interface IncidentEnvironment {

  weather: string;

  temperature: number;

  humidity: number;

  lighting: string;

  noise: string;

  ventilation: string;

}

export interface IncidentEquipment {

  equipmentId?: string;

  equipmentName?: string;

  serialNo?: string;

  qrCode?: string;

  barcode?: string;

  nfcTag?: string;

  rfidTag?: string;

}

export interface IncidentPPE {

  helmet: boolean;

  gloves: boolean;

  glasses: boolean;

  shoes: boolean;

  vest: boolean;

  respiratory: boolean;

  other?: string;

}

export interface IncidentFormData {

  general: IncidentGeneral;

  environment: IncidentEnvironment;

  equipment: IncidentEquipment;

  ppe: IncidentPPE;

}