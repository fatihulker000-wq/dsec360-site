import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  mapDocumentationRecord,
  mapDocumentationToDatabase,
} from "@/lib/documentation/mapper";

import type {
  DocumentationRecord,
} from "@/lib/documentation/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
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
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function normalizeString(
  value: unknown
): string {
  return String(value ?? "").trim();
}

function errorResponse(
  error: unknown,
  fallback: string,
  status = 500
) {
  console.error(fallback, error);

  return NextResponse.json(
    {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : fallback,
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

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const normalizedId =
      normalizeString(id);

    if (!normalizedId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Doküman kimliği eksik.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();

    const {
      data,
      error,
    } = await supabase
      .from("documentation_records")
      .select("*")
      .eq("id", normalizedId)
      .eq("is_deleted", false)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Doküman kaydı bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data:
          mapDocumentationRecord(
            data
          ),
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return errorResponse(
      error,
      "Doküman kaydı alınamadı."
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const normalizedId =
      normalizeString(id);

    if (!normalizedId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Doküman kimliği eksik.",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      (await request.json()) as Partial<DocumentationRecord>;

    const supabase =
      getSupabaseAdmin();

    const {
      data: existing,
      error: existingError,
    } = await supabase
      .from("documentation_records")
      .select("*")
      .eq("id", normalizedId)
      .eq("is_deleted", false)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Güncellenecek doküman kaydı bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    const mappedExisting =
      mapDocumentationRecord(
        existing
      );

    const now = Date.now();

    const mergedRecord: Partial<DocumentationRecord> =
      {
        ...mappedExisting,
        ...body,

        id: normalizedId,

        firmId:
          normalizeString(
            body.firmId
          ) ||
          mappedExisting.firmId,

        title:
          normalizeString(
            body.title
          ) ||
          mappedExisting.title,

        documentNo:
          normalizeString(
            body.documentNo
          ) ||
          mappedExisting.documentNo,

        revisionNo:
          normalizeString(
            body.revisionNo
          ) ||
          mappedExisting.revisionNo,

        preparedBy:
          normalizeString(
            body.preparedBy
          ) ||
          mappedExisting.preparedBy,

        approvedBy:
          normalizeString(
            body.approvedBy
          ) ||
          mappedExisting.approvedBy,

        syncKey:
          normalizeString(
            body.syncKey
          ) ||
          mappedExisting.syncKey ||
          normalizedId,

        version:
          Number(
            body.version ??
              mappedExisting.version ??
              1
          ) + 1,

        source: "WEB",

        syncStatus: "SYNCED",

        syncError: null,

        lastSyncedAtMillis: now,

        updatedAtMillis: now,

        isDeleted: false,

        deletedAtMillis: null,
      };

    const updatePayload =
      mapDocumentationToDatabase(
        mergedRecord
      );

    delete updatePayload.id;
    delete updatePayload.created_at_millis;

    const {
      data,
      error,
    } = await supabase
      .from("documentation_records")
      .update(updatePayload)
      .eq("id", normalizedId)
      .eq("is_deleted", false)
      .select("*")
      .single();

    if (error) {
      if (
        error.code === "23505"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Bu doküman numarası veya senkronizasyon anahtarı başka bir kayıtta kullanılıyor.",
          },
          {
            status: 409,
          }
        );
      }

      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        data:
          mapDocumentationRecord(
            data
          ),
        message:
          "Doküman kaydı güncellendi.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return errorResponse(
      error,
      "Doküman kaydı güncellenemedi."
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const normalizedId =
      normalizeString(id);

    if (!normalizedId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Doküman kimliği eksik.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();

    const now = Date.now();

    const {
      data,
      error,
    } = await supabase
      .from("documentation_records")
      .update({
        is_deleted: true,
        deleted_at_millis: now,
        updated_at_millis: now,
        sync_status: "SYNCED",
        sync_error: null,
        last_synced_at_millis: now,
        source: "WEB",
      })
      .eq("id", normalizedId)
      .eq("is_deleted", false)
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Silinecek doküman kaydı bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Doküman kaydı silindi.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return errorResponse(
      error,
      "Doküman kaydı silinemedi."
    );
  }
}