import type {
  BoardAgendaItem,
  BoardAgendaSavePayload,
  BoardDashboard,
  BoardDecision,
  BoardDecisionSavePayload,
  BoardMeeting,
  BoardMeetingBundle,
  BoardMeetingSavePayload,
  BoardParticipant,
  BoardParticipantSavePayload,
} from "./types";

const BOARD_API_BASE =
  "/api/admin/documentation/board";

type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  meeting?: BoardMeeting;
  meetings?: BoardMeeting[];
  agenda?: BoardAgendaItem[];
  participants?: BoardParticipant[];
  decisions?: BoardDecision[];
  dashboard?: BoardDashboard;
  bundle?: BoardMeetingBundle;
  record?: T;
  message?: string;
  error?: string;
};

export class BoardServiceError extends Error {
  status: number;
  details?: unknown;

  constructor(
    message: string,
    status = 500,
    details?: unknown
  ) {
    super(message);

    this.name = "BoardServiceError";
    this.status = status;
    this.details = details;
  }
}

function normalizeText(
  value: unknown
): string {
  return String(value ?? "").trim();
}

function buildQuery(
  values: Record<
    string,
    string | number | boolean | null | undefined
  >
): string {
  const params =
    new URLSearchParams();

  for (const [
    key,
    value,
  ] of Object.entries(values)) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      continue;
    }

    params.set(
      key,
      String(value)
    );
  }

  const query =
    params.toString();

  return query
    ? `?${query}`
    : "";
}

async function parseResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {
  const contentType =
    response.headers.get(
      "content-type"
    ) ?? "";

  if (
    !contentType.includes(
      "application/json"
    )
  ) {
    const rawText =
      await response.text();

    throw new BoardServiceError(
      rawText ||
        "Sunucudan geçersiz yanıt alındı.",
      response.status
    );
  }

  const result =
    (await response.json()) as ApiResponse<T>;

  if (
    !response.ok ||
    result.success === false
  ) {
    throw new BoardServiceError(
      result.error ||
        result.message ||
        "Kurul Merkezi işlemi başarısız oldu.",
      response.status,
      result
    );
  }

  return result;
}

async function boardFetch<T>(
  url: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response =
      await fetch(url, {
        ...init,

        headers: {
          Accept:
            "application/json",

          ...(init?.body
            ? {
                "Content-Type":
                  "application/json",
              }
            : {}),

          ...init?.headers,
        },

        cache: "no-store",
      });

    return await parseResponse<T>(
      response
    );
  } catch (error) {
    if (
      error instanceof
      BoardServiceError
    ) {
      throw error;
    }

    throw new BoardServiceError(
      error instanceof Error
        ? error.message
        : "Kurul Merkezi sunucusuna ulaşılamadı.",
      500,
      error
    );
  }
}

function requireIdentifier(
  value: string,
  label: string
): string {
  const normalized =
    normalizeText(value);

  if (!normalized) {
    throw new BoardServiceError(
      `${label} bilgisi zorunludur.`,
      400
    );
  }

  return normalized;
}

function requireFirmId(
  firmId: string
): string {
  return requireIdentifier(
    firmId,
    "Firma"
  );
}

function requireMeetingId(
  meetingId: string
): string {
  return requireIdentifier(
    meetingId,
    "Toplantı"
  );
}

function validateMeetingPayload(
  payload: BoardMeetingSavePayload
): BoardMeetingSavePayload {
  const firmId =
    requireFirmId(
      payload.firmId
    );

  const meetingNo =
    normalizeText(
      payload.meetingNo
    );

  const meetingTitle =
    normalizeText(
      payload.meetingTitle
    );

  if (!meetingNo) {
    throw new BoardServiceError(
      "Toplantı numarası zorunludur.",
      400
    );
  }

  if (!meetingTitle) {
    throw new BoardServiceError(
      "Toplantı başlığı zorunludur.",
      400
    );
  }

  if (
    !Number.isFinite(
      payload.meetingDateMillis
    ) ||
    payload.meetingDateMillis <=
      0
  ) {
    throw new BoardServiceError(
      "Geçerli bir toplantı tarihi seçilmelidir.",
      400
    );
  }

  return {
    ...payload,
    firmId,
    meetingNo,
    meetingTitle,
  };
}

