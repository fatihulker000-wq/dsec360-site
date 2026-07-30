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

export type EmergencyPlanRevision = {
  revisionNo: string;
  revisionDate: string;
  changeReason: string;
  preparedBy: string;
  approvedBy: string;
};

export type EmergencyPlanContact = {
  title: string;
  phone: string;
  note: string;
};

export type EmergencyAssemblyArea = {
  name: string;
  location: string;
  capacity: number;
  responsible: string;
  note: string;
};

export type EmergencyEquipmentStatus =
  | "UYGUN"
  | "BAKIM_GEREKLI"
  | "EKSIK";

export type EmergencyEquipment = {
  name: string;
  location: string;
  quantity: number;
  lastControlDate: string;
  nextControlDate: string;
  status: EmergencyEquipmentStatus;
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
  contacts: EmergencyPlanContact[];
  assemblyAreas: EmergencyAssemblyArea[];
  equipment: EmergencyEquipment[];

  evacuationSketchUrl: string;
  assemblyAreaSketchUrl: string;

  revisionHistory: EmergencyPlanRevision[];

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

/**
 * Bundan sonra yeni kayıtlarda kullanılacak standart ekip kodları.
 */

/**
 * Bundan sonra yeni kayıtlarda kullanılacak standart ekip kodları.
 */
export type StandardEmergencyTeamType =
  | "ISVEREN_VEKILI"
  | "ACIL_DURUM_KOORDINATORU"
  | "KORUMA"
  | "ARAMA_KURTARMA_TAHLIYE"
  | "YANGIN"
  | "ILK_YARDIM"
  | "HABERLESME";

/**
 * Mobil veya web tarafında daha önce kullanılmış eski ekip kodları.
 * Eski kayıtların hata vermeden okunması için korunur.
 */
export type LegacyEmergencyTeamType =
  | "ISVEREN"
  | "ARAMA_KURTARMA"
  | "ARAMA_KURTARMA_TAHLİYE"
  | "KURTARMA_TAHLIYE"
  | "TAHLIYE"
  | "TAHLİYE"
  | "YANGIN_EKIBI"
  | "YANGINLA_MUCADELE"
  | "YANGINLA_MÜCADELE"
  | "ILKYARDIM"
  | "ILK_YARDIM_EKIBI"
  | "KORUMA_EKIBI"
  | "KORUMA_EKİBİ"
  | "HABERLESME_EKIBI"
  | "HABERLEŞME"
  | "HABERLEŞME_EKİBİ";


export type EmergencyTeamType =
  | StandardEmergencyTeamType
  | LegacyEmergencyTeamType;

export type EmergencyTeamRole =
  | "EKIP_LIDERI"
  | "EKIP_UYESI"
  | "YEDEK_UYE";

export type EmergencySignatureStatus =
  | "IMZA_BEKLIYOR"
  | "IMZALANDI";

export type EmergencySupportMember = {
  id: string;
  firmId: string;

  employeeId: string | null;

  teamType: EmergencyTeamType;
  teamRole: EmergencyTeamRole;

  fullName: string;
  duty: string;
  department: string;
  phone: string;
  certificateInfo: string;

  assignedDateMillis: number;

  signatureStatus: EmergencySignatureStatus;
  isActive: boolean;

  createdAtMillis: number;
  updatedAtMillis: number;
};

export type EmergencyDrillType =
  | "YANGIN_TAHLIYE"
  | "DEPREM"
  | "KIMYASAL"
  | "GENEL_TAHLIYE"
  | "DIGER";

export type EmergencyDrillStatus =
  | "GEÇERLİ"
  | "REVIZYON_GEREKLI";

export type EmergencyDrill = {
  id: string;
  firmId: string;

  drillType: EmergencyDrillType;
  drillTitle: string;

  drillDateMillis: number;
  nextDrillDueMillis: number | null;

  participantCount: number;
  durationMinutes: number;

  result: string;
  deficiencies: string;
  correctiveActions: string;
  responsible: string;

  status: EmergencyDrillStatus;

  createdAtMillis: number;
  updatedAtMillis: number;
};

export type EmergencyBundle = {
  plans: EmergencyPlan[];
  teams: EmergencySupportMember[];
  drills: EmergencyDrill[];
};