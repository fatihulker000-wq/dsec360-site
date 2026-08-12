import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MOBILE_API_KEY =
  process.env.DORA_MOBILE_API_KEY || "dsec_mobile_123";

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function numberValue(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function boolValue(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const v = text(value).toLowerCase();
  if (["true", "1", "yes", "evet"].includes(v)) return true;
  if (["false", "0", "no", "hayir", "hayır"].includes(v)) return false;
  return fallback;
}

function arrayOf(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object"
      )
    : [];
}

function normalize(value: unknown): string {
  return text(value)
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

function authorized(req: NextRequest): boolean {
  return req.headers.get("x-api-key") === MOBILE_API_KEY;
}

function trDateToday(): string {
  return new Date().toLocaleDateString("tr-TR");
}

function participantKey(value: Record<string, unknown>): string {
  const tc = text(value.tcNo ?? value.tc_no ?? value.employeeTc ?? value.employee_tc);
  if (tc) return `TC:${tc}`;
  return `NAME:${normalize(value.fullName ?? value.full_name ?? value.employeeName ?? value.employee_name)}`;
}

function certificateKey(value: Record<string, unknown>): string {
  return [
    text(value.trainingId ?? value.training_id),
    text(value.employeeTc ?? value.employee_tc ?? value.tcNo ?? value.tc_no),
    normalize(value.employeeName ?? value.employee_name ?? value.fullName ?? value.full_name),
  ].join("|");
}

function certificateNo(
  trainingId: string,
  participant: Record<string, unknown>,
  index: number
): string {
  const seed = [
    trainingId,
    text(participant.tcNo ?? participant.tc_no),
    normalize(participant.fullName ?? participant.full_name),
  ].join("|");

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }

  const suffix = String(Math.abs(hash) % 1000000).padStart(6, "0");
  return `DORA-${new Date().getFullYear()}-${suffix}-${String(index + 1).padStart(2, "0")}`;
}

function autoCertificates(
  trainingsPayload: unknown,
  certificatesPayload: unknown
) {
  const trainingRoot =
    trainingsPayload && typeof trainingsPayload === "object"
      ? (trainingsPayload as Record<string, unknown>)
      : {};

  const certificateRoot =
    certificatesPayload && typeof certificatesPayload === "object"
      ? (certificatesPayload as Record<string, unknown>)
      : {};

  const trainings = arrayOf(trainingRoot.items);
  const current = arrayOf(certificateRoot.items);
  const byKey = new Map(current.map((row) => [certificateKey(row), row] as const));

  for (const training of trainings) {
    const status = text(training.status).toUpperCase();
    if (status !== "TAMAMLANDI") continue;

    const trainingId = text(training.id);
    if (!trainingId) continue;

    const participants = arrayOf(training.participants);

    participants.forEach((participant, index) => {
      const employeeName = text(
        participant.fullName ??
          participant.full_name ??
          participant.employeeName ??
          participant.employee_name
      );
      if (!employeeName) return;

      const employeeTc = text(
        participant.tcNo ??
          participant.tc_no ??
          participant.employeeTc ??
          participant.employee_tc
      );

      const key = [
        trainingId,
        employeeTc,
        normalize(employeeName),
      ].join("|");

      if (byKey.has(key)) return;

      const record = {
        id: crypto.randomUUID(),
        certificateNo: certificateNo(trainingId, participant, index),
        employeeName,
        employeeTc,
        employeePosition: text(
          participant.jobTitle ??
            participant.position ??
            participant.employeePosition
        ),
        trainingId,
        trainingTitle: text(training.title ?? training.trainingName) || "İSG Eğitimi",
        trainingType: text(training.trainingType ?? training.training_type),
        trainingDate: text(training.trainingDate ?? training.training_date),
        issueDate: trDateToday(),
        validUntil: text(training.validUntil ?? training.valid_until),
        trainerName: text(training.trainerName ?? training.trainer_name),
        trainingHours: text(training.trainingHours ?? training.training_hours),
        status: "GECERLI",
        note: "Eğitim tamamlandığı için DORA tarafından otomatik oluşturuldu.",
        autoGenerated: true,
        generatedAtMillis: Date.now(),
      };

      current.push(record);
      byKey.set(key, record);
    });
  }

  return {
    items: current,
    count: current.length,
    updatedAtMillis: Date.now(),
  };
}

