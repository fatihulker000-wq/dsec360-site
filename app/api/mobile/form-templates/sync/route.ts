import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_KEY = "dsec_mobile_123";

type JsonRecord = Record<string, unknown>;

type FormTemplateRow = {
  id: string;
  company_id: string | null;

  template_code: string;
  title: string;
  short_title: string | null;

  category: string;
  form_type: string;

  source_module: string;
  target_module: string | null;

  description: string | null;
  legal_basis: string | null;

  version_no: number;
  revision_no: number;

  schema_json: JsonRecord | null;
  sections_json: unknown[] | null;
  fields_json: unknown[] | null;

  status: string;
  is_system: boolean;
  is_active: boolean;
  is_deleted: boolean;

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
  const url = process.env.SUPABASE_URL;
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

function isAuthorized(
  request: Request
): boolean {
  return (
    clean(
      request.headers.get("x-api-key")
    ) === API_KEY
  );
}

function toMillis(
  value: string | null | undefined
): number {
  if (!value) return 0;

  const millis =
    new Date(value).getTime();

  return Number.isNaN(millis)
    ? 0
    : millis;
}

function normalizeTemplate(
  row: FormTemplateRow
) {
  return {
    id: row.id,

    companyId:
      row.company_id,

    templateCode:
      row.template_code,

    title:
      row.title,

    shortTitle:
      row.short_title ?? "",

    category:
      row.category,

    formType:
      row.form_type,

    sourceModule:
      row.source_module,

    targetModule:
      row.target_module ?? "",

    description:
      row.description ?? "",

    legalBasis:
      row.legal_basis ?? "",

    versionNo:
      Number(
        row.version_no || 1
      ),

    revisionNo:
      Number(
        row.revision_no || 0
      ),

    schemaJson:
      row.schema_json ?? {},

    sectionsJson:
      Array.isArray(
        row.sections_json
      )
        ? row.sections_json
        : [],

    fieldsJson:
      Array.isArray(
        row.fields_json
      )
        ? row.fields_json
        : [],

    status:
      row.status,

    isSystem:
      Boolean(
        row.is_system
      ),

    isActive:
      Boolean(
        row.is_active
      ),

    publishedAtMillis:
      toMillis(
        row.published_at
      ),

    createdAtMillis:
      toMillis(
        row.created_at
      ),

    updatedAtMillis:
      toMillis(
        row.updated_at
      ),
  };
}

/**
 * Mobil uygulamanın yayımlanmış boş form
 * şablonlarını indirdiği endpoint.
 *
 * Örnek:
 *
 * GET /api/mobile/form-templates/sync
 *
 * GET /api/mobile/form-templates/sync?companyId=UUID
 *
 * GET /api/mobile/form-templates/sync?companyId=UUID&category=EK2
 *
 * GET /api/mobile/form-templates/sync?templateCode=EK2_ISE_GIRIS
 */
export async function GET(
  request: Request
) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Yetkisiz istek.",
        },
        {
          status: 401,
        }
      );
    }

    const url =
      new URL(request.url);

    const companyId =
      clean(
        url.searchParams.get(
          "companyId"
        ) ??
          url.searchParams.get(
            "firmId"
          )
      );

    const category =
      clean(
        url.searchParams.get(
          "category"
        )
      ).toUpperCase();

    const templateCode =
      clean(
        url.searchParams.get(
          "templateCode"
        )
      ).toUpperCase();

    const targetModule =
      clean(
        url.searchParams.get(
          "targetModule"
        )
      ).toUpperCase();

    const updatedAfterText =
      clean(
        url.searchParams.get(
          "updatedAfter"
        )
      );

    let query =
      getSupabase()
        .from(
          "form_template_library"
        )
        .select(
          `
          id,
          company_id,
          template_code,
          title,
          short_title,
          category,
          form_type,
          source_module,
          target_module,
          description,
          legal_basis,
          version_no,
          revision_no,
          schema_json,
          sections_json,
          fields_json,
          status,
          is_system,
          is_active,
          is_deleted,
          created_by,
          updated_by,
          published_at,
          created_at,
          updated_at
          `
        )
        .eq(
          "is_deleted",
          false
        )
        .eq(
          "is_active",
          true
        )
        .eq(
          "status",
          "PUBLISHED"
        );

    /*
     * Firma seçildiyse:
     * - Genel sistem şablonları
     * - Seçili firmaya özel şablonlar
     *
     * birlikte gelir.
     */
    if (companyId) {
      query = query.or(
        `company_id.is.null,company_id.eq.${companyId}`
      );
    } else {
      /*
       * Firma bilgisi gönderilmezse
       * sadece genel sistem şablonları alınır.
       */
      query = query.is(
        "company_id",
        null
      );
    }

    if (category) {
      query = query.eq(
        "category",
        category
      );
    }

    if (templateCode) {
      query = query.eq(
        "template_code",
        templateCode
      );
    }

    if (targetModule) {
      query = query.eq(
        "target_module",
        targetModule
      );
    }

    if (updatedAfterText) {
      const updatedAfter =
        Number(
          updatedAfterText
        );

      if (
        Number.isFinite(
          updatedAfter
        ) &&
        updatedAfter > 0
      ) {
        query = query.gt(
          "updated_at",
          new Date(
            updatedAfter
          ).toISOString()
        );
      }
    }

    const {
      data,
      error,
    } = await query
      .order(
        "category",
        {
          ascending: true,
        }
      )
      .order(
        "short_title",
        {
          ascending: true,
          nullsFirst: false,
        }
      )
      .order(
        "title",
        {
          ascending: true,
        }
      )
      .returns<
        FormTemplateRow[]
      >();

    if (error) {
      throw new Error(
        error.message
      );
    }

    const templates =
      (data ?? []).map(
        normalizeTemplate
      );

    const ek2Count =
      templates.filter(
        (template) =>
          template.category ===
          "EK2"
      ).length;

    return NextResponse.json({
      success: true,

      serverTime:
        Date.now(),

      companyId:
        companyId || null,

      total:
        templates.length,

      ek2Count,

      templates,
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
      {
        status: 500,
      }
    );
  }
}