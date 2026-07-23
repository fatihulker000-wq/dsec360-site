import type {
  EmergencyDrill,
  EmergencyPlan,
  EmergencySupportMember,
} from "./types";

function toMillis(
  value: unknown,
  fallback: number | null = null
) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = new Date(String(value)).getTime();
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function mapPlan(
  row: Record<string, unknown>
): EmergencyPlan {
  return {
    id: String(row.id || ""),
    firmId: String(row.firm_id || ""),
    planNo: String(row.plan_no || ""),
    planContent:
      row.plan_content && typeof row.plan_content === "object"
        ? (row.plan_content as EmergencyPlan["planContent"])
        : undefined,
    planTitle: String(row.plan_title || "Acil Durum Eylem Planı"),
    workplaceTitle: String(row.workplace_title || ""),
    workplaceAddress: String(row.workplace_address || ""),
    dangerClass: String(
      row.danger_class || "AZ_TEHLIKELI"
    ) as EmergencyPlan["dangerClass"],
    employeeCount: Number(row.employee_count || 0),
    planDateMillis: toMillis(row.plan_date_millis, Date.now())!,
    validUntilMillis: toMillis(row.valid_until_millis),
    revisionDateMillis: toMillis(row.revision_date_millis),
    revisionNo: String(row.revision_no || "R0"),
    assemblyArea: String(row.assembly_area || ""),
    emergencyCoordinator: String(row.emergency_coordinator || ""),
    preparedBy: String(row.prepared_by || ""),
    approvedBy: String(row.approved_by || ""),
   
    assemblyAreaPhotoUri: row.assembly_area_photo_uri
      ? String(row.assembly_area_photo_uri)
      : null,
    emergencyExitRoutePhotoUri: row.emergency_exit_route_photo_uri
      ? String(row.emergency_exit_route_photo_uri)
      : null,
    fireEquipmentPhotoUri: row.fire_equipment_photo_uri
      ? String(row.fire_equipment_photo_uri)
      : null,
    emergencyBoardPhotoUri: row.emergency_board_photo_uri
      ? String(row.emergency_board_photo_uri)
      : null,
    fireScenario: String(row.fire_scenario || ""),
    earthquakeScenario: String(row.earthquake_scenario || ""),
    floodScenario: String(row.flood_scenario || ""),
    accidentScenario: String(row.accident_scenario || ""),
    evacuationScenario: String(row.evacuation_scenario || ""),
    createdAtMillis: toMillis(row.created_at, Date.now())!,
    updatedAtMillis: toMillis(row.updated_at, Date.now())!,
  };
}

export function mapTeam(
  row: Record<string, unknown>
): EmergencySupportMember {
  return {
    id: String(row.id || ""),
    firmId: String(row.firm_id || ""),
    employeeId: row.employee_id ? String(row.employee_id) : null,
    teamType: String(
      row.team_type || "YANGIN"
    ) as EmergencySupportMember["teamType"],
    teamRole: String(
      row.team_role || "EKIP_UYESI"
    ) as EmergencySupportMember["teamRole"],
    fullName: String(row.full_name || ""),
    duty: String(row.duty || ""),
    department: String(row.department || ""),
    phone: String(row.phone || ""),
    certificateInfo: String(row.certificate_info || ""),
    assignedDateMillis: toMillis(
      row.assigned_date_millis,
      Date.now()
    )!,
    signatureStatus: String(
      row.signature_status || "IMZA_BEKLIYOR"
    ) as EmergencySupportMember["signatureStatus"],
    isActive: row.is_active !== false,
    createdAtMillis: toMillis(row.created_at, Date.now())!,
    updatedAtMillis: toMillis(row.updated_at, Date.now())!,
  };
}

