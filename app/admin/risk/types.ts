/* =========================================================
   D-SEC ENTERPRISE
   Risk Management V2
   Shared Types
========================================================= */

export type UUID = string;

/* =========================================================
   RISK
========================================================= */

export type RiskMethod =
  | "FINE_KINNEY"
  | "MATRIX_5X5";

export type RiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "VERY_HIGH"
  | "INTOLERABLE";

export interface RiskRecord {

  id: UUID;

  firmId: UUID;

  company: string;

  department: string;

  process: string;

  activity: string;

  hazard: string;

  consequence: string;

  existingControl: string;

  proposedControl: string;

  responsible: string;

  dueDateMillis: number | null;

  completed: boolean;

  probability: number;

  frequency: number;

  severity: number;

  score: number;

  method: RiskMethod;

  level: RiskLevel;

  photoUrl: string | null;

  attachmentUrl: string | null;

  createdAtMillis: number;

  updatedAtMillis: number;

}

export interface RiskDashboardTotals {

  totalRisk: number;

  criticalRisk: number;

  intolerableRisk: number;

  highRisk: number;

  mediumRisk: number;

  lowRisk: number;

  averageScore: number;

  openDof: number;

  closedDof: number;

}

/* =========================================================
   ACTION PLAN
========================================================= */

export interface EmergencyPlan {

  id: UUID;

  firmId: UUID;

  planTitle: string;

  workplaceTitle: string;

  workplaceAddress: string;

  dangerClass: string;

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

}

/* =========================================================
   SUPPORT TEAM
========================================================= */

export interface EmergencySupportMember {

  id: UUID;

  firmId: UUID;

  employeeId: string | null;

  teamType: string;

  teamRole: string;

  fullName: string;

  duty: string;

  department: string;

  phone: string;

  certificateInfo: string;

  assignedDateMillis: number;

  signatureStatus: string;

  isActive: boolean;

  createdAtMillis: number;

}

/* =========================================================
   DRILL
========================================================= */

export interface EmergencyDrill {

  id: UUID;

  firmId: UUID;

  drillType: string;

  drillTitle: string;

  drillDateMillis: number;

  nextDrillDueMillis: number | null;

  participantCount: number;

  durationMinutes: number;

  result: string;

  deficiencies: string;

  correctiveActions: string;

  responsible: string;

  status: string;

  createdAtMillis: number;

  updatedAtMillis: number;

}

/* =========================================================
   KPI
========================================================= */

export interface EmergencyDashboard {

  totalPlans: number;

  expiredPlans: number;

  totalMembers: number;

  pendingSignatures: number;

  totalDrills: number;

  upcomingDrills: number;

}

/* =========================================================
   FILTERS
========================================================= */

export interface RiskFilters {

  company: string;

  department: string;

  level: string;

  search: string;

}

/* =========================================================
   DIALOG MODE
========================================================= */

export type DialogMode =
  | "CREATE"
  | "EDIT";