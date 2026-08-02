import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MOBILE_API_KEY = "dsec_mobile_123";

type JsonRecord = Record<string, unknown>;

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function authorized(req: Request): boolean {
  return (
    String(req.headers.get("x-api-key") || "").trim() === MOBILE_API_KEY
  );
}

function unauthorized() {
  return NextResponse.json(
    {
      success: false,
      error: "Yetkisiz.",
    },
    {
      status: 401,
    }
  );
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function nullableText(value: unknown): string | null {
  const valueText = text(value);
  return valueText || null;
}

function numberValue(
  value: unknown,
  fallback = 0
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumber(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "null"
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function booleanValue(
  value: unknown,
  fallback = false
): boolean {
  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    return value !== 0;
  }

  const normalized = text(value).toLowerCase();

  if (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "yes" ||
    normalized === "evet"
  ) {
    return true;
  }

  if (
    normalized === "false" ||
    normalized === "0" ||
    normalized === "no" ||
    normalized === "hayır" ||
    normalized === "hayir"
  ) {
    return false;
  }

  return fallback;
}

function equipmentPayload(
  body: JsonRecord,
  firmIdOverride?: string
) {
  const now = Date.now();

  return {
    firm_id:
      text(firmIdOverride) ||
      text(body.firm_id) ||
      text(body.firmId),

    equipment_name:
      text(body.equipment_name) ||
      text(body.equipmentName),

    equipment_type:
      text(body.equipment_type) ||
      text(body.equipmentType),

    serial_no:
      text(body.serial_no) ||
      text(body.serialNo),

    location: text(body.location),

    legal_period_months: numberValue(
      body.legal_period_months ??
        body.legalPeriodMonths,
      12
    ),

    last_control_millis: nullableNumber(
      body.last_control_millis ??
        body.lastControlMillis
    ),

    next_due_millis: nullableNumber(
      body.next_due_millis ??
        body.nextDueMillis
    ),

    report_no:
      text(body.report_no) ||
      text(body.reportNo),

    status: text(body.status) || "EKSIK",

    note: text(body.note),

    deleted: booleanValue(body.deleted, false),

    created_at_millis: numberValue(
      body.created_at_millis ??
        body.createdAtMillis,
      now
    ),

    updated_at_millis: numberValue(
      body.updated_at_millis ??
        body.updatedAtMillis,
      now
    ),

    updated_at: new Date().toISOString(),
  };
}

function measurementPayload(
  body: JsonRecord,
  firmIdOverride?: string
) {
  const now = Date.now();

  return {
    firm_id:
      text(firmIdOverride) ||
      text(body.firm_id) ||
      text(body.firmId),

    measurement_type:
      text(body.measurement_type) ||
      text(body.measurementType),

    area_name:
      text(body.area_name) ||
      text(body.areaName),

    measurement_date_millis: nullableNumber(
      body.measurement_date_millis ??
        body.measurementDateMillis
    ),

    next_due_millis: nullableNumber(
      body.next_due_millis ??
        body.nextDueMillis
    ),

    legal_period_months: numberValue(
      body.legal_period_months ??
        body.legalPeriodMonths,
      12
    ),

    measured_by:
      text(body.measured_by) ||
      text(body.measuredBy),

    report_no:
      text(body.report_no) ||
      text(body.reportNo),

    result_summary:
      text(body.result_summary) ||
      text(body.resultSummary),

    status: text(body.status) || "EKSIK",

    note: text(body.note),

    deleted: booleanValue(body.deleted, false),

    created_at_millis: numberValue(
      body.created_at_millis ??
        body.createdAtMillis,
      now
    ),

    updated_at_millis: numberValue(
      body.updated_at_millis ??
        body.updatedAtMillis,
      now
    ),

    updated_at: new Date().toISOString(),
  };
}

/**
 * UUID bulunmayan ilk App kaydının aynı istek tekrarlandığında
 * mükerrer oluşturulmaması için benzer ekipman kaydı aranır.
 */
async function findDuplicateEquipment(
  supabase: ReturnType<typeof getSupabase>,
  payload: ReturnType<typeof equipmentPayload>
): Promise<string | null> {
  let query = supabase
    .from("periodic_control_equipments")
    .select("id")
    .eq("firm_id", payload.firm_id)
    .eq("equipment_name", payload.equipment_name)
    .eq("deleted", false)
    .limit(1);

  if (payload.serial_no) {
    query = query.eq("serial_no", payload.serial_no);
  } else if (payload.location) {
    query = query.eq("location", payload.location);
  } else if (payload.report_no) {
    query = query.eq("report_no", payload.report_no);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(
      `Ekipman mükerrer kontrolü başarısız: ${error.message}`
    );
  }

  return data?.id ? String(data.id) : null;
}

/**
 * Aynı ortam ölçümünün tekrar eklenmesini engeller.
 */
async function findDuplicateMeasurement(
  supabase: ReturnType<typeof getSupabase>,
  payload: ReturnType<typeof measurementPayload>
): Promise<string | null> {
  let query = supabase
    .from("environment_measurements")
    .select("id")
    .eq("firm_id", payload.firm_id)
    .eq("measurement_type", payload.measurement_type)
    .eq("area_name", payload.area_name)
    .eq("deleted", false)
    .limit(1);

  if (payload.report_no) {
    query = query.eq("report_no", payload.report_no);
  } else if (payload.measurement_date_millis !== null) {
    query = query.eq(
      "measurement_date_millis",
      payload.measurement_date_millis
    );
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(
      `Ölçüm mükerrer kontrolü başarısız: ${error.message}`
    );
  }

  return data?.id ? String(data.id) : null;
}

/* =========================================================
   WEB → APP
   ========================================================= */

export async function GET(req: Request) {
  try {
    if (!authorized(req)) {
      return unauthorized();
    }

    const url = new URL(req.url);
    const firmId = text(url.searchParams.get("firmId"));

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error: "firmId zorunlu.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getSupabase();

    const [
      equipmentResponse,
      measurementResponse,
    ] = await Promise.all([
      supabase
        .from("periodic_control_equipments")
        .select("*")
        .eq("firm_id", firmId)
        .order("updated_at_millis", {
          ascending: true,
        }),

      supabase
        .from("environment_measurements")
        .select("*")
        .eq("firm_id", firmId)
        .order("updated_at_millis", {
          ascending: true,
        }),
    ]);

    if (equipmentResponse.error) {
      return NextResponse.json(
        {
          success: false,
          error: "İş ekipmanları alınamadı.",
          detail: equipmentResponse.error.message,
        },
        {
          status: 500,
        }
      );
    }

    if (measurementResponse.error) {
      return NextResponse.json(
        {
          success: false,
          error: "Ortam ölçümleri alınamadı.",
          detail: measurementResponse.error.message,
        },
        {
          status: 500,
        }
      );
    }

    const equipments =
      equipmentResponse.data || [];

    const measurements =
      measurementResponse.data || [];

    return NextResponse.json({
      success: true,
      firmId,
      equipmentCount: equipments.length,
      measurementCount: measurements.length,
      equipments,
      measurements,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Sunucu hatası.",
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

/* =========================================================
   APP → WEB
   ========================================================= */

export async function POST(req: Request) {
  try {
    if (!authorized(req)) {
      return unauthorized();
    }

    const body = await req.json();
    const firmId = text(body?.firmId);

    if (!firmId) {
      return NextResponse.json(
        {
          success: false,
          error: "firmId zorunlu.",
        },
        {
          status: 400,
        }
      );
    }

    const equipments: JsonRecord[] =
      Array.isArray(body?.equipments)
        ? body.equipments
        : [];

    const measurements: JsonRecord[] =
      Array.isArray(body?.measurements)
        ? body.measurements
        : [];

    const supabase = getSupabase();

    const equipmentResults: Array<{
      localId: number;
      remoteId: string | null;
      success: boolean;
      deleted: boolean;
      error: string | null;
    }> = [];

    const measurementResults: Array<{
      localId: number;
      remoteId: string | null;
      success: boolean;
      deleted: boolean;
      error: string | null;
    }> = [];

    /* =====================================================
       İŞ EKİPMANLARI
       ===================================================== */

    for (const item of equipments) {
      const localId = numberValue(
        item.local_id ?? item.localId,
        0
      );

      const remoteId =
        text(item.remote_id) ||
        text(item.remoteId) ||
        text(item.id);

      const operation =
        text(item.operation).toUpperCase() ||
        "UPSERT";

      const deleted =
        operation === "DELETE" ||
        booleanValue(item.deleted, false);

      try {
        /*
         * App'te oluşturulup web'e gönderilmeden silinen kayıtların
         * remoteId değeri olmayabilir. Bu durumda işlem başarılı sayılır.
         */
        if (deleted && !remoteId) {
          equipmentResults.push({
            localId,
            remoteId: null,
            success: true,
            deleted: true,
            error: null,
          });

          continue;
        }

        if (deleted && remoteId) {
          const { error } = await supabase
            .from("periodic_control_equipments")
            .update({
              deleted: true,
              updated_at_millis: numberValue(
                item.updated_at_millis ??
                  item.updatedAtMillis,
                Date.now()
              ),
              updated_at: new Date().toISOString(),
            })
            .eq("id", remoteId);

          equipmentResults.push({
            localId,
            remoteId,
            success: !error,
            deleted: !error,
            error: error?.message || null,
          });

          continue;
        }

        const payload = equipmentPayload(
          item,
          firmId
        );

        if (
          !payload.firm_id ||
          !payload.equipment_name
        ) {
          equipmentResults.push({
            localId,
            remoteId: remoteId || null,
            success: false,
            deleted: false,
            error:
              "firm_id veya equipment_name eksik.",
          });

          continue;
        }

        if (remoteId) {
          const { data, error } = await supabase
            .from("periodic_control_equipments")
            .update({
              ...payload,
              deleted: false,
            })
            .eq("id", remoteId)
            .select("id")
            .maybeSingle();

          if (error) {
            throw error;
          }

          /*
           * UUID gönderildi fakat webde kayıt bulunamadıysa yeniden ekle.
           */
          if (!data?.id) {
            const { data: inserted, error: insertError } =
              await supabase
                .from("periodic_control_equipments")
                .insert([
                  {
                    ...payload,
                    deleted: false,
                    created_at: new Date().toISOString(),
                  },
                ])
                .select("id")
                .single();

            if (insertError || !inserted?.id) {
              throw new Error(
                insertError?.message ||
                  "İş ekipmanı oluşturulamadı."
              );
            }

            equipmentResults.push({
              localId,
              remoteId: String(inserted.id),
              success: true,
              deleted: false,
              error: null,
            });
          } else {
            equipmentResults.push({
              localId,
              remoteId: String(data.id),
              success: true,
              deleted: false,
              error: null,
            });
          }

          continue;
        }

        const duplicateId =
          await findDuplicateEquipment(
            supabase,
            payload
          );

        if (duplicateId) {
          const { error } = await supabase
            .from("periodic_control_equipments")
            .update({
              ...payload,
              deleted: false,
            })
            .eq("id", duplicateId);

          if (error) {
            throw error;
          }

          equipmentResults.push({
            localId,
            remoteId: duplicateId,
            success: true,
            deleted: false,
            error: null,
          });

          continue;
        }

        const { data, error } = await supabase
          .from("periodic_control_equipments")
          .insert([
            {
              ...payload,
              deleted: false,
              created_at: new Date().toISOString(),
            },
          ])
          .select("id")
          .single();

        if (error || !data?.id) {
          throw new Error(
            error?.message ||
              "İş ekipmanı oluşturulamadı."
          );
        }

        equipmentResults.push({
          localId,
          remoteId: String(data.id),
          success: true,
          deleted: false,
          error: null,
        });
      } catch (error) {
        equipmentResults.push({
          localId,
          remoteId: remoteId || null,
          success: false,
          deleted,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    }

    /* =====================================================
       ORTAM ÖLÇÜMLERİ
       ===================================================== */

    for (const item of measurements) {
      const localId = numberValue(
        item.local_id ?? item.localId,
        0
      );

      const remoteId =
        text(item.remote_id) ||
        text(item.remoteId) ||
        text(item.id);

      const operation =
        text(item.operation).toUpperCase() ||
        "UPSERT";

      const deleted =
        operation === "DELETE" ||
        booleanValue(item.deleted, false);

      try {
        if (deleted && !remoteId) {
          measurementResults.push({
            localId,
            remoteId: null,
            success: true,
            deleted: true,
            error: null,
          });

          continue;
        }

        if (deleted && remoteId) {
          const { error } = await supabase
            .from("environment_measurements")
            .update({
              deleted: true,
              updated_at_millis: numberValue(
                item.updated_at_millis ??
                  item.updatedAtMillis,
                Date.now()
              ),
              updated_at: new Date().toISOString(),
            })
            .eq("id", remoteId);

          measurementResults.push({
            localId,
            remoteId,
            success: !error,
            deleted: !error,
            error: error?.message || null,
          });

          continue;
        }

        const payload = measurementPayload(
          item,
          firmId
        );

        if (
          !payload.firm_id ||
          !payload.measurement_type ||
          !payload.area_name
        ) {
          measurementResults.push({
            localId,
            remoteId: remoteId || null,
            success: false,
            deleted: false,
            error:
              "firm_id, measurement_type veya area_name eksik.",
          });

          continue;
        }

        if (remoteId) {
          const { data, error } = await supabase
            .from("environment_measurements")
            .update({
              ...payload,
              deleted: false,
            })
            .eq("id", remoteId)
            .select("id")
            .maybeSingle();

          if (error) {
            throw error;
          }

          if (!data?.id) {
            const { data: inserted, error: insertError } =
              await supabase
                .from("environment_measurements")
                .insert([
                  {
                    ...payload,
                    deleted: false,
                    created_at: new Date().toISOString(),
                  },
                ])
                .select("id")
                .single();

            if (insertError || !inserted?.id) {
              throw new Error(
                insertError?.message ||
                  "Ortam ölçümü oluşturulamadı."
              );
            }

            measurementResults.push({
              localId,
              remoteId: String(inserted.id),
              success: true,
              deleted: false,
              error: null,
            });
          } else {
            measurementResults.push({
              localId,
              remoteId: String(data.id),
              success: true,
              deleted: false,
              error: null,
            });
          }

          continue;
        }

        const duplicateId =
          await findDuplicateMeasurement(
            supabase,
            payload
          );

        if (duplicateId) {
          const { error } = await supabase
            .from("environment_measurements")
            .update({
              ...payload,
              deleted: false,
            })
            .eq("id", duplicateId);

          if (error) {
            throw error;
          }

          measurementResults.push({
            localId,
            remoteId: duplicateId,
            success: true,
            deleted: false,
            error: null,
          });

          continue;
        }

        const { data, error } = await supabase
          .from("environment_measurements")
          .insert([
            {
              ...payload,
              deleted: false,
              created_at: new Date().toISOString(),
            },
          ])
          .select("id")
          .single();

        if (error || !data?.id) {
          throw new Error(
            error?.message ||
              "Ortam ölçümü oluşturulamadı."
          );
        }

        measurementResults.push({
          localId,
          remoteId: String(data.id),
          success: true,
          deleted: false,
          error: null,
        });
      } catch (error) {
        measurementResults.push({
          localId,
          remoteId: remoteId || null,
          success: false,
          deleted,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        });
      }
    }

    const failedEquipmentCount =
      equipmentResults.filter(
        (item) => !item.success
      ).length;

    const failedMeasurementCount =
      measurementResults.filter(
        (item) => !item.success
      ).length;

    return NextResponse.json({
      success:
        failedEquipmentCount === 0 &&
        failedMeasurementCount === 0,

      firmId,

      equipmentCount:
        equipmentResults.length,

      measurementCount:
        measurementResults.length,

      failedEquipmentCount,
      failedMeasurementCount,

      equipmentResults,
      measurementResults,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Sunucu hatası.",
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