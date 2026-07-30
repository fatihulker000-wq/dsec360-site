import type {
  EmergencyDrill,
  EmergencyPlan,
  EmergencySupportMember,
  EmergencyTeamType,
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

/**
 * Web ve mobil tarafta kullanılmış ekip kodlarını
 * tek bir standart ekip koduna dönüştürür.
 */
export function normalizeEmergencyTeamType(
  value: unknown
): EmergencyTeamType {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replaceAll("İ", "I")
    .replaceAll("Ş", "S")
    .replaceAll("Ğ", "G")
    .replaceAll("Ü", "U")
    .replaceAll("Ö", "O")
    .replaceAll("Ç", "C");

  switch (normalized) {
    case "ISVEREN":
    case "ISVEREN_VEKILI":
      return "ISVEREN_VEKILI";

    case "ACIL_DURUM_KOORDINATORU":
      return "ACIL_DURUM_KOORDINATORU";

    case "KORUMA":
    case "KORUMA_EKIBI":
      return "KORUMA";

    case "ARAMA_KURTARMA":
    case "ARAMA_KURTARMA_TAHLIYE":
    case "KURTARMA_TAHLIYE":
    case "TAHLIYE":
      return "ARAMA_KURTARMA_TAHLIYE";

    case "YANGIN":
    case "YANGIN_EKIBI":
    case "YANGINLA_MUCADELE":
      return "YANGIN";

    case "ILKYARDIM":
    case "ILK_YARDIM":
    case "ILK_YARDIM_EKIBI":
      return "ILK_YARDIM";

    case "HABERLESME":
    case "HABERLESME_EKIBI":
      return "HABERLESME";

    default:
      /*
       * Bilinmeyen bir değeri başka bir ekibe çevirmeyiz.
       * Yeni kayıt formunun varsayılanı zaten YANGIN'dır.
       */
      return "YANGIN";
  }
}

function normalizeSupportMember(
  member: EmergencySupportMember
): EmergencySupportMember {
  return {
    ...member,
    teamType: normalizeEmergencyTeamType(
      member.teamType
    ),
  };
}

function normalizeSupportMemberPayload(
  member: Partial<EmergencySupportMember>
): Partial<EmergencySupportMember> {
  if (
    member.teamType === undefined ||
    member.teamType === null ||
    String(member.teamType).trim() === ""
  ) {
    return {
      ...member,
    };
  }

  return {
    ...member,
    teamType: normalizeEmergencyTeamType(
      member.teamType
    ),
  };
}

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

  if (
    !response.ok ||
    json.success === false
  ) {
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

  const teams = Array.isArray(json.teams)
    ? json.teams
    : [];

  return teams.map(normalizeSupportMember);
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
  const normalizedMember =
    normalizeSupportMemberPayload(member);

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
        ...normalizedMember,
        entityType: "TEAM",
      }),
    }
  );

  const json = await ensureSuccess(response);

  const savedMember =
    json.record as EmergencySupportMember;

  return normalizeSupportMember(
    savedMember
  );
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