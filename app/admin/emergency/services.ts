import type {
  EmergencyDrill,
  EmergencyPlan,
  EmergencySupportMember,
} from "./types";

type EmergencyApiResponse = {
  success?: boolean;
  plans?: EmergencyPlan[];
  teams?: EmergencySupportMember[];
  drills?: EmergencyDrill[];
  record?: unknown;
  message?: string;
  error?: string;
};

const EMERGENCY_API =
  "/api/risk-management/emergency";

async function readJson(
  response: Response
): Promise<EmergencyApiResponse> {
  return response
    .json()
    .catch(() => ({}));
}

async function ensureSuccess(
  response: Response
): Promise<EmergencyApiResponse> {
  const json = await readJson(response);

  if (!response.ok || json.success === false) {
    throw new Error(
      json.message ||
        json.error ||
        "Acil durum işlemi gerçekleştirilemedi."
    );
  }

  return json;
}

export async function getEmergencyPlans(
  firmId: string
): Promise<EmergencyPlan[]> {
  const response = await fetch(
    `${EMERGENCY_API}?firmId=${encodeURIComponent(
      firmId
    )}&entityType=PLAN`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  const json = await ensureSuccess(response);

  return Array.isArray(json.plans)
    ? json.plans
    : [];
}

export async function getSupportTeams(
  firmId: string
): Promise<EmergencySupportMember[]> {
  const response = await fetch(
    `${EMERGENCY_API}?firmId=${encodeURIComponent(
      firmId
    )}&entityType=TEAM`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  const json = await ensureSuccess(response);

  return Array.isArray(json.teams)
    ? json.teams
    : [];
}

export async function getEmergencyDrills(
  firmId: string
): Promise<EmergencyDrill[]> {
  const response = await fetch(
    `${EMERGENCY_API}?firmId=${encodeURIComponent(
      firmId
    )}&entityType=DRILL`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  const json = await ensureSuccess(response);

  return Array.isArray(json.drills)
    ? json.drills
    : [];
}

export async function saveEmergencyPlan(
  plan: Partial<EmergencyPlan>
): Promise<EmergencyPlan> {
  const response = await fetch(
    EMERGENCY_API,
    {
      method: plan.id
        ? "PATCH"
        : "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        ...plan,
        entityType: "PLAN",
      }),
    }
  );

  const json = await ensureSuccess(response);

  return json.record as EmergencyPlan;
}

export async function deleteEmergencyPlan(
  id: string
): Promise<void> {
  const response = await fetch(
    `${EMERGENCY_API}?entityType=PLAN&id=${encodeURIComponent(
      id
    )}`,
    {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
    }
  );

  await ensureSuccess(response);
}

export async function saveSupportMember(
  member: Partial<EmergencySupportMember>
): Promise<EmergencySupportMember> {
  const response = await fetch(
    EMERGENCY_API,
    {
      method: member.id
        ? "PATCH"
        : "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        ...member,
        entityType: "TEAM",
      }),
    }
  );

  const json = await ensureSuccess(response);

  return json.record as EmergencySupportMember;
}

export async function deleteSupportMember(
  id: string
): Promise<void> {
  const response = await fetch(
    `${EMERGENCY_API}?entityType=TEAM&id=${encodeURIComponent(
      id
    )}`,
    {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
    }
  );

  await ensureSuccess(response);
}

export async function saveEmergencyDrill(
  drill: Partial<EmergencyDrill>
): Promise<EmergencyDrill> {
  const response = await fetch(
    EMERGENCY_API,
    {
      method: drill.id
        ? "PATCH"
        : "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        ...drill,
        entityType: "DRILL",
      }),
    }
  );

  const json = await ensureSuccess(response);

  return json.record as EmergencyDrill;
}

export async function deleteEmergencyDrill(
  id: string
): Promise<void> {
  const response = await fetch(
    `${EMERGENCY_API}?entityType=DRILL&id=${encodeURIComponent(
      id
    )}`,
    {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
    }
  );

  await ensureSuccess(response);
}