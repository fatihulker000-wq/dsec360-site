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
  DocumentationSavePayload,
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

function normalizeString(
  value: unknown
): string {
  return String(value ?? "").trim();
}

function normalizeNullableNumber(
  value: unknown
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

export async function GET(
  request: NextRequest
) {
  try {
    const supabase =
      getSupabaseAdmin();

    const searchParams =
      request.nextUrl.searchParams;

    const firmId = normalizeString(
      searchParams.get("firmId")
    );

    const category = normalizeString(
      searchParams.get("category")
    );

    const status = normalizeString(
      searchParams.get("status")
    );

    const search = normalizeString(
      searchParams.get("search")
    );

    let query = supabase
      .from("documentation_records")
      .select("*")
      .eq("is_deleted", false)
      .order("updated_at_millis", {
        ascending: false,
      });

    if (firmId) {
      query = query.eq(
        "firm_id",
        firmId
      );
    }

    if (category) {
      query = query.eq(
        "category",
        category
      );
    }

    if (status) {
      query = query.eq(
        "status",
        status
      );
    }

    if (search) {
      const escapedSearch = search
        .replace(/[%_,]/g, " ")
        .trim();

      if (escapedSearch) {
        query = query.or(
          [
            `title.ilike.%${escapedSearch}%`,
            `document_no.ilike.%${escapedSearch}%`,
            `description.ilike.%${escapedSearch}%`,
            `prepared_by.ilike.%${escapedSearch}%`,
            `approved_by.ilike.%${escapedSearch}%`,
          ].join(",")
        );
      }
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      throw error;
    }

    const records = (
      Array.isArray(data)
        ? data
        : []
    ).map((row) =>
      mapDocumentationRecord(row)
    );

    return NextResponse.json(
      {
        success: true,
        data: records,
        count: records.length,
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
      "Doküman kayıtları alınamadı."
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const supabase =
      getSupabaseAdmin();

    const body =
      (await request.json()) as
        DocumentationSavePayload;

    const firmId = normalizeString(
      body?.firmId
    );

    const title = normalizeString(
      body?.title
    );

    const documentNo =
      normalizeString(
        body?.documentNo
      );

    const category =
      normalizeString(
        body?.category
      );

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Doküman kaydı için firma seçimi zorunludur.",
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
            "Doküman adı zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (!documentNo) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Doküman numarası zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Doküman kategorisi zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const now = Date.now();
    const id = crypto.randomUUID();
    const syncKey =
      normalizeString(
        body.syncKey
      ) || id;

    const databaseRecord =
      mapDocumentationToDatabase({
        ...body,

        id,

        firmId,

        syncKey,

        title,

        documentNo,

        revisionNo:
          normalizeString(
            body.revisionNo
          ) || "R0",

        preparedBy:
          normalizeString(
            body.preparedBy
          ) || "-",

        approvedBy:
          normalizeString(
            body.approvedBy
          ) || "-",

        localFirmId:
          normalizeNullableNumber(
            body.localFirmId
          ),

        status:
          body.status || "DRAFT",

        source: "WEB",

        version:
          Number(body.version || 1),

        syncStatus: "SYNCED",

        syncError: null,

        lastSyncedAtMillis: now,

        isDeleted: false,

        deletedAtMillis: null,

        createdAtMillis: now,

        updatedAtMillis: now,
      });

    const {
      data,
      error,
    } = await supabase
      .from("documentation_records")
      .insert(databaseRecord)
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
              "Bu doküman numarası veya senkronizasyon anahtarı daha önce kullanılmış.",
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
          "Doküman kaydı oluşturuldu.",
      },
      {
        status: 201,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return errorResponse(
      error,
      "Doküman kaydı oluşturulamadı."
    );
  }
}