async function getSnapshot(firmId: string) {
  const [
    firmResult,
    employeeResult,
    riskResult,
    documentResult,
    riskTeamResult,
    stateResult,
  ] = await Promise.all([
      supabase
        .from("dora_firms")
        .select("*")
        .eq("id", firmId)
        .eq("is_deleted", false)
        .maybeSingle(),
      supabase
        .from("dora_employees")
        .select("*")
        .eq("firm_id", firmId)
        .eq("is_deleted", false)
        .order("full_name", { ascending: true }),
      supabase
        .from("dora_risks")
        .select("*")
        .eq("firm_id", firmId)
        .eq("is_deleted", false)
        .order("updated_at_millis", { ascending: false }),
      supabase
        .from("dora_documents")
        .select("*")
        .eq("firm_id", firmId)
        .eq("is_deleted", false)
        .order("updated_at_millis", { ascending: false }),
      supabase
        .from("dora_risk_team_members")
        .select("*")
        .eq("firm_id", firmId)
        .eq("is_deleted", false)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at_millis", { ascending: true }),
      supabase
        .from("dora_module_state")
        .select("module_key,payload,updated_at_millis")
        .eq("firm_id", firmId),
    ]);

  if (firmResult.error) throw firmResult.error;
  if (!firmResult.data) throw new Error("DORA firması bulunamadı.");
  if (employeeResult.error) throw employeeResult.error;
  if (riskResult.error) throw riskResult.error;
  if (documentResult.error) throw documentResult.error;
  if (riskTeamResult.error) throw riskTeamResult.error;
  if (stateResult.error) throw stateResult.error;

  const state = new Map<string, unknown>();
  for (const row of stateResult.data ?? []) {
    state.set(text(row.module_key).toUpperCase(), row.payload ?? {});
  }

  const trainings = state.get("TRAINING") ?? { items: [] };
  const currentCertificates = state.get("CERTIFICATE") ?? { items: [] };
  const certificates = autoCertificates(trainings, currentCertificates);

  const previousCount = arrayOf(
    currentCertificates && typeof currentCertificates === "object"
      ? (currentCertificates as Record<string, unknown>).items
      : []
  ).length;

  if (certificates.count !== previousCount) {
    await upsertState(firmId, "CERTIFICATE", certificates, "DORA_AUTO");
  }

  return {
    success: true,
    firm: firmResult.data,
    employees: employeeResult.data ?? [],
    risks: riskResult.data ?? [],
    documents: documentResult.data ?? [],
    riskTeam: riskTeamResult.data ?? [],
    authorities: state.get("AUTHORITIES") ?? {},
    trainings,
    certificates,
    expert: state.get("EXPERT") ?? {},
    corporate: state.get("CORPORATE") ?? {},
    updatedAtMillis: Date.now(),
  };
}

async function upsertState(
  firmId: string,
  moduleKey: string,
  payload: unknown,
  source = "APP"
) {
  const now = Date.now();
  const { error } = await supabase.from("dora_module_state").upsert(
    {
      firm_id: firmId,
      module_key: moduleKey,
      payload: payload ?? {},
      source,
      updated_at_millis: now,
    },
    { onConflict: "firm_id,module_key" }
  );
  if (error) throw error;
}

async function mergeEmployees(
  firmId: string,
  appFirmLocalId: number | null,
  incoming: Record<string, unknown>[]
) {
  if (!incoming.length) return;

  const { data: existing, error } = await supabase
    .from("dora_employees")
    .select("*")
    .eq("firm_id", firmId)
    .eq("is_deleted", false);
  if (error) throw error;

  const rows = existing ?? [];
  const byTc = new Map(
    rows
      .filter((r) => text(r.tc_no))
      .map((r) => [text(r.tc_no), r] as const)
  );
  const byNameJob = new Map(
    rows.map(
      (r) =>
        [
          `${normalize(r.full_name)}|${normalize(r.position)}`,
          r,
        ] as const
    )
  );

  for (const item of incoming) {
    const fullName = text(item.fullName ?? item.full_name);
    if (!fullName) continue;
    const tcNo = text(item.tcNo ?? item.tc_no);
    const position = text(item.jobTitle ?? item.position);
    const match =
      (tcNo ? byTc.get(tcNo) : undefined) ??
      byNameJob.get(`${normalize(fullName)}|${normalize(position)}`);

    const record = {
      firm_id: firmId,
      app_firm_local_id: appFirmLocalId,
      full_name: fullName,
      tc_no: tcNo,
      position,
      department: text(item.department),
      phone: text(item.phone),
      email: text(item.email),
      special_group: text(item.specialGroup ?? item.special_group),
      is_active: boolValue(item.isActive ?? item.is_active, true),
      note: text(item.note),
      is_employee_representative: boolValue(
        item.isEmployeeRepresentative ?? item.is_employee_representative
      ),
      is_chief_representative: boolValue(
        item.isChiefRepresentative ?? item.is_chief_representative
      ),
      is_fire_team: boolValue(item.isFireTeam ?? item.is_fire_team),
      is_search_rescue_team: boolValue(
        item.isSearchRescueTeam ?? item.is_search_rescue_team
      ),
      is_protection_team: boolValue(
        item.isProtectionTeam ?? item.is_protection_team
      ),
      is_first_aid_team: boolValue(
        item.isFirstAidTeam ?? item.is_first_aid_team
      ),
      is_risk_assessment_team: boolValue(
        item.isRiskAssessmentTeam ?? item.is_risk_assessment_team
      ),
      is_isg_board_member: boolValue(
        item.isIsgBoardMember ?? item.is_isg_board_member
      ),
      source: "APP",
      updated_at_millis: Date.now(),
    };

    if (match?.id) {
      const { error: updateError } = await supabase
        .from("dora_employees")
        .update(record)
        .eq("id", match.id);
      if (updateError) throw updateError;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("dora_employees")
        .insert({
          ...record,
          sync_key: crypto.randomUUID(),
          is_deleted: false,
          created_at_millis: Date.now(),
        })
        .select("*")
        .single();
      if (insertError) throw insertError;
      if (tcNo) byTc.set(tcNo, inserted);
      byNameJob.set(`${normalize(fullName)}|${normalize(position)}`, inserted);
    }
  }
}

