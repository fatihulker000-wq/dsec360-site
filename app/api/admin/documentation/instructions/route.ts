import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type JsonRecord = Record<string, unknown>;

type InstructionRow = {
  id: string;
  company_id: string | null;

  instruction_code: string;
  title: string;
  short_title: string | null;

  category: string;

  purpose: string | null;
  scope: string | null;
  responsibilities: string | null;

  content_json: unknown[] | null;
  attachments_json: unknown[] | null;

  version_no: number;
  revision_no: number;
  revision_reason: string | null;

  status: string;

  is_system: boolean;
  is_active: boolean;
  is_deleted: boolean;

  requires_read_confirmation: boolean;

  created_by: string | null;
  updated_by: string | null;

  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function getSupabase() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalize(row: InstructionRow) {
  return {
    id: row.id,
    companyId: row.company_id,

    instructionCode: row.instruction_code,
    title: row.title,
    shortTitle: row.short_title ?? "",

    category: row.category,

    purpose: row.purpose ?? "",
    scope: row.scope ?? "",
    responsibilities: row.responsibilities ?? "",

    contentJson: Array.isArray(row.content_json)
      ? row.content_json
      : [],

    attachmentsJson: Array.isArray(row.attachments_json)
      ? row.attachments_json
      : [],

    versionNo: Number(row.version_no || 1),
    revisionNo: Number(row.revision_no || 0),

    revisionReason:
      row.revision_reason ?? "",

    status: row.status,

    isSystem: Boolean(row.is_system),
    isActive: Boolean(row.is_active),
    isDeleted: Boolean(row.is_deleted),

    requiresReadConfirmation:
      Boolean(
        row.requires_read_confirmation
      ),

    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(
  request: Request
) {
  try {
    const url =
      new URL(request.url);

    const id =
      clean(
        url.searchParams.get("id")
      );

    const companyId =
      clean(
        url.searchParams.get(
          "companyId"
        )
      );

    const category =
      clean(
        url.searchParams.get(
          "category"
        )
      ).toUpperCase();

    const status =
      clean(
        url.searchParams.get(
          "status"
        )
      ).toUpperCase();

    let query =
      getSupabase()
        .from(
          "instruction_library"
        )
        .select("*")
        .eq(
          "is_deleted",
          false
        );

    if (id) {
      const {
        data,
        error,
      } = await query
        .eq(
          "id",
          id
        )
        .maybeSingle<InstructionRow>();

      if (error) {
        throw new Error(
          error.message
        );
      }

      return NextResponse.json({
        success: true,
        record:
          data
            ? normalize(data)
            : null,
      });
    }

    if (companyId) {
      query =
        query.or(
          `company_id.is.null,company_id.eq.${companyId}`
        );
    }

    if (category) {
      query =
        query.eq(
          "category",
          category
        );
    }

    if (status) {
      query =
        query.eq(
          "status",
          status
        );
    }

    const {
      data,
      error,
    } = await query
      .order(
        "updated_at",
        {
          ascending: false,
        }
      )
      .returns<
        InstructionRow[]
      >();

    if (error) {
      throw new Error(
        error.message
      );
    }

    return NextResponse.json({
      success: true,
      total:
        data?.length ?? 0,
      records:
        (data ?? []).map(
          normalize
        ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Talimat kayıtları alınamadı.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as JsonRecord;

    const instructionCode =
      clean(
        body.instructionCode
      ).toUpperCase();

    const title =
      clean(
        body.title
      );

    if (!instructionCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Talimat kodu zorunludur.",
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
            "Talimat başlığı zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const now =
      new Date().toISOString();

    const status =
      clean(
        body.status
      ).toUpperCase() ||
      "DRAFT";

    const payload = {
      company_id:
        clean(
          body.companyId
        ) || null,

      instruction_code:
        instructionCode,

      title,

      short_title:
        clean(
          body.shortTitle
        ) || null,

      category:
        clean(
          body.category
        ).toUpperCase() ||
        "GENERAL",

      purpose:
        clean(
          body.purpose
        ) || null,

      scope:
        clean(
          body.scope
        ) || null,

      responsibilities:
        clean(
          body.responsibilities
        ) || null,

      content_json:
        Array.isArray(
          body.contentJson
        )
          ? body.contentJson
          : [],

      attachments_json:
        Array.isArray(
          body.attachmentsJson
        )
          ? body.attachmentsJson
          : [],

      version_no:
        Math.max(
          1,
          Number(
            body.versionNo || 1
          )
        ),

      revision_no:
        Math.max(
          0,
          Number(
            body.revisionNo || 0
          )
        ),

      revision_reason:
        clean(
          body.revisionReason
        ) || null,

      status,

      is_system:
        Boolean(
          body.isSystem
        ),

      is_active:
        body.isActive === false
          ? false
          : true,

      is_deleted:
        false,

      requires_read_confirmation:
        body.requiresReadConfirmation ===
        false
          ? false
          : true,

      published_at:
        status === "PUBLISHED"
          ? now
          : null,

      created_at:
        now,

      updated_at:
        now,
    };

    const {
      data,
      error,
    } =
      await getSupabase()
        .from(
          "instruction_library"
        )
        .insert(
          payload
        )
        .select("*")
        .single<InstructionRow>();

    if (error) {
      throw new Error(
        error.message
      );
    }

    return NextResponse.json({
      success: true,
      record:
        normalize(data),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Talimat oluşturulamadı.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const body =
      (await request.json()) as JsonRecord;

    const id =
      clean(
        body.id
      );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Talimat kimliği zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const payload: JsonRecord = {
      updated_at:
        new Date().toISOString(),
    };

    if (
      body.instructionCode !==
      undefined
    ) {
      payload.instruction_code =
        clean(
          body.instructionCode
        ).toUpperCase();
    }

    if (
      body.title !==
      undefined
    ) {
      payload.title =
        clean(
          body.title
        );
    }

    if (
      body.shortTitle !==
      undefined
    ) {
      payload.short_title =
        clean(
          body.shortTitle
        ) || null;
    }

    if (
      body.category !==
      undefined
    ) {
      payload.category =
        clean(
          body.category
        ).toUpperCase();
    }

    if (
      body.purpose !==
      undefined
    ) {
      payload.purpose =
        clean(
          body.purpose
        ) || null;
    }

    if (
      body.scope !==
      undefined
    ) {
      payload.scope =
        clean(
          body.scope
        ) || null;
    }

    if (
      body.responsibilities !==
      undefined
    ) {
      payload.responsibilities =
        clean(
          body.responsibilities
        ) || null;
    }

    if (
      body.contentJson !==
      undefined
    ) {
      payload.content_json =
        Array.isArray(
          body.contentJson
        )
          ? body.contentJson
          : [];
    }

    if (
      body.attachmentsJson !==
      undefined
    ) {
      payload.attachments_json =
        Array.isArray(
          body.attachmentsJson
        )
          ? body.attachmentsJson
          : [];
    }

    if (
      body.versionNo !==
      undefined
    ) {
      payload.version_no =
        Math.max(
          1,
          Number(
            body.versionNo
          )
        );
    }

    if (
      body.revisionNo !==
      undefined
    ) {
      payload.revision_no =
        Math.max(
          0,
          Number(
            body.revisionNo
          )
        );
    }

    if (
      body.revisionReason !==
      undefined
    ) {
      payload.revision_reason =
        clean(
          body.revisionReason
        ) || null;
    }

    if (
      body.status !==
      undefined
    ) {
      const nextStatus =
        clean(
          body.status
        ).toUpperCase();

      payload.status =
        nextStatus;

      if (
        nextStatus ===
        "PUBLISHED"
      ) {
        payload.published_at =
          new Date().toISOString();
      }
    }

    if (
      body.requiresReadConfirmation !==
      undefined
    ) {
      payload.requires_read_confirmation =
        Boolean(
          body.requiresReadConfirmation
        );
    }

    if (
      body.isActive !==
      undefined
    ) {
      payload.is_active =
        Boolean(
          body.isActive
        );
    }

    const {
      data,
      error,
    } =
      await getSupabase()
        .from(
          "instruction_library"
        )
        .update(
          payload
        )
        .eq(
          "id",
          id
        )
        .select("*")
        .single<InstructionRow>();

    if (error) {
      throw new Error(
        error.message
      );
    }

    return NextResponse.json({
      success: true,
      record:
        normalize(data),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Talimat güncellenemedi.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request
) {
  try {
    const url =
      new URL(
        request.url
      );

    const id =
      clean(
        url.searchParams.get(
          "id"
        )
      );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Talimat kimliği zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      error,
    } =
      await getSupabase()
        .from(
          "instruction_library"
        )
        .update({
          is_deleted: true,
          is_active: false,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          id
        );

    if (error) {
      throw new Error(
        error.message
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Talimat silinemedi.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}