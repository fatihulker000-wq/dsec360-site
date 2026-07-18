import {
  createClient,
} from "@supabase/supabase-js";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

export const dynamic =
  "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env
      .SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function checkAdmin() {
  const cookieStore =
    await cookies();

  const adminAuth =
    cookieStore.get(
      "dsec_admin_auth"
    )?.value;

  const adminRole =
    cookieStore.get(
      "dsec_admin_role"
    )?.value;

  return (
    adminAuth === "ok" &&
    (
      adminRole === "admin" ||
      adminRole ===
        "super_admin"
    )
  );
}

type QueryResult = {
  rows: any[];
  source: string;
  warning?: string;
};

type PerformanceStatus =
  | "GOOD"
  | "DEVELOP"
  | "HIGH"
  | "CRITICAL";

type CompanyGrade =
  | "A+"
  | "A"
  | "B"
  | "C"
  | "D";

type RiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

async function firstAvailableQuery(
  source: string,
  queries: Array<
    () => PromiseLike<{
      data: any[] | null;
      error: any;
    }>
  >
): Promise<QueryResult> {
  for (const run of queries) {
    try {
      const {
        data,
        error,
      } = await run();

      if (!error) {
        return {
          rows:
            Array.isArray(data)
              ? data
              : [],
          source,
        };
      }
    } catch {
      // Sonraki aday sorgu denenir.
    }
  }

  return {
    rows: [],
    source,
    warning:
      `${source} verisi alınamadı.`,
  };
}

function emptyResult(
  source: string
): QueryResult {
  return {
    rows: [],
    source,
  };
}

function normalizeStatus(
  value: unknown
) {
  return String(value ?? "")
    .trim()
    .toLocaleUpperCase(
      "tr-TR"
    );
}

function isOneOf(
  value: unknown,
  statuses: string[]
) {
  return statuses.includes(
    normalizeStatus(value)
  );
}

function ratio(
  completed: number,
  total: number
) {
  if (total <= 0) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (
          completed /
          total
        ) * 100
      )
    )
  );
}

function performanceStatus(
  score: number
): PerformanceStatus {
  if (score >= 90) {
    return "GOOD";
  }

  if (score >= 75) {
    return "DEVELOP";
  }

  if (score >= 60) {
    return "HIGH";
  }

  return "CRITICAL";
}

function gradeFromScore(
  score: number,
  modules: Array<{
    key: string;
    score: number;
  }>
): CompanyGrade {
  const criticalModule =
    modules.some(
      (module) =>
        [
          "training",
          "health",
          "audit",
        ].includes(
          module.key
        ) &&
        module.score < 50
    );

  if (
    score >= 95 &&
    !criticalModule
  ) {
    return "A+";
  }

  if (
    score >= 88 &&
    !criticalModule
  ) {
    return "A";
  }

  if (score >= 75) {
    return "B";
  }

  if (score >= 60) {
    return "C";
  }

  return "D";
}

