import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  mapBoardAgendaItem,
  mapBoardAgendaItems,
  mapBoardAgendaToDatabase,
} from "@/lib/documentation/board/mapper";

import type {
  BoardAgendaSavePayload,
} from "@/lib/documentation/board/types";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

export const runtime =
  "nodejs";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

const BOARD_AGENDA_TABLE =
  "documentation_board_agenda";

const BOARD_MEETINGS_TABLE =
  "documentation_board_meetings";

type UnknownRecord =
  Record<string, unknown>;

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
        ? {
            details,
          }
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
  return String(
    value ?? ""
  ).trim();
}

function normalizeOptionalText(
  value: unknown
): string | null {
  const normalized =
    normalizeText(value);

  return normalized || null;
}

function normalizeInteger(
  value: unknown,
  fallback = 0
): number {
  const normalized =
    Number(value);

  if (
    !Number.isFinite(
      normalized
    )
  ) {
    return fallback;
  }

  return Math.trunc(
    normalized
  );
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

  const normalized =
    Number(value);

  if (
    !Number.isFinite(
      normalized
    )
  ) {
    return null;
  }

  return Math.trunc(
    normalized
  );
}

function removeUndefinedValues(
  input: Record<
    string,
    unknown
  >
): Record<
  string,
  unknown
> {
  return Object.fromEntries(
    Object.entries(
      input
    ).filter(
      (
        [, value]
      ) =>
        value !==
        undefined
    )
  );
}

function sanitizeSearchValue(
  value: string
): string {
  return value
    .replace(
      /[%_,().]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .slice(0, 100);
}

async function loadMeeting(
  meetingId: string
): Promise<{
  id: string;
  firmId: string;
  isDeleted: boolean;
} | null> {
  const supabase =
    createSupabaseAdmin();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        BOARD_MEETINGS_TABLE
      )
      .select(
        "id, firm_id, is_deleted"
      )
      .eq(
        "id",
        meetingId
      )
      .maybeSingle();

  if (error) {
    throw new Error(
      error.message
    );
  }

  if (!data) {
    return null;
  }

  return {
    id:
      normalizeText(
        data.id
      ),

    firmId:
      normalizeText(
        data.firm_id
      ),

    isDeleted:
      Boolean(
        data.is_deleted
      ),
  };
}

