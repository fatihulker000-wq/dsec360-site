import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { resolveReportScope } from "../_auth";

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

  // 5x5 matris skorları 1-25 aralığındadır.
  if (score > 0 && score <= 25) {
    if (score >= 15) return "HIGH";
    if (score >= 8) return "MEDIUM";
    return "LOW";
  }

  // Fine Kinney için kurumsal özet sınıflaması.
  if (score >= 200) return "HIGH";
  if (score >= 70) return "MEDIUM";

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

  if ([
    "EXPIRED",
    "OVERDUE",
    "MISSING",
    "SÜRESİ_DOLDU",
    "SÜRESİ DOLDU",
    "EKSİK",
  ].includes(status)) return true;

  const expiryValue = row.expiry_date || row.expire_date || row.valid_until || row.next_examination_date || row.next_exam_date;
  if (!expiryValue) return false;
  const expiry = new Date(expiryValue).getTime();
  return Number.isFinite(expiry) && expiry < Date.now();
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
    row.next_examination_date ||
    row.next_exam_date;

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

    // Service-role sorgularından önce mutlaka rapor kapsamını doğrula.
    const authResult = await resolveReportScope(supabase, companyId);
    if (!authResult.ok) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const effectiveCompanyId = authResult.scope.selectedCompanyId;

    let employeeQuery =
      supabase
        .from("employees")
        .select("id, firm_id");

    if (
      effectiveCompanyId !== "ALL" &&
      effectiveCompanyId !== "all"
    ) {

      employeeQuery =
        employeeQuery.eq(
          "firm_id",
          effectiveCompanyId
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

    const isAll = effectiveCompanyId === "ALL" || effectiveCompanyId === "all";

    const matrixRiskQuery = isAll
      ? supabase.from("risk_items").select("*").or("is_deleted.is.null,is_deleted.eq.false")
      : supabase.from("risk_items").select("*").eq("company_id", effectiveCompanyId).or("is_deleted.is.null,is_deleted.eq.false");

    const fineRiskQuery = isAll
      ? supabase.from("fine_kinney_risks").select("*").or("is_deleted.is.null,is_deleted.eq.false")
      : supabase.from("fine_kinney_risks").select("*").eq("company_id", effectiveCompanyId).or("is_deleted.is.null,is_deleted.eq.false");

    const healthQuery = isAll
      ? supabase.from("health_examinations").select("*").or("is_deleted.is.null,is_deleted.eq.false")
      : supabase.from("health_examinations").select("*").eq("company_id", effectiveCompanyId).or("is_deleted.is.null,is_deleted.eq.false");

    const accidentQuery = isAll
      ? supabase.from("accident_records").select("*").or("is_deleted.is.null,is_deleted.eq.false")
      : supabase.from("accident_records").select("*").or(`firm_id.eq.${effectiveCompanyId},web_firm_id.eq.${effectiveCompanyId}`).or("is_deleted.is.null,is_deleted.eq.false");

    const [
      matrixRiskResult,
      fineRiskResult,
      healthResult,
      ppeResult,
      accidentResult,
      ibysResult,
    ] = await Promise.all([
      safeRows("Risk", matrixRiskQuery),
      safeRows("Risk", fineRiskQuery),
      safeRows("Sağlık", healthQuery),
      rowsByEmployeeIds(supabase, "employee_ppe_assignments", employeeIds, "KKD"),
      safeRows("Kaza/Olay", accidentQuery),
      rowsByEmployeeIds(supabase, "employee_ibys_records", employeeIds, "İBYS"),
    ]);

    const riskResult: SafeRowsResult = {
      rows: [...matrixRiskResult.rows, ...fineRiskResult.rows],
      warning: matrixRiskResult.warning || fineRiskResult.warning,
    };

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
        companyId: effectiveCompanyId,

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