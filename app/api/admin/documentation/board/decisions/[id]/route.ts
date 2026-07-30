import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  mapBoardDecision,
  mapBoardDecisionToDatabase,
} from "@/lib/documentation/board/mapper";

import type {
  BoardDecision,
  BoardDecisionPriority,
  BoardDecisionSavePayload,
  BoardDecisionStatus,
  BoardVoteResult,
} from "@/lib/documentation/board/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const BOARD_DECISIONS_TABLE =
  "documentation_board_decisions";

const BOARD_MEETINGS_TABLE =
  "documentation_board_meetings";

const BOARD_AGENDA_TABLE =
  "documentation_board_agenda";

type UnknownRecord = Record<string, unknown>;

type RouteContext = {
  params:
    | Promise<{
        id: string;
      }>
    | {
        id: string;
      };
};

type MeetingReference = {
  id: string;
  firmId: string;
  isDeleted: boolean;
};

type AgendaReference = {
  id: string;
  meetingId: string;
  firmId: string;
  isDeleted: boolean;
};

const DECISION_PRIORITIES: BoardDecisionPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "CRITICAL",
];

const DECISION_STATUSES: BoardDecisionStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "COMPLETED",
  "POSTPONED",
  "CANCELLED",
];

const VOTE_RESULTS: BoardVoteResult[] = [
  "UNANIMOUS",
  "MAJORITY",
  "REJECTED",
  "NO_VOTE",
];

function createSupabaseAdmin() {
  if (!supabaseUrl) {
    throw new Error(
      "SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_URL tanımlı değil."
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tanımlı değil."
    );
  }

  return createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

function jsonSuccess(
  data: UnknownRecord,
  status = 200
) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    }
  );
}

function jsonError(
  message: string,
  status = 500,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details !== undefined
        ? { details }
        : {}),
    },
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    }
  );
}

function normalizeText(
  value: unknown
): string {
  return String(value ?? "").trim();
}

function normalizeOptionalText(
  value: unknown
): string | null {
  const normalized = normalizeText(value);
  return normalized || null;
}

function normalizeInteger(
  value: unknown,
  fallback = 0
): number {
  const normalized = Number(value);

  if (!Number.isFinite(normalized)) {
    return fallback;
  }

  return Math.trunc(normalized);
}

function normalizeNullableInteger(
  value: unknown
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const normalized = Number(value);

  if (!Number.isFinite(normalized)) {
    return null;
  }

  return Math.trunc(normalized);
}

function normalizePositiveMillis(
  value: unknown
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const normalized = Number(value);

  if (
    !Number.isFinite(normalized) ||
    normalized <= 0
  ) {
    return null;
  }

  return Math.trunc(normalized);
}

function removeUndefinedValues(
  input: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(
      ([, value]) => value !== undefined
    )
  );
}

function hasOwn(
  body: UnknownRecord,
  ...keys: string[]
): boolean {
  return keys.some((key) =>
    Object.prototype.hasOwnProperty.call(
      body,
      key
    )
  );
}

function readValue(
  body: UnknownRecord,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(
        body,
        key
      )
    ) {
      return body[key];
    }
  }

  return undefined;
}

function normalizeDecisionPriority(
  value: unknown,
  fallback: BoardDecisionPriority
): BoardDecisionPriority {
  const normalized =
    normalizeText(value).toUpperCase();

  return DECISION_PRIORITIES.includes(
    normalized as BoardDecisionPriority
  )
    ? (normalized as BoardDecisionPriority)
    : fallback;
}

function normalizeDecisionStatus(
  value: unknown,
  fallback: BoardDecisionStatus
): BoardDecisionStatus {
  const normalized =
    normalizeText(value).toUpperCase();

  return DECISION_STATUSES.includes(
    normalized as BoardDecisionStatus
  )
    ? (normalized as BoardDecisionStatus)
    : fallback;
}

function normalizeVoteResult(
  value: unknown,
  fallback: BoardVoteResult
): BoardVoteResult {
  const normalized =
    normalizeText(value).toUpperCase();

  return VOTE_RESULTS.includes(
    normalized as BoardVoteResult
  )
    ? (normalized as BoardVoteResult)
    : fallback;
}

