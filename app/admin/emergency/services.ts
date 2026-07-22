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

async function readJson(response: Response): Promise<EmergencyApiResponse> {
  return response.json().catch(() => ({}));
}

async function ensureSuccess(response: Response) {
  const json = await readJson(response);

  if (!response.ok) {
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
    `/api/admin/emergency?firmId=${encodeURIComponent(firmId)}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  const json = await ensureSuccess(response);
  return Array.isArray(json.plans) ? json.plans : [];
}

export async function getSupportTeams(
  firmId: string
): Promise<EmergencySupportMember[]> {
  const response = await fetch(
    `/api/admin/emergency?firmId=${encodeURIComponent(firmId)}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  const json = await ensureSuccess(response);
  return Array.isArray(json.teams) ? json.teams : [];
}

export async function getEmergencyDrills(
  firmId: string
): Promise<EmergencyDrill[]> {
  const response = await fetch(
    `/api/admin/emergency?firmId=${encodeURIComponent(firmId)}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  const json = await ensureSuccess(response);
  return Array.isArray(json.drills) ? json.drills : [];
}

export async function saveEmergencyPlan(
  plan: Partial<EmergencyPlan>
): Promise<EmergencyPlan> {
  const response = await fetch("/api/admin/emergency", {
    method: plan.id ? "PATCH" : "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      entity: "PLAN",
      record: plan,
    }),
  });

  const json = await ensureSuccess(response);
  return json.record as EmergencyPlan;
}

export async function deleteEmergencyPlan(
  id: string
): Promise<void> {
  const response = await fetch(
    `/api/admin/emergency?entity=PLAN&id=${encodeURIComponent(id)}`,
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
  const response = await fetch("/api/admin/emergency", {
    method: member.id ? "PATCH" : "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      entity: "TEAM",
      record: member,
    }),
  });

  const json = await ensureSuccess(response);
  return json.record as EmergencySupportMember;
}

export async function deleteSupportMember(
  id: string
): Promise<void> {
  const response = await fetch(
    `/api/admin/emergency?entity=TEAM&id=${encodeURIComponent(id)}`,
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
  const response = await fetch("/api/admin/emergency", {
    method: drill.id ? "PATCH" : "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      entity: "DRILL",
      record: drill,
    }),
  });

  const json = await ensureSuccess(response);
  return json.record as EmergencyDrill;
}

export async function deleteEmergencyDrill(
  id: string
): Promise<void> {
  const response = await fetch(
    `/api/admin/emergency?entity=DRILL&id=${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      credentials: "include",
      cache: "no-store",
    }
  );

  await ensureSuccess(response);
}