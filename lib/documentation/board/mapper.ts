import type {
  BoardAgendaItem,
  BoardAgendaSavePayload,
  BoardAgendaStatus,
  BoardAttendanceStatus,
  BoardDecision,
  BoardDecisionPriority,
  BoardDecisionSavePayload,
  BoardDecisionStatus,
  BoardMeeting,
  BoardMeetingMethod,
  BoardMeetingSavePayload,
  BoardMeetingStatus,
  BoardMeetingType,
  BoardParticipant,
  BoardParticipantRole,
  BoardParticipantSavePayload,
  BoardRecordSource,
  BoardSignatureStatus,
  BoardSyncStatus,
  BoardVoteResult,
} from "./types";

type UnknownRecord = Record<
  string,
  unknown
>;

function asObject(
  value: unknown
): UnknownRecord {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as UnknownRecord;
  }

  return {};
}

function readValue(
  row: UnknownRecord,
  keys: string[]
): unknown {
  for (const key of keys) {
    const value = row[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return undefined;
}

function toStringValue(
  value: unknown,
  fallback = ""
): string {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return String(value).trim();
}

function toNullableString(
  value: unknown
): string | null {
  const normalized =
    toStringValue(value);

  return normalized || null;
}

function toNumberValue(
  value: unknown,
  fallback = 0
): number {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  const normalized =
    Number(value);

  return Number.isFinite(
    normalized
  )
    ? normalized
    : fallback;
}

function toIntegerValue(
  value: unknown,
  fallback = 0
): number {
  return Math.trunc(
    toNumberValue(
      value,
      fallback
    )
  );
}

function toNullableNumber(
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

  return Number.isFinite(
    normalized
  )
    ? normalized
    : null;
}

function toNullableInteger(
  value: unknown
): number | null {
  const normalized =
    toNullableNumber(value);

  return normalized === null
    ? null
    : Math.trunc(normalized);
}

function toBooleanValue(
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
    const normalized = value
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
        "var",
        "ulaşıldı",
        "ulasildi",
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
        "yok",
        "ulaşılmadı",
        "ulasilmadi",
      ].includes(normalized)
    ) {
      return false;
    }
  }

  return fallback;
}

function toMillis(
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
    typeof value === "number"
  ) {
    if (
      !Number.isFinite(value)
    ) {
      return null;
    }

    if (
      value > 0 &&
      value <
        10_000_000_000
    ) {
      return Math.round(
        value * 1000
      );
    }

    return Math.round(value);
  }

  const normalized =
    String(value).trim();

  if (!normalized) {
    return null;
  }

  const numericValue =
    Number(normalized);

  if (
    Number.isFinite(
      numericValue
    )
  ) {
    if (
      numericValue > 0 &&
      numericValue <
        10_000_000_000
    ) {
      return Math.round(
        numericValue * 1000
      );
    }

    return Math.round(
      numericValue
    );
  }

  const dateValue =
    new Date(
      normalized
    ).getTime();

  return Number.isNaN(
    dateValue
  )
    ? null
    : dateValue;
}

function normalizeEnumValue(
  value: unknown
): string {
  return toStringValue(value)
    .toLocaleUpperCase(
      "tr-TR"
    )
    .replace(/[İI]/g, "I")
    .replace(/[Ş]/g, "S")
    .replace(/[Ğ]/g, "G")
    .replace(/[Ü]/g, "U")
    .replace(/[Ö]/g, "O")
    .replace(/[Ç]/g, "C")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(
      /^_+|_+$/g,
      ""
    );
}

function clampInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
): number {
  const normalized =
    toIntegerValue(
      value,
      fallback
    );

  return Math.min(
    maximum,
    Math.max(
      minimum,
      normalized
    )
  );
}

export function normalizeBoardMeetingType(
  value: unknown
): BoardMeetingType {
  const normalized =
    normalizeEnumValue(
      value
    );

  switch (normalized) {
    case "EXTRAORDINARY":
    case "EXTRA_ORDINARY":
    case "OLAGANUSTU":
    case "OLAGAN_USTU":
      return "EXTRAORDINARY";

    case "ORDINARY":
    case "OLAGAN":
    default:
      return "ORDINARY";
  }
}

export function normalizeBoardMeetingMethod(
  value: unknown
): BoardMeetingMethod {
  const normalized =
    normalizeEnumValue(
      value
    );

  switch (normalized) {
    case "ONLINE":
    case "REMOTE":
    case "UZAKTAN":
    case "CEVRIMICI":
      return "ONLINE";

    case "HYBRID":
    case "HIBRIT":
      return "HYBRID";

    case "FACE_TO_FACE":
    case "FACE2FACE":
    case "IN_PERSON":
    case "YUZ_YUZE":
    case "YUZYUZE":
    default:
      return "FACE_TO_FACE";
  }
}

export function normalizeBoardMeetingStatus(
  value: unknown
): BoardMeetingStatus {
  const normalized =
    normalizeEnumValue(
      value
    );

  switch (normalized) {
    case "PLANNED":
    case "PLANLANDI":
    case "PLANLANAN":
      return "PLANNED";

    case "IN_PROGRESS":
    case "ONGOING":
    case "DEVAM_EDIYOR":
    case "BASLADI":
      return "IN_PROGRESS";

    case "COMPLETED":
    case "FINISHED":
    case "TAMAMLANDI":
    case "TAMAMLANDI":
      return "COMPLETED";

    case "CANCELLED":
    case "CANCELED":
    case "IPTAL":
    case "IPTAL_EDILDI":
      return "CANCELLED";

    case "ARCHIVED":
    case "ARCHIVE":
    case "ARSIV":
    case "ARSIVLENDI":
      return "ARCHIVED";

    case "DRAFT":
    case "TASLAK":
    default:
      return "DRAFT";
  }
}

