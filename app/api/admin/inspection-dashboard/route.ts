import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function normalize(value?: string | null) {
  return String(value || "").trim().toUpperCase();
}

function resultRequiresDof(result?: string | null) {
  const r = normalize(result);

  if (!r) return false;

  if (
    r === "UYGUNSUZ" ||
    r === "KISMEN" ||
    r.includes("UYGUNSUZ") ||
    r.includes("KISMEN") ||
    r.includes("YETERSIZ") ||
    r.includes("YETERSİZ") ||
    r.includes("EKSIK") ||
    r.includes("EKSİK")
  ) {
    return true;
  }

  if (r.startsWith("SCORE:")) {
    const score = Number(r.replace("SCORE:", ""));
    return Number.isFinite(score) && score < 100;
  }

  if (r.startsWith("ELMERI:")) {
    const parts = r.split(":");
    const wrong = Number(parts[2] || 0);
    return Number.isFinite(wrong) && wrong > 0;
  }

  return false;
}

function dofStatus(answer: any) {
  const status = normalize(answer.dof_status);

  if (status === "CLOSED") return "CLOSED";

  if (
    status === "OPEN" ||
    status === "IN_PROGRESS"
  ) {
    return "OPEN";
  }

  return resultRequiresDof(answer.result)
    ? "OPEN"
    : "NONE";
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data: runs, error: runError } = await supabase
      .from("denetim_runs")
      .select("*");

    if (runError) {
      return NextResponse.json(
        { error: runError.message },
        { status: 500 }
      );
    }

    const runIds = (runs || []).map((x: any) => x.id);

    const { data: answers, error: answerError } =
      runIds.length > 0
        ? await supabase
            .from("denetim_answers")
            .select("*")
            .in("run_remote_id", runIds)
        : { data: [], error: null };

    if (answerError) {
      return NextResponse.json(
        { error: answerError.message },
        { status: 500 }
      );
    }

    const list = answers || [];

    const suitable = list.filter(
      (x: any) => normalize(x.result) === "UYGUN"
    ).length;

    const partial = list.filter(
      (x: any) => normalize(x.result) === "KISMEN"
    ).length;

    const unsuitable = list.filter(
      (x: any) => normalize(x.result) === "UYGUNSUZ"
    ).length;

    const openDof = list.filter(
      (x: any) => dofStatus(x) === "OPEN"
    ).length;

    const closedDof = list.filter(
      (x: any) => dofStatus(x) === "CLOSED"
    ).length;

    const totalDof = openDof + closedDof;

    const dofClosureRate =
      totalDof === 0
        ? 0
        : Math.round((closedDof / totalDof) * 100);

    return NextResponse.json({
      success: true,

      summary: {
        totalInspections: runs?.length || 0,
        totalAnswers: list.length,

        suitable,
        partial,
        unsuitable,

        openDof,
        closedDof,
        dofClosureRate,
      },

      upcoming_inspections: [],

      activities: [],
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        error: e.message || "Dashboard oluşturulamadı.",
      },
      {
        status: 500,
      }
    );
  }
}