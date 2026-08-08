import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MOBILE_API_KEY =
  process.env.DSEC_MOBILE_API_KEY ||
  "dsec_mobile_123";

type CompanyRow = {
  id: string;
  name: string | null;
  local_firm_id?: number | string | null;
};

type RiskSummary = {
  low: number;
  medium: number;
  high: number;
  veryHigh: number;
};

function getSupabase() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_URL tanımlı değil."
    );
  }

  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY tanımlı değil."
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function normalizeCompanyKey(
  value: unknown
): string {
  return String(value ?? "")
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replace(/\s+/g, " ");
}

function normalizeResult(
  value: unknown
): string {
  return String(value ?? "")
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replaceAll("İ", "I")
    .replaceAll("Ğ", "G")
    .replaceAll("Ü", "U")
    .replaceAll("Ş", "S")
    .replaceAll("Ö", "O")
    .replaceAll("Ç", "C")
    .replace(/[\s-]+/g, "_");
}

function isAuthorized(
  request: Request
): boolean {
  const apiKey =
    request.headers
      .get("x-api-key")
      ?.trim() || "";

  return apiKey === MOBILE_API_KEY;
}

function emptyRiskSummary(): RiskSummary {
  return {
    low: 0,
    medium: 0,
    high: 0,
    veryHigh: 0,
  };
}

function matrixLevelFromScore(
  score: number
): keyof RiskSummary {
  if (score >= 20) return "veryHigh";
  if (score >= 15) return "high";
  if (score >= 8) return "medium";
  return "low";
}

function fineKinneyLevelFromScore(
  score: number
): keyof RiskSummary {
  if (score >= 200) return "veryHigh";
  if (score >= 70) return "high";
  if (score >= 20) return "medium";
  return "low";
}

function calculateRiskSafetyScore(
  summary: RiskSummary
): number | null {
  const total =
    summary.low +
    summary.medium +
    summary.high +
    summary.veryHigh;

  if (total <= 0) return null;

  const weighted =
    summary.low * 0.10 +
    summary.medium * 0.35 +
    summary.high * 0.70 +
    summary.veryHigh * 1.00;

  return Math.round(
    Math.max(
      0,
      Math.min(
        100,
        100 -
          (weighted / total) * 100
      )
    )
  );
}

function resultRequiresDof(
  value: unknown
): boolean {
  const result =
    normalizeResult(value);

  if (!result) return false;

  if (
    result === "UYGUNSUZ" ||
    result === "KISMEN" ||
    result.includes("UYGUNSUZ") ||
    result.includes("KISMEN") ||
    result.includes("YETERSIZ") ||
    result.includes("EKSIK")
  ) {
    return true;
  }

  if (result.startsWith("SCORE:")) {
    const score =
      Number(
        result.replace(
          "SCORE:",
          ""
        )
      );

    return (
      Number.isFinite(score) &&
      score < 100
    );
  }

  if (result.startsWith("ELMERI:")) {
    const parts =
      result.split(":");

    const wrong =
      Number(parts[2] || 0);

    return (
      Number.isFinite(wrong) &&
      wrong > 0
    );
  }

  return false;
}

function dofStatus(
  answer: any
): "OPEN" | "CLOSED" | "NONE" {
  const status =
    normalizeResult(
      answer?.dof_status
    );

  if (
    status === "CLOSED" ||
    status === "KAPALI"
  ) {
    return "CLOSED";
  }

  if (
    status === "OPEN" ||
    status === "IN_PROGRESS" ||
    status === "ACIK"
  ) {
    return "OPEN";
  }

  return resultRequiresDof(
    answer?.result
  )
    ? "OPEN"
    : "NONE";
}

type TrainingRow = {
  id: string;
  type?: string | null;
};

type AssignmentRow = {
  id: string;
  user_id: string;
  training_id: string;
  status?: string | null;
  watch_completed?: boolean | null;
  final_exam_passed?: boolean | null;
};

function isOnlineTraining(
  training?: TrainingRow
) {
  const type =
    String(
      training?.type || ""
    ).toLowerCase();

  return (
    type.includes("online") ||
    type.includes("asenkron") ||
    type.includes("senkron")
  );
}

function isTrainingCompleted(
  row: AssignmentRow,
  training?: TrainingRow
) {
  if (
    isOnlineTraining(training)
  ) {
    return (
      row.status === "completed" &&
      row.watch_completed === true &&
      row.final_exam_passed === true
    );
  }

  return row.status === "completed";
}

async function resolveCompany(
  supabase: ReturnType<
    typeof getSupabase
  >,
  requestedWebId: string,
  requestedLocalId: string,
  requestedName: string
): Promise<CompanyRow> {
  const {
    data,
    error,
  } = await supabase
    .from("companies")
    .select(
      "id,name,local_firm_id"
    )
    .order("name");

  if (error) {
    throw new Error(
      `Firma listesi alınamadı: ${error.message}`
    );
  }

  const companies =
    (data || []) as CompanyRow[];

  const normalizedName =
    normalizeCompanyKey(
      requestedName
    );

  const company =
    companies.find(
      (item) =>
        (
          requestedWebId &&
          String(item.id) ===
            requestedWebId
        ) ||
        (
          requestedLocalId &&
          String(
            item.local_firm_id ?? ""
          ) ===
            requestedLocalId
        ) ||
        (
          normalizedName &&
          normalizeCompanyKey(
            item.name
          ) ===
            normalizedName
        )
    );

  if (!company) {
    throw new Error(
      `Firma Web ile eşleştirilemedi. web=${requestedWebId || "-"}, local=${requestedLocalId || "-"}, ad=${requestedName || "-"}`
    );
  }

  return company;
}