async function getRouteId(
  context: RouteContext
): Promise<string> {
  const params =
    await Promise.resolve(context.params);

  return normalizeText(params.id);
}

async function loadDecision(
  id: string
): Promise<BoardDecision | null> {
  const supabase =
    createSupabaseAdmin();

  const { data, error } =
    await supabase
      .from(BOARD_DECISIONS_TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapBoardDecision(data);
}

async function loadMeeting(
  meetingId: string
): Promise<MeetingReference | null> {
  const supabase =
    createSupabaseAdmin();

  const { data, error } =
    await supabase
      .from(BOARD_MEETINGS_TABLE)
      .select(
        "id, firm_id, is_deleted"
      )
      .eq("id", meetingId)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: normalizeText(data.id),
    firmId: normalizeText(data.firm_id),
    isDeleted: Boolean(data.is_deleted),
  };
}

async function loadAgendaItem(
  agendaId: string
): Promise<AgendaReference | null> {
  const supabase =
    createSupabaseAdmin();

  const { data, error } =
    await supabase
      .from(BOARD_AGENDA_TABLE)
      .select(
        "id, meeting_id, firm_id, is_deleted"
      )
      .eq("id", agendaId)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: normalizeText(data.id),
    meetingId: normalizeText(
      data.meeting_id
    ),
    firmId: normalizeText(data.firm_id),
    isDeleted: Boolean(data.is_deleted),
  };
}

