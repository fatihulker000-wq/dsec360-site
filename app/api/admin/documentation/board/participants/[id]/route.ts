import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  mapBoardParticipant,
  mapBoardParticipantToDatabase,
} from "@/lib/documentation/board/mapper";

import type {
  BoardAttendanceStatus,
  BoardParticipant,
  BoardParticipantRole,
  BoardParticipantSavePayload,
  BoardSignatureStatus,
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

const BOARD_PARTICIPANTS_TABLE =
  "documentation_board_participants";

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

type MeetingReference = {
  id: string;
  firmId: string;
  isDeleted: boolean;
};

const PARTICIPANT_ROLES:
  BoardParticipantRole[] = [
    "CHAIRPERSON",
    "SECRETARY",
    "MEMBER",
    "EMPLOYER_REPRESENTATIVE",
    "OHS_SPECIALIST",
    "WORKPLACE_PHYSICIAN",
    "EMPLOYEE_REPRESENTATIVE",
    "SUPPORT_PERSONNEL",
    "GUEST",
    "OTHER",
  ];

const ATTENDANCE_STATUSES:
  BoardAttendanceStatus[] = [
    "INVITED",
    "ATTENDED",
    "ABSENT",
    "EXCUSED",
    "ONLINE",
  ];

const SIGNATURE_STATUSES:
  BoardSignatureStatus[] = [
    "NOT_REQUIRED",
    "NOT_SIGNED",
    "SIGNED",
    "DIGITALLY_SIGNED",
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

function normalizeParticipantRole(
  value: unknown,
  fallback:
    BoardParticipantRole =
      "MEMBER"
): BoardParticipantRole {
  const normalized =
    normalizeText(
      value
    ).toUpperCase();

  return PARTICIPANT_ROLES.includes(
    normalized as BoardParticipantRole
  )
    ? (
        normalized as BoardParticipantRole
      )
    : fallback;
}

function normalizeAttendanceStatus(
  value: unknown,
  fallback:
    BoardAttendanceStatus =
      "INVITED"
): BoardAttendanceStatus {
  const normalized =
    normalizeText(
      value
    ).toUpperCase();

  return ATTENDANCE_STATUSES.includes(
    normalized as BoardAttendanceStatus
  )
    ? (
        normalized as BoardAttendanceStatus
      )
    : fallback;
}

function normalizeSignatureStatus(
  value: unknown,
  fallback:
    BoardSignatureStatus =
      "NOT_SIGNED"
): BoardSignatureStatus {
  const normalized =
    normalizeText(
      value
    ).toUpperCase();

  return SIGNATURE_STATUSES.includes(
    normalized as BoardSignatureStatus
  )
    ? (
        normalized as BoardSignatureStatus
      )
    : fallback;
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

async function loadParticipant(
  id: string
): Promise<BoardParticipant | null> {
  const supabase =
    createSupabaseAdmin();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        BOARD_PARTICIPANTS_TABLE
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

  return mapBoardParticipant(
    data
  );
}

async function loadMeeting(
  meetingId: string
): Promise<MeetingReference | null> {
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
  current: BoardParticipant
): BoardParticipantSavePayload {
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

  const fullName =
    hasOwn(
      body,
      "fullName",
      "full_name"
    )
      ? normalizeText(
          readValue(
            body,
            "fullName",
            "full_name"
          )
        )
      : current.fullName;

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

  if (!fullName) {
    throw new Error(
      "Katılımcının adı ve soyadı zorunludur."
    );
  }

  const attendanceStatus =
    hasOwn(
      body,
      "attendanceStatus",
      "attendance_status"
    )
      ? normalizeAttendanceStatus(
          readValue(
            body,
            "attendanceStatus",
            "attendance_status"
          ),
          current.attendanceStatus
        )
      : current.attendanceStatus;

  let signatureStatus =
    hasOwn(
      body,
      "signatureStatus",
      "signature_status"
    )
      ? normalizeSignatureStatus(
          readValue(
            body,
            "signatureStatus",
            "signature_status"
          ),
          current.signatureStatus
        )
      : current.signatureStatus;

  let signedAtMillis =
    hasOwn(
      body,
      "signedAtMillis",
      "signed_at_millis"
    )
      ? normalizePositiveMillis(
          readValue(
            body,
            "signedAtMillis",
            "signed_at_millis"
          )
        )
      : current.signedAtMillis;

  if (
    attendanceStatus ===
      "ABSENT" ||
    attendanceStatus ===
      "EXCUSED"
  ) {
    signatureStatus =
      "NOT_REQUIRED";

    signedAtMillis =
      null;
  }

  if (
    signatureStatus ===
    "NOT_REQUIRED"
  ) {
    signedAtMillis =
      null;
  }

  if (
    signatureStatus ===
    "NOT_SIGNED"
  ) {
    signedAtMillis =
      null;
  }

  if (
    (
      signatureStatus ===
        "SIGNED" ||
      signatureStatus ===
        "DIGITALLY_SIGNED"
    ) &&
    !signedAtMillis
  ) {
    signedAtMillis =
      Date.now();
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

    employeeId:
      hasOwn(
        body,
        "employeeId",
        "employee_id"
      )
        ? normalizeOptionalText(
            readValue(
              body,
              "employeeId",
              "employee_id"
            )
          )
        : current.employeeId,

    employeeLocalId:
      hasOwn(
        body,
        "employeeLocalId",
        "employee_local_id"
      )
        ? normalizeNullableInteger(
            readValue(
              body,
              "employeeLocalId",
              "employee_local_id"
            )
          )
        : current.employeeLocalId,

    fullName,

    title:
      hasOwn(
        body,
        "title"
      )
        ? normalizeOptionalText(
            readValue(
              body,
              "title"
            )
          )
        : current.title,

    department:
      hasOwn(
        body,
        "department"
      )
        ? normalizeOptionalText(
            readValue(
              body,
              "department"
            )
          )
        : current.department,

    participantRole:
      hasOwn(
        body,
        "participantRole",
        "participant_role"
      )
        ? normalizeParticipantRole(
            readValue(
              body,
              "participantRole",
              "participant_role"
            ),
            current.participantRole
          )
        : current.participantRole,

    attendanceStatus,

    signatureStatus,

    signedAtMillis,

    email:
      hasOwn(
        body,
        "email"
      )
        ? normalizeOptionalText(
            readValue(
              body,
              "email"
            )
          )
        : current.email,

    phone:
      hasOwn(
        body,
        "phone"
      )
        ? normalizeOptionalText(
            readValue(
              body,
              "phone"
            )
          )
        : current.phone,

    notes:
      hasOwn(
        body,
        "notes"
      )
        ? normalizeOptionalText(
            readValue(
              body,
              "notes"
            )
          )
        : current.notes,

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
            ) ||
            current.source
          : current.source
      ) as BoardParticipantSavePayload["source"],

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
 * Tek kurul katılımcısını getirir.
 *
 * GET:
 * /api/admin/documentation/board/participants/{id}
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
        "Katılımcı ID bilgisi zorunludur.",
        400
      );
    }

    const participant =
      await loadParticipant(
        id
      );

    if (!participant) {
      return jsonError(
        "Kurul katılımcısı bulunamadı.",
        404
      );
    }

    if (
      participant.isDeleted
    ) {
      return jsonError(
        "Kurul katılımcısı silinmiş.",
        410
      );
    }

    return jsonSuccess({
      participant,

      record:
        participant,

      data:
        participant,
    });
  } catch (error) {
    console.error(
      "Kurul katılımcısı GET hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul katılımcısı alınırken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

/**
 * PATCH
 *
 * Kurul katılımcısını günceller.
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
        "Katılımcı ID bilgisi zorunludur.",
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
      await loadParticipant(
        id
      );

    if (!current) {
      return jsonError(
        "Kurul katılımcısı bulunamadı.",
        404
      );
    }

    if (
      current.isDeleted
    ) {
      return jsonError(
        "Silinmiş kurul katılımcısı güncellenemez.",
        409
      );
    }

    let payload:
      BoardParticipantSavePayload;

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
          : "Katılımcı bilgileri geçersiz.",
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
        "Silinmiş kurul toplantısına bağlı katılımcı güncellenemez.",
        409
      );
    }

    if (
      meeting.firmId !==
      payload.firmId
    ) {
      return jsonError(
        "Katılımcının firma bilgisi toplantıyla eşleşmiyor.",
        400
      );
    }

    const supabase =
      createSupabaseAdmin();

    /*
     * Çalışan ID varsa aynı toplantıda başka
     * bir aktif katılımcıda kullanılamaz.
     */
    if (
      payload.employeeId
    ) {
      const {
        data:
          duplicateEmployeeRows,
        error:
          duplicateEmployeeError,
      } =
        await supabase
          .from(
            BOARD_PARTICIPANTS_TABLE
          )
          .select(
            "id, employee_id, full_name"
          )
          .eq(
            "meeting_id",
            payload.meetingId
          )
          .eq(
            "employee_id",
            payload.employeeId
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

      if (
        duplicateEmployeeError
      ) {
        console.error(
          "Kurul katılımcısı çalışan kontrolü yapılamadı:",
          duplicateEmployeeError
        );

        return jsonError(
          "Katılımcı çalışan kaydı kontrol edilemedi.",
          500,
          duplicateEmployeeError.message
        );
      }

      if (
        duplicateEmployeeRows &&
        duplicateEmployeeRows.length >
          0
      ) {
        return jsonError(
          "Bu çalışan toplantıya başka bir katılımcı kaydıyla eklenmiş.",
          409
        );
      }
    } else {
      /*
       * Çalışan ID yoksa ad ve varsa e-posta
       * üzerinden mükerrerlik kontrol edilir.
       */
      let duplicateQuery =
        supabase
          .from(
            BOARD_PARTICIPANTS_TABLE
          )
          .select(
            "id, full_name, email"
          )
          .eq(
            "meeting_id",
            payload.meetingId
          )
          .ilike(
            "full_name",
            payload.fullName
          )
          .eq(
            "is_deleted",
            false
          )
          .neq(
            "id",
            id
          );

      if (
        payload.email
      ) {
        duplicateQuery =
          duplicateQuery.ilike(
            "email",
            payload.email
          );
      }

      const {
        data:
          duplicateNameRows,
        error:
          duplicateNameError,
      } =
        await duplicateQuery
          .limit(1);

      if (
        duplicateNameError
      ) {
        console.error(
          "Kurul katılımcısı mükerrerlik kontrolü yapılamadı:",
          duplicateNameError
        );

        return jsonError(
          "Katılımcı kaydı kontrol edilemedi.",
          500,
          duplicateNameError.message
        );
      }

      if (
        duplicateNameRows &&
        duplicateNameRows.length >
          0
      ) {
        return jsonError(
          "Bu katılımcı toplantıda başka bir kayıt olarak mevcut.",
          409
        );
      }
    }

    const databaseRecord =
      removeUndefinedValues(
        mapBoardParticipantToDatabase(
          payload
        )
      );

    const now =
      Date.now();

    /*
     * Güncellemede değişmemesi gereken
     * sistem alanlarını mapper çıktısından çıkar.
     */
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
          BOARD_PARTICIPANTS_TABLE
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
        "Kurul katılımcısı güncellenemedi:",
        error
      );

      if (
        error.code ===
        "23505"
      ) {
        return jsonError(
          "Aynı çalışan veya senkronizasyon anahtarıyla katılımcı kaydı zaten mevcut.",
          409,
          error.message
        );
      }

      if (
        error.code ===
        "23503"
      ) {
        return jsonError(
          "Toplantı, firma veya çalışan bilgisi geçersiz.",
          400,
          error.message
        );
      }

      if (
        error.code ===
        "23514"
      ) {
        return jsonError(
          "Katılımcı rolü, katılım durumu veya imza durumu geçersiz.",
          400,
          error.message
        );
      }

      return jsonError(
        "Kurul katılımcısı güncellenemedi.",
        500,
        error.message
      );
    }

    if (!data) {
      return jsonError(
        "Katılımcı güncellendi ancak kayıt bilgisi alınamadı.",
        500
      );
    }

    const participant =
      mapBoardParticipant(
        data
      );

    return jsonSuccess({
      message:
        "Kurul katılımcısı başarıyla güncellendi.",

      participant,

      record:
        participant,

      data:
        participant,
    });
  } catch (error) {
    console.error(
      "Kurul katılımcısı PATCH hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul katılımcısı güncellenirken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

/**
 * DELETE
 *
 * Katılımcıyı kalıcı olarak silmez.
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
        "Katılımcı ID bilgisi zorunludur.",
        400
      );
    }

    const current =
      await loadParticipant(
        id
      );

    if (!current) {
      return jsonError(
        "Kurul katılımcısı bulunamadı.",
        404
      );
    }

    if (
      current.isDeleted
    ) {
      return jsonSuccess({
        message:
          "Kurul katılımcısı daha önce silinmiş.",

        id,

        alreadyDeleted:
          true,
      });
    }

    const supabase =
      createSupabaseAdmin();

    const now =
      Date.now();

    const {
      data,
      error,
    } =
      await supabase
        .from(
          BOARD_PARTICIPANTS_TABLE
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
        "Kurul katılımcısı silinemedi:",
        error
      );

      return jsonError(
        "Kurul katılımcısı silinemedi.",
        500,
        error.message
      );
    }

    if (!data) {
      return jsonError(
        "Silinecek kurul katılımcısı bulunamadı.",
        404
      );
    }

    const participant =
      mapBoardParticipant(
        data
      );

    return jsonSuccess({
      message:
        "Kurul katılımcısı başarıyla silindi.",

      id,

      participant,

      record:
        participant,

      data:
        participant,
    });
  } catch (error) {
    console.error(
      "Kurul katılımcısı DELETE hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul katılımcısı silinirken beklenmeyen bir hata oluştu.",
      500
    );
  }
}