export function normalizeBoardAgendaStatus(
  value: unknown
): BoardAgendaStatus {
  const normalized =
    normalizeEnumValue(
      value
    );

  switch (normalized) {
    case "DISCUSSED":
    case "GORUSULDU":
    case "GORUSULEN":
      return "DISCUSSED";

    case "POSTPONED":
    case "ERTELENDI":
    case "ERTELENEN":
      return "POSTPONED";

    case "CANCELLED":
    case "CANCELED":
    case "IPTAL":
      return "CANCELLED";

    case "PENDING":
    case "BEKLIYOR":
    default:
      return "PENDING";
  }
}

export function normalizeBoardParticipantRole(
  value: unknown
): BoardParticipantRole {
  const normalized =
    normalizeEnumValue(
      value
    );

  switch (normalized) {
    case "CHAIRPERSON":
    case "CHAIRMAN":
    case "PRESIDENT":
    case "BASKAN":
    case "KURUL_BASKANI":
      return "CHAIRPERSON";

    case "SECRETARY":
    case "SEKRETER":
    case "KURUL_SEKRETERI":
      return "SECRETARY";

    case "EMPLOYER_REPRESENTATIVE":
    case "EMPLOYER_REP":
    case "ISVEREN_VEKILI":
    case "ISVEREN_TEMSILCISI":
      return "EMPLOYER_REPRESENTATIVE";

    case "OHS_SPECIALIST":
    case "SAFETY_SPECIALIST":
    case "ISG_UZMANI":
    case "IS_GUVENLIGI_UZMANI":
      return "OHS_SPECIALIST";

    case "WORKPLACE_PHYSICIAN":
    case "WORKPLACE_DOCTOR":
    case "ISYERI_HEKIMI":
      return "WORKPLACE_PHYSICIAN";

    case "EMPLOYEE_REPRESENTATIVE":
    case "EMPLOYEE_REP":
    case "CALISAN_TEMSILCISI":
      return "EMPLOYEE_REPRESENTATIVE";

    case "SUPPORT_PERSONNEL":
    case "SUPPORT_PERSON":
    case "DESTEK_ELEMANI":
      return "SUPPORT_PERSONNEL";

    case "GUEST":
    case "MISAFIR":
      return "GUEST";

    case "OTHER":
    case "DIGER":
      return "OTHER";

    case "MEMBER":
    case "UYE":
    default:
      return "MEMBER";
  }
}

export function normalizeBoardAttendanceStatus(
  value: unknown
): BoardAttendanceStatus {
  const normalized =
    normalizeEnumValue(
      value
    );

  switch (normalized) {
    case "ATTENDED":
    case "PRESENT":
    case "KATILDI":
    case "KATILIM_SAGLADI":
      return "ATTENDED";

    case "ABSENT":
    case "NOT_ATTENDED":
    case "KATILMADI":
      return "ABSENT";

    case "EXCUSED":
    case "MAZERETLI":
    case "IZINLI":
      return "EXCUSED";

    case "ONLINE":
    case "REMOTE":
    case "CEVRIMICI":
    case "UZAKTAN":
      return "ONLINE";

    case "INVITED":
    case "DAVET_EDILDI":
    case "DAVETLI":
    default:
      return "INVITED";
  }
}

export function normalizeBoardSignatureStatus(
  value: unknown
): BoardSignatureStatus {
  const normalized =
    normalizeEnumValue(
      value
    );

  switch (normalized) {
    case "NOT_REQUIRED":
    case "SIGNATURE_NOT_REQUIRED":
    case "IMZA_GEREKMIYOR":
      return "NOT_REQUIRED";

    case "SIGNED":
    case "IMZALANDI":
    case "ISLAK_IMZALI":
      return "SIGNED";

    case "DIGITALLY_SIGNED":
    case "E_SIGNED":
    case "E_SIGNATURE":
    case "DIJITAL_IMZALI":
    case "E_IMZALI":
      return "DIGITALLY_SIGNED";

    case "NOT_SIGNED":
    case "UNSIGNED":
    case "IMZALANMADI":
    case "IMZA_BEKLIYOR":
    default:
      return "NOT_SIGNED";
  }
}

export function normalizeBoardDecisionPriority(
  value: unknown
): BoardDecisionPriority {
  const normalized =
    normalizeEnumValue(
      value
    );

  switch (normalized) {
    case "LOW":
    case "DUSUK":
      return "LOW";

    case "HIGH":
    case "YUKSEK":
      return "HIGH";

    case "CRITICAL":
    case "CRITIC":
    case "KRITIK":
      return "CRITICAL";

    case "NORMAL":
    case "MEDIUM":
    case "ORTA":
    default:
      return "NORMAL";
  }
}

export function normalizeBoardDecisionStatus(
  value: unknown
): BoardDecisionStatus {
  const normalized =
    normalizeEnumValue(
      value
    );

  switch (normalized) {
    case "IN_PROGRESS":
    case "ONGOING":
    case "DEVAM_EDIYOR":
    case "ISLEMDE":
      return "IN_PROGRESS";

    case "COMPLETED":
    case "CLOSED":
    case "DONE":
    case "TAMAMLANDI":
    case "KAPANDI":
      return "COMPLETED";

    case "POSTPONED":
    case "ERTELENDI":
      return "POSTPONED";

    case "CANCELLED":
    case "CANCELED":
    case "IPTAL":
      return "CANCELLED";

    case "OPEN":
    case "ACIK":
    case "BEKLIYOR":
    default:
      return "OPEN";
  }
}

