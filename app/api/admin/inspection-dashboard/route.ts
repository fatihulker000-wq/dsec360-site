import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function normalize(value?: string | null) {
  return String(value || "")
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replace(/\s+/g, " ");
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

  return resultRequiresDof(answer.result)
    ? "OPEN"
    : "NONE";
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabase();

    const { searchParams } = new URL(request.url);

    const requestedFirm = String(
      searchParams.get("firm") || "all"
    ).trim();

    const requestedFirmKey = normalize(requestedFirm);

    const [
      { data: runs, error: runError },
      { data: companies, error: companyError },
    ] = await Promise.all([
      supabase
        .from("denetim_runs")
        .select("*")
        .order("inserted_at", {
          ascending: false,
        }),

      supabase
        .from("companies")
        .select("id,name"),
    ]);

    if (runError) {
      return NextResponse.json(
        {
          error: runError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (companyError) {
      return NextResponse.json(
        {
          error: companyError.message,
        },
        {
          status: 500,
        }
      );
    }

    const companyNameById = new Map<string, string>();

    (companies || []).forEach((company: any) => {
      companyNameById.set(
        String(company.id),
        String(company.name || "")
      );
    });
        const allRuns = runs || [];

    const filteredRuns =
      !requestedFirm ||
      requestedFirmKey === "ALL" ||
      requestedFirmKey === "TÜM FİRMALAR"
        ? allRuns
        : allRuns.filter((run: any) => {
            const firmId = String(run.firm_id || "").trim();

            const firmName = String(
              companyNameById.get(firmId) ||
                run.firm_name ||
                run.firma_adi ||
                ""
            ).trim();

            return (
              normalize(firmId) === requestedFirmKey ||
              normalize(firmName) === requestedFirmKey
            );
          });

    const runIds = filteredRuns.map((run: any) => run.id);

    const { data: answers, error: answerError } =
      runIds.length > 0
        ? await supabase
            .from("denetim_answers")
            .select("*")
            .in("run_remote_id", runIds)
        : {
            data: [],
            error: null,
          };

    if (answerError) {
      return NextResponse.json(
        {
          error: answerError.message,
        },
        {
          status: 500,
        }
      );
    }

    const list = answers || [];

    const suitable = list.filter(
      (item: any) =>
        normalize(item.result) === "UYGUN"
    ).length;

    const partial = list.filter(
      (item: any) =>
        normalize(item.result) === "KISMEN"
    ).length;

    const unsuitable = list.filter(
      (item: any) =>
        normalize(item.result) === "UYGUNSUZ"
    ).length;

    const openDof = list.filter(
      (item: any) =>
        dofStatus(item) === "OPEN"
    ).length;

    const closedDof = list.filter(
      (item: any) =>
        dofStatus(item) === "CLOSED"
    ).length;

    const totalDof = openDof + closedDof;

    const dofClosureRate =
      totalDof === 0
        ? 0
        : Math.round(
            (closedDof / totalDof) * 100
          );
              const totalInspections = filteredRuns.length;

    return NextResponse.json({
      success: true,

      selectedFirm: requestedFirm,

      summary: {
        // Dashboard V3 tarafından kullanılan alanlar
        total: totalInspections,
        total_count: totalInspections,
        completed: totalInspections,
        planned: 0,
        overdue: 0,

        // Mevcut denetim özet alanları
        totalInspections,
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
      } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Dashboard oluşturulamadı.",
      },
      {
        status: 500,
      }
    );
  }
}