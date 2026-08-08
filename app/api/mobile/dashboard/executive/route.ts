import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MOBILE_API_KEY =
  process.env.DSEC_MOBILE_API_KEY || "dsec_mobile_123";

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

function isAuthorized(request: Request): boolean {
  const apiKey =
    request.headers.get("x-api-key")?.trim() || "";

  return apiKey === MOBILE_API_KEY;
}

function normalizeResult(value: unknown): string {
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

function resultRequiresDof(value: unknown): boolean {
  const result = normalizeResult(value);

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
      Number(result.replace("SCORE:", ""));

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

function dofStatus(answer: any):
  | "OPEN"
  | "CLOSED"
  | "NONE" {

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

type RiskSummary = {
  low: number;
  medium: number;
  high: number;
  veryHigh: number;
};

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

  if (total <= 0) {
    return null;
  }

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
          (weighted / total) *
            100
      )
    )
  );
}

type TrainingRow = {
  id: string;
  type?: string | null;
};

type AssignmentRow = {
  id: string;
  user_id: string;
  training_id: string;
  status?:
    | "not_started"
    | "in_progress"
    | "completed"
    | null;
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

export async function GET(
  request: Request
) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Yetkisiz mobil erişim.",
        },
        {
          status: 401,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate",
          },
        }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const webFirmId =
      String(
        searchParams.get(
          "web_firm_id"
        ) ||
          searchParams.get(
            "firm_id"
          ) ||
          searchParams.get(
            "firmId"
          ) ||
          ""
      ).trim();

    const firmName =
      String(
        searchParams.get(
          "firm_name"
        ) ||
          searchParams.get(
            "firmName"
          ) ||
          ""
      ).trim();

    if (!webFirmId && !firmName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "web_firm_id veya firm_name zorunludur.",
        },
        { status: 400 }
      );
    }

    const supabase =
      getSupabase();

    /*
     * TEK FİRMA KİMLİĞİ ÇÖZÜMÜ
     *
     * Web Dashboard firma filtresinde şirket adını kullanabiliyor.
     * App ise çoğu zaman remote UUID taşıyor.
     * Önce companies tablosundan ikisini aynı gerçek company.id değerine çözüyoruz.
     * Böylece eğitim, risk ve denetim aynı firmaya bakıyor.
     */
    const {
      data: companies,
      error: companiesError,
    } = await supabase
      .from("companies")
      .select("id, name");

    if (companiesError) {
      throw new Error(
        `Firmalar alınamadı: ${companiesError.message}`
      );
    }

    const normalizedRequestedId =
      normalizeResult(webFirmId);

    const normalizedRequestedName =
      normalizeResult(firmName);

    const matchedCompany =
      (companies || []).find(
        (company: any) => {
          const id =
            String(
              company?.id || ""
            ).trim();

          const name =
            String(
              company?.name || ""
            ).trim();

          return (
            (
              normalizedRequestedId &&
              normalizeResult(id) ===
                normalizedRequestedId
            ) ||
            (
              normalizedRequestedName &&
              normalizeResult(name) ===
                normalizedRequestedName
            )
          );
        }
      ) || null;

    if (!matchedCompany) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Firma eşleşmedi. web_firm_id=${webFirmId || "-"}, firm_name=${firmName || "-"}`,
        },
        { status: 404 }
      );
    }

    const companyId =
      String(
        matchedCompany.id
      ).trim();

    const companyName =
      String(
        matchedCompany.name || firmName
      ).trim();

    // ==========================================================
    // 1) EĞİTİM
    // Web dashboard ile aynı kaynak:
    // users.company_id -> training_assignments
    // ==========================================================

    const {
      data: firmUsers,
      error: usersError,
    } = await supabase
      .from("users")
      .select("id")
      .eq("company_id", companyId);

    if (usersError) {
      throw new Error(
        `Firma kullanıcıları alınamadı: ${usersError.message}`
      );
    }

    const userIds =
      (firmUsers || [])
        .map((row: any) =>
          String(row.id || "").trim()
        )
        .filter(Boolean);

    let assignmentRows:
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
          "id, user_id, training_id, status, watch_completed, final_exam_passed"
        )
        .in("user_id", userIds);

      if (error) {
        throw new Error(
          `Eğitim atamaları alınamadı: ${error.message}`
        );
      }

      assignmentRows =
        (data || []) as AssignmentRow[];
    }

    const trainingIds =
      Array.from(
        new Set(
          assignmentRows
            .map(
              (row) =>
                row.training_id
            )
            .filter(Boolean)
        )
      );

    const trainingMap:
      Record<
        string,
        TrainingRow
      > = {};

    if (
      trainingIds.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from("trainings")
        .select("id, type")
        .in("id", trainingIds);

      if (error) {
        throw new Error(
          `Eğitim detayları alınamadı: ${error.message}`
        );
      }

      for (
        const item of data || []
      ) {
        trainingMap[
          String(item.id)
        ] = {
          id: String(item.id),
          type:
            item.type ?? null,
        };
      }
    }

    const trainingAssigned =
      assignmentRows.length;

    const trainingCompleted =
      assignmentRows.filter(
        (row) =>
          isTrainingCompleted(
            row,
            trainingMap[
              row.training_id
            ]
          )
      ).length;

    const trainingInProgress =
      assignmentRows.filter(
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
    // 2) RİSK
    // Web dashboard ile aynı tablolar ve eşikler
    // ==========================================================

    const riskSummary =
      emptyRiskSummary();

    /*
     * Risk verisi kesinlikle seçili firma ile sınırlıdır.
     * Tüm firmalara fallback YOK.
     */
    const matrixResult =
      await supabase
        .from("risk_items")
        .select("score")
        .eq("is_deleted", false)
        .eq("company_id", companyId);

    const fineKinneyResult =
      await supabase
        .from("fine_kinney_risks")
        .select("score")
        .eq("is_deleted", false)
        .eq("company_id", companyId);

    if (matrixResult.error) {
      throw new Error(
        `5x5 risk kayıtları alınamadı: ${matrixResult.error.message}`
      );
    }

    if (fineKinneyResult.error) {
      throw new Error(
        `Fine-Kinney risk kayıtları alınamadı: ${fineKinneyResult.error.message}`
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
        fineKinneyResult.data ||
        []
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
    // 3) DENETİM + DÖF
    // ==========================================================

    /*
     * DENETİM FİLTRESİ:
     * Web'deki /api/admin/inspection-dashboard ile aynı mantık.
     * run.firm_id hem company.id hem de firma adı üzerinden eşleştirilir.
     */
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

    const companyNameById =
      new Map<string, string>();

    for (
      const company of companies || []
    ) {
      const id =
        String(
          (company as any)?.id || ""
        ).trim();

      const name =
        String(
          (company as any)?.name || ""
        ).trim();

      if (id) {
        companyNameById.set(
          id,
          name
        );
      }
    }

    const companyIdKey =
      normalizeResult(companyId);

    const companyNameKey =
      normalizeResult(companyName);

    const filteredRuns =
      (allRuns || []).filter(
        (run: any) => {
          const runFirmId =
            String(
              run?.firm_id || ""
            ).trim();

          const runFirmName =
            String(
              companyNameById.get(
                runFirmId
              ) ||
                run?.firm_name ||
                run?.firma_adi ||
                ""
            ).trim();

          return (
            normalizeResult(
              runFirmId
            ) === companyIdKey ||
            normalizeResult(
              runFirmName
            ) === companyNameKey
          );
        }
      );

    const runIds =
      filteredRuns
        .map((row: any) =>
          String(
            row?.id || ""
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
          "result, dof_status"
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

      answers = data || [];
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
      openDof + closedDof;

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
    // 4) İŞ GÜVENLİĞİ SKORU
    // Web page ile birebir ağırlık:
    // Risk %35 + Denetim %30 + Eğitim %20 + DÖF %15
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
        webFirmId: companyId,
        company: {
          id: companyId,
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
            filteredRuns.length,
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