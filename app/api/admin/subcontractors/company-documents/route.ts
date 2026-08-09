import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function nullableText(value: unknown): string | null {
  const result = text(value);
  return result || null;
}

function nullableNumber(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function createSyncKey(
  firmId: string,
  companyId: string,
  docKey: string
) {
  return [
    "COMPANY_DOC",
    firmId,
    companyId,
    docKey,
    Date.now(),
  ].join("-");
}

/* =========================================================
   POST
   YENİ FİRMA EVRAKI EKLE
   ========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const firmId = text(body.firmId);
    const companyId = text(body.companyId);

    const docKey =
      text(body.docKey).toUpperCase();

    const docTitle = text(body.docTitle);

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error: "Firm ID zorunludur.",
        },
        { status: 400 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Taşeron firma ID zorunludur.",
        },
        { status: 400 }
      );
    }

    if (!docKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Evrak kodu zorunludur.",
        },
        { status: 400 }
      );
    }

    if (!docTitle) {
      return NextResponse.json(
        {
          success: false,
          error: "Evrak adı zorunludur.",
        },
        { status: 400 }
      );
    }

    const now = Date.now();

    /*
     * Aynı firmaya aynı doc_key ile ikinci
     * aktif evrak açılmasını engelliyoruz.
     */
    const { data: existing, error: existingError } =
      await supabase
        .from("subcontractor_company_documents")
        .select("id")
        .eq("firm_id", firmId)
        .eq("company_id", companyId)
        .eq("doc_key", docKey)
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
            "Bu firmada aynı evrak koduyla kayıt zaten mevcut.",
        },
        { status: 409 }
      );
    }

    const syncKey =
      text(body.syncKey) ||
      createSyncKey(
        firmId,
        companyId,
        docKey
      );

    const { data, error } =
      await supabase
        .from("subcontractor_company_documents")
        .insert({
          firm_id: firmId,
          company_id: companyId,

          app_local_id: null,

          sync_key: syncKey,

          doc_key: docKey,
          doc_title: docTitle,

          is_required:
            body.isRequired !== false,

          status:
            text(body.status).toUpperCase() ||
            "EKSIK",

          file_url:
            nullableText(body.fileUrl),

          valid_until_millis:
            nullableNumber(
              body.validUntilMillis
            ),

          note:
            text(body.note),

          is_deleted: false,
          deleted_at_millis: null,

          source: "WEB",

          updated_at_millis: now,
          created_at_millis: now,
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
      "COMPANY DOCUMENT POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Firma evrakı eklenemedi.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH
   FİRMA EVRAKINI GÜNCELLE
   ========================================================= */

export async function PATCH(
  request: NextRequest
) {
  try {
    const body = await request.json();

    const id = text(body.id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Evrak ID zorunludur.",
        },
        { status: 400 }
      );
    }

    const now = Date.now();

    const updateData: Record<
      string,
      unknown
    > = {
      updated_at_millis: now,
      source: "WEB",
    };

    if (body.docKey !== undefined) {
      updateData.doc_key =
        text(body.docKey).toUpperCase();
    }

    if (body.docTitle !== undefined) {
      updateData.doc_title =
        text(body.docTitle);
    }

    if (body.isRequired !== undefined) {
      updateData.is_required =
        Boolean(body.isRequired);
    }

    if (body.status !== undefined) {
      updateData.status =
        text(body.status).toUpperCase();
    }

    if (body.fileUrl !== undefined) {
      updateData.file_url =
        nullableText(body.fileUrl);
    }

    if (
      body.validUntilMillis !== undefined
    ) {
      updateData.valid_until_millis =
        nullableNumber(
          body.validUntilMillis
        );
    }

    if (body.note !== undefined) {
      updateData.note =
        text(body.note);
    }

    const { data, error } =
      await supabase
        .from("subcontractor_company_documents")
        .update(updateData)
        .eq("id", id)
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
      "COMPANY DOCUMENT PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Firma evrakı güncellenemedi.",
      },
      { status: 500 }
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
    const body = await request.json();

    const id = text(body.id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Evrak ID zorunludur.",
        },
        { status: 400 }
      );
    }

    const now = Date.now();

    const { data, error } =
      await supabase
        .from("subcontractor_company_documents")
        .update({
          is_deleted: true,
          deleted_at_millis: now,
          updated_at_millis: now,
          source: "WEB",
        })
        .eq("id", id)
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
      "COMPANY DOCUMENT DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Firma evrakı silinemedi.",
      },
      { status: 500 }
    );
  }
}