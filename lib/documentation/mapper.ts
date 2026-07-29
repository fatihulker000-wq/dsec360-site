import type {
  DocumentationCategory,
  DocumentationFileType,
  DocumentationRecord,
  DocumentationStatus,
} from "./types";

type UnknownRecord = Record<string, unknown>;

function asObject(value: unknown): UnknownRecord {
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
  const result = toStringValue(value);

  return result || null;
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

  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : fallback;
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

  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
}

function toBooleanValue(
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
    const normalized = value
      .trim()
      .toLocaleLowerCase("tr-TR");

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
        "pasif",
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

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }

    if (value > 0 && value < 10_000_000_000) {
      return Math.round(value * 1000);
    }

    return Math.round(value);
  }

  const numericValue = Number(value);

  if (
    Number.isFinite(numericValue) &&
    String(value).trim() !== ""
  ) {
    if (
      numericValue > 0 &&
      numericValue < 10_000_000_000
    ) {
      return Math.round(
        numericValue * 1000
      );
    }

    return Math.round(numericValue);
  }

  const dateValue = new Date(
    String(value)
  ).getTime();

  return Number.isNaN(dateValue)
    ? null
    : dateValue;
}

function toStringArray(
  value: unknown
): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        toStringValue(item)
      )
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(
        trimmed
      );

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) =>
            toStringValue(item)
          )
          .filter(Boolean);
      }
    } catch {
      return trimmed
        .split(",")
        .map((item) =>
          item.trim()
        )
        .filter(Boolean);
    }
  }

  return [];
}

export function normalizeDocumentationCategory(
  value: unknown
): DocumentationCategory {
  const normalized = toStringValue(
    value
  )
    .toLocaleUpperCase("tr-TR")
    .replace(/[\s-]+/g, "_");

  switch (normalized) {
    case "TRAINING":
    case "EDUCATION":
    case "EGITIM":
    case "EĞİTİM":
    case "EGITIM_DOKUMANLARI":
    case "EĞİTİM_DOKÜMANLARI":
      return "TRAINING";

    case "INSPECTION":
    case "AUDIT":
    case "DENETIM":
    case "DENETİM":
    case "DENETIM_FORMLARI":
    case "DENETİM_FORMLARI":
      return "INSPECTION";

    case "RISK":
    case "RISK_ASSESSMENT":
    case "RISK_DEGERLENDIRME":
    case "RİSK_DEĞERLENDİRME":
    case "RISK_MOTORU":
      return "RISK";

    case "FORM":
    case "FORMS":
    case "TEMPLATE":
    case "TEMPLATES":
    case "SABLON":
    case "ŞABLON":
    case "FORMLAR":
      return "FORMS";

    case "INSTRUCTION":
    case "INSTRUCTIONS":
    case "PROCEDURE":
    case "PROCEDURES":
    case "TALIMAT":
    case "TALİMAT":
    case "TALIMATLAR":
    case "TALİMATLAR":
      return "INSTRUCTIONS";

    case "BOARD":
    case "COMMITTEE":
    case "KURUL":
    case "KURUL_KAYITLARI":
      return "BOARD";

    case "EMPLOYEE_REPRESENTATIVE":
    case "EMPLOYEE_REP":
    case "CALISAN_TEMSILCISI":
    case "ÇALIŞAN_TEMSİLCİSİ":
      return "EMPLOYEE_REPRESENTATIVE";

    case "PERIODIC_CONTROL":
    case "PERIODIC_INSPECTION":
    case "MEASUREMENT":
    case "PERIYODIK_KONTROL":
    case "PERİYODİK_KONTROL":
    case "ORTAM_OLCUMU":
    case "ORTAM_ÖLÇÜMÜ":
      return "PERIODIC_CONTROL";

    default:
      return "FORMS";
  }
}

export function normalizeDocumentationStatus(
  value: unknown,
  validUntilMillis?: number | null
): DocumentationStatus {
  const now = Date.now();

  if (
    validUntilMillis !== null &&
    validUntilMillis !== undefined &&
    validUntilMillis > 0 &&
    validUntilMillis < now
  ) {
    return "EXPIRED";
  }

  const normalized = toStringValue(
    value
  )
    .toLocaleUpperCase("tr-TR")
    .replace(/[\s-]+/g, "_");

  switch (normalized) {
    case "ACTIVE":
    case "AKTIF":
    case "AKTİF":
    case "PUBLISHED":
    case "YAYINDA":
      return "ACTIVE";

    case "REVISION":
    case "REVIZYON":
    case "REVİZYON":
    case "IN_REVISION":
    case "REVIZYONDA":
    case "REVİZYONDA":
      return "REVISION";

    case "EXPIRED":
    case "SURESI_DOLDU":
    case "SÜRESİ_DOLDU":
    case "OUTDATED":
      return "EXPIRED";

    case "ARCHIVED":
    case "ARSIV":
    case "ARŞİV":
    case "ARSIVLENDI":
    case "ARŞİVLENDİ":
      return "ARCHIVED";

    case "DRAFT":
    case "TASLAK":
    default:
      return "DRAFT";
  }
}

