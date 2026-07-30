import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  mapBoardParticipant,
  mapBoardParticipants,
  mapBoardParticipantToDatabase,
} from "@/lib/documentation/board/mapper";

import type {
  BoardAttendanceStatus,
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

function normalizeParticipantRole(
  value: unknown
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
    : "MEMBER";
}

function normalizeAttendanceStatus(
  value: unknown
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
    : "INVITED";
}

function normalizeSignatureStatus(
  value: unknown
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
    : "NOT_SIGNED";
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

function buildParticipantPayload(
  body: UnknownRecord
): BoardParticipantSavePayload {
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

  const fullName =
    normalizeText(
      body.fullName ??
        body.full_name
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

  if (!fullName) {
    throw new Error(
      "Katılımcının adı ve soyadı zorunludur."
    );
  }

  const attendanceStatus =
    normalizeAttendanceStatus(
      body.attendanceStatus ??
        body.attendance_status ??
        "INVITED"
    );

  let signatureStatus =
    normalizeSignatureStatus(
      body.signatureStatus ??
        body.signature_status ??
        "NOT_SIGNED"
    );

  let signedAtMillis =
    normalizePositiveMillis(
      body.signedAtMillis ??
        body.signed_at_millis
    );

  /*
   * İmza gerekmiyorsa imza tarihi tutulmaz.
   */
  if (
    signatureStatus ===
    "NOT_REQUIRED"
  ) {
    signedAtMillis =
      null;
  }

  /*
   * İmzalandı denilmiş fakat tarih gönderilmemişse
   * mevcut zaman imza tarihi olarak kaydedilir.
   */
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

  /*
   * Katılmayan kişilerin imzası gerekli kabul edilmez.
   */
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

    employeeId:
      normalizeOptionalText(
        body.employeeId ??
          body.employee_id
      ),

    employeeLocalId:
      normalizeNullableInteger(
        body.employeeLocalId ??
          body.employee_local_id
      ),

    fullName,

    title:
      normalizeOptionalText(
        body.title
      ),

    department:
      normalizeOptionalText(
        body.department
      ),

    participantRole:
      normalizeParticipantRole(
        body.participantRole ??
          body.participant_role ??
          "MEMBER"
      ),

    attendanceStatus,

    signatureStatus,

    signedAtMillis,

    email:
      normalizeOptionalText(
        body.email
      ),

    phone:
      normalizeOptionalText(
        body.phone
      ),

    notes:
      normalizeOptionalText(
        body.notes
      ),

    source:
      (
        normalizeText(
          body.source ??
            "WEB"
        ) ||
        "WEB"
      ) as BoardParticipantSavePayload["source"],

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
 * Toplantıya ait katılımcıları listeler.
 *
 * Örnek:
 *
 * /api/admin/documentation/board/participants?meetingId=...
 *
 * Filtreler:
 *
 * firmId=...
 * role=MEMBER
 * attendanceStatus=ATTENDED
 * signatureStatus=NOT_SIGNED
 * search=ahmet
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

    const firmId =
      normalizeText(
        searchParams.get(
          "firmId"
        )
      );

    const participantRole =
      normalizeText(
        searchParams.get(
          "role"
        ) ??
          searchParams.get(
            "participantRole"
          )
      ).toUpperCase();

    const attendanceStatus =
      normalizeText(
        searchParams.get(
          "attendanceStatus"
        )
      ).toUpperCase();

    const signatureStatus =
      normalizeText(
        searchParams.get(
          "signatureStatus"
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

    if (
      meeting.isDeleted
    ) {
      return jsonError(
        "Silinmiş kurul toplantısının katılımcıları görüntülenemez.",
        410
      );
    }

    if (
      firmId &&
      firmId !==
        meeting.firmId
    ) {
      return jsonError(
        "Firma bilgisi toplantıyla eşleşmiyor.",
        400
      );
    }

    if (
      participantRole &&
      !PARTICIPANT_ROLES.includes(
        participantRole as BoardParticipantRole
      )
    ) {
      return jsonError(
        "Geçersiz katılımcı rolü.",
        400
      );
    }

    if (
      attendanceStatus &&
      !ATTENDANCE_STATUSES.includes(
        attendanceStatus as BoardAttendanceStatus
      )
    ) {
      return jsonError(
        "Geçersiz katılım durumu.",
        400
      );
    }

    if (
      signatureStatus &&
      !SIGNATURE_STATUSES.includes(
        signatureStatus as BoardSignatureStatus
      )
    ) {
      return jsonError(
        "Geçersiz imza durumu.",
        400
      );
    }

    const supabase =
      createSupabaseAdmin();

    let query =
      supabase
        .from(
          BOARD_PARTICIPANTS_TABLE
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

    if (
      !includeDeleted
    ) {
      query =
        query.eq(
          "is_deleted",
          false
        );
    }

    if (
      participantRole
    ) {
      query =
        query.eq(
          "participant_role",
          participantRole
        );
    }

    if (
      attendanceStatus
    ) {
      query =
        query.eq(
          "attendance_status",
          attendanceStatus
        );
    }

    if (
      signatureStatus
    ) {
      query =
        query.eq(
          "signature_status",
          signatureStatus
        );
    }

    if (search) {
      query =
        query.or(
          [
            `full_name.ilike.%${search}%`,
            `title.ilike.%${search}%`,
            `department.ilike.%${search}%`,
            `email.ilike.%${search}%`,
            `phone.ilike.%${search}%`,
            `notes.ilike.%${search}%`,
          ].join(",")
        );
    }

    const {
      data,
      error,
    } =
      await query
        .order(
          "participant_role",
          {
            ascending: true,
          }
        )
        .order(
          "full_name",
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
        "Kurul katılımcıları alınamadı:",
        error
      );

      return jsonError(
        "Kurul katılımcıları alınamadı.",
        500,
        error.message
      );
    }

    const participants =
      includeDeleted
        ? (
            data ?? []
          ).map(
            mapBoardParticipant
          )
        : mapBoardParticipants(
            data ?? []
          );

    const attendedCount =
      participants.filter(
        (participant) =>
          participant.attendanceStatus ===
            "ATTENDED" ||
          participant.attendanceStatus ===
            "ONLINE"
      ).length;

    const absentCount =
      participants.filter(
        (participant) =>
          participant.attendanceStatus ===
            "ABSENT" ||
          participant.attendanceStatus ===
            "EXCUSED"
      ).length;

    const invitedCount =
      participants.filter(
        (participant) =>
          participant.attendanceStatus ===
          "INVITED"
      ).length;

    const unsignedCount =
      participants.filter(
        (participant) =>
          (
            participant.attendanceStatus ===
              "ATTENDED" ||
            participant.attendanceStatus ===
              "ONLINE"
          ) &&
          participant.signatureStatus ===
            "NOT_SIGNED"
      ).length;

    const signedCount =
      participants.filter(
        (participant) =>
          participant.signatureStatus ===
            "SIGNED" ||
          participant.signatureStatus ===
            "DIGITALLY_SIGNED"
      ).length;

    return jsonSuccess({
      participants,

      data:
        participants,

      meetingId,

      firmId:
        meeting.firmId,

      count:
        participants.length,

      counts: {
        total:
          participants.length,

        invited:
          invitedCount,

        attended:
          attendedCount,

        absent:
          absentCount,

        signed:
          signedCount,

        unsigned:
          unsignedCount,
      },
    });
  } catch (error) {
    console.error(
      "Kurul katılımcıları GET hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul katılımcıları alınırken beklenmeyen bir hata oluştu.",
      500
    );
  }
}

/**
 * POST
 *
 * Yeni kurul katılımcısı oluşturur.
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
      BoardParticipantSavePayload;

    try {
      payload =
        buildParticipantPayload(
          body
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
        "Silinmiş kurul toplantısına katılımcı eklenemez.",
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
     * Aynı çalışan kaydı aynı toplantıya
     * ikinci kez eklenemez.
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
          .limit(1);

      if (
        duplicateEmployeeError
      ) {
        console.error(
          "Katılımcı çalışan kontrolü yapılamadı:",
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
          "Bu çalışan toplantıya daha önce eklenmiş.",
          409
        );
      }
    } else {
      /*
       * Çalışan ID yoksa aynı ad ve e-posta kombinasyonu
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
          "Katılımcı mükerrerlik kontrolü yapılamadı:",
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
          "Bu katılımcı toplantıya daha önce eklenmiş.",
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
     * Sistem alanları BoardParticipantSavePayload
     * içerisine eklenmez. Doğrudan veritabanı
     * kaydına yazılır.
     */
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

    const {
      data,
      error,
    } =
      await supabase
        .from(
          BOARD_PARTICIPANTS_TABLE
        )
        .insert(
          databaseRecord
        )
        .select("*")
        .single();

    if (error) {
      console.error(
        "Kurul katılımcısı oluşturulamadı:",
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
        "Kurul katılımcısı oluşturulamadı.",
        500,
        error.message
      );
    }

    if (!data) {
      return jsonError(
        "Katılımcı oluşturuldu ancak kayıt bilgisi alınamadı.",
        500
      );
    }

    const participant =
      mapBoardParticipant(
        data
      );

    return jsonSuccess(
      {
        message:
          "Kurul katılımcısı başarıyla oluşturuldu.",

        participant,

        record:
          participant,

        data:
          participant,
      },
      201
    );
  } catch (error) {
    console.error(
      "Kurul katılımcısı POST hatası:",
      error
    );

    return jsonError(
      error instanceof Error
        ? error.message
        : "Kurul katılımcısı oluşturulurken beklenmeyen bir hata oluştu.",
      500
    );
  }
}