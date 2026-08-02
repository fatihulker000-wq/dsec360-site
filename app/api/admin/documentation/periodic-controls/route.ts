import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RecordType = "EQUIPMENT" | "MEASUREMENT";
type JsonRecord = Record<string, unknown>;

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY tanımlı değil."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

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
    value === "" ||
    value === "null"
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function recordType(
  value: unknown
): RecordType | null {
  const normalized = clean(value).toUpperCase();

  if (normalized === "EQUIPMENT") {
    return "EQUIPMENT";
  }

  if (normalized === "MEASUREMENT") {
    return "MEASUREMENT";
  }

  return null;
}

function equipmentPayload(
  body: JsonRecord
) {
  const now = Date.now();

  return {
    firm_id:
      clean(body.firm_id) ||
      clean(body.firmId),

    equipment_name:
      clean(body.equipment_name) ||
      clean(body.equipmentName),

    equipment_type:
      clean(body.equipment_type) ||
      clean(body.equipmentType),

    serial_no:
      clean(body.serial_no) ||
      clean(body.serialNo),

    location:
      clean(body.location),

    legal_period_months:
      numberValue(
        body.legal_period_months ??
          body.legalPeriodMonths,
        12
      ),

    last_control_millis:
      nullableNumber(
        body.last_control_millis ??
          body.lastControlMillis
      ),

    next_due_millis:
      nullableNumber(
        body.next_due_millis ??
          body.nextDueMillis
      ),

    report_no:
      clean(body.report_no) ||
      clean(body.reportNo),

    status:
      clean(body.status) || "EKSIK",

    note:
      clean(body.note),

    deleted: false,

    created_at_millis:
      numberValue(
        body.created_at_millis ??
          body.createdAtMillis,
        now
      ),

    updated_at_millis: now,

    updated_at:
      new Date().toISOString(),
  };
}

function measurementPayload(
  body: JsonRecord
) {
  const now = Date.now();

  return {
    firm_id:
      clean(body.firm_id) ||
      clean(body.firmId),

    measurement_type:
      clean(body.measurement_type) ||
      clean(body.measurementType),

    area_name:
      clean(body.area_name) ||
      clean(body.areaName),

    measurement_date_millis:
      nullableNumber(
        body.measurement_date_millis ??
          body.measurementDateMillis
      ),

    next_due_millis:
      nullableNumber(
        body.next_due_millis ??
          body.nextDueMillis
      ),

    legal_period_months:
      numberValue(
        body.legal_period_months ??
          body.legalPeriodMonths,
        12
      ),

    measured_by:
      clean(body.measured_by) ||
      clean(body.measuredBy),

    report_no:
      clean(body.report_no) ||
      clean(body.reportNo),

    result_summary:
      clean(body.result_summary) ||
      clean(body.resultSummary),

    status:
      clean(body.status) || "EKSIK",

    note:
      clean(body.note),

    deleted: false,

    created_at_millis:
      numberValue(
        body.created_at_millis ??
          body.createdAtMillis,
        now
      ),

    updated_at_millis: now,

    updated_at:
      new Date().toISOString(),
  };
}

