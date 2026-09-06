import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type OptionalQueryResult = {
  data: any[];
  warning?: string;
};

async function safeSelect(
  query: PromiseLike<{
    data: any[] | null;
    error: any;
  }>,
  label: string
): Promise<OptionalQueryResult> {

  try {

    const { data, error } = await query;

    if (error) {
      console.warn(`${label} sorgu hatası`, error);

      return {
        data: [],
        warning: `${label} verisi alınamadı`,
      };
    }

    return {
      data: Array.isArray(data) ? data : [],
    };

  } catch (error) {

    console.warn(`${label} sorgu hatası`, error);

    return {
      data: [],
      warning: `${label} verisi alınamadı`,
    };

  }

}


async function firstAvailableSelect(
  label: string,
  queries: Array<
    () => PromiseLike<{
      data: any[] | null;
      error: any;
    }>
  >
): Promise<OptionalQueryResult> {
  const errors: string[] = [];

  for (const makeQuery of queries) {
    try {
      const { data, error } = await makeQuery();

      if (!error) {
        return {
          data: Array.isArray(data) ? data : [],
        };
      }

      errors.push(error.message || String(error));
    } catch (error: any) {
      errors.push(error?.message || String(error));
    }
  }

  console.warn(`${label} sorguları başarısız`, errors);

  return {
    data: [],
    warning: `${label} verisi alınamadı`,
  };
}

function normalizeDate(value: unknown) {
  if (!value) return undefined;

  const d = new Date(String(value));

  if (isNaN(d.getTime())) return undefined;

  return d.toISOString();
}

function mapGenericItems(rows: any[], source: string) {
  return rows.map((row, index) => ({
    id: String(row.id || `${source}-${index}`),

    title:
      row.title ||
      row.name ||
      row.training_name ||
      row.document_name ||
      row.description ||
      `${source} kaydı`,

    description:
      row.description ||
      row.notes ||
      row.result ||
      row.status_description ||
      undefined,

    status:
      row.status ||
      row.state ||
      row.result_status ||
      undefined,

    date:
      normalizeDate(
        row.date ||
          row.created_at ||
          row.updated_at ||
          row.training_date ||
          row.completed_at ||
          row.started_at ||
          row.examination_date ||
          row.exam_date ||
          row.assigned_at ||
          row.due_date
      ),

    meta:
      row.meta ||
      row.category ||
      row.type ||
      row.document_type ||
      row.risk_level ||
      undefined,

    source,
  }));
}

function countOpen(rows: any[]) {
  return rows.filter((row) => {
    const status = String(
      row.status ||
      row.state ||
      ""
    ).toUpperCase();

    return ![
      "COMPLETED",
      "DONE",
      "CLOSED",
      "TAMAMLANDI",
      "KAPANDI",
    ].includes(status);
  }).length;
}

function buildStatus(
  rows: any[]
):
  | "COMPLETE"
  | "MISSING"
  | "EXPIRING"
  | "UNKNOWN" {

  if (!rows.length) return "UNKNOWN";

  const hasMissing = rows.some((r) => {
    const s = String(
      r.status ||
      r.state ||
      ""
    ).toUpperCase();

    return [
      "MISSING",
      "EXPIRED",
      "OVERDUE",
      "EKSİK",
      "SÜRESİ_DOLDU",
    ].includes(s);
  });

  if (hasMissing) return "MISSING";

  const hasExpiring = rows.some((r) => {
    const s = String(
      r.status ||
      r.state ||
      ""
    ).toUpperCase();

    return [
      "EXPIRING",
      "DUE_SOON",
      "YAKLAŞIYOR",
    ].includes(s);
  });

  if (hasExpiring) return "EXPIRING";

  return "COMPLETE";
}


function normalizeHazardClass(
  value: unknown
) {
  return String(value ?? "")
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replace(/\s+/g, " ");
}

