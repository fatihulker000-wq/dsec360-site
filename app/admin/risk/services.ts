/* ===========================================================
   D-SEC Enterprise
   Risk Management V2
   API Based Service Layer
=========================================================== */

import type {
  EmergencyDrill,
  EmergencyPlan,
  EmergencySupportMember,
  RiskDashboardTotals,
  RiskRecord,
} from "./types";

const RISK_API = "/api/admin/risk-management";
const EMERGENCY_API = "/api/admin/emergency";

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  error?: string;
  record?: T;
  records?: T[];
  plans?: EmergencyPlan[];
  teams?: EmergencySupportMember[];
  drills?: EmergencyDrill[];
  totals?: RiskDashboardTotals;
};

async function parseJson<T>(response: Response): Promise<T> {
  return response.json().catch(() => ({} as T));
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  if (response.status === 401 && typeof window !== "undefined") {
    window.location.href = "/admin/login";
    throw new Error("Oturum süresi doldu.");
  }

  const json = await parseJson<ApiEnvelope<T>>(response);

  if (!response.ok) {
    throw new Error(
      json.message ||
        json.error ||
        "İşlem gerçekleştirilemedi."
    );
  }

  return json as T;
}

export async function getRisks(
  firmId?: string
): Promise<RiskRecord[]> {
  const query = firmId
    ? `?firmId=${encodeURIComponent(firmId)}`
    : "";

  const json = await request<ApiEnvelope<RiskRecord>>(
    `${RISK_API}${query}`
  );

  return Array.isArray(json.records) ? json.records : [];
}

export async function getRisk(
  id: string
): Promise<RiskRecord | null> {
  const records = await getRisks();
  return records.find((record) => record.id === id) || null;
}

export async function createRisk(
  record: Partial<RiskRecord>
): Promise<RiskRecord> {
  const json = await request<ApiEnvelope<RiskRecord>>(
    RISK_API,
    {
      method: "POST",
      body: JSON.stringify(record),
    }
  );

  if (!json.record) {
    throw new Error("Risk kaydı oluşturulamadı.");
  }

  return json.record;
}

export async function updateRisk(
  record: Partial<RiskRecord>
): Promise<RiskRecord> {
  if (!record.id) {
    throw new Error("Güncellenecek risk ID bilgisi eksik.");
  }

  const json = await request<ApiEnvelope<RiskRecord>>(
    RISK_API,
    {
      method: "PATCH",
      body: JSON.stringify(record),
    }
  );

  if (!json.record) {
    throw new Error("Risk kaydı güncellenemedi.");
  }

  return json.record;
}

export async function deleteRisk(
  id: string,
  method?: string
): Promise<void> {
  const params = new URLSearchParams({ id });

  if (method) {
    params.set("method", method);
  }

  await request<ApiEnvelope<never>>(
    `${RISK_API}?${params.toString()}`,
    {
      method: "DELETE",
    }
  );
}

export async function getDashboard(
  firmId?: string
): Promise<RiskDashboardTotals> {
  const records = await getRisks(firmId);

  const totalRisk = records.length;
  const criticalRisk = records.filter(
    (record) =>
      record.level === "VERY_HIGH" ||
      record.level === "INTOLERABLE"
  ).length;

  const intolerableRisk = records.filter(
    (record) => record.level === "INTOLERABLE"
  ).length;

  const highRisk = records.filter(
    (record) => record.level === "HIGH"
  ).length;

  const mediumRisk = records.filter(
    (record) => record.level === "MEDIUM"
  ).length;

  const lowRisk = records.filter(
    (record) => record.level === "LOW"
  ).length;

  const averageScore =
    totalRisk > 0
      ? Math.round(
          records.reduce(
            (sum, record) => sum + Number(record.score || 0),
            0
          ) / totalRisk
        )
      : 0;

  const openDof = records.filter(
    (record) => !record.completed
  ).length;

  const closedDof = records.filter(
    (record) => record.completed
  ).length;

  return {
    totalRisk,
    criticalRisk,
    intolerableRisk,
    highRisk,
    mediumRisk,
    lowRisk,
    averageScore,
    openDof,
    closedDof,
  };
}

