import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EmergencyEntityType = "PLAN" | "TEAM" | "DRILL";

type AdminContext = {
  allowed: boolean;
  adminRole?: string;
  companyId: string;
  companyScoped: boolean;
  readOnly: boolean;
};

type EmergencyWritePayload = {
  id?: string;
  entityType?: EmergencyEntityType;
  firmId?: string;
  companyId?: string;
  company?: string;
  localFirmId?: number | null;
  syncKey?: string;
  planNo?: string | null;
  planTitle?: string | null;
  workplaceTitle?: string | null;
  workplaceAddress?: string | null;
  dangerClass?: string | null;
  employeeCount?: number | null;
  planDateMillis?: number | null;
  validUntilMillis?: number | null;
  revisionDateMillis?: number | null;
  revisionNo?: string | null;
  assemblyArea?: string | null;
  emergencyCoordinator?: string | null;
  preparedBy?: string | null;
  approvedBy?: string | null;
  planContentJson?: string | null;
  assemblyAreaPhotoUri?: string | null;
  emergencyExitRoutePhotoUri?: string | null;
  fireEquipmentPhotoUri?: string | null;
  emergencyBoardPhotoUri?: string | null;
  fireScenario?: string | null;
  earthquakeScenario?: string | null;
  floodScenario?: string | null;
  accidentScenario?: string | null;
  evacuationScenario?: string | null;
  employeeId?: number | null;
  teamType?: string | null;
  teamRole?: string | null;
  fullName?: string | null;
  duty?: string | null;
  department?: string | null;
  phone?: string | null;
  certificateInfo?: string | null;
  assignedDateMillis?: number | null;
  signatureStatus?: string | null;
  isActive?: boolean | null;
  drillType?: string | null;
  drillTitle?: string | null;
  drillDateMillis?: number | null;
  nextDrillDueMillis?: number | null;
  participantCount?: number | null;
  durationMinutes?: number | null;
  result?: string | null;
  deficiencies?: string | null;
  correctiveActions?: string | null;
  responsible?: string | null;
  status?: string | null;
  version?: number | null;
};

type CompanyRow = {
  id: string;
  name: string | null;
};

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase ENV bulunamadı.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function cleanText(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
}

function timestampToMillis(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const millis = new Date(String(value ?? "")).getTime();
  return Number.isNaN(millis) ? Date.now() : millis;
}

function normalizeCompanyKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

function normalizeEntityType(value: unknown): EmergencyEntityType {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "TEAM") return "TEAM";
  if (normalized === "DRILL") return "DRILL";
  return "PLAN";
}

function tableForType(type: EmergencyEntityType) {
  if (type === "TEAM") return "emergency_support_teams";
  if (type === "DRILL") return "emergency_drills";
  return "emergency_action_plans";
}

async function getAdminContext(): Promise<AdminContext> {
  const cookieStore = await cookies();
  const adminAuth =
    cookieStore.get("dsec_admin_auth")?.value ||
    cookieStore.get("dsec_user_auth")?.value;
  const adminRole =
    cookieStore.get("dsec_admin_role")?.value ||
    cookieStore.get("dsec_user_role")?.value;
  const companyId = String(
    cookieStore.get("dsec_company_id")?.value || ""
  ).trim();
  return {
    allowed:
      adminAuth === "ok" &&
      (adminRole === "super_admin" ||
        adminRole === "company_admin" ||
        adminRole === "demo_user"),
    adminRole,
    companyId,
    companyScoped:
      adminRole === "company_admin" || adminRole === "demo_user",
    readOnly: adminRole === "demo_user",
  };
}

async function resolveCompanyId(
  requestedCompany: string | undefined,
  context: AdminContext
) {
  if (context.companyScoped) return context.companyId;
  const requested = String(requestedCompany || "").trim();
  if (!requested) return "";
  const supabase = getSupabase();
  const { data: directCompany } = await supabase
    .from("companies")
    .select("id")
    .eq("id", requested)
    .maybeSingle<{ id: string }>();
  if (directCompany?.id) return directCompany.id;
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id,name")
    .returns<CompanyRow[]>();
  if (error) throw new Error(error.message);
  const normalizedRequested = normalizeCompanyKey(requested);
  return (
    (companies || []).find(
      (company) => normalizeCompanyKey(company.name) === normalizedRequested
    )?.id || ""
  );
}