function validateAgendaPayload(
  payload: BoardAgendaSavePayload
): BoardAgendaSavePayload {
  const meetingId =
    requireMeetingId(
      payload.meetingId
    );

  const firmId =
    requireFirmId(
      payload.firmId
    );

  const title =
    normalizeText(
      payload.title
    );

  if (!title) {
    throw new BoardServiceError(
      "Gündem başlığı zorunludur.",
      400
    );
  }

  const itemNo =
    Math.max(
      1,
      Math.trunc(
        Number(
          payload.itemNo
        ) || 1
      )
    );

  return {
    ...payload,
    meetingId,
    firmId,
    itemNo,
    title,
  };
}

function validateParticipantPayload(
  payload: BoardParticipantSavePayload
): BoardParticipantSavePayload {
  const meetingId =
    requireMeetingId(
      payload.meetingId
    );

  const firmId =
    requireFirmId(
      payload.firmId
    );

  const fullName =
    normalizeText(
      payload.fullName
    );

  if (!fullName) {
    throw new BoardServiceError(
      "Katılımcı adı soyadı zorunludur.",
      400
    );
  }

  return {
    ...payload,
    meetingId,
    firmId,
    fullName,
  };
}

function validateDecisionPayload(
  payload: BoardDecisionSavePayload
): BoardDecisionSavePayload {
  const meetingId =
    requireMeetingId(
      payload.meetingId
    );

  const firmId =
    requireFirmId(
      payload.firmId
    );

  const decisionNo =
    normalizeText(
      payload.decisionNo
    );

  const title =
    normalizeText(
      payload.title
    );

  if (!decisionNo) {
    throw new BoardServiceError(
      "Karar numarası zorunludur.",
      400
    );
  }

  if (!title) {
    throw new BoardServiceError(
      "Karar başlığı zorunludur.",
      400
    );
  }

  const completionRate =
    Math.min(
      100,
      Math.max(
        0,
        Math.trunc(
          Number(
            payload.completionRate ??
              0
          )
        )
      )
    );

  return {
    ...payload,
    meetingId,
    firmId,
    decisionNo,
    title,
    completionRate,
  };
}

/* ============================================================
 * DASHBOARD
 * ============================================================
 */

export async function getBoardDashboard(
  firmId: string
): Promise<BoardDashboard> {
  const normalizedFirmId =
    requireFirmId(firmId);

  const result =
    await boardFetch<BoardDashboard>(
      `${BOARD_API_BASE}/dashboard${buildQuery(
        {
          firmId:
            normalizedFirmId,
        }
      )}`
    );

  const dashboard =
    result.dashboard ??
    result.data;

  if (!dashboard) {
    throw new BoardServiceError(
      "Kurul dashboard verisi alınamadı."
    );
  }

  return dashboard;
}

/* ============================================================
 * TOPLANTILAR
 * ============================================================
 */

export async function getBoardMeetings(
  firmId: string,
  options?: {
    status?: string;
    search?: string;
    year?: number;
    includeDeleted?: boolean;
  }
): Promise<BoardMeeting[]> {
  const normalizedFirmId =
    requireFirmId(firmId);

  const result =
    await boardFetch<
      BoardMeeting[]
    >(
      `${BOARD_API_BASE}${buildQuery(
        {
          firmId:
            normalizedFirmId,

          status:
            options?.status,

          search:
            options?.search,

          year:
            options?.year,

          includeDeleted:
            options?.includeDeleted,
        }
      )}`
    );

  return (
    result.meetings ??
    result.data ??
    []
  );
}

export async function getBoardMeeting(
  id: string
): Promise<BoardMeeting> {
  const normalizedId =
    requireIdentifier(
      id,
      "Toplantı"
    );

  const result =
    await boardFetch<BoardMeeting>(
      `${BOARD_API_BASE}/${encodeURIComponent(
        normalizedId
      )}`
    );

  const meeting =
    result.meeting ??
    result.record ??
    result.data;

  if (!meeting) {
    throw new BoardServiceError(
      "Toplantı kaydı bulunamadı.",
      404
    );
  }

  return meeting;
}

export async function createBoardMeeting(
  payload: BoardMeetingSavePayload
): Promise<BoardMeeting> {
  const normalizedPayload =
    validateMeetingPayload(
      payload
    );

  const result =
    await boardFetch<BoardMeeting>(
      BOARD_API_BASE,
      {
        method: "POST",

        body: JSON.stringify(
          normalizedPayload
        ),
      }
    );

  const meeting =
    result.meeting ??
    result.record ??
    result.data;

  if (!meeting) {
    throw new BoardServiceError(
      "Toplantı oluşturuldu ancak kayıt bilgisi alınamadı."
    );
  }

  return meeting;
}

