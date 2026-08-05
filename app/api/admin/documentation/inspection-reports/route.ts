import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const firmId = clean(
      url.searchParams.get("firmId")
    );

    const reportId = clean(
      url.searchParams.get("id")
    );

    const supabase = getSupabase();

    let query = supabase
      .from(
        "inspection_report_archive"
      )
      .select("*")
      .order("inspection_date", {
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

    if (reportId) {
      query = query.eq(
        "id",
        reportId
      );
    }

    const {
      data: reportRows,
      error: reportsError,
    } = await query;

    if (reportsError) {
      throw new Error(
        reportsError.message
      );
    }

    const reports =
      Array.isArray(reportRows)
        ? reportRows
        : [];

    const {
      data: formRows,
      error: formsError,
    } = await supabase
      .from("inspection_forms")
      .select(
        "id,title,code,category,form_type,version_no"
      );

    if (formsError) {
      throw new Error(
        formsError.message
      );
    }

    const forms =
      Array.isArray(formRows)
        ? formRows
        : [];

    const compact = (
      value: unknown
    ): string =>
      clean(value)
        .toLocaleLowerCase("tr-TR")
        .replace(/[^a-z0-9]/g, "");

    const readable = (
      value: unknown
    ): string =>
      clean(value)
        .replace(
          /WEB[\s_-]*STANDARD/gi,
          ""
        )
        .replace(
          /[0-9a-f]{32}/gi,
          ""
        )
        .replace(
          /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
          ""
        )
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const formMap =
      new Map<string, any>();

    forms.forEach((form: any) => {
      [
        clean(form.id),
        compact(form.id),
        clean(form.code),
        compact(form.code),
      ]
        .filter(Boolean)
        .forEach((key) => {
          formMap.set(key, form);
        });
    });

    const enrichedReports =
      reports.map((report: any) => {
        const candidates = [
          report.form_id,
          report.form_remote_id,
          report.form_title,
          report.inspection_name,
          report.inspection_remote_id,
        ];

        let resolvedForm:
          Record<string, unknown> | null =
          null;

        for (const candidate of candidates) {
          const direct =
            clean(candidate);

          const compactCandidate =
            compact(candidate);

          resolvedForm =
            formMap.get(direct) ||
            formMap.get(
              compactCandidate
            ) ||
            null;

          if (resolvedForm) {
            break;
          }

          for (const form of forms) {
            const compactFormId =
              compact(form.id);

            if (
              compactFormId &&
              compactCandidate.includes(
                compactFormId
              )
            ) {
              resolvedForm = form;
              break;
            }
          }

          if (resolvedForm) {
            break;
          }
        }

        const fallbackTitle =
          readable(
            report.inspection_name
          ) ||
          readable(
            report.form_title
          ) ||
          "Denetim Formu";

        return {
          ...report,
          form: resolvedForm,
          display_form_title:
            clean(
              resolvedForm?.title
            ) ||
            fallbackTitle,
          display_form_code:
            clean(
              resolvedForm?.code
            ) ||
            "Arşiv Kaydı",
        };
      });

    return NextResponse.json({
      success: true,
      reports:
        enrichedReports,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Denetim raporları alınamadı.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const firmId = clean(body.firmId);
    const formTitle = clean(body.formTitle);

    if (!firmId || !formTitle) {
      return NextResponse.json(
        {
          success: false,
          error:
            "firmId ve formTitle zorunlu.",
        },
        { status: 400 }
      );
    }

    const payload = {
      firm_id: firmId,
      form_id:
        clean(body.formId) || null,

      inspection_remote_id:
        clean(body.inspectionRemoteId) ||
        null,

      form_title: formTitle,
      inspector_name:
        clean(body.inspectorName),

      inspection_date:
        clean(body.inspectionDate) ||
        null,

      compliance_rate:
        body.complianceRate == null
          ? null
          : numberValue(
              body.complianceRate
            ),

      total_item_count:
        numberValue(
          body.totalItemCount
        ),

      compliant_count:
        numberValue(
          body.compliantCount
        ),

      partial_count:
        numberValue(
          body.partialCount
        ),

      non_compliant_count:
        numberValue(
          body.nonCompliantCount
        ),

      critical_count:
        numberValue(
          body.criticalCount
        ),

      report_status:
        clean(body.reportStatus) ||
        "COMPLETED",

      generated_pdf_url:
        clean(body.generatedPdfUrl) ||
        null,

      signed_pdf_url:
        clean(body.signedPdfUrl) ||
        null,

      updated_at:
        new Date().toISOString(),
    };

    const supabase = getSupabase();

    const remoteId =
      clean(body.inspectionRemoteId);

    if (remoteId) {
      const { data, error } =
        await supabase
          .from(
            "inspection_report_archive"
          )
          .upsert(payload, {
            onConflict:
              "inspection_remote_id",
          })
          .select("*")
          .single();

      if (error) {
        throw new Error(error.message);
      }

      return NextResponse.json({
        success: true,
        report: data,
      });
    }

    const { data, error } =
      await supabase
        .from(
          "inspection_report_archive"
        )
        .insert(payload)
        .select("*")
        .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      report: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Denetim raporu arşivlenemedi.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = clean(body.id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Rapor ID zorunlu.",
        },
        { status: 400 }
      );
    }

    const update: Record<
      string,
      unknown
    > = {
      updated_at:
        new Date().toISOString(),
    };

    if (
      body.generatedPdfUrl !==
      undefined
    ) {
      update.generated_pdf_url =
        clean(body.generatedPdfUrl) ||
        null;
    }

    if (
      body.signedPdfUrl !==
      undefined
    ) {
      update.signed_pdf_url =
        clean(body.signedPdfUrl) ||
        null;
    }

    if (
      body.reportStatus !== undefined
    ) {
      update.report_status =
        clean(body.reportStatus) ||
        "COMPLETED";
    }

    const { data, error } =
      await getSupabase()
        .from(
          "inspection_report_archive"
        )
        .update(update)
        .eq("id", id)
        .select("*")
        .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      report: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Denetim raporu güncellenemedi.",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}