async function resolveLocalFirmId(
  companyId: string,
  requestedLocalFirmId?: number | null
): Promise<number | null> {
  if (
    typeof requestedLocalFirmId === "number" &&
    Number.isFinite(requestedLocalFirmId) &&
    requestedLocalFirmId > 0
  ) {
    return Math.trunc(requestedLocalFirmId);
  }
  const supabase = getSupabase();
  const candidates = [
    "emergency_action_plans",
    "emergency_support_teams",
    "emergency_drills",
    "risk_items",
    "fine_kinney_risks",
  ];
  for (const table of candidates) {
    const { data, error } = await supabase
      .from(table)
      .select("local_firm_id")
      .eq("company_id", companyId)
      .not("local_firm_id", "is", null)
      .limit(1)
      .maybeSingle<{ local_firm_id: number | null }>();
    if (error) continue;
    if (
      typeof data?.local_firm_id === "number" &&
      data.local_firm_id > 0
    ) {
      return data.local_firm_id;
    }
  }
  return null;
}

function validatePayload(
  type: EmergencyEntityType,
  payload: EmergencyWritePayload
): string {
  if (type === "PLAN") {
    if (!cleanText(payload.planTitle)) return "Plan başlığı zorunludur.";
    if (!cleanText(payload.workplaceTitle)) return "İşyeri ünvanı zorunludur.";
  }
  if (type === "TEAM") {
    if (!cleanText(payload.fullName)) return "Destek ekibi çalışan adı zorunludur.";
    if (!cleanText(payload.teamType)) return "Destek ekibi türü zorunludur.";
  }
  if (type === "DRILL") {
    if (!cleanText(payload.drillTitle)) return "Tatbikat başlığı zorunludur.";
  }
  return "";
}

function planRowToRecord(row: Record<string, any>) {
  return {
    id: String(row.id || ""),
    entityType: "PLAN" as const,
    firmId: String(row.company_id || ""),
    localFirmId: row.local_firm_id ?? null,
    syncKey: String(row.sync_key || ""),
    planNo: row.plan_no || "",
    planTitle: row.plan_title || "Acil Durum Eylem Planı",
    workplaceTitle: row.workplace_title || "",
    workplaceAddress: row.workplace_address || "",
    dangerClass: row.danger_class || "AZ_TEHLIKELI",
    employeeCount: Number(row.employee_count || 0),
    planDateMillis: Number(row.plan_date_millis || Date.now()),
    validUntilMillis: row.valid_until_millis ?? null,
    revisionDateMillis: row.revision_date_millis ?? null,
    revisionNo: row.revision_no || "R0",
    assemblyArea: row.assembly_area || "",
    emergencyCoordinator: row.emergency_coordinator || "",
    preparedBy: row.prepared_by || "",
    approvedBy: row.approved_by || "",
    planContentJson: row.plan_content_json || "",
    assemblyAreaPhotoUri: row.assembly_area_photo_uri ?? null,
    emergencyExitRoutePhotoUri: row.emergency_exit_route_photo_uri ?? null,
    fireEquipmentPhotoUri: row.fire_equipment_photo_uri ?? null,
    emergencyBoardPhotoUri: row.emergency_board_photo_uri ?? null,
    fireScenario: row.fire_scenario || "",
    earthquakeScenario: row.earthquake_scenario || "",
    floodScenario: row.flood_scenario || "",
    accidentScenario: row.accident_scenario || "",
    evacuationScenario: row.evacuation_scenario || "",
    version: Number(row.version || 1),
    source: row.source || "WEB",
    syncStatus: row.sync_status || "SYNCED",
    isDeleted: row.is_deleted === true,
    createdAtMillis: timestampToMillis(row.created_at),
    updatedAtMillis: timestampToMillis(row.updated_at),
  };
}

function teamRowToRecord(row: Record<string, any>) {
  return {
    id: String(row.id || ""),
    entityType: "TEAM" as const,
    firmId: String(row.company_id || ""),
    localFirmId: row.local_firm_id ?? null,
    syncKey: String(row.sync_key || ""),
    employeeId: row.employee_id ?? null,
    teamType: row.team_type || "YANGIN",
    teamRole: row.team_role || "EKIP_UYESI",
    fullName: row.full_name || "",
    duty: row.duty || "",
    department: row.department || "",
    phone: row.phone || "",
    certificateInfo: row.certificate_info || "",
    assignedDateMillis: Number(row.assigned_date_millis || Date.now()),
    signatureStatus: row.signature_status || "IMZA_BEKLIYOR",
    isActive: row.is_active !== false,
    version: Number(row.version || 1),
    source: row.source || "WEB",
    syncStatus: row.sync_status || "SYNCED",
    isDeleted: row.is_deleted === true,
    createdAtMillis: timestampToMillis(row.created_at),
    updatedAtMillis: timestampToMillis(row.updated_at),
  };
}