export async function updateBoardMeeting(
  id: string,
  payload: BoardMeetingSavePayload
): Promise<BoardMeeting> {
  const normalizedId =
    requireIdentifier(
      id,
      "Toplantı"
    );

  const normalizedPayload =
    validateMeetingPayload({
      ...payload,
      id: normalizedId,
    });

  const result =
    await boardFetch<BoardMeeting>(
      `${BOARD_API_BASE}/${encodeURIComponent(
        normalizedId
      )}`,
      {
        method: "PATCH",

        body: JSON.stringify(
          normalizedPayload
        ),
      }
    );

  const meeting =
    result.meeting ??
    result.record ??
    result.data;

  if (!meeting) {
    throw new BoardServiceError(
      "Toplantı güncellendi ancak kayıt bilgisi alınamadı."
    );
  }

  return meeting;
}

export async function deleteBoardMeeting(
  id: string
): Promise<void> {
  const normalizedId =
    requireIdentifier(
      id,
      "Toplantı"
    );

  await boardFetch<unknown>(
    `${BOARD_API_BASE}/${encodeURIComponent(
      normalizedId
    )}`,
    {
      method: "DELETE",
    }
  );
}

/* ============================================================
 * TOPLANTI BUNDLE
 * ============================================================
 */

export async function getMeetingBundle(
  meetingId: string
): Promise<BoardMeetingBundle> {
  const normalizedMeetingId =
    requireMeetingId(
      meetingId
    );

  const result =
    await boardFetch<BoardMeetingBundle>(
      `${BOARD_API_BASE}/bundle/${encodeURIComponent(
        normalizedMeetingId
      )}`
    );

  const bundle =
    result.bundle ??
    result.data;

  if (!bundle) {
    throw new BoardServiceError(
      "Toplantı detayları alınamadı.",
      404
    );
  }

  return bundle;
}

/* ============================================================
 * GÜNDEM
 * ============================================================
 */

export async function getAgendaItems(
  meetingId: string
): Promise<BoardAgendaItem[]> {
  const normalizedMeetingId =
    requireMeetingId(
      meetingId
    );

  const result =
    await boardFetch<
      BoardAgendaItem[]
    >(
      `${BOARD_API_BASE}/agenda${buildQuery(
        {
          meetingId:
            normalizedMeetingId,
        }
      )}`
    );

  return (
    result.agenda ??
    result.data ??
    []
  );
}

export async function createAgendaItem(
  payload: BoardAgendaSavePayload
): Promise<BoardAgendaItem> {
  const normalizedPayload =
    validateAgendaPayload(
      payload
    );

  const result =
    await boardFetch<BoardAgendaItem>(
      `${BOARD_API_BASE}/agenda`,
      {
        method: "POST",

        body: JSON.stringify(
          normalizedPayload
        ),
      }
    );

  const agendaItem =
    result.record ??
    result.data;

  if (!agendaItem) {
    throw new BoardServiceError(
      "Gündem maddesi oluşturuldu ancak kayıt bilgisi alınamadı."
    );
  }

  return agendaItem;
}

export async function updateAgendaItem(
  id: string,
  payload: BoardAgendaSavePayload
): Promise<BoardAgendaItem> {
  const normalizedId =
    requireIdentifier(
      id,
      "Gündem maddesi"
    );

  const normalizedPayload =
    validateAgendaPayload({
      ...payload,
      id: normalizedId,
    });

  const result =
    await boardFetch<BoardAgendaItem>(
      `${BOARD_API_BASE}/agenda/${encodeURIComponent(
        normalizedId
      )}`,
      {
        method: "PATCH",

        body: JSON.stringify(
          normalizedPayload
        ),
      }
    );

  const agendaItem =
    result.record ??
    result.data;

  if (!agendaItem) {
    throw new BoardServiceError(
      "Gündem maddesi güncellendi ancak kayıt bilgisi alınamadı."
    );
  }

  return agendaItem;
}

export async function deleteAgendaItem(
  id: string
): Promise<void> {
  const normalizedId =
    requireIdentifier(
      id,
      "Gündem maddesi"
    );

  await boardFetch<unknown>(
    `${BOARD_API_BASE}/agenda/${encodeURIComponent(
      normalizedId
    )}`,
    {
      method: "DELETE",
    }
  );
}

/* ============================================================
 * KATILIMCILAR
 * ============================================================
 */