export function normalizeBoardVoteResult(
  value: unknown
): BoardVoteResult {
  const normalized =
    normalizeEnumValue(
      value
    );

  switch (normalized) {
    case "MAJORITY":
    case "OY_COKLUGU":
    case "COGUNLUK":
      return "MAJORITY";

    case "REJECTED":
    case "REDDEDILDI":
    case "RET":
      return "REJECTED";

    case "NO_VOTE":
    case "NOT_VOTED":
    case "OYLAMA_YOK":
    case "OYLANMADI":
      return "NO_VOTE";

    case "UNANIMOUS":
    case "OY_BIRLIGI":
    case "OYBIRLIGI":
    default:
      return "UNANIMOUS";
  }
}

export function normalizeBoardRecordSource(
  value: unknown
): BoardRecordSource {
  const normalized =
    normalizeEnumValue(
      value
    );

  return normalized === "APP" ||
    normalized === "MOBILE"
    ? "APP"
    : "WEB";
}

export function normalizeBoardSyncStatus(
  value: unknown
): BoardSyncStatus {
  const normalized =
    normalizeEnumValue(
      value
    );

  switch (normalized) {
    case "PENDING":
      return "PENDING";

    case "SYNCING":
      return "SYNCING";

    case "FAILED":
    case "ERROR":
      return "FAILED";

    case "SYNCED":
    default:
      return "SYNCED";
  }
}

export function mapBoardMeeting(
  input: unknown
): BoardMeeting {
  const row =
    asObject(input);

  const createdAtMillis =
    toMillis(
      readValue(row, [
        "created_at_millis",
        "createdAtMillis",
        "created_at",
        "createdAt",
      ])
    ) || Date.now();

  const updatedAtMillis =
    toMillis(
      readValue(row, [
        "updated_at_millis",
        "updatedAtMillis",
        "updated_at",
        "updatedAt",
      ])
    ) || createdAtMillis;

  const id =
    toStringValue(
      readValue(row, [
        "id",
        "web_id",
        "webId",
        "remote_id",
        "remoteId",
        "sync_key",
        "syncKey",
      ])
    );

  const syncKey =
    toStringValue(
      readValue(row, [
        "sync_key",
        "syncKey",
      ]),
      id
    );

  return {
    id:
      id ||
      syncKey ||
      `board-meeting-${createdAtMillis}`,

    firmId:
      toStringValue(
        readValue(row, [
          "firm_id",
          "firmId",
          "company_id",
          "companyId",
          "web_firm_id",
          "webFirmId",
        ])
      ),

    localFirmId:
      toNullableInteger(
        readValue(row, [
          "local_firm_id",
          "localFirmId",
        ])
      ),

    syncKey:
      syncKey ||
      id ||
      "",

    meetingNo:
      toStringValue(
        readValue(row, [
          "meeting_no",
          "meetingNo",
          "meeting_number",
          "meetingNumber",
          "document_no",
          "documentNo",
        ]),
        "-"
      ),

    meetingTitle:
      toStringValue(
        readValue(row, [
          "meeting_title",
          "meetingTitle",
          "title",
          "name",
        ]),
        "İSG Kurul Toplantısı"
      ),

    meetingType:
      normalizeBoardMeetingType(
        readValue(row, [
          "meeting_type",
          "meetingType",
          "type",
        ])
      ),

    meetingDateMillis:
      toMillis(
        readValue(row, [
          "meeting_date_millis",
          "meetingDateMillis",
          "meeting_date",
          "meetingDate",
          "date_millis",
          "dateMillis",
        ])
      ) || createdAtMillis,

    startTime:
      toNullableString(
        readValue(row, [
          "start_time",
          "startTime",
        ])
      ),

    endTime:
      toNullableString(
        readValue(row, [
          "end_time",
          "endTime",
        ])
      ),

    location:
      toNullableString(
        readValue(row, [
          "location",
          "meeting_location",
          "meetingLocation",
        ])
      ),

    meetingMethod:
      normalizeBoardMeetingMethod(
        readValue(row, [
          "meeting_method",
          "meetingMethod",
          "method",
        ])
      ),

    chairperson:
      toNullableString(
        readValue(row, [
          "chairperson",
          "chair_person",
          "chairPerson",
          "chairman",
          "president",
        ])
      ),

    secretary:
      toNullableString(
        readValue(row, [
          "secretary",
          "meeting_secretary",
          "meetingSecretary",
        ])
      ),

    description:
      toNullableString(
        readValue(row, [
          "description",
          "details",
          "summary",
        ])
      ),

    generalNotes:
      toNullableString(
        readValue(row, [
          "general_notes",
          "generalNotes",
          "notes",
        ])
      ),

    status:
      normalizeBoardMeetingStatus(
        readValue(row, [
          "status",
          "meeting_status",
          "meetingStatus",
        ])
      ),

    quorumRequired:
      Math.max(
        0,
        toIntegerValue(
          readValue(row, [
            "quorum_required",
            "quorumRequired",
          ]),
          0
        )
      ),

    quorumReached:
      toBooleanValue(
        readValue(row, [
          "quorum_reached",
          "quorumReached",
        ])
      ),

    participantCount:
      Math.max(
        0,
        toIntegerValue(
          readValue(row, [
            "participant_count",
            "participantCount",
          ]),
          0
        )
      ),

    decisionCount:
      Math.max(
        0,
        toIntegerValue(
          readValue(row, [
            "decision_count",
            "decisionCount",
          ]),
          0
        )
      ),

    openDecisionCount:
      Math.max(
        0,
        toIntegerValue(
          readValue(row, [
            "open_decision_count",
            "openDecisionCount",
          ]),
          0
        )
      ),

    signedMinutesAvailable:
      toBooleanValue(
        readValue(row, [
          "signed_minutes_available",
          "signedMinutesAvailable",
          "has_signed_minutes",
          "hasSignedMinutes",
        ])
      ),

    source:
      normalizeBoardRecordSource(
        readValue(row, [
          "source",
          "record_source",
          "recordSource",
        ])
      ),

    version:
      Math.max(
        1,
        toIntegerValue(
          readValue(row, [
            "version",
            "record_version",
            "recordVersion",
          ]),
          1
        )
      ),

    syncStatus:
      normalizeBoardSyncStatus(
        readValue(row, [
          "sync_status",
          "syncStatus",
        ])
      ),

    syncError:
      toNullableString(
        readValue(row, [
          "sync_error",
          "syncError",
        ])
      ),

    lastSyncedAtMillis:
      toMillis(
        readValue(row, [
          "last_synced_at_millis",
          "lastSyncedAtMillis",
          "last_synced_at",
          "lastSyncedAt",
        ])
      ),

    isDeleted:
      toBooleanValue(
        readValue(row, [
          "is_deleted",
          "isDeleted",
          "deleted",
        ])
      ),

    deletedAtMillis:
      toMillis(
        readValue(row, [
          "deleted_at_millis",
          "deletedAtMillis",
          "deleted_at",
          "deletedAt",
        ])
      ),

    createdAtMillis,

    updatedAtMillis,
  };
}