export async function GET(
  request: Request
) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Yetkisiz mobil erişim. x-api-key doğrulanamadı.",
        },
        { status: 401 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const requestedWebId =
      String(
        searchParams.get(
          "web_firm_id"
        ) || ""
      ).trim();

    const requestedLocalId =
      String(
        searchParams.get(
          "local_firm_id"
        ) || ""
      ).trim();

    const requestedName =
      String(
        searchParams.get(
          "firm_name"
        ) || ""
      ).trim();

    if (
      !requestedWebId &&
      !requestedLocalId &&
      !requestedName
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Firma eşleştirme parametresi bulunamadı.",
        },
        { status: 400 }
      );
    }

    const supabase =
      getSupabase();

    const company =
      await resolveCompany(
        supabase,
        requestedWebId,
        requestedLocalId,
        requestedName
      );

    const companyId =
      String(company.id);

    const companyName =
      String(
        company.name || ""
      );

    const localFirmId =
      String(
        company.local_firm_id ??
          requestedLocalId ??
          ""
      ).trim();

    // ==========================================================
    // EĞİTİM — Web dashboard ile aynı firma ve atama kaynağı
    // ==========================================================

    const {
      data: firmUsers,
      error: usersError,
    } = await supabase
      .from("users")
      .select("id")
      .eq(
        "company_id",
        companyId
      );

    if (usersError) {
      throw new Error(
        `Firma kullanıcıları alınamadı: ${usersError.message}`
      );
    }

    const userIds =
      (firmUsers || [])
        .map(
          (row: any) =>
            String(
              row.id || ""
            ).trim()
        )
        .filter(Boolean);

    let assignments:
      AssignmentRow[] = [];

    if (userIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from(
          "training_assignments"
        )
        .select(
          "id,user_id,training_id,status,watch_completed,final_exam_passed"
        )
        .in(
          "user_id",
          userIds
        );

      if (error) {
        throw new Error(
          `Eğitim atamaları alınamadı: ${error.message}`
        );
      }

      assignments =
        (data || []) as AssignmentRow[];
    }

    const trainingIds =
      Array.from(
        new Set(
          assignments
            .map(
              (row) =>
                row.training_id
            )
            .filter(Boolean)
        )
      );

    const trainingMap:
      Record<string, TrainingRow> =
      {};

    if (trainingIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from("trainings")
        .select("id,type")
        .in("id", trainingIds);

      if (error) {
        throw new Error(
          `Eğitim detayları alınamadı: ${error.message}`
        );
      }

      for (
        const row of data || []
      ) {
        trainingMap[
          String(row.id)
        ] = {
          id: String(row.id),
          type:
            row.type ?? null,
        };
      }
    }

    const trainingAssigned =
      assignments.length;

    const trainingCompleted =
      assignments.filter(
        (row) =>
          isTrainingCompleted(
            row,
            trainingMap[
              row.training_id
            ]
          )
      ).length;

    const trainingInProgress =
      assignments.filter(
        (row) =>
          !isTrainingCompleted(
            row,
            trainingMap[
              row.training_id
            ]
          ) &&
          row.status ===
            "in_progress"
      ).length;

    const trainingNotStarted =
      Math.max(
        0,
        trainingAssigned -
          trainingCompleted -
          trainingInProgress
      );

    const trainingCompliance =
      trainingAssigned > 0
        ? Math.round(
            (
              trainingCompleted /
              trainingAssigned
            ) * 100
          )
        : null;

    // ==========================================================
    // RİSK
    // ==========================================================

    const riskSummary =
      emptyRiskSummary();

    const [
      matrixResult,
      fineResult,
    ] = await Promise.all([
      supabase
        .from("risk_items")
        .select("score")
        .eq(
          "is_deleted",
          false
        )
        .eq(
          "company_id",
          companyId
        ),

      supabase
        .from(
          "fine_kinney_risks"
        )
        .select("score")
        .eq(
          "is_deleted",
          false
        )
        .eq(
          "company_id",
          companyId
        ),
    ]);

    if (matrixResult.error) {
      throw new Error(
        `5x5 risk kayıtları alınamadı: ${matrixResult.error.message}`
      );
    }

    if (fineResult.error) {
      throw new Error(
        `Fine-Kinney risk kayıtları alınamadı: ${fineResult.error.message}`
      );
    }

    for (
      const row of
        matrixResult.data || []
    ) {
      const score =
        Number(row.score || 0);

      riskSummary[
        matrixLevelFromScore(
          score
        )
      ] += 1;
    }

    for (
      const row of
        fineResult.data || []
    ) {
      const score =
        Number(row.score || 0);

      riskSummary[
        fineKinneyLevelFromScore(
          score
        )
      ] += 1;
    }

    const totalRisk =
      riskSummary.low +
      riskSummary.medium +
      riskSummary.high +
      riskSummary.veryHigh;

    const riskSafetyScore =
      calculateRiskSafetyScore(
        riskSummary
      );

    // ==========================================================
    // DENETİM + DÖF
    // denetim_runs.firm_id eski kayıtlarda local_firm_id olabilir.
    // Bu yüzden Web'deki mevcut inspection mantığı gibi JS tarafında
    // hem company UUID hem local id hem firma adı ile eşleştiriyoruz.
    // ==========================================================

    const {
      data: allRuns,
      error: runsError,
    } = await supabase
      .from("denetim_runs")
      .select("*")
      .order(
        "inserted_at",
        { ascending: false }
      );

    if (runsError) {
      throw new Error(
        `Denetimler alınamadı: ${runsError.message}`
      );
    }

    const companyNameKey =
      normalizeCompanyKey(
        companyName
      );

    const runs =
      (allRuns || []).filter(
        (run: any) => {
          const runFirmId =
            String(
              run.firm_id || ""
            ).trim();

          const runFirmName =
            normalizeCompanyKey(
              run.firm_name ||
                run.firma_adi ||
                ""
            );

          return (
            runFirmId ===
              companyId ||
            (
              localFirmId &&
              runFirmId ===
                localFirmId
            ) ||
            (
              runFirmName &&
              runFirmName ===
                companyNameKey
            )
          );
        }
      );

    const runIds =
      runs
        .map(
          (run: any) =>
            String(
              run.id || ""
            ).trim()
        )
        .filter(Boolean);

    let answers: any[] = [];

    if (runIds.length > 0) {
      const {
        data,
        error,
      } = await supabase
        .from(
          "denetim_answers"
        )
        .select(
          "result,dof_status"
        )
        .in(
          "run_remote_id",
          runIds
        );

      if (error) {
        throw new Error(
          `Denetim cevapları alınamadı: ${error.message}`
        );
      }

      answers =
        data || [];
    }

    const suitable =
      answers.filter(
        (row) =>
          normalizeResult(
            row.result
          ) === "UYGUN"
      ).length;

    const partial =
      answers.filter(
        (row) =>
          normalizeResult(
            row.result
          ) === "KISMEN"
      ).length;

    const unsuitable =
      answers.filter(
        (row) =>
          normalizeResult(
            row.result
          ) === "UYGUNSUZ"
      ).length;

    const totalInspectionAnswers =
      answers.length;

    const inspectionCompliance =
      totalInspectionAnswers > 0
        ? Math.round(
            (
              suitable +
              partial * 0.5
            ) /
              totalInspectionAnswers *
              100
          )
        : null;

    const openDof =
      answers.filter(
        (row) =>
          dofStatus(row) ===
            "OPEN"
      ).length;

    const closedDof =
      answers.filter(
        (row) =>
          dofStatus(row) ===
            "CLOSED"
      ).length;

    const totalDof =
      openDof +
      closedDof;

    const dofClosureRate =
      totalDof > 0
        ? Math.round(
            (
              closedDof /
              totalDof
            ) * 100
          )
        : totalInspectionAnswers >
          0
        ? 100
        : null;

    // ==========================================================
    // WEB İLE AYNI EXECUTIVE SKOR
    // ==========================================================

    const hseScore =
      Math.round(
        Math.max(
          0,
          Math.min(
            100,
            (riskSafetyScore ??
              0) *
              0.35 +
              (inspectionCompliance ??
                0) *
                0.30 +
              (trainingCompliance ??
                0) *
                0.20 +
              (dofClosureRate ??
                0) *
                0.15
          )
        )
      );

    const dataCoverage =
      Math.round(
        (
          (riskSafetyScore !==
          null
            ? 0.35
            : 0) +
          (inspectionCompliance !==
          null
            ? 0.30
            : 0) +
          (trainingCompliance !==
          null
            ? 0.20
            : 0) +
          (dofClosureRate !==
          null
            ? 0.15
            : 0)
        ) * 100
      );

    return NextResponse.json(
      {
        success: true,
        company: {
          id: companyId,
          localFirmId:
            localFirmId || null,
          name: companyName,
        },
        summary: {
          hseScore,
          dataCoverage,

          trainingAssigned,
          trainingCompleted,
          trainingInProgress,
          trainingNotStarted,
          trainingCompliance,

          totalRisk,
          lowRisk:
            riskSummary.low,
          mediumRisk:
            riskSummary.medium,
          highRisk:
            riskSummary.high,
          veryHighRisk:
            riskSummary.veryHigh,
          riskSafetyScore,

          inspectionCount:
            runIds.length,
          totalInspectionAnswers,
          suitable,
          partial,
          unsuitable,
          inspectionCompliance,

          openDof,
          closedDof,
          dofClosureRate,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "mobile executive dashboard error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Executive Dashboard alınamadı.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}