async function mergeRisks(
  firmId: string,
  appFirmLocalId: number | null,
  incoming: Record<string, unknown>[]
) {
  if (!incoming.length) return;

  const { data: existing, error } = await supabase
    .from("dora_risks")
    .select("*")
    .eq("firm_id", firmId)
    .eq("is_deleted", false);
  if (error) throw error;

  const rows = existing ?? [];
  const keyOf = (r: Record<string, unknown>) =>
    [
      normalize(r.activity),
      normalize(r.hazard),
      normalize(r.risk_description ?? r.risk ?? r.consequence),
    ].join("|");
  const byKey = new Map(rows.map((r) => [keyOf(r), r] as const));

  for (const item of incoming) {
    const activity = text(item.activity);
    const hazard = text(item.hazard);
    const riskDescription = text(
      item.risk ?? item.riskDescription ?? item.risk_description
    );
    if (!activity && !hazard && !riskDescription) continue;

    const probability = Math.max(
      1,
      numberValue(item.probability ?? item.fkProbability ?? item.fk_probability, 1)
    );
    const frequency = Math.max(
      1,
      numberValue(item.frequency ?? item.fkFrequency ?? item.fk_frequency, 1)
    );
    const severity = Math.max(
      1,
      numberValue(item.severity ?? item.fkSeverity ?? item.fk_severity, 1)
    );
    const score = probability * frequency * severity;

    const key = [normalize(activity), normalize(hazard), normalize(riskDescription)].join(
      "|"
    );
    const match = byKey.get(key);

    const record = {
      firm_id: firmId,
      app_firm_local_id: appFirmLocalId,
      title: text(item.title) || activity || hazard || "DORA Risk",
      activity,
      hazard,
      risk_description: riskDescription,
      consequence: text(item.consequence) || riskDescription,
      existing_controls: text(
        item.currentMeasure ?? item.existingControls ?? item.existing_controls
      ),
      fk_probability: probability,
      fk_frequency: frequency,
      fk_severity: severity,
      corrective_action: text(
        item.action ?? item.correctiveAction ?? item.corrective_action
      ),
      responsible_person: text(
        item.responsible ?? item.responsiblePerson ?? item.responsible_person
      ),
      action_status: text(item.actionStatus ?? item.action_status) || "ACIK",
      note: text(item.note),
      source: "APP",
      updated_at_millis: Date.now(),
    };

    if (match?.id) {
      const { error: updateError } = await supabase
        .from("dora_risks")
        .update(record)
        .eq("id", match.id);
      if (updateError) throw updateError;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("dora_risks")
        .insert({
          ...record,
          sync_key: crypto.randomUUID(),
          is_deleted: false,
          created_at_millis: Date.now(),
        })
        .select("*")
        .single();
      if (insertError) throw insertError;
      byKey.set(key, inserted);
    }
  }
}

