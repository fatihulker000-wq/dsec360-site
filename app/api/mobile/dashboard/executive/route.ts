import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replace(/\s+/g, " ");
}

function isOnlineTraining(type: unknown) {
  const value = String(type ?? "").toLocaleLowerCase("tr-TR");

  return (
    value.includes("online") ||
    value.includes("asenkron") ||
    value.includes("senkron")
  );
}

function assignmentCompleted(
  assignment: any,
  trainingType: unknown
) {
  if (isOnlineTraining(trainingType)) {
    return (
      assignment.status === "completed" &&
      assignment.watch_completed === true &&
      assignment.final_exam_passed === true
    );
  }

  return assignment.status === "completed";
}

function resultRequiresDof(result: unknown) {
  const value = normalize(result);

  if (!value) return false;

  if (
    value === "UYGUNSUZ" ||
    value === "KISMEN" ||
    value.includes("UYGUNSUZ") ||
    value.includes("KISMEN") ||
    value.includes("YETERSIZ") ||
    value.includes("YETERSİZ") ||
    value.includes("EKSIK") ||
    value.includes("EKSİK")
  ) {
    return true;
  }

  if (value.startsWith("SCORE:")) {
    const score = Number(value.replace("SCORE:", ""));
    return Number.isFinite(score) && score < 100;
  }

  if (value.startsWith("ELMERI:")) {
    const parts = value.split(":");
    const wrong = Number(parts[2] || 0);
    return Number.isFinite(wrong) && wrong > 0;
  }

  return false;
}

function dofStatus(answer: any) {
  const status = normalize(answer?.dof_status);

  if (status === "CLOSED" || status === "KAPALI") {
    return "CLOSED";
  }

  if (
    status === "OPEN" ||
    status === "IN_PROGRESS" ||
    status === "AÇIK"
  ) {
    return "OPEN";
  }

  return resultRequiresDof(answer?.result)
    ? "OPEN"
    : "NONE";
}

function matrixRiskLevel(score: number) {
  if (score >= 20) return "VERY_HIGH";
  if (score >= 15) return "HIGH";
  if (score >= 8) return "MEDIUM";
  return "LOW";
}