export async function syncRisks(): Promise<void> {
  await request<ApiEnvelope<never>>(
    `${RISK_API}/sync`,
    {
      method: "POST",
    }
  );
}

async function getEmergencyBundle(
  firmId: string
): Promise<{
  plans: EmergencyPlan[];
  teams: EmergencySupportMember[];
  drills: EmergencyDrill[];
}> {
  const json = await request<ApiEnvelope<never>>(
    `${EMERGENCY_API}?firmId=${encodeURIComponent(firmId)}`
  );

  return {
    plans: Array.isArray(json.plans) ? json.plans : [],
    teams: Array.isArray(json.teams) ? json.teams : [],
    drills: Array.isArray(json.drills) ? json.drills : [],
  };
}

export async function getEmergencyPlans(
  firmId: string
): Promise<EmergencyPlan[]> {
  const bundle = await getEmergencyBundle(firmId);
  return bundle.plans;
}

export async function saveEmergencyPlan(
  plan: Partial<EmergencyPlan>
): Promise<EmergencyPlan> {
  const json = await request<ApiEnvelope<EmergencyPlan>>(
    EMERGENCY_API,
    {
      method: plan.id ? "PATCH" : "POST",
      body: JSON.stringify({
        entity: "PLAN",
        record: plan,
      }),
    }
  );

  if (!json.record) {
    throw new Error("Acil durum planı kaydedilemedi.");
  }

  return json.record;
}

export async function deleteEmergencyPlan(
  id: string
): Promise<void> {
  await request<ApiEnvelope<never>>(
    `${EMERGENCY_API}?entity=PLAN&id=${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
}

export async function getSupportTeams(
  firmId: string
): Promise<EmergencySupportMember[]> {
  const bundle = await getEmergencyBundle(firmId);
  return bundle.teams;
}

export async function saveSupportMember(
  member: Partial<EmergencySupportMember>
): Promise<EmergencySupportMember> {
  const json = await request<ApiEnvelope<EmergencySupportMember>>(
    EMERGENCY_API,
    {
      method: member.id ? "PATCH" : "POST",
      body: JSON.stringify({
        entity: "TEAM",
        record: member,
      }),
    }
  );

  if (!json.record) {
    throw new Error("Destek ekibi üyesi kaydedilemedi.");
  }

  return json.record;
}

export async function deleteSupportMember(
  id: string
): Promise<void> {
  await request<ApiEnvelope<never>>(
    `${EMERGENCY_API}?entity=TEAM&id=${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
}

export async function getEmergencyDrills(
  firmId: string
): Promise<EmergencyDrill[]> {
  const bundle = await getEmergencyBundle(firmId);
  return bundle.drills;
}

export async function saveEmergencyDrill(
  drill: Partial<EmergencyDrill>
): Promise<EmergencyDrill> {
  const json = await request<ApiEnvelope<EmergencyDrill>>(
    EMERGENCY_API,
    {
      method: drill.id ? "PATCH" : "POST",
      body: JSON.stringify({
        entity: "DRILL",
        record: drill,
      }),
    }
  );

  if (!json.record) {
    throw new Error("Tatbikat kaydı kaydedilemedi.");
  }

  return json.record;
}

export async function deleteEmergencyDrill(
  id: string
): Promise<void> {
  await request<ApiEnvelope<never>>(
    `${EMERGENCY_API}?entity=DRILL&id=${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
}

export async function importRisks(
  records: Array<Partial<RiskRecord>>
): Promise<{
  successCount: number;
  failedIndexes: number[];
}> {
  let successCount = 0;
  const failedIndexes: number[] = [];

  for (let index = 0; index < records.length; index += 1) {
    try {
      await createRisk(records[index]);
      successCount += 1;
    } catch {
      failedIndexes.push(index);
    }
  }

  return {
    successCount,
    failedIndexes,
  };
}