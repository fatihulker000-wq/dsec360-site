import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function text(value: unknown): string {
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

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function intValue(
  value: unknown,
  fallback = 0
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? Math.floor(parsed)
    : fallback;
}

function booleanValue(
  value: unknown,
  fallback = true
): boolean {
  if (value === undefined) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized =
    text(value).toLowerCase();

  if (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "evet"
  ) {
    return true;
  }

  if (
    normalized === "false" ||
    normalized === "0" ||
    normalized === "hayır" ||
    normalized === "hayir"
  ) {
    return false;
  }

  return fallback;
}

function createSyncKey(
  firmId: string,
  documentType: string
) {
  return [
    "DORA",
    "DOCUMENT",
    firmId,
    documentType,
    Date.now(),
    crypto.randomUUID(),
  ].join("-");
}

function defaultDocumentNo(
  documentType: string
) {
  const clean =
    documentType
      .replace(/[^A-Z0-9_]/gi, "")
      .toUpperCase()
      .slice(0, 14);

  return `DORA-${clean}`;
}

/* =========================================================
GET
DORA DOKÜMANLARI
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const firmId =
      text(searchParams.get("firmId"));

    const id =
      text(searchParams.get("id"));

    const documentType =
      text(
        searchParams.get("documentType")
      ).toUpperCase();

    if (!firmId && !id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID veya doküman ID zorunludur.",
        },
        { status: 400 }
      );
    }

    if (id) {
      let query = supabase
        .from("dora_documents")
        .select("*")
        .eq("id", id)
        .eq("is_deleted", false);

      if (firmId) {
        query = query.eq(
          "firm_id",
          firmId
        );
      }

      const {
        data,
        error,
      } = await query.maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return NextResponse.json(
          {
            success: false,
            error:
              "DORA dokümanı bulunamadı.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        document: data,
      });
    }

    let query = supabase
      .from("dora_documents")
      .select("*")
      .eq("firm_id", firmId)
      .eq("is_deleted", false);

    if (documentType) {
      query = query.eq(
        "document_type",
        documentType
      );
    }

    const {
      data,
      error,
    } = await query.order(
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
      documents: data ?? [],
    });
  } catch (error) {
    console.error(
      "DORA DOCUMENTS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA dokümanları alınamadı.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
POST
YENİ DORA DOKÜMANI
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

    const documentType =
      text(
        body.documentType ??
          body.document_type
      ).toUpperCase();

    const title =
      text(body.title);

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID zorunludur.",
        },
        { status: 400 }
      );
    }

    if (!documentType) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Doküman türü zorunludur.",
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Doküman başlığı zorunludur.",
        },
        { status: 400 }
      );
    }

    const {
      data: firm,
      error: firmError,
    } = await supabase
      .from("dora_firms")
      .select("id")
      .eq("id", firmId)
      .eq("is_deleted", false)
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
        { status: 404 }
      );
    }

    const {
      data: existing,
      error: existingError,
    } = await supabase
      .from("dora_documents")
      .select("id")
      .eq("firm_id", firmId)
      .eq(
        "document_type",
        documentType
      )
      .eq("is_deleted", false)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bu doküman türü bu DORA firmasında zaten mevcut.",
        },
        { status: 409 }
      );
    }

    const now = Date.now();

    const syncKey =
      text(
        body.syncKey ??
          body.sync_key
      ) ||
      createSyncKey(
        firmId,
        documentType
      );

    const contentJson =
      body.contentJson ??
      body.content_json ??
      {};

    const {
      data,
      error,
    } = await supabase
      .from("dora_documents")
      .insert({
        firm_id: firmId,

        sync_key: syncKey,

        app_local_id:
          nullableNumber(
            body.appLocalId ??
              body.app_local_id
          ),

        app_firm_local_id:
          nullableNumber(
            body.appFirmLocalId ??
              body.app_firm_local_id
          ),

        document_type:
          documentType,

        title,

        status:
          text(body.status)
            .toUpperCase() ||
          "DRAFT",

        content_json:
          contentJson,

        file_url:
          text(
            body.fileUrl ??
              body.file_url
          ),

        version_no:
          Math.max(
            1,
            intValue(
              body.versionNo ??
                body.version_no,
              1
            )
          ),

        note:
          text(body.note),

        document_no:
          text(
            body.documentNo ??
              body.document_no
          ) ||
          defaultDocumentNo(
            documentType
          ),

        revision_no:
          Math.max(
            0,
            intValue(
              body.revisionNo ??
                body.revision_no,
              0
            )
          ),

        revision_date_millis:
          nullableNumber(
            body.revisionDateMillis ??
              body.revision_date_millis
          ),

        effective_date_millis:
          nullableNumber(
            body.effectiveDateMillis ??
              body.effective_date_millis
          ),

        expiry_date_millis:
          nullableNumber(
            body.expiryDateMillis ??
              body.expiry_date_millis
          ),

        prepared_by:
          text(
            body.preparedBy ??
              body.prepared_by
          ),

        approved_by:
          text(
            body.approvedBy ??
              body.approved_by
          ),

        approval_status:
          text(
            body.approvalStatus ??
              body.approval_status
          ).toUpperCase() ||
          "DRAFT",

        template_key:
          text(
            body.templateKey ??
              body.template_key
          ) ||
          documentType,

        template_version:
          Math.max(
            1,
            intValue(
              body.templateVersion ??
                body.template_version,
              1
            )
          ),

        generated_by_dora:
          booleanValue(
            body.generatedByDora ??
              body.generated_by_dora,
            true
          ),

        is_deleted: false,
        deleted_at_millis: null,

        source: "WEB",

        created_at_millis:
          now,

        updated_at_millis:
          now,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      document: data,
    });
  } catch (error) {
    console.error(
      "DORA DOCUMENTS POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA dokümanı oluşturulamadı.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
PATCH
DORA DOKÜMANINI GÜNCELLE
========================================================= */

export async function PATCH(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const id =
      text(body.id);

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
            "DORA doküman ID zorunludur.",
        },
        { status: 400 }
      );
    }

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID zorunludur.",
        },
        { status: 400 }
      );
    }

    const updateData:
      Record<string, unknown> = {
        updated_at_millis:
          Date.now(),
        source: "WEB",
      };

    if (
      body.title !== undefined
    ) {
      const title =
        text(body.title);

      if (!title) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Doküman başlığı boş bırakılamaz.",
          },
          { status: 400 }
        );
      }

      updateData.title =
        title;
    }

    if (
      body.status !== undefined
    ) {
      updateData.status =
        text(body.status)
          .toUpperCase();
    }

    if (
      body.contentJson !==
        undefined ||
      body.content_json !==
        undefined
    ) {
      updateData.content_json =
        body.contentJson ??
        body.content_json ??
        {};
    }

    if (
      body.fileUrl !==
        undefined ||
      body.file_url !==
        undefined
    ) {
      updateData.file_url =
        text(
          body.fileUrl ??
            body.file_url
        );
    }

    if (
      body.versionNo !==
        undefined ||
      body.version_no !==
        undefined
    ) {
      updateData.version_no =
        Math.max(
          1,
          intValue(
            body.versionNo ??
              body.version_no,
            1
          )
        );
    }

    if (
      body.note !== undefined
    ) {
      updateData.note =
        text(body.note);
    }

    if (
      body.documentNo !==
        undefined ||
      body.document_no !==
        undefined
    ) {
      updateData.document_no =
        text(
          body.documentNo ??
            body.document_no
        );
    }

    if (
      body.revisionNo !==
        undefined ||
      body.revision_no !==
        undefined
    ) {
      updateData.revision_no =
        Math.max(
          0,
          intValue(
            body.revisionNo ??
              body.revision_no,
            0
          )
        );
    }

    if (
      body.revisionDateMillis !==
        undefined ||
      body.revision_date_millis !==
        undefined
    ) {
      updateData.revision_date_millis =
        nullableNumber(
          body.revisionDateMillis ??
            body.revision_date_millis
        );
    }

    if (
      body.effectiveDateMillis !==
        undefined ||
      body.effective_date_millis !==
        undefined
    ) {
      updateData.effective_date_millis =
        nullableNumber(
          body.effectiveDateMillis ??
            body.effective_date_millis
        );
    }

    if (
      body.expiryDateMillis !==
        undefined ||
      body.expiry_date_millis !==
        undefined
    ) {
      updateData.expiry_date_millis =
        nullableNumber(
          body.expiryDateMillis ??
            body.expiry_date_millis
        );
    }

    if (
      body.preparedBy !==
        undefined ||
      body.prepared_by !==
        undefined
    ) {
      updateData.prepared_by =
        text(
          body.preparedBy ??
            body.prepared_by
        );
    }

    if (
      body.approvedBy !==
        undefined ||
      body.approved_by !==
        undefined
    ) {
      updateData.approved_by =
        text(
          body.approvedBy ??
            body.approved_by
        );
    }

    if (
      body.approvalStatus !==
        undefined ||
      body.approval_status !==
        undefined
    ) {
      updateData.approval_status =
        text(
          body.approvalStatus ??
            body.approval_status
        ).toUpperCase();
    }

    if (
      body.templateKey !==
        undefined ||
      body.template_key !==
        undefined
    ) {
      updateData.template_key =
        text(
          body.templateKey ??
            body.template_key
        );
    }

    if (
      body.templateVersion !==
        undefined ||
      body.template_version !==
        undefined
    ) {
      updateData.template_version =
        Math.max(
          1,
          intValue(
            body.templateVersion ??
              body.template_version,
            1
          )
        );
    }

    if (
      body.generatedByDora !==
        undefined ||
      body.generated_by_dora !==
        undefined
    ) {
      updateData.generated_by_dora =
        booleanValue(
          body.generatedByDora ??
            body.generated_by_dora,
          true
        );
    }

    const {
      data,
      error,
    } = await supabase
      .from("dora_documents")
      .update(updateData)
      .eq("id", id)
      .eq("firm_id", firmId)
      .eq("is_deleted", false)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      document: data,
    });
  } catch (error) {
    console.error(
      "DORA DOCUMENTS PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA dokümanı güncellenemedi.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
DELETE
DORA DOKÜMANI SOFT DELETE
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const id =
      text(body.id);

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
            "DORA doküman ID zorunludur.",
        },
        { status: 400 }
      );
    }

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "DORA firma ID zorunludur.",
        },
        { status: 400 }
      );
    }

    const now =
      Date.now();

    const {
      data,
      error,
    } = await supabase
      .from("dora_documents")
      .update({
        is_deleted: true,
        deleted_at_millis:
          now,
        updated_at_millis:
          now,
        source: "WEB",
      })
      .eq("id", id)
      .eq("firm_id", firmId)
      .eq("is_deleted", false)
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
      "DORA DOCUMENTS DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "DORA dokümanı silinemedi.",
      },
      { status: 500 }
    );
  }
}