function fineKinneyRiskLevel(score: number) {
  if (score >= 200) return "VERY_HIGH";
  if (score >= 70) return "HIGH";
  if (score >= 20) return "MEDIUM";
  return "LOW";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const webFirmId = String(
      searchParams.get("web_firm_id") ||
        searchParams.get("firm_id") ||
        ""
    ).trim();

    if (!webFirmId) {
      return NextResponse.json(
        {
          success: false,
          error: "web_firm_id zorunludur.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // --------------------------------------------------
    // EĞİTİM UYUMU
    // --------------------------------------------------
    const { data: users, error: usersError } =
      await supabase
        .from("users")
        .select("id")
        .eq("company_id", webFirmId);

    if (usersError) {
      throw new Error(
        `Kullanıcılar okunamadı: ${usersError.message}`
      );
    }

    const userIds = (users || [])
      .map((item: any) => String(item.id || "").trim())
      .filter(Boolean);

    let assignments: any[] = [];

    if (userIds.length > 0) {
      const { data, error } = await supabase
        .from("training_assignments")
        .select(
          "id,user_id,training_id,status,watch_completed,final_exam_passed"
        )
        .in("user_id", userIds);

      if (error) {
        throw new Error(
          `Eğitim atamaları okunamadı: ${error.message}`
        );
      }

      assignments = data || [];
    }

    const trainingIds = Array.from(
      new Set(
        assignments
          .map((item: any) =>
            String(item.training_id || "").trim()
          )
          .filter(Boolean)
      )
    );

    const trainingTypeMap = new Map<string, string>();

    if (trainingIds.length > 0) {
      const { data, error } = await supabase
        .from("trainings")
        .select("id,type")
        .in("id", trainingIds);

      if (error) {
        throw new Error(
          `Eğitim detayları okunamadı: ${error.message}`
        );
      }

      (data || []).forEach((item: any) => {
        trainingTypeMap.set(
          String(item.id),
          String(item.type || "")
        );
      });
    }

    const trainingAssigned = assignments.length;

    const trainingCompleted =
      assignments.filter((item: any) =>
        assignmentCompleted(
          item,
          trainingTypeMap.get(
            String(item.training_id || "")
          )
        )
      ).length;

    const trainingInProgress =
      assignments.filter(
        (item: any) =>
          item.status === "in_progress" &&
          !assignmentCompleted(
            item,
            trainingTypeMap.get(
              String(item.training_id || "")
            )
          )
      ).length;

    const trainingNotStarted = Math.max(
      0,
      trainingAssigned -
        trainingCompleted -
        trainingInProgress
    );

    const trainingCompliance =
      trainingAssigned > 0
        ? Math.round(
            (trainingCompleted / trainingAssigned) * 100
          )
        : null;

    // --------------------------------------------------
    // RİSK
    // --------------------------------------------------
    const [
      matrixRiskResult,
      fineRiskResult,
    ] = await Promise.all([
      supabase
        .from("risk_items")
        .select("score")
        .eq("company_id", webFirmId)
        .eq("is_deleted", false),

      supabase
        .from("fine_kinney_risks")
        .select("score")
        .eq("company_id", webFirmId)
        .eq("is_deleted", false),
    ]);

    if (matrixRiskResult.error) {
      throw new Error(
        `5x5 riskleri okunamadı: ${matrixRiskResult.error.message}`
      );
    }

    if (fineRiskResult.error) {
      throw new Error(
        `Fine-Kinney riskleri okunamadı: ${fineRiskResult.error.message}`
      );
    }

    let lowRisk = 0;
    let mediumRisk = 0;
    let highRisk = 0;
    let veryHighRisk = 0;

    for (const item of matrixRiskResult.data || []) {
      const level = matrixRiskLevel(
        Number((item as any).score || 0)
      );

      if (level === "VERY_HIGH") veryHighRisk += 1;
      else if (level === "HIGH") highRisk += 1;
      else if (level === "MEDIUM") mediumRisk += 1;
      else lowRisk += 1;
    }

    for (const item of fineRiskResult.data || []) {
      const level = fineKinneyRiskLevel(
        Number((item as any).score || 0)
      );

      if (level === "VERY_HIGH") veryHighRisk += 1;
      else if (level === "HIGH") highRisk += 1;
      else if (level === "MEDIUM") mediumRisk += 1;
      else lowRisk += 1;
    }

    const totalRisk =
      lowRisk +
      mediumRisk +
      highRisk +
      veryHighRisk;

    const riskSafetyScore =
      totalRisk > 0
        ? Math.round(
            Math.max(
              0,
              Math.min(
                100,
                100 -
                  ((lowRisk * 0.1 +
                    mediumRisk * 0.35 +
                    highRisk * 0.7 +
                    veryHighRisk * 1.0) /
                    totalRisk) *
                    100
              )
            )
          )
        : null;

    // --------------------------------------------------
    // DENETİM + UYGUNSUZLUK + DÖF
    // --------------------------------------------------
    const { data: runs, error: runError } =
      await supabase
        .from("denetim_runs")
        .select("id")
        .eq("firm_id", webFirmId);

    if (runError) {
      throw new Error(
        `Denetimler okunamadı: ${runError.message}`
      );
    }

    const runIds = (runs || [])
      .map((item: any) => String(item.id || "").trim())
      .filter(Boolean);

    let answers: any[] = [];

    if (runIds.length > 0) {
      const { data, error } = await supabase
        .from("denetim_answers")
        .select("result,dof_status")
        .in("run_remote_id", runIds);

      if (error) {
        throw new Error(
          `Denetim cevapları okunamadı: ${error.message}`
        );
      }

      answers = data || [];
    }

    const suitable = answers.filter(
      (item: any) =>
        normalize(item.result) === "UYGUN"
    ).length;

    const partial = answers.filter(
      (item: any) =>
        normalize(item.result) === "KISMEN"
    ).length;

    const unsuitable = answers.filter(
      (item: any) =>
        normalize(item.result) === "UYGUNSUZ"
    ).length;

    const openDof = answers.filter(
      (item: any) =>
        dofStatus(item) === "OPEN"
    ).length;

    const closedDof = answers.filter(
      (item: any) =>
        dofStatus(item) === "CLOSED"
    ).length;

    const totalAnswers = answers.length;

    const inspectionCompliance =
      totalAnswers > 0
        ? Math.round(
            Math.max(
              0,
              Math.min(
                100,
                ((suitable + partial * 0.5) /
                  totalAnswers) *
                  100
              )
            )
          )
        : null;

    const totalDof =
      openDof + closedDof;

    const dofClosureRate =
      totalDof > 0
        ? Math.round(
            (closedDof / totalDof) * 100
          )
        : totalAnswers > 0
        ? 100
        : null;

    // --------------------------------------------------
    // WEB İLE AYNI İŞ GÜVENLİĞİ SKORU
    // --------------------------------------------------
    const hseScore = Math.round(
      Math.max(
        0,
        Math.min(
          100,
          (riskSafetyScore ?? 0) * 0.35 +
            (inspectionCompliance ?? 0) * 0.30 +
            (trainingCompliance ?? 0) * 0.20 +
            (dofClosureRate ?? 0) * 0.15
        )
      )
    );

    const dataCoverage = Math.round(
      ((riskSafetyScore !== null ? 0.35 : 0) +
        (inspectionCompliance !== null ? 0.30 : 0) +
        (trainingCompliance !== null ? 0.20 : 0) +
        (dofClosureRate !== null ? 0.15 : 0)) *
        100
    );

    return NextResponse.json({
      success: true,
      webFirmId,
      summary: {
        hseScore,
        dataCoverage,

        trainingAssigned,
        trainingCompleted,
        trainingInProgress,
        trainingNotStarted,
        trainingCompliance,

        totalRisk,
        lowRisk,
        mediumRisk,
        highRisk,
        veryHighRisk,
        riskSafetyScore,

        inspectionCount: runIds.length,
        totalInspectionAnswers: totalAnswers,
        suitable,
        partial,
        unsuitable,
        inspectionCompliance,

        openDof,
        closedDof,
        dofClosureRate,
      },
    });
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
            : "Executive Dashboard verisi alınamadı.",
      },
      { status: 500 }
    );
  }
}