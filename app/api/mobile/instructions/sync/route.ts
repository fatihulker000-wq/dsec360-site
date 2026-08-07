import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_KEY = "dsec_mobile_123";

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

  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function authorized(request: Request): boolean {
  return (
    clean(request.headers.get("x-api-key")) === API_KEY
  );
}

function supabaseAdmin() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase bağlantı bilgileri eksik."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function millis(
  value: string | null | undefined
): number {
  if (!value) return 0;

  const parsed =
    new Date(value).getTime();

  return Number.isNaN(parsed)
    ? 0
    : parsed;
}

function normalize(
  row: InstructionRow
) {
  return {
    id: row.id,

    companyId:
      row.company_id,

    instructionCode:
      row.instruction_code,

    title:
      row.title,

    shortTitle:
      row.short_title ?? "",

    category:
      row.category,

    purpose:
      row.purpose ?? "",

    scope:
      row.scope ?? "",

    responsibilities:
      row.responsibilities ?? "",

    contentJson:
      Array.isArray(row.content_json)
        ? row.content_json
        : [],

    attachmentsJson:
      Array.isArray(row.attachments_json)
        ? row.attachments_json
        : [],

    versionNo:
      Number(row.version_no || 1),

    revisionNo:
      Number(row.revision_no || 0),

    revisionReason:
      row.revision_reason ?? "",

    status:
      row.status,

    isSystem:
      Boolean(row.is_system),

    isActive:
      Boolean(row.is_active),

    isDeleted:
      Boolean(row.is_deleted),

    requiresReadConfirmation:
      Boolean(
        row.requires_read_confirmation
      ),

    publishedAtMillis:
      millis(row.published_at),

    createdAtMillis:
      millis(row.created_at),

    updatedAtMillis:
      millis(row.updated_at),
  };
}

export async function GET(
  request: Request
) {
  try {
    if (!authorized(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Yetkisiz istek.",
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

    let query =
      supabaseAdmin()
        .from(
          "instruction_library"
        )
        .select(
          `
          id,
          company_id,
          instruction_code,
          title,
          short_title,
          category,
          purpose,
          scope,
          responsibilities,
          content_json,
          attachments_json,
          version_no,
          revision_no,
          revision_reason,
          status,
          is_system,
          is_active,
          is_deleted,
          requires_read_confirmation,
          published_at,
          created_at,
          updated_at
          `
        );

    /*
     * Genel sistem talimatları +
     * seçili firmaya özel talimatlar.
     */
    if (companyId) {
      query =
        query.or(
          `company_id.is.null,company_id.eq.${companyId}`
        );
    } else {
      query =
        query.is(
          "company_id",
          null
        );
    }

    const {
      data,
      error,
    } =
      await query
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

    const records =
      (data ?? []).map(
        normalize
      );

    return NextResponse.json({
      success: true,
      serverTime:
        Date.now(),
      companyId:
        companyId || null,
      total:
        records.length,
      records,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Talimat senkronizasyonu yapılamadı.",
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