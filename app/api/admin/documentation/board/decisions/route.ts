import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  mapBoardDecision,
  mapBoardDecisions,
  mapBoardDecisionToDatabase,
} from "@/lib/documentation/board/mapper";

import type {
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

function normalizeBoolean(
  value: unknown,
  fallback = false
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized =
      value.trim().toLowerCase();

    if (
      ["true", "1", "yes", "evet"].includes(
        normalized
      )
    ) {
      return true;
    }

    if (
      [
        "false",
        "0",
        "no",
        "hayır",
        "hayir",
      ].includes(normalized)
    ) {
      return false;
    }
  }

  return fallback;
}

function sanitizeSearchValue(
  value: string
): string {
  return value
    .replace(/[%_,().]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
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

function normalizeDecisionPriority(
  value: unknown
): BoardDecisionPriority {
  const normalized =
    normalizeText(value).toUpperCase();

  return DECISION_PRIORITIES.includes(
    normalized as BoardDecisionPriority
  )
    ? (normalized as BoardDecisionPriority)
    : "NORMAL";
}

function normalizeDecisionStatus(
  value: unknown
): BoardDecisionStatus {
  const normalized =
    normalizeText(value).toUpperCase();

  return DECISION_STATUSES.includes(
    normalized as BoardDecisionStatus
  )
    ? (normalized as BoardDecisionStatus)
    : "OPEN";
}

function normalizeVoteResult(
  value: unknown
): BoardVoteResult {
  const normalized =
    normalizeText(value).toUpperCase();

  return VOTE_RESULTS.includes(
    normalized as BoardVoteResult
  )
    ? (normalized as BoardVoteResult)
    : "NO_VOTE";
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

function buildDecisionPayload(
  body: UnknownRecord
): BoardDecisionSavePayload {
  const meetingId =
    normalizeText(
      body.meetingId ??
        body.meeting_id
    );

  const firmId =
    normalizeText(
      body.firmId ??
        body.firm_id
    );

  const decisionNo =
    normalizeText(
      body.decisionNo ??
        body.decision_no
    );

  const title =
    normalizeText(
      body.title ??
        body.decisionTitle ??
        body.decision_title
    );

  const description =
    normalizeOptionalText(
      body.description ??
        body.decisionText ??
        body.decision_text
    );

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
    normalizeDecisionStatus(
      body.decisionStatus ??
        body.decision_status ??
        body.status ??
        "OPEN"
    );

  let completedAtMillis =
    normalizePositiveMillis(
      body.completedAtMillis ??
        body.completed_at_millis
    );

  let completionRate =
    Math.min(
      100,
      Math.max(
        0,
        normalizeInteger(
          body.completionRate ??
            body.completion_rate,
          0
        )
      )
    );

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
  }

  return {
    id:
      normalizeOptionalText(
        body.id
      ) ??
      undefined,

    meetingId,

    agendaId:
      normalizeOptionalText(
        body.agendaId ??
          body.agenda_id
      ),

    firmId,

    localFirmId:
      normalizeNullableInteger(
        body.localFirmId ??
          body.local_firm_id
      ),

    syncKey:
      normalizeOptionalText(
        body.syncKey ??
          body.sync_key
      ) ??
      crypto.randomUUID(),

    decisionNo,

    title,

    description,

    responsiblePerson:
      normalizeOptionalText(
        body.responsiblePerson ??
          body.responsible_person
      ),

    responsibleDepartment:
      normalizeOptionalText(
        body.responsibleDepartment ??
          body.responsible_department
      ),

    priority:
      normalizeDecisionPriority(
        body.priority ??
          "NORMAL"
      ),

    decisionStatus,

    dueDateMillis:
      normalizePositiveMillis(
        body.dueDateMillis ??
          body.due_date_millis
      ),

    completedAtMillis,

    completionRate,

    completionNotes:
      normalizeOptionalText(
        body.completionNotes ??
          body.completion_notes ??
          body.completionNote ??
          body.completion_note
      ),

    voteResult:
      normalizeVoteResult(
        body.voteResult ??
          body.vote_result ??
          "NO_VOTE"
      ),

    yesVoteCount:
      Math.max(
        0,
        normalizeInteger(
          body.yesVoteCount ??
            body.yes_vote_count,
          0
        )
      ),

    noVoteCount:
      Math.max(
        0,
        normalizeInteger(
          body.noVoteCount ??
            body.no_vote_count,
          0
        )
      ),

    abstainVoteCount:
      Math.max(
        0,
        normalizeInteger(
          body.abstainVoteCount ??
            body.abstain_vote_count,
          0
        )
      ),

    relatedModule:
      normalizeOptionalText(
        body.relatedModule ??
          body.related_module
      ),

    relatedRecordId:
      normalizeOptionalText(
        body.relatedRecordId ??
          body.related_record_id
      ),

    source:
      (
        normalizeText(
          body.source ??
            "WEB"
        ) ||
        "WEB"
      ) as BoardDecisionSavePayload["source"],

    version:
      Math.max(
        1,
        normalizeInteger(
          body.version,
          1
        )
      ),
  };
}

/**
 * GET
 *
 * Toplantıya ait kararları listeler.
 *
 * Örnek:
 * /api/admin/documentation/board/decisions?meetingId=...
 */
export async function GET(
  request: NextRequest
) {
  try {
    const searchParams =
      request.nextUrl.searchParams;

    const meetingId =
      normalizeText(
        searchParams.get("meetingId")
      );

    const firmId =
      normalizeText(
        searchParams.get("firmId")
      );

    const agendaId =
      normalizeText(
        searchParams.get("agendaId")
      );

    const decisionStatus =
      normalizeText(
        searchParams.get(
          "decisionStatus"
        ) ??
          searchParams.get("status")
      ).toUpperCase();

    const priority =
      normalizeText(
        searchParams.get("priority")
      ).toUpperCase();

    const voteResult =
      normalizeText(
        searchParams.get("voteResult")
      ).toUpperCase();

    const overdue =
      normalizeBoolean(
        searchParams.get("overdue"),
        false
      );

    const includeDeleted =
      normalizeBoolean(
        searchParams.get(
          "includeDeleted"
        ),
        false
      );

    const search =
      sanitizeSearchValue(
        normalizeText(
          searchParams.get("search")
        )
      );

    if (!meetingId) {
      return jsonError(
        "meetingId parametresi zorunludur.",
        400
      );
    }

    const meeting =
      await loadMeeting(meetingId);

    if (!meeting) {
      return jsonError(
        "Kurul toplantısı bulunamadı.",
        404
      );
    }

    if (meeting.isDeleted) {
      return jsonError(
        "Silinmiş kurul toplantısının kararları görüntülenemez.",
        410
      );
    }

    if (
      firmId &&
      firmId !== meeting.firmId
    ) {
      return jsonError(
        "Firma bilgisi toplantıyla eşleşmiyor.",
        400
      );
    }

    if (
      decisionStatus &&
      !DECISION_STATUSES.includes(
        decisionStatus as BoardDecisionStatus
      )
    ) {
      return jsonError(
        "Geçersiz karar durumu.",
        400
      );
    }

    if (
      priority &&
      !DECISION_PRIORITIES.includes(
        priority as BoardDecisionPriority
      )
    ) {
      return jsonError(
        "Geçersiz karar önceliği.",
        400
      );
    }

    if (
      voteResult &&
      !VOTE_RESULTS.includes(
        voteResult as BoardVoteResult
      )
    ) {
      return jsonError(
        "Geçersiz oylama sonucu.",
        400
      );
    }

    if (agendaId) {
      const agendaItem =
        await loadAgendaItem(
          agendaId
        );

      if (!agendaItem) {
        return jsonError(
          "Gündem maddesi bulunamadı.",
          404
        );
      }

      if (agendaItem.isDeleted) {
        return jsonError(
          "Silinmiş gündem maddesine ait kararlar görüntülenemez.",
          410
        );
      }

      if (
        agendaItem.meetingId !==
        meetingId
      ) {
        return jsonError(
          "Gündem maddesi seçilen toplantıya ait değil.",
          400
        );
      }

      if (
        agendaItem.firmId !==
        meeting.firmId
      ) {
        return jsonError(
          "Gündem maddesinin firma bilgisi toplantıyla eşleşmiyor.",
          400
        );
      }
    }

    const supabase =
      createSupabaseAdmin();

    let query =
      supabase
        .from(BOARD_DECISIONS_TABLE)
        .select("*")
        .eq("meeting_id", meetingId)
        .eq("firm_id", meeting.firmId);

    if (!includeDeleted) {
      query =
        query.eq(
          "is_deleted",
          false
        );
    }

    if (agendaId) {
      query =
        query.eq(
          "agenda_id",
          agendaId
        );
    }

    if (decisionStatus) {
      query =
        query.eq(
          "decision_status",
          decisionStatus
        );
    }

    if (priority) {
      query =
        query.eq(
          "priority",
          priority
        );
    }

    if (voteResult) {
      query =
        query.eq(
          "vote_result",
          voteResult
        );
    }

    if (overdue) {
      query =
        query
          .lt(
            "due_date_millis",
            Date.now()
          )
          .not(
            "due_date_millis",
            "is",
            null
          )
          .not(
            "decision_status",
            "in",
            '("COMPLETED","CANCELLED")'
          );
    }

    if (search) {
      query =
        query.or(
          [
            `decision_no.ilike.%${search}%`,
            `title.ilike.%${search}%`,
            `description.ilike.%${search}%`,
            `responsible_person.ilike.%${search}%`,
            `responsible_department.ilike.%${search}%`,
            `completion_notes.ilike.%${search}%`,
            `related_module.ilike.%${search}%`,
          ].join(",")
        );
    }

    const { data, error } =
      await query
        .order(
          "decision_no",
          { ascending: true }
        )
        .order(
          "created_at_millis",
          { ascending: true }
        );

    if (error) {
      console.error(
        "Kurul kararları alınamadı:",
        error
      );

      return jsonError(
        "Kurul kararları alınamadı.",
        500,
        error.message
      );
    }

    const decisions =
      includeDeleted
        ? (data ?? []).map(
            mapBoardDecision
          )
        : mapBoardDecisions(
            data ?? []
          );

    const now = Date.now();

    const openCount =
      decisions.filter(
        (decision) =>
          decision.decisionStatus ===
            "OPEN" ||
          decision.decisionStatus ===
            "IN_PROGRESS"
      ).length;

    const completedCount =
      decisions.filter(
        (decision) =>
          decision.decisionStatus ===
          "COMPLETED"
      ).length;

    const postponedCount =
      decisions.filter(
        (decision) =>
          decision.decisionStatus ===
          "POSTPONED"
      ).length;

    const cancelledCount =
      decisions.filter(
        (decision) =>
          decision.decisionStatus ===
          "CANCELLED"
      ).length;

    const overdueCount =
      decisions.filter(
        (decision) =>
          decision.dueDateMillis !==
            null &&
          decision.dueDateMillis < now &&
          decision.decisionStatus !==
            "COMPLETED" &&
          decision.decisionStatus !==
            "CANCELLED"
      ).length;

    const criticalCount =
      decisions.filter(
        (decision) =>
          decision.priority ===
          "CRITICAL"
      ).length;

    return jsonSuccess({
      decisions,
      data: decisions,

      meetingId,
      firmId: meeting.firmId,

      count: decisions.length,

      counts: {
        total: decisions.length,
        open: openCount,
        completed: completedCount,
        postponed: postponedCount,
        cancelled: cancelledCount,
        overdue: overdueCount,
        critical: criticalCount,
      },
    });
  } catch (error) {
    console.error(
      "Kurul kararları GET hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul kararları alınırken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

/**
 * POST
 *
 * Yeni kurul kararı oluşturur.
 */
export async function POST(
  request: NextRequest
) {
  try {
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

    let payload:
      BoardDecisionSavePayload;

    try {
      payload =
        buildDecisionPayload(body);
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
        "Silinmiş kurul toplantısına karar eklenemez.",
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
          "Karara bağlanacak gündem maddesi bulunamadı.",
          404
        );
      }

      if (agendaItem.isDeleted) {
        return jsonError(
          "Silinmiş gündem maddesine karar eklenemez.",
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
      data: duplicateRecords,
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
        .limit(1);

    if (duplicateError) {
      console.error(
        "Kurul karar numarası kontrolü yapılamadı:",
        duplicateError
      );

      return jsonError(
        "Karar numarası kontrol edilemedi.",
        500,
        duplicateError.message
      );
    }

    if (
      duplicateRecords &&
      duplicateRecords.length > 0
    ) {
      return jsonError(
        `"${payload.decisionNo}" karar numarası bu toplantıda daha önce kullanılmış.`,
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

    databaseRecord.created_at_millis =
      now;

    databaseRecord.updated_at_millis =
      now;

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
        .insert(databaseRecord)
        .select("*")
        .single();

    if (error) {
      console.error(
        "Kurul kararı oluşturulamadı:",
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
        "Kurul kararı oluşturulamadı.",
        500,
        error.message
      );
    }

    if (!data) {
      return jsonError(
        "Karar oluşturuldu ancak kayıt bilgisi alınamadı.",
        500
      );
    }

    const decision =
      mapBoardDecision(data);

    return jsonSuccess(
      {
        message:
          "Kurul kararı başarıyla oluşturuldu.",

        decision,
        record: decision,
        data: decision,
      },
      201
    );
  } catch (error) {
    console.error(
      "Kurul kararı POST hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul kararı oluşturulurken beklenmeyen bir hata oluştu.",
      500
    );
  }
}