function getLegalTrainingRule(
  hazardClass: unknown
) {
  const normalized =
    normalizeHazardClass(hazardClass);

  if (
    normalized.includes("ÇOK TEHLİKELİ") ||
    normalized.includes("COK TEHLIKELI")
  ) {
    return {
      requiredMinutes: 16 * 60,
      validityYears: 1,
      label: "Çok Tehlikeli",
    };
  }

  if (
    normalized.includes("TEHLİKELİ") ||
    normalized.includes("TEHLIKELI")
  ) {
    return {
      requiredMinutes: 12 * 60,
      validityYears: 2,
      label: "Tehlikeli",
    };
  }

  if (
    normalized.includes("AZ TEHLİKELİ") ||
    normalized.includes("AZ TEHLIKELI")
  ) {
    return {
      requiredMinutes: 8 * 60,
      validityYears: 3,
      label: "Az Tehlikeli",
    };
  }

  return {
    requiredMinutes: 0,
    validityYears: 0,
    label: "",
  };
}

function isTrainingCompleted(
  row: any
) {
  const status = String(
    row?.status ?? ""
  )
    .trim()
    .toLocaleUpperCase("tr-TR");

  if (
    [
      "COMPLETED",
      "TAMAMLANDI",
      "BAŞARILI",
      "BASARILI",
      "PASSED",
    ].includes(status)
  ) {
    return true;
  }

  if (row?.completed_at) {
    return true;
  }

  return (
    row?.watch_completed === true &&
    row?.final_exam_passed === true
  );
}