function riskLevelFromScore(
  score: number,
  criticalCount: number
): RiskLevel {
  if (
    criticalCount >= 3 ||
    score < 45
  ) {
    return "CRITICAL";
  }

  if (
    criticalCount >= 2 ||
    score < 60
  ) {
    return "HIGH";
  }

  if (
    criticalCount >= 1 ||
    score < 80
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

function buildDoraSummary(
  overallScore: number,
  grade: CompanyGrade,
  modules: Array<{
    key: string;
    title: string;
    score: number;
    missing: number;
  }>,
  employeeCount: number
) {
  const sorted =
    [...modules].sort(
      (first, second) =>
        first.score -
        second.score
    );

  const weakest =
    sorted[0];

  const strongest =
    [...sorted].reverse()[0];

  const critical =
    sorted.filter(
      (module) =>
        module.score < 60
    );

  const lines: string[] = [];

  lines.push(
    `Firma genel İSG performansı %${overallScore} ve kurumsal seviye ${grade} olarak hesaplandı.`
  );

  if (strongest) {
    lines.push(
      `En güçlü alan ${strongest.title} (%${strongest.score}).`
    );
  }

  if (weakest) {
    lines.push(
      `Öncelikli geliştirme alanı ${weakest.title} (%${weakest.score}).`
    );
  }

  if (
    employeeCount > 0 &&
    modules.find(
      (module) =>
        module.key === "training"
    )?.score === 0
  ) {
    lines.push(
      `${employeeCount} çalışan için tamamlanmış eğitim performansı bulunmuyor.`
    );
  }

  if (
    critical.length > 0
  ) {
    lines.push(
      `${critical.length} modül kritik seviyede ve yönetim aksiyonu gerektiriyor.`
    );
  } else {
    lines.push(
      "Kritik seviyede modül bulunmuyor."
    );
  }

  return lines;
}

export async function GET(
  request: NextRequest
) {
  try {
    const allowed =
      await checkAdmin();

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Yetkisiz erişim.",
        },
        {
          status: 401,
        }
      );
    }

    const companyId =
      request.nextUrl.searchParams.get(
        "companyId"
      );

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "companyId zorunludur.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabase();

    const employeeResult =
      await firstAvailableQuery(
        "Çalışan",
        [
          () =>
            supabase
              .from("employees")
              .select(
                "id, active"
              )
              .eq(
                "firm_id",
                companyId
              ),
        ]
      );

    const employeeIds =
      employeeResult.rows
        .filter(
          (row) =>
            row.active !== false
        )
        .map(
          (row) =>
            String(row.id)
        );

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
        ? firstAvailableQuery(
            "Eğitim",
            [
              () =>
                supabase
                  .from(
                    "training_assignments"
                  )
                  .select(
                    "employee_id, status, final_score, certificate_id"
                  )
                  .in(
                    "employee_id",
                    employeeIds
                  ),
            ]
          )
        : Promise.resolve(
            emptyResult(
              "Eğitim"
            )
          ),

      firstAvailableQuery(
        "Denetim",
        [
          () =>
            supabase
              .from(
                "denetim_runs"
              )
              .select(
                "status, firm_id"
              )
              .eq(
                "firm_id",
                companyId
              ),

          () =>
            supabase
              .from(
                "inspection_runs"
              )
              .select(
                "status, firm_id"
              )
              .eq(
                "firm_id",
                companyId
              ),
        ]
      ),

      employeeIds.length
        ? firstAvailableQuery(
            "Sağlık",
            [
              () =>
                supabase
                  .from(
                    "health_records"
                  )
                  .select(
                    "employee_id, status, exam_date_millis, next_due_millis"
                  )
                  .in(
                    "employee_id",
                    employeeIds
                  ),

              () =>
                supabase
                  .from(
                    "health_examinations"
                  )
                  .select(
                    "employee_id, status, exam_date, next_exam_date"
                  )
                  .in(
                    "employee_id",
                    employeeIds
                  ),
            ]
          )
        : Promise.resolve(
            emptyResult(
              "Sağlık"
            )
          ),

      firstAvailableQuery(
        "Kaza/Olay",
        [
          () =>
            supabase
              .from(
                "accident_records"
              )
              .select(
                "id, is_deleted, is_active, severity, lost_day_count, event_type"
              )
              .eq(
                "firm_id",
                companyId
              )
              .eq(
                "is_deleted",
                false
              ),
        ]
      ),

      firstAvailableQuery(
        "DÖF",
        [
          () =>
            supabase
              .from(
                "inspection_dof"
              )
              .select(
                "status, firm_id, due_date, priority"
              )
              .eq(
                "firm_id",
                companyId
              ),

          () =>
            supabase
              .from(
                "corrective_actions"
              )
              .select(
                "status, company_id, due_date, priority"
              )
              .eq(
                "company_id",
                companyId
              ),
        ]
      ),

      firstAvailableQuery(
        "Dokümantasyon",
        [
          () =>
            supabase
              .from(
                "documents"
              )
              .select(
                "status, firm_id, expiry_date"
              )
              .eq(
                "firm_id",
                companyId
              ),
        ]
      ),

      firstAvailableQuery(
        "Acil Durum",
        [
          () =>
            supabase
              .from(
                "emergency_plans"
              )
              .select(
                "status, firm_id, expiry_date"
              )
              .eq(
                "firm_id",
                companyId
              ),
        ]
      ),
    ]);

    const now =
      Date.now();

    const thirtyDays =
      30 *
      24 *
      60 *
      60 *
      1000;

    const completedTraining =
      trainingResult.rows.filter(
        (row) =>
          isOneOf(
            row.status,
            [
              "COMPLETED",
              "TAMAMLANDI",
              "BAŞARILI",
              "BASARILI",
            ]
          )
      ).length;

    const certificateCount =
      trainingResult.rows.filter(
        (row) =>
          Boolean(
            row.certificate_id
          )
      ).length;

    const completedAudit =
      auditResult.rows.filter(
        (row) =>
          isOneOf(
            row.status,
            [
              "COMPLETED",
              "CLOSED",
              "TAMAMLANDI",
              "KAPANDI",
            ]
          )
      ).length;

    const completedHealth =
      healthResult.rows.filter(
        (row) =>
          Boolean(
            row.exam_date_millis ||
              row.exam_date
          ) ||
          isOneOf(
            row.status,
            [
              "VALID",
              "ACTIVE",
              "COMPLETED",
              "GEÇERLİ",
              "GECERLI",
              "TAMAMLANDI",
            ]
          )
      ).length;

    const expiredHealth =
      healthResult.rows.filter(
        (row) => {
          const due =
            Number(
              row.next_due_millis ||
                0
            ) ||
            Date.parse(
              row.next_exam_date ||
                ""
            );

          return (
            Number.isFinite(due) &&
            due > 0 &&
            due < now
          );
        }
      ).length;

    const approachingHealth =
      healthResult.rows.filter(
        (row) => {
          const due =
            Number(
              row.next_due_millis ||
                0
            ) ||
            Date.parse(
              row.next_exam_date ||
                ""
            );

          return (
            Number.isFinite(due) &&
            due >= now &&
            due <=
              now +
                thirtyDays
          );
        }
      ).length;

    const closedDof =
      dofResult.rows.filter(
        (row) =>
          isOneOf(
            row.status,
            [
              "COMPLETED",
              "CLOSED",
              "TAMAMLANDI",
              "KAPANDI",
            ]
          )
      ).length;

    const overdueDof =
      dofResult.rows.filter(
        (row) => {
          const closed =
            isOneOf(
              row.status,
              [
                "COMPLETED",
                "CLOSED",
                "TAMAMLANDI",
                "KAPANDI",
              ]
            );

          const due =
            Date.parse(
              row.due_date ||
                ""
            );

          return (
            !closed &&
            Number.isFinite(due) &&
            due < now
          );
        }
      ).length;

    const validDocuments =
      documentResult.rows.filter(
        (row) =>
          isOneOf(
            row.status,
            [
              "ACTIVE",
              "VALID",
              "COMPLETED",
              "AKTİF",
              "GEÇERLİ",
              "GECERLI",
              "TAMAMLANDI",
            ]
          )
      ).length;

    const validEmergency =
      emergencyResult.rows.filter(
        (row) =>
          isOneOf(
            row.status,
            [
              "ACTIVE",
              "VALID",
              "COMPLETED",
              "AKTİF",
              "GEÇERLİ",
              "GECERLI",
              "TAMAMLANDI",
            ]
          )
      ).length;

    const activeAccidents =
      accidentResult.rows.filter(
        (row) =>
          row.is_active !== 0 &&
          row.is_active !== false
      );

    const lostDays =
      activeAccidents.reduce(
        (
          total,
          row
        ) =>
          total +
          Number(
            row.lost_day_count ||
              0
          ),
        0
      );

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

    const healthBase =
      Math.max(
        employeeIds.length,
        healthResult.rows.length
      );

    const rawHealthScore =
      ratio(
        completedHealth,
        healthBase
      );

    const healthScore =
      Math.max(
        0,
        rawHealthScore -
          expiredHealth * 10 -
          approachingHealth * 2
      );

    const accidentScore =
      activeAccidents.length === 0
        ? 100
        : Math.max(
            0,
            100 -
              activeAccidents.length *
                15 -
              lostDays * 2
          );

    const rawDofScore =
      ratio(
        closedDof,
        dofResult.rows.length
      );

    const dofScore =
      Math.max(
        0,
        rawDofScore -
          overdueDof * 8
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
        title:
          "Eğitim Performansı",
        score:
          trainingScore,
        status:
          performanceStatus(
            trainingScore
          ),
        total:
          trainingResult.rows
            .length,
        completed:
          completedTraining,
        missing:
          Math.max(
            trainingResult.rows
              .length -
              completedTraining,
            0
          ),
        detail:
          trainingResult.rows
            .length === 0
            ? `${employeeIds.length} çalışan için eğitim ataması bulunmuyor.`
            : `${completedTraining}/${trainingResult.rows.length} atama tamamlandı, ${certificateCount} sertifika oluştu.`,
        route:
          "/admin/trainings",
      },

      {
        key: "audit",
        title:
          "Denetim Performansı",
        score:
          auditScore,
        status:
          performanceStatus(
            auditScore
          ),
        total:
          auditResult.rows
            .length,
        completed:
          completedAudit,
        missing:
          Math.max(
            auditResult.rows
              .length -
              completedAudit,
            0
          ),
        detail:
          auditResult.rows
            .length === 0
            ? "Denetim kaydı bulunmuyor."
            : `${completedAudit}/${auditResult.rows.length} denetim tamamlandı.`,
        route:
          "/admin/inspections",
      },

      {
        key: "health",
        title:
          "Sağlık Performansı",
        score:
          healthScore,
        status:
          performanceStatus(
            healthScore
          ),
        total:
          healthBase,
        completed:
          completedHealth,
        missing:
          Math.max(
            healthBase -
              completedHealth,
            0
          ),
        detail:
          `${completedHealth}/${healthBase} güncel kayıt, ${expiredHealth} gecikmiş ve ${approachingHealth} yaklaşan muayene.`,
        route:
          "/admin/health",
      },

      {
        key: "accident",
        title:
          "İş Kazası Performansı",
        score:
          accidentScore,
        status:
          performanceStatus(
            accidentScore
          ),
        total:
          activeAccidents.length,
        completed:
          activeAccidents.length ===
          0
            ? 1
            : 0,
        missing:
          activeAccidents.length,
        detail:
          activeAccidents.length ===
          0
            ? "Aktif iş kazası veya olay kaydı bulunmuyor."
            : `${activeAccidents.length} aktif kaza/olay ve ${lostDays} kayıp gün bulunuyor.`,
        route:
          "/admin/accidents",
      },

      {
        key: "dof",
        title:
          "DÖF Performansı",
        score:
          dofScore,
        status:
          performanceStatus(
            dofScore
          ),
        total:
          dofResult.rows.length,
        completed:
          closedDof,
        missing:
          Math.max(
            dofResult.rows.length -
              closedDof,
            0
          ),
        detail:
          dofResult.rows.length ===
          0
            ? "DÖF kaydı bulunmuyor."
            : `${closedDof}/${dofResult.rows.length} DÖF kapatıldı, ${overdueDof} kayıt gecikmiş.`,
        route:
          "/admin/inspections?tab=dof",
      },

      {
        key:
          "documentation",
        title:
          "Dokümantasyon Performansı",
        score:
          documentScore,
        status:
          performanceStatus(
            documentScore
          ),
        total:
          documentResult.rows
            .length,
        completed:
          validDocuments,
        missing:
          Math.max(
            documentResult.rows
              .length -
              validDocuments,
            0
          ),
        detail:
          documentResult.rows
            .length === 0
            ? "Doküman kaydı bulunmuyor."
            : `${validDocuments}/${documentResult.rows.length} doküman geçerli.`,
        route:
          "/admin/documents",
      },

      {
        key: "emergency",
        title:
          "Acil Durum Performansı",
        score:
          emergencyScore,
        status:
          performanceStatus(
            emergencyScore
          ),
        total:
          emergencyResult.rows
            .length,
        completed:
          validEmergency,
        missing:
          Math.max(
            emergencyResult.rows
              .length -
              validEmergency,
            0
          ),
        detail:
          emergencyResult.rows
            .length === 0
            ? "Acil durum kaydı bulunmuyor."
            : `${validEmergency}/${emergencyResult.rows.length} kayıt geçerli.`,
        route:
          "/admin/emergency",
      },
    ];

    const weights:
      Record<string, number> = {
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
        (
          total,
          module
        ) =>
          total +
          weights[module.key],
        0
      );

    const overallScore =
      Math.round(
        modules.reduce(
          (
            total,
            module
          ) =>
            total +
            module.score *
              weights[
                module.key
              ],
          0
        ) /
          Math.max(
            totalWeight,
            1
          )
      );

    const grade =
      gradeFromScore(
        overallScore,
        modules
      );

    const criticalCount =
      modules.filter(
        (module) =>
          module.score < 60
      ).length;

    const riskLevel =
      riskLevelFromScore(
        overallScore,
        criticalCount
      );

    const alerts: Array<{
      level:
        | "INFO"
        | "WARNING"
        | "CRITICAL";
      title: string;
      description: string;
      route?: string;
    }> = [];

    if (
      trainingResult.rows
        .length === 0 &&
      employeeIds.length > 0
    ) {
      alerts.push({
        level:
          "CRITICAL",
        title:
          "Eğitim ataması bulunmuyor",
        description:
          `${employeeIds.length} aktif çalışan için eğitim planlaması yapılmalıdır.`,
        route:
          "/admin/trainings",
      });
    }

    if (expiredHealth > 0) {
      alerts.push({
        level:
          "CRITICAL",
        title:
          "Gecikmiş sağlık muayeneleri",
        description:
          `${expiredHealth} sağlık muayenesinin süresi geçmiştir.`,
        route:
          "/admin/health",
      });
    }

    if (overdueDof > 0) {
      alerts.push({
        level:
          "CRITICAL",
        title:
          "Süresi geçmiş DÖF",
        description:
          `${overdueDof} DÖF hedef süresini aşmıştır.`,
        route:
          "/admin/inspections?tab=dof",
      });
    }

    if (
      auditResult.rows.length ===
      0
    ) {
      alerts.push({
        level:
          "WARNING",
        title:
          "Denetim kaydı bulunmuyor",
        description:
          "Firma için saha denetimi planlanmalıdır.",
        route:
          "/admin/inspections",
      });
    }

    if (
      activeAccidents.length ===
      0
    ) {
      alerts.push({
        level: "INFO",
        title:
          "Aktif kaza kaydı yok",
        description:
          "İş kazası ve olay performansı olumlu seviyededir.",
        route:
          "/admin/accidents",
      });
    }

    const doraSummary =
      buildDoraSummary(
        overallScore,
        grade,
        modules,
        employeeIds.length
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
      (
        item
      ): item is string =>
        Boolean(item)
    );

    return NextResponse.json({
      success: true,
      companyId,
      employeeCount:
        employeeIds.length,
      overallScore,
      grade,
      riskLevel,
      criticalCount,
      generatedAt:
        new Date().toISOString(),
      modules,
      alerts,
      doraSummary,
      warnings,
    });
  } catch (
    errorValue
  ) {
    return NextResponse.json(
      {
        success: false,
        error:
          errorValue instanceof Error
            ? errorValue.message
            : "Firma performansı hesaplanamadı.",
      },
      {
        status: 500,
      }
    );
  }
}