export function mapBoardMeetings(
  input: unknown
): BoardMeeting[] {
  if (
    !Array.isArray(input)
  ) {
    return [];
  }

  return input
    .map((item) =>
      mapBoardMeeting(item)
    )
    .filter(
      (meeting) =>
        !meeting.isDeleted
    )
    .sort(
      (a, b) =>
        b.meetingDateMillis -
          a.meetingDateMillis ||
        b.updatedAtMillis -
          a.updatedAtMillis
    );
}

export function mapBoardAgendaItem(
  input: unknown
): BoardAgendaItem {
  const row =
    asObject(input);

  const createdAtMillis =
    toMillis(
      readValue(row, [
        "created_at_millis",
        "createdAtMillis",
        "created_at",
        "createdAt",
      ])
    ) || Date.now();

  const updatedAtMillis =
    toMillis(
      readValue(row, [
        "updated_at_millis",
        "updatedAtMillis",
        "updated_at",
        "updatedAt",
      ])
    ) || createdAtMillis;

  const id =
    toStringValue(
      readValue(row, [
        "id",
        "web_id",
        "webId",
        "remote_id",
        "remoteId",
        "sync_key",
        "syncKey",
      ])
    );

  const syncKey =
    toStringValue(
      readValue(row, [
        "sync_key",
        "syncKey",
      ]),
      id
    );

  return {
    id:
      id ||
      syncKey ||
      `board-agenda-${createdAtMillis}`,

    meetingId:
      toStringValue(
        readValue(row, [
          "meeting_id",
          "meetingId",
          "board_meeting_id",
          "boardMeetingId",
        ])
      ),

    firmId:
      toStringValue(
        readValue(row, [
          "firm_id",
          "firmId",
          "company_id",
          "companyId",
        ])
      ),

    localFirmId:
      toNullableInteger(
        readValue(row, [
          "local_firm_id",
          "localFirmId",
        ])
      ),

    syncKey:
      syncKey ||
      id ||
      "",

    itemNo:
      Math.max(
        1,
        toIntegerValue(
          readValue(row, [
            "item_no",
            "itemNo",
            "order_no",
            "orderNo",
            "sequence",
          ]),
          1
        )
      ),

    title:
      toStringValue(
        readValue(row, [
          "title",
          "agenda_title",
          "agendaTitle",
          "name",
        ]),
        "Gündem maddesi"
      ),

    description:
      toNullableString(
        readValue(row, [
          "description",
          "details",
          "content",
        ])
      ),

    presenter:
      toNullableString(
        readValue(row, [
          "presenter",
          "presented_by",
          "presentedBy",
        ])
      ),

    durationMinutes:
      toNullableInteger(
        readValue(row, [
          "duration_minutes",
          "durationMinutes",
          "duration",
        ])
      ),

    agendaStatus:
      normalizeBoardAgendaStatus(
        readValue(row, [
          "agenda_status",
          "agendaStatus",
          "status",
        ])
      ),

    discussionNotes:
      toNullableString(
        readValue(row, [
          "discussion_notes",
          "discussionNotes",
          "notes",
        ])
      ),

    source:
      normalizeBoardRecordSource(
        readValue(row, [
          "source",
          "record_source",
          "recordSource",
        ])
      ),

    version:
      Math.max(
        1,
        toIntegerValue(
          readValue(row, [
            "version",
            "record_version",
            "recordVersion",
          ]),
          1
        )
      ),

    syncStatus:
      normalizeBoardSyncStatus(
        readValue(row, [
          "sync_status",
          "syncStatus",
        ])
      ),

    syncError:
      toNullableString(
        readValue(row, [
          "sync_error",
          "syncError",
        ])
      ),

    lastSyncedAtMillis:
      toMillis(
        readValue(row, [
          "last_synced_at_millis",
          "lastSyncedAtMillis",
          "last_synced_at",
          "lastSyncedAt",
        ])
      ),

    isDeleted:
      toBooleanValue(
        readValue(row, [
          "is_deleted",
          "isDeleted",
          "deleted",
        ])
      ),

    deletedAtMillis:
      toMillis(
        readValue(row, [
          "deleted_at_millis",
          "deletedAtMillis",
          "deleted_at",
          "deletedAt",
        ])
      ),

    createdAtMillis,

    updatedAtMillis,
  };
}

export function mapBoardAgendaItems(
  input: unknown
): BoardAgendaItem[] {
  if (
    !Array.isArray(input)
  ) {
    return [];
  }

  return input
    .map((item) =>
      mapBoardAgendaItem(
        item
      )
    )
    .filter(
      (agendaItem) =>
        !agendaItem.isDeleted
    )
    .sort(
      (a, b) =>
        a.itemNo - b.itemNo ||
        a.createdAtMillis -
          b.createdAtMillis
    );
}

