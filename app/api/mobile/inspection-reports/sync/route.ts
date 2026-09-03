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
    const apiKey = clean(req.headers.get("x-api-key"));

    if (apiKey !== API_KEY) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz istek." },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const firmId = clean(url.searchParams.get("firmId"));
    const localFirmIdRaw = clean(
      url.searchParams.get("localFirmId")
    );
    const inspectionRemoteId = clean(
      url.searchParams.get("inspectionRemoteId")
    );

    const supabase = getSupabase();

    /*
     * APP artık remote UUID yanında localFirmId de gönderir.
     * denetim_runs.firm_id alanı için localFirmId otoritedir.
     */
    let localFirmId: number | null = null;
    const localNum = Number(localFirmIdRaw);

    if (Number.isFinite(localNum) && localNum > 0) {
      localFirmId = localNum;
    } else {
      const numericFirm = Number(firmId);

      if (Number.isFinite(numericFirm) && numericFirm > 0) {
        localFirmId = numericFirm;
      } else if (firmId) {
        const { data: company } = await supabase
          .from("companies")
          .select("local_firm_id")
          .eq("id", firmId)
          .maybeSingle();

        const mapped = Number(
          (company as any)?.local_firm_id
        );

        if (Number.isFinite(mapped) && mapped > 0) {
          localFirmId = mapped;
        }
      }
    }

    /*
     * Önce gerçek denetim_runs snapshot'ını al.
     * Dokümantasyon arşivinde 1 denetim = 1 rapor prensibi uygulanır.
     */
    let runs: any[] = [];

    if (localFirmId !== null) {
      let runsQuery = supabase
        .from("denetim_runs")
        .select("*")
        .eq("firm_id", localFirmId)
        .order("audit_date_millis", {
          ascending: false,
          nullsFirst: false,
        });

      const { data, error } = await runsQuery;

      if (error) {
        throw new Error(
          `Denetim kayıtları alınamadı: ${error.message}`
        );
      }

      runs = data ?? [];
    }

    const runIds = runs
      .map((r: any) => r.id)
      .filter(
        (id: any) =>
          id !== null &&
          id !== undefined
      );

    let answers: any[] = [];

    if (runIds.length > 0) {
      const { data, error } = await supabase
        .from("denetim_answers")
        .select("*")
        .in("run_remote_id", runIds);

      if (error) {
        throw new Error(
          `Denetim cevapları alınamadı: ${error.message}`
        );
      }

      answers = data ?? [];
    }

    /*
     * Daha önce gerçekten inspection_report_archive'a kaydedilmiş bir
     * rapor varsa metadata/PDF alanlarını korumak için bunları da al.
     */
    let archiveRows: any[] = [];

    if (firmId) {
      let archiveQuery = supabase
        .from("inspection_report_archive")
        .select("*")
        .eq("firm_id", firmId)
        .order("completed_at", {
          ascending: false,
          nullsFirst: false,
        });

      const { data, error } = await archiveQuery;

      if (error) {
        throw new Error(
          `Arşiv kayıtları alınamadı: ${error.message}`
        );
      }

      archiveRows = data ?? [];
    }

    const normalizeResult = (
      raw: unknown
    ): "OK" | "PARTIAL" | "NOK" | "NA" => {
      const value = clean(raw)
        .toUpperCase()
        .replace(/İ/g, "I");

      if (
        value === "UYGUN" ||
        value === "YETERLI" ||
        value === "EVET" ||
        value === "OK"
      ) {
        return "OK";
      }

      if (
        value.includes("KISMEN") ||
        value.includes("PARTIAL")
      ) {
        return "PARTIAL";
      }

      if (
        value === "NA" ||
        value === "N/A" ||
        value.includes("KAPSAM") ||
        value.includes("UYGULANAMAZ")
      ) {
        return "NA";
      }

      return "NOK";
    };

    const reports = runs.map(
      (run: any) => {
        const runId = clean(run.id);
        const appRunId = clean(
          run.app_run_id
        );

        const runAnswers =
          answers.filter(
            (a: any) =>
              clean(a.run_remote_id) === runId
          );

        let compliant = 0;
        let partial = 0;
        let nonCompliant = 0;
        let notApplicable = 0;
        let critical = 0;

        for (const answer of runAnswers) {
          const result =
            normalizeResult(answer.result);

          if (result === "OK") {
            compliant += 1;
          } else if (result === "PARTIAL") {
            partial += 1;
          } else if (result === "NA") {
            notApplicable += 1;
          } else {
            nonCompliant += 1;
          }

          const risk = clean(
            answer.risk_level ??
              answer.riskLevel
          ).toUpperCase();

          if (
            risk === "CRITICAL" ||
            risk === "KRITIK" ||
            risk === "KRİTİK"
          ) {
            critical += 1;
          }
        }

        const total =
          runAnswers.length;

        const complianceRate =
          total > 0
            ? Math.round(
                (
                  (
                    compliant +
                    partial * 0.5
                  ) /
                  total
                ) *
                  10000
              ) / 100
            : nullableNumber(
                run.score
              );

        /*
         * App'teki Web'den çekilmiş run.id = app_run_id olduğu için
         * inspection_remote_id olarak app_run_id kullanmak eşleşmeyi
         * kararlı hale getirir.
         */
        const stableRemoteId =
          appRunId || runId;

        const existing =
          archiveRows.find(
            (row: any) => {
              const remote = clean(
                row.inspection_remote_id
              );

              return (
                remote === stableRemoteId ||
                remote === runId
              );
            }
          );

        const millis =
          numberValue(
            run.audit_date_millis ??
              run.created_at_millis,
            Date.now()
          );

        const iso =
          new Date(millis)
            .toISOString();

        const status =
          clean(run.status)
            .toUpperCase();

        return {
          ...(existing ?? {}),

          id:
            clean(existing?.id) ||
            `DENETIM-${runId}`,

          firm_id:
            firmId ||
            clean(existing?.firm_id),

          inspection_remote_id:
            stableRemoteId,

          inspection_name:
            clean(
              existing?.inspection_name
            ) ||
            clean(run.template_type) ||
            `Denetim ${runId}`,

          form_title:
            clean(
              existing?.form_title
            ) ||
            clean(run.template_type) ||
            "Klasik Denetim",

          inspector_name:
            clean(
              run.inspector_name
            ) ||
            clean(
              existing?.inspector_name
            ) ||
            clean(run.responsible),

          inspection_date:
            iso,

          completed_at:
            iso,

          total_item_count:
            total,

          compliant_count:
            compliant,

          partial_count:
            partial,

          non_compliant_count:
            nonCompliant,

          not_applicable_count:
            notApplicable,

          critical_count:
            critical,

          compliance_rate:
            complianceRate,

          score:
            nullableNumber(
              run.score
            ),

          report_status:
            (
              status === "TAMAMLANDI" ||
              status === "COMPLETED"
            )
              ? "COMPLETED"
              : "IN_PROGRESS",

          result_json: {
            ...jsonObject(
              existing?.result_json
            ),
            source: "denetim_runs",
            runId,
            appRunId,
            location:
              clean(run.location),
            responsible:
              clean(run.responsible),
            reportNo:
              clean(run.report_no),
            generalNote:
              clean(run.general_note),
            answers:
              runAnswers,
          },

          photos_json:
            jsonArray(
              existing?.photos_json
            ),

          generated_pdf_url:
            clean(
              existing?.generated_pdf_url
            ) || null,

          signed_pdf_url:
            clean(
              existing?.signed_pdf_url
            ) || null,

          source:
            clean(
              existing?.source
            ) || "WEB",

          sync_version:
            numberValue(
              existing?.sync_version,
              1
            ),

          created_at:
            clean(
              existing?.created_at
            ) || iso,

          updated_at:
            new Date()
              .toISOString(),

          inspection_type:
            clean(run.eval_mode) ||
            "KLASIK",
        };
      }
    );

    /*
     * inspectionRemoteId ile tek rapor istenmişse denetim snapshot'ından filtrele.
     */
    const filteredReports =
      inspectionRemoteId
        ? reports.filter(
            (report: any) =>
              clean(
                report.inspection_remote_id
              ) ===
                inspectionRemoteId ||
              clean(
                report.result_json?.runId
              ) ===
                inspectionRemoteId
          )
        : reports;

    return NextResponse.json({
      success: true,
      count:
        filteredReports.length,
      localFirmId,
      reports:
        filteredReports,
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
