import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  mapBoardMeeting,
  mapBoardMeetings,
  mapBoardMeetingToDatabase,
} from "@/lib/documentation/board/mapper";

import type {
  BoardMeetingSavePayload,
} from "@/lib/documentation/board/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

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

function normalizeBoolean(
  value: unknown,
  fallback = false
): boolean {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    typeof value === "number"
  ) {
    return value !== 0;
  }

  if (
    typeof value === "string"
  ) {
    const normalized =
      value
        .trim()
        .toLocaleLowerCase(
          "tr-TR"
        );

    if (
      [
        "true",
        "1",
        "yes",
        "evet",
        "aktif",
      ].includes(normalized)
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
        "pasif",
      ].includes(normalized)
    ) {
      return false;
    }
  }

  return fallback;
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

  if (
    typeof value === "string"
  ) {
    const trimmed =
      value.trim();

    if (!trimmed) {
      return null;
    }

    const numeric =
      Number(trimmed);

    if (
      Number.isFinite(
        numeric
      ) &&
      numeric > 0
    ) {
      return Math.trunc(
        numeric
      );
    }

    const parsed =
      new Date(
        trimmed
      ).getTime();

    return Number.isNaN(parsed)
      ? null
      : parsed;
  }

  const normalized =
    Number(value);

  if (
    !Number.isFinite(
      normalized
    ) ||
    normalized <= 0
  ) {
    return null;
  }

  return Math.trunc(
    normalized
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

function normalizeYear(
  value: unknown
): number | null {
  const normalized =
    Number(value);

  if (
    !Number.isInteger(
      normalized
    ) ||
    normalized < 2000 ||
    normalized > 2200
  ) {
    return null;
  }

  return normalized;
}

function buildMeetingPayload(
  body: UnknownRecord
): BoardMeetingSavePayload {
  const firmId =
    normalizeText(
      body.firmId ??
        body.firm_id
    );

  const meetingNo =
    normalizeText(
      body.meetingNo ??
        body.meeting_no
    );

  const meetingTitle =
    normalizeText(
      body.meetingTitle ??
        body.meeting_title
    );

  const meetingDateMillis =
    normalizePositiveMillis(
      body.meetingDateMillis ??
        body.meeting_date_millis ??
        body.meetingDate ??
        body.meeting_date
    );

  if (!firmId) {
    throw new Error(
      "Firma bilgisi zorunludur."
    );
  }

  if (!meetingNo) {
    throw new Error(
      "Toplantı numarası zorunludur."
    );
  }

  if (!meetingTitle) {
    throw new Error(
      "Toplantı başlığı zorunludur."
    );
  }

  if (!meetingDateMillis) {
    throw new Error(
      "Geçerli bir toplantı tarihi seçilmelidir."
    );
  }

  return {
    id:
      normalizeOptionalText(
        body.id
      ) ??
      undefined,

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

    meetingNo,

    meetingTitle,

    meetingType:
      (
        normalizeText(
          body.meetingType ??
            body.meeting_type ??
            "ORDINARY"
        ) ||
        "ORDINARY"
      ) as BoardMeetingSavePayload["meetingType"],

    meetingDateMillis,

    startTime:
      normalizeOptionalText(
        body.startTime ??
          body.start_time
      ),

    endTime:
      normalizeOptionalText(
        body.endTime ??
          body.end_time
      ),

    location:
      normalizeOptionalText(
        body.location
      ),

    meetingMethod:
      (
        normalizeText(
          body.meetingMethod ??
            body.meeting_method ??
            "FACE_TO_FACE"
        ) ||
        "FACE_TO_FACE"
      ) as BoardMeetingSavePayload["meetingMethod"],

    chairperson:
      normalizeOptionalText(
        body.chairperson ??
          body.chair_person
      ),

    secretary:
      normalizeOptionalText(
        body.secretary
      ),

    description:
      normalizeOptionalText(
        body.description
      ),

    generalNotes:
      normalizeOptionalText(
        body.generalNotes ??
          body.general_notes
      ),

    status:
      (
        normalizeText(
          body.status ??
            "DRAFT"
        ) ||
        "DRAFT"
      ) as BoardMeetingSavePayload["status"],

    quorumRequired:
      Math.max(
        0,
        normalizeInteger(
          body.quorumRequired ??
            body.quorum_required,
          0
        )
      ),

    quorumReached:
      normalizeBoolean(
        body.quorumReached ??
          body.quorum_reached,
        false
      ),

    signedMinutesAvailable:
      normalizeBoolean(
        body.signedMinutesAvailable ??
          body.signed_minutes_available,
        false
      ),

    source:
      (
        normalizeText(
          body.source ??
            "WEB"
        ) ||
        "WEB"
      ) as BoardMeetingSavePayload["source"],

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
 * Kurul toplantılarını firmaya göre listeler.
 *
 * Örnek:
 * /api/admin/documentation/board?firmId=11
 *
 * Opsiyonel filtreler:
 * status=PLANNED
 * search=temmuz
 * year=2026
 * includeDeleted=true
 */
export async function GET(
  request: NextRequest
) {
  try {
    const searchParams =
      request.nextUrl
        .searchParams;

    const firmId =
      normalizeText(
        searchParams.get(
          "firmId"
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

    const year =
      normalizeYear(
        searchParams.get(
          "year"
        )
      );

    const includeDeleted =
      normalizeBoolean(
        searchParams.get(
          "includeDeleted"
        ),
        false
      );

    if (!firmId) {
      return jsonError(
        "firmId parametresi zorunludur.",
        400
      );
    }

    const supabase =
      createSupabaseAdmin();

    let query =
      supabase
        .from(
          BOARD_MEETINGS_TABLE
        )
        .select("*")
        .eq(
          "firm_id",
          firmId
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
          "status",
          status
        );
    }

    if (year) {
      const startMillis =
        new Date(
          year,
          0,
          1,
          0,
          0,
          0,
          0
        ).getTime();

      const endMillis =
        new Date(
          year + 1,
          0,
          1,
          0,
          0,
          0,
          0
        ).getTime();

      query =
        query
          .gte(
            "meeting_date_millis",
            startMillis
          )
          .lt(
            "meeting_date_millis",
            endMillis
          );
    }

    if (search) {
      query =
        query.or(
          [
            `meeting_title.ilike.%${search}%`,
            `meeting_no.ilike.%${search}%`,
            `location.ilike.%${search}%`,
            `chairperson.ilike.%${search}%`,
            `secretary.ilike.%${search}%`,
          ].join(",")
        );
    }

    const {
      data,
      error,
    } =
      await query.order(
        "meeting_date_millis",
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        "Kurul toplantıları alınamadı:",
        error
      );

      return jsonError(
        "Kurul toplantıları alınamadı.",
        500,
        error.message
      );
    }

    const meetings =
      includeDeleted
        ? (
            data ?? []
          ).map(
            mapBoardMeeting
          )
        : mapBoardMeetings(
            data ?? []
          );

    return jsonSuccess({
      meetings,
      data:
        meetings,
      records:
        meetings,
      count:
        meetings.length,
      firmId,
    });
  } catch (error) {
    console.error(
      "Kurul toplantıları GET hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul toplantıları alınırken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

/**
 * POST
 *
 * Yeni kurul toplantısı oluşturur.
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
      BoardMeetingSavePayload;

    try {
      payload =
        buildMeetingPayload(
          body
        );
    } catch (error) {
      return jsonError(
        error instanceof Error
          ? error.message
          : "Toplantı bilgileri geçersiz.",
        400
      );
    }

    const supabase =
      createSupabaseAdmin();

    const {
      data:
        duplicateRecords,
      error:
        duplicateError,
    } =
      await supabase
        .from(
          BOARD_MEETINGS_TABLE
        )
        .select(
          "id, meeting_no"
        )
        .eq(
          "firm_id",
          payload.firmId
        )
        .eq(
          "meeting_no",
          payload.meetingNo
        )
        .eq(
          "is_deleted",
          false
        )
        .limit(1);

    if (duplicateError) {
      console.error(
        "Toplantı numarası kontrol edilemedi:",
        duplicateError
      );

      return jsonError(
        "Toplantı numarası kontrol edilemedi.",
        500,
        duplicateError.message
      );
    }

    if (
      duplicateRecords &&
      duplicateRecords.length >
        0
    ) {
      return jsonError(
        `"${payload.meetingNo}" toplantı numarası bu firma için daha önce kullanılmış.`,
        409
      );
    }

    const databaseRecord =
      removeUndefinedValues(
        mapBoardMeetingToDatabase(
          payload
        )
      );

    /*
     * Bu sayaçlar katılımcı ve karar tablolarındaki
     * trigger fonksiyonları tarafından yönetilir.
     */
    delete databaseRecord
      .participant_count;

    delete databaseRecord
      .decision_count;

    delete databaseRecord
      .open_decision_count;

    const now =
      Date.now();

    databaseRecord
      .created_at_millis =
      normalizePositiveMillis(
        databaseRecord
          .created_at_millis
      ) ?? now;

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
          BOARD_MEETINGS_TABLE
        )
        .insert(
          databaseRecord
        )
        .select("*")
        .single();

    if (error) {
      console.error(
        "Kurul toplantısı oluşturulamadı:",
        error
      );

      if (
        error.code ===
        "23505"
      ) {
        return jsonError(
          "Aynı toplantı numarası veya senkronizasyon anahtarıyla kayıt zaten mevcut.",
          409,
          error.message
        );
      }

      if (
        error.code ===
        "23503"
      ) {
        return jsonError(
          "Firma veya ilişkili kayıt bilgisi geçersiz.",
          400,
          error.message
        );
      }

      if (
        error.code ===
        "23514"
      ) {
        return jsonError(
          "Toplantı türü, yöntemi veya durumu geçersiz.",
          400,
          error.message
        );
      }

      return jsonError(
        "Kurul toplantısı oluşturulamadı.",
        500,
        error.message
      );
    }

    if (!data) {
      return jsonError(
        "Toplantı oluşturuldu ancak kayıt bilgisi alınamadı.",
        500
      );
    }

    const meeting =
      mapBoardMeeting(
        data
      );

    return jsonSuccess(
      {
        message:
          "Kurul toplantısı başarıyla oluşturuldu.",

        meeting,

        record:
          meeting,

        data:
          meeting,
      },
      201
    );
  } catch (error) {
    console.error(
      "Kurul toplantısı POST hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul toplantısı oluşturulurken beklenmeyen bir hata oluştu.",
      500
    );
  }
}