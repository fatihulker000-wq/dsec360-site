import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function checkAdmin() {
  const cookieStore = await cookies();
  const adminAuth =
    cookieStore.get("dsec_admin_auth")?.value;
  const adminRole =
    cookieStore.get("dsec_admin_role")?.value;

  return (
    adminAuth === "ok" &&
    (adminRole === "admin" ||
      adminRole === "super_admin")
  );
}

type QueryResult = {
  rows: any[];
  source?: string;
  warning?: string;
};

async function firstAvailableQuery(
  source: string,
  queries: Array<() => PromiseLike<{
    data: any[] | null;
    error: any;
  }>>
): Promise<QueryResult> {
  for (const run of queries) {
    try {
      const { data, error } = await run();

      if (!error) {
        return {
          rows: Array.isArray(data) ? data : [],
          source,
        };
      }
    } catch {
      // Sonraki aday sorguya geç.
    }
  }

  return {
    rows: [],
    source,
    warning: `${source} verisi alınamadı.`,
  };
}

function normalizeStatus(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function performanceStatus(score: number) {
  if (score >= 90) return "GOOD";
  if (score >= 75) return "DEVELOP";
  if (score >= 60) return "HIGH";
  return "CRITICAL";
}

function ratio(
  completed: number,
  total: number
) {
  if (total <= 0) return 0;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round((completed / total) * 100)
    )
  );
}

