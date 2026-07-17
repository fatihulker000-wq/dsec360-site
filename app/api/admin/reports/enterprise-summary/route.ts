import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type WarningItem = {
  source: string;
  message: string;
};

type SafeRowsResult = {
  rows: any[];
  warning?: WarningItem;
};

async function safeRows(
  source: string,
  query: PromiseLike<{
    data: any[] | null;
    error: any;
  }>
): Promise<SafeRowsResult> {
  try {
    const {
      data,
      error,
    } = await query;

    if (error) {
      console.warn(
        `${source} rapor sorgu hatası`,
        error
      );

      return {
        rows: [],
        warning: {
          source,
          message: "Veri alınamadı.",
        },
      };
    }

    return {
      rows: Array.isArray(data)
        ? data
        : [],
    };
  } catch (errorValue) {
    console.warn(
      `${source} rapor sorgu hatası`,
      errorValue
    );

    return {
      rows: [],
      warning: {
        source,
        message: "Veri alınamadı.",
      },
    };
  }
}

function normalizedStatus(
  row: any
) {
  return String(
    row.status ||
      row.state ||
      row.result_status ||
      row.sync_status ||
      ""
  )
    .trim()
    .toUpperCase();
}

function normalizedIncidentType(
  row: any
) {
  return String(
    row.event_type ||
      row.eventType ||
      row.incident_type ||
      row.type ||
      ""
  )
    .trim()
    .toUpperCase();
}
function riskLevel(
  row: any
) {
  const explicit =
    String(
      row.risk_level ||
        row.level ||
        row.priority ||
        ""
    )
      .trim()
      .toUpperCase();

  if (
    explicit.includes("HIGH") ||
    explicit.includes("YÜKSEK") ||
    explicit.includes("CRITICAL") ||
    explicit.includes("KRİTİK")
  ) {
    return "HIGH";
  }

  if (
    explicit.includes("MEDIUM") ||
    explicit.includes("ORTA")
  ) {
    return "MEDIUM";
  }

  if (
    explicit.includes("LOW") ||
    explicit.includes("DÜŞÜK")
  ) {
    return "LOW";
  }

  const score =
    Number(
      row.score ||
        row.risk_score ||
        row.total_score ||
        0
    );

  if (score >= 200) {
    return "HIGH";
  }

  if (score >= 70) {
    return "MEDIUM";
  }

  return "LOW";
}

function isOpen(
  row: any
) {
  const status =
    normalizedStatus(row);

  return ![
    "COMPLETED",
    "COMPLETE",
    "DONE",
    "CLOSED",
    "SUCCESS",
    "SENT",
    "TAMAMLANDI",
    "KAPANDI",
    "BAŞARILI",
  ].includes(status);
}

function isExpired(
  row: any
) {
  const status =
    normalizedStatus(row);

  return [
    "EXPIRED",
    "OVERDUE",
    "MISSING",
    "SÜRESİ_DOLDU",
    "SÜRESİ DOLDU",
    "EKSİK",
  ].includes(status);
}

function isExpiring(
  row: any
) {
  const status =
    normalizedStatus(row);

  if (
    [
      "EXPIRING",
      "DUE_SOON",
      "YAKLAŞIYOR",
      "YAKLASIYOR",
    ].includes(status)
  ) {
    return true;
  }

  const expiryValue =
    row.expiry_date ||
    row.expire_date ||
    row.valid_until ||
    row.next_examination_date;

  if (!expiryValue) {
    return false;
  }

  const expiry =
    new Date(expiryValue).getTime();

  if (!Number.isFinite(expiry)) {
    return false;
  }

  const now = Date.now();

  const next30Days =
    now +
    30 *
      24 *
      60 *
      60 *
      1000;

  return (
    expiry >= now &&
    expiry <= next30Days
  );
}

function chunk<T>(
  values: T[],
  size = 250
) {
  const result: T[][] = [];

  for (
    let index = 0;
    index < values.length;
    index += size
  ) {
    result.push(
      values.slice(
        index,
        index + size
      )
    );
  }

  return result;
}