function getTrainingCompletionDate(
  row: any
) {
  const raw =
    row?.completed_at ||
    row?.date ||
    row?.started_at ||
    row?.created_at ||
    null;

  if (!raw) return null;

  const date = new Date(raw);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function isTrainingLegallyValid(
  row: any,
  validityYears: number,
  now = new Date()
) {
  if (!isTrainingCompleted(row)) {
    return false;
  }

  if (validityYears <= 0) {
    return false;
  }

  const completedAt =
    getTrainingCompletionDate(row);

  /*
   * Yasal uygunlukta tarih bilinmiyorsa güvenli tarafta kal:
   * süre hesabına dahil etme.
   */
  if (!completedAt) {
    return false;
  }

  const validUntil =
    new Date(completedAt);

  validUntil.setFullYear(
    validUntil.getFullYear() +
      validityYears
  );

  return validUntil >= now;
}

function calculateLegalTrainingSummary(
  rows: any[],
  hazardClass: unknown
) {
  const rule =
    getLegalTrainingRule(hazardClass);

  if (rule.requiredMinutes <= 0) {
    return {
      status: "UNKNOWN" as const,
      completionRate: 0,
      completedMinutes: 0,
      requiredMinutes: 0,
      missingMinutes: 0,
      validityYears: 0,
      hazardClass:
        normalizeHazardClass(hazardClass),
      validTrainingCount: 0,
    };
  }

  const validRows =
    (rows || []).filter((row) =>
      isTrainingLegallyValid(
        row,
        rule.validityYears
      )
    );

  const completedMinutes =
    validRows.reduce(
      (sum, row) =>
        sum +
        Math.max(
          0,
          Number(
            row?.duration_minutes ?? 0
          ) || 0
        ),
      0
    );

  const completionRate =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          (completedMinutes /
            rule.requiredMinutes) *
            100
        )
      )
    );

  const missingMinutes =
    Math.max(
      0,
      rule.requiredMinutes -
        completedMinutes
    );

  return {
    status:
      completedMinutes >=
      rule.requiredMinutes
        ? ("COMPLETE" as const)
        : ("MISSING" as const),
    completionRate,
    completedMinutes,
    requiredMinutes:
      rule.requiredMinutes,
    missingMinutes,
    validityYears:
      rule.validityYears,
    hazardClass: rule.label,
    validTrainingCount:
      validRows.length,
  };
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Çalışan bulunamadı.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const {
      data: employee,
      error: employeeError,
    } = await supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (employeeError || !employee) {
      return NextResponse.json(
        {
          success: false,
          error: "Çalışan bulunamadı.",
        },
        { status: 404 }
      );
    }
        const firmId = String(employee.firm_id || "").trim();

    const {
      data: employeeCompany,
      error: employeeCompanyError,
    } = await supabase
      .from("companies")
      .select("id,name,tehlike_sinifi")
      .eq("id", firmId)
      .maybeSingle();

    if (employeeCompanyError) {
      console.warn(
        "Çalışan firma tehlike sınıfı alınamadı:",
        employeeCompanyError
      );
    }

    // ============================================================
    // EĞİTİM — gerçek Web eğitim omurgası:
    // employees.id -> users.employee_id -> training_assignments.user_id -> trainings
    // ============================================================
    const trainingUserResult = await safeSelect(
      supabase
        .from("users")
        .select("id,employee_id,company_id,full_name,email,is_active")
        .eq("employee_id", id),
      "Eğitim kullanıcısı"
    );

    const trainingUserIds = trainingUserResult.data
      .filter((row) => String(row.employee_id || "") === id)
      .map((row) => String(row.id || "").trim())
      .filter(Boolean);

    let trainingResult: OptionalQueryResult = {
      data: [],
      warning: trainingUserResult.warning,
    };

    if (trainingUserIds.length > 0) {
      const assignmentResult = await safeSelect(
        supabase
          .from("training_assignments")
          .select(
            "id,user_id,training_id,status,watch_completed,final_exam_passed,started_at,completed_at,final_exam_score,created_at"
          )
          .in("user_id", trainingUserIds),
        "Eğitim atamaları"
      );

      const trainingIds = Array.from(
        new Set(
          assignmentResult.data
            .map((row) => String(row.training_id || "").trim())
            .filter(Boolean)
        )
      );

      let trainingDefinitions: any[] = [];
      let trainingDefinitionWarning: string | undefined;

      if (trainingIds.length > 0) {
        const definitionResult = await safeSelect(
          supabase
            .from("trainings")
            .select(
              "id,title,type,description,duration_minutes,created_at"
            )
            .in("id", trainingIds),
          "Eğitim detayları"
        );

        trainingDefinitions = definitionResult.data;
        trainingDefinitionWarning = definitionResult.warning;
      }

      const trainingMap = new Map(
        trainingDefinitions.map((row) => [
          String(row.id),
          row,
        ])
      );

      trainingResult = {
        data: assignmentResult.data.map((assignment) => {
          const training = trainingMap.get(
            String(assignment.training_id)
          );

          return {
            ...assignment,
            title: training?.title || "Eğitim",
            training_name: training?.title || "Eğitim",
            description: training?.description || undefined,
            type: training?.type || "EĞİTİM",
            duration_minutes:
              training?.duration_minutes ?? undefined,
            date:
              assignment.completed_at ||
              assignment.started_at ||
              assignment.created_at ||
              training?.created_at,
          };
        }),
        warning:
          assignmentResult.warning ||
          trainingDefinitionWarning ||
          trainingUserResult.warning,
      };
    }

    // ============================================================
    // SAĞLIK — güncel kaynak health_records.
    // Eski kurulum desteği için health_examinations fallback.
    // ============================================================
    const healthResult = await firstAvailableSelect(
      "Sağlık",
      [
        () =>
          supabase
            .from("health_records")
            .select("*")
            .eq("employee_id", id),
        () =>
          supabase
            .from("health_examinations")
            .select("*")
            .eq("employee_id", id),
      ]
    );

    // ============================================================
    // EVRAK — gerçek atama omurgası:
    // employee_document_assignments -> employee_documents
    // ============================================================
    const documentAssignmentResult = await safeSelect(
      supabase
        .from("employee_document_assignments")
        .select(
          "id,document_id,firm_id,employee_id,employee_full_name,employee_email,department,job_title,assigned_at,due_at,status,email_status,first_opened_at,last_opened_at,reading_completed_at,acknowledgement_at,is_cancelled"
        )
        .eq("employee_id", id)
        .eq("firm_id", firmId)
        .or("is_cancelled.is.null,is_cancelled.eq.false"),
      "Evrak atamaları"
    );

    const documentIds = Array.from(
      new Set(
        documentAssignmentResult.data
          .map((row) => String(row.document_id || "").trim())
          .filter(Boolean)
      )
    );

    let documentDefinitions: any[] = [];
    let documentDefinitionWarning: string | undefined;

    if (documentIds.length > 0) {
      const documentDefinitionResult = await safeSelect(
        supabase
          .from("employee_documents")
          .select(
            "id,title,document_type,description,file_name,mime_type,version_no,version_label,status,is_deleted"
          )
          .in("id", documentIds)
          .or("is_deleted.is.null,is_deleted.eq.false"),
        "Evrak detayları"
      );

      documentDefinitions = documentDefinitionResult.data;
      documentDefinitionWarning =
        documentDefinitionResult.warning;
    }

    const documentMap = new Map(
      documentDefinitions.map((row) => [
        String(row.id),
        row,
      ])
    );

    const documentResult: OptionalQueryResult = {
      data: documentAssignmentResult.data.map((assignment) => {
        const document = documentMap.get(
          String(assignment.document_id)
        );

        return {
          ...assignment,
          title: document?.title || "Çalışan Evrakı",
          document_name:
            document?.title || "Çalışan Evrakı",
          document_type:
            document?.document_type || "EVRAK",
          description:
            document?.description || undefined,
          meta:
            document?.document_type ||
            document?.version_label ||
            undefined,
          date:
            assignment.acknowledgement_at ||
            assignment.reading_completed_at ||
            assignment.assigned_at,
        };
      }),
      warning:
        documentAssignmentResult.warning ||
        documentDefinitionWarning,
    };

    // ============================================================
    // KKD / RİSK / DENETİM / KAZA / AJANDA / SGK / İBYS
    // ============================================================
    const [
      ppeResult,
      riskResult,
      auditResult,
      accidentResult,
      agendaResult,
      sgkResult,
      ibysResult,
    ] = await Promise.all([
      safeSelect(
        supabase
          .from("employee_ppe_assignments")
          .select("*")
          .eq("employee_id", id),
        "KKD"
      ),

      safeSelect(
        supabase
          .from("employee_risks")
          .select("*")
          .eq("employee_id", id),
        "Risk"
      ),

      safeSelect(
        supabase
          .from("employee_audits")
          .select("*")
          .eq("employee_id", id),
        "Denetim"
      ),

      safeSelect(
        supabase
          .from("accident_records")
          .select("*")
          .eq("web_employee_id", id)
          .eq("web_firm_id", firmId)
          .or("is_deleted.is.null,is_deleted.eq.false"),
        "İş Kazası"
      ),

      safeSelect(
        supabase
          .from("agenda_items")
          .select("*")
          .eq("employee_id", id),
        "Ajanda"
      ),

      safeSelect(
        supabase
          .from("employee_sgk_records")
          .select("*")
          .eq("employee_id", id),
        "SGK"
      ),

      safeSelect(
        supabase
          .from("employee_ibys_records")
          .select("*")
          .eq("employee_id", id),
        "İBYS"
      ),
    ]);

    const legalTrainingSummary =
      calculateLegalTrainingSummary(
        trainingResult.data,
        employeeCompany?.tehlike_sinifi
      );

    const warnings = [

      trainingResult.warning,

      healthResult.warning,

      ppeResult.warning,

      riskResult.warning,

      auditResult.warning,

      accidentResult.warning,

      documentResult.warning,

      agendaResult.warning,

      sgkResult.warning,

      ibysResult.warning,

    ].filter(Boolean) as string[];

    const activityItems = [

      {
        id: `employee-${employee.id}`,

        title: "Çalışan oluşturuldu",

        description:
          employee.full_name,

        date:
          employee.created_at ||
          new Date().toISOString(),

        category: "EMPLOYEE",
      },

      ...trainingResult.data.map((x, i) => ({

        id: `training-${x.id || i}`,

        title:
          x.title ||
          x.training_name ||
          "Eğitim",

        description:
          x.description ||
          x.status,

        date:
          normalizeDate(
            x.training_date ||
            x.created_at
          ) ||
          new Date().toISOString(),

        category: "TRAINING",

      })),

      ...healthResult.data.map((x, i) => ({

        id: `health-${x.id || i}`,

        title:
          x.title ||
          x.examination_type ||
          "Sağlık",

        description:
          x.result ||
          x.status,

        date:
          normalizeDate(
            x.examination_date ||
            x.created_at
          ) ||
          new Date().toISOString(),

        category: "HEALTH",

      })),

      ...accidentResult.data.map((x, i) => ({

        id: `accident-${x.id || i}`,

        title:
          x.title ||
          x.event_type ||
          "İş Kazası",

        description:
          x.description,

        date:
          normalizeDate(
            x.event_date ||
            x.created_at
          ) ||
          new Date().toISOString(),

        category: "ACCIDENT",

      })),

    ];
        return NextResponse.json({
      success: true,

      data: {
        employeeId: id,

        summary: {
          training_status:
            legalTrainingSummary.status,

          health_status:
            buildStatus(healthResult.data),

          ppe_status:
            buildStatus(ppeResult.data),

          document_status:
            buildStatus(documentResult.data),

          risk_status:
            riskResult.data.some(
              (row) =>
                Number(
                  row.score ||
                  row.risk_score ||
                  0
                ) >= 200 ||
                [
                  "HIGH",
                  "CRITICAL",
                  "YÜKSEK",
                  "YUKSEK",
                  "ÇOK YÜKSEK",
                  "COK YUKSEK",
                ].includes(
                  String(
                    row.risk_level ||
                    row.level ||
                    ""
                  ).toUpperCase()
                )
            )
              ? "HIGH"
              : riskResult.data.length
              ? "MEDIUM"
              : "UNKNOWN",

          training_completion_rate:
            legalTrainingSummary.completionRate,

          legal_training_completed_minutes:
            legalTrainingSummary.completedMinutes,

          legal_training_required_minutes:
            legalTrainingSummary.requiredMinutes,

          legal_training_missing_minutes:
            legalTrainingSummary.missingMinutes,

          legal_training_validity_years:
            legalTrainingSummary.validityYears,

          legal_training_hazard_class:
            legalTrainingSummary.hazardClass,

          legal_training_valid_count:
            legalTrainingSummary.validTrainingCount,

          ppe_completion_rate:
            ppeResult.data.length
              ? Math.round(
                  (
                    ppeResult.data.filter(
                      (row) =>
                        [
                          "COMPLETE",
                          "COMPLETED",
                          "ACTIVE",
                          "ASSIGNED",
                          "ZİMMETLENDİ",
                          "ZIMMETLENDI",
                        ].includes(
                          String(
                            row.status || ""
                          ).toUpperCase()
                        )
                    ).length /
                    ppeResult.data.length
                  ) * 100
                )
              : undefined,

          open_risk_count:
            countOpen(riskResult.data),

          open_action_count:
            countOpen(agendaResult.data),

          accident_count:
            accidentResult.data.length,

          upcoming_count:
            agendaResult.data.length,
        },

        trainingItems:
          mapGenericItems(
            trainingResult.data,
            "TRAINING"
          ),

        healthItems:
          mapGenericItems(
            healthResult.data,
            "HEALTH"
          ),

        ppeItems:
          mapGenericItems(
            ppeResult.data,
            "PPE"
          ),

        riskItems:
          mapGenericItems(
            riskResult.data,
            "RISK"
          ),

        auditItems:
          mapGenericItems(
            auditResult.data,
            "AUDIT"
          ),

        accidentItems:
          mapGenericItems(
            accidentResult.data,
            "ACCIDENT"
          ),

        documentItems:
          mapGenericItems(
            documentResult.data,
            "DOCUMENT"
          ),

        agendaItems:
          mapGenericItems(
            agendaResult.data,
            "AGENDA"
          ),

        sgkItems:
          mapGenericItems(
            sgkResult.data,
            "SGK"
          ),

        ibysItems:
          mapGenericItems(
            ibysResult.data,
            "IBYS"
          ),

        activityItems,

        loadedAt:
          new Date().toISOString(),

        warnings,
      },
    });
      } catch (error: any) {
    console.error(
      "Employee Profile Integration Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "Çalışan profil verileri yüklenemedi.",
      },
      {
        status: 500,
      }
    );
  }
}