/* =========================================================
   LİSTELE
   ========================================================= */

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const firmId = clean(
      url.searchParams.get("firmId")
    );

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
        .from(
          "periodic_control_equipments"
        )
        .select("*")
        .eq("firm_id", firmId)
        .eq("deleted", false)
        .order("next_due_millis", {
          ascending: true,
          nullsFirst: true,
        }),

      supabase
        .from(
          "environment_measurements"
        )
        .select("*")
        .eq("firm_id", firmId)
        .eq("deleted", false)
        .order("next_due_millis", {
          ascending: true,
          nullsFirst: true,
        }),
    ]);

    if (equipmentResponse.error) {
      return NextResponse.json(
        {
          success: false,
          error:
            "İş ekipmanı kayıtları alınamadı.",
          detail:
            equipmentResponse.error.message,
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
          error:
            "Ortam ölçümü kayıtları alınamadı.",
          detail:
            measurementResponse.error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      firmId,
      equipments:
        equipmentResponse.data || [],
      measurements:
        measurementResponse.data || [],
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
   YENİ KAYIT
   ========================================================= */

export async function POST(req: Request) {
  try {
    const body: JsonRecord =
      await req.json();

    const type = recordType(
      body.recordType
    );

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error:
            "recordType EQUIPMENT veya MEASUREMENT olmalıdır.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getSupabase();

    if (type === "EQUIPMENT") {
      const payload =
        equipmentPayload(body);

      if (
        !payload.firm_id ||
        !payload.equipment_name
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "firmId ve equipmentName zorunlu.",
          },
          {
            status: 400,
          }
        );
      }

      const { data, error } =
        await supabase
          .from(
            "periodic_control_equipments"
          )
          .insert([
            {
              ...payload,
              created_at:
                new Date().toISOString(),
            },
          ])
          .select("*")
          .single();

      if (error || !data) {
        return NextResponse.json(
          {
            success: false,
            error:
              "İş ekipmanı oluşturulamadı.",
            detail:
              error?.message || null,
          },
          {
            status: 500,
          }
        );
      }

      return NextResponse.json({
        success: true,
        recordType: type,
        data,
      });
    }

    const payload =
      measurementPayload(body);

    if (
      !payload.firm_id ||
      !payload.measurement_type ||
      !payload.area_name
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "firmId, measurementType ve areaName zorunlu.",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } =
      await supabase
        .from(
          "environment_measurements"
        )
        .insert([
          {
            ...payload,
            created_at:
              new Date().toISOString(),
          },
        ])
        .select("*")
        .single();

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ortam ölçümü oluşturulamadı.",
          detail:
            error?.message || null,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      recordType: type,
      data,
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
   GÜNCELLE
   ========================================================= */

export async function PUT(req: Request) {
  try {
    const body: JsonRecord =
      await req.json();

    const id = clean(body.id);

    const type = recordType(
      body.recordType
    );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "id zorunlu.",
        },
        {
          status: 400,
        }
      );
    }

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error:
            "recordType EQUIPMENT veya MEASUREMENT olmalıdır.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getSupabase();

    if (type === "EQUIPMENT") {
      const payload =
        equipmentPayload(body);

      if (
        !payload.firm_id ||
        !payload.equipment_name
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "firmId ve equipmentName zorunlu.",
          },
          {
            status: 400,
          }
        );
      }

      const { data, error } =
        await supabase
          .from(
            "periodic_control_equipments"
          )
          .update({
            ...payload,
            deleted: false,
          })
          .eq("id", id)
          .select("*")
          .maybeSingle();

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error:
              "İş ekipmanı güncellenemedi.",
            detail: error.message,
          },
          {
            status: 500,
          }
        );
      }

      if (!data) {
        return NextResponse.json(
          {
            success: false,
            error:
              "İş ekipmanı bulunamadı.",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        success: true,
        recordType: type,
        data,
      });
    }

    const payload =
      measurementPayload(body);

    if (
      !payload.firm_id ||
      !payload.measurement_type ||
      !payload.area_name
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "firmId, measurementType ve areaName zorunlu.",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } =
      await supabase
        .from(
          "environment_measurements"
        )
        .update({
          ...payload,
          deleted: false,
        })
        .eq("id", id)
        .select("*")
        .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ortam ölçümü güncellenemedi.",
          detail: error.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Ortam ölçümü bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      recordType: type,
      data,
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
   SOFT DELETE
   ========================================================= */

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);

    const id = clean(
      url.searchParams.get("id")
    );

    const type = recordType(
      url.searchParams.get("recordType")
    );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "id zorunlu.",
        },
        {
          status: 400,
        }
      );
    }

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error:
            "recordType EQUIPMENT veya MEASUREMENT olmalıdır.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = getSupabase();

    const tableName =
      type === "EQUIPMENT"
        ? "periodic_control_equipments"
        : "environment_measurements";

    const now = Date.now();

    const { data, error } =
      await supabase
        .from(tableName)
        .update({
          deleted: true,
          updated_at_millis: now,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", id)
        .select("id")
        .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Kayıt silinemedi.",
          detail: error.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Silinecek kayıt bulunamadı.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      recordType: type,
      id,
      deleted: true,
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