async function rowsByEmployeeIds(
  supabase: ReturnType<
    typeof getSupabase
  >,
  table: string,
  employeeIds: string[],
  source: string
): Promise<SafeRowsResult> {

  if (!employeeIds.length) {
    return {
      rows: [],
    };
  }

  const allRows: any[] = [];

  const warnings: WarningItem[] = [];

  for (
    const employeeChunk of chunk(
      employeeIds
    )
  ) {

    const result =
      await safeRows(
        source,
        supabase
          .from(table)
          .select("*")
          .in(
            "employee_id",
            employeeChunk
          )
      );

    allRows.push(
      ...result.rows
    );

    if (result.warning) {
      warnings.push(
        result.warning
      );
    }

  }

  return {

    rows: allRows,

    warning:
      warnings[0],

  };

}
export async function GET(
  request: Request
) {
  try {

    const {
      searchParams,
    } = new URL(request.url);

    const companyId =
      String(
        searchParams.get(
          "companyId"
        ) || ""
      ).trim();

    if (!companyId) {

      return NextResponse.json(
        {
          success: false,
          error:
            "companyId zorunlu.",
        },
        {
          status: 400,
        }
      );

    }

    const supabase =
      getSupabase();

    let employeeQuery =
      supabase
        .from("employees")
        .select("id, firm_id");

    if (
      companyId !== "ALL" &&
      companyId !== "all"
    ) {

      employeeQuery =
        employeeQuery.eq(
          "firm_id",
          companyId
        );

    }

    const employeeResult =
      await safeRows(
        "Çalışan",
        employeeQuery
      );

    const employeeIds =
      employeeResult.rows.map(
        (row) =>
          String(row.id)
      );

    const [
      riskResult,
      healthResult,
      ppeResult,
      accidentResult,
      ibysResult,
    ] = await Promise.all([

      rowsByEmployeeIds(
        supabase,
        "employee_risks",
        employeeIds,
        "Risk"
      ),

      rowsByEmployeeIds(
        supabase,
        "employee_health_records",
        employeeIds,
        "Sağlık"
      ),

      rowsByEmployeeIds(
        supabase,
        "employee_ppe_assignments",
        employeeIds,
        "KKD"
      ),

      companyId === "ALL" ||
      companyId === "all"

        ? safeRows(
            "Kaza/Olay",
            supabase
              .from("accidents")
              .select("*")
          )

        : safeRows(
            "Kaza/Olay",
            supabase
              .from("accidents")
              .select("*")
              .or(
                `firm_id.eq.${companyId},firmId.eq.${companyId}`
              )
          ),

      rowsByEmployeeIds(
        supabase,
        "employee_ibys_records",
        employeeIds,
        "İBYS"
      ),

    ]);

    const warnings = [

      employeeResult.warning,

      riskResult.warning,

      healthResult.warning,

      ppeResult.warning,

      accidentResult.warning,

      ibysResult.warning,

    ].filter(Boolean);

    const riskRows =
      riskResult.rows;

    const healthRows =
      healthResult.rows;

    const ppeRows =
      ppeResult.rows;

    const accidentRows =
      accidentResult.rows;

    const ibysRows =
      ibysResult.rows;

    const riskLevels =
      riskRows.map(
        riskLevel
      );

    const accidentTypes =
      accidentRows.map(
        normalizedIncidentType
      );

    const ibysStatuses =
      ibysRows.map(
        normalizedStatus
      );
          return NextResponse.json({
      success: true,

      data: {
        companyId,

        employeeCount:
          employeeIds.length,

        // -------------------------------------------------
        // Risk Özeti
        // -------------------------------------------------

        risk: {
          total:
            riskRows.length,

          high:
            riskLevels.filter(
              (level) =>
                level === "HIGH"
            ).length,

          medium:
            riskLevels.filter(
              (level) =>
                level === "MEDIUM"
            ).length,

          low:
            riskLevels.filter(
              (level) =>
                level === "LOW"
            ).length,

          open:
            riskRows.filter(
              isOpen
            ).length,
        },

        // -------------------------------------------------
        // Sağlık Özeti
        // -------------------------------------------------

        health: {
          total:
            healthRows.length,

          expired:
            healthRows.filter(
              isExpired
            ).length,

          expiring:
            healthRows.filter(
              isExpiring
            ).length,

          complete:
            healthRows.filter(
              (row) =>
                !isExpired(row) &&
                !isExpiring(row)
            ).length,
        },

        // -------------------------------------------------
        // KKD Özeti
        // -------------------------------------------------

        ppe: {
          total:
            ppeRows.length,

          pending:
            ppeRows.filter(
              isOpen
            ).length,

          complete:
            ppeRows.filter(
              (row) =>
                !isOpen(row)
            ).length,
        },

        // -------------------------------------------------
        // Kaza / Olay Özeti
        // -------------------------------------------------

        accident: {
          total:
            accidentRows.length,

          accident:
            accidentTypes.filter(
              (type) =>
                [
                  "WORK_ACCIDENT",
                  "ACCIDENT",
                  "İŞ_KAZASI",
                  "IS_KAZASI",
                ].includes(type)
            ).length,

          nearMiss:
            accidentTypes.filter(
              (type) =>
                [
                  "NEAR_MISS",
                  "RAMAK_KALA",
                  "RAMAK KALA",
                ].includes(type)
            ).length,

          occupationalDisease:
            accidentTypes.filter(
              (type) =>
                [
                  "OCCUPATIONAL_DISEASE",
                  "MESLEK_HASTALIĞI",
                  "MESLEK_HASTALIGI",
                ].includes(type)
            ).length,
        },

        // -------------------------------------------------
        // İBYS Özeti
        // -------------------------------------------------

        ibys: {
          total:
            ibysRows.length,

          success:
            ibysStatuses.filter(
              (status) =>
                [
                  "SUCCESS",
                  "SENT",
                  "COMPLETED",
                  "BAŞARILI",
                ].includes(status)
            ).length,

          pending:
            ibysStatuses.filter(
              (status) =>
                [
                  "PENDING",
                  "DRAFT",
                  "QUEUED",
                  "BEKLİYOR",
                ].includes(status)
            ).length,

          error:
            ibysStatuses.filter(
              (status) =>
                [
                  "ERROR",
                  "FAILED",
                  "REJECTED",
                  "HATA",
                ].includes(status)
            ).length,
        },

        // -------------------------------------------------
        // Uyarılar ve Yüklenme Zamanı
        // -------------------------------------------------

        warnings,

        loadedAt:
          new Date()
            .toISOString(),
      },
    });
      } catch (errorValue: unknown) {

    console.error(
      "Enterprise report summary error:",
      errorValue
    );

    return NextResponse.json(
      {
        success: false,

        error:
          errorValue instanceof Error
            ? errorValue.message
            : "Kurumsal rapor verileri alınamadı.",
      },
      {
        status: 500,
      }
    );

  }

}