export function mapBoardParticipant(
  input: unknown
): BoardParticipant {
  const row =
    asObject(input);

  const createdAtMillis =
    toMillis(
      readValue(row, [
        "created_at_millis",
        "createdAtMillis",
        "created_at",
        "createdAt",
      ])
    ) || Date.now();

  const updatedAtMillis =
    toMillis(
      readValue(row, [
        "updated_at_millis",
        "updatedAtMillis",
        "updated_at",
        "updatedAt",
      ])
    ) || createdAtMillis;

  const id =
    toStringValue(
      readValue(row, [
        "id",
        "web_id",
        "webId",
        "remote_id",
        "remoteId",
        "sync_key",
        "syncKey",
      ])
    );

  const syncKey =
    toStringValue(
      readValue(row, [
        "sync_key",
        "syncKey",
      ]),
      id
    );

  return {
    id:
      id ||
      syncKey ||
      `board-participant-${createdAtMillis}`,

    meetingId:
      toStringValue(
        readValue(row, [
          "meeting_id",
          "meetingId",
          "board_meeting_id",
          "boardMeetingId",
        ])
      ),

    firmId:
      toStringValue(
        readValue(row, [
          "firm_id",
          "firmId",
          "company_id",
          "companyId",
        ])
      ),

    localFirmId:
      toNullableInteger(
        readValue(row, [
          "local_firm_id",
          "localFirmId",
        ])
      ),

    syncKey:
      syncKey ||
      id ||
      "",

    employeeId:
      toNullableString(
        readValue(row, [
          "employee_id",
          "employeeId",
          "worker_id",
          "workerId",
        ])
      ),

    employeeLocalId:
      toNullableInteger(
        readValue(row, [
          "employee_local_id",
          "employeeLocalId",
          "local_employee_id",
          "localEmployeeId",
        ])
      ),

    fullName:
      toStringValue(
        readValue(row, [
          "full_name",
          "fullName",
          "name",
          "employee_name",
          "employeeName",
        ]),
        "İsimsiz Katılımcı"
      ),

    title:
      toNullableString(
        readValue(row, [
          "title",
          "job_title",
          "jobTitle",
          "position",
        ])
      ),

    department:
      toNullableString(
        readValue(row, [
          "department",
          "department_name",
          "departmentName",
          "unit",
        ])
      ),

    participantRole:
      normalizeBoardParticipantRole(
        readValue(row, [
          "participant_role",
          "participantRole",
          "role",
        ])
      ),

    attendanceStatus:
      normalizeBoardAttendanceStatus(
        readValue(row, [
          "attendance_status",
          "attendanceStatus",
          "attendance",
        ])
      ),

    signatureStatus:
      normalizeBoardSignatureStatus(
        readValue(row, [
          "signature_status",
          "signatureStatus",
          "sign_status",
          "signStatus",
        ])
      ),

    signedAtMillis:
      toMillis(
        readValue(row, [
          "signed_at_millis",
          "signedAtMillis",
          "signed_at",
          "signedAt",
        ])
      ),

    email:
      toNullableString(
        readValue(row, [
          "email",
          "email_address",
          "emailAddress",
        ])
      ),

    phone:
      toNullableString(
        readValue(row, [
          "phone",
          "phone_number",
          "phoneNumber",
          "mobile_phone",
          "mobilePhone",
        ])
      ),

    notes:
      toNullableString(
        readValue(row, [
          "notes",
          "note",
          "remarks",
        ])
      ),

    source:
      normalizeBoardRecordSource(
        readValue(row, [
          "source",
          "record_source",
          "recordSource",
        ])
      ),

    version:
      Math.max(
        1,
        toIntegerValue(
          readValue(row, [
            "version",
            "record_version",
            "recordVersion",
          ]),
          1
        )
      ),

    syncStatus:
      normalizeBoardSyncStatus(
        readValue(row, [
          "sync_status",
          "syncStatus",
        ])
      ),

    syncError:
      toNullableString(
        readValue(row, [
          "sync_error",
          "syncError",
        ])
      ),

    lastSyncedAtMillis:
      toMillis(
        readValue(row, [
          "last_synced_at_millis",
          "lastSyncedAtMillis",
          "last_synced_at",
          "lastSyncedAt",
        ])
      ),

    isDeleted:
      toBooleanValue(
        readValue(row, [
          "is_deleted",
          "isDeleted",
          "deleted",
        ])
      ),

    deletedAtMillis:
      toMillis(
        readValue(row, [
          "deleted_at_millis",
          "deletedAtMillis",
          "deleted_at",
          "deletedAt",
        ])
      ),

    createdAtMillis,

    updatedAtMillis,
  };
}

export function mapBoardParticipants(
  input: unknown
): BoardParticipant[] {
  if (
    !Array.isArray(input)
  ) {
    return [];
  }

  return input
    .map((item) =>
      mapBoardParticipant(
        item
      )
    )
    .filter(
      (participant) =>
        !participant.isDeleted
    )
    .sort((a, b) => {
      const roleOrder: Record<
        BoardParticipantRole,
        number
      > = {
        CHAIRPERSON: 1,
        SECRETARY: 2,
        EMPLOYER_REPRESENTATIVE: 3,
        OHS_SPECIALIST: 4,
        WORKPLACE_PHYSICIAN: 5,
        EMPLOYEE_REPRESENTATIVE: 6,
        SUPPORT_PERSONNEL: 7,
        MEMBER: 8,
        GUEST: 9,
        OTHER: 10,
      };

      return (
        roleOrder[
          a.participantRole
        ] -
          roleOrder[
            b.participantRole
          ] ||
        a.fullName.localeCompare(
          b.fullName,
          "tr"
        )
      );
    });
}

