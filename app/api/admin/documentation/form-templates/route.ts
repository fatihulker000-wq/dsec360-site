import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const id = clean(searchParams.get("id"));
    const companyId = clean(searchParams.get("companyId"));
    const category = clean(searchParams.get("category"));
    const status = clean(searchParams.get("status"));

    let query = getSupabase()
      .from("form_template_library")
      .select("*")
      .eq("is_deleted", false)
      .order("category", { ascending: true })
      .order("short_title", {
        ascending: true,
        nullsFirst: false,
      })
      .order("title", { ascending: true });

    if (id) {
      query = query.eq("id", id);
    }

    if (companyId) {
      query = query.or(
        `company_id.is.null,company_id.eq.${companyId}`
      );
    } else if (!id) {
      query = query.is("company_id", null);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const records = data ?? [];

    return NextResponse.json({
      success: true,
      records,
      record:
        id && records.length > 0
          ? records[0]
          : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Form şablonları alınamadı.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const templateCode = clean(
      body.templateCode
    ).toUpperCase();

    const title = clean(body.title);
    const shortTitle = clean(
      body.shortTitle
    );

    if (!templateCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Şablon kodu zorunludur.",
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: "Form başlığı zorunludur.",
        },
        { status: 400 }
      );
    }

    const payload = {
      company_id:
        clean(body.companyId) || null,

      template_code: templateCode,
      title,
      short_title:
        shortTitle || title,

      category:
        clean(body.category) || "OTHER",

      form_type:
        clean(body.formType) || "STANDARD",

      source_module: "DOCUMENTATION",

      target_module:
        clean(body.targetModule) || null,

      description:
        clean(body.description) || null,

      legal_basis:
        clean(body.legalBasis) || null,

      version_no:
        Number(body.versionNo || 1),

      revision_no:
        Number(body.revisionNo || 0),

      schema_json:
        body.schemaJson &&
        typeof body.schemaJson === "object" &&
        !Array.isArray(body.schemaJson)
          ? body.schemaJson
          : {},

      sections_json:
        Array.isArray(body.sectionsJson)
          ? body.sectionsJson
          : [],

      fields_json:
        Array.isArray(body.fieldsJson)
          ? body.fieldsJson
          : [],

      status:
        clean(body.status) || "PUBLISHED",

      is_system: Boolean(body.isSystem),
      is_active: true,
      is_deleted: false,

      created_by:
        clean(body.createdBy) || null,

      updated_by:
        clean(body.createdBy) || null,

      published_at:
        clean(body.status) === "DRAFT"
          ? null
          : new Date().toISOString(),

      updated_at:
        new Date().toISOString(),
    };

    const { data, error } =
      await getSupabase()
        .from("form_template_library")
        .insert(payload)
        .select("*")
        .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      record: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Form şablonu oluşturulamadı.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = clean(body.id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Şablon ID bulunamadı.",
        },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = {
      updated_at:
        new Date().toISOString(),
    };

    if (body.title !== undefined) {
      update.title = clean(body.title);
    }

    if (body.shortTitle !== undefined) {
      update.short_title =
        clean(body.shortTitle);
    }

    if (body.category !== undefined) {
      update.category =
        clean(body.category);
    }

    if (body.formType !== undefined) {
      update.form_type =
        clean(body.formType);
    }

    if (body.targetModule !== undefined) {
      update.target_module =
        clean(body.targetModule) || null;
    }

    if (body.description !== undefined) {
      update.description =
        clean(body.description) || null;
    }

    if (body.legalBasis !== undefined) {
      update.legal_basis =
        clean(body.legalBasis) || null;
    }

    if (body.versionNo !== undefined) {
      update.version_no =
        Number(body.versionNo || 1);
    }

    if (body.revisionNo !== undefined) {
      update.revision_no =
        Number(body.revisionNo || 0);
    }

    if (
      body.schemaJson !== undefined &&
      body.schemaJson &&
      typeof body.schemaJson === "object" &&
      !Array.isArray(body.schemaJson)
    ) {
      update.schema_json =
        body.schemaJson;
    }

    if (body.sectionsJson !== undefined) {
      update.sections_json =
        Array.isArray(body.sectionsJson)
          ? body.sectionsJson
          : [];
    }

    if (body.fieldsJson !== undefined) {
      update.fields_json =
        Array.isArray(body.fieldsJson)
          ? body.fieldsJson
          : [];
    }

    if (body.status !== undefined) {
      const nextStatus =
        clean(body.status) || "DRAFT";

      update.status = nextStatus;

      if (nextStatus === "PUBLISHED") {
        update.published_at =
          new Date().toISOString();
      }
    }

    if (body.updatedBy !== undefined) {
      update.updated_by =
        clean(body.updatedBy) || null;
    }

    const { data, error } =
      await getSupabase()
        .from("form_template_library")
        .update(update)
        .eq("id", id)
        .select("*")
        .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      record: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Form şablonu güncellenemedi.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } =
      new URL(req.url);

    const id = clean(
      searchParams.get("id")
    );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Şablon ID bulunamadı.",
        },
        { status: 400 }
      );
    }

    const { data: existing, error: readError } =
      await getSupabase()
        .from("form_template_library")
        .select("id,is_system")
        .eq("id", id)
        .single();

    if (readError) {
      throw new Error(readError.message);
    }

    if (existing?.is_system) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Sistem şablonları silinemez.",
        },
        { status: 400 }
      );
    }

    const { error } =
      await getSupabase()
        .from("form_template_library")
        .update({
          is_deleted: true,
          is_active: false,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Form şablonu silinemedi.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}