function drillRowToRecord(row: Record<string, any>) {
  return {
    id: String(row.id || ""),
    entityType: "DRILL" as const,
    firmId: String(row.company_id || ""),
    localFirmId: row.local_firm_id ?? null,
    syncKey: String(row.sync_key || ""),
    drillType: row.drill_type || "YANGIN_TAHLIYE",
    drillTitle: row.drill_title || "",
    drillDateMillis: Number(row.drill_date_millis || Date.now()),
    nextDrillDueMillis: row.next_drill_due_millis ?? null,
    participantCount: Number(row.participant_count || 0),
    durationMinutes: Number(row.duration_minutes || 0),
    result: row.result || "",
    deficiencies: row.deficiencies || "",
    correctiveActions: row.corrective_actions || "",
    responsible: row.responsible || "",
    status: row.status || "GEÇERLİ",
    version: Number(row.version || 1),
    source: row.source || "WEB",
    syncStatus: row.sync_status || "SYNCED",
    isDeleted: row.is_deleted === true,
    createdAtMillis: timestampToMillis(row.created_at),
    updatedAtMillis: timestampToMillis(row.updated_at),
  };
}

function recordMapper(type: EmergencyEntityType) {
  if (type === "TEAM") return teamRowToRecord;
  if (type === "DRILL") return drillRowToRecord;
  return planRowToRecord;
}

function buildInsertPayload(
  type: EmergencyEntityType,
  payload: EmergencyWritePayload,
  companyId: string,
  localFirmId: number,
  syncKey: string,
  nowIso: string
) {
  const base = {
    sync_key: syncKey,
    company_id: companyId,
    local_firm_id: localFirmId,
    version: Math.max(1, Number(payload.version || 1)),
    source: "WEB",
    sync_status: "SYNCED",
    sync_error: null,
    is_deleted: false,
    deleted_at: null,
    created_at: nowIso,
    updated_at: nowIso,
    last_synced_at: nowIso,
  };
  if (type === "TEAM") {
    return {
      ...base,
      employee_id: numberOrNull(payload.employeeId),
      team_type: cleanText(payload.teamType) || "YANGIN",
      team_role: cleanText(payload.teamRole) || "EKIP_UYESI",
      full_name: cleanText(payload.fullName) || "",
      duty: cleanText(payload.duty) || "",
      department: cleanText(payload.department) || "",
      phone: cleanText(payload.phone) || "",
      certificate_info: cleanText(payload.certificateInfo) || "",
      assigned_date_millis: numberOrNull(payload.assignedDateMillis) || Date.now(),
      signature_status: cleanText(payload.signatureStatus) || "IMZA_BEKLIYOR",
      is_active: payload.isActive !== false,
    };
  }
  if (type === "DRILL") {
    return {
      ...base,
      drill_type: cleanText(payload.drillType) || "YANGIN_TAHLIYE",
      drill_title: cleanText(payload.drillTitle) || "",
      drill_date_millis: numberOrNull(payload.drillDateMillis) || Date.now(),
      next_drill_due_millis: numberOrNull(payload.nextDrillDueMillis),
      participant_count: Math.max(0, Number(payload.participantCount || 0)),
      duration_minutes: Math.max(0, Number(payload.durationMinutes || 0)),
      result: cleanText(payload.result) || "",
      deficiencies: cleanText(payload.deficiencies) || "",
      corrective_actions: cleanText(payload.correctiveActions) || "",
      responsible: cleanText(payload.responsible) || "",
      status: cleanText(payload.status) || "GEÇERLİ",
    };
  }
  return {
    ...base,
    plan_no: cleanText(payload.planNo) || "",
    plan_title: cleanText(payload.planTitle) || "Acil Durum Eylem Planı",
    workplace_title: cleanText(payload.workplaceTitle) || "",
    workplace_address: cleanText(payload.workplaceAddress) || "",
    danger_class: cleanText(payload.dangerClass) || "AZ_TEHLIKELI",
    employee_count: Math.max(0, Number(payload.employeeCount || 0)),
    plan_date_millis: numberOrNull(payload.planDateMillis) || Date.now(),
    valid_until_millis: numberOrNull(payload.validUntilMillis),
    revision_date_millis: numberOrNull(payload.revisionDateMillis),
    revision_no: cleanText(payload.revisionNo) || "R0",
    assembly_area: cleanText(payload.assemblyArea) || "",
    emergency_coordinator: cleanText(payload.emergencyCoordinator) || "",
    prepared_by: cleanText(payload.preparedBy) || "",
    approved_by: cleanText(payload.approvedBy) || "",
    plan_content_json: cleanText(payload.planContentJson) || "",
    assembly_area_photo_uri: cleanText(payload.assemblyAreaPhotoUri),
    emergency_exit_route_photo_uri: cleanText(payload.emergencyExitRoutePhotoUri),
    fire_equipment_photo_uri: cleanText(payload.fireEquipmentPhotoUri),
    emergency_board_photo_uri: cleanText(payload.emergencyBoardPhotoUri),
    fire_scenario: cleanText(payload.fireScenario) || "",
    earthquake_scenario: cleanText(payload.earthquakeScenario) || "",
    flood_scenario: cleanText(payload.floodScenario) || "",
    accident_scenario: cleanText(payload.accidentScenario) || "",
    evacuation_scenario: cleanText(payload.evacuationScenario) || "",
  };
}