export function mapBoardDecision(
  input: unknown
): BoardDecision {
  const row =
    asObject(input);

  const createdAtMillis =
    toMillis(
      readValue(row, [
        "created_at_millis",
        "createdAtMillis",
        "created_at",
        "createdAt",
      ])
    ) || Date.now();

  const updatedAtMillis =
    toMillis(
      readValue(row, [
        "updated_at_millis",
        "updatedAtMillis",
        "updated_at",
        "updatedAt",
      ])
    ) || createdAtMillis;

  const id =
    toStringValue(
      readValue(row, [
        "id",
        "web_id",
        "webId",
        "remote_id",
        "remoteId",
        "sync_key",
        "syncKey",
      ])
    );

  const syncKey =
    toStringValue(
      readValue(row, [
        "sync_key",
        "syncKey",
      ]),
      id
    );

  return {
    id:
      id ||
      syncKey ||
      `board-decision-${createdAtMillis}`,

    meetingId:
      toStringValue(
        readValue(row, [
          "meeting_id",
          "meetingId",
          "board_meeting_id",
          "boardMeetingId",
        ])
      ),

    agendaId:
      toNullableString(
        readValue(row, [
          "agenda_id",
          "agendaId",
          "agenda_item_id",
          "agendaItemId",
        ])
      ),

    firmId:
      toStringValue(
        readValue(row, [
          "firm_id",
          "firmId",
          "company_id",
          "companyId",
        ])
      ),

    localFirmId:
      toNullableInteger(
        readValue(row, [
          "local_firm_id",
          "localFirmId",
        ])
      ),

    syncKey:
      syncKey ||
      id ||
      "",

    decisionNo:
      toStringValue(
        readValue(row, [
          "decision_no",
          "decisionNo",
          "decision_number",
          "decisionNumber",
          "number",
        ]),
        "-"
      ),

    title:
      toStringValue(
        readValue(row, [
          "title",
          "decision_title",
          "decisionTitle",
          "name",
        ]),
        "Kurul kararı"
      ),

    description:
      toNullableString(
        readValue(row, [
          "description",
          "decision_description",
          "decisionDescription",
          "details",
        ])
      ),

    responsiblePerson:
      toNullableString(
        readValue(row, [
          "responsible_person",
          "responsiblePerson",
          "assignee",
          "assigned_to",
          "assignedTo",
        ])
      ),

    responsibleDepartment:
      toNullableString(
        readValue(row, [
          "responsible_department",
          "responsibleDepartment",
          "department",
          "assigned_department",
          "assignedDepartment",
        ])
      ),

    priority:
      normalizeBoardDecisionPriority(
        readValue(row, [
          "priority",
          "decision_priority",
          "decisionPriority",
        ])
      ),

    decisionStatus:
      normalizeBoardDecisionStatus(
        readValue(row, [
          "decision_status",
          "decisionStatus",
          "status",
        ])
      ),

    dueDateMillis:
      toMillis(
        readValue(row, [
          "due_date_millis",
          "dueDateMillis",
          "due_date",
          "dueDate",
          "deadline_millis",
          "deadlineMillis",
        ])
      ),

    completedAtMillis:
      toMillis(
        readValue(row, [
          "completed_at_millis",
          "completedAtMillis",
          "completed_at",
          "completedAt",
          "completion_date_millis",
          "completionDateMillis",
        ])
      ),

    completionRate:
      clampInteger(
        readValue(row, [
          "completion_rate",
          "completionRate",
          "progress",
          "progress_rate",
          "progressRate",
        ]),
        0,
        100,
        0
      ),

    completionNotes:
      toNullableString(
        readValue(row, [
          "completion_notes",
          "completionNotes",
          "result_notes",
          "resultNotes",
        ])
      ),

    voteResult:
      normalizeBoardVoteResult(
        readValue(row, [
          "vote_result",
          "voteResult",
          "voting_result",
          "votingResult",
        ])
      ),

    yesVoteCount:
      Math.max(
        0,
        toIntegerValue(
          readValue(row, [
            "yes_vote_count",
            "yesVoteCount",
            "yes_votes",
            "yesVotes",
          ]),
          0
        )
      ),

    noVoteCount:
      Math.max(
        0,
        toIntegerValue(
          readValue(row, [
            "no_vote_count",
            "noVoteCount",
            "no_votes",
            "noVotes",
          ]),
          0
        )
      ),

    abstainVoteCount:
      Math.max(
        0,
        toIntegerValue(
          readValue(row, [
            "abstain_vote_count",
            "abstainVoteCount",
            "abstain_votes",
            "abstainVotes",
          ]),
          0
        )
      ),

    relatedModule:
      toNullableString(
        readValue(row, [
          "related_module",
          "relatedModule",
          "module",
        ])
      ),

    relatedRecordId:
      toNullableString(
        readValue(row, [
          "related_record_id",
          "relatedRecordId",
          "record_id",
          "recordId",
        ])
      ),

    source:
      normalizeBoardRecordSource(
        readValue(row, [
          "source",
          "record_source",
          "recordSource",
        ])
      ),

    version:
      Math.max(
        1,
        toIntegerValue(
          readValue(row, [
            "version",
            "record_version",
            "recordVersion",
          ]),
          1
        )
      ),

    syncStatus:
      normalizeBoardSyncStatus(
        readValue(row, [
          "sync_status",
          "syncStatus",
        ])
      ),

    syncError:
      toNullableString(
        readValue(row, [
          "sync_error",
          "syncError",
        ])
      ),

    lastSyncedAtMillis:
      toMillis(
        readValue(row, [
          "last_synced_at_millis",
          "lastSyncedAtMillis",
          "last_synced_at",
          "lastSyncedAt",
        ])
      ),

    isDeleted:
      toBooleanValue(
        readValue(row, [
          "is_deleted",
          "isDeleted",
          "deleted",
        ])
      ),

    deletedAtMillis:
      toMillis(
        readValue(row, [
          "deleted_at_millis",
          "deletedAtMillis",
          "deleted_at",
          "deletedAt",
        ])
      ),

    createdAtMillis,

    updatedAtMillis,
  };
}