export function normalizeDocumentationFileType(
  value: unknown,
  fileName?: string | null
): DocumentationFileType | null {
  const rawValue = toStringValue(
    value
  )
    .toLocaleUpperCase("tr-TR")
    .replace(".", "");

  const extension =
    toStringValue(fileName)
      .split(".")
      .pop()
      ?.toLocaleUpperCase("tr-TR") ||
    "";

  const normalized =
    rawValue || extension;

  switch (normalized) {
    case "PDF":
      return "PDF";

    case "DOC":
      return "DOC";

    case "DOCX":
      return "DOCX";

    case "XLS":
      return "XLS";

    case "XLSX":
      return "XLSX";

    case "PPT":
      return "PPT";

    case "PPTX":
      return "PPTX";

    case "JPG":
    case "JPEG":
    case "PNG":
    case "WEBP":
    case "GIF":
    case "IMAGE":
      return "IMAGE";

    case "":
      return null;

    default:
      return "OTHER";
  }
}

export function mapDocumentationRecord(
  input: unknown
): DocumentationRecord {
  const row = asObject(input);

  const id = toStringValue(
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

  const firmId = toStringValue(
    readValue(row, [
      "firm_id",
      "firmId",
      "company_id",
      "companyId",
      "web_firm_id",
      "webFirmId",
    ])
  );

  const localFirmId =
    toNullableNumber(
      readValue(row, [
        "local_firm_id",
        "localFirmId",
      ])
    );

  const syncKey = toStringValue(
    readValue(row, [
      "sync_key",
      "syncKey",
    ]),
    id
  );

  const publishedAtMillis =
    toMillis(
      readValue(row, [
        "published_at_millis",
        "publishedAtMillis",
        "published_at",
        "publishedAt",
        "publish_date_millis",
        "publishDateMillis",
      ])
    );

  const validUntilMillis =
    toMillis(
      readValue(row, [
        "valid_until_millis",
        "validUntilMillis",
        "valid_until",
        "validUntil",
        "expiry_date_millis",
        "expiryDateMillis",
      ])
    );

  const revisionDateMillis =
    toMillis(
      readValue(row, [
        "revision_date_millis",
        "revisionDateMillis",
        "revision_date",
        "revisionDate",
      ])
    );

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

 const fileName =
  toStringValue(
    readValue(row, [
      "file_name",
      "fileName",
      "document_file_name",
    ])
  ) || undefined;

  const rawStatus = readValue(
    row,
    [
      "status",
      "document_status",
      "documentStatus",
    ]
  );

  return {
    id:
      id ||
      syncKey ||
      `documentation-${createdAtMillis}`,

    firmId,

    localFirmId,

    syncKey:
      syncKey ||
      id ||
      undefined,

    category:
      normalizeDocumentationCategory(
        readValue(row, [
          "category",
          "document_category",
          "documentCategory",
          "type",
          "document_type",
          "documentType",
        ])
      ),

    title: toStringValue(
      readValue(row, [
        "title",
        "name",
        "document_name",
        "documentName",
      ]),
      "Adsız Doküman"
    ),

    description:
      toStringValue(
        readValue(row, [
          "description",
          "details",
          "content",
          "summary",
        ])
      ) || undefined,

    documentNo:
      toStringValue(
        readValue(row, [
          "document_no",
          "documentNo",
          "document_number",
          "documentNumber",
          "code",
        ])
      ) || "-",

    revisionNo:
      toStringValue(
        readValue(row, [
          "revision_no",
          "revisionNo",
          "revision_number",
          "revisionNumber",
        ])
      ) || "R0",

    preparedBy:
      toStringValue(
        readValue(row, [
          "prepared_by",
          "preparedBy",
          "creator_name",
          "creatorName",
        ])
      ) || "-",

    approvedBy:
      toStringValue(
        readValue(row, [
          "approved_by",
          "approvedBy",
          "approver_name",
          "approverName",
        ])
      ) || "-",

    department:
      toStringValue(
        readValue(row, [
          "department",
          "unit",
          "department_name",
          "departmentName",
        ])
      ) || undefined,

    fileName,

    fileUrl:
      toNullableString(
        readValue(row, [
          "file_url",
          "fileUrl",
          "document_url",
          "documentUrl",
          "public_url",
          "publicUrl",
        ])
      ),

    fileType:
      normalizeDocumentationFileType(
        readValue(row, [
          "file_type",
          "fileType",
          "mime_type",
          "mimeType",
        ]),
        fileName
      ),

    fileSizeBytes:
      toNullableNumber(
        readValue(row, [
          "file_size_bytes",
          "fileSizeBytes",
          "file_size",
          "fileSize",
        ])
      ),

    publishedAtMillis,

    validUntilMillis,

    revisionDateMillis,

    status:
      normalizeDocumentationStatus(
        rawStatus,
        validUntilMillis
      ),

    tags: toStringArray(
      readValue(row, [
        "tags",
        "labels",
      ])
    ),

    notes:
      toStringValue(
        readValue(row, [
          "notes",
          "note",
          "remarks",
        ])
      ) || undefined,

    readApprovalRequired:
      toBooleanValue(
        readValue(row, [
          "read_approval_required",
          "readApprovalRequired",
          "requires_read_approval",
          "requiresReadApproval",
        ])
      ),

    qrEnabled:
      toBooleanValue(
        readValue(row, [
          "qr_enabled",
          "qrEnabled",
        ])
      ),

    source:
      toStringValue(
        readValue(row, [
          "source",
          "record_source",
          "recordSource",
        ])
      ).toLocaleUpperCase("tr-TR") ===
      "APP"
        ? "APP"
        : "WEB",

    version: toNumberValue(
      readValue(row, [
        "version",
        "record_version",
        "recordVersion",
      ]),
      1
    ),

    syncStatus:
      (() => {
        const status =
          toStringValue(
            readValue(row, [
              "sync_status",
              "syncStatus",
            ])
          ).toLocaleUpperCase(
            "tr-TR"
          );

        if (
          status === "PENDING" ||
          status === "SYNCING" ||
          status === "SYNCED" ||
          status === "FAILED"
        ) {
          return status;
        }

        return "SYNCED";
      })(),

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

export function mapDocumentationRecords(
  input: unknown
): DocumentationRecord[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) =>
      mapDocumentationRecord(item)
    )
    .filter(
      (record) => !record.isDeleted
    )
    .sort(
      (a, b) =>
        b.updatedAtMillis -
        a.updatedAtMillis
    );
}

export function mapDocumentationToDatabase(
  record: Partial<DocumentationRecord>
): Record<string, unknown> {
  const now = Date.now();

  return {
    id: record.id || undefined,

    firm_id: record.firmId,

    local_firm_id:
      record.localFirmId ?? null,

    sync_key:
      record.syncKey ||
      record.id ||
      undefined,

    category:
      record.category || "FORMS",

    title:
      record.title?.trim() ||
      "Adsız Doküman",

    description:
      record.description?.trim() ||
      null,

    document_no:
      record.documentNo?.trim() ||
      "-",

    revision_no:
      record.revisionNo?.trim() ||
      "R0",

    prepared_by:
      record.preparedBy?.trim() ||
      null,

    approved_by:
      record.approvedBy?.trim() ||
      null,

    department:
      record.department?.trim() ||
      null,

    file_name:
      record.fileName?.trim() ||
      null,

    file_url:
      record.fileUrl || null,

    file_type:
      record.fileType || null,

    file_size_bytes:
      record.fileSizeBytes ?? null,

    published_at_millis:
      record.publishedAtMillis ?? null,

    valid_until_millis:
      record.validUntilMillis ?? null,

    revision_date_millis:
      record.revisionDateMillis ?? null,

    status:
      record.status || "DRAFT",

    tags:
      Array.isArray(record.tags)
        ? record.tags
        : [],

    notes:
      record.notes?.trim() ||
      null,

    read_approval_required:
      record.readApprovalRequired === true,

    qr_enabled:
      record.qrEnabled === true,

    source:
      record.source || "WEB",

    version:
      record.version ?? 1,

    sync_status:
      record.syncStatus || "SYNCED",

    sync_error:
      record.syncError ?? null,

    last_synced_at_millis:
      record.lastSyncedAtMillis ??
      now,

    is_deleted:
      record.isDeleted === true,

    deleted_at_millis:
      record.deletedAtMillis ?? null,

    created_at_millis:
      record.createdAtMillis ?? now,

    updated_at_millis:
      record.updatedAtMillis ?? now,
  };
}