export function mapDrill(
  row: Record<string, unknown>
): EmergencyDrill {
  return {
    id: String(row.id || ""),
    firmId: String(row.firm_id || ""),
    drillType: String(
      row.drill_type || "YANGIN_TAHLIYE"
    ) as EmergencyDrill["drillType"],
    drillTitle: String(row.drill_title || ""),
    drillDateMillis: toMillis(row.drill_date_millis, Date.now())!,
    nextDrillDueMillis: toMillis(row.next_drill_due_millis),
    participantCount: Number(row.participant_count || 0),
    durationMinutes: Number(row.duration_minutes || 0),
    result: String(row.result || ""),
    deficiencies: String(row.deficiencies || ""),
    correctiveActions: String(row.corrective_actions || ""),
    responsible: String(row.responsible || ""),
    status: String(
      row.status || "GEÇERLİ"
    ) as EmergencyDrill["status"],
    createdAtMillis: toMillis(row.created_at, Date.now())!,
    updatedAtMillis: toMillis(row.updated_at, Date.now())!,
  };
}

export function planToRow(
  record: Record<string, unknown>
) {
  return {
    firm_id: String(record.firmId || ""),
    plan_no: String(record.planNo || ""),
    plan_content:
      record.planContent && typeof record.planContent === "object"
        ? record.planContent
        : null,
    plan_title: String(
      record.planTitle || "Acil Durum Eylem Planı"
    ),
    workplace_title: String(record.workplaceTitle || ""),
    workplace_address: String(record.workplaceAddress || ""),
    danger_class: String(record.dangerClass || "AZ_TEHLIKELI"),
    employee_count: Number(record.employeeCount || 0),
    plan_date_millis: Number(record.planDateMillis || Date.now()),
    valid_until_millis:
      record.validUntilMillis === null ||
      record.validUntilMillis === undefined
        ? null
        : Number(record.validUntilMillis),
    revision_date_millis:
      record.revisionDateMillis === null ||
      record.revisionDateMillis === undefined
        ? null
        : Number(record.revisionDateMillis),
    revision_no: String(record.revisionNo || "R0"),
    assembly_area: String(record.assemblyArea || ""),
    emergency_coordinator: String(record.emergencyCoordinator || ""),
    prepared_by: String(record.preparedBy || ""),
    approved_by: String(record.approvedBy || ""),
    
    assembly_area_photo_uri: record.assemblyAreaPhotoUri || null,
    emergency_exit_route_photo_uri:
      record.emergencyExitRoutePhotoUri || null,
    fire_equipment_photo_uri: record.fireEquipmentPhotoUri || null,
    emergency_board_photo_uri: record.emergencyBoardPhotoUri || null,
    fire_scenario: String(record.fireScenario || ""),
    earthquake_scenario: String(record.earthquakeScenario || ""),
    flood_scenario: String(record.floodScenario || ""),
    accident_scenario: String(record.accidentScenario || ""),
    evacuation_scenario: String(record.evacuationScenario || ""),
    updated_at: new Date().toISOString(),
  };
}

export function teamToRow(
  record: Record<string, unknown>
) {
  return {
    firm_id: String(record.firmId || ""),
    employee_id: record.employeeId || null,
    team_type: String(record.teamType || "YANGIN"),
    team_role: String(record.teamRole || "EKIP_UYESI"),
    full_name: String(record.fullName || ""),
    duty: String(record.duty || ""),
    department: String(record.department || ""),
    phone: String(record.phone || ""),
    certificate_info: String(record.certificateInfo || ""),
    assigned_date_millis: Number(
      record.assignedDateMillis || Date.now()
    ),
    signature_status: String(
      record.signatureStatus || "IMZA_BEKLIYOR"
    ),
    is_active: record.isActive !== false,
    updated_at: new Date().toISOString(),
  };
}

export function drillToRow(
  record: Record<string, unknown>
) {
  return {
    firm_id: String(record.firmId || ""),
    drill_type: String(record.drillType || "YANGIN_TAHLIYE"),
    drill_title: String(record.drillTitle || ""),
    drill_date_millis: Number(record.drillDateMillis || Date.now()),
    next_drill_due_millis:
      record.nextDrillDueMillis === null ||
      record.nextDrillDueMillis === undefined
        ? null
        : Number(record.nextDrillDueMillis),
    participant_count: Number(record.participantCount || 0),
    duration_minutes: Number(record.durationMinutes || 0),
    result: String(record.result || ""),
    deficiencies: String(record.deficiencies || ""),
    corrective_actions: String(record.correctiveActions || ""),
    responsible: String(record.responsible || ""),
    status: String(record.status || "GEÇERLİ"),
    updated_at: new Date().toISOString(),
  };
}