export function mapBoardDecisions(
  input: unknown
): BoardDecision[] {
  if (
    !Array.isArray(input)
  ) {
    return [];
  }

  return input
    .map((item) =>
      mapBoardDecision(
        item
      )
    )
    .filter(
      (decision) =>
        !decision.isDeleted
    )
    .sort((a, b) => {
      const priorityOrder: Record<
        BoardDecisionPriority,
        number
      > = {
        CRITICAL: 1,
        HIGH: 2,
        NORMAL: 3,
        LOW: 4,
      };

      const statusOrder: Record<
        BoardDecisionStatus,
        number
      > = {
        OPEN: 1,
        IN_PROGRESS: 2,
        POSTPONED: 3,
        COMPLETED: 4,
        CANCELLED: 5,
      };

      return (
        statusOrder[
          a.decisionStatus
        ] -
          statusOrder[
            b.decisionStatus
          ] ||
        priorityOrder[
          a.priority
        ] -
          priorityOrder[
            b.priority
          ] ||
        (
          a.dueDateMillis ??
          Number.MAX_SAFE_INTEGER
        ) -
          (
            b.dueDateMillis ??
            Number.MAX_SAFE_INTEGER
          ) ||
        a.createdAtMillis -
          b.createdAtMillis
      );
    });
}

export function mapBoardMeetingToDatabase(
  record:
    | Partial<BoardMeeting>
    | BoardMeetingSavePayload
): Record<string, unknown> {
  const now = Date.now();

  return {
    id:
      record.id ||
      undefined,

    firm_id:
      record.firmId,

    local_firm_id:
      record.localFirmId ??
      null,

    sync_key:
      record.syncKey ||
      record.id ||
      undefined,

    meeting_no:
      record.meetingNo?.trim() ||
      "-",

    meeting_title:
      record.meetingTitle?.trim() ||
      "İSG Kurul Toplantısı",

    meeting_type:
      normalizeBoardMeetingType(
        record.meetingType
      ),

    meeting_date_millis:
      record.meetingDateMillis,

    start_time:
      record.startTime?.trim() ||
      null,

    end_time:
      record.endTime?.trim() ||
      null,

    location:
      record.location?.trim() ||
      null,

    meeting_method:
      normalizeBoardMeetingMethod(
        record.meetingMethod
      ),

    chairperson:
      record.chairperson?.trim() ||
      null,

    secretary:
      record.secretary?.trim() ||
      null,

    description:
      record.description?.trim() ||
      null,

    general_notes:
      record.generalNotes?.trim() ||
      null,

    status:
      normalizeBoardMeetingStatus(
        record.status
      ),

    quorum_required:
      Math.max(
        0,
        toIntegerValue(
          record.quorumRequired,
          0
        )
      ),

    quorum_reached:
      record.quorumReached ===
      true,

    signed_minutes_available:
      record.signedMinutesAvailable ===
      true,

    source:
      normalizeBoardRecordSource(
        record.source
      ),

    version:
      Math.max(
        1,
        toIntegerValue(
          record.version,
          1
        )
      ),

    sync_status:
      "syncStatus" in record
        ? normalizeBoardSyncStatus(
            record.syncStatus
          )
        : "SYNCED",

    sync_error:
      "syncError" in record
        ? record.syncError ??
          null
        : null,

    last_synced_at_millis:
      "lastSyncedAtMillis" in
      record
        ? record.lastSyncedAtMillis ??
          now
        : now,

    is_deleted:
      "isDeleted" in record
        ? record.isDeleted ===
          true
        : false,

    deleted_at_millis:
      "deletedAtMillis" in
      record
        ? record.deletedAtMillis ??
          null
        : null,

    created_at_millis:
      "createdAtMillis" in
      record
        ? record.createdAtMillis ??
          now
        : now,

    updated_at_millis:
      "updatedAtMillis" in
      record
        ? record.updatedAtMillis ??
          now
        : now,
  };
}

export function mapBoardAgendaToDatabase(
  record:
    | Partial<BoardAgendaItem>
    | BoardAgendaSavePayload
): Record<string, unknown> {
  const now = Date.now();

  return {
    id:
      record.id ||
      undefined,

    meeting_id:
      record.meetingId,

    firm_id:
      record.firmId,

    local_firm_id:
      record.localFirmId ??
      null,

    sync_key:
      record.syncKey ||
      record.id ||
      undefined,

    item_no:
      Math.max(
        1,
        toIntegerValue(
          record.itemNo,
          1
        )
      ),

    title:
      record.title?.trim() ||
      "Gündem maddesi",

    description:
      record.description?.trim() ||
      null,

    presenter:
      record.presenter?.trim() ||
      null,

    duration_minutes:
      record.durationMinutes ===
        null ||
      record.durationMinutes ===
        undefined
        ? null
        : Math.max(
            0,
            toIntegerValue(
              record.durationMinutes,
              0
            )
          ),

    agenda_status:
      normalizeBoardAgendaStatus(
        record.agendaStatus
      ),

    discussion_notes:
      record.discussionNotes?.trim() ||
      null,

    source:
      normalizeBoardRecordSource(
        record.source
      ),

    version:
      Math.max(
        1,
        toIntegerValue(
          record.version,
          1
        )
      ),

    sync_status:
      "syncStatus" in record
        ? normalizeBoardSyncStatus(
            record.syncStatus
          )
        : "SYNCED",

    sync_error:
      "syncError" in record
        ? record.syncError ??
          null
        : null,

    last_synced_at_millis:
      "lastSyncedAtMillis" in
      record
        ? record.lastSyncedAtMillis ??
          now
        : now,

    is_deleted:
      "isDeleted" in record
        ? record.isDeleted ===
          true
        : false,

    deleted_at_millis:
      "deletedAtMillis" in
      record
        ? record.deletedAtMillis ??
          null
        : null,

    created_at_millis:
      "createdAtMillis" in
      record
        ? record.createdAtMillis ??
          now
        : now,

    updated_at_millis:
      "updatedAtMillis" in
      record
        ? record.updatedAtMillis ??
          now
        : now,
  };
}