export async function GET(
  request: NextRequest
) {
  try {
    const allowed = await checkAdmin();

    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Yetkisiz erişim." },
        { status: 401 }
      );
    }

    const companyId =
      request.nextUrl.searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          error: "companyId zorunludur.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const employeeResult =
      await firstAvailableQuery("Çalışan", [
        () =>
          supabase
            .from("employees")
            .select("id, active")
            .eq("firm_id", companyId),
      ]);

    const employeeIds =
      employeeResult.rows
        .filter((row) => row.active !== false)
        .map((row) => String(row.id));

    const [
      trainingResult,
      auditResult,
      healthResult,
      accidentResult,
      dofResult,
      documentResult,
      emergencyResult,
    ] = await Promise.all([
      employeeIds.length
        ? firstAvailableQuery("Eğitim", [
            () =>
              supabase
                .from("training_assignments")
                .select("employee_id, status")
                .in("employee_id", employeeIds),
          ])
        : Promise.resolve({
  rows: [],
  warning: undefined,
  source: ""
}),

      firstAvailableQuery("Denetim", [
        () =>
          supabase
            .from("denetim_runs")
            .select("status, firm_id")
            .eq("firm_id", companyId),
        () =>
          supabase
            .from("inspection_runs")
            .select("status, firm_id")
            .eq("firm_id", companyId),
      ]),

      employeeIds.length
        ? firstAvailableQuery("Sağlık", [
            () =>
              supabase
                .from("health_records")
                .select(
                  "employee_id, status, exam_date_millis, next_due_millis"
                )
                .in("employee_id", employeeIds),
            () =>
              supabase
                .from("health_examinations")
                .select(
                  "employee_id, status, exam_date, next_exam_date"
                )
                .in("employee_id", employeeIds),
          ])
        : Promise.resolve({
  rows: [],
  warning: undefined,
  source: ""
}),

      firstAvailableQuery("Kaza/Olay", [
        () =>
          supabase
            .from("accident_records")
            .select("id, is_deleted, is_active")
            .eq("firm_id", companyId)
            .eq("is_deleted", false),
      ]),

      firstAvailableQuery("DÖF", [
        () =>
          supabase
            .from("inspection_dof")
            .select("status, firm_id")
            .eq("firm_id", companyId),
        () =>
          supabase
            .from("corrective_actions")
            .select("status, company_id")
            .eq("company_id", companyId),
      ]),

      firstAvailableQuery("Dokümantasyon", [
        () =>
          supabase
            .from("documents")
            .select("status, firm_id")
            .eq("firm_id", companyId),
      ]),

      firstAvailableQuery("Acil Durum", [
        () =>
          supabase
            .from("emergency_plans")
            .select("status, firm_id")
            .eq("firm_id", companyId),
      ]),
    ]);

    const completedTraining =
      trainingResult.rows.filter((row) =>
        [
          "COMPLETED",
          "TAMAMLANDI",
        ].includes(normalizeStatus(row.status))
      ).length;

    const completedAudit =
      auditResult.rows.filter((row) =>
        [
          "COMPLETED",
          "CLOSED",
          "TAMAMLANDI",
          "KAPANDI",
        ].includes(normalizeStatus(row.status))
      ).length;

    const completedHealth =
      healthResult.rows.filter((row) =>
        Boolean(
          row.exam_date_millis ||
            row.exam_date ||
            [
              "VALID",
              "ACTIVE",
              "COMPLETED",
            ].includes(
              normalizeStatus(row.status)
            )
        )
      ).length;

    const closedDof =
      dofResult.rows.filter((row) =>
        [
          "COMPLETED",
          "CLOSED",
          "TAMAMLANDI",
          "KAPANDI",
        ].includes(normalizeStatus(row.status))
      ).length;

    const validDocuments =
      documentResult.rows.filter((row) =>
        [
          "ACTIVE",
          "VALID",
          "COMPLETED",
          "AKTİF",
          "GEÇERLİ",
        ].includes(normalizeStatus(row.status))
      ).length;

    const validEmergency =
      emergencyResult.rows.filter((row) =>
        [
          "ACTIVE",
          "VALID",
          "COMPLETED",
          "AKTİF",
          "TAMAMLANDI",
        ].includes(normalizeStatus(row.status))
      ).length;

    const trainingScore =
      ratio(
        completedTraining,
        trainingResult.rows.length
      );

    const auditScore =
      ratio(
        completedAudit,
        auditResult.rows.length
      );

    const healthScore =
      ratio(
        completedHealth,
        Math.max(
          employeeIds.length,
          healthResult.rows.length
        )
      );

    const accidentScore =
      accidentResult.rows.length === 0
        ? 100
        : Math.max(
            0,
            100 -
              accidentResult.rows.length * 20
          );

    const dofScore =
      ratio(
        closedDof,
        dofResult.rows.length
      );

    const documentScore =
      ratio(
        validDocuments,
        documentResult.rows.length
      );

    const emergencyScore =
      ratio(
        validEmergency,
        emergencyResult.rows.length
      );

    const modules = [
      {
        key: "training",
        title: "Eğitim Performansı",
        score: trainingScore,
        status: performanceStatus(trainingScore),
        total: trainingResult.rows.length,
        completed: completedTraining,
        missing:
          Math.max(
            trainingResult.rows.length -
              completedTraining,
            0
          ),
        detail:
          trainingResult.rows.length === 0
            ? `${employeeIds.length} çalışan için eğitim ataması bulunmuyor.`
            : `${completedTraining}/${trainingResult.rows.length} eğitim ataması tamamlandı.`,
      },
      {
        key: "audit",
        title: "Denetim Performansı",
        score: auditScore,
        status: performanceStatus(auditScore),
        total: auditResult.rows.length,
        completed: completedAudit,
        missing:
          Math.max(
            auditResult.rows.length -
              completedAudit,
            0
          ),
        detail:
          auditResult.rows.length === 0
            ? "Denetim kaydı bulunmuyor."
            : `${completedAudit}/${auditResult.rows.length} denetim tamamlandı.`,
      },
      {
        key: "health",
        title: "Sağlık Performansı",
        score: healthScore,
        status: performanceStatus(healthScore),
        total: Math.max(
          employeeIds.length,
          healthResult.rows.length
        ),
        completed: completedHealth,
        missing:
          Math.max(
            employeeIds.length -
              completedHealth,
            0
          ),
        detail:
          `${completedHealth}/${employeeIds.length} çalışan için sağlık kaydı mevcut.`,
      },
      {
        key: "accident",
        title: "İş Kazası Performansı",
        score: accidentScore,
        status: performanceStatus(accidentScore),
        total: accidentResult.rows.length,
        completed:
          accidentResult.rows.length === 0
            ? 1
            : 0,
        missing: accidentResult.rows.length,
        detail:
          accidentResult.rows.length === 0
            ? "Aktif iş kazası veya olay kaydı bulunmuyor."
            : `${accidentResult.rows.length} aktif kaza/olay kaydı bulunuyor.`,
      },
      {
        key: "dof",
        title: "DÖF Performansı",
        score: dofScore,
        status: performanceStatus(dofScore),
        total: dofResult.rows.length,
        completed: closedDof,
        missing:
          Math.max(
            dofResult.rows.length -
              closedDof,
            0
          ),
        detail:
          dofResult.rows.length === 0
            ? "DÖF kaydı bulunmuyor."
            : `${closedDof}/${dofResult.rows.length} DÖF kapatıldı.`,
      },
      {
        key: "documentation",
        title: "Dokümantasyon Performansı",
        score: documentScore,
        status: performanceStatus(documentScore),
        total: documentResult.rows.length,
        completed: validDocuments,
        missing:
          Math.max(
            documentResult.rows.length -
              validDocuments,
            0
          ),
        detail:
          documentResult.rows.length === 0
            ? "Doküman kaydı bulunmuyor."
            : `${validDocuments}/${documentResult.rows.length} doküman geçerli.`,
      },
      {
        key: "emergency",
        title: "Acil Durum Performansı",
        score: emergencyScore,
        status: performanceStatus(emergencyScore),
        total: emergencyResult.rows.length,
        completed: validEmergency,
        missing:
          Math.max(
            emergencyResult.rows.length -
              validEmergency,
            0
          ),
        detail:
          emergencyResult.rows.length === 0
            ? "Acil durum kaydı bulunmuyor."
            : `${validEmergency}/${emergencyResult.rows.length} kayıt geçerli.`,
      },
    ];

    const weights: Record<string, number> = {
      training: 25,
      audit: 20,
      health: 15,
      accident: 15,
      dof: 15,
      documentation: 5,
      emergency: 5,
    };

    const totalWeight =
      modules.reduce(
        (sum, module) =>
          sum + weights[module.key],
        0
      );

    const overallScore =
      Math.round(
        modules.reduce(
          (sum, module) =>
            sum +
            module.score *
              weights[module.key],
          0
        ) /
          Math.max(totalWeight, 1)
      );

    const warnings = [
      employeeResult.warning,
      trainingResult.warning,
      auditResult.warning,
      healthResult.warning,
      accidentResult.warning,
      dofResult.warning,
      documentResult.warning,
      emergencyResult.warning,
    ].filter(
      (item): item is string =>
        Boolean(item)
    );

    return NextResponse.json({
      success: true,
      companyId,
      employeeCount:
        employeeIds.length,
      overallScore,
      modules,
      warnings,
    });
  } catch (errorValue) {
    return NextResponse.json(
      {
        success: false,
        error:
          errorValue instanceof Error
            ? errorValue.message
            : "Firma performansı hesaplanamadı.",
      },
      { status: 500 }
    );
  }
}