function buildAgendaPayload(
  body: UnknownRecord
): BoardAgendaSavePayload {
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

  const itemNo =
    Math.max(
      1,
      normalizeInteger(
        body.itemNo ??
          body.item_no,
        1
      )
    );

  const title =
    normalizeText(
      body.title
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

  if (!title) {
    throw new Error(
      "Gündem başlığı zorunludur."
    );
  }

  return {
    id:
      normalizeOptionalText(
        body.id
      ) ??
      undefined,

    meetingId,

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

    itemNo,

    title,

    description:
      normalizeOptionalText(
        body.description
      ),

    presenter:
      normalizeOptionalText(
        body.presenter
      ),

    durationMinutes:
      normalizeNullableInteger(
        body.durationMinutes ??
          body.duration_minutes
      ),

    agendaStatus:
      (
        normalizeText(
          body.agendaStatus ??
            body.agenda_status ??
            "PENDING"
        ) ||
        "PENDING"
      ) as BoardAgendaSavePayload["agendaStatus"],

    discussionNotes:
      normalizeOptionalText(
        body.discussionNotes ??
          body.discussion_notes
      ),

    source:
      (
        normalizeText(
          body.source ??
            "WEB"
        ) ||
        "WEB"
      ) as BoardAgendaSavePayload["source"],

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
 * Toplantıya ait gündem maddelerini listeler.
 *
 * Örnek:
 *
 * /api/admin/documentation/board/agenda?meetingId=...
 *
 * Ek filtreler:
 *
 * status=PENDING
 * search=yangın
 * includeDeleted=true
 */
export async function GET(
  request: NextRequest
) {
  try {
    const searchParams =
      request.nextUrl
        .searchParams;

    const meetingId =
      normalizeText(
        searchParams.get(
          "meetingId"
        )
      );

    const status =
      normalizeText(
        searchParams.get(
          "status"
        )
      ).toUpperCase();

    const search =
      sanitizeSearchValue(
        normalizeText(
          searchParams.get(
            "search"
          )
        )
      );

    const includeDeleted =
      normalizeText(
        searchParams.get(
          "includeDeleted"
        )
      ).toLowerCase() ===
      "true";

    if (!meetingId) {
      return jsonError(
        "meetingId parametresi zorunludur.",
        400
      );
    }

    const meeting =
      await loadMeeting(
        meetingId
      );

    if (!meeting) {
      return jsonError(
        "Kurul toplantısı bulunamadı.",
        404
      );
    }

    if (meeting.isDeleted) {
      return jsonError(
        "Silinmiş kurul toplantısının gündem maddeleri görüntülenemez.",
        410
      );
    }

    const supabase =
      createSupabaseAdmin();

    let query =
      supabase
        .from(
          BOARD_AGENDA_TABLE
        )
        .select("*")
        .eq(
          "meeting_id",
          meetingId
        )
        .eq(
          "firm_id",
          meeting.firmId
        );

    if (!includeDeleted) {
      query =
        query.eq(
          "is_deleted",
          false
        );
    }

    if (status) {
      query =
        query.eq(
          "agenda_status",
          status
        );
    }

    if (search) {
      query =
        query.or(
          [
            `title.ilike.%${search}%`,
            `description.ilike.%${search}%`,
            `presenter.ilike.%${search}%`,
            `discussion_notes.ilike.%${search}%`,
          ].join(",")
        );
    }

    const {
      data,
      error,
    } =
      await query
        .order(
          "item_no",
          {
            ascending: true,
          }
        )
        .order(
          "created_at_millis",
          {
            ascending: true,
          }
        );

    if (error) {
      console.error(
        "Kurul gündem maddeleri alınamadı:",
        error
      );

      return jsonError(
        "Kurul gündem maddeleri alınamadı.",
        500,
        error.message
      );
    }

    const agenda =
      includeDeleted
        ? (
            data ?? []
          ).map(
            mapBoardAgendaItem
          )
        : mapBoardAgendaItems(
            data ?? []
          );

    return jsonSuccess({
      agenda,

      data:
        agenda,

      meetingId,

      count:
        agenda.length,
    });
  } catch (error) {
    console.error(
      "Kurul gündem GET hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul gündem maddeleri alınırken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

/**
 * POST
 *
 * Yeni gündem maddesi oluşturur.
 */
export async function POST(
  request: NextRequest
) {
  try {
    let body:
      UnknownRecord;

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
      BoardAgendaSavePayload;

    try {
      payload =
        buildAgendaPayload(
          body
        );
    } catch (error) {
      return jsonError(
        error instanceof Error
          ? error.message
          : "Gündem maddesi bilgileri geçersiz.",
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
        "Silinmiş kurul toplantısına gündem maddesi eklenemez.",
        409
      );
    }

    if (
      meeting.firmId !==
      payload.firmId
    ) {
      return jsonError(
        "Gündem maddesinin firma bilgisi toplantıyla eşleşmiyor.",
        400
      );
    }

    const supabase =
      createSupabaseAdmin();

    /*
     * Aynı toplantıda aynı madde numarası
     * tekrar kullanılamaz.
     */
    const {
      data:
        duplicateRows,
      error:
        duplicateError,
    } =
      await supabase
        .from(
          BOARD_AGENDA_TABLE
        )
        .select(
          "id, item_no"
        )
        .eq(
          "meeting_id",
          payload.meetingId
        )
        .eq(
          "item_no",
          payload.itemNo
        )
        .eq(
          "is_deleted",
          false
        )
        .limit(1);

    if (duplicateError) {
      console.error(
        "Gündem madde numarası kontrol edilemedi:",
        duplicateError
      );

      return jsonError(
        "Gündem madde numarası kontrol edilemedi.",
        500,
        duplicateError.message
      );
    }

    if (
      duplicateRows &&
      duplicateRows.length >
        0
    ) {
      return jsonError(
        `${payload.itemNo} numaralı gündem maddesi bu toplantıda zaten mevcut.`,
        409
      );
    }

    const databaseRecord =
      removeUndefinedValues(
        mapBoardAgendaToDatabase(
          payload
        )
      );

    const now =
      Date.now();

    databaseRecord
      .created_at_millis =
      now;

    databaseRecord
      .updated_at_millis =
      now;

    databaseRecord
      .is_deleted =
      false;

    databaseRecord
      .deleted_at_millis =
      null;

    databaseRecord
      .sync_status =
      "SYNCED";

    databaseRecord
      .sync_error =
      null;

    databaseRecord
      .last_synced_at_millis =
      now;

    const {
      data,
      error,
    } =
      await supabase
        .from(
          BOARD_AGENDA_TABLE
        )
        .insert(
          databaseRecord
        )
        .select("*")
        .single();

    if (error) {
      console.error(
        "Kurul gündem maddesi oluşturulamadı:",
        error
      );

      if (
        error.code ===
        "23505"
      ) {
        return jsonError(
          "Aynı madde numarası veya senkronizasyon anahtarıyla kayıt zaten mevcut.",
          409,
          error.message
        );
      }

      if (
        error.code ===
        "23503"
      ) {
        return jsonError(
          "Toplantı veya firma bilgisi geçersiz.",
          400,
          error.message
        );
      }

      return jsonError(
        "Kurul gündem maddesi oluşturulamadı.",
        500,
        error.message
      );
    }

    if (!data) {
      return jsonError(
        "Gündem maddesi oluşturuldu ancak kayıt bilgisi alınamadı.",
        500
      );
    }

    const agendaItem =
      mapBoardAgendaItem(
        data
      );

    return jsonSuccess(
      {
        message:
          "Kurul gündem maddesi başarıyla oluşturuldu.",

        agendaItem,

        record:
          agendaItem,

        data:
          agendaItem,
      },
      201
    );
  } catch (error) {
    console.error(
      "Kurul gündem POST hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul gündem maddesi oluşturulurken beklenmeyen bir hata oluştu.",
      500
    );
  }
}