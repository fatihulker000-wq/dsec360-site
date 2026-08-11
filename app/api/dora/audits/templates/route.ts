import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function text(
  value: unknown
): string {
  return String(value ?? "").trim();
}

function nullableNumber(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function booleanValue(
  value: unknown,
  fallback: boolean
): boolean {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  const normalized =
    String(value)
      .trim()
      .toLowerCase();

  if (
    normalized === "true" ||
    normalized === "1"
  ) {
    return true;
  }

  if (
    normalized === "false" ||
    normalized === "0"
  ) {
    return false;
  }

  return fallback;
}

function normalizeAuditType(
  value: unknown
): string {
  return text(value)
    .toUpperCase()
    .replaceAll(" ", "_");
}

function normalizeStatus(
  value: unknown
): string {
  return text(value)
    .toUpperCase()
    .replaceAll(" ", "_");
}

const VALID_AUDIT_TYPES =
  new Set([
    "STANDART",
    "PUANLAMALI",
    "FOTOGRAFLI",
    "ELMERI",
  ]);

const VALID_STATUSES =
  new Set([
    "TASLAK",
    "YAYINLANDI",
    "PASIF",
  ]);

function createSyncKey(
  firmId: string
): string {
  return [
    "DORA",
    "AUDIT_TEMPLATE",
    firmId,
    Date.now(),
    crypto.randomUUID(),
  ].join("-");
}

/* =========================================================
GET
DORA DENETİM ŞABLONLARI
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const {
      searchParams,
    } = new URL(request.url);

    const firmId =
      text(
        searchParams.get(
          "firmId"
        )
      );

    const id =
      text(
        searchParams.get(
          "id"
        )
      );

    const status =
      normalizeStatus(
        searchParams.get(
          "status"
        )
      );

    const auditType =
      normalizeAuditType(
        searchParams.get(
          "auditType"
        )
      );

    if (
      !firmId &&
      !id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID veya şablon ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (id) {
      let query = supabase
        .from(
          "dora_audit_templates"
        )
        .select("*")
        .eq(
          "id",
          id
        )
        .eq(
          "is_deleted",
          false
        );

      if (firmId) {
        query =
          query.eq(
            "firm_id",
            firmId
          );
      }

      const {
        data,
        error,
      } = await query
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return NextResponse.json(
          {
            success: false,
            error:
              "DORA denetim şablonu bulunamadı.",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        success: true,
        template: data,
      });
    }

    let query = supabase
      .from(
        "dora_audit_templates"
      )
      .select("*")
      .eq(
        "firm_id",
        firmId
      )
      .eq(
        "is_deleted",
        false
      );

    if (
      status &&
      VALID_STATUSES.has(
        status
      )
    ) {
      query =
        query.eq(
          "status",
          status
        );
    }

    if (
      auditType &&
      VALID_AUDIT_TYPES.has(
        auditType
      )
    ) {
      query =
        query.eq(
          "audit_type",
          auditType
        );
    }

    const {
      data,
      error,
    } = await query
      .order(
        "updated_at_millis",
        {
          ascending: false,
        }
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      templates:
        data ?? [],
    });
  } catch (error) {
    console.error(
      "DORA AUDIT TEMPLATES GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetim şablonları alınamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
POST
YENİ DENETİM ŞABLONU
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const firmId =
      text(
        body.firmId ??
          body.firm_id
      );

    const title =
      text(
        body.title
      );

    const auditType =
      normalizeAuditType(
        body.auditType ??
          body.audit_type
      ) ||
      "STANDART";

    const status =
      normalizeStatus(
        body.status
      ) ||
      "TASLAK";

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Şablon adı zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !VALID_AUDIT_TYPES.has(
        auditType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Geçersiz denetim tipi.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !VALID_STATUSES.has(
        status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Geçersiz şablon durumu.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: firm,
      error: firmError,
    } = await supabase
      .from(
        "dora_firms"
      )
      .select("id")
      .eq(
        "id",
        firmId
      )
      .eq(
        "is_deleted",
        false
      )
      .maybeSingle();

    if (firmError) {
      throw firmError;
    }

    if (!firm) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firması bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    const syncKey =
      text(
        body.syncKey ??
          body.sync_key
      ) ||
      createSyncKey(
        firmId
      );

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_audit_templates"
      )
      .insert({
        firm_id:
          firmId,

        sync_key:
          syncKey,

        app_local_id:
          nullableNumber(
            body.appLocalId ??
              body.app_local_id
          ),

        source:
          "WEB",

        title,

        code:
          text(
            body.code
          ),

        category:
          text(
            body.category
          ).toUpperCase() ||
          "GENEL",

        description:
          text(
            body.description
          ),

        audit_type:
          auditType,

        status,

        version_no:
          nullableNumber(
            body.versionNo ??
              body.version_no
          ) ?? 1,

        is_active:
          booleanValue(
            body.isActive ??
              body.is_active,
            true
          ),

        is_deleted:
          false,

        deleted_at_millis:
          null,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      template: data,
    });
  } catch (error) {
    console.error(
      "DORA AUDIT TEMPLATES POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetim şablonu oluşturulamadı.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
PATCH
DENETİM ŞABLONU GÜNCELLE
========================================================= */

export async function PATCH(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const id =
      text(
        body.id
      );

    const firmId =
      text(
        body.firmId ??
          body.firm_id
      );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Şablon ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const updateData:
      Record<
        string,
        unknown
      > = {};

    if (
      body.title !==
      undefined
    ) {
      const title =
        text(
          body.title
        );

      if (!title) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Şablon adı boş bırakılamaz.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.title =
        title;
    }

    if (
      body.code !==
      undefined
    ) {
      updateData.code =
        text(
          body.code
        );
    }

    if (
      body.category !==
      undefined
    ) {
      updateData.category =
        text(
          body.category
        ).toUpperCase() ||
        "GENEL";
    }

    if (
      body.description !==
      undefined
    ) {
      updateData.description =
        text(
          body.description
        );
    }

    if (
      body.auditType !==
        undefined ||
      body.audit_type !==
        undefined
    ) {
      const auditType =
        normalizeAuditType(
          body.auditType ??
            body.audit_type
        );

      if (
        !VALID_AUDIT_TYPES.has(
          auditType
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Geçersiz denetim tipi.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.audit_type =
        auditType;
    }

    if (
      body.status !==
      undefined
    ) {
      const status =
        normalizeStatus(
          body.status
        );

      if (
        !VALID_STATUSES.has(
          status
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Geçersiz şablon durumu.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.status =
        status;
    }

    if (
      body.versionNo !==
        undefined ||
      body.version_no !==
        undefined
    ) {
      updateData.version_no =
        nullableNumber(
          body.versionNo ??
            body.version_no
        ) ?? 1;
    }

    if (
      body.isActive !==
        undefined ||
      body.is_active !==
        undefined
    ) {
      updateData.is_active =
        booleanValue(
          body.isActive ??
            body.is_active,
          true
        );
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_audit_templates"
      )
      .update(
        updateData
      )
      .eq(
        "id",
        id
      )
      .eq(
        "firm_id",
        firmId
      )
      .eq(
        "is_deleted",
        false
      )
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      template: data,
    });
  } catch (error) {
    console.error(
      "DORA AUDIT TEMPLATES PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetim şablonu güncellenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
DELETE
SOFT DELETE
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const id =
      text(
        body.id
      );

    const firmId =
      text(
        body.firmId ??
          body.firm_id
      );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Şablon ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const now =
      Date.now();

    const {
      data,
      error,
    } = await supabase
      .from(
        "dora_audit_templates"
      )
      .update({
        is_deleted:
          true,

        is_active:
          false,

        deleted_at_millis:
          now,
      })
      .eq(
        "id",
        id
      )
      .eq(
        "firm_id",
        firmId
      )
      .eq(
        "is_deleted",
        false
      )
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      id: data.id,
    });
  } catch (error) {
    console.error(
      "DORA AUDIT TEMPLATES DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA denetim şablonu silinemedi.",
      },
      {
        status: 500,
      }
    );
  }
}