function buildUpdatePayload(
  type: EmergencyEntityType,
  payload: EmergencyWritePayload,
  currentVersion: number
) {
  const nowIso = new Date().toISOString();
  const common = {
    version: Math.max(currentVersion + 1, Number(payload.version || 1)),
    source: "WEB",
    sync_status: "SYNCED",
    sync_error: null,
    updated_at: nowIso,
    last_synced_at: nowIso,
  };
  if (type === "TEAM") {
    return {
      ...common,
      employee_id: numberOrNull(payload.employeeId),
      team_type: cleanText(payload.teamType) || "YANGIN",
      team_role: cleanText(payload.teamRole) || "EKIP_UYESI",
      full_name: cleanText(payload.fullName) || "",
      duty: cleanText(payload.duty) || "",
      department: cleanText(payload.department) || "",
      phone: cleanText(payload.phone) || "",
      certificate_info: cleanText(payload.certificateInfo) || "",
      assigned_date_millis: numberOrNull(payload.assignedDateMillis) || Date.now(),
      signature_status: cleanText(payload.signatureStatus) || "IMZA_BEKLIYOR",
      is_active: payload.isActive !== false,
    };
  }
  if (type === "DRILL") {
    return {
      ...common,
      drill_type: cleanText(payload.drillType) || "YANGIN_TAHLIYE",
      drill_title: cleanText(payload.drillTitle) || "",
      drill_date_millis: numberOrNull(payload.drillDateMillis) || Date.now(),
      next_drill_due_millis: numberOrNull(payload.nextDrillDueMillis),
      participant_count: Math.max(0, Number(payload.participantCount || 0)),
      duration_minutes: Math.max(0, Number(payload.durationMinutes || 0)),
      result: cleanText(payload.result) || "",
      deficiencies: cleanText(payload.deficiencies) || "",
      corrective_actions: cleanText(payload.correctiveActions) || "",
      responsible: cleanText(payload.responsible) || "",
      status: cleanText(payload.status) || "GEÇERLİ",
    };
  }
  return {
    ...common,
    plan_no: cleanText(payload.planNo) || "",
    plan_title: cleanText(payload.planTitle) || "Acil Durum Eylem Planı",
    workplace_title: cleanText(payload.workplaceTitle) || "",
    workplace_address: cleanText(payload.workplaceAddress) || "",
    danger_class: cleanText(payload.dangerClass) || "AZ_TEHLIKELI",
    employee_count: Math.max(0, Number(payload.employeeCount || 0)),
    plan_date_millis: numberOrNull(payload.planDateMillis) || Date.now(),
    valid_until_millis: numberOrNull(payload.validUntilMillis),
    revision_date_millis: numberOrNull(payload.revisionDateMillis),
    revision_no: cleanText(payload.revisionNo) || "R0",
    assembly_area: cleanText(payload.assemblyArea) || "",
    emergency_coordinator: cleanText(payload.emergencyCoordinator) || "",
    prepared_by: cleanText(payload.preparedBy) || "",
    approved_by: cleanText(payload.approvedBy) || "",
    plan_content_json: cleanText(payload.planContentJson) || "",
    assembly_area_photo_uri: cleanText(payload.assemblyAreaPhotoUri),
    emergency_exit_route_photo_uri: cleanText(payload.emergencyExitRoutePhotoUri),
    fire_equipment_photo_uri: cleanText(payload.fireEquipmentPhotoUri),
    emergency_board_photo_uri: cleanText(payload.emergencyBoardPhotoUri),
    fire_scenario: cleanText(payload.fireScenario) || "",
    earthquake_scenario: cleanText(payload.earthquakeScenario) || "",
    flood_scenario: cleanText(payload.floodScenario) || "",
    accident_scenario: cleanText(payload.accidentScenario) || "",
    evacuation_scenario: cleanText(payload.evacuationScenario) || "",
  };
}

