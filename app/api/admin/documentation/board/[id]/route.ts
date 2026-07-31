import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  mapBoardMeeting,
  mapBoardMeetingToDatabase,
} from "@/lib/documentation/board/mapper";

import type {
  BoardMeeting,
  BoardMeetingSavePayload,
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

const BOARD_MEETINGS_TABLE =
  "documentation_board_meetings";

type UnknownRecord =
  Record<string, unknown>;

type RouteContext = {
  params:
    | Promise<{
        id: string;
      }>
    | {
        id: string;
      };
};

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

async function getRouteId(
  context: RouteContext
): Promise<string> {
  const params =
    await Promise.resolve(
      context.params
    );

  return normalizeText(
    params.id
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

    const dateMillis =
      new Date(
        trimmed
      ).getTime();

    return Number.isNaN(
      dateMillis
    )
      ? null
      : dateMillis;
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

function hasProperty(
  record: UnknownRecord,
  ...keys: string[]
): boolean {
  return keys.some((key) =>
    Object.prototype.hasOwnProperty.call(
      record,
      key
    )
  );
}

function readProperty(
  record: UnknownRecord,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(
        record,
        key
      )
    ) {
      return record[key];
    }
  }

  return undefined;
}

function buildUpdatePayload(
  body: UnknownRecord,
  current: BoardMeeting
): BoardMeetingSavePayload {
  const firmId =
    hasProperty(
      body,
      "firmId",
      "firm_id"
    )
      ? normalizeText(
          readProperty(
            body,
            "firmId",
            "firm_id"
          )
        )
      : current.firmId;

  const meetingNo =
    hasProperty(
      body,
      "meetingNo",
      "meeting_no"
    )
      ? normalizeText(
          readProperty(
            body,
            "meetingNo",
            "meeting_no"
          )
        )
      : current.meetingNo;

  const meetingTitle =
    hasProperty(
      body,
      "meetingTitle",
      "meeting_title"
    )
      ? normalizeText(
          readProperty(
            body,
            "meetingTitle",
            "meeting_title"
          )
        )
      : current.meetingTitle;

  const meetingDateMillis =
    hasProperty(
      body,
      "meetingDateMillis",
      "meeting_date_millis",
      "meetingDate",
      "meeting_date"
    )
      ? normalizePositiveMillis(
          readProperty(
            body,
            "meetingDateMillis",
            "meeting_date_millis",
            "meetingDate",
            "meeting_date"
          )
        )
      : current.meetingDateMillis;

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

  const localFirmId =
    hasProperty(
      body,
      "localFirmId",
      "local_firm_id"
    )
      ? normalizeNullableInteger(
          readProperty(
            body,
            "localFirmId",
            "local_firm_id"
          )
        )
      : current.localFirmId;

  const startTime =
    hasProperty(
      body,
      "startTime",
      "start_time"
    )
      ? normalizeOptionalText(
          readProperty(
            body,
            "startTime",
            "start_time"
          )
        )
      : current.startTime;

  const endTime =
    hasProperty(
      body,
      "endTime",
      "end_time"
    )
      ? normalizeOptionalText(
          readProperty(
            body,
            "endTime",
            "end_time"
          )
        )
      : current.endTime;

  const location =
    hasProperty(
      body,
      "location"
    )
      ? normalizeOptionalText(
          readProperty(
            body,
            "location"
          )
        )
      : current.location;

  const chairperson =
    hasProperty(
      body,
      "chairperson",
      "chair_person"
    )
      ? normalizeOptionalText(
          readProperty(
            body,
            "chairperson",
            "chair_person"
          )
        )
      : current.chairperson;

  const secretary =
    hasProperty(
      body,
      "secretary"
    )
      ? normalizeOptionalText(
          readProperty(
            body,
            "secretary"
          )
        )
      : current.secretary;

  const description =
    hasProperty(
      body,
      "description"
    )
      ? normalizeOptionalText(
          readProperty(
            body,
            "description"
          )
        )
      : current.description;

  const generalNotes =
    hasProperty(
      body,
      "generalNotes",
      "general_notes"
    )
      ? normalizeOptionalText(
          readProperty(
            body,
            "generalNotes",
            "general_notes"
          )
        )
      : current.generalNotes;

  const quorumRequired =
    hasProperty(
      body,
      "quorumRequired",
      "quorum_required"
    )
      ? Math.max(
          0,
          normalizeInteger(
            readProperty(
              body,
              "quorumRequired",
              "quorum_required"
            ),
            0
          )
        )
      : current.quorumRequired;

  const quorumReached =
    hasProperty(
      body,
      "quorumReached",
      "quorum_reached"
    )
      ? normalizeBoolean(
          readProperty(
            body,
            "quorumReached",
            "quorum_reached"
          ),
          false
        )
      : current.quorumReached;

  const signedMinutesAvailable =
    hasProperty(
      body,
      "signedMinutesAvailable",
      "signed_minutes_available"
    )
      ? normalizeBoolean(
          readProperty(
            body,
            "signedMinutesAvailable",
            "signed_minutes_available"
          ),
          false
        )
      : current.signedMinutesAvailable;

  return {
    id: current.id,

    firmId,

    localFirmId,

    syncKey:
      hasProperty(
        body,
        "syncKey",
        "sync_key"
      )
        ? normalizeText(
            readProperty(
              body,
              "syncKey",
              "sync_key"
            )
          ) ||
          current.syncKey
        : current.syncKey,

    meetingNo,

    meetingTitle,

    meetingType:
      (
        hasProperty(
          body,
          "meetingType",
          "meeting_type"
        )
          ? normalizeText(
              readProperty(
                body,
                "meetingType",
                "meeting_type"
              )
            )
          : current.meetingType
      ) as BoardMeetingSavePayload["meetingType"],

    meetingDateMillis,

    startTime,

    endTime,

    location,

    meetingMethod:
      (
        hasProperty(
          body,
          "meetingMethod",
          "meeting_method"
        )
          ? normalizeText(
              readProperty(
                body,
                "meetingMethod",
                "meeting_method"
              )
            )
          : current.meetingMethod
      ) as BoardMeetingSavePayload["meetingMethod"],

    chairperson,

    secretary,

    description,

    generalNotes,

    status:
      (
        hasProperty(
          body,
          "status"
        )
          ? normalizeText(
              readProperty(
                body,
                "status"
              )
            )
          : current.status
      ) as BoardMeetingSavePayload["status"],

    quorumRequired,

    quorumReached,

    signedMinutesAvailable,

    source:
      (
        hasProperty(
          body,
          "source"
        )
          ? normalizeText(
              readProperty(
                body,
                "source"
              )
            )
          : current.source
      ) as BoardMeetingSavePayload["source"],

    version: Math.max(
  1,
  current.version + 1
),
  };
}

async function loadMeetingById(
  id: string
): Promise<{
  meeting: BoardMeeting | null;
  error: string | null;
}> {
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
      .select("*")
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (error) {
    return {
      meeting: null,
      error: error.message,
    };
  }

  if (!data) {
    return {
      meeting: null,
      error: null,
    };
  }

  return {
    meeting:
      mapBoardMeeting(
        data
      ),
    error: null,
  };
}

/**
 * GET
 *
 * Tek kurul toplantısını getirir.
 *
 * GET:
 * /api/admin/documentation/board/{id}
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const id =
      await getRouteId(
        context
      );

    if (!id) {
      return jsonError(
        "Toplantı ID bilgisi zorunludur.",
        400
      );
    }

    const {
      meeting,
      error,
    } =
      await loadMeetingById(
        id
      );

    if (error) {
      console.error(
        "Kurul toplantısı alınamadı:",
        error
      );

      return jsonError(
        "Kurul toplantısı alınamadı.",
        500,
        error
      );
    }

    if (!meeting) {
      return jsonError(
        "Kurul toplantısı bulunamadı.",
        404
      );
    }

    return jsonSuccess({
      meeting,
      record: meeting,
      data: meeting,
    });
  } catch (error) {
    console.error(
      "Kurul toplantısı GET detay hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul toplantısı alınırken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

/**
 * PATCH
 *
 * Kurul toplantısını günceller.
 *
 * PATCH:
 * /api/admin/documentation/board/{id}
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const id =
      await getRouteId(
        context
      );

    if (!id) {
      return jsonError(
        "Toplantı ID bilgisi zorunludur.",
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

    const {
      meeting: currentMeeting,
      error: currentError,
    } =
      await loadMeetingById(
        id
      );

    if (currentError) {
      console.error(
        "Güncellenecek kurul toplantısı alınamadı:",
        currentError
      );

      return jsonError(
        "Güncellenecek kurul toplantısı alınamadı.",
        500,
        currentError
      );
    }

    if (!currentMeeting) {
      return jsonError(
        "Güncellenecek kurul toplantısı bulunamadı.",
        404
      );
    }

    if (
      currentMeeting.isDeleted
    ) {
      return jsonError(
        "Silinmiş kurul toplantısı güncellenemez.",
        409
      );
    }

    let payload:
      BoardMeetingSavePayload;

    try {
      payload =
        buildUpdatePayload(
          body,
          currentMeeting
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

    /*
     * Aynı firmada aynı toplantı numarası
     * başka bir aktif kayıtta kullanılıyor mu?
     */
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
        .neq(
          "id",
          id
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
        `"${payload.meetingNo}" toplantı numarası bu firma için başka bir toplantıda kullanılıyor.`,
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
     * ID değiştirilemez.
     */
    delete databaseRecord.id;

    /*
     * Oluşturma tarihi korunur.
     */
    delete databaseRecord
      .created_at_millis;

    /*
     * Sayaçlar katılımcı ve karar tablolarının
     * trigger fonksiyonları tarafından yönetilir.
     */
    delete databaseRecord
      .participant_count;

    delete databaseRecord
      .decision_count;

    delete databaseRecord
      .open_decision_count;

    databaseRecord
      .updated_at_millis =
      Date.now();

    databaseRecord
      .version =
      Math.max(
        1,
        currentMeeting.version +
          1
      );

    const {
      data,
      error,
    } =
      await supabase
        .from(
          BOARD_MEETINGS_TABLE
        )
        .update(
          databaseRecord
        )
        .eq(
          "id",
          id
        )
        .select("*")
        .single();

    if (error) {
      console.error(
        "Kurul toplantısı güncellenemedi:",
        error
      );

      if (
        error.code ===
        "23505"
      ) {
        return jsonError(
          "Aynı toplantı numarası veya senkronizasyon anahtarıyla başka bir kayıt mevcut.",
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

      return jsonError(
        "Kurul toplantısı güncellenemedi.",
        500,
        error.message
      );
    }

    if (!data) {
      return jsonError(
        "Kurul toplantısı güncellendi ancak kayıt bilgisi alınamadı.",
        500
      );
    }

    const meeting =
      mapBoardMeeting(
        data
      );

    return jsonSuccess({
      message:
        "Kurul toplantısı başarıyla güncellendi.",

      meeting,

      record: meeting,

      data: meeting,
    });
  } catch (error) {
    console.error(
      "Kurul toplantısı PATCH hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul toplantısı güncellenirken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

/**
 * DELETE
 *
 * Kurul toplantısını fiziksel olarak silmez.
 * is_deleted=true yaparak arşivler.
 *
 * DELETE:
 * /api/admin/documentation/board/{id}
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const id =
      await getRouteId(
        context
      );

    if (!id) {
      return jsonError(
        "Toplantı ID bilgisi zorunludur.",
        400
      );
    }

    const {
      meeting: currentMeeting,
      error: currentError,
    } =
      await loadMeetingById(
        id
      );

    if (currentError) {
      console.error(
        "Silinecek kurul toplantısı alınamadı:",
        currentError
      );

      return jsonError(
        "Silinecek kurul toplantısı alınamadı.",
        500,
        currentError
      );
    }

    if (!currentMeeting) {
      return jsonError(
        "Silinecek kurul toplantısı bulunamadı.",
        404
      );
    }

    if (
      currentMeeting.isDeleted
    ) {
      return jsonSuccess({
        message:
          "Kurul toplantısı daha önce silinmiş.",

        id,

        deleted: true,
      });
    }

    const now =
      Date.now();

    const supabase =
      createSupabaseAdmin();
// Toplantıya bağlı tüm kayıtları da pasife çek
await Promise.all([
  supabase
    .from("documentation_board_participants")
    .delete()
    .eq("meeting_id", id),

  supabase
    .from("documentation_board_decisions")
    .delete()
    .eq("meeting_id", id),

  supabase
    .from("documentation_board_agenda")
    .delete()
    .eq("meeting_id", id),
]);
    const {
      data,
      error,
    } =
      await supabase
        .from(
          BOARD_MEETINGS_TABLE
        )
        .update({
          is_deleted: true,
          deleted_at_millis:
            now,
          updated_at_millis:
            now,
          sync_status:
            "SYNCED",
          sync_error: null,
          last_synced_at_millis:
            now,
          version:
            Math.max(
              1,
              currentMeeting.version +
                1
            ),
        })
        .eq(
          "id",
          id
        )
        .select("*")
        .single();

    if (error) {
      console.error(
        "Kurul toplantısı silinemedi:",
        error
      );

      return jsonError(
        "Kurul toplantısı silinemedi.",
        500,
        error.message
      );
    }

    if (!data) {
      return jsonError(
        "Kurul toplantısı silindi ancak kayıt bilgisi alınamadı.",
        500
      );
    }

    const meeting =
      mapBoardMeeting(
        data
      );

    return jsonSuccess({
      message:
        "Kurul toplantısı başarıyla silindi.",

      id,

      deleted: true,

      meeting,

      record: meeting,

      data: meeting,
    });
  } catch (error) {
    console.error(
      "Kurul toplantısı DELETE hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul toplantısı silinirken beklenmeyen bir hata oluştu.",
      500
    );
  }
}