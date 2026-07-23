export type EmergencyEntity =
  | "PLAN"
  | "TEAM"
  | "DRILL";

export type EmergencyPlan = {
  id: string;
  firmId: string;

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