async function mergeCustomDocuments(
  firmId: string,
  appFirmLocalId: number | null,
  incoming: Record<string, unknown>[]
) {
  if (!incoming.length) return;

  const { data: existing, error } = await supabase
    .from("dora_documents")
    .select("*")
    .eq("firm_id", firmId)
    .eq("is_deleted", false);
  if (error) throw error;

  const byTitle = new Map(
    (existing ?? []).map((r) => [normalize(r.title), r] as const)
  );

  for (const item of incoming) {
    const title = text(item.title);
    if (!title) continue;
    const match = byTitle.get(normalize(title));
    const content = {
      category: text(item.category) || "Özel Doküman",
      priority: text(item.priority) || "PROFESYONEL",
      purpose: text(item.purpose),
      scope: text(item.scope),
      legalBasis: text(item.legalBasis ?? item.legal_basis),
      applicationRules: text(item.applicationRules ?? item.application_rules),
      responsibilities: text(item.responsibilities),
      formsAndRecords: text(item.formsAndRecords ?? item.forms_and_records),
      source: "APP",
    };
    const record = {
      firm_id: firmId,
      app_firm_local_id: appFirmLocalId,
      document_type: text(item.documentType ?? item.document_type) || "CUSTOM_APP",
      title,
      status: text(item.status) || "DRAFT",
      content_json: content,
      version_no: Math.max(1, numberValue(item.versionNo ?? item.version_no, 1)),
      note: text(item.note),
      source: "APP",
      updated_at_millis: Date.now(),
    };
    if (match?.id) {
      const { error: updateError } = await supabase
        .from("dora_documents")
        .update(record)
        .eq("id", match.id);
      if (updateError) throw updateError;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("dora_documents")
        .insert({
          ...record,
          sync_key: crypto.randomUUID(),
          is_deleted: false,
          created_at_millis: Date.now(),
        })
        .select("*")
        .single();
      if (insertError) throw insertError;
      byTitle.set(normalize(title), inserted);
    }
  }
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json(
      { success: false, error: "Yetkisiz DORA mobil isteği." },
      { status: 401 }
    );
  }

  try {
    const firmId = text(new URL(req.url).searchParams.get("firmId"));
    if (!firmId) {
      return NextResponse.json(
        { success: false, error: "firmId zorunludur." },
        { status: 400 }
      );
    }
    return NextResponse.json(await getSnapshot(firmId));
  } catch (error) {
    console.error("DORA MOBILE SYNC GET ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "DORA snapshot alınamadı.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json(
      { success: false, error: "Yetkisiz DORA mobil isteği." },
      { status: 401 }
    );
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const firmId = text(body.firmId ?? body.firm_id);
    if (!firmId) {
      return NextResponse.json(
        { success: false, error: "firmId zorunludur." },
        { status: 400 }
      );
    }

    const appFirmLocalIdRaw = body.appFirmLocalId ?? body.app_firm_local_id;
    const appFirmLocalId =
      appFirmLocalIdRaw === null || appFirmLocalIdRaw === undefined
        ? null
        : numberValue(appFirmLocalIdRaw, 0) || null;

    await Promise.all([
      mergeEmployees(firmId, appFirmLocalId, arrayOf(body.employees)),
      mergeRisks(firmId, appFirmLocalId, arrayOf(body.risks)),
      mergeCustomDocuments(
        firmId,
        appFirmLocalId,
        arrayOf(body.customDocuments ?? body.custom_documents)
      ),
    ]);

    if (body.authorities !== undefined) {
      await upsertState(firmId, "AUTHORITIES", body.authorities);
    }
    if (body.trainings !== undefined) {
      await upsertState(firmId, "TRAINING", body.trainings, "WEB_APP");
    }

    if (body.trainings !== undefined || body.certificates !== undefined) {
      const { data: existingState, error: existingStateError } = await supabase
        .from("dora_module_state")
        .select("module_key,payload")
        .eq("firm_id", firmId)
        .in("module_key", ["TRAINING", "CERTIFICATE"]);

      if (existingStateError) throw existingStateError;

      const stateMap = new Map<string, unknown>();
      for (const row of existingState ?? []) {
        stateMap.set(text(row.module_key).toUpperCase(), row.payload ?? {});
      }

      const trainingPayload =
        body.trainings !== undefined
          ? body.trainings
          : stateMap.get("TRAINING") ?? { items: [] };

      const certificatePayload =
        body.certificates !== undefined
          ? body.certificates
          : stateMap.get("CERTIFICATE") ?? { items: [] };

      const generatedCertificates = autoCertificates(
        trainingPayload,
        certificatePayload
      );

      await upsertState(
        firmId,
        "CERTIFICATE",
        generatedCertificates,
        "DORA_AUTO"
      );
    }

    if (body.expert !== undefined) {
      await upsertState(firmId, "EXPERT", body.expert);
    }
    if (body.corporate !== undefined) {
      await upsertState(firmId, "CORPORATE", body.corporate);
    }

    // Firma çalışan sayısını güncel tut.
    const { count: employeeCount } = await supabase
      .from("dora_employees")
      .select("id", { count: "exact", head: true })
      .eq("firm_id", firmId)
      .eq("is_deleted", false)
      .eq("is_active", true);

    await supabase
      .from("dora_firms")
      .update({
        employee_count: employeeCount ?? 0,
        updated_at_millis: Date.now(),
      })
      .eq("id", firmId);

    return NextResponse.json(await getSnapshot(firmId));
  } catch (error) {
    console.error("DORA MOBILE SYNC POST ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "DORA senkronizasyonu başarısız.",
      },
      { status: 500 }
    );
  }
}