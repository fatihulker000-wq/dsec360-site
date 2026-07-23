export type EmergencyEntity =
  | "PLAN"
  | "TEAM"
  | "DRILL";

export type EmergencyScenario = {
  title: string;
  riskDescription: string;
  alarmMethod: string;
  firstResponse: string;
  evacuationMethod: string;
  responsibleTeams: string;
  equipment: string;
  externalInstitutions: string;
};

export type EmergencyPlanContent = {
  purpose: string;
  scope: string;
  legalBasis: string;
  definitions: string;
  responsibilities: string;
  alarmAndCommunication: string;
  evacuationPrinciples: string;
  specialGroups: string;
  postEmergencyActions: string;

  scenarios: EmergencyScenario[];

  contacts: {
    title: string;
    phone: string;
    note: string;
  }[];

  assemblyAreas: {
    name: string;
    location: string;
    capacity: number;
    responsible: string;
    note: string;
  }[];

  equipment: {
    name: string;
    location: string;
    quantity: number;
    lastControlDate: string;
    nextControlDate: string;
    status:
      | "UYGUN"
      | "BAKIM_GEREKLI"
      | "EKSIK";
  }[];

  approvals: {
    preparedBy: string;
    checkedBy: string;
    occupationalSafetyExpert: string;
    workplacePhysician: string;
    approvedBy: string;
  };
};

export type EmergencyPlan = {
  id: string;
  firmId: string;

  planNo?: string;
  planContent?: EmergencyPlanContent;

  planTitle: string;
  workplaceTitle: string;
  workplaceAddress: string;

  dangerClass:
    | "AZ_TEHLIKELI"
    | "TEHLIKELI"
    | "COK_TEHLIKELI";

  employeeCount: number;

  planDateMillis: number;
  validUntilMillis: number | null;
  revisionDateMillis: number | null;
  revisionNo: string;

  assemblyArea: string;
  emergencyCoordinator: string;
  preparedBy: string;
  approvedBy: string;

  assemblyAreaPhotoUri: string | null;
  emergencyExitRoutePhotoUri: string | null;
  fireEquipmentPhotoUri: string | null;
  emergencyBoardPhotoUri: string | null;

  fireScenario: string;
  earthquakeScenario: string;
  floodScenario: string;
  accidentScenario: string;
  evacuationScenario: string;

  createdAtMillis: number;
  updatedAtMillis: number;
};

export type EmergencySupportMember = {
  id: string;
  firmId: string;

  employeeId: string | null;

  teamType:
    | "YANGIN"
    | "ARAMA_KURTARMA"
    | "ILKYARDIM"
    | "KORUMA"
    | "TAHLIYE";

  teamRole:
    | "EKIP_LIDERI"
    | "EKIP_UYESI";

  fullName: string;
  duty: string;
  department: string;
  phone: string;
  certificateInfo: string;

  assignedDateMillis: number;

  signatureStatus:
    | "IMZA_BEKLIYOR"
    | "IMZALANDI";

  isActive: boolean;

  createdAtMillis: number;
  updatedAtMillis: number;
};

export type EmergencyDrill = {
  id: string;
  firmId: string;

  drillType:
    | "YANGIN_TAHLIYE"
    | "DEPREM"
    | "KIMYASAL"
    | "GENEL_TAHLIYE"
    | "DIGER";

  drillTitle: string;

  drillDateMillis: number;
  nextDrillDueMillis: number | null;

  participantCount: number;
  durationMinutes: number;

  result: string;
  deficiencies: string;
  correctiveActions: string;
  responsible: string;

  status:
    | "GEÇERLİ"
    | "REVIZYON_GEREKLI";

  createdAtMillis: number;
  updatedAtMillis: number;
};

export type EmergencyBundle = {
  plans: EmergencyPlan[];
  teams: EmergencySupportMember[];
  drills: EmergencyDrill[];
};