export async function GET(request: Request) {
  try {
    const ctx = await getAdminContext();
    if (!ctx.allowed) {
      return NextResponse.json({ success: false, message: "Yetkisiz erişim." }, { status: 401 });
    }
    const url = new URL(request.url);
    const requestedFirm = String(
      url.searchParams.get("firmId") || url.searchParams.get("companyId") || ""
    ).trim();
    const requestedType = String(url.searchParams.get("entityType") || "")
      .trim()
      .toUpperCase();
    const selectedCompany = ctx.companyScoped ? ctx.companyId : requestedFirm;
    const supabase = getSupabase();
   const loadTable = async (
    type: EmergencyEntityType
): Promise<any[]> => {

    let query = supabase
        .from(tableForType(type))
        .select("*")
        .eq("is_deleted", false)
        .order("updated_at", {
            ascending: false,
        });

    if (selectedCompany) {
        query = query.eq("company_id", selectedCompany);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    const mapper = recordMapper(type);

    return (data ?? []).map((row) => mapper(row));
};
    let plans: ReturnType<typeof planRowToRecord>[] = [];
    let teams: ReturnType<typeof teamRowToRecord>[] = [];
    let drills: ReturnType<typeof drillRowToRecord>[] = [];
    if (!requestedType || requestedType === "PLAN") plans = await loadTable("PLAN");
    if (!requestedType || requestedType === "TEAM") teams = await loadTable("TEAM");
    if (!requestedType || requestedType === "DRILL") drills = await loadTable("DRILL");
    return NextResponse.json({
      success: true,
      plans,
      teams,
      drills,
      records: [...plans, ...teams, ...drills],
      summary: {
        planCount: plans.length,
        teamCount: teams.length,
        drillCount: drills.length,
        totalCount: plans.length + teams.length + drills.length,
      },
    });
  } catch (error) {
    console.error("emergency GET error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Acil durum kayıtları okunamadı.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getAdminContext();
    if (!ctx.allowed) {
      return NextResponse.json({ success: false, message: "Yetkisiz erişim." }, { status: 401 });
    }
    if (ctx.readOnly) {
      return NextResponse.json(
        { success: false, message: "Demo kullanıcısı acil durum kaydı oluşturamaz." },
        { status: 403 }
      );
    }
    const payload: EmergencyWritePayload = await request.json().catch(() => ({}));
    const entityType = normalizeEntityType(payload.entityType);
    const validationError = validatePayload(entityType, payload);
    if (validationError) {
      return NextResponse.json({ success: false, message: validationError }, { status: 400 });
    }
    const companyId = await resolveCompanyId(
      payload.firmId || payload.companyId || payload.company,
      ctx
    );
    if (!companyId) {
      return NextResponse.json({ success: false, message: "Firma seçilmelidir." }, { status: 400 });
    }
    const localFirmId = await resolveLocalFirmId(companyId, payload.localFirmId);
    if (!localFirmId) {
      return NextResponse.json(
        { success: false, message: "Firmanın mobil uygulama ID eşlemesi bulunamadı." },
        { status: 400 }
      );
    }
    const nowIso = new Date().toISOString();
    const syncKey = String(payload.syncKey || "").trim() || crypto.randomUUID();
    const supabase = getSupabase();
    const table = tableForType(entityType);
    const { data, error } = await supabase
      .from(table)
      .insert(buildInsertPayload(entityType, payload, companyId, localFirmId, syncKey, nowIso))
      .select("*")
      .single();
    if (error || !data) {
      return NextResponse.json(
        { success: false, message: "Acil durum kaydı oluşturulamadı.", detail: error?.message },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      entityType,
      record: recordMapper(entityType)(data),
      message: "Acil durum kaydı oluşturuldu.",
    });
  } catch (error) {
    console.error("emergency POST error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Acil durum kaydı oluşturulurken sunucu hatası oluştu.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await getAdminContext();
    if (!ctx.allowed) {
      return NextResponse.json({ success: false, message: "Yetkisiz erişim." }, { status: 401 });
    }
    if (ctx.readOnly) {
      return NextResponse.json(
        { success: false, message: "Demo kullanıcısı acil durum kaydı düzenleyemez." },
        { status: 403 }
      );
    }
    const payload: EmergencyWritePayload = await request.json().catch(() => ({}));
    const id = String(payload.id || "").trim();
    if (!id) {
      return NextResponse.json({ success: false, message: "Kayıt ID zorunludur." }, { status: 400 });
    }
    const entityType = normalizeEntityType(payload.entityType);
    const validationError = validatePayload(entityType, payload);
    if (validationError) {
      return NextResponse.json({ success: false, message: validationError }, { status: 400 });
    }
    const supabase = getSupabase();
    const table = tableForType(entityType);
    let currentQuery = supabase
      .from(table)
      .select("id,company_id,version")
      .eq("id", id)
      .eq("is_deleted", false);
    if (ctx.companyScoped) currentQuery = currentQuery.eq("company_id", ctx.companyId);
    const { data: current, error: currentError } = await currentQuery.maybeSingle<{
      id: string;
      company_id: string;
      version: number;
    }>();
    if (currentError) {
      return NextResponse.json(
        { success: false, message: "Acil durum kaydı okunamadı.", detail: currentError.message },
        { status: 500 }
      );
    }
    if (!current) {
      return NextResponse.json({ success: false, message: "Acil durum kaydı bulunamadı." }, { status: 404 });
    }
    const { data, error } = await supabase
      .from(table)
      .update(buildUpdatePayload(entityType, payload, Number(current.version || 1)))
      .eq("id", id)
      .eq("company_id", current.company_id)
      .eq("is_deleted", false)
      .select("*")
      .maybeSingle();
    if (error) {
      return NextResponse.json(
        { success: false, message: "Acil durum kaydı güncellenemedi.", detail: error.message },
        { status: 500 }
      );
    }
    if (!data) {
      return NextResponse.json({ success: false, message: "Acil durum kaydı bulunamadı." }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      entityType,
      record: recordMapper(entityType)(data),
      message: "Acil durum kaydı güncellendi.",
    });
  } catch (error) {
    console.error("emergency PATCH error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Acil durum kaydı güncellenirken sunucu hatası oluştu.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await getAdminContext();
    if (!ctx.allowed) {
      return NextResponse.json({ success: false, message: "Yetkisiz erişim." }, { status: 401 });
    }
    if (ctx.readOnly) {
      return NextResponse.json(
        { success: false, message: "Demo kullanıcısı acil durum kaydı silemez." },
        { status: 403 }
      );
    }
    const url = new URL(request.url);
    const id = String(url.searchParams.get("id") || "").trim();
    const entityType = normalizeEntityType(url.searchParams.get("entityType"));
    if (!id) {
      return NextResponse.json({ success: false, message: "Kayıt ID zorunludur." }, { status: 400 });
    }
    const table = tableForType(entityType);
    const nowIso = new Date().toISOString();
    const supabase = getSupabase();
    let query = supabase
      .from(table)
      .update({
        is_deleted: true,
        deleted_at: nowIso,
        source: "WEB",
        sync_status: "SYNCED",
        sync_error: null,
        updated_at: nowIso,
        last_synced_at: nowIso,
      })
      .eq("id", id)
      .eq("is_deleted", false);
    if (ctx.companyScoped) query = query.eq("company_id", ctx.companyId);
    const { data, error } = await query.select("id").maybeSingle<{ id: string }>();
    if (error) {
      return NextResponse.json(
        { success: false, message: "Acil durum kaydı silinemedi.", detail: error.message },
        { status: 500 }
      );
    }
    if (!data) {
      return NextResponse.json({ success: false, message: "Acil durum kaydı bulunamadı." }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      id,
      entityType,
      message: "Acil durum kaydı silindi.",
    });
  } catch (error) {
    console.error("emergency DELETE error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Acil durum kaydı silinirken sunucu hatası oluştu.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}