function buildUpdatePayload(
  body: UnknownRecord,
  current: BoardDecision
): BoardDecisionSavePayload {
  const meetingId =
    hasOwn(
      body,
      "meetingId",
      "meeting_id"
    )
      ? normalizeText(
          readValue(
            body,
            "meetingId",
            "meeting_id"
          )
        )
      : current.meetingId;

  const firmId =
    hasOwn(
      body,
      "firmId",
      "firm_id"
    )
      ? normalizeText(
          readValue(
            body,
            "firmId",
            "firm_id"
          )
        )
      : current.firmId;

  const decisionNo =
    hasOwn(
      body,
      "decisionNo",
      "decision_no"
    )
      ? normalizeText(
          readValue(
            body,
            "decisionNo",
            "decision_no"
          )
        )
      : current.decisionNo;

  const title =
    hasOwn(
      body,
      "title",
      "decisionTitle",
      "decision_title"
    )
      ? normalizeText(
          readValue(
            body,
            "title",
            "decisionTitle",
            "decision_title"
          )
        )
      : current.title;

  if (!meetingId) {
    throw new Error(
      "Toplantı bilgisi zorunludur."
    );
  }

  if (!firmId) {
    throw new Error(
      "Firma bilgisi zorunludur."
    );
  }

  if (!decisionNo) {
    throw new Error(
      "Karar numarası zorunludur."
    );
  }

  if (!title) {
    throw new Error(
      "Karar başlığı zorunludur."
    );
  }

  const decisionStatus =
    hasOwn(
      body,
      "decisionStatus",
      "decision_status",
      "status"
    )
      ? normalizeDecisionStatus(
          readValue(
            body,
            "decisionStatus",
            "decision_status",
            "status"
          ),
          current.decisionStatus
        )
      : current.decisionStatus;

  let completedAtMillis =
    hasOwn(
      body,
      "completedAtMillis",
      "completed_at_millis"
    )
      ? normalizePositiveMillis(
          readValue(
            body,
            "completedAtMillis",
            "completed_at_millis"
          )
        )
      : current.completedAtMillis;

  let completionRate =
    hasOwn(
      body,
      "completionRate",
      "completion_rate"
    )
      ? Math.min(
          100,
          Math.max(
            0,
            normalizeInteger(
              readValue(
                body,
                "completionRate",
                "completion_rate"
              ),
              current.completionRate
            )
          )
        )
      : current.completionRate;

  if (
    decisionStatus ===
    "COMPLETED"
  ) {
    completedAtMillis =
      completedAtMillis ??
      Date.now();

    completionRate = 100;
  } else {
    completedAtMillis = null;

    if (
      completionRate >= 100
    ) {
      completionRate = 99;
    }
  }

  return {
    id: current.id,

    meetingId,

    agendaId:
      hasOwn(
        body,
        "agendaId",
        "agenda_id"
      )
        ? normalizeOptionalText(
            readValue(
              body,
              "agendaId",
              "agenda_id"
            )
          )
        : current.agendaId,

    firmId,

    localFirmId:
      hasOwn(
        body,
        "localFirmId",
        "local_firm_id"
      )
        ? normalizeNullableInteger(
            readValue(
              body,
              "localFirmId",
              "local_firm_id"
            )
          )
        : current.localFirmId,

    syncKey:
      hasOwn(
        body,
        "syncKey",
        "sync_key"
      )
        ? normalizeText(
            readValue(
              body,
              "syncKey",
              "sync_key"
            )
          ) || current.syncKey
        : current.syncKey,

    decisionNo,

    title,

    description:
      hasOwn(
        body,
        "description",
        "decisionText",
        "decision_text"
      )
        ? normalizeOptionalText(
            readValue(
              body,
              "description",
              "decisionText",
              "decision_text"
            )
          )
        : current.description,

    responsiblePerson:
      hasOwn(
        body,
        "responsiblePerson",
        "responsible_person"
      )
        ? normalizeOptionalText(
            readValue(
              body,
              "responsiblePerson",
              "responsible_person"
            )
          )
        : current.responsiblePerson,

    responsibleDepartment:
      hasOwn(
        body,
        "responsibleDepartment",
        "responsible_department"
      )
        ? normalizeOptionalText(
            readValue(
              body,
              "responsibleDepartment",
              "responsible_department"
            )
          )
        : current.responsibleDepartment,

    priority:
      hasOwn(body, "priority")
        ? normalizeDecisionPriority(
            readValue(
              body,
              "priority"
            ),
            current.priority
          )
        : current.priority,

    decisionStatus,

    dueDateMillis:
      hasOwn(
        body,
        "dueDateMillis",
        "due_date_millis"
      )
        ? normalizePositiveMillis(
            readValue(
              body,
              "dueDateMillis",
              "due_date_millis"
            )
          )
        : current.dueDateMillis,

    completedAtMillis,

    completionRate,

    completionNotes:
      hasOwn(
        body,
        "completionNotes",
        "completion_notes",
        "completionNote",
        "completion_note"
      )
        ? normalizeOptionalText(
            readValue(
              body,
              "completionNotes",
              "completion_notes",
              "completionNote",
              "completion_note"
            )
          )
        : current.completionNotes,

    voteResult:
      hasOwn(
        body,
        "voteResult",
        "vote_result"
      )
        ? normalizeVoteResult(
            readValue(
              body,
              "voteResult",
              "vote_result"
            ),
            current.voteResult
          )
        : current.voteResult,

    yesVoteCount:
      hasOwn(
        body,
        "yesVoteCount",
        "yes_vote_count"
      )
        ? Math.max(
            0,
            normalizeInteger(
              readValue(
                body,
                "yesVoteCount",
                "yes_vote_count"
              ),
              current.yesVoteCount
            )
          )
        : current.yesVoteCount,

    noVoteCount:
      hasOwn(
        body,
        "noVoteCount",
        "no_vote_count"
      )
        ? Math.max(
            0,
            normalizeInteger(
              readValue(
                body,
                "noVoteCount",
                "no_vote_count"
              ),
              current.noVoteCount
            )
          )
        : current.noVoteCount,

    abstainVoteCount:
      hasOwn(
        body,
        "abstainVoteCount",
        "abstain_vote_count"
      )
        ? Math.max(
            0,
            normalizeInteger(
              readValue(
                body,
                "abstainVoteCount",
                "abstain_vote_count"
              ),
              current.abstainVoteCount
            )
          )
        : current.abstainVoteCount,

    relatedModule:
      hasOwn(
        body,
        "relatedModule",
        "related_module"
      )
        ? normalizeOptionalText(
            readValue(
              body,
              "relatedModule",
              "related_module"
            )
          )
        : current.relatedModule,

    relatedRecordId:
      hasOwn(
        body,
        "relatedRecordId",
        "related_record_id"
      )
        ? normalizeOptionalText(
            readValue(
              body,
              "relatedRecordId",
              "related_record_id"
            )
          )
        : current.relatedRecordId,

    source:
      (
        hasOwn(body, "source")
          ? normalizeText(
              readValue(
                body,
                "source"
              )
            ) || current.source
          : current.source
      ) as BoardDecisionSavePayload["source"],

    version:
      Math.max(
        1,
        current.version + 1
      ),
  };
}

