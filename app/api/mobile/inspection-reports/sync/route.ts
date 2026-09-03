import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API_KEY = "dsec_mobile_123";

type JsonRecord = Record<string, unknown>;

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
): JsonRecord {
  return value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as JsonRecord)
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

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
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

export async function POST(req: Request) {
  try {
    const apiKey = clean(
      req.headers.get("x-api-key")
    );

    if (apiKey !== API_KEY) {
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

    const inspectionRemoteId = clean(
      body.inspectionRemoteId ??
        body.inspectionId ??
        body.inspection_remote_id
    );

    const formTitle = clean(
      body.formTitle ??
        body.formName ??
        body.form_title
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

    if (!inspectionRemoteId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "inspectionRemoteId zorunlu.",
        },
        { status: 400 }
      );
    }

    if (!formTitle) {
      return NextResponse.json(
        {
          success: false,
          error: "formTitle zorunlu.",
        },
        { status: 400 }
      );
    }

    const completedAt =
      isoDateOrNull(
        body.completedAt ??
          body.completed_at ??
          body.inspectionDate
      ) ??
      new Date().toISOString();

    const startedAt =
      isoDateOrNull(
        body.startedAt ??
          body.started_at
      );

    const totalItemCount =
      numberValue(
        body.totalItemCount ??
          body.total_items
      );

    const compliantCount =
      numberValue(
        body.compliantCount ??
          body.okCount ??
          body.ok_count
      );

    const partialCount =
      numberValue(
        body.partialCount ??
          body.partial_count
      );

    const nonCompliantCount =
      numberValue(
        body.nonCompliantCount ??
          body.nokCount ??
          body.nok_count
      );

    const notApplicableCount =
      numberValue(
        body.notApplicableCount ??
          body.naCount ??
          body.na_count
      );

    const criticalCount =
      numberValue(
        body.criticalCount ??
          body.critical_count
      );

    const complianceRate =
      nullableNumber(
        body.complianceRate ??
          body.compliance_rate
      );

    const score =
      nullableNumber(
        body.score
      );

    const durationMinutes =
      numberValue(
        body.durationMinutes ??
          body.duration_minutes ??
          body.duration
      );

    const resultJson =
      jsonObject(
        body.resultJson ??
          body.result_json ??
          body.statistics
      );

    const photosJson =
      jsonArray(
        body.photosJson ??
          body.photos_json ??
          body.photos
      );

    const payload = {
      firm_id: firmId,

      form_id:
        clean(
          body.formId ??
            body.form_id
        ) || null,

      form_remote_id:
        clean(
          body.formRemoteId ??
            body.form_remote_id
        ) || null,

      inspection_remote_id:
        inspectionRemoteId,

      inspection_name:
        clean(
          body.inspectionName ??
            body.inspection_name
        ) || formTitle,

      form_title: formTitle,

      inspector_name:
        clean(
          body.inspectorName ??
            body.inspector ??
            body.inspector_name
        ),

      inspection_date:
        completedAt,

      started_at:
        startedAt,

      completed_at:
        completedAt,

      duration_minutes:
        durationMinutes,

      compliance_rate:
        complianceRate,

      score,

      total_item_count:
        totalItemCount,

      compliant_count:
        compliantCount,

      partial_count:
        partialCount,

      non_compliant_count:
        nonCompliantCount,

      not_applicable_count:
        notApplicableCount,

      critical_count:
        criticalCount,

      report_status:
        clean(
          body.reportStatus ??
            body.report_status
        ) || "COMPLETED",

      result_json:
        resultJson,

      photos_json:
        photosJson,

      generated_pdf_url:
        clean(
          body.generatedPdfUrl ??
            body.pdfUrl ??
            body.generated_pdf_url
        ) || null,

      signed_pdf_url:
        clean(
          body.signedPdfUrl ??
            body.signed_pdf_url
        ) || null,

      source: "APP",

      sync_version:
        numberValue(
          body.syncVersion ??
            body.sync_version,
          1
        ),

      updated_at:
        new Date().toISOString(),
    };

    const supabase = getSupabase();

    const {
      data: existing,
      error: findError,
    } = await supabase
      .from(
        "inspection_report_archive"
      )
      .select("id")
      .eq(
        "inspection_remote_id",
        inspectionRemoteId
      )
      .maybeSingle();

    if (findError) {
      throw new Error(
        findError.message
      );
    }

    let data:
      Record<string, unknown>;

    if (existing?.id) {
      const {
        data: updated,
        error: updateError,
      } = await supabase
        .from(
          "inspection_report_archive"
        )
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      data = updated;
    } else {
      const {
        data: inserted,
        error: insertError,
      } = await supabase
        .from(
          "inspection_report_archive"
        )
        .insert(payload)
        .select("*")
        .single();

      if (insertError) {
        throw new Error(
          insertError.message
        );
      }

      data = inserted;
    }

    return NextResponse.json({
      success: true,
      reportId:
        clean(data.id),
      inspectionRemoteId:
        clean(
          data.inspection_remote_id
        ),
      updatedAt:
        clean(data.updated_at),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Denetim raporu web arşivine kaydedilemedi.",
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
    const apiKey = clean(
      req.headers.get("x-api-key")
    );

    if (apiKey !== API_KEY) {
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

    const inspectionRemoteId = clean(
      url.searchParams.get(
        "inspectionRemoteId"
      )
    );

    const supabase = getSupabase();

    /*
     * Önce mevcut gerçek arşiv kayıtlarını getir.
     * inspection_report_archive.firm_id UUID/text tuttuğu için mevcut
     * davranışı koruyoruz.
     */
    let archiveQuery = supabase
      .from("inspection_report_archive")
      .select("*")
      .order("completed_at", {
        ascending: false,
        nullsFirst: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (firmId) {
      archiveQuery = archiveQuery.eq(
        "firm_id",
        firmId
      );
    }

    if (inspectionRemoteId) {
      archiveQuery = archiveQuery.eq(
        "inspection_remote_id",
        inspectionRemoteId
      );
    }

    const { data: archiveRows, error: archiveError } =
      await archiveQuery;

    if (archiveError) {
      throw new Error(archiveError.message);
    }

    const reports: any[] = [...(archiveRows ?? [])];

    /*
     * Web'deki denetim_runs kayıtlarını da arşiv görünümüne eklemek için
     * UUID firmId -> companies.local_firm_id eşlemesi yap.
     * denetim_runs üzerinde varlığı kesin olmayan web_firm_id kolonu KULLANILMAZ.
     */
    let localFirmId: number | null = null;
    const numericFirmId = Number(firmId);

    if (Number.isFinite(numericFirmId) && numericFirmId > 0) {
      localFirmId = numericFirmId;
    } else if (firmId) {
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("local_firm_id")
        .eq("id", firmId)
        .maybeSingle();

      if (!companyError) {
        const mapped = Number((company as any)?.local_firm_id);
        if (Number.isFinite(mapped) && mapped > 0) {
          localFirmId = mapped;
        }
      }
    }

    if (localFirmId !== null) {
      let runsQuery = supabase
        .from("denetim_runs")
        .select("*")
        .eq("firm_id", localFirmId)
        .order("created_at_millis", {
          ascending: false,
          nullsFirst: false,
        });

      if (inspectionRemoteId) {
        const numericInspectionId =
          Number(inspectionRemoteId);

        if (
          Number.isFinite(numericInspectionId) &&
          numericInspectionId > 0
        ) {
          runsQuery = runsQuery.eq(
            "id",
            numericInspectionId
          );
        } else {
          runsQuery = runsQuery.limit(0);
        }
      }

      const { data: runs, error: runsError } =
        await runsQuery;

      if (runsError) {
        throw new Error(runsError.message);
      }

      const safeRuns = runs ?? [];
      const runIds = safeRuns
        .map((r: any) => r.id)
        .filter(
          (id: any) =>
            id !== null &&
            id !== undefined
        );

      let answers: any[] = [];

      if (runIds.length > 0) {
        const {
          data: answerRows,
          error: answersError,
        } = await supabase
          .from("denetim_answers")
          .select("*")
          .in("run_remote_id", runIds);

        if (answersError) {
          throw new Error(
            answersError.message
          );
        }

        answers = answerRows ?? [];
      }

      const existingRemoteIds =
        new Set(
          reports
            .map((r: any) =>
              clean(
                r.inspection_remote_id
              )
            )
            .filter(Boolean)
        );

      for (const run of safeRuns as any[]) {
        const remoteId = clean(run.id);

        if (
          !remoteId ||
          existingRemoteIds.has(remoteId)
        ) {
          continue;
        }

        const runAnswers =
          answers.filter(
            (a: any) =>
              clean(a.run_remote_id) ===
              remoteId
          );

        let compliant = 0;
        let partial = 0;
        let nonCompliant = 0;
        let notApplicable = 0;

        for (const answer of runAnswers) {
          const result = clean(
            answer.result
          ).toUpperCase();

          if (
            result === "UYGUN" ||
            result === "YETERLI" ||
            result === "YETERLİ"
          ) {
            compliant++;
          } else if (
            result.includes("KISMEN")
          ) {
            partial++;
          } else if (
            result === "NA" ||
            result === "N/A" ||
            result.includes("KAPSAM")
          ) {
            notApplicable++;
          } else if (result) {
            nonCompliant++;
          }
        }

        const totalItemCount =
          runAnswers.length;

        const rate =
          totalItemCount > 0
            ? Math.round(
                (
                  (
                    compliant +
                    partial * 0.5
                  ) /
                  totalItemCount
                ) *
                  10000
              ) / 100
            : null;

        const timestamp =
          numberValue(
            run.audit_date_millis ??
              run.created_at_millis,
            Date.now()
          );

        const completedAt =
          new Date(
            timestamp
          ).toISOString();

        reports.push({
          id: `denetim-run-${remoteId}`,
          firm_id: firmId,
          form_id: null,
          form_remote_id: null,
          inspection_remote_id:
            remoteId,
          inspection_name:
            clean(run.template_type) ||
            `Denetim ${remoteId}`,
          form_title:
            clean(run.template_type) ||
            "Klasik Denetim",
          inspector_name:
            clean(
              run.inspector_name
            ),
          inspection_date:
            completedAt,
          started_at: null,
          completed_at:
            completedAt,
          duration_minutes: 0,
          compliance_rate: rate,
          score: null,
          total_item_count:
            totalItemCount,
          compliant_count:
            compliant,
          partial_count:
            partial,
          non_compliant_count:
            nonCompliant,
          not_applicable_count:
            notApplicable,
          critical_count: 0,
          report_status:
            clean(run.status) ||
            "COMPLETED",
          result_json: {
            source: "denetim_runs",
            location:
              clean(run.location),
            responsible:
              clean(
                run.responsible
              ),
            reportNo:
              clean(run.report_no),
            generalNote:
              clean(
                run.general_note
              ),
          },
          photos_json: [],
          generated_pdf_url: null,
          signed_pdf_url: null,
          source: "WEB",
          sync_version: 1,
          created_at:
            completedAt,
          updated_at:
            new Date().toISOString(),
        });
      }
    }

    reports.sort(
      (a: any, b: any) =>
        new Date(
          b.completed_at ||
            b.inspection_date ||
            0
        ).getTime() -
        new Date(
          a.completed_at ||
            a.inspection_date ||
            0
        ).getTime()
    );

    return NextResponse.json({
      success: true,
      count: reports.length,
      reports,
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