export function mapBoardParticipantToDatabase(
  record:
    | Partial<BoardParticipant>
    | BoardParticipantSavePayload
): Record<string, unknown> {
  const now = Date.now();

  return {
    id:
      record.id ||
      undefined,

    meeting_id:
      record.meetingId,

    firm_id:
      record.firmId,

    local_firm_id:
      record.localFirmId ??
      null,

    sync_key:
      record.syncKey ||
      record.id ||
      undefined,

    employee_id:
      record.employeeId?.trim() ||
      null,

    employee_local_id:
      record.employeeLocalId ??
      null,

    full_name:
      record.fullName?.trim() ||
      "İsimsiz Katılımcı",

    title:
      record.title?.trim() ||
      null,

    department:
      record.department?.trim() ||
      null,

    participant_role:
      normalizeBoardParticipantRole(
        record.participantRole
      ),

    attendance_status:
      normalizeBoardAttendanceStatus(
        record.attendanceStatus
      ),

    signature_status:
      normalizeBoardSignatureStatus(
        record.signatureStatus
      ),

    signed_at_millis:
      record.signedAtMillis ??
      null,

    email:
      record.email?.trim() ||
      null,

    phone:
      record.phone?.trim() ||
      null,

    notes:
      record.notes?.trim() ||
      null,

    source:
      normalizeBoardRecordSource(
        record.source
      ),

    version:
      Math.max(
        1,
        toIntegerValue(
          record.version,
          1
        )
      ),

    sync_status:
      "syncStatus" in record
        ? normalizeBoardSyncStatus(
            record.syncStatus
          )
        : "SYNCED",

    sync_error:
      "syncError" in record
        ? record.syncError ??
          null
        : null,

    last_synced_at_millis:
      "lastSyncedAtMillis" in
      record
        ? record.lastSyncedAtMillis ??
          now
        : now,

    is_deleted:
      "isDeleted" in record
        ? record.isDeleted ===
          true
        : false,

    deleted_at_millis:
      "deletedAtMillis" in
      record
        ? record.deletedAtMillis ??
          null
        : null,

    created_at_millis:
      "createdAtMillis" in
      record
        ? record.createdAtMillis ??
          now
        : now,

    updated_at_millis:
      "updatedAtMillis" in
      record
        ? record.updatedAtMillis ??
          now
        : now,
  };
}

export function mapBoardDecisionToDatabase(
  record:
    | Partial<BoardDecision>
    | BoardDecisionSavePayload
): Record<string, unknown> {
  const now = Date.now();

  return {
    id:
      record.id ||
      undefined,

    meeting_id:
      record.meetingId,

    agenda_id:
      record.agendaId ||
      null,

    firm_id:
      record.firmId,

    local_firm_id:
      record.localFirmId ??
      null,

    sync_key:
      record.syncKey ||
      record.id ||
      undefined,

    decision_no:
      record.decisionNo?.trim() ||
      "-",

    title:
      record.title?.trim() ||
      "Kurul kararı",

    description:
      record.description?.trim() ||
      null,

    responsible_person:
      record.responsiblePerson?.trim() ||
      null,

    responsible_department:
      record.responsibleDepartment?.trim() ||
      null,

    priority:
      normalizeBoardDecisionPriority(
        record.priority
      ),

    decision_status:
      normalizeBoardDecisionStatus(
        record.decisionStatus
      ),

    due_date_millis:
      record.dueDateMillis ??
      null,

    completed_at_millis:
      record.completedAtMillis ??
      null,

    completion_rate:
      clampInteger(
        record.completionRate,
        0,
        100,
        0
      ),

    completion_notes:
      record.completionNotes?.trim() ||
      null,

    vote_result:
      normalizeBoardVoteResult(
        record.voteResult
      ),

    yes_vote_count:
      Math.max(
        0,
        toIntegerValue(
          record.yesVoteCount,
          0
        )
      ),

    no_vote_count:
      Math.max(
        0,
        toIntegerValue(
          record.noVoteCount,
          0
        )
      ),

    abstain_vote_count:
      Math.max(
        0,
        toIntegerValue(
          record.abstainVoteCount,
          0
        )
      ),

    related_module:
      record.relatedModule?.trim() ||
      null,

    related_record_id:
      record.relatedRecordId?.trim() ||
      null,

    source:
      normalizeBoardRecordSource(
        record.source
      ),

    version:
      Math.max(
        1,
        toIntegerValue(
          record.version,
          1
        )
      ),

    sync_status:
      "syncStatus" in record
        ? normalizeBoardSyncStatus(
            record.syncStatus
          )
        : "SYNCED",

    sync_error:
      "syncError" in record
        ? record.syncError ??
          null
        : null,

    last_synced_at_millis:
      "lastSyncedAtMillis" in
      record
        ? record.lastSyncedAtMillis ??
          now
        : now,

    is_deleted:
      "isDeleted" in record
        ? record.isDeleted ===
          true
        : false,

    deleted_at_millis:
      "deletedAtMillis" in
      record
        ? record.deletedAtMillis ??
          null
        : null,

    created_at_millis:
      "createdAtMillis" in
      record
        ? record.createdAtMillis ??
          now
        : now,

    updated_at_millis:
      "updatedAtMillis" in
      record
        ? record.updatedAtMillis ??
          now
        : now,
  };
}