export async function getParticipants(
  meetingId: string
): Promise<BoardParticipant[]> {
  const normalizedMeetingId =
    requireMeetingId(
      meetingId
    );

  const result =
    await boardFetch<
      BoardParticipant[]
    >(
      `${BOARD_API_BASE}/participants${buildQuery(
        {
          meetingId:
            normalizedMeetingId,
        }
      )}`
    );

  return (
    result.participants ??
    result.data ??
    []
  );
}

export async function createParticipant(
  payload: BoardParticipantSavePayload
): Promise<BoardParticipant> {
  const normalizedPayload =
    validateParticipantPayload(
      payload
    );

  const result =
    await boardFetch<BoardParticipant>(
      `${BOARD_API_BASE}/participants`,
      {
        method: "POST",

        body: JSON.stringify(
          normalizedPayload
        ),
      }
    );

  const participant =
    result.record ??
    result.data;

  if (!participant) {
    throw new BoardServiceError(
      "Katılımcı oluşturuldu ancak kayıt bilgisi alınamadı."
    );
  }

  return participant;
}

export async function updateParticipant(
  id: string,
  payload: BoardParticipantSavePayload
): Promise<BoardParticipant> {
  const normalizedId =
    requireIdentifier(
      id,
      "Katılımcı"
    );

  const normalizedPayload =
    validateParticipantPayload({
      ...payload,
      id: normalizedId,
    });

  const result =
    await boardFetch<BoardParticipant>(
      `${BOARD_API_BASE}/participants/${encodeURIComponent(
        normalizedId
      )}`,
      {
        method: "PATCH",

        body: JSON.stringify(
          normalizedPayload
        ),
      }
    );

  const participant =
    result.record ??
    result.data;

  if (!participant) {
    throw new BoardServiceError(
      "Katılımcı güncellendi ancak kayıt bilgisi alınamadı."
    );
  }

  return participant;
}

export async function deleteParticipant(
  id: string
): Promise<void> {
  const normalizedId =
    requireIdentifier(
      id,
      "Katılımcı"
    );

  await boardFetch<unknown>(
    `${BOARD_API_BASE}/participants/${encodeURIComponent(
      normalizedId
    )}`,
    {
      method: "DELETE",
    }
  );
}

/* ============================================================
 * KARARLAR
 * ============================================================
 */

export async function getDecisions(
  meetingId: string
): Promise<BoardDecision[]> {
  const normalizedMeetingId =
    requireMeetingId(
      meetingId
    );

  const result =
    await boardFetch<
      BoardDecision[]
    >(
      `${BOARD_API_BASE}/decisions${buildQuery(
        {
          meetingId:
            normalizedMeetingId,
        }
      )}`
    );

  return (
    result.decisions ??
    result.data ??
    []
  );
}

export async function createDecision(
  payload: BoardDecisionSavePayload
): Promise<BoardDecision> {
  const normalizedPayload =
    validateDecisionPayload(
      payload
    );

  const result =
    await boardFetch<BoardDecision>(
      `${BOARD_API_BASE}/decisions`,
      {
        method: "POST",

        body: JSON.stringify(
          normalizedPayload
        ),
      }
    );

  const decision =
    result.record ??
    result.data;

  if (!decision) {
    throw new BoardServiceError(
      "Kurul kararı oluşturuldu ancak kayıt bilgisi alınamadı."
    );
  }

  return decision;
}

export async function updateDecision(
  id: string,
  payload: BoardDecisionSavePayload
): Promise<BoardDecision> {
  const normalizedId =
    requireIdentifier(
      id,
      "Kurul kararı"
    );

  const normalizedPayload =
    validateDecisionPayload({
      ...payload,
      id: normalizedId,
    });

  const result =
    await boardFetch<BoardDecision>(
      `${BOARD_API_BASE}/decisions/${encodeURIComponent(
        normalizedId
      )}`,
      {
        method: "PATCH",

        body: JSON.stringify(
          normalizedPayload
        ),
      }
    );

  const decision =
    result.record ??
    result.data;

  if (!decision) {
    throw new BoardServiceError(
      "Kurul kararı güncellendi ancak kayıt bilgisi alınamadı."
    );
  }

  return decision;
}

export async function deleteDecision(
  id: string
): Promise<void> {
  const normalizedId =
    requireIdentifier(
      id,
      "Kurul kararı"
    );

  await boardFetch<unknown>(
    `${BOARD_API_BASE}/decisions/${encodeURIComponent(
      normalizedId
    )}`,
    {
      method: "DELETE",
    }
  );
}