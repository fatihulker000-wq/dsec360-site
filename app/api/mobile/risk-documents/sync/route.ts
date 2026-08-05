import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_KEY = "dsec_mobile_123";

type JsonObject = Record<string, unknown>;

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function numberValue(
  value: unknown,
  fallback = 0
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function nullableNumber(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    clean(value) === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function jsonObject(
  value: unknown
): JsonObject {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function jsonArray(
  value: unknown
): unknown[] {
  return Array.isArray(value)
    ? value
    : [];
}

function isoDateOrNull(
  value: unknown
): string | null {
  const text = clean(value);

  if (!text) {
    return null;
  }

  const date = new Date(text);

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString();
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

function isAuthorized(req: Request): boolean {
  return (
    clean(req.headers.get("x-api-key")) ===
    API_KEY
  );
}

export async function POST(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json(
        {
          success: false,
          error: "Yetkisiz istek.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const firmId = clean(
      body.firmId ??
        body.firm_id
    );

    const assessmentRemoteId = clean(
      body.assessmentRemoteId ??
        body.assessment_remote_id
    );

    const documentTitle = clean(
      body.documentTitle ??
        body.document_title
    );

    const riskMethod = clean(
      body.riskMethod ??
        body.risk_method
    );

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error: "firmId zorunlu.",
        },
        { status: 400 }
      );
    }

    if (!assessmentRemoteId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "assessmentRemoteId zorunlu.",
        },
        { status: 400 }
      );
    }

    if (!documentTitle) {
      return NextResponse.json(
        {
          success: false,
          error:
            "documentTitle zorunlu.",
        },
        { status: 400 }
      );
    }

    if (!riskMethod) {
      return NextResponse.json(
        {
          success: false,
          error:
            "riskMethod zorunlu.",
        },
        { status: 400 }
      );
    }

    const payload = {
      firm_id: firmId,

      assessment_remote_id:
        assessmentRemoteId,

      document_title:
        documentTitle,

      risk_method:
        riskMethod,

      assessment_date:
        isoDateOrNull(
          body.assessmentDate ??
            body.assessment_date
        ),

      prepared_by:
        clean(
          body.preparedBy ??
            body.prepared_by
        ),

      location:
        clean(body.location),

      department:
        clean(body.department),

      revision_no:
        numberValue(
          body.revisionNo ??
            body.revision_no,
          1
        ),

      total_item_count:
        numberValue(
          body.totalItemCount ??
            body.total_item_count
        ),

      critical_count:
        numberValue(
          body.criticalCount ??
            body.critical_count
        ),

      high_count:
        numberValue(
          body.highCount ??
            body.high_count
        ),

      medium_count:
        numberValue(
          body.mediumCount ??
            body.medium_count
        ),

      low_count:
        numberValue(
          body.lowCount ??
            body.low_count
        ),

      open_dof_count:
        numberValue(
          body.openDofCount ??
            body.open_dof_count
        ),

      compliance_rate:
        nullableNumber(
          body.complianceRate ??
            body.compliance_rate
        ),

      result_json:
        jsonObject(
          body.resultJson ??
            body.result_json
        ),

      items_json:
        jsonArray(
          body.itemsJson ??
            body.items_json
        ),

      generated_pdf_url:
        clean(
          body.generatedPdfUrl ??
            body.generated_pdf_url
        ) || null,

      signed_pdf_url:
        clean(
          body.signedPdfUrl ??
            body.signed_pdf_url
        ) || null,

      report_status:
        clean(
          body.reportStatus ??
            body.report_status
        ) || "COMPLETED",

      source:
        clean(body.source) ||
        "APP",

      updated_at:
        new Date().toISOString(),
    };
        const supabase = getSupabase();

    const { data, error } =
      await supabase
        .from(
          "risk_document_archive"
        )
        .upsert(payload, {
          onConflict:
            "assessment_remote_id",
        })
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
          "Risk değerlendirmesi arşive kaydedilemedi.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json(
        {
          success: false,
          error: "Yetkisiz istek.",
        },
        { status: 401 }
      );
    }

    const url = new URL(req.url);

    const firmId = clean(
      url.searchParams.get("firmId")
    );

    const riskMethod = clean(
      url.searchParams.get(
        "riskMethod"
      )
    );

    const supabase = getSupabase();

    let query = supabase
      .from(
        "risk_document_archive"
      )
      .select("*")
      .order("assessment_date", {
        ascending: false,
        nullsFirst: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (firmId) {
      query = query.eq(
        "firm_id",
        firmId
      );
    }

    if (riskMethod) {
      query = query.eq(
        "risk_method",
        riskMethod
      );
    }

    const { data, error } =
      await query;

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      records: data ?? [],
    });
        return NextResponse.json({
      success: true,
      records: data ?? [],
    });

  } catch (error) {

    return NextResponse.json(
      {
        success: false,
        error:
          "Risk dokümanları alınamadı.",

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