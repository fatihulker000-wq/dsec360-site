import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  mapBoardAgendaItem,
  mapBoardAgendaToDatabase,
} from "@/lib/documentation/board/mapper";

import type {
  BoardAgendaItem,
  BoardAgendaSavePayload,
} from "@/lib/documentation/board/types";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

export const runtime =
  "nodejs";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env
    .NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env
    .SUPABASE_SERVICE_ROLE_KEY;

const BOARD_AGENDA_TABLE =
  "documentation_board_agenda";

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

function hasOwn(
  body: UnknownRecord,
  ...keys: string[]
): boolean {
  return keys.some(
    (key) =>
      Object.prototype
        .hasOwnProperty
        .call(
          body,
          key
        )
  );
}

function readValue(
  body: UnknownRecord,
  ...keys: string[]
): unknown {
  for (
    const key of keys
  ) {
    if (
      Object.prototype
        .hasOwnProperty
        .call(
          body,
          key
        )
    ) {
      return body[key];
    }
  }

  return undefined;
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

async function loadAgendaItem(
  id: string
): Promise<BoardAgendaItem | null> {
  const supabase =
    createSupabaseAdmin();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        BOARD_AGENDA_TABLE
      )
      .select("*")
      .eq(
        "id",
        id
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

  return mapBoardAgendaItem(
    data
  );
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

function buildUpdatePayload(
  body: UnknownRecord,
  current: BoardAgendaItem
): BoardAgendaSavePayload {
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

  const itemNo =
    hasOwn(
      body,
      "itemNo",
      "item_no"
    )
      ? Math.max(
          1,
          normalizeInteger(
            readValue(
              body,
              "itemNo",
              "item_no"
            ),
            current.itemNo
          )
        )
      : current.itemNo;

  const title =
    hasOwn(
      body,
      "title"
    )
      ? normalizeText(
          readValue(
            body,
            "title"
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

  if (!title) {
    throw new Error(
      "Gündem başlığı zorunludur."
    );
  }

  return {
    id:
      current.id,

    meetingId,

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
          ) ||
          current.syncKey
        : current.syncKey,

    itemNo,

    title,

    description:
      hasOwn(
        body,
        "description"
      )
        ? normalizeOptionalText(
            readValue(
              body,
              "description"
            )
          )
        : current.description,

    presenter:
      hasOwn(
        body,
        "presenter"
      )
        ? normalizeOptionalText(
            readValue(
              body,
              "presenter"
            )
          )
        : current.presenter,

    durationMinutes:
      hasOwn(
        body,
        "durationMinutes",
        "duration_minutes"
      )
        ? normalizeNullableInteger(
            readValue(
              body,
              "durationMinutes",
              "duration_minutes"
            )
          )
        : current.durationMinutes,

    agendaStatus:
      (
        hasOwn(
          body,
          "agendaStatus",
          "agenda_status"
        )
          ? normalizeText(
              readValue(
                body,
                "agendaStatus",
                "agenda_status"
              )
            )
          : current.agendaStatus
      ) as BoardAgendaSavePayload["agendaStatus"],

    discussionNotes:
      hasOwn(
        body,
        "discussionNotes",
        "discussion_notes"
      )
        ? normalizeOptionalText(
            readValue(
              body,
              "discussionNotes",
              "discussion_notes"
            )
          )
        : current.discussionNotes,

    source:
      (
        hasOwn(
          body,
          "source"
        )
          ? normalizeText(
              readValue(
                body,
                "source"
              )
            )
          : current.source
      ) as BoardAgendaSavePayload["source"],

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
 * Tek gündem maddesini getirir.
 *
 * /api/admin/documentation/board/agenda/{id}
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
        "Gündem maddesi ID bilgisi zorunludur.",
        400
      );
    }

    const agendaItem =
      await loadAgendaItem(
        id
      );

    if (!agendaItem) {
      return jsonError(
        "Kurul gündem maddesi bulunamadı.",
        404
      );
    }

    if (
      agendaItem.isDeleted
    ) {
      return jsonError(
        "Kurul gündem maddesi silinmiş.",
        410
      );
    }

    return jsonSuccess({
      agendaItem,

      record:
        agendaItem,

      data:
        agendaItem,
    });
  } catch (error) {
    console.error(
      "Kurul gündem detayı GET hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul gündem maddesi alınırken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

/**
 * PATCH
 *
 * Mevcut gündem maddesini günceller.
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
        "Gündem maddesi ID bilgisi zorunludur.",
        400
      );
    }

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

    const current =
      await loadAgendaItem(
        id
      );

    if (!current) {
      return jsonError(
        "Kurul gündem maddesi bulunamadı.",
        404
      );
    }

    if (
      current.isDeleted
    ) {
      return jsonError(
        "Silinmiş kurul gündem maddesi güncellenemez.",
        409
      );
    }

    let payload:
      BoardAgendaSavePayload;

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

    if (
      meeting.isDeleted
    ) {
      return jsonError(
        "Silinmiş kurul toplantısına bağlı gündem maddesi güncellenemez.",
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
        .neq(
          "id",
          id
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

    delete databaseRecord.id;

    delete databaseRecord
      .created_at_millis;

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

    const {
      data,
      error,
    } =
      await supabase
        .from(
          BOARD_AGENDA_TABLE
        )
        .update(
          databaseRecord
        )
        .eq(
          "id",
          id
        )
        .eq(
          "is_deleted",
          false
        )
        .select("*")
        .single();

    if (error) {
      console.error(
        "Kurul gündem maddesi güncellenemedi:",
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
        "Kurul gündem maddesi güncellenemedi.",
        500,
        error.message
      );
    }

    if (!data) {
      return jsonError(
        "Gündem maddesi güncellendi ancak kayıt bilgisi alınamadı.",
        500
      );
    }

    const agendaItem =
      mapBoardAgendaItem(
        data
      );

    return jsonSuccess({
      message:
        "Kurul gündem maddesi başarıyla güncellendi.",

      agendaItem,

      record:
        agendaItem,

      data:
        agendaItem,
    });
  } catch (error) {
    console.error(
      "Kurul gündem PATCH hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul gündem maddesi güncellenirken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

/**
 * DELETE
 *
 * Gündem maddesini kalıcı olarak silmez.
 * Soft delete uygular.
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
        "Gündem maddesi ID bilgisi zorunludur.",
        400
      );
    }

    const current =
      await loadAgendaItem(
        id
      );

    if (!current) {
      return jsonError(
        "Kurul gündem maddesi bulunamadı.",
        404
      );
    }

    if (
      current.isDeleted
    ) {
      return jsonSuccess({
        message:
          "Kurul gündem maddesi daha önce silinmiş.",

        id,

        alreadyDeleted:
          true,
      });
    }

    const supabase =
      createSupabaseAdmin();

    /*
     * Bu gündeme bağlı kararlarda agenda_id bulunabilir.
     * Veritabanında foreign key ON DELETE SET NULL veya
     * soft delete yapısı olduğu için kararlar silinmez.
     */
    const now =
      Date.now();

    const {
      data,
      error,
    } =
      await supabase
        .from(
          BOARD_AGENDA_TABLE
        )
        .update({
          is_deleted:
            true,

          deleted_at_millis:
            now,

          updated_at_millis:
            now,

          version:
            Math.max(
              1,
              current.version + 1
            ),

          sync_status:
            "SYNCED",

          sync_error:
            null,

          last_synced_at_millis:
            now,
        })
        .eq(
          "id",
          id
        )
        .eq(
          "is_deleted",
          false
        )
        .select("*")
        .single();

    if (error) {
      console.error(
        "Kurul gündem maddesi silinemedi:",
        error
      );

      return jsonError(
        "Kurul gündem maddesi silinemedi.",
        500,
        error.message
      );
    }

    if (!data) {
      return jsonError(
        "Silinecek gündem maddesi bulunamadı.",
        404
      );
    }

    const agendaItem =
      mapBoardAgendaItem(
        data
      );

    return jsonSuccess({
      message:
        "Kurul gündem maddesi başarıyla silindi.",

      id,

      agendaItem,

      record:
        agendaItem,

      data:
        agendaItem,
    });
  } catch (error) {
    console.error(
      "Kurul gündem DELETE hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul gündem maddesi silinirken beklenmeyen bir hata oluştu.",
      500
    );
  }
}