/**
 * GET
 *
 * Tek kurul kararını getirir.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const id =
      await getRouteId(context);

    if (!id) {
      return jsonError(
        "Karar ID bilgisi zorunludur.",
        400
      );
    }

    const decision =
      await loadDecision(id);

    if (!decision) {
      return jsonError(
        "Kurul kararı bulunamadı.",
        404
      );
    }

    if (decision.isDeleted) {
      return jsonError(
        "Kurul kararı silinmiş.",
        410
      );
    }

    const now = Date.now();

    const isOverdue =
      decision.dueDateMillis !== null &&
      decision.dueDateMillis < now &&
      decision.decisionStatus !==
        "COMPLETED" &&
      decision.decisionStatus !==
        "CANCELLED";

    return jsonSuccess({
      decision,
      record: decision,
      data: decision,
      isOverdue,
    });
  } catch (error) {
    console.error(
      "Kurul kararı GET hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul kararı alınırken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

/**
 * PATCH
 *
 * Kurul kararını günceller.
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const id =
      await getRouteId(context);

    if (!id) {
      return jsonError(
        "Karar ID bilgisi zorunludur.",
        400
      );
    }

    let body: UnknownRecord;

    try {
      body =
        (await request.json()) as UnknownRecord;
    } catch {
      return jsonError(
        "Geçerli bir JSON gövdesi gönderilmelidir.",
        400
      );
    }

    const current =
      await loadDecision(id);

    if (!current) {
      return jsonError(
        "Kurul kararı bulunamadı.",
        404
      );
    }

    if (current.isDeleted) {
      return jsonError(
        "Silinmiş kurul kararı güncellenemez.",
        409
      );
    }

    let payload:
      BoardDecisionSavePayload;

    try {
      payload =
        buildUpdatePayload(
          body,
          current
        );
    } catch (error) {
      return jsonError(
        error instanceof Error
          ? error.message
          : "Karar bilgileri geçersiz.",
        400
      );
    }

    const meeting =
      await loadMeeting(
        payload.meetingId
      );

    if (!meeting) {
      return jsonError(
        "Kurul toplantısı bulunamadı.",
        404
      );
    }

    if (meeting.isDeleted) {
      return jsonError(
        "Silinmiş kurul toplantısına bağlı karar güncellenemez.",
        409
      );
    }

    if (
      meeting.firmId !==
      payload.firmId
    ) {
      return jsonError(
        "Kararın firma bilgisi toplantıyla eşleşmiyor.",
        400
      );
    }

    if (payload.agendaId) {
      const agendaItem =
        await loadAgendaItem(
          payload.agendaId
        );

      if (!agendaItem) {
        return jsonError(
          "Gündem maddesi bulunamadı.",
          404
        );
      }

      if (agendaItem.isDeleted) {
        return jsonError(
          "Silinmiş gündem maddesine karar bağlanamaz.",
          409
        );
      }

      if (
        agendaItem.meetingId !==
        payload.meetingId
      ) {
        return jsonError(
          "Gündem maddesi seçilen toplantıya ait değil.",
          400
        );
      }

      if (
        agendaItem.firmId !==
        payload.firmId
      ) {
        return jsonError(
          "Gündem maddesinin firma bilgisi kararla eşleşmiyor.",
          400
        );
      }
    }

    const supabase =
      createSupabaseAdmin();

    const {
      data: duplicateRows,
      error: duplicateError,
    } =
      await supabase
        .from(BOARD_DECISIONS_TABLE)
        .select("id, decision_no")
        .eq(
          "meeting_id",
          payload.meetingId
        )
        .eq(
          "decision_no",
          payload.decisionNo
        )
        .eq(
          "is_deleted",
          false
        )
        .neq("id", id)
        .limit(1);

    if (duplicateError) {
      return jsonError(
        "Karar numarası kontrol edilemedi.",
        500,
        duplicateError.message
      );
    }

    if (
      duplicateRows &&
      duplicateRows.length > 0
    ) {
      return jsonError(
        `"${payload.decisionNo}" karar numarası bu toplantıda başka bir kayıtta kullanılıyor.`,
        409
      );
    }

    const databaseRecord =
      removeUndefinedValues(
        mapBoardDecisionToDatabase(
          payload
        )
      );

    const now = Date.now();

    delete databaseRecord.id;
    delete databaseRecord.created_at_millis;

    databaseRecord.updated_at_millis =
      now;

    databaseRecord.version =
      Math.max(
        1,
        current.version + 1
      );

    databaseRecord.sync_status =
      "SYNCED";

    databaseRecord.sync_error =
      null;

    databaseRecord.last_synced_at_millis =
      now;

    databaseRecord.is_deleted =
      false;

    databaseRecord.deleted_at_millis =
      null;

    const { data, error } =
      await supabase
        .from(BOARD_DECISIONS_TABLE)
        .update(databaseRecord)
        .eq("id", id)
        .eq("is_deleted", false)
        .select("*")
        .single();

    if (error) {
      console.error(
        "Kurul kararı güncellenemedi:",
        error
      );

      if (error.code === "23505") {
        return jsonError(
          "Aynı karar numarası veya senkronizasyon anahtarıyla kayıt zaten mevcut.",
          409,
          error.message
        );
      }

      if (error.code === "23503") {
        return jsonError(
          "Toplantı, gündem veya firma bilgisi geçersiz.",
          400,
          error.message
        );
      }

      if (error.code === "23514") {
        return jsonError(
          "Karar durumu, öncelik, tamamlanma oranı veya oylama sonucu geçersiz.",
          400,
          error.message
        );
      }

      return jsonError(
        "Kurul kararı güncellenemedi.",
        500,
        error.message
      );
    }

    const decision =
      mapBoardDecision(data);

    return jsonSuccess({
      message:
        "Kurul kararı başarıyla güncellendi.",

      decision,
      record: decision,
      data: decision,
    });
  } catch (error) {
    console.error(
      "Kurul kararı PATCH hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul kararı güncellenirken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

/**
 * DELETE
 *
 * Kararı kalıcı olarak silmez.
 * Soft delete uygular.
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const id =
      await getRouteId(context);

    if (!id) {
      return jsonError(
        "Karar ID bilgisi zorunludur.",
        400
      );
    }

    const current =
      await loadDecision(id);

    if (!current) {
      return jsonError(
        "Kurul kararı bulunamadı.",
        404
      );
    }

    if (current.isDeleted) {
      return jsonSuccess({
        message:
          "Kurul kararı daha önce silinmiş.",

        id,
        alreadyDeleted: true,
      });
    }

    const supabase =
      createSupabaseAdmin();

    const now = Date.now();

    const { data, error } =
      await supabase
        .from(BOARD_DECISIONS_TABLE)
        .update({
          is_deleted: true,
          deleted_at_millis: now,
          updated_at_millis: now,

          version:
            Math.max(
              1,
              current.version + 1
            ),

          sync_status: "SYNCED",
          sync_error: null,
          last_synced_at_millis: now,
        })
        .eq("id", id)
        .eq("is_deleted", false)
        .select("*")
        .single();

    if (error) {
      console.error(
        "Kurul kararı silinemedi:",
        error
      );

      return jsonError(
        "Kurul kararı silinemedi.",
        500,
        error.message
      );
    }

    const decision =
      mapBoardDecision(data);

    return jsonSuccess({
      message:
        "Kurul kararı başarıyla silindi.",

      id,
      decision,
      record: decision,
      data: decision,
    });
  } catch (error) {
    console.error(
      "Kurul kararı DELETE hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul kararı silinirken beklenmeyen bir hata oluştu.",
      500
    );
  }
}